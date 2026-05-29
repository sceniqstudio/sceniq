// tests/unit/studio-payload.test.ts
// Agent Tester — contrat du payload envoyé à BytePlus par submitStudioJob().
// C'est l'appel API réel du pipeline V1 unifié (route /api/generation/[projectId]/unified).
// On vérifie que BytePlus reçoit BIEN le prompt unifié + les bonnes références + les bons params.
//
// fetch est mocké : on n'appelle jamais l'API réelle, on inspecte uniquement le body construit.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitStudioJob } from '@/lib/byteplus/studio'

const BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'

type Captured = { url: string; init: RequestInit }

function mockFetchOk(responseBody: unknown): { captured: Captured[] } {
  const captured: Captured[] = []
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    captured.push({ url, init })
    return {
      ok:     true,
      status: 200,
      json:   async () => responseBody,
    } as unknown as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return { captured }
}

// Récupère le body JSON parsé du dernier appel fetch capturé
function lastBody(captured: Captured[]): Record<string, unknown> {
  return JSON.parse(captured[captured.length - 1].init.body as string)
}

describe('submitStudioJob — payload BytePlus du pipeline unifié', () => {
  beforeEach(() => {
    process.env.BYTEPLUS_API_KEY = 'test-byteplus-key'
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('envoie le prompt unifié comme premier élément texte de content[]', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt:     'shot one || shot two || shot three',
      duration:   8,
      resolution: '1080p',
      ratio:      '16:9',
      quality:    'standard',
    })

    const body    = lastBody(captured)
    const content = body.content as Record<string, unknown>[]
    expect(content[0]).toEqual({ type: 'text', text: 'shot one || shot two || shot three' })
  })

  it('cible le bon endpoint avec Authorization Bearer et POST', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard',
    })

    const { url, init } = captured[0]
    expect(url).toBe(`${BASE_URL}/contents/generations/tasks`)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-byteplus-key')
  })

  it('passe ratio, duration, generate_audio=true et watermark=false', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt: 'p', duration: 12, resolution: '1080p', ratio: '9:16', quality: 'standard',
    })

    const body = lastBody(captured)
    expect(body.ratio).toBe('9:16')
    expect(body.duration).toBe(12)
    expect(body.generate_audio).toBe(true)
    expect(body.watermark).toBe(false)
  })

  it('ajoute les images de référence en image_url avec role reference_image', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt:    'p',
      duration:  8,
      resolution:'1080p',
      ratio:     '16:9',
      quality:   'standard',
      imageUrls: ['https://cdn/ref1.png', 'https://cdn/ref2.png'],
    })

    const content = lastBody(captured).content as Record<string, unknown>[]
    expect(content.slice(1)).toEqual([
      { type: 'image_url', image_url: { url: 'https://cdn/ref1.png' }, role: 'reference_image' },
      { type: 'image_url', image_url: { url: 'https://cdn/ref2.png' }, role: 'reference_image' },
    ])
  })

  it('OMET resolution quand des références sont présentes (r2v Seedance)', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt:    'p',
      duration:  8,
      resolution:'1080p',
      ratio:     '16:9',
      quality:   'standard',
      imageUrls: ['https://cdn/ref1.png'],
    })

    expect(lastBody(captured)).not.toHaveProperty('resolution')
  })

  it('INCLUT resolution quand aucune référence n\'est fournie (text-to-video)', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard',
    })

    expect(lastBody(captured).resolution).toBe('1080p')
  })

  it('utilise le modèle standard en prod (jamais Fast par défaut)', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard',
    })

    expect(lastBody(captured).model).toBe('dreamina-seedance-2-0-260128')
  })

  it('sélectionne le modèle Fast uniquement si quality=fast explicite', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'fast',
    })

    expect(lastBody(captured).model).toBe('dreamina-seedance-2-0-fast-260128')
  })

  it('tronque à 9 références maximum (limite BytePlus)', async () => {
    const { captured } = mockFetchOk({ id: 'job_abc' })
    const urls = Array.from({ length: 12 }, (_, i) => `https://cdn/ref${i}.png`)
    await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard',
      imageUrls: urls,
    })

    const content = lastBody(captured).content as Record<string, unknown>[]
    // content[0] = texte, le reste = images → 9 images max
    expect(content).toHaveLength(1 + 9)
  })

  it('parse le job id depuis id, task_id ou job_id', async () => {
    let m = mockFetchOk({ id: 'from_id' })
    expect((await submitStudioJob({ prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard' })).jobId).toBe('from_id')
    vi.unstubAllGlobals()

    m = mockFetchOk({ task_id: 'from_task' })
    expect((await submitStudioJob({ prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard' })).jobId).toBe('from_task')
    vi.unstubAllGlobals()

    m = mockFetchOk({ job_id: 'from_job' })
    expect((await submitStudioJob({ prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard' })).jobId).toBe('from_job')
    void m
  })

  it('retourne une erreur si BYTEPLUS_API_KEY manque, sans appeler fetch', async () => {
    delete process.env.BYTEPLUS_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const res = await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard',
    })

    expect(res.error).toMatch(/BYTEPLUS_API_KEY/)
    expect(res.jobId).toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retourne une erreur si la réponse BytePlus ne contient pas de job id', async () => {
    mockFetchOk({ status: 'queued' }) // pas de id/task_id/job_id
    const res = await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard',
    })

    expect(res.jobId).toBe('')
    expect(res.error).toMatch(/job_id/i)
  })

  it('remonte le status HTTP en erreur quand BytePlus répond non-ok', async () => {
    const fetchMock = vi.fn(async () => ({
      ok:     false,
      status: 429,
      json:   async () => ({ message: 'rate limited' }),
    } as unknown as Response))
    vi.stubGlobal('fetch', fetchMock)

    const res = await submitStudioJob({
      prompt: 'p', duration: 8, resolution: '1080p', ratio: '16:9', quality: 'standard',
    })

    expect(res.jobId).toBe('')
    expect(res.error).toMatch(/429/)
  })
})
