// app/api/studio/generate-images/route.ts
// POST — Génère des images via Dreamina Image 5.0 Lite (BytePlus ModelArk)
// Body (multipart/form-data) :
//   prompt      string     requis
//   ratio       string     '16:9'|'9:16'|'1:1'|'4:3'|'3:4'|'21:9'
//   refs        File[]     images de référence (clé répétée, 1-9)
//   numImages   string     '1'|'2'|'3'|'4' — défaut '4'

import { NextRequest, NextResponse }      from 'next/server'
import { createClient }                   from '@supabase/supabase-js'
import { generateImagesSync }             from '@/lib/byteplus/image-gen'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let prompt:    string
  let ratio:     string
  let numImages: number
  let imageUrls: string[] = []

  try {
    const form = await req.formData()
    prompt     = (form.get('prompt')     as string ?? '').trim()
    ratio      = (form.get('ratio')      as string ?? '1:1')
    numImages  = Math.min(parseInt(form.get('numImages') as string ?? '4', 10), 4) || 4

    if (!prompt) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })

    // ── Upload refs → Supabase Storage ──
    const refs      = form.getAll('refs') as File[]
    const validRefs = refs.filter(f => f instanceof File && f.size > 0).slice(0, 9)

    if (validRefs.length > 0) {
      const supabase = supabaseAdmin()
      const ts       = Date.now()

      for (let i = 0; i < validRefs.length; i++) {
        const img  = validRefs[i]
        const ext  = img.name.split('.').pop() ?? 'jpg'
        const path = `studio/img-${ts}-${i}.${ext}`
        const buf  = Buffer.from(await img.arrayBuffer())

        const { error: upErr } = await supabase.storage
          .from('brand-assets')
          .upload(path, buf, { contentType: img.type, upsert: false })

        if (upErr) return NextResponse.json({ error: `Upload ref ${i + 1} : ${upErr.message}` }, { status: 500 })

        const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
        if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl)
      }
    }
  } catch (e) {
    return NextResponse.json({ error: `Parsing requête : ${(e as Error).message}` }, { status: 400 })
  }

  // ── Générer via Dreamina Image 5.0 Lite ──
  const result = await generateImagesSync({ prompt, ratio, imageUrls, numImages })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ images: result.images })
}
