// tests/fixtures/data.ts
// ⚠️ Jamais de Date.now() ou crypto.randomUUID() ici — tout est fixe

export const FIXTURES = {
  users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      clerk_id: 'user_test_agency_001',
      email: 'agency@test.scenica.io',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      clerk_id: 'user_test_studio_001',
      email: 'studio@test.scenica.io',
    },
  ],

  brands: [
    {
      id: '00000000-0000-0000-0001-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Maison Lumière',
    },
  ],

  projects: [
    {
      id: '00000000-0000-0000-0002-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      brand_id: '00000000-0000-0000-0001-000000000001',
      name: 'Spot Printemps 2024',
      brief: 'Spot 30s pour une marque de cosmétiques premium. Ambiance luxe parisien.',
      format: '16:9',
      duration_sec: 30,
      tone: 'Premium',
      status: 'brief',
    },
    {
      id: '00000000-0000-0000-0002-000000000002',
      user_id: '00000000-0000-0000-0000-000000000001',
      brand_id: null,
      name: 'Projet en production',
      brief: 'Campagne LinkedIn B2B, ton corporate, 60 secondes.',
      format: '16:9',
      duration_sec: 60,
      tone: 'Dynamique',
      status: 'production',
    },
  ],

  credits_ledger: [
    {
      id: '00000000-0000-0000-0003-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      delta: 50,
      reason: 'subscription_renewal',
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      user_id: '00000000-0000-0000-0000-000000000002',
      delta: 10,
      reason: 'trial',
    },
  ],

  subscriptions: [
    {
      id: '00000000-0000-0000-0004-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      stripe_customer_id: 'cus_test_agency_001',
      stripe_subscription_id: 'sub_test_agency_001',
      plan: 'agency',
      status: 'active',
    },
    {
      id: '00000000-0000-0000-0004-000000000002',
      user_id: '00000000-0000-0000-0000-000000000002',
      stripe_customer_id: 'cus_test_studio_001',
      stripe_subscription_id: null,
      plan: 'free',
      status: 'active',
    },
  ],
}

// Requêtes de test pour les agents Claude (snapshots)
export const FIXTURE_QUERIES = {
  director:     'Spot 30s cosmétiques premium, ambiance luxe parisien, cible femmes 30-45 CSP+.',
  scriptwriter: 'Spot 30s cosmétiques premium, ambiance luxe parisien, cible femmes 30-45 CSP+.',
  storyboarder: 'Spot 30s cosmétiques premium, ambiance luxe parisien, cible femmes 30-45 CSP+.',
  music:        'Spot 30s cosmétiques premium, ambiance luxe parisien, cible femmes 30-45 CSP+.',
  visual:       'Spot 30s cosmétiques premium, ambiance luxe parisien, cible femmes 30-45 CSP+.',
}
