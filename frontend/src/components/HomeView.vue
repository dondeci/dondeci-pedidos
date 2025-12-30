<template>
  <div class="home-container">
    <LoginForm />
  </div>
</template>

<script setup>
import LoginForm from './LoginForm.vue';
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  background-image: 
    radial-gradient(at 0% 0%, rgba(255, 107, 107, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(100, 116, 139, 0.15) 0px, transparent 50%);
  padding: 20px;
}
</style>
