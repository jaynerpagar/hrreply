import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getValidToken(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: integration } = await supabase
    .from('zoho_integrations')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!integration) return null

  const expiresAt  = new Date(integration.expires_at).getTime()
  const needsRefresh = expiresAt - Date.now() < 60_000

  if (!needsRefresh) return { token: integration.access_token, apiDomain: integration.api_domain }

  const refreshRes = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      refresh_token: integration.refresh_token,
    }),
  })
  const refreshed = await refreshRes.json()
  if (!refreshRes.ok || refreshed.error) return null

  const newExpiry = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString()
  await supabase.from('zoho_integrations').update({
    access_token: refreshed.access_token,
    expires_at:   newExpiry,
    updated_at:   new Date().toISOString(),
  }).eq('user_id', userId)

  return { token: refreshed.access_token, apiDomain: integration.api_domain }
}

const STAGE_MAP: Record<string, string> = {
  'New':       'applied',
  'Available': 'applied',
  'Contacted': 'screening',
  'In Review': 'screening',
  'Engaged':   'interview',
  'Offered':   'offer',
  'Hired':     'hired',
  'Rejected':  'rejected',
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await getValidToken(supabase, user.id)
  if (!auth) return NextResponse.json({ error: 'Zoho not connected or session expired.' }, { status: 400 })

  const fields = 'First_Name,Last_Name,Email,Mobile,Current_Job_Title,Current_Employer,Candidate_Status,Experience_in_Years,Skill_Set'
  const zohoRes = await fetch(
    `${auth.apiDomain}/recruit/v2/Candidates?per_page=200&fields=${fields}`,
    { headers: { Authorization: `Zoho-oauthtoken ${auth.token}` } }
  )

  if (!zohoRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch candidates from Zoho Recruit.' }, { status: 502 })
  }

  const zohoData  = await zohoRes.json()
  const zohoList  = zohoData.data ?? []

  let imported = 0
  let skipped  = 0

  for (const zc of zohoList) {
    const name = [zc.First_Name, zc.Last_Name].filter(Boolean).join(' ').trim()
    if (!name) { skipped++; continue }

    const noteParts: string[] = []
    if (zc.Email) noteParts.push(`Email: ${zc.Email}`)
    noteParts.push('Imported from Zoho Recruit')

    const { error } = await supabase.from('candidates').insert({
      user_id:         user.id,
      name,
      phone:           zc.Mobile            ?? null,
      role_applied:    zc.Current_Job_Title ?? 'Not specified',
      stage:           STAGE_MAP[zc.Candidate_Status] ?? 'applied',
      current_company: zc.Current_Employer  ?? null,
      experience:      zc.Experience_in_Years ? `${zc.Experience_in_Years} years` : null,
      skills:          zc.Skill_Set         ?? null,
      notes:           noteParts.join('\n'),
    })

    if (!error) imported++
    else skipped++
  }

  return NextResponse.json({ imported, skipped, total: zohoList.length })
}
