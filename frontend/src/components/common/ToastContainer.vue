<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-item"
        :class="`type-${toast.type}`"
        role="alert"
      >
        <div class="toast-icon">
             <component :is="getIcon(toast.type)" :size="20" />
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" @click="removeToast(toast.id)">
            <X :size="16" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { 
  CheckCircle, AlertCircle, Info, AlertTriangle, X 
} from 'lucide-vue-next';

const { toasts, removeToast } = useToast();

const getIcon = (type) => {
    switch(type) {
        case 'success': return CheckCircle;
        case 'error': return AlertCircle;
        case 'warning': return AlertTriangle;
        default: return Info;
    }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* Allow clicking through container */
}

/* Mobile positioning */
@media (max-width: 768px) {
  .toast-container {
    top: auto;
    bottom: 80px; /* Above nav/fab */
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: 90%;
    max-width: 350px;
  }
}

.toast-item {
  pointer-events: auto; /* Enable clicking on toast */
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
  overflow: hidden;
  border-left: 4px solid #94a3b8; /* Default border */
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Types */
.type-success {
  border-left-color: #10b981;
}
.type-success .toast-icon {
    color: #10b981;
}

.type-error {
  border-left-color: #ef4444;
}
.type-error .toast-icon {
    color: #ef4444;
}

.type-warning {
  border-left-color: #f59e0b;
}
.type-warning .toast-icon {
    color: #f59e0b;
}

.type-info {
  border-left-color: #3b82f6;
}
.type-info .toast-icon {
    color: #3b82f6;
}

.toast-close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
}

.toast-close:hover {
    color: #ef4444;
}

/* Dark Mode Support (if using .dark class on html/body) */
:global(.dark) .toast-item {
    background: #1e293b;
    color: #f8fafc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Visual Enhancements: Backdrop Blur */
.toast-item {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

/* Transition: Slide from right (Desktop) / Slide from bottom (Mobile) */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
@media (max-width: 768px) {
    .toast-enter-from {
        transform: translateY(20px);
    }
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px); /* Leave to right implies dismissed */
}
@media (max-width: 768px) {
    .toast-leave-to {
        transform: translateY(-20px) scale(0.9);
        opacity: 0;
    }
}
</style>
