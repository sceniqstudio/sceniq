// lib/fal/image-gen.ts
// Génération d'images via fal.ai FLUX.1 Schnell
// Pattern async : submit → requestId → poll via checkImageJob()
// Compatible Vercel Hobby (pas de polling serveur-side long)

import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const IMAGE_MODEL = 'fal-ai/flux/schnell'

// Ratio → image_size fal.ai
const RATIO_TO_SIZE: Record<string, string> = {
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
  '4:3':  'landscape_4_3',
  '3:4':  'portrait_4_3',
  '21:9': 'landscape_16_9',  // closest available
  '1:1':  'square',
}

export interface ImageSubmitResult {
  jobId: string
  error: string | null
}

export interface ImageStatusResult {
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  images: string[]
  error:  string | null
}

// ── Submit (retourne immédiatement un jobId = requestId fal.ai) ───────────────
export async function submitImageJob(input: {
  prompt:     string
  ratio:      string
  imageUrls?: string[]  // ignoré — FLUX Schnell ne supporte pas le conditioning image
  numImages?: number
}): Promise<ImageSubmitResult> {
  const falKey = process.env.FAL_KEY
  if (!falKey) return { jobId: '', error: 'FAL_KEY manquant' }

  const image_size  = RATIO_TO_SIZE[input.ratio] ?? 'square'
  const num_images  = Math.min(input.numImages ?? 4, 4)

  try {
    const result = await fal.queue.submit(IMAGE_MODEL, {
      input: {
        prompt:                 input.prompt,
        image_size:             image_size as 'square' | 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9',
        num_images,
        num_inference_steps:    4,
        enable_safety_checker:  false,
      },
    })

    const jobId = (result as { request_id: string }).request_id ?? ''
    if (!jobId) return { jobId: '', error: 'Pas de request_id dans la réponse fal.ai' }
    return { jobId, error: null }
  } catch (e) {
    return { jobId: '', error: (e as Error).message }
  }
}

// ── Check status (un seul appel, pas de boucle) ───────────────────────────────
export async function checkImageJob(jobId: string): Promise<ImageStatusResult> {
  const falKey = process.env.FAL_KEY
  if (!falKey) return { status: 'failed', images: [], error: 'FAL_KEY manquant' }

  try {
    const statusRes = await fal.queue.status(IMAGE_MODEL, {
      requestId: jobId,
      logs:      false,
    }) as { status: string }

    if (statusRes.status === 'COMPLETED') {
      const resultRes = await fal.queue.result(IMAGE_MODEL, { requestId: jobId }) as {
        data?: { images?: { url: string }[] }
        images?: { url: string }[]
      }
      const imgs: string[] =
        resultRes.data?.images?.map(i => i.url) ??
        resultRes.images?.map(i => i.url) ??
        []
      if (imgs.length === 0) return { status: 'failed', images: [], error: 'Aucune image dans la réponse fal.ai' }
      return { status: 'succeeded', images: imgs, error: null }
    }

    if (statusRes.status === 'FAILED') {
      return { status: 'failed', images: [], error: 'Génération fal.ai échouée' }
    }

    // IN_QUEUE | IN_PROGRESS
    return { status: statusRes.status === 'IN_PROGRESS' ? 'processing' : 'pending', images: [], error: null }
  } catch (e) {
    return { status: 'processing', images: [], error: null } // réseau transitoire → retry
  }
}
