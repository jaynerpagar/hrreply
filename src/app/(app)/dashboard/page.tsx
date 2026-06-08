import Link from 'next/link'
import { Wand2, BookOpen, History, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FREE_REPLY_LIMIT } from '@/lib/utils'

export default function DashboardPage() {
  const repliesUsed = 12
  const plan = 'free'
  const pct = Math.min((repliesUsed / FREE_REPLY_LIMIT) * 100, 100)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Good morning 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s your reply activity at a glance.</p>
      </div>

      {plan === 'free' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Free Plan</p>
              <p className="text-sm font-semibold">
                <span className="text-green-400">{repliesUsed}</span>
                <span className="text-gray-500"> / {FREE_REPLY_LIMIT} replies used this month</span>
              </p>
            </div>
            <Link href="/upgrade">
              <Button size="sm" variant="secondary">
                <Zap className="w-3 h-3" /> Upgrade to Pro
              </Button>
            </Link>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          {repliesUsed >= 35 && (
            <p className="text-xs text-yellow-400 mt-2">⚠ Running low — upgrade for unlimited replies</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/generator', label: 'Generate Reply', desc: 'AI-craft the perfect message instantly', icon: Wand2, color: 'text-green-400 group-hover:border-green-500/40' },
          { href: '/templates', label: 'Browse Templates', desc: '20+ ready-made HR message templates', icon: BookOpen, color: 'text-blue-400 group-hover:border-blue-500/40' },
          { href: '/history', label: 'Reply History', desc: 'Search and reuse past messages', icon: History, color: 'text-orange-400 group-hover:border-orange-500/40' },
        ].map(({ href, label, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`group bg-gray-900 border border-gray-800 rounded-xl p-5 transition-colors ${color.split(' ')[1]}`}
          >
            <Icon className={`w-6 h-6 mb-3 ${color.split(' ')[0]}`} />
            <h3 className="font-semibold text-sm mb-1">{label}</h3>
            <p className="text-xs text-gray-500">{desc}</p>
            <ArrowRight className="w-4 h-4 text-gray-600 mt-3" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Replies', value: repliesUsed },
          { label: 'This Week', value: 4 },
          { label: 'Saved Templates', value: 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-2xl font-bold text-green-400">{value}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
