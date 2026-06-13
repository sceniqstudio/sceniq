'use client'

import { useEffect, useRef, useState } from 'react'
import { showcaseUrl } from '@/lib/showcase'

interface ShowcaseClipProps {
  /** Slug du fichier dans /public/showcase/ — ex: 'cafe-de-flore' → /showcase/cafe-de-flore.mp4 */
  slug:           string
  /** Gradient de fallback si la vidéo n'existe pas encore */
  fallbackBg:     string
  /** Emoji décoratif affiché dans le fallback */
  fallbackEmoji:  string
  /** Texte alternatif pour l'accessibilité (lecteurs d'écran) */
  ariaLabel:      string
  /** Remonte le ratio réel de la vidéo (ex: "1280 / 720") dès que les métadonnées sont chargées */
  onAspect?:      (ratio: string) => void
}

// ── Limiteur de concurrence global ─────────────────────────────────────────
// La landing monte ~87 <video> en même temps (hero multi-colonnes + carrousel).
// Si toutes lancent leur fetch simultanément, on sature le pool de connexions
// du navigateur et on déclenche le rate-limit du CDN (catastrophique sur mobile
// et sur l'endpoint r2.dev). On limite donc le nombre de vidéos qui chargent
// EN MÊME TEMPS ; les autres attendent qu'un créneau se libère.
// Le slot se libère dès que la vidéo a ses premières frames (loadeddata) ou
// échoue/temporise — la suite du buffering se fait en arrière-plan.
const MAX_CONCURRENT_LOADS = 4
let activeLoads = 0
const waitQueue: Array<() => void> = []

function acquireLoadSlot(): Promise<void> {
  if (activeLoads < MAX_CONCURRENT_LOADS) {
    activeLoads++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => { activeLoads++; resolve() })
  })
}

function releaseLoadSlot(): void {
  activeLoads = Math.max(0, activeLoads - 1)
  const next = waitQueue.shift()
  if (next) next()
}

/**
 * Vidéo showcase avec lazy loading + limiteur de concurrence + fallback gracieux.
 *
 * Optimisations performance :
 * - **IntersectionObserver** : la vidéo n'entre dans le DOM qu'à l'approche du
 *   viewport (marge 200px). Les vidéos invisibles ne consomment 0 bande passante.
 * - **Limiteur de concurrence** : au plus MAX_CONCURRENT_LOADS fetchs vidéo en
 *   parallèle. Évite le stampede des dizaines de clips de la landing.
 * - **preload="none"** : on contrôle nous-mêmes le déclenchement du chargement.
 * - Fallback gradient si le .mp4 n'existe pas ou échoue.
 *
 * iOS Safari note :
 * - `autoPlay` est ignoré pour les <video> insérées dynamiquement → on appelle
 *   explicitement `.play()` après que le créneau de chargement est obtenu.
 */
export function ShowcaseClip({ slug, fallbackBg, fallbackEmoji, ariaLabel, onAspect }: ShowcaseClipProps) {
  const [videoFailed, setVideoFailed] = useState(false)
  const [shouldLoad, setShouldLoad]   = useState(false)  // entré dans le viewport
  const [canFetch, setCanFetch]       = useState(false)  // créneau de chargement obtenu
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)

  // ── 1. IntersectionObserver : lazy mount ───────────────────────────────────
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
      { rootMargin: '200px 0px', threshold: 0.01 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldLoad])

  // ── 2. Acquisition d'un créneau de chargement (limiteur de concurrence) ─────
  useEffect(() => {
    if (!shouldLoad || canFetch) return
    let cancelled = false
    acquireLoadSlot().then(() => {
      if (cancelled) { releaseLoadSlot(); return }  // démonté avant d'obtenir le slot
      setCanFetch(true)
    })
    return () => { cancelled = true }
  }, [shouldLoad, canFetch])

  // ── 3. Lecture iOS-safe + libération du créneau ─────────────────────────────
  // Le slot se libère dès que la vidéo a ses premières frames (loadeddata), ou
  // en cas d'erreur, ou après un timeout de garde (anti-deadlock si le CDN stalle).
  useEffect(() => {
    if (!canFetch) return
    const vid = videoRef.current
    if (!vid) return

    let released = false
    const release = () => { if (!released) { released = true; releaseLoadSlot() } }

    const onReady = () => {
      release()
      vid.play().catch(() => {})
    }
    const onError = () => { release(); setVideoFailed(true) }

    vid.addEventListener('loadeddata', onReady, { once: true })
    vid.addEventListener('error', onError, { once: true })
    // Garde anti-deadlock : si rien ne se passe en 12s, on libère le créneau
    // pour ne pas bloquer les vidéos suivantes (le buffering continue côté nav).
    const guard = setTimeout(release, 12_000)

    if (vid.readyState >= 2) onReady()  // déjà prête (cache)
    else vid.load()

    return () => {
      clearTimeout(guard)
      vid.removeEventListener('loadeddata', onReady)
      vid.removeEventListener('error', onError)
      release()  // démontage → rendre le créneau
    }
  }, [canFetch])

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
      {canFetch ? (
        <video
          ref={videoRef}
          className="vc-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            if (onAspect && v.videoWidth && v.videoHeight) onAspect(`${v.videoWidth} / ${v.videoHeight}`)
          }}
          onError={() => setVideoFailed(true)}
          aria-label={ariaLabel}
        >
          <source src={showcaseUrl(slug)} type="video/mp4" />
        </video>
      ) : (
        // Placeholder gradient tant que la vidéo attend le viewport / un créneau
        <div
          className="vc-video"
          style={{
            background: fallbackBg,
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
