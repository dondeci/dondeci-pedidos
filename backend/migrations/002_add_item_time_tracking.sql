-- Migration: Add Time Tracking and Item States
-- Date: 2025-11-25
-- Description: Adds individual item tracking with states and time analytics

-- Add time tracking and state fields to pedido_items
DO $$ 
BEGIN
    -- Add started_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido_items' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE pedido_items ADD COLUMN started_at TIMESTAMP DEFAULT NULL;
    END IF;

    -- Add completed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido_items' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE pedido_items ADD COLUMN completed_at TIMESTAMP DEFAULT NULL;
    END IF;

    -- Add served_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido_items' AND column_name = 'served_at'
    ) THEN
        ALTER TABLE pedido_items ADD COLUMN served_at TIMESTAMP DEFAULT NULL;
    END IF;

    -- Add tiempo_real column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido_items' AND column_name = 'tiempo_real'
    ) THEN
        ALTER TABLE pedido_items ADD COLUMN tiempo_real INTEGER DEFAULT NULL;
    END IF;

    -- Add estado column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido_items' AND column_name = 'estado'
    ) THEN
        ALTER TABLE pedido_items ADD COLUMN estado TEXT DEFAULT 'pendiente';
    END IF;
END $$;

-- Create item_time_stats table for analytics
CREATE TABLE IF NOT EXISTS item_time_stats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    menu_item_id TEXT NOT NULL,
    fecha DATE NOT NULL,
    total_preparaciones INTEGER DEFAULT 0,
    tiempo_promedio_minutos DECIMAL(5,2) DEFAULT 0,
    tiempo_minimo_minutos INTEGER DEFAULT NULL,
    tiempo_maximo_minutos INTEGER DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(menu_item_id, fecha)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_item_time_stats_fecha ON item_time_stats(fecha);
CREATE INDEX IF NOT EXISTS idx_item_time_stats_menu_item ON item_time_stats(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_estado ON pedido_items(estado);
