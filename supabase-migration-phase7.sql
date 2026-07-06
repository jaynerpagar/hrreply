-- Phase 7: Analytics
-- Run this in Supabase SQL Editor

-- Track how many times each reply was copied
ALTER TABLE replies ADD COLUMN IF NOT EXISTS copy_count INTEGER NOT NULL DEFAULT 0;

-- Track template "Use template" clicks (lightweight events)
CREATE TABLE IF NOT EXISTS template_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE template_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own template events"
  ON template_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template events"
  ON template_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
