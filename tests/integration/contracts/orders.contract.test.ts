// tests/integration/contracts/orders.contract.test.ts
// Vérifie shape table orders + RLS (service role passe, anon bloqué)

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

const TEST_ORDER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

describe('Contract: orders table', () => {
  it('shape — service role peut insérer et lire une commande', async () => {
    // Cleanup préalable (idempotent)
    await supabaseService.from('orders').delete().eq('id', TEST_ORDER_ID)

    const { error: insertError } = await supabaseService.from('orders').insert({
      id: TEST_ORDER_ID,
      status: 'pending_payment',
      format: '16:9',
      duration: 10,
      price_ht: 10900,
      brief: 'Test brief automatique',
      client_name: 'Tester',
      client_email: 'test@sceniq.studio',
      client_phone: '+33 6 00 00 00 00',
      ref_paths: [],
    })

    expect(insertError).toBeNull()

    const { data, error: selectError } = await supabaseService
      .from('orders')
      .select('id, status, format, duration, price_ht, brief, client_name, client_email, ref_paths, created_at')
      .eq('id', TEST_ORDER_ID)
      .single()

    expect(selectError).toBeNull()
    expect(data).toMatchObject({
      id:         TEST_ORDER_ID,
      status:     'pending_payment',
      format:     '16:9',
      duration:   10,
      price_ht:   10900,
      brief:      'Test brief automatique',
      client_name:'Tester',
      client_email: 'test@sceniq.studio',
      ref_paths:  [],
      created_at: expect.any(String),
    })

    // Cleanup
    await supabaseService.from('orders').delete().eq('id', TEST_ORDER_ID)
  })

  it('RLS — lecture anonyme retourne 0 résultats', async () => {
    const { data } = await supabaseAnon
      .from('orders')
      .select('id')
      .limit(1)

    expect(data).toHaveLength(0)
  })

  it('RLS — insertion anonyme est bloquée', async () => {
    const { error } = await supabaseAnon.from('orders').insert({
      format: '16:9',
      duration: 10,
      price_ht: 10900,
      brief: 'Tentative injection anonyme',
      client_name: 'Hacker',
      client_email: 'hack@evil.com',
    })

    expect(error).not.toBeNull()
  })

  it('contrainte duration — rejette une durée invalide en BDD', async () => {
    const { error } = await supabaseService.from('orders').insert({
      format: '16:9',
      duration: 7, // invalide — pas dans (5,8,10,12,15)
      price_ht: 7000,
      brief: 'Test durée invalide',
      client_name: 'Tester',
      client_email: 'test@sceniq.studio',
    })

    expect(error).not.toBeNull()
    expect(error?.message).toMatch(/check/i)
  })
})
