// lib/byteplus/seedance.ts
/**
 * Provider BytePlus ModelArk — Seedance 2.0 NATIF (provider PRINCIPAL)
 *
 * Remplace fal.ai comme provider de génération vidéo.
 * fal.ai reste actif comme fallback silencieux dans la route de génération.
 *
 * Avantages vs fal.ai :
 *  - 1080p natif (vs 720p max fal.ai)
 *  - Jusqu'à 15s par clip (vs ~10s fal.ai)
 *  - Audio natif généré automatiquement
 *  - Camera motion paramétrique (dolly_in, pan_left, orbit…)
 *  - Source directe ByteDance → features en avant-première
 *  - Coût ~$0.075/s 1080p vs ~$0.30/s fal.ai Pro
 *
 * Docs :
 *  - https://docs.byteplus.com/en/docs/ModelArk/1520757 (API Reference)
 *  - https://docs.byteplus.com/en/docs/ModelArk/1366799 (Video Generation tutorial)
 *
 * ⚠️  TODO Pascal : vérifier le BASE_URL exact dans la console ModelArk après signup.
 *     L'URL ci-dessous est la référence documentée — peut varier selon région.
 *     Variables à ajouter dans .env.local :
 *       BYTEPLUS_API_KEY=your_modelark_api_key
 *       BYTEPLUS_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3  (optionnel, c'est le défaut)
 */

const BYTEPLUS_BASE_URL =
  process.env.BYTEPLUS_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3'

/** Standard — jamais Fast en prod (cohérence positioning premium). Model ID confirmé console BytePlus 2026-05-15. */
const DEFAULT_MODEL = 'dreamina-seedance-2-0-260128'

/** Polling backoff — QPS max = 2 sur BytePlus, on reste large */
const POLL_INITIAL_MS  = 5_000    // 5s initial
const POLL_BACKOFF     = 1.5      // facteur multiplicateur
const POLL_MAX_MS      = 20_000   // 20s cap
const DEFAULT_MAX_WAIT = 300_000  // 5min timeout global

export type ByteplusResult = {
  videoUrl:  string | null
  jobId:     string
  error:     string | null
  provider:  'byteplus'
}

/**
 * Génère un clip vidéo via BytePlus ModelArk Seedance 2.0.
 *
 * Routing automatique selon `referenceImageUrls` :
 * - 0 référence → text-to-video (prompt seul)
 * - 1 référence → image-to-video (image_url + prompt)
 * - 2-9 références → reference-to-video (image_url + references[] pour les suivantes)
 *
 * Pattern async : POST (submit) → job_id → polling GET jusqu'à succeeded/failed.
 */
export async function generateClipByteplus(input: {
  prompt:              string
  duration:            string
  resolution?:         string
  aspectRatio?:        string
  referenceImageUrls?: string[]
  /** @internal — override timeout pour les tests unitaires uniquement */
  _maxWaitMs?:         number
}): Promise<ByteplusResult> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) {
    return {
      videoUrl: null,
      jobId:    '',
      error:    'BYTEPLUS_API_KEY manquant — configurer dans .env.local',
      provider: 'byteplus',
    }
  }

  const refs       = (input.referenceImageUrls ?? []).filter(Boolean)
  const durationSec = Math.min(Math.max(parseInt(input.duration) || 5, 4), 15)

  // ── Corps de la requête ──
  const body: Record<string, unknown> = {
    model:        DEFAULT_MODEL,
    prompt:       input.prompt,
    resolution:   input.resolution  ?? '720p',   // 720p — max des plans Light/Production/Premium BytePlus
    duration:     durationSec,
    aspect_ratio: input.aspectRatio ?? '16:9',
    audio:        true,                           // génération audio native (différenciateur clé vs Runway/Kling)
  }

  // Routing Brand Memory → image-to-video / reference-to-video
  if (refs.length > 0) {
    body.image_url = refs[0]                      // premier asset = frame de référence principal
    if (refs.length > 1) {
      // Assets supplémentaires → references[] (max 9 total selon API BytePlus)
      body.references = refs.slice(1, 9).map((url, i) => ({
        type: 'image',
        role: i === 0 ? 'environment' : 'subject', // alternance subject/environment
        url,
      }))
    }
  }

  // ── 1. Soumettre la tâche ──
  let jobId: string
  try {
    const submitRes = await fetch(
      `${BYTEPLUS_BASE_URL}/contents/generations/tasks`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!submitRes.ok) {
      const errBody = await submitRes.json().catch(() => ({}))
      return {
        videoUrl: null,
        jobId:    '',
        error:    `BytePlus submit error ${submitRes.status}: ${JSON.stringify(errBody)}`,
        provider: 'byteplus',
      }
    }

    const submitData = await submitRes.json()
    // L'API BytePlus peut retourner task_id ou job_id selon la version
    jobId = submitData.task_id ?? submitData.job_id ?? ''
    if (!jobId) {
      return {
        videoUrl: null,
        jobId:    '',
        error:    'BytePlus: identifiant de tâche absent de la réponse',
        provider: 'byteplus',
      }
    }
  } catch (err) {
    return {
      videoUrl: null,
      jobId:    '',
      error:    `BytePlus submit exception: ${(err as Error).message}`,
      provider: 'byteplus',
    }
  }

  // ── 2. Polling avec backoff exponentiel ──
  const maxWait  = input._maxWaitMs ?? DEFAULT_MAX_WAIT
  const start    = Date.now()
  let   interval = POLL_INITIAL_MS

  while (Date.now() - start < maxWait) {
    await sleep(interval)
    interval = Math.min(interval * POLL_BACKOFF, POLL_MAX_MS)

    try {
      const pollRes = await fetch(
        `${BYTEPLUS_BASE_URL}/contents/generations/tasks/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      )

      // 429 → rate limit, on attend le prochain cycle (backoff déjà appliqué)
      if (pollRes.status === 429) continue

      if (!pollRes.ok) {
        const errBody = await pollRes.json().catch(() => ({}))
        return {
          videoUrl: null,
          jobId,
          error:    `BytePlus poll error ${pollRes.status}: ${JSON.stringify(errBody)}`,
          provider: 'byteplus',
        }
      }

      const data   = await pollRes.json()
      const status = (data.status ?? '') as string

      if (status === 'succeeded' || status === 'completed') {
        const videoUrl: string | null =
          data.output?.video_url ??
          data.result?.video_url ??
          null
        return {
          videoUrl,
          jobId,
          error:    videoUrl ? null : 'BytePlus: URL vidéo absente de la réponse succeeded',
          provider: 'byteplus',
        }
      }

      if (status === 'failed' || status === 'cancelled') {
        return {
          videoUrl: null,
          jobId,
          error:    `BytePlus task ${status}: ${JSON.stringify(data.error ?? {})}`,
          provider: 'byteplus',
        }
      }

      // pending / processing → continue
    } catch (pollErr) {
      // Erreur réseau transitoire → on continue le polling (pas d'échec immédiat)
      console.warn('[byteplus/seedance] poll exception, retry in next cycle:', (pollErr as Error).message)
    }
  }

  return {
    videoUrl: null,
    jobId,
    error:    `BytePlus timeout: tâche ${jobId} non terminée après ${maxWait / 1000}s`,
    provider: 'byteplus',
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
