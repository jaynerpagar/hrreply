'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, PageHeader } from '@/components/ui/card'
import { TONE_LABELS } from '@/lib/utils'
import { Tone } from '@/types'
import { cn } from '@/lib/utils'

const TONES: Tone[] = ['formal', 'friendly', 'hinglish']

export default function SettingsPage() {
  const [tone, setTone] = useState<Tone>('friendly')
  const [name, setName] = useState('Sneha Sharma')
  const [company, setCompany] = useState('')

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences, and billing."
      />

      <div className="flex flex-col gap-5 max-w-2xl">
        {/* Profile */}
        <Card>
          <h2 className="text-base font-semibold text-ink mb-4">Profile</h2>
          <div className="flex flex-col gap-3">
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Company / consultancy name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <h2 className="text-base font-semibold text-ink mb-4">Preferences</h2>
          <div>
            <p className="text-sm font-medium text-ink-secondary mb-2">Default tone</p>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    'flex-1 py-2 rounded border text-sm font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                    tone === t
                      ? 'border-primary bg-primary-soft text-primary-deep'
                      : 'border-surface-borderStrong bg-surface-card text-ink-secondary hover:text-ink hover:border-primary'
                  )}
                >
                  {TONE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Billing */}
        <Card>
          <h2 className="text-base font-semibold text-ink mb-4">Billing</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Free plan</p>
              <p className="text-[13px] text-ink-secondary mt-0.5">50 replies per month</p>
            </div>
            <Button variant="secondary" size="sm">Manage billing</Button>
          </div>
        </Card>

        <Button variant="primary" className="self-start">Save changes</Button>
      </div>
    </div>
  )
}
