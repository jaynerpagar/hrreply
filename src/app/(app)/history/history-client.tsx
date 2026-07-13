'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Copy, Check, Clock, ThumbsUp, ThumbsDown,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Zap, Filter,
} from 'lucide-react'
import { InfoChip } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TONE_LABELS, REPLY_TYPE_LABELS } from '@/lib/utils'
import { ReplyType, Tone } from '@/types'
import { cn } from '@/lib/utils'

type Outcome = 'got_reply' | 'no_reply' | 'accepted' | 'declined'

interface Reply {
  id: string
  reply_type: string
  tone: string
  context_input: string
  generated_text: string
  created_at: string
  outcome: Outcome | null
  candidate_id: string | null
}

const OUTCOME_OPTIONS: { value: Outcome; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { value: 'got_reply', label: 'Got reply',  icon: <ThumbsUp className="w-3 h-3" />,    activeClass: 'bg-status-placedBg text-status-placedText border-status-placed/30' },
  { value: 'no_reply',  label: 'No reply',   icon: <ThumbsDown className="w-3 h-3" />,   activeClass: 'bg-status-droppedBg text-status-droppedText border-status-dropped/30' },
  { value: 'accepted',  label: 'Accepted',   icon: <CheckCircle2 className="w-3 h-3" />, activeClass: 'bg-accent-soft text-accent-text border-accent/20' },
  { value: 'declined',  label: 'Declined',   icon: <XCircle className="w-3 h-3" />,      activeClass: 'bg-status-processBg text-status-processText border-status-process/30' },
]

const OUTCOME_BADGE: Record<Outcome, { label: string; cls: string }> = {
  got_reply: { label: 'Got reply',  cls: 'bg-status-placedBg text-status-placedText' },
  no_reply:  { label: 'No reply',   cls: 'bg-status-droppedBg text-status-droppedText' },
  accepted:  { label: 'Accepted',   cls: 'bg-accent-soft text-accent-text' },
  declined:  { label: 'Declined',   cls: 'bg-status-processBg text-status-processText' },
}

// IST is UTC+5:30 with no DST — fixed-offset day buckets keep server and
// client HTML identical, avoiding hydration mismatches
const IST_OFFSET_MS = 5.5 * 3600000
const istDay = (t: number) => Math.floor((t + IST_OFFSET_MS) / 86400000)

