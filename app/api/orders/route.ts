// app/api/orders/route.ts
// POST — Crée une commande en BDD + génère une Stripe Checkout Session
//
// Body JSON attendu : OrderInput (voir lib/orders/index.ts)
// Retourne : { checkoutUrl: string, orderId: string }

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { validateOrderInput, priceForDuration } from '@/lib/orders/index'
import type { Database } from '@/lib/supabase/types'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('[ScenIQ] STRIPE_SECRET_KEY manquant dans les variables d\'environnement')
  return new Stripe(key, { apiVersion: '2024-04-10' })
}

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Validation input ─────────────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête invalide (JSON attendu)' }, { status: 400 })
    }

    const validation = validateOrderInput(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 422 },
      )
    }

    const {
      format, duration, brief,
      client_name, client_email, client_phone, client_company,
      preferred_call_slot, ref_paths,
    } = validation.data

    const priceHt = priceForDuration(duration)

    // ── Créer l'order en BDD (status: pending_payment) ───────────────────────
    const supabase = getSupabaseAdmin()
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        status:              'pending_payment',
        format,
        duration,
        price_ht:            priceHt,
        brief,
        client_name,
        client_email,
        client_phone:        client_phone || null,
        client_company:      client_company || null,
        preferred_call_slot: preferred_call_slot || null,
        ref_paths,
      })
      .select('id')
      .single()

    if (insertError || !order) {
      console.error('[orders] Erreur insert Supabase:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 })
    }

    // ── Créer la Stripe Checkout Session ─────────────────────────────────────
    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sceniq-ashen.vercel.app'

    const priceLabel = `Vidéo IA ${duration}s · ${format} · 10 itérations incluses · Livraison sous 48h`

    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency:     'eur',
          unit_amount:  priceHt, // en centimes
          product_data: {
            name:        `ScenIQ — Vidéo ${duration}s (${format})`,
            description: priceLabel,
          },
        },
        quantity: 1,
      }],
      customer_email: client_email,
      client_reference_id: order.id,
      metadata: {
        order_id:     order.id,
        duration:     String(duration),
        format,
        client_name,
      },
      success_url: `${appUrl}/commande/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url:  `${appUrl}/commande?cancelled=1`,
      locale:      'fr',
    })

    if (!session.url) {
      console.error('[orders] Stripe session sans URL:', session)
      return NextResponse.json({ error: 'Erreur Stripe — URL de paiement non générée' }, { status: 500 })
    }

    // ── Stocker le stripe_session_id dans l'order ─────────────────────────────
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({
      checkoutUrl: session.url,
      orderId:     order.id,
    })

  } catch (err) {
    console.error('[orders] Erreur inattendue:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
