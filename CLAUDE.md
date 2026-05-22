# CLAUDE.md — ScenIQ

> Ce fichier est lu automatiquement par Claude Cowork à chaque session.
> Ne jamais modifier sans validation de l'Orchestrateur (Pascal).
>
> **Note de naming :** Le projet s'appelle **ScenIQ** (capitalisation mixte "ScenIQ" — pas "Sceniq" ni "SCENIQ"). Historique des renames : Scenica → Creatiq → ScenIQ (2026-05-16). Si tu vois encore "Scenica" ou "Creatiq" dans un fichier (code, BDD, dossier, package name), c'est une référence historique à corriger quand l'occasion se présente, mais jamais en bulk sans validation Pascal.

---

## Contexte projet

**ScenIQ** — SaaS de production vidéo IA pour agences pub.
Brief de 2 lignes → 5 agents IA en parallèle → génération Seedance 2.0 Pro → export pré-prod complète.

Positionnement : "Pas un prompt box, une équipe créa complète."
Cible primaire : agences pub françaises (lip-sync français précis = différenciateur clé vs Runway/Veo).

Stack :
- Next.js 14 App Router · TypeScript strict
- Supabase (BDD + Storage + RLS)
- Clerk (auth)
- Stripe (billing)
- Anthropic Claude API (5 agents)
- fal.ai Seedance 2.0 (génération vidéo)
- Vitest (tests unit/integration) · Playwright (E2E)
- Vercel (déploiement) · GitHub Actions (CI)

---

## Ce que tu fais au démarrage de chaque session

1. Lire ce fichier en entier
2. Lire `AGENTS.md` en entier
3. Regarder l'état du projet : `ls app/ lib/ tests/`
4. Demander à Pascal : "Quelle feature on attaque ?"
5. Appliquer le cycle TDD sans exception

---

## Règles absolues — jamais d'exception

- **Jamais de code sans test RED vu échouer d'abord**
- **Jamais de migration Supabase en dehors de `/supabase/migrations/`**
- **Jamais de E2E sans `npm run seed:test` préalable**
- **Jamais de merge sans CI verte**
- **Jamais de secret en dur dans le code — uniquement `.env.local`**

---

## Cycle par feature — dans cet ordre exact

```
1. Écrire le test RED        → /tests/unit/ ou /tests/integration/
2. Confirmer l'échec         → npm run test:unit (ou test:contracts)
3. Migration si BDD touchée  → /supabase/migrations/TIMESTAMP_nom.sql
                               puis : supabase db push && npm run db:types
4. Implémenter le minimum    → lib/ ou app/api/ ou app/(pages)/
5. Confirmer le GREEN        → npm run test:unit
6. Mettre à jour fixtures    → /tests/fixtures/data.ts si nouveau type de donnée
                               puis : npm run seed:test
7. E2E si parcours affecté   → npm run test:e2e
8. Snapshots si agent IA     → npm run test:snapshots
                               si intentionnel : vitest --updateSnapshot
9. Régression croisée        → npm run test:cross-module
```

**Pascal active manuellement :**
- `supabase db push` après chaque migration
- `npm run seed:test` avant chaque E2E
- `npm run dev` pour voir le résultat dans le browser

---

## Production (22 mai 2026)

- **URL production** : https://sceniq.studio (DNS configuré IONOS 22/05 — propagation en cours, ~1h)
- **URL Vercel** : https://sceniq-ashen.vercel.app (opérationnelle, même déploiement)
- **Repo GitHub** : https://github.com/sceniqstudio/sceniq (public, sur Hobby pour permettre Vercel deploy)
- **Vercel** : projet "sceniq" dans org "sceniq-s-projects" (Hobby tier)
- **Domaine** : sceniq.studio chez IONOS — A `@` → `216.198.79.1`, CNAME `www` → `cname.vercel-dns.com` ✅
- **Supabase** : projet "sceniq" (ref `lawmjbyhqmuxalxqraxz`), eu-west-1, password BDD `fDefSMk3KKyfD29D`
- **Bucket Storage** : `brand-assets` (public, pour servir les URLs à Seedance). Bucket `client-uploads` (privé) — migration SQL créée, `supabase db push` à appliquer.
- **BytePlus** : compte `designbyeak93` (Account ID 3002740570), région Asia Pacific Singapore. Root AK/SK créés (Production+Preview Vercel) pour OmniHuman / Vision AI signature V4.

