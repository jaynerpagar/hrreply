import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/team'

// GET — list active members + pending invites for my workspace
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ error: 'Not in a workspace' }, { status: 403 })

  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, user_id, role, invited_email, status, created_at, users(full_name, email)')
    .eq('workspace_id', ctx.workspace.id)
    .order('created_at', { ascending: true })

  const { data: invites } = ctx.isAdmin
    ? await supabase
        .from('workspace_invites')
        .select('id, email, role, created_at, expires_at')
        .eq('workspace_id', ctx.workspace.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return NextResponse.json({ members: members ?? [], invites: invites ?? [] })
}
