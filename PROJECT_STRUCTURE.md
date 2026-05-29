# ScenIQ — Structure du projet (état réel au 29 mai 2026)

> Historique des noms : Scenica → Creatiq → ScenIQ (2026-05-16).
>
> Ce fichier décrit l'arborescence **réelle** du projet. Pour les décisions
> architecturales et ce qui reste à construire, voir CLAUDE.md.

## Structure du projet

```
sceniq/
├── AGENTS.md                          ← Constitution (lire en premier)
├── CLAUDE.md                          ← État du projet + décisions archi
├── ROADMAP.md                         ← V1 / V1.5 / V2
├── PROJECT_STRUCTURE.md               ← Ce fichier
├── package.json
├── tsconfig.json
├── next.config.ts                     ← headers sécurité + domaines images autorisés
├── vitest.config.ts
├── playwright.config.ts               ← globalSetup seed
├── middleware.ts                      ← Clerk v5 — exclut mp4/webm/ogg du matcher
├── .env.local                         ← jamais committé
├── .env.example                       ← committé, toutes les variables documentées
├── .github/
│   └── workflows/ci.yml               ← pipeline complet (unit + contracts + snapshots + E2E)
│
├── scripts/
│   └── push-videos.ts                 ← upload R2 + compression ffmpeg auto (cible 1.6 Mo)
│
├── app/                               ← Next.js App Router
│   ├── layout.tsx                     ← ClerkProvider wrapper
│   ├── page.tsx                       ← Landing (FR + EN via lib/i18n.ts)
│   ├── globals.css
│   │
│   ├── _components/
│   │   ├── Logo.tsx                   ← Mark "toupie" gradient indigo
│   │   └── ShowcaseClip.tsx           ← Vidéo + IntersectionObserver lazy load + iOS-safe play()
│   │
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx   ← Auto signOut() si session zombie
│   │   └── sign-up/[[...sign-up]]/page.tsx   ← Idem fix loop
│   │
│   ├── (app)/                         ← Dashboard admin (whitelist Clerk : uxdesignparis@gmail.com)
│   │   ├── layout.tsx                 ← Sidebar nav + topbar + whitelist email check
│   │   ├── dashboard/
│   │   │   ├── page.tsx               ← Liste projets (GET /api/projects)
│   │   │   ├── brands/
│   │   │   │   ├── page.tsx           ← Liste marques Brand Memory (masquée sidebar V1)
│   │   │   │   └── [id]/page.tsx      ← Édition marque + upload logo + 9 images ref
│   │   │   └── studio/page.tsx        ← Studio admin (Pré-prod IA + Image IA + Vidéo IA)
│   │   └── project/[id]/
│   │       ├── brief/page.tsx         ← Formulaire brief (marques dynamiques + inline create)
│   │       ├── production/page.tsx    ← 4 blocs (Concept, Storyboard, Ambiance, Prompt unifié)
│   │       │                            + upload 6 images ref + CTA "Générer la vidéo"
│   │       │                            + polling génération toutes 5s
│   │       ├── generate/page.tsx      ← Génération scène par scène (ancien pipeline)
│   │       └── export/page.tsx        ← Player vidéo finale + dossier production (5 outputs)
│   │
│   ├── commande/
│   │   ├── page.tsx                   ← Checkout multi-step (format → brief + refs → coords → Stripe)
│   │   └── success/page.tsx           ← Page post-paiement
│   │
│   ├── cgv/page.tsx
│   ├── confidentialite/page.tsx
│   ├── mentions-legales/page.tsx
│   │
│   └── api/
│       ├── projects/
│       │   ├── route.ts               ← GET liste + POST créer
│       │   └── [id]/
│       │       ├── route.ts           ← GET + PATCH + DELETE projet individuel
│       │       └── ref-images/route.ts ← POST upload image ref + DELETE (max 6)
│       │
│       ├── production/
│       │   └── [projectId]/
│       │       ├── route.ts           ← POST → runAllAgents() + GET état complet
│       │       └── agent/[agentId]/route.ts ← POST régénérer + PATCH accepter/modifier
│       │
│       ├── generation/
│       │   ├── [sceneId]/route.ts     ← POST Seedance par scène (BytePlus → fallback fal.ai)
│       │   └── [projectId]/
│       │       └── unified/route.ts   ← POST submitStudioJob + GET checkStudioJob (poll 5s)
│       │
│       ├── brands/
│       │   ├── route.ts               ← GET + POST Brand Memory
│       │   └── [id]/
│       │       ├── route.ts           ← GET + PATCH + DELETE
│       │       └── assets/
│       │           ├── route.ts       ← POST upload asset
│       │           └── [assetId]/route.ts ← DELETE asset + Storage
│       │
│       ├── orders/
│       │   ├── route.ts               ← POST crée order + Stripe Checkout session
│       │   └── upload/route.ts        ← POST upload refs client (client-uploads privé)
│       │
│       ├── credits/route.ts           ← GET balance utilisateur
│       ├── contact/route.ts           ← POST formulaire contact
│       ├── promo/route.ts             ← POST demande promo "50 premiers"
│       │
│       ├── studio/                    ← Admin-only (header x-admin-secret)
│       │   ├── generate-preprod/route.ts  ← POST → Claude 6 blocs pré-prod
│       │   ├── generate-images/route.ts   ← POST → Dreamina Image 5.0 Lite (parallel n=1)
│       │   ├── submit/route.ts            ← POST → Seedance Fast async submit
│       │   ├── status/[jobId]/route.ts    ← GET poll status job vidéo
│       │   ├── image-status/[jobId]/route.ts ← GET poll status job image
│       │   └── debug/route.ts             ← GET test BytePlus brut
│       │
│       └── webhooks/
│           ├── stripe/route.ts        ← invoice.paid + subscription.deleted
│           └── stripe-checkout/route.ts ← checkout.session.completed → order paid + emails
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  ← createSupabaseBrowserClient()
│   │   ├── server.ts                  ← createSupabaseServerClient() + Admin
│   │   ├── types.ts                   ← Database type (généré manuellement depuis migrations)
│   │   └── ensure-user.ts             ← Sync Clerk → Supabase + 10 crédits trial idempotent
│   │
│   ├── claude/agents/
│   │   ├── director.ts                ← DIRECTOR_SYSTEM + runDirector()
│   │   ├── scriptwriter.ts            ← buildScriptwriterPrompt(duration) + runScriptwriter()
│   │   ├── storyboarder.ts            ← buildStoryboarderPrompt() + parseScenes()
│   │   │                                + parseUnifiedPrompt() ← extrait PROMPT_FINAL_UNIFIE
│   │   ├── music-supervisor.ts        ← MUSIC_SUPERVISOR_SYSTEM + runMusicSupervisor()
│   │   ├── visual-director.ts         ← VISUAL_DIRECTOR_SYSTEM + runVisualDirector()
│   │   └── index.ts                   ← runAllAgents() — Promise.allSettled parallèle
│   │
│   ├── byteplus/
│   │   ├── seedance.ts                ← generateClipByteplus() — async polling backoff
│   │   ├── studio.ts                  ← submitStudioJob() + checkStudioJob() — Studio + pipeline unifié
│   │   └── image-gen.ts               ← (legacy) helpers image BytePlus
│   │
│   ├── fal/
│   │   ├── seedance.ts                ← generateClip() — fallback silencieux 720p Pro
│   │   └── image-gen.ts               ← (legacy)
│   │
│   ├── email/
│   │   ├── smtp.ts                    ← transporter SMTP IONOS nodemailer
│   │   ├── sendOrderConfirmation.ts   ← email client post-paiement
│   │   ├── sendOrderNotification.ts   ← email Pascal nouvelle commande
│   │   ├── sendContactMessage.ts      ← email formulaire contact
│   │   └── sendPromoRequest.ts        ← email demande promo "50 premiers"
│   │
│   ├── orders/
│   │   └── index.ts                   ← createOrder() + helpers commande
│   │
│   ├── stripe/
│   │   └── plans.ts                   ← PLANS config
│   │
│   ├── credits/
│   │   └── index.ts                   ← consumeCredit() + getBalance()
│   │
│   ├── showcase.ts                    ← SHOWCASE_VIDEOS (slug+ratio) + showcaseUrl()
│   │                                    CDN R2 (NEXT_PUBLIC_R2_BASE_URL) ou fallback /showcase/
│   │
│   ├── i18n.ts                        ← Traductions FR + EN (landing + FAQ)
│   │
│   └── utils/
│       ├── scenes.ts                  ← idealScenes() + idealShots() (adaptatif 5s=2/8-10s=3/12-15s=4)
│       └── validation.ts              ← validateBrief() + BriefSchema (Zod)
│
├── supabase/
│   └── migrations/
│       ├── 20240101000000_init.sql            ← users
│       ├── 20240101000001_brands.sql          ← brands + brand_assets
│       ├── 20240101000002_projects.sql        ← projects
│       ├── 20240101000003_production.sql      ← agent_outputs
│       ├── 20240101000004_generation.sql      ← scenes + clips
│       ├── 20240101000005_credits.sql         ← credits_ledger
│       ├── 20240101000006_billing.sql         ← subscriptions
│       ├── 20260517000000_agent_outputs_unique.sql  ← unique(project_id, agent)
│       ├── 20260517010000_brand_assets_voice.sql    ← type accepte 'voice'
│       ├── 20260518000000_orders.sql                ← table orders
│       ├── 20260521000000_orders_multicart.sql      ← multicart orders
│       ├── 20260522000000_storage_client_uploads.sql ← bucket client-uploads privé
│       └── 20260528000000_projects_video_fields.sql  ← ref_image_urls + final_video_url + video_job_id
│                                                        (appliquée manuellement via SQL Editor)
│
├── public/
│   ├── showcase/                      ← exemple{1..4}.mp4 en local (reste sur R2)
│   │                                    CDN Cloudflare R2 "sceniq-showcase" : 26+ vidéos
│   └── models/                        ← photos modèles section landing
│
└── tests/
    ├── unit/
    │   ├── scenica.unit.test.ts       ← consumeCredit, parseScenes, validateBrief
    │   ├── seedance.test.ts           ← routing reference vs text-to-video
    │   ├── storyboarder-prompt.test.ts ← contrat system prompt action-focused
    │   └── agents-prompts.test.ts     ← contrats 5 system prompts (sections, anti-patterns)
    ├── integration/
    │   └── contracts/
    │       ├── projects.contract.test.ts
    │       └── brand-memory.contract.test.ts
    ├── snapshots/
    │   └── agents.snapshot.test.ts    ← structure sortie agents (jamais texte verbatim)
    ├── e2e/
    │   └── main.spec.ts               ← parcours brief → export
    └── fixtures/
        ├── data.ts                    ← fixtures déterministes (UUIDs fixes)
        └── seed.ts                    ← seedTestDB()
```

## Modules BDD Supabase

| Module | Tables |
|--------|--------|
| Auth | `users` (clerk_id) |
| Brand Memory | `brands`, `brand_assets` (type: logo/image/video/color/font/voice) |
| Projets | `projects` (brief, format, duration, tone, status, brand_id FK, ref_image_urls, final_video_url, video_job_id) |
| Commandes | `orders` (format, duration, price, brief, client coords, stripe_session_id, status) |
| Production | `agent_outputs` (director/scriptwriter/storyboarder/music/visual) |
| Génération | `scenes`, `clips` |
| Crédits | `credits_ledger`, vue `user_credits` |
| Billing | `subscriptions` (stripe_customer_id, plan, status) |

## Buckets Supabase Storage

| Bucket | Accès | Usage |
|--------|-------|-------|
| `brand-assets` | Public | Logos, images Brand Memory + images ref projets (`projects/[id]/`) |
| `client-uploads` | Privé | Fichiers uploadés par clients lors de commande (signed URLs) |

## CDN Cloudflare R2

| Bucket | Usage |
|--------|-------|
| `sceniq-showcase` | Vidéos showcase landing + hero (NEXT_PUBLIC_R2_BASE_URL) |
