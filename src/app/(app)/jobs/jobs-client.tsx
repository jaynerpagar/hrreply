'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase, Plus, X, MapPin, Building2, Users, ChevronRight,
  MoreHorizontal, Pencil, Trash2, CheckCircle2, Clock, PauseCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Job {
  id: string
  title: string
  department: string | null
  location: string | null
  description: string | null
  status: 'open' | 'on_hold' | 'closed' | 'filled'
  created_at: string
  candidate_counts: Record<string, number>
  total_candidates: number
}

interface Stats {
  openJobs: number
  totalCandidates: number
  interviews: number
  offers: number
  hired: number
}

const STATUS_META = {
  open:     { label: 'Open',     color: 'bg-status-placedBg text-status-placedText',   icon: CheckCircle2 },
  on_hold:  { label: 'On Hold',  color: 'bg-status-processBg text-status-processText', icon: PauseCircle  },
  closed:   { label: 'Closed',   color: 'bg-surface-sunken text-ink-secondary',        icon: X            },
  filled:   { label: 'Filled',   color: 'bg-primary-soft text-primary-deep',           icon: CheckCircle2 },
}

const PIPELINE_STAGES = [
  { key: 'applied',              label: 'Applied',    color: 'bg-ink-muted' },
  { key: 'screening',           label: 'Screening',  color: 'bg-primary' },
  { key: 'shortlisted',         label: 'Short.',     color: 'bg-accent' },
  { key: 'interview_scheduled', label: 'Interview',  color: 'bg-status-process' },
  { key: 'interviewed',         label: 'Done',       color: 'bg-status-process' },
  { key: 'offer_sent',          label: 'Offer',      color: 'bg-primary' },
  { key: 'hired',               label: 'Hired',      color: 'bg-status-placed' },
]

const inputCls = 'w-full border border-surface-borderStrong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-card'

export default function JobsClient({ initialJobs, stats }: { initialJobs: Job[]; stats: Stats }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [showModal, setShowModal] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle]           = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation]     = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus]         = useState<Job['status']>('open')

  const router = useRouter()

  function openCreate() {
    setEditJob(null); setTitle(''); setDepartment(''); setLocation(''); setDescription(''); setStatus('open')
    setError(''); setShowModal(true)
  }

  function openEdit(job: Job) {
    setEditJob(job); setTitle(job.title); setDepartment(job.department ?? ''); setLocation(job.location ?? '')
    setDescription(job.description ?? ''); setStatus(job.status); setError(''); setShowModal(true); setMenuOpen(null)
  }

  async function handleSave() {
    if (!title.trim()) { setError('Job title is required'); return }
    setLoading(true); setError('')
    try {
      const body = { title, department, location, description, status }
      const res = editJob
        ? await fetch(`/api/jobs/${editJob.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      if (editJob) {
        setJobs(prev => prev.map(j => j.id === editJob.id ? { ...j, ...data } : j))
      } else {
        setJobs(prev => [{ ...data, candidate_counts: {}, total_candidates: 0 }, ...prev])
      }
      setShowModal(false)
      router.refresh()
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job? Candidates will be unlinked.')) return
    setMenuOpen(null)
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    if (res.ok) { setJobs(prev => prev.filter(j => j.id !== id)); router.refresh() }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">Jobs</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Track open roles and manage candidate pipelines</p>
        </div>
        <Button variant="ai" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> New Job
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Open Jobs',         value: stats.openJobs },
          { label: 'Total Candidates',  value: stats.totalCandidates },
          { label: 'Interviews',        value: stats.interviews },
          { label: 'Offers Out',        value: stats.offers },
          { label: 'Hired',             value: stats.hired },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-lg px-4 py-3">
            <p className="text-2xl font-semibold text-ink">{value}</p>
            <p className="text-xs text-ink-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Jobs grid */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-ink mb-1">No jobs yet</h3>
          <p className="text-sm text-ink-secondary mb-5 max-w-xs">Create your first job to start tracking candidates against specific roles</p>
          <Button variant="ai" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Create first job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => {
            const meta = STATUS_META[job.status]
            const StatusIcon = meta.icon
            return (
              <div key={job.id} className="bg-surface-card border border-surface-border rounded-xl p-5 hover:border-surface-borderStrong hover:shadow-raised transition-all group relative">
                {/* Menu */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)}
                    className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen === job.id && (
                    <div className="absolute right-0 top-full mt-1 bg-surface-card border border-surface-border rounded-lg shadow-raised z-20 py-1 min-w-[130px]">
                      <button onClick={() => openEdit(job)} className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:text-ink hover:bg-surface-sunken w-full">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(job.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-status-droppedText hover:bg-status-droppedBg w-full">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="pr-8">
                  <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-3', meta.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <h3 className="font-semibold text-ink text-base leading-tight mb-1">{job.title}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
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
                  </div>
                </div>

                {/* Mini pipeline bar */}
                {job.total_candidates > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3.5 h-3.5 text-ink-muted" />
                      <span className="text-xs text-ink-secondary">{job.total_candidates} candidate{job.total_candidates !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                      {PIPELINE_STAGES.map(s => {
                        const n = job.candidate_counts[s.key] ?? 0
                        if (!n) return null
                        const pct = Math.round((n / job.total_candidates) * 100)
                        return <div key={s.key} className={cn('h-full rounded-sm', s.color)} style={{ width: `${pct}%` }} title={`${s.label}: ${n}`} />
                      })}
                    </div>
                    <div className="flex flex-wrap gap-x-3 mt-2">
                      {PIPELINE_STAGES.filter(s => (job.candidate_counts[s.key] ?? 0) > 0).slice(0, 4).map(s => (
                        <span key={s.key} className="text-[11px] text-ink-muted">{s.label}: {job.candidate_counts[s.key]}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted mb-4">No candidates yet</p>
                )}

                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between text-xs font-medium text-primary hover:text-primary-deep transition-colors group-hover:underline"
                >
                  View pipeline <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Click-outside for menus */}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-surface-card rounded-xl shadow-raised w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">{editJob ? 'Edit job' : 'New job'}</h2>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">Job Title *</label>
                <input className={inputCls} placeholder="e.g. Senior React Developer" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">Department</label>
                  <input className={inputCls} placeholder="e.g. Engineering" value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">Location</label>
                  <input className={inputCls} placeholder="e.g. Bangalore / Remote" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">Description <span className="text-ink-muted font-normal">(optional)</span></label>
                <textarea className={cn(inputCls, 'resize-none h-20')} placeholder="Brief job summary…" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">Status</label>
                <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as Job['status'])}>
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="filled">Filled</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {error && <p className="text-xs text-status-droppedText bg-status-droppedBg rounded px-3 py-2">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="ai" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving…' : editJob ? 'Save changes' : 'Create job'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
