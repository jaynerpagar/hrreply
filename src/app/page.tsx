import Link from 'next/link'
import { Check, ArrowRight, Wand2, BookOpen, Users, Zap, MessageSquare, BarChart3 } from 'lucide-react'
import { Logo, LogoMark } from '@/components/ui/logo'

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI reply generator',
    desc: 'Paste candidate context, pick reply type, and get a ready-to-send message in one click. No more starting from scratch.',
  },
  {
    icon: MessageSquare,
    title: 'Formal / Friendly / Hinglish',
    desc: 'The same message rewritten in the exact tone you need — including natural Hinglish that actually sounds like you.',
  },
  {
    icon: BookOpen,
    title: '20+ HR templates',
    desc: 'Offer letter, rejection, interview invite, reschedule, follow-up — every scenario covered with India-context awareness.',
  },
  {
    icon: Users,
    title: 'Candidate tracker',
    desc: 'Track your pipeline from applied to hired. Stage changes, notes, and one-click reply generation per candidate.',
  },
  {
    icon: BarChart3,
    title: 'Reply history',
    desc: 'Every message you generate is saved. Search, reuse, and learn what works best for each situation.',
  },
  {
    icon: Zap,
    title: 'Instant — no training needed',
    desc: 'Sign up and start generating in under 60 seconds. No prompts to learn, no AI expertise required.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Describe the situation',
    desc: "Paste the candidate's name, role, and what happened — rejection, offer, no-show, follow-up needed.",
  },
  {
    num: '02',
    title: 'Choose your tone',
    desc: 'Formal English for corporates, friendly English for startups, or Hinglish for a personal touch.',
  },
  {
    num: '03',
    title: 'Copy and send',
    desc: 'Your message is ready in under 3 seconds. Copy it to WhatsApp, email, or LinkedIn and you\'re done.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    desc: '50 replies per month. No credit card.',
    features: ['50 AI replies/month', 'All 20+ templates', 'Formal + Hinglish tones', 'Reply history (30 days)'],
    cta: 'Get started free',
    href: '/login?mode=signup',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₹799',
    period: '/mo',
    desc: 'Unlimited replies. For serious recruiters.',
    features: ['Unlimited AI replies', 'Candidate tracker', 'Save custom templates', 'Full reply history', 'All tones + regenerate'],
    cta: 'Start Pro',
    href: '/login?mode=signup',
    featured: true,
  },
  {
    name: 'Team',
    price: '₹499',
    period: '/seat/mo',
    desc: 'Min 3 seats. For HR teams.',
    features: ['Everything in Pro', 'Shared templates', 'Team analytics', 'Admin controls', 'Priority support'],
    cta: 'Start Team',
    href: '/login?mode=signup',
    featured: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-page text-ink font-sans">

      {/* ── Nav ── */}
      <nav className="border-b border-surface-border bg-surface-card/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link
              href="/login?mode=signup"
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-primary-deep text-white">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              AI reply assistant for Indian HR
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
              Stop copy-pasting.<br />
              <span className="text-accent">Reply smarter.</span>
            </h1>

            <p className="text-lg text-gray-300 max-w-xl mb-8 leading-relaxed">
              Generate perfect candidate messages in seconds — formal English, friendly English, or Hinglish.
              Built for Indian recruiters handling 40–80 candidates a day.
            </p>

            <div className="flex items-center gap-3 flex-wrap mb-8">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-2 bg-accent text-primary-deep font-semibold px-6 py-3 rounded-lg hover:bg-accent-hover transition-colors text-sm"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Sign in
              </Link>
            </div>

            <p className="text-gray-500 text-[13px]">50 free replies/month · No credit card · Cancel anytime</p>
          </div>
        </div>

        {/* Product preview strip */}
        <div className="border-t border-white/10 bg-white/5">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                <span className="text-gray-500 text-xs ml-2">hrreply.in/generator</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-gray-400 text-xs mb-1">Situation</p>
                  <p className="text-gray-200">Candidate Priya cleared round 2 but we selected another person. Need to reject politely.</p>
                </div>
                <div className="flex gap-2">
                  {['Formal', 'Friendly', 'Hinglish'].map((t) => (
                    <span key={t} className={`px-3 py-1 rounded-full text-xs font-medium border ${t === 'Friendly' ? 'bg-accent/20 text-accent border-accent/30' : 'text-gray-400 border-white/10'}`}>{t}</span>
                  ))}
                </div>
                <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                  <p className="text-gray-400 text-xs mb-1.5 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-accent/80 inline-flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 100 100"><path d="M20 52 L36 70 L64 32" fill="none" stroke="#1F2937" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /><path d="M44 66 L48 70 L78 32" fill="none" stroke="#1F2937" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    Generated message
                  </p>
                  <p className="text-gray-200 leading-relaxed">Hi Priya, thank you so much for taking the time to interview with us. After careful consideration, we have decided to move forward with another candidate for this role. We were genuinely impressed with your skills and encourage you to apply for future opportunities. Wishing you all the best!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 border-t border-surface-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-3">Everything an Indian recruiter needs</h2>
            <p className="text-ink-secondary max-w-xl mx-auto">One tool for all your candidate communication — no more juggling templates across WhatsApp, email, and spreadsheets.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-surface-card border border-surface-border rounded-xl p-5 hover:border-surface-borderStrong hover:shadow-card transition-all">
                <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-accent-icon" />
                </div>
                <h3 className="font-bold text-sm text-ink mb-1.5">{title}</h3>
                <p className="text-[13px] text-ink-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-surface-sunken border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-3">How it works</h2>
            <p className="text-ink-secondary">From situation to sent message in under 30 seconds.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+24px)] right-0 h-px bg-surface-border" />
                )}
                <div className="w-10 h-10 rounded-full bg-primary-deep text-white flex items-center justify-center text-sm font-bold mb-4 shrink-0 relative z-10">
                  {i + 1}
                </div>
                <h3 className="font-bold text-ink mb-2">{step.title}</h3>
                <p className="text-[13px] text-ink-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 border-t border-surface-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-3">Simple, honest pricing</h2>
            <p className="text-ink-secondary">Start free. Upgrade only when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-surface-card rounded-xl p-6 flex flex-col gap-4 border-2 ${plan.featured ? 'border-primary' : 'border-surface-border'}`}
              >
                {plan.featured && (
                  <span className="self-start inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary-deep">
                    Most popular
                  </span>
                )}
                <div>
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[28px] font-bold text-ink">{plan.price}</span>
                    {plan.period && <span className="text-sm text-ink-secondary">{plan.period}</span>}
                  </div>
                  <p className="text-[13px] text-ink-secondary mt-1 pb-4 border-b border-surface-border">{plan.desc}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent-icon shrink-0" />
                      <span className="text-ink">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'border border-surface-borderStrong text-ink hover:bg-surface-sunken'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-primary-deep py-16 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <LogoMark size={48} className="mx-auto mb-5" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
            Start writing better HR messages today
          </h2>
          <p className="text-gray-400 mb-8">
            50 free replies every month. No credit card required.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 bg-accent text-primary-deep font-semibold px-7 py-3.5 rounded-lg hover:bg-accent-hover transition-colors"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-primary-deep border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" theme="dark" />
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/guides" className="hover:text-gray-300 transition-colors">Guides</Link>
            <Link href="/login?mode=signup" className="hover:text-gray-300 transition-colors">Sign up</Link>
            <Link href="/login" className="hover:text-gray-300 transition-colors">Sign in</Link>
            <span>© 2026 HRReply.in</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
