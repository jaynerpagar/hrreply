import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildPrompt } from '@/lib/prompts'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { sendLowReplyWarning } from '@/lib/email'
import { Tone, ReplyType } from '@/types'

const FREE_REPLY_WARNING = 20 // send warning email when user hits this count

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reply_type, tone, context_input, candidate_id } = await request.json() as {
    reply_type: ReplyType
    tone: Tone
    context_input: string
    candidate_id?: string
  }

  if (!reply_type || !tone || !context_input?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check usage limits for free plan
  const { data: profile } = await supabase
    .from('users')
    .select('plan, replies_used, replies_reset_at, email, full_name')
    .eq('id', user.id)
    .single()

  // Reset counter if 30 days have passed since last reset
  let repliesUsed = profile?.replies_used ?? 0
  if (profile?.plan === 'free' && profile?.replies_reset_at) {
    const resetAt = new Date(profile.replies_reset_at)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    if (Date.now() - resetAt.getTime() >= thirtyDaysMs) {
      await supabase
        .from('users')
        .update({ replies_used: 0, replies_reset_at: new Date().toISOString() })
        .eq('id', user.id)
      repliesUsed = 0
    }
  }

  if (profile?.plan === 'free' && repliesUsed >= FREE_REPLY_LIMIT) {
    return NextResponse.json({ error: 'free_limit_reached' }, { status: 403 })
  }

  const prompt = buildPrompt(reply_type, tone, context_input)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const generated_text = (message.content[0] as { type: string; text: string }).text

  // Save reply to DB
  const { data: reply, error } = await supabase
    .from('replies')
    .insert({
      user_id: user.id,
      candidate_id: candidate_id ?? null,
      reply_type,
      tone,
      context_input,
      generated_text,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to save reply:', error)
  }

  // Increment usage counter
  const newCount = repliesUsed + 1
  await supabase
    .from('users')
    .update({ replies_used: newCount })
    .eq('id', user.id)

  // Send low-reply warning email exactly when threshold is crossed
  if (profile?.plan === 'free' && newCount === FREE_REPLY_WARNING && user.email) {
    sendLowReplyWarning(
      user.email,
      profile?.full_name ?? '',
      newCount,
      FREE_REPLY_LIMIT,
    ).catch((err) => console.error('[generate] warning email failed:', err))
  }

  return NextResponse.json({ generated_text, reply_id: reply?.id })
}
