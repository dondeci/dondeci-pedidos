<template>
  <div class="caja-panel">
    <div class="panel-header">
      <h2>💰 Panel de Caja</h2>
      <button @click="actualizarPedidos" class="btn btn-secondary" :disabled="loading">
        🔄 Actualizar
      </button>
    </div>

    <div class="panel-content">
      <div v-if="loading" class="loading">Cargando pedidos...</div>

      <template v-else>
        <!-- Notificaciones -->
        <div v-if="notificaciones.length > 0" class="notificaciones-container">
          <div v-for="notif in notificaciones" :key="notif.id" :class="['notificacion', `notif-${notif.tipo}`]">
            {{ notif.titulo }}
            <button @click="cerrarNotificacion(notif.id)" class="btn-cerrar-notif">✕</button>
          </div>
        </div>

        <!-- Pedidos Listos para Pagar -->
        <div class="section">
          <h3>📋 Pedidos Listos para Pagar</h3>
          <div v-if="pedidosListosPagar.length === 0" class="empty-state">
            Sin pedidos listos
          </div>
          <div v-else class="pedidos-grid">
            <div v-for="pedido in pedidosListosPagar" :key="pedido.id" :class="['pedido-card', `estado-${pedido.estado}`]">
              <div class="card-header">
                <span class="mesa">Mesa {{ pedido.mesa_numero }}</span>
                <span class="total">${{ pedido.total }}</span>
              </div>
              <div class="items-count">
                {{ pedido.items_count }} items
              </div>
              
              <div class="botones-pedido">
                <button
                  @click="pedirCuenta(pedido)"
                  class="btn btn-sm btn-secondary"
                  title="Imprimir cuenta para el cliente"
                >
                  🧾 Cuenta
                </button>
                <button
                  @click="seleccionarPedido(pedido)"
                  class="btn btn-sm btn-primary"
                  title="Registrar el pago"
                >
                  💳 Pagar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulario de Pago -->
        <div v-if="pedidoSeleccionado" class="section pago-section">
          <h3>💳 Registrar Pago</h3>
          
          <div class="pago-info">
            <div class="info-row">
              <span>Mesa:</span>
              <strong>{{ pedidoSeleccionado.mesa_numero }}</strong>
            </div>
            <div class="info-row">
              <span>Total del Pedido:</span>
              <strong>${{ Math.round(pedidoSeleccionado.total || 0).toLocaleString() }}</strong>
            </div>
            <div v-if="pedidoSeleccionado.total_pagado > 0" class="info-row">
              <span>Ya Pagado:</span>
              <strong class="text-success">${{ Math.round(pedidoSeleccionado.total_pagado || 0).toLocaleString() }}</strong>
            </div>
            <div class="info-row">
              <span>Pendiente a Pagar:</span>
              <strong class="monto-total">${{ Math.round(saldoPendiente || pedidoSeleccionado.total || 0).toLocaleString() }}</strong>
            </div>
          </div>

          <!-- ✅ NUEVO: Selección de Propina -->
          <!-- Solo permitir cambiar propina en el primer pago -->
          <div class="form-group propina-section" v-if="!pedidoSeleccionado.total_pagado || pedidoSeleccionado.total_pagado === 0">
            <label>Propina</label>
            <div class="propina-options">
              <label class="propina-option">
                <input type="radio" v-model="opcionPropina" value="sin_propina" />
                <span>Sin propina (Solo ${{ Math.round(pedidoSeleccionado.subtotal || pedidoSeleccionado.total || 0).toLocaleString() }})</span>
              </label>
              <label class="propina-option">
                <input type="radio" v-model="opcionPropina" value="sugerida" />
                <span>Propina sugerida (${{ Math.round(pedidoSeleccionado.propina_monto || 0).toLocaleString() }})</span>
              </label>
              <label class="propina-option">
                <input type="radio" v-model="opcionPropina" value="personalizada" />
                <span>Propina personalizada</span>
              </label>
            </div>
            <div v-if="opcionPropina === 'personalizada'" class="propina-input">
              <input
                v-model.number="propinaPersonalizada"
                type="number"
                placeholder="Ingrese monto de propina"
                min="0"
                step="100"
                class="monto-input"
              />
            </div>
            <div class="total-con-propina">
              <strong>Total a Pagar: ${{ Math.round(totalConPropina).toLocaleString() }}</strong>
            </div>
          </div>
          
          <!-- Mensaje informativo si ya hubo pago parcial -->
          <div v-else class="form-group">
            <div class="info-box">
              ℹ️ La propina ya fue establecida en el primer pago. Pendiente: ${{ Math.round(saldoPendiente || 0).toLocaleString() }}
            </div>
          </div>

          <div class="form-group">
            <label>Método de Pago</label>
            <div class="payment-methods">
              <button
                v-for="metodo in metodoPagos"
                :key="metodo"
                @click="metodoSeleccionado = metodo"
                :class="['metodo-btn', { 'metodo-active': metodoSeleccionado === metodo }]"
              >
                {{ obtenerEmojiMetodo(metodo) }} {{ metodo }}
              </button>
            </div>
          </div>

          <!-- ✅ MODIFICADO: Input de monto para TODOS los métodos -->
          <div v-if="metodoSeleccionado" class="form-group">
            <label>
              {{ metodoSeleccionado === 'efectivo' ? 'Monto Recibido' : 'Monto a Pagar' }}
            </label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input
                v-model.number="montoRecibido"
                type="number"
                :placeholder="metodoSeleccionado === 'efectivo' ? '0.00' : `Max: ${Math.round(saldoPendiente || pedidoSeleccionado.total || 0).toLocaleString()}`"
                min="0"
                :max="saldoPendiente || pedidoSeleccionado.total"
                step="100"
                class="monto-input"
                style="flex: 1;"
              />
              <button 
                @click="montoRecibido = Math.round(saldoPendiente || pedidoSeleccionado.total || 0)"
                class="btn btn-secondary btn-sm"
                type="button"
                style="white-space: nowrap;"
              >
                💰 Total
              </button>
            </div>
            <div v-if="metodoSeleccionado === 'efectivo' && montoRecibido && montoRecibido > (saldoPendiente || pedidoSeleccionado.total)" class="cambio">
              💵 Cambio: ${{ (montoRecibido - pedidoSeleccionado.total).toFixed(2) }}
            </div>
             <div v-if="montoRecibido && montoRecibido < pedidoSeleccionado.total" class="alerta">
              🔹 Pago parcial, quedará saldo pendiente.
            </div>

          </div>

          <div class="botones-pago">
           <button
            @click="procesarPago"
            class="btn btn-success btn-full"
            :disabled="!metodoSeleccionado || (metodoSeleccionado === 'efectivo' && (!montoRecibido || montoRecibido <= 0))"
          >

              ✅ Confirmar Pago
            </button>
            <button
              @click="cancelarPago"
              class="btn btn-secondary btn-full"
            >
              ❌ Cancelar
            </button>
          </div>
        </div>

        <!-- Historial de Pagos -->
        <div class="section">
          <h3>📝 Pagos Hoy</h3>
          <div v-if="pedidosPagadosHoy.length === 0" class="empty-state">
            Sin pagos registrados
          </div>
          <div v-else class="pagos-list">
            <div v-for="pedido in pedidosPagadosHoy" :key="pedido.id" class="pago-item">
              <div class="pago-info-item">
                <span class="mesa">Mesa {{ pedido.mesa_numero }}</span>
                <span class="monto">${{ pedido.total }}</span>
              </div>
              <div class="pago-detalles-extra">
                <span class="metodo-pago-badge" v-if="pedido.metodo_pago">
                  {{ obtenerEmojiMetodo(pedido.metodo_pago) }} {{ pedido.metodo_pago.toUpperCase() }}
                </span>
                <span class="timestamp">{{ formatearHora(pedido.created_at) }}</span>
                <button @click="verDetallesPago(pedido.id)" class="btn btn-sm btn-info">
                  👁️ Ver
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal de Detalles del Pago -->
    <div v-if="pagoDetalle" class="modal-overlay" @click.self="cerrarDetallePago">
      <div class="modal-detalle">
        <div class="modal-header">
          <h3>💳 Detalles del Pago</h3>
          <button @click="cerrarDetallePago" class="btn-cerrar">✕</button>
        </div>
        <div class="modal-body">
          <div class="detalle-info">
            <div class="info-row">
              <span>Mesa:</span>
              <strong>{{ pagoDetalle.mesa_numero }}</strong>
            </div>
            <div class="info-row" v-if="pagoDetalle.metodo_pago">
              <span>Método de Pago:</span>
              <strong>{{ obtenerEmojiMetodo(pagoDetalle.metodo_pago) }} {{ pagoDetalle.metodo_pago.toUpperCase() }}</strong>
            </div>
            <div class="info-row">
              <span>Hora:</span>
              <strong>{{ formatearHora(pagoDetalle.created_at) }}</strong>
            </div>
            <div class="info-row">
              <span>Cajero:</span>
              <strong>{{ usuarioStore.usuario.nombre }}</strong>
            </div>
          </div>

          <div class="detalle-items">
            <h4>Items del Pedido</h4>
            <div class="items-tabla">
              <div class="item-row header-row">
                <span>Cant.</span>
                <span>Descripción</span>
                <span>Precio</span>
                <span>Total</span>
              </div>
              <div v-for="(item, index) in itemsAgrupados" :key="index" class="item-row">
                <span>{{ item.cantidad }}</span>
                <span>{{ item.nombre }}</span>
                <span>${{ Number(item.precio_unitario).toFixed(2) }}</span>
                <span>${{ Number(item.total).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="detalle-total">
            <span>TOTAL:</span>
            <strong>${{ pagoDetalle.total }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue';
import { usePedidoStore } from '../stores/pedidoStore';
import { useUsuarioStore } from '../stores/usuarioStore';
import api from '../api';
import { useNotificaciones } from '../composables/useNotificaciones';

const { notificaciones, cerrarNotificacion } = useNotificaciones('facturero');

const pedidoStore = usePedidoStore();
const usuarioStore = useUsuarioStore();

const loading = ref(false);
const pedidoSeleccionado = ref(null);
const metodoSeleccionado = ref('');
const montoRecibido = ref(null);
const pedidosPagadosHoy = ref([]);
const ticketData = ref(null);
const pagoDetalle = ref(null);
// ✅ NUEVO: Variables para manejo de propinas
const opcionPropina = ref('sugerida'); // 'sin_propina' | 'personalizada' | 'sugerida'
const propinaPersonalizada = ref(null);

const metodoPagos = ['efectivo', 'tarjeta', 'nequi', 'otro_digital'];

const pedidosListosPagar = computed(() => {
  const listos = pedidoStore.pedidosPorEstado.listo_pagar || [];
  const enCaja = pedidoStore.pedidosPorEstado.en_caja || [];
  return [...listos, ...enCaja].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
});
const pedidosPagados = computed(() => pedidoStore.pedidosPorEstado.pagado);

// ✅ NUEVO: Calcular total dinámico con propina
const totalConPropina = computed(() => {
  if (!pedidoSeleccionado.value) return 0;
  
  const subtotal = parseFloat(pedidoSeleccionado.value.subtotal || pedidoSeleccionado.value.total || 0);
  const propinaSugerida = parseFloat(pedidoSeleccionado.value.propina_monto || 0);
  
  if (opcionPropina.value === 'sin_propina') {
    return subtotal;
  } else if (opcionPropina.value === 'personalizada') {
    return subtotal + (parseFloat(propinaPersonalizada.value) || 0);
  } else { // 'sugerida'
    return subtotal + propinaSugerida;
  }
});

// Agrupar items por nombre para mostrar cantidades consolidadas
const itemsAgrupados = computed(() => {
  if (!pagoDetalle.value || !pagoDetalle.value.items) return [];
  
  const grupos = {};
  
  pagoDetalle.value.items.forEach(item => {
    const key = `${item.menu_item_id || item.nombre}`;
    
    if (!grupos[key]) {
      grupos[key] = {
        nombre: item.nombre,
        precio_unitario: item.precio_unitario || item.precio || 0,
        cantidad: 0,
        total: 0
      };
    }
    
    grupos[key].cantidad += item.cantidad;
    grupos[key].total += (item.precio_unitario || item.precio || 0) * item.cantidad;
  });
  
  return Object.values(grupos);
});

const actualizarPedidos = async () => {
  loading.value = true;
  try {
    await pedidoStore.cargarPedidosActivos();
    // Cargar pedidos pagados del día por este cajero
    const pedidosHoyRes = await api.getPedidosHoy();
    
    pedidosPagadosHoy.value = pedidosHoyRes.data.filter(p => 
      p.estado === 'pagado' && 
      String(p.usuario_facturero_id) === String(usuarioStore.usuario.id)
    );
  } catch (err) {
    console.error('Error:', err);
  } finally {
    loading.value = false;
  }
};

const saldoPendiente = ref(null);

const seleccionarPedido = (pedido) => {
  pedidoSeleccionado.value = pedido;
  metodoSeleccionado.value = '';
  montoRecibido.value = null;
  // ✅ CORREGIDO: Usar pendiente del backend (que ya resta los pagos previos)
  saldoPendiente.value = pedido.pendiente !== undefined ? pedido.pendiente : pedido.total;
  // ✅ NUEVO: Resetear opciones de propina
  opcionPropina.value = 'sugerida';
  propinaPersonalizada.value = null;
};


const cancelarPago = () => {
  pedidoSeleccionado.value = null;
  metodoSeleccionado.value = '';
  montoRecibido.value = null;
};

const obtenerEmojiMetodo = (metodo) => {
  const emojis = {
    efectivo: '💵',
    tarjeta: '💳',
    nequi: '📱',
    otro_digital: '🌐'
  };
  return emojis[metodo] || '💰';
};

const formatearHora = (fecha) => {
  return new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ✅ FUNCIÓN CORREGIDA: Agrupa items para el ticket
const prepararTicket = (pedido, tipo, metodo = null, extras = {}) => {
  const itemsAgrupadosParaTicket = {};

  (pedido.items || []).forEach(item => {
    const key = item.menu_item_id || item.nombre;
    if (!itemsAgrupadosParaTicket[key]) {
      itemsAgrupadosParaTicket[key] = {
        nombre: item.nombre,
        precio: Number(item.precio_unitario || item.precio || 0),
        cantidad: 0
      };
    }
    itemsAgrupadosParaTicket[key].cantidad += (item.cantidad || 1);
  });

  const itemsFinales = Object.values(itemsAgrupadosParaTicket);

  // ✅ CORREGIDO: Si pedido no tiene subtotal (pedidos viejos), calcularlo desde los items
  let subtotal = pedido.subtotal;
  let propinaMonto = pedido.propina_monto || 0;
  
  if (!subtotal) {
    // Calcular subtotal sumando precio de todos los items
    subtotal = itemsFinales.reduce((sum, item) => {
      return sum + (item.cantidad * item.precio);
    }, 0);
    
    // Calcular propina como diferencia entre total y subtotal
    const total = parseFloat(pedido.total || 0);
    propinaMonto = total - subtotal;
  }

  ticketData.value = {
    tipo,
    mesa: pedido.mesa_numero,
    subtotal: subtotal,                                     // ✅ CORREGIDO
    propinaMonto: propinaMonto,                             // ✅ CORREGIDO
    totalPedido: pedido.total,                              // total real del pedido
    items: itemsFinales,
    cajero: usuarioStore.usuario.nombre,
    metodoPago: metodo,
    montoRecibido: extras.montoRecibido ?? null,
    montoAplicado: extras.montoAplicado ?? null,
    cambio: extras.cambio ?? null
  };
};



// ✅ FUNCIÓN CORREGIDA (Escapando etiquetas)
const imprimirContenido = (data) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('❌ Por favor permite ventanas emergentes para imprimir el ticket');
    return;
  }

  const contenidoHTML = `
    <html>
    <head>
      <title>Ticket - ${import.meta.env.VITE_APP_TITLE}</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 10px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h3 { margin: 0 0 5px 0; font-size: 16px; }
        .header p { margin: 2px 0; }
        .divider { border-top: 1px dashed black; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .col-cant { width: 10%; }
        .col-desc { width: 65%; }
        .col-total { width: 25%; text-align: right; }
        .total-section { font-size: 16px; font-weight: bold; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h3>${import.meta.env.VITE_APP_TITLE.toUpperCase()}</h3>
        <p>NIT: ${import.meta.env.VITE_APP_NIT}</p>
        <p>Fecha: ${new Date().toLocaleString()}</p>
        <p>Mesa: ${data.mesa}</p>
        <p>Cajero: ${data.cajero}</p>
        <div class="divider"></div>
        <p>${data.tipo === 'pago' ? 'COMPROBANTE DE PAGO' : 'CUENTA DE COBRO'}</p>
        ${data.metodoPago ? `<p>Método: ${data.metodoPago.toUpperCase()}</p>` : ''}
        <div class="divider"></div>
      </div>

      <div class="items">
        <div class="row" style="font-weight:bold; border-bottom:1px solid black;">
          <span class="col-cant">Cant</span>
          <span class="col-desc">Desc</span>
          <span class="col-total">Total</span>
        </div>
        ${data.items.map(item => `
          <div class="row">
            <span class="col-cant">${item.cantidad}</span>
            <span class="col-desc">${item.nombre}</span>
            <span class="col-total">$${(item.cantidad * item.precio).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div class="total-section">
        <div class="divider"></div>
        <div class="row">
          <span>Subtotal:</span>
          <span>$${Math.round(data.subtotal).toLocaleString()}</span>
        </div>
        <div class="row">
          <span>Propina (${data.propinaMonto > 0 ? Math.round((data.propinaMonto / data.subtotal) * 100) : 0}%):</span>
          <span>$${Math.round(data.propinaMonto).toLocaleString()}</span>
        </div>
        <div class="divider"></div>
        <div class="row" style="font-size: 18px;">
          <span>TOTAL:</span>
          <span>$${Math.round(data.totalPedido).toLocaleString()}</span>
        </div>
        ${data.montoRecibido != null ? `
          <div class="row">
            <span>Recibido:</span>
            <span>$${Math.round(data.montoRecibido).toLocaleString()}</span>
          </div>
        ` : ''}
        ${data.cambio != null ? `
          <div class="row">
            <span>Cambio:</span>
            <span>$${Math.round(data.cambio).toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="divider"></div>
      </div>


      <div class="footer">
        <p>¡Gracias por su visita!</p>
        <p>Propina voluntaria sugerida</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          // setTimeout(() => window.close(), 1000);
        }
      <\/script> 
    <\/body>
    <\/html>
  `;
  // ⬆️ FIJATE ARRIBA: He puesto la barra invertida \ antes de las barras /

  printWindow.document.write(contenidoHTML);
  printWindow.document.close();
};

const pedirCuenta = async (pedido) => {
  try {
    // 1. Preparar datos
    prepararTicket(pedido, 'cuenta');
    
    // 2. Imprimir usando ventana nueva (Funciona en móvil)
    imprimirContenido(ticketData.value);
    
    // 3. Actualizar estado
    await pedidoStore.actualizarEstadoPedido(pedido.id, 'en_caja');
    
  } catch (err) {
    console.error(err);
    alert('❌ Error al procesar cuenta');
  }
};

const procesarPago = async () => {
  if (!pedidoSeleccionado.value || !metodoSeleccionado.value) return;

  const totalPedido = Number(pedidoSeleccionado.value.total);
  const pendienteActual = saldoPendiente.value != null
    ? Number(saldoPendiente.value)
    : totalPedido;

  let montoRecibidoEstaVez = 0;
  let montoQueSeRegistra = 0;

  // ✅ MODIFICADO: Todos los métodos pueden hacer pagos parciales
  if (!montoRecibido.value || montoRecibido.value <= 0) {
    alert('Ingresa un monto válido');
    return;
  }
  
  montoRecibidoEstaVez = Number(montoRecibido.value);
  
  // Para efectivo, puede recibir más y dar cambio
  // Para otros métodos, solo registrar lo que se paga
  if (metodoSeleccionado.value === 'efectivo') {
    montoQueSeRegistra = Math.min(montoRecibidoEstaVez, pendienteActual);
  } else {
    // Validar que no exceda el pendiente
    if (montoRecibidoEstaVez > pendienteActual) {
      alert(`❌ El monto no puede exceder el pendiente: $${Math.round(pendienteActual).toLocaleString()}`);
      return;
    }
    montoQueSeRegistra = montoRecibidoEstaVez;
  }

  // ✅ ACTUALIZADO: Calcular propina final SOLO si es el primer pago
  // Si ya hubo pagos, no modificar la propina del pedido
  let propinaFinal = null;
  const esPrimerPago = !pedidoSeleccionado.value.total_pagado || pedidoSeleccionado.value.total_pagado === 0;
  
  if (esPrimerPago) {
    if (opcionPropina.value === 'sin_propina') {
      propinaFinal = 0;
    } else if (opcionPropina.value === 'personalizada') {
      propinaFinal = parseFloat(propinaPersonalizada.value) || 0;
    } else { // 'sugerida'
      propinaFinal = parseFloat(pedidoSeleccionado.value.propina_monto) || 0;
    }
  }
  // Si no es el primer pago, propinaFinal queda en null y el backend no modifica el total

  try {
    const res = await api.registrarPago(
      pedidoSeleccionado.value.id,
      usuarioStore.usuario.id,
      montoQueSeRegistra,
      metodoSeleccionado.value,
      propinaFinal // ✅ NUEVO: Enviar propina al backend
    );

    const { total_pagado, total_pedido, pendiente } = res.data;
    
    // ✅ CRÍTICO: Recargar datos del pedido desde el backend
    await actualizarPedidos();
    
    // Volver a seleccionar el pedido para tener datos frescos
    const pedidoActualizado = pedidosListosPagar.value.find(p => p.id === pedidoSeleccionado.value.id);
    
    console.log('🔍 Pedido actualizado desde backend:', pedidoActualizado); // DEBUG
    
    if (pedidoActualizado) {
      // Actualizar TODA la referencia del pedido
      pedidoSeleccionado.value = { ...pedidoActualizado };
      saldoPendiente.value = pedidoActualizado.pendiente || 0;
      
      console.log('✅ Pedido seleccionado actualizado:', {
        total: pedidoSeleccionado.value.total,
        total_pagado: pedidoSeleccionado.value.total_pagado,
        pendiente: pedidoSeleccionado.value.pendiente,
        saldoPendiente: saldoPendiente.value
      }); // DEBUG
    } else {
      console.warn('⚠️ No se encontró el pedido actualizado en la lista');
    }

    const cambio = metodoSeleccionado.value === 'efectivo'
      ? Math.max(montoRecibidoEstaVez - montoQueSeRegistra, 0)
      : 0;

    // Ticket usa datos ACTUALIZADOS del pedido
    prepararTicket(
      pedidoSeleccionado.value,
      'pago',
      metodoSeleccionado.value,
      {
        montoRecibido: montoRecibidoEstaVez,
        montoAplicado: montoQueSeRegistra,
        cambio
      }
    );

    alert(
      `✅ Pago registrado.\n` +
      `Pagado ahora: $${Math.round(montoQueSeRegistra).toLocaleString()}\n` +
      `Total pagado: $${Math.round(total_pagado).toLocaleString()}\n` +
      `Pendiente: $${Math.round(pendiente).toLocaleString()}`
    );

    imprimirContenido(ticketData.value);

    if (pendiente <= 0) {
      cancelarPago();
      await actualizarPedidos();
    } else {
      // aún falta saldo - resetear form pero mantener pedido seleccionado
      metodoSeleccionado.value = '';
      montoRecibido.value = null;
    }
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.error || 'Error al registrar pago';
    alert('❌ ' + msg);
    await actualizarPedidos();
  }
};


const verDetallesPago = async (pedidoId) => {
  try {
    const response = await api.getPedido(pedidoId);
    pagoDetalle.value = response.data;
  } catch (err) {
    console.error('Error cargando detalles:', err);
    alert('❌ Error al cargar detalles del pago');
  }
};

const cerrarDetallePago = () => {
  pagoDetalle.value = null;
};

onMounted(() => {
  actualizarPedidos();
});
</script>
<style src="../assets/styles/CajaPanel.css" scoped></style>
