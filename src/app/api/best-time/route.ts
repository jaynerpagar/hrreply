import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel, messageType, industry } = await req.json()

  const prompt = `You are an HR communication expert. Recommend the best time to send an HR message.

Context:
- Channel: ${channel ?? 'email'}
- Message type: ${messageType ?? 'general HR message'}
- Industry: ${industry ?? 'general'}

Return ONLY valid JSON (no markdown):
{
  "slots": [
    { "time": "e.g. Tuesday 10–11 AM", "score": 92, "reason": "brief reason" },
    { "time": "e.g. Thursday 9–10 AM", "score": 78, "reason": "brief reason" },
    { "time": "e.g. Wednesday 6–7 PM", "score": 65, "reason": "brief reason" }
  ],
  "avoid": ["time to avoid with reason", "another time to avoid"],
  "tip": "one practical tip specific to this message type and channel"
}

Return exactly 3 slots ordered best to worst. Score is 0-100. Be specific to Indian work culture.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const result = JSON.parse(cleaned)
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ error: 'Failed to parse result' }, { status: 500 })
  }
}
