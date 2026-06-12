'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, RefreshCw, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/card'
import { Tone, ReplyType } from '@/types'
import { TONE_LABELS, REPLY_TYPE_LABELS, cn } from '@/lib/utils'

const TONES: Tone[] = ['formal', 'friendly', 'hinglish']
const REPLY_TYPES = Object.entries(REPLY_TYPE_LABELS) as [ReplyType, string][]

export default function GeneratorPage() {
  const [replyType, setReplyType] = useState<ReplyType>('interview_invite')
  const [tone, setTone] = useState<Tone>('friendly')
  const [contextInput, setContextInput] = useState('')
  const [output, setOutput] = useState('')
  const [outputFresh, setOutputFresh] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  // After 3 seconds, transition the AI output background from accent-soft to sunken
  useEffect(() => {
    if (!outputFresh) return
    const t = setTimeout(() => setOutputFresh(false), 3000)
    return () => clearTimeout(t)
  }, [outputFresh])

  async function generate() {
    if (!contextInput.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    setEditing(false)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_type: replyType, tone, context_input: contextInput }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(
          data.error === 'free_limit_reached'
            ? 'You have used all 50 free replies this month. Upgrade to Pro for unlimited replies.'
            : (data.error ?? 'Something went wrong — please try again.')
        )
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

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <PageHeader
        title="Reply generator"
        description="Fill in the context on the left — the AI drafts your message on the right."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── LEFT PANE: context input ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-ink">Candidate context</h2>

            {/* Reply type */}
            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Reply type</p>
              <div className="grid grid-cols-2 gap-1.5">
                {REPLY_TYPES.map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setReplyType(val)}
                    className={cn(
                      'text-left px-3 py-2 rounded border text-sm transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      replyType === val
                        ? 'border-primary bg-primary-soft text-primary-deep font-medium'
                        : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Tone</p>
              <div className="flex gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      'flex-1 py-2 rounded border text-sm font-medium transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
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

            {/* Context */}
            <Textarea
              label="Situation details"
              rows={6}
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder="e.g. Priya Sharma, applying for Sales Manager at Mumbai office. Interview scheduled for tomorrow 11am at Andheri HQ. She confirmed yesterday. CTC: ₹8L."
            />
          </div>

          {/* Generate button — mobile shows here, desktop shows at top of right pane */}
          <div className="lg:hidden">
            <Button
              variant="ai"
              size="lg"
              className="w-full"
              onClick={generate}
              disabled={loading || !contextInput.trim()}
            >
              {loading ? 'Generating…' : 'Generate reply'}
            </Button>
          </div>
        </div>

        {/* ── RIGHT PANE: generated output ── */}
        <div className="flex flex-col gap-4">
          {/* Generate button — desktop only */}
          <div className="hidden lg:block">
            <Button
              variant="ai"
              size="lg"
              className="w-full"
              onClick={generate}
              disabled={loading || !contextInput.trim()}
            >
              {loading ? 'Generating…' : 'Generate reply'}
            </Button>
          </div>

          {error && (
            <div className="bg-status-droppedBg border border-status-dropped/30 rounded px-4 py-3 text-sm text-status-droppedText">
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-5 flex items-center gap-3 text-ink-muted text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" /> Drafting your reply…
            </div>
          )}

          {output && !loading && (
            <div className="bg-surface-card border border-surface-border rounded-lg shadow-card overflow-hidden">
              {/* Well */}
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

              {/* Actions */}
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

          {!output && !loading && !error && (
            <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-10 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-ink-secondary text-sm">Fill in the context and click <span className="font-medium text-ink">Generate reply</span> to get your draft.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
