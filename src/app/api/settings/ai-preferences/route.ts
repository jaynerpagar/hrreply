import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, samples } = await request.json() as {
    type: 'brand_voice' | 'personal_style'
    samples: string
  }
  if (!samples?.trim()) return NextResponse.json({ error: 'No samples provided' }, { status: 400 })

  const prompt = type === 'brand_voice'
    ? `Analyze these HR messages/emails from a company and extract their brand voice. Return a concise style guide (under 120 words) capturing: tone/formality level, sentence length patterns, greeting and sign-off style, vocabulary preferences, and any distinctive phrasing. This guide will be injected into an AI prompt to make it write in this style.

Sample messages:
${samples}

Return only the style guide — no preamble, no labels.`
    : `Analyze these HR messages written by a recruiter and extract their personal writing style. Return a concise style guide (under 120 words) capturing: their tone, formality, how they address candidates, sentence structure, sign-off style, and any personal quirks. This guide will be injected into an AI prompt to make it write like them.

Sample messages:
${samples}

Return only the style guide — no preamble, no labels.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const profile = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  const column  = type === 'brand_voice' ? 'brand_voice' : 'personal_style'

  await supabase.from('users').update({ [column]: profile }).eq('id', user.id)
  return NextResponse.json({ profile })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json() as { type: 'brand_voice' | 'personal_style' }
  const column   = type === 'brand_voice' ? 'brand_voice' : 'personal_style'

  await supabase.from('users').update({ [column]: null }).eq('id', user.id)
  return NextResponse.json({ ok: true })
}
