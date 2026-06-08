import Link from 'next/link'
import { Zap, Check, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-gray-950" />
          </div>
          <span className="font-bold text-sm">HR<span className="text-green-400">Reply</span>.ai</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="bg-green-500 text-gray-950 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="px-8 pt-24 pb-16 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-4 py-1.5 text-green-400 text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          AI REPLY ASSISTANT FOR INDIAN RECRUITERS
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-5">
          Stop copy-pasting.<br />
          <span className="text-green-400">Reply smarter.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Generate perfect HR messages in seconds — Formal English, Friendly English, or Hinglish.
          Built for Indian recruiters who handle 40–80 candidates a day.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="bg-green-500 text-gray-950 font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors flex items-center gap-2"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            Try without signing up →
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="px-8 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: '🤖',
              title: 'AI Reply Generator',
              desc: 'Paste candidate context → pick reply type → get the perfect message in one click.',
            },
            {
              icon: '🌐',
              title: 'Formal / Friendly / Hinglish',
              desc: 'The same message rewritten in the exact tone you need — including natural Hinglish.',
            },
            {
              icon: '📋',
              title: '20+ HR Templates',
              desc: 'Offer, rejection, interview invite, reschedule, follow-up — all India-context aware.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing teaser */}
      <div className="px-8 py-12 max-w-2xl mx-auto text-center border-t border-gray-900">
        <h2 className="text-2xl font-bold mb-2">Start free. Upgrade when you need more.</h2>
        <p className="text-gray-400 text-sm mb-6">50 free replies/month. Pro at ₹799/mo for unlimited.</p>
        <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
          {['No credit card required', 'Cancel anytime', 'Works in your browser — no install needed'].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" /> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
