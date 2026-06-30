import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, razorpay_sub_id, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub?.razorpay_sub_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  try {
    // Cancel at end of current billing cycle so user keeps access until period end
    await getRazorpay().subscriptions.cancel(sub.razorpay_sub_id, true)

    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', sub.id)

    return NextResponse.json({ status: 'cancelled', access_until: sub.current_period_end })
  } catch (err: unknown) {
    console.error('[cancel-subscription]', err)
    const message = err instanceof Error ? err.message : 'Failed to cancel subscription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
