'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Copy, Check, RefreshCw, Pencil, Mail, MessageCircle,
  Smartphone, Link2, Hash, LayoutGrid, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/card'
import { UpsellModal } from '@/components/ui/upsell-modal'
import { Tone, ReplyType, Language, MessageFormat, RewriteStyle, SubjectLine } from '@/types'
import {
  TONE_LABELS, REPLY_TYPE_LABELS, LANGUAGE_LABELS, FORMAT_LABELS, REWRITE_LABELS, cn,
} from '@/lib/utils'

const TONES: Tone[] = ['formal', 'friendly', 'hinglish']
const LANGUAGES: Language[] = ['english', 'hindi', 'marathi', 'tamil', 'telugu', 'gujarati', 'bengali']
const FORMATS: MessageFormat[] = ['email', 'whatsapp', 'sms', 'linkedin', 'slack', 'teams']
const REWRITE_STYLES: RewriteStyle[] = [
  'shorter', 'longer', 'professional', 'friendly', 'polite',
  'stronger', 'softer', 'simple', 'corporate', 'startup',
]
const REPLY_TYPES = Object.entries(REPLY_TYPE_LABELS) as [ReplyType, string][]

const FORMAT_ICONS: Record<MessageFormat, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  whatsapp: <MessageCircle className="w-3.5 h-3.5" />,
  sms: <Smartphone className="w-3.5 h-3.5" />,
  linkedin: <Link2 className="w-3.5 h-3.5" />,
  slack: <Hash className="w-3.5 h-3.5" />,
  teams: <LayoutGrid className="w-3.5 h-3.5" />,
}

const FORMAT_PLACEHOLDERS: Record<MessageFormat, string> = {
  email: 'e.g. Priya Sharma, Sales Manager role at Delhi office. Interview on 20th Jan, 11am at Connaught Place HQ. Panel: 3 rounds.',
  whatsapp: 'e.g. Rahul rejected for frontend role. Keep it warm and brief — we want to stay in touch.',
  sms: 'e.g. Remind Ananya — interview tomorrow 2pm, Google Meet link sent to her email.',
  linkedin: 'e.g. Vikram applied for Product Manager. Shortlisted. First round is with team lead this week.',
  slack: 'e.g. Remind the team: Seema joins Monday as Design Lead. First day onboarding at 10am.',
  teams: 'e.g. Collecting documents from Arjun before his joining date next week. Need Aadhaar and last payslip.',
}

