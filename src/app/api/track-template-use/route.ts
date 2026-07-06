import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const { templateId } = await req.json()
  if (!templateId) return NextResponse.json({ ok: false })

  await supabase.from('template_events').insert({ user_id: user.id, template_id: templateId })
  return NextResponse.json({ ok: true })
}
