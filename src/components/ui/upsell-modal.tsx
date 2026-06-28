'use client'

import { useEffect } from 'react'
import { X, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FREE_REPLY_LIMIT } from '@/lib/utils'

interface UpsellModalProps {
  open: boolean
  onClose: () => void
  repliesUsed?: number
  reason?: 'limit_reached' | 'approaching_limit'
}

const PRO_FEATURES = [
  'Unlimited AI replies every month',
  'Candidate tracker for 100 candidates',
  'Smart follow-up reminders',
  'Save custom templates',
  'Full reply history + analytics',
]

export function UpsellModal({ open, onClose, repliesUsed = 0, reason = 'limit_reached' }: UpsellModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-surface-card rounded-lg shadow-raised max-w-md w-full p-6 z-10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + heading */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent-icon" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {reason === 'limit_reached' ? 'You\'ve used all 50 free replies' : 'Running low on replies'}
            </h2>
            <p className="text-sm text-ink-secondary mt-0.5">
              {reason === 'limit_reached'
                ? 'Upgrade to Pro for unlimited replies and the full candidate toolkit.'
                : `${repliesUsed} of ${FREE_REPLY_LIMIT} replies used — upgrade before you run out.`}
            </p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mb-5">
          <div className="w-full bg-surface-sunken rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${Math.min((repliesUsed / FREE_REPLY_LIMIT) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[13px] text-ink-muted mt-1.5">
            {repliesUsed} / {FREE_REPLY_LIMIT} replies used this month
          </p>
        </div>

        {/* Pro features */}
        <div className="bg-surface-sunken rounded-lg p-4 mb-5">
          <p className="text-xs font-medium text-ink-secondary uppercase tracking-wide mb-3">Pro plan — ₹799/mo</p>
          <ul className="flex flex-col gap-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-ink">
                <Check className="w-4 h-4 text-status-placed shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Maybe later
          </Button>
          <Link href="/upgrade">
            <Button variant="primary" size="md">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