## ⚠️ PIVOT MAJEUR — 17 mai 2026

**ScenIQ devient une agence services en V1**, pas un SaaS self-service. Pascal vend des vidéos
au forfait fixe par durée (69-159€), pilote toute la chaîne depuis le dashboard admin (seul accès),
livre un MP4 sous 48 h. Le self-service est repoussé en V2 (2027). Voir ROADMAP.md pour le détail.

Conséquences concrètes :
- Plus de signup public sur la landing — CTA unique "Lancer ma vidéo" → page `/commande` (checkout Stripe direct + upload refs)
- Dashboard admin only (Pascal) avec whitelist Clerk (à coder)
- Section Marque (Brand Memory UI) **retirée du sidebar** mais code conservé pour V2
- Refonte agents : **4 blocs** (Concept, Storyboard, Ambiance, Prompt final unifié) au lieu de 5
- Architecture vidéo : **1 appel API BytePlus avec prompt unifié multi-shot** → 1 vidéo finale déjà montée (au lieu de N appels par scène)
- Nombre de shots adaptatif : 5s=2, 8-10s=3, 12-15s=4
- Lip-sync FR retiré des claims (fausse promesse) — vrai pipeline OmniHuman 1.5 en V1.5
- Ton "Je" partout (cohérent avec mascotte guépard)

## Ce qui est déjà en place — ne pas recréer

### Infra & config

```
AGENTS.md                   ✓ constitution des agents
ROADMAP.md                  ✓ V1 vs V2
middleware.ts               ✓ protection routes Clerk
next.config.ts              ✓ headers sécurité + images
tsconfig.json               ✓
package.json                ✓ tous les scripts npm
vitest.config.ts            ✓
playwright.config.ts        ✓ globalSetup seed
.env.example                ✓ toutes les variables documentées
.github/workflows/ci.yml    ✓ pipeline complet

supabase/config.toml        ✓ buckets brand-assets + clips
supabase/migrations/        ✓ 7 migrations (users→brands→projects→production→generation→credits→billing)
```

### Agents IA — 5/5 implémentés (lib/claude/agents/)

```
director.ts          ✓ DIRECTOR_SYSTEM + runDirector() — concept créatif anti-buzzwords
scriptwriter.ts      ✓ buildScriptwriterPrompt(duration) + runScriptwriter() — ratio 2,2 mots/sec
storyboarder.ts      ✓ buildStoryboarderPrompt() + parseScenes() + runStoryboarder()
                       — action-focused prompts (push-in, dolly, ralenti — anti "cinematic")
music-supervisor.ts  ✓ MUSIC_SUPERVISOR_SYSTEM + runMusicSupervisor()
                       — artistes licensables (Ólafur Arnalds, Khruangbin, etc.)
visual-director.ts   ✓ VISUAL_DIRECTOR_SYSTEM + runVisualDirector()
                       — hex codes exigés + Google Fonts + frames @24fps
index.ts             ✓ runAllAgents() — Promise.allSettled, parallélisme résilient
```

Convention : voir memory `agents-convention.md`. Chaque agent a un format de sortie strict avec sections en MAJUSCULES et anti-pattern list explicite.

### lib/ — utilitaires

```
lib/credits/index.ts                ✓ getBalance() + consumeCredit()
lib/byteplus/seedance.ts            ✓ generateClipByteplus() — PROVIDER PRINCIPAL 1080p + audio natif + polling backoff
lib/fal/seedance.ts                 ✓ generateClip() — fallback silencieux 720p Pro tier
lib/utils/validation.ts             ✓ validateBrief() + BriefSchema (Zod)
lib/utils/scenes.ts                 ✓ idealScenes(durationSec) + secondsPerScene()
lib/stripe/plans.ts                 ✓ PLANS config
```

