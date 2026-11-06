import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { enforceAiRateLimit } from '@/lib/rate-limit'

const MAX_MESSAGES = 40
const MAX_MESSAGE_CHARS = 8000

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are HRReply AI — a senior HR advisor for Indian HR professionals and recruiters.

You help with:
- Candidate communication (emails, WhatsApp, LinkedIn messages)
- Handling difficult situations: ghosting, counter-offers, salary negotiation, no-shows
- Interview scheduling and coordination
- Offer management, joining formalities, onboarding
- Professional advice aligned with Indian corporate HR practices

How to respond:
- Be direct and practical. Give actionable advice, not theory.
- When asked for a message/email template, write it fully — ready to copy-paste.
- Format templates with clear labels (Subject:, Body:) when relevant.
- Keep responses concise. One example is better than three paragraphs.
- Use Indian context: CTC, LPA, notice period, Aadhaar, PF, ESIC when relevant.
- If asked something outside HR/recruitment, politely redirect.

You are NOT a general-purpose AI. Every response stays in the HR and recruitment domain.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await enforceAiRateLimit(user.id)
  if (limited) return limited

  const { messages } = await request.json()
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 })
  }
  // Bound conversation size and only allow user/assistant turns with string content.
  if (
    messages.length > MAX_MESSAGES ||
    !messages.every((m: unknown) => {
      const msg = m as { role?: unknown; content?: unknown }
      return (msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string' && msg.content.length > 0 && msg.content.length <= MAX_MESSAGE_CHARS
    })
  ) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ message: text })
  } catch (err) {
    console.error('[copilot] error:', err)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
