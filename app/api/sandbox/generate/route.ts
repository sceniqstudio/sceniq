// app/api/sandbox/generate/route.ts
//
// ⚠️  DEPRECATED — Endpoint sandbox supprimé le 2026-05-16. Retourne 410 Gone.
//     À supprimer définitivement quand l'historique git le permettra.

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'sandbox endpoint deprecated — utiliser /api/generation/[sceneId]' },
    { status: 410 },
  )
}
