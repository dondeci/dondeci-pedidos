import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import pool from './config/db.js';

const createAdmin = async () => {
    try {
        const username = 'admin';
        const password = '123';
        const nombre = 'Administrador';
        const rol = 'admin';

        // Verificar si ya existe
        const existing = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);

        if (existing.rows.length > 0) {
            console.log('⚠️ El usuario "admin" ya existe. Actualizando contraseña...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('UPDATE usuarios SET password = $1 WHERE username = $2', [hashedPassword, username]);
            console.log('✅ Contraseña actualizada a "123"');
        } else {
            console.log('✨ Creando usuario "admin"...');
            const hashedPassword = await bcrypt.hash(password, 10);
            const id = uuidv4();
            await pool.query(
                'INSERT INTO usuarios(id, username, password, nombre, rol) VALUES($1, $2, $3, $4, $5)',
                [id, username, hashedPassword, nombre, rol]
            );
            console.log('✅ Usuario creado: admin / 123');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdmin();
