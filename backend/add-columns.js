import pool from './config/db.js';

const addMissingColumns = async () => {
    try {
        console.log('🔧 Verificando y agregando columnas faltantes...');

        // 1. Agregar columnas a pedido_items
        try {
            await pool.query('ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS tiempo_real INTEGER');
            console.log('✅ Columna tiempo_real verificada/agregada en pedido_items');
        } catch (e) { console.log('ℹ️ Nota sobre tiempo_real:', e.message); }

        try {
            await pool.query('ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS served_at TIMESTAMP');
            console.log('✅ Columna served_at verificada/agregada en pedido_items');
        } catch (e) { console.log('ℹ️ Nota sobre served_at:', e.message); }

        // 2. Agregar columnas a pedidos
        try {
            await pool.query('ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP');
            console.log('✅ Columna delivered_at verificada/agregada en pedidos');
        } catch (e) { console.log('ℹ️ Nota sobre delivered_at:', e.message); }

        console.log('\n✨ Verificación de columnas completada.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
};

addMissingColumns();
