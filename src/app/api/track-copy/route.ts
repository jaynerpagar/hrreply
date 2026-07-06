import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const { replyId } = await req.json()
  if (!replyId) return NextResponse.json({ ok: false })

  // Fetch current count then increment — simple, no RPC needed
  const { data } = await supabase
    .from('replies')
    .select('copy_count')
    .eq('id', replyId)
    .eq('user_id', user.id)
    .single()

  if (data) {
    await supabase
      .from('replies')
      .update({ copy_count: (data.copy_count ?? 0) + 1 })
      .eq('id', replyId)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
