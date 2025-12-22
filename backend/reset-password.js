import bcrypt from 'bcrypt';
import pool from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetPassword() {
    try {
        // Solicitar datos por consola
        const username = process.argv[2];
        const newPassword = process.argv[3];

        if (!username || !newPassword) {
            console.log('❌ Uso: node reset-password.js <username> <nueva_contraseña>');
            console.log('Ejemplo: node reset-password.js admin nuevaPassword123');
            process.exit(1);
        }

        // Verificar que el usuario existe
        const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            console.log(`❌ Usuario "${username}" no encontrado`);
            process.exit(1);
        }

        const user = result.rows[0];
        console.log(`✓ Usuario encontrado: ${user.nombre} (${user.rol})`);

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar en la base de datos
        await pool.query('UPDATE usuarios SET password = $1 WHERE username = $2', [hashedPassword, username]);

        console.log(`✅ Contraseña actualizada exitosamente para "${username}"`);
        console.log(`Nueva contraseña: ${newPassword}`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

resetPassword();
