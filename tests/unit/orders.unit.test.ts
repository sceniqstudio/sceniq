// tests/unit/orders.unit.test.ts
// RED d'abord — tests écrits avant implémentation dans lib/orders/index.ts

import { describe, it, expect } from 'vitest'

// ─── priceForDuration ────────────────────────────────────────────────────────

describe('priceForDuration()', () => {
  it('retourne 6900 pour 5s', async () => {
    const { priceForDuration } = await import('@/lib/orders/index')
    expect(priceForDuration(5)).toBe(6900)
  })

  it('retourne 8900 pour 8s', async () => {
    const { priceForDuration } = await import('@/lib/orders/index')
    expect(priceForDuration(8)).toBe(8900)
  })

  it('retourne 10900 pour 10s', async () => {
    const { priceForDuration } = await import('@/lib/orders/index')
    expect(priceForDuration(10)).toBe(10900)
  })

  it('retourne 12900 pour 12s', async () => {
    const { priceForDuration } = await import('@/lib/orders/index')
    expect(priceForDuration(12)).toBe(12900)
  })

  it('retourne 15900 pour 15s', async () => {
    const { priceForDuration } = await import('@/lib/orders/index')
    expect(priceForDuration(15)).toBe(15900)
  })

  it('lève une erreur pour une durée invalide', async () => {
    const { priceForDuration } = await import('@/lib/orders/index')
    expect(() => priceForDuration(7)).toThrow()
  })
})

// ─── validateOrderInput ──────────────────────────────────────────────────────

describe('validateOrderInput()', () => {
  const validInput = {
    format: '16:9',
    duration: 10,
    brief: 'Vidéo de lancement produit — ton urbain, public 25-40 ans, ville de nuit.',
    client_name: 'Marie Dupont',
    client_email: 'marie@exemple.fr',
    client_phone: '+33 6 12 34 56 78',
    client_company: 'Agence Pixel',
    preferred_call_slot: 'matin',
    ref_paths: ['client-uploads/temp/abc/logo.png'],
  }

  it('valide une commande correcte', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const result = validateOrderInput(validInput)
    expect(result.success).toBe(true)
    expect(result.data?.duration).toBe(10)
  })

  it('rejette un format inconnu', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const result = validateOrderInput({ ...validInput, format: '2:1' })
    expect(result.success).toBe(false)
  })

  it('rejette une durée invalide (7s)', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const result = validateOrderInput({ ...validInput, duration: 7 })
    expect(result.success).toBe(false)
  })

  it('rejette un brief vide', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const result = validateOrderInput({ ...validInput, brief: '' })
    expect(result.success).toBe(false)
  })

  it('rejette un email invalide', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const result = validateOrderInput({ ...validInput, client_email: 'pas-un-email' })
    expect(result.success).toBe(false)
  })

  it('accepte client_company null (optionnel)', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const { client_company: _, ...withoutCompany } = validInput
    const result = validateOrderInput(withoutCompany)
    expect(result.success).toBe(true)
  })

  it('accepte ref_paths vide (refs optionnelles)', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const result = validateOrderInput({ ...validInput, ref_paths: [] })
    expect(result.success).toBe(true)
  })

  it('rejette plus de 10 ref_paths', async () => {
    const { validateOrderInput } = await import('@/lib/orders/index')
    const tooManyRefs = Array.from({ length: 11 }, (_, i) => `ref-${i}.jpg`)
    const result = validateOrderInput({ ...validInput, ref_paths: tooManyRefs })
    expect(result.success).toBe(false)
  })
})
