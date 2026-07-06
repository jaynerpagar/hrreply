'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  RefreshCw, Copy, Check, Wand2, Mail, MessageCircle,
  Smartphone, Link2, BellRing, Heart, Gift, CalendarCheck, Users,
} from 'lucide-react'
import { UpsellModal } from '@/components/ui/upsell-modal'
import { AnalyzeBar } from '@/components/analyze'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type AutoType = 'follow_up_sequence' | 'interview_reminder' | 'thank_you' | 'offer_reminder' | 'joining_sequence'
type Format   = 'email' | 'whatsapp' | 'sms' | 'linkedin'
type Tone     = 'formal' | 'friendly'

interface SequenceResult { first: string; second: string; final: string }
interface JoiningResult  { sevenDay: string; threeDay: string; oneDay: string }
interface SingleResult   { message: string }
type AutoResult = SequenceResult | JoiningResult | SingleResult | null

// ── Constants ──────────────────────────────────────────────────────────────

const TABS: { value: AutoType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'follow_up_sequence',
    label: 'Follow-up Sequence',
    icon:  <BellRing className="w-4 h-4" />,
    desc:  'Candidate not responding? Generate 1st, 2nd, and Final follow-ups — each with a different angle.',
  },
  {
    value: 'interview_reminder',
    label: 'Interview Reminder',
    icon:  <CalendarCheck className="w-4 h-4" />,
    desc:  'Interview tomorrow — auto-generate a reminder with all details.',
  },
  {
    value: 'thank_you',
    label: 'Post-Interview Thank You',
    icon:  <Heart className="w-4 h-4" />,
    desc:  'Interview done? Send a thank you that sets clear next-step expectations.',
  },
  {
    value: 'offer_reminder',
    label: 'Offer Reminder',
    icon:  <Gift className="w-4 h-4" />,
    desc:  'Offer expires soon — generate a warm but urgent reminder.',
  },
  {
    value: 'joining_sequence',
    label: 'Joining Sequence',
    icon:  <Users className="w-4 h-4" />,
    desc:  'Candidate joining soon — auto-generate messages for 7-day, 3-day, and 1-day countdowns.',
  },
]

const FORMATS: { value: Format; icon: React.ReactNode; label: string }[] = [
  { value: 'whatsapp', icon: <MessageCircle className="w-3.5 h-3.5" />, label: 'WhatsApp' },
  { value: 'email',    icon: <Mail className="w-3.5 h-3.5" />,          label: 'Email'    },
  { value: 'sms',      icon: <Smartphone className="w-3.5 h-3.5" />,    label: 'SMS'      },
  { value: 'linkedin', icon: <Link2 className="w-3.5 h-3.5" />,         label: 'LinkedIn' },
]

// ── Field helpers ──────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, wide, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; wide?: boolean; type?: string
}) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="text-[11px] font-semibold text-ink-secondary block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div className="col-span-2">
      <label className="text-[11px] font-semibold text-ink-secondary block mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
      />
    </div>
  )
}

// ── Output cards ───────────────────────────────────────────────────────────

function MessageCard({ label, sublabel, message, accent = false }: {
  label: string; sublabel?: string; message: string; accent?: boolean
}) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(message)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      accent ? 'border-accent/30' : 'border-surface-border'
    )}>
      <div className={cn(
        'px-4 py-2.5 flex items-center justify-between border-b',
        accent ? 'bg-accent-soft border-accent/20' : 'bg-surface-sunken border-surface-border'
      )}>
        <div>
          <span className={cn('text-xs font-bold', accent ? 'text-accent-text' : 'text-ink')}>{label}</span>
          {sublabel && <span className="text-[11px] text-ink-muted ml-2">{sublabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <AnalyzeBar text={message} channel="whatsapp" />
          <button
            onClick={copy}
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all',
              copied
                ? 'border-accent bg-accent-soft text-accent-text'
                : 'border-surface-border bg-white text-ink-secondary hover:border-primary hover:text-primary'
            )}
          >
            {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
          </button>
        </div>
      </div>
      <div className="px-4 py-4 bg-white">
        <p className="text-sm text-ink leading-[1.8] whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  )
}

