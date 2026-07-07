import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/team'
import { sendTeamInvite } from '@/lib/email'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ error: 'Not in a workspace' }, { status: 403 })
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 })

  const { email, role = 'member' } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', ctx.workspace.id)
    .eq('invited_email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'This person is already a member' }, { status: 400 })

  // Create invite token
  const { data: invite, error } = await supabase
    .from('workspace_invites')
    .insert({
      workspace_id: ctx.workspace.id,
      email: email.toLowerCase().trim(),
      invited_by: user.id,
      role,
    })
    .select('id, token')
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create invite' }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.hrreply.in'}/join/${invite.token}`

  await sendTeamInvite({
    to: email.trim(),
    inviterName: profile?.full_name ?? 'Your team admin',
    workspaceName: ctx.workspace.name,
    role,
    joinUrl,
  }).catch(err => console.error('[team/invite] email failed:', err))

  return NextResponse.json({ ok: true, inviteId: invite.id })
}

// DELETE — revoke a pending invite
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx?.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { inviteId } = await req.json()
  await supabase.from('workspace_invites').delete().eq('id', inviteId).eq('workspace_id', ctx.workspace.id)

  return NextResponse.json({ ok: true })
}
