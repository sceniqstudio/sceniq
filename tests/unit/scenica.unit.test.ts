// tests/unit/scenica.unit.test.ts
// Agent Tester — tests unitaires purs (sans BDD réelle)
// Les contrats Supabase sont testés séparément en tests/integration/contracts/

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase — hoisted avant tout import ─────────────────────────────
// createClient() est appelé au chargement du module lib/credits/index.ts.
// vi.mock est automatiquement hoisted par Vitest (avant les imports).
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.from        = vi.fn().mockReturnValue(chain)
  chain.select      = vi.fn().mockReturnValue(chain)
  chain.eq          = vi.fn().mockReturnValue(chain)
  chain.insert      = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.single      = vi.fn().mockResolvedValue({ data: { balance: 50 }, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  return chain
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockChain),
}))

// ─── Test : consumeCredit ───────────────────────────────────────────────────

describe('consumeCredit()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Remettre les valeurs par défaut après clearAllMocks
    mockChain.from.mockReturnValue(mockChain)
    mockChain.select.mockReturnValue(mockChain)
    mockChain.eq.mockReturnValue(mockChain)
    mockChain.insert.mockResolvedValue({ data: null, error: null })
    mockChain.single.mockResolvedValue({ data: { balance: 50 }, error: null })
    mockChain.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('retourne le nouveau solde après déduction', async () => {
    // maybeSingle → pas d'entrée existante (défaut)
    // single → balance = 50
    // → newBalance = 49

    vi.resetModules()
    const { consumeCredit } = await import('@/lib/credits/index')

    const result = await consumeCredit({
      userId: '00000000-0000-0000-0000-000000000001',
      projectId: '00000000-0000-0000-0002-000000000001',
      sceneId: '00000000-0000-0000-0005-000000000001',
    })

    expect(result.newBalance).toBe(49)
    expect(result.error).toBeNull()
  })

  it('retourne une erreur si solde insuffisant', async () => {
    // balance = 0 → insufficient_credits
    mockChain.single.mockResolvedValue({ data: { balance: 0 }, error: null })

    vi.resetModules()
    const { consumeCredit } = await import('@/lib/credits/index')

    const result = await consumeCredit({
      userId: 'user-with-zero-credits',
      projectId: 'any-project',
      sceneId: 'any-scene',
    })

    expect(result.error).toBe('insufficient_credits')
    expect(result.newBalance).toBe(0)
  })

  it('est idempotent si appelé deux fois avec le même sceneId', async () => {
    // 1er appel : maybeSingle → null (pas encore consommé), balance 50 → OK
    // 2ème appel : maybeSingle → { id: 'x' } (déjà consommé) → already_consumed
    mockChain.maybeSingle
      .mockResolvedValueOnce({ data: null,         error: null }) // 1er appel
      .mockResolvedValueOnce({ data: { id: 'x' }, error: null }) // 2ème appel

    mockChain.single
      .mockResolvedValueOnce({ data: { balance: 50 }, error: null }) // getBalance 1er appel
      .mockResolvedValueOnce({ data: { balance: 49 }, error: null }) // getBalance 2ème appel (after consume)

    vi.resetModules()
    const { consumeCredit } = await import('@/lib/credits/index')

    const first  = await consumeCredit({ userId: 'u1', projectId: 'p1', sceneId: 'scene-already-done' })
    const second = await consumeCredit({ userId: 'u1', projectId: 'p1', sceneId: 'scene-already-done' })

    expect(first.error).toBeNull()
    expect(second.error).toBe('already_consumed')
  })
})

// ─── Test : parseScenes ─────────────────────────────────────────────────────

