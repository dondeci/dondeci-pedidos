import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAsync, runAsync } from '../config/db.js';

const router = express.Router();

// POST /api/transacciones - Registrar pago (parcial o completo)
router.post('/', async (req, res) => {
  try {
    const { pedido_id, usuario_facturero_id, monto, metodo_pago, propina_final } = req.body;

    if (!pedido_id || !monto || !metodo_pago) {
      return res.status(400).json({ error: 'Pedido, monto y método de pago requeridos' });
    }

    // 1) Verificar que el pedido existe
    const pedido = await getAsync(
      'SELECT id, total, subtotal, propina_monto, estado FROM pedidos WHERE id = $1',
      [pedido_id]
    );

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // ✅ NUEVO: Si se especifica propina_final, actualizar el total del pedido
    let totalPedido = parseFloat(pedido.total);
    let subtotalPedido = parseFloat(pedido.subtotal);
    let propinaPedido = parseFloat(pedido.propina_monto || 0);

    // Si subtotal es null (pedidos viejos), calcularlo desde el total actual
    if (!pedido.subtotal) {
      const porcentajeConfig = await runAsync(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['porcentaje_propina']
      );
      const porcPropina = parseFloat(porcentajeConfig.rows[0]?.valor || 10);
      subtotalPedido = Math.round(totalPedido / (1 + porcPropina / 100));
      propinaPedido = totalPedido - subtotalPedido;
    }

    if (propina_final !== undefined && propina_final !== null) {
      // Cliente especificó una propina diferente (puede ser 0, personalizada, o la sugerida)
      const nuevaPropina = parseFloat(propina_final);
      const nuevoTotal = subtotalPedido + nuevaPropina;

      // Actualizar el pedido con la nueva propina
      await runAsync(
        'UPDATE pedidos SET subtotal = $1, propina_monto = $2, total = $3 WHERE id = $4',
        [subtotalPedido, nuevaPropina, nuevoTotal, pedido_id]
      );

      totalPedido = nuevoTotal;
      propinaPedido = nuevaPropina;
    }

    // 🚫 No permitir pagos sobre pedidos ya cerrados
    if (['pagado', 'cancelado'].includes(pedido.estado)) {
      return res.status(400).json({
        error: 'El pedido ya está cerrado. No se pueden registrar más pagos.',
        estado: pedido.estado
      });
    }

    // 2) Calcular cuánto se ha pagado HASTA AHORA
    const sumaAntes = await getAsync(
      `SELECT COALESCE(SUM(monto), 0) AS total_pagado
       FROM transacciones
       WHERE pedido_id = $1`,
      [pedido_id]
    );

    const totalPagadoAntes = parseFloat(sumaAntes.total_pagado);
    const montoNumber = Number(monto);

    // 🚫 No permitir que el nuevo pago se pase del total
    if (totalPagadoAntes + montoNumber > totalPedido + 1e-6) {
      return res.status(400).json({
        error: 'El pago excede el total del pedido',
        total_pedido: totalPedido,
        total_pagado: totalPagadoAntes,
        intento: montoNumber
      });
    }

    // 3) Insertar la transacción (un pago más, parcial o total)
    const transaccion_id = uuidv4();

    await runAsync(
      `INSERT INTO transacciones
         (id, pedido_id, usuario_facturero_id, monto, metodo_pago, completada, created_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_TIMESTAMP)`,
      [transaccion_id, pedido_id, usuario_facturero_id, montoNumber, metodo_pago]
    );

    // 4) Recalcular total pagado después de este pago
    const suma = await getAsync(
      `SELECT COALESCE(SUM(monto), 0) AS total_pagado
       FROM transacciones
       WHERE pedido_id = $1`,
      [pedido_id]
    );

    const totalPagado = parseFloat(suma.total_pagado);
    const pendiente = Math.max(totalPedido - totalPagado, 0);

    let nuevoEstado = pedido.estado;

    // 5) Actualizar estado del pedido según lo pagado
    if (totalPagado >= totalPedido) {
      nuevoEstado = 'pagado';
      await runAsync(
        `UPDATE pedidos
         SET estado = 'pagado', completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [pedido_id]
      );

      req.app.get('io').emit('pedido_actualizado', {
        id: pedido_id,
        estado: 'pagado'
      });
    } else {
      if (pedido.estado !== 'pagado' && pedido.estado !== 'cancelado') {
        nuevoEstado = 'en_caja';
        await runAsync(
          `UPDATE pedidos
           SET estado = 'en_caja'
           WHERE id = $1`,
          [pedido_id]
        );

        req.app.get('io').emit('pedido_actualizado', {
          id: pedido_id,
          estado: 'en_caja'
        });
      }
    }

    // 6) Notificar pago registrado
    req.app.get('io').emit('pedido_pagado', {
      pedido_id,
      estado: nuevoEstado,
      monto: montoNumber,
      metodo_pago,
      total_pagado: totalPagado,
      pendiente
    });

    res.json({
      id: transaccion_id,
      message: '✓ Pago registrado',
      total_pagado: totalPagado,
      total_pedido: totalPedido,
      pendiente,
      nuevo_estado: nuevoEstado
    });
  } catch (error) {
    console.error('Error registrando pago:', error);
    res.status(500).json({ error: error.message });
  }
});


export default router;
