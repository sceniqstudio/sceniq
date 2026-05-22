// app/api/studio/submit/route.ts
// POST — Soumet une tâche de génération vidéo BytePlus Seedance
// Retourne immédiatement { jobId } — le client poll /api/studio/status/[jobId]
// Body (multipart/form-data) :
//   prompt      string     requis
//   duration    string     '4'|'5'|'8'|'10'|'12'|'15'
//   resolution  string     '480p'|'720p'|'1080p'
//   ratio       string     '16:9'|'9:16'|'1:1'|'4:3'|'3:4'|'21:9'
//   quality     string     'standard'|'fast'
//   refs        File[]     images de référence obligatoires (clé répétée, 1-9)

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { submitStudioJob }           from '@/lib/byteplus/studio'

// Supabase admin client (service role — accès storage)
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let prompt:     string
  let duration:   number
  let resolution: string
  let ratio:      string
  let quality:    'standard' | 'fast'
  let imageUrls:  string[] = []

  try {
    const form = await req.formData()
    prompt     = (form.get('prompt')     as string ?? '').trim()
    duration   = parseInt(form.get('duration') as string ?? '5', 10)
    resolution = (form.get('resolution') as string ?? '720p')
    ratio      = (form.get('ratio')      as string ?? '16:9')
    quality    = (form.get('quality')    as string) === 'fast' ? 'fast' : 'standard'

    if (!prompt) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })

    // ── Upload toutes les images de ref → Supabase Storage (en parallèle) ──
    const refs      = form.getAll('refs') as File[]
    const validRefs = refs.filter(f => f instanceof File && f.size > 0).slice(0, 9)

    if (validRefs.length === 0) {
      return NextResponse.json({ error: 'Au moins une image de référence est requise' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const ts       = Date.now()

    const uploadResults = await Promise.all(
      validRefs.map(async (img, i) => {
        const ext  = img.name.split('.').pop() ?? 'jpg'
        const path = `studio/${ts}-${i}.${ext}`
        const buf  = Buffer.from(await img.arrayBuffer())

        const { error: upErr } = await supabase.storage
          .from('brand-assets')
          .upload(path, buf, { contentType: img.type, upsert: false })

        if (upErr) throw new Error(`Upload image ${i + 1}: ${upErr.message}`)

        const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
        return urlData?.publicUrl ?? null
      }),
    )

    imageUrls = uploadResults.filter((u): u is string => u !== null)
  } catch (e) {
    return NextResponse.json({ error: `Parsing requête : ${(e as Error).message}` }, { status: 400 })
  }

  // ── Soumettre la tâche BytePlus (non-bloquant) ──
  const result = await submitStudioJob({ prompt, duration, resolution, ratio, quality, imageUrls })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 })

  return NextResponse.json({ jobId: result.jobId })
}
