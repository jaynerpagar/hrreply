'use client'

import { useState } from 'react'
import { Search, Copy, Check, Clock } from 'lucide-react'
import { PageHeader } from '@/components/ui/card'
import { InfoChip } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TONE_LABELS, REPLY_TYPE_LABELS } from '@/lib/utils'
import { ReplyType, Tone } from '@/types'

interface Reply {
  id: string
  reply_type: string
  tone: string
  context_input: string
  generated_text: string
  created_at: string
}

export default function HistoryClient({ replies }: { replies: Reply[] }) {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = replies.filter(
    (r) =>
      r.context_input.toLowerCase().includes(search.toLowerCase()) ||
      REPLY_TYPE_LABELS[r.reply_type as ReplyType]?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate or type…"
            className="w-full bg-surface-card border border-surface-borderStrong rounded pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Empty state */}
      {replies.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-12 text-center">
          <Clock className="w-8 h-8 text-ink-muted mx-auto mb-3" />
          <p className="font-semibold text-ink mb-1">No replies yet</p>
          <p className="text-sm text-ink-secondary">Generate your first reply and it will appear here.</p>
        </div>
      )}

      {/* No search results */}
      {replies.length > 0 && filtered.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-lg shadow-card p-10 text-center">
          <p className="text-ink-secondary text-sm">No replies found for &ldquo;{search}&rdquo;.</p>
        </div>
      )}

      {/* Reply list */}
      <div className="flex flex-col gap-3">
        {filtered.map((reply) => (
          <div key={reply.id} className="bg-surface-card border border-surface-border rounded-lg shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <InfoChip>{REPLY_TYPE_LABELS[reply.reply_type as ReplyType] ?? reply.reply_type}</InfoChip>
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-surface-sunken text-ink-secondary">
                  {TONE_LABELS[reply.tone as Tone] ?? reply.tone}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[13px] text-ink-muted">
                  {new Date(reply.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <Button size="sm" variant="secondary" onClick={() => copy(reply.id, reply.generated_text)}>
                  {copiedId === reply.id ? (
                    <><Check className="w-3.5 h-3.5 text-status-placed" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </Button>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] text-ink-muted mb-1.5 truncate">Context: {reply.context_input}</p>
              <p className="text-sm text-ink leading-relaxed">{reply.generated_text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
