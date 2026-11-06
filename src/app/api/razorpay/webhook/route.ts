import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function isValidSignature(rawBody: string, signature: string, secret: string) {
  const expected = Buffer.from(
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex'),
    'utf8',
  )
  const received = Buffer.from(signature, 'utf8')
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
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
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  // Fail closed: with no secret configured, an HMAC keyed with '' is trivially
  // forgeable and anyone could POST a fake subscription.activated.
  if (!secret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  if (!signature || !isValidSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: WebhookEvent
  try {
    event = JSON.parse(rawBody) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const sub = event.payload?.subscription?.entity
  if (!sub?.id) return NextResponse.json({ status: 'ok' })

  const supabase = createAdminClient()
  const periodEnd = Number.isFinite(sub.current_end)
    ? new Date(sub.current_end * 1000).toISOString()
    : null

  try {
    switch (event.event) {
      case 'subscription.activated': {
        const userId = sub.notes?.user_id
        const plan = sub.notes?.plan
        const seats = parseInt(sub.notes?.seats ?? '1', 10)
        if (!userId || (plan !== 'pro' && plan !== 'team')) break

        // Idempotency: skip if already recorded
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('razorpay_sub_id', sub.id)
          .maybeSingle()

        if (!existing) {
          const { error: insertErr } = await supabase.from('subscriptions').insert({
            user_id: userId,
            razorpay_sub_id: sub.id,
            plan,
            status: 'active',
            seats: Number.isFinite(seats) && seats > 0 ? seats : 1,
            current_period_end: periodEnd,
          })
          if (insertErr) throw insertErr
          const { error: planErr } = await supabase.from('users').update({ plan }).eq('id', userId)
          if (planErr) throw planErr
        }
        break
      }

      case 'subscription.charged': {
        if (!periodEnd) break
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
    // Non-2xx makes Razorpay retry instead of silently dropping a paid activation.
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok' })
}
