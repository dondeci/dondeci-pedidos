<template>
  <div class="qr-component">
    <img v-if="qrSrc" :src="qrSrc" alt="QR Code" :style="{ width: size + 'px', height: size + 'px' }" />
    <div v-else class="loading">Generando QR...</div>
    <button v-if="qrSrc" @click="descargarQR" class="btn-download">⬇️ Descargar QR</button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, defineExpose } from 'vue';
import QRCode from 'qrcode';

const props = defineProps({
  valor: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 200
  }
});

const qrSrc = ref('');

const generarQR = async () => {
  try {
    qrSrc.value = await QRCode.toDataURL(props.valor, {
      width: props.size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Error generando QR:', err);
  }
};

watch(() => props.valor, generarQR);
onMounted(generarQR);

// Método para descargar la imagen QR
const descargarQR = () => {
  if (!qrSrc.value) return;
  const link = document.createElement('a');
  link.href = qrSrc.value;
  link.download = 'codigo-qr.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exponer qrSrc para acceso desde componente padre si se requiere
defineExpose({ qrSrc });
</script>

<style scoped>
.qr-component {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.loading {
  font-size: 12px;
  color: #666;
}
img {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.btn-download {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background-color: #6366f1;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}
.btn-download:hover {
  background-color: #4f46e5;
}
</style>
