-- Migration: Add subtotal and tip support
-- Run this script on your PostgreSQL database

-- 1. Add new columns to pedidos table
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS propina_monto NUMERIC(10,2) DEFAULT 0;

-- 2. Migrate existing data (set subtotal = total, propina = 0)
UPDATE pedidos 
SET subtotal = total, 
    propina_monto = 0 
WHERE subtotal IS NULL;

-- 3. Add tip configuration (default 10%)
INSERT INTO configuracion (clave, valor)
VALUES ('porcentaje_propina', '10')
ON CONFLICT (clave) DO UPDATE SET valor = '10';

-- 4. Verify migration
SELECT 
  COUNT(*) as total_pedidos,
  COUNT(CASE WHEN subtotal IS NOT NULL THEN 1 END) as con_subtotal,
  COUNT(CASE WHEN propina_monto IS NOT NULL THEN 1 END) as con_propina
FROM pedidos;

-- Expected: all counts should be equal
