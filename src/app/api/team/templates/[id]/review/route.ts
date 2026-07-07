import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/team'

// POST { action: 'approve' | 'reject', note?: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getWorkspaceContext(user.id)
  if (!ctx?.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const { action, note } = await req.json() as { action: 'approve' | 'reject'; note?: string }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('templates')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      rejection_note: action === 'reject' ? (note ?? null) : null,
    })
    .eq('id', id)
    .eq('workspace_id', ctx.workspace.id)
    .select('id, name, status, rejection_note')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
