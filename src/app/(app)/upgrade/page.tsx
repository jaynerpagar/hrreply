import { Check, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/mo',
    desc: '50 AI replies/month. Reset every 30 days. No credit card needed.',
    featured: false,
    features: [
      { label: '50 replies per month', included: true },
      { label: 'All 20+ base templates', included: true },
      { label: 'English + Hinglish tones', included: true },
      { label: 'Reply history (30 days)', included: true },
      { label: 'Candidate tracker', included: false },
      { label: 'Custom templates', included: false },
      { label: 'Follow-up reminders', included: false },
      { label: 'Bulk composer', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '₹799',
    period: '/mo',
    desc: 'Unlimited replies. Full candidate tracker. For serious recruiters.',
    featured: true,
    features: [
      { label: 'Unlimited AI replies', included: true },
      { label: 'All templates + save custom', included: true },
      { label: 'All 3 tones + regenerate', included: true },
      { label: 'Candidate tracker (100)', included: true },
      { label: 'Follow-up reminders', included: true },
      { label: 'Reply analytics', included: true },
      { label: 'Full reply history', included: true },
      { label: 'Team seats', included: false },
    ],
  },
  {
    name: 'Team',
    price: '₹499',
    period: '/seat/mo',
    desc: 'For HR teams at companies. Min 3 seats. Shared templates & admin dashboard.',
    featured: false,
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Shared template library', included: true },
      { label: 'Team analytics dashboard', included: true },
      { label: 'Admin controls', included: true },
      { label: 'Unlimited candidates', included: true },
      { label: 'Bulk composer', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom onboarding', included: true },
    ],
  },
]

export default function UpgradePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-4 py-1.5 text-green-400 text-xs font-mono mb-4">
          <Zap className="w-3 h-3" /> UPGRADE YOUR PLAN
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h1>
        <p className="text-gray-400 text-sm mt-2">Start free — upgrade when you need more power.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-6 border ${
              plan.featured
                ? 'border-green-500 bg-gradient-to-b from-green-500/5 to-gray-900'
                : 'border-gray-800 bg-gray-900'
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-gray-950 text-[10px] font-bold font-mono px-3 py-1 rounded-full whitespace-nowrap">
                ★ Most Popular
              </div>
            )}
            <div className="mb-1 text-xs font-mono text-gray-500 uppercase tracking-widest">{plan.name}</div>
            <div className="text-3xl font-bold tracking-tight mb-0.5">
              {plan.price}
              <span className="text-sm text-gray-500 font-normal">{plan.period}</span>
            </div>
            <p className="text-xs text-gray-500 mb-5 pb-5 border-b border-gray-800">{plan.desc}</p>
            <div className="space-y-2 mb-6">
              {plan.features.map(({ label, included }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  {included ? (
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-700 shrink-0" />
                  )}
                  <span className={included ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
                </div>
              ))}
            </div>
            <Button
              variant={plan.featured ? 'primary' : 'secondary'}
              className="w-full"
              disabled={plan.name === 'Free'}
            >
              {plan.name === 'Free' ? 'Current Plan' : `Get ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        Payments via Razorpay · UPI, Cards, Net Banking · Cancel anytime
      </p>
    </div>
  )
}
