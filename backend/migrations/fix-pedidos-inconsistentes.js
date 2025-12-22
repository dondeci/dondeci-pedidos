import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function arreglarPedidosConProblemas() {
    try {
        console.log('🔧 Arreglando pedidos con problemas de propina...\n');

        // Obtener porcentaje de propina configurado
        const configResult = await pool.query(
            'SELECT valor FROM configuracion WHERE clave = $1',
            ['porcentaje_propina']
        );
        const porcentajePropina = parseFloat(configResult.rows[0]?.valor || 10);
        console.log(`📊 Porcentaje de propina configurado: ${porcentajePropina}%\n`);

        // Buscar pedidos donde subtotal + propina_monto != total
        // Esto indica datos inconsistentes
        const pedidosProblema = await pool.query(`
            SELECT id, subtotal, propina_monto, total 
            FROM pedidos 
            WHERE subtotal IS NOT NULL 
            AND ABS((subtotal + propina_monto) - total) > 0.01
        `);

        console.log(`🔍 Encontrados ${pedidosProblema.rows.length} pedidos con inconsistencias\n`);

        for (const pedido of pedidosProblema.rows) {
            const totalActual = parseFloat(pedido.total);

            // Recalcular subtotal asumiendo que el total es correcto
            // subtotal = total / (1 + porcentaje/100)
            const subtotalCorrecto = Math.round(totalActual / (1 + porcentajePropina / 100));
            const propinaCorrecto = totalActual - subtotalCorrecto;

            await pool.query(
                'UPDATE pedidos SET subtotal = $1, propina_monto = $2 WHERE id = $3',
                [subtotalCorrecto, propinaCorrecto, pedido.id]
            );

            console.log(`✓ Pedido ${pedido.id.substring(0, 8)}...`);
            console.log(`  Antes: Subtotal=$${pedido.subtotal}, Propina=$${pedido.propina_monto}, Total=$${totalActual}`);
            console.log(`  Ahora: Subtotal=$${subtotalCorrecto}, Propina=$${propinaCorrecto}, Total=$${totalActual}\n`);
        }

        console.log(`✅ Reparación completada! ${pedidosProblema.rows.length} pedidos corregidos`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

arreglarPedidosConProblemas();
