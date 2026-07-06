'use client'

import { useState, useCallback } from 'react'
import { Brain, X, Check, Copy, AlertTriangle, CheckCircle, Globe, ChevronDown, ChevronUp, Loader2, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface GrammarResult {
  has_issues: boolean
  corrections: { original: string; corrected: string; reason: string }[]
  corrected_text: string
}

interface ComplianceIssue {
  phrase: string
  type: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  suggestion: string
}

interface ComplianceResult {
  issues: ComplianceIssue[]
}

interface InclusiveResult {
  replacements: { original: string; replacement: string; reason: string }[]
  rewritten_text: string
}

interface ReadabilityResult {
  score: number
  grade: string
  avg_sentence_length: number
  tips: string[]
}

interface ProfessionalResult {
  overall_score: number
  professionalism: number
  warmth: number
  confidence: number
  urgency: number
  verdict: 'send_ready' | 'could_improve' | 'needs_revision'
  verdict_reason: string
}

interface AnalysisResult {
  grammar: GrammarResult
  compliance: ComplianceResult
  inclusive: InclusiveResult
  readability: ReadabilityResult
  professional: ProfessionalResult
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_STYLE = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-blue-100 text-blue-700 border-blue-200',
}

const VERDICT_STYLE = {
  send_ready:       { cls: 'bg-green-100 text-green-700', label: 'Send-ready ✓' },
  could_improve:    { cls: 'bg-amber-100 text-amber-700', label: 'Could improve' },
  needs_revision:   { cls: 'bg-red-100 text-red-700',    label: 'Needs revision' },
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: value >= 70 ? '#22c55e' : value >= 45 ? '#f59e0b' : '#ef4444' }}
        />
      </div>
      <span className="text-xs font-bold text-ink w-7 text-right tabular-nums">{value}</span>
    </div>
  )
}