### API routes — toutes câblées sur Supabase + ensureUser()

```
app/api/projects/route.ts                       ✓ GET + POST — liste/crée projets
app/api/production/[projectId]/route.ts         ✓ GET (état) + POST → runAllAgents() persist agent_outputs + scenes
app/api/generation/[sceneId]/route.ts           ✓ POST Seedance — limite 9 refs Brand Memory, BytePlus → fallback fal.ai
app/api/credits/route.ts                        ✓ GET balance
app/api/brands/route.ts                         ✓ GET + POST — Brand Memory CRUD
app/api/brands/[id]/route.ts                    ✓ GET + PATCH + DELETE
app/api/brands/[id]/assets/route.ts             ✓ POST upload (multipart FormData → Supabase Storage)
app/api/brands/[id]/assets/[assetId]/route.ts   ✓ DELETE asset + fichier Storage
app/api/webhooks/stripe/route.ts                ✓ invoice.paid + subscription.deleted
```

### Helpers Supabase

```
lib/supabase/client.ts          ✓ createSupabaseBrowserClient()
lib/supabase/server.ts          ✓ createSupabaseServerClient() + Admin
lib/supabase/types.ts           ✓ Database type (généré manuellement depuis migrations)
lib/supabase/ensure-user.ts     ✓ Sync paresseuse Clerk → Supabase + bonus 10 crédits trial idempotent
```

### Pages UI (app/) — toutes câblées sur les vraies API

```
app/layout.tsx                                      ✓ ClerkProvider wrapper
app/middleware.ts                                   ✓ Clerk v5 — exclut mp4/webm/ogg du matcher
app/page.tsx                                        ✓ Landing avec liens directs /sign-in (plus de modal Clerk buggée)
app/_components/Logo.tsx                            ✓ Mark "toupie" avec gradient indigo
app/_components/ShowcaseClip.tsx                    ✓ Vidéo + IntersectionObserver lazy load + poster JPG
app/(auth)/sign-in/[[...sign-in]]/page.tsx          ✓ Auto signOut() si session zombie (fix loop)
app/(auth)/sign-up/[[...sign-up]]/page.tsx          ✓ Idem fix loop
app/(app)/dashboard/page.tsx                        ✓ GET /api/projects (vraies données)
app/(app)/dashboard/brands/page.tsx                 ✓ Liste marques (Brand Memory)
app/(app)/dashboard/brands/[id]/page.tsx            ✓ Édition + upload logo + 9 images de ref
app/(app)/dashboard/studio/page.tsx                 ✓ Studio admin — Pré-prod IA (6 blocs) + Image IA + Vidéo IA
app/(app)/project/[id]/brief/page.tsx               ✓ Marques dynamiques + inline create + POST /api/projects
app/(app)/project/[id]/production/page.tsx         ✓ Auto-trigger POST /api/production + GET state
app/(app)/project/[id]/generate/page.tsx           ✓ Génération scène par scène via /api/generation/[sceneId]
app/(app)/project/[id]/export/page.tsx             ✓ Player vidéos + dossier de production (5 outputs agents)
```

### Assets showcase

```
public/showcase/   17 reels exemple{1..17}.mp4 + 5agents.mp4 + hero.mp4 + hero1.mp4
                   + 20 posters JPG (~30 KB chacun, instant load)
                   Total 24 MB (compressés depuis 87 MB via ffmpeg CRF 26, 720p)
```

### Tests

