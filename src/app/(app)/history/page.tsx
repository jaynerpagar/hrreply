'use client'

import { useState } from 'react'
import { History, Search, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TONE_LABELS, REPLY_TYPE_LABELS } from '@/lib/utils'
import { ReplyType, Tone } from '@/types'

const MOCK_HISTORY = [
  {
    id: '1',
    reply_type: 'interview_invite' as ReplyType,
    tone: 'hinglish' as Tone,
    context_input: 'Priya Sharma, Sales Manager role, interview tomorrow 11am',
    generated_text: 'Hi Priya! 🙏 Aapka interview confirm ho gaya hai kal 11 baje hamare Andheri office mein. Please carry your resume and any relevant documents. Koi sawal ho toh zaroor poochh lena. All the best! 😊',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    reply_type: 'rejection' as ReplyType,
    tone: 'friendly' as Tone,
    context_input: 'Rahul Mehta, Software Engineer position, we went with another candidate',
    generated_text: "Hi Rahul, thank you so much for taking the time to interview with us for the Software Engineer role. After careful consideration, we've decided to move forward with another candidate whose experience more closely aligns with our current needs. We truly appreciate your interest and encourage you to apply for future openings that match your profile. Wishing you all the best in your job search!",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = MOCK_HISTORY.filter(
    (r) =>
      r.context_input.toLowerCase().includes(search.toLowerCase()) ||
      REPLY_TYPE_LABELS[r.reply_type].toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-orange-400" /> Reply History
        </h1>
        <p className="text-gray-400 text-sm mt-1">All your generated messages — search and reuse.</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by candidate or type..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">No replies found.</div>
        )}
        {filtered.map((reply) => (
          <div key={reply.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="blue">{REPLY_TYPE_LABELS[reply.reply_type]}</Badge>
                <Badge variant="muted">{TONE_LABELS[reply.tone]}</Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-600">
                  {new Date(reply.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={() => copy(reply.id, reply.generated_text)}
                  className="text-gray-500 hover:text-gray-200 transition-colors"
                >
                  {copiedId === reply.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-600 mb-2 truncate">Context: {reply.context_input}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{reply.generated_text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
