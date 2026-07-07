'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, Loader2, Check, AlertTriangle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

interface InviteInfo {
  workspaceName: string
  inviterName: string
  role: string
  email: string
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    fetch(`/api/team/join?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setLoadError(d.error)
        else setInfo(d)
      })
      .catch(() => setLoadError('Could not load invite details.'))
  }, [token])

  async function handleJoin() {
    setJoining(true); setJoinError('')
    const res = await fetch('/api/team/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 401) {
        // Not logged in — redirect to login with return URL
        router.push(`/login?next=${encodeURIComponent(`/join/${token}`)}`)
        return
      }
      setJoinError(data.error ?? 'Something went wrong')
      setJoining(false)
      return
    }

    setJoined(true)
    setTimeout(() => router.push('/team'), 1800)
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="sm" />
        </div>

        <div className="bg-surface-card border border-surface-border rounded-2xl shadow-raised overflow-hidden">
          {/* Loading */}
          {!info && !loadError && (
            <div className="p-10 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-ink-muted">Loading invite…</p>
            </div>
          )}

          {/* Error */}
          {loadError && (
            <div className="p-8 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <p className="font-semibold text-ink">Invite not found</p>
              <p className="text-sm text-ink-muted">{loadError}</p>
            </div>
          )}

          {/* Success */}
          {joined && (
            <div className="p-8 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-ink">You&apos;ve joined {info?.workspaceName}!</p>
              <p className="text-sm text-ink-muted">Redirecting to your team workspace…</p>
            </div>
          )}

          {/* Invite card */}
          {info && !joined && (
            <>
              <div className="bg-primary px-6 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-accent" />
                </div>
                <h1 className="text-lg font-bold text-white">You&apos;re invited to join</h1>
                <p className="text-2xl font-bold text-accent mt-1">{info.workspaceName}</p>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="bg-surface-sunken rounded-xl p-4 text-center">
                  <p className="text-sm text-ink-muted">Invited by</p>
                  <p className="font-semibold text-ink mt-0.5">{info.inviterName}</p>
                  <p className="text-xs text-ink-muted mt-2">
                    You&apos;ll join as a <span className="font-semibold text-ink capitalize">{info.role}</span>
                  </p>
                </div>

                {joinError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">{joinError}</p>
                )}

                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {joining ? 'Joining…' : `Join ${info.workspaceName}`}
                </button>

                <p className="text-xs text-ink-muted text-center">
                  You&apos;ll need to be logged in to HRReply.in to join.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
