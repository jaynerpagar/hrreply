'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Wand2, BookOpen, History, Users, Settings, CreditCard, Zap } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generator', label: 'Reply Generator', icon: Wand2 },
  { href: '/templates', label: 'Templates', icon: BookOpen },
  { href: '/history', label: 'Reply History', icon: History },
  { href: '/candidates', label: 'Candidates', icon: Users, badge: 'V2' },
]

const BOTTOM_NAV = [
  { href: '/upgrade', label: 'Upgrade', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-gray-800 bg-gray-950 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-gray-950" />
          </div>
          <span className="font-bold text-sm tracking-tight">
            HR<span className="text-green-400">Reply</span>.ai
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-green-500/10 text-green-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="font-mono text-[9px] text-orange-400 bg-orange-500/10 border border-orange-500/25 px-1.5 py-0.5 rounded">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-800 flex flex-col gap-0.5">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-green-500/10 text-green-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
