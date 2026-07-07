import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/team'

// GET — list all versions for a template
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ error: 'Not in a workspace' }, { status: 403 })

  const { id } = await params

  // Verify the template belongs to this workspace
  const { data: tpl } = await supabase
    .from('templates')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', ctx.workspace.id)
    .single()

  if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('template_versions')
    .select('id, version, name, body, changed_by_name, created_at')
    .eq('template_id', id)
    .order('version', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ versions: data ?? [] })
}

// POST { versionId } — restore a specific version
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx) return NextResponse.json({ error: 'Not in a workspace' }, { status: 403 })

  const { id } = await params
  const { versionId } = await req.json()

  // Get the version content
  const { data: version } = await supabase
    .from('template_versions')
    .select('id, name, body, version')
    .eq('id', versionId)
    .eq('template_id', id)
    .single()

  if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  // Get current template to snapshot it first
  const { data: current } = await supabase
    .from('templates')
    .select('name, body, workspace_id, user_id')
    .eq('id', id)
    .eq('workspace_id', ctx.workspace.id)
    .single()

  if (!current) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  // Save current as a version before restoring
  const { count } = await supabase
    .from('template_versions')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', id)

  const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()

  await supabase.from('template_versions').insert({
    template_id: id,
    version: (count ?? 0) + 1,
    name: current.name,
    body: current.body,
    changed_by_name: `${profile?.full_name ?? 'Team member'} (before restore)`,
  })

  // Restore
  const { data: restored, error } = await supabase
    .from('templates')
    .update({ name: version.name, body: version.body, status: ctx.isAdmin ? 'approved' : 'pending_approval', rejection_note: null })
    .eq('id', id)
    .eq('workspace_id', ctx.workspace.id)
    .select('id, name, channel, tone, body, status, rejection_note, created_by_name, user_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: restored })
}
