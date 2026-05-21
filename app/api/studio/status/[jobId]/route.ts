// app/api/studio/status/[jobId]/route.ts
// GET — Vérifie le statut d'une tâche BytePlus (polling côté client)

import { NextRequest, NextResponse } from 'next/server'
import { checkStudioJob }            from '@/lib/byteplus/studio'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { jobId } = params
  if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 })

  const result = await checkStudioJob(jobId)
  return NextResponse.json(result)
}