```
tests/fixtures/data.ts      ✓ fixtures déterministes (UUIDs fixes)
tests/fixtures/seed.ts      ✓ seedTestDB()
tests/unit/scenica.unit.test.ts            ✓ consumeCredit, parseScenes, validateBrief
tests/unit/seedance.test.ts                ✓ routing reference vs text-to-video (mocked fal client)
tests/unit/storyboarder-prompt.test.ts     ✓ contrat du system prompt action-focused
tests/unit/agents-prompts.test.ts          ✓ contrats des 5 system prompts (sections, anti-patterns)
tests/integration/contracts/projects.contract.test.ts      ✓ shape + RLS
tests/integration/contracts/brand-memory.contract.test.ts  ✓ brands + brand_assets + lookup chain
tests/snapshots/agents.snapshot.test.ts                    ✓ snapshots structure agents Claude
tests/e2e/main.spec.ts                                     ✓ parcours brief → export
```

---

## Ce qui reste à construire (V1 agence services)

### Priorité 1 — Page `/commande` checkout complet (3-4 h dev)

Actuellement : placeholder `app/commande/page.tsx` avec mailto bridge. À remplacer par :
- Migration BDD : table `orders` (id, status, format, duration, price, brief, client coords, stripe_session_id, …)
- Bucket Supabase `client-uploads` (privé, signed URLs)
- Page multi-step (config → brief + upload refs → coordonnées + créneau → Stripe Checkout)
- Route `/api/orders` POST → crée order + session Stripe
- Webhook `/api/webhooks/stripe-checkout` (séparé du webhook subscriptions existant)
- Email post-paiement via SMTP IONOS `support@sceniq.studio` (à setuper)
- Page `/commande/success`

### Priorité 2 — Dashboard projet refondu (admin only, 3-4 h dev)

- Whitelist Clerk email (Pascal seul) — bloquer signup public, rediriger non-autorisés
- Cacher section Marque du sidebar (code conservé pour V2)
- Page Projet refondue selon flow Figma : upload 6 images max renommées Image1/Image2, 3 blocs modifiables (Concept, Storyboard 4 scènes avec voix off/dialogue si demandé, Ambiance No Lyrics), affichage Prompt final unifié copiable, CTA "Générer la vidéo"
- Backend refactor : route generation → **1 seul appel API BytePlus avec prompt unifié multi-shot** (au lieu de N appels par scène) → 1 vidéo finale déjà montée
- `idealShots()` adaptatif : 5s=2 / 8-10s=3 / 12-15s=4

### Priorité 3 — Setup tech Pascal (manuel)

- Créer clé Stripe `sceniq-prod` sur dashboard.stripe.com → `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` Vercel
- Récupérer credentials SMTP IONOS `support@sceniq.studio` → `SMTP_HOST/PORT/USER/PASS/FROM` Vercel
- Remplacer logo SVG par PNG dans Brand Memory existante (filtre code OK mais préfère PNG)

### Priorité 4 — Domaine sceniq.app + Clerk prod (cf SWITCH_PROD.md)

- Pointer DNS IONOS → Vercel (A record + CNAME)
- Créer instance Clerk Production pour sceniq.app
- Update env vars Clerk (pk_live + sk_live)

### V1.5 — OmniHuman 1.5 pour lip-sync FR

Voir ROADMAP.md section V1.5. Bloqueur actuel : trouver doc API précise OmniHuman pour coder le wrapper signature VOLC V4 (~150-200 lignes).

### V2 — Plateforme self-service (2027)

Voir ROADMAP.md. Réactiver Clerk public, Brand Memory UI multi-users, abonnements Stripe (code déjà en place, juste désactivé), job queue, rate limiting, etc.

---

## Commandes disponibles

```bash
npm run dev              # dev server localhost:3000
npm run build            # build prod
npm run typecheck        # TypeScript strict

npm run test:unit        # Vitest — logique pure
npm run test:contracts   # Contrats Supabase + RLS
npm run test:api         # Tests API routes
npm run test:snapshots   # Snapshots agents IA
npm run test:cross-module# Régression croisée
npm run test:perf        # Seuils de performance
npm run test:security    # Headers + auth
npm run test:e2e         # Playwright E2E
npm run test:all         # Pipeline complet

npm run seed:test        # Reset + seed BDD de test (Pascal active manuellement)
npm run db:push          # Appliquer migrations (Pascal active manuellement)
npm run db:types         # Générer types TypeScript depuis schéma Supabase
npm run db:reset         # Reset complet BDD locale
```

