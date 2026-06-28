import { createClient } from '@/lib/supabase/server'
import UpgradeClient from './upgrade-client'
import type { Plan } from '@/types'

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('plan, full_name, email')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  return (
    <UpgradeClient
      userPlan={(profile?.plan ?? 'free') as Plan}
      userName={profile?.full_name ?? ''}
      userEmail={profile?.email ?? user?.email ?? ''}
    />
  )
}
