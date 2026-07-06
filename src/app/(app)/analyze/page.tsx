'use client'

import { useState } from 'react'
import { Brain, Mail, MessageSquare } from 'lucide-react'
import { AnalyzeBar } from '@/components/analyze'
import { cn } from '@/lib/utils'

export default function AnalyzePage() {
  const [text, setText] = useState('')
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')
  const [key, setKey] = useState(0)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-ink">Message Intelligence</h1>
        </div>
        <p className="text-sm text-ink-muted">
          Paste any HR message to check grammar, compliance, inclusive language, readability, and professional score — all in one shot.
        </p>
      </div>

      {/* Channel selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-ink-muted">Channel:</span>
        <div className="flex gap-1 bg-surface-sunken rounded-lg p-0.5">
          {([
            { value: 'email',    label: 'Email',     icon: <Mail className="w-3.5 h-3.5" /> },
            { value: 'whatsapp', label: 'WhatsApp',  icon: <MessageSquare className="w-3.5 h-3.5" /> },
          ] as const).map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setChannel(value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                channel === value ? 'bg-white shadow-sm text-ink' : 'text-ink-secondary hover:text-ink'
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-surface-border bg-surface-sunken">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wide">Your message</p>
        </div>
        <textarea
          className="w-full px-5 py-4 text-sm text-ink leading-[1.8] resize-none focus:outline-none bg-white placeholder-ink-muted"
          rows={12}
          placeholder={channel === 'email'
            ? 'Dear {{candidate_name}},\n\nWe are pleased to offer you the position of...'
            : 'Hi {{name}} 👋\n\nWe are excited to invite you for the next round...'}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="px-5 py-3 border-t border-surface-border bg-white flex items-center justify-between">
          <span className="text-xs text-ink-muted">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
          {/* Re-keying AnalyzeBar forces a new panel each "Analyze" click on the standalone page */}
          <AnalyzeBar
            key={key}
            text={text}
            channel={channel}
            onApplyText={(t) => { setText(t); setKey(k => k + 1) }}
            className="bg-primary text-white border-primary hover:bg-primary/90 hover:text-white hover:border-primary"
          />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: '✏️', label: 'Grammar', desc: 'Fix typos, tense & phrasing' },
          { icon: '⚠️', label: 'HR Compliance', desc: 'Age, gender & illegal wording' },
          { icon: '🌍', label: 'Inclusive Language', desc: 'Replace non-inclusive terms' },
          { icon: '📖', label: 'Readability', desc: 'Score 0–100 with grade' },
          { icon: '💼', label: 'Professional Score', desc: 'Warmth, confidence & more' },
          { icon: '✅', label: 'Send-ready verdict', desc: 'Go / improve / revise' },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-3 flex flex-col gap-1">
            <span className="text-lg">{icon}</span>
            <p className="text-xs font-semibold text-ink">{label}</p>
            <p className="text-[11px] text-ink-muted leading-tight">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
