// HRReply Popup — login/connected state
const SUPABASE_URL = HRREPLY_CONFIG.SUPABASE_URL
const SUPABASE_ANON_KEY = HRREPLY_CONFIG.SUPABASE_ANON_KEY

const viewLogin     = document.getElementById('view-login')
const viewConnected = document.getElementById('view-connected')
const loginForm     = document.getElementById('login-form')
const loginBtn      = document.getElementById('login-btn')
const loginLabel    = document.getElementById('login-label')
const loginSpinner  = document.getElementById('login-spinner')
const loginError    = document.getElementById('login-error')
const userEmailEl   = document.getElementById('user-email')
const logoutBtn     = document.getElementById('logout-btn')

// On open: check if already signed in
chrome.storage.local.get(['access_token', 'user_email'], (data) => {
  if (data.access_token) {
    showConnected(data.user_email ?? '')
  } else {
    showLogin()
  }
})

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email    = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  setLoading(true)
  hideError()

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      showError(data.error_description || data.error || 'Invalid email or password.')
      setLoading(false)
      return
    }

    const expiresAt = data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600))
    await chrome.storage.local.set({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    expiresAt,
      user_email:    data.user?.email ?? email,
    })

    showConnected(data.user?.email ?? email)
  } catch {
    showError('Network error. Please try again.')
    setLoading(false)
  }
})

logoutBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
    showLogin()
  })
})

function showLogin() {
  viewLogin.classList.remove('hidden')
  viewConnected.classList.add('hidden')
}

function showConnected(email) {
  viewLogin.classList.add('hidden')
  viewConnected.classList.remove('hidden')
  userEmailEl.textContent = email
  setLoading(false)
}

function setLoading(on) {
  loginBtn.disabled = on
  loginLabel.textContent = on ? 'Signing in…' : 'Sign in'
  loginSpinner.classList.toggle('hidden', !on)
}

function showError(msg) {
  loginError.textContent = msg
  loginError.classList.remove('hidden')
}

function hideError() {
  loginError.classList.add('hidden')
}
