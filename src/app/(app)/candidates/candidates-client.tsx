'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Plus, Pencil, Trash2, X, Phone, Briefcase,
  ChevronDown, Sparkles, Zap, Wand2, Brain, Loader2, AlertTriangle, History, Copy, Check,
  FileText, UploadCloud, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Stage =
  | 'applied' | 'screening' | 'shortlisted' | 'interview_scheduled'
  | 'interviewed' | 'offer_sent' | 'hired' | 'rejected'

export interface Candidate {
  id: string
  name: string
  phone: string | null
  role_applied: string
  stage: Stage
  notes: string | null
  last_contacted_at: string | null
  created_at: string
  // enriched fields (Phase 4)
  current_company: string | null
  skills: string | null
  experience: string | null
  notice_period: string | null
  interview_at: string | null
  offer_expiry_at: string | null
  joining_at: string | null
}

const STAGES: { value: Stage; label: string; color: string; dot: string }[] = [
  { value: 'applied',              label: 'Applied',             color: 'bg-surface-sunken text-ink-secondary',        dot: 'bg-ink-muted'        },
  { value: 'screening',           label: 'Screening',           color: 'bg-primary-soft text-primary-deep',           dot: 'bg-primary'          },
  { value: 'shortlisted',         label: 'Shortlisted',         color: 'bg-accent-soft text-accent-text',             dot: 'bg-accent'           },
  { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'bg-status-processBg text-status-processText', dot: 'bg-status-process'   },
  { value: 'interviewed',         label: 'Interviewed',         color: 'bg-status-processBg text-status-processText', dot: 'bg-status-process'   },
  { value: 'offer_sent',          label: 'Offer Sent',          color: 'bg-primary-soft text-primary-deep',           dot: 'bg-primary'          },
  { value: 'hired',               label: 'Hired',               color: 'bg-status-placedBg text-status-placedText',   dot: 'bg-status-placed'    },
  { value: 'rejected',            label: 'Rejected',            color: 'bg-status-droppedBg text-status-droppedText', dot: 'bg-status-dropped'   },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.value, s]))

// Which automation tab to suggest per stage
const STAGE_AUTO_TAB: Partial<Record<Stage, string>> = {
  interview_scheduled: 'interview_reminder',
  interviewed:         'thank_you',
  offer_sent:          'offer_reminder',
  hired:               'joining_sequence',
}

function StagePill({ stage }: { stage: Stage }) {
  const s = STAGE_MAP[stage]
  if (!s) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', s.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps {
  candidate?: Candidate | null
  onClose: () => void
  onSave: (data: Partial<Candidate>) => Promise<void>
}

