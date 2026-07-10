import { createClient } from '@/lib/supabase/server'
import JobsClient from './jobs-client'

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })

  const jobIds = (jobs ?? []).map(j => j.id)
  let candidateCounts: Record<string, Record<string, number>> = {}

  if (jobIds.length > 0) {
    const { data: cands } = await supabase
      .from('candidates')
      .select('job_id, stage')
      .eq('user_id', user?.id ?? '')
      .in('job_id', jobIds)

    for (const c of cands ?? []) {
      if (!c.job_id) continue
      candidateCounts[c.job_id] = candidateCounts[c.job_id] ?? {}
      candidateCounts[c.job_id][c.stage] = (candidateCounts[c.job_id][c.stage] ?? 0) + 1
    }
  }

  const enriched = (jobs ?? []).map(j => ({
    ...j,
    candidate_counts: candidateCounts[j.id] ?? {},
    total_candidates: Object.values(candidateCounts[j.id] ?? {}).reduce((a, b) => a + (b as number), 0),
  }))

  // Summary stats across all jobs
  const allCandsByStage: Record<string, number> = {}
  for (const counts of Object.values(candidateCounts)) {
    for (const [stage, n] of Object.entries(counts)) {
      allCandsByStage[stage] = (allCandsByStage[stage] ?? 0) + (n as number)
    }
  }

  return (
    <JobsClient
      initialJobs={enriched}
      stats={{
        openJobs: enriched.filter(j => j.status === 'open').length,
        totalCandidates: Object.values(allCandsByStage).reduce((a, b) => a + b, 0),
        interviews: (allCandsByStage['interview_scheduled'] ?? 0) + (allCandsByStage['interviewed'] ?? 0),
        offers: allCandsByStage['offer_sent'] ?? 0,
        hired: allCandsByStage['hired'] ?? 0,
      }}
    />
  )
}
