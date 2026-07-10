import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CandidateDetailClient from './candidate-detail-client'

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id ?? '')
    .single()

  if (!candidate) notFound()

  const [{ data: candidateReplies }, { data: notes }, { data: jobs }] = await Promise.all([
    supabase
      .from('replies')
      .select('id, reply_type, tone, language, generated_reply, context_input, created_at, copy_count, outcome')
      .eq('user_id', user?.id ?? '')
      .ilike('context_input', `%${candidate.name}%`)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('candidate_notes')
      .select('*')
      .eq('candidate_id', params.id)
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('id, title')
      .eq('user_id', user?.id ?? ''),
  ])

  const candidateJob = candidate.job_id
    ? (jobs ?? []).find(j => j.id === candidate.job_id) ?? null
    : null

  return (
    <CandidateDetailClient
      candidate={candidate}
      initialReplies={candidateReplies ?? []}
      initialNotes={notes ?? []}
      job={candidateJob}
    />
  )
}
