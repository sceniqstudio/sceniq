// lib/byteplus/image-gen.ts
// Dreamina Image 5.0 Lite via BytePlus ModelArk
// Endpoint : POST /api/v3/images/generations (format OpenAI-compatible)
// Réponse synchrone → { data: [{url}] } encodé "DIRECT:url1|url2" dans jobId
// Réponse async     → { id: "task_id" } puis poll GET /images/generations/:id

const BASE_URL    = process.env.BYTEPLUS_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3'
const IMAGE_MODEL = 'seedream-5-0-260128'

export interface ImageSubmitResult {
  jobId: string
  error:  string | null
}

export interface ImageStatusResult {
  status:   'pending' | 'processing' | 'succeeded' | 'failed' | 'expired' | 'cancelled'
  images:   string[]
  error:    string | null
}

// ── Submit ───────────────────────────────────────────────────────────────────
export async function submitImageJob(input: {
  prompt:     string
  ratio:      string
  imageUrls?: string[]
  numImages?: number
}): Promise<ImageSubmitResult> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { jobId: '', error: 'BYTEPLUS_API_KEY manquant' }

  const n         = Math.min(input.numImages ?? 4, 4)
  const imageUrls = (input.imageUrls ?? []).slice(0, 10)

  const body: Record<string, unknown> = {
    model:           IMAGE_MODEL,
    prompt:          input.prompt,
    n,
    size:            input.ratio,   // '16:9' | '1:1' | '9:16' | '4:3' | '3:4' | '21:9'
    quality:         '2K',
    response_format: 'url',
    watermark:       false,
  }

  // Références visuelles
  if (imageUrls.length === 1) {
    body.image = imageUrls[0]
  } else if (imageUrls.length > 1) {
    body.image_urls = imageUrls
  }

  try {
    const res = await fetch(`${BASE_URL}/images/generations`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { jobId: '', error: `BytePlus image submit ${res.status}: ${JSON.stringify(data)}` }
    }

    // ── Cas 1 : réponse synchrone — images dans data[] ──
    if (Array.isArray(data.data) && data.data.length > 0) {
      const urls = (data.data as Array<{ url?: string }>)
        .map(item => item.url)
        .filter(Boolean) as string[]
      if (urls.length > 0) {
        return { jobId: `DIRECT:${urls.join('|')}`, error: null }
      }
    }

    // ── Cas 2 : réponse async — task_id retourné ──
    const jobId = data.id ?? data.task_id ?? data.job_id ?? ''
    if (!jobId) {
      return { jobId: '', error: `Pas de job_id dans la réponse BytePlus image: ${JSON.stringify(data)}` }
    }

    return { jobId, error: null }
  } catch (e) {
    return { jobId: '', error: (e as Error).message }
  }
}

// ── Check status ─────────────────────────────────────────────────────────────
export async function checkImageJob(jobId: string): Promise<ImageStatusResult> {

  // ── Cas DIRECT : images synchrones encodées dans le jobId ──
  if (jobId.startsWith('DIRECT:')) {
    const urls = jobId.slice(7).split('|').filter(Boolean)
    if (urls.length > 0) return { status: 'succeeded', images: urls, error: null }
    return { status: 'failed', images: [], error: 'URLs manquantes dans jobId DIRECT' }
  }

  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { status: 'failed', images: [], error: 'BYTEPLUS_API_KEY manquant' }

  try {
    const res = await fetch(`${BASE_URL}/images/generations/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (res.status === 429) return { status: 'processing', images: [], error: null }

    const data  = await res.json().catch(() => ({}))
    if (!res.ok) return { status: 'failed', images: [], error: `BytePlus image poll ${res.status}: ${JSON.stringify(data)}` }

    const status = data.status ?? 'pending'

    if (status === 'succeeded' || status === 'completed') {
      const imgs: string[] =
        (data.data as Array<{ url?: string }> | undefined)
          ?.map(i => i.url).filter(Boolean) as string[] ??
        data.content?.images?.map((img: { url: string }) => img.url) ??
        []
      if (imgs.length === 0) {
        return { status: 'failed', images: [], error: 'Aucune URL image dans la réponse BytePlus' }
      }
      return { status: 'succeeded', images: imgs, error: null }
    }

    if (['failed', 'expired', 'cancelled'].includes(status)) {
      return { status, images: [], error: `Tâche image ${status}: ${JSON.stringify(data.error ?? {})}` }
    }

    return { status: status as ImageStatusResult['status'], images: [], error: null }
  } catch {
    return { status: 'processing', images: [], error: null }
  }
}
