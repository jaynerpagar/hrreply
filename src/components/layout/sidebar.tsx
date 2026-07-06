'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Wand2, BookOpen, History, Users, Settings, CreditCard, Menu, X, LogOut, Bot, Sparkles, Zap } from 'lucide-react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',            icon: LayoutDashboard },
  { href: '/generator',   label: 'Reply generator',       icon: Wand2           },
  { href: '/outreach',    label: 'Personalized outreach', icon: Sparkles        },
  { href: '/automation',  label: 'HR Automation',         icon: Zap             },
  { href: '/copilot',     label: 'HR Copilot',            icon: Bot             },
  { href: '/templates',   label: 'Templates',             icon: BookOpen        },
  { href: '/history',     label: 'Reply history',         icon: History         },
  { href: '/candidates',  label: 'Candidates',            icon: Users           },
]

const BOTTOM_NAV = [
  { href: '/upgrade', label: 'Upgrade', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavItem({
  href, label, icon: Icon, active, onClick,
}: {
  href: string; label: string; icon: typeof LayoutDashboard; active: boolean; onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
        active
          ? 'bg-white/10 text-white font-medium'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0 transition-colors', active ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300')} />
      <span className="flex-1">{label}</span>
    </Link>
  )
}

function UserSection({ user, onNavigate }: { user: User | null; onNavigate?: () => void }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Account'
  const email = user?.email ?? ''
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    onNavigate?.()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="px-3 py-3 border-t border-white/10">
      <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg group">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-primary-deep">{initials}</span>
        </div>
        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate leading-tight">{displayName}</p>
          <p className="text-[11px] text-gray-500 truncate leading-tight">{email}</p>
        </div>
        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign out"
          className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function NavLinks({ user, onClick }: { user: User | null; onClick?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} onClick={onClick} />
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-white/10 flex flex-col gap-0.5">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} onClick={onClick} />
        ))}
      </div>
      <UserSection user={user} onNavigate={onClick} />
    </>
  )
}

export function Sidebar({ user }: { user?: User | null }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary-deep flex items-center justify-between px-4 h-14 border-b border-white/10">
        <Logo size="sm" theme="dark" />
        <button
          onClick={() => setOpen(true)}
          className="text-gray-400 hover:text-white p-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-primary-deep flex flex-col transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <Logo size="sm" theme="dark" />
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavLinks user={user ?? null} onClick={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-primary-deep h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-white/10">
          <Logo size="sm" theme="dark" />
        </div>
        <NavLinks user={user ?? null} />
      </aside>
    </>
  )
}
