import express from 'express';
import bcrypt from 'bcrypt';
import { getAsync } from '../config/db.js';

const router = express.Router();

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        const user = await getAsync('SELECT * FROM usuarios WHERE username = $1', [username]);

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        res.json({
            id: user.id,
            username: user.username,
            nombre: user.nombre,
            rol: user.rol,
            message: '✓ Sesión iniciada'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
