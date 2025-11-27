import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runAsync } from '../config/db.js';

const router = express.Router();

// POST /api/transacciones - Registrar pago
router.post('/', async (req, res) => {
    try {
        const { pedido_id, usuario_facturero_id, monto, metodo_pago } = req.body;

        if (!pedido_id || !monto || !metodo_pago) {
            return res.status(400).json({ error: 'Pedido, monto y método de pago requeridos' });
        }

        const transaccion_id = uuidv4();

        await runAsync(
            'INSERT INTO transacciones(id, pedido_id, usuario_facturero_id, monto, metodo_pago, completada) VALUES($1, $2, $3, $4, $5, TRUE)',
            [transaccion_id, pedido_id, usuario_facturero_id, monto, metodo_pago]
        );

        await runAsync(
            'UPDATE pedidos SET estado = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['pagado', pedido_id]
        );

        req.app.get('io').emit('pedido_pagado', {
            pedido_id,
            estado: 'pagado',
            monto,
            metodo_pago
        });

        res.json({
            id: transaccion_id,
            message: '✓ Pago registrado'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
