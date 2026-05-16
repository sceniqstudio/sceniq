// lib/supabase/client.ts
// Client Supabase pour les composants 'use client' (browser).
// Lit la session Clerk via JWT injecté côté client.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createSupabaseBrowserClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquants dans .env.local',
    )
  }
  return createBrowserClient<Database>(url, anonKey)
}
