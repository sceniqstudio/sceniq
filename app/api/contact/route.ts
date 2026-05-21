// app/api/contact/route.ts
// POST — Envoie un email de contact via SMTP IONOS à support@sceniq.studio

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactMessage } from '@/lib/email/sendContactMessage'

const ContactSchema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  phone:   z.string().max(30).optional().nullable(),
  message: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
    }

    const validation = ContactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 422 },
      )
    }

    const { name, email, phone, message } = validation.data

    await sendContactMessage({ name, email, phone, message })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Erreur envoi email:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
