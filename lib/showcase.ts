// ─── ScenIQ — Configuration des vidéos showcase ────────────────────────────
//
// Pour mettre à jour les vidéos :
//   1. Copier le(s) fichier(s) dans public/showcase/ (ex: exemple23.mp4 + exemple23.jpg)
//   2. Modifier SHOWCASE_VIDEOS ci-dessous
//   3. git add . && git commit -m "feat(showcase): nouvelles vidéos" && git push
//
// Ratio  : largeur / hauteur (ex: 9/16 portrait → 0.5625, 16/9 paysage → 1.777)
// Formats courants :
//   Portrait standard  → ratio: 414/720   ≈ 0.575  (format TikTok/Reels classique)
//   Portrait carré+    → ratio: 720/1280  ≈ 0.5625 (format TikTok plein écran)
//   Paysage 16:9       → ratio: 16/9      ≈ 1.777  (format YouTube/Web)
// ────────────────────────────────────────────────────────────────────────────

export type ShowcaseVideo = {
  slug:  string          // nom du fichier sans extension (ex: "exemple1")
  ratio: number          // largeur / hauteur
}

// ── Vidéos du carrousel portfolio (section Réalisations) ───────────────────
export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  { slug: 'exemple1',  ratio: 414/720  },
  { slug: 'exemple2',  ratio: 414/720  },
  { slug: 'exemple3',  ratio: 414/720  },
  { slug: 'exemple4',  ratio: 414/720  },
  { slug: 'exemple5',  ratio: 414/720  },
  { slug: 'exemple6',  ratio: 414/720  },
  { slug: 'exemple7',  ratio: 414/720  },
  { slug: 'exemple8',  ratio: 414/720  },
  { slug: 'exemple9',  ratio: 414/720  },
  { slug: 'exemple10', ratio: 414/720  },
  { slug: 'exemple11', ratio: 414/720  },
  { slug: 'exemple12', ratio: 414/720  },
  { slug: 'exemple13', ratio: 414/720  },
  { slug: 'exemple14', ratio: 414/720  },
  { slug: 'exemple15', ratio: 414/720  },
  { slug: 'exemple16', ratio: 414/720  },
  { slug: 'exemple17', ratio: 414/720  },
  { slug: 'exemple18', ratio: 414/720  },
  { slug: 'exemple19', ratio: 16/9     },  // ← 16:9 paysage
  { slug: 'exemple20', ratio: 720/1280 },
  { slug: 'exemple21', ratio: 720/1280 },
  { slug: 'exemple22', ratio: 720/1280 },
  { slug: 'exemple23', ratio: 414/720  },
  { slug: 'exemple24', ratio: 414/720  },
  { slug: 'exemple25', ratio: 414/720  },
]

// ── Slugs pour le hero (colonnes animées) ─────────────────────────────────
// Par défaut on réutilise les mêmes vidéos — peut être surchargé ici
export const HERO_SLUGS: string[] = SHOWCASE_VIDEOS.map(v => v.slug)
