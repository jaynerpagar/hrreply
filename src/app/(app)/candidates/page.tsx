import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/card'
import CandidatesClient, { type Candidate } from './candidates-client'

export default async function CandidatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, name, phone, role_applied, stage, notes, last_contacted_at, created_at')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Candidate tracker"
        description="Track your pipeline — stage, contact details, and notes in one place."
      />
      <CandidatesClient initial={(candidates ?? []) as Candidate[]} />
    </div>
  )
}
