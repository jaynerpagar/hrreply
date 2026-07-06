'use client'

import { useState, useEffect, Suspense, ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Copy, Check, RefreshCw, Pencil, Mail, MessageCircle,
  Smartphone, Link2, Hash, LayoutGrid, Sparkles, Wand2, CornerDownLeft, Trash2,
} from 'lucide-react'
import { UpsellModal } from '@/components/ui/upsell-modal'
import { AnalyzeBar } from '@/components/analyze'
import { Tone, ReplyType, MessageFormat, RewriteStyle, SubjectLine } from '@/types'
import { FORMAT_LABELS, REWRITE_LABELS, cn } from '@/lib/utils'

// ── Constants ──────────────────────────────────────────────────────────────

const TONES: { value: Tone; label: string }[] = [
  { value: 'formal',   label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
]

const FORMATS: { value: MessageFormat; icon: ReactNode; label: string }[] = [
  { value: 'email',    icon: <Mail className="w-3.5 h-3.5" />,          label: 'Email' },
  { value: 'whatsapp', icon: <MessageCircle className="w-3.5 h-3.5" />, label: 'WhatsApp' },
  { value: 'sms',      icon: <Smartphone className="w-3.5 h-3.5" />,    label: 'SMS' },
  { value: 'linkedin', icon: <Link2 className="w-3.5 h-3.5" />,         label: 'LinkedIn' },
  { value: 'slack',    icon: <Hash className="w-3.5 h-3.5" />,          label: 'Slack' },
  { value: 'teams',    icon: <LayoutGrid className="w-3.5 h-3.5" />,    label: 'Teams' },
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

interface FieldDef { label: string; placeholder: string; wide?: boolean }

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
  documents:      { label: 'Documents needed',  placeholder: 'e.g. Aadhaar, last 3 payslips', wide: true },
  manager:        { label: 'Reporting manager', placeholder: 'e.g. Anita Kapoor (VP HR)', wide: true },
  department:     { label: 'Department / Team', placeholder: 'e.g. Finance, Engineering' },
  lastWorkingDay: { label: 'Last working day',  placeholder: 'e.g. 31st January' },
}

const FIELD_CONTEXT_LABEL: Record<FieldId, string> = {
  candidateName: 'Candidate', role: 'Role', round: 'Interview round', date: 'Date',
  time: 'Time', platform: 'Platform', interviewer: 'Interviewer', ctc: 'CTC',
  joiningDate: 'Joining date', location: 'Location', documents: 'Documents needed',
  manager: 'Reporting manager', department: 'Department', lastWorkingDay: 'Last working day',
}

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

// ── Shared section label ───────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2.5">{children}</p>
}

