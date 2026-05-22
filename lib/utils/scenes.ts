// lib/utils/scenes.ts
// Calcul du nombre optimal de scènes pour une vidéo donnée.
// Contrainte Seedance 2.0 : chaque clip = 4 à 15 secondes.

/**
 * Retourne le nombre idéal de scènes pour une durée totale donnée.
 *
 * | Durée | Scènes | Durée/scène |
 * |-------|--------|-------------|
 * | ≤ 15s | 3      | ~5s         |
 * | ≤ 30s | 4      | ~7.5s       |
 * | ≤ 45s | 5      | ~9s         |
 * | ≤ 60s | 6      | ~10s        |
 * | > 60s | min 7  | borné à 8   |
 */
export function idealScenes(durationSec: number): number {
  if (durationSec <= 15) return 3
  if (durationSec <= 30) return 4
  if (durationSec <= 45) return 5
  if (durationSec <= 60) return 6
  return Math.min(8, Math.ceil(durationSec / 10))
}

/**
 * Durée moyenne par scène en secondes (arrondie à 0.5 près).
 */
export function secondsPerScene(durationSec: number): number {
  const n = idealScenes(durationSec)
  return Math.round((durationSec / n) * 2) / 2
}

/**
 * Renvoie une fourchette "min-max" de durée par scène pour l'affichage UX.
 * Ex : "7-8s" pour une vidéo 30s.
 */
export function sceneDurationLabel(durationSec: number): string {
  const avg = secondsPerScene(durationSec)
  const min = Math.max(4, Math.floor(avg))
  const max = Math.min(15, Math.ceil(avg))
  return min === max ? `${min}s` : `${min}-${max}s`
}

// ── Architecture multi-shot (V1 agence services) ─────────────────────────────
// Dans le nouveau pipeline, 1 seul appel API BytePlus génère la vidéo complète
// via un prompt unifié multi-shot. Le nombre de shots est adaptatif selon la durée.
//
// | Durée | Shots |
// |-------|-------|
// | 5s    | 2     |
// | 8-10s | 3     |
// | 12-15s| 4     |

/**
 * Retourne le nombre de shots pour le prompt unifié multi-shot BytePlus.
 * Utilisé par le Storyboarder et la route /api/generation/[projectId]/unified.
 */
export function idealShots(durationSec: number): number {
  if (durationSec <= 5)  return 2
  if (durationSec <= 10) return 3
  return 4 // 12-15s
}

/**
 * Durée approximative par shot en secondes (pour le Storyboarder).
 */
export function secondsPerShot(durationSec: number): number {
  return Math.round((durationSec / idealShots(durationSec)) * 10) / 10
}
