import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How to Reject a Candidate Politely — 10 Templates (Email + WhatsApp)',
  description: 'Word-for-word candidate rejection message templates in formal English, friendly English, and Hinglish. Ready to copy-paste for Indian recruiters.',
  metadataBase: new URL('https://www.hrreply.in'),
  openGraph: {
    title: 'How to Reject a Candidate Politely — 10 Templates for Indian Recruiters',
    description: 'Candidate rejection email and WhatsApp templates in formal, friendly, and Hinglish. Copy-paste ready.',
    url: 'https://www.hrreply.in/guides/reject-candidate-politely',
  },
}

function TemplateCard({ label, tone, text }: { label: string; tone: string; text: string }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{label}</span>
        <span className="text-xs bg-accent-soft text-accent-icon font-medium px-2 py-0.5 rounded-full">{tone}</span>
      </div>
      <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  )
}

export default function RejectCandidatePage() {
  return (
    <article>
      <div className="mb-8">
        <Link href="/guides" className="text-xs text-ink-muted hover:text-ink transition-colors">← All guides</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink mt-3 mb-3">
          How to Reject a Candidate Politely — 10 Templates
        </h1>
        <p className="text-ink-secondary text-lg leading-relaxed">
          Rejecting a candidate is one of the hardest parts of recruiting — especially in India where candidates often follow up repeatedly. Here are 10 ready-to-use rejection messages for every situation, in formal English, friendly English, and Hinglish.
        </p>
      </div>

      <div className="bg-accent-soft border border-accent/20 rounded-xl p-5 mb-8 text-sm text-ink-secondary">
        <strong className="text-ink">Quick tip:</strong> Always reject within 3–5 days of the final decision. Candidates appreciate a clear "no" over silence — it helps them move on and leaves a positive impression of your company.
      </div>

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">After Resume Screening (Not Shortlisted)</h2>

      <TemplateCard
        label="Template 1"
        tone="Formal"
        text={`Subject: Regarding Your Application — [Company Name]

Dear [Candidate Name],

Thank you for applying for the [Role] position at [Company Name]. We have reviewed your application carefully and, while your profile is impressive, we have decided to move forward with candidates whose experience more closely matches our current requirements.

We encourage you to apply for future openings that align with your skills. We wish you the very best in your job search.

Regards,
[Your Name]
[Company Name]`}
      />

      <TemplateCard
        label="Template 2"
        tone="Friendly"
        text={`Hi [Candidate Name],

Thanks so much for applying for the [Role] role at [Company Name]! We've gone through all the applications and unfortunately won't be moving forward with yours at this time — we had a lot of strong applicants and it was a tough call.

That said, we'd love to keep your profile on file and reach out when something more suitable comes up. All the best with your search!

[Your Name]`}
      />

      <TemplateCard
        label="Template 3"
        tone="Hinglish"
        text={`Hi [Candidate Name],

[Company Name] mein apply karne ke liye bahut shukriya! Aapka profile dekha humne, aur aap clearly talented hain — lekin is waqt hamari requirement thodi alag hai, isliye hum aage proceed nahi kar pa rahe.

Future mein koi suitable opening aaye toh zaroor reach out karenge. Best of luck for your search!

[Your Name]`}
      />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">After Interview Round (Did Not Clear)</h2>

      <TemplateCard
        label="Template 4"
        tone="Formal"
        text={`Subject: Interview Outcome — [Role] Position

Dear [Candidate Name],

Thank you for taking the time to interview with us for the [Role] position. It was a pleasure speaking with you and learning about your experience.

After careful evaluation, we have decided to move forward with another candidate for this role. This was a difficult decision as we had several strong candidates.

We appreciate your interest in [Company Name] and encourage you to apply for future opportunities. We wish you every success.

Warm regards,
[Your Name]`}
      />

      <TemplateCard
        label="Template 5"
        tone="Friendly"
        text={`Hi [Candidate Name],

Thank you so much for coming in for the interview — we really enjoyed our conversation! After speaking with all the candidates, we've decided to go with someone whose background is a closer match for what we need right now.

We were genuinely impressed with you and hope you'll keep an eye on our future openings. Wishing you all the best!

[Your Name]`}
      />

      <TemplateCard
        label="Template 6"
        tone="Hinglish"
        text={`Hi [Candidate Name],

Interview ke liye aana aur apna time dena — bahut shukriya! Aapke saath baat karke genuinely achha laga.

Lekin is position ke liye humne ek aur candidate ko select kiya hai jinka background thoda zyada match karta tha. Ye decision bahut tough tha, kyunki aap bhi strong candidate the.

Future mein koi opening hogi toh zaroor batayenge. Take care!

[Your Name]`}
      />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Final Round Rejection (Reached Last Stage)</h2>

      <TemplateCard
        label="Template 7"
        tone="Formal"
        text={`Subject: Final Round Outcome — [Role]

Dear [Candidate Name],

Thank you for your time and effort throughout our selection process. We recognize the commitment it takes to go through multiple rounds of interviews, and we genuinely appreciate your patience.

After much deliberation, we have decided to extend an offer to another candidate for this role. This was an extremely difficult decision — you were among our top candidates.

We would very much like to stay in touch and will proactively reach out should a suitable opportunity arise. Thank you again for your interest in joining [Company Name].

Best regards,
[Your Name]`}
      />

      <TemplateCard
        label="Template 8"
        tone="Friendly"
        text={`Hi [Candidate Name],

We really appreciate all the time you've put into the interview process — from the initial rounds all the way to the final stage. It means a lot.

After a lot of deliberation (and this was genuinely a very close call), we've decided to go with another candidate for this particular role. We want you to know you made a great impression on everyone you met.

We'd love to keep in touch — honestly, we'll be reaching out for the right role. Please don't hesitate to apply again. Wishing you the best!

[Your Name]`}
      />

      <TemplateCard
        label="Template 9"
        tone="Hinglish"
        text={`Hi [Candidate Name],

Puri selection process ke through itna time aur energy dene ke liye sach mein bahut shukriya. Aap clearly bahut dedicated hain.

Honest rehna chahta/chahti hun — ye decision bahut difficult tha. Aap our top candidates mein the, lekin is baar humne ek aur candidate ko select kiya.

Lekin ye "goodbye" nahi hai. Jab bhi right opening aaye, hum aapse zaroor contact karenge. Future ke liye sabse achha chahte hain aapko!

[Your Name]`}
      />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">WhatsApp Rejection (Short Format)</h2>

      <TemplateCard
        label="Template 10"
        tone="WhatsApp / Hinglish"
        text={`Hi [Name], [Company] ki taraf se update dena chahta/chahti tha — is baar [Role] ke liye hum aage nahi badh pa rahe. Aapka profile strong hai, future mein koi suitable role aaye toh zaroor batayenge. Best of luck! 🙏`}
      />

      <h2 className="text-xl font-bold text-ink mt-10 mb-4">Tips for Rejecting Candidates in India</h2>
      <ul className="space-y-3 text-sm text-ink-secondary">
        {[
          'Always reject by name — "Dear Priya" feels more human than "Dear Candidate".',
          'Don\'t give vague reasons like "we found a better fit" — candidates appreciate specific feedback if you can share it.',
          'Reject within 3–5 working days of the decision. Ghosting damages your employer brand.',
          'If a candidate asks for feedback, give one specific, honest point — it costs you nothing and helps them a lot.',
          'For Hinglish, keep it warm but professional — it works best for WhatsApp and for placement consultants.',
          'Always leave the door open — "we\'d love to stay in touch" often leads to future hires.',
        ].map((tip) => (
          <li key={tip} className="flex gap-2">
            <span className="text-accent-icon shrink-0 mt-0.5">→</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 bg-primary-deep text-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Generate a custom rejection message in seconds</h2>
        <p className="text-gray-400 text-sm mb-5">
          Paste the candidate&apos;s name, role, and situation — HRReply writes the perfect message in formal, friendly, or Hinglish.
        </p>
        <Link
          href="/login?mode=signup"
          className="inline-flex items-center gap-2 bg-accent text-primary-deep font-semibold px-6 py-3 rounded-lg hover:bg-accent-hover transition-colors text-sm"
        >
          Try free — 50 replies/month <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  )
}
