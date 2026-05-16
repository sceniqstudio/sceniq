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

    // Vérifier que image_url (first ref) a bien été envoyé
    const callBody = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string
    )
    expect(callBody.image_url).toBe('https://brand.com/logo.png')
    // Deuxième ref → dans references[]
    expect(callBody.references).toHaveLength(1)
    expect(callBody.references[0].url).toBe('https://brand.com/mood.jpg')
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
    expect(callBody.audio).toBe(true)
    expect(callBody.resolution).toBe('720p')        // 720p — max des plans Light/Production/Premium BytePlus
    expect(callBody.model).toBe('seedance-2.0')     // Standard, jamais Fast
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
