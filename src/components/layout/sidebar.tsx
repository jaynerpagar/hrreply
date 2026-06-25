'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Wand2, BookOpen, History, Users, Settings, CreditCard, Sparkles, Menu, X } from 'lucide-react'

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

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClick}
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
      <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-0.5">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClick}
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
    </>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <span className="font-semibold text-sm text-ink-inverse tracking-tight">
        HRReply<span className="text-blue-300">.in</span>
      </span>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary-deep flex items-center justify-between px-4 h-14 border-b border-white/10">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="text-blue-200 hover:text-white p-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-primary-deep flex flex-col transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="text-blue-200 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavLinks onClick={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-primary-deep h-screen sticky top-0">
        <div className="px-5 py-4 border-b border-white/10">
          <Logo />
        </div>
        <NavLinks />
      </aside>
    </>
  )
}
