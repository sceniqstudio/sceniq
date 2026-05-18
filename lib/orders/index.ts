// lib/orders/index.ts
// Logique métier orders — validation Zod + grille tarifaire

import { z } from 'zod'
import type { OrderFormat, OrderDuration } from '@/lib/supabase/types'

// ─── Grille tarifaire (en centimes HT) ───────────────────────────────────────

const PRICE_TABLE: Record<OrderDuration, number> = {
  5:  6900,
  8:  8900,
  10: 10900,
  12: 12900,
  15: 15900,
}

export const VALID_DURATIONS: OrderDuration[] = [5, 8, 10, 12, 15]

export const VALID_FORMATS: OrderFormat[] = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']

/**
 * Retourne le prix HT en centimes pour une durée donnée.
 * Lève une erreur si la durée n'est pas dans la grille.
 */
export function priceForDuration(duration: number): number {
  if (!VALID_DURATIONS.includes(duration as OrderDuration)) {
    throw new Error(`Durée invalide : ${duration}. Valeurs acceptées : ${VALID_DURATIONS.join(', ')}`)
  }
  return PRICE_TABLE[duration as OrderDuration]
}

/**
 * Retourne le prix formaté en euros (ex: "109 € HT")
 */
export function formatPrice(centimes: number): string {
  return `${centimes / 100} € HT`
}

// ─── Schéma de validation Zod ─────────────────────────────────────────────────

export const OrderInputSchema = z.object({
  format: z.enum(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] as [OrderFormat, ...OrderFormat[]], {
    errorMap: () => ({ message: 'Format vidéo invalide' }),
  }),
  duration: z.union([
    z.literal(5),
    z.literal(8),
    z.literal(10),
    z.literal(12),
    z.literal(15),
  ], {
    errorMap: () => ({ message: 'Durée invalide. Valeurs acceptées : 5, 8, 10, 12, 15 secondes.' }),
  }),
  brief: z.string()
    .min(10, 'Le brief doit faire au moins 10 caractères')
    .max(1000, 'Le brief ne peut pas dépasser 1000 caractères'),
  client_name: z.string()
    .min(2, 'Nom trop court')
    .max(100, 'Nom trop long'),
  client_email: z.string()
    .email('Email invalide'),
  client_phone: z.string()
    .max(30, 'Numéro trop long')
    .optional()
    .or(z.literal('')),
  client_company: z.string()
    .max(100, 'Nom société trop long')
    .optional()
    .or(z.literal('')),
  preferred_call_slot: z.enum(['matin', 'après-midi', 'soir'])
    .optional(),
  ref_paths: z.array(z.string())
    .max(10, 'Maximum 10 fichiers de référence')
    .default([]),
})

export type OrderInput = z.infer<typeof OrderInputSchema>

/**
 * Valide les données d'entrée d'une commande.
 * Retourne { success: true, data } ou { success: false, error }.
 */
export function validateOrderInput(input: unknown): { success: true; data: OrderInput } | { success: false; error: z.ZodError } {
  const result = OrderInputSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}
