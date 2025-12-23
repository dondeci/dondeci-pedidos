<template>
  <div class="admin-users">
    <div class="header">
      <h2>👥 {{ $t('admin.users_management') }}</h2>
      <button @click="$emit('volver')" class="btn-volver">← {{ $t('admin.back_to_panel') }}</button>
    </div>

    <!-- Formulario de Creación -->
    <div class="section create-user-section">
      <h3>{{ $t('admin.new_user') }}</h3>
      <form @submit.prevent="crearUsuario" class="create-form">
        
        <!-- Input 1 -->
        <div class="form-group">
          <label>{{ $t('admin.full_name') }}</label>
          <input v-model="newUser.nombre" type="text" required placeholder="Ej: Juan Pérez" />
        </div>

        <!-- Input 2 -->
        <div class="form-group">
          <label>{{ $t('login.username') }}</label>
          <input v-model="newUser.username" type="text" required placeholder="Ej: juanp" />
        </div>

        <!-- Input 3 -->
        <div class="form-group">
          <label>{{ $t('login.password') }}</label>
          <input v-model="newUser.password" type="password" required placeholder="••••••" />
        </div>

        <!-- Input 4 -->
        <div class="form-group">
          <label>{{ $t('admin.users_role') }}</label>
          <select v-model="newUser.rol" required>
            <option value="mesero">{{ $t('roles.mesero') }}</option>
            <option value="cocinero">{{ $t('roles.cocinero') }}</option>
            <option value="facturero">{{ $t('roles.facturero') }}</option>
            <option value="admin">{{ $t('roles.admin') }}</option>
          </select>
        </div>
        
        <!-- Botón (ocupará todo el ancho) -->
        <button type="submit" class="btn-crear" :disabled="loading">
          {{ loading ? $t('common.loading') : '➕ ' + $t('common.create') }}
        </button>
      </form>
    </div>


    <!-- Lista de Usuarios -->
    <div class="section users-list-section">
      <h3>{{ $t('admin.users_registered') }}</h3>
      <div v-if="loadingList" class="loading">{{ $t('common.loading') }}</div>
      <div v-else-if="usuarios.length === 0" class="empty">{{ $t('admin.no_users') }}</div>
      
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>{{ $t('editor.form.name') }}</th>
              <th>{{ $t('login.username') }}</th>
              <th>{{ $t('admin.users_role') || 'Rol' }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usuarios" :key="user.id">
              <td>{{ user.nombre }}</td>
              <td>{{ user.username }}</td>
              <td>
                <span :class="['rol-badge', user.rol]">{{ $t('roles.' + user.rol) }}</span>
              </td>
              <td>
                <button 
                  v-if="user.username !== 'admin'" 
                  @click="eliminarUsuario(user.id)" 
                  class="btn-delete"
                  title="Eliminar usuario"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';

const emit = defineEmits(['volver']);

const usuarios = ref([]);
const loading = ref(false);
const loadingList = ref(false);

const newUser = ref({
  nombre: '',
  username: '',
  password: '',
  rol: 'mesero'
});

const cargarUsuarios = async () => {
  loadingList.value = true;
  try {
    const res = await api.getUsuarios();
    usuarios.value = res.data;
  } catch (err) {
    console.error('Error cargando usuarios:', err);
    alert('Error al cargar usuarios');
  } finally {
    loadingList.value = false;
  }
};

const crearUsuario = async () => {
  loading.value = true;
  try {
    await api.crearUsuario(newUser.value);
    alert('✅ Usuario creado con éxito');
    newUser.value = { nombre: '', username: '', password: '', rol: 'mesero' };
    cargarUsuarios();
  } catch (err) {
    console.error(err);
    alert('❌ Error al crear usuario: ' + (err.response?.data?.error || err.message));
  } finally {
    loading.value = false;
  }
};

const eliminarUsuario = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
  
  try {
    await api.eliminarUsuario(id);
    cargarUsuarios();
  } catch (err) {
    console.error(err);
    alert('❌ Error al eliminar usuario');
  }
};

onMounted(() => {
  cargarUsuarios();
});
</script>

<style src="../assets/styles/AdminUsers.css" scoped></style>
