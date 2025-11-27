import pool from './config/db.js';

const debug500 = async () => {
    try {
        console.log('🕵️ Iniciando diagnóstico de error 500...');

        // 1. Verificar esquema de item_time_stats
        console.log('\n1. Verificando tabla item_time_stats...');
        const resStats = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'item_time_stats'
        `);
        console.table(resStats.rows);

        // 2. Verificar esquema de pedido_items
        console.log('\n2. Verificando tabla pedido_items...');
        const resItems = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pedido_items'
        `);
        console.table(resItems.rows);

        // 3. Probar query de tiempos de cocina (que fallaba antes)
        console.log('\n3. Probando query de tiempos de cocina...');
        try {
            const menuItemId = 'test-id';
            const hoy = new Date().toISOString().split('T')[0];
            await pool.query(`
                SELECT * FROM item_time_stats 
                WHERE menu_item_id = $1 AND fecha = $2
            `, [menuItemId, hoy]);
            console.log('✅ Query de lectura item_time_stats OK');
        } catch (e) {
            console.error('❌ Error en query item_time_stats:', e.message);
        }

        console.log('\n🏁 Diagnóstico finalizado.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
};

debug500();
