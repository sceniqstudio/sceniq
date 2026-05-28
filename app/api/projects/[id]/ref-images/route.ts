// app/api/projects/[id]/ref-images/route.ts
// POST   — upload une image de référence projet (max 6 → projects.ref_image_urls)
// DELETE — supprime une image par URL

import { auth }                       from '@clerk/nextjs/server'
import { NextResponse }               from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser }                 from '@/lib/supabase/ensure-user'

const BUCKET   = 'brand-assets'
const MAX_REFS = 6
const MAX_SIZE = 10 * 1024 * 1024  // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/bmp',
  'image/tiff', 'image/gif', 'image/heic', 'image/heif',
]

// ── POST /api/projects/[id]/ref-images ─────────────────────────────────────────
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
    const { data: project } = await sb
      .from('projects')
      .select('id, ref_image_urls')
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .single()
    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    const currentUrls: string[] = (project.ref_image_urls as string[]) ?? []
    if (currentUrls.length >= MAX_REFS) {
      return NextResponse.json(
        { error: `max_${MAX_REFS}_images_reached`, urls: currentUrls },
        { status: 400 },
      )
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file_required' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'file_too_large (max 10 MB)' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'invalid_mime_type' }, { status: 400 })
    }

    // Upload → Storage path : projects/[id]/ref-[uuid].[ext]
    const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `projects/${params.id}/ref-${crypto.randomUUID()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl    = pub.publicUrl

    const newUrls = [...currentUrls, publicUrl]
    const { error: updateError } = await sb
      .from('projects')
      .update({ ref_image_urls: newUrls, updated_at: new Date().toISOString() })
      .eq('id', params.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ url: publicUrl, urls: newUrls }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// ── DELETE /api/projects/[id]/ref-images ──────────────────────────────────────
// Body JSON : { url: string }
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    const { data: project } = await sb
      .from('projects')
      .select('id, ref_image_urls')
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .single()
    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    const { url } = await req.json().catch(() => ({}))
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url_required' }, { status: 400 })
    }

    const currentUrls: string[] = (project.ref_image_urls as string[]) ?? []
    const newUrls = currentUrls.filter((u) => u !== url)

    // Supprimer du Storage
    const idx = url.indexOf(`/${BUCKET}/`)
    if (idx >= 0) {
      await sb.storage.from(BUCKET).remove([url.slice(idx + BUCKET.length + 2)]).catch(() => {})
    }

    await sb
      .from('projects')
      .update({ ref_image_urls: newUrls, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json({ urls: newUrls })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
