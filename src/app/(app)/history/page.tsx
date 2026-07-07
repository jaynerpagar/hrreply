import { createClient } from '@/lib/supabase/server'
import HistoryClient from './history-client'
import { PageHeader } from '@/components/ui/card'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: replies } = await supabase
    .from('replies')
    .select('id, reply_type, tone, context_input, generated_text, created_at, outcome')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <PageHeader
        title="Reply history"
        description="All your generated messages — search and reuse anytime."
      />
      <HistoryClient replies={replies ?? []} />
    </div>
  )
}