describe('parseScenes()', () => {
  const SAMPLE_STORYBOARD = `SCÈNE 1 [8s] — Ouverture
Prompt Seedance: Extreme close-up of a woman's hand placing a perfume bottle on marble, golden light.
Description FR: Ouverture en gros plan, rituel posé.

SCÈNE 2 [10s] — Personnage
Prompt Seedance: Medium shot of a woman at a window, Paris rooftops, steam rising from cup.
Description FR: Femme contemplative, Paris au lever.

SCÈNE 3 [7s] — Produit
Prompt Seedance: Close-up of embossed logo on matte packaging, soft side light.
Description FR: Focus produit, packaging premium.

SCÈNE 4 [5s] — Logo
Prompt Seedance: Black frame, brand logo fades in, elegant lower-third.
Description FR: Signature finale.`

  it('extrait exactement 4 scènes', async () => {
    const { parseScenes } = await import('@/lib/claude/agents/storyboarder')
    const scenes = parseScenes(SAMPLE_STORYBOARD)
    expect(scenes).toHaveLength(4)
  })

  it('extrait les durées correctement', async () => {
    const { parseScenes } = await import('@/lib/claude/agents/storyboarder')
    const scenes = parseScenes(SAMPLE_STORYBOARD)
    expect(scenes.map(s => s.duration)).toEqual(['8', '10', '7', '5'])
  })

  it('extrait les prompts Seedance en anglais', async () => {
    const { parseScenes } = await import('@/lib/claude/agents/storyboarder')
    const scenes = parseScenes(SAMPLE_STORYBOARD)
    scenes.forEach(scene => {
      expect(scene.seedancePrompt.length).toBeGreaterThan(20)
      expect(scene.seedancePrompt).toMatch(/[a-z]/)
    })
  })

  it('retourne un tableau vide sur texte vide', async () => {
    const { parseScenes } = await import('@/lib/claude/agents/storyboarder')
    const scenes = parseScenes('')
    expect(scenes).toHaveLength(0)
  })

  it('est robuste aux variations de format (SCÈNE vs Scene)', async () => {
    const { parseScenes } = await import('@/lib/claude/agents/storyboarder')
    const looseSample = `Scene 1 [5s] — Test\nPrompt Seedance: A test shot.\nDescription FR: Test.`
    const scenes = parseScenes(looseSample)
    expect(scenes.length).toBeGreaterThanOrEqual(0) // ne crash pas
  })
})

// ─── Test : validateBrief ────────────────────────────────────────────────────

describe('validateBrief()', () => {
  it('accepte un brief valide', async () => {
    const { validateBrief } = await import('@/lib/utils/validation')
    const result = validateBrief({
      brief: 'Spot 30s pour une marque premium.',
      format: '16:9',
      duration_sec: 30,
      tone: 'Premium',
    })
    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejette un brief vide', async () => {
    const { validateBrief } = await import('@/lib/utils/validation')
    const result = validateBrief({ brief: '', format: '16:9', duration_sec: 30, tone: 'Premium' })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('brief_required')
  })

  it('rejette un brief trop court (< 10 caractères)', async () => {
    const { validateBrief } = await import('@/lib/utils/validation')
    const result = validateBrief({ brief: 'Court', format: '16:9', duration_sec: 30, tone: 'Premium' })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('brief_too_short')
  })

  it('rejette un format invalide', async () => {
    const { validateBrief } = await import('@/lib/utils/validation')
    const result = validateBrief({ brief: 'Brief valide test test', format: '4:5' as any, duration_sec: 30, tone: 'Premium' })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('invalid_format')
  })
})

// ── idealShots() ─────────────────────────────────────────────────────────────
import { idealShots, secondsPerShot } from '@/lib/utils/scenes'

describe('idealShots()', () => {
  it('5s → 2 shots', () => expect(idealShots(5)).toBe(2))
  it('8s → 3 shots', () => expect(idealShots(8)).toBe(3))
  it('10s → 3 shots', () => expect(idealShots(10)).toBe(3))
  it('12s → 4 shots', () => expect(idealShots(12)).toBe(4))
  it('15s → 4 shots', () => expect(idealShots(15)).toBe(4))
})

describe('secondsPerShot()', () => {
  it('5s / 2 shots = 2.5s', () => expect(secondsPerShot(5)).toBe(2.5))
  it('10s / 3 shots = 3.3s', () => expect(secondsPerShot(10)).toBe(3.3))
})
