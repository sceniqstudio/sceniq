// lib/fal/seedance.ts
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

/**
 * Génère un clip vidéo via Seedance 2.0 (Pro tier).
 *
 * Routing automatique selon `referenceImageUrls` :
 * - 1 à 4 références → `bytedance/seedance-2.0/reference-to-video` (cohérence visuelle marque)
 * - 0 référence → `bytedance/seedance-2.0/text-to-video` (fallback brief orphelin)
 *
 * Toujours en Pro tier (jamais Fast en prod — voir memory `seedance-model-choice`).
 */
export async function generateClip(input: {
  prompt:              string
  duration:            string
  aspectRatio?:        string
  resolution?:         string
  /** 0 à 4 URLs d'images de référence (logo + mood depuis Brand Memory). Au-delà de 4, tronqué. */
  referenceImageUrls?: string[]
}): Promise<{ videoUrl: string | null; requestId: string; error: string | null }> {
  try {
    const refs = (input.referenceImageUrls ?? []).filter(Boolean).slice(0, 4)
    const useReferences = refs.length > 0

    const endpoint = useReferences
      ? 'bytedance/seedance-2.0/reference-to-video'
      : 'bytedance/seedance-2.0/text-to-video'

    const baseInput: Record<string, unknown> = {
      prompt:         input.prompt,
      duration:       String(Math.min(Math.max(parseInt(input.duration), 4), 15)),
      resolution:     input.resolution  || '720p',
      aspect_ratio:   input.aspectRatio || '16:9',
      generate_audio: true,
    }

    if (useReferences) {
      baseInput.image_urls = refs
    }

    const result = await fal.subscribe(endpoint, {
      input: baseInput,
      logs: false,
    }) as { data: { video: { url: string } }; requestId: string }

    return { videoUrl: result.data?.video?.url ?? null, requestId: result.requestId, error: null }
  } catch (err) {
    return { videoUrl: null, requestId: '', error: (err as Error).message }
  }
}
