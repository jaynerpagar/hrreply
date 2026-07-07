import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, stage, last_contacted_at, created_at')
    .eq('user_id', user.id)

  const { data: replies } = await supabase
    .from('replies')
    .select('reply_type, outcome, created_at')
    .eq('user_id', user.id)
    .not('outcome', 'is', null)

  const total = candidates?.length ?? 0

  // Ghosting rate: active stages not contacted in 5+ days
  const activeStages = new Set(['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent'])
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  const ghosted = candidates?.filter(c =>
    activeStages.has(c.stage) &&
    (!c.last_contacted_at || new Date(c.last_contacted_at) < fiveDaysAgo)
  ).length ?? 0

  // Offer acceptance rate: accepted / (accepted + declined) from replies outcomes
  const replyData = replies ?? []
  const acceptedReplies = replyData.filter(r => r.outcome === 'accepted').length
  const declinedReplies = replyData.filter(r => r.outcome === 'declined').length
  const totalDecisions  = acceptedReplies + declinedReplies
  const offerAcceptRate = totalDecisions > 0 ? Math.round((acceptedReplies / totalDecisions) * 100) : null

  // No-show rate: candidates with stage = no_show via reply_type
  const noShowReplies = replyData.filter(r => r.reply_type === 'no_show').length
  const interviewReplies = replyData.filter(r => ['interview_invite', 'interview_reminder'].includes(r.reply_type)).length
  const noShowRate = interviewReplies > 0 ? Math.round((noShowReplies / interviewReplies) * 100) : null

  // Reply rate from outcome tracking
  const gotReply = replyData.filter(r => r.outcome === 'got_reply').length
  const noReply  = replyData.filter(r => r.outcome === 'no_reply').length
  const totalTracked = gotReply + noReply
  const replyRate = totalTracked > 0 ? Math.round((gotReply / totalTracked) * 100) : null

  // Stage distribution
  const byStage: Record<string, number> = {}
  candidates?.forEach(c => {
    byStage[c.stage] = (byStage[c.stage] ?? 0) + 1
  })
  const stageData = Object.entries(byStage).map(([stage, count]) => ({ stage, count }))

  // Outcome breakdown for pie
  const outcomeData = [
    { outcome: 'got_reply', count: gotReply, label: 'Got reply' },
    { outcome: 'no_reply',  count: noReply,  label: 'No reply' },
    { outcome: 'accepted',  count: acceptedReplies, label: 'Accepted' },
    { outcome: 'declined',  count: declinedReplies, label: 'Declined' },
  ].filter(o => o.count > 0)

  return NextResponse.json({
    total,
    ghosted,
    ghostingRate: total > 0 ? Math.round((ghosted / total) * 100) : 0,
    replyRate,
    offerAcceptRate,
    noShowRate,
    totalTrackedOutcomes: replyData.length,
    stageData,
    outcomeData,
  })
}
