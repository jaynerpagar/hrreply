import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    name, phone, role_applied, stage, notes,
    current_company, skills, experience, notice_period,
    interview_at, offer_expiry_at, joining_at,
  } = body

  if (!name?.trim() || !role_applied?.trim()) {
    return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('candidates').insert({
    user_id: user.id,
    name: name.trim(),
    phone: phone?.trim() || null,
    role_applied: role_applied.trim(),
    stage: stage || 'applied',
    notes: notes?.trim() || null,
    current_company: current_company?.trim() || null,
    skills: skills?.trim() || null,
    experience: experience?.trim() || null,
    notice_period: notice_period?.trim() || null,
    interview_at: interview_at || null,
    offer_expiry_at: offer_expiry_at || null,
    joining_at: joining_at || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