function SequenceOutput({ result, labels, sublabels, accentIdx = 0 }: {
  result: Record<string, string>
  labels: string[]
  sublabels?: string[]
  accentIdx?: number
}) {
  const entries = Object.values(result)
  return (
    <div className="flex flex-col gap-1">
      {entries.map((msg, i) => (
        <div key={i} className="flex flex-col gap-1">
          <MessageCard
            label={labels[i]}
            sublabel={sublabels?.[i]}
            message={msg}
            accent={i === accentIdx}
          />
          {i < entries.length - 1 && (
            <div className="flex items-center gap-2 py-1 px-4">
              <div className="w-px h-5 bg-surface-border mx-auto" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Form components per tab ────────────────────────────────────────────────

function FollowUpForm({ v, set }: { v: Record<string, string>; set: (k: string, val: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="Candidate name"     value={v.candidateName}    onChange={val => set('candidateName', val)}    placeholder="e.g. Priya Sharma" />
      <Field label="Role"               value={v.role}             onChange={val => set('role', val)}             placeholder="e.g. Senior Developer" />
      <Field label="Days since no reply" value={v.daysSince}       onChange={val => set('daysSince', val)}        placeholder="e.g. 5" />
      <Field label="Channel sent on"    value={v.channel}          onChange={val => set('channel', val)}          placeholder="e.g. Email, WhatsApp" />
      <TextArea label="Original message you sent" value={v.originalMessage} onChange={val => set('originalMessage', val)}
        placeholder="Paste the first message you sent them…" rows={4} />
      <TextArea label="New info to mention (optional)" value={v.newInfo} onChange={val => set('newInfo', val)}
        placeholder="e.g. We've opened remote option / role now reports to CTO / referral bonus added…" rows={2} />
    </div>
  )
}

function InterviewReminderForm({ v, set }: { v: Record<string, string>; set: (k: string, val: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="Candidate name"  value={v.candidateName} onChange={val => set('candidateName', val)} placeholder="e.g. Priya Sharma" />
      <Field label="Role"            value={v.role}          onChange={val => set('role', val)}          placeholder="e.g. Senior Developer" />
      <Field label="Interview round" value={v.round}         onChange={val => set('round', val)}         placeholder="e.g. Round 1, Technical" />
      <Field label="Date"            value={v.date}          onChange={val => set('date', val)}          placeholder="e.g. 22nd January" />
      <Field label="Time"            value={v.time}          onChange={val => set('time', val)}          placeholder="e.g. 11:30 AM" />
      <Field label="Platform / Venue" value={v.platform}     onChange={val => set('platform', val)}      placeholder="e.g. Google Meet, Bengaluru office" />
      <Field label="Interviewer name" value={v.interviewer}  onChange={val => set('interviewer', val)}   placeholder="e.g. Rahul (Tech Lead)" wide />
      <TextArea label="Prep tips (optional)" value={v.prepTips} onChange={val => set('prepTips', val)}
        placeholder="e.g. Brush up on system design, bring printed resume…" rows={2} />
    </div>
  )
}

function ThankYouForm({ v, set }: { v: Record<string, string>; set: (k: string, val: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="Candidate name"    value={v.candidateName} onChange={val => set('candidateName', val)} placeholder="e.g. Priya Sharma" />
      <Field label="Role"              value={v.role}          onChange={val => set('role', val)}          placeholder="e.g. Senior Developer" />
      <Field label="Round completed"   value={v.round}         onChange={val => set('round', val)}         placeholder="e.g. Round 2, HR round" />
      <Field label="Next steps / timeline" value={v.nextSteps} onChange={val => set('nextSteps', val)}     placeholder="e.g. We'll get back in 2 working days" />
      <TextArea label="What was discussed (optional)" value={v.discussed} onChange={val => set('discussed', val)}
        placeholder="e.g. Discussed microservices experience, salary expectations, remote preference…" rows={3} />
    </div>
  )
}

function OfferReminderForm({ v, set }: { v: Record<string, string>; set: (k: string, val: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="Candidate name"  value={v.candidateName} onChange={val => set('candidateName', val)} placeholder="e.g. Priya Sharma" />
      <Field label="Role"            value={v.role}          onChange={val => set('role', val)}          placeholder="e.g. Senior Developer" />
      <Field label="CTC offered"     value={v.ctc}           onChange={val => set('ctc', val)}           placeholder="e.g. ₹14 LPA" />
      <Field label="Offer expiry"    value={v.offerExpiry}   onChange={val => set('offerExpiry', val)}   placeholder="e.g. tomorrow, 24th Jan" />
      <Field label="Proposed joining date" value={v.joiningDate} onChange={val => set('joiningDate', val)} placeholder="e.g. 3rd February" wide />
    </div>
  )
}

function JoiningSequenceForm({ v, set }: { v: Record<string, string>; set: (k: string, val: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="Candidate name"  value={v.candidateName} onChange={val => set('candidateName', val)} placeholder="e.g. Priya Sharma" />
      <Field label="Role"            value={v.role}          onChange={val => set('role', val)}          placeholder="e.g. Senior Developer" />
      <Field label="Joining date"    value={v.joiningDate}   onChange={val => set('joiningDate', val)}   placeholder="e.g. 3rd February" />
      <Field label="Office location" value={v.location}      onChange={val => set('location', val)}      placeholder="e.g. Bengaluru — Koramangala" />
      <Field label="Reporting manager" value={v.manager}     onChange={val => set('manager', val)}       placeholder="e.g. Anita (VP Engineering)" />
      <Field label="Department / team" value={v.department}  onChange={val => set('department', val)}    placeholder="e.g. Platform Engineering" />
      <TextArea label="Documents to bring" value={v.documents} onChange={val => set('documents', val)}
        placeholder="e.g. Aadhaar, PAN, 3 months payslips, last offer letter…" rows={2} />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

function AutomationContent() {
  const searchParams = useSearchParams()

  const [tab, setTab]     = useState<AutoType>((searchParams.get('tab') as AutoType) || 'follow_up_sequence')
  const [format, setFormat] = useState<Format>('whatsapp')
  const [tone, setTone]   = useState<Tone>('friendly')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [result, setResult] = useState<AutoResult>(null)
  const [showUpsell, setShowUpsell] = useState(false)

  // Per-tab form state
  const [followUpInputs, setFollowUpInputs]         = useState<Record<string, string>>({ candidateName: '', role: '', originalMessage: '', daysSince: '5', newInfo: '', channel: '' })
  const [interviewInputs, setInterviewInputs]       = useState<Record<string, string>>({ candidateName: '', role: '', round: '', date: '', time: '', platform: '', interviewer: '', prepTips: '' })
  const [thankYouInputs, setThankYouInputs]         = useState<Record<string, string>>({ candidateName: '', role: '', round: '', nextSteps: '', discussed: '' })
  const [offerInputs, setOfferInputs]               = useState<Record<string, string>>({ candidateName: '', role: '', ctc: '', offerExpiry: 'tomorrow', joiningDate: '' })
  const [joiningInputs, setJoiningInputs]           = useState<Record<string, string>>({ candidateName: '', role: '', joiningDate: '', location: '', manager: '', department: '', documents: '' })

  // Pre-fill from candidateId URL param
  useEffect(() => {
    const candidateId = searchParams.get('candidateId')
    const tabParam    = searchParams.get('tab') as AutoType | null
    if (tabParam) setTab(tabParam)
    if (!candidateId) return

    fetch(`/api/candidates/${candidateId}`)
      .then(r => r.json())
      .then(c => {
        if (!c?.name) return
        const base = { candidateName: c.name, role: c.role_applied ?? '' }

        setFollowUpInputs(p => ({ ...p, ...base }))
        setThankYouInputs(p => ({ ...p, ...base }))
        setOfferInputs(p => ({
          ...p, ...base,
          joiningDate: c.joining_at ?? '',
          offerExpiry: c.offer_expiry_at ? new Date(c.offer_expiry_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'tomorrow',
        }))
        setJoiningInputs(p => ({
          ...p, ...base,
          joiningDate: c.joining_at ? new Date(c.joining_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : '',
        }))

        if (c.interview_at) {
          const dt = new Date(c.interview_at)
          setInterviewInputs(p => ({
            ...p, ...base,
            date: dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }),
            time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          }))
        } else {
          setInterviewInputs(p => ({ ...p, ...base }))
        }
      })
      .catch(() => {/* silently ignore — pre-fill is best-effort */})
  }, [searchParams])

  function setInput(tab: AutoType, key: string, val: string) {
    const setters: Record<AutoType, React.Dispatch<React.SetStateAction<Record<string, string>>>> = {
      follow_up_sequence: setFollowUpInputs,
      interview_reminder: setInterviewInputs,
      thank_you:          setThankYouInputs,
      offer_reminder:     setOfferInputs,
      joining_sequence:   setJoiningInputs,
    }
    setters[tab](prev => ({ ...prev, [key]: val }))
  }

  function currentInputs(): Record<string, string> {
    const map: Record<AutoType, Record<string, string>> = {
      follow_up_sequence: followUpInputs,
      interview_reminder: interviewInputs,
      thank_you:          thankYouInputs,
      offer_reminder:     offerInputs,
      joining_sequence:   joiningInputs,
    }
    return map[tab]
  }

  function canGenerate(): boolean {
    const inputs = currentInputs()
    return !!(inputs.candidateName?.trim() || inputs.role?.trim())
  }

  async function generate() {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab, format, tone, ...currentInputs() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'free_limit_reached') setShowUpsell(true)
        else setError(data.error ?? 'Something went wrong')
        return
      }
      setResult(data.result)
    } catch { setError('Network error — please check your connection.') }
    finally { setLoading(false) }
  }

  const activeTabMeta = TABS.find(t => t.value === tab)!

  return (
    <div className="flex flex-col">
      <UpsellModal open={showUpsell} onClose={() => setShowUpsell(false)} reason="limit_reached" />

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink tracking-tight">HR Automation</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Auto-generate follow-ups, reminders, and sequences — triggered by candidate stage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 items-start">

        {/* ══ LEFT PANE ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* Tab selector */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
            {TABS.map(({ value, label, icon, desc }) => (
              <button
                key={value}
                onClick={() => { setTab(value); setResult(null); setError('') }}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3.5 border-b border-surface-border last:border-b-0 text-left transition-colors',
                  tab === value
                    ? 'bg-primary text-white'
                    : 'hover:bg-surface-sunken text-ink'
                )}
              >
                <span className={cn('mt-0.5 shrink-0', tab === value ? 'text-accent' : 'text-ink-muted')}>
                  {icon}
                </span>
                <div>
                  <p className={cn('text-sm font-semibold leading-snug', tab === value ? 'text-white' : 'text-ink')}>{label}</p>
                  <p className={cn('text-[11px] mt-0.5 leading-snug', tab === value ? 'text-white/70' : 'text-ink-muted')}>{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Input form */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">

            {/* Format + Tone header */}
            <div className="px-5 pt-4 pb-3 border-b border-surface-border">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2.5">Send via</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {FORMATS.map(({ value, icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setFormat(value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                      format === value
                        ? 'border-primary bg-primary text-white'
                        : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                    )}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Tone</p>
                <div className="flex gap-1.5">
                  {(['formal', 'friendly'] as Tone[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        'px-3 py-1 rounded-md border text-xs font-semibold transition-all',
                        tone === t
                          ? 'bg-primary border-primary text-white'
                          : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                      )}
                    >
                      {t === 'formal' ? 'Formal' : 'Friendly'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div className="px-5 py-4 border-b border-surface-border">
              {tab === 'follow_up_sequence' && <FollowUpForm    v={followUpInputs}  set={(k, v) => setInput(tab, k, v)} />}
              {tab === 'interview_reminder' && <InterviewReminderForm v={interviewInputs} set={(k, v) => setInput(tab, k, v)} />}
              {tab === 'thank_you'          && <ThankYouForm    v={thankYouInputs}  set={(k, v) => setInput(tab, k, v)} />}
              {tab === 'offer_reminder'     && <OfferReminderForm v={offerInputs}   set={(k, v) => setInput(tab, k, v)} />}
              {tab === 'joining_sequence'   && <JoiningSequenceForm v={joiningInputs} set={(k, v) => setInput(tab, k, v)} />}
            </div>

            {/* Generate button */}
            <div className="p-4">
              <div className="relative">
                {!loading && canGenerate() && (
                  <span className="absolute inset-0 rounded-lg animate-ping bg-accent opacity-20 pointer-events-none" />
                )}
                <button
                  onClick={generate}
                  disabled={loading || !canGenerate()}
                  className="relative w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</>
                    : <><Wand2 className="w-4 h-4" />Generate {activeTabMeta.label}</>
                  }
                </button>
              </div>
              {!canGenerate() && (
                <p className="text-[11px] text-ink-muted text-center mt-2">Add candidate name or role to generate</p>
              )}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANE ══════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {error && (
            <div className="bg-status-droppedBg border border-status-dropped/30 rounded-xl px-4 py-3 text-sm text-status-droppedText">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <Wand2 className="w-4 h-4 text-accent-icon animate-pulse" />
                <span className="text-sm text-ink-secondary">Writing {activeTabMeta.label.toLowerCase()}…</span>
              </div>
              <div className="space-y-2.5">
                {[100, 85, 100, 70, 90, 55, 100].map((w, i) => (
                  <div key={i} className="h-3 bg-surface-sunken rounded animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Follow-up sequence output */}
          {!loading && result && tab === 'follow_up_sequence' && 'first' in result && (
            <SequenceOutput
              result={{ first: result.first, second: result.second, final: result.final }}
              labels={['1st Follow-up', '2nd Follow-up', 'Final Follow-up']}
              sublabels={['Send 3-5 days after no reply', 'Send 5-7 days after 1st', 'Send 5-7 days after 2nd']}
              accentIdx={0}
            />
          )}

          {/* Joining sequence output */}
          {!loading && result && tab === 'joining_sequence' && 'sevenDay' in result && (
            <SequenceOutput
              result={{ sevenDay: result.sevenDay, threeDay: result.threeDay, oneDay: result.oneDay }}
              labels={['7 Days Before', '3 Days Before', '1 Day Before']}
              sublabels={['Excitement + onboarding preview', 'Documents + day-1 schedule', 'Final warm welcome']}
              accentIdx={2}
            />
          )}

          {/* Single message output */}
          {!loading && result && 'message' in result && (
            <MessageCard
              label={activeTabMeta.label}
              message={result.message}
              accent
            />
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card flex flex-col items-center justify-center text-center py-20 px-8 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <span className="text-2xl">{tab === 'follow_up_sequence' ? '📬' : tab === 'interview_reminder' ? '📅' : tab === 'thank_you' ? '💌' : tab === 'offer_reminder' ? '🎁' : '🚀'}</span>
              </div>
              <div>
                <p className="text-base font-bold text-ink">{activeTabMeta.label}</p>
                <p className="text-sm text-ink-muted mt-1.5 max-w-sm leading-relaxed">{activeTabMeta.desc}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AutomationPage() {
  return (
    <Suspense>
      <AutomationContent />
    </Suspense>
  )
}
