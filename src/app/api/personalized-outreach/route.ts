import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { sendLowReplyWarning } from '@/lib/email'
import type { CandidateProfile, JobProfile, CompanySnapshot } from '@/types'

const FREE_REPLY_WARNING = 20
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildPrompt(
  candidate: Partial<CandidateProfile>,
  job: Partial<JobProfile>,
  company: Partial<CompanySnapshot>,
  tone: string,
): string {
  const candidateParts: string[] = []
  if (candidate.name)        candidateParts.push(`Name: ${candidate.name}`)
  if (candidate.currentTitle && candidate.currentCompany)
    candidateParts.push(`Currently: ${candidate.currentTitle} at ${candidate.currentCompany}`)
  else if (candidate.currentTitle)
    candidateParts.push(`Current role: ${candidate.currentTitle}`)
  if (candidate.experience)  candidateParts.push(`Experience: ${candidate.experience}`)
  if (candidate.skills?.length)
    candidateParts.push(`Key skills: ${candidate.skills.slice(0, 10).join(', ')}`)
  if (candidate.location)    candidateParts.push(`Location: ${candidate.location}`)
  if (candidate.noticePeriod) candidateParts.push(`Notice period: ${candidate.noticePeriod}`)
  if (candidate.projects?.length)
    candidateParts.push(`Notable projects: ${candidate.projects.slice(0, 3).join('; ')}`)

  const jobParts: string[] = []
  if (job.title)               jobParts.push(`Role: ${job.title}`)
  if (job.companyName)         jobParts.push(`Hiring company: ${job.companyName}`)
  if (job.requiredSkills?.length)
    jobParts.push(`Required skills: ${job.requiredSkills.join(', ')}`)
  if (job.niceToHaveSkills?.length)
    jobParts.push(`Nice to have: ${job.niceToHaveSkills.join(', ')}`)
  if (job.experience)          jobParts.push(`Experience needed: ${job.experience}`)
  if (job.location)            jobParts.push(`Location: ${job.location}`)
  if (job.remotePolicy)        jobParts.push(`Work mode: ${job.remotePolicy}`)
  if (job.compensation)        jobParts.push(`Compensation: ${job.compensation}`)

  const companyParts: string[] = []
  if (company.industry)        companyParts.push(`Industry: ${company.industry}`)
  if (company.size)            companyParts.push(`Size: ${company.size}`)
  if (company.techStack?.length)
    companyParts.push(`Tech stack: ${company.techStack.join(', ')}`)
  if (company.culture)         companyParts.push(`Culture: ${company.culture}`)
  if (company.products)        companyParts.push(`What they do: ${company.products}`)

  const candidateName = candidate.name?.split(' ')[0] || 'the candidate'

  return `You are an expert senior recruiter in India. Write personalized outreach messages for ${candidateName}.

CANDIDATE PROFILE:
${candidateParts.length ? candidateParts.join('\n') : 'No candidate details provided'}

JOB ROLE:
${jobParts.length ? jobParts.join('\n') : 'No job details provided'}

${companyParts.length ? `COMPANY CONTEXT:\n${companyParts.join('\n')}` : ''}

TONE: ${tone === 'formal' ? 'Professional and formal' : 'Warm, conversational, friendly'}

CRITICAL RULES — these are non-negotiable:
1. Reference the candidate's SPECIFIC skills, company, and experience — never say "your profile" or "your background"
2. Show how their specific skills match the role's requirements
3. Each message must fit its channel's natural style and length
4. Sound like a real person wrote it, not a template
5. Use Indian context where appropriate (CTC in LPA if compensation mentioned, etc.)

Return ONLY a valid JSON object — no markdown, no code fences:
{
  "email": "Complete email with Subject line on first line (format: 'Subject: ...\\n\\n'), then body with greeting and sign-off. 150-250 words.",
  "linkedin": "Short LinkedIn InMail or connection message. No greeting/sign-off formality. 3-5 sentences. Reference one specific skill or achievement. End with a clear question or CTA.",
  "whatsapp": "Casual WhatsApp message. 3-5 lines. Conversational. Mention their specific skill or experience. End with a question.",
  "jobPost": "A formatted job post for LinkedIn or Naukri. Include: Role title, About the role (2-3 lines), Key responsibilities (4-5 bullet points), Requirements (skills, experience, from the JD), What we offer, How to apply (email or link placeholder). 200-300 words.",
  "referral": "An internal referral message to forward in WhatsApp/Slack to colleagues. 'Hey team, we are hiring for X role. Looking for someone with Y skills. If you know anyone, please share their resume on Z. Referral bonus applicable.' 3-5 sentences."
}`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidate, job, company, tone = 'friendly' } = await request.json()

  // Must have at least some candidate or job info
  const hasCandidate = candidate && (candidate.name || candidate.skills?.length || candidate.currentTitle)
  const hasJob = job && (job.title || job.requiredSkills?.length)
  if (!hasCandidate && !hasJob) {
    return NextResponse.json({ error: 'Provide at least candidate or job details' }, { status: 400 })
  }

  // Quota check
  const { data: profile } = await supabase
    .from('users')
    .select('plan, replies_used, replies_reset_at, email, full_name')
    .eq('id', user.id)
    .single()

  let repliesUsed = profile?.replies_used ?? 0
  if (profile?.plan === 'free' && profile?.replies_reset_at) {
    const resetAt = new Date(profile.replies_reset_at)
    if (Date.now() - resetAt.getTime() >= 30 * 24 * 60 * 60 * 1000) {
      await supabase.from('users').update({ replies_used: 0, replies_reset_at: new Date().toISOString() }).eq('id', user.id)
      repliesUsed = 0
    }
  }
  if (profile?.plan === 'free' && repliesUsed >= FREE_REPLY_LIMIT) {
    return NextResponse.json({ error: 'free_limit_reached' }, { status: 403 })
  }

  try {
    const prompt = buildPrompt(candidate ?? {}, job ?? {}, company ?? {}, tone)
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    // Increment quota
    const newCount = repliesUsed + 1
    await supabase.from('users').update({ replies_used: newCount }).eq('id', user.id)

    if (profile?.plan === 'free' && newCount === FREE_REPLY_WARNING && user.email) {
      sendLowReplyWarning(user.email, profile?.full_name ?? '', newCount, FREE_REPLY_LIMIT)
        .catch(err => console.error('[personalized-outreach] warning email failed:', err))
    }

    return NextResponse.json({
      outreach: {
        email:    parsed.email    ?? '',
        linkedin: parsed.linkedin ?? '',
        whatsapp: parsed.whatsapp ?? '',
        jobPost:  parsed.jobPost  ?? '',
        referral: parsed.referral ?? '',
      }
    })
  } catch (err) {
    console.error('[personalized-outreach] error:', err)
    return NextResponse.json({ error: 'Failed to generate outreach' }, { status: 500 })
  }
}
