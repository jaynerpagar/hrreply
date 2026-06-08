import { Tone, ReplyType } from '@/types'

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  formal: 'Write in professional, formal English suitable for corporate communication.',
  friendly:
    'Write in warm, friendly English — professional but approachable, like a trusted colleague.',
  hinglish:
    'Write in Hinglish — a natural mix of Hindi and English the way Indian recruiters actually text. Use Roman script for Hindi words (e.g. "aapka interview confirm ho gaya hai"). Keep it warm and conversational.',
}

const REPLY_CONTEXT: Record<ReplyType, string> = {
  offer: 'extending a job offer to a candidate',
  rejection: 'kindly rejecting a candidate while keeping the relationship positive',
  shortlist: 'informing a candidate they have been shortlisted for the next round',
  interview_invite: 'inviting a candidate for an interview with details',
  reschedule: 'rescheduling a previously confirmed interview',
  no_show: 'following up with a candidate who did not show up for their interview',
  follow_up: 'following up on the current status of an application',
  salary_negotiation: 'discussing salary expectations in a professional manner',
  joining_confirmation: 'confirming the candidate\'s joining date and onboarding details',
  thank_you: 'thanking a candidate for attending the interview',
}

export function buildPrompt(
  replyType: ReplyType,
  tone: Tone,
  contextInput: string
): string {
  return `You are an expert Indian HR recruiter assistant. Generate a WhatsApp/email reply message for ${REPLY_CONTEXT[replyType]}.

Tone instruction: ${TONE_INSTRUCTIONS[tone]}

Recruiter's context about the candidate and situation:
${contextInput}

Rules:
- Keep it concise (3-6 sentences max for WhatsApp, slightly longer for email context)
- Do NOT add subject lines unless it's clearly an email
- Do NOT add placeholders like [Name] — use actual details from the context
- Sound natural, not robotic
- For Hinglish: mix naturally, don't force Hindi words where English flows better
- End with a clear next step or call to action

Generate only the message text, nothing else.`
}
