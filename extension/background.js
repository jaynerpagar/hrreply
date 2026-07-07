// HRReply Extension — Background Service Worker
const SUPABASE_URL = 'https://vfpqftcfimupgdccnrnh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmcHFmdGNmaW11cGdkY2Nucm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTYwNTAsImV4cCI6MjA5NjQ5MjA1MH0.8GqIaWTZvVy5kCvsGpKKUnfa4Iyp0yHsRKSuR2i-Cyw'
const API_BASE = 'https://www.hrreply.in'

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_USER') {
    getUser().then(sendResponse)
    return true
  }
  if (msg.type === 'LOGIN') {
    handleLogin(msg.email, msg.password).then(sendResponse)
    return true
  }
  if (msg.type === 'GENERATE') {
    handleGenerate(msg.payload).then(sendResponse)
    return true
  }
  if (msg.type === 'LOGOUT') {
    chrome.storage.local.remove(['access_token', 'refresh_token', 'expires_at', 'user_email'])
    sendResponse({ ok: true })
  }
})

async function handleLogin(email, password) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      return { error: data.error_description || data.error || 'Invalid email or password.' }
    }
    const expiresAt = data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600))
    await chrome.storage.local.set({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    expiresAt,
      user_email:    data.user?.email ?? email,
    })
    return { ok: true, email: data.user?.email ?? email }
  } catch {
    return { error: 'Network error. Please try again.' }
  }
}

async function getUser() {
  const data = await chrome.storage.local.get(['access_token', 'user_email'])
  if (!data.access_token) return null
  return { email: data.user_email ?? '' }
}

async function getValidToken() {
  const data = await chrome.storage.local.get(['access_token', 'refresh_token', 'expires_at'])
  if (!data.access_token) return null

  const now = Math.floor(Date.now() / 1000)
  if (data.expires_at && now >= data.expires_at - 60) {
    return await refreshToken(data.refresh_token)
  }
  return data.access_token
}

async function refreshToken(refreshToken) {
  if (!refreshToken) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      await chrome.storage.local.remove(['access_token', 'refresh_token', 'expires_at', 'user_email'])
      return null
    }
    const data = await res.json()
    const expiresAt = data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600))
    await chrome.storage.local.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      user_email: data.user?.email,
    })
    return data.access_token
  } catch {
    return null
  }
}

async function handleGenerate(payload) {
  const token = await getValidToken()
  if (!token) return { error: 'Not signed in' }

  try {
    const res = await fetch(`${API_BASE}/api/ext/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'Generation failed' }
    return { text: data.generated_text }
  } catch (e) {
    return { error: 'Network error. Check your connection.' }
  }
}
