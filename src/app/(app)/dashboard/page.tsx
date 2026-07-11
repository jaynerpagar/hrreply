import Link from 'next/link'
import {
  ArrowRight, AlertTriangle, Calendar, Clock, Zap, Users, Briefcase,
  BarChart2, TrendingUp, TrendingDown, UserCheck, CheckCircle2, Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import UpgradeBanner from '@/components/ui/upgrade-banner'
import { cn } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  applied:             'bg-ink-muted',
  screening:           'bg-primary',
  shortlisted:         'bg-accent',
  interview_scheduled: 'bg-status-process',
  interviewed:         'bg-status-process',
  offer_sent:          'bg-primary',
  hired:               'bg-status-placed',
  rejected:            'bg-status-dropped',
}

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied', screening: 'Screening', shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview', interviewed: 'Interviewed',
  offer_sent: 'Offer Sent', hired: 'Hired', rejected: 'Rejected',
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  const diff = current - previous
  if (diff === 0) return <span className="flex items-center gap-0.5 text-[11px] text-ink-muted"><Minus className="w-3 h-3" />Same as last week</span>
  const up = diff > 0
  return (
    <span className={cn('flex items-center gap-0.5 text-[11px]', up ? 'text-status-placedText' : 'text-status-droppedText')}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{diff} vs last week
    </span>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const params = await searchParams
  const justUpgraded = params.upgraded === 'true'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now          = new Date()
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd     = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const fiveDaysAgo  = new Date(Date.now() - 5 * 86400000).toISOString()
  const sevenDaysOut = new Date(Date.now() + 7 * 86400000).toISOString()
  const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString()
  const oneDayOut    = new Date(Date.now() + 24 * 3600000).toISOString()
  const weekAgo      = new Date(Date.now() - 7 * 86400000).toISOString()
  const twoWeeksAgo  = new Date(Date.now() - 14 * 86400000).toISOString()

  const [
    { data: profile },
    { data: allCandidates },
    { count: weekReplies },
    { count: lastWeekReplies },
    { count: newThisWeek },
    { data: automationRules },
    { data: openJobs },
    { data: replyOutcomes },
  ] = await Promise.all([
    supabase.from('users').select('replies_used, plan').eq('id', user?.id ?? '').single(),
    supabase.from('candidates')
      .select('id, name, role_applied, stage, last_contacted_at, created_at, interview_at, offer_expiry_at, joining_at, current_company')
      .eq('user_id', user?.id ?? ''),
    supabase.from('replies').select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id ?? '').gte('created_at', weekAgo),
    supabase.from('replies').select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id ?? '').gte('created_at', twoWeeksAgo).lt('created_at', weekAgo),
    supabase.from('candidates').select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id ?? '').gte('created_at', weekAgo),
    supabase.from('automations').select('id, name, is_active, run_count, last_run_at')
      .eq('user_id', user?.id ?? '').eq('is_active', true).limit(4),
    supabase.from('jobs').select('id, title').eq('user_id', user?.id ?? '').eq('status', 'open').limit(5),
    supabase.from('replies').select('outcome')
      .eq('user_id', user?.id ?? '').not('outcome', 'is', null).limit(500),
  ])

  const candidates  = allCandidates ?? []
  const plan        = profile?.plan ?? 'free'
  const repliesUsed = profile?.replies_used ?? 0
  const pct         = Math.min((repliesUsed / FREE_REPLY_LIMIT) * 100, 100)

  // Reply efficiency
  const outcomes = replyOutcomes ?? []
  const positiveOutcomes = outcomes.filter(r => r.outcome === 'positive' || r.outcome === 'replied').length
  const efficiencyPct = outcomes.length > 0 ? Math.round((positiveOutcomes / outcomes.length) * 100) : null

  // Priority queue
  const ghosting = candidates.filter(c => {
    if (['hired', 'rejected', 'applied'].includes(c.stage)) return false
    const ref = c.last_contacted_at ?? c.created_at
    return new Date(ref) < new Date(fiveDaysAgo)
  }).sort((a, b) => new Date(a.last_contacted_at ?? a.created_at).getTime() - new Date(b.last_contacted_at ?? b.created_at).getTime()).slice(0, 3)

  const expiringOffers = candidates.filter(c =>
    c.stage === 'offer_sent' && c.offer_expiry_at && c.offer_expiry_at <= threeDaysOut
  ).sort((a, b) => new Date(a.offer_expiry_at!).getTime() - new Date(b.offer_expiry_at!).getTime()).slice(0, 3)

  const upcomingInterviews = candidates.filter(c =>
    c.interview_at && c.interview_at >= now.toISOString() && c.interview_at <= oneDayOut
  ).sort((a, b) => new Date(a.interview_at!).getTime() - new Date(b.interview_at!).getTime()).slice(0, 3)

  const joiningThisWeek = candidates.filter(c =>
    c.joining_at && c.joining_at >= now.toISOString() && c.joining_at <= sevenDaysOut
  ).sort((a, b) => new Date(a.joining_at!).getTime() - new Date(b.joining_at!).getTime()).slice(0, 4)

  // Today's agenda
  const interviewsToday = candidates.filter(c =>
    c.interview_at && c.interview_at >= todayStart && c.interview_at < todayEnd
  )
  const offersExpToday = candidates.filter(c =>
    c.offer_expiry_at && c.offer_expiry_at >= todayStart && c.offer_expiry_at < todayEnd
  )
  const joiningToday = candidates.filter(c =>
    c.joining_at && c.joining_at >= todayStart && c.joining_at < todayEnd
  )
  const hasAgenda = interviewsToday.length > 0 || offersExpToday.length > 0 || joiningToday.length > 0

  // Pipeline stats
  const stageCounts: Record<string, number> = {}
  for (const c of candidates) { stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1 }
  const activeStages = ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent', 'hired']
  const totalActive  = candidates.filter(c => c.stage !== 'rejected').length
  const prevWeekActive = totalActive - (newThisWeek ?? 0)

  const priorityCount = ghosting.length + expiringOffers.length + upcomingInterviews.length
  const hasPriority   = priorityCount > 0 || joiningThisWeek.length > 0

  const quickActions = [
    { label: 'Interview Invite', href: '/generator?type=interview_invite', emoji: '📅' },
    { label: 'Offer Letter',     href: '/generator?type=offer',            emoji: '🎉' },
    { label: 'Rejection',        href: '/generator?type=rejection',        emoji: '📧' },
    { label: 'Follow-up',        href: '/generator?type=follow_up',        emoji: '🔁' },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <UpgradeBanner show={justUpgraded} />

      {/* Today's Agenda strip */}
      {hasAgenda && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 bg-primary text-white rounded-xl px-5 py-3 mb-4 shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 shrink-0">Today</p>
          {interviewsToday.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
              <strong className="font-bold text-accent">{interviewsToday.length}</strong>
              <span className="text-white/80">interview{interviewsToday.length > 1 ? 's' : ''}</span>
              <span className="text-white/40 text-xs">({interviewsToday.map(c => c.name.split(' ')[0]).join(', ')})</span>
            </span>
          )}
          {offersExpToday.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-red-300 shrink-0" />
              <strong className="font-bold text-red-300">{offersExpToday.length}</strong>
              <span className="text-white/80">offer{offersExpToday.length > 1 ? 's expire' : ' expires'} today</span>
            </span>
          )}
          {joiningToday.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <UserCheck className="w-3.5 h-3.5 text-accent shrink-0" />
              <strong className="font-bold text-accent">{joiningToday.length}</strong>
              <span className="text-white/80">joining today</span>
              <span className="text-white/40 text-xs">({joiningToday.map(c => c.name.split(' ')[0]).join(', ')})</span>
            </span>
          )}
          <Link href="/automation" className="ml-auto text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1 shrink-0">
            Run automation <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            {priorityCount > 0
              ? `${priorityCount} action${priorityCount !== 1 ? 's' : ''} need your attention`
              : 'All caught up — great work!'}
          </p>
        </div>
        <Link href="/generator">
          <Button variant="ai"><Zap className="w-4 h-4 mr-1.5" /> Generate reply</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 shrink-0">
        <Link href="/candidates" className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 hover:border-surface-borderStrong hover:shadow-card transition-all group">
          <div className="flex items-center justify-between mb-1">
            <p className="text-2xl font-semibold text-ink">{candidates.length}</p>
            <Users className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-ink-secondary mb-1">Total Candidates</p>
          {(newThisWeek ?? 0) > 0 && (
            <span className="text-[11px] text-status-placedText flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />+{newThisWeek} this week
            </span>
          )}
        </Link>

        <Link href="/candidates" className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 hover:border-surface-borderStrong hover:shadow-card transition-all group">
          <div className="flex items-center justify-between mb-1">
            <p className="text-2xl font-semibold text-ink">{totalActive}</p>
            <TrendingUp className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-ink-secondary mb-1">Active Pipeline</p>
          <TrendBadge current={totalActive} previous={prevWeekActive} />
        </Link>

        <Link href="/jobs" className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 hover:border-surface-borderStrong hover:shadow-card transition-all group">
          <div className="flex items-center justify-between mb-1">
            <p className="text-2xl font-semibold text-ink">{openJobs?.length ?? 0}</p>
            <Briefcase className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-ink-secondary mb-1">Open Jobs</p>
          {joiningThisWeek.length > 0 && (
            <span className="text-[11px] text-status-processText flex items-center gap-0.5">
              <UserCheck className="w-3 h-3" />{joiningThisWeek.length} joining soon
            </span>
          )}
        </Link>

        <Link href="/analytics" className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 hover:border-surface-borderStrong hover:shadow-card transition-all group">
          <div className="flex items-center justify-between mb-1">
            <p className="text-2xl font-semibold text-ink">{weekReplies ?? 0}</p>
            <BarChart2 className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-ink-secondary mb-1">Replies This Week</p>
          <TrendBadge current={weekReplies ?? 0} previous={lastWeekReplies ?? 0} />
        </Link>
      </div>

      {/* ── Main grid — fills remaining height ────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column: priority queue + quick actions */}
        <div className="lg:col-span-2 flex flex-col min-h-0 gap-3">

          {/* Scrollable priority area */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">

            {/* Expiring offers */}
            {expiringOffers.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-status-droppedBg/40">
                  <AlertTriangle className="w-4 h-4 text-status-droppedText shrink-0" />
                  <p className="text-sm font-semibold text-status-droppedText">Offers Expiring Soon</p>
                </div>
                <div className="divide-y divide-surface-border">
                  {expiringOffers.map(c => {
                    const days = Math.ceil((new Date(c.offer_expiry_at!).getTime() - Date.now()) / 86400000)
                    return (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-ink">{c.name}</p>
                          <p className="text-xs text-ink-secondary">{c.role_applied}{c.current_company ? ` · ${c.current_company}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-medium text-status-droppedText">{days === 0 ? 'Today!' : `${days}d left`}</span>
                          <Link href={`/generator?candidate=${encodeURIComponent(c.name)}&type=follow_up`}>
                            <Button variant="secondary" size="sm">Send nudge</Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upcoming interviews */}
            {upcomingInterviews.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-status-processBg/40">
                  <Calendar className="w-4 h-4 text-status-processText shrink-0" />
                  <p className="text-sm font-semibold text-status-processText">Interviews in Next 24h</p>
                </div>
                <div className="divide-y divide-surface-border">
                  {upcomingInterviews.map(c => {
                    const hrs = Math.ceil((new Date(c.interview_at!).getTime() - Date.now()) / 3600000)
                    return (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-ink">{c.name}</p>
                          <p className="text-xs text-ink-secondary">{new Date(c.interview_at!).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-medium text-status-processText">in {hrs}h</span>
                          <Link href={`/generator?candidate=${encodeURIComponent(c.name)}&type=interview_reminder`}>
                            <Button variant="secondary" size="sm">Send reminder</Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ghosting risk */}
            {ghosting.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
                  <Clock className="w-4 h-4 text-ink-muted shrink-0" />
                  <p className="text-sm font-semibold text-ink">Ghosting Risk</p>
                  <Link href="/candidates" className="ml-auto text-xs text-primary hover:underline font-medium">View all</Link>
                </div>
                <div className="divide-y divide-surface-border">
                  {ghosting.map(c => {
                    const ref  = c.last_contacted_at ?? c.created_at
                    const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000)
                    return (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-ink">{c.name}</p>
                          <p className="text-xs text-ink-secondary">{c.role_applied} · {STAGE_LABELS[c.stage] ?? c.stage}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-ink-muted">{days}d no contact</span>
                          <Link href={`/generator?candidate=${encodeURIComponent(c.name)}&type=follow_up`}>
                            <Button variant="secondary" size="sm">Follow up</Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Joining this week — in left panel to avoid right panel overload */}
            {joiningThisWeek.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shrink-0">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
                  <UserCheck className="w-4 h-4 text-status-placedText shrink-0" />
                  <p className="text-sm font-semibold text-ink">Joining This Week</p>
                  <Link href="/automation" className="ml-auto text-xs text-primary hover:underline font-medium">Send messages</Link>
                </div>
                <div className="grid grid-cols-2 divide-x divide-surface-border">
                  {joiningThisWeek.map(c => {
                    const days = Math.ceil((new Date(c.joining_at!).getTime() - Date.now()) / 86400000)
                    return (
                      <div key={c.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{c.name}</p>
                          <p className="text-[11px] text-ink-muted truncate">{c.role_applied}</p>
                        </div>
                        <span className={cn('text-[11px] font-semibold shrink-0', days <= 1 ? 'text-status-droppedText' : 'text-status-placedText')}>
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days}d`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state when no priority items */}
            {!hasPriority && (
              <div className="flex-1 flex items-center justify-center bg-surface-card border border-surface-border rounded-xl min-h-[160px]">
                <div className="text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-status-placedBg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-5 h-5 text-status-placedText" />
                  </div>
                  <h3 className="font-semibold text-ink mb-1">All caught up!</h3>
                  <p className="text-sm text-ink-secondary">No urgent actions right now. Keep the momentum going.</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions — always pinned to bottom of left column */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {quickActions.map(({ label, href, emoji }) => (
              <Link key={label} href={href}
                className="bg-surface-card border border-surface-border rounded-xl p-4 text-center hover:border-primary/40 hover:bg-primary-soft/20 hover:shadow-card transition-all group">
                <div className="text-xl mb-2">{emoji}</div>
                <p className="text-xs font-medium text-ink-secondary group-hover:text-ink transition-colors">{label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column: side widgets */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">

          {/* Pipeline snapshot */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Pipeline</h3>
              <Link href="/candidates" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="flex flex-col gap-2">
              {activeStages.map(stage => {
                const count = stageCounts[stage] ?? 0
                const max   = Math.max(...activeStages.map(s => stageCounts[s] ?? 0), 1)
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <span className="text-xs text-ink-secondary w-24 shrink-0 truncate">{STAGE_LABELS[stage]}</span>
                    <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', STAGE_COLORS[stage])} style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-ink w-4 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active automations */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Automations</h3>
              <Link href="/automation" className="text-xs text-primary hover:underline font-medium">Manage</Link>
            </div>
            {(automationRules ?? []).length === 0 ? (
              <div className="text-center py-3">
                <p className="text-xs text-ink-muted mb-2.5">No active automations</p>
                <Link href="/automation"><Button variant="secondary" size="sm">Set up automation</Button></Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(automationRules ?? []).map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-placed shrink-0" />
                      <span className="text-xs text-ink-secondary truncate">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.run_count > 0 && <span className="text-[10px] text-ink-muted">{a.run_count}×</span>}
                      <span className="text-[10px] font-medium text-status-placedText bg-status-placedBg px-1.5 py-0.5 rounded">Active</span>
                    </div>
                  </div>
                ))}
                <Link href="/automation" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium mt-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Reply efficiency */}
          {efficiencyPct !== null ? (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-status-placedText shrink-0" />
                  <h3 className="text-sm font-semibold text-ink">Reply Efficiency</h3>
                </div>
                <Link href="/history" className="text-xs text-primary hover:underline font-medium">History</Link>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className={cn('text-3xl font-bold',
                  efficiencyPct >= 70 ? 'text-status-placedText' : efficiencyPct >= 40 ? 'text-status-processText' : 'text-status-droppedText'
                )}>{efficiencyPct}%</span>
                <span className="text-xs text-ink-muted mb-1">positive outcomes</span>
              </div>
              <div className="w-full bg-surface-sunken rounded-full h-1.5 mb-2">
                <div
                  className={cn('h-1.5 rounded-full transition-all', efficiencyPct >= 70 ? 'bg-status-placed' : efficiencyPct >= 40 ? 'bg-status-process' : 'bg-status-dropped')}
                  style={{ width: `${efficiencyPct}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-muted">{positiveOutcomes} of {outcomes.length} replies got a response</p>
            </div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-ink-muted shrink-0" />
                <h3 className="text-sm font-semibold text-ink">Reply Efficiency</h3>
              </div>
              <p className="text-xs text-ink-muted mb-2.5">Track reply outcomes to see your response rate here.</p>
              <Link href="/history"><Button variant="secondary" size="sm">Mark outcomes</Button></Link>
            </div>
          )}

          {/* Upgrade — free plan */}
          {plan === 'free' && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Free Plan</p>
                <Link href="/upgrade"><Button variant="secondary" size="sm">Upgrade</Button></Link>
              </div>
              <p className="text-sm text-ink mb-2">
                <span className="font-semibold text-primary">{repliesUsed}</span>
                <span className="text-ink-secondary"> of {FREE_REPLY_LIMIT} replies used</span>
              </p>
              <div className="w-full bg-surface-sunken rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              {repliesUsed >= 20 && (
                <p className="text-xs text-status-processText mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Running low — upgrade for unlimited replies
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
