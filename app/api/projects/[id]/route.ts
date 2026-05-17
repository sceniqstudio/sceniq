// app/api/projects/[id]/route.ts
//
// CRUD individuel d'un projet :
//   GET    → charger le projet (pré-remplissage du brief, etc.)
//   PATCH  → mise à jour partielle des champs (name, brief, format, duration_sec, tone, brand_id)
//   DELETE → suppression du projet (cascade BDD : agent_outputs, scenes, clips via ON DELETE CASCADE)
//
// Ownership check systématique : .eq('user_id', dbUserId) sur chaque opération.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'

type ProjectPatch = Partial<{
  name:         string
  brief:        string
  format:       string
  duration_sec: number
  tone:         string
  brand_id:     string | null
}>

const VALID_FORMATS   = new Set(['16:9', '9:16', '1:1', '4:3'])
const VALID_DURATIONS = new Set([15, 30, 45, 60])

// ────────────────────────────────────────────────────────────────────────────
// GET — charge un projet (pour pré-remplissage du formulaire brief)
// ────────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    const { data: project, error } = await sb
      .from('projects')
      .select('id, name, brief, format, duration_sec, tone, brand_id, status, created_at, updated_at')
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PATCH — mise à jour partielle du projet
// ────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>

    // Validation soft des champs présents — on n'écrase que ce qui est fourni
    const patch: ProjectPatch & { updated_at: string } = { updated_at: new Date().toISOString() }

    if (typeof body.name === 'string') {
      const v = body.name.trim()
      if (v.length === 0 || v.length > 120) {
        return NextResponse.json({ error: 'name_invalid (1..120 chars)' }, { status: 400 })
      }
      patch.name = v
    }
    if (typeof body.brief === 'string') {
      const v = body.brief.trim()
      if (v.length < 10 || v.length > 2000) {
        return NextResponse.json({ error: 'brief_invalid (10..2000 chars)' }, { status: 400 })
      }
      patch.brief = v
    }
    if (typeof body.format === 'string') {
      if (!VALID_FORMATS.has(body.format)) {
        return NextResponse.json({ error: 'format_invalid' }, { status: 400 })
      }
      patch.format = body.format
    }
    if (typeof body.duration_sec === 'number') {
      if (!VALID_DURATIONS.has(body.duration_sec)) {
        return NextResponse.json({ error: 'duration_invalid (15|30|45|60)' }, { status: 400 })
      }
      patch.duration_sec = body.duration_sec
    }
    if (typeof body.tone === 'string') {
      const v = body.tone.trim()
      if (v.length === 0 || v.length > 60) {
        return NextResponse.json({ error: 'tone_invalid (1..60 chars)' }, { status: 400 })
      }
      patch.tone = v
    }
    // brand_id peut être string OU null (désassociation explicite)
    if (body.brand_id === null) {
      patch.brand_id = null
    } else if (typeof body.brand_id === 'string' && body.brand_id.length > 0) {
      patch.brand_id = body.brand_id
    }

    // Si seul updated_at, rien à patcher
    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: 'no_fields_to_update' }, { status: 400 })
    }

    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await sb
      .from('projects')
      .update(patch as any)
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'project_not_found' }, { status: 404 })
    }

    return NextResponse.json({ projectId: data.id })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE — supprime un projet et tout son contenu (cascade BDD)
// ────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    // Le ON DELETE CASCADE défini dans les migrations propage la suppression aux
    // agent_outputs, scenes et clips. On supprime ici en vérifiant l'ownership.
    const { data, error } = await sb
      .from('projects')
      .delete()
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'project_not_found' }, { status: 404 })
    }

    return NextResponse.json({ deleted: data.id })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
