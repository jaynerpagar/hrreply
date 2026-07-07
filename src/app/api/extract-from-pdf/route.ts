import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large — max 10MB' }, { status: 400 })
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [
    { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
    { type: 'text', text: 'Extract and return the full text content of this document. Return only the text, no explanations or formatting.' },
  ]

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return NextResponse.json({ text, filename: file.name })
}
