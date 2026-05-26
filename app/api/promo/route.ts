// app/api/promo/route.ts
// POST — Demande de reel 8s offert (offre lancement, 50 spots)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPromoRequest } from '@/lib/email/sendPromoRequest'

const PromoSchema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  company: z.string().max(100).optional().nullable(),
  brief:   z.string().min(5).max(1000),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
    }

    const validation = PromoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 422 },
      )
    }

    const { name, email, company, brief } = validation.data

    await sendPromoRequest({ name, email, company, brief })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[promo] Erreur envoi email:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
