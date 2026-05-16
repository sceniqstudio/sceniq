// tests/unit/seedance.test.ts
// Agent Tester — RED qui captures le contrat de routing entre les 2 endpoints Seedance 2.0
// Aligné avec memory `seedance-model-choice` : reference-to-video Pro principal, text-to-video Pro fallback.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@fal-ai/client', () => ({
  fal: {
    config:    vi.fn(),
    subscribe: vi.fn(),
  },
}))

describe('generateClip — routing entre reference-to-video et text-to-video', () => {
  let subscribeMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()   // remet calls/instances à zéro avant chaque test
    vi.resetModules()
    const { fal } = await import('@fal-ai/client')
    subscribeMock = vi.mocked(fal.subscribe)
    subscribeMock.mockResolvedValue({
      data:      { video: { url: 'https://fal.media/clip.mp4' } },
      requestId: 'req_test_123',
    })
  })

  it('utilise text-to-video Pro quand referenceImageUrls est absent', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')
    await generateClip({ prompt: 'test prompt', duration: '8' })

    expect(subscribeMock).toHaveBeenCalledWith(
      'bytedance/seedance-2.0/text-to-video',
      expect.objectContaining({
        input: expect.not.objectContaining({ image_urls: expect.anything() }),
      }),
    )
  })

  it('utilise text-to-video Pro quand referenceImageUrls est un tableau vide', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')
    await generateClip({ prompt: 'test prompt', duration: '8', referenceImageUrls: [] })

    expect(subscribeMock).toHaveBeenCalledWith(
      'bytedance/seedance-2.0/text-to-video',
      expect.anything(),
    )
  })

  it('utilise reference-to-video Pro quand au moins 1 URL de référence est fournie', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')
    await generateClip({
      prompt:              'test prompt',
      duration:            '8',
      referenceImageUrls:  ['https://brand.com/logo.png'],
    })

    expect(subscribeMock).toHaveBeenCalledWith(
      'bytedance/seedance-2.0/reference-to-video',
      expect.objectContaining({
        input: expect.objectContaining({
          image_urls: ['https://brand.com/logo.png'],
        }),
      }),
    )
  })

  it('tronque à 4 URLs max (limite Seedance) si plus de 4 références sont fournies', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')
    await generateClip({
      prompt:              'test prompt',
      duration:            '8',
      referenceImageUrls:  ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'],
    })

    expect(subscribeMock).toHaveBeenCalledWith(
      'bytedance/seedance-2.0/reference-to-video',
      expect.objectContaining({
        input: expect.objectContaining({
          image_urls: ['1.png', '2.png', '3.png', '4.png'],
        }),
      }),
    )
  })

  it('filtre les URLs falsy (null, undefined, chaîne vide) avant routing', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')
    await generateClip({
      prompt:              'test prompt',
      duration:            '8',
      // @ts-expect-error — on teste exprès des valeurs falsy
      referenceImageUrls:  ['valid1.png', '', null, undefined, 'valid2.png'],
    })

    expect(subscribeMock).toHaveBeenCalledWith(
      'bytedance/seedance-2.0/reference-to-video',
      expect.objectContaining({
        input: expect.objectContaining({
          image_urls: ['valid1.png', 'valid2.png'],
        }),
      }),
    )
  })

  it('utilise text-to-video si toutes les URLs sont falsy', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')
    await generateClip({
      prompt:              'test prompt',
      duration:            '8',
      // @ts-expect-error — on teste exprès des valeurs falsy
      referenceImageUrls:  ['', null, undefined],
    })

    expect(subscribeMock).toHaveBeenCalledWith(
      'bytedance/seedance-2.0/text-to-video',
      expect.anything(),
    )
  })

  it('toujours Pro tier — jamais /fast/ (cf memory seedance-model-choice)', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')

    // Sans refs
    await generateClip({ prompt: 'test', duration: '8' })
    expect(subscribeMock.mock.calls[0][0]).not.toMatch(/\/fast\//)

    // Avec refs
    await generateClip({ prompt: 'test', duration: '8', referenceImageUrls: ['ref.png'] })
    expect(subscribeMock.mock.calls[1][0]).not.toMatch(/\/fast\//)
  })

  it('passe duration, aspect_ratio et generate_audio dans tous les cas', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')
    await generateClip({
      prompt:              'test',
      duration:            '10',
      aspectRatio:         '9:16',
      referenceImageUrls:  ['ref.png'],
    })

    expect(subscribeMock).toHaveBeenCalledWith(
      'bytedance/seedance-2.0/reference-to-video',
      expect.objectContaining({
        input: expect.objectContaining({
          duration:       '10',
          aspect_ratio:   '9:16',
          generate_audio: true,
        }),
      }),
    )
  })

  it('clamp la duration entre 4 et 15 (limite Seedance 2.0)', async () => {
    const { generateClip } = await import('@/lib/fal/seedance')

    await generateClip({ prompt: 'test', duration: '2' })  // trop court
    expect(subscribeMock.mock.calls[0][1].input.duration).toBe('4')

    await generateClip({ prompt: 'test', duration: '30' }) // trop long
    expect(subscribeMock.mock.calls[1][1].input.duration).toBe('15')
  })
})
