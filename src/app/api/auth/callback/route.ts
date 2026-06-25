import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Log everything for debugging
  console.log('[auth/callback] origin:', origin)
  console.log('[auth/callback] code present:', !!code)
  console.log('[auth/callback] error param:', errorParam)
  console.log('[auth/callback] error_description:', errorDescription)
  console.log('[auth/callback] all cookies:', request.cookies.getAll().map(c => c.name))

  if (errorParam) {
    console.error('[auth/callback] OAuth error from provider:', errorParam, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`)
  }

  if (code) {
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] exchangeCodeForSession error:', error?.message ?? 'none')
    console.log('[auth/callback] user id:', data?.user?.id ?? 'none')

    if (!error && data.user) {
      const { error: upsertError } = await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name ?? '',
        default_tone: 'friendly',
        plan: 'free',
        replies_used: 0,
        replies_reset_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true })

      console.log('[auth/callback] upsert error:', upsertError?.message ?? 'none')
      return response
    }

    console.error('[auth/callback] session exchange failed, redirecting to login')
    return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent(error?.message ?? 'unknown')}`)
  }

  console.error('[auth/callback] no code in request')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
