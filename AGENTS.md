# AGENTS.md — ScenIQ
> Constitution du projet. À lire avant toute action. Ne jamais modifier sans validation de l'Orchestrateur.
>
> Historique des noms : Scenica → Creatiq → ScenIQ (2026-05-16). Si tu vois encore "Scenica" ou "Creatiq" dans des fichiers, c'est une référence historique à corriger quand l'occasion se présente.

---

## Projet

**ScenIQ** — SaaS de production vidéo IA pour agences pub.  
Stack : Next.js 14 (App Router) · Supabase · Vercel · Clerk (auth) · Stripe (paiement) · Claude API · fal.ai (Seedance 2.0 Pro tier)  
Langage : TypeScript strict  
Tests : Vitest (unit/integration) · Playwright (E2E)  
CI : GitHub Actions

---

## Rôles des agents — UN AGENT = UN RÔLE. JAMAIS DE CROISEMENT.

```
ORCHESTRATEUR (humain)
├── Agent Tester     → écrit le test RED, confirme l'échec, vérifie le GREEN final
├── Agent Builder    → implémente uniquement sur RED confirmé par Agent Tester
├── Agent Migration  → propriétaire exclusif des migrations Supabase
├── Agent Seed       → propriétaire exclusif des fixtures /tests/fixtures/
├── Agent QA         → E2E Playwright sur parcours utilisateur affectés
├── Agent Debug      → bug qui résiste après 2 cycles RED/GREEN
├── Agent Review     → code review avant chaque merge
└── Agent Monitoring → surveillance 30min post-déploiement Vercel
```

**Règle absolue : aucune production code sans test RED vu échouer.**

---

## Modules ScenIQ

| Module | Description | Tables Supabase |
|--------|-------------|-----------------|
| `auth` | Inscription, login, session (Clerk) | `users` |
| `brands` | Brand Memory — assets par marque (logo/image alimentent reference-to-video) | `brands`, `brand_assets` |
| `projects` | Projets vidéo (brief, params, brand_id FK) | `projects` |
| `production` | Appels Claude agents (5 agents via `runAllAgents()`) | `agent_outputs` |
| `generation` | Appels fal.ai Seedance 2.0 Pro — routing reference-to-video ↔ text-to-video | `scenes`, `clips` |
| `credits` | Gestion crédits par user | `credits_ledger` |
| `billing` | Stripe webhooks, plans, subscriptions | `subscriptions` |
| `export` | Export dossier de production | — |

---

## Cycle par feature

```
[Agent Tester]    → test RED → confirme échec
      ↓
[Agent Migration] → si touche BDD → migration validée supabase db push
      ↓
[Agent Builder]   → implémente le minimum → GREEN
      ↓
[Agent Tester]    → vérifie suite complète verte
      ↓
[Layer 1]         → contrats API/RLS si touche BDD ou endpoints
      ↓
[Agent Seed]      → fixtures à jour avant E2E
      ↓
[Agent QA]        → E2E Playwright sur parcours affecté
      ↓
[Layer 3]         → snapshots si touche prompt ou agent IA
      ↓
[Layer 4]         → régression croisée tous modules
      ↓
[Layer 5]         → perf si endpoint critique
      ↓
[Layer 6]         → sécurité si auth, données user, API publique
      ↓
[Agent Review]    → code review
      ↓
[ORCHESTRATEUR]   → merge
      ↓
[Agent Monitoring]→ 30min surveillance post-déploiement
```

---

## Règles inviolables

1. **Jamais de production code sans test RED vu échouer.**
2. **Jamais de migration Supabase hors Agent Migration.**
3. **Jamais d'E2E sans seed déterministe préalable.**
4. **Jamais de merge sans Agent Review.**
5. **Jamais de déploiement prod sans Sentry configuré.**
6. **Jamais de `DROP COLUMN` sans période de dépréciation documentée.**
7. **CI verte obligatoire avant tout merge sur `main`.**

---

## Snapshots IA — règle ScenIQ

Les 5 agents Claude (Director, Scriptwriter, Storyboarder, Music, Visual) sont implémentés dans `lib/claude/agents/` et orchestrés via `runAllAgents()` (Promise.allSettled, parallélisme résilient).

Tests : `tests/unit/agents-prompts.test.ts` valide la **structure des system prompts** (sections en MAJUSCULES, anti-buzzwords, params dynamiques injectés). Les snapshots dans `tests/snapshots/agents.snapshot.test.ts` testent la **structure de sortie**, jamais le texte verbatim.

```ts
// Structure attendue — stable même si le modèle évolue
expect({
  hasContent: !!response.content,
  hasSections: response.content.includes('\n'),
  error: response.error,
}).toMatchSnapshot()
```

Toute modification de prompt → `vitest --updateSnapshot` + review humaine obligatoire.

---

## Variables d'environnement requises

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Claude API
ANTHROPIC_API_KEY=

# BytePlus ModelArk (provider principal Seedance + Dreamina Image)
BYTEPLUS_API_KEY=              # ark-02e1... (console ModelArk BytePlus)
BYTEPLUS_BASE_URL=             # optionnel, défaut https://ark.ap-southeast.bytepluses.com/api/v3

# fal.ai (fallback silencieux Seedance)
FAL_KEY=

# Studio admin (dashboard Pascal)
ADMIN_SECRET=                  # secret partagé header x-admin-secret (toutes routes /api/studio/*)

# App
NEXT_PUBLIC_APP_URL=
```

---

## Seuils de monitoring prod

```
Sentry      : error rate > 1% sur 5min → alerte
Vercel      : Function error rate > 0.5% → notification
Supabase    : quota > 80% → alerte préventive
fal.ai      : generation failure rate > 5% → alerte
Claude API  : timeout > 10s → alerte
```

---

## Red flags — STOP immédiat

- Feature démarrée sans ce fichier AGENTS.md lu
- Builder qui code avant test RED confirmé
- Migration écrite par Builder ou Tester
- E2E sans `npm run seed:test` préalable
- PR sans Agent Review
- Déploiement sans Sentry actif
- Prompt modifié sans snapshot mis à jour
- CI rouge mergée "temporairement"
