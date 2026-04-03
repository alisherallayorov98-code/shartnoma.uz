-- Add Soliq API verification fields to counterparties table
-- Run this before deploying the stir verification feature

ALTER TABLE counterparties
  ADD COLUMN IF NOT EXISTS stir_status     text,          -- 'active' | 'inactive' | 'unknown'
  ADD COLUMN IF NOT EXISTS stir_checked_at timestamptz,   -- last verified timestamp
  ADD COLUMN IF NOT EXISTS oked            text;          -- OKED (faoliyat kodi)
