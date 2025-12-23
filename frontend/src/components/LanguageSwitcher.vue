<template>
  <div class="language-switcher">
    <select v-model="currentLocale" @change="changeLanguage">
      <option value="en">🇺🇸 English</option>
      <option value="es">🇪🇸 Español</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val;
    localStorage.setItem('locale', val);
  }
});

const changeLanguage = () => {
  // Locale is updated via v-model setter
};
</script>

<style scoped>
.language-switcher select {
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background-color: rgba(255, 255, 255, 0.1);
  color: white; /* Force white text for the select box itself */
  font-size: 1rem;
  cursor: pointer;
}

.language-switcher select:focus {
  outline: none;
  border-color: #fbbf24;
}

.language-switcher option {
  color: black; /* Force black text for dropdown options */
  background-color: white;
}
</style>
