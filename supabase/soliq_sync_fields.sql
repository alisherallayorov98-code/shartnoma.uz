-- Soliq API ma'lumotlari uchun yangi ustunlar (organizations jadvaliga)
-- Supabase SQL Editor da bir marta ishga tushiring

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS soliq_synced_at  timestamptz,
  ADD COLUMN IF NOT EXISTS full_name         text,
  ADD COLUMN IF NOT EXISTS status            text,
  ADD COLUMN IF NOT EXISTS status_text       text,
  ADD COLUMN IF NOT EXISTS oked_name         text,
  ADD COLUMN IF NOT EXISTS reg_date          text,
  ADD COLUMN IF NOT EXISTS reg_number        text,
  ADD COLUMN IF NOT EXISTS opf_name          text,
  ADD COLUMN IF NOT EXISTS business_structure text,
  ADD COLUMN IF NOT EXISTS tax_mode          text,
  ADD COLUMN IF NOT EXISTS taxpayer_type     int,
  ADD COLUMN IF NOT EXISTS soato             text,
  ADD COLUMN IF NOT EXISTS soogu             text,
  ADD COLUMN IF NOT EXISTS postcode          text;
