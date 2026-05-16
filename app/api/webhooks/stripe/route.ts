// app/api/webhooks/stripe/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS, type PlanKey } from '@/lib/stripe/plans'

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const CREDITS_PER_PLAN: Record<PlanKey, number> = {
  studio:      PLANS.studio.creditsPerCycle,
  agency:      PLANS.agency.creditsPerCycle,
  white_label: PLANS.white_label.creditsPerCycle,
}

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const supabase = sb()

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    const subscriptionId = invoice.subscription as string

    // Trouver l'user via stripe_customer_id
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id, plan')
      .eq('stripe_customer_id', customerId)
      .single()

    if (sub) {
      const credits = CREDITS_PER_PLAN[sub.plan as PlanKey] ?? 0

      // Créditer le compte
      await supabase.from('credits_ledger').insert({
        user_id: sub.user_id,
        delta:   credits,
        reason:  'subscription_renewal',
      })

      // Mettre à jour le statut de la subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      await supabase.from('subscriptions').update({
        status:                 stripeSubscription.status,
        stripe_subscription_id: subscriptionId,
        current_period_end:     new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      }).eq('stripe_customer_id', customerId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase.from('subscriptions').update({
      status: 'canceled',
      stripe_subscription_id: null,
    }).eq('stripe_customer_id', subscription.customer as string)
  }

  return NextResponse.json({ received: true })
}
