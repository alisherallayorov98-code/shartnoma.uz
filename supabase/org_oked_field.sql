-- Add oked column to organizations table (if not already present)
-- Run this in Supabase SQL editor

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS oked text;
