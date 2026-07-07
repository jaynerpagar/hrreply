import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/team'

// GET — return my workspace + role (null if not in one)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ workspace: null })

  // Count members
  const { count } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', ctx.workspace.id)
    .eq('status', 'active')

  return NextResponse.json({ workspace: ctx.workspace, role: ctx.role, memberCount: count ?? 0 })
}

// POST — create a new workspace (team plan only)
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must be on team plan
  const { data: profile } = await supabase
    .from('users')
    .select('plan, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.plan !== 'team') {
    return NextResponse.json({ error: 'Team plan required to create a workspace' }, { status: 403 })
  }

  // Already in a workspace?
  const existing = await getWorkspaceContext(user.id)
  if (existing) {
    return NextResponse.json({ error: 'You are already in a workspace' }, { status: 400 })
  }

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Workspace name required' }, { status: 400 })

  // Create workspace
  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name: name.trim(), owner_id: user.id })
    .select('id, name, owner_id')
    .single()

  if (wsErr || !workspace) {
    return NextResponse.json({ error: wsErr?.message ?? 'Failed to create workspace' }, { status: 500 })
  }

  // Add creator as admin
  const { error: memberErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'admin',
      invited_email: user.email,
      status: 'active',
    })

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }

  return NextResponse.json({ workspace, role: 'admin' }, { status: 201 })
}
