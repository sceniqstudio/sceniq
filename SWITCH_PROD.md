# ScenIQ — Plan de switch sceniq-ashen.vercel.app → sceniq.app + Clerk prod

> Rédigé le 2026-05-16. Procédure pour basculer en production sur le domaine définitif `sceniq.app` et passer Clerk en `pk_live` / `sk_live`.
>
> Ordre obligatoire : DNS d'abord, Clerk ensuite (Clerk Production exige des records DNS chez IONOS donc on regroupe tout en un seul passage).

---

## Audit code préalable — résultat

| Vérification | Statut |
|---|---|
| URLs `sceniq-ashen.vercel.app` codées en dur | Aucune (que dans docs) |
| `localhost:3000` codé en dur en prod | Aucun (uniquement configs test) |
| `NEXT_PUBLIC_APP_URL` correctement utilisé | OK (`app/layout.tsx` metadataBase) |
| ClerkProvider sans publishableKey hardcodé | OK (lit env var) |
| URLs absolues Clerk (afterSignIn, etc.) | Aucune (config Clerk dashboard uniquement) |
| Webhook Stripe URL hardcodée | Non (config Stripe dashboard) |
| CORS custom à ajuster | Non |
| `mailto:hello@sceniq.app` | Déjà partout (5 liens dans landing) |

**Conclusion : aucune modification source nécessaire.** Tout passe par les dashboards.

---

## Étape 1 — Vercel : ajouter le domaine

Avant de toucher IONOS, ajouter le domaine côté Vercel pour récupérer les valeurs DNS exactes que Vercel attend.

1. Vercel Dashboard → projet `sceniq` → Settings → Domains
2. Cliquer **Add Domain** → saisir `sceniq.app`
3. Vercel proposera automatiquement d'ajouter aussi `www.sceniq.app` (accepter)
4. Noter les valeurs DNS affichées par Vercel :
   - **A record** pour `@` (root) → Vercel donne une IP (typiquement `76.76.21.21`)
   - **CNAME** pour `www` → `cname.vercel-dns.com`
5. Laisser ces entrées en `Invalid Configuration` pour l'instant — elles seront validées automatiquement après le passage IONOS.

---

## Étape 2 — Clerk : créer l'instance Production (récupérer les DNS records)

À faire avant IONOS, pour pouvoir grouper tous les records DNS en un seul passage.

1. Clerk Dashboard → en haut à droite, basculer sur **Production** (ou créer une nouvelle instance Production si pas encore fait)
2. Settings → Domains → saisir `sceniq.app`
3. Clerk affichera **4 records DNS** à ajouter chez IONOS :
   - CNAME : `clerk.sceniq.app` → `frontend-api.clerk.services`
   - CNAME : `accounts.sceniq.app` → `accounts.clerk.services`
   - CNAME : `clk._domainkey.sceniq.app` → `dkim1.xxx.clerk.services` (valeur exacte donnée par Clerk)
   - CNAME : `clk2._domainkey.sceniq.app` → `dkim2.xxx.clerk.services`
   - CNAME : `clkmail.sceniq.app` → `mail.xxx.clerk.services`
4. Ne pas cliquer "Verify" maintenant — Clerk validera tout seul une fois les records propagés.
5. Récupérer les clés `pk_live_***` et `sk_live_***` (Developers → API Keys, en mode Production)
6. Configurer **Paths** côté Clerk Production :
   - Home URL : `https://sceniq.app`
   - Sign-in URL : `/sign-in`
   - Sign-up URL : `/sign-up`
   - After sign-in URL : `/dashboard`
   - After sign-up URL : `/dashboard`

---

## Étape 3 — IONOS : ajouter tous les records en un seul passage

IONOS → DNS de `sceniq.app` → ajouter les enregistrements suivants en bloc :

```
TYPE   HOST                          VALEUR                              TTL
─────  ────────────────────────────  ──────────────────────────────────  ─────
A      @                             76.76.21.21  (← valeur Vercel)      3600
CNAME  www                           cname.vercel-dns.com                3600
CNAME  clerk                         frontend-api.clerk.services         3600
CNAME  accounts                      accounts.clerk.services             3600
CNAME  clk._domainkey                dkim1.xxx.clerk.services            3600
CNAME  clk2._domainkey               dkim2.xxx.clerk.services            3600
CNAME  clkmail                       mail.xxx.clerk.services             3600
```