function Section({
  icon, title, badge, defaultOpen = false, children,
}: {
  icon: React.ReactNode
  title: string
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-surface-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-white hover:bg-surface-sunken transition-colors text-left"
      >
        <span className="text-base shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-ink">{title}</span>
        {badge}
        {open ? <ChevronUp className="w-4 h-4 text-ink-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />}
      </button>
      {open && <div className="border-t border-surface-border bg-white">{children}</div>}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 text-xs text-ink-secondary hover:text-ink px-2 py-1 rounded hover:bg-surface-sunken transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Panel sections ───────────────────────────────────────────────────────────

function GrammarSection({ data, onApply }: { data: GrammarResult; onApply?: (t: string) => void }) {
  const badge = data.has_issues
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{data.corrections.length} fix{data.corrections.length !== 1 ? 'es' : ''}</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Clean ✓</span>

  return (
    <Section icon="✏️" title="Grammar" badge={badge} defaultOpen={data.has_issues}>
      <div className="p-4 flex flex-col gap-3">
        {!data.has_issues ? (
          <p className="text-sm text-green-700 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> No grammar issues found.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {data.corrections.map((c, i) => (
                <div key={i} className="bg-surface-sunken rounded-lg p-3 text-xs">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="line-through text-red-500 font-mono">{c.original}</span>
                    <span className="text-ink-muted">→</span>
                    <span className="text-green-700 font-mono font-semibold">{c.corrected}</span>
                  </div>
                  <p className="text-ink-muted mt-1">{c.reason}</p>
                </div>
              ))}
            </div>
            {onApply && (
              <button
                onClick={() => onApply(data.corrected_text)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors w-fit"
              >
                <Wand2 className="w-3.5 h-3.5" /> Apply corrected text
              </button>
            )}
          </>
        )}
      </div>
    </Section>
  )
}

function ComplianceSection({ data }: { data: ComplianceResult }) {
  const highCount = data.issues.filter(i => i.severity === 'high').length
  const badge = data.issues.length === 0
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Clear ✓</span>
    : <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', highCount > 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>
        {data.issues.length} issue{data.issues.length !== 1 ? 's' : ''}{highCount > 0 ? ` (${highCount} HIGH)` : ''}
      </span>

  return (
    <Section icon="⚠️" title="HR Compliance" badge={badge} defaultOpen={data.issues.length > 0}>
      <div className="p-4 flex flex-col gap-3">
        {data.issues.length === 0 ? (
          <p className="text-sm text-green-700 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> No compliance issues detected.</p>
        ) : (
          data.issues.map((issue, i) => (
            <div key={i} className="border border-surface-border rounded-lg overflow-hidden text-xs">
              <div className={cn('px-3 py-2 flex items-center justify-between border-b border-surface-border', SEVERITY_STYLE[issue.severity])}>
                <span className="font-mono font-semibold">&ldquo;{issue.phrase}&rdquo;</span>
                <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border', SEVERITY_STYLE[issue.severity])}>{issue.severity}</span>
              </div>
              <div className="px-3 py-2 bg-white flex flex-col gap-1">
                <p className="text-ink-secondary"><span className="font-semibold text-ink">Why: </span>{issue.reason}</p>
                <p className="text-ink-secondary"><span className="font-semibold text-green-700">Use instead: </span>{issue.suggestion}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Section>
  )
}

function InclusiveSection({ data, onApply }: { data: InclusiveResult; onApply?: (t: string) => void }) {
  const badge = data.replacements.length === 0
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Inclusive ✓</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{data.replacements.length} replacement{data.replacements.length !== 1 ? 's' : ''}</span>

  return (
    <Section icon="🌍" title="Inclusive Language" badge={badge} defaultOpen={data.replacements.length > 0}>
      <div className="p-4 flex flex-col gap-3">
        {data.replacements.length === 0 ? (
          <p className="text-sm text-green-700 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Language is inclusive.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {data.replacements.map((r, i) => (
                <div key={i} className="bg-surface-sunken rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="line-through text-red-500 font-mono">{r.original}</span>
                    <span className="text-ink-muted">→</span>
                    <span className="text-blue-700 font-mono font-semibold">{r.replacement}</span>
                  </div>
                  <p className="text-ink-muted mt-1">{r.reason}</p>
                </div>
              ))}
            </div>
            {onApply && (
              <button
                onClick={() => onApply(data.rewritten_text)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors w-fit"
              >
                <Globe className="w-3.5 h-3.5" /> Apply inclusive version
              </button>
            )}
          </>
        )}
      </div>
    </Section>
  )
}

function ReadabilitySection({ data }: { data: ReadabilityResult }) {
  const scoreColor = data.score >= 70 ? 'text-green-700' : data.score >= 45 ? 'text-amber-700' : 'text-red-700'
  const badge = <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', data.score >= 70 ? 'bg-green-100 text-green-700' : data.score >= 45 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{data.score}/100</span>

  return (
    <Section icon="📖" title="Readability" badge={badge}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0"
            style={{ borderColor: data.score >= 70 ? '#22c55e' : data.score >= 45 ? '#f59e0b' : '#ef4444' }}>
            <span className={cn('text-base font-bold', scoreColor)}>{data.score}</span>
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{data.grade}</p>
            <p className="text-xs text-ink-muted">Avg. sentence: {data.avg_sentence_length} words</p>
          </div>
        </div>
        {data.tips.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Tips to improve</p>
            {data.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-ink-secondary">
                <span className="text-amber-500 shrink-0 mt-0.5">•</span> {tip}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

function ProfessionalSection({ data }: { data: ProfessionalResult }) {
  const vStyle = VERDICT_STYLE[data.verdict] ?? VERDICT_STYLE.could_improve
  const badge = <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', vStyle.cls)}>{vStyle.label}</span>

  return (
    <Section icon="💼" title="Professional Score" badge={badge}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center shrink-0"
            style={{ borderColor: data.overall_score >= 70 ? '#22c55e' : data.overall_score >= 45 ? '#f59e0b' : '#ef4444' }}>
            <span className="text-sm font-bold text-ink">{data.overall_score}</span>
          </div>
          <div>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', vStyle.cls)}>{vStyle.label}</span>
            <p className="text-xs text-ink-muted mt-1">{data.verdict_reason}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {([
            ['Professionalism', data.professionalism],
            ['Warmth',          data.warmth],
            ['Confidence',      data.confidence],
            ['Urgency',         data.urgency],
          ] as [string, number][]).map(([label, val]) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-ink-secondary">{label}</span>
              </div>
              <ScoreBar value={val} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── Slide-over panel ─────────────────────────────────────────────────────────

function AnalyzePanel({
  text,
  channel,
  onClose,
  onApplyText,
}: {
  text: string
  channel?: string
  onClose: () => void
  onApplyText?: (text: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  // Run analysis immediately on mount
  const run = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, channel: channel ?? 'email' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'free_limit_reached' ? 'You\'ve reached your free plan limit. Upgrade to continue.' : (data.error ?? 'Analysis failed'))
        return
      }
      setResult(data.analysis)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [text, channel])

  // Run on first render
  useState(() => { run() })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-surface-base shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-primary">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-accent" />
            <span className="font-bold text-white text-sm">Message Intelligence</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Analysing your message…</p>
                <p className="text-xs text-ink-muted mt-1">Checking grammar, compliance, inclusivity,<br />readability and professionalism</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="text-sm text-ink font-medium">{error}</p>
              <button onClick={run} className="text-xs text-primary underline underline-offset-2">Try again</button>
            </div>
          )}

          {result && !loading && (
            <>
              <GrammarSection    data={result.grammar}    onApply={onApplyText} />
              <ComplianceSection data={result.compliance} />
              <InclusiveSection  data={result.inclusive}  onApply={onApplyText} />
              <ReadabilitySection data={result.readability} />
              <ProfessionalSection data={result.professional} />
            </>
          )}
        </div>

        {/* Footer */}
        {result && !loading && (
          <div className="px-5 py-3 border-t border-surface-border bg-white flex items-center justify-between">
            <CopyButton text={text} />
            <button onClick={run} className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink transition-colors">
              <Loader2 className="w-3.5 h-3.5" /> Re-analyse
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── AnalyzeBar — the public component to embed anywhere ─────────────────────

export function AnalyzeBar({
  text,
  channel,
  onApplyText,
  className,
}: {
  text: string
  channel?: string
  onApplyText?: (text: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  if (!text?.trim()) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
          'border-surface-border bg-surface-page text-ink-secondary hover:border-primary hover:text-primary hover:bg-primary/5',
          className
        )}
        title="Check grammar, compliance, readability & more"
      >
        <Brain className="w-3.5 h-3.5" />
        Analyse
      </button>

      {open && (
        <AnalyzePanel
          text={text}
          channel={channel}
          onClose={() => setOpen(false)}
          onApplyText={onApplyText ? (t) => { onApplyText(t); setOpen(false) } : undefined}
        />
      )}
    </>
  )
}
