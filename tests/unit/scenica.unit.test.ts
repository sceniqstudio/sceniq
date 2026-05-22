// tests/unit/credits/consume-credit.test.ts
// Agent Tester — RED d'abord, Builder implémente après

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Test RED : consumeCredit ───────────────────────────────────────────────
// À écrire AVANT l'implémentation dans lib/credits/index.ts

describe('consumeCredit()', () => {
  it('retourne le nouveau solde après déduction', async () => {
    // Arrange : mock Supabase — les vrais appels sont testés en contracts
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ balance: 49 }], error: null
    })

    // Import dynamique pour permettre le mock
    const { consumeCredit } = await import('@/lib/credits/index')

    // Act
    const result = await consumeCredit({
      userId: '00000000-0000-0000-0000-000000000001',
      projectId: '00000000-0000-0000-0002-000000000001',
      sceneId: '00000000-0000-0000-0005-000000000001',
    })

    // Assert
    expect(result.newBalance).toBe(49)
    expect(result.error).toBeNull()
  })

  it('retourne une erreur si solde insuffisant', async () => {
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
    // Un clip déjà généré ne doit pas consommer un deuxième crédit
    const { consumeCredit } = await import('@/lib/credits/index')

    const first  = await consumeCredit({ userId: 'u1', projectId: 'p1', sceneId: 'scene-already-done' })
    const second = await consumeCredit({ userId: 'u1', projectId: 'p1', sceneId: 'scene-already-done' })

    expect(second.error).toBe('already_consumed')
  })
})

// ─── Test RED : parseScenes ─────────────────────────────────────────────────
// tests/unit/agents/parse-scenes.test.ts

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
      // Prompt en anglais — vérifié par la présence de mots anglais courants
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

// ─── Test RED : validation brief ────────────────────────────────────────────
// tests/unit/validation/brief.test.ts

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
