import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (errorParam) {
    console.error('[auth/callback] provider error:', errorParam, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`)
  }

  const response = NextResponse.redirect(`${origin}/dashboard`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Support both OAuth / PKCE (code) and email confirmation links (token_hash + type)
  let user = null
  let authError = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    user = data?.user ?? null
    authError = error
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    user = data?.user ?? null
    authError = error
  } else {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  if (!authError && user) {
    const meta = user.user_metadata ?? {}
    const { error: upsertError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: meta.full_name ?? meta.name ?? '',
      company: meta.company ?? '',
      role: meta.role ?? '',
      phone: meta.phone ?? '',
      default_tone: 'friendly',
      plan: 'free',
      replies_used: 0,
      replies_reset_at: new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: true })

    if (upsertError) console.error('[auth/callback] upsert error:', upsertError.message)
    return response
  }

  console.error('[auth/callback] auth failed:', authError?.message)
  return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent(authError?.message ?? 'unknown')}`)
}
