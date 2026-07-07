import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/team'

// GET — fetch team templates
// Admin: all statuses. Member: approved only.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ error: 'Not in a workspace' }, { status: 403 })

  let query = supabase
    .from('templates')
    .select('id, name, channel, tone, body, status, rejection_note, created_by_name, user_id, created_at')
    .eq('workspace_id', ctx.workspace.id)
    .order('created_at', { ascending: false })

  if (!ctx.isAdmin) {
    query = query.eq('status', 'approved')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ templates: data ?? [], role: ctx.role })
}

// POST — create a team template
// Member: status = pending_approval. Admin: status = approved.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ error: 'Not in a workspace' }, { status: 403 })

  const { name, channel, tone, body } = await req.json()
  if (!name?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'name and body required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const status = ctx.isAdmin ? 'approved' : 'pending_approval'

  const { data, error } = await supabase
    .from('templates')
    .insert({
      workspace_id: ctx.workspace.id,
      user_id: user.id,
      name: name.trim(),
      channel: channel ?? 'email',
      tone: tone ?? 'formal',
      body: body.trim(),
      is_system: false,
      reply_type: 'follow_up',
      prompt_snippet: '',
      status,
      created_by_name: profile?.full_name ?? 'Team member',
    })
    .select('id, name, channel, tone, body, status, rejection_note, created_by_name, user_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
