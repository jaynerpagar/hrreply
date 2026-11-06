-- Security hardening migration
-- Run this in the Supabase SQL Editor BEFORE deploying the matching app code.
-- Safe to run more than once.

-- ── 1. users: clients may not change billing or usage columns ─────────────────
-- The "Users can update own data" / "insert own data" policies let any signed-in
-- user call PostgREST with the public anon key and set plan = 'team' or
-- replies_used = 0. RLS can't restrict columns, so a trigger enforces it.
-- Requests made with the service-role key (server routes, webhook) and the SQL
-- editor are not affected.
CREATE OR REPLACE FUNCTION public.protect_user_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.plan := 'free';
    NEW.replies_used := 0;
    NEW.replies_reset_at := now();
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.replies_used IS DISTINCT FROM OLD.replies_used
     OR NEW.replies_reset_at IS DISTINCT FROM OLD.replies_reset_at
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'plan and usage columns can only be changed by the server'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_billing_columns ON public.users;
CREATE TRIGGER protect_user_billing_columns
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_billing_columns();

-- Re-create the update policy with a WITH CHECK so a row can't be moved to
-- another id.
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── 2. subscriptions: read-only for users ────────────────────────────────────
-- Was FOR ALL, so users could insert/modify their own subscription rows.
-- All writes now come from the webhook / cancel route via the service role.
DROP POLICY IF EXISTS "Users own their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ── 3. Workspace helpers (SECURITY DEFINER avoids RLS recursion) ─────────────
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws AND user_id = auth.uid()
      AND role = 'admin' AND status = 'active'
  );
$$;
REVOKE ALL ON FUNCTION public.is_workspace_admin(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid) TO authenticated;

-- ── 4. workspace_members: no self-insert ─────────────────────────────────────
-- "Members can insert themselves" only checked user_id = auth.uid(), so anyone
-- could add themselves to ANY workspace with role = 'admin'. Membership is now
-- written only by /api/team/workspace and /api/team/join via the service role,
-- after the server has validated the plan / invite.
DROP POLICY IF EXISTS "Members can insert themselves" ON public.workspace_members;

-- ── 5. workspace_invites: not world-readable ─────────────────────────────────
-- "Anyone can read invites" (USING true) exposed every invite token and email to
-- anyone holding the public anon key, i.e. a join link for every workspace.
-- The join route now looks invites up by token with the service role.
DROP POLICY IF EXISTS "Anyone can read invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Admins can read invites" ON public.workspace_invites;
CREATE POLICY "Admins can read invites" ON public.workspace_invites
  FOR SELECT USING (public.is_workspace_admin(workspace_id));

-- Invites may only grant known roles.
ALTER TABLE public.workspace_invites DROP CONSTRAINT IF EXISTS workspace_invites_role_check;
ALTER TABLE public.workspace_invites
  ADD CONSTRAINT workspace_invites_role_check CHECK (role IN ('admin', 'member')) NOT VALID;

-- ── 6. AI rate limiting ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket       text        NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        int         NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, bucket)
);
-- RLS on with no policies: only the service role can touch it.
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomically counts one request; returns false when over the limit.
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_user_id uuid,
  p_bucket text,
  p_max int,
  p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.ai_rate_limits AS r (user_id, bucket, window_start, count)
  VALUES (p_user_id, p_bucket, now(), 1)
  ON CONFLICT (user_id, bucket) DO UPDATE SET
    count = CASE
      WHEN r.window_start <= now() - make_interval(secs => p_window_seconds) THEN 1
      ELSE r.count + 1
    END,
    window_start = CASE
      WHEN r.window_start <= now() - make_interval(secs => p_window_seconds) THEN now()
      ELSE r.window_start
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;
REVOKE ALL ON FUNCTION public.check_ai_rate_limit(uuid, text, int, int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, int, int) TO service_role;
