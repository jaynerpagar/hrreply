import Link from 'next/link'
import { Sparkles, Check, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-page text-ink font-sans">
      {/* Nav */}
      <nav className="border-b border-surface-border bg-surface-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-ink">
              HRReply<span className="text-primary">.in</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-secondary hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link
              href="/login"
              className="bg-primary text-ink-inverse text-sm font-medium px-4 py-2 rounded hover:bg-primary-hover transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 bg-primary-soft text-primary-deep text-xs font-medium px-3 py-1 rounded-full mb-6">
          AI reply assistant for Indian recruiters
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold text-primary-deep leading-tight mb-4">
          Stop copy-pasting.<br />Reply smarter.
        </h1>
        <p className="text-lg text-ink-secondary max-w-xl mx-auto mb-8 leading-relaxed">
          Generate perfect HR messages in seconds — formal English, friendly English, or Hinglish.
          Built for Indian recruiters handling 40–80 candidates a day.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/login"
            className="bg-primary text-ink-inverse font-medium px-5 py-2.5 rounded hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-ink-secondary hover:text-ink transition-colors border border-surface-borderStrong px-5 py-2.5 rounded hover:bg-surface-sunken"
          >
            Try without signing up
          </Link>
        </div>
      </div>

      {/* Product preview placeholder */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <div className="bg-surface-card border border-surface-border rounded-lg shadow-raised p-6 text-center text-ink-muted text-sm">
          Product screenshot
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
            <div key={f.title} className="bg-surface-card border border-surface-border rounded-lg shadow-card p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm text-ink mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-ink-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing teaser */}
      <div className="max-w-2xl mx-auto px-6 py-12 text-center border-t border-surface-border">
        <h2 className="text-2xl font-semibold text-primary-deep mb-2">Start free. Upgrade when you need more.</h2>
        <p className="text-ink-secondary text-sm mb-6">50 free replies/month. Pro at ₹799/mo for unlimited.</p>
        <div className="flex flex-col items-center gap-2 text-sm text-ink-secondary">
          {['No credit card required', 'Cancel anytime', 'Works in your browser — no install needed'].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-status-placed" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-deep text-ink-inverse">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-blue-200">
          <span>HRReply.in — AI reply assistant for Indian recruiters</span>
          <span>© 2025</span>
        </div>
      </footer>
    </div>
  )
}
