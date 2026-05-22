# ScenIQ — Stack technique complète

> Historique des noms : Scenica → Creatiq → ScenIQ (2026-05-16).
>
> **Note** : ce fichier décrit la structure cible idéale. Pour l'état réel actuel (ce qui est implémenté vs ce qui reste à coder), voir CLAUDE.md section "Ce qui est déjà en place" et "Ce qui reste à construire".

## Structure du projet

```
sceniq/
├── AGENTS.md                          ← Constitution (lire en premier)
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── .env.local                         ← jamais committé
├── .env.example                       ← committé, sans valeurs
│
├── app/                               ← Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                       ← Landing
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   ← Liste projets
│   │   ├── brands/page.tsx            ← Brand Memory
│   │   └── studio/page.tsx            ← Studio admin (Image IA + Vidéo IA + Pré-prod)
│   ├── project/
│   │   └── [id]/
│   │       ├── brief/page.tsx
│   │       ├── production/page.tsx
│   │       ├── generate/page.tsx
│   │       └── export/page.tsx
│   └── api/
│       ├── webhooks/
│       │   └── stripe/route.ts
│       ├── projects/
│       │   ├── route.ts               ← GET /api/projects, POST
│       │   └── [id]/route.ts          ← GET, PATCH, DELETE
│       ├── production/
│       │   └── [projectId]/route.ts   ← POST → appels Claude agents
│       ├── generation/
│       │   └── [sceneId]/route.ts     ← POST → fal.ai Seedance
│       ├── credits/
│       │   └── route.ts               ← GET credits utilisateur
│       └── studio/
│           ├── generate-preprod/
│           │   └── route.ts           ← POST → Claude 6 blocs pré-prod (admin)
│           ├── generate-images/
│           │   └── route.ts           ← POST → Dreamina Image 5.0 Lite, n=1×N parallèle (admin)
│           ├── submit/
│           │   └── route.ts           ← POST → Seedance Fast, async submit (admin)
│           ├── status/
│           │   └── route.ts           ← GET → poll status job vidéo (admin)
│           └── debug/
│               └── route.ts           ← GET → test BytePlus brut sans logique (admin)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  ← createBrowserClient
│   │   ├── server.ts                  ← createServerClient
│   │   └── types.ts                   ← Database type généré
│   ├── claude/
│   │   └── agents/                    ← 5 agents IA implémentés
│   │       ├── director.ts            ← DIRECTOR_SYSTEM + runDirector()
│   │       ├── scriptwriter.ts        ← buildScriptwriterPrompt(duration)
│   │       ├── storyboarder.ts        ← action-focused, parseScenes()
│   │       ├── music-supervisor.ts    ← MUSIC_SUPERVISOR_SYSTEM
│   │       ├── visual-director.ts     ← VISUAL_DIRECTOR_SYSTEM
│   │       └── index.ts               ← runAllAgents() orchestrateur
│   ├── byteplus/
│   │   ├── seedance.ts                ← generateClipByteplus() — async, polling backoff
│   │   ├── image-gen.ts               ← (legacy) helpers image BytePlus
│   │   └── studio.ts                  ← submitStudioJob() + checkStudioJob() — Studio admin
│   ├── fal/
│   │   ├── client.ts                  ← fal.ai SDK wrapper
│   │   ├── seedance.ts                ← generateClip() — fallback silencieux
│   │   └── types.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   ├── plans.ts                   ← PLANS config
│   │   └── webhooks.ts
│   ├── credits/
│   │   └── index.ts                   ← consumeCredit(), getBalance()
│   └── utils/
│       ├── errors.ts
│       └── validation.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 20240101000000_init.sql
│   │   ├── 20240101000001_brands.sql
│   │   ├── 20240101000002_projects.sql
│   │   ├── 20240101000003_production.sql
│   │   ├── 20240101000004_generation.sql
│   │   ├── 20240101000005_credits.sql
│   │   └── 20240101000006_billing.sql
│   └── seed.sql                       ← seed de dev (pas de test)
│
└── tests/
    ├── unit/
    │   ├── credits/
    │   │   └── consume-credit.test.ts
    │   ├── agents/
    │   │   ├── director.test.ts
    │   │   ├── storyboarder.test.ts
    │   │   └── parse-scenes.test.ts
    │   └── validation/
    │       └── brief.test.ts
    ├── integration/
    │   ├── contracts/
    │   │   ├── users.contract.test.ts
    │   │   ├── projects.contract.test.ts
    │   │   ├── credits.contract.test.ts
    │   │   └── brands.contract.test.ts
    │   ├── api/
    │   │   ├── projects.api.test.ts
    │   │   ├── production.api.test.ts
    │   │   └── generation.api.test.ts
    │   ├── cross-module/
    │   │   └── regression.test.ts
    │   ├── perf/
    │   │   └── api.perf.test.ts
    │   └── security/
    │       └── headers.test.ts
    ├── snapshots/
    │   ├── director.snapshot.test.ts
    │   ├── scriptwriter.snapshot.test.ts
    │   ├── storyboarder.snapshot.test.ts
    │   ├── music.snapshot.test.ts
    │   └── visual.snapshot.test.ts
    ├── e2e/
    │   ├── auth.spec.ts
    │   ├── brief.spec.ts
    │   ├── production.spec.ts
    │   ├── generation.spec.ts
    │   └── export.spec.ts
    └── fixtures/
        ├── data.ts                    ← fixtures déterministes
        └── seed.ts                    ← seedTestDB()
```
