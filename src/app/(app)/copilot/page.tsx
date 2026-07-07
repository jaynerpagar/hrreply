'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, Sparkles, Mic, MicOff, Paperclip, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'user' | 'assistant'
interface Message { role: Role; content: string }

const SUGGESTED: string[] = [
  'Can I legally ask a candidate their current or expected salary in India?',
  'Generate 10 interview questions for a Senior Product Manager role',
  'How do I politely follow up with a candidate who ghosted me?',
  'What are the notice period rules under Indian labour law?',
  'How should I handle a candidate who received a counter-offer?',
  'Draft a rejection email that keeps the door open for future roles',
  "What's the best way to discuss CTC correction after an offer is made?",
  'How do I respond to a candidate asking for remote work?',
]

export default function CopilotPage() {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [listening,  setListening]  = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const next: Message[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error — please check your connection.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function startVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input requires Chrome or Edge.'); return }
    const r = new SR()
    r.lang = 'en-IN'; r.continuous = false; r.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript) }
    r.onend  = () => setListening(false)
    r.onerror = () => setListening(false)
    setListening(true)
    r.start()
  }

  async function handlePdfUpload(file: File) {
    setPdfLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res  = await fetch('/api/extract-from-pdf', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.text) {
        const msg = `I've uploaded a document — "${data.filename ?? file.name}". Here's its content:\n\n${data.text.slice(0, 4000)}${data.text.length > 4000 ? '\n\n[Document truncated — first 4000 characters shown]' : ''}\n\nPlease help me understand or work with this document.`
        send(msg)
      }
    } catch {/* ignore */}
    setPdfLoading(false)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">HR Copilot</h1>
            <p className="text-xs text-ink-muted">Ask anything about candidate communication or Indian HR practices</p>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold text-ink-secondary hover:text-status-droppedText hover:border-status-dropped/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-4">

        {/* Empty state with suggested prompts */}
        {isEmpty && (
          <div className="flex flex-col items-center pt-10 gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <div className="text-center">
                <p className="font-bold text-ink text-lg">How can I help you today?</p>
                <p className="text-sm text-ink-muted mt-1 max-w-xs">
                  Your HR advisor for candidate communication, tricky situations, and Indian workplace context.
                </p>
              </div>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl">
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="text-left px-3.5 py-3 rounded-xl border border-surface-border bg-surface-card text-sm text-ink-secondary hover:border-primary hover:text-ink hover:bg-surface-sunken transition-all shadow-sm leading-snug"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-accent" />
              </div>
            )}
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-surface-card border border-surface-border text-ink rounded-tl-sm shadow-sm whitespace-pre-wrap'
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 pt-3 border-t border-surface-border">
        <div className="flex items-end gap-2 bg-surface-card border border-surface-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          {/* PDF upload */}
          <label className={cn('flex-shrink-0 cursor-pointer text-ink-muted hover:text-primary transition-colors', (pdfLoading || loading) && 'opacity-40 pointer-events-none')} title="Upload PDF document">
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f) }} />
          </label>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={handleKey}
            placeholder="Ask about candidate communication, ghosting, salary negotiation…"
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted resize-none focus:outline-none leading-relaxed disabled:opacity-60 max-h-40"
          />
          {/* Voice input */}
          <button
            type="button"
            onClick={listening ? () => setListening(false) : startVoice}
            disabled={loading}
            className={cn('flex-shrink-0 transition-colors disabled:opacity-40', listening ? 'text-status-droppedText' : 'text-ink-muted hover:text-primary')}
            title={listening ? 'Stop listening' : 'Voice input'}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-accent flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
        </div>
        <p className="text-center text-[11px] text-ink-muted mt-2">
          HR Copilot gives advice, not legal counsel. Use your judgement for complex situations.
        </p>
      </div>
    </div>
  )
}