function CandidateModal({ candidate, onClose, onSave }: ModalProps) {
  const [name, setName]                   = useState(candidate?.name            ?? '')
  const [phone, setPhone]                 = useState(candidate?.phone           ?? '')
  const [role, setRole]                   = useState(candidate?.role_applied    ?? '')
  const [stage, setStage]                 = useState<Stage>(candidate?.stage    ?? 'applied')
  const [notes, setNotes]                 = useState(candidate?.notes           ?? '')
  const [currentCompany, setCurrentCompany] = useState(candidate?.current_company ?? '')
  const [skills, setSkills]               = useState(candidate?.skills          ?? '')
  const [experience, setExperience]       = useState(candidate?.experience      ?? '')
  const [noticePeriod, setNoticePeriod]   = useState(candidate?.notice_period   ?? '')
  const [interviewAt, setInterviewAt]     = useState(
    candidate?.interview_at ? candidate.interview_at.slice(0, 16) : ''
  )
  const [offerExpiryAt, setOfferExpiryAt] = useState(candidate?.offer_expiry_at ?? '')
  const [joiningAt, setJoiningAt]         = useState(candidate?.joining_at      ?? '')
  const [showDetails, setShowDetails]     = useState(
    !!(candidate?.current_company || candidate?.skills || candidate?.interview_at || candidate?.joining_at)
  )
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError]     = useState('')
  const [resumeParsed, setResumeParsed]   = useState('')

  const inputCls = 'w-full border border-surface-borderStrong rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-card'

  async function handleResumeFile(file: File) {
    setResumeLoading(true); setResumeError(''); setResumeParsed('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/parse-resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setResumeError(data.error ?? 'Failed to parse resume'); return }
      const p = data.profile
      if (p.name)         setName(p.name)
      if (p.phone)        setPhone(p.phone)
      if (p.currentCompany) setCurrentCompany(p.currentCompany)
      if (p.experience)   setExperience(p.experience)
      if (p.noticePeriod) setNoticePeriod(p.noticePeriod)
      if (p.skills?.length) setSkills(Array.isArray(p.skills) ? p.skills.join(', ') : p.skills)
      if (!role && p.currentTitle) setRole(p.currentTitle)
      setShowDetails(true)
      setResumeParsed(file.name)
    } catch { setResumeError('Network error — please try again.') }
    finally { setResumeLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !role.trim()) { setError('Name and role are required'); return }
    setLoading(true); setError('')
    try {
      await onSave({
        name, phone, role_applied: role, stage, notes,
        current_company: currentCompany || null,
        skills:          skills         || null,
        experience:      experience     || null,
        notice_period:   noticePeriod   || null,
        interview_at:    interviewAt    || null,
        offer_expiry_at: offerExpiryAt  || null,
        joining_at:      joiningAt      || null,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-surface-card rounded-xl shadow-raised w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border sticky top-0 bg-surface-card z-10">
          <h2 className="font-semibold text-ink">{candidate ? 'Edit candidate' : 'Add candidate'}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

          {/* Resume upload — only for new candidates */}
          {!candidate && (
            <label className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors',
              resumeLoading ? 'border-primary bg-primary-soft/30' :
              resumeParsed  ? 'border-status-placed bg-status-placedBg' :
              'border-surface-borderStrong hover:border-primary hover:bg-primary-soft/20'
            )}>
              <input
                type="file" accept=".pdf,.docx,.doc" className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeFile(f) }}
                disabled={resumeLoading}
              />
              {resumeLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <p className="text-xs text-primary font-medium">Reading resume…</p>
                </>
              ) : resumeParsed ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-status-placed" />
                  <p className="text-xs text-status-placedText font-medium">Resume parsed — edit fields below if needed</p>
                  <p className="text-[11px] text-ink-muted">{resumeParsed}</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 text-ink-muted" />
                  <p className="text-xs font-medium text-ink">Upload resume to auto-fill <span className="text-ink-muted font-normal">(optional)</span></p>
                  <p className="text-[11px] text-ink-muted flex items-center gap-1"><FileText className="w-3 h-3" /> PDF or DOCX · Max 10 MB</p>
                </>
              )}
            </label>
          )}
          {resumeError && <p className="text-xs text-status-droppedText bg-status-droppedBg rounded px-3 py-2 -mt-2">{resumeError}</p>}

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-ink-secondary mb-1">Full name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Priya Sharma" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Role applied *</label>
              <input value={role} onChange={e => setRole(e.target.value)} required placeholder="Sales Manager" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Stage</label>
            <select value={stage} onChange={e => setStage(e.target.value as Stage)} className={inputCls}>
              {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes…" className={`${inputCls} resize-none`} />
          </div>

          {/* Expandable details section */}
          <button
            type="button"
            onClick={() => setShowDetails(s => !s)}
            className="flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors -mt-1"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showDetails && 'rotate-180')} />
            {showDetails ? 'Hide' : 'Show'} enriched details (for Outreach & Automation)
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-surface-border">
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Current company</label>
                <input value={currentCompany} onChange={e => setCurrentCompany(e.target.value)} placeholder="e.g. Infosys" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Experience</label>
                <input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5 years" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink-secondary mb-1">Skills <span className="text-ink-muted font-normal">(comma-separated)</span></label>
                <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Node.js, AWS" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Notice period</label>
                <input value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)} placeholder="e.g. 30 days" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Interview date & time</label>
                <input type="datetime-local" value={interviewAt} onChange={e => setInterviewAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Offer expiry date</label>
                <input type="date" value={offerExpiryAt} onChange={e => setOfferExpiryAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Joining date</label>
                <input type="date" value={joiningAt} onChange={e => setJoiningAt(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-status-droppedText bg-status-droppedBg rounded px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? 'Saving…' : candidate ? 'Save changes' : 'Add candidate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── AI Insights ────────────────────────────────────────────────────────────

interface InsightData {
  interest_level:   'high' | 'medium' | 'low'
  interest_reason:  string
  ghosting_risk:    'high' | 'medium' | 'low'
  ghosting_reason:  string
  joining_probability: number | null
  joining_reason:   string | null
}

const INTEREST_STYLE: Record<string, string> = {
  high:   'text-status-placedText bg-status-placedBg',
  medium: 'text-status-processText bg-status-processBg',
  low:    'text-status-droppedText bg-status-droppedBg',
}

const RISK_STYLE: Record<string, string> = {
  high:   'text-status-droppedText bg-status-droppedBg',
  medium: 'text-status-processText bg-status-processBg',
  low:    'text-status-placedText bg-status-placedBg',
}

const ACTIVE_STAGES = new Set<Stage>(['screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent'])

function ghostingDays(c: Candidate): number {
  const ref = c.last_contacted_at ?? c.created_at
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24))
}

// ── Filter bar ─────────────────────────────────────────────────────────────

const FILTER_STAGES: { value: Stage | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...STAGES.map(s => ({ value: s.value, label: s.label })),
]

// ── Main client ────────────────────────────────────────────────────────────

interface TimelineReply {
  id: string
  reply_type: string
  tone: string
  generated_text: string
  created_at: string
  outcome: string | null
}

const REPLY_TYPE_LABELS: Record<string, string> = {
  interview_invite: 'Interview Invite', shortlist: 'Shortlist', offer: 'Offer Letter',
  rejection: 'Rejection', reschedule: 'Reschedule', no_show: 'No Show',
  follow_up: 'Follow-up', salary_negotiation: 'Salary Negotiation',
  joining_confirmation: 'Joining', thank_you: 'Thank You',
  interview_reminder: 'Interview Reminder', document_collection: 'Document Collect',
  onboarding: 'Onboarding', welcome: 'Welcome', exit_interview: 'Exit Interview',
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  got_reply: { label: 'Got reply',  color: 'text-status-placedText bg-status-placedBg' },
  no_reply:  { label: 'No reply',   color: 'text-status-droppedText bg-status-droppedBg' },
  accepted:  { label: 'Accepted',   color: 'text-accent-text bg-accent-soft' },
  declined:  { label: 'Declined',   color: 'text-status-processText bg-status-processBg' },
}

export default function CandidatesClient({ initial }: { initial: Candidate[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>(initial)
  const [search, setSearch]         = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing]       = useState<Candidate | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [insights, setInsights]     = useState<Record<string, InsightData | 'loading' | 'error'>>({})
  // Timeline state (#72)
  const [timelineCandidate, setTimelineCandidate] = useState<Candidate | null>(null)
  const [timelineReplies,   setTimelineReplies]   = useState<TimelineReply[]>([])
  const [timelineLoading,   setTimelineLoading]   = useState(false)
  const [copiedTimelineId,  setCopiedTimelineId]  = useState<string | null>(null)

  async function openTimeline(c: Candidate) {
    setTimelineCandidate(c)
    setTimelineReplies([])
    setTimelineLoading(true)
    try {
      const res  = await fetch(`/api/candidates/${c.id}/replies`)
      const data = await res.json()
      if (res.ok && Array.isArray(data)) setTimelineReplies(data)
    } catch {/* ignore */}
    finally { setTimelineLoading(false) }
  }

  function copyTimeline(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedTimelineId(id)
    setTimeout(() => setCopiedTimelineId(null), 2000)
  }

  async function fetchInsight(c: Candidate) {
    if (insights[c.id] && insights[c.id] !== 'error') return
    setInsights(prev => ({ ...prev, [c.id]: 'loading' }))
    try {
      const res  = await fetch('/api/ai-insights/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      const data = await res.json()
      setInsights(prev => ({ ...prev, [c.id]: res.ok ? data : 'error' }))
    } catch {
      setInsights(prev => ({ ...prev, [c.id]: 'error' }))
    }
  }

  const filtered = useMemo(() => candidates.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role_applied.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    const matchStage = stageFilter === 'all' || c.stage === stageFilter
    return matchSearch && matchStage
  }), [candidates, search, stageFilter])

  async function handleAdd(data: Partial<Candidate>) {
    const res = await fetch('/api/candidates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const created = await res.json()
    setCandidates(prev => [created, ...prev])
  }

  async function handleEdit(data: Partial<Candidate>) {
    if (!editing) return
    const res = await fetch(`/api/candidates/${editing.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const updated = await res.json()
    setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  async function handleStageChange(id: string, stage: Stage) {
    const res = await fetch(`/api/candidates/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }),
    })
    if (!res.ok) return
    const updated = await res.json()
    setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
    if (res.ok) setCandidates(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  return (
    <>
      {modal === 'add' && <CandidateModal onClose={() => setModal(null)} onSave={handleAdd} />}
      {modal === 'edit' && editing && (
        <CandidateModal candidate={editing} onClose={() => { setModal(null); setEditing(null) }} onSave={handleEdit} />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, phone…"
            className="w-full pl-9 pr-3 py-2 border border-surface-borderStrong rounded text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-card"
          />
        </div>
        <select
          value={stageFilter} onChange={e => setStageFilter(e.target.value as Stage | 'all')}
          className="w-auto min-w-[140px] border border-surface-borderStrong rounded px-3 py-2 pr-8 text-sm text-ink focus:outline-none focus:border-primary bg-surface-card"
        >
          {FILTER_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Button variant="primary" size="sm" onClick={() => setModal('add')} className="sm:ml-auto">
          <Plus className="w-4 h-4" /> Add candidate
        </Button>
      </div>

      {/* Empty state */}
      {candidates.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <p className="font-semibold text-ink mb-1">No candidates yet</p>
          <p className="text-sm text-ink-secondary mb-4">Add your first candidate to start tracking the pipeline.</p>
          <Button variant="primary" size="sm" onClick={() => setModal('add')}>
            <Plus className="w-4 h-4" /> Add candidate
          </Button>
        </div>
      )}

      {candidates.length > 0 && filtered.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-8 text-center">
          <p className="text-ink-secondary text-sm">No candidates match your search.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-sunken">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wide">Candidate</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wide hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wide hidden lg:table-cell">Details</th>
                  <th className="px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(c => {
                  const autoTab = STAGE_AUTO_TAB[c.stage]
                  const interviewLabel = c.interview_at
                    ? new Date(c.interview_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : null
                  const joiningLabel = c.joining_at
                    ? new Date(c.joining_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : null

                  const insight      = insights[c.id]
                  const days         = ghostingDays(c)
                  const heuristicGhost = ACTIVE_STAGES.has(c.stage) && days >= 5

                  return (
                    <tr key={c.id} className="hover:bg-surface-sunken/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Added {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">{c.role_applied}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.stage}
                          onChange={e => handleStageChange(c.id, e.target.value as Stage)}
                          className="border-0 bg-transparent text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded p-0"
                          style={{ appearance: 'none' }}
                          title="Change stage"
                        >
                          {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <div className="mt-1"><StagePill stage={c.stage} /></div>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary hidden md:table-cell">
                        {c.phone
                          ? <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors"><Phone className="w-3 h-3" />{c.phone}</a>
                          : <span className="text-ink-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {c.current_company && <span className="text-xs text-ink-secondary">{c.current_company}</span>}
                          {interviewLabel && (
                            <span className="text-[11px] text-status-processText bg-status-processBg rounded-full px-2 py-0.5 w-fit">
                              Interview: {interviewLabel}
                            </span>
                          )}
                          {joiningLabel && (
                            <span className="text-[11px] text-status-placedText bg-status-placedBg rounded-full px-2 py-0.5 w-fit">
                              Joining: {joiningLabel}
                            </span>
                          )}
                          {!c.current_company && !interviewLabel && !joiningLabel && insight !== 'loading' && typeof insight !== 'object' && (
                            <span className="text-xs text-ink-muted">{c.notes ? c.notes.slice(0, 40) + (c.notes.length > 40 ? '…' : '') : '—'}</span>
                          )}
                          {/* Heuristic ghosting warning */}
                          {heuristicGhost && typeof insight !== 'object' && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-status-droppedText bg-status-droppedBg rounded-full px-2 py-0.5 w-fit">
                              <AlertTriangle className="w-2.5 h-2.5" /> No contact {days}d
                            </span>
                          )}
                          {/* AI insight chips */}
                          {insight === 'loading' && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Analyzing…
                            </span>
                          )}
                          {typeof insight === 'object' && (
                            <>
                              <span className={cn('inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 w-fit font-medium', INTEREST_STYLE[insight.interest_level])}
                                title={insight.interest_reason}>
                                ✦ {insight.interest_level === 'high' ? 'High interest' : insight.interest_level === 'medium' ? 'Medium interest' : 'Low interest'}
                              </span>
                              {insight.ghosting_risk === 'high' && (
                                <span className={cn('inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 w-fit font-medium', RISK_STYLE.high)}
                                  title={insight.ghosting_reason}>
                                  <AlertTriangle className="w-2.5 h-2.5" /> Ghosting risk
                                </span>
                              )}
                              {insight.joining_probability !== null && (
                                <span className={cn('inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 w-fit font-medium',
                                  insight.joining_probability >= 70 ? INTEREST_STYLE.high :
                                  insight.joining_probability >= 40 ? INTEREST_STYLE.medium : INTEREST_STYLE.low)}
                                  title={insight.joining_reason ?? ''}>
                                  {insight.joining_probability}% joining
                                </span>
                              )}
                            </>
                          )}
                          {insight === 'error' && (
                            <span className="text-[11px] text-ink-muted">AI unavailable</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {/* View profile */}
                          <Link
                            href={`/candidates/${c.id}`}
                            title="View full profile"
                            className="p-1.5 rounded text-ink-muted hover:text-primary hover:bg-primary-soft transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {/* Generate reply */}
                          <a
                            href={`/generator?context=${encodeURIComponent(`${c.name}, applying for ${c.role_applied}.`)}`}
                            title="Generate reply"
                            className="p-1.5 rounded text-ink-muted hover:text-accent-text hover:bg-accent-soft transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </a>
                          {/* Timeline (#72) */}
                          <button
                            onClick={() => openTimeline(c)}
                            title="Communication timeline"
                            className="p-1.5 rounded text-ink-muted hover:text-primary hover:bg-primary-soft transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          {/* Personalized outreach */}
                          <a
                            href={`/outreach?candidateId=${c.id}`}
                            title="Personalized outreach"
                            className="p-1.5 rounded text-ink-muted hover:text-primary hover:bg-primary-soft transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </a>
                          {/* Automation */}
                          <a
                            href={`/automation?candidateId=${c.id}${autoTab ? `&tab=${autoTab}` : ''}`}
                            title="Auto-generate message"
                            className="p-1.5 rounded text-ink-muted hover:text-accent-text hover:bg-accent-soft transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </a>
                          {/* AI Insights */}
                          <button
                            onClick={() => fetchInsight(c)}
                            title="AI insights"
                            disabled={insight === 'loading'}
                            className={cn(
                              'p-1.5 rounded transition-colors',
                              typeof insight === 'object'
                                ? 'text-accent-text bg-accent-soft'
                                : 'text-ink-muted hover:text-accent-text hover:bg-accent-soft'
                            )}
                          >
                            {insight === 'loading'
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Brain className="w-3.5 h-3.5" />
                            }
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => { setEditing(c); setModal('edit') }}
                            title="Edit"
                            className="p-1.5 rounded text-ink-muted hover:text-primary hover:bg-primary-soft transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deleting === c.id}
                            title="Delete"
                            className="p-1.5 rounded text-ink-muted hover:text-status-dropped hover:bg-status-droppedBg transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-surface-border text-xs text-ink-muted flex items-center justify-between">
            <span>{filtered.length} of {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* ── Timeline slide-over (#72) ─────────────────────────────────── */}
      {timelineCandidate && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm" onClick={() => setTimelineCandidate(null)} />
          <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface-card shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-ink">Communication Timeline</p>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{timelineCandidate.name} · {timelineCandidate.role_applied}</p>
              </div>
              <button onClick={() => setTimelineCandidate(null)} className="p-1 rounded text-ink-muted hover:text-ink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {timelineLoading && (
                <div className="flex items-center justify-center py-16 gap-2 text-ink-muted">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading timeline…
                </div>
              )}
              {!timelineLoading && timelineReplies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <History className="w-8 h-8 text-ink-muted/30" />
                  <p className="text-sm font-semibold text-ink">No messages sent yet</p>
                  <p className="text-xs text-ink-muted">Generate a reply for this candidate and select them in the Candidate context — it will appear here.</p>
                </div>
              )}
              {!timelineLoading && timelineReplies.length > 0 && (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-3 top-3 bottom-3 w-px bg-surface-border" />
                  <div className="flex flex-col gap-4">
                    {timelineReplies.map((reply) => {
                      const outcome = reply.outcome ? OUTCOME_LABELS[reply.outcome] : null
                      return (
                        <div key={reply.id} className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 z-10 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-accent" />
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-ink">
                                {REPLY_TYPE_LABELS[reply.reply_type] ?? reply.reply_type}
                              </span>
                              <span className="text-[11px] text-ink-muted shrink-0">
                                {new Date(reply.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <div className="bg-surface-sunken border border-surface-border rounded-lg p-3 group relative">
                              <p className="text-xs text-ink leading-relaxed line-clamp-4">{reply.generated_text}</p>
                              <button
                                onClick={() => copyTimeline(reply.id, reply.generated_text)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-surface-card border border-surface-border text-ink-muted hover:text-primary"
                              >
                                {copiedTimelineId === reply.id ? <Check className="w-3 h-3 text-status-placed" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-ink-muted capitalize">{reply.tone}</span>
                              {outcome && (
                                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', outcome.color)}>
                                  {outcome.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-surface-border shrink-0">
              <a
                href={`/generator?candidateId=${timelineCandidate.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-colors"
              >
                <Wand2 className="w-4 h-4" /> Generate next message
              </a>
            </div>
          </div>
        </>
      )}
    </>
  )
}
