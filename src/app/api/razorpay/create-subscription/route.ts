import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { razorpay } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, seats = 1 } = await request.json() as { plan: 'pro' | 'team'; seats?: number }

  if (!plan || !['pro', 'team'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  if (plan === 'team' && seats < 3) {
    return NextResponse.json({ error: 'Team plan requires at least 3 seats' }, { status: 400 })
  }

  // Block if already has active subscription
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (existingSub) {
    return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 })
  }

  const planId = plan === 'pro'
    ? process.env.RAZORPAY_PRO_PLAN_ID
    : process.env.RAZORPAY_TEAM_PLAN_ID

  if (!planId) {
    return NextResponse.json({ error: 'Payment plan not configured' }, { status: 500 })
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 120,
      quantity: plan === 'team' ? seats : 1,
      customer_notify: 1,
      notes: {
        user_id: user.id,
        plan,
        seats: String(seats),
      },
    })

    return NextResponse.json({ subscription_id: subscription.id })
  } catch (err: unknown) {
    console.error('[create-subscription]', err)
    const message = err instanceof Error ? err.message : 'Failed to create subscription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
