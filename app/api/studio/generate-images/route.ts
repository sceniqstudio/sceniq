// app/api/studio/generate-images/route.ts
// POST — Génère des images Dreamina Image 5.0 Lite (BytePlus) — API synchrone
// Stratégie : N appels parallèles n=1 (plus rapide et dans le timeout Vercel 10s)
// Retourne directement { images: string[] } — plus de polling nécessaire
// Body (multipart/form-data) :
//   prompt      string     requis
//   ratio       string     '16:9'|'9:16'|'1:1'|'4:3'|'3:4'|'21:9'
//   refs        File[]     images de référence (clé répétée, 1-9)
//   numImages   string     '1'|'2'|'3'|'4' — défaut '2'

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const BASE_URL    = process.env.BYTEPLUS_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3'
const IMAGE_MODEL = 'seedream-5-0-260128'

const RATIO_TO_SIZE: Record<string, string> = {
  '16:9': '2560x1440',
  '9:16': '1440x2560',
  '1:1':  '1920x1920',
  '4:3':  '2400x1800',
  '3:4':  '1800x2400',
  '21:9': '3360x1440',
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function generateOneImage(input: {
  prompt: string
  size: string
  imageUrls: string[]
  apiKey: string
}): Promise<string | null> {
  const body: Record<string, unknown> = {
    model:           IMAGE_MODEL,
    prompt:          input.prompt,
    n:               1,
    size:            input.size,
    response_format: 'url',
    watermark:       false,
  }

  if (input.imageUrls.length === 1)      body.image      = input.imageUrls[0]
  else if (input.imageUrls.length > 1)   body.image_urls = input.imageUrls

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${input.apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('[generate-images] BytePlus error', res.status, err)
    return null
  }

  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  const items = data.data as Array<{ url?: string }> | undefined
  return items?.[0]?.url ?? null
}

export async function POST(req: NextRequest) {
  const secret   = req.headers.get('x-admin-secret')
  const expected = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'BYTEPLUS_API_KEY manquant' }, { status: 500 })

  let prompt:    string
  let ratio:     string
  let numImages: number
  let imageUrls: string[] = []

  try {
    const form = await req.formData()
    prompt     = (form.get('prompt')    as string ?? '').trim()
    ratio      = (form.get('ratio')     as string ?? '1:1')
    numImages  = Math.min(parseInt(form.get('numImages') as string ?? '2', 10), 4) || 2

    if (!prompt) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })

    const refs      = form.getAll('refs') as File[]
    const validRefs = refs.filter(f => f instanceof File && f.size > 0).slice(0, 9)
    if (validRefs.length === 0) {
      return NextResponse.json({ error: 'Au moins une image de référence est requise' }, { status: 400 })
    }

    // Upload refs → Supabase Storage (en parallèle)
    const supabase = supabaseAdmin()
    const ts       = Date.now()

    const uploaded = await Promise.all(
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
    imageUrls = uploaded.filter((u): u is string => u !== null)
  } catch (e) {
    return NextResponse.json({ error: `Parsing requête : ${(e as Error).message}` }, { status: 400 })
  }

  const size = RATIO_TO_SIZE[ratio] ?? '1920x1920'

  // N appels parallèles n=1 — API BytePlus synchrone
  const calls = Array.from({ length: numImages }, () =>
    generateOneImage({ prompt, size, imageUrls, apiKey }),
  )

  const results  = await Promise.allSettled(calls)
  const images   = results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter((u): u is string => u !== null)

  if (images.length === 0) {
    return NextResponse.json({ error: 'BytePlus n\'a retourné aucune image. Réessaie.' }, { status: 502 })
  }

  // Retour direct — plus de polling
  return NextResponse.json({ images })
}
