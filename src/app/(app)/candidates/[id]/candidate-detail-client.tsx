'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Briefcase, Clock, Calendar, Building2,
  Zap, FileText, MessageSquare, StickyNote, Brain, Plus, Trash2,
  Copy, Check, ChevronRight, Star, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { STAGE_LABELS } from '@/lib/utils'

type Stage = keyof typeof STAGE_LABELS

interface Candidate {
  id: string; name: string; phone: string | null; role_applied: string; stage: Stage
  notes: string | null; current_company: string | null; skills: string | null
  experience: string | null; notice_period: string | null; interview_at: string | null
  offer_expiry_at: string | null; joining_at: string | null; created_at: string
  last_contacted_at: string | null; job_id: string | null
}

interface Reply {
  id: string; reply_type: string; tone: string; language: string
  generated_reply: string; context_input: string; created_at: string
  copy_count: number; outcome: string | null
}

interface Note { id: string; content: string; created_at: string }
interface Job { id: string; title: string }

const STAGE_COLORS: Record<string, string> = {
  applied:              'bg-surface-sunken text-ink-secondary',
  screening:            'bg-primary-soft text-primary-deep',
  shortlisted:          'bg-accent-soft text-accent-text',
  interview_scheduled:  'bg-status-processBg text-status-processText',
  interviewed:          'bg-status-processBg text-status-processText',
  offer_sent:           'bg-primary-soft text-primary-deep',
  hired:                'bg-status-placedBg text-status-placedText',
  rejected:             'bg-status-droppedBg text-status-droppedText',
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: Briefcase },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'notes',    label: 'Notes',    icon: StickyNote },
  { id: 'insights', label: 'AI Insights', icon: Brain },
]

