// HRReply Gmail Content Script
// HRREPLY_CONFIG is loaded from config.js (listed before this in manifest)

// Safe wrapper — handles both orphaned content scripts and sleeping service workers.
// chrome.runtime.id is undefined when the context is permanently invalidated.
// lastError with "port closed" / "does not exist" is transient (SW was sleeping) — retry.
function sendMsg(payload, callback, retries) {
  const left = retries ?? 3
  try {
    if (!chrome?.runtime?.id) {
      callback({ error: 'reload' })
      return
    }
    chrome.runtime.sendMessage(payload, (res) => {
      if (chrome.runtime?.lastError) {
        const msg = chrome.runtime.lastError.message || ''
        if (left > 0 && (
          msg.includes('port closed') ||
          msg.includes('does not exist') ||
          msg.includes('receiving end')
        )) {
          setTimeout(() => sendMsg(payload, callback, left - 1), 400)
          return
        }
        callback({ error: 'reload' })
        return
      }
      callback(res ?? { error: 'reload' })
    })
  } catch {
    callback({ error: 'reload' })
  }
}

const REPLY_TYPES = [
  { value: 'interview_invite',    label: '📅 Interview Invite' },
  { value: 'interview_reminder',  label: '⏰ Interview Reminder' },
  { value: 'shortlist',           label: '✅ Shortlisted' },
  { value: 'offer',               label: '🎉 Job Offer' },
  { value: 'rejection',           label: '🙏 Rejection' },
  { value: 'reschedule',          label: '🔄 Reschedule' },
  { value: 'no_show',             label: '👻 No Show' },
  { value: 'follow_up',           label: '💬 Follow-up' },
  { value: 'salary_negotiation',  label: '💰 Salary Discussion' },
  { value: 'joining_confirmation',label: '📝 Joining Confirmation' },
  { value: 'thank_you',           label: '⭐ Post-Interview Thanks' },
  { value: 'document_collection', label: '📋 Document Request' },
  { value: 'onboarding',          label: '🚀 Onboarding' },
  { value: 'welcome',             label: '👋 Welcome' },
  { value: 'exit_interview',      label: '🚪 Exit Interview' },
]

// Track injected bodies to avoid double-injection
const injected = new WeakSet()
let panel = null
let activeMsgBody = null

// Observe DOM for new compose windows
const observer = new MutationObserver(() => requestAnimationFrame(scanForComposeWindows))
observer.observe(document.body, { childList: true, subtree: true })
scanForComposeWindows()

function scanForComposeWindows() {
  // Target contenteditable textboxes that appear in compose/reply areas
  document.querySelectorAll('[contenteditable="true"][role="textbox"], [contenteditable="true"].Am').forEach(body => {
    if (injected.has(body)) return

    // Walk up to find a container that has a Send button
    const compose = findComposeContainer(body)
    if (!compose) return

    injected.add(body)
    injectButton(compose, body)
  })
}

function findComposeContainer(el) {
  let node = el.parentElement
  for (let i = 0; i < 20 && node; i++) {
    if (hasSendButton(node)) return node
    node = node.parentElement
  }
  return null
}

function hasSendButton(el) {
  return !!(
    el.querySelector('[data-tooltip*="Send"]') ||
    el.querySelector('[aria-label="Send"]') ||
    el.querySelector('[aria-label^="Send "]')
  )
}

// Double-tick SVG — same paths as HRReply favicon.svg
const LOGO_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 52 L36 70 L64 32" stroke="#c8f135" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M44 66 L48 70 L78 32" stroke="#ffffff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

function injectButton(compose, msgBody) {
  const btn = document.createElement('div')
  btn.className = 'hrreply-compose-btn'
  btn.innerHTML = LOGO_SVG
  btn.title = 'Generate with HRReply'
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    togglePanel(msgBody, btn)
  })

  // Float the button inside the message body area (top-right corner),
  // not in Gmail's toolbar — avoids all toolbar DOM fragility.
  const slot = msgBody.parentElement || compose
  if (window.getComputedStyle(slot).position === 'static') {
    slot.style.position = 'relative'
  }
  slot.appendChild(btn)
}

// ─── Panel ───────────────────────────────────────────────────────────────────

function togglePanel(msgBody, anchorBtn) {
  // Close if same compose was open
  if (panel) {
    panel.remove()
    panel = null
    if (activeMsgBody === msgBody) {
      activeMsgBody = null
      return
    }
  }

  activeMsgBody = msgBody
  panel = buildPanel()
  positionPanel(panel, anchorBtn)
  document.body.appendChild(panel)

  // Read auth state directly from storage — no SW needed for this check.
  // SW is only needed for LOGIN and GENERATE calls (where it's already awake by then).
  chrome.storage.local.get(['access_token'], (data) => {
    if (!panel) return
    if (data.access_token) {
      renderForm()
    } else {
      renderAuthPrompt()
    }
  })
}

