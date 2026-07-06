import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Language, MessageFormat, RewriteStyle } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const FREE_REPLY_LIMIT = 25

export const TONE_LABELS = {
  formal: 'Formal',
  friendly: 'Friendly',
  hinglish: 'Hinglish',
} as const

export const REPLY_TYPE_LABELS = {
  offer: 'Job Offer',
  rejection: 'Rejection',
  shortlist: 'Shortlisted',
  interview_invite: 'Interview Invite',
  interview_reminder: 'Interview Reminder',
  reschedule: 'Reschedule',
  no_show: 'No Show',
  follow_up: 'Follow-up',
  salary_negotiation: 'Salary Negotiation',
  joining_confirmation: 'Joining Confirmation',
  thank_you: 'Post-Interview Thanks',
  document_collection: 'Document Request',
  onboarding: 'Onboarding',
  welcome: 'Welcome',
  exit_interview: 'Exit Interview',
} as const

export const LANGUAGE_LABELS: Record<Language, string> = {
  english: 'English',
  hindi: 'हिंदी',
  marathi: 'मराठी',
  tamil: 'தமிழ்',
  telugu: 'తెలుగు',
  gujarati: 'ગુજરાતી',
  bengali: 'বাংলা',
}

export const FORMAT_LABELS: Record<MessageFormat, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  linkedin: 'LinkedIn',
  slack: 'Slack',
  teams: 'Teams',
}

export const REWRITE_LABELS: Record<RewriteStyle, string> = {
  shorter: 'Shorter',
  longer: 'Longer',
  professional: 'More Professional',
  friendly: 'Friendlier',
  polite: 'More Polite',
  stronger: 'Stronger',
  softer: 'Softer',
  simple: 'Simple English',
  corporate: 'Corporate',
  startup: 'Startup Style',
}

export const STAGE_LABELS = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  offer_sent: 'Offer Sent',
  hired: 'Hired',
  rejected: 'Rejected',
} as const
