import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildRewritePrompt } from '@/lib/prompts'
import { RewriteStyle } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, style } = await request.json() as { text: string; style: RewriteStyle }

  if (!text?.trim() || !style) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: buildRewritePrompt(text, style) }],
  })

  const rewritten_text = (message.content[0] as { type: string; text: string }).text
  return NextResponse.json({ rewritten_text })
}
