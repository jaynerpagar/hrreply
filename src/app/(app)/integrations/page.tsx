import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/card'
import IntegrationsClient from './integrations-client'

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: zohoIntegration } = await supabase
    .from('zoho_integrations')
    .select('id, zoho_user_name, created_at')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect HRReply with your existing recruitment tools."
      />
      <IntegrationsClient zohoIntegration={zohoIntegration ?? null} />
    </div>
  )
}
