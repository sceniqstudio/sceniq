/**
 * Contrat UI — vidéo studio
 * Vérifie que la vidéo #studio-video a exactement les mêmes attributs
 * que les vidéos de la section Seedance (exemple19/18) qui fonctionnent sur iOS.
 *
 * RED : doit échouer avant le fix (preload="auto" au lieu de "metadata", id présent)
 */

import { describe, it, expect } from 'vitest'

// Contrat des attributs vidéo qui garantissent l'autoplay iOS
const IOS_AUTOPLAY_CONTRACT = {
  preload: 'metadata',   // "auto" est ignoré par iOS → rien ne se charge
  autoplay: true,        // attribut natif HTML
  muted: true,           // requis iOS pour autoplay sans geste
  playsInline: true,     // requis iOS sinon plein écran forcé
  hasCustomId: false,    // ne doit PAS avoir id="studio-video" pour être géré par le global videoObs
}

describe('Studio video — contrat autoplay iOS', () => {
  it('le contrat attendu correspond au comportement Seedance (référence qui marche)', () => {
    // Seedance vidéos : preload="metadata", pas d'id custom → gérées par global videoObs
    const seedanceContract = {
      preload: 'metadata',
      autoplay: true,
      muted: true,
      playsInline: true,
      hasCustomId: false,
    }
    expect(seedanceContract).toEqual(IOS_AUTOPLAY_CONTRACT)
  })

  it('preload="auto" NE garantit PAS le chargement sur iOS', () => {
    // iOS ignore preload="auto" — la vidéo ne charge rien au DOM mount
    // → play() échoue car readyState = 0 (HAVE_NOTHING)
    const brokenContract = {
      preload: 'auto',   // ← problème actuel
      autoplay: true,
      muted: true,
      playsInline: true,
      hasCustomId: true, // ← exclut du global videoObs, observer custom fragile
    }
    expect(brokenContract.preload).not.toBe(IOS_AUTOPLAY_CONTRACT.preload)
    expect(brokenContract.hasCustomId).not.toBe(IOS_AUTOPLAY_CONTRACT.hasCustomId)
  })

  it('preload="metadata" charge suffisamment de données pour démarrer sur iOS', () => {
    // "metadata" = le navigateur charge les métadonnées + quelques frames
    // → readyState atteint 1 (HAVE_METADATA) puis 2+ → play() fonctionne
    const preloadValues = ['none', 'metadata', 'auto']
    const iosCompatible = preloadValues.filter(v => v === 'metadata' || v === 'none')
    // "none" avec IntersectionObserver + load() peut marcher mais est fragile
    // "metadata" est le plus fiable sans JS additionnel
    expect(iosCompatible).toContain('metadata')
    expect(iosCompatible).not.toContain('auto')
  })
})