function dateGroup(iso: string): 'today' | 'week' | 'earlier' {
  const diff = istDay(Date.now()) - istDay(new Date(iso).getTime())
  if (diff <= 0) return 'today'
  if (diff <= 6) return 'week'
  return 'earlier'
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const isToday = istDay(Date.now()) === istDay(d.getTime())
  if (isToday) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

export default function HistoryClient({ replies }: { replies: Reply[] }) {
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [copiedId, setCopiedId]     = useState<string | null>(null)
  const [savingId, setSavingId]     = useState<string | null>(null)
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [outcomes, setOutcomes]     = useState<Record<string, Outcome | null>>(
    Object.fromEntries(replies.map(r => [r.id, r.outcome]))
  )

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const s = new Set(prev)
      if (s.has(id)) { s.delete(id) } else { s.add(id) }
      return s
    })
  }

  async function markOutcome(id: string, value: Outcome) {
    const current = outcomes[id]
    const next    = current === value ? null : value
    setOutcomes(prev => ({ ...prev, [id]: next }))
    setSavingId(id)
    try {
      await fetch(`/api/replies/${id}/outcome`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: next }),
      })
    } catch { /* ignore */ }
    finally { setSavingId(null) }
  }

  // Unique types present in data, sorted by frequency
  const typeFreqs = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const r of replies) { freq[r.reply_type] = (freq[r.reply_type] ?? 0) + 1 }
    return Object.entries(freq).sort((a, b) => b[1] - a[1])
  }, [replies])

  // Stats
  const stats = useMemo(() => {
    const weekAgo    = new Date(Date.now() - 7 * 86400000)
    const thisWeek   = replies.filter(r => new Date(r.created_at) >= weekAgo).length
    const withOutcome = Object.values(outcomes).filter(Boolean).length
    const topType    = typeFreqs[0]?.[0]
    return { total: replies.length, thisWeek, withOutcome, topType }
  }, [replies, outcomes, typeFreqs])

  // Filtered list
  const filtered = useMemo(() => {
    const q        = search.toLowerCase()
    const weekAgo  = new Date(Date.now() - 7 * 86400000)

    return replies.filter(r => {
      if (typeFilter !== 'all' && r.reply_type !== typeFilter) return false
      if (outcomeFilter === 'marked'   && !outcomes[r.id]) return false
      if (outcomeFilter === 'unmarked' && outcomes[r.id])  return false
      if (outcomeFilter !== 'all' && outcomeFilter !== 'marked' && outcomeFilter !== 'unmarked' && outcomes[r.id] !== outcomeFilter) return false
      if (dateFilter === 'today' && istDay(new Date(r.created_at).getTime()) !== istDay(Date.now())) return false
      if (dateFilter === 'week'  && new Date(r.created_at) < weekAgo)    return false
      if (q && !r.context_input.toLowerCase().includes(q) &&
               !r.generated_text.toLowerCase().includes(q) &&
               !(REPLY_TYPE_LABELS[r.reply_type as ReplyType] ?? r.reply_type).toLowerCase().includes(q)) return false
      return true
    })
  }, [replies, search, typeFilter, outcomeFilter, dateFilter, outcomes])

  // Group by date
  const groups = useMemo(() => {
    const today: Reply[] = [], week: Reply[] = [], earlier: Reply[] = []
    for (const r of filtered) {
      const g = dateGroup(r.created_at)
      if (g === 'today') today.push(r)
      else if (g === 'week') week.push(r)
      else earlier.push(r)
    }
    return [
      { key: 'today',   label: 'Today',     items: today },
      { key: 'week',    label: 'This Week',  items: week },
      { key: 'earlier', label: 'Earlier',    items: earlier },
    ].filter(g => g.items.length > 0)
  }, [filtered])

  const hasFilters = typeFilter !== 'all' || outcomeFilter !== 'all' || dateFilter !== 'all' || search !== ''

  return (
    <div className="flex flex-col gap-4">

      {/* ── Stats strip ── */}
      {replies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total replies',   value: stats.total },
            { label: 'This week',       value: stats.thisWeek },
            { label: 'Outcomes marked', value: `${stats.withOutcome}/${stats.total}` },
            { label: 'Top type',        value: stats.topType ? (REPLY_TYPE_LABELS[stats.topType as ReplyType] ?? stats.topType) : '—' },
          ].map(s => (
            <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl px-4 py-3">
              <p className="text-xl font-semibold text-ink">{s.value}</p>
              <p className="text-xs text-ink-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3">
        {/* Search + dropdowns row */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by candidate, keyword…"
              className="w-full bg-surface-card border border-surface-borderStrong rounded-lg pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">All outcomes</option>
            <option value="marked">Marked only</option>
            <option value="unmarked">Unmarked</option>
            <option value="got_reply">Got reply</option>
            <option value="no_reply">No reply</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setOutcomeFilter('all'); setDateFilter('all') }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />Clear filters
            </button>
          )}
        </div>

        {/* Type pills — only show types that exist */}
        {typeFreqs.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                typeFilter === 'all'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-card border-surface-border text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
              )}
            >
              All types
            </button>
            {typeFreqs.map(([type, count]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(t => t === type ? 'all' : type)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5',
                  typeFilter === type
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-card border-surface-border text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                )}
              >
                {REPLY_TYPE_LABELS[type as ReplyType] ?? type}
                <span className={cn('text-[10px]', typeFilter === type ? 'text-white/70' : 'text-ink-muted')}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Empty states ── */}
      {replies.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-12 text-center">
          <Clock className="w-8 h-8 text-ink-muted mx-auto mb-3" />
          <p className="font-semibold text-ink mb-1">No replies yet</p>
          <p className="text-sm text-ink-secondary mb-4">Generate your first reply and it will appear here.</p>
          <Link href="/generator"><Button variant="ai"><Zap className="w-4 h-4 mr-1.5" />Generate reply</Button></Link>
        </div>
      )}

      {replies.length > 0 && filtered.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
          <p className="text-ink-secondary text-sm">No replies match the current filters.</p>
          <button onClick={() => { setSearch(''); setTypeFilter('all'); setOutcomeFilter('all'); setDateFilter('all') }}
            className="text-xs text-primary hover:underline mt-2">Clear filters</button>
        </div>
      )}

      {/* ── Reply list grouped by date ── */}
      {groups.map(group => (
        <div key={group.key}>
          {/* Section header */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">{group.label}</span>
            <span className="text-xs text-ink-muted">{group.items.length} {group.items.length === 1 ? 'reply' : 'replies'}</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <div className="flex flex-col gap-2">
            {group.items.map(reply => {
              const isExpanded  = expanded.has(reply.id)
              const outcome     = outcomes[reply.id]
              const outcomeMeta = outcome ? OUTCOME_BADGE[outcome] : null
              const contextPreview = reply.context_input.length > 50
                ? reply.context_input.slice(0, 50) + '…'
                : reply.context_input

              return (
                <div key={reply.id} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">

                  {/* ── Card header row (always visible, clickable to expand) ── */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunken/50 transition-colors"
                    onClick={() => toggleExpand(reply.id)}
                  >
                    {/* Left: chips */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <InfoChip>{REPLY_TYPE_LABELS[reply.reply_type as ReplyType] ?? reply.reply_type}</InfoChip>
                      <span className="hidden sm:inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-surface-sunken text-ink-muted">
                        {TONE_LABELS[reply.tone as Tone] ?? reply.tone}
                      </span>
                    </div>

                    {/* Middle: context preview */}
                    <p className="flex-1 min-w-0 text-xs text-ink-secondary truncate hidden sm:block">{contextPreview}</p>

                    {/* Right: date + outcome badge + copy + chevron */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <span className="text-[11px] text-ink-muted hidden md:block">{fmtDate(reply.created_at)}</span>
                      {outcomeMeta && (
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', outcomeMeta.cls)}>
                          {outcomeMeta.label}
                        </span>
                      )}
                      <span
                        role="button"
                        onClick={e => { e.stopPropagation(); copy(reply.id, reply.generated_text) }}
                        className="flex items-center gap-1 text-[11px] font-medium text-ink-muted bg-surface-sunken hover:bg-surface-border px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {copiedId === reply.id
                          ? <><Check className="w-3 h-3 text-status-placedText" />Copied</>
                          : <><Copy className="w-3 h-3" />Copy</>}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-ink-muted shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />}
                    </div>
                  </button>

                  {/* ── Expanded body ── */}
                  {isExpanded && (
                    <div className="border-t border-surface-border">
                      {/* Context */}
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1">Context</p>
                        <p className="text-xs text-ink-secondary bg-surface-sunken rounded-lg px-3 py-2 leading-relaxed">{reply.context_input}</p>
                      </div>

                      {/* Generated text */}
                      <div className="px-4 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Generated message</p>
                          <div className="flex items-center gap-2">
                            {reply.candidate_id && (
                              <Link href={`/candidates/${reply.candidate_id}`}
                                className="text-[11px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                View candidate
                              </Link>
                            )}
                            <Link href={`/generator?type=${reply.reply_type}`}
                              className="text-[11px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                              Use again
                            </Link>
                          </div>
                        </div>
                        <div className="relative group/text">
                          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{reply.generated_text}</p>
                        </div>
                      </div>

                      {/* Outcome row */}
                      <div className="px-4 py-2.5 border-t border-surface-border bg-surface-page flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mr-1">Mark outcome</span>
                        {OUTCOME_OPTIONS.map(({ value, label, icon, activeClass }) => {
                          const isActive = outcomes[reply.id] === value
                          return (
                            <button
                              key={value}
                              onClick={() => markOutcome(reply.id, value)}
                              disabled={savingId === reply.id}
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all disabled:opacity-50',
                                isActive
                                  ? activeClass
                                  : 'border-surface-border text-ink-muted bg-white hover:border-surface-borderStrong hover:text-ink'
                              )}
                            >
                              {icon}{label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Limit notice */}
      {replies.length === 200 && (
        <p className="text-center text-xs text-ink-muted py-2">Showing latest 200 replies</p>
      )}
    </div>
  )
}
