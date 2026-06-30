'use client'

import { useState, Suspense } from 'react'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { LogoMark } from '@/components/ui/logo'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

type Mode = 'signin' | 'signup' | 'forgot'

const ROLES = [
  'HR Manager',
  'Recruiter / Talent Acquisition',
  'Placement Consultant',
  'Agency Owner / Founder',
  'Other',
]

function Field({
  label, optional, children,
}: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-secondary mb-1">
        {label}
        {optional && <span className="text-ink-muted font-normal"> (optional)</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full border border-surface-borderStrong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-card'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  function switchMode(m: Mode) {
    setMode(m); setError(''); setEmailSent(false)
  }

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
    })
    if (error) setError(error.message)
    else setEmailSent(true)
    setLoading(false)
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (!fullName.trim() || !company.trim() || !role) {
        setError('Please fill in your name, company and role.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
    }

    setLoading(true)
    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: {
            full_name: fullName.trim(),
            company: company.trim(),
            role,
            phone: phone.trim(),
          },
        },
      })
      if (error) setError(error.message)
      else setEmailSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  // ── Email sent screen (signup verification or forgot password) ──
  if (emailSent) {
    const isForgot = mode === 'forgot'
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-soft mb-5">
            <MailCheck className="w-7 h-7 text-accent-text" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink mb-2">
            {isForgot ? 'Check your inbox' : 'Verify your email'}
          </h1>
          <p className="text-ink-secondary text-sm leading-relaxed mb-1">
            {isForgot ? 'We sent a password reset link to' : 'We sent a confirmation link to'}
          </p>
          <p className="text-ink font-semibold text-sm mb-5">{email}</p>
          <p className="text-ink-muted text-[13px] leading-relaxed mb-6">
            {isForgot
              ? 'Click the link in that email to reset your password. Check your spam folder if you don\'t see it.'
              : 'Click the link in that email to activate your account. Check your spam folder if you don\'t see it within a minute.'}
          </p>
          <button
            onClick={() => switchMode('signin')}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ── Forgot password mode ──
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <LogoMark size={48} className="mb-4" />
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">Reset your password</h1>
            <p className="text-ink-secondary text-sm mt-1.5">Enter your email and we'll send a reset link.</p>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-6">
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
              <Field label="Email">
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" className={inputClass}
                />
              </Field>

              {error && (
                <p className="text-sm text-status-droppedText bg-status-droppedBg border border-status-dropped/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 mt-1"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <button
              onClick={() => switchMode('signin')}
              className="w-full text-center text-sm text-ink-muted hover:text-ink mt-4 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isSignup = mode === 'signup'

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <LogoMark size={48} className="mb-4" />
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Welcome to HRReply.in</h1>
          <p className="text-ink-secondary text-sm mt-1.5">AI replies for HR professionals</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-6">
          {/* Tabs */}
          <div className="flex rounded-lg border border-surface-border overflow-hidden mb-5">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? 'bg-primary text-white'
                    : 'text-ink-secondary hover:text-ink bg-surface-card'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 mb-4">
            {isSignup && (
              <>
                <Field label="Full name">
                  <input
                    type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Priya Sharma" className={inputClass}
                  />
                </Field>
                <Field label="Company / agency">
                  <input
                    type="text" required value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Staffing Pvt Ltd" className={inputClass}
                  />
                </Field>
                <Field label="Your role">
                  <select
                    required value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`${inputClass} ${role ? '' : 'text-ink-muted'}`}
                  >
                    <option value="" disabled>Select your role…</option>
                    {ROLES.map((r) => <option key={r} value={r} className="text-ink">{r}</option>)}
                  </select>
                </Field>
                <Field label="Phone / WhatsApp" optional>
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210" className={inputClass}
                  />
                </Field>
              </>
            )}

            <Field label={isSignup ? 'Work email' : 'Email'}>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" className={inputClass}
              />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-ink-secondary">Password</label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-ink-muted hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-status-droppedText bg-status-droppedBg border border-status-dropped/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-ink-muted">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-surface-card border border-surface-borderStrong text-ink font-medium py-2.5 px-4 rounded-lg hover:bg-surface-sunken transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[13px] text-ink-muted mt-4">
            By continuing you agree to our terms of service
          </p>
        </div>

        <p className="text-center text-[13px] text-ink-muted mt-5">
          50 free replies/month · No credit card needed
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
