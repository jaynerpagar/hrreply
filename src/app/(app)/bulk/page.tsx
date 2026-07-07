'use client'

import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, ChevronRight, Loader2,
  Copy, Check, Download, Languages, AlertTriangle, Info,
  Sparkles, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { REPLY_TYPE_LABELS, FORMAT_LABELS, LANGUAGE_LABELS } from '@/lib/utils'
import type { ReplyType, Tone, MessageFormat, Language } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  name: string
  role: string
  company?: string
  skills?: string
  experience?: string
  notice_period?: string
  phone?: string
  notes?: string
}

interface GeneratedResult {
  candidate: ParsedRow
  message: string
  translated?: string
  error?: string
  copying?: boolean
  copied?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPLY_TYPES = Object.entries(REPLY_TYPE_LABELS) as [ReplyType, string][]
const TONES: { value: Tone; label: string }[] = [
  { value: 'formal',   label: 'Formal'   },
  { value: 'friendly', label: 'Friendly' },
  { value: 'hinglish', label: 'Hinglish' },
]
const FORMATS = Object.entries(FORMAT_LABELS) as [MessageFormat, string][]
const TRANSLATE_LANGS: { value: Language; label: string }[] = [
  { value: 'hindi',    label: 'Hindi (हिंदी)'       },
  { value: 'marathi',  label: 'Marathi (मराठी)'     },
  { value: 'tamil',    label: 'Tamil (தமிழ்)'       },
  { value: 'telugu',   label: 'Telugu (తెలుగు)'     },
  { value: 'gujarati', label: 'Gujarati (ગુજરાતી)'  },
  { value: 'bengali',  label: 'Bengali (বাংলা)'     },
]

// Column aliases for auto-detection (lowercase)
const COL_ALIASES: Record<keyof ParsedRow, string[]> = {
  name:          ['name', 'candidate name', 'full name', 'candidate', 'applicant'],
  role:          ['role', 'job title', 'position', 'role applied', 'applying for', 'designation'],
  company:       ['company', 'current company', 'employer', 'organization', 'organisation'],
  skills:        ['skills', 'skill set', 'key skills', 'competencies', 'technologies'],
  experience:    ['experience', 'years of experience', 'exp', 'total experience'],
  notice_period: ['notice period', 'notice', 'availability', 'joining time'],
  phone:         ['phone', 'mobile', 'contact', 'phone number', 'mobile number'],
  notes:         ['notes', 'context', 'additional info', 'remarks', 'comments', 'extra'],
}

function detectColumn(headers: string[], field: keyof ParsedRow): string | undefined {
  const lower = headers.map(h => h.toLowerCase().trim())
  for (const alias of COL_ALIASES[field]) {
    const idx = lower.indexOf(alias)
    if (idx !== -1) return headers[idx]
  }
  return undefined
}

function buildBulkContext(row: ParsedRow, index: number, total: number, extra: string): string {
  const parts: string[] = [
    `Candidate: ${row.name}`,
    `Role applied: ${row.role}`,
  ]
  if (row.company)       parts.push(`Current company: ${row.company}`)
  if (row.experience)    parts.push(`Experience: ${row.experience}`)
  if (row.skills)        parts.push(`Skills: ${row.skills}`)
  if (row.notice_period) parts.push(`Notice period: ${row.notice_period}`)
  if (row.notes)         parts.push(`Additional context: ${row.notes}`)
  if (extra.trim())      parts.push(`Recruiter note: ${extra.trim()}`)
  parts.push(`[Candidate ${index + 1} of ${total} — vary your opening and structure uniquely for this person]`)
  return parts.join('\n')
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', active ? 'text-ink' : done ? 'text-ink-muted' : 'text-ink-muted/40')}>
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        active ? 'bg-primary text-white' : done ? 'bg-accent text-primary' : 'bg-surface-border text-ink-muted'
      )}>
        {done ? <Check className="w-3.5 h-3.5" /> : n}
      </div>
      <span className="text-sm font-medium hidden sm:block">{label}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BulkPage() {
  // Step 1 — upload
  const [rows, setRows]           = useState<ParsedRow[]>([])
  const [fileName, setFileName]   = useState('')
  const [parseError, setParseError] = useState('')
  const [dragging, setDragging]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 2 — configure
  const [replyType, setReplyType] = useState<ReplyType>('interview_invite')
  const [tone, setTone]           = useState<Tone>('formal')
  const [format, setFormat]       = useState<MessageFormat>('email')
  const [extraCtx, setExtraCtx]   = useState('')

  // Step 3 — results
  const [results, setResults]     = useState<GeneratedResult[]>([])
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
  const [genError, setGenError]   = useState('')

  // Translation
  const [translateLang, setTranslateLang] = useState<Language>('hindi')
  const [translating, setTranslating]     = useState(false)
  const [translateError, setTranslateError] = useState('')

  const step = rows.length === 0 ? 1 : results.length === 0 && !generating ? 2 : 3

  // ── File parsing ─────────────────────────────────────────────────────────

  const parseFile = useCallback((file: File) => {
    setParseError('')
    setRows([])
    setResults([])
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (raw.length === 0) { setParseError('The file appears to be empty.'); return }

        const headers = Object.keys(raw[0])
        const nameCol    = detectColumn(headers, 'name')
        const roleCol    = detectColumn(headers, 'role')

        if (!nameCol || !roleCol) {
          setParseError(`Could not find required columns. Need a "Name" column and a "Role" column. Found: ${headers.join(', ')}`)
          return
        }

        const companyCol   = detectColumn(headers, 'company')
        const skillsCol    = detectColumn(headers, 'skills')
        const expCol       = detectColumn(headers, 'experience')
        const noticeCol    = detectColumn(headers, 'notice_period')
        const phoneCol     = detectColumn(headers, 'phone')
        const notesCol     = detectColumn(headers, 'notes')

        const parsed: ParsedRow[] = raw
          .filter(r => r[nameCol]?.trim() && r[roleCol]?.trim())
          .slice(0, 100)
          .map(r => ({
            name:          String(r[nameCol]).trim(),
            role:          String(r[roleCol]).trim(),
            company:       companyCol   ? String(r[companyCol]).trim()   || undefined : undefined,
            skills:        skillsCol    ? String(r[skillsCol]).trim()    || undefined : undefined,
            experience:    expCol       ? String(r[expCol]).trim()       || undefined : undefined,
            notice_period: noticeCol    ? String(r[noticeCol]).trim()    || undefined : undefined,
            phone:         phoneCol     ? String(r[phoneCol]).trim()     || undefined : undefined,
            notes:         notesCol     ? String(r[notesCol]).trim()     || undefined : undefined,
          }))

        if (parsed.length === 0) {
          setParseError('No valid rows found. Make sure Name and Role are filled.')
          return
        }

        setRows(parsed)
      } catch {
        setParseError('Could not read the file. Please export as .xlsx or .csv and try again.')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  // ── Generate ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true); setGenError(''); setResults([])
    setGenProgress(0)

    const total = rows.length
    const output: GeneratedResult[] = rows.map(r => ({ candidate: r, message: '', error: undefined }))

    const BATCH = 3
    for (let i = 0; i < total; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      await Promise.all(batch.map(async (row, bi) => {
        const idx = i + bi
        const contextInput = buildBulkContext(row, idx, total, extraCtx)
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply_type: replyType, tone, context_input: contextInput, format }),
          })
          const data = await res.json()
          if (!res.ok) {
            output[idx] = { ...output[idx], error: data.error === 'free_limit_reached' ? 'Quota reached — upgrade to Pro to generate more' : (data.error ?? 'Failed') }
          } else {
            output[idx] = { ...output[idx], message: data.generated_text }
          }
        } catch {
          output[idx] = { ...output[idx], error: 'Network error' }
        }
        setGenProgress(prev => prev + 1)
        setResults([...output])
      }))
    }

    setGenerating(false)
  }

  // ── Copy ──────────────────────────────────────────────────────────────────

  function copyMessage(idx: number, text: string) {
    navigator.clipboard.writeText(text)
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, copied: true } : r))
    setTimeout(() => setResults(prev => prev.map((r, i) => i === idx ? { ...r, copied: false } : r)), 2000)
  }

  // ── Translate ─────────────────────────────────────────────────────────────

  async function handleTranslate() {
    const messages = results.filter(r => r.message).map(r => r.message)
    if (messages.length === 0) return
    setTranslating(true); setTranslateError('')
    try {
      const res = await fetch('/api/bulk-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, targetLanguage: translateLang }),
      })
      const data = await res.json()
      if (!res.ok) { setTranslateError(data.error ?? 'Translation failed'); return }
      const translated: string[] = data.translated
      let ti = 0
      setResults(prev => prev.map(r => {
        if (!r.message) return r
        const t = translated[ti++]
        return { ...r, translated: t }
      }))
    } catch { setTranslateError('Network error') }
    finally { setTranslating(false) }
  }

  // ── Download CSV ──────────────────────────────────────────────────────────

  function downloadCSV() {
    const headers = ['Name', 'Role', 'Company', 'Message', 'Translated']
    const csvRows = [
      headers.join(','),
      ...results.map(r => [
        `"${r.candidate.name.replace(/"/g, '""')}"`,
        `"${r.candidate.role.replace(/"/g, '""')}"`,
        `"${(r.candidate.company ?? '').replace(/"/g, '""')}"`,
        `"${(r.message ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(r.translated ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ].join(',')),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'bulk-messages.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const successCount = results.filter(r => r.message).length
  const errorCount   = results.filter(r => r.error).length
  const hasResults   = results.length > 0
  const hasTranslated = results.some(r => r.translated)

  const inputCls = 'w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div className="px-6 py-6 flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-ink">Bulk Messages</h1>
        </div>
        <p className="text-sm text-ink-muted">Upload a spreadsheet → generate personalised messages → translate — all at once</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3">
        <Step n={1} label="Upload"    active={step === 1} done={step > 1} />
        <ChevronRight className="w-4 h-4 text-ink-muted/40 shrink-0" />
        <Step n={2} label="Configure" active={step === 2} done={step > 2} />
        <ChevronRight className="w-4 h-4 text-ink-muted/40 shrink-0" />
        <Step n={3} label="Results"   active={step === 3} done={false} />
      </div>

      {/* ── Step 1: Upload ─────────────────────────────────────────────────── */}
      <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-ink">Step 1 — Upload spreadsheet</p>
          </div>
          {rows.length > 0 && (
            <button onClick={() => { setRows([]); setResults([]); setFileName('') }}
              className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {rows.length === 0 ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors',
                  dragging ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50 hover:bg-surface-sunken'
                )}
              >
                <FileSpreadsheet className={cn('w-10 h-10', dragging ? 'text-primary' : 'text-ink-muted')} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-ink">Drop your Excel or CSV file here</p>
                  <p className="text-xs text-ink-muted mt-1">or click to browse · .xlsx, .xls, .csv supported · max 100 rows</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />

              {/* Format guide */}
              <div className="bg-surface-sunken rounded-lg p-4 flex gap-3">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-ink mb-1">Expected columns</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    <span className="font-medium text-ink">Required:</span> <code className="bg-surface-border rounded px-1">Name</code>, <code className="bg-surface-border rounded px-1">Role</code>&nbsp;
                    · <span className="font-medium text-ink">Optional:</span> <code className="bg-surface-border rounded px-1">Company</code>, <code className="bg-surface-border rounded px-1">Skills</code>, <code className="bg-surface-border rounded px-1">Experience</code>, <code className="bg-surface-border rounded px-1">Notice Period</code>, <code className="bg-surface-border rounded px-1">Phone</code>, <code className="bg-surface-border rounded px-1">Notes</code>
                  </p>
                  <p className="text-xs text-ink-muted mt-1">Column names are detected automatically — common variations like &quot;Full Name&quot;, &quot;Job Title&quot;, &quot;Current Company&quot; all work.</p>
                </div>
              </div>

              {parseError && (
                <div className="flex gap-2 bg-status-droppedBg rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-status-droppedText shrink-0 mt-0.5" />
                  <p className="text-sm text-status-droppedText">{parseError}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              {/* File badge */}
              <div className="flex items-center gap-2 bg-accent-soft rounded-lg px-4 py-3">
                <FileSpreadsheet className="w-4 h-4 text-accent-text" />
                <p className="text-sm font-semibold text-ink flex-1">{fileName}</p>
                <span className="text-xs font-bold text-accent-text bg-white/50 px-2 py-0.5 rounded-full">{rows.length} candidates</span>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-lg border border-surface-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-sunken border-b border-surface-border">
                      <th className="px-3 py-2 text-left font-medium text-ink-muted">#</th>
                      <th className="px-3 py-2 text-left font-medium text-ink-muted">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-ink-muted">Role</th>
                      <th className="px-3 py-2 text-left font-medium text-ink-muted hidden sm:table-cell">Company</th>
                      <th className="px-3 py-2 text-left font-medium text-ink-muted hidden md:table-cell">Skills</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-surface-sunken/50">
                        <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-ink">{r.name}</td>
                        <td className="px-3 py-2 text-ink-secondary">{r.role}</td>
                        <td className="px-3 py-2 text-ink-muted hidden sm:table-cell">{r.company ?? '—'}</td>
                        <td className="px-3 py-2 text-ink-muted hidden md:table-cell truncate max-w-[160px]">{r.skills ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && (
                  <p className="px-3 py-2 text-xs text-ink-muted bg-surface-sunken border-t border-surface-border">
                    + {rows.length - 5} more rows
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 2: Configure ───────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-ink">Step 2 — Configure generation</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Message type</label>
                <select value={replyType} onChange={e => setReplyType(e.target.value as ReplyType)} className={inputCls} disabled={generating}>
                  {REPLY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value as Tone)} className={inputCls} disabled={generating}>
                  {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Format</label>
                <select value={format} onChange={e => setFormat(e.target.value as MessageFormat)} className={inputCls} disabled={generating}>
                  {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Additional context <span className="font-normal text-ink-muted">(applies to every message — e.g. interview details, company name, special instructions)</span>
              </label>
              <textarea
                value={extraCtx} onChange={e => setExtraCtx(e.target.value)}
                disabled={generating}
                rows={2}
                placeholder="e.g. Interview is on Friday 11 July at 11am via Google Meet. Company: Acme Corp."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Generate button */}
            {!hasResults && (
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate {rows.length} messages
                </button>
                <p className="text-xs text-ink-muted">Each message is unique and personalised · counts against your quota</p>
              </div>
            )}

            {/* Progress */}
            {generating && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Generating…</span>
                  <span>{genProgress} / {rows.length}</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(genProgress / rows.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {genError && (
              <p className="text-sm text-status-droppedText bg-status-droppedBg rounded-lg px-3 py-2">{genError}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Results ─────────────────────────────────────────────────── */}
      {hasResults && (
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Step 3 — Results</p>
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">{successCount} generated</span>
              {errorCount > 0 && <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium">{errorCount} failed</span>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {!generating && (
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 text-xs border border-surface-border px-3 py-1.5 rounded-lg text-ink hover:bg-surface-sunken transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-generate
                </button>
              )}
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 text-xs border border-surface-border px-3 py-1.5 rounded-lg text-ink hover:bg-surface-sunken transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>
          </div>

          {/* Translate bar */}
          {successCount > 0 && (
            <div className="px-5 py-3 bg-surface-sunken border-b border-surface-border flex flex-wrap items-center gap-3">
              <Languages className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-semibold text-ink">Translate all to:</p>
              <select
                value={translateLang}
                onChange={e => setTranslateLang(e.target.value as Language)}
                disabled={translating}
                className="border border-surface-border rounded-lg px-2 py-1 text-xs text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TRANSLATE_LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                {translating ? 'Translating…' : `Translate ${successCount} messages`}
              </button>
              {translateError && <p className="text-xs text-red-600">{translateError}</p>}
            </div>
          )}

          {/* Results list */}
          <div className="divide-y divide-surface-border">
            {results.map((r, i) => (
              <div key={i} className={cn('px-5 py-4', r.error ? 'bg-red-50/50' : '')}>
                {/* Candidate header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-ink-muted w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-ink">{r.candidate.name}</span>
                    <span className="text-xs text-ink-muted ml-2">· {r.candidate.role}</span>
                    {r.candidate.company && <span className="text-xs text-ink-muted ml-1">@ {r.candidate.company}</span>}
                  </div>
                  {r.message && (
                    <button
                      onClick={() => copyMessage(i, r.translated ?? r.message)}
                      className="flex items-center gap-1 text-xs text-ink-muted hover:text-primary transition-colors shrink-0"
                    >
                      {r.copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {r.copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                {r.error ? (
                  <p className="text-xs text-red-600 ml-8">{r.error}</p>
                ) : r.message ? (
                  <div className="ml-8 flex flex-col gap-2">
                    {/* Original message */}
                    <div className="bg-surface-sunken rounded-lg p-3">
                      {hasTranslated && <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wide mb-1">English</p>}
                      <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap line-clamp-4">{r.message}</p>
                    </div>
                    {/* Translated */}
                    {r.translated && (
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">
                          {LANGUAGE_LABELS[translateLang] ?? translateLang}
                        </p>
                        <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap line-clamp-4">{r.translated}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ml-8">
                    <div className="h-12 bg-surface-sunken rounded-lg animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
