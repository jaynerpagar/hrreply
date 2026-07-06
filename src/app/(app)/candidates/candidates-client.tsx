'use client'

import { useState, useMemo } from 'react'
import {
  Search, Plus, Pencil, Trash2, X, Phone, Briefcase,
  ChevronDown, Sparkles, Zap, Wand2,
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

  const inputCls = 'w-full border border-surface-borderStrong rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-card'

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

// ── Filter bar ─────────────────────────────────────────────────────────────

const FILTER_STAGES: { value: Stage | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...STAGES.map(s => ({ value: s.value, label: s.label })),
]

// ── Main client ────────────────────────────────────────────────────────────

export default function CandidatesClient({ initial }: { initial: Candidate[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>(initial)
  const [search, setSearch]         = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing]       = useState<Candidate | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)

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
                          {!c.current_company && !interviewLabel && !joiningLabel && (
                            <span className="text-xs text-ink-muted">{c.notes ? c.notes.slice(0, 40) + (c.notes.length > 40 ? '…' : '') : '—'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Generate reply */}
                          <a
                            href={`/generator?context=${encodeURIComponent(`${c.name}, applying for ${c.role_applied}.`)}`}
                            title="Generate reply"
                            className="p-1.5 rounded text-ink-muted hover:text-accent-text hover:bg-accent-soft transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </a>
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
          <div className="px-4 py-2.5 border-t border-surface-border text-xs text-ink-muted">
            {filtered.length} of {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </>
  )
}
