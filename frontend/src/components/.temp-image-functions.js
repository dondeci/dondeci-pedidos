// ✅ NUEVO: Funciones para subir/eliminar imágenes de items existentes

const subirImagenItemExistente = async (event, item) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB.');
        return;
    }

    itemEditandoImagen.value = item.id;

    try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await api.uploadMenuImage(formData);
        item.image_url = res.data.url;

        // Guardar en BD
        await actualizarItem(item);

        alert('✅ Imagen actualizada');
    } catch (err) {
        console.error('Error subiendo imagen:', err);
        alert('❌ Error al subir la imagen');
    } finally {
        itemEditandoImagen.value = null;
    }
};

const eliminarImagenItem = async (item) => {
    if (!confirm('¿Eliminar la imagen de este plato?')) return;

    item.image_url = '';
    await actualizarItem(item);
};
