import pool from '../config/db.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('🔧 Ejecutando migración: agregar image_url a menu_items...\n');

        const sql = fs.readFileSync(
            path.join(__dirname, '003_add_menu_item_images.sql'),
            'utf8'
        );

        await pool.query(sql);

        console.log('✅ Migración completada exitosamente!');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
