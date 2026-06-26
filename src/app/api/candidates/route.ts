import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, phone, role_applied, stage, notes } = body

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
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
