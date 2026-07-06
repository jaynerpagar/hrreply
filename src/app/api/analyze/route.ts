import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { FREE_REPLY_LIMIT } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert HR communication analyst. Analyze the HR message and return ONLY a valid JSON object — no markdown, no code fences, no explanation.

Return this exact JSON structure:
{
  "grammar": {
    "has_issues": boolean,
    "corrections": [{ "original": "exact phrase", "corrected": "fixed phrase", "reason": "brief reason" }],
    "corrected_text": "full message with all grammar fixes applied"
  },
  "compliance": {
    "issues": [
      {
        "phrase": "exact phrase from message",
        "type": "age_bias" | "gender_bias" | "racial_bias" | "disability_bias" | "illegal_wording" | "risky_promise" | "discriminatory",
        "severity": "high" | "medium" | "low",
        "reason": "brief explanation",
        "suggestion": "safer alternative phrasing"
      }
    ]
  },
  "inclusive": {
    "replacements": [{ "original": "non-inclusive term", "replacement": "inclusive alternative", "reason": "brief reason" }],
    "rewritten_text": "full message with all inclusive replacements applied"
  },
  "readability": {
    "score": number 0-100 (100 = easiest),
    "grade": "Very Easy" | "Easy" | "Fair" | "Difficult" | "Very Difficult",
    "avg_sentence_length": integer,
    "tips": ["tip 1", "tip 2"]
  },
  "professional": {
    "overall_score": number 0-100,
    "professionalism": number 0-100,
    "warmth": number 0-100,
    "confidence": number 0-100,
    "urgency": number 0-100,
    "verdict": "send_ready" | "could_improve" | "needs_revision",
    "verdict_reason": "one sentence"
  }
}

Guidelines:
- Grammar: fix typos, punctuation, tense, awkward phrasing. Be conservative — only flag real issues.
- Compliance: flag age bias (young/energetic/experienced), gender bias, "native speaker" (national origin discrimination), promises that create legal obligations, discriminatory requirements.
- Inclusive language: Chairman→Chairperson, Manpower→Workforce, Mankind→Humankind, Blacklist→Blocklist, Whitelist→Allowlist, Master/Slave→Primary/Secondary, Salesman→Sales Representative, He-or-She binary→They, Guys→Team, Stewardess→Flight Attendant.
- Readability: consider sentence length, jargon, passive voice, complexity. Indian HR context.
- Professional: rate 4 dimensions honestly. urgency = appropriate deadline/motivation awareness.
- If corrected_text or rewritten_text has no changes, return the original text unchanged.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, channel = 'email' } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  // Quota check (free plan only)
  const { data: profile } = await supabase
    .from('users')
    .select('plan, replies_used, replies_reset_at')
    .eq('id', user.id)
    .single()

  let repliesUsed = profile?.replies_used ?? 0
  if (profile?.plan === 'free' && profile?.replies_reset_at) {
    const resetAt = new Date(profile.replies_reset_at)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    if (Date.now() - resetAt.getTime() >= thirtyDaysMs) {
      await supabase.from('users')
        .update({ replies_used: 0, replies_reset_at: new Date().toISOString() })
        .eq('id', user.id)
      repliesUsed = 0
    }
  }

  if (profile?.plan === 'free' && repliesUsed >= FREE_REPLY_LIMIT) {
    return NextResponse.json({ error: 'free_limit_reached' }, { status: 403 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Channel: ${channel}\n\nMessage to analyze:\n\n${text.trim()}`,
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  let analysis
  try {
    // Strip markdown code fences if Claude wraps despite instructions
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    analysis = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 })
  }

  // Increment quota for free users
  if (profile?.plan === 'free') {
    await supabase.from('users')
      .update({ replies_used: repliesUsed + 1 })
      .eq('id', user.id)
  }

  return NextResponse.json({ analysis })
}