function buildPanel() {
  const el = document.createElement('div')
  el.id = 'hrreply-panel'
  el.innerHTML = `
    <div class="hrp-header">
      <div class="hrp-brand">
        <div class="hrp-brand-mark">✓</div>
        HRReply
      </div>
      <button class="hrp-close" title="Close">✕</button>
    </div>
    <div class="hrp-content" id="hrp-content">
      <div style="display:flex;align-items:center;justify-content:center;padding:24px;">
        <div class="hrp-spinner"></div>
      </div>
    </div>
  `
  el.querySelector('.hrp-close').addEventListener('click', closePanel)
  return el
}

function positionPanel(el, anchorBtn) {
  const rect = anchorBtn.getBoundingClientRect()
  const panelH = 500
  const gap = 8

  // Show below the button if there's room, otherwise above
  if (rect.bottom + panelH + gap < window.innerHeight) {
    el.style.top    = (rect.bottom + gap) + 'px'
    el.style.bottom = 'auto'
  } else {
    el.style.bottom = (window.innerHeight - rect.top + gap) + 'px'
    el.style.top    = 'auto'
  }
  el.style.right = '16px'
}

function closePanel() {
  if (panel) { panel.remove(); panel = null }
  activeMsgBody = null
}

function setContent(html) {
  if (!panel) return
  panel.querySelector('#hrp-content').innerHTML = html
}

// ─── Views ───────────────────────────────────────────────────────────────────

function renderAuthPrompt(loginError) {
  setContent(`
    <div style="padding:2px 0;">
      <p style="font-size:13px;font-weight:600;color:#111827;margin-bottom:3px;">Sign in to HRReply</p>
      <p style="font-size:12px;color:#6b7280;margin-bottom:12px;line-height:1.4;">Use the same account as hrreply.in</p>
      ${loginError ? `<div class="hrp-error">${loginError}</div>` : ''}

      <button class="hrp-google-btn" id="hrp-google-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" style="flex-shrink:0">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div style="display:flex;align-items:center;gap:8px;margin:12px 0;">
        <div style="flex:1;height:1px;background:#e5e7eb;"></div>
        <span style="font-size:11px;color:#9ca3af;">or</span>
        <div style="flex:1;height:1px;background:#e5e7eb;"></div>
      </div>

      <label class="hrp-label">Email</label>
      <input class="hrp-input" id="hrp-auth-email" type="email" placeholder="you@company.com" autocomplete="email" />
      <label class="hrp-label" style="margin-top:8px;">Password</label>
      <input class="hrp-input" id="hrp-auth-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
      <button class="hrp-generate-btn" id="hrp-auth-btn" style="margin-top:12px;">Sign in</button>
      <a href="${HRREPLY_CONFIG.API_BASE}/login" target="_blank"
         style="display:block;text-align:center;font-size:11px;color:#9ca3af;margin-top:10px;text-decoration:none;">
        Don't have an account? Sign up →
      </a>
    </div>
  `)

  // Google sign in
  panel.querySelector('#hrp-google-btn').addEventListener('click', () => {
    const gBtn = panel.querySelector('#hrp-google-btn')
    gBtn.disabled = true
    gBtn.innerHTML = '<div class="hrp-spinner" style="margin:0 auto;border-color:rgba(0,0,0,0.15);border-top-color:#1a1a2e;"></div>'

    sendMsg({ type: 'GOOGLE_LOGIN' }, (res) => {
      if (!panel) return
      if (res?.error) {
        const extra = res.redirectUrl
          ? `<br><small style="display:block;margin-top:6px;font-size:10px;word-break:break-all;">Add to Supabase redirect URLs:<br><code>${res.redirectUrl}</code></small>`
          : ''
        renderAuthPrompt(res.error + extra)
        return
      }
      renderForm()
    })
  })

  // Email/password sign in
  const emailEl = panel.querySelector('#hrp-auth-email')
  const passEl  = panel.querySelector('#hrp-auth-pass')
  const btn     = panel.querySelector('#hrp-auth-btn')

  function doLogin() {
    const email    = emailEl.value.trim()
    const password = passEl.value
    if (!email || !password) return

    btn.disabled = true
    btn.innerHTML = '<div class="hrp-spinner" style="margin:0 auto;"></div>'

    sendMsg({ type: 'LOGIN', email, password }, (res) => {
      if (res?.error === 'reload') {
        renderAuthPrompt('Reload Gmail and try again.')
        return
      }
      if (res?.error) {
        renderAuthPrompt(res.error)
        return
      }
      renderForm()
    })
  }

  btn.addEventListener('click', doLogin)
  passEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin() })
}

