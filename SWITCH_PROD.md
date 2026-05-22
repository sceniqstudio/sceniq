# ScenIQ — Plan de switch sceniq-ashen.vercel.app → sceniq.studio

> Mis à jour le 2026-05-22. Domaine définitif : **`sceniq.studio`** (IONOS).
> Le fichier référençait précédemment `sceniq.studio` — remplacé partout par `sceniq.studio`.
>
> Ordre obligatoire : Supabase migrations → DNS Vercel + IONOS → Clerk → Stripe → Env vars Vercel → Redeploy.

---

## Audit code préalable — résultat (2026-05-22)

| Vérification | Statut |
|---|---|
| URLs `sceniq-ashen.vercel.app` codées en dur | Aucune (que dans docs) |
| `localhost:3000` codé en dur en prod | Aucun (uniquement configs test) |
| `NEXT_PUBLIC_APP_URL` correctement utilisé | ✓ (`app/layout.tsx`, `app/api/orders/route.ts`, `app/sitemap.ts`) |
| `support@sceniq.studio` partout | ✓ (landing, emails, mentions légales, webhook) |
| ClerkProvider sans publishableKey hardcodé | ✓ (lit env var) |
| Webhook Stripe checkout séparé du webhook subscriptions | ✓ (`/api/webhooks/stripe-checkout`) |
| Module email SMTP | ✓ (`lib/email/smtp.ts` + sendOrderConfirmation + sendOrderNotification) |
| Bucket `client-uploads` migration | ✓ (`20260522000000_storage_client_uploads.sql`) |
| Table `orders` migration | ✓ (2 migrations : 20260518 + 20260521) |

**Conclusion : aucune modification source nécessaire.** Tout passe par les dashboards + env vars.

---

## Étape 0 — Supabase : appliquer les migrations (NOUVEAU)

```bash
# Dans le dossier du projet
supabase db push
```

Migrations à appliquer si pas encore fait :
- `20260518000000_orders.sql` — table `orders`
- `20260521000000_orders_multicart.sql` — colonnes `cart_items` + `voice_language`
- `20260522000000_storage_client_uploads.sql` — **bucket `client-uploads`** ← NEW

Vérifie dans Supabase > Storage que le bucket `client-uploads` apparaît après `db push`.

---

## Étape 1 — Vercel : ajouter le domaine

Avant de toucher IONOS, ajouter le domaine côté Vercel pour récupérer les valeurs DNS exactes que Vercel attend.

1. Vercel Dashboard → projet `sceniq` → Settings → Domains
2. Cliquer **Add Domain** → saisir `sceniq.studio`
3. Vercel proposera automatiquement d'ajouter aussi `www.sceniq.studio` (accepter)
4. Noter les valeurs DNS affichées par Vercel :
   - **A record** pour `@` (root) → Vercel donne une IP (typiquement `76.76.21.21`)
   - **CNAME** pour `www` → `cname.vercel-dns.com`
5. Laisser ces entrées en `Invalid Configuration` pour l'instant — elles seront validées automatiquement après le passage IONOS.

---

## Étape 2 — Clerk : créer l'instance Production (récupérer les DNS records)

À faire avant IONOS, pour pouvoir grouper tous les records DNS en un seul passage.

1. Clerk Dashboard → en haut à droite, basculer sur **Production** (ou créer une nouvelle instance Production si pas encore fait)
2. Settings → Domains → saisir `sceniq.studio`
3. Clerk affichera **4 records DNS** à ajouter chez IONOS :
   - CNAME : `clerk.sceniq.studio` → `frontend-api.clerk.services`
   - CNAME : `accounts.sceniq.studio` → `accounts.clerk.services`
   - CNAME : `clk._domainkey.sceniq.studio` → `dkim1.xxx.clerk.services` (valeur exacte donnée par Clerk)
   - CNAME : `clk2._domainkey.sceniq.studio` → `dkim2.xxx.clerk.services`
   - CNAME : `clkmail.sceniq.studio` → `mail.xxx.clerk.services`
4. Ne pas cliquer "Verify" maintenant — Clerk validera tout seul une fois les records propagés.
5. Récupérer les clés `pk_live_***` et `sk_live_***` (Developers → API Keys, en mode Production)
6. Configurer **Paths** côté Clerk Production :
   - Home URL : `https://sceniq.studio`
   - Sign-in URL : `/sign-in`
   - Sign-up URL : `/sign-up`
   - After sign-in URL : `/dashboard`
   - After sign-up URL : `/dashboard`

