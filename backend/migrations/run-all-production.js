import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
    {
        name: '001_inventario',
        sql: `
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS usa_inventario BOOLEAN DEFAULT FALSE;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_actual INTEGER;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_minimo INTEGER;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS estado_inventario TEXT DEFAULT 'disponible' CHECK(estado_inventario IN ('disponible', 'poco_stock', 'no_disponible'));
        `
    },
    {
        name: '002_stats_tiempo',
        sql: `
            CREATE TABLE IF NOT EXISTS item_time_stats (
                id SERIAL PRIMARY KEY,
                menu_item_id TEXT NOT NULL,
                fecha DATE NOT NULL,
                total_preparaciones INTEGER DEFAULT 0,
                tiempo_promedio INTEGER DEFAULT 0,
                tiempo_minimo INTEGER,
                tiempo_maximo INTEGER,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
                UNIQUE(menu_item_id, fecha)
            );
            
            ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
            ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
            ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS served_at TIMESTAMP;
            ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS tiempo_real INTEGER;
        `
    },
    {
        name: '003_propinas',
        sql: `
            ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;
            ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS propina_monto NUMERIC(10,2) DEFAULT 0;
            ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS propina_porcentaje INTEGER DEFAULT 0;
            
            INSERT INTO configuracion (clave, valor) VALUES ('porcentaje_propina', '10') ON CONFLICT (clave) DO NOTHING;
        `
    },
    {
        name: '004_imagenes_items',
        sql: `
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
        `
    },
    {
        name: '005_iconos_app',
        sql: `
           -- Insertamos claves de iconos si no existen
           INSERT INTO configuracion (clave, valor) VALUES ('favicon_url', '') ON CONFLICT (clave) DO NOTHING;
           INSERT INTO configuracion (clave, valor) VALUES ('icon_192_url', '') ON CONFLICT (clave) DO NOTHING;
           INSERT INTO configuracion (clave, valor) VALUES ('icon_512_url', '') ON CONFLICT (clave) DO NOTHING;
           INSERT INTO configuracion (clave, valor) VALUES ('apple_touch_icon_url', '') ON CONFLICT (clave) DO NOTHING;
        `
    }
];

async function runAll() {
    console.log('🚀 Iniciando migraciones para DB:', process.env.DATABASE_URL.split('@')[1]); // Log seguro (solo host)

    for (const mig of migrations) {
        console.log(`\n📦 Ejecutando: ${mig.name}...`);
        try {
            await pool.query(mig.sql);
            console.log('   ✅ Éxito');
        } catch (err) {
            console.error('   ⚠️ Error (posiblemente ya aplicado):', err.message);
            // No detenemos el proceso, asumimos que falló porque ya existe
        }
    }

    console.log('\n🏁 Migraciones finalizadas.');
    await pool.end();
    process.exit(0);
}

runAll();
