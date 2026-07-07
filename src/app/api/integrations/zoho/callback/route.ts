import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.hrreply.in'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const code  = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=zoho_denied`)
  }

  const tokenRes = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      redirect_uri:  `${APP_URL}/api/integrations/zoho/callback`,
      code,
    }),
  })

  const tokens = await tokenRes.json()
  if (!tokenRes.ok || tokens.error) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=zoho_token`)
  }

  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()
  const apiDomain = tokens.api_domain ?? 'https://recruit.zoho.in'

  // Fetch Zoho user name for display
  let zohoUserName: string | null = null
  try {
    const userRes = await fetch(`${apiDomain}/recruit/v2/users?type=CurrentUser`, {
      headers: { Authorization: `Zoho-oauthtoken ${tokens.access_token}` },
    })
    const userData = await userRes.json()
    zohoUserName = userData?.users?.[0]?.full_name ?? null
  } catch { /* non-fatal */ }

  await supabase.from('zoho_integrations').upsert({
    user_id:        user.id,
    access_token:   tokens.access_token,
    refresh_token:  tokens.refresh_token,
    expires_at:     expiresAt,
    api_domain:     apiDomain,
    zoho_user_name: zohoUserName,
    updated_at:     new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${APP_URL}/integrations?success=zoho`)
}
