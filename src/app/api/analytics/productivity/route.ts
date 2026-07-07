import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MINUTES_SAVED_PER_REPLY = 8

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // All replies
  const { data: replies } = await supabase
    .from('replies')
    .select('id, reply_type, tone, created_at, copy_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Template usage
  const { data: templateUses } = await supabase
    .from('saved_templates')
    .select('id, created_at')
    .eq('user_id', user.id)

  const all = replies ?? []
  const total = all.length
  const totalMinutesSaved = total * MINUTES_SAVED_PER_REPLY
  const totalHoursSaved = (totalMinutesSaved / 60).toFixed(1)

  // Weekly trend (last 8 weeks)
  const weeks: Record<string, number> = {}
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    weeks[`Week ${8 - i}`] = 0
  }
  all.forEach(r => {
    const rDate = new Date(r.created_at)
    const diffDays = Math.floor((now.getTime() - rDate.getTime()) / 86400000)
    const weekNum = Math.floor(diffDays / 7)
    if (weekNum < 8) {
      const key = `Week ${8 - weekNum}`
      if (key in weeks) weeks[key]++
    }
  })
  const weeklyData = Object.entries(weeks).map(([week, count]) => ({ week, count }))

  // Most productive day of week
  const byDay: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  all.forEach(r => {
    const day = dayNames[new Date(r.created_at).getDay()]
    byDay[day] = (byDay[day] ?? 0) + 1
  })
  const dayData = Object.entries(byDay).map(([day, count]) => ({ day, count }))

  // This week vs last week
  const sevenDaysAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const thisWeek  = all.filter(r => new Date(r.created_at) >= sevenDaysAgo).length
  const lastWeek  = all.filter(r => new Date(r.created_at) >= fourteenDaysAgo && new Date(r.created_at) < sevenDaysAgo).length

  const totalCopied = all.reduce((sum, r) => sum + (r.copy_count ?? 0), 0)
  const templatesUsed = templateUses?.length ?? 0

  return NextResponse.json({
    totalReplies: total,
    totalHoursSaved,
    totalMinutesSaved,
    totalCopied,
    templatesUsed,
    thisWeek,
    lastWeek,
    weeklyData,
    dayData,
  })
}
