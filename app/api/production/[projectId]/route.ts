// app/api/production/[projectId]/route.ts
//
// Lance les 5 agents IA ScenIQ en parallèle pour un projet donné.
// La logique d'orchestration vit dans lib/claude/agents/index.ts — cette route
// gère seulement : auth, ownership, persistance en BDD, et mise à jour du statut.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'
import { runAllAgents } from '@/lib/claude/agents'
import type { AssetRef } from '@/lib/claude/agents'

// POST /api/production/[projectId] — lance les 5 agents en parallèle
export async function POST(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    // Ownership check via le projet (user_id doit matcher)
    const { data: project } = await sb
      .from('projects')
      .select('id, brief, duration_sec, user_id, brand_id')
      .eq('id', params.projectId)
      .eq('user_id', dbUserId)
      .single()

    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    // ── Brand Memory assets → transmis au Storyboarder (V1.5) ──
    // Schéma actuel (migrations 002) : brand_assets a (type, url, value), pas de `name`.
    // On dérive un name lisible depuis l'URL ou la value pour le prompt.
    let brandAssets: AssetRef[] = []
    if (project.brand_id) {
      const { data: rawAssets } = await sb
        .from('brand_assets')
        .select('type, url, value')
        .eq('brand_id', project.brand_id)
        .in('type', ['logo', 'image'])
        .order('created_at', { ascending: true })
        .limit(9)

      if (rawAssets && rawAssets.length > 0) {
        brandAssets = rawAssets.map((a) => {
          const url = (a.url ?? '') as string
          const fallbackName = url.split('/').pop() || (a.value as string | undefined) || 'asset'
          return {
            type: a.type as AssetRef['type'],
            name: fallbackName,
            url,
          }
        })
      }
    }

    // Lancer les 5 agents en parallèle
    const result = await runAllAgents(project.brief as string, project.duration_sec as number, brandAssets)

    // Persister chaque agent output en BDD (upsert pour idempotence)
    const persistOps = [
      { agent: 'director' as const,     content: result.director.content },
      { agent: 'scriptwriter' as const, content: result.scriptwriter.content },
      { agent: 'storyboarder' as const, content: result.storyboarder.content },
      { agent: 'music' as const,        content: result.music.content },
      { agent: 'visual' as const,       content: result.visual.content },
    ].filter((op) => op.content !== null)

    await Promise.all(
      persistOps.map((op) =>
        sb.from('agent_outputs').upsert(
          {
            project_id: project.id as string,
            agent:      op.agent,
            content:    op.content!,
            accepted:   false,
            version:    1,
          },
          { onConflict: 'project_id,agent' },
        ),
      ),
    )

    // Persister les scènes parsées depuis le Storyboarder (idempotent : delete + insert)
    if (result.storyboarder.scenes.length > 0) {
      await sb.from('scenes').delete().eq('project_id', project.id as string)
      await sb.from('scenes').insert(
        result.storyboarder.scenes.map((s) => ({
          project_id:      project.id as string,
          scene_index:     s.index,
          duration_sec:    parseInt(s.duration, 10) || 5,
          seedance_prompt: s.seedancePrompt,
          description_fr:  s.description,
          status:          'idle' as const,
        })),
      )
    }

    // Update statut projet → production
    await sb.from('projects').update({ status: 'production' }).eq('id', project.id as string)

    const outputs = [
      { agentId: 'director',     content: result.director.content,     error: result.director.error },
      { agentId: 'scriptwriter', content: result.scriptwriter.content, error: result.scriptwriter.error },
      { agentId: 'storyboarder', content: result.storyboarder.content, error: result.storyboarder.error },
      { agentId: 'music',        content: result.music.content,        error: result.music.error },
      { agentId: 'visual',       content: result.visual.content,       error: result.visual.error },
    ]

    return NextResponse.json({
      outputs,
      sceneCount:   result.storyboarder.scenes.length,
      successCount: result.successCount,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// GET /api/production/[projectId] — récupère les outputs persistés (pour /production page)
export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    // Ownership + chargement projet
    const { data: project } = await sb
      .from('projects')
      .select('id, name, brief, format, duration_sec, tone, status')
      .eq('id', params.projectId)
      .eq('user_id', dbUserId)
      .single()

    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    // Outputs des agents
    const { data: agentOutputs } = await sb
      .from('agent_outputs')
      .select('agent, content, accepted, version')
      .eq('project_id', project.id as string)

    // Scènes parsées (si déjà existantes) avec clip joint
    const { data: rawScenes } = await sb
      .from('scenes')
      .select('id, scene_index, duration_sec, seedance_prompt, description_fr, status, clips(video_url, status, error, fal_job_id)')
      .eq('project_id', project.id as string)
      .order('scene_index', { ascending: true })

    // Aplatir : on prend le dernier clip success de chaque scène si dispo
    const scenes = (rawScenes ?? []).map((s: { clips?: Array<{ video_url: string | null; status: string }> } & Record<string, unknown>) => {
      const clipArr = Array.isArray(s.clips) ? s.clips : []
      const doneClip = clipArr.find((c) => c.status === 'done' && c.video_url)
      const { clips: _clips, ...rest } = s
      return {
        ...rest,
        videoUrl: doneClip?.video_url ?? null,
      }
    })

    return NextResponse.json({
      project,
      agentOutputs: agentOutputs ?? [],
      scenes,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
