'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X } from 'lucide-react'

export default function UpgradeBanner({ show }: { show: boolean }) {
  const router = useRouter()
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (!show) return
    // Remove ?upgraded=true from URL without a re-render
    const url = new URL(window.location.href)
    url.searchParams.delete('upgraded')
    router.replace(url.pathname, { scroll: false })

    const t = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(t)
  }, [show, router])

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 mb-5 bg-accent-soft border border-accent/30 text-accent-text rounded-lg px-4 py-3 text-sm font-medium">
      <Sparkles className="w-4 h-4 text-accent-icon shrink-0" />
      <span className="flex-1">You&apos;re now on the Pro plan — enjoy unlimited replies!</span>
      <button onClick={() => setVisible(false)} className="text-accent-icon hover:text-accent-text">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