**Notes :**
- Remplacer `dkim1.xxx`, `dkim2.xxx`, `mail.xxx` par les valeurs exactes affichées par Clerk.
- L'IP Vercel `76.76.21.21` est la valeur standard, mais Vercel peut afficher une autre IP — utiliser celle de l'étape 1.
- Si IONOS demande un trailing dot (`.`), l'ajouter à la fin des valeurs CNAME.
- IONOS UI : "Type" = "A" ou "CNAME", "Sous-domaine" = host, "Pointe vers" = valeur.

---

## Étape 4 — Attendre propagation DNS

- Vérifier la propagation : https://dnschecker.org/#A/sceniq.app et https://dnschecker.org/#CNAME/clerk.sceniq.app
- Délai typique : 15min à 2h chez IONOS, max 24h.
- Une fois propagé :
  - Vercel valide automatiquement et provisionne le SSL (Let's Encrypt) → statut `Valid Configuration` ✓
  - Clerk valide automatiquement les 5 CNAMEs côté dashboard

---

## Étape 5 — Vercel : définir `sceniq.app` comme primary + env vars

1. Vercel → Domains → cliquer "..." à côté de `sceniq.app` → **Set as Primary Domain**
   - Cela active un redirect 308 automatique de `sceniq-ashen.vercel.app` → `sceniq.app`
2. Vercel → Settings → Environment Variables → mettre à jour pour le scope **Production** uniquement (garder les dev keys en Preview/Development) :

```
NEXT_PUBLIC_APP_URL                     https://sceniq.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY       pk_live_***  (depuis Clerk étape 2)
CLERK_SECRET_KEY                        sk_live_***  (depuis Clerk étape 2)
```

3. **Redeploy** Vercel (Production) — Deployments → "..." du dernier déploiement → Redeploy → décocher "Use existing Build Cache"

---

## Étape 6 — Stripe : mettre à jour l'endpoint webhook

1. Stripe Dashboard → Developers → Webhooks
2. Trouver l'endpoint actuel (`https://sceniq-ashen.vercel.app/api/webhooks/stripe`) → cliquer dessus → **Update endpoint**
3. Changer l'URL pour : `https://sceniq.app/api/webhooks/stripe`
4. Stripe régénère le **Signing Secret** → copier `whsec_***`
5. Vercel → env var `STRIPE_WEBHOOK_SECRET` (Production scope) → coller la nouvelle valeur
6. Redeploy Vercel

---

## Étape 7 — Tests post-switch

Sur `https://sceniq.app` :

- [ ] Landing charge sans warning navigateur (SSL OK)
- [ ] `sceniq-ashen.vercel.app/dashboard` redirige bien vers `sceniq.app/dashboard` (308)
- [ ] Inscription complète (sign-up → email vérification → dashboard)
- [ ] Login utilisateur existant
- [ ] Brand Memory : upload logo
- [ ] Création projet + brief → 5 agents Claude
- [ ] Génération scène (BytePlus ou fallback fal.ai)
- [ ] Logs Vercel : pas de 5xx sur les 30 min suivantes
- [ ] Stripe : déclencher un test webhook depuis le dashboard et vérifier qu'il arrive bien

---

## Étape 8 — Nettoyage du repo (optionnel, post-switch)

Modifications à committer une fois tout vérifié OK :

- `CLAUDE.md` ligne 76 : changer `URL provisoire` en `URL production`
- `CLAUDE.md` ligne 79 : retirer la mention "DNS à configurer V1.5"
- `ROADMAP.md` ligne 62 : passer en `[x]` pour le domaine
- `ROADMAP.md` ligne 63 : passer en `[x]` pour les Clerk prod keys
- Recréer `.env.example` (référencé dans CLAUDE.md mais absent du repo)

---

## Rollback si quelque chose casse

Si problème post-switch :

1. **Code casse** → Vercel → Deployments → ancienne version → **Promote to Production** (rollback instantané)
2. **Clerk prod casse l'auth** → Vercel env vars → remettre temporairement les `pk_test_` / `sk_test_` → redeploy
3. **DNS bug** → impossible de revenir en arrière sur IONOS rapidement (TTL 3600) → utiliser `sceniq-ashen.vercel.app` comme URL provisoire le temps de débugger
