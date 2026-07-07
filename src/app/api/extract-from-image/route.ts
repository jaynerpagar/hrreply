import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type SupportedMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, mimeType } = await request.json() as {
    imageBase64: string
    mimeType?: string
  }
  if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const safeMime: SupportedMime = (['image/jpeg','image/png','image/gif','image/webp'] as const)
    .includes(mimeType as SupportedMime)
    ? (mimeType as SupportedMime)
    : 'image/jpeg'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: safeMime, data: imageBase64 },
        },
        {
          type: 'text',
          text: `This is a screenshot of a message or conversation in an HR/recruitment context (WhatsApp, email, SMS, LinkedIn, or any app).

Extract the candidate's message(s) that the HR recruiter needs to reply to. If it is a chat, identify the candidate's most recent message(s). If it is an email screenshot, extract the email body.

Return ONLY the extracted text — exactly what the candidate wrote. No labels, no explanation, no formatting. If multiple sequential candidate messages, separate with a newline.`,
        },
      ],
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return NextResponse.json({ text })
}
