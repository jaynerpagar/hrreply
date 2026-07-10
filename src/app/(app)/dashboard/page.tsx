import Link from 'next/link'
import { ArrowRight, AlertTriangle, Calendar, Clock, Zap, Users, Briefcase, BarChart2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import UpgradeBanner from '@/components/ui/upgrade-banner'
import { cn } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  applied:              'bg-ink-muted',
  screening:            'bg-primary',
  shortlisted:          'bg-accent',
  interview_scheduled:  'bg-status-process',
  interviewed:          'bg-status-process',
  offer_sent:           'bg-primary',
  hired:                'bg-status-placed',
  rejected:             'bg-status-dropped',
}

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied', screening: 'Screening', shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview', interviewed: 'Interviewed',
  offer_sent: 'Offer Sent', hired: 'Hired', rejected: 'Rejected',
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

  const now = new Date()
  const fiveDaysAgo  = new Date(Date.now() - 5 * 86400000).toISOString()
  const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString()
  const oneDayOut    = new Date(Date.now() + 24 * 3600000).toISOString()
  const weekAgo      = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { data: profile },
    { data: allCandidates },
    { count: weekReplies },
    { data: automations },
    { data: openJobs },
  ] = await Promise.all([
    supabase.from('users').select('replies_used, plan').eq('id', user?.id ?? '').single(),
    supabase.from('candidates').select('id, name, role_applied, stage, last_contacted_at, created_at, interview_at, offer_expiry_at, current_company').eq('user_id', user?.id ?? ''),
    supabase.from('replies').select('id', { count: 'exact', head: true }).eq('user_id', user?.id ?? '').gte('created_at', weekAgo),
    supabase.from('automation_workflows').select('id, name, is_active, trigger_type').eq('user_id', user?.id ?? '').eq('is_active', true).limit(3),
    supabase.from('jobs').select('id, title').eq('user_id', user?.id ?? '').eq('status', 'open').limit(5),
  ])

  const candidates = allCandidates ?? []
  const plan        = profile?.plan ?? 'free'
  const repliesUsed = profile?.replies_used ?? 0
  const pct         = Math.min((repliesUsed / FREE_REPLY_LIMIT) * 100, 100)

  // Priority queue
  const ghosting = candidates.filter(c => {
    if (['hired', 'rejected', 'applied'].includes(c.stage)) return false
    const ref  = c.last_contacted_at ?? c.created_at
    return new Date(ref) < new Date(fiveDaysAgo)
  }).sort((a, b) => new Date(a.last_contacted_at ?? a.created_at).getTime() - new Date(b.last_contacted_at ?? b.created_at).getTime()).slice(0, 3)

  const expiringOffers = candidates.filter(c =>
    c.stage === 'offer_sent' && c.offer_expiry_at && c.offer_expiry_at <= threeDaysOut
  ).sort((a, b) => new Date(a.offer_expiry_at!).getTime() - new Date(b.offer_expiry_at!).getTime()).slice(0, 3)

  const upcomingInterviews = candidates.filter(c =>
    c.interview_at && c.interview_at >= now.toISOString() && c.interview_at <= oneDayOut
  ).sort((a, b) => new Date(a.interview_at!).getTime() - new Date(b.interview_at!).getTime()).slice(0, 3)

  // Pipeline stats
  const stageCounts: Record<string, number> = {}
  for (const c of candidates) {
    stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1
  }
  const activeStages = ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent', 'hired']
  const totalActive = candidates.filter(c => !['rejected'].includes(c.stage)).length

  const priorityCount = ghosting.length + expiringOffers.length + upcomingInterviews.length

  return (
    <div>
      <UpgradeBanner show={justUpgraded} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            {priorityCount > 0 ? `${priorityCount} action${priorityCount !== 1 ? 's' : ''} need your attention` : 'All caught up — great work!'}
          </p>
        </div>
        <Link href="/generator">
          <Button variant="ai"><Zap className="w-4 h-4 mr-1.5" /> Generate reply</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Candidates',  value: candidates.length, icon: Users,     href: '/candidates' },
          { label: 'Active Pipeline',   value: totalActive,        icon: TrendingUp, href: '/candidates' },
          { label: 'Open Jobs',         value: openJobs?.length ?? 0, icon: Briefcase, href: '/jobs' },
          { label: 'Replies This Week', value: weekReplies ?? 0,  icon: BarChart2, href: '/analytics' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 hover:border-surface-borderStrong hover:shadow-card transition-all group">
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl font-semibold text-ink">{value}</p>
              <Icon className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs text-ink-secondary">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Priority queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Expiring offers */}
          {expiringOffers.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
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
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
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
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
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

          {/* Empty state */}
          {priorityCount === 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-status-placedBg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-status-placedText" />
              </div>
              <h3 className="font-semibold text-ink mb-1">All caught up!</h3>
              <p className="text-sm text-ink-secondary">No urgent actions right now. Keep the momentum going.</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Interview Invite', href: '/generator?type=interview_invite', emoji: '📅' },
              { label: 'Offer Letter',     href: '/generator?type=offer',            emoji: '🎉' },
              { label: 'Rejection',        href: '/generator?type=rejection',        emoji: '📧' },
              { label: 'Follow-up',        href: '/generator?type=follow_up',        emoji: '🔁' },
            ].map(({ label, href, emoji }) => (
              <Link
                key={label}
                href={href}
                className="bg-surface-card border border-surface-border rounded-xl p-4 text-center hover:border-primary/40 hover:bg-primary-soft/20 hover:shadow-card transition-all group"
              >
                <div className="text-xl mb-2">{emoji}</div>
                <p className="text-xs font-medium text-ink-secondary group-hover:text-ink transition-colors">{label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">

          {/* Pipeline snapshot */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
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
                      <div
                        className={cn('h-full rounded-full transition-all', STAGE_COLORS[stage])}
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-ink w-4 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upgrade (free plan) */}
          {plan === 'free' && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Free Plan</p>
                <Link href="/upgrade">
                  <Button variant="secondary" size="sm">Upgrade</Button>
                </Link>
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

          {/* Active automations */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Automations</h3>
              <Link href="/automation" className="text-xs text-primary hover:underline font-medium">Manage</Link>
            </div>
            {(automations ?? []).length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-ink-muted mb-2">No active automations</p>
                <Link href="/automation"><Button variant="secondary" size="sm">Set up automation</Button></Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(automations ?? []).map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-placed shrink-0" />
                      <span className="text-xs text-ink-secondary truncate">{a.name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-status-placedText bg-status-placedBg px-1.5 py-0.5 rounded shrink-0">Active</span>
                  </div>
                ))}
                <Link href="/automation" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium mt-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Open jobs */}
          {(openJobs ?? []).length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">Open Jobs</h3>
                <Link href="/jobs" className="text-xs text-primary hover:underline font-medium">View all</Link>
              </div>
              <div className="flex flex-col gap-2">
                {(openJobs ?? []).map(j => (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center justify-between text-xs text-ink-secondary hover:text-primary transition-colors group">
                    <span className="truncate">{j.title}</span>
                    <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
