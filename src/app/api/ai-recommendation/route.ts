import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role } = await req.json()
  if (!role?.trim()) return NextResponse.json({ error: 'role is required' }, { status: 400 })

  const prompt = `You are an HR communication expert. A recruiter is hiring for the role: "${role.trim()}"

Based on this role, recommend the best HR communication approach. Return ONLY valid JSON (no markdown):

{
  "templates": [
    {
      "name": "template name from this list: Interview Invite — Email, Job Offer — Email, Rejection — Email, Shortlisted — WhatsApp, Interview Invite — WhatsApp, Job Offer — WhatsApp",
      "reason": "one sentence why this works for this role",
      "priority": 1
    }
  ],
  "tone": "formal" | "friendly",
  "tone_reason": "one sentence",
  "channel": "email" | "whatsapp",
  "channel_reason": "one sentence",
  "timing_tip": "one practical tip about when to reach out for this role type",
  "personalization_tip": "one specific thing to mention in the message for this role"
}

Return exactly 3 templates ordered by priority (1 = most important). Be specific and practical.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const recommendation = JSON.parse(cleaned)
    return NextResponse.json({ recommendation })
  } catch {
    return NextResponse.json({ error: 'Failed to parse recommendation' }, { status: 500 })
  }
}
