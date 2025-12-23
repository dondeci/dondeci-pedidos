import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ================= CATEGORÍAS =================

// GET /api/categories - Listar todas (incluyendo inactivas para admin, pero frontend puede filtrar)
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// POST /api/categories - Crear nueva
router.post('/categories', async (req, res) => {
    const { name, display_order } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING *',
            [name, display_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Ya existe una categoría con este nombre' });
        }
        console.error(err);
        res.status(500).json({ error: 'Error al crear categoría' });
    }
});

// PUT /api/categories/:id - Editar
router.put('/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, display_order, active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE categories SET name = $1, display_order = $2, active = $3 WHERE id = $4 RETURNING *',
            [name, display_order, active, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});

// DELETE /api/categories/:id - Eliminar (Soft delete o hard delete? Hard delete por ahora, cuidado con FKs si las hubiera)
router.delete('/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar si está en uso? Por simplicidad, permitimos borrar.
        // En un sistema real verificaríamos si hay platos usando esta categoría.
        const checkUsage = await pool.query('SELECT COUNT(*) FROM menu_items WHERE categoria = (SELECT name FROM categories WHERE id = $1)', [id]);
        if (parseInt(checkUsage.rows[0].count) > 0) {
            return res.status(400).json({ error: 'No se puede eliminar: Hay platos usando esta categoría.' });
        }

        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ message: 'Categoría eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});


// ================= MÉTODOS DE PAGO =================

// GET /api/payment-methods
router.get('/payment-methods', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payment_methods ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener métodos de pago' });
    }
});

// POST /api/payment-methods
router.post('/payment-methods', async (req, res) => {
    const { name, label, is_digital } = req.body;
    try {
        // Name debe ser slug-like (sin espacios, minusculas) para consistencia interna
        const slugName = name.toLowerCase().replace(/\s+/g, '_');

        const result = await pool.query(
            'INSERT INTO payment_methods (name, label, is_digital) VALUES ($1, $2, $3) RETURNING *',
            [slugName, label || name, is_digital || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Ya existe este método de pago' });
        console.error(err);
        res.status(500).json({ error: 'Error al crear método de pago' });
    }
});

// PUT /api/payment-methods/:id
router.put('/payment-methods/:id', async (req, res) => {
    const { id } = req.params;
    const { label, active, is_digital } = req.body;
    // No permitimos cambiar el 'name' técnico para evitar romper relaciones históricas fácilmente
    try {
        const result = await pool.query(
            'UPDATE payment_methods SET label = $1, active = $2, is_digital = $3 WHERE id = $4 RETURNING *',
            [label, active, is_digital, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Método no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar método' });
    }
});

// DELETE /api/payment-methods/:id
router.delete('/payment-methods/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM payment_methods WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Método no encontrado' });
        res.json({ message: 'Método eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar método' });
    }
});

export default router;
