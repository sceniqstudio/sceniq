// app/api/brands/[id]/assets/route.ts
//
// POST   /api/brands/[id]/assets   → upload un asset (FormData: file, type=logo|image)
//                                    Crée brand_assets avec url publique du bucket Storage

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'

const BUCKET = 'brand-assets'
const MAX_BYTES = 10 * 1024 * 1024  // 10 MB par image
// Liste alignée sur ce que Seedance 2.0 / BytePlus ModelArk accepte en input.
// Cf. https://docs.byteplus.com/en/docs/ModelArk/1520757 (rubrique "image" : formats supportés)
// SVG et AVIF sont volontairement exclus : Seedance ne les accepte pas et un asset
// stocké sous ce format causerait un échec silencieux de la génération vidéo.
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/gif',
  'image/heic',
  'image/heif',
]

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    // Ownership check
    const { data: brand } = await sb
      .from('brands')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .single()
    if (!brand) return NextResponse.json({ error: 'brand_not_found' }, { status: 404 })

    const form = await req.formData()
    const file = form.get('file')
    const type = (form.get('type') as string) || 'image'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file_required' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `file_too_large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `invalid_mime_type (autorisés: ${ALLOWED_TYPES.join(', ')})` }, { status: 400 })
    }
    if (!['logo', 'image'].includes(type)) {
      return NextResponse.json({ error: 'invalid_type (logo|image)' }, { status: 400 })
    }

    // Si type=logo, on s'assure qu'il n'y en a pas déjà un (suppression de l'ancien)
    if (type === 'logo') {
      const { data: existingLogos } = await sb
        .from('brand_assets')
        .select('id, url')
        .eq('brand_id', brand.id as string)
        .eq('type', 'logo')
      for (const old of existingLogos ?? []) {
        await sb.from('brand_assets').delete().eq('id', old.id as string)
        const oldUrl = old.url as string | null
        if (oldUrl) {
          const idx = oldUrl.indexOf(`/${BUCKET}/`)
          if (idx >= 0) {
            await sb.storage.from(BUCKET).remove([oldUrl.slice(idx + BUCKET.length + 2)]).catch(() => {})
          }
        }
      }
    }

    // Build storage path
    const ext  = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = `${brand.id}/${type}-${crypto.randomUUID()}.${ext}`

    // Upload
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    // Récupérer URL publique
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = pub.publicUrl

    // Créer la ligne brand_assets
    const { data: asset, error: insertError } = await sb
      .from('brand_assets')
      .insert({
        brand_id: brand.id as string,
        type:     type as 'logo' | 'image',
        url:      publicUrl,
        value:    null,
      })
      .select('id, type, url, created_at')
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    // Touch brand.updated_at
    await sb.from('brands').update({ updated_at: new Date().toISOString() }).eq('id', brand.id as string)

    return NextResponse.json({ asset }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
