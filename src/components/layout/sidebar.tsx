'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Wand2, BookOpen, History, Users, Settings, CreditCard, Sparkles } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generator', label: 'Reply generator', icon: Wand2 },
  { href: '/templates', label: 'Templates', icon: BookOpen },
  { href: '/history', label: 'Reply history', icon: History },
  { href: '/candidates', label: 'Candidates', icon: Users, badge: 'V2' },
]

const BOTTOM_NAV = [
  { href: '/upgrade', label: 'Upgrade', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-primary-deep h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-ink-inverse tracking-tight">
            HRReply<span className="text-blue-300">.in</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors duration-150',
                active
                  ? 'bg-primary text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="font-medium text-[10px] text-blue-300 bg-white/10 px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-0.5">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors duration-150',
                active
                  ? 'bg-primary text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
