-- ─────────────────────────────────────────────────────────────────
-- Phase 2: Jobs Module + Candidate Notes
-- Run in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  department  TEXT,
  location    TEXT,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'on_hold', 'closed', 'filled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own jobs" ON public.jobs;
CREATE POLICY "Users manage their own jobs" ON public.jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Link candidates to jobs (nullable — existing candidates unaffected)
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON public.candidates(job_id);

-- Candidate notes
CREATE TABLE IF NOT EXISTS public.candidate_notes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid        NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own candidate notes" ON public.candidate_notes;
CREATE POLICY "Users manage their own candidate notes" ON public.candidate_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
