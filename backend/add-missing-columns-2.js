import pool from './config/db.js';

const addMissingColumns2 = async () => {
    try {
        console.log('🔧 Verificando y agregando columnas faltantes (Parte 2)...');

        // Agregar columna tiempo_estimado a menu_items
        try {
            await pool.query('ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tiempo_estimado INTEGER DEFAULT 15');
            console.log('✅ Columna tiempo_estimado verificada/agregada en menu_items');
        } catch (e) { console.log('ℹ️ Nota sobre tiempo_estimado:', e.message); }

        console.log('\n✨ Verificación de columnas completada.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
};

addMissingColumns2();
