// lib/byteplus/studio.ts
// Helpers non-bloquants pour le Studio admin — split submit / checkStatus
// (évite le timeout Vercel du polling long de seedance.ts)

const BASE_URL = process.env.BYTEPLUS_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3'

// Modèles Seedance 2.0 — vérifier IDs exacts dans BytePlus console si erreur 404
const VIDEO_MODELS = {
  standard: 'dreamina-seedance-2-0-260128',
  fast:     'dreamina-seedance-2-0-fast-260128',  // À confirmer avec BytePlus console
} as const

export type StudioJobStatus = 'pending' | 'processing' | 'succeeded' | 'completed' | 'failed' | 'expired' | 'cancelled'

export interface SubmitResult {
  jobId: string
  error: string | null
}

export interface StatusResult {
  status:   StudioJobStatus
  videoUrl: string | null
  error:    string | null
}

// ── Submit ────────────────────────────────────────────────────────────────────
export async function submitStudioJob(input: {
  prompt:      string
  duration:    number      // secondes 4-15
  resolution:  string      // '480p' | '720p' | '1080p'
  ratio:       string      // '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9'
  quality:     'standard' | 'fast'
  imageUrls?:  string[]    // 1+ obligatoire, 1ère = source, reste = références
}): Promise<SubmitResult> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { jobId: '', error: 'BYTEPLUS_API_KEY manquant' }

  const model = VIDEO_MODELS[input.quality] ?? VIDEO_MODELS.standard

  const content: Record<string, unknown>[] = [
    { type: 'text', text: input.prompt },
  ]

  // Ajoute toutes les images comme reference_image (max 9)
  const urls = (input.imageUrls ?? []).slice(0, 9)
  for (const url of urls) {
    content.push({
      type:      'image_url',
      image_url: { url },
      role:      'reference_image',
    })
  }

  // En mode r2v (reference-to-video), seul 1080p est garanti supporté
  // sur tous les modèles Seedance — on force 1080p dès qu'il y a des refs
  const hasRefs    = (input.imageUrls ?? []).length > 0
  const resolution = hasRefs ? '1080p' : input.resolution

  const body = {
    model:          model,
    content,
    generate_audio: true,
    resolution,
    ratio:          input.ratio,
    duration:       input.duration,
    watermark:      false,
  }

  try {
    const res = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { jobId: '', error: `BytePlus ${res.status}: ${JSON.stringify(data)}` }

    const jobId = data.id ?? data.task_id ?? data.job_id ?? ''
    if (!jobId) return { jobId: '', error: 'Pas de job_id dans la réponse BytePlus' }

    return { jobId, error: null }
  } catch (e) {
    return { jobId: '', error: (e as Error).message }
  }
}

// ── Check status (un seul appel, pas de boucle) ───────────────────────────────
export async function checkStudioJob(jobId: string): Promise<StatusResult> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { status: 'failed', videoUrl: null, error: 'BYTEPLUS_API_KEY manquant' }

  try {
    const res = await fetch(`${BASE_URL}/contents/generations/tasks/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (res.status === 429) return { status: 'processing', videoUrl: null, error: null }

    const data   = await res.json().catch(() => ({}))
    if (!res.ok)  return { status: 'failed', videoUrl: null, error: `BytePlus poll ${res.status}: ${JSON.stringify(data)}` }

    const status = (data.status ?? 'pending') as StudioJobStatus

    if (status === 'succeeded' || status === 'completed') {
      const videoUrl: string | null =
        data.content?.video_url ?? data.video_url ?? data.output?.video_url ?? data.result?.video_url ?? null
      return { status: 'succeeded', videoUrl, error: videoUrl ? null : 'URL vidéo absente de la réponse' }
    }

    if (status === 'failed' || status === 'expired' || status === 'cancelled') {
      return { status, videoUrl: null, error: `Tâche ${status}: ${JSON.stringify(data.error ?? {})}` }
    }

    return { status: status as StudioJobStatus, videoUrl: null, error: null }
  } catch (e) {
    return { status: 'processing', videoUrl: null, error: null } // réseau transitoire → retry
  }
}
