import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { Logo, LogoMark } from '@/components/ui/logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-page text-ink font-sans">
      {/* Nav */}
      <nav className="border-b border-surface-border bg-surface-card/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link
              href="/login?mode=signup"
              className="bg-primary text-ink-inverse text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 bg-accent-soft text-accent-text text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-icon" />
          AI reply assistant for Indian recruiters
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-[1.1] mb-5">
          Stop copy-pasting.<br />
          Reply <span className="relative whitespace-nowrap">
            smarter.
            <span className="absolute left-0 -bottom-1 w-full h-3 bg-accent/50 -z-0 rounded-sm" />
          </span>
        </h1>
        <p className="text-lg text-ink-secondary max-w-xl mx-auto mb-8 leading-relaxed">
          Generate perfect HR messages in seconds — formal English, friendly English, or Hinglish.
          Built for Indian recruiters handling 40–80 candidates a day.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/login?mode=signup"
            className="bg-primary text-ink-inverse font-semibold px-5 py-3 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors border border-surface-borderStrong px-5 py-3 rounded-lg hover:bg-surface-sunken"
          >
            Sign in
          </Link>
        </div>
        <p className="text-[13px] text-ink-muted mt-4">50 free replies/month · No credit card needed</p>
      </div>

      {/* Product preview */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <div className="bg-primary-deep rounded-2xl shadow-raised p-8 sm:p-12 flex flex-col items-center text-center">
          <LogoMark size={56} className="mb-5" />
          <p className="text-white font-semibold text-lg mb-1">Two ticks. Message handled.</p>
          <p className="text-gray-400 text-sm max-w-md">
            Pick a reply type, drop in the candidate context, and get a ready-to-send message in your tone — instantly.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-12 border-t border-surface-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: '🤖',
              title: 'AI reply generator',
              desc: 'Paste candidate context → pick reply type → get the perfect message in one click.',
            },
            {
              icon: '🌐',
              title: 'Formal / friendly / Hinglish',
              desc: 'The same message rewritten in the exact tone you need, including natural Hinglish.',
            },
            {
              icon: '📋',
              title: '20+ HR templates',
              desc: 'Offer, rejection, interview invite, reschedule, follow-up — all India-context aware.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5 hover:shadow-raised hover:border-surface-borderStrong transition-all">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-sm text-ink mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-ink-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing teaser */}
      <div className="max-w-2xl mx-auto px-6 py-12 text-center border-t border-surface-border">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink mb-2">Start free. Upgrade when you need more.</h2>
        <p className="text-ink-secondary text-sm mb-6">50 free replies/month. Pro at ₹799/mo for unlimited.</p>
        <div className="flex flex-col items-center gap-2 text-sm text-ink-secondary">
          {['No credit card required', 'Cancel anytime', 'Works in your browser — no install needed'].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent-icon" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-deep text-ink-inverse">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <Logo size="sm" theme="dark" />
          <span>© 2026 HRReply.in — AI reply assistant for Indian recruiters</span>
        </div>
      </footer>
    </div>
  )
}
