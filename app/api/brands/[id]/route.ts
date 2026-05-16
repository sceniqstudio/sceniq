// app/api/brands/[id]/route.ts
//
// GET    /api/brands/[id]   → détail marque + ses assets
// PATCH  /api/brands/[id]   → modifier le nom
// DELETE /api/brands/[id]   → supprimer (cascade brand_assets via FK)

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'

async function loadBrand(brandId: string, dbUserId: string) {
  const sb = createSupabaseServerClient()
  const { data } = await sb
    .from('brands')
    .select('id, name, user_id, created_at, updated_at')
    .eq('id', brandId)
    .eq('user_id', dbUserId)
    .single()
  return data
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const brand = await loadBrand(params.id, dbUserId)
    if (!brand) return NextResponse.json({ error: 'brand_not_found' }, { status: 404 })

    const sb = createSupabaseServerClient()
    const { data: assets } = await sb
      .from('brand_assets')
      .select('id, type, url, value, created_at')
      .eq('brand_id', brand.id as string)
      .order('created_at', { ascending: true })

    return NextResponse.json({ brand, assets: assets ?? [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { name?: unknown }
  try { body = await req.json() } catch { body = {} }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 })
  if (name.length > 80) return NextResponse.json({ error: 'name_too_long' }, { status: 400 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const brand = await loadBrand(params.id, dbUserId)
    if (!brand) return NextResponse.json({ error: 'brand_not_found' }, { status: 404 })

    const sb = createSupabaseServerClient()
    const { data, error } = await sb
      .from('brands')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', brand.id as string)
      .select('id, name, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ brand: data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const brand = await loadBrand(params.id, dbUserId)
    if (!brand) return NextResponse.json({ error: 'brand_not_found' }, { status: 404 })

    const sb = createSupabaseServerClient()

    // Récupérer les URLs des assets pour les supprimer du bucket Storage
    const { data: assets } = await sb
      .from('brand_assets')
      .select('url')
      .eq('brand_id', brand.id as string)

    // Construire les chemins relatifs depuis les URLs publiques
    const paths: string[] = []
    for (const a of assets ?? []) {
      const url = a.url as string | null
      if (!url) continue
      const idx = url.indexOf('/brand-assets/')
      if (idx >= 0) {
        paths.push(url.slice(idx + '/brand-assets/'.length))
      }
    }

    if (paths.length > 0) {
      await sb.storage.from('brand-assets').remove(paths).catch(() => {
        // silencieux : si le fichier n'existe pas déjà ce n'est pas bloquant
      })
    }

    // Cascade FK supprime aussi les brand_assets
    const { error } = await sb.from('brands').delete().eq('id', brand.id as string)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
