// app/api/production/[projectId]/agent/[agentId]/route.ts
//
// Actions ciblées sur un seul agent (vs route parente qui ré-exécute les 5) :
//   POST  → ré-exécute uniquement cet agent et upsert le nouvel output
//           (utile pour "Régénérer" depuis l'UI sans re-tirer toute la chaîne)
//   PATCH → met à jour le content après édition manuelle de l'utilisateur,
//           re-passe l'agent en `accepted=false` (revalidation requise)
//
// Le storyboarder a un traitement spécial : son output est parsé en scenes,
// donc on re-parse + delete/insert dans la table `scenes` à chaque rerun/edit.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser }                  from '@/lib/supabase/ensure-user'
import { runDirector }                 from '@/lib/claude/agents/director'
import { runScriptwriter }             from '@/lib/claude/agents/scriptwriter'
import { runStoryboarder }             from '@/lib/claude/agents/storyboarder'
import { runMusicSupervisor }          from '@/lib/claude/agents/music-supervisor'
import { runVisualDirector }           from '@/lib/claude/agents/visual-director'
import type { AssetRef }               from '@/lib/claude/agents'

type AgentId = 'director' | 'scriptwriter' | 'storyboarder' | 'music' | 'visual'

const AGENT_IDS: AgentId[] = ['director', 'scriptwriter', 'storyboarder', 'music', 'visual']

function isValidAgent(id: string): id is AgentId {
  return (AGENT_IDS as string[]).includes(id)
}

// ────────────────────────────────────────────────────────────────────────────
// POST — ré-exécute cet agent uniquement
// ────────────────────────────────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: { projectId: string; agentId: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!isValidAgent(params.agentId)) {
    return NextResponse.json({ error: 'invalid_agent' }, { status: 400 })
  }

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    const { data: project } = await sb
      .from('projects')
      .select('id, brief, duration_sec, user_id, brand_id')
      .eq('id', params.projectId)
      .eq('user_id', dbUserId)
      .single()

    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    // Brand Memory assets — uniquement utile pour le storyboarder
    let brandAssets: AssetRef[] = []
    if (params.agentId === 'storyboarder' && project.brand_id) {
      const { data: rawAssets } = await sb
        .from('brand_assets')
        .select('type, url, value')
        .eq('brand_id', project.brand_id)
        .in('type', ['logo', 'image'])
        .order('created_at', { ascending: true })
        .limit(9)
      brandAssets = (rawAssets ?? []).map((a) => {
        const url = (a.url ?? '') as string
        const fallbackName = url.split('/').pop() || (a.value as string | undefined) || 'asset'
        return { type: a.type as AssetRef['type'], name: fallbackName, url }
      })
    }

    const brief    = project.brief as string
    const duration = project.duration_sec as number

    // Dispatch sur l'agent ciblé
    let content: string | null = null
    let error:   string | null = null
    let storyboarderScenes: Array<{ index: number; duration: string; seedancePrompt: string; description: string }> = []

    switch (params.agentId) {
      case 'director': {
        const r = await runDirector(brief)
        content = r.content || null; error = r.error
        break
      }
      case 'scriptwriter': {
        const r = await runScriptwriter(brief, duration)
        content = r.content || null; error = r.error
        break
      }
      case 'storyboarder': {
        const r = await runStoryboarder(brief, duration, brandAssets)
        content = r.content || null; error = r.error
        storyboarderScenes = r.scenes
        break
      }
      case 'music': {
        const r = await runMusicSupervisor(brief)
        content = r.content || null; error = r.error
        break
      }
      case 'visual': {
        const r = await runVisualDirector(brief)
        content = r.content || null; error = r.error
        break
      }
    }

    if (error || !content) {
      return NextResponse.json({ error: error || 'empty_output' }, { status: 500 })
    }

    // Upsert — revient à 'accepted=false' (l'user doit revalider la nouvelle version)
    await sb.from('agent_outputs').upsert(
      {
        project_id: project.id as string,
        agent:      params.agentId,
        content,
        accepted:   false,
        version:    1,
      },
      { onConflict: 'project_id,agent' },
    )

    // Storyboarder → reparse + replace scenes
    if (params.agentId === 'storyboarder' && storyboarderScenes.length > 0) {
      await sb.from('scenes').delete().eq('project_id', project.id as string)
      await sb.from('scenes').insert(
        storyboarderScenes.map((s) => ({
          project_id:      project.id as string,
          scene_index:     s.index,
          duration_sec:    parseInt(s.duration, 10) || 5,
          seedance_prompt: s.seedancePrompt,
          description_fr: s.description,
          status:          'idle' as const,
        })),
      )
    }

    return NextResponse.json({ agent: params.agentId, content })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PATCH — édite le content (révision manuelle de l'user)
// ────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string; agentId: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!isValidAgent(params.agentId)) {
    return NextResponse.json({ error: 'invalid_agent' }, { status: 400 })
  }

  try {
    const body    = await req.json().catch(() => ({})) as { content?: unknown }
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (!content) return NextResponse.json({ error: 'content_required' }, { status: 400 })
    if (content.length > 20000) {
      return NextResponse.json({ error: 'content_too_long (max 20000)' }, { status: 400 })
    }

    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    const { data: project } = await sb
      .from('projects')
      .select('id, user_id')
      .eq('id', params.projectId)
      .eq('user_id', dbUserId)
      .single()

    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    await sb.from('agent_outputs').upsert(
      {
        project_id: project.id as string,
        agent:      params.agentId,
        content,
        accepted:   false,
        version:    1,
      },
      { onConflict: 'project_id,agent' },
    )

    // Storyboarder édité → re-parser depuis le nouveau texte pour rafraîchir les scènes
    if (params.agentId === 'storyboarder') {
      const { parseScenes } = await import('@/lib/claude/agents/storyboarder')
      const scenes = parseScenes(content)
      if (scenes.length > 0) {
        await sb.from('scenes').delete().eq('project_id', project.id as string)
        await sb.from('scenes').insert(
          scenes.map((s) => ({
            project_id:      project.id as string,
            scene_index:     s.index,
            duration_sec:    parseInt(s.duration, 10) || 5,
            seedance_prompt: s.seedancePrompt,
            description_fr:  s.description,
            status:          'idle' as const,
          })),
        )
      }
    }

    return NextResponse.json({ agent: params.agentId, content })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
