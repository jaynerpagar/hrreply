-- Phase 10c: Zoho Recruit ATS Integration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS zoho_integrations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token    TEXT        NOT NULL,
  refresh_token   TEXT        NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  api_domain      TEXT        NOT NULL DEFAULT 'https://recruit.zoho.in',
  zoho_user_name  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE zoho_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own Zoho integration"
  ON zoho_integrations FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