function TonePills({ tone, onChange }: { tone: Tone; onChange: (t: Tone) => void }) {
  return (
    <div className="flex gap-1.5">
      {TONES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-3 py-1 rounded-md border text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            tone === value
              ? 'bg-primary border-primary text-white'
              : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function FormatPills({ format, onChange }: { format: MessageFormat; onChange: (f: MessageFormat) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FORMATS.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            format === value
              ? 'border-primary bg-primary text-white shadow-sm'
              : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Thread message type ────────────────────────────────────────────────────

type ThreadMessage = { role: 'candidate' | 'hr'; text: string }

// ── Main component ─────────────────────────────────────────────────────────

function GeneratorContent() {
  const searchParams = useSearchParams()

  // Mode
  const [mode, setMode] = useState<'compose' | 'reply'>('compose')

  // Compose state
  const [format, setFormat] = useState<MessageFormat>('email')
  const [replyType, setReplyType] = useState<ReplyType>(
    (searchParams.get('type') as ReplyType) || 'interview_invite'
  )
  const [tone, setTone] = useState<Tone>('friendly')
  const [fields, setFields] = useState<Record<string, string>>({})

  // Reply mode state
  const [candidateMessage, setCandidateMessage] = useState('')
  const [replyContext, setReplyContext] = useState({ candidateName: '', role: '' })
  const [replyThread, setReplyThread] = useState<ThreadMessage[]>([])
  const [detectedTone, setDetectedTone] = useState('')
  const [detectedIntent, setDetectedIntent] = useState('')

  // Shared output state
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

  function switchMode(newMode: 'compose' | 'reply') {
    setMode(newMode)
    setOutput('')
    setOutputFresh(false)
    setDetectedTone('')
    setDetectedIntent('')
    setError('')
    setEditing(false)
    setSubjectLines([])
  }

  function setField(id: string, val: string) {
    setFields(prev => ({ ...prev, [id]: val }))
    setSubjectLines([])
  }

  const contextReady = mode === 'compose'
    ? composeContext(replyType, fields).trim().length > 0
    : candidateMessage.trim().length > 0

  // Compose: generate from structured fields
  async function generate() {
    const ctx = composeContext(replyType, fields)
    if (!ctx.trim()) return
    setLoading(true); setError(''); setOutput(''); setEditing(false); setSubjectLines([])
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
      setOutput(data.generated_text); setOutputFresh(true)
    } catch { setError('Network error — please check your connection.') }
    finally { setLoading(false) }
  }

  // Reply: generate reply to candidate's message
  async function generateReply() {
    const msg = candidateMessage.trim()
    if (!msg) return
    setLoading(true); setError(''); setOutput(''); setEditing(false)
    setDetectedTone(''); setDetectedIntent(''); setSubjectLines([])
    try {
      const res = await fetch('/api/reply-to-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_message: msg,
          conversation_history: replyThread,
          format,
          tone_preference: tone,
          candidate_name: replyContext.candidateName,
          role: replyContext.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'free_limit_reached') setShowUpsell(true)
        else setError(data.error ?? 'Something went wrong')
        return
      }
      setOutput(data.reply_text); setDetectedTone(data.detected_tone)
      setDetectedIntent(data.detected_intent); setOutputFresh(true)
    } catch { setError('Network error — please check your connection.') }
    finally { setLoading(false) }
  }

  // Add generated reply to conversation thread
  function useThisReply() {
    setReplyThread(prev => [
      ...prev,
      { role: 'candidate', text: candidateMessage },
      { role: 'hr', text: output },
    ])
    setCandidateMessage(''); setOutput('')
    setOutputFresh(false); setDetectedTone(''); setDetectedIntent('')
  }

  async function rewrite(style: RewriteStyle) {
    if (!output.trim() || rewriteLoading) return
    setRewriteLoading(style); setEditing(false)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: output, style }),
      })
      const data = await res.json()
      if (res.ok) { setOutput(data.rewritten_text); setOutputFresh(true) }
    } finally { setRewriteLoading(null) }
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
    } finally { setSubjectLoading(false) }
  }

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function copySubject(idx: number, subject: string) {
    navigator.clipboard.writeText(subject)
    setCopiedSubject(idx); setTimeout(() => setCopiedSubject(null), 2000)
  }

  const urgencyColor = (u: string) =>
    u === 'High'   ? 'text-status-droppedText bg-status-droppedBg' :
    u === 'Medium' ? 'text-status-processText bg-status-processBg' :
                     'text-status-placedText bg-status-placedBg'

  const schemaFields = SCHEMA[replyType]
  const activeGenerate = mode === 'compose' ? generate : generateReply

  return (
    <div className="flex flex-col">
      <UpsellModal open={showUpsell} onClose={() => setShowUpsell(false)} reason="limit_reached" />

      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink tracking-tight">Reply Generator</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Compose HR messages from scratch, or paste a candidate&apos;s message to reply.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-surface-sunken border border-surface-border rounded-xl mb-5">
        {(['compose', 'reply'] as const).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              mode === m
                ? 'bg-surface-card text-ink shadow-sm border border-surface-border'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {m === 'compose'
              ? <><Wand2 className="w-3.5 h-3.5" />Compose</>
              : <><CornerDownLeft className="w-3.5 h-3.5" />Reply to candidate</>
            }
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 items-start">

        {/* ══ LEFT PANE ══════════════════════════════════════════════════════ */}
        <div>

          {/* ── COMPOSE MODE ─────────────────────────────────────────────── */}
          {mode === 'compose' && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">

              {/* Format */}
              <div className="px-5 pt-4 pb-3 border-b border-surface-border">
                <SectionLabel>Send via</SectionLabel>
                <FormatPills format={format} onChange={setFormat} />
              </div>

              {/* Message type + Tone */}
              <div className="px-5 py-4 border-b border-surface-border">
                <div className="flex items-center justify-between mb-2.5">
                  <SectionLabel>Message type</SectionLabel>
                  <TonePills tone={tone} onChange={setTone} />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {REPLY_TYPES.map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      onClick={() => setReplyType(value)}
                      className={cn(
                        'flex items-center gap-1.5 text-left px-2.5 py-2 rounded-lg border text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        replyType === value
                          ? 'border-accent bg-accent text-primary font-semibold shadow-sm'
                          : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                      )}
                    >
                      <span className="text-sm leading-none">{emoji}</span>
                      <span className="leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Structured fields */}
              <div className="px-5 py-4 border-b border-surface-border">
                <SectionLabel>Candidate details</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {schemaFields.map(id => {
                    const def = FIELD_DEFS[id]
                    return (
                      <div key={id} className={def.wide ? 'col-span-2' : ''}>
                        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">{def.label}</label>
                        <input
                          type="text"
                          value={fields[id] ?? ''}
                          onChange={e => setField(id, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && contextReady) activeGenerate() }}
                          placeholder={def.placeholder}
                          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                        />
                      </div>
                    )
                  })}
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Additional notes</label>
                    <textarea
                      rows={2}
                      value={fields['notes'] ?? ''}
                      onChange={e => setField('notes', e.target.value)}
                      placeholder="Company name, CTC range, special instructions…"
                      className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Generate */}
              <div className="p-4">
                <GenerateButton loading={loading} disabled={!contextReady} onClick={activeGenerate} mode="compose" />
              </div>
            </div>
          )}

          {/* ── REPLY MODE ───────────────────────────────────────────────── */}
          {mode === 'reply' && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">

              {/* Paste area */}
              <div className="px-5 pt-4 pb-3 border-b border-surface-border">
                <SectionLabel>Candidate&apos;s message</SectionLabel>
                <textarea
                  rows={6}
                  value={candidateMessage}
                  onChange={e => setCandidateMessage(e.target.value)}
                  placeholder={"Paste or type what the candidate wrote…\n\nExample: \"Hi, I'm not available this Friday for the interview. Can we please reschedule to next week?\""}
                  className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
                />
              </div>

              {/* Reply via */}
              <div className="px-5 py-3 border-b border-surface-border">
                <SectionLabel>Reply via</SectionLabel>
                <FormatPills format={format} onChange={setFormat} />
              </div>

              {/* Tone */}
              <div className="px-5 py-3 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <SectionLabel>Reply tone</SectionLabel>
                  <TonePills tone={tone} onChange={setTone} />
                </div>
              </div>

              {/* Quick context */}
              <div className="px-5 py-4 border-b border-surface-border">
                <div className="flex items-center gap-2 mb-2.5">
                  <SectionLabel>Quick context</SectionLabel>
                  <span className="text-[10px] text-ink-muted -mt-2.5">(optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Candidate name</label>
                    <input type="text" value={replyContext.candidateName}
                      onChange={e => setReplyContext(p => ({ ...p, candidateName: e.target.value }))}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Role</label>
                    <input type="text" value={replyContext.role}
                      onChange={e => setReplyContext(p => ({ ...p, role: e.target.value }))}
                      placeholder="e.g. Frontend Developer"
                      className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              {/* Generate */}
              <div className="p-4">
                <GenerateButton loading={loading} disabled={!contextReady} onClick={activeGenerate} mode="reply" />
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANE ═════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {error && (
            <div className="bg-status-droppedBg border border-status-dropped/30 rounded-xl px-4 py-3 text-sm text-status-droppedText">
              {error}
            </div>
          )}

          {/* Conversation thread — reply mode */}
          {mode === 'reply' && replyThread.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
                <p className="text-sm font-bold text-ink">Conversation thread</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted">{Math.ceil(replyThread.length / 2)} exchange{Math.ceil(replyThread.length / 2) !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setReplyThread([])}
                    className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-status-droppedText transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>
              <div className="divide-y divide-surface-border max-h-72 overflow-y-auto">
                {replyThread.map((msg, i) => (
                  <div key={i} className={cn('px-5 py-3.5', msg.role === 'hr' ? 'bg-accent-soft' : 'bg-surface-sunken')}>
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest block mb-1.5',
                      msg.role === 'hr' ? 'text-accent-text' : 'text-ink-muted')}>
                      {msg.role === 'hr' ? 'You (HR)' : 'Candidate'}
                    </span>
                    <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="w-4 h-4 text-accent-icon animate-pulse" />
                <span className="text-sm text-ink-secondary">
                  {mode === 'reply' ? 'Analysing message and drafting reply…' : `Writing your ${FORMAT_LABELS[format]} message…`}
                </span>
              </div>
              <div className="space-y-2.5">
                {[100, 83, 100, 67, 83].map((w, i) => (
                  <div key={i} className={`h-3 bg-surface-sunken rounded animate-pulse`} style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Tone + Intent badges — reply mode */}
          {mode === 'reply' && output && !loading && (detectedTone || detectedIntent) && (
            <div className="flex items-center gap-2 flex-wrap">
              {detectedTone && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-status-processBg text-status-processText">
                  <span>🎭</span> {detectedTone}
                </span>
              )}
              {detectedIntent && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent-soft text-accent-text">
                  <span>🎯</span> {detectedIntent}
                </span>
              )}
              <span className="text-xs text-ink-muted">detected from candidate&apos;s message</span>
            </div>
          )}

          {/* Output */}
          {output && !loading && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div className={cn('p-6 transition-colors duration-700', outputFresh ? 'bg-accent-soft' : 'bg-surface-sunken')}>
                {editing ? (
                  <textarea
                    value={output}
                    onChange={e => setOutput(e.target.value)}
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
                  {REWRITE_STYLES.map(style => (
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
              <div className="px-5 py-3 border-t border-surface-border flex items-center gap-2 bg-white flex-wrap">
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
                <AnalyzeBar text={output} channel={format} onApplyText={setOutput} />
                {mode === 'compose' ? (
                  <button
                    onClick={generate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary text-xs font-semibold text-white hover:bg-primary-hover transition-all ml-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                ) : (
                  <button
                    onClick={useThisReply}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-primary text-xs font-bold hover:bg-accent-hover transition-all ml-auto shadow-sm"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" /> Use this reply
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Subject lines — compose + email only */}
          {mode === 'compose' && output && !loading && format === 'email' && (
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
                  <p className="text-sm text-ink-muted">Click <span className="font-semibold text-ink">Generate</span> to get 5 subject line options</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Empty state */}
          {!output && !loading && !error && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card flex flex-col items-center justify-center text-center py-20 px-8 gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-1">
                {mode === 'compose'
                  ? <Wand2 className="w-5 h-5 text-accent" />
                  : <CornerDownLeft className="w-5 h-5 text-accent" />
                }
              </div>
              {mode === 'compose' ? (
                <>
                  <p className="text-base font-semibold text-ink">Your draft will appear here</p>
                  <p className="text-sm text-ink-muted max-w-xs leading-relaxed">
                    Fill in the candidate details on the left, then click <span className="font-semibold text-ink">Generate reply</span>.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-ink">Paste a candidate message</p>
                  <p className="text-sm text-ink-muted max-w-xs leading-relaxed">
                    The AI will detect their tone and intent, then draft an appropriate reply you can send as-is.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Generate button ────────────────────────────────────────────────────────

function GenerateButton({ loading, disabled, onClick, mode = 'compose' }: {
  loading: boolean; disabled: boolean; onClick: () => void; mode?: 'compose' | 'reply'
}) {
  return (
    <div className="relative w-full">
      {!loading && !disabled && (
        <span className="absolute inset-0 rounded-lg animate-ping bg-accent opacity-20 pointer-events-none" />
      )}
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="relative w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</>
        ) : mode === 'reply' ? (
          <><CornerDownLeft className="w-4 h-4" />Generate reply</>
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
