-- Automations table: stores user-defined automation rules
CREATE TABLE IF NOT EXISTS public.automations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  trigger_type   TEXT        NOT NULL CHECK (trigger_type IN ('stage_change','no_reply','interview_approaching','offer_expiring','joining_approaching')),
  trigger_config JSONB       NOT NULL DEFAULT '{}',
  template_type  TEXT        NOT NULL CHECK (template_type IN ('follow_up_sequence','interview_reminder','thank_you','offer_reminder','joining_sequence')),
  format         TEXT        NOT NULL DEFAULT 'whatsapp' CHECK (format IN ('whatsapp','email','sms','linkedin')),
  tone           TEXT        NOT NULL DEFAULT 'friendly' CHECK (tone IN ('formal','friendly')),
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  run_count      INTEGER     NOT NULL DEFAULT 0,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automations" ON public.automations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
