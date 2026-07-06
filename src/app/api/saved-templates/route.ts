import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('templates')
    .select('id, name, channel, tone, body, created_at')
    .eq('user_id', user.id)
    .eq('is_system', false)
    .not('body', 'is', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, channel, tone, body } = await req.json()
  if (!name || !body) return NextResponse.json({ error: 'name and body required' }, { status: 400 })

  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: user.id,
      name,
      channel: channel ?? 'email',
      tone: tone ?? 'formal',
      body,
      is_system: false,
      reply_type: 'follow_up',
      prompt_snippet: '',
    })
    .select('id, name, channel, tone, body, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
