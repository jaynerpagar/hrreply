import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'WhatsApp HR Message Templates for Indian Recruiters — 15 Ready Templates',
  description: 'Copy-paste WhatsApp HR messages for Indian recruiters — interview invites, rejections, offer updates, follow-ups, and no-show messages in English and Hinglish.',
  metadataBase: new URL('https://www.hrreply.in'),
  openGraph: {
    title: 'WhatsApp HR Message Templates for Indian Recruiters — 15 Templates',
    description: 'Ready-to-use WhatsApp messages for recruiters: interview invites, rejections, offer letters, follow-ups in English and Hinglish.',
    url: 'https://www.hrreply.in/guides/whatsapp-hr-templates',
  },
}

function T({ num, label, tone, text }: { num: number; label: string; tone: string; text: string }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-primary-deep text-white text-xs font-bold flex items-center justify-center shrink-0">{num}</span>
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs bg-accent-soft text-accent-icon font-medium px-2 py-0.5 rounded-full ml-auto">{tone}</span>
      </div>
      <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  )
}

export default function WhatsAppTemplatesPage() {
  return (
    <article>
      <div className="mb-8">
        <Link href="/guides" className="text-xs text-ink-muted hover:text-ink transition-colors">← All guides</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink mt-3 mb-3">
          WhatsApp HR Message Templates for Indian Recruiters
        </h1>
        <p className="text-ink-secondary text-lg leading-relaxed">
          In India, most candidate communication happens on WhatsApp — not email. Here are 15 copy-paste templates for every hiring scenario, in a format that reads naturally on WhatsApp.
        </p>
      </div>

      <div className="bg-accent-soft border border-accent/20 rounded-xl p-5 mb-8 text-sm text-ink-secondary">
        <strong className="text-ink">WhatsApp formatting tip:</strong> Keep messages under 5 lines. Use first name always. Avoid corporate jargon — it feels robotic on WhatsApp. Emojis are optional but a single 🙏 at the end works well in Indian context.
      </div>

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Interview Invite Messages</h2>

      <T num={1} label="Phone screen / first call" tone="Friendly English"
        text={`Hi [Name], this is [Your Name] from [Company]. We came across your profile and think you could be a great fit for our [Role] opening. Would you be available for a quick 15-min call this week? Let me know a time that works for you. Thanks!`} />

      <T num={2} label="Interview invite (with time slot)" tone="Formal"
        text={`Dear [Name], thank you for your interest in the [Role] position at [Company]. We would like to invite you for an interview on [Date] at [Time] at our office: [Address]. Please confirm your availability. For any queries, feel free to reach out. Regards, [Your Name]`} />

      <T num={3} label="Interview invite" tone="Hinglish"
        text={`Hi [Name]! [Company] mein [Role] ke liye aapka profile dekha — aap bilkul fit lagte hain. Kya [Date] ko [Time] baje ek short call ho sakti hai? Confirm kar do please. 🙏`} />

      <T num={4} label="Technical / online interview link" tone="Friendly English"
        text={`Hi [Name], your interview for [Role] at [Company] is scheduled for [Date] at [Time]. It will be conducted on Google Meet / Zoom — link: [Link]. Please keep your video on and be on time. Feel free to ping me if you face any issues. Good luck!`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Follow-Up Messages</h2>

      <T num={5} label="No response after applying" tone="Friendly English"
        text={`Hi [Name], just following up on your application for [Role] at [Company]. We've received your resume and our team is reviewing it. We'll get back to you within [X] working days. Thanks for your patience!`} />

      <T num={6} label="Follow-up after interview (result pending)" tone="Formal"
        text={`Dear [Name], thank you for attending the interview on [Date]. Our team is currently evaluating all candidates and we will share the outcome by [Date]. We appreciate your patience and will be in touch shortly.`} />

      <T num={7} label="Candidate not responding to calls" tone="Hinglish"
        text={`Hi [Name], aapse 2-3 baar call karne ki koshish ki lekin connect nahi ho paya. [Role] ke baare mein baat karni thi — agar abhi bhi interested hain toh please is message ka reply karein ya call kar lein [Number] pe. Thanks!`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Rejection Messages</h2>

      <T num={8} label="Post-resume screening rejection" tone="Friendly English"
        text={`Hi [Name], thanks for applying for [Role] at [Company]. We've reviewed your profile and unfortunately won't be moving forward at this time. We'll keep your resume on file for future openings. All the best! 🙏`} />

      <T num={9} label="Post-interview rejection" tone="Formal"
        text={`Dear [Name], thank you for interviewing with us for the [Role] position. After careful evaluation, we have decided to move forward with another candidate. We appreciate your time and wish you success in your search.`} />

      <T num={10} label="Post-interview rejection" tone="Hinglish"
        text={`Hi [Name], interview ke liye time dene ke liye shukriya. Is baar hum aage nahi badh pa rahe — ye decision bahut tough tha. Future mein koi suitable role aaya toh zaroor contact karenge. Best of luck! 🙏`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Offer & Onboarding Messages</h2>

      <T num={11} label="Verbal offer (before formal letter)" tone="Friendly English"
        text={`Hi [Name], great news — we'd love to have you on board! We'll be sending the formal offer letter by [Date]. The CTC is [Amount] as discussed. Please let me know if you have any questions. Looking forward to having you with us!`} />

      <T num={12} label="Offer letter sent" tone="Formal"
        text={`Dear [Name], please find your offer letter attached. Kindly review it and revert with your acceptance by [Date]. If you have any questions regarding the terms, do not hesitate to reach out. We look forward to welcoming you to the team.`} />

      <T num={13} label="Joining date confirmation" tone="Friendly English"
        text={`Hi [Name]! Just confirming your joining date is [Date]. Please bring your original documents: [List]. Report to [Location] by [Time]. Excited to have you join the team! 🎉`} />

      <h2 className="text-xl font-bold text-ink mt-8 mb-4">Special Situations</h2>

      <T num={14} label="Candidate no-show for interview" tone="Professional"
        text={`Hi [Name], we had your interview scheduled today at [Time] but we weren't able to connect. If something came up, please let me know — we'd be happy to reschedule if you're still interested in the [Role] position.`} />

      <T num={15} label="Candidate accepted another offer" tone="Warm"
        text={`Hi [Name], completely understand — congratulations on your new role! If things change or you're exploring opportunities in the future, do keep [Company] in mind. Wishing you all the best! 🙏`} />

      <h2 className="text-xl font-bold text-ink mt-10 mb-4">Best Practices for WhatsApp Recruiting in India</h2>
      <ul className="space-y-3 text-sm text-ink-secondary">
        {[
          'Always introduce yourself and your company in the first message — many candidates get messages from unknown numbers.',
          'Message between 9 AM – 7 PM only. Avoid weekends unless urgent.',
          'Keep messages under 5 lines. If you need to share more, send it as a follow-up message.',
          'Always use the candidate\'s first name — it dramatically increases response rates.',
          'For rejections on WhatsApp, Hinglish or friendly English feels less cold than formal English.',
          'If a candidate doesn\'t respond to WhatsApp, try calling once before marking as unresponsive.',
          'Save your templates in WhatsApp\'s "Quick Replies" feature (Settings → Business Tools) to send them in one tap.',
        ].map((tip) => (
          <li key={tip} className="flex gap-2">
            <span className="text-accent-icon shrink-0 mt-0.5">→</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 bg-primary-deep text-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Generate any WhatsApp HR message in seconds</h2>
        <p className="text-gray-400 text-sm mb-5">
          Paste the situation, pick formal / friendly / Hinglish — HRReply writes a message ready to copy into WhatsApp.
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
