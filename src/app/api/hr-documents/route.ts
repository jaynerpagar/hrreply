import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DOC_INSTRUCTIONS: Record<string, string> = {
  job_description: `Generate a professional Job Description for an Indian company with these sections:
- Job Title (prominent)
- About the Role (2–3 sentences on purpose and impact)
- Key Responsibilities (6–8 bullet points)
- Required Qualifications (education, experience)
- Technical Skills & Competencies (bullet points)
- What We Offer (3–4 highlights)
Make it compelling, specific, and inclusive.`,

  policy: `Generate a formal HR Policy document for an Indian company with these numbered sections:
1. Purpose
2. Scope
3. Policy Statement
4. Detailed Guidelines / Procedures
5. Employee Responsibilities
6. Consequences of Non-Compliance
7. Review & Updates
Make it comprehensive, legally sound, and practical for an Indian workplace.`,

  offer_letter: `Generate a formal Offer Letter for an Indian company in proper business letter format:
- Company letterhead line (if company name provided)
- Date
- Candidate address block
- Subject line
- Appointment details paragraph
- Role, department, reporting structure
- CTC details
- Joining date and location
- Acceptance request
- Professional closing with authorized signatory block`,

  experience_letter: `Generate a formal Experience Letter (Employment Certificate) for an Indian company:
- Date
- To Whom It May Concern
- Subject line
- Confirmation of name, designation, and period of employment
- Note on conduct and contribution
- Best wishes closing
- Authorized signatory with designation and company name`,

  relieving_letter: `Generate a formal Relieving Letter for an Indian company:
- Date, employee details
- Subject: Acceptance of Resignation / Relieving Letter
- Reference to resignation, confirmation of last working day
- Confirmation of handover and clearance of dues
- Best wishes
- Authorized signatory
Warm but professional.`,

  warning_letter: `Generate a formal Warning Letter (Show Cause Notice) for an Indian company:
- Date, employee details
- Subject stating warning level clearly
- Description of the misconduct / violation
- Reference to company policy violated
- Expected corrective action and timeline
- Consequences of recurrence
- Acknowledgment request
- Authorized HR/Management signatory
Firm, factual, professional — not aggressive.`,

  performance_feedback: `Generate a formal Performance Appraisal Letter for an Indian company:
- Date and review period header
- Subject: Performance Review — [Period]
- Overall rating summary
- Key achievements highlighted (specific)
- Areas for development (constructive)
- Next steps / growth plan
- Encouraging forward-looking closing
- HR/Manager signatory
Balanced, constructive, motivating tone.`,

  appreciation_letter: `Generate a formal Appreciation Letter for an Indian company:
- Date, employee details
- Subject: Letter of Appreciation
- Specific achievement and its impact on team/organization
- Recognition of qualities demonstrated
- Encouragement for continued excellence
- Authorized signatory
Warm, genuine, celebratory but professional.`,
}

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company', jobTitle: 'Job Title', candidateName: 'Candidate Name',
  employeeName: 'Employee Name', designation: 'Designation', department: 'Department',
  role: 'Role', experience: 'Experience Required', responsibilities: 'Key Responsibilities',
  skills: 'Skills', location: 'Location', ctcRange: 'CTC Range', ctc: 'CTC Offered',
  joiningDate: 'Joining Date', reportingTo: 'Reporting To', dateOfJoining: 'Date of Joining',
  lastWorkingDay: 'Last Working Day', policyType: 'Policy Type', effectiveDate: 'Effective From',
  additionalGuidelines: 'Guidelines', violation: 'Violation / Issue', incidentDate: 'Incident Date',
  warningLevel: 'Warning Level', reviewPeriod: 'Review Period', rating: 'Performance Rating',
  achievements: 'Key Achievements', improvements: 'Areas for Improvement', achievement: 'Achievement',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docType, fields } = await request.json() as { docType: string; fields: Record<string, string> }
  if (!docType) return NextResponse.json({ error: 'Missing docType' }, { status: 400 })

  const instruction = DOC_INSTRUCTIONS[docType]
  if (!instruction) return NextResponse.json({ error: 'Unknown document type' }, { status: 400 })

  const details = Object.entries(fields)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${v}`)
    .join('\n')

  const prompt = `${instruction}

${details ? `Details provided:\n${details}` : 'Use placeholders for any missing information.'}

Write the complete formal document. Output only the document — no explanations, no markdown code blocks, no preamble.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return NextResponse.json({ content })
}
