'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Upload, FileText, User, Briefcase, Building2,
  Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp,
  Mail, MessageCircle, Link2, ScrollText, Users, Wand2, X,
} from 'lucide-react'
import { UpsellModal } from '@/components/ui/upsell-modal'
import { AnalyzeBar } from '@/components/analyze'
import { cn } from '@/lib/utils'
import type { CandidateProfile, JobProfile, CompanySnapshot, OutreachMessages } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────

type CandidateTab = 'resume' | 'linkedin' | 'manual'
type JobTab = 'jd' | 'manual'
type OutreachTab = 'email' | 'linkedin' | 'whatsapp' | 'jobPost' | 'referral'
type Tone = 'formal' | 'friendly'

// ── Helpers ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2.5">{children}</p>
}

function FieldInput({ label, value, onChange, placeholder, wide }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="text-[11px] font-semibold text-ink-secondary block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
      />
    </div>
  )
}

function Section({
  icon, title, badge, open, onToggle, children,
}: {
  icon: React.ReactNode; title: string; badge?: string
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border-b border-surface-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-sunken transition-colors text-left"
      >
        <span className="text-ink-muted">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-ink">{title}</span>
        {badge && (
          <span className="text-[11px] text-ink-muted bg-surface-sunken border border-surface-border rounded-full px-2 py-0.5 max-w-[140px] truncate">
            {badge}
          </span>
        )}
        {open ? <ChevronUp className="w-3.5 h-3.5 text-ink-muted shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function TabPills<T extends string>({ tabs, active, onChange, size = 'sm' }: {
  tabs: { value: T; label: string; icon?: React.ReactNode }[]
  active: T; onChange: (v: T) => void; size?: 'xs' | 'sm'
}) {
  return (
    <div className="flex gap-1 p-1 bg-surface-sunken border border-surface-border rounded-lg mb-4">
      {tabs.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-md transition-all duration-150 font-semibold',
            size === 'xs' ? 'py-1 text-[11px]' : 'py-1.5 text-xs',
            active === value
              ? 'bg-surface-card text-ink shadow-sm border border-surface-border'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Drag-drop resume upload ────────────────────────────────────────────────

function ResumeDropzone({ onFile, file, loading, error }: {
  onFile: (f: File) => void
  file: File | null
  loading: boolean
  error: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  if (loading) {
    return (
      <div className="border-2 border-dashed border-surface-borderStrong rounded-xl p-8 flex flex-col items-center gap-3 bg-surface-sunken">
        <RefreshCw className="w-6 h-6 text-accent-icon animate-spin" />
        <p className="text-sm font-semibold text-ink">Reading resume…</p>
        <p className="text-xs text-ink-muted">Extracting candidate details with AI</p>
      </div>
    )
  }

  if (file && !error) {
    return (
      <div className="border border-surface-border rounded-xl p-3.5 flex items-center gap-3 bg-surface-sunken">
        <div className="w-9 h-9 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-accent-icon" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
          <p className="text-xs text-ink-muted">{(file.size / 1024).toFixed(0)} KB — extracted ✓</p>
        </div>
        <button onClick={() => inputRef.current?.click()} className="text-xs font-semibold text-ink-muted hover:text-primary transition-colors">
          Replace
        </button>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all',
        dragging ? 'border-primary bg-primary/5' : 'border-surface-borderStrong bg-surface-sunken hover:border-primary hover:bg-primary/5'
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center">
        <Upload className="w-5 h-5 text-ink-muted" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-ink">Drop resume here or click to browse</p>
        <p className="text-xs text-ink-muted mt-0.5">PDF or DOCX · Max 10 MB</p>
      </div>
      {error && <p className="text-xs text-status-droppedText">{error}</p>}
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  )
}

// ── Candidate profile card (editable fields) ───────────────────────────────

function CandidateFields({ profile, onChange }: {
  profile: Partial<CandidateProfile>
  onChange: (p: Partial<CandidateProfile>) => void
}) {
  const set = (key: keyof CandidateProfile, val: string) =>
    onChange({ ...profile, [key]: key === 'skills' || key === 'projects' ? val.split(',').map(s => s.trim()).filter(Boolean) : val })

  const skillsStr  = (profile.skills  ?? []).join(', ')
  const projectsStr = (profile.projects ?? []).join(', ')

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <FieldInput label="Full name"         value={profile.name          ?? ''} onChange={v => set('name', v)}          placeholder="e.g. Priya Sharma" />
      <FieldInput label="Current title"     value={profile.currentTitle  ?? ''} onChange={v => set('currentTitle', v)}  placeholder="e.g. Senior Developer" />
      <FieldInput label="Current company"   value={profile.currentCompany ?? ''} onChange={v => set('currentCompany', v)} placeholder="e.g. Infosys" />
      <FieldInput label="Experience"        value={profile.experience     ?? ''} onChange={v => set('experience', v)}    placeholder="e.g. 5 years" />
      <FieldInput label="Location"          value={profile.location       ?? ''} onChange={v => set('location', v)}      placeholder="e.g. Bangalore" />
      <FieldInput label="Notice period"     value={profile.noticePeriod   ?? ''} onChange={v => set('noticePeriod', v)}  placeholder="e.g. 30 days" />
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Skills <span className="text-ink-muted font-normal">(comma-separated)</span></label>
        <input
          type="text"
          value={skillsStr}
          onChange={e => set('skills', e.target.value)}
          placeholder="e.g. React, Node.js, AWS, TypeScript"
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Key projects <span className="text-ink-muted font-normal">(comma-separated)</span></label>
        <input
          type="text"
          value={projectsStr}
          onChange={e => set('projects', e.target.value)}
          placeholder="e.g. Built microservices platform at Infosys, Led React migration"
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
    </div>
  )
}

// ── Job profile fields ─────────────────────────────────────────────────────

function JobFields({ job, onChange }: {
  job: Partial<JobProfile>
  onChange: (j: Partial<JobProfile>) => void
}) {
  const set = (key: keyof JobProfile, val: string) =>
    onChange({ ...job, [key]: key === 'requiredSkills' || key === 'niceToHaveSkills' ? val.split(',').map(s => s.trim()).filter(Boolean) : val })

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <FieldInput label="Job title"       value={job.title         ?? ''} onChange={v => set('title', v)}         placeholder="e.g. Senior Backend Engineer" wide />
      <FieldInput label="Hiring company"  value={job.companyName   ?? ''} onChange={v => set('companyName', v)}   placeholder="e.g. Zepto, Razorpay" />
      <FieldInput label="Experience"      value={job.experience    ?? ''} onChange={v => set('experience', v)}    placeholder="e.g. 3-5 years" />
      <FieldInput label="Location"        value={job.location      ?? ''} onChange={v => set('location', v)}      placeholder="e.g. Bangalore" />
      <FieldInput label="Work mode"       value={job.remotePolicy  ?? ''} onChange={v => set('remotePolicy', v)}  placeholder="e.g. Hybrid, Remote" />
      <FieldInput label="CTC range"       value={job.compensation  ?? ''} onChange={v => set('compensation', v)}  placeholder="e.g. 18-24 LPA" />
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Required skills <span className="text-ink-muted font-normal">(comma-separated)</span></label>
        <input
          type="text"
          value={(job.requiredSkills ?? []).join(', ')}
          onChange={e => set('requiredSkills', e.target.value)}
          placeholder="e.g. Node.js, PostgreSQL, AWS, System design"
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Nice to have <span className="text-ink-muted font-normal">(comma-separated)</span></label>
        <input
          type="text"
          value={(job.niceToHaveSkills ?? []).join(', ')}
          onChange={e => set('niceToHaveSkills', e.target.value)}
          placeholder="e.g. Kafka, Redis, GraphQL"
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
    </div>
  )
}

// ── Company fields ─────────────────────────────────────────────────────────

function CompanyFields({ snapshot, onChange }: {
  snapshot: Partial<CompanySnapshot>
  onChange: (s: Partial<CompanySnapshot>) => void
}) {
  const set = (key: keyof CompanySnapshot, val: string) =>
    onChange({ ...snapshot, [key]: key === 'techStack' ? val.split(',').map(s => s.trim()).filter(Boolean) : val })

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <FieldInput label="Industry"   value={snapshot.industry ?? ''} onChange={v => set('industry', v)}   placeholder="e.g. Fintech, EdTech" />
      <FieldInput label="Size"       value={snapshot.size    ?? ''} onChange={v => set('size', v)}        placeholder="e.g. Startup, 200-500" />
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Tech stack <span className="text-ink-muted font-normal">(comma-separated)</span></label>
        <input
          type="text"
          value={(snapshot.techStack ?? []).join(', ')}
          onChange={e => set('techStack', e.target.value)}
          placeholder="e.g. React, Node.js, AWS, PostgreSQL"
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">Culture / vibe</label>
        <input
          type="text"
          value={snapshot.culture ?? ''}
          onChange={e => set('culture', e.target.value)}
          placeholder="e.g. Fast-paced, engineering-driven, 0→1 builder culture"
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-ink-secondary block mb-1">What they build</label>
        <input
          type="text"
          value={snapshot.products ?? ''}
          onChange={e => set('products', e.target.value)}
          placeholder="e.g. 10-minute grocery delivery platform across 100+ dark stores"
          className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const OUTREACH_TABS: { value: OutreachTab; label: string; icon: React.ReactNode }[] = [
  { value: 'email',    label: 'Email',     icon: <Mail className="w-3.5 h-3.5" /> },
  { value: 'linkedin', label: 'LinkedIn',  icon: <Link2 className="w-3.5 h-3.5" /> },
  { value: 'whatsapp', label: 'WhatsApp',  icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { value: 'jobPost',  label: 'Job Post',  icon: <ScrollText className="w-3.5 h-3.5" /> },
  { value: 'referral', label: 'Referral',  icon: <Users className="w-3.5 h-3.5" /> },
]

function OutreachContent() {
  const searchParams = useSearchParams()

  // Candidate state
  const [candidateTab, setCandidateTab] = useState<CandidateTab>('resume')
  const [resumeFile, setResumeFile]     = useState<File | null>(null)
  const [resumeError, setResumeError]   = useState('')
  const [resumeLoading, setResumeLoading] = useState(false)
  const [linkedinText, setLinkedinText] = useState('')
  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const [candidate, setCandidate]       = useState<Partial<CandidateProfile>>({})

  // Job state
  const [jobTab, setJobTab]             = useState<JobTab>('jd')
  const [jdText, setJdText]             = useState('')
  const [jdLoading, setJdLoading]       = useState(false)
  const [job, setJob]                   = useState<Partial<JobProfile>>({})

  // Company state
  const [companyQuery, setCompanyQuery] = useState('')
  const [companyLoading, setCompanyLoading] = useState(false)
  const [company, setCompany]           = useState<Partial<CompanySnapshot>>({})

  // Section open/close
  const [openSections, setOpenSections] = useState({ candidate: true, job: true, company: false })

  // Output state
  const [tone, setTone]                 = useState<Tone>('friendly')
  const [outreach, setOutreach]         = useState<OutreachMessages | null>(null)
  const [generating, setGenerating]     = useState(false)
  const [activeTab, setActiveTab]       = useState<OutreachTab>('email')
  const [copied, setCopied]             = useState(false)
  const [error, setError]               = useState('')
  const [showUpsell, setShowUpsell]     = useState(false)

  // Pre-fill from candidateId URL param
  useEffect(() => {
    const candidateId = searchParams.get('candidateId')
    if (!candidateId) return
    fetch(`/api/candidates/${candidateId}`)
      .then(r => r.json())
      .then(c => {
        if (!c?.name) return
        setCandidateTab('manual')
        setCandidate({
          name:           c.name           ?? '',
          currentTitle:   '',
          currentCompany: c.current_company ?? '',
          experience:     c.experience      ?? '',
          skills:         c.skills ? c.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          location:       '',
          noticePeriod:   c.notice_period   ?? '',
          projects:       [],
          education:      '',
          email:          '',
          phone:          c.phone           ?? '',
        })
        setJob(prev => ({ ...prev, title: c.role_applied ?? '' }))
        setOpenSections({ candidate: true, job: true, company: false })
      })
      .catch(() => {/* silently ignore */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(s => ({ ...s, [key]: !s[key] }))
  }

  // ── Resume upload & extract ──────────────────────────────────────────────

  async function handleResumeFile(file: File) {
    setResumeFile(file); setResumeError(''); setResumeLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/parse-resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setResumeError(data.error ?? 'Failed to parse resume'); return }
      setCandidate(data.profile)
    } catch { setResumeError('Network error — please try again.') }
    finally { setResumeLoading(false) }
  }

  // ── LinkedIn extract ─────────────────────────────────────────────────────

  async function extractLinkedin() {
    if (!linkedinText.trim()) return
    setLinkedinLoading(true)
    try {
      const res = await fetch('/api/parse-linkedin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: linkedinText }),
      })
      const data = await res.json()
      if (res.ok) setCandidate(data.profile)
    } finally { setLinkedinLoading(false) }
  }

  // ── JD extract ───────────────────────────────────────────────────────────

  async function extractJd() {
    if (!jdText.trim()) return
    setJdLoading(true)
    try {
      const res = await fetch('/api/parse-jd', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: jdText }),
      })
      const data = await res.json()
      if (res.ok) setJob(data.job)
    } finally { setJdLoading(false) }
  }

  // ── Company research ─────────────────────────────────────────────────────

  async function researchCompany() {
    if (!companyQuery.trim()) return
    setCompanyLoading(true)
    try {
      const res = await fetch('/api/company-research', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyQuery }),
      })
      const data = await res.json()
      if (res.ok) setCompany(data.snapshot)
    } finally { setCompanyLoading(false) }
  }

  // ── Generate outreach ────────────────────────────────────────────────────

  async function generate() {
    setGenerating(true); setError(''); setOutreach(null)
    try {
      const res = await fetch('/api/personalized-outreach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate, job, company, tone }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'free_limit_reached') setShowUpsell(true)
        else setError(data.error ?? 'Something went wrong')
        return
      }
      setOutreach(data.outreach)
      setActiveTab('email')
    } catch { setError('Network error — please check your connection.') }
    finally { setGenerating(false) }
  }

  function copy() {
    const text = outreach?.[activeTab] ?? ''
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Candidate badge ──────────────────────────────────────────────────────
  const candidateBadge = candidate.name
    ? `${candidate.name}${candidate.currentCompany ? ` · ${candidate.currentCompany}` : ''}${candidate.skills?.length ? ` · ${candidate.skills.slice(0, 3).join(', ')}` : ''}`
    : undefined

  const jobBadge = job.title
    ? `${job.title}${job.companyName ? ` · ${job.companyName}` : ''}`
    : undefined

  const companyBadge = company.industry
    ? `${company.industry}${company.size ? ` · ${company.size}` : ''}`
    : undefined

  const canGenerate = !!(candidate.name || candidate.skills?.length || job.title || job.requiredSkills?.length)

  return (
    <div className="flex flex-col">
      <UpsellModal open={showUpsell} onClose={() => setShowUpsell(false)} reason="limit_reached" />

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink tracking-tight">Personalized Outreach</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Upload a resume or paste a JD — AI writes outreach that references the candidate&apos;s actual skills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 items-start">

        {/* ══ LEFT PANE ═══════════════════════════════════════════════════ */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">

          {/* ── CANDIDATE ────────────────────────────────────────────────── */}
          <Section
            icon={<User className="w-4 h-4" />}
            title="Candidate info"
            badge={candidateBadge}
            open={openSections.candidate}
            onToggle={() => toggleSection('candidate')}
          >
            <TabPills
              tabs={[
                { value: 'resume' as CandidateTab,   label: 'Resume',   icon: <FileText className="w-3 h-3" /> },
                { value: 'linkedin' as CandidateTab, label: 'LinkedIn', icon: <Link2 className="w-3 h-3" /> },
                { value: 'manual' as CandidateTab,   label: 'Manual',   icon: <User className="w-3 h-3" /> },
              ]}
              active={candidateTab}
              onChange={setCandidateTab}
              size="xs"
            />

            {/* Resume tab */}
            {candidateTab === 'resume' && (
              <div className="space-y-4">
                <ResumeDropzone
                  onFile={handleResumeFile}
                  file={resumeFile}
                  loading={resumeLoading}
                  error={resumeError}
                />
                {(resumeFile || Object.keys(candidate).some(k => candidate[k as keyof CandidateProfile])) && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-surface-border" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Extracted — edit if needed</span>
                      <div className="flex-1 h-px bg-surface-border" />
                    </div>
                    <CandidateFields profile={candidate} onChange={setCandidate} />
                  </>
                )}
              </div>
            )}

            {/* LinkedIn tab */}
            {candidateTab === 'linkedin' && (
              <div className="space-y-3">
                <div className="bg-surface-sunken border border-surface-border rounded-lg p-3 text-xs text-ink-muted leading-relaxed">
                  <span className="font-semibold text-ink">How to paste:</span> Open their LinkedIn profile → Select all text (Cmd+A / Ctrl+A) → Copy → Paste below.
                </div>
                <textarea
                  rows={7}
                  value={linkedinText}
                  onChange={e => setLinkedinText(e.target.value)}
                  placeholder="Paste LinkedIn profile text here…"
                  className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
                />
                <button
                  onClick={extractLinkedin}
                  disabled={!linkedinText.trim() || linkedinLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {linkedinLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Extracting…</> : <><Sparkles className="w-3.5 h-3.5" />Extract profile</>}
                </button>
                {candidate.name && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-surface-border" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Extracted — edit if needed</span>
                      <div className="flex-1 h-px bg-surface-border" />
                    </div>
                    <CandidateFields profile={candidate} onChange={setCandidate} />
                  </>
                )}
              </div>
            )}

            {/* Manual tab */}
            {candidateTab === 'manual' && (
              <CandidateFields profile={candidate} onChange={setCandidate} />
            )}
          </Section>

          {/* ── JOB ROLE ─────────────────────────────────────────────────── */}
          <Section
            icon={<Briefcase className="w-4 h-4" />}
            title="Job role"
            badge={jobBadge}
            open={openSections.job}
            onToggle={() => toggleSection('job')}
          >
            <TabPills
              tabs={[
                { value: 'jd' as JobTab,     label: 'Paste JD', icon: <FileText className="w-3 h-3" /> },
                { value: 'manual' as JobTab, label: 'Manual',   icon: <Link2 className="w-3 h-3" /> },
              ]}
              active={jobTab}
              onChange={setJobTab}
              size="xs"
            />

            {jobTab === 'jd' && (
              <div className="space-y-3">
                <textarea
                  rows={7}
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the full job description here…"
                  className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition leading-relaxed"
                />
                <button
                  onClick={extractJd}
                  disabled={!jdText.trim() || jdLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {jdLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Extracting…</> : <><Sparkles className="w-3.5 h-3.5" />Extract job details</>}
                </button>
                {job.title && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-surface-border" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Extracted — edit if needed</span>
                      <div className="flex-1 h-px bg-surface-border" />
                    </div>
                    <JobFields job={job} onChange={setJob} />
                  </>
                )}
              </div>
            )}

            {jobTab === 'manual' && (
              <JobFields job={job} onChange={setJob} />
            )}
          </Section>

          {/* ── COMPANY ──────────────────────────────────────────────────── */}
          <Section
            icon={<Building2 className="w-4 h-4" />}
            title="Company context"
            badge={companyBadge ?? 'optional'}
            open={openSections.company}
            onToggle={() => toggleSection('company')}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={companyQuery}
                  onChange={e => setCompanyQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && researchCompany()}
                  placeholder="Company name, e.g. Zepto, Razorpay, Infosys"
                  className="flex-1 border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface-sunken placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                />
                <button
                  onClick={researchCompany}
                  disabled={!companyQuery.trim() || companyLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {companyLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Research
                </button>
              </div>
              <CompanyFields snapshot={company} onChange={setCompany} />
            </div>
          </Section>

          {/* ── Tone + Generate ───────────────────────────────────────────── */}
          <div className="px-5 py-4 bg-surface-sunken border-t border-surface-border">
            <div className="flex items-center gap-3 mb-3">
              <SectionLabel>Tone</SectionLabel>
              <div className="flex gap-1.5">
                {(['formal', 'friendly'] as Tone[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      'px-3 py-1 rounded-md border text-xs font-semibold transition-all',
                      tone === t
                        ? 'bg-primary border-primary text-white'
                        : 'border-surface-border bg-surface-page text-ink-secondary hover:border-surface-borderStrong hover:text-ink'
                    )}
                  >
                    {t === 'formal' ? 'Formal' : 'Friendly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              {!generating && canGenerate && (
                <span className="absolute inset-0 rounded-lg animate-ping bg-accent opacity-20 pointer-events-none" />
              )}
              <button
                onClick={generate}
                disabled={generating || !canGenerate}
                className="relative w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {generating
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating outreach…</>
                  : <><Wand2 className="w-4 h-4" />Generate personalized outreach</>
                }
              </button>
            </div>
            {!canGenerate && (
              <p className="text-[11px] text-ink-muted text-center mt-2">Add candidate name/skills or job title to generate</p>
            )}
          </div>
        </div>

        {/* ══ RIGHT PANE ══════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {error && (
            <div className="bg-status-droppedBg border border-status-dropped/30 rounded-xl px-4 py-3 text-sm text-status-droppedText flex items-start gap-2">
              <X className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Loading skeleton */}
          {generating && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <Wand2 className="w-4 h-4 text-accent-icon animate-pulse" />
                <span className="text-sm text-ink-secondary">Writing personalized messages for {candidate.name ?? 'candidate'}…</span>
              </div>
              <div className="space-y-2.5">
                {[100, 85, 100, 70, 90, 60, 100, 75].map((w, i) => (
                  <div key={i} className="h-3 bg-surface-sunken rounded animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          {outreach && !generating && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
              {/* Format tabs */}
              <div className="border-b border-surface-border bg-white px-4 pt-3 flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {OUTREACH_TABS.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => { setActiveTab(value); setCopied(false) }}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all',
                      activeTab === value
                        ? 'border-primary text-primary'
                        : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-borderStrong'
                    )}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 bg-surface-sunken min-h-[280px]">
                <p className="text-ink text-[15px] leading-[1.8] whitespace-pre-wrap">
                  {outreach[activeTab]}
                </p>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-surface-border flex items-center gap-2 bg-white flex-wrap">
                <button
                  onClick={copy}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                    copied
                      ? 'border-accent bg-accent-soft text-accent-text'
                      : 'border-surface-border bg-surface-page text-ink-secondary hover:border-primary hover:text-primary'
                  )}
                >
                  {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                </button>
                <AnalyzeBar
                  text={outreach[activeTab]}
                  channel={activeTab === 'whatsapp' ? 'whatsapp' : 'email'}
                  onApplyText={(t) => setOutreach(prev => prev ? { ...prev, [activeTab]: t } : prev)}
                />
                <button
                  onClick={generate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary text-xs font-semibold text-white hover:bg-primary-hover transition-all ml-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate all
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!outreach && !generating && !error && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card flex flex-col items-center justify-center text-center py-20 px-8 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-base font-bold text-ink">5 formats, one click</p>
                <p className="text-sm text-ink-muted mt-1.5 max-w-sm leading-relaxed">
                  Fill in candidate or job details on the left. The AI writes a personalized Email, LinkedIn message, WhatsApp, Job Post, and Referral message — all referencing the candidate&apos;s actual skills.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {OUTREACH_TABS.map(({ value, label, icon }) => (
                  <span key={value} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-surface-border bg-surface-sunken text-ink-secondary">
                    {icon} {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default function OutreachPage() {
  return (
    <Suspense>
      <OutreachContent />
    </Suspense>
  )
}
