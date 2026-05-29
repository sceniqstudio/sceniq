// app/api/generation/[id]/route.ts
// NOTE routing : ce segment dynamique partage le nom `[id]` avec la route unifiée
// (app/api/generation/[id]/unified/). Next.js interdit deux noms de slug différents
// au même niveau de chemin — ici `[id]` porte un sceneId. URL appelée inchangée.
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateClipByteplus } from '@/lib/byteplus/seedance'  // Provider principal
import { generateClip as generateClipFal } from '@/lib/fal/seedance' // Fallback silencieux
import { consumeCredit } from '@/lib/credits'
import { ensureUser } from '@/lib/supabase/ensure-user'

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// POST /api/generation/[id] — génère un clip Seedance 2.0 ([id] = sceneId)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let dbUserId: string
  try {
    const ensured = await ensureUser(userId)
    dbUserId = ensured.userId
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
  const user = { id: dbUserId }

  // Ownership check — la scène appartient bien à un projet de cet user
  // On joint aussi projects.brand_id et projects.format pour le routing Brand Memory
  const { data: scene } = await sb()
    .from('scenes')
    .select('id, project_id, duration_sec, seedance_prompt, status, projects!inner(user_id, brand_id, format)')
    .eq('id', params.id)
    .eq('projects.user_id', user.id)
    .single()

  if (!scene) return NextResponse.json({ error: 'scene_not_found' }, { status: 404 })
  if (scene.status === 'generating') return NextResponse.json({ error: 'already_generating' }, { status: 409 })

  // Extraction du projet joint — supabase-js retourne soit un objet soit un tableau
  const project = Array.isArray(scene.projects) ? scene.projects[0] : scene.projects
  const brandId  = (project as { brand_id: string | null } | undefined)?.brand_id ?? null
  const format   = (project as { format: string } | undefined)?.format ?? '16:9'

  // Brand Memory → reference-to-video (si la marque a des assets logo/image)
  // Sinon → text-to-video fallback (referenceImageUrls reste vide)
  //
  // ⚠️  Filtre formats : Seedance 2.0 (BytePlus + fal.ai) supporte jpeg, png, webp,
  //     bmp, tiff, gif, heic, heif. PAS svg ni avif. On filtre côté serveur pour
  //     éviter un 400 InvalidParameter.UnsupportedImageFormat qui ferait tomber
  //     toute la génération (les autres refs valides ne seraient jamais essayées).
  const SUPPORTED_IMAGE_EXT = /\.(jpe?g|png|webp|bmp|tiff?|gif|heic|heif)(\?|$)/i
  let referenceImageUrls: string[] = []
  if (brandId) {
    const { data: assets } = await sb()
      .from('brand_assets')
      .select('url')
      .eq('brand_id', brandId)
      .in('type', ['logo', 'image'])
      .not('url', 'is', null)
      .order('type', { ascending: false }) // logo d'abord (alphabétique inverse : 'logo' > 'image')
      .limit(9) // BytePlus max 9 références
    referenceImageUrls = (assets ?? [])
      .map((a: { url: string | null }) => a.url)
      .filter((u): u is string => Boolean(u))
      .filter((u) => SUPPORTED_IMAGE_EXT.test(u))
  }

  // Consommer un crédit (idempotent)
  const credit = await consumeCredit({
    userId:    user.id,
    projectId: scene.project_id,
    sceneId:   scene.id,
  })

  if (credit.error === 'insufficient_credits') {
    return NextResponse.json({ error: 'insufficient_credits', balance: 0 }, { status: 402 })
  }

  // Marquer en cours
  await sb().from('scenes').update({ status: 'generating' }).eq('id', scene.id)

  // Créer le clip en BDD
  const { data: clip } = await sb().from('clips').insert({
    scene_id: scene.id,
    status:   'processing',
  }).select('id').single()

  // Génération vidéo — NOTE : en V1 on fait ça de façon synchrone
  // En V2 → job queue pour éviter le timeout Vercel
  //
  // Architecture dual-provider (validée 2026-05-15) :
  //   1. BytePlus ModelArk — provider PRINCIPAL (1080p, audio natif, ~$0.075/s)
  //   2. fal.ai — fallback SILENCIEUX si BytePlus échoue ou est suspendu
  //
  // BytePlus routing (géré dans generateClipByteplus) :
  //   - 0 ref   → text-to-video
  //   - 1 ref   → image-to-video (image_url)
  //   - 2-9 ref → reference-to-video (image_url + references[])

  // ── 1. BytePlus (principal) ──
  let videoUrl: string | null = null
  let jobId: string = ''
  let generationError: string | null = null

  const byteplusResult = await generateClipByteplus({
    prompt:             scene.seedance_prompt,
    duration:           String(scene.duration_sec),
    aspectRatio:        format,
    referenceImageUrls,
  })

  if (byteplusResult.videoUrl) {
    videoUrl = byteplusResult.videoUrl
    jobId    = byteplusResult.jobId
  } else {
    // ── 2. fal.ai (fallback silencieux) ──
    console.warn('[generation] BytePlus failed → fallback fal.ai:', byteplusResult.error)
    const falResult = await generateClipFal({
      prompt:             scene.seedance_prompt,
      duration:           String(scene.duration_sec),
      aspectRatio:        format,
      referenceImageUrls,
    })
    videoUrl        = falResult.videoUrl
    jobId           = falResult.requestId
    generationError = falResult.error
  }

  if (generationError || !videoUrl) {
    await sb().from('clips').update({ status: 'failed', error: generationError }).eq('id', clip!.id)
    await sb().from('scenes').update({ status: 'failed' }).eq('id', scene.id)
    // Rembourser le crédit si les deux providers échouent
    await sb().from('credits_ledger').insert({
      user_id: user.id, delta: 1, reason: 'refund', scene_id: scene.id,
    })
    return NextResponse.json({ error: generationError }, { status: 500 })
  }

  // Succès
  await sb().from('clips').update({
    status:     'done',
    video_url:  videoUrl,
    fal_job_id: jobId,   // stocke le job_id quel que soit le provider (rename → job_id en V2)
  }).eq('id', clip!.id)

  await sb().from('scenes').update({ status: 'done' }).eq('id', scene.id)
  await sb().from('projects').update({ status: 'generation' }).eq('id', scene.project_id)

  return NextResponse.json({
    videoUrl,
    newBalance: credit.newBalance,
  })
}
