import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_PROMPT = `Extract candidate information from this LinkedIn profile text and return ONLY a valid JSON object:
{
  "name": "full name or empty string",
  "currentTitle": "current job title or empty string",
  "currentCompany": "current employer or empty string",
  "experience": "total years of experience e.g. '5 years' or empty string",
  "skills": ["skill1", "skill2"],
  "projects": ["brief project description 1"],
  "location": "location or empty string",
  "noticePeriod": "if mentioned, else empty string",
  "education": "highest degree and institution or empty string",
  "email": "if visible, else empty string",
  "phone": "if visible, else empty string"
}

Rules:
- skills: extract all listed skills, tools, and technologies
- experience: estimate from job history dates if not stated
- Return ONLY the JSON — no markdown, no code fences, no explanation`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'LinkedIn profile text is required' }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${EXTRACT_PROMPT}\n\nLinkedIn profile text:\n${text.slice(0, 8000)}`,
      }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({ profile: parsed })
  } catch (err) {
    console.error('[parse-linkedin] error:', err)
    return NextResponse.json({ error: 'Failed to extract profile' }, { status: 500 })
  }
}
