// ─── ScenIQ — Configuration des vidéos showcase ────────────────────────────
//
// Pour mettre à jour les vidéos :
//   1. Uploader le(s) fichier(s) sur Cloudflare R2 bucket "sceniq-showcase"
//   2. Modifier SHOWCASE_VIDEOS ci-dessous
//   3. git add . && git commit -m "feat(showcase): nouvelles vidéos" && git push
//
// Ratio  : largeur / hauteur (ex: 9/16 portrait → 0.5625, 16/9 paysage → 1.777)
// Formats courants :
//   Portrait standard  → ratio: 414/720   ≈ 0.575  (format TikTok/Reels classique)
//   Portrait carré+    → ratio: 720/1280  ≈ 0.5625 (format TikTok plein écran)
//   Paysage 16:9       → ratio: 16/9      ≈ 1.777  (format YouTube/Web)
//
// CDN : Cloudflare R2 (NEXT_PUBLIC_R2_BASE_URL) — fallback /showcase/ en local
// ────────────────────────────────────────────────────────────────────────────

/** Base URL du CDN R2. En local, les fichiers sont servis depuis /public/showcase/ */
const R2_BASE = (process.env.NEXT_PUBLIC_R2_BASE_URL ?? '').replace(/\/$/, '')

/**
 * Retourne l'URL MP4 d'une vidéo showcase.
 * - Prod  : https://pub-xxx.r2.dev/exemple1.mp4 (Cloudflare R2, zéro egress)
 * - Local : /showcase/exemple1.mp4
 */
export function showcaseUrl(slug: string): string {
  if (R2_BASE) return `${R2_BASE}/${slug}.mp4`
  return `/showcase/${slug}.mp4`
}

export type ShowcaseVideo = {
  slug:  string          // nom du fichier sans extension (ex: "exemple1")
  ratio: number          // largeur / hauteur
}

// ── Vidéos du carrousel portfolio (section Réalisations) ───────────────────
export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  { slug: 'exemple1',  ratio: 414/720  },
  { slug: 'exemple2',  ratio: 414/720  },
  { slug: 'exemple3',  ratio: 414/720  },
  { slug: 'exemple4',  ratio: 1/1      },  // ← 1:1 carré (960×960)
  { slug: 'exemple5',  ratio: 414/720  },
  { slug: 'exemple6',  ratio: 414/720  },
  { slug: 'exemple7',  ratio: 414/720  },
  { slug: 'exemple8',  ratio: 414/720  },
  { slug: 'exemple9',  ratio: 414/720  },
  { slug: 'exemple10', ratio: 414/720  },
  { slug: 'exemple11', ratio: 414/720  },
  { slug: 'exemple12', ratio: 414/720  },
  { slug: 'exemple13', ratio: 720/1280 },  // 9:16 portrait
  { slug: 'exemple14', ratio: 414/720  },
  { slug: 'exemple15', ratio: 414/720  },
  { slug: 'exemple16', ratio: 414/720  },
  { slug: 'exemple17', ratio: 414/720  },
  { slug: 'exemple18', ratio: 414/720  },
  { slug: 'exemple19', ratio: 16/9     },  // ← 16:9 paysage
  { slug: 'exemple20', ratio: 720/1280 },
  { slug: 'exemple21', ratio: 720/1280 },
  { slug: 'exemple22', ratio: 720/1280 },
  { slug: 'exemple23', ratio: 1280/720  },  // ← 16:9 paysage
  { slug: 'exemple24', ratio: 834/1112  }, // ← 3:4 portrait
  { slug: 'exemple25', ratio: 834/1112  }, // ← 3:4 portrait
  { slug: 'exemple26', ratio: 834/1112  }, // ← 3:4 portrait
  { slug: 'exemple27', ratio: 576/1024 },  // 9:16 portrait
  { slug: 'exemple28', ratio: 414/720  },  // ratio auto-corrigé au format réel dans le bento
  { slug: 'exemple29', ratio: 720/1280 },  // 9:16 portrait
  { slug: 'exemple30', ratio: 720/1280 },  // 9:16 portrait
]

// ── Slugs pour le hero (colonnes animées) ─────────────────────────────────
// Par défaut on réutilise les mêmes vidéos — peut être surchargé ici
export const HERO_SLUGS: string[] = SHOWCASE_VIDEOS.map(v => v.slug)
