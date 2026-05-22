// lib/byteplus/image-gen.ts
// Dreamina Image 5.0 Lite via BytePlus ModelArk
// Génère N images depuis prompt + références visuelles
// Mode synchrone : submit → poll jusqu'à done (max 45s)

const BASE_URL    = process.env.BYTEPLUS_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3'
const IMAGE_MODEL = 'dreamina-image-5-0-lite'   // À vérifier dans BytePlus console si erreur 404

// Ratio → taille image Dreamina
// Refs : https://www.byteplus.com/en/docs/modelark/vision
const RATIO_TO_SIZE: Record<string, string> = {
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_9_16',
  '4:3':  'landscape_4_3',
  '3:4':  'portrait_3_4',
  '21:9': 'widescreen_21_9',
  '1:1':  'square',
}

export async function generateImagesSync(input: {
  prompt:     string
  ratio:      string       // '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9'
  imageUrls?: string[]     // références visuelles (max 9)
  numImages?: number       // 1-4, défaut 4
}): Promise<{ images: string[]; error: string | null }> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { images: [], error: 'BYTEPLUS_API_KEY manquant' }

  const image_size = RATIO_TO_SIZE[input.ratio] ?? 'square'
  const num_images = Math.min(input.numImages ?? 4, 4)
  const urls       = (input.imageUrls ?? []).slice(0, 9)

  // ── Build content array ──
  const content: Record<string, unknown>[] = [
    { type: 'text', text: input.prompt },
  ]
  for (const url of urls) {
    content.push({ type: 'image_url', image_url: { url }, role: 'reference_image' })
  }

  // ── Submit task ──
  let jobId: string
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
    if (!res.ok) return { images: [], error: `BytePlus image submit ${res.status}: ${JSON.stringify(data)}` }

    jobId = data.id ?? data.task_id ?? data.job_id ?? ''
    if (!jobId) return { images: [], error: 'Pas de job_id dans la réponse BytePlus image' }
  } catch (e) {
    return { images: [], error: (e as Error).message }
  }

  // ── Poll jusqu'à done (max 45s, step 3s) ──
  const maxAttempts = 15
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const res  = await fetch(`${BASE_URL}/contents/generations/tasks/${jobId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (res.status === 429) continue   // rate limit → retry

      const data   = await res.json().catch(() => ({}))
      const status = data.status ?? 'pending'

      if (status === 'succeeded' || status === 'completed') {
        // Dreamina image : content.images[].url ou images[].url
        const imgs: string[] =
          data.content?.images?.map((img: { url: string }) => img.url) ??
          data.images?.map((img: { url: string } | string) => typeof img === 'string' ? img : img.url) ??
          []
        if (imgs.length === 0) return { images: [], error: 'Aucune URL image dans la réponse BytePlus' }
        return { images: imgs, error: null }
      }

      if (['failed', 'expired', 'cancelled'].includes(status)) {
        return { images: [], error: `Tâche image ${status}: ${JSON.stringify(data.error ?? {})}` }
      }
      // pending / processing → on continue
    } catch { /* réseau transitoire → on continue */ }
  }

  return { images: [], error: 'Timeout : génération image > 45s' }
}
