import { Tone, ReplyType, Language, MessageFormat, RewriteStyle } from '@/types'

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  formal: 'Write in professional, formal English suitable for corporate communication.',
  friendly: 'Write in warm, friendly English — professional but approachable, like a trusted colleague.',
  hinglish: 'Write in Hinglish — a natural mix of Hindi and English the way Indian recruiters actually text. Use Roman script for Hindi words (e.g. "aapka interview confirm ho gaya hai"). Keep it warm and conversational.',
}

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  english: '',
  hindi: 'Write entirely in Hindi using Devanagari script (हिंदी में लिखें).',
  marathi: 'Write entirely in Marathi using Devanagari script (मराठीत लिहा).',
  tamil: 'Write entirely in Tamil using Tamil script (தமிழில் எழுதுங்கள்).',
  telugu: 'Write entirely in Telugu using Telugu script (తెలుగులో రాయండి).',
  gujarati: 'Write entirely in Gujarati using Gujarati script (ગુજરાતીમાં લખો).',
  bengali: 'Write entirely in Bengali using Bengali script (বাংলায় লিখুন).',
}

const FORMAT_INSTRUCTIONS: Record<MessageFormat, string> = {
  email: 'Write a full email — include a proper greeting, 2-3 body paragraphs, and a professional sign-off. Can be 100-200 words. Do NOT include a subject line.',
  whatsapp: 'Write a WhatsApp message — conversational, concise (3-6 lines max), no formal sign-off needed. One emoji is fine if it feels natural.',
  sms: 'Write an SMS — very short (under 160 characters ideally). No greeting, no sign-off. Just the essential information only.',
  linkedin: 'Write a LinkedIn message — professional, warm, 3-5 sentences max. No subject line. Start with the person\'s name.',
  slack: 'Write a Slack message — casual and direct. Use @name format to address them. 2-4 lines max. Internal team tone.',
  teams: 'Write a Microsoft Teams message — professional but concise. 3-5 lines. Internal communication tone.',
}

const REPLY_CONTEXT: Record<ReplyType, string> = {
  offer: 'extending a job offer to a candidate',
  rejection: 'kindly rejecting a candidate while keeping the relationship positive',
  shortlist: 'informing a candidate they have been shortlisted for the next round',
  interview_invite: 'inviting a candidate for an interview with all relevant details',
  interview_reminder: 'reminding a candidate about their upcoming interview',
  reschedule: 'rescheduling a previously confirmed interview and suggesting a new time',
  no_show: 'following up with a candidate who did not show up for their scheduled interview',
  follow_up: 'following up on the current status of an application or awaiting a response',
  salary_negotiation: 'discussing salary expectations or responding to a counter-offer professionally',
  joining_confirmation: 'confirming the candidate\'s joining date and providing onboarding details',
  thank_you: 'thanking a candidate for attending the interview and sharing next steps',
  document_collection: 'requesting documents required for onboarding or verification',
  onboarding: 'sharing onboarding instructions and first-day details with a new hire',
  welcome: 'warmly welcoming a new team member on their first day or before joining',
  exit_interview: 'inviting a departing employee for an exit interview',
}

const REWRITE_INSTRUCTIONS: Record<RewriteStyle, string> = {
  shorter: 'Make it significantly shorter. Remove all unnecessary words. Keep only the essential information. Cut it by at least 40%.',
  longer: 'Expand it with more warmth, context, and detail. Add a sentence about next steps and a friendly closing. Make it feel more complete.',
  professional: 'Rewrite in a more formal, polished, corporate tone. Use professional vocabulary. Remove casual language.',
  friendly: 'Rewrite in a warmer, more approachable tone. Make it feel like it is from a person, not a company. Add a touch of warmth.',
  polite: 'Rewrite to be softer and more considerate. Add empathetic language. Make it feel more respectful and thoughtful.',
  stronger: 'Rewrite to be more confident and assertive. Use direct, clear language. Remove hedging words like "might", "maybe", "hopefully".',
  softer: 'Rewrite to be gentler and more empathetic. Soften any direct statements. Add understanding and consideration.',
  simple: 'Rewrite in very simple, easy-to-understand English. Use short sentences. Avoid jargon. Anyone should be able to understand it.',
  corporate: 'Rewrite in formal corporate language. Use industry-standard HR terminology. Make it sound like official company communication.',
  startup: 'Rewrite in a modern, startup-friendly tone. Keep it casual, human, and direct. Avoid corporate jargon. Make it feel like a real person wrote it.',
}

export function buildPrompt(
  replyType: ReplyType,
  tone: Tone,
  contextInput: string,
  format: MessageFormat = 'email',
  language: Language = 'english',
): string {
  const toneOrLanguage = language !== 'english'
    ? LANGUAGE_INSTRUCTIONS[language]
    : TONE_INSTRUCTIONS[tone]

  return `You are an expert Indian HR recruiter assistant. Generate a ${FORMAT_LABELS_SHORT[format]} message for ${REPLY_CONTEXT[replyType]}.

Format: ${FORMAT_INSTRUCTIONS[format]}

Language / Tone: ${toneOrLanguage}

Recruiter's context about the candidate and situation:
${contextInput}

Rules:
- Use actual details from the context — do NOT add placeholders like [Name] or [Company]
- Sound natural, not robotic
- Match the format constraints strictly (SMS must be short, email can be longer)
- For Hinglish: mix naturally, don't force Hindi words where English flows better
- End with a clear next step or call to action where appropriate
- Return ONLY the message text. No explanations, no labels, no subject line.`
}

const FORMAT_LABELS_SHORT: Record<MessageFormat, string> = {
  email: 'email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  linkedin: 'LinkedIn',
  slack: 'Slack',
  teams: 'Teams',
}

export function buildRewritePrompt(text: string, style: RewriteStyle): string {
  return `You are an expert writing assistant for HR professionals. Rewrite the following HR message.

Rewrite instruction: ${REWRITE_INSTRUCTIONS[style]}

Original message:
${text}

Important rules:
- Keep the same core information and intent
- Keep the same language (English/Hindi/Hinglish/etc.)
- Only change what is necessary to achieve the requested style
- Return ONLY the rewritten message. No explanations, no labels, nothing else.`
}

export function buildSubjectLinesPrompt(contextInput: string, replyType: ReplyType): string {
  return `You are an expert email marketing specialist for HR professionals. Generate 5 compelling email subject lines for an HR email about ${REPLY_CONTEXT[replyType]}.

Context about the situation:
${contextInput}

For each subject line, provide:
1. The subject line text (keep it under 60 characters)
2. Professional Score from 1-10 (10 = most professional)
3. Urgency Level: Low, Medium, or High
4. Predicted Open Rate as a realistic percentage (20-70 range)

Return ONLY a valid JSON array like this, nothing else:
[
  {"subject": "...", "professional_score": 8, "urgency": "Medium", "open_rate": 42},
  {"subject": "...", "professional_score": 9, "urgency": "Low", "open_rate": 38},
  {"subject": "...", "professional_score": 7, "urgency": "High", "open_rate": 55},
  {"subject": "...", "professional_score": 8, "urgency": "Medium", "open_rate": 45},
  {"subject": "...", "professional_score": 6, "urgency": "Low", "open_rate": 35}
]`
}
