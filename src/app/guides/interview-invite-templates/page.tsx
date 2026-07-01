import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Interview Invite Message Templates — Email, WhatsApp & Hinglish',
  description: 'Professional interview invitation templates for Indian recruiters — phone screen, technical round, HR round, final round. Email and WhatsApp formats in English and Hinglish.',
  metadataBase: new URL('https://www.hrreply.in'),
  openGraph: {
    title: 'Interview Invite Message Templates — Email, WhatsApp & Hinglish',
    description: 'Ready-to-use interview invitation messages for every round — phone, technical, HR, and final. Email and WhatsApp format.',
    url: 'https://www.hrreply.in/guides/interview-invite-templates',
  },
}

function T({ label, tone, text, isEmail = false }: { label: string; tone: string; text: string; isEmail?: boolean }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{label}</span>
        <span className="text-xs bg-accent-soft text-accent-icon font-medium px-2 py-0.5 rounded-full">{tone}</span>
        {isEmail && <span className="text-xs bg-surface-sunken text-ink-muted font-medium px-2 py-0.5 rounded-full">Email</span>}
      </div>
      <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  )
}

export default function InterviewInvitePage() {
  return (
    <article>
      <div className="mb-8">
        <Link href="/guides" className="text-xs text-ink-muted hover:text-ink transition-colors">← All guides</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink mt-3 mb-3">
          Interview Invite Message Templates — Email, WhatsApp & Hinglish
        </h1>
        <p className="text-ink-secondary text-lg leading-relaxed">
          A good interview invite sets the tone for the entire candidate experience. Here are ready-to-use templates for every interview stage — from the first screening call to the final round, in email, WhatsApp, and Hinglish formats.
        </p>
      </div>

      <div className="bg-accent-soft border border-accent/20 rounded-xl p-5 mb-8 text-sm text-ink-secondary">
        <strong className="text-ink">What to always include:</strong> Candidate name · Role title · Date + time · Mode (in-person/virtual) · Location or link · Who they&apos;ll meet · Your contact number for queries.
      </div>

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Phone Screening / Initial Call</h2>

      <T label="WhatsApp" tone="Friendly English"
        text={`Hi [Name]! This is [Your Name] from [Company]. We came across your profile and are impressed with your background in [skill/domain]. We have a [Role] opening that might be a great fit for you.

Could we schedule a quick 15-minute call this week to tell you more about the role? Let me know what time works for you.`} />

      <T label="Email" tone="Formal" isEmail
        text={`Subject: Opportunity at [Company] — [Role] Position

Dear [Name],

I hope this message finds you well. I am [Your Name], [Your Designation] at [Company Name]. We are currently looking for a talented [Role] and came across your profile.

I would like to schedule a brief call to discuss the opportunity further. Could you please share your availability for a 20-minute conversation this week?

Looking forward to hearing from you.

Best regards,
[Your Name]
[Company Name]
[Phone Number]`} />

      <T label="WhatsApp" tone="Hinglish"
        text={`Hi [Name]! Main [Your Name] hun, [Company] se. Aapka profile dekha — [Role] ke liye bahut interesting laga. Kya is hafte 15-20 min ki ek quick call ho sakti hai? Role ke baare mein thoda bata sakta/sakti hun. 🙏`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Technical Round Invite</h2>

      <T label="Email" tone="Formal" isEmail
        text={`Subject: Technical Interview Invitation — [Role] | [Company]

Dear [Name],

Thank you for your interest in the [Role] position at [Company Name]. We are pleased to inform you that you have been shortlisted for a Technical Interview.

Interview Details:
• Date: [Date]
• Time: [Time]
• Mode: [In-person / Online via Google Meet/Zoom]
• Location / Link: [Address or Link]
• Interviewer: [Name, Designation]
• Duration: Approximately [60] minutes

Please come prepared to discuss your technical experience and solve problems relevant to [technology/domain]. Carry your laptop if it is an in-person interview.

Kindly confirm your availability by replying to this email. If you have any questions, feel free to reach out at [Phone].

Best regards,
[Your Name]`} />

      <T label="WhatsApp" tone="Friendly English"
        text={`Hi [Name]! Good news — you've been shortlisted for the Technical Round for [Role] at [Company] 🎉

📅 Date: [Date]
⏰ Time: [Time]
📍 Mode: [In-person/Online]
🔗 Link: [Link if online]

The interview will be ~60 minutes and will cover [topic areas]. Please let me know if this works for you or if you'd like to reschedule.`} />

      <T label="WhatsApp" tone="Hinglish"
        text={`Hi [Name], [Company] ke [Role] ke liye aap technical round ke liye select ho gaye hain! 🎉

📅 [Date], ⏰ [Time]
📍 [Location/Online Link]

Interview mein [topics] cover honge, toh thodi preparation kar lena. Confirm kar do please, aur koi bhi sawaal ho toh poochh sakte ho.`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">HR Round Invite</h2>

      <T label="Email" tone="Formal" isEmail
        text={`Subject: HR Interview Invitation — [Role] | [Company]

Dear [Name],

Congratulations on clearing the Technical Round! We are pleased to invite you for an HR Interview as the next step in our selection process.

Interview Details:
• Date: [Date]
• Time: [Time]
• Mode: [In-person / Video call]
• HR Interviewer: [Name]
• Duration: 30–45 minutes

The HR round will cover your professional background, career goals, salary expectations, and culture fit. Please feel free to ask any questions about the role or the company during the session.

Please confirm your availability by [Date]. Looking forward to speaking with you.

Best regards,
[Your Name]`} />

      <T label="WhatsApp" tone="Friendly English"
        text={`Hi [Name], congrats on clearing the tech round! 🎉 We'd like to schedule your HR Interview now.

📅 [Date] at [Time]
📍 [Location/Video call link]
👤 You'll be speaking with [HR Name]

It'll be a relaxed conversation — about your background, goals, and what you're looking for. About 30-45 minutes. Does this time work for you?`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Final Round / Director Round</h2>

      <T label="Email" tone="Formal" isEmail
        text={`Subject: Final Round Interview — [Role] | [Company]

Dear [Name],

We are delighted to inform you that you have been shortlisted for the Final Round interview with [Interviewer Name], [Designation], at [Company Name].

Interview Details:
• Date: [Date]
• Time: [Time]
• Mode: [In-person is preferred / Video call]
• Duration: 45–60 minutes

This will be a discussion around your overall experience, your vision for the role, and your fit within the leadership team. We recommend preparing a brief overview of your past work and any questions you may have for us.

Please confirm your availability at the earliest. We look forward to meeting you.

Warm regards,
[Your Name]`} />

      <T label="WhatsApp" tone="Hinglish"
        text={`Hi [Name], bahut badi news hai — aap final round ke liye select ho gaye hain! [Company] ke [Director/Founder Name] se milne ka mauka hai aapko.

📅 [Date], ⏰ [Time]
📍 [Location]

Ye ek open conversation hogi aapke experience aur future plans ke baare mein. Congratulations aur best of luck! 🙌`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Reschedule & Special Situations</h2>

      <T label="Rescheduling (from your side)" tone="Formal"
        text={`Dear [Name], I sincerely apologize for the inconvenience — due to an internal scheduling conflict, we need to reschedule your interview. Could you please share your availability on [Date 1] or [Date 2]? We assure you this will not affect your candidature in any way. Thank you for your understanding.`} />

      <T label="Rescheduling (from your side)" tone="Hinglish"
        text={`Hi [Name], sorry for the trouble — hamare side se ek scheduling issue aa gaya. Kya [Date] ya [Date] ko interview reschedule kar sakte hain? Aapki candidature pe koi asar nahi padega, ye sirf timing ki baat hai. Shukriya! 🙏`} />

      <T label="Reminder (day before interview)" tone="Friendly English"
        text={`Hi [Name]! Just a friendly reminder — your interview for [Role] at [Company] is tomorrow, [Date] at [Time].

📍 [Location/Link]

Let me know if you need directions or have any last-minute questions. See you tomorrow! 😊`} />

      <h2 className="text-xl font-bold text-ink mt-10 mb-4">What Makes a Great Interview Invite</h2>
      <ul className="space-y-3 text-sm text-ink-secondary">
        {[
          'Confirm within 24 hours of deciding to invite — candidates lose interest fast when there\'s a delay.',
          'Always include the interviewer\'s name and designation — it helps candidates prepare.',
          'For online interviews, test the link before sending. Broken links are a bad first impression.',
          'Add your WhatsApp number in the email — it gives candidates a quick way to reach you on interview day.',
          'Send a reminder the evening before — no-show rates drop significantly with a simple reminder.',
          'If the interview has a task or assignment, mention it in the invite with enough time to prepare.',
          'For senior roles, include the interview agenda or topics — it shows respect for the candidate\'s time.',
        ].map((tip) => (
          <li key={tip} className="flex gap-2">
            <span className="text-accent-icon shrink-0 mt-0.5">→</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 bg-primary-deep text-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Generate a custom interview invite in seconds</h2>
        <p className="text-gray-400 text-sm mb-5">
          Tell HRReply the candidate name, role, date, and mode — get a polished invite in formal, friendly, or Hinglish instantly.
        </p>
        <Link
          href="/login?mode=signup"
          className="inline-flex items-center gap-2 bg-accent text-primary-deep font-semibold px-6 py-3 rounded-lg hover:bg-accent-hover transition-colors text-sm"
        >
          Try free — 25 replies/month <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  )
}
