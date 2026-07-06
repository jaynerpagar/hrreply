import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { sendLowReplyWarning } from '@/lib/email'

const FREE_REPLY_WARNING = 20
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type AutomationType =
  | 'follow_up_sequence'
  | 'interview_reminder'
  | 'thank_you'
  | 'offer_reminder'
  | 'joining_sequence'

const FORMAT_STYLE: Record<string, string> = {
  email:    'a professional email with greeting and sign-off',
  whatsapp: 'a brief WhatsApp message (3-5 lines, conversational)',
  sms:      'a short SMS under 160 characters',
  linkedin: 'a professional LinkedIn message (3-4 sentences)',
}

function formatStyle(f: string) {
  return FORMAT_STYLE[f] ?? 'a professional message'
}

function buildFollowUpPrompt(inputs: Record<string, string>, format: string, tone: string): string {
  const { candidateName, role, originalMessage, daysSince, newInfo } = inputs
  return `You are a senior Indian HR professional. Write a follow-up sequence for a candidate who has not responded.

Candidate: ${candidateName || 'the candidate'}
Role: ${role || 'the position'}
Original message sent: "${originalMessage || 'initial outreach message'}"
Days since no response: ${daysSince || '5'} days
${newInfo ? `New information to mention: ${newInfo}` : ''}
Tone: ${tone === 'formal' ? 'Professional and formal' : 'Warm and friendly'}
Format: ${formatStyle(format)}

Write 3 follow-up messages as a JSON object. Each must be DIFFERENT — different angle, different hook:
- first: Gentle nudge, assume they missed it. Reference their specific background.
- second: New angle or fresh information. Could mention urgency, team news, or role update. Do not repeat the first.
- final: Polite closing. "If this isn't the right time, no worries — happy to reconnect later." Leave door open.

Return ONLY valid JSON — no markdown, no code fences:
{
  "first": "complete message ready to send",
  "second": "complete message ready to send",
  "final": "complete message ready to send"
}`
}

function buildInterviewReminderPrompt(inputs: Record<string, string>, format: string, tone: string): string {
  const { candidateName, role, round, date, time, platform, interviewer, prepTips } = inputs
  return `You are a senior Indian HR professional. Write an interview reminder message.

Candidate: ${candidateName || 'the candidate'}
Role: ${role || 'the position'}
Round: ${round || 'Interview'}
Date: ${date || 'tomorrow'}
Time: ${time || 'as scheduled'}
Platform/Venue: ${platform || 'as communicated'}
${interviewer ? `Interviewer: ${interviewer}` : ''}
${prepTips ? `Prep tips to include: ${prepTips}` : ''}
Tone: ${tone === 'formal' ? 'Professional' : 'Warm and friendly'}
Format: ${formatStyle(format)}

Write a complete reminder message. Include all details naturally. End with wishing them well.
Return ONLY the message text — no JSON, no explanation.`
}

function buildThankYouPrompt(inputs: Record<string, string>, format: string, tone: string): string {
  const { candidateName, role, round, nextSteps, discussed } = inputs
  return `You are a senior Indian HR professional. Write a post-interview thank you message.

Candidate: ${candidateName || 'the candidate'}
Role: ${role || 'the position'}
Round completed: ${round || 'the interview'}
Next steps: ${nextSteps || 'we will get back within 2 working days'}
${discussed ? `What was discussed: ${discussed}` : ''}
Tone: ${tone === 'formal' ? 'Professional' : 'Warm and friendly'}
Format: ${formatStyle(format)}

Write a thank you message that:
1. Thanks them for their time
2. References the round/what was discussed (if provided)
3. Sets clear expectation for next steps
4. Ends warmly

Return ONLY the message text — no JSON, no explanation.`
}

function buildOfferReminderPrompt(inputs: Record<string, string>, format: string, tone: string): string {
  const { candidateName, role, ctc, offerExpiry, joiningDate } = inputs
  return `You are a senior Indian HR professional. Write an offer reminder message.

Candidate: ${candidateName || 'the candidate'}
Role: ${role || 'the position'}
${ctc ? `CTC: ${ctc}` : ''}
Offer expiry: ${offerExpiry || 'tomorrow'}
${joiningDate ? `Proposed joining date: ${joiningDate}` : ''}
Tone: ${tone === 'formal' ? 'Professional' : 'Warm and friendly'}
Format: ${formatStyle(format)}

Write a reminder that:
1. Re-expresses excitement about having them join
2. Mentions the offer expires ${offerExpiry || 'tomorrow'} — create gentle urgency
3. Invites them to reach out if they have questions or need more time
4. Does NOT sound desperate or pushy

Return ONLY the message text — no JSON, no explanation.`
}

function buildJoiningSequencePrompt(inputs: Record<string, string>, format: string, tone: string): string {
  const { candidateName, role, joiningDate, location, manager, department, documents } = inputs
  return `You are a senior Indian HR professional. Write a 3-part joining reminder sequence.

Candidate: ${candidateName || 'the candidate'}
Role: ${role || 'the position'}
Joining date: ${joiningDate || 'the joining date'}
${location ? `Office location: ${location}` : ''}
${manager ? `Reporting manager: ${manager}` : ''}
${department ? `Department: ${department}` : ''}
${documents ? `Documents to bring: ${documents}` : ''}
Tone: ${tone === 'formal' ? 'Professional' : 'Warm and friendly'}
Format: ${formatStyle(format)}

Write 3 messages as a JSON object:
- sevenDay: 7 days before joining. Warm check-in, confirm joining date, preview of onboarding, team intro teaser. Keep excitement high.
- threeDay: 3 days before. Share document checklist, laptop/access setup info, first day schedule overview. Practical and helpful.
- oneDay: Day before joining. Warm "see you tomorrow", exact reporting time and location, who to ask for, any entry/parking info. Short and welcoming.

Return ONLY valid JSON — no markdown, no code fences:
{
  "sevenDay": "complete message",
  "threeDay": "complete message",
  "oneDay": "complete message"
}`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, format = 'whatsapp', tone = 'friendly', ...inputs } = await request.json() as {
    type: AutomationType; format: string; tone: string; [key: string]: string
  }

  if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

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

  const isSequence = type === 'follow_up_sequence' || type === 'joining_sequence'

  const promptBuilders: Record<AutomationType, (i: Record<string, string>, f: string, t: string) => string> = {
    follow_up_sequence:  buildFollowUpPrompt,
    interview_reminder:  buildInterviewReminderPrompt,
    thank_you:           buildThankYouPrompt,
    offer_reminder:      buildOfferReminderPrompt,
    joining_sequence:    buildJoiningSequencePrompt,
  }

  const prompt = promptBuilders[type](inputs, format, tone)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isSequence ? 2000 : 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Increment quota
    const newCount = repliesUsed + 1
    await supabase.from('users').update({ replies_used: newCount }).eq('id', user.id)
    if (profile?.plan === 'free' && newCount === FREE_REPLY_WARNING && user.email) {
      sendLowReplyWarning(user.email, profile?.full_name ?? '', newCount, FREE_REPLY_LIMIT)
        .catch(err => console.error('[automation] warning email failed:', err))
    }

    if (isSequence) {
      const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(jsonStr)
      return NextResponse.json({ result: parsed })
    }

    return NextResponse.json({ result: { message: raw } })
  } catch (err) {
    console.error('[automation] error:', err)
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 })
  }
}
