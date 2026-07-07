import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { outcome } = await req.json()
  const valid = ['got_reply', 'no_reply', 'accepted', 'declined']
  if (!valid.includes(outcome)) return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 })

  const { error } = await supabase
    .from('replies')
    .update({ outcome })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
