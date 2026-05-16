// tests/integration/contracts/projects.contract.test.ts
// Agent : Agent Tester
// Objectif : vérifier shape des tables + RLS bloque l'accès non-authentifié

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

describe('Contract: projects table', () => {
  it('retourne la shape attendue', async () => {
    const { data, error } = await supabaseService
      .from('projects')
      .select('id, user_id, name, brief, format, duration_sec, tone, status, created_at')
      .limit(1)

    expect(error).toBeNull()
    expect(data![0]).toMatchObject({
      id:           expect.any(String),
      user_id:      expect.any(String),
      name:         expect.any(String),
      brief:        expect.any(String),
      format:       expect.stringMatching(/^(16:9|9:16|1:1|4:3)$/),
      duration_sec: expect.any(Number),
      tone:         expect.any(String),
      status:       expect.stringMatching(/^(brief|production|generation|export|archived)$/),
      created_at:   expect.any(String),
    })
  })

  it('RLS bloque la lecture anonyme', async () => {
    const { data, error } = await supabaseAnon
      .from('projects')
      .select('id')
      .limit(1)

    // RLS doit renvoyer 0 résultats (pas d'erreur — c'est le comportement Supabase)
    expect(data).toHaveLength(0)
  })
})

describe('Contract: credits_ledger', () => {
  it('retourne la shape attendue', async () => {
    const { data, error } = await supabaseService
      .from('credits_ledger')
      .select('id, user_id, delta, reason, created_at')
      .limit(1)

    expect(error).toBeNull()
    expect(data![0]).toMatchObject({
      id:         expect.any(String),
      user_id:    expect.any(String),
      delta:      expect.any(Number),
      reason:     expect.any(String),
      created_at: expect.any(String),
    })
  })

  it('RLS bloque la lecture anonyme', async () => {
    const { data } = await supabaseAnon
      .from('credits_ledger')
      .select('id')
      .limit(1)

    expect(data).toHaveLength(0)
  })
})

describe('Contract: scenes table', () => {
  it('retourne la shape attendue', async () => {
    // Pas de scènes en fixtures par défaut — on vérifie juste la structure de la table
    const { error } = await supabaseService
      .from('scenes')
      .select('id, project_id, scene_index, duration_sec, seedance_prompt, description_fr, status')
      .limit(0)

    expect(error).toBeNull()
  })
})
