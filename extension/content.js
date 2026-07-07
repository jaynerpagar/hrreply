// HRReply Gmail Content Script
// HRREPLY_CONFIG is loaded from config.js (listed before this in manifest)

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

  // Insert right before the Send button
  sendBtn.parentElement.insertBefore(btn, sendBtn)
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

  // Check auth via background worker
  chrome.runtime.sendMessage({ type: 'GET_USER' }, (user) => {
    if (chrome.runtime.lastError) {
      renderAuthPrompt()
      return
    }
    if (!user) {
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

function renderAuthPrompt() {
  setContent(`
    <div class="hrp-auth">
      <p>Sign in to HRReply to generate professional HR messages.</p>
      <a class="hrp-auth-link" href="${HRREPLY_CONFIG.API_BASE}/login" target="_blank">
        Sign in to HRReply →
      </a>
    </div>
  `)
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

    chrome.runtime.sendMessage({
      type: 'GENERATE',
      payload: {
        reply_type:    replyType,
        tone:          selectedTone,
        context_input: contextParts.join('\n'),
        format:        'email',
        language:      'english',
      },
    }, (res) => {
      if (chrome.runtime.lastError || !res) {
        renderForm('Extension error. Try reloading Gmail.')
        return
      }
      if (res.error) {
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
