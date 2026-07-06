import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString()

  const [repliesRes, thisMonthRes, lastMonthRes, mostCopiedRes, templateEventsRes] = await Promise.all([
    // All replies for charts
    supabase
      .from('replies')
      .select('id, reply_type, tone, copy_count, created_at')
      .eq('user_id', user.id)
      .gte('created_at', twelveWeeksAgo)
      .order('created_at', { ascending: true }),

    // This month count
    supabase
      .from('replies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', thisMonthStart),

    // Last month count
    supabase
      .from('replies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', lastMonthStart)
      .lt('created_at', thisMonthStart),

    // Most copied replies (top 5)
    supabase
      .from('replies')
      .select('id, reply_type, tone, copy_count, context_input, created_at')
      .eq('user_id', user.id)
      .gt('copy_count', 0)
      .order('copy_count', { ascending: false })
      .limit(5),

    // Template use events — top 10 template_ids
    supabase
      .from('template_events')
      .select('template_id')
      .eq('user_id', user.id),
  ])

  const replies = repliesRes.data ?? []

  // Replies by type
  const byType: Record<string, number> = {}
  const byTone: Record<string, number> = {}
  replies.forEach(r => {
    byType[r.reply_type] = (byType[r.reply_type] ?? 0) + 1
    byTone[r.tone] = (byTone[r.tone] ?? 0) + 1
  })

  // Replies by week (last 12 weeks)
  const weekMap: Record<string, number> = {}
  replies.forEach(r => {
    const d = new Date(r.created_at)
    // Monday of that week
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    weekMap[key] = (weekMap[key] ?? 0) + 1
  })
  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))

  // Template usage leaderboard
  const templateCounts: Record<string, number> = {}
  ;(templateEventsRes.data ?? []).forEach(e => {
    templateCounts[e.template_id] = (templateCounts[e.template_id] ?? 0) + 1
  })
  const topTemplates = Object.entries(templateCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([templateId, count]) => ({ templateId, count }))

  return NextResponse.json({
    totalReplies: replies.length,
    thisMonth: thisMonthRes.count ?? 0,
    lastMonth: lastMonthRes.count ?? 0,
    byType: Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count })),
    byTone: Object.entries(byTone)
      .sort(([, a], [, b]) => b - a)
      .map(([tone, count]) => ({ tone, count })),
    weeklyData,
    mostCopied: mostCopiedRes.data ?? [],
    topTemplates,
  })
}
