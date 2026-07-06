import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildSubjectLinesPrompt } from '@/lib/prompts'
import { ReplyType } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { context_input, reply_type } = await request.json() as {
    context_input: string
    reply_type: ReplyType
  }

  if (!context_input?.trim() || !reply_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: buildSubjectLinesPrompt(context_input, reply_type) }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  try {
    const subject_lines = JSON.parse(raw)
    return NextResponse.json({ subject_lines })
  } catch {
    return NextResponse.json({ error: 'Failed to parse subject lines' }, { status: 500 })
  }
}
