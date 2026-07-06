'use client'

import { useState, useEffect, Suspense, ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Copy, Check, RefreshCw, Pencil, Mail, MessageCircle,
  Smartphone, Link2, Hash, LayoutGrid, Sparkles, Wand2,
} from 'lucide-react'
import { UpsellModal } from '@/components/ui/upsell-modal'
import { Tone, ReplyType, MessageFormat, RewriteStyle, SubjectLine } from '@/types'
import { FORMAT_LABELS, REWRITE_LABELS, cn } from '@/lib/utils'

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: 'formal',   label: 'Formal',   desc: 'Professional & corporate' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm & approachable' },
]

const FORMATS: { value: MessageFormat; icon: ReactNode; label: string }[] = [
  { value: 'email',    icon: <Mail className="w-4 h-4" />,          label: 'Email' },
  { value: 'whatsapp', icon: <MessageCircle className="w-4 h-4" />, label: 'WhatsApp' },
  { value: 'sms',      icon: <Smartphone className="w-4 h-4" />,    label: 'SMS' },
  { value: 'linkedin', icon: <Link2 className="w-4 h-4" />,         label: 'LinkedIn' },
  { value: 'slack',    icon: <Hash className="w-4 h-4" />,          label: 'Slack' },
  { value: 'teams',    icon: <LayoutGrid className="w-4 h-4" />,    label: 'Teams' },
]

const REPLY_TYPES: { value: ReplyType; emoji: string; label: string }[] = [
  { value: 'interview_invite',    emoji: '📅', label: 'Interview Invite' },
  { value: 'interview_reminder',  emoji: '⏰', label: 'Interview Reminder' },
  { value: 'shortlist',           emoji: '✅', label: 'Shortlisted' },
  { value: 'offer',               emoji: '🎉', label: 'Job Offer' },
  { value: 'rejection',           emoji: '🙏', label: 'Rejection' },
  { value: 'reschedule',          emoji: '🔄', label: 'Reschedule' },
  { value: 'no_show',             emoji: '👻', label: 'No Show' },
  { value: 'follow_up',           emoji: '💬', label: 'Follow-up' },
  { value: 'salary_negotiation',  emoji: '💰', label: 'Salary Discussion' },
  { value: 'joining_confirmation',emoji: '📝', label: 'Joining Confirmation' },
  { value: 'thank_you',           emoji: '⭐', label: 'Post-Interview Thanks' },
  { value: 'document_collection', emoji: '📋', label: 'Document Request' },
  { value: 'onboarding',          emoji: '🚀', label: 'Onboarding' },
  { value: 'welcome',             emoji: '👋', label: 'Welcome' },
  { value: 'exit_interview',      emoji: '🚪', label: 'Exit Interview' },
]

const REWRITE_STYLES: RewriteStyle[] = [
  'shorter', 'longer', 'professional', 'friendly', 'polite',
  'stronger', 'softer', 'simple', 'corporate', 'startup',
]

// ── Structured fields ──────────────────────────────────────────────────────

type FieldId =
  | 'candidateName' | 'role' | 'round' | 'date' | 'time' | 'platform'
  | 'interviewer' | 'ctc' | 'joiningDate' | 'location' | 'documents'
  | 'manager' | 'department' | 'lastWorkingDay'

interface FieldDef {
  label: string
  placeholder: string
  wide?: boolean
}

const FIELD_DEFS: Record<FieldId, FieldDef> = {
  candidateName:  { label: 'Candidate name',    placeholder: 'e.g. Priya Sharma' },
  role:           { label: 'Role / Position',   placeholder: 'e.g. Senior HR Manager' },
  round:          { label: 'Interview round',   placeholder: 'e.g. Round 1, Technical' },
  date:           { label: 'Date',              placeholder: 'e.g. 22nd January' },
  time:           { label: 'Time',              placeholder: 'e.g. 11:30 AM' },
  platform:       { label: 'Platform / Venue',  placeholder: 'e.g. Google Meet, Bangalore office' },
  interviewer:    { label: 'Interviewer name',  placeholder: 'e.g. Rahul (Team Lead)', wide: true },
  ctc:            { label: 'CTC offered',       placeholder: 'e.g. ₹12–15 LPA' },
  joiningDate:    { label: 'Joining date',      placeholder: 'e.g. 3rd February' },
  location:       { label: 'Work location',     placeholder: 'e.g. Bangalore, Remote' },
  documents:      { label: 'Documents needed',  placeholder: 'e.g. Aadhaar, last 3 payslips, offer letter', wide: true },
  manager:        { label: 'Reporting manager', placeholder: 'e.g. Anita Kapoor (VP HR)', wide: true },
  department:     { label: 'Department / Team', placeholder: 'e.g. Finance, Engineering' },
  lastWorkingDay: { label: 'Last working day',  placeholder: 'e.g. 31st January' },
}

