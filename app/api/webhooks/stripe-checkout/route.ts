// app/api/webhooks/stripe-checkout/route.ts
// Webhook Stripe — checkout.session.completed
//
// Ce webhook est SÉPARÉ du webhook subscriptions (/api/webhooks/stripe).
// Secret dédié : STRIPE_CHECKOUT_WEBHOOK_SECRET
//
// Actions :
//   1. Marque l'order "paid" + stocke stripe_payment_intent
//   2. Envoie email confirmation → client
//   3. Envoie email notification → Pascal

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmation } from '@/lib/email/sendOrderConfirmation'
import { sendOrderNotification } from '@/lib/email/sendOrderNotification'
import type { Database } from '@/lib/supabase/types'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('[ScenIQ] STRIPE_SECRET_KEY manquant')
  return new Stripe(key, { apiVersion: '2024-04-10' })
}

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-checkout webhook] STRIPE_CHECKOUT_WEBHOOK_SECRET manquant')
    return NextResponse.json({ error: 'Configuration webhook manquante' }, { status: 500 })
  }

  // ── Vérifier la signature Stripe ─────────────────────────────────────────
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe-checkout webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // ── Traiter checkout.session.completed ───────────────────────────────────
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.order_id ?? session.client_reference_id

  if (!orderId) {
    console.error('[stripe-checkout webhook] order_id absent du metadata Stripe:', session.id)
    return NextResponse.json({ error: 'order_id manquant dans le metadata' }, { status: 422 })
  }

  const supabase = getSupabaseAdmin()

  // ── Marquer l'order "paid" ────────────────────────────────────────────────
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({
      status:               'paid',
      stripe_payment_intent: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null,
    })
    .eq('id', orderId)
    .select()
    .single()

  if (updateError || !order) {
    console.error('[stripe-checkout webhook] Erreur update order:', updateError, '| orderId:', orderId)
    return NextResponse.json({ error: 'Erreur mise à jour order' }, { status: 500 })
  }

  // ── Envoyer les emails ────────────────────────────────────────────────────
  const emailErrors: string[] = []

  try {
    await sendOrderConfirmation({
      orderId:       order.id,
      clientName:    order.client_name,
      clientEmail:   order.client_email,
      priceHt:       order.price_ht,
      brief:         order.brief,
      cartItems:     order.cart_items ?? [],
      voiceLanguage: order.voice_language,
    })
  } catch (err) {
    console.error('[stripe-checkout webhook] Erreur email client:', err)
    emailErrors.push('confirmation client')
  }

  try {
    await sendOrderNotification({
      orderId:           order.id,
      clientName:        order.client_name,
      clientEmail:       order.client_email,
      clientPhone:       order.client_phone,
      clientCompany:     order.client_company,
      preferredCallSlot: order.preferred_call_slot,
      priceHt:           order.price_ht,
      brief:             order.brief,
      cartItems:         order.cart_items ?? [],
      voiceLanguage:     order.voice_language,
      refPaths:          order.ref_paths ?? [],
      stripeSessionId:   session.id,
    })
  } catch (err) {
    console.error('[stripe-checkout webhook] Erreur email Pascal:', err)
    emailErrors.push('notification Pascal')
  }

  if (emailErrors.length > 0) {
    console.warn('[stripe-checkout webhook] Emails partiellement en échec:', emailErrors)
  }

  console.log(`[stripe-checkout webhook] Order ${orderId} marquée paid ✓`)
  return NextResponse.json({ received: true, orderId })
}
