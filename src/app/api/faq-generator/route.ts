import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, companyContext } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: 'Question is required' }, { status: 400 })

  const prompt = `You are an HR communication assistant. Write a clear, professional, and friendly answer to this candidate FAQ question.

Company context (use this to personalise the answer):
${companyContext?.trim() || 'Not provided — give a general but helpful answer'}

Candidate question:
${question}

Instructions:
- Write just the answer paragraph(s), no greeting or subject line
- Keep it 3–5 sentences
- Be specific and reassuring
- Use a warm, professional tone suitable for Indian HR context`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const answer = (message.content[0] as { text: string }).text.trim()
  return NextResponse.json({ answer })
}
