import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST { token } — accept a team invite
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  // Look up invite
  const { data: invite } = await supabase
    .from('workspace_invites')
    .select('id, workspace_id, email, role, expires_at, workspaces(name)')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 })

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  // Check already a member
  const { data: alreadyMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (alreadyMember) {
    return NextResponse.json({ workspace: invite.workspaces, alreadyMember: true })
  }

  // Get user name
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // Add to workspace
  const { error: insertErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role,
      invited_email: profile?.email ?? user.email,
      status: 'active',
    })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Delete used invite
  await supabase.from('workspace_invites').delete().eq('id', invite.id)

  return NextResponse.json({ workspace: invite.workspaces, joined: true })
}

// GET { token } — peek at an invite without joining (for the join page preview)
export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const { data: invite } = await supabase
    .from('workspace_invites')
    .select('id, email, role, expires_at, workspaces(name), users(full_name)')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  return NextResponse.json({
    workspaceName: (invite.workspaces as unknown as { name: string })?.name,
    inviterName: (invite.users as unknown as { full_name: string })?.full_name,
    role: invite.role,
    email: invite.email,
  })
}
