import Link from 'next/link'
import { Check, ArrowRight, Wand2, BookOpen, Users, Zap, MessageSquare, BarChart3, Star } from 'lucide-react'
import { Logo, LogoMark } from '@/components/ui/logo'

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI reply generator',
    desc: 'Paste candidate context, pick reply type, and get a ready-to-send message in one click.',
    gradient: 'from-violet-500/10 to-purple-500/5',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10',
  },
  {
    icon: MessageSquare,
    title: 'Formal / Friendly / Hinglish',
    desc: 'The same message in three tones — including natural Hinglish that actually sounds like you.',
    gradient: 'from-accent/10 to-green-500/5',
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
  },
  {
    icon: BookOpen,
    title: '20+ HR templates',
    desc: 'Offer letter, rejection, interview invite, reschedule — every scenario covered.',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  {
    icon: Users,
    title: 'Candidate tracker',
    desc: 'Track your pipeline from applied to hired with notes and one-click reply generation.',
    gradient: 'from-orange-500/10 to-amber-500/5',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
  },
  {
    icon: BarChart3,
    title: 'Reply history',
    desc: 'Every message you generate is saved. Search, reuse, and learn what works.',
    gradient: 'from-pink-500/10 to-rose-500/5',
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/10',
  },
  {
    icon: Zap,
    title: 'Ready in 60 seconds',
    desc: 'Sign up and start generating instantly. No prompts to learn, no AI expertise required.',
    gradient: 'from-yellow-500/10 to-amber-500/5',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Describe the situation',
    desc: "Paste the candidate's name, role, and what happened — rejection, offer, no-show, follow-up.",
  },
  {
    num: '02',
    title: 'Choose your tone',
    desc: 'Formal English for corporates, friendly English for startups, or Hinglish for a personal touch.',
  },
  {
    num: '03',
    title: 'Copy and send',
    desc: "Your message is ready in under 3 seconds. Copy it to WhatsApp, email, or LinkedIn and you're done.",
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    desc: '25 replies per month. No credit card.',
    features: ['25 AI replies/month', 'All 20+ templates', 'Formal + Hinglish tones', 'Reply history (30 days)'],
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

const TESTIMONIALS = [
  {
    name: 'Ananya Sharma',
    role: 'HR Manager · Bangalore',
    text: 'I used to spend 20 minutes on every rejection email. Now I do it in 30 seconds. The Hinglish tone is spot on for WhatsApp.',
    stars: 5,
  },
  {
    name: 'Rajan Mehta',
    role: 'Placement Consultant · Mumbai',
    text: 'Handling 60+ candidates a day, HRReply saves me at least 2 hours. The templates cover every situation I run into.',
    stars: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Talent Acquisition · Hyderabad',
    text: 'Finally a tool built for Indian recruiters. The formal + friendly + Hinglish options are exactly what I needed.',
    stars: 5,
  },
]

const STATS = [
  { value: '10,000+', label: 'Messages generated' },
  { value: '20+', label: 'HR templates' },
  { value: '3', label: 'Tones: Formal, Friendly, Hinglish' },
  { value: '<3s', label: 'Time to generate' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white font-sans overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="border-b border-white/8 bg-[#0F1117]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" theme="dark" />
          <div className="flex items-center gap-6">
            <Link href="/guides" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Guides
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/login?mode=signup"
              className="bg-accent text-[#0F1117] text-sm font-bold px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left: Copy */}
            <div>
              <span className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                AI reply assistant for Indian HR
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.08] mb-6">
                Stop copy-pasting.<br />
                <span className="text-accent">Reply smarter.</span>
              </h1>

              <p className="text-lg text-gray-400 max-w-lg mb-8 leading-relaxed">
                Generate perfect candidate messages in seconds — formal English, friendly English, or Hinglish.
                Built for Indian recruiters handling 40–80 candidates a day.
              </p>

              <div className="flex items-center gap-3 flex-wrap mb-6">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center gap-2 bg-accent text-[#0F1117] font-bold px-6 py-3.5 rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 text-sm"
                >
                  Get started free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-2 border border-white/15 text-gray-300 font-medium px-6 py-3.5 rounded-xl hover:bg-white/5 transition-colors text-sm"
                >
                  View templates
                </Link>
              </div>

              <div className="flex items-center gap-4 text-[13px] text-gray-500">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-accent" /> 25 free replies/month</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-accent" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-accent" /> Cancel anytime</span>
              </div>
            </div>

            {/* Right: Product preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-xl" />
              <div className="relative bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl">
                {/* Browser bar */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/8">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                  <span className="text-gray-600 text-xs ml-2 font-mono">hrreply.in/generator</span>
                </div>

                <div className="space-y-3 text-sm">
                  {/* Situation */}
                  <div className="bg-white/5 rounded-xl p-3.5 border border-white/8">
                    <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Situation</p>
                    <p className="text-gray-200 text-[13px] leading-relaxed">Candidate Priya cleared round 2 but we selected another person. Need to reject politely.</p>
                  </div>

                  {/* Tone picker */}
                  <div className="flex gap-2">
                    {['Formal', 'Friendly', 'Hinglish'].map((t) => (
                      <span
                        key={t}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                          t === 'Friendly'
                            ? 'bg-accent/20 text-accent border-accent/30'
                            : 'text-gray-500 border-white/8 bg-white/3'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Generated output */}
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 border border-accent/20">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full bg-accent/80 flex items-center justify-center shrink-0">
                        <svg width="8" height="8" viewBox="0 0 100 100">
                          <path d="M20 52 L36 70 L64 32" fill="none" stroke="#1F2937" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M44 66 L48 70 L78 32" fill="none" stroke="#1F2937" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-accent text-[11px] font-semibold uppercase tracking-wider">Generated in 2.1s</p>
                    </div>
                    <p className="text-gray-200 text-[13px] leading-relaxed">
                      Hi Priya, thank you so much for interviewing with us! After careful consideration, we&apos;ve decided to move forward with another candidate. We were genuinely impressed — please do apply for future roles. Wishing you the very best! 🙏
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors">
                        Copy message
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-[11px] px-2 py-1.5 rounded-lg transition-colors">
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="border-y border-white/8 bg-white/3">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-accent tracking-tight">{s.value}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Everything an Indian recruiter needs</h2>
            <p className="text-gray-400 max-w-xl mx-auto">One tool for all your candidate communication — no more juggling templates across WhatsApp, email, and spreadsheets.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
              <div
                key={title}
                className="group bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/7 hover:border-white/15 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-white/3 border-y border-white/8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">From situation to sent message in 30 seconds</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+32px)] right-[-50%] h-px bg-gradient-to-r from-white/15 to-transparent" />
                )}
                <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-extrabold text-lg mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Loved by Indian recruiters</h2>
            <p className="text-gray-400">Real feedback from HR professionals across India.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/4 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 bg-white/3 border-y border-white/8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Simple, honest pricing</h2>
            <p className="text-gray-400">Start free. Upgrade only when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col gap-5 relative ${
                  plan.featured
                    ? 'bg-accent text-[#0F1117] shadow-2xl shadow-accent/20 scale-105'
                    : 'bg-white/4 border border-white/10 text-white'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F1117] text-accent text-[11px] font-bold px-3 py-1 rounded-full border border-accent/30 whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.featured ? 'text-[#1F2937]/70' : 'text-gray-500'}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    {plan.period && <span className={`text-sm ${plan.featured ? 'text-[#1F2937]/60' : 'text-gray-400'}`}>{plan.period}</span>}
                  </div>
                  <p className={`text-[13px] mt-1 pb-4 border-b ${plan.featured ? 'text-[#1F2937]/70 border-[#1F2937]/15' : 'text-gray-400 border-white/8'}`}>{plan.desc}</p>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 shrink-0 ${plan.featured ? 'text-[#1F2937]' : 'text-accent'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${
                    plan.featured
                      ? 'bg-[#0F1117] text-white hover:bg-[#1a1e2a]'
                      : 'border border-white/15 text-white hover:bg-white/8'
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
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/6 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <LogoMark size={52} className="mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Start writing better HR messages today
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            25 free replies every month. No credit card required.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 bg-accent text-[#0F1117] font-bold px-8 py-4 rounded-xl hover:bg-accent-hover transition-all shadow-xl shadow-accent/25 text-base"
          >
            Get started free <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-600 text-sm mt-5">Join 500+ Indian recruiters saving time every day</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" theme="dark" />
          <div className="flex items-center gap-6 text-sm text-gray-600">
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
