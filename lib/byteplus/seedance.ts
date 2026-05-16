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

  const refs       = (input.referenceImageUrls ?? []).filter(Boolean).slice(0, 9)
  const durationSec = Math.min(Math.max(parseInt(input.duration) || 5, 4), 15)

  // ── Corps de la requête — format API officiel ModelArk v3 ──
  // Cf. https://docs.byteplus.com/en/docs/ModelArk/1520757
  // content[] regroupe prompt texte + références (images / video / audio).
  // Tous les params hors-content sont au top-level : ratio, duration, resolution, generate_audio, watermark.
  const content: Array<Record<string, unknown>> = [
    { type: 'text', text: input.prompt },
  ]

  // Brand Memory → reference_image scenario (1-9 refs, toutes en role=reference_image)
  for (const url of refs) {
    content.push({
      type:      'image_url',
      image_url: { url },
      role:      'reference_image',
    })
  }

  const body: Record<string, unknown> = {
    model:          DEFAULT_MODEL,
    content,
    generate_audio: true,                          // audio natif (différenciateur clé vs Runway/Kling)
    resolution:     input.resolution  ?? '720p',
    ratio:          input.aspectRatio ?? '16:9',   // attention : API attend `ratio`, pas `aspect_ratio`
    duration:       durationSec,
    watermark:      false,
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
    // L'API officielle ModelArk renvoie `id` (cf. doc 1520757)
    // On garde `task_id` / `job_id` en fallback défensif au cas où certaines régions
    // ou versions de l'API utiliseraient encore l'ancien format.
    jobId = submitData.id ?? submitData.task_id ?? submitData.job_id ?? ''
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
        // L'API peut renvoyer le video_url à plusieurs emplacements selon la version
        const videoUrl: string | null =
          data.content?.video_url ??
          data.video_url ??
          data.output?.video_url ??
          data.result?.video_url ??
          null
        return {
          videoUrl,
          jobId,
          error:    videoUrl ? null : `BytePlus: URL vidéo absente de la réponse succeeded (payload: ${JSON.stringify(data).slice(0, 500)})`,
          provider: 'byteplus',
        }
      }

      // 'expired' = timeout côté ModelArk, 'cancelled' = legacy
      if (status === 'failed' || status === 'cancelled' || status === 'expired') {
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
