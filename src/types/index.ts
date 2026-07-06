export type Tone = 'formal' | 'friendly' | 'hinglish'

export type Language =
  | 'english'
  | 'hindi'
  | 'marathi'
  | 'tamil'
  | 'telugu'
  | 'gujarati'
  | 'bengali'

export type MessageFormat = 'email' | 'whatsapp' | 'sms' | 'linkedin' | 'slack' | 'teams'

export type RewriteStyle =
  | 'shorter'
  | 'longer'
  | 'professional'
  | 'friendly'
  | 'polite'
  | 'stronger'
  | 'softer'
  | 'simple'
  | 'corporate'
  | 'startup'

export type ReplyType =
  | 'offer'
  | 'rejection'
  | 'shortlist'
  | 'interview_invite'
  | 'interview_reminder'
  | 'reschedule'
  | 'no_show'
  | 'follow_up'
  | 'salary_negotiation'
  | 'joining_confirmation'
  | 'thank_you'
  | 'document_collection'
  | 'onboarding'
  | 'welcome'
  | 'exit_interview'

export type Plan = 'free' | 'pro' | 'team'

export type CandidateStage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer_sent'
  | 'hired'
  | 'rejected'

export interface User {
  id: string
  email: string
  full_name: string
  default_tone: Tone
  plan: Plan
  replies_used: number
  replies_reset_at: string
  created_at: string
}

export interface Reply {
  id: string
  user_id: string
  candidate_id?: string
  reply_type: ReplyType
  tone: Tone
  context_input: string
  generated_text: string
  created_at: string
}

export interface Candidate {
  id: string
  user_id: string
  name: string
  phone?: string
  role_applied: string
  stage: CandidateStage
  last_contacted_at?: string
  notes?: string
  // Phase 4 enriched fields
  current_company?: string
  skills?: string
  experience?: string
  notice_period?: string
  interview_at?: string
  offer_expiry_at?: string
  joining_at?: string
}

export interface Template {
  id: string
  user_id?: string
  name: string
  reply_type: ReplyType
  tone: Tone
  prompt_snippet: string
  is_system: boolean
}

export interface SubjectLine {
  subject: string
  professional_score: number
  urgency: 'Low' | 'Medium' | 'High'
  open_rate: number
}

export interface CandidateProfile {
  name: string
  currentTitle: string
  currentCompany: string
  experience: string
  skills: string[]
  projects: string[]
  location: string
  noticePeriod: string
  education: string
  email: string
  phone: string
}

export interface JobProfile {
  title: string
  requiredSkills: string[]
  niceToHaveSkills: string[]
  experience: string
  location: string
  remotePolicy: string
  compensation: string
  companyName: string
}

export interface CompanySnapshot {
  industry: string
  size: string
  techStack: string[]
  culture: string
  products: string
}

export interface OutreachMessages {
  email: string
  linkedin: string
  whatsapp: string
  jobPost: string
  referral: string
}
