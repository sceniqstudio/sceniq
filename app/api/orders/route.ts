// app/api/orders/route.ts
// POST — Crée une commande multi-vidéos en BDD + génère une Stripe Checkout Session
//
// Body JSON attendu : MultiCartOrderInput (voir lib/orders/index.ts)
// Retourne : { checkoutUrl: string, orderId: string }

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import {
  validateMultiCartInput,
  computeCartTotal,
  cartSummaryLine,
  priceForDuration,
} from '@/lib/orders/index'
import type { Database, OrderFormat, CartItemJson } from '@/lib/supabase/types'

const AI_MODEL_ADDON_CENTS = 4900

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

    const validation = validateMultiCartInput(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 422 },
      )
    }

    const {
      language, cart_items, brief,
      client_name, client_email, client_phone, client_company,
      preferred_call_slot, ref_paths,
    } = validation.data

    // ── Calcul du total en centimes ──────────────────────────────────────────
    const totalCents = computeCartTotal(cart_items)

    // Pour les colonnes legacy (format/duration) : premier item du panier
    const firstItem  = cart_items[0]
    const firstFormat = firstItem.formats[0] as OrderFormat
    const firstDuration = firstItem.duration

    // ── Créer l'order en BDD (status: pending_payment) ───────────────────────
    const supabase = getSupabaseAdmin()
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        status:              'pending_payment',
        format:              firstFormat,
        duration:            firstDuration,
        price_ht:            totalCents,
        brief,
        client_name,
        client_email,
        client_phone:        client_phone || null,
        client_company:      client_company || null,
        preferred_call_slot: preferred_call_slot || null,
        ref_paths,
        cart_items:          cart_items as CartItemJson[],
        voice_language:      language || null,
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

    // Un line_item Stripe par vidéo × quantité × options
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const item of cart_items) {
      const basePrice = priceForDuration(item.duration)
      const formatsStr = item.formats.join(' · ')
      const desc = `Vidéo IA ${item.duration}s · ${formatsStr} · Livraison sous 48h`

      lineItems.push({
        price_data: {
          currency:    'eur',
          unit_amount: basePrice,
          product_data: {
            name:        `ScenIQ — Vidéo ${item.duration}s`,
            description: desc,
          },
        },
        quantity: item.qty,
      })

      if (item.want_ai_model) {
        lineItems.push({
          price_data: {
            currency:    'eur',
            unit_amount: AI_MODEL_ADDON_CENTS,
            product_data: {
              name:        'Comédien IA sur mesure',
              description: item.ai_model_desc || 'Comédien IA généré pour la vidéo',
            },
          },
          quantity: item.qty,
        })
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      line_items:           lineItems,
      customer_email:       client_email,
      client_reference_id:  order.id,
      metadata: {
        order_id:     order.id,
        cart_summary: cartSummaryLine(cart_items).slice(0, 500),
        client_name,
        voice_language: language ?? '',
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