---

## Variables d'environnement

Toutes dans `.env.local` (jamais committées).
Modèle dans `.env.example`.
Variables requises listées dans `AGENTS.md`.

---

## Style de code

- TypeScript strict — pas de `any`, pas de `as unknown`
- Zod pour toute validation d'input externe
- Ownership check sur chaque API route (`project.user_id === user.id`)
- `createClient` avec `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur
- Composants React : functional, pas de class components
- Nommage : PascalCase composants, camelCase fonctions, kebab-case fichiers

---

## Modules ScenIQ — schéma BDD

| Module | Tables |
|--------|--------|
| Auth | `users` (clerk_id) |
| Brand Memory | `brands`, `brand_assets` (type: logo/image/video/color/font) |
| Projets | `projects` (brief, format, duration, tone, status, brand_id FK nullable) |
| Production | `agent_outputs` (director/scriptwriter/storyboarder/music/visual) |
| Génération | `scenes`, `clips` |
| Crédits | `credits_ledger`, vue `user_credits` |
| Billing | `subscriptions` (stripe_customer_id, plan, status) |

---

## Décisions architecturales clés (validées par Pascal)

Pour le contexte complet, voir les fichiers de memory dans `~/spaces/.../memory/`.

### Pivot V1 agence services (validée 2026-05-17)

ScenIQ n'est plus un SaaS self-service en V1. C'est une **offre service** où Pascal vend des vidéos
au forfait fixe par durée, et pilote toute la chaîne créative depuis le dashboard admin. Le SaaS
self-service est repoussé en V2 (2027). Voir ROADMAP.md.

Conséquences sur le code :
- Plus de signup public Clerk
- Section Marque retirée du sidebar (code conservé pour V2)
- Tous les CTA pointent vers `/commande` (checkout Stripe direct)
- Dashboard admin only via whitelist email Clerk (à coder)
- Le ton de la landing est **"Je"** partout (cohérent avec future mascotte guépard)

### Architecture vidéo — 1 appel API multi-shot (validée 2026-05-17)

Le pipeline génération vidéo bascule vers **un seul appel API BytePlus** consommant un prompt
**unifié multi-shot**, retournant **une vidéo finale déjà montée par Seedance**. Au lieu de :

```
ANCIEN : 4 scènes → 4 prompts séparés → 4 appels API → 4 mini-clips à assembler
```

```
NOUVEAU : 4 scènes → 1 prompt unifié multi-shot → 1 appel API → 1 vidéo finale complète
```

Avantages : pas de montage post-prod nécessaire, cohérence visuelle des shots, moins coûteux,
moins de timeouts Vercel. Conforme à l'usage officiel de Dreamina.

Nombre de shots **adaptatif selon durée** :
- 5s → 2 shots
- 8s, 10s → 3 shots
- 12s, 15s → 4 shots

Le Storyboarder doit désormais produire **4 scènes individuelles + 1 prompt final unifié** (nouveau
bloc à intégrer). À coder lors de la refonte dashboard Projet.

### Refonte agents — 4 blocs au lieu de 5 (validée 2026-05-17)

L'architecture précédente (5 agents : Director + Scriptwriter + Storyboarder + Music + Visual) est
réduite à **4 blocs visibles** côté UI :

1. **Concept créatif & angle narratif** (= Director)
2. **Storyboard 4 scènes** (= Storyboarder, intègre voix off/dialogue si demandé)
3. **Ambiance sonore (No Lyrics)** (= Music)
4. **Prompt final unifié** (= nouveau bloc qui assemble les 3 précédents en un prompt multi-shot)

Scriptwriter et Visual Director sont **intégrés dans les autres blocs** (script dans Storyboard,
visual dans Concept). Le code backend conserve les 5 agents pour la V2 mais la UI V1 affiche 4 blocs.

### Lip-sync FR retiré des claims (validée 2026-05-17)

Seedance 2.0 supporte officiellement EN/JP/ES/PT/ID — **pas le français explicitement**. Le claim
"Lip-sync précis en français" qui était sur la landing était une survente. Retiré partout.

Pour les voix off françaises de qualité, le vrai pipeline = **OmniHuman 1.5 + audio fourni** (V1.5,
voir ROADMAP). En attendant, Pascal ajoute manuellement une voix off au montage final (sans surcoût
pour le client) — note honnête affichée dans la section "Pourquoi Seedance 2.0".

### Studio admin — Architecture BytePlus (validée 2026-05-22)

**Module Studio** = outil admin-only (ADMIN_SECRET, pas Clerk) pour que Pascal génère images et vidéos directement, indépendamment du pipeline client.

**Image IA — Dreamina Image 5.0 Lite (`seedream-5-0-260128`)**
- Endpoint `/api/v3/images/generations` — **réponse synchrone** (comme DALL-E 3), retourne `{ data: [{ url }] }` directement
- Stratégie : N appels parallèles n=1 via `Promise.allSettled` → retour direct `{ images: string[] }`, sans polling
- Évite le timeout Vercel 10s (≤ 4 appels × ~3s chacun)
- Taille minimum : ≥ 3 686 400 pixels — toutes les résolutions dans `RATIO_TO_SIZE` respectent ce seuil
- Upload refs → Supabase Storage bucket `brand-assets` → URL publique → passée à BytePlus
- Auth : `x-admin-secret` header requis (ADMIN_SECRET env var)

**Vidéo IA — Seedance 2.0 Fast (`dreamina-seedance-2-0-fast-260128`)**
- Endpoint `/api/v3/contents/generations/tasks` — async, polling via `checkStudioJob()`
- **r2v (reference-to-video) : paramètre `resolution` NON supporté par Seedance Fast** → omis entièrement quand des refs sont présentes
- Anti-deepfake BytePlus : les images contenant des personnes réelles sont rejetées (`InputImageSensitiveContentDetected.PrivacyInformation`) — solution : utiliser des refs sans personnes
- `lib/byteplus/studio.ts` : split submit/checkStatus pour éviter timeout Vercel du polling long

**Debug endpoint** : `/api/studio/debug` (GET, admin) — test BytePlus brut sans logique métier, retourne réponse raw.

### Seedance 2.0 — Architecture dual-provider (validée 2026-05-15)

**Provider principal : BytePlus ModelArk** (`lib/byteplus/seedance.ts`)
- Seedance 2.0 Standard natif ByteDance — 1080p, jusqu'à 15s, audio natif, ~$0.075/s
- Routing selon `referenceImageUrls` :
  - 0 ref → text-to-video (prompt seul)
  - 1 ref → image-to-video (`image_url`)
  - 2-9 refs → reference-to-video (`image_url` + `references[]`)
- Pattern async : POST → `task_id` → polling GET avec backoff exponentiel (5s → 20s max)
- QPS max = 2, 429 → continue polling (pas d'échec)

**Fallback silencieux : fal.ai** (`lib/fal/seedance.ts`)
- Activé automatiquement si BytePlus échoue (erreur API, suspension, timeout)
- Seedance 2.0 Pro via fal client — 720p max, jusqu'à 15s
- Log `console.warn('[generation] BytePlus failed → fallback fal.ai: ...')` pour monitoring

**Jamais le tier Fast en prod.** Décision validée le 2026-05-15 — positionnement premium absolu.

**Risque BytePlus** : API suspendue brièvement en mars 2026 pour raisons de copyright → raison d'être du fallback fal.ai. Si BytePlus revient, le primaire reprend automatiquement.

**Colonne BDD** : `clips.fal_job_id` stocke le job ID quel que soit le provider (BytePlus `jobId` ou fal.ai `requestId`). Renommage en `job_id` prévu en V2 via migration.

Voir memory `seedance-model-choice.md`.

### Storyboarder — prompts action-focused

Le system prompt force des descriptions d'**action et de mouvement** (`push-in`, `dolly`, `slow-motion`), pas de descriptifs statiques (`cinematic`, `premium`, `elegant` — interdits). Raison : avec reference-to-video, les images de Brand Memory portent le look. Le prompt ne doit décrire QUE ce qui change dans la scène.

### Brand Memory → Génération

Le pipeline est : `scene → project.brand_id → brand_assets[type IN logo,image] → generateClip(referenceImageUrls)`. Lookup dans `app/api/generation/[sceneId]/route.ts`.

### Convention agents IA

Tous les agents dans `lib/claude/agents/` suivent le même pattern :
- Variante A (statique) : `export const <AGENT>_SYSTEM = \`...\`` + `runAgent()`
- Variante B (dynamique) : `export function build<Agent>Prompt(args)` + `runAgent(args)`
- Tous exportent `{ content: string; error: string | null }`
- Format de sortie strict avec sections en MAJUSCULES
- Anti-buzzwords list explicite dans chaque prompt

