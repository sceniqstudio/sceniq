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

### API routes

```
app/api/projects/route.ts                   ✓ GET + POST
app/api/production/[projectId]/route.ts     ✓ POST → runAllAgents() puis persistence
app/api/generation/[sceneId]/route.ts       ✓ POST Seedance — lookup brand_assets, route reference/text
app/api/credits/route.ts                    ✓ GET balance
app/api/webhooks/stripe/route.ts            ✓ invoice.paid + subscription.deleted
```

### Pages UI (app/)

```
app/layout.tsx                                      ✓ ClerkProvider wrapper
app/middleware.ts                                   ✓ Clerk v5 — exclut mp4/webm/ogg du matcher
app/page.tsx                                        ✓ Landing complète (hero split, mission vidéo, why seedance, carousel reels, comment ça marche, agents, pricing, FAQ, CTA final)
app/_components/Logo.tsx                            ✓ Mark "toupie" avec gradient indigo + ombre au sol floutée + rotation -35°
app/_components/ShowcaseClip.tsx                    ✓ Vidéo showcase avec fallback gradient
app/(auth)/sign-in/[[...sign-in]]/page.tsx          ✓ SignIn Clerk
app/(auth)/sign-up/[[...sign-up]]/page.tsx          ✓ SignUp Clerk
app/(app)/dashboard/page.tsx                        ✓
app/(app)/project/[id]/brief/page.tsx               ✓ Brief form avec incitation Brand Memory (badge vert/ambre)
app/(app)/project/[id]/production/page.tsx          ✓
app/(app)/project/[id]/generate/page.tsx            ✓
app/(app)/project/[id]/export/page.tsx              ✓
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

## Ce qui reste à construire — par ordre de priorité

### Priorité 1 — Auth Clerk ✅ Pages créées — config dashboard restante

Les pages auth existent :
```
app/(auth)/sign-in/[[...sign-in]]/page.tsx     ✓ existe
app/(auth)/sign-up/[[...sign-up]]/page.tsx     ✓ existe
```

**Blocker restant** : dans le Clerk Dashboard → User & Authentication → Email, Phone, Username → désactiver "Phone number" (les numéros FR ne sont pas supportés en dev). Auth par email seul suffit pour V1.

### Priorité 2 — Supabase client helpers

```
lib/supabase/client.ts         ← createBrowserClient()
lib/supabase/server.ts         ← createServerClient() pour les Server Components
lib/supabase/types.ts          ← généré par : npm run db:types
```

Pascal doit d'abord créer un projet Supabase (cloud ou local) et renseigner `.env.local` avant que ces helpers soient utilisables.

### Priorité 3 — Stripe client + checkout

```
lib/stripe/client.ts           ← new Stripe(...)
lib/stripe/webhooks.ts         ← constructEvent() helper
app/api/stripe/checkout/route.ts   ← crée une session checkout
app/api/stripe/portal/route.ts     ← portail client (V2 — différer)
```

### Priorité 4 — User sync Clerk → Supabase

```
app/api/webhooks/clerk/route.ts    ← user.created → insert users table
```

### Priorité 5 — Feature voice cloning (V1.5 ou V2)

Différée — permettrait à l'utilisateur d'uploader un échantillon vocal dans Brand Memory et de l'utiliser comme voix-off via ElevenLabs + Seedance image-to-video. Documenté en memory `seedance-model-choice` (Option B).

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
