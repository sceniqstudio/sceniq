// lib/supabase/server.ts
//
// Deux clients côté serveur :
//
// 1. createSupabaseServerClient() — pour les Server Components et les API routes
//    appelées par un user authentifié. Utilise SERVICE_ROLE_KEY mais on respecte
//    la propriété user_id de la session Clerk (ownership check explicite côté code).
//
// 2. createSupabaseAdminClient() — pour les webhooks (Clerk, Stripe) qui n'ont
//    pas de session user. Utilise SERVICE_ROLE_KEY sans aucun filtrage.

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

function readEnv() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env.local',
    )
  }
  return { url, service }
}

/**
 * Client côté serveur pour les API routes Next.js.
 *
 * À utiliser dans les routes app/api/* où on a déjà fait l'ownership check
 * (par exemple `auth().userId` puis `select where user_id = …`).
 *
 * En V1 on n'utilise pas les policies RLS côté serveur car on a la service_role :
 * c'est aux API routes de filtrer par user_id pour rester safe. Voir CLAUDE.md.
 */
export function createSupabaseServerClient() {
  const { url, service } = readEnv()
  return createClient<Database>(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Client admin pour les webhooks.
 * Identique au serveur mais nom plus parlant à l'appel.
 */
export function createSupabaseAdminClient() {
  return createSupabaseServerClient()
}
