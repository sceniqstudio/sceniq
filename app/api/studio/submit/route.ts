// app/api/studio/submit/route.ts
// POST — Soumet une tâche de génération vidéo BytePlus
// Body (multipart/form-data) :
//   prompt      string   requis
//   duration    string   '4'|'5'|'8'|'10'|'12'|'15'
//   resolution  string   '480p'|'720p'|'1080p'
//   ratio       string   '9:16'|'1:1'|'16:9'
//   image?      File     optionnel (image-to-video)

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { submitStudioJob }           from '@/lib/byteplus/studio'

const ADMIN_EMAIL = 'uxdesignparis@gmail.com'

// Supabase admin client (service role — accès storage)
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  // ── Auth simple — vérifie le header custom envoyé par le client ──
  // (Clerk auth côté API route nécessite le SDK — on utilise un secret admin simple)
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let prompt:     string
  let duration:   number
  let resolution: string
  let ratio:      string
  let imageUrl:   string | undefined

  try {
    const form = await req.formData()
    prompt     = (form.get('prompt')     as string ?? '').trim()
    duration   = parseInt(form.get('duration') as string ?? '5', 10)
    resolution = (form.get('resolution') as string ?? '720p')
    ratio      = (form.get('ratio')      as string ?? '16:9')
    const img  = form.get('image') as File | null

    if (!prompt) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })

    // ── Upload image → Supabase Storage si fournie ──
    if (img && img.size > 0) {
      const ext       = img.name.split('.').pop() ?? 'jpg'
      const path      = `studio/${Date.now()}.${ext}`
      const buf       = Buffer.from(await img.arrayBuffer())
      const supabase  = supabaseAdmin()

      const { error: upErr } = await supabase.storage
        .from('brand-assets')
        .upload(path, buf, { contentType: img.type, upsert: false })

      if (upErr) return NextResponse.json({ error: `Upload image : ${upErr.message}` }, { status: 500 })

      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
      imageUrl = urlData?.publicUrl
    }
  } catch (e) {
    return NextResponse.json({ error: `Parsing requête : ${(e as Error).message}` }, { status: 400 })
  }

  // ── Soumettre la tâche BytePlus (non-bloquant) ──
  const result = await submitStudioJob({ prompt, duration, resolution, ratio, imageUrl })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 })

  return NextResponse.json({ jobId: result.jobId })
}
