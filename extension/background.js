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
  if (msg.type === 'GOOGLE_LOGIN') {
    handleGoogleLogin().then(sendResponse)
    return true
  }
  if (msg.type === 'GET_REDIRECT_URL') {
    sendResponse({ url: chrome.identity.getRedirectURL() })
  }
  if (msg.type === 'CREATE_CALENDAR_EVENT') {
    handleCreateCalendarEvent(msg.event).then(sendResponse)
    return true
  }
  if (msg.type === 'LOGOUT') {
    chrome.storage.local.remove(['access_token', 'refresh_token', 'expires_at', 'user_email'])
    sendResponse({ ok: true })
  }
})

async function handleGoogleLogin() {
  try {
    const redirectUrl = chrome.identity.getRedirectURL()
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`

    return new Promise((resolve) => {
      chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          resolve({ error: chrome.runtime.lastError?.message || 'Sign in cancelled.', redirectUrl })
          return
        }
        try {
          const url = new URL(responseUrl)
          const params = new URLSearchParams(url.hash.substring(1))
          const accessToken  = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const expiresIn    = params.get('expires_in')

          if (!accessToken) {
            resolve({ error: 'Redirect URL not whitelisted in Supabase.', redirectUrl })
            return
          }

          const userRes  = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` },
          })
          const userData = await userRes.json()
          const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn || '3600')

          await chrome.storage.local.set({
            access_token:  accessToken,
            refresh_token: refreshToken,
            expires_at:    expiresAt,
            user_email:    userData.email,
          })
          resolve({ ok: true, email: userData.email })
        } catch {
          resolve({ error: 'Failed to process sign-in response.', redirectUrl })
        }
      })
    })
  } catch {
    return { error: 'Google sign in unavailable.', redirectUrl: chrome.identity.getRedirectURL() }
  }
}

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

async function getGoogleCalendarToken() {
  const stored = await chrome.storage.local.get(['gcal_token', 'gcal_expires_at'])
  const now = Math.floor(Date.now() / 1000)
  if (stored.gcal_token && stored.gcal_expires_at && now < stored.gcal_expires_at - 60) {
    return stored.gcal_token
  }

  const clientId   = HRREPLY_CONFIG?.GOOGLE_CLIENT_ID
  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') return null

  const redirectUrl = chrome.identity.getRedirectURL()
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
    `response_type=token&` +
    `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.events')}`

  return new Promise((resolve) => {
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) { resolve(null); return }
      const params = new URLSearchParams(new URL(responseUrl).hash.substring(1))
      const token     = params.get('access_token')
      const expiresIn = parseInt(params.get('expires_in') || '3600')
      if (!token) { resolve(null); return }
      await chrome.storage.local.set({
        gcal_token:      token,
        gcal_expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      })
      resolve(token)
    })
  })
}

async function handleCreateCalendarEvent(eventData) {
  const clientId = HRREPLY_CONFIG?.GOOGLE_CLIENT_ID
  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
    return { error: 'Google Calendar not configured yet. Add your Google Client ID to config.js.' }
  }

  const token = await getGoogleCalendarToken()
  if (!token) return { error: 'Google Calendar access denied. Please try again.' }

  const tz    = Intl.DateTimeFormat().resolvedOptions().timeZone
  const event = {
    summary: eventData.title,
    start:   { dateTime: eventData.start, timeZone: tz },
    end:     { dateTime: eventData.end,   timeZone: tz },
  }
  if (eventData.location) event.location = eventData.location
  if (eventData.candidateName || eventData.role) {
    event.description = [
      eventData.candidateName ? `Candidate: ${eventData.candidateName}` : '',
      eventData.role           ? `Role: ${eventData.role}`               : '',
    ].filter(Boolean).join('\n')
  }

  try {
    const res  = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(event),
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 401) {
        await chrome.storage.local.remove(['gcal_token', 'gcal_expires_at'])
        return { error: 'Session expired. Please try again.' }
      }
      return { error: data.error?.message || 'Failed to create event.' }
    }
    return { ok: true, eventLink: data.htmlLink }
  } catch {
    return { error: 'Network error. Check your connection.' }
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
