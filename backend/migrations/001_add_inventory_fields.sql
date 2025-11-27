-- Migration: Add Inventory Fields to menu_items
-- Date: 2025-11-25
-- Description: Adds inventory tracking capabilities to menu items

-- Add inventory columns
DO $$ 
BEGIN
    -- Add stock_actual column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'stock_actual'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN stock_actual INTEGER DEFAULT NULL;
    END IF;

    -- Add stock_minimo column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'stock_minimo'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN stock_minimo INTEGER DEFAULT 5;
    END IF;

    -- Add usa_inventario column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'usa_inventario'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN usa_inventario BOOLEAN DEFAULT false;
    END IF;

    -- Add estado_inventario column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'estado_inventario'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN estado_inventario TEXT DEFAULT 'disponible';
    END IF;
END $$;

-- Add check constraint for estado_inventario (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_estado_inventario'
    ) THEN
        ALTER TABLE menu_items 
        ADD CONSTRAINT check_estado_inventario 
        CHECK (estado_inventario IN ('disponible', 'poco_stock', 'no_disponible'));
    END IF;
END $$;
