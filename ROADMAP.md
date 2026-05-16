# ScenIQ — Roadmap V1 → V2

---

## V1 MVP — 10 agences beta (maintenant)

### Objectif
Valider le produit avec de vrais utilisateurs qui paient.
Périmètre minimal mais fonctionnel et sécurisé sur les points critiques.

### Ce qui est dans la V1

**Auth & accès**
- [x] Clerk auth (sign-in, sign-up, session)
- [x] middleware.ts — toutes les routes protégées
- [x] Ownership check sur chaque API route (le project/scene appartient à l'user)

**Core product**
- [x] Création de projet avec brief + params
- [x] 5 agents Claude en parallèle via `runAllAgents()` (Director, Scriptwriter, Storyboarder, Music, Visual)
- [x] Parsing des scènes depuis le storyboarder
- [x] Génération clips Seedance 2.0 **Pro tier** via BytePlus ModelArk (primaire 1080p) + fal.ai (fallback silencieux 720p) — jamais Fast
- [x] **Routing automatique reference-to-video / text-to-video** selon présence d'assets Brand Memory
- [x] **Brand Memory wiring** : `projects.brand_id → brand_assets → image_urls` passés à Seedance
- [x] Storyboarder calibré reference-to-video (prompts action-focused, anti "cinematic"/"premium")
- [x] Landing complète : hero split, mission vidéo, "Pourquoi Seedance 2.0", carousel 17 reels, modal lecture, FAQ enrichie
- [x] Système de crédits avec ledger (idempotent par sceneId)
- [x] Remboursement crédit si génération échoue

**Billing**
- [x] Stripe webhook `invoice.paid` → créditage automatique
- [x] Stripe webhook `subscription.deleted` → statut canceled
- [x] 3 plans : Studio (€49/10cr), Agency (€199/50cr), White-label (€599/illimité)

**Sécurité basique**
- [x] Validation Zod sur tous les inputs API
- [x] Headers sécurité (X-Frame-Options, nosniff, referrer)
- [x] RLS Supabase sur toutes les tables

**Infra**
- [x] Supabase local avec config.toml + Storage buckets
- [x] Migrations versionnées
- [x] CI GitHub Actions (typecheck + unit + contracts + E2E)
- [x] .env.example documenté

### Ce qui est volontairement absent de la V1

- ❌ Rate limiting API (risque faible avec 10 users en beta)
- ❌ Job queue pour Seedance (timeout Vercel acceptable en beta)
- ❌ Portail client Stripe (géré manuellement via Stripe dashboard)
- ❌ Sentry (logs Vercel suffisent en beta)
- ⚠️ Brand Memory **backend wired** (table + lookup chain + passage à Seedance) mais **UI upload pas encore implémentée** — le brief form a l'incitation visuelle (badge ambre/vert) mais l'écran d'upload des assets reste à coder
- ❌ Export PDF structuré (export texte suffit)
- ❌ Multi-langue
- ❌ Clerk webhook (suppression compte)

### Critères pour passer en V2

- 3+ clients payants actifs
- 1 incident prod lié à une limitation V1 (timeout, rate limit, etc.)
- OU 50+ vidéos générées par mois

---

## V2 Production — dès la monétisation réelle

### Résilience & performance

**Job queue génération vidéo**
- Problème V1 : `fal.subscribe()` synchrone → timeout Vercel si job > 60s
- Solution V2 : Inngest ou Trigger.dev — job async avec webhook de completion
- Impact : génération fiable même sur des clips longs, pas de timeout

**Rate limiting**
- Problème V1 : un user peut spammer `/api/generation` et vider ses crédits en boucle
- Solution V2 : Upstash Redis + `@upstash/ratelimit` — 5 générations/minute/user
- Impact : protection facture fal.ai + stabilité

**Index BDD**
- Problème V1 : `user_credits` view fait un `SUM` sur toute la table à chaque appel
- Solution V2 :
  ```sql
  CREATE INDEX idx_credits_ledger_user_id ON credits_ledger(user_id);
  CREATE INDEX idx_projects_user_id ON projects(user_id);
  CREATE INDEX idx_scenes_project_id ON scenes(project_id);
  ```

### Sécurité renforcée

**Clerk webhook**
- Écouter `user.deleted` → supprimer les données Supabase (RGPD)
- Écouter `user.updated` → sync email

**CSP header**
```ts
// next.config.ts V2
"Content-Security-Policy": "default-src 'self'; img-src 'self' *.fal.media *.supabase.co; ..."
```

**Validation upload assets**
- Vérifier magic bytes des fichiers uploadés (pas seulement le MIME type déclaré)
- Limite taille côté serveur (pas seulement Supabase Storage)

### Monitoring

**Sentry**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
- `sentry.client.config.ts` + `sentry.server.config.ts`
- Alertes : error rate > 1% sur 5min → Slack

**Uptime monitoring**
- Checkly ou Better Uptime — ping `/api/health` toutes les 5 minutes
- Alerte SMS si down > 2 minutes

**Dashboard métriques métier**
- Vidéos générées / jour
- Crédit consommé / user
- Taux d'échec Seedance

### Produit

**Brand Memory UI**
- Backend déjà en place en V1 (table `brand_assets`, lookup, passage à Seedance pour reference-to-video)
- À coder en V2 : écran d'upload UX (logo, images ref, vidéo exemple) → Supabase Storage
- Étendre l'injection au Director et au Visual Director (V1 ne passe les refs qu'à Seedance via Storyboarder)

**Voice cloning (feature Option B reportée)**
- Permettrait d'uploader un échantillon vocal dans Brand Memory
- Pipeline ElevenLabs voice clone → audio file → Seedance image-to-video avec ce audio
- Argument commercial fort : "la voix de votre fondateur dans toutes vos vidéos"
- Coût additionnel : ~$0.30/clip pour la génération de voix
- Voir memory `seedance-model-choice` pour les détails techniques

**Portail client Stripe**
- `stripe.billingPortal.sessions.create()` → lien auto-géré
- Gestion abonnement, téléchargement factures

**Export PDF dossier de production**
- PDF structuré : brief + 5 outputs agents + clips générés
- Librairie : `@react-pdf/renderer`

**Variation rapide**
- Régénérer une scène avec instruction → sans recharger tout le projet

**Webhook Stripe `payment_failed`**
- Suspendre l'accès si paiement échoue après 3 tentatives
- Email automatique via Resend

**Multi-marques dans le dashboard**
- Brand Memory par client — plusieurs marques par compte agency

### Infrastructure

**Backup Supabase**
- Activer Point-in-Time Recovery dans le dashboard Supabase Pro
- Politique : backup toutes les 24h, rétention 7 jours

**Vercel Pro**
- Timeout Vercel Functions : 300s (vs 60s sur hobby)
- Nécessaire si on garde une partie synchrone même en V2

---

## Résumé

| Dimension        | V1 MVP                        | V2 Production                          |
|------------------|-------------------------------|----------------------------------------|
| Auth             | Clerk basique                 | + webhook suppression compte           |
| Génération       | Synchrone (fal.subscribe)     | Job queue async (Inngest)              |
| Rate limiting    | Aucun                         | Upstash Redis 5 req/min/user           |
| Billing          | Webhook invoice.paid basique  | + payment_failed + portail client      |
| Monitoring       | Logs Vercel                   | Sentry + uptime + métriques métier     |
| Sécurité         | Headers + RLS + Zod           | + CSP + Clerk webhook + index BDD      |
| Produit          | Brief → agents → clips        | + Brand Memory + export PDF + variante |
| Infra            | Vercel hobby                  | Vercel Pro + backup Supabase           |
