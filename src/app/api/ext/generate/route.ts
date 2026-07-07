// Extension generate endpoint — accepts Bearer token instead of cookie session
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from '@/lib/prompts'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { sendLowReplyWarning } from '@/lib/email'
import { Tone, ReplyType, MessageFormat, Language } from '@/types'

const FREE_REPLY_WARNING = 20

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  // Auth: Bearer token from Chrome extension
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS })
  }
  const token = auth.slice(7)

  // Verify token with Supabase
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS })
  }

  // Use service role for DB operations (manually scoped to user.id)
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { reply_type, tone, context_input, format, language } = await request.json() as {
    reply_type: ReplyType
    tone: Tone
    context_input: string
    format?: MessageFormat
    language?: Language
  }

  if (!reply_type || !tone || !context_input?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS })
  }

  // Check quota
  const { data: profile } = await db
    .from('users')
    .select('plan, replies_used, replies_reset_at, email, full_name')
    .eq('id', user.id)
    .single()

  let repliesUsed = profile?.replies_used ?? 0

  // Reset counter if 30 days have passed
  if (profile?.plan === 'free' && profile?.replies_reset_at) {
    const resetAt = new Date(profile.replies_reset_at)
    if (Date.now() - resetAt.getTime() >= 30 * 24 * 60 * 60 * 1000) {
      await db.from('users').update({ replies_used: 0, replies_reset_at: new Date().toISOString() }).eq('id', user.id)
      repliesUsed = 0
    }
  }

  if (profile?.plan === 'free' && repliesUsed >= FREE_REPLY_LIMIT) {
    return NextResponse.json({ error: 'free_limit_reached' }, { status: 403, headers: CORS_HEADERS })
  }

  const prompt = buildPrompt(reply_type, tone, context_input, format ?? 'email', language ?? 'english')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const generated_text = (message.content[0] as { type: string; text: string }).text

  // Save to replies table
  const { data: reply } = await db
    .from('replies')
    .insert({ user_id: user.id, reply_type, tone, context_input, generated_text })
    .select()
    .single()

  // Increment usage
  const newCount = repliesUsed + 1
  await db.from('users').update({ replies_used: newCount }).eq('id', user.id)

  // Low-reply warning email
  if (profile?.plan === 'free' && newCount === FREE_REPLY_WARNING && user.email) {
    sendLowReplyWarning(user.email, profile?.full_name ?? '', newCount, FREE_REPLY_LIMIT)
      .catch((err) => console.error('[ext/generate] warning email failed:', err))
  }

  return NextResponse.json(
    { generated_text, reply_id: reply?.id },
    { headers: CORS_HEADERS }
  )
}
