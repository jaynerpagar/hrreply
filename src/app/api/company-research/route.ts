import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { company } = await request.json()
  if (!company?.trim()) return NextResponse.json({ error: 'Company name is required' }, { status: 400 })

  const prompt = `You are a company research assistant for Indian HR professionals.

Research the company "${company}" and return ONLY a valid JSON object:
{
  "industry": "primary industry/sector e.g. 'Fintech', 'EdTech', 'E-commerce', 'IT Services'",
  "size": "company size e.g. 'Startup (< 50)', 'SME (50-500)', 'Mid-size (500-2000)', 'Large enterprise (2000+)'",
  "techStack": ["technology1", "technology2"],
  "culture": "2-3 sentence culture summary — pace, values, working style",
  "products": "what they build or sell, 1-2 sentences"
}

Rules:
- Use your training knowledge about this company
- If the company is not well-known or you have limited information, make reasonable inferences from the name/context and mark uncertain fields with a "~" prefix
- techStack: list known or likely technologies (programming languages, frameworks, cloud platforms, tools)
- Focus on Indian context where relevant (Bangalore, Mumbai, Pune offices; Indian HR practices)
- Return ONLY the JSON — no markdown, no code fences, no explanation`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({ snapshot: parsed })
  } catch (err) {
    console.error('[company-research] error:', err)
    return NextResponse.json({ error: 'Failed to research company' }, { status: 500 })
  }
}