function renderForm(errorMsg) {
  const typeOptions = REPLY_TYPES.map(t =>
    `<option value="${t.value}">${t.label}</option>`
  ).join('')

  setContent(`
    ${errorMsg ? `<div class="hrp-error">${errorMsg}</div>` : ''}
    <label class="hrp-label">Reply Type</label>
    <select class="hrp-select" id="hrp-type">
      ${typeOptions}
    </select>

    <label class="hrp-label">Tone</label>
    <div class="hrp-tone-pills">
      <button class="hrp-tone-pill active" data-tone="formal">Formal</button>
      <button class="hrp-tone-pill" data-tone="friendly">Friendly</button>
      <button class="hrp-tone-pill" data-tone="hinglish">Hinglish</button>
    </div>

    <label class="hrp-label">Candidate Name</label>
    <input class="hrp-input" id="hrp-name" type="text" placeholder="e.g. Priya Sharma" />

    <label class="hrp-label">Role / Position</label>
    <input class="hrp-input" id="hrp-role" type="text" placeholder="e.g. Senior Software Engineer" />

    <label class="hrp-label">Context <span class="opt">(optional)</span></label>
    <textarea class="hrp-textarea" id="hrp-ctx" placeholder="Interview date, salary range, company name…"></textarea>

    <button class="hrp-generate-btn" id="hrp-gen">Generate →</button>
  `)

  // Tone pill toggle
  let selectedTone = 'formal'
  panel.querySelectorAll('.hrp-tone-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      panel.querySelectorAll('.hrp-tone-pill').forEach(p => p.classList.remove('active'))
      pill.classList.add('active')
      selectedTone = pill.dataset.tone
    })
  })

  // Generate
  panel.querySelector('#hrp-gen').addEventListener('click', async () => {
    const replyType = panel.querySelector('#hrp-type').value
    const name      = panel.querySelector('#hrp-name').value.trim()
    const role      = panel.querySelector('#hrp-role').value.trim()
    const ctx       = panel.querySelector('#hrp-ctx').value.trim()

    const contextParts = []
    if (name)  contextParts.push(`Candidate: ${name}`)
    if (role)  contextParts.push(`Role: ${role}`)
    if (ctx)   contextParts.push(ctx)

    if (!name && !role && !ctx) {
      renderForm('Add at least a candidate name or role.')
      return
    }

    renderGenerating()

    sendMsg({
      type: 'GENERATE',
      payload: {
        reply_type:    replyType,
        tone:          selectedTone,
        context_input: contextParts.join('\n'),
        format:        'email',
        language:      'english',
      },
    }, (res) => {
      if (res?.error === 'reload') {
        renderForm('Reload Gmail and try again.')
        return
      }
      if (res?.error) {
        if (res.error === 'free_limit_reached' || res.error?.includes('quota') || res.error?.includes('Quota')) {
          renderQuotaError()
        } else {
          renderForm(res.error)
        }
        return
      }
      renderResult(res.text)
    })
  })
}

function renderGenerating() {
  setContent(`
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;gap:12px;">
      <div class="hrp-spinner"></div>
      <p style="font-size:13px;color:#6b7280;">Generating message…</p>
    </div>
  `)
}

function renderResult(text) {
  setContent(`
    <textarea class="hrp-result-textarea" id="hrp-result-text" spellcheck="false">${escHtml(text)}</textarea>
    <div class="hrp-result-actions">
      <button class="hrp-insert-btn" id="hrp-insert">Insert into Gmail</button>
      <button class="hrp-copy-btn" id="hrp-copy">Copy</button>
      <button class="hrp-back-btn" id="hrp-back">← Edit</button>
    </div>
  `)

  panel.querySelector('#hrp-insert').addEventListener('click', () => {
    const result = panel.querySelector('#hrp-result-text').value
    insertIntoGmail(result)
    closePanel()
  })

  panel.querySelector('#hrp-copy').addEventListener('click', () => {
    const result = panel.querySelector('#hrp-result-text').value
    navigator.clipboard.writeText(result).catch(() => {
      // Fallback: select text
      panel.querySelector('#hrp-result-text').select()
      document.execCommand('copy')
    })
    const btn = panel.querySelector('#hrp-copy')
    btn.textContent = 'Copied!'
    setTimeout(() => { btn.textContent = 'Copy' }, 1800)
  })

  panel.querySelector('#hrp-back').addEventListener('click', () => renderForm())
}

function renderQuotaError() {
  setContent(`
    <div class="hrp-quota-error">
      <p><strong>Monthly limit reached</strong></p>
      <small>Upgrade to Pro for unlimited messages.</small>
      <br />
      <a class="hrp-quota-link" href="${HRREPLY_CONFIG.API_BASE}/upgrade" target="_blank">
        Upgrade to Pro →
      </a>
    </div>
  `)
}

// ─── Gmail insertion ──────────────────────────────────────────────────────────

function insertIntoGmail(text) {
  if (!activeMsgBody) return
  activeMsgBody.focus()

  // Select all existing content and replace with generated text
  const range = document.createRange()
  range.selectNodeContents(activeMsgBody)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)

  // execCommand inserts as plain text (preserves Gmail formatting)
  document.execCommand('insertText', false, text)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
