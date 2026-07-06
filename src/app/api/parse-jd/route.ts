import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_PROMPT = `Extract job details from this job description and return ONLY a valid JSON object:
{
  "title": "job title or empty string",
  "requiredSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill1", "skill2"],
  "experience": "e.g. '3-5 years' or '5+ years' or empty string",
  "location": "city or remote or empty string",
  "remotePolicy": "e.g. 'Remote', 'Hybrid', 'On-site', or empty string",
  "compensation": "CTC range or salary range if mentioned, else empty string",
  "companyName": "hiring company name or empty string"
}

Rules:
- requiredSkills: must-have technical skills, tools, languages
- niceToHaveSkills: nice-to-have, preferred, or bonus skills
- Return ONLY the JSON — no markdown, no code fences, no explanation`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Job description text is required' }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${EXTRACT_PROMPT}\n\nJob description:\n${text.slice(0, 8000)}`,
      }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({ job: parsed })
  } catch (err) {
    console.error('[parse-jd] error:', err)
    return NextResponse.json({ error: 'Failed to extract job details' }, { status: 500 })
  }
}
