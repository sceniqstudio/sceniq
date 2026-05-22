// lib/byteplus/image-gen.ts
// Dreamina Image 5.0 Lite via BytePlus ModelArk
// Pattern async : submit → jobId → poll via checkImageJob()
// Compatible Vercel Hobby (pas de polling serveur-side long)

const BASE_URL    = process.env.BYTEPLUS_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3'
const IMAGE_MODEL = 'dreamina-image-5-0-lite'

// Ratio → taille image Dreamina
const RATIO_TO_SIZE: Record<string, string> = {
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_9_16',
  '4:3':  'landscape_4_3',
  '3:4':  'portrait_3_4',
  '21:9': 'widescreen_21_9',
  '1:1':  'square',
}

export interface ImageSubmitResult {
  jobId: string
  error:  string | null
}

export interface ImageStatusResult {
  status:   'pending' | 'processing' | 'succeeded' | 'failed' | 'expired' | 'cancelled'
  images:   string[]
  error:    string | null
}

// ── Submit (retourne immédiatement un jobId) ─────────────────────────────────
export async function submitImageJob(input: {
  prompt:     string
  ratio:      string
  imageUrls?: string[]
  numImages?: number
}): Promise<ImageSubmitResult> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { jobId: '', error: 'BYTEPLUS_API_KEY manquant' }

  const image_size = RATIO_TO_SIZE[input.ratio] ?? 'square'
  const num_images = Math.min(input.numImages ?? 4, 4)
  const urls       = (input.imageUrls ?? []).slice(0, 9)

  const content: Record<string, unknown>[] = [
    { type: 'text', text: input.prompt },
  ]
  for (const url of urls) {
    content.push({ type: 'image_url', image_url: { url }, role: 'reference_image' })
  }

  try {
    const res = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      IMAGE_MODEL,
        content,
        image_size,
        num_images,
        watermark:  false,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { jobId: '', error: `BytePlus image submit ${res.status}: ${JSON.stringify(data)}` }

    const jobId = data.id ?? data.task_id ?? data.job_id ?? ''
    if (!jobId) return { jobId: '', error: 'Pas de job_id dans la réponse BytePlus image' }

    return { jobId, error: null }
  } catch (e) {
    return { jobId: '', error: (e as Error).message }
  }
}

// ── Check status (un seul appel, pas de boucle) ───────────────────────────────
export async function checkImageJob(jobId: string): Promise<ImageStatusResult> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { status: 'failed', images: [], error: 'BYTEPLUS_API_KEY manquant' }

  try {
    const res = await fetch(`${BASE_URL}/contents/generations/tasks/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (res.status === 429) return { status: 'processing', images: [], error: null }

    const data   = await res.json().catch(() => ({}))
    if (!res.ok)  return { status: 'failed', images: [], error: `BytePlus image poll ${res.status}: ${JSON.stringify(data)}` }

    const status = data.status ?? 'pending'

    if (status === 'succeeded' || status === 'completed') {
      const imgs: string[] =
        data.content?.images?.map((img: { url: string }) => img.url) ??
        data.images?.map((img: { url: string } | string) => typeof img === 'string' ? img : img.url) ??
        []
      if (imgs.length === 0) {
        return { status: 'failed', images: [], error: 'Aucune URL image dans la réponse BytePlus' }
      }
      return { status: 'succeeded', images: imgs, error: null }
    }

    if (['failed', 'expired', 'cancelled'].includes(status)) {
      return { status, images: [], error: `Tâche image ${status}: ${JSON.stringify(data.error ?? {})}` }
    }

    // pending / processing
    return { status: status as ImageStatusResult['status'], images: [], error: null }
  } catch {
    return { status: 'processing', images: [], error: null } // réseau transitoire → retry
  }
}
