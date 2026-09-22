-- Migration: Add idempotency_key and unique constraints to orders table
-- Run this in your Supabase SQL Editor:

-- 1. Add idempotency_key column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

-- 2. Add unique index on idempotency_key (preventing double submissions with same client session key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
ON orders (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 3. Add unique index on payment_reference (preventing duplicate order creation from same payment)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_reference 
ON orders (payment_reference) 
WHERE payment_reference IS NOT NULL;
