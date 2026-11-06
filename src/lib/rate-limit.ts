import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Per-user limits shared by every route that calls the Anthropic API.
// Counters live in Postgres (see supabase-migration-security.sql) so they hold
// across serverless instances.
const LIMITS = [
  { bucket: 'ai:minute', max: 20, windowSeconds: 60 },
  { bucket: 'ai:day', max: 500, windowSeconds: 60 * 60 * 24 },
] as const

/**
 * Returns a 429 response if the user is over their AI limit, otherwise null.
 * Call after authenticating the user and before calling Anthropic.
 */
export async function enforceAiRateLimit(
  userId: string,
  headers?: Record<string, string>,
): Promise<NextResponse | null> {
  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    console.error('[rate-limit] admin client unavailable:', err)
    return null
  }

  for (const { bucket, max, windowSeconds } of LIMITS) {
    const { data, error } = await admin.rpc('check_ai_rate_limit', {
      p_user_id: userId,
      p_bucket: bucket,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      // Fail open so a missing migration doesn't take every AI feature down,
      // but make it loud.
      console.error('[rate-limit] check_ai_rate_limit failed — is the security migration applied?', error.message)
      return null
    }
    if (data === false) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many AI requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(windowSeconds === 60 ? 60 : 3600), ...headers } },
      )
    }
  }
  return null
}
