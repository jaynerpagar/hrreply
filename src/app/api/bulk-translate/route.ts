import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LANGUAGE_NAMES: Record<string, string> = {
  hindi:    'Hindi (Devanagari script — हिंदी)',
  marathi:  'Marathi (Devanagari script — मराठी)',
  tamil:    'Tamil (Tamil script — தமிழ்)',
  telugu:   'Telugu (Telugu script — తెలుగు)',
  gujarati: 'Gujarati (Gujarati script — ગુજરાતી)',
  bengali:  'Bengali (Bengali script — বাংলা)',
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, targetLanguage = 'hindi' } = await req.json() as {
    messages: string[]
    targetLanguage?: string
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 })
  }
  if (messages.length > 100) {
    return NextResponse.json({ error: 'Max 100 messages per batch' }, { status: 400 })
  }

  const langName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage

  const prompt = `Translate each of the following HR messages to ${langName}.
Keep proper nouns (names, company names, URLs, numbers, dates) as-is.
Return ONLY a valid JSON array with exactly ${messages.length} translated strings, preserving order.
No markdown, no explanations, just the JSON array.

Messages to translate:
${JSON.stringify(messages)}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (response.content[0] as { type: string; text: string }).text.trim()

  let translated: string[]
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    translated = JSON.parse(cleaned)
    if (!Array.isArray(translated) || translated.length !== messages.length) {
      throw new Error('Length mismatch')
    }
  } catch {
    return NextResponse.json({ error: 'Failed to parse translation' }, { status: 500 })
  }

  return NextResponse.json({ translated })
}
