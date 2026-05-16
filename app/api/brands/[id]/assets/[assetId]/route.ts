// app/api/brands/[id]/assets/[assetId]/route.ts
//
// DELETE /api/brands/[id]/assets/[assetId]  → supprime l'asset + son fichier Storage

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'

const BUCKET = 'brand-assets'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; assetId: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    // Ownership chain : asset → brand → user
    const { data: asset } = await sb
      .from('brand_assets')
      .select('id, brand_id, url, brands!inner(user_id)')
      .eq('id', params.assetId)
      .eq('brand_id', params.id)
      .single()

    if (!asset) return NextResponse.json({ error: 'asset_not_found' }, { status: 404 })

    const brandUser = Array.isArray(asset.brands) ? asset.brands[0] : asset.brands
    if ((brandUser as { user_id?: string })?.user_id !== dbUserId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // Supprimer du Storage
    const url = asset.url as string | null
    if (url) {
      const idx = url.indexOf(`/${BUCKET}/`)
      if (idx >= 0) {
        const path = url.slice(idx + BUCKET.length + 2)
        await sb.storage.from(BUCKET).remove([path]).catch(() => {})
      }
    }

    // Supprimer la ligne
    const { error } = await sb.from('brand_assets').delete().eq('id', asset.id as string)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
