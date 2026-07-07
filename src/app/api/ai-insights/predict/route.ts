import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidate = await request.json()

  const refDate = candidate.last_contacted_at ?? candidate.created_at
  const daysSinceContact = Math.floor(
    (Date.now() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const prompt = `You are an expert HR analyst. Analyze this candidate profile and return engagement predictions.

Candidate: ${candidate.name}
Role: ${candidate.role_applied}
Stage: ${candidate.stage}
Experience: ${candidate.experience ?? 'unknown'}
Skills: ${candidate.skills ?? 'not specified'}
Current company: ${candidate.current_company ?? 'unknown'}
Notice period: ${candidate.notice_period ?? 'unknown'}
Days since last contact: ${daysSinceContact}
Notes: ${candidate.notes ?? 'none'}${candidate.interview_at ? `\nInterview scheduled: ${candidate.interview_at}` : ''}${candidate.offer_expiry_at ? `\nOffer expiry: ${candidate.offer_expiry_at}` : ''}

Return ONLY a JSON object (no markdown, no explanation):
{
  "interest_level": "high" | "medium" | "low",
  "interest_reason": "<one sentence>",
  "ghosting_risk": "high" | "medium" | "low",
  "ghosting_reason": "<one sentence>",
  "joining_probability": <number 0-100 or null>,
  "joining_reason": "<one sentence or null>"
}

Guidelines:
- interest_level: high=recently active/responsive, medium=inconsistent engagement, low=stale or minimal contact
- ghosting_risk: high=5+ days no contact + active stage, medium=3-4 days, low=recently contacted
- joining_probability: only for offer_sent stage (factor in notice period, offer expiry, competition); null for other stages`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  try {
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to parse prediction' }, { status: 500 })
  }
}
