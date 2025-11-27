/**
 * Migration Runner: Add Inventory Fields to menu_items
 * 
 * This script runs the PostgreSQL migration to add inventory tracking
 * capabilities to the menu_items table.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting inventory migration...\n');

        // Read the SQL migration file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', '001_add_inventory_fields.sql'),
            'utf8'
        );

        // Execute the migration
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!\n');

        // Verify the changes
        const result = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'menu_items'
            AND column_name IN ('stock_actual', 'stock_minimo', 'usa_inventario', 'estado_inventario')
            ORDER BY ordinal_position;
        `);

        console.log('📋 New columns added to menu_items:');
        result.rows.forEach(col => {
            console.log(`  ✓ ${col.column_name} (${col.data_type}) - Default: ${col.column_default || 'NULL'}`);
        });
        console.log('');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('✅ All done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
