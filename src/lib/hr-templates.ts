export type TemplateCategory =
  | 'hiring' | 'payroll' | 'leave' | 'appraisal' | 'performance'
  | 'promotion' | 'termination' | 'policy' | 'attendance'
  | 'birthday' | 'festival' | 'compliance' | 'exit'

export type TemplateChannel = 'email' | 'whatsapp' | 'sms'

export interface HRTemplate {
  id: string
  category: TemplateCategory
  name: string
  channel: TemplateChannel
  tone: 'formal' | 'friendly'
  subject?: string
  body: string
}

export const CATEGORY_META: Record<TemplateCategory, { label: string; emoji: string; description: string }> = {
  hiring:      { label: 'Hiring',       emoji: '🎯', description: 'Offers, rejections, interviews, onboarding' },
  payroll:     { label: 'Payroll',      emoji: '💰', description: 'Salary slips, revisions, bonuses' },
  leave:       { label: 'Leave',        emoji: '🏖️', description: 'Approvals, rejections, balance reminders' },
  appraisal:   { label: 'Appraisal',   emoji: '📊', description: 'Review cycles, KRA setting, increment letters' },
  performance: { label: 'Performance', emoji: '⚡', description: 'PIPs, warnings, appreciation' },
  promotion:   { label: 'Promotion',   emoji: '🚀', description: 'Promotion letters, team announcements' },
  termination: { label: 'Termination', emoji: '📋', description: 'Resignations, notice periods, LWD' },
  policy:      { label: 'Policy',      emoji: '📜', description: 'WFH, IT, expense, conduct policies' },
  attendance:  { label: 'Attendance',  emoji: '🕐', description: 'Warnings, regularization, biometrics' },
  birthday:    { label: 'Birthday',    emoji: '🎂', description: 'Wishes and work anniversary messages' },
  festival:    { label: 'Festival',    emoji: '🎉', description: 'Diwali, Eid, Christmas, Holi, New Year' },
  compliance:  { label: 'Compliance',  emoji: '🔒', description: 'KYC, POSH, PF/ESIC, document reminders' },
  exit:        { label: 'Exit',        emoji: '🚪', description: 'Offboarding, experience letter, F&F' },
}

