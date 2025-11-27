import pool from './config/db.js';

const fixStuckOrders = async () => {
    try {
        console.log('🔧 Iniciando reparación de pedidos estancados...');

        // Obtener todos los pedidos activos
        const res = await pool.query(`
            SELECT id, estado, mesa_numero 
            FROM pedidos 
            WHERE estado IN ('nuevo', 'en_cocina', 'listo')
        `);
        const pedidos = res.rows;

        let updatedCount = 0;

        for (const pedido of pedidos) {
            // Obtener items del pedido
            const itemsRes = await pool.query('SELECT estado FROM pedido_items WHERE pedido_id = $1', [pedido.id]);
            const items = itemsRes.rows;

            if (items.length === 0) continue;

            const todosServidos = items.every(i => i.estado === 'servido');
            const todosListos = items.every(i => i.estado === 'listo' || i.estado === 'servido');

            if (todosServidos && pedido.estado !== 'servido') {
                console.log(`✅ Pedido ${pedido.id} (Mesa ${pedido.mesa_numero}): Todos items servidos. Actualizando a 'servido'.`);
                await pool.query("UPDATE pedidos SET estado = 'servido', delivered_at = NOW() WHERE id = $1", [pedido.id]);
                updatedCount++;
            } else if (todosListos && pedido.estado !== 'listo' && pedido.estado !== 'servido') {
                console.log(`🍳 Pedido ${pedido.id} (Mesa ${pedido.mesa_numero}): Todos items listos. Actualizando a 'listo'.`);
                await pool.query("UPDATE pedidos SET estado = 'listo' WHERE id = $1", [pedido.id]);
                updatedCount++;
            }
        }

        console.log(`\n✨ Reparación completada. Pedidos actualizados: ${updatedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixStuckOrders();
