'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  BarChart2, Brain, Clock, TrendingUp, TrendingDown, Loader2, Sparkles, Send,
  Heart, Zap, MessageSquare, Users, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_META, HR_TEMPLATES } from '@/lib/hr-templates'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  totalReplies: number
  thisMonth: number
  lastMonth: number
  byType: { type: string; count: number }[]
  byTone: { tone: string; count: number }[]
  weeklyData: { week: string; count: number }[]
  mostCopied: { id: string; reply_type: string; tone: string; copy_count: number; context_input: string }[]
  topTemplates: { templateId: string; count: number }[]
}

interface HealthData {
  total: number
  ghosted: number
  ghostingRate: number
  replyRate: number | null
  offerAcceptRate: number | null
  noShowRate: number | null
  totalTrackedOutcomes: number
  stageData: { stage: string; count: number }[]
  outcomeData: { outcome: string; count: number; label: string }[]
}

interface ProductivityData {
  totalReplies: number
  totalHoursSaved: string
  totalMinutesSaved: number
  totalCopied: number
  templatesUsed: number
  thisWeek: number
  lastWeek: number
  weeklyData: { week: string; count: number }[]
  dayData: { day: string; count: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REPLY_TYPE_LABELS: Record<string, string> = {
  interview_invite: 'Interview Invite', shortlist: 'Shortlist', offer: 'Offer Letter',
  rejection: 'Rejection', reschedule: 'Reschedule', no_show: 'No Show',
  follow_up: 'Follow-up', salary_negotiation: 'Salary Negotiation',
  joining_confirmation: 'Joining', thank_you: 'Thank You',
  interview_reminder: 'Interview Reminder', document_collection: 'Document Collect',
  onboarding: 'Onboarding', welcome: 'Welcome', exit_interview: 'Exit Interview',
}

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied', screening: 'Screening', shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Sched.', interviewed: 'Interviewed',
  offer_sent: 'Offer Sent', hired: 'Hired', rejected: 'Rejected',
}

const CHART_COLOR  = '#c8f135'
const CHART_ACCENT = '#1a1a2e'
const PIE_COLORS   = ['#c8f135', '#ef4444', '#10b981', '#f59e0b']

function StatCard({ label, value, sub, icon, trend }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; trend?: 'up' | 'down' | 'flat'
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <p className="text-2xl font-bold text-ink mt-0.5">{value}</p>
        {sub && (
          <p className={cn('text-xs mt-0.5 flex items-center gap-1',
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-ink-muted')}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── AI Recommendation widget ─────────────────────────────────────────────────

function AIRecommendation() {
  const [role, setRole]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    templates: { name: string; reason: string; priority: number }[]
    tone: string; tone_reason: string; channel: string; channel_reason: string
    timing_tip: string; personalization_tip: string
  } | null>(null)
  const [error, setError] = useState('')

  async function ask() {
    if (!role.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/ai-recommendation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setResult(data.recommendation)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-primary" />
        <div>
          <p className="text-sm font-bold text-ink">AI Template Recommendation</p>
          <p className="text-xs text-ink-muted">Type a role and get the best template + approach</p>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="e.g. Senior React Developer, Sales Manager…"
            value={role} onChange={e => setRole(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()}
          />
          <button onClick={ask} disabled={loading || !role.trim()}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            Ask AI
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-2">Recommended templates</p>
              <div className="flex flex-col gap-2">
                {result.templates.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 bg-surface-sunken rounded-lg p-3">
                    <span className="text-xs font-bold bg-primary text-accent rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{t.priority}</span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{t.name}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{t.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-sunken rounded-lg p-3">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wide mb-1">Tone</p>
                <p className="text-sm font-semibold text-ink capitalize">{result.tone}</p>
                <p className="text-xs text-ink-muted mt-0.5">{result.tone_reason}</p>
              </div>
              <div className="bg-surface-sunken rounded-lg p-3">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wide mb-1">Channel</p>
                <p className="text-sm font-semibold text-ink capitalize">{result.channel}</p>
                <p className="text-xs text-ink-muted mt-0.5">{result.channel_reason}</p>
              </div>
            </div>
            <div className="bg-accent-soft rounded-lg p-3">
              <p className="text-[10px] font-bold text-accent-text uppercase tracking-wide mb-1">⏰ Timing tip</p>
              <p className="text-xs text-ink-secondary">{result.timing_tip}</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">✨ Personalisation tip</p>
              <p className="text-xs text-ink-secondary">{result.personalization_tip}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Best Time widget ─────────────────────────────────────────────────────────

const MESSAGE_TYPES = [
  'Interview Invite', 'Job Offer', 'Rejection', 'Follow-up',
  'Salary Negotiation', 'Joining Confirmation', 'General HR Message',
]

function BestTimeWidget() {
  const [channel, setChannel]       = useState<'email' | 'whatsapp'>('email')
  const [messageType, setMessageType] = useState('Interview Invite')
  const [industry, setIndustry]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [result, setResult] = useState<{
    slots: { time: string; score: number; reason: string }[]
    avoid: string[]; tip: string
  } | null>(null)

  async function getRecommendation() {
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/best-time', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, messageType, industry }),
      })
      const data = await res.json()
      if (res.ok) setResult(data.result)
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2.5">
        <Clock className="w-4 h-4 text-primary" />
        <div>
          <p className="text-sm font-bold text-ink">Best Time to Send</p>
          <p className="text-xs text-ink-muted">AI recommends optimal send windows — research-based</p>
        </div>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">🤖 AI Estimate</span>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-surface-sunken rounded-lg p-0.5">
            {(['email', 'whatsapp'] as const).map(c => (
              <button key={c} onClick={() => setChannel(c)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize', channel === c ? 'bg-white shadow-sm text-ink' : 'text-ink-secondary hover:text-ink')}>
                {c === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </button>
            ))}
          </div>
          <select className="flex-1 min-w-36 rounded-lg border border-surface-border bg-surface-sunken px-3 py-1.5 text-xs text-ink focus:outline-none"
            value={messageType} onChange={e => setMessageType(e.target.value)}>
            {MESSAGE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input className="w-36 rounded-lg border border-surface-border bg-surface-sunken px-3 py-1.5 text-xs text-ink placeholder-ink-muted focus:outline-none"
            placeholder="Industry (optional)" value={industry} onChange={e => setIndustry(e.target.value)} />
          <button onClick={getRecommendation} disabled={loading}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            Get times
          </button>
        </div>
        {result && (
          <div className="flex flex-col gap-3">
            {result.slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0',
                  i === 0 ? 'bg-green-500' : i === 1 ? 'bg-amber-500' : 'bg-slate-400')}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-ink">{slot.time}</span>
                    <span className="text-xs font-bold text-ink-muted">{slot.score}/100</span>
                  </div>
                  <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${slot.score}%` }} />
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{slot.reason}</p>
                </div>
              </div>
            ))}
            {result.avoid.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">❌ Avoid</p>
                {result.avoid.map((a, i) => <p key={i} className="text-xs text-red-600">{a}</p>)}
              </div>
            )}
            <div className="bg-accent-soft rounded-lg p-3">
              <p className="text-xs text-accent-text">💡 {result.tip}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Health Tab (#73) ─────────────────────────────────────────────────────────

function HealthTab() {
  const [data, setData]       = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/health').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 gap-3 text-ink-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading health data…</div>
  if (!data)   return null

  const noOutcomes = data.totalTrackedOutcomes === 0

  return (
    <div className="flex flex-col gap-5">
      {noOutcomes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Response rate, offer acceptance, and no-show metrics are calculated from <strong>outcome tracking</strong>.
            Visit <strong>Reply History</strong> and mark outcomes on your messages to see these numbers populate.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active candidates" value={data.total} icon={<Users className="w-5 h-5" />} />
        <StatCard
          label="Ghosting risk" value={data.ghosted}
          sub={`${data.ghostingRate}% of pipeline — not contacted in 5+ days`}
          trend={data.ghostingRate > 30 ? 'down' : 'up'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label="Reply rate" value={data.replyRate !== null ? `${data.replyRate}%` : '—'}
          sub={data.replyRate !== null ? 'from tracked outcomes' : 'Mark outcomes in History'}
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <StatCard
          label="Offer acceptance" value={data.offerAcceptRate !== null ? `${data.offerAcceptRate}%` : '—'}
          sub={data.offerAcceptRate !== null ? 'accepted vs declined' : 'Mark outcomes in History'}
          trend={data.offerAcceptRate !== null ? (data.offerAcceptRate >= 70 ? 'up' : 'down') : undefined}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pipeline stage distribution */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
          <p className="text-sm font-bold text-ink mb-4">Candidate pipeline</p>
          {data.stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.stageData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 9 }} width={100}
                  tickFormatter={s => STAGE_LABELS[s] ?? s} />
                <Tooltip
                  formatter={(v) => [v, 'Candidates']}
                  labelFormatter={(l) => STAGE_LABELS[String(l)] ?? String(l)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-ink-muted text-sm">No candidates yet</div>
          )}
        </div>

        {/* Outcome breakdown */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
          <p className="text-sm font-bold text-ink mb-1">Message outcome breakdown</p>
          <p className="text-xs text-ink-muted mb-4">From outcomes marked in Reply History</p>
          {data.outcomeData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={data.outcomeData} dataKey="count" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {data.outcomeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {data.outcomeData.map((o, i) => (
                  <div key={o.outcome} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-ink-secondary">{o.label}</span>
                    <span className="text-xs font-bold text-ink ml-auto">{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-ink-muted text-sm gap-2">
              <Heart className="w-8 h-8 text-ink-muted/30" />
              <p>No outcomes tracked yet</p>
              <p className="text-xs">Go to Reply History → mark outcomes on your messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Productivity Tab (#78) ───────────────────────────────────────────────────

function ProductivityTab() {
  const [data, setData]       = useState<ProductivityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/productivity').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 gap-3 text-ink-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading productivity data…</div>
  if (!data)   return null

  const weekTrend = data.lastWeek === 0 ? 'flat' : data.thisWeek >= data.lastWeek ? 'up' : 'down'
  const weekDiff  = data.lastWeek === 0 ? 'First week of data' : `${data.thisWeek > data.lastWeek ? '+' : ''}${data.thisWeek - data.lastWeek} vs last week`

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total messages generated" value={data.totalReplies} icon={<Send className="w-5 h-5" />} />
        <StatCard
          label="Time saved" value={`${data.totalHoursSaved}h`}
          sub="vs writing manually (~8 min each)"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="This week" value={data.thisWeek}
          sub={weekDiff} trend={weekTrend}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="Templates used" value={data.templatesUsed}
          icon={<Zap className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Messages over time */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
          <p className="text-sm font-bold text-ink mb-4">Messages per week</p>
          {data.weeklyData.some(w => w.count > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Messages']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke={CHART_ACCENT} fill="url(#prodGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-ink-muted text-sm">No data yet</div>
          )}
        </div>

        {/* Best day of week */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
          <p className="text-sm font-bold text-ink mb-1">Most productive days</p>
          <p className="text-xs text-ink-muted mb-4">Messages generated by day of week</p>
          {data.dayData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.dayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Messages']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-ink-muted text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Time saved callout */}
      <div className="bg-primary rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6 text-accent" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">{data.totalHoursSaved} hours saved</p>
          <p className="text-sm text-white/70 mt-0.5">
            You generated {data.totalReplies} messages. At ~8 minutes each, that&apos;s <strong className="text-white">{data.totalMinutesSaved} minutes</strong> you didn&apos;t spend writing from scratch.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'health' | 'productivity'

export default function AnalyticsPage() {
  const [tab, setTab]         = useState<Tab>('overview')
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false))
  }, [])

  const monthTrend = data
    ? data.lastMonth === 0 ? 'flat' : data.thisMonth >= data.lastMonth ? 'up' : 'down'
    : 'flat'
  const monthDiff = data
    ? data.lastMonth === 0 ? 'First month of data' : `${data.thisMonth > data.lastMonth ? '+' : ''}${data.thisMonth - data.lastMonth} vs last month`
    : ''

  const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'overview',    label: 'Overview',    icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { value: 'health',      label: 'Comms Health',icon: <Heart className="w-3.5 h-3.5" /> },
    { value: 'productivity',label: 'Productivity', icon: <Zap className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="px-6 py-6 flex flex-col gap-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-ink">Analytics</h1>
          </div>
          <p className="text-sm text-ink-muted">Your messaging activity, communication health, and productivity stats</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface-sunken border border-surface-border rounded-xl w-fit">
        {TABS.map(({ value, label, icon }) => (
          <button key={value} onClick={() => setTab(value)} className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
            tab === value
              ? 'bg-surface-card text-ink shadow-sm border border-surface-border'
              : 'text-ink-muted hover:text-ink'
          )}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Overview tab (existing content) */}
      {tab === 'overview' && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-ink-muted">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading analytics…
            </div>
          )}
          {data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total messages (12 wks)" value={data.totalReplies} icon={<Send className="w-5 h-5" />} />
                <StatCard label="This month" value={data.thisMonth} sub={monthDiff} trend={monthTrend} icon={<TrendingUp className="w-5 h-5" />} />
                <StatCard label="Most generated" value={data.byType[0] ? REPLY_TYPE_LABELS[data.byType[0].type] ?? data.byType[0].type : '—'} sub={data.byType[0] ? `${data.byType[0].count} messages` : ''} icon={<BarChart2 className="w-5 h-5" />} />
                <StatCard label="Dominant tone" value={data.byTone[0] ? (data.byTone[0].tone.charAt(0).toUpperCase() + data.byTone[0].tone.slice(1)) : '—'} sub={data.byTone[0] ? `${data.byTone[0].count} messages` : ''} icon={<Sparkles className="w-5 h-5" />} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
                  <p className="text-sm font-bold text-ink mb-4">Messages over time</p>
                  {data.weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={data.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={w => w.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip formatter={(v) => [v, 'Messages']} labelFormatter={(l) => `Week of ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Area type="monotone" dataKey="count" stroke={CHART_ACCENT} fill="url(#areaGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="h-44 flex items-center justify-center text-ink-muted text-sm">No data yet — generate some messages!</div>}
                </div>
                <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
                  <p className="text-sm font-bold text-ink mb-4">Messages by type</p>
                  {data.byType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data.byType.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={90} tickFormatter={t => REPLY_TYPE_LABELS[t] ?? t} />
                        <Tooltip formatter={(v) => [v, 'Messages']} labelFormatter={(l) => REPLY_TYPE_LABELS[String(l)] ?? String(l)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-44 flex items-center justify-center text-ink-muted text-sm">No data yet</div>}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
                  <p className="text-sm font-bold text-ink mb-3">Most copied messages</p>
                  {data.mostCopied.length === 0 ? (
                    <p className="text-sm text-ink-muted py-4 text-center">Copy messages using the Copy button to see stats here.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {data.mostCopied.map((r, i) => (
                        <div key={r.id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                          <span className="text-xs font-bold text-ink-muted w-4 shrink-0">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{REPLY_TYPE_LABELS[r.reply_type] ?? r.reply_type}<span className="ml-1.5 text-ink-muted font-normal capitalize">· {r.tone}</span></p>
                            <p className="text-[11px] text-ink-muted truncate mt-0.5">{r.context_input?.slice(0, 60)}…</p>
                          </div>
                          <span className="text-xs font-bold text-primary shrink-0">{r.copy_count}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-ink">Most used templates</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">🤖 Usage proxy</span>
                  </div>
                  {data.topTemplates.length === 0 ? (
                    <p className="text-sm text-ink-muted py-4 text-center">Use templates from the library to see stats here.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {data.topTemplates.map((t, i) => {
                        const tpl = HR_TEMPLATES.find(h => h.id === t.templateId)
                        const cat = tpl ? CATEGORY_META[tpl.category] : null
                        return (
                          <div key={t.templateId} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                            <span className="text-xs font-bold text-ink-muted w-4 shrink-0">#{i + 1}</span>
                            {cat && <span className="text-base shrink-0">{cat.emoji}</span>}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-ink truncate">{tpl?.name ?? t.templateId}</p>
                              {cat && <p className="text-[11px] text-ink-muted">{cat.label}</p>}
                            </div>
                            <span className="text-xs font-bold text-primary shrink-0">{t.count}×</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AIRecommendation />
                <BestTimeWidget />
              </div>
            </>
          )}
        </>
      )}

      {tab === 'health'      && <HealthTab />}
      {tab === 'productivity' && <ProductivityTab />}
    </div>
  )
}
