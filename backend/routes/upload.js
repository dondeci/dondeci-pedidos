import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo (Aumentado para fondos HD)
    },
    fileFilter: (req, file, cb) => {
        // Solo aceptar imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

// POST /api/upload/menu-image - Subir imagen a Cloudinary
router.post('/menu-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ninguna imagen' });
        }

        // Subir a Cloudinary usando un stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'menu_items', // Carpeta en Cloudinary
                transformation: [
                    { width: 800, height: 800, crop: 'limit' }, // Redimensionar
                    { quality: 'auto' }, // Optimización automática
                    { fetch_format: 'auto' } // Formato óptimo
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Error subiendo a Cloudinary:', error);
                    return res.status(500).json({ error: 'Error subiendo imagen' });
                }

                res.json({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        // Enviar el buffer del archivo al stream
        uploadStream.end(req.file.buffer);

    } catch (error) {
        console.error('Error en upload:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/upload/menu-image/:publicId - Eliminar imagen de Cloudinary
router.delete('/menu-image/:publicId', async (req, res) => {
    try {
        const publicId = req.params.publicId.replace(/_/g, '/'); // Restaurar las barras

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.json({ message: 'Imagen eliminada' });
        } else {
            res.status(404).json({ error: 'Imagen no encontrada' });
        }
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
