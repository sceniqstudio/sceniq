// app/api/studio/image-status/[jobId]/route.ts
// GET — Vérifie le statut d'une tâche de génération image Dreamina Image 5.0 Lite
// Répond : { status, images?, error? }

import { NextRequest, NextResponse } from 'next/server'
import { checkImageJob }             from '@/lib/fal/image-gen'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const secret   = req.headers.get('x-admin-secret')
  const expected = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = params
  if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 })

  const result = await checkImageJob(jobId)
  if (result.error && result.status === 'failed') {
    return NextResponse.json({ status: result.status, error: result.error }, { status: 502 })
  }

  return NextResponse.json({
    status: result.status,
    images: result.images.length > 0 ? result.images : undefined,
  })
}
