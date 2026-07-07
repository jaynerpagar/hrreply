'use client'

import { useState } from 'react'
import { Copy, Check, FileText, Loader2, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type DocType =
  | 'job_description' | 'policy' | 'offer_letter' | 'experience_letter'
  | 'relieving_letter' | 'warning_letter' | 'performance_feedback' | 'appreciation_letter'

type FieldId =
  | 'companyName' | 'jobTitle' | 'candidateName' | 'employeeName' | 'designation'
  | 'department' | 'role' | 'experience' | 'responsibilities' | 'skills' | 'location'
  | 'ctcRange' | 'ctc' | 'joiningDate' | 'reportingTo' | 'dateOfJoining' | 'lastWorkingDay'
  | 'policyType' | 'effectiveDate' | 'additionalGuidelines' | 'violation'
  | 'incidentDate' | 'warningLevel' | 'reviewPeriod' | 'rating' | 'achievements'
  | 'improvements' | 'achievement'

interface FieldDef {
  label: string
  placeholder: string
  wide?: boolean
  multiline?: boolean
  select?: string[]
}

// ── Field definitions ─────────────────────────────────────────────────────────

const FIELD_DEFS: Record<FieldId, FieldDef> = {
  companyName:          { label: 'Company name',              placeholder: 'e.g. Acme Technologies Pvt. Ltd.' },
  jobTitle:             { label: 'Job title',                 placeholder: 'e.g. Senior Software Engineer' },
  candidateName:        { label: 'Candidate name',            placeholder: 'e.g. Priya Sharma' },
  employeeName:         { label: 'Employee name',             placeholder: 'e.g. Rahul Verma' },
  designation:          { label: 'Designation',               placeholder: 'e.g. Senior HR Manager' },
  department:           { label: 'Department',                placeholder: 'e.g. Engineering, Finance' },
  role:                 { label: 'Role / Position',           placeholder: 'e.g. Product Manager' },
  experience:           { label: 'Experience required',       placeholder: 'e.g. 3–5 years' },
  responsibilities:     { label: 'Key responsibilities',      placeholder: 'e.g. Lead a team of 5, manage roadmap, stakeholder reporting', wide: true, multiline: true },
  skills:               { label: 'Required skills',           placeholder: 'e.g. React, Node.js, PostgreSQL, team leadership', wide: true },
  location:             { label: 'Work location',             placeholder: 'e.g. Bangalore / Remote / Hybrid' },
  ctcRange:             { label: 'CTC range',                 placeholder: 'e.g. ₹12–18 LPA' },
  ctc:                  { label: 'CTC offered',               placeholder: 'e.g. ₹15 LPA (₹12L fixed + ₹3L variable)', wide: true },
  joiningDate:          { label: 'Joining date',              placeholder: 'e.g. 3rd February 2025' },
  reportingTo:          { label: 'Reporting to',              placeholder: 'e.g. Anita Kapoor, VP Engineering', wide: true },
  dateOfJoining:        { label: 'Date of joining',           placeholder: 'e.g. 1st March 2022' },
  lastWorkingDay:       { label: 'Last working day',          placeholder: 'e.g. 31st January 2025' },
  policyType:           { label: 'Policy type',               placeholder: 'e.g. Leave Policy, WFH Policy, Code of Conduct, Anti-Harassment', wide: true },
  effectiveDate:        { label: 'Effective from',            placeholder: 'e.g. 1st April 2025' },
  additionalGuidelines: { label: 'Key clauses / guidelines',  placeholder: 'e.g. 20 earned leaves/year, 10 sick leaves, carry-forward max 10 days', wide: true, multiline: true },
  violation:            { label: 'Violation / Issue',         placeholder: 'e.g. Repeated tardiness, misuse of company assets', wide: true, multiline: true },
  incidentDate:         { label: 'Incident date',             placeholder: 'e.g. 15th January 2025' },
  warningLevel:         { label: 'Warning level',             placeholder: '', select: ['First Warning', 'Second Warning', 'Final Warning'] },
  reviewPeriod:         { label: 'Review period',             placeholder: 'e.g. Q3 2024 (July–September)' },
  rating:               { label: 'Performance rating',        placeholder: '', select: ['Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement'] },
  achievements:         { label: 'Key achievements',          placeholder: 'e.g. Delivered Project X on time, reduced costs by 20%', wide: true, multiline: true },
  improvements:         { label: 'Areas for improvement',     placeholder: 'e.g. Time management, cross-team communication', wide: true },
  achievement:          { label: 'Achievement / reason',      placeholder: 'e.g. Led the successful launch of the new employee onboarding portal', wide: true, multiline: true },
}

// ── Schema (fields per doc type) ──────────────────────────────────────────────

const SCHEMA: Record<DocType, FieldId[]> = {
  job_description:      ['jobTitle', 'department', 'location', 'experience', 'ctcRange', 'responsibilities', 'skills'],
  policy:               ['companyName', 'policyType', 'effectiveDate', 'additionalGuidelines'],
  offer_letter:         ['companyName', 'candidateName', 'role', 'department', 'ctc', 'joiningDate', 'location', 'reportingTo'],
  experience_letter:    ['companyName', 'employeeName', 'designation', 'department', 'dateOfJoining', 'lastWorkingDay'],
  relieving_letter:     ['companyName', 'employeeName', 'designation', 'lastWorkingDay'],
  warning_letter:       ['companyName', 'employeeName', 'designation', 'incidentDate', 'warningLevel', 'violation'],
  performance_feedback: ['companyName', 'employeeName', 'designation', 'reviewPeriod', 'rating', 'achievements', 'improvements'],
  appreciation_letter:  ['companyName', 'employeeName', 'designation', 'achievement'],
}

// ── Document type metadata ────────────────────────────────────────────────────

const DOC_TYPES: { value: DocType; emoji: string; label: string; desc: string }[] = [
  { value: 'job_description',      emoji: '📋', label: 'Job Description',      desc: 'Full JD with responsibilities & requirements' },
  { value: 'policy',               emoji: '📜', label: 'HR Policy',            desc: 'Leave, WFH, Code of Conduct & more' },
  { value: 'offer_letter',         emoji: '🤝', label: 'Offer Letter',         desc: 'Formal job offer with CTC & joining details' },
  { value: 'experience_letter',    emoji: '📄', label: 'Experience Letter',    desc: 'Confirms employment tenure & designation' },
  { value: 'relieving_letter',     emoji: '👋', label: 'Relieving Letter',     desc: 'Accepts resignation, confirms last date' },
  { value: 'warning_letter',       emoji: '⚠️', label: 'Warning Letter',       desc: 'Formal disciplinary notice with incident details' },
  { value: 'performance_feedback', emoji: '⭐', label: 'Performance Feedback', desc: 'Appraisal letter with rating & growth path' },
  { value: 'appreciation_letter',  emoji: '🏆', label: 'Appreciation Letter',  desc: 'Recognise outstanding contributions' },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2.5">{children}</p>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HRDocumentsPage() {
  const [docType, setDocType] = useState<DocType>('job_description')
  const [fields,  setFields]  = useState<Record<string, string>>({})
  const [output,  setOutput]  = useState('')
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const [error,   setError]   = useState('')

  function setField(id: string, val: string) {
    setFields(prev => ({ ...prev, [id]: val }))
  }

  function switchDocType(type: DocType) {
    setDocType(type)
    setFields({})
    setOutput('')
    setError('')
  }

  const schemaFields = SCHEMA[docType]
  const hasInput = schemaFields.some(id => (fields[id] ?? '').trim())

  async function generate() {
    if (!hasInput) return
    setLoading(true); setError(''); setOutput('')
    try {
      const res  = await fetch('/api/hr-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType, fields }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong — please try again.'); return }
      setOutput(data.content)
    } catch {
      setError('Network error — please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    const blob  = new Blob([output], { type: 'text/plain' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    const label = DOC_TYPES.find(d => d.value === docType)?.label ?? 'document'
    a.href     = url
    a.download = `${label.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentDoc = DOC_TYPES.find(d => d.value === docType)

  return (
    <div className="flex flex-col lg:h-full">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <h1 className="text-xl font-bold text-ink tracking-tight">HR Document Studio</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Generate formal HR documents — offer letters, policies, JDs, and more.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-5 lg:flex-1 lg:min-h-0">

        {/* ══ LEFT PANE ══════════════════════════════════════════════════════ */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden lg:overflow-y-auto">

          {/* Document type selector */}
          <div className="px-5 pt-4 pb-3 border-b border-surface-border">
            <SectionLabel>Document type</SectionLabel>
            <div className="grid grid-cols-2 gap-1">
              {DOC_TYPES.map(({ value, emoji, label, desc }) => (
                <button
                  key={value}
                  onClick={() => switchDocType(value)}
                  className={cn(
                    'flex items-start gap-2 text-left px-2.5 py-2 rounded-lg border text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    docType === value
                      ? 'border-accent bg-accent text-primary font-semibold shadow-sm'
                      : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                  )}
                >
                  <span className="text-base leading-none mt-0.5 shrink-0">{emoji}</span>
                  <div>
                    <div className="leading-tight font-semibold">{label}</div>
                    <div className={cn('text-[10px] leading-tight mt-0.5', docType === value ? 'text-primary/70' : 'text-ink-muted')}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="px-5 py-4 border-b border-surface-border">
            <SectionLabel>Details</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {schemaFields.map(id => {
                const def = FIELD_DEFS[id]
                const val = fields[id] ?? ''
                return (
                  <div key={id} className={def.wide ? 'col-span-2' : ''}>
                    <label className="text-[11px] font-semibold text-ink-secondary block mb-1">{def.label}</label>
                    {def.select ? (
                      <select
                        value={val}
                        onChange={e => setField(id, e.target.value)}
                        className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      >
                        <option value="">Select…</option>
                        {def.select.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : def.multiline ? (
                      <textarea
                        rows={3}
                        value={val}
                        onChange={e => setField(id, e.target.value)}
                        placeholder={def.placeholder}
                        className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={e => setField(id, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && hasInput) generate() }}
                        placeholder={def.placeholder}
                        className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Generate button */}
          <div className="p-4">
            <Button
              onClick={generate}
              disabled={loading || !hasInput}
              variant="ai"
              className="w-full"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><FileText className="w-4 h-4" /> Generate document</>
              }
            </Button>
          </div>
        </div>

        {/* ══ RIGHT PANE ═════════════════════════════════════════════════════ */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card flex flex-col min-w-0 lg:overflow-y-auto">

          {/* Output header */}
          {output && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border shrink-0">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                {currentDoc?.emoji} {currentDoc?.label}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={downloadTxt}>
                  <Download className="w-3.5 h-3.5" /> Download .txt
                </Button>
                <Button variant="secondary" size="sm" onClick={copy}>
                  {copied
                    ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied!</>
                    : <><Copy className="w-3.5 h-3.5" /> Copy</>
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="m-4 flex items-center gap-2 p-3 rounded-lg bg-status-droppedBg text-status-droppedText text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Empty state */}
          {!output && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-ink mb-1">Ready to generate</p>
              <p className="text-sm text-ink-secondary max-w-xs">
                Select a document type, fill in the details on the left, and click <span className="font-medium">Generate document</span>.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-ink-secondary">Writing your document…</p>
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="flex-1 p-6 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed">{output}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
