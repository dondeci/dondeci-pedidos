import bcrypt from 'bcrypt';
import pool from './config/db.js';

const migratePasswords = async () => {
    try {
        console.log('🔄 Iniciando migración de contraseñas a formato seguro...');

        // Obtener todos los usuarios
        const res = await pool.query('SELECT * FROM usuarios');
        const users = res.rows;

        let updatedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            // Verificar si ya es un hash de bcrypt (comienza con $2b$, $2a$ o $2y$)
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$')) {
                console.log(`⏭️  Usuario "${user.username}" ya tiene contraseña segura. Saltando.`);
                skippedCount++;
                continue;
            }

            console.log(`🔒 Encriptando contraseña para usuario "${user.username}"...`);

            // Hashear la contraseña actual (que está en texto plano)
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Actualizar en BD
            await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
            updatedCount++;
        }

        console.log('\n✅ Migración completada.');
        console.log(`   - Usuarios actualizados: ${updatedCount}`);
        console.log(`   - Usuarios sin cambios: ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
};

migratePasswords();
