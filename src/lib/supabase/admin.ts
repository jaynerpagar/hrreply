import { createClient } from '@supabase/supabase-js'

// Service-role client: bypasses RLS. Server-only — never import from a client
// component. Use it only for writes users must not be able to make themselves
// (plan, usage counters, subscriptions, workspace membership), always scoped
// to an id the server has already verified.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role is not configured')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
