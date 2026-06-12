import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/card'
import { InfoChip } from '@/components/ui/badge'
import { SYSTEM_TEMPLATES } from '@/lib/templates'
import { TONE_LABELS, REPLY_TYPE_LABELS } from '@/lib/utils'
import { ReplyType, Tone } from '@/types'

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader
        title="Templates library"
        description={`${SYSTEM_TEMPLATES.length} ready-made templates — click any to open in the generator.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {SYSTEM_TEMPLATES.map((tpl, i) => (
          <Link
            key={i}
            href={`/generator?type=${tpl.reply_type}&tone=${tpl.tone}`}
            className="group bg-surface-card border border-surface-border rounded-lg shadow-card p-4 hover:border-surface-borderStrong hover:shadow-raised transition-all duration-150 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-ink group-hover:text-primary transition-colors">
                {tpl.name}
              </h3>
              <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">{tpl.prompt_snippet}</p>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              <InfoChip>{REPLY_TYPE_LABELS[tpl.reply_type as ReplyType]}</InfoChip>
              <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-surface-sunken text-ink-secondary">
                {TONE_LABELS[tpl.tone as Tone]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
