import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'HR Guides & Templates for Indian Recruiters — HRReply.in',
  description: 'Free HR message templates, rejection emails, interview invites, and WhatsApp messages for Indian recruiters and placement consultants.',
  metadataBase: new URL('https://www.hrreply.in'),
  openGraph: {
    title: 'HR Guides & Templates for Indian Recruiters — HRReply.in',
    description: 'Free HR message templates for Indian recruiters. Rejection emails, interview invites, WhatsApp messages, and more.',
    url: 'https://www.hrreply.in/guides',
  },
}

const GUIDES = [
  {
    href: '/guides/reject-candidate-politely',
    title: 'How to Reject a Candidate Politely — 10 Templates (Email + WhatsApp)',
    desc: 'Word-for-word rejection messages in formal English, friendly English, and Hinglish. Copy-paste ready for Indian recruiters.',
    time: '5 min read',
  },
  {
    href: '/guides/whatsapp-hr-templates',
    title: 'WhatsApp HR Message Templates for Indian Recruiters — 15 Ready Templates',
    desc: 'Interview invites, rejections, offer letters, follow-ups, and no-show messages — all formatted for WhatsApp.',
    time: '6 min read',
  },
  {
    href: '/guides/interview-invite-templates',
    title: 'Interview Invite Message Templates — Email, WhatsApp & Hinglish',
    desc: 'Professional interview call messages for every stage — phone screen, technical round, HR round, and final interview.',
    time: '5 min read',
  },
]

export default function GuidesIndex() {
  return (
    <div>
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Resources</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink mt-2 mb-3">HR Guides & Templates</h1>
        <p className="text-ink-secondary text-lg">
          Free message templates and guides for Indian recruiters — formal, friendly, and Hinglish.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {GUIDES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group bg-surface-card border border-surface-border rounded-xl p-6 hover:border-surface-borderStrong hover:shadow-card transition-all flex items-start justify-between gap-4"
          >
            <div>
              <h2 className="font-bold text-ink mb-1.5 group-hover:text-primary transition-colors">{g.title}</h2>
              <p className="text-sm text-ink-secondary leading-relaxed">{g.desc}</p>
              <span className="text-xs text-ink-muted mt-2 inline-block">{g.time}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-muted shrink-0 mt-1 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-primary-deep text-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Generate any HR message in seconds</h2>
        <p className="text-gray-400 text-sm mb-5">Paste the situation, pick a tone — formal, friendly, or Hinglish — and get a ready-to-send message.</p>
        <Link
          href="/login?mode=signup"
          className="inline-flex items-center gap-2 bg-accent text-primary-deep font-semibold px-6 py-3 rounded-lg hover:bg-accent-hover transition-colors text-sm"
        >
          Try free — 50 replies/month <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
