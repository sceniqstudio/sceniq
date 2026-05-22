// app/api/studio/generate-images/route.ts
// POST — Soumet une tâche de génération image Dreamina Image 5.0 Lite (BytePlus)
// Retourne immédiatement { jobId } — le client poll /api/studio/image-status/[jobId]
// Body (multipart/form-data) :
//   prompt      string     requis
//   ratio       string     '16:9'|'9:16'|'1:1'|'4:3'|'3:4'|'21:9'
//   refs        File[]     images de référence (clé répétée, 1-9), obligatoires
//   numImages   string     '1'|'2'|'3'|'4' — défaut '4'

import { NextRequest, NextResponse }  from 'next/server'
import { createClient }               from '@supabase/supabase-js'
import { submitImageJob }             from '@/lib/byteplus/image-gen'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const secret   = req.headers.get('x-admin-secret')
  const expected = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let prompt:    string
  let ratio:     string
  let numImages: number
  let imageUrls: string[] = []

  try {
    const form = await req.formData()
    prompt     = (form.get('prompt')    as string ?? '').trim()
    ratio      = (form.get('ratio')     as string ?? '1:1')
    numImages  = Math.min(parseInt(form.get('numImages') as string ?? '4', 10), 4) || 4

    if (!prompt) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })

    // ── Upload refs → Supabase Storage (en parallèle) ──
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
        const path = `studio/img-${ts}-${i}.${ext}`
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
  const result = await submitImageJob({ prompt, ratio, imageUrls, numImages })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 })

  return NextResponse.json({ jobId: result.jobId })
}
