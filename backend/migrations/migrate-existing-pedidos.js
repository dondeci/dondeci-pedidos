import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrarPedidosExistentes() {
    try {
        console.log('🔄 Migrando pedidos existentes...\n');

        // Obtener configuración de propina
        const configResult = await pool.query(
            'SELECT valor FROM configuracion WHERE clave = $1',
            ['porcentaje_propina']
        );
        const porcentajePropina = parseFloat(configResult.rows[0]?.valor || 10);
        console.log(`📊 Porcentaje de propina configurado: ${porcentajePropina}%\n`);

        // Obtener pedidos sin subtotal
        const pedidosSinSubtotal = await pool.query(
            'SELECT id, total FROM pedidos WHERE subtotal IS NULL'
        );

        console.log(`📦 Encontrados ${pedidosSinSubtotal.rows.length} pedidos a migrar\n`);

        for (const pedido of pedidosSinSubtotal.rows) {
            const totalActual = parseFloat(pedido.total);

            // Calcular subtotal inverso: subtotal = total / (1 + porcentaje/100)
            const subtotal = Math.round(totalActual / (1 + porcentajePropina / 100));
            const propina = totalActual - subtotal;

            await pool.query(
                'UPDATE pedidos SET subtotal = $1, propina_monto = $2 WHERE id = $3',
                [subtotal, propina, pedido.id]
            );

            console.log(`✓ Pedido ${pedido.id.substring(0, 8)}... - Total: $${totalActual} → Subtotal: $${subtotal} + Propina: $${propina}`);
        }

        console.log(`\n✅ Migración completada! ${pedidosSinSubtotal.rows.length} pedidos actualizados`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

migrarPedidosExistentes();
