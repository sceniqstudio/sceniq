'use client'

import { useState } from 'react'

interface ShowcaseClipProps {
  /** Slug du fichier dans /public/showcase/ — ex: 'cafe-de-flore' → /showcase/cafe-de-flore.mp4 */
  slug:           string
  /** Gradient de fallback si la vidéo n'existe pas encore */
  fallbackBg:     string
  /** Emoji décoratif affiché dans le fallback */
  fallbackEmoji:  string
  /** Texte alternatif pour l'accessibilité (lecteurs d'écran) */
  ariaLabel:      string
}

/**
 * Vidéo showcase avec fallback gracieux.
 *
 * Si le fichier /showcase/{slug}.mp4 n'existe pas encore (Pascal n'a pas
 * encore lancé `npm run generate:showcase`), on retombe automatiquement
 * sur le placeholder gradient + emoji — aucun broken-video icon.
 *
 * Quand le fichier existe :
 * - autoplay + muted + loop = lecture continue sans interaction
 * - playsInline = pas de fullscreen forcé sur iOS
 * - preload="metadata" = on charge juste la première frame avant lecture
 */
export function ShowcaseClip({ slug, fallbackBg, fallbackEmoji, ariaLabel }: ShowcaseClipProps) {
  const [videoFailed, setVideoFailed] = useState(false)

  if (videoFailed) {
    return (
      <div className="vc-ph" style={{ background: fallbackBg }} aria-label={ariaLabel}>
        <div className="vc-ph-ico" aria-hidden="true">{fallbackEmoji}</div>
        <div className="vc-ph-lbl">Placeholder</div>
      </div>
    )
  }

  return (
    <video
      className="vc-video"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={`/showcase/${slug}.jpg`}
      onError={() => setVideoFailed(true)}
      aria-label={ariaLabel}
    >
      <source src={`/showcase/${slug}.mp4`} type="video/mp4" />
    </video>
  )
}
