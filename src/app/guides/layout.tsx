import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { ArrowRight } from 'lucide-react'

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-page text-ink font-sans">
      <nav className="border-b border-surface-border bg-surface-card/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/"><Logo size="sm" /></Link>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
          >
            Try free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-surface-border mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
          <Link href="/"><Logo size="sm" /></Link>
          <div className="flex items-center gap-5">
            <Link href="/guides" className="hover:text-ink transition-colors">All guides</Link>
            <Link href="/login?mode=signup" className="hover:text-ink transition-colors">Sign up free</Link>
            <Link href="/login" className="hover:text-ink transition-colors">Sign in</Link>
            <span>© 2026 HRReply.in</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
