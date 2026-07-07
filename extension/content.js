// HRReply Gmail Content Script
// HRREPLY_CONFIG is loaded from config.js (listed before this in manifest)

// Safe wrapper — chrome.runtime becomes undefined in orphaned content scripts
// (happens when the extension is reloaded while Gmail is still open).
function sendMsg(payload, callback) {
  try {
    if (!chrome?.runtime?.sendMessage) {
      callback({ error: 'reload' })
      return
    }
    chrome.runtime.sendMessage(payload, (res) => {
      if (chrome.runtime?.lastError) {
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

function findSendButton(compose) {
  return (
    compose.querySelector('[data-tooltip*="Send"]') ||
    compose.querySelector('[aria-label="Send"]') ||
    compose.querySelector('[aria-label^="Send "]')
  )
}

function injectButton(compose, msgBody) {
  const sendBtn = findSendButton(compose)
  if (!sendBtn) return

  const btn = document.createElement('div')
  btn.className = 'hrreply-compose-btn'
  btn.textContent = 'HR'
  btn.title = 'Generate with HRReply'
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    togglePanel(msgBody, btn)
  })

  // Gmail puts [data-tooltip] on every toolbar icon button.
  // The LAST one is always the Discard/trash icon.
  // Insert HR just before it so it appears on the right side of the toolbar.
  const allTooltipEls = Array.from(compose.querySelectorAll('[data-tooltip]'))
  if (allTooltipEls.length > 0) {
    const lastEl = allTooltipEls[allTooltipEls.length - 1]
    lastEl.parentElement.insertBefore(btn, lastEl)
    return
  }

  // Fallback: insert after the Send button's dropdown (▼) sibling
  const sendParent = sendBtn.parentElement
  if (sendParent) {
    const afterSend = sendBtn.nextElementSibling || sendBtn
    afterSend.insertAdjacentElement('afterend', btn)
    return
  }

  // Last resort: overlay on compose, bottom-right
  compose.style.position = 'relative'
  btn.style.cssText += ';position:absolute;bottom:10px;right:10px;z-index:9999;'
  compose.appendChild(btn)
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

  // If background SW doesn't respond within 4s, fall through to auth form
  const swTimeout = setTimeout(() => {
    if (panel) renderAuthPrompt()
  }, 4000)

  sendMsg({ type: 'GET_USER' }, (res) => {
    clearTimeout(swTimeout)
    if (!panel) return
    if (res?.error === 'reload') {
      setContent('<div class="hrp-auth"><p style="text-align:center;color:#374151;font-size:13px;">Please reload Gmail to reactivate HRReply.</p></div>')
      return
    }
    if (!res) {
      renderAuthPrompt()
    } else {
      renderForm()
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
  // Position above the compose toolbar, aligned to the right
  const bottom = window.innerHeight - rect.top + 10
  el.style.bottom = Math.max(bottom, 10) + 'px'
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
      <p style="font-size:12px;color:#6b7280;margin-bottom:12px;line-height:1.4;">Enter your HRReply credentials to generate messages directly in Gmail.</p>
      ${loginError ? `<div class="hrp-error">${loginError}</div>` : ''}
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

  const emailEl = panel.querySelector('#hrp-auth-email')
  const passEl  = panel.querySelector('#hrp-auth-pass')
  const btn     = panel.querySelector('#hrp-auth-btn')

  emailEl.focus()

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