function GeneratorContent() {
  const searchParams = useSearchParams()
  const [format, setFormat] = useState<MessageFormat>('email')
  const [replyType, setReplyType] = useState<ReplyType>(
    (searchParams.get('type') as ReplyType) || 'interview_invite'
  )
  const [language, setLanguage] = useState<Language>('english')
  const [tone, setTone] = useState<Tone>('friendly')
  const [contextInput, setContextInput] = useState('')
  const [output, setOutput] = useState('')
  const [outputFresh, setOutputFresh] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState<RewriteStyle | null>(null)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [showUpsell, setShowUpsell] = useState(false)
  const [subjectLines, setSubjectLines] = useState<SubjectLine[]>([])
  const [subjectLoading, setSubjectLoading] = useState(false)
  const [copiedSubject, setCopiedSubject] = useState<number | null>(null)
  const rewriteScrollRef = useRef<HTMLDivElement>(null)

  // When language changes to non-English, reset Hinglish tone to friendly
  useEffect(() => {
    if (language !== 'english' && tone === 'hinglish') setTone('friendly')
  }, [language, tone])

  // Fresh highlight fades after 3s
  useEffect(() => {
    if (!outputFresh) return
    const t = setTimeout(() => setOutputFresh(false), 3000)
    return () => clearTimeout(t)
  }, [outputFresh])

  // Reset subject lines when inputs change
  useEffect(() => {
    setSubjectLines([])
  }, [contextInput, replyType, format])

  async function generate() {
    if (!contextInput.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    setEditing(false)
    setSubjectLines([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply_type: replyType,
          tone,
          context_input: contextInput,
          format,
          language,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'free_limit_reached') setShowUpsell(true)
        else setError(data.error ?? 'Something went wrong — please try again.')
        return
      }
      setOutput(data.generated_text)
      setOutputFresh(true)
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function rewrite(style: RewriteStyle) {
    if (!output.trim() || rewriteLoading) return
    setRewriteLoading(style)
    setEditing(false)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: output, style }),
      })
      const data = await res.json()
      if (res.ok) {
        setOutput(data.rewritten_text)
        setOutputFresh(true)
      }
    } catch {
      // silent fail — output stays as-is
    } finally {
      setRewriteLoading(null)
    }
  }

  async function generateSubjectLines() {
    if (!contextInput.trim()) return
    setSubjectLoading(true)
    try {
      const res = await fetch('/api/subject-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_input: contextInput, reply_type: replyType }),
      })
      const data = await res.json()
      if (res.ok) setSubjectLines(data.subject_lines)
    } catch {
      // silent fail
    } finally {
      setSubjectLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copySubject(idx: number, subject: string) {
    navigator.clipboard.writeText(subject)
    setCopiedSubject(idx)
    setTimeout(() => setCopiedSubject(null), 2000)
  }

  const urgencyColor = (u: string) =>
    u === 'High' ? 'text-status-droppedText bg-status-droppedBg' :
    u === 'Medium' ? 'text-status-processText bg-status-processBg' :
    'text-status-placedText bg-status-placedBg'

  return (
    <div>
      <UpsellModal open={showUpsell} onClose={() => setShowUpsell(false)} reason="limit_reached" />
      <PageHeader
        title="Reply generator"
        description="Pick a format, choose your message type, and describe the situation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── LEFT PANE ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-5 flex flex-col gap-5">

            {/* Format selector */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">Format</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 px-1 rounded border text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      format === f
                        ? 'border-primary bg-primary text-ink-inverse'
                        : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                    )}
                  >
                    {FORMAT_ICONS[f]}
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-surface-border" />

            {/* Reply type */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">Message type</p>
              <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                {REPLY_TYPES.map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setReplyType(val)}
                    className={cn(
                      'text-left px-3 py-2 rounded border text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      replyType === val
                        ? 'border-accent bg-accent text-primary font-semibold'
                        : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-surface-border" />

            {/* Language */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">Language</p>
              <div className="flex gap-1.5 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      'px-3 py-1.5 rounded border text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      language === lang
                        ? 'border-primary bg-primary text-ink-inverse'
                        : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                    )}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone — hidden when non-English language selected */}
            {language === 'english' && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">Tone</p>
                <div className="flex gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        'flex-1 py-2 rounded border text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        tone === t
                          ? 'border-primary bg-primary-soft text-primary-deep'
                          : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                      )}
                    >
                      {TONE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Context */}
            <Textarea
              label="Situation details"
              rows={5}
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder={FORMAT_PLACEHOLDERS[format]}
            />
          </div>

          {/* Generate — mobile */}
          <div className="lg:hidden flex justify-end">
            <GenerateButton loading={loading} disabled={!contextInput.trim()} onClick={generate} />
          </div>
        </div>

        {/* ── RIGHT PANE ── */}
        <div className="flex flex-col gap-4">

          {/* Generate — desktop */}
          <div className="hidden lg:flex justify-end">
            <GenerateButton loading={loading} disabled={!contextInput.trim()} onClick={generate} />
          </div>

          {error && (
            <div className="bg-status-droppedBg border border-status-dropped/30 rounded px-4 py-3 text-sm text-status-droppedText">
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-5 flex items-center gap-3 text-ink-muted text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" /> Drafting your {FORMAT_LABELS[format]} message…
            </div>
          )}

          {output && !loading && (
            <div className="bg-surface-card border border-surface-border rounded-lg shadow-card overflow-hidden">
              {/* Output text */}
              <div
                className={cn(
                  'p-5 transition-colors duration-700',
                  outputFresh ? 'bg-accent-soft' : 'bg-surface-sunken'
                )}
              >
                {editing ? (
                  <textarea
                    value={output}
                    onChange={(e) => setOutput(e.target.value)}
                    onBlur={() => setEditing(false)}
                    rows={8}
                    className="w-full bg-transparent text-ink text-base leading-[1.7] resize-none focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-ink text-base leading-[1.7] whitespace-pre-wrap">{output}</p>
                )}
                <p className={cn('text-xs mt-3', outputFresh ? 'text-accent-text' : 'text-ink-muted')}>
                  {outputFresh ? 'AI draft — review before sending' : 'Edited by you'}
                </p>
              </div>

              {/* Rewrite buttons */}
              <div className="border-t border-surface-border px-4 py-3">
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest mb-2">Rewrite</p>
                <div ref={rewriteScrollRef} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {REWRITE_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => rewrite(style)}
                      disabled={!!rewriteLoading}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        rewriteLoading === style
                          ? 'border-primary bg-primary text-ink-inverse'
                          : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed'
                      )}
                    >
                      {rewriteLoading === style && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {REWRITE_LABELS[style]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action bar */}
              <div className="px-5 py-3 border-t border-surface-border flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={copy}>
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setEditing(true); setOutputFresh(false) }}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ai" onClick={generate} className="ml-auto">
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* Subject line generator — only for email */}
          {output && !loading && format === 'email' && (
            <div className="bg-surface-card border border-surface-border rounded-lg shadow-card overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-surface-border">
                <div>
                  <p className="text-sm font-semibold text-ink">Subject lines</p>
                  <p className="text-xs text-ink-muted mt-0.5">AI-generated with open rate prediction</p>
                </div>
                <Button
                  size="sm"
                  variant="ai"
                  onClick={generateSubjectLines}
                  disabled={subjectLoading}
                >
                  {subjectLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Generate</>
                  }
                </Button>
              </div>

              {subjectLines.length > 0 && (
                <div className="divide-y divide-surface-border">
                  {subjectLines.map((s, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3 group hover:bg-surface-sunken transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink font-medium leading-snug">{s.subject}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-ink-muted">Score: <span className="font-semibold text-ink">{s.professional_score}/10</span></span>
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', urgencyColor(s.urgency))}>{s.urgency}</span>
                          <span className="text-xs text-ink-muted">~{s.open_rate}% open rate</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copySubject(i, s.subject)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-ink-muted hover:text-ink px-2 py-1 rounded border border-surface-border bg-surface-page"
                      >
                        {copiedSubject === i ? <><Check className="w-3 h-3 text-accent-icon" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {subjectLines.length === 0 && !subjectLoading && (
                <div className="px-5 py-6 text-center text-sm text-ink-muted">
                  Click <span className="font-medium text-ink">Generate</span> to get 5 subject line options with scores
                </div>
              )}
            </div>
          )}

          {!output && !loading && !error && (
            <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-10 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-ink-secondary text-sm">
                Fill in the context and click <span className="font-medium text-ink">Generate reply</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GenerateButton({
  loading, disabled, onClick,
}: { loading: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <div className="relative">
      {!loading && !disabled && (
        <span className="absolute inset-0 rounded animate-ping bg-accent opacity-30 pointer-events-none" />
      )}
      <Button variant="ai" size="md" onClick={onClick} disabled={loading || disabled}>
        {loading ? 'Generating…' : 'Generate reply'}
      </Button>
    </div>
  )
}

export default function GeneratorPage() {
  return (
    <Suspense>
      <GeneratorContent />
    </Suspense>
  )
}
