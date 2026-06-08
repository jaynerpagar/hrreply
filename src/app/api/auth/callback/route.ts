import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert user profile
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name ?? '',
        default_tone: 'friendly',
        plan: 'free',
        replies_used: 0,
        replies_reset_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true })

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
