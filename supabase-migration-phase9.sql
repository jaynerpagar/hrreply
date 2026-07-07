-- Phase 9: Team Features
-- Run this in Supabase SQL Editor

-- ── 1. Workspaces ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view workspace"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Owner can update workspace"
  ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- ── 2. Workspace members ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
  invited_email TEXT,
  status       TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'pending'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members wm2 WHERE wm2.user_id = auth.uid() AND wm2.status = 'active'
    )
  );

CREATE POLICY "Members can insert themselves"
  ON workspace_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ── 3. Workspace invites ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  invited_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read an invite by token (needed for the join page)
CREATE POLICY "Anyone can read invites"
  ON workspace_invites FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert invites"
  ON workspace_invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete invites"
  ON workspace_invites FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ── 4. Alter templates ────────────────────────────────────────────────────────
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_note  TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Index for fast workspace template lookups
CREATE INDEX IF NOT EXISTS idx_templates_workspace_id ON templates(workspace_id);

-- Members can read approved team templates in their workspace
-- (personal templates still covered by existing user_id = auth.uid() policy)
-- Drop and recreate the SELECT policy to include workspace templates
-- (check if existing policy exists first — may need to DROP the old one)
-- Note: your existing SELECT policy for templates likely uses user_id = auth.uid()
-- Add a new policy for workspace templates:
CREATE POLICY "Workspace members can read workspace templates"
  ON templates FOR SELECT
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Workspace members can insert team templates
CREATE POLICY "Workspace members can create team templates"
  ON templates FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Workspace members can update team templates they own; admins can update any
CREATE POLICY "Workspace template update"
  ON templates FOR UPDATE
  USING (
    workspace_id IS NOT NULL AND (
      user_id = auth.uid()
      OR
      workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
      )
    )
  );

-- Admins can delete team templates
CREATE POLICY "Workspace admins can delete team templates"
  ON templates FOR DELETE
  USING (
    workspace_id IS NOT NULL AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ── 5. Template versions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version          INTEGER NOT NULL,
  name             TEXT NOT NULL,
  body             TEXT NOT NULL,
  changed_by_name  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view template versions"
  ON template_versions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM templates
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Workspace members can insert template versions"
  ON template_versions FOR INSERT
  WITH CHECK (
    template_id IN (
      SELECT id FROM templates
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );
