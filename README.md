# ScenIQ — Guide de démarrage Cowork

> Historique des noms : Scenica → Creatiq → ScenIQ (2026-05-16).

## Avant toute chose

```bash
# 1. Lire AGENTS.md
cat AGENTS.md

# 2. Installer les dépendances
npm install

# 3. Copier les variables d'environnement
cp .env.example .env.local
# → Remplir les valeurs dans .env.local

# 4. Initialiser Supabase local
supabase start
supabase db push   # applique toutes les migrations

# 5. Générer les types TypeScript depuis le schéma
npm run db:types

# 6. Vérifier le sanity check CI
npm run test:unit
```

---

## Démarrer une nouvelle feature

### Séquence obligatoire

```
1. Activer Agent Tester  → écrire le test RED dans /tests/unit/ ou /tests/integration/
2. Confirmer l'échec     → npm run test:unit (ou test:contracts)
3. Activer Agent Migration → si la feature touche la BDD
4. Activer Agent Builder → implémenter le minimum pour GREEN
5. Confirmer le GREEN    → npm run test:unit
6. Activer Agent Seed    → mettre à jour /tests/fixtures/data.ts si nouveau type de donnée
7. Activer Agent QA      → E2E Playwright sur le parcours affecté
8. Si agents IA modifiés → npm run test:snapshots (updateSnapshot si intentionnel)
9. Activer Agent Review  → code review
10. Merger               → CI verte obligatoire
11. Activer Agent Monitoring → 30min surveillance post-déploiement
```

---

## Commandes utiles

```bash
# Tests
npm run test:unit           # Vitest unitaires
npm run test:contracts      # Contrats Supabase + RLS
npm run test:snapshots      # Snapshots agents IA
npm run test:e2e            # Playwright E2E
npm run test:all            # Pipeline complet

# Fixtures
npm run seed:test           # Reset + seed BDD de test

# BDD
npm run db:push             # Appliquer migrations
npm run db:types            # Régénérer les types TypeScript
npm run db:reset            # Reset complet BDD locale

# Dev
npm run dev                 # Next.js dev server
npm run typecheck           # TypeScript strict
```

---

## Architecture des modules

| Module | Dossier principal | Tests |
|--------|-------------------|-------|
| Auth (Clerk) | `app/(auth)/` | `tests/e2e/auth.spec.ts` |
| Brand Memory | `app/dashboard/brands/`, `lib/supabase/` | `tests/integration/contracts/brands.contract.test.ts` |
| Projets | `app/project/`, `app/api/projects/` | `tests/unit/`, `tests/e2e/brief.spec.ts` |
| Agents Claude | `lib/claude/agents/` | `tests/snapshots/`, `tests/unit/agents/` |
| Génération Seedance | `lib/fal/`, `app/api/generation/` | `tests/integration/api/generation.api.test.ts` |
| Crédits | `lib/credits/`, `app/api/credits/` | `tests/unit/credits/`, `tests/integration/contracts/` |
| Billing Stripe | `lib/stripe/`, `app/api/webhooks/stripe/` | `tests/integration/security/` |

---

## Règles de nommage

- **Fichiers de migration** : `YYYYMMDDHHMMSS_description.sql`
- **Tests unitaires** : `feature-name.test.ts`
- **Tests de contrat** : `table-name.contract.test.ts`
- **Tests API** : `endpoint.api.test.ts`
- **Snapshots** : `agent-name.snapshot.test.ts`
- **E2E** : `parcours-name.spec.ts`
- **Composants** : PascalCase — `BriefForm.tsx`
- **Lib utils** : camelCase — `validateBrief.ts`

---

## Monitoring prod

Après chaque `git push main` → Vercel déploie automatiquement.

Checklist Agent Monitoring (30 min) :
- [ ] Build Vercel vert
- [ ] Sentry : 0 nouvelles exceptions
- [ ] Vercel Function Logs : 0 erreurs 5xx
- [ ] Supabase Dashboard : quota < 80%
- [ ] fal.ai : 0 jobs failed

Seuils d'alerte configurés dans Sentry et Vercel dashboard.
