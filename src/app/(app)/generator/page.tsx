'use client'

import { useState } from 'react'
import { Wand2, Copy, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tone, ReplyType } from '@/types'
import { TONE_LABELS, REPLY_TYPE_LABELS, cn } from '@/lib/utils'

const TONES: Tone[] = ['formal', 'friendly', 'hinglish']
const REPLY_TYPES = Object.entries(REPLY_TYPE_LABELS) as [ReplyType, string][]

export default function GeneratorPage() {
  const [replyType, setReplyType] = useState<ReplyType>('interview_invite')
  const [tone, setTone] = useState<Tone>('friendly')
  const [contextInput, setContextInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!contextInput.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_type: replyType, tone, context_input: contextInput }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'free_limit_reached') {
          setError('You have reached your 50 free replies. Upgrade to Pro for unlimited replies.')
        } else {
          setError(data.error ?? 'Something went wrong')
        }
        return
      }
      setOutput(data.generated_text)
    } catch {
      setError('Network error — please try again')
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
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-green-400" /> Reply Generator
        </h1>
        <p className="text-gray-400 text-sm mt-1">Fill in the details — get the perfect message instantly.</p>
      </div>

      <div className="space-y-5">
        {/* Reply type */}
        <div>
          <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
            Reply Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REPLY_TYPES.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setReplyType(val)}
                className={cn(
                  'text-left px-3 py-2 rounded-lg border text-sm transition-colors',
                  replyType === val
                    ? 'border-green-500/60 bg-green-500/10 text-green-400'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
            Tone
          </label>
          <div className="flex gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={cn(
                  'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                  tone === t
                    ? 'border-green-500/60 bg-green-500/10 text-green-400'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                )}
              >
                {TONE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div>
          <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
            Candidate Context
          </label>
          <textarea
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            rows={5}
            placeholder={
              'e.g. Priya Sharma, applying for Sales Manager at Mumbai office. Interview scheduled for tomorrow 11am at Andheri HQ. She confirmed yesterday. Position: 8LPA CTC.'
            }
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 resize-none"
          />
        </div>

        <Button onClick={generate} disabled={loading || !contextInput.trim()} size="lg" className="w-full">
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" /> Generate Reply
            </>
          )}
        </Button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {output && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Generated Reply</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={generate}>
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </Button>
                <Button size="sm" variant="secondary" onClick={copy}>
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </Button>
              </div>
            </div>
            <div className="px-4 py-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