---

## Étape 3 — IONOS : ajouter tous les records en un seul passage

IONOS → DNS de `sceniq.studio` → ajouter les enregistrements suivants en bloc :

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

- Vérifier la propagation : https://dnschecker.org/#A/sceniq.studio et https://dnschecker.org/#CNAME/clerk.sceniq.studio
- Délai typique : 15min à 2h chez IONOS, max 24h.
- Une fois propagé :
  - Vercel valide automatiquement et provisionne le SSL (Let's Encrypt) → statut `Valid Configuration` ✓
  - Clerk valide automatiquement les 5 CNAMEs côté dashboard

---

## Étape 5 — Vercel : définir `sceniq.studio` comme primary + env vars

1. Vercel → Domains → cliquer "..." à côté de `sceniq.studio` → **Set as Primary Domain**
   - Cela active un redirect 308 automatique de `sceniq-ashen.vercel.app` → `sceniq.studio`
2. Vercel → Settings → Environment Variables → mettre à jour pour le scope **Production** uniquement :

```
NEXT_PUBLIC_APP_URL                     https://sceniq.studio
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY       pk_live_***  (depuis Clerk étape 2)
CLERK_SECRET_KEY                        sk_live_***  (depuis Clerk étape 2)
```

### Variables SMTP IONOS (NOUVEAU — email confirmation + notification commandes)

Récupère ces infos dans IONOS → Email → `support@sceniq.studio` → Paramètres SMTP :

```
SMTP_HOST     smtp.ionos.fr
SMTP_PORT     465
SMTP_USER     support@sceniq.studio
SMTP_PASS     *** (mot de passe du compte email IONOS)
SMTP_FROM     support@sceniq.studio
```

### Variables Stripe Checkout (NOUVEAU — webhook commandes séparé du webhook subscriptions)

```
STRIPE_SECRET_KEY                   sk_live_*** (clé prod Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  pk_live_*** (clé pub prod Stripe)
STRIPE_CHECKOUT_WEBHOOK_SECRET      whsec_***   (voir étape 6b ci-dessous)
```

> ⚠️ `STRIPE_CHECKOUT_WEBHOOK_SECRET` ≠ `STRIPE_WEBHOOK_SECRET` — ce sont deux webhooks séparés avec deux secrets distincts.

3. **Redeploy** Vercel (Production) — Deployments → "..." du dernier déploiement → Redeploy → décocher "Use existing Build Cache"

---

## Étape 6 — Stripe : mettre à jour les webhooks

### 6a. Webhook subscriptions (existant — mise à jour URL)
1. Stripe Dashboard → Developers → Webhooks
2. Trouver l'endpoint actuel (`sceniq-ashen.vercel.app/api/webhooks/stripe`) → **Update endpoint**
3. Nouvelle URL : `https://sceniq.studio/api/webhooks/stripe`
4. Stripe régénère le **Signing Secret** → copier `whsec_***`
5. Vercel → env var `STRIPE_WEBHOOK_SECRET` (Production) → coller

### 6b. Webhook checkout (NOUVEAU — pour les commandes /commande)
1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL : `https://sceniq.studio/api/webhooks/stripe-checkout`
3. Events à écouter : **uniquement** `checkout.session.completed`
4. Créer → copier le **Signing Secret** → `whsec_***`
5. Vercel → env var `STRIPE_CHECKOUT_WEBHOOK_SECRET` (Production) → coller

> Ces deux webhooks ont des signing secrets différents. Ne pas les mélanger.

---

## Étape 7 — Tests post-switch

Sur `https://sceniq.studio` :

- [ ] Landing charge sans warning navigateur (SSL OK)
- [ ] `sceniq-ashen.vercel.app` redirige vers `sceniq.studio` (308)
- [ ] `/commande` : formulaire multi-step 4 étapes s'affiche
- [ ] Commande test (Stripe test mode) → redirect `/commande/success` → email reçu côté client + Pascal
- [ ] Dashboard admin `/dashboard` : accessible avec `uxdesignparis@gmail.com`, bloqué pour autre compte
- [ ] Studio admin : génération image Dreamina OK
- [ ] Logs Vercel : pas de 5xx sur les 30 min suivantes
- [ ] Stripe checkout webhook : tester depuis dashboard Stripe → voir log 200 dans Vercel
- [ ] Stripe subscriptions webhook : idem

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
