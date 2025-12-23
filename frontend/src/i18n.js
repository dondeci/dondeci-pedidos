import { createI18n } from 'vue-i18n';
import es from './locales/es.json';
import en from './locales/en.json';

const i18n = createI18n({
    legacy: false, // Usar Composition API
    locale: import.meta.env.VITE_DEFAULT_LOCALE || 'es', // Idioma por defecto
    fallbackLocale: 'es',
    messages: {
        es,
        en
    }
});

export default i18n;
