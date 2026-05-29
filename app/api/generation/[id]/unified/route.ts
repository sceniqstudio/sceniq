// app/api/generation/[projectId]/unified/route.ts
//
// Pipeline V1 agence services — 1 seul appel API BytePlus avec prompt unifié multi-shot.
// Au lieu de N appels (un par scène), on envoie le PROMPT_FINAL_UNIFIE généré par le
// Storyboarder et on obtient une vidéo finale déjà montée.
//
// POST — soumet le job BytePlus, stocke video_job_id dans projects
// GET  — poll le statut du job en cours, met à jour final_video_url si succès

import { auth }                       from '@clerk/nextjs/server'
import { NextResponse }               from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser }                 from '@/lib/supabase/ensure-user'
import { submitStudioJob, checkStudioJob } from '@/lib/byteplus/studio'
import { parseUnifiedPrompt }         from '@/lib/claude/agents/storyboarder'

// Normalisation des ratios BytePlus
const RATIO_MAP: Record<string, string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1':  '1:1',
  '4:3':  '4:3',
  '3:4':  '3:4',
  '21:9': '16:9', // 21:9 non supporté par Seedance → fallback 16:9
}

// ── POST /api/generation/[projectId]/unified ─────────────────────────────────
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },  // [id] = projectId (slug partagé avec ../route.ts)
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    // Ownership + chargement projet
    const { data: project } = await sb
      .from('projects')
      .select('id, format, duration_sec, ref_image_urls, video_job_id, status')
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .single()
    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    // Idempotence — éviter de relancer si un job tourne déjà
    if (project.video_job_id && project.status === 'generation') {
      return NextResponse.json({
        jobId:          project.video_job_id,
        alreadyRunning: true,
      })
    }

    // Récupérer le prompt unifié depuis l'output du Storyboarder
    const { data: storyboarderOutput } = await sb
      .from('agent_outputs')
      .select('content')
      .eq('project_id', params.id)
      .eq('agent', 'storyboarder')
      .single()

    if (!storyboarderOutput?.content) {
      return NextResponse.json(
        { error: 'storyboarder_output_not_found — relance les agents d\'abord' },
        { status: 400 },
      )
    }

    const unifiedPrompt = parseUnifiedPrompt(storyboarderOutput.content as string)
    if (!unifiedPrompt) {
      return NextResponse.json(
        { error: 'PROMPT_FINAL_UNIFIE absent du storyboarder — régénère le bloc Storyboard' },
        { status: 400 },
      )
    }

    const ratio    = RATIO_MAP[project.format as string] ?? '16:9'
    const refUrls  = (project.ref_image_urls as string[]) ?? []
    const duration = project.duration_sec as number

    const { jobId, error } = await submitStudioJob({
      prompt:     unifiedPrompt,
      duration:   Math.min(Math.max(duration, 4), 15),  // BytePlus range 4-15s
      resolution: '1080p',
      ratio,
      quality:    'standard',  // jamais Fast en prod (décision architecturale 2026-05-15)
      imageUrls:  refUrls,
    })

    if (error || !jobId) {
      return NextResponse.json(
        { error: error ?? 'BytePlus: no job_id returned' },
        { status: 500 },
      )
    }

    // Persister le job_id + statut → 'generation'
    await sb
      .from('projects')
      .update({
        video_job_id: jobId,
        status:       'generation',
        updated_at:   new Date().toISOString(),
      })
      .eq('id', params.id)

    return NextResponse.json({ jobId })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// ── GET /api/generation/[projectId]/unified ──────────────────────────────────
// Appelé par le client en polling toutes les ~5 secondes.
// Retourne { status, videoUrl, error }
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },  // [id] = projectId (slug partagé avec ../route.ts)
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    const { data: project } = await sb
      .from('projects')
      .select('id, video_job_id, final_video_url, status')
      .eq('id', params.id)
      .eq('user_id', dbUserId)
      .single()
    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    // Déjà terminé — retour immédiat sans poll BytePlus
    if (project.final_video_url) {
      return NextResponse.json({
        status:   'succeeded',
        videoUrl: project.final_video_url,
        error:    null,
      })
    }

    // Pas encore soumis
    if (!project.video_job_id) {
      return NextResponse.json({ status: 'idle', videoUrl: null, error: null })
    }

    // Poll BytePlus (1 seul appel, pas de boucle — évite timeout Vercel)
    const poll = await checkStudioJob(project.video_job_id as string)

    if (poll.status === 'succeeded' && poll.videoUrl) {
      // ✅ Succès → persister final_video_url + statut export
      await sb
        .from('projects')
        .update({
          final_video_url: poll.videoUrl,
          status:          'export',
          updated_at:      new Date().toISOString(),
        })
        .eq('id', params.id)
    }

    if (
      poll.status === 'failed' ||
      poll.status === 'expired' ||
      poll.status === 'cancelled'
    ) {
      // ❌ Échec → reset pour permettre retry
      await sb
        .from('projects')
        .update({
          video_job_id: null,
          status:       'production',
          updated_at:   new Date().toISOString(),
        })
        .eq('id', params.id)
    }

    return NextResponse.json({
      status:   poll.status,
      videoUrl: poll.videoUrl,
      error:    poll.error,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
