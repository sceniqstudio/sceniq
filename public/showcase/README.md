# /public/showcase/

Ce dossier contient les vidéos de démonstration affichées dans le carousel de la
landing page (section "Exemples de productions").

## Générer les vidéos

```bash
# Une seule fois, après avoir mis FAL_KEY dans .env.local :
npm run generate:showcase
```

Le script `scripts/generate-showcase.ts` :
- Lit 6 briefs prédéfinis (Café de Flore, MedTech, Maison Lumière, etc.)
- Appelle Seedance 2.0 via fal.ai pour chacun
- Télécharge les MP4 dans ce dossier
- Skip les fichiers déjà présents (sauf si `--all`)

## Options

```bash
# Régénérer tout (écrase l'existant)
npm run generate:showcase -- --all

# Régénérer une seule vidéo
npm run generate:showcase -- --slug=cafe-de-flore
```

## Slugs attendus

```
cafe-de-flore.mp4
medtech-startup.mp4
maison-lumiere.mp4
btp-solutions.mp4
champagne-berthelot.mp4
greentech-mobility.mp4
```

## Fallback gracieux

Si un fichier n'existe pas encore, le composant `ShowcaseClip` retombe
automatiquement sur le placeholder (gradient + emoji) — pas de broken-video icon.

## Coût indicatif (mai 2026)

- Seedance 2.0 Pro 720p audio : ~0,30 €/seconde
- 6 vidéos × 8 secondes = 48 secondes total
- Coût one-shot : **~14-18 €** (moins que prévu si on reste à 8s)
- Les vidéos sont réutilisées indéfiniment → marketing très rentable
