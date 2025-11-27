/**
 * Migration Runner: Add Time Tracking and Item States
 * 
 * This script runs the PostgreSQL migration to add time tracking
 * and state management for individual items.
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
        console.log('🔄 Starting time tracking migration...\n');

        // Read the SQL migration file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', '002_add_item_time_tracking.sql'),
            'utf8'
        );

        // Execute the migration
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!\n');

        // Verify the changes
        const itemColumns = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'pedido_items'
            AND column_name IN ('started_at', 'completed_at', 'served_at', 'tiempo_real', 'estado')
            ORDER BY ordinal_position;
        `);

        console.log('📋 New columns added to pedido_items:');
        itemColumns.rows.forEach(col => {
            console.log(`  ✓ ${col.column_name} (${col.data_type}) - Default: ${col.column_default || 'NULL'}`);
        });

        // Check if table was created
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'item_time_stats'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('\n✓ item_time_stats table created successfully');
        }

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
