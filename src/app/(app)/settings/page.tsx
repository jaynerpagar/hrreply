import { createClient } from '@/lib/supabase/server'
import SettingsClient from './settings-client'
import type { Tone } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, company, default_tone, plan')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, seats, current_period_end')
    .eq('user_id', user?.id ?? '')
    .in('status', ['active', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <SettingsClient
      initialName={profile?.full_name ?? ''}
      initialCompany={profile?.company ?? ''}
      initialTone={(profile?.default_tone ?? 'friendly') as Tone}
      plan={profile?.plan ?? 'free'}
      subscription={subscription}
    />
  )
}
