import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Bypass RLS — webhook has no user session
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface SubEntity {
  id: string
  current_end: number
  quantity: number
  notes?: { user_id?: string; plan?: string; seats?: string }
}

interface WebhookEvent {
  event: string
  payload: { subscription?: { entity: SubEntity } }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as WebhookEvent
  const sub = event.payload.subscription?.entity
  if (!sub) return NextResponse.json({ status: 'ok' })

  const supabase = adminClient()
  const periodEnd = new Date(sub.current_end * 1000).toISOString()

  try {
    switch (event.event) {
      case 'subscription.activated': {
        const userId = sub.notes?.user_id
        const plan = sub.notes?.plan as 'pro' | 'team' | undefined
        const seats = parseInt(sub.notes?.seats ?? '1', 10)
        if (!userId || !plan) break

        // Idempotency: skip if already recorded
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('razorpay_sub_id', sub.id)
          .maybeSingle()

        if (!existing) {
          await supabase.from('subscriptions').insert({
            user_id: userId,
            razorpay_sub_id: sub.id,
            plan,
            status: 'active',
            seats,
            current_period_end: periodEnd,
          })
          await supabase.from('users').update({ plan }).eq('id', userId)
        }
        break
      }

      case 'subscription.charged': {
        await supabase
          .from('subscriptions')
          .update({ current_period_end: periodEnd })
          .eq('razorpay_sub_id', sub.id)
        break
      }

      case 'subscription.cancelled': {
        const { data: dbSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('razorpay_sub_id', sub.id)
          .maybeSingle()

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('razorpay_sub_id', sub.id)

        if (dbSub?.user_id) {
          await supabase.from('users').update({ plan: 'free' }).eq('id', dbSub.user_id)
        }
        break
      }

      case 'subscription.halted': {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('razorpay_sub_id', sub.id)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[webhook]', event.event, err)
  }

  return NextResponse.json({ status: 'ok' })
}
