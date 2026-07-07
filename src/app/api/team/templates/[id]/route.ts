import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/team'

type Ctx = { params: Promise<{ id: string }> }

// PATCH — edit a team template (saves old version first)
export async function PATCH(req: Request, { params }: Ctx) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ error: 'Not in a workspace' }, { status: 403 })

  const { id } = await params
  const { name, channel, tone, body } = await req.json()

  // Fetch current version to save as history
  const { data: current } = await supabase
    .from('templates')
    .select('id, name, body, workspace_id, user_id')
    .eq('id', id)
    .eq('workspace_id', ctx.workspace.id)
    .single()

  if (!current) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  // Only the creator or an admin can edit
  if (!ctx.isAdmin && current.user_id !== user.id) {
    return NextResponse.json({ error: 'You can only edit your own templates' }, { status: 403 })
  }

  // Get current version count for this template
  const { count } = await supabase
    .from('template_versions')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', id)

  const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()

  // Save old version
  await supabase.from('template_versions').insert({
    template_id: id,
    version: (count ?? 0) + 1,
    name: current.name,
    body: current.body,
    changed_by_name: profile?.full_name ?? 'Team member',
  })

  // Update template (re-submit for approval if member)
  const newStatus = ctx.isAdmin ? 'approved' : 'pending_approval'

  const { data, error } = await supabase
    .from('templates')
    .update({ name, channel, tone, body, status: newStatus, rejection_note: null })
    .eq('id', id)
    .eq('workspace_id', ctx.workspace.id)
    .select('id, name, channel, tone, body, status, rejection_note, created_by_name, user_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// DELETE — admin only
export async function DELETE(_req: Request, { params }: Ctx) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx?.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('workspace_id', ctx.workspace.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
