import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { thread, format = 'email' } = await req.json()
  if (!thread?.trim()) return NextResponse.json({ error: 'Thread is required' }, { status: 400 })

  const prompt = `You are an expert HR communication assistant. Analyse this conversation thread and respond with JSON only.

Thread:
${thread}

Respond with this exact JSON structure (no markdown, no code blocks):
{
  "summary": "2-3 sentence summary of the full thread and current situation",
  "candidateName": "name of the candidate, or empty string if not clear",
  "role": "role/position being discussed, or empty string if not clear",
  "intent": "what the candidate wants or what happened last (1 sentence)",
  "suggestedType": "the most appropriate reply type — must be one of: interview_invite | interview_reminder | shortlist | offer | rejection | reschedule | no_show | follow_up | salary_negotiation | joining_confirmation | thank_you | document_collection | onboarding | welcome | exit_interview",
  "draft": "a complete ready-to-send ${format} reply that HR should send next, based on the full thread context — no subject line needed, just the message body"
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  try {
    const json = JSON.parse(raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim())
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
