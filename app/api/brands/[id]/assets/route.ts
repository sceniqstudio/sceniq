// app/api/brands/[id]/assets/route.ts
//
// POST   /api/brands/[id]/assets   → upload un asset (FormData: file, type=logo|image)
//                                    Crée brand_assets avec url publique du bucket Storage

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'

const BUCKET = 'brand-assets'
const MAX_BYTES_IMAGE = 10 * 1024 * 1024  // 10 MB par image
const MAX_BYTES_AUDIO = 25 * 1024 * 1024  // 25 MB par échantillon vocal (60s mp3 320kbps ≈ 2.4 MB)
// Liste images alignée sur Seedance 2.0 / BytePlus ModelArk (jpeg/png/webp/bmp/tiff/gif/heic/heif).
// SVG et AVIF exclus volontairement (cf historique des bugs lip-sync FR / format unsupported).
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/bmp',
  'image/tiff', 'image/gif', 'image/heic', 'image/heif',
]
// Audio : formats acceptés par ElevenLabs (voice cloning) ET BytePlus OmniHuman (audio source)
// — l'intersection est mp3 + wav + m4a (mp4 audio container). On garde aussi aac pour souplesse.
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',    // mp3 standard
  'audio/mp3',     // alias mp3
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',     // m4a
  'audio/x-m4a',
  'audio/aac',
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
    if (!['logo', 'image', 'voice'].includes(type)) {
      return NextResponse.json({ error: 'invalid_type (logo|image|voice)' }, { status: 400 })
    }

    // Validation MIME + taille selon le type d'asset
    if (type === 'voice') {
      if (file.size > MAX_BYTES_AUDIO) {
        return NextResponse.json({ error: `file_too_large (max ${MAX_BYTES_AUDIO / 1024 / 1024} MB)` }, { status: 400 })
      }
      if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `invalid_audio_mime_type (autorisés: mp3, wav, m4a, aac)` }, { status: 400 })
      }
    } else {
      if (file.size > MAX_BYTES_IMAGE) {
        return NextResponse.json({ error: `file_too_large (max ${MAX_BYTES_IMAGE / 1024 / 1024} MB)` }, { status: 400 })
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `invalid_mime_type (autorisés: jpeg, png, webp, bmp, tiff, gif, heic, heif)` }, { status: 400 })
      }
    }

    // Si type=logo ou voice (singleton par marque), on supprime l'existant avant upload
    if (type === 'logo' || type === 'voice') {
      const { data: existingLogos } = await sb
        .from('brand_assets')
        .select('id, url')
        .eq('brand_id', brand.id as string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('type', type as any)
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

    // Build storage path — extension par défaut selon le type d'asset
    const defaultExt = type === 'voice' ? 'mp3' : 'png'
    const ext  = (file.name.split('.').pop() || defaultExt).toLowerCase()
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type:     type as any,
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
