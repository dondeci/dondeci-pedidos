import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' // Importa el router
import './style.css'

// ✅ Aplicar colores del theme desde variables de entorno
const themeColor = import.meta.env.VITE_THEME_COLOR || '#667eea';
const backgroundColor = import.meta.env.VITE_BACKGROUND_COLOR || '#764ba2';

// Aplicar INMEDIATAMENTE antes de montar la app
document.documentElement.style.setProperty('--theme-color', themeColor);
document.documentElement.style.setProperty('--background-color', backgroundColor);

console.log('🎨 Theme colors applied:', { themeColor, backgroundColor });

const app = createApp(App)

app.use(createPinia())
app.use(router)  // Usa el router
app.mount('#app')

// Service Worker eliminado para evitar caché
// if ('serviceWorker' in navigator) { ... }
// Pedir permisos de notificación
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
        console.log('Permisos de notificación:', permission);
    });
}


// ============= DETECTAR ESTADO DE CONEXIÓN =============
window.addEventListener('online', () => {
    console.log('📡 Conexión restaurada');
    // Aquí puedes sincronizar datos pendientes
    window.dispatchEvent(new Event('connection-restored'));
});

window.addEventListener('offline', () => {
    console.log('⚠️ Sin conexión - modo offline activado');
    window.dispatchEvent(new Event('connection-lost'));
});

// Verificar estado inicial
console.log('Estado de conexión:', navigator.onLine ? 'Online' : 'Offline');