const FIELD_CONTEXT_LABEL: Record<FieldId, string> = {
  candidateName:  'Candidate',
  role:           'Role',
  round:          'Interview round',
  date:           'Date',
  time:           'Time',
  platform:       'Platform',
  interviewer:    'Interviewer',
  ctc:            'CTC',
  joiningDate:    'Joining date',
  location:       'Location',
  documents:      'Documents needed',
  manager:        'Reporting manager',
  department:     'Department',
  lastWorkingDay: 'Last working day',
}

// Fields shown per reply type (notes always appended separately)
const SCHEMA: Record<ReplyType, FieldId[]> = {
  interview_invite:     ['candidateName', 'role', 'round', 'date', 'time', 'platform', 'interviewer'],
  interview_reminder:   ['candidateName', 'role', 'round', 'date', 'time', 'platform'],
  shortlist:            ['candidateName', 'role'],
  offer:                ['candidateName', 'role', 'ctc', 'joiningDate', 'location'],
  rejection:            ['candidateName', 'role'],
  reschedule:           ['candidateName', 'role', 'round', 'date', 'time', 'platform'],
  no_show:              ['candidateName', 'role', 'date', 'time'],
  follow_up:            ['candidateName', 'role'],
  salary_negotiation:   ['candidateName', 'role', 'ctc'],
  joining_confirmation: ['candidateName', 'role', 'joiningDate', 'location'],
  thank_you:            ['candidateName', 'role', 'round'],
  document_collection:  ['candidateName', 'role', 'joiningDate', 'documents'],
  onboarding:           ['candidateName', 'role', 'joiningDate', 'location', 'manager', 'department'],
  welcome:              ['candidateName', 'role', 'joiningDate', 'department', 'manager'],
  exit_interview:       ['candidateName', 'role', 'lastWorkingDay'],
}

function composeContext(replyType: ReplyType, fields: Record<string, string>): string {
  const parts: string[] = []
  for (const id of SCHEMA[replyType]) {
    const val = (fields[id] ?? '').trim()
    if (val) parts.push(`${FIELD_CONTEXT_LABEL[id]}: ${val}`)
  }
  const notes = (fields['notes'] ?? '').trim()
  if (notes) parts.push(notes)
  return parts.join('. ')
}

// ──────────────────────────────────────────────────────────────────────────

