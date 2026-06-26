import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/card'
import { SYSTEM_TEMPLATES } from '@/lib/templates'
import { REPLY_TYPE_LABELS } from '@/lib/utils'
import { ReplyType, Tone } from '@/types'

const CATEGORY_META: Record<ReplyType, { icon: string; color: string; bg: string }> = {
  interview_invite:    { icon: '📅', color: 'text-primary',          bg: 'bg-primary-soft' },
  shortlist:           { icon: '✅', color: 'text-status-placedText', bg: 'bg-status-placedBg' },
  offer:               { icon: '🎉', color: 'text-accent-text',       bg: 'bg-accent-soft' },
  rejection:           { icon: '❌', color: 'text-status-droppedText',bg: 'bg-status-droppedBg' },
  reschedule:          { icon: '🔄', color: 'text-status-processText',bg: 'bg-status-processBg' },
  no_show:             { icon: '👻', color: 'text-status-processText',bg: 'bg-status-processBg' },
  follow_up:           { icon: '💬', color: 'text-primary',           bg: 'bg-primary-soft' },
  salary_negotiation:  { icon: '💰', color: 'text-accent-text',       bg: 'bg-accent-soft' },
  joining_confirmation:{ icon: '📝', color: 'text-status-placedText', bg: 'bg-status-placedBg' },
  thank_you:           { icon: '🙏', color: 'text-primary',           bg: 'bg-primary-soft' },
}

const TONE_STYLE: Record<Tone, { label: string; className: string }> = {
  formal:   { label: 'Formal',         className: 'bg-primary-soft text-primary-deep' },
  friendly: { label: 'Friendly',       className: 'bg-status-placedBg text-status-placedText' },
  hinglish: { label: 'Hinglish',       className: 'bg-accent-soft text-accent-text' },
}

// Group templates by reply_type
const grouped = SYSTEM_TEMPLATES.reduce<Record<string, typeof SYSTEM_TEMPLATES>>((acc, tpl) => {
  if (!acc[tpl.reply_type]) acc[tpl.reply_type] = []
  acc[tpl.reply_type].push(tpl)
  return acc
}, {})

// Preserve order of first occurrence
const ORDER: ReplyType[] = [
  'interview_invite', 'shortlist', 'offer', 'rejection',
  'reschedule', 'no_show', 'follow_up', 'salary_negotiation',
  'joining_confirmation', 'thank_you',
]

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader
        title="Templates library"
        description={`${SYSTEM_TEMPLATES.length} ready-made HR message templates — click any to open in the generator.`}
      />

      <div className="flex flex-col gap-8">
        {ORDER.filter(type => grouped[type]).map((type) => {
          const meta = CATEGORY_META[type] ?? { icon: '📄', color: 'text-ink', bg: 'bg-surface-sunken' }
          const label = REPLY_TYPE_LABELS[type] ?? type
          const templates = grouped[type]

          return (
            <div key={type}>
              {/* Category header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center text-base`}>
                  {meta.icon}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink">{label}</h2>
                  <p className="text-xs text-ink-muted">{templates.length} template{templates.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Template cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pl-1">
                {templates.map((tpl, i) => {
                  const tone = tpl.tone as Tone
                  const toneStyle = TONE_STYLE[tone] ?? { label: tone, className: 'bg-surface-sunken text-ink-secondary' }

                  return (
                    <Link
                      key={i}
                      href={`/generator?type=${tpl.reply_type}&tone=${tpl.tone}`}
                      className="group bg-surface-card border border-surface-border rounded-lg shadow-card p-4 hover:border-primary/40 hover:shadow-raised transition-all duration-150 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm text-ink group-hover:text-primary transition-colors leading-snug">
                          {tpl.name}
                        </h3>
                        <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                      </div>

                      <p className="text-xs text-ink-secondary leading-relaxed flex-1">
                        {tpl.prompt_snippet}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${toneStyle.className}`}>
                          {toneStyle.label}
                        </span>
                        <span className="text-[11px] text-ink-muted group-hover:text-primary transition-colors font-medium">
                          Use template →
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
