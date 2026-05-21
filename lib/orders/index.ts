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

const AI_MODEL_ADDON_CENTS = 4900 // 49 € HT

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

// ─── Schéma cart item ────────────────────────────────────────────────────────

const CartItemSchema = z.object({
  duration: z.union([
    z.literal(5), z.literal(8), z.literal(10), z.literal(12), z.literal(15),
  ], { errorMap: () => ({ message: 'Durée invalide. Valeurs acceptées : 5, 8, 10, 12, 15 secondes.' }) }),
  formats: z.array(
    z.enum(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] as [OrderFormat, ...OrderFormat[]])
  ).min(1, 'Au moins un format requis').max(3, 'Maximum 3 formats par vidéo'),
  qty: z.number().int().min(1).max(20),
  want_ai_model: z.boolean().default(false),
  ai_model_desc: z.string().max(400).optional().nullable(),
})

export type CartItem = z.infer<typeof CartItemSchema>

// ─── Schéma multi-cart (nouveau checkout V1) ─────────────────────────────────

export const MultiCartOrderSchema = z.object({
  language: z.string().max(50).optional(),          // langue voix off (ex: "Français")
  cart_items: z.array(CartItemSchema).min(1, 'Au moins une vidéo requise').max(20),
  total_price: z.number().positive(),               // total en euros (pas centimes, côté client)
  brief: z.string()
    .min(10, 'Le brief doit faire au moins 10 caractères')
    .max(1000, 'Le brief ne peut pas dépasser 1000 caractères'),
  client_name: z.string().min(2, 'Nom trop court').max(100),
  client_email: z.string().email('Email invalide'),
  client_phone: z.string().max(30).optional().nullable().or(z.literal('')),
  client_company: z.string().max(100).optional().nullable().or(z.literal('')),
  preferred_call_slot: z.string().max(100).optional().nullable(),  // texte libre
  ref_paths: z.array(z.string()).max(10, 'Maximum 10 fichiers').default([]),
})

export type MultiCartOrderInput = z.infer<typeof MultiCartOrderSchema>

export function validateMultiCartInput(input: unknown):
  | { success: true; data: MultiCartOrderInput }
  | { success: false; error: z.ZodError }
{
  const result = MultiCartOrderSchema.safeParse(input)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}

/**
 * Calcule le prix total d'un panier en centimes.
 */
export function computeCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const base = priceForDuration(item.duration)
    const addon = item.want_ai_model ? AI_MODEL_ADDON_CENTS : 0
    return sum + (base + addon) * item.qty
  }, 0)
}

/**
 * Retourne une description courte du panier pour Stripe / emails.
 * Ex: "2× 10s (9:16, 1:1) + 1× 5s (9:16)"
 */
export function cartSummaryLine(items: CartItem[]): string {
  return items
    .map(it => `${it.qty > 1 ? `${it.qty}× ` : ''}${it.duration}s (${it.formats.join(', ')})${it.want_ai_model ? ' + comédien IA' : ''}`)
    .join(' · ')
}

// ─── Ancien schéma (mono-vidéo) — conservé pour les tests existants ──────────

export const OrderInputSchema = z.object({
  format: z.enum(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] as [OrderFormat, ...OrderFormat[]], {
    errorMap: () => ({ message: 'Format vidéo invalide' }),
  }),
  duration: z.union([
    z.literal(5), z.literal(8), z.literal(10), z.literal(12), z.literal(15),
  ], { errorMap: () => ({ message: 'Durée invalide.' }) }),
  brief: z.string().min(10).max(1000),
  client_name: z.string().min(2).max(100),
  client_email: z.string().email(),
  client_phone: z.string().max(30).optional().or(z.literal('')),
  client_company: z.string().max(100).optional().or(z.literal('')),
  preferred_call_slot: z.enum(['matin', 'après-midi', 'soir']).optional(),
  ref_paths: z.array(z.string()).max(10).default([]),
})

export type OrderInput = z.infer<typeof OrderInputSchema>

export function validateOrderInput(input: unknown):
  | { success: true; data: OrderInput }
  | { success: false; error: z.ZodError }
{
  const result = OrderInputSchema.safeParse(input)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}
