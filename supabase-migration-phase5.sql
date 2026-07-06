-- Phase 5: HR Template Library
-- Run this in Supabase SQL Editor

-- Add body and channel columns to existing templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email';

-- Create template_favorites table for user-bookmarked HR Library templates
CREATE TABLE IF NOT EXISTS template_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,           -- references HRTemplate.id (static data, not DB row)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- RLS for template_favorites
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON template_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON template_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON template_favorites FOR DELETE
  USING (auth.uid() = user_id);
