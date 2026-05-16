'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Watcher monté une fois dans le layout (app).
 * Détecte si l'URL est une page "studio" (Production / Génération)
 * et applique la classe .studio-mode sur le <main id="app-main">.
 *
 * Les surfaces dark sont scopées à <main> pour que la sidebar + le topbar
 * restent dans le thème clair cohérent avec le dashboard.
 */
const STUDIO_PATH = /^\/project\/[^/]+\/(production|generate)$/

export function StudioModeWatcher() {
  const path = usePathname()

  useEffect(() => {
    const main = document.getElementById('app-main')
    if (!main) return
    const isStudio = STUDIO_PATH.test(path)
    main.classList.toggle('studio-mode', isStudio)
  }, [path])

  return null
}
