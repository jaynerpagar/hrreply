import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import JobDetailClient from './job-detail-client'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: job }, { data: candidates }, { data: allCandidates }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', params.id).eq('user_id', user?.id ?? '').single(),
    supabase.from('candidates').select('*').eq('job_id', params.id).eq('user_id', user?.id ?? '').order('created_at', { ascending: false }),
    // All candidates (for assign modal)
    supabase.from('candidates').select('id, name, role_applied, stage').eq('user_id', user?.id ?? '').is('job_id', null).order('name'),
  ])

  if (!job) notFound()

  return (
    <JobDetailClient
      job={job}
      initialCandidates={candidates ?? []}
      unassignedCandidates={allCandidates ?? []}
    />
  )
}
