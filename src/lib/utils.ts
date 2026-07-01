import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const FREE_REPLY_LIMIT = 25

export const TONE_LABELS = {
  formal: 'Formal English',
  friendly: 'Friendly English',
  hinglish: 'Hinglish',
} as const

export const REPLY_TYPE_LABELS = {
  offer: 'Job Offer',
  rejection: 'Rejection (Kind)',
  shortlist: 'Shortlisted',
  interview_invite: 'Interview Invite',
  reschedule: 'Reschedule Interview',
  no_show: 'No Show Follow-up',
  follow_up: 'General Follow-up',
  salary_negotiation: 'Salary Negotiation',
  joining_confirmation: 'Joining Confirmation',
  thank_you: 'Thank You After Interview',
} as const

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
