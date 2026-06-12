import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/card'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/mo',
    desc: '50 AI replies per month. Resets every 30 days. No credit card needed.',
    current: true,
    features: [
      { label: '50 replies per month', ok: true },
      { label: 'All 20+ base templates', ok: true },
      { label: 'English + Hinglish tones', ok: true },
      { label: 'Reply history (30 days)', ok: true },
      { label: 'Candidate tracker', ok: false },
      { label: 'Save custom templates', ok: false },
      { label: 'Follow-up reminders', ok: false },
      { label: 'Bulk composer', ok: false },
    ],
  },
  {
    name: 'Pro',
    price: '₹799',
    period: '/mo',
    desc: 'Unlimited replies. Full candidate tracker. For serious recruiters.',
    current: false,
    featured: true,
    features: [
      { label: 'Unlimited AI replies', ok: true },
      { label: 'All templates + save custom', ok: true },
      { label: 'All 3 tones + regenerate', ok: true },
      { label: 'Candidate tracker (100)', ok: true },
      { label: 'Follow-up reminders', ok: true },
      { label: 'Reply analytics', ok: true },
      { label: 'Full reply history', ok: true },
      { label: 'Team seats', ok: false },
    ],
  },
  {
    name: 'Team',
    price: '₹499',
    period: '/seat/mo',
    desc: 'For HR teams. Min 3 seats. Shared templates and admin dashboard.',
    current: false,
    features: [
      { label: 'Everything in Pro', ok: true },
      { label: 'Shared template library', ok: true },
      { label: 'Team analytics dashboard', ok: true },
      { label: 'Admin controls', ok: true },
      { label: 'Unlimited candidates', ok: true },
      { label: 'Bulk composer', ok: true },
      { label: 'Priority support', ok: true },
      { label: 'Custom onboarding', ok: true },
    ],
  },
]

export default function UpgradePage() {
  return (
    <div>
      <PageHeader
        title="Upgrade your plan"
        description="Start free — upgrade when you need more power."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-surface-card rounded-lg shadow-card p-6 flex flex-col gap-4 border-2 ${
              plan.featured ? 'border-primary' : 'border-surface-border'
            }`}
          >
            {plan.featured && (
              <span className="inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary-deep">
                Most popular
              </span>
            )}
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">{plan.name}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[28px] font-semibold text-ink">{plan.price}</span>
                <span className="text-sm text-ink-secondary">{plan.period}</span>
              </div>
              <p className="text-[13px] text-ink-secondary mt-1 pb-4 border-b border-surface-border">{plan.desc}</p>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {plan.features.map(({ label, ok }) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  {ok ? (
                    <Check className="w-4 h-4 text-status-placed shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-ink-muted shrink-0" />
                  )}
                  <span className={ok ? 'text-ink' : 'text-ink-muted'}>{label}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={plan.featured ? 'primary' : 'secondary'}
              className="w-full mt-2"
              disabled={plan.current}
            >
              {plan.current ? 'Current plan' : `Get ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-ink-muted mt-5">
        Payments via Razorpay · UPI, cards, net banking · Cancel anytime
      </p>
    </div>
  )
}
