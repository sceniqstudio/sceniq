'use client'

import { useEffect, useRef, useState } from 'react'

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
 * Vidéo showcase avec lazy loading + fallback gracieux.
 *
 * Optimisations performance :
 * - **IntersectionObserver** : la vidéo n'est ajoutée au DOM qu'au moment où
 *   le composant entre dans le viewport (avec une marge de 200px pour
 *   précharger juste à temps). Les vidéos invisibles ne consomment 0 bande passante.
 * - **preload="none"** côté navigateur — on contrôle nous-mêmes le chargement.
 * - **poster JPG** affiché instantanément avant que la vidéo ne soit dans le viewport.
 * - Fallback gradient si le fichier .mp4 n'existe pas ou échoue.
 *
 * Quand le composant entre dans le viewport :
 * - autoplay + muted + loop = lecture continue sans interaction
 * - playsInline = pas de fullscreen forcé sur iOS
 *
 * iOS Safari note :
 * - `autoPlay` attribute is ignored for dynamically-inserted videos (not in initial HTML).
 * - Fix: explicit `.play()` call in useEffect after mount, with readyState=0 guard.
 */
export function ShowcaseClip({ slug, fallbackBg, fallbackEmoji, ariaLabel }: ShowcaseClipProps) {
  const [videoFailed, setVideoFailed] = useState(false)
  const [shouldLoad, setShouldLoad]   = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)

  // ── 1. IntersectionObserver : lazy mount de la <video> ─────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el || shouldLoad) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
            break
          }
        }
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.01,
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldLoad])

  // ── 2. iOS-safe autoplay : explicit play() après mount ──────────────────────
  // iOS Safari ignore autoPlay sur les éléments insérés dynamiquement.
  // Pattern : readyState=0 → load() → canplay → play()
  useEffect(() => {
    if (!shouldLoad) return
    const vid = videoRef.current
    if (!vid) return

    let cancelled = false

    const doPlay = () => {
      if (!cancelled) vid.play().catch(() => {})
    }

    if (vid.readyState === 0) {
      vid.addEventListener('canplay', doPlay, { once: true })
      vid.load()
    } else if (vid.paused) {
      doPlay()
    }

    return () => {
      cancelled = true
      vid.removeEventListener('canplay', doPlay)
    }
  }, [shouldLoad])

  if (videoFailed) {
    return (
      <div className="vc-ph" style={{ background: fallbackBg }} aria-label={ariaLabel}>
        <div className="vc-ph-ico" aria-hidden="true">{fallbackEmoji}</div>
        <div className="vc-ph-lbl">Placeholder</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {shouldLoad ? (
        <video
          ref={videoRef}
          className="vc-video"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={`/showcase/${slug}.jpg`}
          onError={() => setVideoFailed(true)}
          aria-label={ariaLabel}
        >
          <source src={`/showcase/${slug}.mp4`} type="video/mp4" />
        </video>
      ) : (
        // Placeholder visuel pendant que le composant attend d'être visible
        // — affiche le poster JPG (effet "wow" instantané) avec le gradient en dessous
        <div
          className="vc-video"
          style={{
            backgroundImage: `url(/showcase/${slug}.jpg), ${fallbackBg}`,
            backgroundSize: 'cover, auto',
            backgroundPosition: 'center, center',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundColor: '#1a1a2e',
            width: '100%',
            height: '100%',
          }}
          aria-label={ariaLabel}
        />
      )}
    </div>
  )
}
