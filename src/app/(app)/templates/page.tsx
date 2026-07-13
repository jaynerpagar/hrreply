'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search, Star, Copy, Pen, Trash2, Plus, X, Check,
  Mail, MessageSquare, BookOpen, ChevronDown, ChevronUp,
  Users, Clock, History, Crown, Loader2, AlertTriangle, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnalyzeBar } from '@/components/analyze'
import {
  HR_TEMPLATES, CATEGORY_META, CATEGORY_ORDER,
  extractPlaceholders, fillTemplate,
} from '@/lib/hr-templates'
import type { HRTemplate, TemplateCategory, TemplateChannel } from '@/lib/hr-templates'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'library' | 'my' | 'favorites' | 'team'

interface SavedTemplate {
  id: string
  name: string
  channel: string
  tone: string
  body: string
  created_at: string
}

interface TeamTemplate {
  id: string
  name: string
  channel: string
  tone: string
  body: string
  status: string          // 'pending_approval' | 'approved' | 'rejected'
  rejection_note: string | null
  created_by_name: string
  user_id: string
  created_at: string
}

interface TemplateVersion {
  id: string
  version: number
  name: string
  body: string
  changed_by_name: string
  created_at: string
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const CHANNEL_ICON = {
  email:    <Mail className="w-3 h-3" />,
  whatsapp: <MessageSquare className="w-3 h-3" />,
  sms:      <MessageSquare className="w-3 h-3" />,
}

function ChannelBadge({ channel }: { channel: string }) {
  const isWhatsApp = channel === 'whatsapp' || channel === 'sms'
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
      isWhatsApp ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
    )}>
      {CHANNEL_ICON[channel as TemplateChannel] ?? <Mail className="w-3 h-3" />}
      {channel}
    </span>
  )
}

function ToneBadge({ tone }: { tone: string }) {
  const styles: Record<string, string> = {
    formal:   'bg-surface-sunken text-ink-secondary',
    friendly: 'bg-accent-soft text-accent-text',
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', styles[tone] ?? 'bg-surface-sunken text-ink-secondary')}>
      {tone}
    </span>
  )
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])
  return { copied, copy }
}

// ─── Use-Template modal ───────────────────────────────────────────────────────