export default function CandidateDetailClient({ candidate, initialReplies, initialNotes, job }: {
  candidate: Candidate
  initialReplies: Reply[]
  initialNotes: Note[]
  job: Job | null
}) {
  const [tab, setTab] = useState<'overview' | 'messages' | 'notes' | 'insights'>('overview')
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const daysSinceContact = candidate.last_contacted_at
    ? Math.floor((Date.now() - new Date(candidate.last_contacted_at).getTime()) / 86400000)
    : candidate.created_at
    ? Math.floor((Date.now() - new Date(candidate.created_at).getTime()) / 86400000)
    : null

  const expiresInDays = candidate.offer_expiry_at
    ? Math.ceil((new Date(candidate.offer_expiry_at).getTime() - Date.now()) / 86400000)
    : null

  const interviewInHours = candidate.interview_at
    ? Math.ceil((new Date(candidate.interview_at).getTime() - Date.now()) / 3600000)
    : null

  async function addNote() {
    if (!newNote.trim()) return
    setAddingNote(true)
    const res = await fetch(`/api/candidates/${candidate.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setNotes(prev => [data, ...prev])
      setNewNote('')
    }
    setAddingNote(false)
  }

  async function deleteNote(noteId: string) {
    const res = await fetch(`/api/candidates/${candidate.id}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: noteId }),
    })
    if (res.ok) setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const skills = candidate.skills ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean) : []

  // AI insights
  const insights: { icon: typeof Star; text: string; type: 'warn' | 'info' | 'ok' }[] = []
  if (daysSinceContact !== null && daysSinceContact >= 5 && !['hired', 'rejected'].includes(candidate.stage)) {
    insights.push({ icon: AlertTriangle, text: `No contact in ${daysSinceContact} days — ghosting risk`, type: 'warn' })
  }
  if (expiresInDays !== null && expiresInDays <= 3 && expiresInDays >= 0) {
    insights.push({ icon: Clock, text: `Offer expires in ${expiresInDays} day${expiresInDays !== 1 ? 's' : ''} — send a reminder`, type: 'warn' })
  }
  if (interviewInHours !== null && interviewInHours > 0 && interviewInHours <= 24) {
    insights.push({ icon: Calendar, text: `Interview in ${interviewInHours}h — reminder not sent yet`, type: 'info' })
  }
  if (candidate.stage === 'offer_sent') {
    insights.push({ icon: Star, text: 'Candidate is at offer stage — keep engagement high', type: 'info' })
  }
  if (skills.length > 3) {
    insights.push({ icon: Zap, text: `Strong skill match: ${skills.slice(0, 3).join(', ')}`, type: 'ok' })
  }
  if (candidate.notice_period) {
    insights.push({ icon: Clock, text: `Notice period: ${candidate.notice_period} — plan accordingly`, type: 'info' })
  }

  return (
    <div>
      {/* Back */}
      <Link href="/candidates" className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All candidates
      </Link>

      {/* Profile header */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary-deep">
              {candidate.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-ink">{candidate.name}</h1>
              <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', STAGE_COLORS[candidate.stage])}>
                {STAGE_LABELS[candidate.stage]}
              </span>
            </div>
            <p className="text-sm text-ink-secondary">{candidate.role_applied}{candidate.current_company ? ` · ${candidate.current_company}` : ''}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {candidate.phone && (
                <span className="flex items-center gap-1 text-xs text-ink-secondary">
                  <Phone className="w-3 h-3" /> {candidate.phone}
                </span>
              )}
              {candidate.experience && (
                <span className="flex items-center gap-1 text-xs text-ink-secondary">
                  <Briefcase className="w-3 h-3" /> {candidate.experience} exp
                </span>
              )}
              {candidate.notice_period && (
                <span className="flex items-center gap-1 text-xs text-ink-secondary">
                  <Clock className="w-3 h-3" /> {candidate.notice_period} notice
                </span>
              )}
              {job && (
                <Link href={`/jobs/${job.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Building2 className="w-3 h-3" /> {job.title}
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/generator?candidate=${encodeURIComponent(candidate.name)}&role=${encodeURIComponent(candidate.role_applied)}`}>
              <Button variant="ai" size="sm">
                <Zap className="w-3.5 h-3.5 mr-1" /> Generate Message
              </Button>
            </Link>
          </div>
        </div>

        {/* Alert banners */}
        {expiresInDays !== null && expiresInDays >= 0 && expiresInDays <= 3 && (
          <div className="mt-4 flex items-center gap-2 bg-status-droppedBg border border-status-dropped/30 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-status-droppedText shrink-0" />
            <p className="text-xs text-status-droppedText font-medium">Offer expires in {expiresInDays} day{expiresInDays !== 1 ? 's' : ''}</p>
            <Link href={`/generator?candidate=${encodeURIComponent(candidate.name)}&type=offer_reminder`} className="ml-auto text-xs font-medium text-primary hover:underline">
              Send reminder →
            </Link>
          </div>
        )}
        {interviewInHours !== null && interviewInHours > 0 && interviewInHours <= 24 && (
          <div className="mt-2 flex items-center gap-2 bg-status-processBg border border-status-process/30 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-status-processText shrink-0" />
            <p className="text-xs text-status-processText font-medium">Interview in {interviewInHours}h</p>
            <Link href={`/generator?candidate=${encodeURIComponent(candidate.name)}&type=interview_reminder`} className="ml-auto text-xs font-medium text-primary hover:underline">
              Send reminder →
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-ink-secondary hover:text-ink',
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === 'messages' && initialReplies.length > 0 && (
              <span className="text-[10px] bg-primary-soft text-primary-deep rounded-full px-1.5 py-0.5 font-semibold">{initialReplies.length}</span>
            )}
            {t.id === 'notes' && notes.length > 0 && (
              <span className="text-[10px] bg-surface-sunken text-ink-secondary rounded-full px-1.5 py-0.5 font-semibold">{notes.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Key info */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-4">Candidate Information</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {[
                  { label: 'Current Company', value: candidate.current_company },
                  { label: 'Experience', value: candidate.experience },
                  { label: 'Notice Period', value: candidate.notice_period },
                  { label: 'Phone', value: candidate.phone },
                  { label: 'Interview Date', value: candidate.interview_at ? new Date(candidate.interview_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null },
                  { label: 'Offer Expiry', value: candidate.offer_expiry_at ? new Date(candidate.offer_expiry_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null },
                  { label: 'Joining Date', value: candidate.joining_at ? new Date(candidate.joining_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null },
                  { label: 'Added', value: new Date(candidate.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) },
                ].filter(f => f.value).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-ink-muted mb-0.5">{label}</p>
                    <p className="text-sm text-ink font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-primary-soft text-primary-deep text-xs font-medium rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes (quick view) */}
            {candidate.notes && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">Recruiter Notes</h3>
                <p className="text-sm text-ink-secondary whitespace-pre-wrap">{candidate.notes}</p>
              </div>
            )}
          </div>

          {/* Right column: timeline / dates */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-4">Pipeline Timeline</h3>
              <div className="flex flex-col gap-0">
                {(['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent', 'hired'] as Stage[]).map((s, i) => {
                  const stageOrder = ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent', 'hired']
                  const currentIdx = stageOrder.indexOf(candidate.stage)
                  const thisIdx = stageOrder.indexOf(s)
                  const isPast = thisIdx < currentIdx
                  const isCurrent = thisIdx === currentIdx
                  return (
                    <div key={s} className="flex items-start gap-3 relative">
                      {i < 6 && <div className={cn('absolute left-3 top-6 w-0.5 h-6', isPast || isCurrent ? 'bg-primary' : 'bg-surface-border')} />}
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10',
                        isPast ? 'border-primary bg-primary' : isCurrent ? 'border-primary bg-surface-card' : 'border-surface-border bg-surface-sunken',
                      )}>
                        {isPast && <Check className="w-3 h-3 text-white" />}
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div className="pb-5">
                        <p className={cn('text-xs font-medium', isCurrent ? 'text-primary' : isPast ? 'text-ink' : 'text-ink-muted')}>
                          {STAGE_LABELS[s]}
                        </p>
                        {isCurrent && candidate.last_contacted_at && (
                          <p className="text-[11px] text-ink-muted">
                            Last contact: {new Date(candidate.last_contacted_at).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <p className="text-xs font-medium text-ink-muted mb-2 uppercase tracking-wide">Quick Actions</p>
              <div className="flex flex-col gap-2">
                <Link href={`/generator?candidate=${encodeURIComponent(candidate.name)}&role=${encodeURIComponent(candidate.role_applied)}&type=follow_up`}>
                  <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Generate Follow-up
                  </Button>
                </Link>
                <Link href={`/outreach?candidate=${encodeURIComponent(candidate.name)}`}>
                  <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
                    <Zap className="w-3.5 h-3.5" /> Personalized Outreach
                  </Button>
                </Link>
                <Link href={`/hr-documents?candidate=${encodeURIComponent(candidate.name)}`}>
                  <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
                    <FileText className="w-3.5 h-3.5" /> Generate Document
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Messages */}
      {tab === 'messages' && (
        <div>
          {initialReplies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-10 h-10 text-ink-muted mb-3" />
              <h3 className="font-semibold text-ink mb-1">No messages found</h3>
              <p className="text-sm text-ink-secondary mb-4">Messages generated mentioning this candidate will appear here</p>
              <Link href={`/generator?candidate=${encodeURIComponent(candidate.name)}`}>
                <Button variant="ai">Generate first message</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {initialReplies.map(r => (
                <div key={r.id} className="bg-surface-card border border-surface-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="text-xs font-medium bg-primary-soft text-primary-deep px-2 py-0.5 rounded-full">{r.reply_type?.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-medium bg-surface-sunken text-ink-secondary px-2 py-0.5 rounded-full">{r.tone}</span>
                      {r.outcome && (
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                          r.outcome === 'got_reply' ? 'bg-status-placedBg text-status-placedText' : 'bg-surface-sunken text-ink-secondary')}>
                          {r.outcome.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-muted">{new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'short' })}</span>
                      <button
                        onClick={() => copyText(r.generated_reply, r.id)}
                        className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
                      >
                        {copied === r.id ? <Check className="w-3.5 h-3.5 text-status-placed" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-ink-secondary whitespace-pre-wrap leading-relaxed line-clamp-4">{r.generated_reply}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Notes */}
      {tab === 'notes' && (
        <div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 mb-4">
            <textarea
              className="w-full text-sm text-ink bg-transparent resize-none focus:outline-none placeholder:text-ink-muted"
              rows={3}
              placeholder="Add a note about this candidate…"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <Button variant="secondary" size="sm" onClick={addNote} disabled={addingNote || !newNote.trim()}>
                <Plus className="w-3.5 h-3.5 mr-1" /> {addingNote ? 'Adding…' : 'Add note'}
              </Button>
            </div>
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-10">
              <StickyNote className="w-8 h-8 text-ink-muted mx-auto mb-2" />
              <p className="text-sm text-ink-secondary">No notes yet — add one above</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.map(n => (
                <div key={n.id} className="bg-surface-card border border-surface-border rounded-xl p-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-ink whitespace-pre-wrap flex-1">{n.content}</p>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="p-1.5 rounded text-ink-muted hover:text-status-droppedText hover:bg-status-droppedBg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-2">{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: AI Insights */}
      {tab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-accent-icon" />
              <h3 className="text-sm font-semibold text-ink">AI Signals</h3>
            </div>
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                <p className="text-sm text-ink-secondary">All looks good — no action needed right now</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {insights.map((ins, i) => (
                  <div key={i} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    ins.type === 'warn' ? 'bg-status-droppedBg border-status-dropped/30' :
                    ins.type === 'ok'   ? 'bg-status-placedBg border-status-placed/30' :
                    'bg-primary-soft/30 border-primary/20',
                  )}>
                    <ins.icon className={cn('w-4 h-4 mt-0.5 shrink-0',
                      ins.type === 'warn' ? 'text-status-droppedText' :
                      ins.type === 'ok'   ? 'text-status-placedText' : 'text-primary')} />
                    <p className={cn('text-sm',
                      ins.type === 'warn' ? 'text-status-droppedText' :
                      ins.type === 'ok'   ? 'text-status-placedText' : 'text-ink')}>{ins.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent-icon" />
              <h3 className="text-sm font-semibold text-ink">Suggested Next Actions</h3>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { stage: 'applied',              action: 'Send screening message', href: `/generator?candidate=${encodeURIComponent(candidate.name)}&type=shortlist` },
                { stage: 'screening',            action: 'Send shortlist message', href: `/generator?candidate=${encodeURIComponent(candidate.name)}&type=shortlist` },
                { stage: 'shortlisted',          action: 'Schedule interview',    href: `/generator?candidate=${encodeURIComponent(candidate.name)}&type=interview_invite` },
                { stage: 'interview_scheduled',  action: 'Send interview reminder', href: `/generator?candidate=${encodeURIComponent(candidate.name)}&type=interview_reminder` },
                { stage: 'interviewed',          action: 'Send offer or feedback', href: `/generator?candidate=${encodeURIComponent(candidate.name)}&type=offer` },
                { stage: 'offer_sent',           action: 'Follow up on offer',    href: `/generator?candidate=${encodeURIComponent(candidate.name)}&type=follow_up` },
                { stage: 'hired',                action: 'Send joining details',  href: `/generator?candidate=${encodeURIComponent(candidate.name)}&type=joining_confirmation` },
              ].filter(a => a.stage === candidate.stage).map(a => (
                <Link key={a.action} href={a.href}>
                  <div className="flex items-center justify-between p-3 bg-primary-soft/30 border border-primary/20 rounded-lg hover:border-primary/40 hover:bg-primary-soft/50 transition-colors group">
                    <p className="text-sm font-medium text-primary">{a.action}</p>
                    <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
              <Link href={`/generator?candidate=${encodeURIComponent(candidate.name)}&role=${encodeURIComponent(candidate.role_applied)}`}>
                <div className="flex items-center justify-between p-3 bg-surface-sunken border border-surface-border rounded-lg hover:border-surface-borderStrong transition-colors group mt-2">
                  <p className="text-sm text-ink-secondary">Generate any message</p>
                  <ChevronRight className="w-4 h-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
