'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, PageHeader } from '@/components/ui/card'
import { TONE_LABELS } from '@/lib/utils'
import { Tone } from '@/types'
import { cn } from '@/lib/utils'

const TONES: Tone[] = ['formal', 'friendly', 'hinglish']

interface Subscription {
  plan: string
  status: string
  seats: number
  current_period_end: string | null
}

interface Props {
  initialName: string
  initialCompany: string
  initialTone: Tone
  plan: string
  subscription: Subscription | null
  initialBrandVoice: string
  initialPersonalStyle: string
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function SettingsClient({ initialName, initialCompany, initialTone, plan, subscription, initialBrandVoice, initialPersonalStyle }: Props) {
  const [tone, setTone] = useState<Tone>(initialTone)
  const [name, setName] = useState(initialName)
  const [company, setCompany] = useState(initialCompany)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelDone, setCancelDone] = useState(subscription?.status === 'cancelled')
  const [cancelError, setCancelError] = useState('')

  // AI Preferences state
  const [brandVoiceProfile,   setBrandVoiceProfile]   = useState(initialBrandVoice)
  const [personalStyleProfile, setPersonalStyleProfile] = useState(initialPersonalStyle)
  const [brandVoiceSamples,   setBrandVoiceSamples]   = useState('')
  const [personalStyleSamples, setPersonalStyleSamples] = useState('')
  const [learningBrand,        setLearningBrand]        = useState(false)
  const [learningPersonal,     setLearningPersonal]     = useState(false)

  async function handleLearnBrand() {
    setLearningBrand(true)
    const res  = await fetch('/api/settings/ai-preferences', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'brand_voice', samples: brandVoiceSamples }),
    })
    const data = await res.json()
    if (res.ok) { setBrandVoiceProfile(data.profile); setBrandVoiceSamples('') }
    setLearningBrand(false)
  }

  async function handleLearnPersonal() {
    setLearningPersonal(true)
    const res  = await fetch('/api/settings/ai-preferences', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'personal_style', samples: personalStyleSamples }),
    })
    const data = await res.json()
    if (res.ok) { setPersonalStyleProfile(data.profile); setPersonalStyleSamples('') }
    setLearningPersonal(false)
  }

  async function resetVoice(type: 'brand_voice' | 'personal_style') {
    await fetch('/api/settings/ai-preferences', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    if (type === 'brand_voice') setBrandVoiceProfile('')
    else setPersonalStyleProfile('')
  }

  const renewDate = formatDate(subscription?.current_period_end ?? null)
  const isPaid = plan !== 'free'
  const isTeam = plan === 'team'

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name, company, default_tone: tone }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setSaveError(data.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You\'ll keep access until the current billing period ends.')) return
    setCancelling(true)
    setCancelError('')
    const res = await fetch('/api/razorpay/cancel-subscription', { method: 'POST' })
    if (res.ok) {
      setCancelDone(true)
    } else {
      const data = await res.json()
      setCancelError(data.error ?? 'Failed to cancel subscription')
    }
    setCancelling(false)
  }

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

          {!isPaid ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Free plan</p>
                <p className="text-[13px] text-ink-secondary mt-0.5">25 replies per month</p>
              </div>
              <Link href="/upgrade">
                <Button variant="primary" size="sm">Upgrade to Pro</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink capitalize">
                    {plan} plan
                    {isTeam && subscription?.seats && (
                      <span className="font-normal text-ink-secondary"> · {subscription.seats} seats</span>
                    )}
                  </p>
                  {cancelDone ? (
                    <p className="text-[13px] text-status-processText mt-0.5">
                      Cancelled · Access until {renewDate ?? 'end of billing period'}
                    </p>
                  ) : (
                    <p className="text-[13px] text-ink-secondary mt-0.5">
                      {renewDate ? `Renews ${renewDate}` : 'Active subscription'}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-status-placedBg text-status-placedText">
                  Active
                </span>
              </div>

              {cancelError && (
                <p className="text-sm text-status-droppedText bg-status-droppedBg rounded px-3 py-2">
                  {cancelError}
                </p>
              )}

              {!cancelDone && (
                <div className="border-t border-surface-border pt-4">
                  <p className="text-[13px] text-ink-secondary mb-3">
                    Cancelling will keep your plan active until {renewDate ?? 'the end of your billing period'}, then revert to Free.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-status-droppedText hover:bg-status-droppedBg hover:text-status-droppedText"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* AI Preferences */}
        <Card>
          <h2 className="text-base font-semibold text-ink mb-1">AI Preferences</h2>
          <p className="text-xs text-ink-secondary mb-5">
            Teach the AI your writing style. Every generated message will match it automatically.
          </p>

          <div className="flex flex-col gap-6">
            {/* Brand Voice */}
            <div>
              <p className="text-sm font-semibold text-ink mb-0.5">Company brand voice</p>
              <p className="text-xs text-ink-secondary mb-3">
                Paste 2–5 past emails your company sent. AI learns the company tone and applies it everywhere.
              </p>
              {brandVoiceProfile ? (
                <div className="bg-accent-soft border border-accent/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-text">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Brand voice learned
                    </span>
                    <button onClick={() => resetVoice('brand_voice')} className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-status-droppedText transition-colors">
                      <X className="w-3 h-3" /> Reset
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">{brandVoiceProfile}</p>
                </div>
              ) : (
                <>
                  <textarea
                    rows={4}
                    value={brandVoiceSamples}
                    onChange={e => setBrandVoiceSamples(e.target.value)}
                    placeholder={"Paste sample emails here…\n\nExample:\nHi Priya, Thank you for attending the interview. We're pleased to inform you that you've been selected for the role..."}
                    className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed mb-2.5"
                  />
                  <Button variant="secondary" size="sm" disabled={!brandVoiceSamples.trim() || learningBrand} onClick={handleLearnBrand}>
                    {learningBrand
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Learning…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Learn brand voice</>
                    }
                  </Button>
                </>
              )}
            </div>

            {/* Personal Style */}
            <div>
              <p className="text-sm font-semibold text-ink mb-0.5">My writing style</p>
              <p className="text-xs text-ink-secondary mb-3">
                Paste samples of messages you personally wrote. AI will mimic your individual style.
              </p>
              {personalStyleProfile ? (
                <div className="bg-accent-soft border border-accent/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-text">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Personal style learned
                    </span>
                    <button onClick={() => resetVoice('personal_style')} className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-status-droppedText transition-colors">
                      <X className="w-3 h-3" /> Reset
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">{personalStyleProfile}</p>
                </div>
              ) : (
                <>
                  <textarea
                    rows={4}
                    value={personalStyleSamples}
                    onChange={e => setPersonalStyleSamples(e.target.value)}
                    placeholder="Paste messages you personally wrote…"
                    className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed mb-2.5"
                  />
                  <Button variant="secondary" size="sm" disabled={!personalStyleSamples.trim() || learningPersonal} onClick={handleLearnPersonal}>
                    {learningPersonal
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Learning…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Learn my style</>
                    }
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {saveError && (
          <p className="text-sm text-status-droppedText bg-status-droppedBg rounded px-3 py-2">{saveError}</p>
        )}
        <Button variant="primary" className="self-start" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
