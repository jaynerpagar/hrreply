-- Phase 4 migration: add enriched candidate fields
-- Run this in your Supabase dashboard → SQL Editor

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills         TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience     TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS notice_period  TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interview_at   TIMESTAMPTZ;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_expiry_at DATE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS joining_at     DATE;
