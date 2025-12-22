import { readFileSync } from 'fs';
import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    try {
        console.log('🔄 Running migration: Add tips support...\n');

        const sql = readFileSync('./migrations/002_add_tips_support.sql', 'utf8');

        await pool.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('   - Added subtotal column');
        console.log('   - Added propina_monto column');
        console.log('   - Set default tip percentage to 10%\n');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
