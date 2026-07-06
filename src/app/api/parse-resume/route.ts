import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_PROMPT = `Extract candidate information from this resume and return ONLY a valid JSON object with these exact fields:
{
  "name": "full name or empty string",
  "currentTitle": "current job title or empty string",
  "currentCompany": "current employer name or empty string",
  "experience": "e.g. '5 years' or '3-5 years' or empty string",
  "skills": ["skill1", "skill2"],
  "projects": ["brief project description 1", "brief project description 2"],
  "location": "city or city, state or empty string",
  "noticePeriod": "e.g. '30 days', 'Immediate', '2 months' or empty string",
  "education": "highest degree and institution or empty string",
  "email": "email address or empty string",
  "phone": "phone number or empty string"
}

Rules:
- skills: extract all technical skills, tools, frameworks, and programming languages mentioned
- projects: include at most 4 most significant projects with very brief descriptions (max 15 words each)
- experience: calculate total years from work history if not explicitly stated
- Return ONLY the JSON object — no markdown, no explanation, no code fences`

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

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large — max 10MB' }, { status: 400 })
  }

  const name = file.name.toLowerCase()
  const isPdf  = name.endsWith('.pdf')
  const isDocx = name.endsWith('.docx') || name.endsWith('.doc')

  if (!isPdf && !isDocx) {
    return NextResponse.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    let raw = ''

    if (isPdf) {
      const base64 = buffer.toString('base64')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content: any[] = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: EXTRACT_PROMPT },
      ]
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      })
      raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    } else {
      const mammoth = (await import('mammoth')).default
      const { value: text } = await mammoth.extractRawText({ buffer })
      if (!text.trim()) return NextResponse.json({ error: 'Could not read DOCX file' }, { status: 422 })

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `${EXTRACT_PROMPT}\n\nResume text:\n${text.slice(0, 8000)}`,
        }],
      })
      raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    }

    const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({ profile: parsed })
  } catch (err) {
    console.error('[parse-resume] error:', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
