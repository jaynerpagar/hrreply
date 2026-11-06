import crypto from 'crypto'

// OAuth `state` handling (CSRF protection for the authorization-code flow).
// The start route stores a random nonce, bound to the signed-in user, in an
// httpOnly cookie and sends the same nonce to the provider as `state`. The
// callback only accepts a code whose `state` matches the cookie, so an attacker
// can't get their own authorization code linked to a victim's account.

export const ZOHO_STATE_COOKIE = 'zoho_oauth_state'
export const OAUTH_STATE_MAX_AGE = 60 * 10 // 10 minutes

export function createOAuthState(userId: string) {
  const nonce = crypto.randomBytes(32).toString('hex')
  return { state: nonce, cookieValue: `${nonce}.${userId}` }
}

export function verifyOAuthState(
  stateParam: string | null,
  cookieValue: string | undefined,
  userId: string,
): boolean {
  if (!stateParam || !cookieValue) return false
  const dot = cookieValue.indexOf('.')
  if (dot <= 0) return false
  const nonce = cookieValue.slice(0, dot)
  const boundUser = cookieValue.slice(dot + 1)
  if (boundUser !== userId) return false

  const a = Buffer.from(nonce, 'utf8')
  const b = Buffer.from(stateParam, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
