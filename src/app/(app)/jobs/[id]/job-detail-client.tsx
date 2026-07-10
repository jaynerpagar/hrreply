'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Building2, Plus, X, Users, ChevronRight, Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Job {
  id: string; title: string; department: string | null; location: string | null
  description: string | null; status: string; created_at: string
}

interface Candidate {
  id: string; name: string; phone: string | null; role_applied: string
  stage: string; current_company: string | null; skills: string | null
  experience: string | null; notice_period: string | null
  interview_at: string | null; offer_expiry_at: string | null
  created_at: string; last_contacted_at: string | null
}

interface UnassignedCandidate { id: string; name: string; role_applied: string; stage: string }

const STAGES = [
  { value: 'applied',              label: 'Applied',             color: 'border-ink-muted/30',         dot: 'bg-ink-muted',        bg: 'bg-surface-sunken' },
  { value: 'screening',           label: 'Screening',           color: 'border-primary/30',            dot: 'bg-primary',          bg: 'bg-primary-soft/30' },
  { value: 'shortlisted',         label: 'Shortlisted',         color: 'border-accent/30',             dot: 'bg-accent',           bg: 'bg-accent-soft/20' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'border-status-process/30',     dot: 'bg-status-process',   bg: 'bg-status-processBg/50' },
  { value: 'interviewed',         label: 'Interviewed',         color: 'border-status-process/30',     dot: 'bg-status-process',   bg: 'bg-status-processBg/50' },
  { value: 'offer_sent',          label: 'Offer Sent',          color: 'border-primary/30',            dot: 'bg-primary',          bg: 'bg-primary-soft/30' },
  { value: 'hired',               label: 'Hired ✓',             color: 'border-status-placed/30',      dot: 'bg-status-placed',    bg: 'bg-status-placedBg/50' },
  { value: 'rejected',            label: 'Rejected',            color: 'border-status-dropped/30',     dot: 'bg-status-dropped',   bg: 'bg-status-droppedBg/30' },
]

const STATUS_META: Record<string, string> = {
  open: 'bg-status-placedBg text-status-placedText',
  on_hold: 'bg-status-processBg text-status-processText',
  filled: 'bg-primary-soft text-primary-deep',
  closed: 'bg-surface-sunken text-ink-secondary',
}

export default function JobDetailClient({ job, initialCandidates, unassignedCandidates }: {
  job: Job
  initialCandidates: Candidate[]
  unassignedCandidates: UnassignedCandidate[]
}) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [showAssign, setShowAssign] = useState(false)
  const [unassigned, setUnassigned] = useState(unassignedCandidates)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const router = useRouter()

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.value] = candidates.filter(c => c.stage === s.value)
    return acc
  }, {} as Record<string, Candidate[]>)

  async function moveToStage(candidateId: string, newStage: string) {
    setMovingId(candidateId)
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, ...updated } : c))
    }
    setMovingId(null)
    setSelectedCard(null)
  }

  async function assignCandidate(candidateId: string) {
    const res = await fetch(`/api/jobs/${job.id}/candidates`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: candidateId }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCandidates(prev => [...prev, updated])
      setUnassigned(prev => prev.filter(c => c.id !== candidateId))
    }
    setShowAssign(false)
    router.refresh()
  }

  const totalActive = candidates.filter(c => !['rejected', 'hired'].includes(c.stage)).length

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> All jobs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-ink">{job.title}</h1>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_META[job.status] ?? 'bg-surface-sunken text-ink-secondary')}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {job.department && (
                <span className="flex items-center gap-1 text-xs text-ink-secondary">
                  <Building2 className="w-3 h-3" /> {job.department}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1 text-xs text-ink-secondary">
                  <MapPin className="w-3 h-3" /> {job.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-ink-secondary">
                <Users className="w-3 h-3" /> {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} · {totalActive} active
              </span>
            </div>
          </div>
          <Button variant="ai" onClick={() => setShowAssign(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Candidate
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-ink mb-1">No candidates yet</h3>
          <p className="text-sm text-ink-secondary mb-5 max-w-xs">Assign existing candidates to this job or add new ones from the Candidates page</p>
          <Button variant="ai" onClick={() => setShowAssign(true)}><Plus className="w-4 h-4 mr-1.5" /> Add first candidate</Button>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 lg:-mx-6 lg:px-6 pb-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map(s => {
              const cards = byStage[s.value] ?? []
              return (
                <div key={s.value} className="w-56 flex-shrink-0">
                  {/* Column header */}
                  <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0', s.color, s.bg)}>
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dot)} />
                    <span className="text-xs font-semibold text-ink flex-1">{s.label}</span>
                    <span className="text-xs font-medium text-ink-muted bg-surface-card/80 rounded-full w-5 h-5 flex items-center justify-center">
                      {cards.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div className={cn('min-h-40 border border-surface-border rounded-b-lg p-2 flex flex-col gap-2', 'bg-surface-sunken/40')}>
                    {cards.map(c => (
                      <div
                        key={c.id}
                        className={cn(
                          'bg-surface-card border border-surface-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-card transition-all group',
                          selectedCard === c.id && 'border-primary ring-1 ring-primary/20',
                          movingId === c.id && 'opacity-50',
                        )}
                        onClick={() => setSelectedCard(selectedCard === c.id ? null : c.id)}
                      >
                        <p className="text-sm font-medium text-ink leading-tight">{c.name}</p>
                        {c.current_company && <p className="text-xs text-ink-secondary mt-0.5">{c.current_company}</p>}
                        {c.experience && <p className="text-[11px] text-ink-muted mt-0.5">{c.experience} exp</p>}

                        {/* Quick stage mover — shown when selected */}
                        {selectedCard === c.id && (
                          <div className="mt-2 pt-2 border-t border-surface-border">
                            <p className="text-[10px] font-medium text-ink-muted mb-1.5 uppercase tracking-wide">Move to</p>
                            <div className="flex flex-wrap gap-1">
                              {STAGES.filter(st => st.value !== s.value).map(st => (
                                <button
                                  key={st.value}
                                  onClick={e => { e.stopPropagation(); moveToStage(c.id, st.value) }}
                                  className="text-[10px] px-1.5 py-0.5 rounded border border-surface-borderStrong text-ink-secondary hover:border-primary hover:text-primary transition-colors"
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                            <Link
                              href={`/candidates/${c.id}`}
                              onClick={e => e.stopPropagation()}
                              className="mt-2 flex items-center gap-1 text-[11px] text-primary font-medium hover:underline"
                            >
                              View profile <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-xs text-ink-muted py-6">Empty</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Assign candidate modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setShowAssign(false)} />
          <div className="relative bg-surface-card rounded-xl shadow-raised w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">Add candidate to pipeline</h2>
              <button onClick={() => setShowAssign(false)} className="text-ink-muted hover:text-ink"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {unassigned.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-8 h-8 text-ink-muted mx-auto mb-3" />
                  <p className="text-sm text-ink-secondary mb-1">All candidates are already assigned</p>
                  <p className="text-xs text-ink-muted">Add new candidates from the Candidates page first</p>
                  <Link href="/candidates" className="mt-4 inline-flex">
                    <Button variant="secondary" size="sm">Go to Candidates</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {unassigned.map(c => (
                    <button
                      key={c.id}
                      onClick={() => assignCandidate(c.id)}
                      className="flex items-center justify-between p-3 bg-surface-sunken border border-surface-border rounded-lg hover:border-primary hover:bg-primary-soft/20 text-left transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{c.name}</p>
                        <p className="text-xs text-ink-secondary">{c.role_applied}</p>
                      </div>
                      <span className="text-xs font-medium text-primary">Assign →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