function UseModal({
  template,
  onClose,
}: {
  template: HRTemplate | SavedTemplate
  onClose: () => void
}) {
  const body = template.body
  const subject = 'subject' in template ? (template as HRTemplate).subject : undefined
  const placeholders = useMemo(() => extractPlaceholders(body, subject), [body, subject])
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(placeholders.map(p => [p, '']))
  )
  const [showPreview, setShowPreview] = useState(true)
  const { copied, copy } = useCopy()

  const filledBody = useMemo(() => fillTemplate(body, values), [body, values])
  const filledSubject = subject ? fillTemplate(subject, values) : undefined

  const copyAll = () => {
    const text = filledSubject ? `Subject: ${filledSubject}\n\n${filledBody}` : filledBody
    copy(text, 'all')
    // Track template usage for analytics
    if ('category' in template) {
      fetch('/api/track-template-use', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: template.id }) })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <h2 className="font-semibold text-ink">{template.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <ChannelBadge channel={template.channel} />
              <ToneBadge tone={template.tone} />
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-sunken text-ink-muted hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden divide-x divide-surface-border">

          {/* Left: Placeholder form */}
          {placeholders.length > 0 && (
            <div className="w-64 shrink-0 overflow-y-auto p-5 flex flex-col gap-4">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Fill placeholders</p>
              {placeholders.map(ph => (
                <div key={ph}>
                  <label className="block text-xs font-medium text-ink mb-1">
                    {ph.replace(/_/g, ' ')}
                  </label>
                  <input
                    className="w-full rounded-lg border border-surface-border bg-surface-sunken px-3 py-1.5 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder={ph.replace(/_/g, ' ')}
                    value={values[ph] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [ph]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Right: Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Preview</span>
              <button
                onClick={() => setShowPreview(v => !v)}
                className="text-xs text-ink-secondary hover:text-ink flex items-center gap-1"
              >
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showPreview ? 'Hide' : 'Show'}
              </button>
            </div>

            {showPreview && (
              <div className="flex-1 overflow-y-auto p-5">
                {filledSubject && (
                  <div className="mb-3 pb-3 border-b border-surface-border">
                    <span className="text-xs font-medium text-ink-muted">Subject: </span>
                    <span className="text-sm text-ink">{filledSubject}</span>
                  </div>
                )}
                <pre className="whitespace-pre-wrap text-sm text-ink font-sans leading-relaxed">
                  {filledBody}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border bg-surface-sunken gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <p className="text-xs text-ink-muted">
              {Object.values(values).filter(Boolean).length}/{placeholders.length} placeholders filled
            </p>
            <AnalyzeBar text={filledBody} channel={template.channel} />
          </div>
          <button
            onClick={copyAll}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {copied === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'all' ? 'Copied!' : 'Copy message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit/Create modal for My Templates ──────────────────────────────────────

function EditModal({
  template,
  onClose,
  onSaved,
}: {
  template?: SavedTemplate
  onClose: () => void
  onSaved: (t: SavedTemplate) => void
}) {
  const [name, setName] = useState(template?.name ?? '')
  const [channel, setChannel] = useState(template?.channel ?? 'email')
  const [tone, setTone] = useState(template?.tone ?? 'formal')
  const [body, setBody] = useState(template?.body ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!name.trim() || !body.trim()) { setError('Name and body are required'); return }
    setSaving(true)
    setError('')
    try {
      const url = template ? `/api/saved-templates/${template.id}` : '/api/saved-templates'
      const method = template ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, channel, tone, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      onSaved(data.template)
      onClose()
    } catch {
      setError('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-ink">{template ? 'Edit template' : 'New template'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-sunken text-ink-muted hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Template name</label>
            <input
              className="w-full rounded-lg border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="e.g. Welcome to Team — Hinglish"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink mb-1.5">Channel</label>
              <select
                className="w-full rounded-lg border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={channel}
                onChange={e => setChannel(e.target.value)}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink mb-1.5">Tone</label>
              <select
                className="w-full rounded-lg border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={tone}
                onChange={e => setTone(e.target.value)}
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-ink mb-1.5">
              Message body
              <span className="ml-2 text-xs font-normal text-ink-muted">Use {'{{placeholder}}'} for dynamic fields</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink font-mono placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              rows={12}
              placeholder="Hi {{employee_name}},&#10;&#10;Your message here..."
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            {body && (
              <p className="text-xs text-ink-muted mt-1">
                Placeholders detected: {extractPlaceholders(body).join(', ') || 'none'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink-secondary hover:text-ink transition-colors">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : (template ? 'Save changes' : 'Create template')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Template card (library / favorites) ─────────────────────────────────────

function LibraryCard({
  template,
  isFavorite,
  onFavorite,
  onUse,
}: {
  template: HRTemplate
  isFavorite: boolean
  onFavorite: () => void
  onUse: () => void
}) {
  const { copied, copy } = useCopy()
  const preview = template.body.slice(0, 140).replace(/\n+/g, ' ')

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-raised transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-ink leading-snug">{template.name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <ChannelBadge channel={template.channel} />
            <ToneBadge tone={template.tone} />
          </div>
        </div>
        <button
          onClick={onFavorite}
          className={cn(
            'p-1.5 rounded-lg transition-colors shrink-0',
            isFavorite
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
              : 'text-ink-muted hover:text-amber-500 hover:bg-amber-50'
          )}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>
      </div>

      <p className="text-xs text-ink-secondary leading-relaxed flex-1 line-clamp-3">
        {preview}{template.body.length > 140 ? '…' : ''}
      </p>

      <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
        <button
          onClick={() => copy(template.body, template.id)}
          className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-surface-sunken transition-colors"
        >
          {copied === template.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === template.id ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={onUse}
          className="flex-1 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          Use template
        </button>
      </div>
    </div>
  )
}

// ─── Saved template card (My Templates tab) ───────────────────────────────────

function SavedCard({
  template,
  onEdit,
  onDelete,
  onUse,
}: {
  template: SavedTemplate
  onEdit: () => void
  onDelete: () => void
  onUse: () => void
}) {
  const { copied, copy } = useCopy()
  const preview = template.body.slice(0, 140).replace(/\n+/g, ' ')

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-raised transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-ink leading-snug">{template.name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <ChannelBadge channel={template.channel} />
            <ToneBadge tone={template.tone} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-ink-muted hover:text-primary hover:bg-primary/5 transition-colors"
            title="Edit"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-ink-secondary leading-relaxed flex-1 line-clamp-3">
        {preview}{template.body.length > 140 ? '…' : ''}
      </p>

      <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
        <button
          onClick={() => copy(template.body, template.id)}
          className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-surface-sunken transition-colors"
        >
          {copied === template.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === template.id ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={onUse}
          className="flex-1 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          Use template
        </button>
      </div>
    </div>
  )
}

// ─── Team template edit modal ─────────────────────────────────────────────────

function TeamEditModal({
  template,
  onClose,
  onSaved,
}: {
  template?: TeamTemplate
  onClose: () => void
  onSaved: (t: TeamTemplate) => void
}) {
  const [name, setName]       = useState(template?.name ?? '')
  const [channel, setChannel] = useState(template?.channel ?? 'email')
  const [tone, setTone]       = useState(template?.tone ?? 'formal')
  const [body, setBody]       = useState(template?.body ?? '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function save() {
    if (!name.trim() || !body.trim()) { setError('Name and body are required'); return }
    setSaving(true); setError('')
    try {
      const url = template ? `/api/team/templates/${template.id}` : '/api/team/templates'
      const method = template ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, channel, tone, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      onSaved(data.template)
      onClose()
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }

  const isEdit = !!template
  const fieldCls = 'w-full rounded-lg border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <h2 className="font-semibold text-ink">{isEdit ? 'Edit team template' : 'New team template'}</h2>
            {!isEdit && <p className="text-xs text-ink-muted mt-0.5">Will go to admin for approval if you&apos;re a member</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-sunken text-ink-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Template name</label>
            <input className={fieldCls} placeholder="e.g. Offer Letter — Formal" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink mb-1.5">Channel</label>
              <select className={fieldCls} value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink mb-1.5">Tone</label>
              <select className={fieldCls} value={tone} onChange={e => setTone(e.target.value)}>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Message body <span className="text-xs font-normal text-ink-muted">Use {'{{placeholder}}'} for dynamic fields</span>
            </label>
            <textarea className={`${fieldCls} font-mono resize-none`} rows={10}
              placeholder="Hi {{candidate_name}},&#10;&#10;Your message here..."
              value={body} onChange={e => setBody(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-ink-secondary hover:text-ink hover:bg-surface-sunken transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? 'Save changes' : 'Submit template'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Version history modal ────────────────────────────────────────────────────

function VersionHistoryModal({
  templateId,
  templateName,
  onClose,
  onRestored,
}: {
  templateId: string
  templateName: string
  onClose: () => void
  onRestored: (t: TeamTemplate) => void
}) {
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [loading, setLoading]   = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/team/templates/${templateId}/versions`)
      .then(r => r.json())
      .then(d => setVersions(d.versions ?? []))
      .finally(() => setLoading(false))
  }, [templateId])

  async function restore(versionId: string) {
    setRestoring(versionId)
    const res = await fetch(`/api/team/templates/${templateId}/versions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    })
    const data = await res.json()
    if (res.ok) { onRestored(data.template); onClose() }
    setRestoring(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <h2 className="font-semibold text-ink">Version history</h2>
            <p className="text-xs text-ink-muted mt-0.5">{templateName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-sunken text-ink-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-10 gap-2 text-ink-muted">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading versions…
            </div>
          )}
          {!loading && versions.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-10">No version history yet. Versions are saved automatically when you edit a template.</p>
          )}
          {!loading && versions.length > 0 && (
            <div className="flex flex-col gap-2">
              {versions.map(v => (
                <div key={v.id} className="border border-surface-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">v{v.version} — {v.name}</p>
                      <p className="text-xs text-ink-muted">
                        by {v.changed_by_name} · {new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                    <button
                      onClick={() => restore(v.id)}
                      disabled={!!restoring}
                      className="flex items-center gap-1.5 text-xs border border-surface-border px-3 py-1.5 rounded-lg hover:bg-surface-sunken transition-colors disabled:opacity-50"
                    >
                      {restoring === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Restore
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary line-clamp-3 font-mono bg-surface-sunken rounded-lg p-2">{v.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Team template card ───────────────────────────────────────────────────────

function TeamCard({
  template,
  isAdmin,
  isOwner,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onViewHistory,
  onUse,
}: {
  template: TeamTemplate
  isAdmin: boolean
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
  onApprove: () => void
  onReject: () => void
  onViewHistory: () => void
  onUse: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [acting, setActing] = useState(false)
  const preview = template.body.slice(0, 120)

  const statusColor = {
    approved:         'bg-green-100 text-green-700',
    pending_approval: 'bg-amber-100 text-amber-700',
    rejected:         'bg-red-100 text-red-600',
  }[template.status] ?? 'bg-surface-sunken text-ink-muted'

  const statusLabel = {
    approved:         'Approved',
    pending_approval: 'Pending approval',
    rejected:         'Rejected',
  }[template.status] ?? template.status

  function copyBody() {
    navigator.clipboard.writeText(template.body)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function approve() {
    setActing(true); onApprove(); setActing(false)
  }

  return (
    <div className={cn(
      'flex flex-col gap-3 p-4 rounded-xl border bg-surface-card transition-colors',
      template.status === 'pending_approval' ? 'border-amber-200' : 'border-surface-border'
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-ink leading-snug">{template.name}</h3>
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            <ChannelBadge channel={template.channel} />
            <ToneBadge tone={template.tone} />
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', statusColor)}>{statusLabel}</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1">by {template.created_by_name}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onViewHistory} title="Version history" className="p-1.5 rounded-lg text-ink-muted hover:text-primary hover:bg-primary/5 transition-colors">
            <History className="w-3.5 h-3.5" />
          </button>
          {(isAdmin || isOwner) && (
            <button onClick={onEdit} title="Edit" className="p-1.5 rounded-lg text-ink-muted hover:text-primary hover:bg-primary/5 transition-colors">
              <Pen className="w-3.5 h-3.5" />
            </button>
          )}
          {isAdmin && (
            <button onClick={onDelete} title="Delete" className="p-1.5 rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {template.rejection_note && (
        <div className="flex gap-2 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{template.rejection_note}</p>
        </div>
      )}

      <p className="text-xs text-ink-secondary leading-relaxed flex-1 line-clamp-3">
        {preview}{template.body.length > 120 ? '…' : ''}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
        {/* Admin approval controls for pending */}
        {isAdmin && template.status === 'pending_approval' && (
          <>
            <button
              onClick={approve} disabled={acting}
              className="flex items-center gap-1 text-xs bg-primary text-white px-2.5 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Approve
            </button>
            <button
              onClick={onReject} disabled={acting}
              className="flex items-center gap-1 text-xs border border-surface-border px-2.5 py-1.5 rounded-lg hover:bg-surface-sunken transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {template.status === 'approved' && (
          <>
            <button onClick={copyBody}
              className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-surface-sunken transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={onUse}
              className="flex-1 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              Use template
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [tab, setTab] = useState<Tab>('library')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<TemplateChannel | 'all'>('all')

  const [favorites, setFavorites] = useState<string[]>([])
  const [loadingFavs, setLoadingFavs] = useState(true)
  const [myTemplates, setMyTemplates] = useState<SavedTemplate[]>([])
  const [loadingMy, setLoadingMy] = useState(true)

  const [useModal, setUseModal] = useState<HRTemplate | SavedTemplate | null>(null)
  const [editModal, setEditModal] = useState<{ template?: SavedTemplate } | null>(null)

  // Team tab state
  const [teamTemplates, setTeamTemplates]   = useState<TeamTemplate[]>([])
  const [teamRole, setTeamRole]             = useState<string>('')
  const [loadingTeam, setLoadingTeam]       = useState(false)
  const [teamLoaded, setTeamLoaded]         = useState(false)
  const [teamEditModal, setTeamEditModal]   = useState<{ template?: TeamTemplate } | null>(null)
  const [versionModal, setVersionModal]     = useState<TeamTemplate | null>(null)
  const [rejectTarget, setRejectTarget]     = useState<string | null>(null)
  const [rejectNote, setRejectNote]         = useState('')
  const [currentUserId]                     = useState('')

  useEffect(() => {
    fetch('/api/template-favorites')
      .then(r => r.json())
      .then(d => setFavorites(d.favorites ?? []))
      .finally(() => setLoadingFavs(false))
  }, [])

  useEffect(() => {
    fetch('/api/saved-templates')
      .then(r => r.json())
      .then(d => setMyTemplates(d.templates ?? []))
      .finally(() => setLoadingMy(false))
  }, [])

  // Load team templates on first visit to team tab
  useEffect(() => {
    if (tab !== 'team' || teamLoaded) return
    setLoadingTeam(true)
    Promise.all([
      fetch('/api/team/templates').then(r => r.json()),
      fetch('/api/team/workspace').then(r => r.json()),
    ]).then(([tplData, wsData]) => {
      setTeamTemplates(tplData.templates ?? [])
      setTeamRole(tplData.role ?? wsData.role ?? '')
    }).finally(() => { setLoadingTeam(false); setTeamLoaded(true) })
    // Also get current user id for owner check
    fetch('/api/user/profile').catch(() => {}).then(async r => {
      if (!r || !r.ok) return
      // We don't have a /api/user/me — use workspace members list to find self
    })
  }, [tab, teamLoaded])

  async function toggleFavorite(templateId: string) {
    const isFav = favorites.includes(templateId)
    setFavorites(prev => isFav ? prev.filter(id => id !== templateId) : [...prev, templateId])
    if (isFav) {
      await fetch(`/api/template-favorites/${templateId}`, { method: 'DELETE' })
    } else {
      await fetch('/api/template-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
    }
  }

  async function deleteMyTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    setMyTemplates(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/saved-templates/${id}`, { method: 'DELETE' })
  }

  // Team template helpers
  function onTeamTemplateSaved(saved: TeamTemplate) {
    setTeamTemplates(prev => {
      const idx = prev.findIndex(t => t.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
  }

  async function handleTeamApprove(id: string) {
    const res = await fetch(`/api/team/templates/${id}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    const data = await res.json()
    if (res.ok) onTeamTemplateSaved(data.template)
  }

  async function handleTeamReject(id: string, note: string) {
    const res = await fetch(`/api/team/templates/${id}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', note }),
    })
    const data = await res.json()
    if (res.ok) { onTeamTemplateSaved(data.template); setRejectTarget(null); setRejectNote('') }
  }

  async function handleTeamDelete(id: string) {
    if (!confirm('Delete this team template?')) return
    const res = await fetch(`/api/team/templates/${id}`, { method: 'DELETE' })
    if (res.ok) setTeamTemplates(prev => prev.filter(t => t.id !== id))
  }

  function onTemplateSaved(saved: SavedTemplate) {
    setMyTemplates(prev => {
      const idx = prev.findIndex(t => t.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
  }

  // Filtered library templates
  const filteredLibrary = useMemo(() => {
    let list = HR_TEMPLATES
    if (tab === 'favorites') list = list.filter(t => favorites.includes(t.id))
    if (selectedCategory !== 'all') list = list.filter(t => t.category === selectedCategory)
    if (channelFilter !== 'all') list = list.filter(t => t.channel === channelFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        CATEGORY_META[t.category].label.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, selectedCategory, channelFilter, search, favorites])

  // Category counts for sidebar
  const categoryCounts = useMemo(() => {
    const base = tab === 'favorites'
      ? HR_TEMPLATES.filter(t => favorites.includes(t.id))
      : HR_TEMPLATES
    return CATEGORY_ORDER.reduce<Record<string, number>>((acc, cat) => {
      acc[cat] = base.filter(t => t.category === cat).length
      return acc
    }, {})
  }, [tab, favorites])

  const showSidebar = tab === 'library' || tab === 'favorites'

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ── */}
      <div className="px-6 py-5 border-b border-surface-border">
        <h1 className="text-xl font-bold text-ink">HR Template Library</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          {HR_TEMPLATES.length}+ ready-to-use templates across 13 HR categories — copy, personalise, and send.
        </p>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mt-4 bg-surface-sunken rounded-xl p-1 w-fit">
          {([
            { id: 'library',   label: 'Library',        count: HR_TEMPLATES.length  },
            { id: 'my',        label: 'My Templates',   count: myTemplates.length   },
            { id: 'favorites', label: 'Favorites',      count: favorites.length     },
            { id: 'team',      label: 'Team Library',   count: teamTemplates.filter(t => t.status === 'approved').length },
          ] as { id: Tab; label: string; count: number }[]).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedCategory('all'); setSearch('') }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-white shadow-sm text-ink'
                  : 'text-ink-secondary hover:text-ink'
              )}
            >
              {t.label}
              <span className={cn(
                'text-[10px] rounded-full px-1.5 py-0.5 font-semibold',
                tab === t.id ? 'bg-primary text-white' : 'bg-surface-border text-ink-muted'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar (Library + Favorites tabs) */}
        {showSidebar && (
          <aside className="w-52 shrink-0 border-r border-surface-border overflow-y-auto py-3">
            <p className="px-4 text-[10px] font-semibold uppercase tracking-wide text-ink-muted mb-1">Category</p>

            {/* All */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-1.5 text-sm transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-sunken'
              )}
            >
              <span>All categories</span>
              <span className="text-[11px] text-ink-muted tabular-nums">
                {tab === 'favorites' ? favorites.length : HR_TEMPLATES.length}
              </span>
            </button>

            {CATEGORY_ORDER.map(cat => {
              const meta = CATEGORY_META[cat]
              const count = categoryCounts[cat] ?? 0
              if (tab === 'favorites' && count === 0) return null
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-1.5 text-sm transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary/5 text-primary font-medium'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-sunken'
                  )}
                >
                  <span>{meta.emoji}</span>
                  <span className="flex-1 text-left">{meta.label}</span>
                  <span className="text-[11px] text-ink-muted tabular-nums">{count}</span>
                </button>
              )
            })}
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Library / Favorites tab ── */}
          {(tab === 'library' || tab === 'favorites') && (
            <div className="flex flex-col h-full">
              {/* Filters */}
              <div className="sticky top-0 bg-surface-base z-10 px-6 py-3 border-b border-surface-border flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-surface-border bg-surface-card text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Search templates…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {/* Channel filter */}
                <div className="flex items-center gap-1 bg-surface-sunken rounded-lg p-0.5">
                  {([['all', 'All'], ['email', 'Email'], ['whatsapp', 'WhatsApp']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setChannelFilter(val === 'all' ? 'all' : val as TemplateChannel)}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                        channelFilter === val
                          ? 'bg-white shadow-sm text-ink'
                          : 'text-ink-secondary hover:text-ink'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="p-6 flex-1">
                {tab === 'favorites' && loadingFavs ? (
                  <div className="flex items-center justify-center py-20 text-ink-muted text-sm">Loading…</div>
                ) : filteredLibrary.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <BookOpen className="w-10 h-10 text-ink-muted/40" />
                    <p className="text-ink-secondary font-medium">
                      {tab === 'favorites' ? 'No favorites yet' : 'No templates match'}
                    </p>
                    <p className="text-sm text-ink-muted max-w-xs">
                      {tab === 'favorites'
                        ? 'Star templates from the Library to find them here quickly.'
                        : 'Try a different search or category.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredLibrary.map(tpl => (
                      <LibraryCard
                        key={tpl.id}
                        template={tpl}
                        isFavorite={favorites.includes(tpl.id)}
                        onFavorite={() => toggleFavorite(tpl.id)}
                        onUse={() => setUseModal(tpl)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── My Templates tab ── */}
          {tab === 'my' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-ink">My Templates</h2>
                  <p className="text-sm text-ink-muted mt-0.5">Your company&apos;s saved reusable messages</p>
                </div>
                <button
                  onClick={() => setEditModal({})}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New template
                </button>
              </div>

              {loadingMy ? (
                <div className="flex items-center justify-center py-20 text-ink-muted text-sm">Loading…</div>
              ) : myTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-primary/40" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">No saved templates yet</p>
                    <p className="text-sm text-ink-muted mt-1 max-w-xs">
                      Create your company&apos;s own reusable messages with dynamic placeholders — like offer letters in your brand voice.
                    </p>
                  </div>
                  <button
                    onClick={() => setEditModal({})}
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create your first template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myTemplates.map(tpl => (
                    <SavedCard
                      key={tpl.id}
                      template={tpl}
                      onEdit={() => setEditModal({ template: tpl })}
                      onDelete={() => deleteMyTemplate(tpl.id)}
                      onUse={() => setUseModal(tpl)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {/* ── Team Library tab ── */}
          {tab === 'team' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-ink flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Team Library
                    {teamRole && (
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                        teamRole === 'admin' ? 'bg-primary text-white' : 'bg-surface-sunken text-ink-muted'
                      )}>
                        {teamRole === 'admin' && <Crown className="w-2.5 h-2.5" />}
                        {teamRole}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-ink-muted mt-0.5">Shared templates across your recruiting team</p>
                </div>
                {teamRole ? (
                  <button
                    onClick={() => setTeamEditModal({})}
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {teamRole === 'admin' ? 'New template' : 'Submit template'}
                  </button>
                ) : null}
              </div>

              {loadingTeam ? (
                <div className="flex items-center justify-center py-20 gap-2 text-ink-muted text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading team templates…
                </div>
              ) : !teamRole ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary/40" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">No team workspace</p>
                    <p className="text-sm text-ink-muted mt-1 max-w-xs">
                      Create or join a team workspace to share templates with your colleagues.
                    </p>
                  </div>
                  <a href="/team" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    Go to Team settings
                  </a>
                </div>
              ) : teamTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary/40" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">No team templates yet</p>
                    <p className="text-sm text-ink-muted mt-1 max-w-xs">
                      {teamRole === 'admin'
                        ? 'Create your first shared template — or invite team members to submit templates for your review.'
                        : 'Submit a template and your team admin will review it before it appears here.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setTeamEditModal({})}
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {teamRole === 'admin' ? 'Create first template' : 'Submit template'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Pending count for admins */}
                  {teamRole === 'admin' && teamTemplates.some(t => t.status === 'pending_approval') && (
                    <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">{teamTemplates.filter(t => t.status === 'pending_approval').length}</span> template{teamTemplates.filter(t => t.status === 'pending_approval').length !== 1 ? 's' : ''} waiting for your approval
                      </p>
                    </div>
                  )}

                  {/* Reject dialog */}
                  {rejectTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                      <div className="bg-white rounded-xl shadow-raised p-6 w-full max-w-sm flex flex-col gap-4">
                        <p className="font-semibold text-ink">Reject template</p>
                        <input
                          value={rejectNote}
                          onChange={e => setRejectNote(e.target.value)}
                          placeholder="Reason for rejection (optional)"
                          className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setRejectTarget(null)} className="px-4 py-2 text-sm text-ink-secondary hover:text-ink rounded-lg hover:bg-surface-sunken">Cancel</button>
                          <button
                            onClick={() => handleTeamReject(rejectTarget, rejectNote)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                          >
                            Confirm reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {teamTemplates.map(tpl => (
                      <TeamCard
                        key={tpl.id}
                        template={tpl}
                        isAdmin={teamRole === 'admin'}
                        isOwner={tpl.user_id === currentUserId}
                        onEdit={() => setTeamEditModal({ template: tpl })}
                        onDelete={() => handleTeamDelete(tpl.id)}
                        onApprove={() => handleTeamApprove(tpl.id)}
                        onReject={() => setRejectTarget(tpl.id)}
                        onViewHistory={() => setVersionModal(tpl)}
                        onUse={() => setUseModal(tpl as unknown as SavedTemplate)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {useModal && (
        <UseModal
          template={useModal}
          onClose={() => setUseModal(null)}
        />
      )}
      {editModal && (
        <EditModal
          template={editModal.template}
          onClose={() => setEditModal(null)}
          onSaved={onTemplateSaved}
        />
      )}
      {teamEditModal && (
        <TeamEditModal
          template={teamEditModal.template}
          onClose={() => setTeamEditModal(null)}
          onSaved={onTeamTemplateSaved}
        />
      )}
      {versionModal && (
        <VersionHistoryModal
          templateId={versionModal.id}
          templateName={versionModal.name}
          onClose={() => setVersionModal(null)}
          onRestored={onTeamTemplateSaved}
        />
      )}
    </div>
  )
}
