import Link from 'next/link'
import { Wand2, BookOpen, History, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/ui/card'
import { FREE_REPLY_LIMIT } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import UpgradeBanner from '@/components/ui/upgrade-banner'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const params = await searchParams
  const justUpgraded = params.upgraded === 'true'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('replies_used, plan')
    .eq('id', user?.id ?? '')
    .single()

  // Ghosting risk: active candidates not contacted in 5+ days
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const { data: ghostingCandidates } = await supabase
    .from('candidates')
    .select('id, name, role_applied, stage, last_contacted_at, created_at')
    .eq('user_id', user?.id ?? '')
    .not('stage', 'in', '("hired","rejected","applied")')
    .or(`last_contacted_at.lt.${fiveDaysAgo},and(last_contacted_at.is.null,created_at.lt.${fiveDaysAgo})`)
    .order('last_contacted_at', { ascending: true, nullsFirst: true })
    .limit(5)

  // Fetch replies this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: weekCount } = await supabase
    .from('replies')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user?.id ?? '')
    .gte('created_at', weekAgo)

  const repliesUsed = profile?.replies_used ?? 0
  const plan = profile?.plan ?? 'free'
  const pct = Math.min((repliesUsed / FREE_REPLY_LIMIT) * 100, 100)

  return (
    <div>
      <UpgradeBanner show={justUpgraded} />
      <PageHeader
        title="Dashboard"
        description="Your reply activity at a glance."
        action={
          <Link href="/generator">
            <Button variant="ai">Generate reply</Button>
          </Link>
        }
      />

      {/* Usage card — free plan only */}
      {plan === 'free' && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-0.5">Free plan</p>
              <p className="text-sm text-ink">
                <span className="font-semibold text-primary">{repliesUsed}</span>
                <span className="text-ink-secondary"> of {FREE_REPLY_LIMIT} replies used this month</span>
              </p>
            </div>
            <Link href="/upgrade">
              <Button variant="secondary" size="sm">Upgrade to Pro</Button>
            </Link>
          </div>
          <div className="w-full bg-surface-sunken rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {repliesUsed >= 35 && (
            <p className="text-xs text-status-processText mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Running low — upgrade for unlimited replies
            </p>
          )}
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            href: '/generator',
            label: 'Reply generator',
            desc: 'Draft the perfect candidate message in seconds',
            icon: Wand2,
            iconClass: 'text-accent-icon',
          },
          {
            href: '/templates',
            label: 'Browse templates',
            desc: '20+ ready-made HR message templates',
            icon: BookOpen,
            iconClass: 'text-primary',
          },
          {
            href: '/history',
            label: 'Reply history',
            desc: 'Search and reuse your past messages',
            icon: History,
            iconClass: 'text-primary',
          },
        ].map(({ href, label, desc, icon: Icon, iconClass }) => (
          <Link
            key={href}
            href={href}
            className="group bg-surface-card border border-surface-border rounded-lg shadow-card p-5 hover:border-surface-borderStrong hover:shadow-raised transition-all duration-150 flex flex-col gap-2"
          >
            <Icon className={`w-5 h-5 ${iconClass}`} />
            <h3 className="font-semibold text-sm text-ink">{label}</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">{desc}</p>
            <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary mt-1 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total replies', value: repliesUsed },
          { label: 'This week', value: weekCount ?? 0 },
          { label: 'Plan', value: plan.charAt(0).toUpperCase() + plan.slice(1) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <p className="text-[28px] font-semibold text-ink leading-none mb-1">{value}</p>
            <p className="text-[13px] text-ink-secondary">{label}</p>
          </Card>
        ))}
      </div>

      {/* Ghosting risk alert */}
      {ghostingCandidates && ghostingCandidates.length > 0 && (
        <div className="mt-5 bg-status-droppedBg border border-status-dropped/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-status-droppedText shrink-0" />
            <p className="text-sm font-semibold text-status-droppedText">
              {ghostingCandidates.length} candidate{ghostingCandidates.length > 1 ? 's' : ''} at ghosting risk
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {ghostingCandidates.map(c => {
              const ref  = c.last_contacted_at ?? c.created_at
              const days = Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={c.id} className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-medium text-ink">{c.name}</span>
                    <span className="text-xs text-ink-secondary ml-2">{c.role_applied}</span>
                  </div>
                  <span className="text-xs text-status-droppedText shrink-0">{days}d no contact</span>
                </div>
              )
            })}
          </div>
          <Link href="/candidates" className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
            View candidates <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
