import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.hrreply.in'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const clientId = process.env.ZOHO_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'ZOHO_CLIENT_ID not configured' }, { status: 500 })

  const authUrl = new URL('https://accounts.zoho.in/oauth/v2/auth')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('scope', 'ZohoRecruit.modules.ALL,ZohoRecruit.settings.ALL')
  authUrl.searchParams.set('redirect_uri', `${APP_URL}/api/integrations/zoho/callback`)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(authUrl.toString())
}
