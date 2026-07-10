import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach candidate stage counts for each job
  const jobIds = (data ?? []).map(j => j.id)
  let candidateCounts: Record<string, Record<string, number>> = {}

  if (jobIds.length > 0) {
    const { data: cands } = await supabase
      .from('candidates')
      .select('job_id, stage')
      .eq('user_id', user.id)
      .in('job_id', jobIds)

    for (const c of cands ?? []) {
      if (!c.job_id) continue
      candidateCounts[c.job_id] = candidateCounts[c.job_id] ?? {}
      candidateCounts[c.job_id][c.stage] = (candidateCounts[c.job_id][c.stage] ?? 0) + 1
    }
  }

  const enriched = (data ?? []).map(j => ({
    ...j,
    candidate_counts: candidateCounts[j.id] ?? {},
    total_candidates: Object.values(candidateCounts[j.id] ?? {}).reduce((a: number, b) => a + (b as number), 0),
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, department, location, description, status } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      title: title.trim(),
      department: department?.trim() || null,
      location: location?.trim() || null,
      description: description?.trim() || null,
      status: status || 'open',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
