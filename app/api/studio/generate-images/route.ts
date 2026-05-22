// app/api/studio/generate-images/route.ts
// Génère 4 images via fal.ai FLUX.1 Schnell

import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY ?? '' })

type FalImageSize = 'landscape_16_9' | 'portrait_16_9' | 'square_hd'

const RATIO_TO_SIZE: Record<string, FalImageSize> = {
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
  '1:1':  'square_hd',
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { prompt, ratio = '16:9' } = body as { prompt?: string; ratio?: string }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })
  }

  const image_size = RATIO_TO_SIZE[ratio] ?? 'landscape_16_9'

  try {
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt:               prompt.trim(),
        num_images:           4,
        image_size,
        num_inference_steps:  4,
        enable_safety_checker: false,
      },
    }) as { images?: { url: string }[] }

    const images = (result.images ?? []).map(img => img.url)
    return NextResponse.json({ images })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur génération image'
    console.error('[generate-images] fal.ai error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
