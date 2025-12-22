import express from 'express';
import { getAsync } from '../config/db.js';

const router = express.Router();

// GET /api/icons/favicon - Redirect al favicon configurado o fallback
router.get('/favicon', async (req, res) => {
    try {
        const result = await getAsync(
            'SELECT valor FROM configuracion WHERE clave = $1',
            ['favicon_url']
        );

        if (result && result.valor) {
            return res.redirect(result.valor);
        }
    } catch (error) {
        console.error('Error obteniendo favicon:', error);
    }

    // Fallback al favicon por defecto
    res.redirect('/favicon.ico');
});

// GET /api/icons/icon-192 - Icono PWA 192x192
router.get('/icon-192', async (req, res) => {
    try {
        const result = await getAsync(
            'SELECT valor FROM configuracion WHERE clave = $1',
            ['icon_192_url']
        );

        if (result && result.valor) {
            return res.redirect(result.valor);
        }
    } catch (error) {
        console.error('Error obteniendo icon-192:', error);
    }

    res.redirect('/icon-192.png');
});

// GET /api/icons/icon-512 - Icono PWA 512x512
router.get('/icon-512', async (req, res) => {
    try {
        const result = await getAsync(
            'SELECT valor FROM configuracion WHERE clave = $1',
            ['icon_512_url']
        );

        if (result && result.valor) {
            return res.redirect(result.valor);
        }
    } catch (error) {
        console.error('Error obteniendo icon-512:', error);
    }

    res.redirect('/icon-512.png');
});

// GET /api/icons/apple-touch-icon - Apple Touch Icon
router.get('/apple-touch-icon', async (req, res) => {
    try {
        const result = await getAsync(
            'SELECT valor FROM configuracion WHERE clave = $1',
            ['apple_touch_icon_url']
        );

        if (result && result.valor) {
            return res.redirect(result.valor);
        }
    } catch (error) {
        console.error('Error obteniendo apple-touch-icon:', error);
    }

    res.redirect('/apple-touch-icon.png');
});

export default router;
