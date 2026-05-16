// lib/supabase/ensure-user.ts
//
// Sync paresseuse Clerk → Supabase users (V1).
// Appeler depuis chaque API route au début pour garantir que la ligne public.users
// existe avant tout requête liée à un user.
//
// Pourquoi pas un webhook Clerk en V1 ?
// - Le webhook nécessite ngrok ou un URL public pour fonctionner en dev local.
// - La sync paresseuse marche en dev local + en prod sans config supplémentaire.
// - V2 : on ajoutera le webhook officiel + user.deleted handling pour le RGPD.
//
// Idempotent : upsert sur clerk_id (unique). Pas d'erreur si déjà présent.

import { clerkClient } from '@clerk/nextjs/server'
import { createSupabaseServerClient } from './server'

export interface EnsureUserResult {
  /** UUID interne Supabase (à utiliser comme `user_id` partout) */
  userId: string
  /** Indique si la ligne vient d'être créée (utile pour le crédit de trial) */
  created: boolean
}

/**
 * S'assure qu'il existe une ligne `public.users` pour ce Clerk ID.
 * Retourne l'UUID interne Supabase + un flag `created`.
 *
 * @throws si Clerk ne retrouve pas le user (clerkId invalide)
 */
export async function ensureUser(clerkId: string): Promise<EnsureUserResult> {
  const sb = createSupabaseServerClient()

  // 1. Lookup rapide
  const { data: existing } = await sb
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .maybeSingle()

  if (existing?.id) {
    // L'user existe déjà. Vérifier qu'il a bien eu son crédit trial — sinon
    // le lui ajouter rétroactivement (cas des users créés avant que le bonus
    // ne soit activé, ou après un crash).
    await ensureTrialCredit(existing.id)
    return { userId: existing.id, created: false }
  }

  // 2. Pas trouvé → on récupère l'email via Clerk et on insère
  const clerkUser = await clerkClient().users.getUser(clerkId)
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    ''

  if (!email) {
    throw new Error(`ensureUser: pas d'email pour le user Clerk ${clerkId}`)
  }

  const { data: inserted, error } = await sb
    .from('users')
    .insert({ clerk_id: clerkId, email })
    .select('id')
    .single()

  if (error) {
    // Race condition (Postgres 23505 unique violation) : la ligne a été créée
    // entre notre SELECT et notre INSERT. On recharge la ligne existante.
    // Code SQLSTATE 23505 = unique_violation
    const isDuplicate =
      error.code === '23505' ||
      /duplicate key|unique constraint/i.test(error.message ?? '')

    if (isDuplicate) {
      const { data: existingRow } = await sb
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single()
      if (existingRow?.id) {
        return { userId: existingRow.id, created: false }
      }
    }
    throw new Error(`ensureUser: insert failed — ${error.message || 'unknown'}`)
  }

  if (!inserted) {
    throw new Error('ensureUser: insert returned no row')
  }

  // Bonus de bienvenue — 10 crédits gratuits (free trial standard).
  // Permet au user de tester 2-3 vidéos complètes avant abonnement.
  // À ajuster ici si besoin.
  const WELCOME_CREDITS = 10
  await sb.from('credits_ledger').insert({
    user_id: inserted.id,
    delta:   WELCOME_CREDITS,
    reason:  'trial',
  })

  return { userId: inserted.id, created: true }
}

/**
 * Idempotent : ajoute un crédit trial UNIQUEMENT si l'user n'en a pas déjà eu.
 * Sécurise contre les double-crédits si la fonction est appelée plusieurs fois.
 */
async function ensureTrialCredit(userId: string): Promise<void> {
  const sb = createSupabaseServerClient()
  const { data: existing } = await sb
    .from('credits_ledger')
    .select('id')
    .eq('user_id', userId)
    .eq('reason', 'trial')
    .limit(1)
    .maybeSingle()

  if (existing) return // déjà crédité

  await sb.from('credits_ledger').insert({
    user_id: userId,
    delta:   10,
    reason:  'trial',
  })
}
