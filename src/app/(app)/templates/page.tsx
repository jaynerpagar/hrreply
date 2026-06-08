import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SYSTEM_TEMPLATES } from '@/lib/templates'
import { TONE_LABELS, REPLY_TYPE_LABELS } from '@/lib/utils'
import { ReplyType, Tone } from '@/types'

const CATEGORY_COLORS: Record<string, 'green' | 'blue' | 'orange' | 'yellow' | 'muted'> = {
  offer: 'green',
  rejection: 'red' as 'muted',
  shortlist: 'blue',
  interview_invite: 'blue',
  reschedule: 'yellow',
  no_show: 'orange',
  follow_up: 'muted',
  salary_negotiation: 'orange',
  joining_confirmation: 'green',
  thank_you: 'blue',
}

export default function TemplatesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" /> Templates Library
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {SYSTEM_TEMPLATES.length} ready-made templates — click any to open in the generator.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SYSTEM_TEMPLATES.map((tpl, i) => (
          <Link
            key={i}
            href={`/generator?type=${tpl.reply_type}&tone=${tpl.tone}`}
            className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-200 group-hover:text-white transition-colors">
                {tpl.name}
              </h3>
              <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-green-400 shrink-0 mt-0.5 transition-colors" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{tpl.prompt_snippet}</p>
            <div className="flex gap-1.5 mt-1">
              <Badge variant={CATEGORY_COLORS[tpl.reply_type] ?? 'muted'}>
                {REPLY_TYPE_LABELS[tpl.reply_type as ReplyType]}
              </Badge>
              <Badge variant="muted">{TONE_LABELS[tpl.tone as Tone]}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
