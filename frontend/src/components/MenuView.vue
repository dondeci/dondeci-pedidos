<template>
  <div class="public-menu">
    <!-- Portada -->
    <div class="cover-page" :style="coverPageBaseStyle">
      <div
        class="cover-blur"
        :style="{
          backgroundImage: config.imagenPortada ? `url('${config.imagenPortada}')` : undefined
        }"
      ></div>
      <div
        class="cover-main"
        :style="{
          backgroundImage: config.imagenPortada ? `url('${config.imagenPortada}')` : undefined
        }"
      ></div>
      <div class="cover-content" v-if="!config.ocultarTextoPortada">
        <h1 class="restaurant-name">{{ config.nombre || fallbackTitle }}</h1>
        <p class="restaurant-subtitle">{{ config.subtitulo || fallbackSubtitle }}</p>
      </div>
      <div class="scroll-hint">{{ $t('menu.scroll_hint') }}</div>
    </div>


    <!-- Contenido del Menú -->
    <div class="menu-wrapper" :style="menuBackgroundStyle">
      <div class="menu-container">
        <div v-for="(items, categoria) in menuPorCategoria" :key="categoria" class="menu-category">
          <h2 class="category-title">{{ categoria }}</h2>
          <div class="items-list">
            <div v-for="item in items" :key="item.id" class="menu-item" :class="{ 'no-stock': !item.disponible }">
              <!-- ✅ NUEVO: Imagen del item -->
              <div v-if="item.image_url" class="menu-item-image">
                <img :src="item.image_url" :alt="item.nombre" />
              </div>
              
              <div class="item-details">
                <h3 class="item-name">{{ item.nombre }}</h3>
                <p class="item-desc">{{ item.descripcion }}</p>
              </div>
              <div class="item-price-block">
                <span class="price">${{ item.precio.toLocaleString() }}</span>
                <!-- Agotado -->
                <span v-if="item.estado_inventario === 'no_disponible'" class="badge-agotado">
                  {{ $t('menu.sold_out') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>{{ $t('menu.thank_you') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// ✅ Fallback desde .env
const fallbackTitle = import.meta.env.VITE_APP_TITLE || 'Restaurante';
const fallbackSubtitle = import.meta.env.VITE_APP_DESCRIPTION || 'Menú Digital';

const menuItems = ref([]);
const config = ref({
  nombre: '', // ✅ Vacío por defecto, fallback a .env
  subtitulo: '',
  imagenPortada: '',
  imagenFondoMenu: '',
  ocultarTextoPortada: false
});

const coverPageBaseStyle = computed(() => {
    return {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
    };
});

const menuBackgroundStyle = computed(() => {
  if (config.value.imagenFondoMenu) {
    return { 
      backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('${config.value.imagenFondoMenu}')`,
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover'
    };
  }
  return { background: '#111' };
});

const categories = ref([]);

const menuPorCategoria = computed(() => {
  const grupos = {};
  menuItems.value.forEach(item => {
    if (!grupos[item.categoria]) grupos[item.categoria] = [];
    grupos[item.categoria].push(item);
  });

  // Ordenar usando categories de la DB
  const gruposOrdenados = {};
  
  // 1. Categorías conocidas
  categories.value.forEach(cat => {
    if (grupos[cat.name]) {
        gruposOrdenados[cat.name] = grupos[cat.name];
        delete grupos[cat.name];
    }
  });
  
  // 2. Otras
  Object.keys(grupos).sort().forEach(key => {
    gruposOrdenados[key] = grupos[key];
  });

  return gruposOrdenados;
});

const cargarMenu = async () => {
  try {
    // Cargar categorias primero para orden
    try {
        const catRes = await api.getCategories();
        categories.value = catRes.data;
    } catch(e) { console.error('Error cargando categorias publicas', e); }

    const res = await api.getMenu();
    menuItems.value = res.data;
    
    // Cargar configuración del servidor
    try {
      const configRes = await api.getConfig();
      console.log('🔍 MenuView - Config recibida:', configRes.data); // ✅ DEBUG
      
      if (configRes.data) {
        // ✅ CAMBIADO: asignar directamente las propiedades
        config.value.nombre = configRes.data.nombre || 'Restaurante Sierra Nevada';
        config.value.subtitulo = configRes.data.subtitulo || 'Menú Digital';
        config.value.imagenPortada = configRes.data.imagenPortada || '';
        config.value.imagenFondoMenu = configRes.data.imagenFondoMenu || '';
        config.value.ocultarTextoPortada = configRes.data.ocultarTextoPortada || false;
        
        console.log('✅ MenuView - Config aplicada:', config.value); // ✅ DEBUG
      }
    } catch (configErr) {
      console.error('Error cargando configuración:', configErr);
    }
  } catch (err) {
    console.error('Error cargando menú:', err);
  }
};

onMounted(() => {
  cargarMenu();
});
</script>

<style scoped>
.public-menu {
  min-height: 100vh;
  color: white;
  font-family: 'Helvetica Neue', sans-serif;
}

.cover-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  position: relative;
}

.menu-wrapper {
  min-height: 100vh;
  padding-top: 40px;
}

.restaurant-name {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.restaurant-subtitle {
  font-size: 1.5rem;
  font-weight: 300;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}
/* ... rest of styles ... */


.scroll-hint {
  position: absolute;
  bottom: 40px;
  font-size: 0.9rem;
  opacity: 0.7;
  animation: bounce 2s infinite;
  text-shadow: 1px 1px 2px black;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-10px);}
  60% {transform: translateY(-5px);}
}

.menu-container {
  padding: 0 20px;
  max-width: 800px;
  margin: 0 auto;
}

.menu-category {
  margin-bottom: 60px;
}

.category-title {
  font-size: 2rem;
  color: #fbbf24; /* Amber-400 */
  border-bottom: 2px solid #fbbf24;
  padding-bottom: 10px;
  margin-bottom: 30px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 1px 1px 2px black;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 15px;
}

.menu-item.no-stock {
  opacity: 0.6;
}

/* ✅ NUEVO: Imagen de item en menú */
.menu-item-image {
  width: 150px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
}

.menu-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
}

.item-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #fff;
  text-shadow: 1px 1px 1px black;
}

.item-desc {
  font-size: 0.95rem;
  color: #ddd;
  margin: 0;
  font-style: italic;
  text-shadow: 1px 1px 1px black;
}

.item-price-block {
  text-align: right;
  min-width: 80px;
}

.price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fbbf24;
  display: block;
  text-shadow: 1px 1px 1px black;
}

.badge-agotado {
  font-size: 0.7rem;
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  box-shadow: 1px 1px 2px black;
}

.badge-low-stock {
  font-size: 0.7rem;
  background: #f59e0b;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  box-shadow: 1px 1px 2px black;
}

.footer {
  text-align: center;
  padding: 40px;
  font-size: 0.9rem;
  color: #888;
}
.cover-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.cover-blur {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  filter: blur(18px) brightness(0.85);
  transition: background-image 0.3s;
}

.cover-main {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transition: background-image 0.3s;
}

.cover-content,
.scroll-hint {
  position: relative;
  z-index: 2;
}



@media print {
  .public-menu {
    background: white !important;
    color: black !important;
  }
  .cover-page { 
    height: 100vh; 
    page-break-after: always;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .menu-wrapper {
    background: none !important;
    padding-top: 0;
  }
  .restaurant-name, .restaurant-subtitle { 
    color: black; 
    text-shadow: none; 
    background: white; /* Ensure text is readable if image prints */
    padding: 10px;
  }
  .category-title { color: black; border-color: black; text-shadow: none; }
  .item-name { color: black; text-shadow: none; }
  .item-desc { color: #444; text-shadow: none; }
  .price { color: black; text-shadow: none; }
  .scroll-hint { display: none; }
  .footer { display: none; }
}
</style>