export const HR_TEMPLATES: HRTemplate[] = [

  // ── HIRING ─────────────────────────────────────────────────────────────

  {
    id: 'hiring-interview-invite-email',
    category: 'hiring', channel: 'email', tone: 'formal',
    name: 'Interview Invite — Email',
    subject: 'Interview Invitation — {{role}} at {{company}}',
    body: `Dear {{candidate_name}},

Thank you for applying for the {{role}} position at {{company}}.

We are pleased to invite you for an interview. Below are the details:

📅 Date: {{date}}
⏰ Time: {{time}}
📍 Mode: {{platform}} (link/venue will be shared separately)
🗣️ Round: {{round}}
👤 Interviewer: {{interviewer}}

Please confirm your availability by replying to this email. If you need to reschedule, kindly let us know at least 24 hours in advance.

We look forward to speaking with you.

Warm regards,
{{hr_name}}
{{company}}`,
  },

  {
    id: 'hiring-interview-invite-whatsapp',
    category: 'hiring', channel: 'whatsapp', tone: 'friendly',
    name: 'Interview Invite — WhatsApp',
    body: `Hi {{candidate_name}} 👋

Great news! We'd love to have you interview for the *{{role}}* role at {{company}}.

🗓 *Date:* {{date}}
⏰ *Time:* {{time}}
📍 *Mode:* {{platform}}
🔁 *Round:* {{round}}

Please confirm if this works for you. Let me know if you need to reschedule.

Looking forward to connecting! 😊`,
  },

  {
    id: 'hiring-offer-letter-email',
    category: 'hiring', channel: 'email', tone: 'formal',
    name: 'Job Offer Letter — Email',
    subject: 'Offer of Employment — {{role}} at {{company}}',
    body: `Dear {{candidate_name}},

We are delighted to offer you the position of *{{role}}* at {{company}}.

Here is a summary of your offer:

- **Designation:** {{role}}
- **Department:** {{department}}
- **CTC:** {{ctc}} per annum
- **Proposed Joining Date:** {{joining_date}}
- **Reporting To:** {{reporting_manager}}
- **Work Location:** {{location}}

Kindly revert with your acceptance by {{offer_expiry_date}}. The formal offer letter and appointment documents will be shared upon your acceptance.

We are excited to have you on board and look forward to your positive response.

Warm regards,
{{hr_name}}
{{company}}`,
  },

  {
    id: 'hiring-offer-whatsapp',
    category: 'hiring', channel: 'whatsapp', tone: 'friendly',
    name: 'Job Offer — WhatsApp',
    body: `Hi {{candidate_name}}! 🎉

Congratulations! We are thrilled to offer you the *{{role}}* position at {{company}}.

💼 *CTC:* {{ctc}} per annum
📅 *Joining Date:* {{joining_date}}
📍 *Location:* {{location}}

Please share your confirmation by *{{offer_expiry_date}}*. The formal documents will follow.

Welcome to the team! 🙌`,
  },

  {
    id: 'hiring-rejection-email',
    category: 'hiring', channel: 'email', tone: 'formal',
    name: 'Rejection — Email (Formal)',
    subject: 'Application Update — {{role}} at {{company}}',
    body: `Dear {{candidate_name}},

Thank you for taking the time to interview for the {{role}} position at {{company}} and for your interest in joining our team.

After careful consideration, we have decided to move forward with another candidate whose experience more closely aligns with our current requirements.

We genuinely appreciate the effort you put into the process and encourage you to apply for future openings that may be a better fit. We will keep your profile on record.

We wish you all the best in your career journey.

Warm regards,
{{hr_name}}
{{company}}`,
  },

  {
    id: 'hiring-rejection-friendly',
    category: 'hiring', channel: 'whatsapp', tone: 'friendly',
    name: 'Rejection — WhatsApp (Warm)',
    body: `Hi {{candidate_name}},

Thank you so much for interviewing with us for the *{{role}}* role. It was genuinely great to learn about your background.

After careful thought, we've decided to move ahead with a different candidate this time — it was a close call.

We'd love to stay connected and consider you for future opportunities. We'll keep your profile and reach out when something fitting comes up.

Wishing you all the best! 🙏`,
  },

  {
    id: 'hiring-shortlisted-whatsapp',
    category: 'hiring', channel: 'whatsapp', tone: 'friendly',
    name: 'Shortlisted — WhatsApp',
    body: `Hi {{candidate_name}}! 🎉

Great news! You have been *shortlisted* for the *{{role}}* position at {{company}}.

The next step is a {{round}} interview. We'll share the details shortly.

Please keep your schedule free around {{tentative_date}}. Let us know if you have any questions!`,
  },

  {
    id: 'hiring-document-collection-email',
    category: 'hiring', channel: 'email', tone: 'formal',
    name: 'Document Collection — Email',
    subject: 'Documents Required for Joining — {{candidate_name}}',
    body: `Dear {{candidate_name}},

Congratulations on your upcoming joining at {{company}} on {{joining_date}}!

Please submit the following documents before or on your joining date:

1. Aadhaar Card (original + 2 copies)
2. PAN Card (original + 2 copies)
3. Passport-size photographs (4 copies)
4. Last 3 months' salary slips
5. Relieving letter from your previous employer
6. Experience letters from all previous employers
7. Educational certificates (10th, 12th, degree)
8. Bank account details / cancelled cheque
{{additional_documents}}

Documents can be submitted physically on the joining date or sent to {{hr_email}} in advance.

Please reach out if you need any clarification.

Regards,
{{hr_name}}
{{company}}`,
  },

  // ── PAYROLL ──────────────────────────────────────────────────────────────

  {
    id: 'payroll-salary-slip-email',
    category: 'payroll', channel: 'email', tone: 'formal',
    name: 'Salary Slip Notification',
    subject: 'Your Salary Slip for {{month}} {{year}}',
    body: `Dear {{employee_name}},

Your salary for the month of *{{month}} {{year}}* has been processed.

💰 **Net Pay:** ₹{{net_salary}}
📅 **Credit Date:** {{credit_date}}
🏦 **Account:** XXXX{{last_4_digits}}

Your detailed salary slip is attached to this email. Please review it and reach out to HR/Finance if you notice any discrepancy.

Regards,
{{hr_name}}
HR & Payroll Team, {{company}}`,
  },

  {
    id: 'payroll-salary-revision-email',
    category: 'payroll', channel: 'email', tone: 'formal',
    name: 'Salary Revision Letter',
    subject: 'Salary Revision — Effective {{effective_date}}',
    body: `Dear {{employee_name}},

We are pleased to inform you that your compensation has been revised as follows:

| | Current | Revised |
|---|---|---|
| **CTC** | ₹{{current_ctc}} | ₹{{revised_ctc}} |
| **Effective Date** | — | {{effective_date}} |

This revision reflects our appreciation for your contribution and performance at {{company}}.

The revised salary will reflect in your {{effective_month}} salary credit. An updated appointment letter will be shared with you shortly.

Congratulations and thank you for your continued commitment.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'payroll-bonus-whatsapp',
    category: 'payroll', channel: 'whatsapp', tone: 'friendly',
    name: 'Bonus Announcement — WhatsApp',
    body: `Hi {{employee_name}}! 🎉

Great news! As a token of appreciation for your hard work, {{company}} is pleased to credit a *{{bonus_type}} bonus* of *₹{{bonus_amount}}* to your account.

💳 This will be credited by *{{credit_date}}*.

Thank you for your outstanding contribution to the team. Keep up the fantastic work! 🙌

— {{hr_name}}, HR Team`,
  },

  {
    id: 'payroll-salary-hold-email',
    category: 'payroll', channel: 'email', tone: 'formal',
    name: 'Salary Hold Notice',
    subject: 'Salary Processing — Pending Document Submission',
    body: `Dear {{employee_name}},

We regret to inform you that your salary for {{month}} has been put on hold due to pending submission of the following:

- {{pending_item_1}}
- {{pending_item_2}}

Request you to submit the required documents/information by {{deadline_date}} to avoid further delay. Once received, your salary will be processed within {{processing_days}} working days.

Please contact the HR team at {{hr_email}} or {{hr_phone}} for any queries.

Regards,
{{hr_name}}
HR & Payroll Team, {{company}}`,
  },

  {
    id: 'payroll-reimbursement-email',
    category: 'payroll', channel: 'email', tone: 'formal',
    name: 'Reimbursement Approval',
    subject: 'Reimbursement Approved — ₹{{amount}}',
    body: `Dear {{employee_name}},

Your reimbursement claim for *₹{{amount}}* submitted on {{submission_date}} for *{{expense_type}}* has been approved.

The amount will be credited to your salary account in the *{{credit_cycle}}* payroll cycle.

If you have any questions, please reach out to the Finance team.

Regards,
{{hr_name}}
HR & Finance Team, {{company}}`,
  },

  {
    id: 'payroll-delay-notice-email',
    category: 'payroll', channel: 'email', tone: 'formal',
    name: 'Payroll Processing Delay Notice',
    subject: 'Salary Credit Delay — {{month}}',
    body: `Dear Team,

Please note that due to {{reason}}, the salary for the month of {{month}} will be credited by *{{revised_date}}* instead of the usual date.

We sincerely apologize for the inconvenience. Salaries will be processed at the earliest, and you will be notified once credited.

For any urgent concerns, please write to {{hr_email}}.

Regards,
{{hr_name}}
HR & Finance Team, {{company}}`,
  },

  // ── LEAVE ───────────────────────────────────────────────────────────────

  {
    id: 'leave-approval-email',
    category: 'leave', channel: 'email', tone: 'formal',
    name: 'Leave Approval — Email',
    subject: 'Leave Approved — {{leave_from}} to {{leave_to}}',
    body: `Dear {{employee_name}},

Your leave request has been approved. Below are the details:

- **Leave Type:** {{leave_type}}
- **From:** {{leave_from}}
- **To:** {{leave_to}}
- **No. of Days:** {{leave_days}}
- **Reason:** {{reason}}

Please ensure your work is properly handed over before you leave. In case of any urgent requirement, you may be contacted on your registered number.

Enjoy your time off! 🌟

Regards,
{{manager_name}} / {{hr_name}}
{{company}}`,
  },

  {
    id: 'leave-approval-whatsapp',
    category: 'leave', channel: 'whatsapp', tone: 'friendly',
    name: 'Leave Approval — WhatsApp',
    body: `Hi {{employee_name}} 👋

Your leave from *{{leave_from}}* to *{{leave_to}}* ({{leave_days}} day(s)) has been *approved* ✅

Please ensure handover before you leave. Enjoy your break! 🏖️

— {{manager_name}}`,
  },

  {
    id: 'leave-rejection-email',
    category: 'leave', channel: 'email', tone: 'formal',
    name: 'Leave Rejection — Email',
    subject: 'Leave Request — Not Approved',
    body: `Dear {{employee_name}},

We have reviewed your leave request for {{leave_from}} to {{leave_to}}.

Unfortunately, we are unable to approve it at this time due to *{{reason}}*.

We request you to reconsider the dates or discuss an alternative plan with your manager. If the matter is urgent, please reach out to {{hr_name}} directly.

We understand this may be inconvenient and appreciate your understanding.

Regards,
{{manager_name}} / {{hr_name}}
{{company}}`,
  },

  {
    id: 'leave-balance-reminder-email',
    category: 'leave', channel: 'email', tone: 'friendly',
    name: 'Leave Balance Reminder',
    subject: 'Your Leave Balance — {{year}}',
    body: `Hi {{employee_name}},

Here's a quick update on your leave balance for {{year}}:

| Leave Type      | Entitled | Used | Balance |
|-----------------|----------|------|---------|
| Earned Leave    | {{el_entitled}} | {{el_used}} | {{el_balance}} |
| Casual Leave    | {{cl_entitled}} | {{cl_used}} | {{cl_balance}} |
| Sick Leave      | {{sl_entitled}} | {{sl_used}} | {{sl_balance}} |

📅 The leave year ends on {{year_end_date}}. Unused {{lapse_type}} leave may lapse if not availed.

Please plan accordingly. Reach out to HR for any queries.

Regards,
{{hr_name}}
HR Team, {{company}}`,
  },

  {
    id: 'leave-wfh-approval-whatsapp',
    category: 'leave', channel: 'whatsapp', tone: 'friendly',
    name: 'Work From Home Approval — WhatsApp',
    body: `Hi {{employee_name}} 👋

Your Work From Home request for *{{wfh_date}}* has been *approved* ✅

Please be available on calls/messages during work hours and ensure no work disruption.

Have a productive day! 💻

— {{manager_name}}`,
  },

  {
    id: 'leave-lop-notice-email',
    category: 'leave', channel: 'email', tone: 'formal',
    name: 'Loss of Pay (LOP) Notice',
    subject: 'Loss of Pay Notice — {{month}}',
    body: `Dear {{employee_name}},

This is to inform you that {{lop_days}} day(s) of Loss of Pay (LOP) have been applied for the month of {{month}} due to:

- {{reason}}

The corresponding deduction of *₹{{deduction_amount}}* will be reflected in your {{month}} salary.

If you believe this is incorrect, please reach out to HR within 3 working days.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  // ── APPRAISAL ────────────────────────────────────────────────────────────

  {
    id: 'appraisal-cycle-announcement-email',
    category: 'appraisal', channel: 'email', tone: 'formal',
    name: 'Appraisal Cycle Announcement',
    subject: 'Performance Appraisal Cycle {{year}} — Announcement',
    body: `Dear Team,

We are pleased to announce the commencement of the Annual Performance Appraisal Cycle for {{year}}.

**Key Dates:**
- Self-Appraisal Submission: {{self_appraisal_deadline}}
- Manager Review: {{manager_review_deadline}}
- HR Discussion: {{hr_discussion_date}}
- Increment Effective Date: {{increment_date}}

**Process:**
1. Complete your self-appraisal on {{appraisal_tool}}
2. Have a one-on-one discussion with your manager
3. HR team will consolidate and share final outcomes

Your contributions and achievements over {{appraisal_period}} will be evaluated. We encourage honest and detailed self-assessments.

For any queries, please reach out to {{hr_email}}.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'appraisal-self-appraisal-reminder-email',
    category: 'appraisal', channel: 'email', tone: 'friendly',
    name: 'Self-Appraisal Submission Reminder',
    subject: 'Reminder: Self-Appraisal Due by {{deadline}}',
    body: `Hi {{employee_name}},

This is a friendly reminder that your *Self-Appraisal* for {{appraisal_period}} is due by *{{deadline}}*.

📝 Please log in to {{appraisal_tool}} and complete your submission.

Tips for a strong self-appraisal:
- Highlight key achievements with numbers/impact
- Mention skills developed and certifications earned
- Share challenges faced and how you overcame them
- Set clear goals for the next cycle

A well-filled appraisal helps your manager better advocate for you. Take your time and be detailed!

For support, reach out to {{hr_email}}.

Regards,
{{hr_name}}
HR Team, {{company}}`,
  },

  {
    id: 'appraisal-increment-letter-email',
    category: 'appraisal', channel: 'email', tone: 'formal',
    name: 'Increment Letter — Email',
    subject: 'Salary Increment Letter — {{year}} Appraisal',
    body: `Dear {{employee_name}},

We are pleased to inform you of your salary increment following the {{year}} performance appraisal.

**Current CTC:** ₹{{current_ctc}} per annum
**Increment (%):** {{increment_percent}}%
**Revised CTC:** ₹{{revised_ctc}} per annum
**Effective Date:** {{effective_date}}

This increment is a recognition of your performance, contributions, and dedication to {{company}}. We look forward to your continued growth.

A revised appointment letter will be shared with you shortly.

Congratulations once again!

Warm regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'appraisal-no-increment-email',
    category: 'appraisal', channel: 'email', tone: 'formal',
    name: 'No Increment — Communication',
    subject: 'Appraisal Outcome — {{year}}',
    body: `Dear {{employee_name}},

Thank you for your participation in the {{year}} performance appraisal process.

After a thorough review, we regret to inform you that your compensation will remain unchanged for this cycle.

This decision has been made considering {{reason}}. We acknowledge your efforts and value your contribution to the team.

We encourage you to discuss your development plan with your manager and work towards the goals set for the next appraisal cycle. The HR team is available for a one-on-one discussion if you would like to understand this decision better.

We remain committed to your growth at {{company}}.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'appraisal-kra-setting-email',
    category: 'appraisal', channel: 'email', tone: 'formal',
    name: 'KRA / Goal Setting Notice',
    subject: 'Action Required: KRA Setting for {{period}}',
    body: `Dear {{employee_name}},

As we begin the new {{period}}, we request you to finalize your Key Result Areas (KRAs) and goals for this period in discussion with your manager.

**Deadline for KRA submission:** {{deadline}}
**Platform:** {{appraisal_tool}}

Guidelines:
- Set 4–6 measurable goals aligned with team and company objectives
- Each goal should have a clear metric and timeline
- Discuss and get sign-off from {{manager_name}} by {{manager_deadline}}

Well-defined KRAs help ensure clarity of expectations and fair evaluation at the end of the cycle.

For any help, please contact {{hr_email}}.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  // ── PERFORMANCE ──────────────────────────────────────────────────────────

  {
    id: 'performance-appreciation-whatsapp',
    category: 'performance', channel: 'whatsapp', tone: 'friendly',
    name: 'Performance Appreciation — WhatsApp',
    body: `Hi {{employee_name}}! 🌟

Just wanted to take a moment to appreciate the incredible work you've done on *{{project_or_achievement}}*.

Your dedication, {{specific_quality}}, and hard work have not gone unnoticed. You've truly made a difference for the team.

Keep it up — you're a rock star! 🙌

— {{manager_name}} & the {{company}} team`,
  },

  {
    id: 'performance-appreciation-email',
    category: 'performance', channel: 'email', tone: 'formal',
    name: 'Performance Appreciation — Email',
    subject: 'Appreciation: Outstanding Contribution',
    body: `Dear {{employee_name}},

I wanted to take a moment to formally recognize your exceptional performance on *{{project_or_achievement}}*.

Your {{specific_quality}} and commitment to delivering results have been commendable. The impact of your work — {{impact_description}} — has been noticed and appreciated by the leadership team.

Your dedication is an inspiration to the team. Please keep up the excellent work.

Thank you for being such a valuable member of the {{team_name}} team.

Warm regards,
{{manager_name}}
{{company}}`,
  },

  {
    id: 'performance-warning-letter-email',
    category: 'performance', channel: 'email', tone: 'formal',
    name: 'Performance Warning Letter',
    subject: 'Performance Concern Notice — Confidential',
    body: `Dear {{employee_name}},

This letter is to formally communicate our concern regarding your performance over the past {{review_period}}.

Specifically, we have observed:
1. {{concern_1}}
2. {{concern_2}}
3. {{concern_3}}

Despite previous discussions on {{previous_discussion_date}}, the expected improvement has not been observed. Your current performance level is below the required standard for the *{{role}}* role.

We would like to schedule a meeting on *{{meeting_date}}* to discuss a structured improvement plan. We expect to see measurable progress within {{improvement_period}}.

This letter is being placed on your personnel file. We strongly encourage you to take this feedback constructively and work towards meeting expectations.

Regards,
{{hr_name}} / {{manager_name}}
{{company}}`,
  },

  {
    id: 'performance-pip-email',
    category: 'performance', channel: 'email', tone: 'formal',
    name: 'Performance Improvement Plan (PIP)',
    subject: 'Performance Improvement Plan — {{employee_name}}',
    body: `Dear {{employee_name}},

Following our discussions regarding your performance, we are initiating a formal *Performance Improvement Plan (PIP)* to help you meet the required standards for the *{{role}}* role.

**PIP Duration:** {{pip_start_date}} to {{pip_end_date}}

**Areas of Improvement:**
1. {{improvement_area_1}} — Target: {{target_1}}
2. {{improvement_area_2}} — Target: {{target_2}}
3. {{improvement_area_3}} — Target: {{target_3}}

**Support provided:**
- Weekly check-ins with {{manager_name}}
- Training on {{training_topic}} by {{training_date}}

**Review Date:** {{review_date}}

We are committed to supporting your success at {{company}}. However, failure to show satisfactory improvement by the review date may result in further disciplinary action.

Please sign and return a copy of this letter to acknowledge receipt.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'performance-final-warning-email',
    category: 'performance', channel: 'email', tone: 'formal',
    name: 'Final Warning Letter',
    subject: 'Final Warning Notice — Confidential',
    body: `Dear {{employee_name}},

This is a *Final Warning Notice* regarding repeated instances of {{misconduct_or_performance_issue}} despite previous warnings issued on {{warning_dates}}.

The specific incidents are:
1. {{incident_1}} — Date: {{date_1}}
2. {{incident_2}} — Date: {{date_2}}

Despite our efforts to support improvement, the required standards have not been met. We urge you to take immediate corrective action.

*Please note:* Any recurrence of the above issues within {{probation_period}} may result in termination of employment.

You are requested to respond to this notice within {{response_deadline}} days.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  // ── PROMOTION ────────────────────────────────────────────────────────────

  {
    id: 'promotion-letter-email',
    category: 'promotion', channel: 'email', tone: 'formal',
    name: 'Promotion Letter — Email',
    subject: 'Promotion Letter — Effective {{effective_date}}',
    body: `Dear {{employee_name}},

We are delighted to inform you of your promotion to the position of *{{new_designation}}* in the {{department}} department, effective *{{effective_date}}*.

**New Designation:** {{new_designation}}
**Department:** {{department}}
**Revised CTC:** ₹{{revised_ctc}} per annum
**Reporting To:** {{reporting_manager}}

This promotion reflects your outstanding contributions, dedication, and the confidence {{company}} has in your capabilities. We expect you to take on expanded responsibilities with the same enthusiasm and commitment.

Please sign and return a copy of this letter as your acceptance.

Congratulations once again! We look forward to your continued success.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'promotion-team-announcement-whatsapp',
    category: 'promotion', channel: 'whatsapp', tone: 'friendly',
    name: 'Team Promotion Announcement — WhatsApp',
    body: `Team announcement! 🎉

We are thrilled to share that *{{employee_name}}* has been promoted to *{{new_designation}}*!

{{employee_name}}'s hard work, {{quality_1}}, and {{quality_2}} have truly earned this. We couldn't be more proud to have them in the {{team_name}} team.

Please join us in congratulating {{employee_name}}! 👏🎊

— {{manager_name}} & HR, {{company}}`,
  },

  {
    id: 'promotion-announcement-email',
    category: 'promotion', channel: 'email', tone: 'formal',
    name: 'Promotion Announcement — Email',
    subject: 'Promotion Announcement — {{employee_name}}',
    body: `Dear Team,

We are pleased to announce the promotion of *{{employee_name}}* to the role of *{{new_designation}}*, effective {{effective_date}}.

{{employee_name}} has been an integral part of the {{team_name}} team for {{tenure}} and has consistently demonstrated exceptional {{quality_1}} and {{quality_2}}.

In the new role, {{employee_name}} will be responsible for {{new_responsibilities}}.

Please join us in congratulating {{employee_name}} on this well-deserved achievement!

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'promotion-role-change-email',
    category: 'promotion', channel: 'email', tone: 'formal',
    name: 'Role Change / Transfer Notification',
    subject: 'Role Change Notification — Effective {{effective_date}}',
    body: `Dear {{employee_name}},

Following internal discussions and business needs, your role is being transitioned as follows, effective *{{effective_date}}*:

| | Previous | New |
|---|---|---|
| **Designation** | {{old_designation}} | {{new_designation}} |
| **Department** | {{old_department}} | {{new_department}} |
| **Location** | {{old_location}} | {{new_location}} |
| **Reporting To** | {{old_manager}} | {{new_manager}} |

Your current CTC remains unchanged / will be revised to *₹{{revised_ctc}}*.

We are confident this transition will be a positive step for both you and the organization. Please do not hesitate to reach out for any support during this change.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  // ── TERMINATION ──────────────────────────────────────────────────────────

  {
    id: 'termination-resignation-acceptance-email',
    category: 'termination', channel: 'email', tone: 'formal',
    name: 'Resignation Acceptance',
    subject: 'Resignation Acceptance — {{employee_name}}',
    body: `Dear {{employee_name}},

We acknowledge receipt of your resignation letter dated *{{resignation_date}}* from the position of *{{designation}}* at {{company}}.

Your resignation has been accepted. As per your employment contract and notice period of *{{notice_period}} days*, your *last working day* will be *{{last_working_day}}*.

You are requested to:
1. Complete all pending work and hand over responsibilities to {{handover_person}}
2. Return company assets (laptop, ID card, access cards) by your last working day
3. Complete exit formalities with HR before departure

Your full and final settlement will be processed within {{settlement_days}} working days from your last working day.

Thank you for your contributions to {{company}}. We wish you the very best in your future endeavours.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'termination-notice-period-confirmation-email',
    category: 'termination', channel: 'email', tone: 'formal',
    name: 'Notice Period Confirmation',
    subject: 'Notice Period Dates Confirmation',
    body: `Dear {{employee_name}},

Following your resignation, this is to confirm your notice period dates:

- **Resignation Date:** {{resignation_date}}
- **Notice Period:** {{notice_period}} days
- **Last Working Day:** {{last_working_day}}

During this period, you are expected to:
- Complete all assigned deliverables
- Ensure knowledge transfer to {{handover_person}} by {{handover_deadline}}
- Be available for exit interview on {{exit_interview_date}}

Please reach out to {{hr_email}} for your exit formalities checklist.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'termination-letter-email',
    category: 'termination', channel: 'email', tone: 'formal',
    name: 'Termination Letter',
    subject: 'Termination of Employment — Confidential',
    body: `Dear {{employee_name}},

This letter serves as formal notice that your employment with {{company}} is being terminated, effective *{{termination_date}}*.

**Reason:** {{termination_reason}}

Despite {{prior_action}}, the required improvement has not been observed. This decision has been taken after careful consideration by the management.

You are required to:
1. Hand over all company property, data, and assets by {{return_date}}
2. Your access to company systems will be revoked on {{access_revocation_date}}
3. Full and final settlement will be processed within {{settlement_days}} working days

If you wish to appeal this decision, you may do so in writing to {{appeal_authority}} within {{appeal_days}} days.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'termination-farewell-lwd-whatsapp',
    category: 'termination', channel: 'whatsapp', tone: 'friendly',
    name: 'Last Working Day Farewell — WhatsApp',
    body: `Hey {{employee_name}},

Today marks your last day with us, and we just want to say — it has been an absolute pleasure working with you! 🙏

Your contributions to {{team_name}} and especially {{achievement}} will be remembered for a long time.

Wishing you great success in whatever comes next. Stay in touch — once a {{company}} family, always a {{company}} family! 💙

— {{manager_name}} & the entire team`,
  },

  // ── POLICY ───────────────────────────────────────────────────────────────

  {
    id: 'policy-wfh-policy-email',
    category: 'policy', channel: 'email', tone: 'formal',
    name: 'Work From Home Policy Update',
    subject: 'Updated Work From Home Policy — Effective {{effective_date}}',
    body: `Dear Team,

We are writing to share an update to our *Work From Home (WFH) Policy*, effective *{{effective_date}}*.

**Key Changes:**
1. WFH will be permitted on *{{wfh_days}}* for eligible roles
2. Employees must be available on calls/messages during core hours (*{{core_hours}}*)
3. WFH requests must be submitted via {{wfh_tool}} at least {{advance_notice}} hours in advance
4. Manager approval is mandatory before working from home
5. {{additional_policy_point}}

Roles eligible for WFH: {{eligible_roles}}
Roles not eligible: {{non_eligible_roles}}

The complete policy document is available on {{policy_portal}}. Please review and acknowledge receipt by {{acknowledgement_deadline}}.

For any queries, reach out to {{hr_email}}.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'policy-new-policy-announcement-email',
    category: 'policy', channel: 'email', tone: 'formal',
    name: 'New Policy Announcement',
    subject: 'New Policy: {{policy_name}} — Effective {{effective_date}}',
    body: `Dear All,

We are pleased to announce the introduction of the *{{policy_name}}* policy, effective *{{effective_date}}*.

**Purpose:** {{policy_purpose}}

**Key Highlights:**
1. {{highlight_1}}
2. {{highlight_2}}
3. {{highlight_3}}

**Who it applies to:** {{applicability}}

The detailed policy document has been shared on {{policy_portal}} / is attached to this email. All employees are requested to read and acknowledge the policy by *{{acknowledgement_deadline}}*.

For any queries, please reach out to {{hr_email}}.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'policy-expense-policy-email',
    category: 'policy', channel: 'email', tone: 'formal',
    name: 'Expense Policy Reminder',
    subject: 'Expense Reimbursement Policy — Reminder',
    body: `Dear Team,

This is a friendly reminder about our *Expense Reimbursement Policy* to ensure smooth processing of claims.

**Key Guidelines:**
- All expense claims must be submitted within *{{submission_window}} days* of incurring the expense
- Original bills/receipts must be attached for all claims above ₹{{minimum_bill_amount}}
- Travel expenses require prior approval from your manager
- Meal allowance per day: ₹{{meal_allowance}} (within India)
- Claims submitted after {{late_submission_days}} days may not be processed

**How to submit:** {{submission_process}}

Please reach out to {{finance_email}} for any reimbursement queries.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'policy-code-of-conduct-email',
    category: 'policy', channel: 'email', tone: 'formal',
    name: 'Code of Conduct Reminder',
    subject: 'Reminder: Code of Conduct — {{company}}',
    body: `Dear Team,

As part of our commitment to maintaining a respectful and professional workplace, we are sharing a reminder of our *Code of Conduct*.

All employees are expected to:
✅ Treat colleagues, clients, and vendors with respect and professionalism
✅ Maintain confidentiality of company data and client information
✅ Avoid conflicts of interest and disclose any if they arise
✅ Use company resources only for authorized purposes
✅ Report any violations to HR or use the anonymous {{grievance_channel}}

Any violation of the Code of Conduct may result in disciplinary action as per company policy.

The full document is available on {{policy_portal}}. Please re-read and acknowledge receipt by *{{deadline}}*.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  // ── ATTENDANCE ───────────────────────────────────────────────────────────

  {
    id: 'attendance-warning-email',
    category: 'attendance', channel: 'email', tone: 'formal',
    name: 'Attendance Warning Letter',
    subject: 'Attendance Concern Notice',
    body: `Dear {{employee_name}},

We have noticed a concerning pattern in your attendance over the past {{review_period}}.

Our records indicate:
- **Absences (without prior approval):** {{unauthorized_absences}} day(s)
- **Late arrivals (beyond {{late_threshold}} mins):** {{late_count}} instance(s)
- **Specific dates:** {{specific_dates}}

Maintaining regular and punctual attendance is essential for team productivity and is a condition of your employment at {{company}}.

We strongly urge you to improve your attendance immediately. If there are personal challenges affecting your attendance, we encourage you to speak with HR confidentially.

Please note that continued irregularities may lead to further disciplinary action, including impact on your appraisal.

Regards,
{{hr_name}} / {{manager_name}}
{{company}}`,
  },

  {
    id: 'attendance-late-coming-email',
    category: 'attendance', channel: 'email', tone: 'formal',
    name: 'Late Coming Notice',
    subject: 'Late Arrival Notice — Action Required',
    body: `Dear {{employee_name}},

Our records indicate that you have arrived late to work on the following occasions in {{month}}:

{{late_dates_list}}

While we understand unforeseen circumstances can sometimes cause delays, repeated late arrivals impact team coordination and productivity.

Your scheduled work hours are *{{work_hours}}*. We request you to ensure punctuality going forward. Continued late arrivals may attract LOP deductions as per company policy.

If you are facing any recurring challenges with timing, please discuss them with your manager or HR at the earliest.

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'attendance-biometric-reminder-whatsapp',
    category: 'attendance', channel: 'whatsapp', tone: 'friendly',
    name: 'Biometric Punch Reminder — WhatsApp',
    body: `Hi {{employee_name}} 👋

Reminder to please *mark your attendance* through the biometric / {{attendance_app}} before *{{cutoff_time}}* today.

Missed punches need regularization requests and can cause payroll delays.

Thank you for keeping attendance records updated! ✅

— HR Team, {{company}}`,
  },

  {
    id: 'attendance-regularization-email',
    category: 'attendance', channel: 'email', tone: 'formal',
    name: 'Attendance Regularization Request',
    subject: 'Attendance Regularization — {{date}}',
    body: `Dear {{manager_name}},

I am writing to request regularization of my attendance for *{{date}}* due to *{{reason}}* (e.g., biometric not working / forgot to punch / WFH without prior approval).

I was present / working from {{work_location}} during regular work hours on this date.

Kindly approve the regularization request on {{attendance_tool}}.

Thank you,
{{employee_name}}
{{designation}}, {{department}}`,
  },

  // ── BIRTHDAY ─────────────────────────────────────────────────────────────

  {
    id: 'birthday-wishes-whatsapp-individual',
    category: 'birthday', channel: 'whatsapp', tone: 'friendly',
    name: 'Birthday Wishes — WhatsApp (Individual)',
    body: `Happy Birthday, {{employee_name}}! 🎂🎉

Wishing you a year filled with joy, health, and all the success you deserve. You are such a valued part of the {{company}} family.

May this new year of your life bring you everything you wish for! 🌟

Enjoy your special day to the fullest! 🎊

— {{manager_name}} & the {{team_name}} team`,
  },

  {
    id: 'birthday-team-announcement-whatsapp',
    category: 'birthday', channel: 'whatsapp', tone: 'friendly',
    name: 'Birthday Announcement — Team WhatsApp',
    body: `🎂 Team Birthday Alert! 🎂

Today is *{{employee_name}}'s* birthday! 🎉

Let's take a moment to shower {{employee_name}} with wishes. They have been an amazing part of our team and we're so glad to have them!

Please join us in wishing {{employee_name}} a very *Happy Birthday* 🥳🎊

— HR Team, {{company}}`,
  },

  {
    id: 'birthday-work-anniversary-email',
    category: 'birthday', channel: 'email', tone: 'friendly',
    name: 'Work Anniversary Wishes',
    subject: 'Happy Work Anniversary, {{employee_name}}! 🎉',
    body: `Dear {{employee_name}},

Today marks *{{anniversary_years}} year(s)* since you joined the {{company}} family — and what a journey it has been!

Your contributions to {{team_name}}, your dedication to {{quality}}, and the positive energy you bring every day have made a real difference.

We are grateful to have you with us and look forward to many more years together.

Here's to new milestones, greater achievements, and continued growth ahead! 🥂

With appreciation,
{{hr_name}} & the Leadership Team
{{company}}`,
  },

  // ── FESTIVAL ─────────────────────────────────────────────────────────────

  {
    id: 'festival-diwali-whatsapp',
    category: 'festival', channel: 'whatsapp', tone: 'friendly',
    name: 'Diwali Wishes — WhatsApp',
    body: `🪔 Wishing you and your family a very Happy Diwali! 🎆

May this festival of lights illuminate your home with joy, prosperity, and good health.

Thank you for being such an important part of the {{company}} family. Your hard work and dedication light up our workplace every day! ✨

From all of us at {{company}} — *Happy Diwali!* 🪔🎊

— {{hr_name}} & the Leadership Team`,
  },

  {
    id: 'festival-new-year-email',
    category: 'festival', channel: 'email', tone: 'formal',
    name: 'New Year Wishes — Email',
    subject: 'Happy New Year {{year}} from {{company}}',
    body: `Dear {{employee_name}},

As we step into {{year}}, we want to take a moment to thank you for your incredible contributions to {{company}} over the past year.

{{year - 1}} was a year of {{achievement_highlight}}, and none of it would have been possible without each one of you.

As we enter {{year}}, we are excited about the opportunities ahead and confident that with your continued dedication, we will achieve even greater milestones together.

Here's wishing you and your loved ones a very Happy New Year filled with health, happiness, and success! 🎉

Warm regards,
{{sender_name}}
{{company}}`,
  },

  {
    id: 'festival-eid-whatsapp',
    category: 'festival', channel: 'whatsapp', tone: 'friendly',
    name: 'Eid Mubarak — WhatsApp',
    body: `Eid Mubarak! 🌙⭐

May this blessed occasion fill your home with joy, peace, and happiness.

Wishing you and your family a wonderful Eid filled with love and cherished moments.

From all of us at {{company}} — *Eid Mubarak!* 🎊

— {{hr_name}} & Team`,
  },

  {
    id: 'festival-holi-whatsapp',
    category: 'festival', channel: 'whatsapp', tone: 'friendly',
    name: 'Holi Wishes — WhatsApp',
    body: `🎨 Happy Holi! 🎊

Wishing you a colourful, joyful, and safe Holi! May this festival of colours bring happiness and positivity to your life.

From the entire {{company}} family — let the celebration begin! 🌈

— {{hr_name}} & Team`,
  },

  {
    id: 'festival-independence-day-email',
    category: 'festival', channel: 'email', tone: 'formal',
    name: 'Independence Day Message — Email',
    subject: 'Happy Independence Day — 15th August',
    body: `Dear Team,

On the occasion of India's *{{year}}th Independence Day*, we celebrate the spirit of freedom, unity, and progress that defines our great nation.

Just as India's strength lies in the diversity and dedication of its citizens, {{company}}'s strength lies in each one of you — your commitment, your creativity, and your hard work.

Let us take this day to reflect on the sacrifices of our freedom fighters and recommit to building a better tomorrow — in our nation and in our work.

*Jai Hind! Happy Independence Day!* 🇮🇳

Warm regards,
{{sender_name}}
{{company}}`,
  },

  // ── COMPLIANCE ───────────────────────────────────────────────────────────

  {
    id: 'compliance-document-submission-email',
    category: 'compliance', channel: 'email', tone: 'formal',
    name: 'Document Submission Reminder',
    subject: 'Action Required: Document Submission by {{deadline}}',
    body: `Dear {{employee_name}},

As part of our annual compliance process, we require you to submit/update the following documents by *{{deadline}}*:

☐ {{document_1}}
☐ {{document_2}}
☐ {{document_3}}

**How to submit:** {{submission_method}}

Timely submission is mandatory as per {{regulation_or_policy}} requirements. Failure to submit by the deadline may affect your payroll processing.

For any queries, reach out to {{hr_email}}.

Regards,
{{hr_name}}
HR & Compliance Team, {{company}}`,
  },

  {
    id: 'compliance-posh-training-email',
    category: 'compliance', channel: 'email', tone: 'formal',
    name: 'POSH Training Reminder',
    subject: 'Mandatory POSH Training — {{date}}',
    body: `Dear {{employee_name}},

As per the *Prevention of Sexual Harassment (POSH) Act 2013*, it is mandatory for all employees to complete the annual POSH awareness training.

**Training Details:**
- **Mode:** {{training_mode}} (Online/Offline)
- **Date:** {{date}}
- **Time:** {{time}}
- **Link / Venue:** {{link_or_venue}}
- **Duration:** {{duration}}

Attendance is compulsory for all employees. A completion certificate will be issued upon successful completion.

Please confirm your attendance by replying to this email or registering on {{training_platform}} by *{{registration_deadline}}*.

For queries, contact {{hr_email}}.

Regards,
{{hr_name}}
HR & Compliance Team, {{company}}`,
  },

  {
    id: 'compliance-pf-nomination-email',
    category: 'compliance', channel: 'email', tone: 'formal',
    name: 'PF / ESIC Nomination Update',
    subject: 'Action Required: Update Your PF Nomination',
    body: `Dear {{employee_name}},

This is a reminder to update your *Provident Fund (PF) and ESIC nomination* details, which is mandatory under applicable labour laws.

**Action Required:**
1. Log in to the EPFO Member Portal: https://unifiedportal-mem.epfindia.gov.in
2. Update your nominee details under "e-Nomination"
3. Share the acknowledgement with HR at {{hr_email}}

**Deadline:** {{deadline}}

Keeping your nomination updated ensures that your PF benefits reach your family in case of any unforeseen events. Please do not delay this.

For any assistance, contact {{hr_email}}.

Regards,
{{hr_name}}
HR & Compliance Team, {{company}}`,
  },

  {
    id: 'compliance-kyc-update-whatsapp',
    category: 'compliance', channel: 'whatsapp', tone: 'friendly',
    name: 'KYC Update Reminder — WhatsApp',
    body: `Hi {{employee_name}} 👋

Quick reminder: Please update your *KYC details* on the HR portal by *{{deadline}}*.

Required documents:
📄 Aadhaar Card
📄 PAN Card
📄 Latest address proof (if changed)

Login at: {{portal_link}}

This is mandatory for payroll and compliance purposes. Reach out to {{hr_name}} if you need any help! 🙏`,
  },

  // ── EXIT ─────────────────────────────────────────────────────────────────

  {
    id: 'exit-interview-invite-email',
    category: 'exit', channel: 'email', tone: 'formal',
    name: 'Exit Interview Invitation',
    subject: 'Exit Interview — {{employee_name}}',
    body: `Dear {{employee_name}},

As you prepare to conclude your journey with {{company}}, we would like to schedule your *Exit Interview* with our HR team.

**Date:** {{date}}
**Time:** {{time}}
**Mode:** {{mode}} (In-person / Video call)
**Duration:** Approximately {{duration}} minutes

The exit interview is a confidential conversation aimed at understanding your experience and gathering feedback to help us improve as an organization. Your honest responses are greatly valued.

Please confirm your availability or suggest an alternate time if needed.

Thank you for your contributions to {{company}}. We wish you all the best ahead.

Warm regards,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'exit-experience-letter-email',
    category: 'exit', channel: 'email', tone: 'formal',
    name: 'Experience Letter',
    subject: 'Experience Letter — {{employee_name}}',
    body: `Dear {{employee_name}},

To Whom It May Concern,

This is to certify that *{{employee_name}}* (Employee ID: {{employee_id}}) was employed with *{{company}}* from *{{joining_date}}* to *{{last_working_day}}* in the capacity of *{{designation}}*.

During this period, {{employee_name}} demonstrated {{qualities}} and was a valued member of our {{team_name}} team.

We wish {{employee_name}} all the best in future endeavours.

This letter is issued upon request.

For any verification, please contact {{hr_email}}.

Sincerely,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'exit-relieving-letter-email',
    category: 'exit', channel: 'email', tone: 'formal',
    name: 'Relieving Letter',
    subject: 'Relieving Letter — {{employee_name}}',
    body: `Dear {{employee_name}},

This is to confirm that *{{employee_name}}* (Employee ID: {{employee_id}}) has been relieved from the services of *{{company}}* with effect from *{{last_working_day}}*, after serving a notice period of {{notice_period}} days.

*{{employee_name}}* held the position of *{{designation}}* in the {{department}} department.

We confirm that {{employee_name}} has completed all exit formalities and has no dues pending with the company as of the date of this letter.

We wish {{employee_name}} great success in future endeavours.

Sincerely,
{{hr_name}}
HR Department, {{company}}`,
  },

  {
    id: 'exit-fnf-notice-email',
    category: 'exit', channel: 'email', tone: 'formal',
    name: 'Full & Final Settlement Notice',
    subject: 'Full & Final Settlement — {{employee_name}}',
    body: `Dear {{employee_name}},

Your Full & Final (F&F) settlement has been processed.

**Settlement Summary:**
- **Last Working Day:** {{last_working_day}}
- **Pending Salary:** ₹{{pending_salary}} (for {{pending_days}} days)
- **Leave Encashment:** ₹{{leave_encashment}} ({{leave_days}} days)
- **Gratuity:** {{gratuity_amount}} (if applicable)
- **PF Transfer/Withdrawal:** {{pf_status}}
- **Deductions:** ₹{{deductions}} ({{deduction_reason}})
- **Net Payable:** ₹{{net_payable}}

The amount will be credited to your registered bank account (XXXX{{last_4_digits}}) by *{{credit_date}}*.

Your experience letter and relieving letter are attached. PF transfer details have been updated on the EPFO portal.

Please reach out to {{hr_email}} for any discrepancy within {{dispute_window}} days.

Regards,
{{hr_name}}
HR & Finance Team, {{company}}`,
  },

  {
    id: 'exit-offboarding-checklist-email',
    category: 'exit', channel: 'email', tone: 'formal',
    name: 'Offboarding Checklist',
    subject: 'Offboarding Checklist — {{employee_name}}',
    body: `Dear {{employee_name}},

As your last working day ({{last_working_day}}) approaches, please ensure you complete the following exit formalities:

**Knowledge Transfer:**
☐ Hand over all pending work to {{handover_person}} by {{handover_deadline}}
☐ Document processes and share with the team
☐ Update project trackers and shared drives

**Asset Return:**
☐ Laptop / desktop and accessories
☐ ID card and access cards
☐ Any other company property

**IT / Access:**
☐ Company email will be deactivated on {{email_deactivation_date}}
☐ Revoke access to all third-party tools
☐ Remove personal data from company devices

**HR / Finance:**
☐ Complete exit interview with {{hr_name}}
☐ Clear any pending expense claims
☐ Verify bank account details for F&F settlement

Please connect with {{hr_name}} at {{hr_email}} to schedule your exit interview and complete the above checklist.

Thank you for your contributions. We wish you the very best!

Regards,
{{hr_name}}
HR Department, {{company}}`,
  },
]

// Helper: extract {{placeholder}} names from a template body
export function extractPlaceholders(body: string, subject?: string): string[] {
  const text = [body, subject ?? ''].join(' ')
  const matches = text.match(/\{\{([^}]+)\}\}/g) ?? []
  const unique = Array.from(new Set(matches.map(m => m.slice(2, -2))))
  return unique
}

// Helper: replace placeholders with actual values
export function fillTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{([^}]+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`)
}

export const CATEGORY_ORDER: TemplateCategory[] = [
  'hiring', 'payroll', 'leave', 'appraisal', 'performance',
  'promotion', 'termination', 'policy', 'attendance',
  'birthday', 'festival', 'compliance', 'exit',
]
