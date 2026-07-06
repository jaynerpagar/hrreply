import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    name, phone, role_applied, stage, notes, last_contacted_at,
    current_company, skills, experience, notice_period,
    interview_at, offer_expiry_at, joining_at,
  } = body

  const { data, error } = await supabase
    .from('candidates')
    .update({
      ...(name            !== undefined && { name: name.trim() }),
      ...(phone           !== undefined && { phone: phone?.trim() || null }),
      ...(role_applied    !== undefined && { role_applied: role_applied.trim() }),
      ...(stage           !== undefined && { stage }),
      ...(notes           !== undefined && { notes: notes?.trim() || null }),
      ...(last_contacted_at !== undefined && { last_contacted_at }),
      ...(current_company !== undefined && { current_company: current_company?.trim() || null }),
      ...(skills          !== undefined && { skills: skills?.trim() || null }),
      ...(experience      !== undefined && { experience: experience?.trim() || null }),
      ...(notice_period   !== undefined && { notice_period: notice_period?.trim() || null }),
      ...(interview_at    !== undefined && { interview_at: interview_at || null }),
      ...(offer_expiry_at !== undefined && { offer_expiry_at: offer_expiry_at || null }),
      ...(joining_at      !== undefined && { joining_at: joining_at || null }),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