Voir memory `agents-convention.md`.

### Brief form V1 — scope verrouillé

Le formulaire de brief reste minimal (Nom, Marque, Brief textuel libre, Ratio, Durée, Ambiance). **Pas de champs structurés supplémentaires en V1** (objectif, public cible, message clé, etc.) — décision validée pour préserver la promesse marketing "Brief en 2 lignes". Voir memory `brief-form-v1-scope.md`.

### Préférences copy de Pascal

Registre **posé** (pas rentre-dedans), termes concrets, anti-AI clichés. Éviter : "premium", "engageant", "cinematic", "iconique", "élégant", "Au cœur de", "Dans le paysage actuel", em dash overuse. Voir memory `copy-preferences.md`.

### Mascotte ScenIQ — Cheetah (validée 2026-05-16)

Mascotte officielle : **guépard 3D CGI style Pixar/Zootopia** — fourrure ambre avec spots noirs, hoodie sombre avec accents indigo, yeux expressifs, fond sombre, rim light violet.
- Images générées : Dreamina Image 5.0 Lite, 2K, ratio 1:1 (4 variantes)
- Clip animé : Dreamina Seedance 2.0 rapide, 4s, image-to-video (depuis variante 3/4)
- Assets stockés dans Dreamina zone de travail (section Vidéos / Images)
- Script voix-off mascotte (178 chars, sous limite Avatar Pro) : "Trois clips vendredi, équipe à l'arrêt ? Donne-moi ton brief. Deux lignes, c'est tout. Cinq agents IA — concept, script, storyboard. Clips 1080p en quatre minutes. C'est ScenIQ."
- Rationale : guépard = rapidité, cohérent avec la promesse "4 minutes"

### Middleware Clerk — règles d'exclusion (validée 2026-05-16)

Le fichier `middleware.ts` était désactivé (`middleware.ts.disabled`) → recréé.
**Règle critique** : le matcher doit exclure `.mp4`, `.webm`, `.ogg` pour que les vidéos showcase ne soient pas protégées par Clerk auth.
Pattern actuel :
```
/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|mp4|webm|ogg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)/
```

---

## Seuils de monitoring (post-déploiement V2)

```
Sentry      : error rate > 1% sur 5min → alerte
Vercel      : Function error rate > 0.5% → notification
Supabase    : quota > 80% → alerte préventive
fal.ai      : failure rate > 5% → alerte
```

---

## Ce que Pascal fait manuellement

Ces actions nécessitent une intervention humaine — Claude ne peut pas les exécuter :

- Remplir `.env.local` avec les vraies clés API
- `supabase start` (Docker requis)
- `supabase db push` après chaque nouvelle migration
- `npm run seed:test` avant de lancer les E2E
- Valider visuellement le résultat dans le browser
- Merger les PRs après CI verte
- Surveiller les logs Vercel 30min après chaque déploiement
