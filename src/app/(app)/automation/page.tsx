'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Zap, Trash2, Play, BellOff, Calendar, Clock,
  UserCheck, ArrowRightLeft, RefreshCw, Copy, Check, Wand2,
  MessageCircle, Mail, Smartphone, Link2, X, ChevronRight,
  ToggleLeft, ToggleRight, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type TriggerType = 'stage_change' | 'no_reply' | 'interview_approaching' | 'offer_expiring' | 'joining_approaching'
type TemplateType = 'follow_up_sequence' | 'interview_reminder' | 'thank_you' | 'offer_reminder' | 'joining_sequence'
type Format = 'whatsapp' | 'email' | 'sms' | 'linkedin'
type Tone = 'formal' | 'friendly'

interface Automation {
  id: string
  name: string
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  template_type: TemplateType
  format: Format
  tone: Tone
  is_active: boolean
  run_count: number
  last_run_at: string | null
  created_at: string
}

interface SequenceResult { first: string; second: string; final: string }
interface JoiningResult { sevenDay: string; threeDay: string; oneDay: string }
interface SingleResult { message: string }
type RunResult = SequenceResult | JoiningResult | SingleResult | null

// ── Constants ──────────────────────────────────────────────────────────────

const STAGES = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewed', 'Offer Sent', 'Hired', 'Rejected']

const TRIGGERS: { value: TriggerType; label: string; icon: React.ElementType; desc: string; configFields: string[] }[] = [
  {
    value: 'stage_change',
    label: 'Candidate moves to a stage',
    icon: ArrowRightLeft,
    desc: 'Fires when a candidate is moved to a specific pipeline stage.',
    configFields: ['stage'],
  },
  {
    value: 'no_reply',
    label: 'No reply for N days',
    icon: BellOff,
    desc: 'Fires when a candidate hasn\'t responded after a set number of days.',
    configFields: ['days'],
  },
  {
    value: 'interview_approaching',
    label: 'Interview approaching',
    icon: Calendar,
    desc: 'Fires N days before a candidate\'s scheduled interview.',
    configFields: ['days_before'],
  },
  {
    value: 'offer_expiring',
    label: 'Offer expiring soon',
    icon: Clock,
    desc: 'Fires N days before a candidate\'s offer letter expires.',
    configFields: ['days_before'],
  },
  {
    value: 'joining_approaching',
    label: 'Joining date approaching',
    icon: UserCheck,
    desc: 'Fires N days before the candidate\'s joining date.',
    configFields: ['days_before'],
  },
]

const TEMPLATES: { value: TemplateType; label: string; emoji: string }[] = [
  { value: 'follow_up_sequence', label: 'Follow-up Sequence (3 messages)', emoji: '📬' },
  { value: 'interview_reminder', label: 'Interview Reminder',              emoji: '📅' },
  { value: 'thank_you',          label: 'Post-Interview Thank You',        emoji: '💌' },
  { value: 'offer_reminder',     label: 'Offer Expiry Reminder',           emoji: '🎁' },
  { value: 'joining_sequence',   label: 'Joining Countdown (3 messages)',  emoji: '🚀' },
]