function GeneratorContent() {
  const searchParams = useSearchParams()
  const [format, setFormat] = useState<MessageFormat>('email')
  const [replyType, setReplyType] = useState<ReplyType>(
    (searchParams.get('type') as ReplyType) || 'interview_invite'
  )
  const [tone, setTone] = useState<Tone>('friendly')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [output, setOutput] = useState('')
  const [outputFresh, setOutputFresh] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState<RewriteStyle | null>(null)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [showUpsell, setShowUpsell] = useState(false)
  const [subjectLines, setSubjectLines] = useState<SubjectLine[]>([])
  const [subjectLoading, setSubjectLoading] = useState(false)
  const [copiedSubject, setCopiedSubject] = useState<number | null>(null)

  useEffect(() => {
    if (!outputFresh) return
    const t = setTimeout(() => setOutputFresh(false), 3000)
    return () => clearTimeout(t)
  }, [outputFresh])

  function setField(id: string, val: string) {
    setFields(prev => ({ ...prev, [id]: val }))
    setSubjectLines([])
  }

  const contextReady = composeContext(replyType, fields).trim().length > 0

  async function generate() {
    const ctx = composeContext(replyType, fields)
    if (!ctx.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    setEditing(false)
    setSubjectLines([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_type: replyType, tone, context_input: ctx, format, language: 'english' }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'free_limit_reached') setShowUpsell(true)
        else setError(data.error ?? 'Something went wrong — please try again.')
        return
      }
      setOutput(data.generated_text)
      setOutputFresh(true)
    } catch {
      setError('Network error — please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function rewrite(style: RewriteStyle) {
    if (!output.trim() || rewriteLoading) return
    setRewriteLoading(style)
    setEditing(false)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: output, style }),
      })
      const data = await res.json()
      if (res.ok) { setOutput(data.rewritten_text); setOutputFresh(true) }
    } finally {
      setRewriteLoading(null)
    }
  }

  async function generateSubjectLines() {
    const ctx = composeContext(replyType, fields)
    if (!ctx.trim()) return
    setSubjectLoading(true)
    try {
      const res = await fetch('/api/subject-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_input: ctx, reply_type: replyType }),
      })
      const data = await res.json()
      if (res.ok) setSubjectLines(data.subject_lines)
    } finally {
      setSubjectLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copySubject(idx: number, subject: string) {
    navigator.clipboard.writeText(subject)
    setCopiedSubject(idx)
    setTimeout(() => setCopiedSubject(null), 2000)
  }

  const urgencyColor = (u: string) =>
    u === 'High'   ? 'text-status-droppedText bg-status-droppedBg' :
    u === 'Medium' ? 'text-status-processText bg-status-processBg' :
                     'text-status-placedText bg-status-placedBg'

  const selectedType = REPLY_TYPES.find(t => t.value === replyType)
  const schemaFields = SCHEMA[replyType]

  return (
    <div className="flex flex-col h-full">
      <UpsellModal open={showUpsell} onClose={() => setShowUpsell(false)} reason="limit_reached" />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink tracking-tight">Reply Generator</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Pick a message type, fill in the details — get a ready-to-send draft.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 items-start">

        {/* ── LEFT PANE ── */}
        <div className="flex flex-col gap-4">

          {/* Format */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mb-3">Send via</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {FORMATS.map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-1 rounded-lg border text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    format === value
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:bg-surface-sunken hover:text-ink'
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message type */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">Message type</p>
              {selectedType && (
                <span className="text-xs font-semibold text-accent-icon">
                  {selectedType.emoji} {selectedType.label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {REPLY_TYPES.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => setReplyType(value)}
                  className={cn(
                    'flex items-center gap-2 text-left px-3 py-2.5 rounded-lg border text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    replyType === value
                      ? 'border-accent bg-accent text-primary font-semibold shadow-sm'
                      : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:bg-surface-sunken hover:text-ink'
                  )}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className="text-[13px] leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mb-3">Tone</p>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 px-4 py-3 rounded-lg border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    tone === value
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-surface-border bg-surface-page hover:border-surface-borderStrong hover:bg-surface-sunken'
                  )}
                >
                  <span className={cn('text-sm font-semibold', tone === value ? 'text-white' : 'text-ink')}>{label}</span>
                  <span className={cn('text-xs', tone === value ? 'text-white/70' : 'text-ink-muted')}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Structured fields */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mb-3">Candidate details</p>
            <div className="grid grid-cols-2 gap-3">
              {schemaFields.map(id => {
                const def = FIELD_DEFS[id]
                return (
                  <div key={id} className={def.wide ? 'col-span-2' : ''}>
                    <label className="text-xs font-semibold text-ink-secondary mb-1 block">{def.label}</label>
                    <input
                      type="text"
                      value={fields[id] ?? ''}
                      onChange={e => setField(id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && contextReady) generate() }}
                      placeholder={def.placeholder}
                      className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    />
                  </div>
                )
              })}
              {/* Notes — always shown */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-ink-secondary mb-1 block">Additional notes</label>
                <textarea
                  rows={2}
                  value={fields['notes'] ?? ''}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="Any extra context — company name, CTC range, special instructions…"
                  className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
                />
              </div>
            </div>
            {/* Mobile generate */}
            <div className="lg:hidden mt-3 flex justify-end">
              <GenerateButton loading={loading} disabled={!contextReady} onClick={generate} />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE ── */}
        <div className="flex flex-col gap-4">

          {/* Desktop generate */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              {output && !loading && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-icon inline-block" />
                  Draft ready — review before sending
                </span>
              )}
            </div>
            <GenerateButton loading={loading} disabled={!contextReady} onClick={generate} />
          </div>

          {error && (
            <div className="bg-status-droppedBg border border-status-dropped/30 rounded-xl px-4 py-3 text-sm text-status-droppedText">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="w-4 h-4 text-accent-icon animate-pulse" />
                <span className="text-sm text-ink-secondary">Writing your {FORMAT_LABELS[format]} message…</span>
              </div>
              <div className="space-y-2.5">
                <div className="h-3 bg-surface-sunken rounded animate-pulse w-full" />
                <div className="h-3 bg-surface-sunken rounded animate-pulse w-5/6" />
                <div className="h-3 bg-surface-sunken rounded animate-pulse w-full" />
                <div className="h-3 bg-surface-sunken rounded animate-pulse w-4/6" />
                <div className="h-3 bg-surface-sunken rounded animate-pulse w-5/6" />
              </div>
            </div>
          )}

          {/* Output */}
          {output && !loading && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div className={cn(
                'p-6 transition-colors duration-700',
                outputFresh ? 'bg-accent-soft' : 'bg-surface-sunken'
              )}>
                {editing ? (
                  <textarea
                    value={output}
                    onChange={(e) => setOutput(e.target.value)}
                    onBlur={() => setEditing(false)}
                    rows={10}
                    className="w-full bg-transparent text-ink text-[15px] leading-[1.75] resize-none focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-ink text-[15px] leading-[1.75] whitespace-pre-wrap">{output}</p>
                )}
              </div>

              {/* Rewrite strip */}
              <div className="border-t border-surface-border bg-surface-page px-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-3 h-3 text-ink-muted" />
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Rewrite</p>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
                  {REWRITE_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => rewrite(style)}
                      disabled={!!rewriteLoading}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        rewriteLoading === style
                          ? 'border-primary bg-primary text-white'
                          : 'border-surface-border bg-white text-ink-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed'
                      )}
                    >
                      {rewriteLoading === style && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {REWRITE_LABELS[style]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-surface-border flex items-center gap-2 bg-white">
                <button
                  onClick={copy}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                    copied
                      ? 'border-accent bg-accent-soft text-accent-text'
                      : 'border-surface-border bg-surface-page text-ink-secondary hover:border-primary hover:text-primary'
                  )}
                >
                  {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy message</>}
                </button>
                <button
                  onClick={() => { setEditing(true); setOutputFresh(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-page text-xs font-semibold text-ink-secondary hover:border-primary hover:text-primary transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={generate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary text-xs font-semibold text-white hover:bg-primary-hover transition-all ml-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Subject line card — email only */}
          {output && !loading && format === 'email' && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-surface-border bg-white">
                <div>
                  <p className="text-sm font-bold text-ink">Subject lines</p>
                  <p className="text-xs text-ink-muted mt-0.5">5 options with open rate prediction</p>
                </div>
                <button
                  onClick={generateSubjectLines}
                  disabled={subjectLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all disabled:opacity-60"
                >
                  {subjectLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Generating…</>
                    : <><Sparkles className="w-3.5 h-3.5" />Generate</>}
                </button>
              </div>

              {subjectLines.length > 0 ? (
                <div className="divide-y divide-surface-border">
                  {subjectLines.map((s, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-3 group hover:bg-surface-sunken transition-colors">
                      <div className="w-5 h-5 rounded-full bg-surface-sunken border border-surface-border flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-ink-muted">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink leading-snug">{s.subject}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-ink-muted">Score <span className="font-bold text-ink">{s.professional_score}/10</span></span>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', urgencyColor(s.urgency))}>{s.urgency}</span>
                          <span className="text-xs text-ink-muted">~{s.open_rate}% open rate</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copySubject(i, s.subject)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-primary px-2.5 py-1.5 rounded-lg border border-surface-border bg-white"
                      >
                        {copiedSubject === i ? <><Check className="w-3 h-3 text-accent-icon" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                      </button>
                    </div>
                  ))}
                </div>
              ) : !subjectLoading ? (
                <div className="px-5 py-8 text-center">
                  <Sparkles className="w-5 h-5 text-ink-muted mx-auto mb-2" />
                  <p className="text-sm text-ink-muted">Click <span className="font-semibold text-ink">Generate</span> to get 5 subject line options with open rate scores</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Empty state */}
          {!output && !loading && !error && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card flex flex-col items-center justify-center text-center py-20 px-8 gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-1">
                <Wand2 className="w-5 h-5 text-accent" />
              </div>
              <p className="text-base font-semibold text-ink">Your draft will appear here</p>
              <p className="text-sm text-ink-muted max-w-xs leading-relaxed">
                Fill in the candidate details on the left, then click <span className="font-semibold text-ink">Generate reply</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GenerateButton({ loading, disabled, onClick }: { loading: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <div className="relative">
      {!loading && !disabled && (
        <span className="absolute inset-0 rounded-lg animate-ping bg-accent opacity-25 pointer-events-none" />
      )}
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="relative flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</>
        ) : (
          <><Wand2 className="w-4 h-4" />Generate reply</>
        )}
      </button>
    </div>
  )
}

export default function GeneratorPage() {
  return (
    <Suspense>
      <GeneratorContent />
    </Suspense>
  )
}
