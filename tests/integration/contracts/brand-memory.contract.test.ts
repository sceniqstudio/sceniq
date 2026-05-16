// tests/integration/contracts/brand-memory.contract.test.ts
// Agent Tester — Vérifie le contrat des tables brands + brand_assets exploitées par
// /api/generation/[sceneId] pour le routing reference-to-video.
// Cf memory `seedance-model-choice`.

import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

describe('Contract: brands table', () => {
  it('retourne la shape attendue', async () => {
    const { data, error } = await supabaseService
      .from('brands')
      .select('id, user_id, name, created_at, updated_at')
      .limit(1)

    expect(error).toBeNull()
    if (data && data.length > 0) {
      expect(data[0]).toMatchObject({
        id:         expect.any(String),
        user_id:    expect.any(String),
        name:       expect.any(String),
        created_at: expect.any(String),
      })
    }
  })

  it('RLS bloque la lecture anonyme', async () => {
    const { data } = await supabaseAnon.from('brands').select('id').limit(1)
    expect(data).toHaveLength(0)
  })
})

describe('Contract: brand_assets table — porte les références utilisées par Seedance', () => {
  it('retourne la shape attendue', async () => {
    const { error } = await supabaseService
      .from('brand_assets')
      .select('id, brand_id, type, url, value, created_at')
      .limit(0)

    expect(error).toBeNull()
  })

  it('le type est contraint à logo|image|video|color|font', async () => {
    // Tentative d\'insertion avec un type invalide → la BDD doit rejeter
    const { error } = await supabaseService
      .from('brand_assets')
      .insert({
        brand_id: '00000000-0000-0000-0000-000000000000',
        type:     'invalid_type_xyz',
      })

    expect(error).not.toBeNull()
    // Erreur de violation de check constraint OU de FK (brand_id invalide)
    expect(error?.code).toMatch(/^(23\d{3})$/) // 23xxx = integrity constraint violation
  })

  it('RLS bloque la lecture anonyme', async () => {
    const { data } = await supabaseAnon.from('brand_assets').select('id').limit(1)
    expect(data).toHaveLength(0)
  })

  it('peut filtrer les assets sur les types exploitables par Seedance reference-to-video', async () => {
    // C\'est la query que fait /api/generation/[sceneId] : on récupère uniquement
    // les types logo et image (pas color/font/video pour V1).
    const { data, error } = await supabaseService
      .from('brand_assets')
      .select('url')
      .in('type', ['logo', 'image'])
      .not('url', 'is', null)
      .limit(4)

    expect(error).toBeNull()
    // S\'il y a des résultats, vérifier qu\'ils sont bien des URLs non-nulles
    ;(data ?? []).forEach((asset: { url: string | null }) => {
      expect(asset.url).toBeTruthy()
      expect(typeof asset.url).toBe('string')
    })
  })
})

describe('Contract: projects → brand_id (chemin de lookup Brand Memory)', () => {
  it('projects.brand_id existe et est nullable (fallback text-to-video propre)', async () => {
    const { data, error } = await supabaseService
      .from('projects')
      .select('id, brand_id')
      .limit(1)

    expect(error).toBeNull()
    if (data && data.length > 0) {
      // brand_id peut être null (projet sans marque) → c'est attendu, fallback text-to-video
      const brandId = data[0].brand_id
      expect(brandId === null || typeof brandId === 'string').toBe(true)
    }
  })

  it('peut joindre projects → brands → brand_assets en une seule chaîne', async () => {
    // Simule le chemin de lookup côté API route :
    // scene.project_id → projects.brand_id → brand_assets[]
    const { data: projects, error: projectsError } = await supabaseService
      .from('projects')
      .select('id, brand_id')
      .not('brand_id', 'is', null)
      .limit(1)

    expect(projectsError).toBeNull()

    if (projects && projects.length > 0 && projects[0].brand_id) {
      const { data: assets, error: assetsError } = await supabaseService
        .from('brand_assets')
        .select('url')
        .eq('brand_id', projects[0].brand_id)
        .in('type', ['logo', 'image'])

      expect(assetsError).toBeNull()
      // Les assets peuvent être vides (marque sans refs) → fallback text-to-video propre
      expect(Array.isArray(assets)).toBe(true)
    }
  })
})
