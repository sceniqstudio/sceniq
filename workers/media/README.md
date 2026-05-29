# sceniq-media — Worker CDN pour les vidéos R2

Sert les objets du bucket R2 `sceniq-showcase` via l'URL gratuite `*.workers.dev`,
avec **cache edge Cloudflare** et **support des Range requests** (autoplay vidéo iOS).

Remplace l'endpoint public `pub-*.r2.dev` qui est *rate-limited, sans cache CDN et
déconseillé pour la production* par Cloudflare. Aucun changement DNS, aucun coût
(Workers free tier : 100 000 requêtes/jour).

## Déploiement (depuis `workers/media/`)

```bash
cd workers/media

# 1. Auth Cloudflare (une seule fois — ouvre le navigateur)
npx wrangler login

# 2. Déployer
npx wrangler deploy
```

`wrangler deploy` affiche l'URL publique, du type :

```
https://sceniq-media.<ton-sous-domaine>.workers.dev
```

## Après déploiement

1. Tester la vitesse : ouvrir `https://sceniq-media.<...>.workers.dev/exemple1.mp4`
   → doit charger nettement plus vite que l'URL r2.dev.
2. Sur **Vercel → Environment Variables**, remplacer `NEXT_PUBLIC_R2_BASE_URL` par
   l'URL du Worker (sans slash final), pour Production + Preview.
3. **Redeploy** sur Vercel. Le composant `ShowcaseClip` / `showcaseUrl()` servira
   alors toutes les vidéos depuis le Worker (cache edge), plus depuis r2.dev.

## Notes

- Cache `immutable` 1 an : si tu remplaces une vidéo par un fichier de **même nom**,
  purge le cache (Cloudflare → Caching → Purge) ou versionne le nom de fichier.
- Le Worker n'expose qu'en lecture (GET/HEAD) et filtre les extensions média.
- Pour supprimer : `npx wrangler delete` (réversible, ne touche pas au bucket).