const FORMATS: { value: Format; icon: React.ElementType; label: string }[] = [
  { value: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { value: 'email',    icon: Mail,          label: 'Email'    },
  { value: 'sms',      icon: Smartphone,    label: 'SMS'      },
  { value: 'linkedin', icon: Link2,         label: 'LinkedIn' },
]

const PRESETS: Omit<Automation, 'id' | 'is_active' | 'run_count' | 'last_run_at' | 'created_at'>[] = [
  {
    name: 'Follow-up when candidate goes silent',
    trigger_type: 'no_reply',
    trigger_config: { days: 5 },
    template_type: 'follow_up_sequence',
    format: 'whatsapp',
    tone: 'friendly',
  },
  {
    name: 'Interview reminder — day before',
    trigger_type: 'interview_approaching',
    trigger_config: { days_before: 1 },
    template_type: 'interview_reminder',
    format: 'whatsapp',
    tone: 'friendly',
  },
  {
    name: 'Post-interview thank you',
    trigger_type: 'stage_change',
    trigger_config: { stage: 'Interviewed' },
    template_type: 'thank_you',
    format: 'email',
    tone: 'formal',
  },
  {
    name: 'Offer expiry nudge (2 days before)',
    trigger_type: 'offer_expiring',
    trigger_config: { days_before: 2 },
    template_type: 'offer_reminder',
    format: 'whatsapp',
    tone: 'friendly',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function triggerLabel(a: Automation): string {
  const t = TRIGGERS.find(x => x.value === a.trigger_type)!
  const cfg = a.trigger_config as Record<string, unknown>
  if (a.trigger_type === 'stage_change') return `Stage → ${cfg.stage ?? 'any'}`
  if (a.trigger_type === 'no_reply') return `No reply for ${cfg.days ?? '?'} days`
  if (a.trigger_type === 'interview_approaching') return `${cfg.days_before ?? '?'} day(s) before interview`
  if (a.trigger_type === 'offer_expiring') return `${cfg.days_before ?? '?'} day(s) before offer expiry`
  if (a.trigger_type === 'joining_approaching') return `${cfg.days_before ?? '?'} day(s) before joining`
  return t.label
}

function templateEmoji(type: TemplateType): string {
  return TEMPLATES.find(t => t.value === type)?.emoji ?? '⚡'
}

function templateLabel(type: TemplateType): string {
  return TEMPLATES.find(t => t.value === type)?.label ?? type
}

function formatLabel(f: Format): string {
  return FORMATS.find(x => x.value === f)?.label ?? f
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Small UI pieces ────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: Format }) {
  const F = FORMATS.find(f => f.value === format)!
  const Icon = F.icon
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-sunken text-ink-secondary border border-surface-border">
      <Icon className="w-2.5 h-2.5" />{F.label}
    </span>
  )
}

function TriggerIcon({ type, className }: { type: TriggerType; className?: string }) {
  const Icon = TRIGGERS.find(t => t.value === type)?.icon ?? Zap
  return <Icon className={className} />
}

function MessageCard({ label, sublabel, message }: { label: string; sublabel?: string; message: string }) {
  const [copied, setCopied] = useState(false)
  function copy() { navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="rounded-xl border border-surface-border overflow-hidden">
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-surface-border bg-surface-sunken">
        <div>
          <span className="text-xs font-bold text-ink">{label}</span>
          {sublabel && <span className="text-[11px] text-ink-muted ml-2">{sublabel}</span>}
        </div>
        <button
          onClick={copy}
          className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all',
            copied ? 'border-accent bg-accent-soft text-accent-text' : 'border-surface-border bg-white text-ink-secondary hover:border-primary hover:text-primary'
          )}
        >
          {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
        </button>
      </div>
      <div className="px-4 py-4 bg-white">
        <p className="text-sm text-ink leading-[1.8] whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  )
}

// ── Run Now Panel ──────────────────────────────────────────────────────────

function RunNowPanel({ rule, onClose }: { rule: Automation; onClose: () => void }) {
  const [inputs, setInputs] = useState<Record<string, string>>({
    candidateName: '', role: '', originalMessage: '', daysSince: '5',
    channel: '', round: '', date: '', time: '', platform: '', interviewer: '',
    prepTips: '', nextSteps: '', discussed: '', ctc: '', offerExpiry: 'tomorrow',
    joiningDate: '', location: '', manager: '', department: '', documents: '',
    newInfo: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RunResult>(null)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setInputs(p => ({ ...p, [k]: v })) }

  async function run() {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: rule.template_type, format: rule.format, tone: rule.tone, ...inputs }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed'); return }
      setResult(data.result)
      // bump run_count
      fetch(`/api/automations/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_count: rule.run_count + 1, last_run_at: new Date().toISOString() }),
      })
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const canRun = !!(inputs.candidateName.trim() || inputs.role.trim())

  const renderFields = () => {
    const f = (label: string, k: string, placeholder?: string) => (
      <div key={k}>
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">{label}</label>
        <input value={inputs[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
      </div>
    )
    const ta = (label: string, k: string, placeholder?: string) => (
      <div key={k} className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">{label}</label>
        <textarea value={inputs[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder} rows={3}
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed" />
      </div>
    )

    const base = [f('Candidate name', 'candidateName', 'e.g. Priya Sharma'), f('Role', 'role', 'e.g. Senior Developer')]

    if (rule.template_type === 'follow_up_sequence') return [...base,
      f('Days since no reply', 'daysSince', 'e.g. 5'),
      f('Channel sent on', 'channel', 'e.g. Email, WhatsApp'),
      ta('Original message you sent', 'originalMessage', 'Paste the first message…'),
      ta('New info to mention (optional)', 'newInfo', 'e.g. remote option now available…'),
    ]
    if (rule.template_type === 'interview_reminder') return [...base,
      f('Interview round', 'round', 'e.g. Round 1, Technical'),
      f('Date', 'date', 'e.g. 22nd January'),
      f('Time', 'time', 'e.g. 11:30 AM'),
      f('Platform / Venue', 'platform', 'e.g. Google Meet'),
      ta('Prep tips (optional)', 'prepTips', 'e.g. Brush up on system design…'),
    ]
    if (rule.template_type === 'thank_you') return [...base,
      f('Round completed', 'round', 'e.g. HR Round'),
      f('Next steps / timeline', 'nextSteps', 'e.g. We\'ll respond in 2 days'),
      ta('What was discussed (optional)', 'discussed', 'e.g. Salary, remote preference…'),
    ]
    if (rule.template_type === 'offer_reminder') return [...base,
      f('CTC offered', 'ctc', 'e.g. ₹14 LPA'),
      f('Offer expiry', 'offerExpiry', 'e.g. 24th Jan'),
      f('Joining date', 'joiningDate', 'e.g. 3rd February'),
    ]
    if (rule.template_type === 'joining_sequence') return [...base,
      f('Joining date', 'joiningDate', 'e.g. 3rd February'),
      f('Office location', 'location', 'e.g. Bengaluru — Koramangala'),
      f('Reporting manager', 'manager', 'e.g. Anita (VP Engineering)'),
      ta('Documents to bring', 'documents', 'e.g. Aadhaar, PAN, payslips…'),
    ]
    return base
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{templateEmoji(rule.template_type)}</span>
          <div>
            <p className="text-sm font-bold text-ink">Run: {rule.name}</p>
            <p className="text-[11px] text-ink-muted">{formatLabel(rule.format)} · {rule.tone}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Candidate fields */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 shrink-0">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Candidate details</p>
        <div className="grid grid-cols-2 gap-2.5">{renderFields()}</div>
      </div>

      {/* Generate button */}
      <button
        onClick={run}
        disabled={loading || !canRun}
        className="shrink-0 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</> : <><Wand2 className="w-4 h-4" />Generate & Copy</>}
      </button>

      {error && <p className="text-xs text-status-droppedText bg-status-droppedBg border border-status-dropped/30 rounded-lg px-3 py-2 shrink-0">{error}</p>}

      {/* Results */}
      {loading && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 shrink-0">
          <div className="flex items-center gap-2 mb-4"><Wand2 className="w-4 h-4 text-accent-icon animate-pulse" /><span className="text-sm text-ink-secondary">Writing messages…</span></div>
          <div className="space-y-2">{[100,85,95,70,80].map((w,i) => <div key={i} className="h-3 bg-surface-sunken rounded animate-pulse" style={{ width: `${w}%` }} />)}</div>
        </div>
      )}

      {!loading && result && 'first' in result && (
        <div className="flex flex-col gap-2 shrink-0">
          {([['1st Follow-up', result.first],['2nd Follow-up', result.second],['Final Follow-up', result.final]] as [string,string][]).map(([lbl,msg]) => (
            <MessageCard key={lbl} label={lbl} message={msg} />
          ))}
        </div>
      )}
      {!loading && result && 'sevenDay' in result && (
        <div className="flex flex-col gap-2 shrink-0">
          {([['7 Days Before', result.sevenDay],['3 Days Before', result.threeDay],['1 Day Before', result.oneDay]] as [string,string][]).map(([lbl,msg]) => (
            <MessageCard key={lbl} label={lbl} message={msg} />
          ))}
        </div>
      )}
      {!loading && result && 'message' in result && (
        <div className="shrink-0"><MessageCard label={templateLabel(rule.template_type)} message={(result as SingleResult).message} /></div>
      )}
    </div>
  )
}

// ── Create Rule Form ───────────────────────────────────────────────────────

function CreateRuleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Omit<Automation, 'id' | 'is_active' | 'run_count' | 'last_run_at' | 'created_at'>>
  onSave: (a: Automation) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [triggerType, setTriggerType] = useState<TriggerType>(initial?.trigger_type ?? 'no_reply')
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(initial?.trigger_config ?? { days: 5 })
  const [templateType, setTemplateType] = useState<TemplateType>(initial?.template_type ?? 'follow_up_sequence')
  const [format, setFormat] = useState<Format>(initial?.format ?? 'whatsapp')
  const [tone, setTone] = useState<Tone>(initial?.tone ?? 'friendly')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateConfig(key: string, value: unknown) {
    setTriggerConfig(p => ({ ...p, [key]: value }))
  }

  async function save() {
    if (!name.trim()) { setError('Please name this automation'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, trigger_type: triggerType, trigger_config: triggerConfig, template_type: templateType, format, tone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      onSave(data.automation)
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  const selectedTrigger = TRIGGERS.find(t => t.value === triggerType)!

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-4">
      <div className="flex items-center justify-between shrink-0">
        <p className="text-sm font-bold text-ink">New Automation Rule</p>
        <button onClick={onCancel} className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step 1: Trigger */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-surface-border bg-surface-sunken flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">1</span>
          <p className="text-xs font-bold text-ink uppercase tracking-widest">Trigger — When does this fire?</p>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {TRIGGERS.map(trigger => {
            const Icon = trigger.icon
            const active = triggerType === trigger.value
            return (
              <button
                key={trigger.value}
                onClick={() => {
                  setTriggerType(trigger.value)
                  const defaults: Record<TriggerType, Record<string, unknown>> = {
                    stage_change: { stage: 'Interviewed' },
                    no_reply: { days: 5 },
                    interview_approaching: { days_before: 1 },
                    offer_expiring: { days_before: 2 },
                    joining_approaching: { days_before: 3 },
                  }
                  setTriggerConfig(defaults[trigger.value])
                }}
                className={cn(
                  'flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-all',
                  active ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-surface-borderStrong'
                )}
              >
                <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', active ? 'text-primary' : 'text-ink-muted')} />
                <div>
                  <p className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-ink')}>{trigger.label}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">{trigger.desc}</p>
                </div>
              </button>
            )
          })}

          {/* Trigger config */}
          <div className="mt-2 pt-3 border-t border-surface-border">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Configure trigger</p>
            {triggerType === 'stage_change' && (
              <select
                value={(triggerConfig.stage as string) ?? 'Interviewed'}
                onChange={e => updateConfig('stage', e.target.value)}
                className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {(triggerType === 'no_reply') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-secondary">After</span>
                <input type="number" min={1} max={30} value={(triggerConfig.days as number) ?? 5}
                  onChange={e => updateConfig('days', parseInt(e.target.value))}
                  className="w-16 border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                <span className="text-sm text-ink-secondary">days with no reply</span>
              </div>
            )}
            {(triggerType === 'interview_approaching' || triggerType === 'offer_expiring' || triggerType === 'joining_approaching') && (
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={14} value={(triggerConfig.days_before as number) ?? 1}
                  onChange={e => updateConfig('days_before', parseInt(e.target.value))}
                  className="w-16 border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                <span className="text-sm text-ink-secondary">
                  day(s) before {triggerType === 'interview_approaching' ? 'interview' : triggerType === 'offer_expiring' ? 'offer expiry' : 'joining date'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Template */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-surface-border bg-surface-sunken flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">2</span>
          <p className="text-xs font-bold text-ink uppercase tracking-widest">Template — What to generate?</p>
        </div>
        <div className="p-4 grid grid-cols-1 gap-1.5">
          {TEMPLATES.map(t => (
            <button
              key={t.value}
              onClick={() => setTemplateType(t.value)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all',
                templateType === t.value ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-surface-borderStrong'
              )}
            >
              <span className="text-base">{t.emoji}</span>
              <span className={cn('text-xs font-semibold', templateType === t.value ? 'text-primary' : 'text-ink')}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Format + Tone */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-surface-border bg-surface-sunken flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">3</span>
          <p className="text-xs font-bold text-ink uppercase tracking-widest">Delivery — How to send it?</p>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Channel</p>
            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map(({ value, icon: Icon, label }) => (
                <button key={value} onClick={() => setFormat(value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                    format === value ? 'border-primary bg-primary text-white' : 'border-surface-border text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Tone</p>
            <div className="flex gap-1.5">
              {(['formal', 'friendly'] as Tone[]).map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                    tone === t ? 'border-primary bg-primary text-white' : 'border-surface-border text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                  )}
                >
                  {t === 'formal' ? 'Formal' : 'Friendly'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Name */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-surface-border bg-surface-sunken flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">4</span>
          <p className="text-xs font-bold text-ink uppercase tracking-widest">Name this rule</p>
        </div>
        <div className="p-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`e.g. ${selectedTrigger.label}`}
            className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-status-droppedText bg-status-droppedBg border border-status-dropped/30 rounded-lg px-3 py-2 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-2 shrink-0">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-sm font-semibold text-ink-secondary hover:text-ink hover:border-surface-borderStrong transition-all">
          Cancel
        </button>
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
        >
          {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Saving…</> : <>Save Rule</>}
        </button>
      </div>
    </div>
  )
}

// ── Rule Card ──────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
}: {
  rule: Automation
  isSelected: boolean
  onSelect: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all group',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-surface-border hover:border-surface-borderStrong bg-surface-card'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        rule.is_active ? 'bg-accent-soft' : 'bg-surface-sunken'
      )}>
        <TriggerIcon type={rule.trigger_type} className={cn('w-4 h-4', rule.is_active ? 'text-accent-text' : 'text-ink-muted')} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold leading-snug truncate', isSelected ? 'text-primary' : 'text-ink')}>{rule.name}</p>
        <p className="text-[10px] text-ink-muted mt-0.5 truncate">{triggerLabel(rule)}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-base leading-none">{templateEmoji(rule.template_type)}</span>
          <FormatBadge format={rule.format} />
          {rule.run_count > 0 && (
            <span className="text-[10px] text-ink-muted">{rule.run_count} run{rule.run_count !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          className="text-ink-muted hover:text-ink transition-colors"
          title={rule.is_active ? 'Pause rule' : 'Activate rule'}
        >
          {rule.is_active
            ? <ToggleRight className="w-5 h-5 text-accent-text" />
            : <ToggleLeft className="w-5 h-5 text-ink-muted" />
          }
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-status-droppedText transition-all"
          title="Delete rule"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'detail' | 'run' | 'create' | 'preset-create'>('detail')
  const [presetInitial, setPresetInitial] = useState<Partial<Automation> | undefined>(undefined)

  const fetchAutomations = useCallback(async () => {
    try {
      const res = await fetch('/api/automations')
      const data = await res.json()
      setAutomations(data.automations ?? [])
    } catch { /* silently ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAutomations() }, [fetchAutomations])

  const selected = automations.find(a => a.id === selectedId) ?? null

  async function toggleRule(rule: Automation) {
    const updated = { ...rule, is_active: !rule.is_active }
    setAutomations(prev => prev.map(a => a.id === rule.id ? updated : a))
    await fetch(`/api/automations/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: updated.is_active }),
    })
  }

  async function deleteRule(id: string) {
    setAutomations(prev => prev.filter(a => a.id !== id))
    if (selectedId === id) { setSelectedId(null); setMode('detail') }
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
  }

  function handleSaved(a: Automation) {
    setAutomations(prev => [a, ...prev])
    setSelectedId(a.id)
    setMode('detail')
    setPresetInitial(undefined)
  }

  function openCreate(initial?: Partial<Automation>) {
    setPresetInitial(initial)
    setSelectedId(null)
    setMode('create')
  }

  const activeCount = automations.filter(a => a.is_active).length
  const totalRuns = automations.reduce((sum, a) => sum + a.run_count, 0)

  return (
    <div className="flex flex-col lg:h-full">

      {/* Header */}
      <div className="mb-5 shrink-0 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Automation</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Build rules that trigger message generation when candidates hit key moments.</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />New Rule
        </button>
      </div>

      {/* Stats row */}
      {automations.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
          {[
            { label: 'Active rules', value: activeCount },
            { label: 'Total rules', value: automations.length },
            { label: 'Total runs', value: totalRuns },
          ].map(s => (
            <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-bold text-ink">{s.value}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 mb-5 shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-[11px] text-ink-secondary leading-relaxed">
          Rules currently run manually via &ldquo;Run Now&rdquo;. Auto-send via WhatsApp or email will be enabled when you connect your channels in <strong>Integrations</strong>.
        </p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 lg:flex-1 lg:min-h-0">

        {/* ── Left: Rule List ── */}
        <div className="flex flex-col gap-2 lg:overflow-y-auto lg:pr-1">
          {loading && (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-card border border-surface-border rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loading && automations.length === 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-ink">No rules yet</p>
              <p className="text-[11px] text-ink-muted mt-1">Create your first rule or pick a quick-start below.</p>
            </div>
          )}

          {!loading && automations.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isSelected={selectedId === rule.id}
              onSelect={() => { setSelectedId(rule.id); setMode('detail') }}
              onToggle={() => toggleRule(rule)}
              onDelete={() => deleteRule(rule.id)}
            />
          ))}
        </div>

        {/* ── Right: Detail / Create / Run ── */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5 lg:overflow-y-auto">

          {/* Create form */}
          {mode === 'create' && (
            <CreateRuleForm
              initial={presetInitial}
              onSave={handleSaved}
              onCancel={() => { setMode('detail'); setPresetInitial(undefined) }}
            />
          )}

          {/* Run now panel */}
          {mode === 'run' && selected && (
            <RunNowPanel rule={selected} onClose={() => setMode('detail')} />
          )}

          {/* Rule detail */}
          {mode === 'detail' && selected && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', selected.is_active ? 'bg-accent-soft' : 'bg-surface-sunken')}>
                    <TriggerIcon type={selected.trigger_type} className={cn('w-5 h-5', selected.is_active ? 'text-accent-text' : 'text-ink-muted')} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{selected.name}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{selected.is_active ? 'Active' : 'Paused'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMode('run')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-primary text-xs font-bold hover:bg-accent-hover transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />Run Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Trigger', value: triggerLabel(selected) },
                  { label: 'Template', value: `${templateEmoji(selected.template_type)} ${templateLabel(selected.template_type)}` },
                  { label: 'Channel', value: formatLabel(selected.format) },
                  { label: 'Tone', value: selected.tone === 'formal' ? 'Formal' : 'Friendly' },
                  { label: 'Total runs', value: String(selected.run_count) },
                  { label: 'Last run', value: selected.last_run_at ? timeAgo(selected.last_run_at) : 'Never' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-sunken border border-surface-border rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-ink mt-1">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 bg-surface-sunken border border-surface-border rounded-xl px-4 py-3">
                <ChevronRight className="w-4 h-4 text-ink-muted mt-0.5 shrink-0" />
                <p className="text-[11px] text-ink-secondary leading-relaxed">
                  Click <strong>Run Now</strong> to enter candidate details and generate a ready-to-send message using this rule&apos;s template, channel, and tone.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleRule(selected)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink hover:border-surface-borderStrong transition-all"
                >
                  {selected.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4 text-accent-text" />}
                  {selected.is_active ? 'Pause rule' : 'Activate rule'}
                </button>
                <button
                  onClick={() => deleteRule(selected.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-surface-border text-xs font-semibold text-ink-muted hover:text-status-droppedText hover:border-status-dropped/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </div>
            </div>
          )}

          {/* Empty state: show presets */}
          {mode === 'detail' && !selected && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-bold text-ink">Set up your first automation</p>
                <p className="text-[11px] text-ink-muted mt-1.5 max-w-sm leading-relaxed">
                  Pick a quick-start rule or create one from scratch. Rules define when a message gets generated — you fill in the candidate details and copy it when needed.
                </p>
              </div>

              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Quick-start rules</p>
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => openCreate(preset as Partial<Automation>)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-surface-border hover:border-primary hover:bg-primary/5 text-left transition-all group"
                  >
                    <span className="text-xl">{templateEmoji(preset.template_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">{preset.name}</p>
                      <p className="text-[10px] text-ink-muted mt-0.5">{triggerLabel(preset as Automation)} · {formatLabel(preset.format)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => openCreate()}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-surface-borderStrong text-xs font-semibold text-ink-secondary hover:text-primary hover:border-primary transition-all"
              >
                <Plus className="w-3.5 h-3.5" />Create custom rule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
