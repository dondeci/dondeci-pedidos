import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js'; // Importar pool directamente para transacciones

const router = express.Router();

// POST /api/transacciones - Registrar pago (parcial, completo o múltiple)
router.post('/', async (req, res) => {
  console.log('💰 RECIBIENDO PAGO (POST /api/transacciones)'); // DEBUG
  console.log('Payload:', JSON.stringify(req.body, null, 2)); // DEBUG

  const client = await pool.connect();

  try {
    // Normalizar entrada: siempre tratamos con un array
    const pagos = Array.isArray(req.body) ? req.body : [req.body];

    if (pagos.length === 0) {
      return res.status(400).json({ error: 'No se enviaron datos de pago' });
    }

    // Validar datos básicos del primer pago para obtener contexto (pedido_id debe ser el mismo para todos)
    const pedido_id = pagos[0].pedido_id;
    const usuario_facturero_id = pagos[0].usuario_facturero_id;

    if (!pedido_id) {
      return res.status(400).json({ error: 'ID de pedido requerido' });
    }

    // Iniciar transacción de BD
    await client.query('BEGIN');

    // 1) Verificar Estado del Pedido (Bloqueo pesimista para evitar condiciones de carrera)
    const pedidoRes = await client.query(
      'SELECT id, total, subtotal, propina_monto, estado FROM pedidos WHERE id = $1 FOR UPDATE',
      [pedido_id]
    );

    if (pedidoRes.rows.length === 0) {
      console.log('❌ Pedido no encontrado en BD:', pedido_id); // DEBUG
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = pedidoRes.rows[0];

    // 🚫 No permitir pagos sobre pedidos ya cerrados
    if (['pagado', 'cancelado'].includes(pedido.estado)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'El pedido ya está cerrado. No se pueden registrar más pagos.',
        estado: pedido.estado
      });
    }

    let totalPedido = parseFloat(pedido.total);
    let subtotalPedido = parseFloat(pedido.subtotal);
    let propinaPedido = parseFloat(pedido.propina_monto || 0);

    // Si subtotal es null (pedidos viejos), calcularlo
    if (!pedido.subtotal) {
      const porcentajeRes = await client.query("SELECT valor FROM configuracion WHERE clave = 'porcentaje_propina'");
      const porcPropina = parseFloat(porcentajeRes.rows[0]?.valor || 10);
      subtotalPedido = Math.round(totalPedido / (1 + porcPropina / 100));
      propinaPedido = totalPedido - subtotalPedido;
    }

    // 2) Procesar Propina (Solo si viene una explícita en el payload)
    // Buscamos si alguno de los pagos trae 'propina_final' definida (tomamos la del primero que la tenga)
    const pagoConPropina = pagos.find(p => p.propina_final !== undefined && p.propina_final !== null);

    if (pagoConPropina) {
      const nuevaPropina = parseFloat(pagoConPropina.propina_final);
      const nuevoTotal = subtotalPedido + nuevaPropina;

      await client.query(
        'UPDATE pedidos SET subtotal = $1, propina_monto = $2, total = $3 WHERE id = $4',
        [subtotalPedido, nuevaPropina, nuevoTotal, pedido_id]
      );

      totalPedido = nuevoTotal;
    }

    // 3) Calcular Pagado Antes
    const pagadoRes = await client.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM transacciones WHERE pedido_id = $1`,
      [pedido_id]
    );
    const totalPagadoAntes = parseFloat(pagadoRes.rows[0].total_pagado);

    // 4) Validar Monto Total de la Transacción Actual
    const montoTotalOperacion = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    // Permitir un margen de error mínimo por redondeo (epsilon)
    if (totalPagadoAntes + montoTotalOperacion > totalPedido + 0.1) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'El pago excede el total del pedido',
        total_pedido: totalPedido,
        total_pagado_antes: totalPagadoAntes,
        intento: montoTotalOperacion,
        remanente: totalPedido - totalPagadoAntes
      });
    }

    // 5) Insertar Transacciones
    const transaccionesIds = [];
    const timestamp = new Date(); // Usar misma fecha para todos

    for (const pago of pagos) {
      if (!pago.monto || pago.monto <= 0) continue; // Saltar montos 0

      const id = uuidv4();
      transaccionesIds.push(id);

      await client.query(
        `INSERT INTO transacciones
             (id, pedido_id, usuario_facturero_id, monto, metodo_pago, completada, created_at)
             VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
        [id, pedido_id, usuario_facturero_id, pago.monto, pago.metodo_pago, timestamp]
      );
    }

    if (transaccionesIds.length === 0 && montoTotalOperacion > 0) {
      // Caso raro: enviaron montos pero ninguno se insertó
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No se registraron transacciones válidas' });
    }

    // 6) Actualizar Estado Final
    const totalPagadoFinal = totalPagadoAntes + montoTotalOperacion;
    const pendiente = Math.max(totalPedido - totalPagadoFinal, 0); // Evitar negativos por decimales

    let nuevoEstado = pedido.estado;

    if (pendiente < 1) { // Consideramos pagado si debe menos de 1 peso (ajuste redondeo)
      nuevoEstado = 'pagado';
      await client.query(
        `UPDATE pedidos SET estado = 'pagado', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [pedido_id]
      );

      // ✅ NUEVO: Descontar stock_actual y liberar stock_reservado al pagar
      const itemsRes = await client.query(`
        SELECT pi.menu_item_id, SUM(pi.cantidad) as cantidad_total
        FROM pedido_items pi
        JOIN menu_items mi ON pi.menu_item_id = mi.id
        WHERE pi.pedido_id = $1 AND mi.usa_inventario = TRUE
        GROUP BY pi.menu_item_id
      `, [pedido_id]);

      for (const item of itemsRes.rows) {
        await client.query(`
          UPDATE menu_items 
          SET stock_actual = GREATEST(stock_actual - $1, 0),
              stock_reservado = GREATEST(stock_reservado - $1, 0)
          WHERE id = $2
        `, [item.cantidad_total, item.menu_item_id]);
      }

    } else if (pedido.estado !== 'en_caja') {
      nuevoEstado = 'en_caja';
      await client.query(
        `UPDATE pedidos SET estado = 'en_caja' WHERE id = $1`,
        [pedido_id]
      );
    }

    await client.query('COMMIT');

    // 7) Notificar via Socket.IO (fuera de la transacción)
    const io = req.app.get('io');

    // Si se pagó completo
    if (nuevoEstado === 'pagado') {
      io.emit('pedido_actualizado', { id: pedido_id, estado: 'pagado' });
    } else if (nuevoEstado === 'en_caja' && pedido.estado !== 'en_caja') {
      io.emit('pedido_actualizado', { id: pedido_id, estado: 'en_caja' });
    }

    // Evento de pago registrado (uno solo o uno por cada sub-pago? Mejor uno general)
    io.emit('pedido_pagado', {
      pedido_id,
      estado: nuevoEstado,
      monto: montoTotalOperacion,
      pagos_multiples: pagos.length > 1,
      total_pagado: totalPagadoFinal,
      pendiente
    });

    res.json({
      ids: transaccionesIds,
      message: '✓ Pago registrado correctamente',
      total_pagado: totalPagadoFinal,
      total_pedido: totalPedido,
      pendiente,
      nuevo_estado: nuevoEstado
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando pago:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});


export default router;
