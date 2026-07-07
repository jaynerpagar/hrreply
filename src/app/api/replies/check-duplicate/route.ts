import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ found: false })

  const { searchParams } = new URL(req.url)
  const candidateId = searchParams.get('candidate_id')
  const replyType   = searchParams.get('reply_type')
  if (!candidateId || !replyType) return NextResponse.json({ found: false })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('replies')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('candidate_id', candidateId)
    .eq('reply_type', replyType)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data) return NextResponse.json({ found: true, created_at: data.created_at })
  return NextResponse.json({ found: false })
}
