import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { sendLowReplyWarning } from '@/lib/email'
import { MessageFormat } from '@/types'

const FREE_REPLY_WARNING = 20
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FORMAT_DESC: Record<MessageFormat, string> = {
  email:    'a professional email (include greeting and sign-off)',
  whatsapp: 'a brief WhatsApp message (3-5 lines, conversational tone)',
  sms:      'a short SMS under 160 characters',
  linkedin: 'a professional LinkedIn message (3-4 sentences)',
  slack:    'a brief Slack message (2-4 lines, casual but professional)',
  teams:    'a Microsoft Teams message (3-5 lines)',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    candidate_message,
    conversation_history = [],
    format = 'email',
    tone_preference = 'friendly',
    candidate_name,
    role,
  } = await request.json()

  if (!candidate_message?.trim()) {
    return NextResponse.json({ error: 'candidate_message is required' }, { status: 400 })
  }

  // Quota check (same as /api/generate)
  const { data: profile } = await supabase
    .from('users')
    .select('plan, replies_used, replies_reset_at, email, full_name')
    .eq('id', user.id)
    .single()

  let repliesUsed = profile?.replies_used ?? 0
  if (profile?.plan === 'free' && profile?.replies_reset_at) {
    const resetAt = new Date(profile.replies_reset_at)
    if (Date.now() - resetAt.getTime() >= 30 * 24 * 60 * 60 * 1000) {
      await supabase.from('users').update({ replies_used: 0, replies_reset_at: new Date().toISOString() }).eq('id', user.id)
      repliesUsed = 0
    }
  }
  if (profile?.plan === 'free' && repliesUsed >= FREE_REPLY_LIMIT) {
    return NextResponse.json({ error: 'free_limit_reached' }, { status: 403 })
  }

  // Build prompt
  let prompt = `You are an expert HR professional at an Indian company. You write professional, empathetic replies to candidates.`

  if (conversation_history.length > 0) {
    prompt += `\n\nConversation so far:\n`
    for (const msg of conversation_history) {
      prompt += `\n${msg.role === 'candidate' ? 'Candidate' : 'HR'}: "${msg.text}"`
    }
    prompt += `\n\nThe candidate's latest message:`
  } else {
    prompt += `\n\nA candidate sent you:`
  }

  prompt += `\n\n"${candidate_message}"`

  const ctx = [
    candidate_name ? `Candidate: ${candidate_name}` : '',
    role ? `Role: ${role}` : '',
  ].filter(Boolean).join('. ')
  if (ctx) prompt += `\n\nContext: ${ctx}.`

  prompt += `\n\nAnalyze this message and respond with ONLY a valid JSON object:
{
  "tone": "the candidate's emotional tone — one of: Happy, Excited, Confused, Frustrated, Apologetic, Negotiating, Not Interested, Neutral",
  "intent": "what the candidate wants — one of: Reschedule Request, Salary Discussion, Remote Work, Declining Offer, Accepting Offer, Needs Clarification, Document Query, General Inquiry",
  "reply": "your complete HR reply (escape newlines as \\\\n)"
}

Write a ${tone_preference} ${FORMAT_DESC[format as MessageFormat] ?? 'reply'} that directly addresses what the candidate said.
Be warm, professional, and resolve their concern. Ready to send as-is.

Return ONLY the JSON — no markdown, no code block, no extra text.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    // Strip code fences if Claude added them
    const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    // Increment usage
    const newCount = repliesUsed + 1
    await supabase.from('users').update({ replies_used: newCount }).eq('id', user.id)

    if (profile?.plan === 'free' && newCount === FREE_REPLY_WARNING && user.email) {
      sendLowReplyWarning(user.email, profile?.full_name ?? '', newCount, FREE_REPLY_LIMIT)
        .catch(err => console.error('[reply-to-candidate] warning email failed:', err))
    }

    return NextResponse.json({
      reply_text: parsed.reply ?? '',
      detected_tone: parsed.tone ?? 'Neutral',
      detected_intent: parsed.intent ?? 'General Inquiry',
    })
  } catch (err) {
    console.error('[reply-to-candidate] error:', err)
    return NextResponse.json({ error: 'Failed to generate reply' }, { status: 500 })
  }
}
