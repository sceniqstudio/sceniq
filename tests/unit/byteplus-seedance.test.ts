// tests/unit/byteplus-seedance.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch avant tout import
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('generateClipByteplus()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BYTEPLUS_API_KEY = 'test-byteplus-key'
    process.env.BYTEPLUS_BASE_URL = 'https://ark.test.bytepluses.com/api/v3'
    // Reset module cache pour que les env vars soient relues
    vi.resetModules()
  })

  it('retourne videoUrl sur succès (text-to-video)', async () => {
    // Submit → task_id
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: 'task_123', status: 'pending' }),
      })
      // Poll → succeeded
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          task_id: 'task_123',
          status: 'succeeded',
          output: { video_url: 'https://cdn.byteplus.com/video.mp4' },
        }),
      })

    const { generateClipByteplus } = await import('@/lib/byteplus/seedance')
    const result = await generateClipByteplus({
      prompt:    'Test prompt luxe',
      duration:  '8',
      resolution: '1080p',
      _maxWaitMs: 2000,
    })

    expect(result.videoUrl).toBe('https://cdn.byteplus.com/video.mp4')
    expect(result.error).toBeNull()
    expect(result.provider).toBe('byteplus')
    expect(result.jobId).toBe('task_123')
  })

  it('retourne error sur échec HTTP 4xx', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'rate_limit_exceeded' }),
    })

    const { generateClipByteplus } = await import('@/lib/byteplus/seedance')
    const result = await generateClipByteplus({
      prompt:    'Test prompt',
      duration:  '8',
      _maxWaitMs: 500,
    })

    expect(result.videoUrl).toBeNull()
    expect(result.error).toContain('429')
    expect(result.provider).toBe('byteplus')
  })

  it('route image-to-video quand referenceImageUrls fourni', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: 'task_ref_456' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'succeeded',
          output: { video_url: 'https://cdn.byteplus.com/ref-video.mp4' },
        }),
      })

    const { generateClipByteplus } = await import('@/lib/byteplus/seedance')
    const result = await generateClipByteplus({
      prompt:            'Chanel N°5 product shot',
      duration:          '10',
      referenceImageUrls: ['https://brand.com/logo.png', 'https://brand.com/mood.jpg'],
      _maxWaitMs:         2000,
    })

    expect(result.videoUrl).toBeTruthy()

    // Format v3 ModelArk : les références vivent dans content[] (pas en top-level
    // image_url / references[]). content[0] = texte, puis 1 entrée image_url par ref.
    const callBody = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string
    )
    const content = callBody.content as Array<Record<string, unknown>>
    expect(content[0]).toEqual({ type: 'text', text: 'Chanel N°5 product shot' })
    expect(content.slice(1)).toEqual([
      { type: 'image_url', image_url: { url: 'https://brand.com/logo.png' }, role: 'reference_image' },
      { type: 'image_url', image_url: { url: 'https://brand.com/mood.jpg' }, role: 'reference_image' },
    ])
  })

  it('native audio = true par défaut', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: 'task_audio' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'succeeded',
          output: { video_url: 'https://cdn.byteplus.com/audio.mp4' },
        }),
      })

    const { generateClipByteplus } = await import('@/lib/byteplus/seedance')
    await generateClipByteplus({ prompt: 'Test', duration: '5', _maxWaitMs: 2000 })

    const callBody = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string
    )
    expect(callBody.generate_audio).toBe(true)      // format v3 : `generate_audio`, pas `audio`
    expect(callBody.resolution).toBe('720p')        // défaut 720p quand resolution non précisée
    expect(callBody.model).toBe('dreamina-seedance-2-0-260128')  // ID confirmé console BytePlus, Standard jamais Fast
  })

  it('timeout → retourne error après _maxWaitMs', async () => {
    // Submit OK
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ task_id: 'task_slow' }),
    })
    // Toujours en processing
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'processing' }),
    })

    const { generateClipByteplus } = await import('@/lib/byteplus/seedance')
    const result = await generateClipByteplus({
      prompt:    'Test slow',
      duration:  '4',
      _maxWaitMs: 200, // très court pour le test
    })

    expect(result.videoUrl).toBeNull()
    expect(result.error).toContain('timeout')
  }, 10_000)

  it('retourne error si BYTEPLUS_API_KEY absent', async () => {
    delete process.env.BYTEPLUS_API_KEY

    const { generateClipByteplus } = await import('@/lib/byteplus/seedance')
    const result = await generateClipByteplus({ prompt: 'Test', duration: '5' })

    expect(result.videoUrl).toBeNull()
    expect(result.error).toContain('BYTEPLUS_API_KEY')
  })

  it('gère task failed → retourne error immédiatement', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: 'task_fail' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'failed',
          error:  { code: 'CONTENT_VIOLATION', message: 'prompt rejected' },
        }),
      })

    const { generateClipByteplus } = await import('@/lib/byteplus/seedance')
    const result = await generateClipByteplus({
      prompt:    'Test fail',
      duration:  '5',
      _maxWaitMs: 2000,
    })

    expect(result.videoUrl).toBeNull()
    expect(result.error).toContain('failed')
  })
})
