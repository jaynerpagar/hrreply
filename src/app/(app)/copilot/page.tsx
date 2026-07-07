'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, Sparkles, Mic, MicOff, Paperclip, Loader2, Copy, Check, HelpCircle } from 'lucide-react'
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

const FAQ_CHIPS: string[] = [
  'What is the work mode (remote/hybrid/office)?',
  'What is the notice period required?',
  'What is the salary range for this role?',
  'What are the benefits and perks?',
  'Where is the office located?',
  'What does the interview process look like?',
  'How long does the hiring decision take?',
  'Is relocation assistance provided?',
]

// ── FAQ Tab (#77 Candidate FAQ Auto-Reply) ────────────────────────────────────

function FAQTab() {
  const [companyContext, setCompanyContext] = useState('')
  const [question,       setQuestion]      = useState('')
  const [answer,         setAnswer]        = useState('')
  const [loading,        setLoading]       = useState(false)
  const [copied,         setCopied]        = useState(false)
  const [error,          setError]         = useState('')

  async function generate() {
    if (!question.trim()) return
    setLoading(true); setError(''); setAnswer('')
    try {
      const res  = await fetch('/api/faq-generator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, companyContext }),
      })
      const data = await res.json()
      if (res.ok) setAnswer(data.answer)
      else setError(data.error ?? 'Something went wrong')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  function copy() {
    navigator.clipboard.writeText(answer)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
      {/* Company context */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">Company context <span className="font-normal normal-case">(optional — improves answers)</span></p>
        <textarea
          rows={4}
          value={companyContext}
          onChange={e => setCompanyContext(e.target.value)}
          placeholder={"Work mode: Hybrid (3 days office, 2 days WFH)\nLocation: Bangalore, HSR Layout\nNotice period: 30 days or buyout negotiable\nBenefits: Health insurance, 18 days PL, ESOPs after 1 year\nInterview rounds: 2 technical + 1 HR"}
          className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
        />
      </div>

      {/* FAQ chips */}
      <div>
        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">Common questions</p>
        <div className="flex flex-wrap gap-2">
          {FAQ_CHIPS.map(q => (
            <button key={q} onClick={() => setQuestion(q)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all',
                question === q
                  ? 'border-primary bg-primary-soft text-primary-deep font-semibold'
                  : 'border-surface-border text-ink-secondary hover:border-primary hover:text-ink bg-surface-card'
              )}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Question input */}
      <div>
        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">Or type a custom question</p>
        <textarea
          rows={2}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder='e.g. "Do you offer stock options?" or "Can I work remotely full-time?"'
          className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm text-ink bg-surface-card placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
        />
        <button
          onClick={generate}
          disabled={!question.trim() || loading}
          className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</> : <><HelpCircle className="w-3.5 h-3.5" />Generate answer</>}
        </button>
      </div>

      {error && <p className="text-sm text-status-droppedText bg-status-droppedBg rounded-lg px-3 py-2">{error}</p>}

      {/* Answer output */}
      {answer && (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Candidate FAQ answer</p>
            <button onClick={copy} className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all',
              copied ? 'border-accent bg-accent-soft text-accent-text' : 'border-surface-border text-ink-muted hover:text-primary'
            )}>
              {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
            </button>
          </div>
          <div className="p-4 bg-accent-soft">
            <p className="text-sm text-ink leading-relaxed">{answer}</p>
          </div>
          <div className="px-4 py-2 bg-surface-page border-t border-surface-border">
            <p className="text-[11px] text-ink-muted">💡 Paste this directly into WhatsApp, email, or LinkedIn — no editing needed.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Chat component ────────────────────────────────────────────────────────────

export default function CopilotPage() {
  const [tab,        setTab]        = useState<'chat' | 'faq'>('chat')
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
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">HR Copilot</h1>
            <p className="text-xs text-ink-muted">Ask anything about candidate communication or Indian HR practices</p>
          </div>
        </div>
        {tab === 'chat' && !isEmpty && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold text-ink-secondary hover:text-status-droppedText hover:border-status-dropped/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface-sunken border border-surface-border rounded-xl mb-4 w-fit shrink-0">
        <button onClick={() => setTab('chat')} className={cn(
          'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
          tab === 'chat' ? 'bg-surface-card text-ink shadow-sm border border-surface-border' : 'text-ink-muted hover:text-ink'
        )}>
          <Bot className="w-3.5 h-3.5" /> AI Chat
        </button>
        <button onClick={() => setTab('faq')} className={cn(
          'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
          tab === 'faq' ? 'bg-surface-card text-ink shadow-sm border border-surface-border' : 'text-ink-muted hover:text-ink'
        )}>
          <HelpCircle className="w-3.5 h-3.5" /> Candidate FAQ
        </button>
      </div>

      {/* FAQ tab */}
      {tab === 'faq' && <FAQTab />}

      {/* Messages area */}
      {tab === 'chat' && <div className="flex-1 overflow-y-auto pb-4 space-y-4">

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
      </div>}

      {/* Input area — chat only */}
      {tab === 'chat' && <div className="shrink-0 pt-3 border-t border-surface-border">
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
      </div>}
    </div>
  )
}
