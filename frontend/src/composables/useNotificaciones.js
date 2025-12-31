import { ref, onMounted, onUnmounted } from 'vue';
import api from '../api';
import socket from '../socket';
import { useToast } from '@/composables/useToast';
import { useI18n } from 'vue-i18n'; // Import i18n

export function useNotificaciones(rol) {
    const { t } = useI18n(); // Init i18n
    const notificaciones = ref([]);
    // The `ultimaVerificacion` ref was removed in the provided diff, but not explicitly.
    // Assuming it's intended to be removed as it's not used in the new logic.
    let intervalo = null;

    // Cargar notificaciones cerradas del localStorage
    const getNotificacionesCerradas = () => {
        const cerradas = localStorage.getItem(`notificaciones_cerradas_${rol}`);
        return cerradas ? JSON.parse(cerradas) : [];
    };

    // Guardar ID de notificación cerrada
    const marcarComoCerrada = (id) => {
        const cerradas = getNotificacionesCerradas();
        if (!cerradas.includes(id)) {
            cerradas.push(id);
            // Limitar historial para no llenar localStorage indefinidamente
            if (cerradas.length > 200) cerradas.shift();
            localStorage.setItem(`notificaciones_cerradas_${rol}`, JSON.stringify(cerradas));
        }
    };

    // Reproducir sonido
    const reproducirSonido = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // ✅ Fix: Intentar reanudar si está suspendido (política de autoplay)
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => { });
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (err) {
            console.warn('No se pudo reproducir sonido:', err);
        }
    };

    // Integración con Toasts
    const { addToast, success, info, warning } = useToast();

    // Mostrar notificación
    const mostrarNotificacion = (id, titulo, tipo = 'info') => {
        const cerradas = getNotificacionesCerradas();
        // Evitar duplicados recientes (persistencia local)
        if (cerradas.includes(id)) return;

        // Reproducir efectos in-app independentes del Toast
        reproducirSonido();
        try {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } catch (e) { }

        // Disparar Toast Visual
        // Mapear tipos legacy a tipos de toast
        if (tipo === 'listo' || tipo === 'success') {
            success(titulo);
        } else if (tipo === 'warning' || tipo === 'alerta') {
            warning(titulo);
        } else if (tipo === 'nuevo' || tipo === 'pago') {
            // Personalizamos el icono/color para 'nuevo' (azul/info) y 'pago' (verde/success)
            if (tipo === 'pago') success(titulo);
            else info(titulo);
        } else {
            info(titulo);
        }

        // Marcamos como "vista" en el historial local para no repetir el sonido/vibración 
        // para el MISMO evento si llega socket repetido, aunque el toast maneja su propia unicidad visual
        // Pero para lógica de negocio antigua, mejor prevenir spam.
        marcarComoCerrada(id);
    };

    // Cerrar notificación manualmente
    const cerrarNotificacion = (notifId) => {
        notificaciones.value = notificaciones.value.filter(n => n.id !== notifId);
        marcarComoCerrada(notifId);
    };

    // Verificar nuevas notificaciones (fallback si socket falla)
    const verificarNotificaciones = async () => {
        try {
            if (rol === 'cocinero') {
                const pedidosResponse = await api.getPedidosActivos();
                const pedidosNuevos = pedidosResponse.data.filter(p => p.estado === 'nuevo');

                if (pedidosNuevos.length > 0) {
                    pedidosNuevos.forEach(pedido => {
                        mostrarNotificacion(
                            `pedido-${pedido.id}-nuevo`,
                            t('notifications.new_order', { table: pedido.mesa_numero, count: pedido.items_count }),
                            'nuevo'
                        );
                    });
                }
            }
            else if (rol === 'mesero') {
                const pedidosResponse = await api.getPedidosActivos();
                const pedidosListos = pedidosResponse.data.filter(p => p.estado === 'listo');

                if (pedidosListos.length > 0) {
                    pedidosListos.forEach(pedido => {
                        mostrarNotificacion(
                            `pedido-${pedido.id}-listo`,
                            t('notifications.order_ready', { table: pedido.mesa_numero }),
                            'listo'
                        );
                    });
                }
            }
            else if (rol === 'facturero') {
                const pedidosResponse = await api.getPedidosActivos();
                const pedidosListosPagar = pedidosResponse.data.filter(p => p.estado === 'listo_pagar');

                if (pedidosListosPagar.length > 0) {
                    pedidosListosPagar.forEach(pedido => {
                        mostrarNotificacion(
                            `pedido-${pedido.id}-pago`,
                            t('notifications.ready_to_pay', { table: pedido.mesa_numero, total: '$' + pedido.total }),
                            'pago'
                        );
                    });
                }
            }
        } catch (err) {
            console.error('Error verificando notificaciones:', err);
        }
    };

    onMounted(() => {
        // ✅ REMOVIDO: Permission request ahora se hace en main.js solo para usuarios logueados
        // if ('Notification' in window && Notification.permission === 'default') {
        //     Notification.requestPermission();
        // }

        if (!socket.connected) socket.connect();

        if (rol === 'cocinero') {
            socket.on('nuevo_pedido', (pedido) => {
                mostrarNotificacion(
                    `pedido-${pedido.id}-nuevo`,
                    t('notifications.new_order', { table: pedido.mesa_numero, count: pedido.items_count }),
                    'nuevo'
                );
            });

            // ✅ NUEVO: Notificar al cocinero si editan un pedido (agregan items)
            // ✅ NUEVO: Notificar al cocinero si editan un pedido (agregan items)
            // Lógica: Si el evento trae 'mesa_numero', es una adición de items (POST /).
            // Si NO trae, es un cambio de estado interno (PUT start/complete) que debemos ignorar.
            socket.on('pedido_actualizado', (data) => {
                if (data.mesa_numero) {
                    mostrarNotificacion(
                        `pedido-${data.id}-update-${Date.now()}`,
                        t('notifications.order_updated', { table: data.mesa_numero }),
                        'info'
                    );
                }
            });

            // ✅ NUEVO: Soporte explícito para evento de edición
            socket.on('pedido_editado', (data) => {
                api.getPedido(data.id).then(res => {
                    const p = res.data;
                    mostrarNotificacion(
                        `pedido-${p.id}-edit-${Date.now()}`,
                        t('notifications.order_updated', { table: p.mesa_numero }),
                        'info'
                    );
                });
            });
        }
        else if (rol === 'mesero') {
            // Obtener usuario actual del localStorage (o store si prefieres)
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

            // ✅ AGREGAR ESTO: Listener para solicitud de cuenta
            socket.on('solicitar_cuenta', (data) => {
                // Verificar si la solicitud es para este mesero
                if (usuario.id && String(data.mesero_id) === String(usuario.id)) {
                    mostrarNotificacion(
                        `cuenta-${data.pedido_id}`, // ID único
                        t('notifications.account_requested', { table: data.mesa_numero }),
                        'info'
                    );
                }
            });

            // Notificación cuando un item está listo
            socket.on('item_ready', (data) => {
                console.log('🔔 Item listo recibido:', data);

                // ✅ FILTRO: Solo notificar si el usuario es el mesero asignado Y NO es item directo
                if (usuario.id && data.mesero_id === usuario.id && !data.es_directo) {
                    mostrarNotificacion(
                        `item_listo_${data.item_id}`,
                        t('notifications.item_ready', { item: data.item_nombre, table: data.mesa_numero }),
                        'success'
                    );
                }
            });

            socket.on('pedido_actualizado', ({ id, estado }) => {
                if (estado === 'listo') {
                    api.getPedido(id).then(res => {
                        const p = res.data;
                        mostrarNotificacion(
                            `pedido-${id}-listo`,
                            t('notifications.order_ready', { table: p.mesa_numero }),
                            'listo'
                        );
                    });
                }
            });
        }
        else if (rol === 'facturero') {
            socket.on('pedido_actualizado', ({ id, estado }) => {
                if (estado === 'listo_pagar') {
                    api.getPedido(id).then(res => {
                        const p = res.data;
                        mostrarNotificacion(
                            `pedido-${id}-pago`,
                            t('notifications.ready_to_pay', { table: p.mesa_numero, total: '$' + p.total }),
                            'pago'
                        );
                    });
                }
            });
        }

        // ✅ OPTIMIZED: Intervalo de respaldo cada 60s (antes 30s) - reduce bandwidth 50%
        intervalo = setInterval(verificarNotificaciones, 60000);

        console.log(`✅ Notificaciones activadas para: ${rol}`);
    });

    onUnmounted(() => {
        socket.off('nuevo_pedido');
        socket.off('pedido_actualizado');
        socket.off('item_completed'); // New listener to turn off
        socket.off('solicitar_cuenta'); // ✅ AGREGAR ESTO
        if (intervalo) clearInterval(intervalo);
    });

    return {
        notificaciones,
        verificarNotificaciones,
        mostrarNotificacion,
        cerrarNotificacion
    };
}
