'use client'

import { useState, useEffect } from 'react'
import {
  Users, Plus, Mail, Loader2, Trash2, Check,
  Crown, UserCheck, Clock, AlertTriangle, ChevronRight,
  Shield, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workspace {
  id: string
  name: string
  owner_id: string
}

interface Member {
  id: string
  user_id: string
  role: string
  invited_email: string
  status: string
  created_at: string
  users: { full_name: string; email: string } | null
}

interface Invite {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
}

interface TeamTemplate {
  id: string
  name: string
  channel: string
  tone: string
  body: string
  status: string
  rejection_note: string | null
  created_by_name: string
  user_id: string
  created_at: string
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
      role === 'admin' ? 'bg-primary text-white' : 'bg-surface-sunken text-ink-muted'
    )}>
      {role === 'admin' ? <Crown className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
      {role}
    </span>
  )
}

// ─── Approval card ────────────────────────────────────────────────────────────

function ApprovalCard({ tpl, onAction }: {
  tpl: TeamTemplate
  onAction: (id: string, action: 'approve' | 'reject', note?: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)

  async function act(action: 'approve' | 'reject') {
    setActing(true)
    onAction(tpl.id, action, action === 'reject' ? note : undefined)
  }

  return (
    <div className="border border-surface-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-amber-50 border-b border-surface-border flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{tpl.name}</p>
          <p className="text-xs text-ink-muted">by {tpl.created_by_name} · {tpl.channel} · {tpl.tone}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-ink-secondary line-clamp-3 mb-3">{tpl.body}</p>

        {!rejecting ? (
          <div className="flex gap-2">
            <button
              onClick={() => act('approve')}
              disabled={acting}
              className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Approve
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={acting}
              className="flex items-center gap-1.5 border border-surface-border px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-sunken transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-surface-border rounded-lg px-3 py-1.5 text-xs text-ink bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => act('reject')}
                disabled={acting}
                className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm reject
              </button>
              <button onClick={() => setRejecting(false)} className="text-xs text-ink-muted hover:text-ink px-2">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [workspace, setWorkspace] = useState<Workspace | null | undefined>(undefined)
  const [myRole, setMyRole] = useState<string>('')
  const [memberCount, setMemberCount] = useState(0)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [pendingTemplates, setPendingTemplates] = useState<TeamTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Create workspace form
  const [wsName, setWsName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteError, setInviteError] = useState('')

  const isAdmin = myRole === 'admin'

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadWorkspace() }, [])

  async function loadWorkspace() {
    setLoading(true)
    const res = await fetch('/api/team/workspace')
    const data = await res.json()
    setWorkspace(data.workspace ?? null)
    setMyRole(data.role ?? '')
    setMemberCount(data.memberCount ?? 0)

    if (data.workspace) {
      await Promise.all([loadMembers(), loadPendingTemplates()])
    }
    setLoading(false)
  }

  async function loadMembers() {
    const res = await fetch('/api/team/members')
    const data = await res.json()
    setMembers(data.members ?? [])
    setInvites(data.invites ?? [])
  }

  async function loadPendingTemplates() {
    const res = await fetch('/api/team/templates')
    const data = await res.json()
    const pending = (data.templates ?? []).filter((t: TeamTemplate) => t.status === 'pending_approval')
    setPendingTemplates(pending)
  }

  async function handleCreateWorkspace() {
    if (!wsName.trim()) return
    setCreating(true); setCreateError('')
    const res = await fetch('/api/team/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: wsName }),
    })
    const data = await res.json()
    if (!res.ok) { setCreateError(data.error ?? 'Failed'); setCreating(false); return }
    setWorkspace(data.workspace)
    setMyRole(data.role)
    setMemberCount(1)
    setCreating(false)
    await loadMembers()
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg(''); setInviteError('')
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) { setInviteError(data.error ?? 'Failed'); setInviting(false); return }
    setInviteMsg(`Invite sent to ${inviteEmail}`)
    setInviteEmail('')
    setInviting(false)
    await loadMembers()
  }

  async function handleRevokeInvite(inviteId: string) {
    await fetch('/api/team/invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })
    setInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  async function handleTemplateAction(id: string, action: 'approve' | 'reject', note?: string) {
    const res = await fetch(`/api/team/templates/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    })
    if (res.ok) {
      setPendingTemplates(prev => prev.filter(t => t.id !== id))
    }
  }

  const inputCls = 'flex-1 border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-ink-muted">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading team…
      </div>
    )
  }

  return (
    <div className="px-6 py-6 flex flex-col gap-6 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Users className="w-4 h-4 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-ink">Team Workspace</h1>
        </div>
        <p className="text-sm text-ink-muted">Share templates, manage approvals, and collaborate with your recruiting team</p>
      </div>

      {/* ── No workspace: create one ──────────────────────────────────────── */}
      {workspace === null && (
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-ink mb-1">Create your team workspace</p>
            <p className="text-sm text-ink-muted max-w-sm">
              Give your workspace a name — then invite teammates to share templates, review each other&apos;s work, and collaborate.
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-sm">
            <input
              value={wsName}
              onChange={e => setWsName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
              placeholder="e.g. Acme HR Team"
              className={`${inputCls} max-w-none`}
            />
            <button
              onClick={handleCreateWorkspace}
              disabled={creating || !wsName.trim()}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left w-full max-w-sm">
            <p className="text-xs font-semibold text-amber-800 mb-0.5">Team plan required</p>
            <p className="text-xs text-amber-700">
              Workspaces are available on the Team plan. <a href="/upgrade" className="underline">Upgrade</a> to unlock.
            </p>
          </div>
        </div>
      )}

      {/* ── Has workspace ─────────────────────────────────────────────────── */}
      {workspace && (
        <>
          {/* Workspace header */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-ink">{workspace.name}</p>
                <RoleBadge role={myRole} />
              </div>
              <p className="text-xs text-ink-muted">{memberCount} active member{memberCount !== 1 ? 's' : ''}</p>
            </div>
            <a href="/templates" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              Team Library <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Pending approvals (admin only) */}
          {isAdmin && pendingTemplates.length > 0 && (
            <div className="bg-surface-card border border-amber-200 rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border bg-amber-50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-bold text-ink">Pending approvals</p>
                <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {pendingTemplates.length}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {pendingTemplates.map(t => (
                  <ApprovalCard key={t.id} tpl={t} onAction={handleTemplateAction} />
                ))}
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border">
              <p className="text-sm font-bold text-ink">Members</p>
            </div>
            <div className="divide-y divide-surface-border">
              {members.filter(m => m.status === 'active').map(m => (
                <div key={m.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {(m.users?.full_name ?? m.invited_email ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {m.users?.full_name ?? m.invited_email ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{m.users?.email ?? m.invited_email}</p>
                  </div>
                  <RoleBadge role={m.role} />
                </div>
              ))}
              {members.filter(m => m.status === 'active').length === 0 && (
                <p className="px-5 py-4 text-sm text-ink-muted">No members yet.</p>
              )}
            </div>
          </div>

          {/* Pending invites */}
          {isAdmin && invites.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-ink">Pending invites</p>
              </div>
              <div className="divide-y divide-surface-border">
                {invites.map(inv => (
                  <div key={inv.id} className="px-5 py-3 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-ink-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{inv.email}</p>
                      <p className="text-xs text-ink-muted">
                        Invited as {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="p-1.5 rounded text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Revoke invite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite form (admin only) */}
          {isAdmin && (
            <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-ink">Invite a teammate</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    placeholder="teammate@company.com"
                    className={inputCls}
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="border border-surface-border rounded-lg px-3 py-2 text-sm text-ink bg-white focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Invite
                  </button>
                </div>

                {inviteMsg && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 shrink-0" /> {inviteMsg}
                  </div>
                )}
                {inviteError && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {inviteError}
                  </div>
                )}

                <p className="text-xs text-ink-muted">
                  Members can create templates (pending your approval). Admins can approve, edit, and manage all templates.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
