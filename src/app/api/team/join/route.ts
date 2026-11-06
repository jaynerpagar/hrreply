import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST { token } — accept a team invite
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  // Invites are not readable by regular users under RLS; look up by token with
  // the service role. Knowing the token is the capability.
  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('workspace_invites')
    .select('id, workspace_id, email, role, expires_at, workspaces(name)')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 })

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  // The invite is for a specific person — a forwarded or leaked link must not
  // let someone else join.
  if (!user.email || invite.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
    return NextResponse.json(
      { error: `This invite was sent to ${invite.email}. Sign in with that email to accept it.` },
      { status: 403 },
    )
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

  // Add to workspace (service role: users cannot insert memberships directly)
  const { error: insertErr } = await admin
    .from('workspace_members')
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role === 'admin' ? 'admin' : 'member',
      invited_email: profile?.email ?? user.email,
      status: 'active',
    })

  if (insertErr) {
    console.error('[team/join] insert failed:', insertErr.message)
    return NextResponse.json({ error: 'Failed to join workspace' }, { status: 500 })
  }

  // Delete used invite
  await admin.from('workspace_invites').delete().eq('id', invite.id)

  return NextResponse.json({ workspace: invite.workspaces, joined: true })
}

// GET { token } — peek at an invite without joining (for the join page preview)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const { data: invite } = await createAdminClient()
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
