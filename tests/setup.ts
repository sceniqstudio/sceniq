// tests/setup.ts
// Fichier de setup global Vitest — chargé avant tous les tests
// Ajouter ici les mocks globaux, les polyfills, et la config d'environnement de test

import { vi } from 'vitest'

// Variables d'environnement de test par défaut
// Les tests individuels peuvent les override dans beforeEach
process.env.NEXT_PUBLIC_SUPABASE_URL    = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY   = 'test-service-role-key'
process.env.FAL_KEY                     = 'test-fal-key'
process.env.ANTHROPIC_API_KEY           = 'test-anthropic-key'
// BytePlus — mis à jour si présent (les tests unit le setted dans beforeEach)
// process.env.BYTEPLUS_API_KEY         = 'test-byteplus-key'
// process.env.BYTEPLUS_BASE_URL        = 'https://ark.test.bytepluses.com/api/v3'
