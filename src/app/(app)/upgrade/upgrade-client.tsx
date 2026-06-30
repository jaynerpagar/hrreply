'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/card'
import type { Plan } from '@/types'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void }
  }
}

interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description: string
  image?: string
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
  handler: () => void
  modal?: { ondismiss?: () => void }
}

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

interface Props {
  userPlan: Plan
  userName: string
  userEmail: string
}

const PLANS = [
  {
    id: 'free' as Plan,
    name: 'Free',
    price: '₹0',
    period: '/mo',
    desc: '50 AI replies per month. Resets every 30 days. No credit card needed.',
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
    id: 'pro' as Plan,
    name: 'Pro',
    price: '₹799',
    period: '/mo',
    desc: 'Unlimited replies. Full candidate tracker. For serious recruiters.',
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
    id: 'team' as Plan,
    name: 'Team',
    price: '₹499',
    period: '/seat/mo',
    desc: 'For HR teams. Min 3 seats. Shared templates and admin dashboard.',
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

export default function UpgradeClient({ userPlan, userName, userEmail }: Props) {
  const router = useRouter()
  const [teamSeats, setTeamSeats] = useState(3)
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [error, setError] = useState('')

  async function handleCheckout(planId: 'pro' | 'team') {
    setError('')
    setLoadingPlan(planId)

    try {
      const ok = await loadScript()
      if (!ok) {
        setError('Failed to load Razorpay. Check your internet connection.')
        setLoadingPlan(null)
        return
      }

      const seats = planId === 'team' ? teamSeats : 1
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, seats }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoadingPlan(null)
        return
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKey) {
        setError('Payment gateway not configured. Please contact support.')
        setLoadingPlan(null)
        return
      }

      const planLabel = planId === 'pro'
        ? 'Pro Plan — Unlimited AI replies'
        : `Team Plan — ${seats} seats`
      const rzp = new window.Razorpay({
        key: razorpayKey,
        subscription_id: data.subscription_id,
        name: 'HRReply.in',
        description: planLabel,
        image: '/favicon.svg',
        prefill: { name: userName, email: userEmail },
        theme: { color: '#65A30D' },
        handler: () => {
          router.push('/dashboard?upgraded=true')
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
      })
      rzp.open()
    } catch (err: unknown) {
      console.error('[checkout]', err)
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.')
      setLoadingPlan(null)
    }
  }

  function getButtonState(planId: Plan) {
    if (userPlan === planId) return { label: 'Current plan', disabled: true }
    if (planId === 'free') return { label: 'Downgrade', disabled: true }
    return { label: `Get ${planId === 'pro' ? 'Pro' : 'Team'}`, disabled: false }
  }

  return (
    <div>
      <PageHeader
        title="Upgrade your plan"
        description="Start free — upgrade when you need more power."
      />

      {error && (
        <p className="mb-4 text-sm text-status-droppedText bg-status-droppedBg border border-status-dropped/30 rounded-lg px-4 py-2.5 max-w-4xl">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">
        {PLANS.map((plan) => {
          const btn = getButtonState(plan.id)
          const isTeam = plan.id === 'team'
          const isLoading = loadingPlan === plan.id

          const isSelected = selectedPlan === plan.id || (selectedPlan === null && plan.featured && userPlan === 'free')

          return (
            <div
              key={plan.name}
              className={`bg-surface-card rounded-lg shadow-card p-6 flex flex-col gap-4 border-2 transition-colors ${
                isSelected ? 'border-primary' : 'border-surface-border'
              }`}
            >
              {plan.featured && (
                <span className="inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary-deep">
                  Most popular
                </span>
              )}
              {isSelected && plan.id !== 'free' && !plan.featured && (
                <span className="inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary-deep">
                  Selected
                </span>
              )}

              <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[28px] font-semibold text-ink">
                    {isTeam ? `₹${teamSeats * 499}` : plan.price}
                  </span>
                  <span className="text-sm text-ink-secondary">/mo</span>
                </div>
                {isTeam && (
                  <p className="text-xs text-ink-muted mt-0.5">₹499 × {teamSeats} seats</p>
                )}
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

              {/* Team seat selector */}
              {isTeam && (
                <div className="flex items-center justify-between border border-surface-borderStrong rounded-lg px-3 py-2">
                  <span className="text-sm text-ink-secondary">Seats</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTeamSeats(Math.max(3, teamSeats - 1))}
                      className="w-6 h-6 rounded flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-sunken transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold text-ink w-4 text-center">{teamSeats}</span>
                    <button
                      onClick={() => setTeamSeats(teamSeats + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-sunken transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant={isSelected && plan.id !== 'free' ? 'primary' : plan.featured ? 'primary' : 'secondary'}
                className="w-full mt-2"
                disabled={btn.disabled || isLoading}
                onClick={() => {
                  if (btn.disabled || plan.id === 'free') return
                  setSelectedPlan(plan.id)
                  handleCheckout(plan.id as 'pro' | 'team')
                }}
              >
                {isLoading ? 'Opening checkout…' : btn.label}
              </Button>
            </div>
          )
        })}
      </div>

      <p className="text-[13px] text-ink-muted mt-5">
        Payments via Razorpay · UPI, cards, net banking · Cancel anytime
      </p>
    </div>
  )
}
