import { ref } from 'vue';

const toasts = ref([]);

export function useToast() {
    const addToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random(); // Unique ID

        const toast = {
            id,
            message,
            type, // 'success', 'error', 'info', 'warning'
            duration
        };

        toasts.value.push(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index !== -1) {
            toasts.value.splice(index, 1);
        }
    };

    // Helper methods
    const success = (msg, duration) => addToast(msg, 'success', duration);
    const error = (msg, duration) => addToast(msg, 'error', duration);
    const info = (msg, duration) => addToast(msg, 'info', duration);
    const warning = (msg, duration) => addToast(msg, 'warning', duration);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning
    };
}
