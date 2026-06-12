import Link from 'next/link'
import { Wand2, BookOpen, History, ArrowRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/ui/card'
import { FREE_REPLY_LIMIT } from '@/lib/utils'

export default function DashboardPage() {
  const repliesUsed = 12
  const plan = 'free'
  const pct = Math.min((repliesUsed / FREE_REPLY_LIMIT) * 100, 100)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your reply activity at a glance."
        action={
          <Link href="/generator">
            <Button variant="ai">Generate reply</Button>
          </Link>
        }
      />

      {/* Usage card */}
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
            iconClass: 'text-accent',
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
          { label: 'This week', value: 4 },
          { label: 'Saved templates', value: 0 },
        ].map(({ label, value }) => (
          <Card key={label}>
            <p className="text-[28px] font-semibold text-ink leading-none mb-1">{value}</p>
            <p className="text-[13px] text-ink-secondary">{label}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
