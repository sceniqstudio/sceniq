# ScenIQ — Roadmap V1 → V1.5 → V2

> **PIVOT MAJEUR — 17 mai 2026** : ScenIQ devient une **agence services** (Pascal-as-a-Service)
> en V1, pas un SaaS self-service. Le SaaS self-service est repoussé en V2 (2027).
> Toute la mécanique SaaS (Clerk public signup, crédits, abonnements Stripe, Brand Memory UI multi-users)
> reste dans le code mais est masquée/désactivée — utile pour la bascule V2.

---

## V1 — Agence services Pascal (maintenant)

### Modèle

Pascal vend des **vidéos IA prêtes à diffuser au forfait fixe** à des marques/agences/PME qui veulent
externaliser la création vidéo IA sans s'occuper de la mécanique (script, storyboard, prompt
engineering, génération, montage). Il pilote toute la chaîne créative via le dashboard admin
(seul accès) et livre un MP4 final sous 48 h après validation de la pré-prod par le client.

### Grille pricing (HT, tout inclus)

| Durée | Prix HT |
|---|---|
| 5 sec | 69 € |
| 8 sec | 89 € |
| 10 sec | 109 € |
| 12 sec | 129 € |
| 15 sec | 159 € |

Tous formats inclus (21:9, 16:9, 4:3, 1:1, 3:4, 9:16). 10 itérations incluses (sur-itération : 9 €/unité).
Livraison sous 48 h après validation finale. Au-delà de 10 vidéos/mois pour le même client :
dégressif sur mesure.

### Process client

1. Client va sur sceniq.studio → clique "Lancer ma vidéo" → page `/commande` ✅
2. Formulaire multi-step : configuration (format + durée) → brief 2-5 lignes + upload refs (images, audio, logo) → coordonnées + créneau d'appel préféré → paiement Stripe Checkout
3. Email automatique → client (confirmation) + Pascal (notification nouvelle commande)
4. Pascal rappelle sous 4 h ouvrées pour caler la pré-prod
5. Pascal pilote 5 agents Claude depuis le dashboard admin (seul accès)
6. Pascal génère la vidéo (1 appel API BytePlus avec prompt unifié multi-shot → 1 vidéo finale)
7. Pascal livre le MP4 sous 48 h via email/wetransfer

### Ce qui est en place (V1) — code en prod

**Landing (refonte complète 17 mai 2026)**
- [x] Pivot positionnement : "Brief en 2 lignes. Vidéo en 48 h." (ton "Je" partout, cohérent avec mascotte guépard)
- [x] Plus de signup public ni de "Demander un devis" — CTA unique "Lancer ma vidéo" → `/commande`
- [x] Hero refait + 2 nouveaux logos vectoriels (W/B) intégrés à la place du LogoMark inline
- [x] Section process 4 étapes (Brief → Préprod → Itérations 10× → Livraison 48h)
- [x] Section "Pourquoi Seedance 2.0" enrichie avec key points officiels BytePlus (6 cards : précision narrative, physique réaliste, cohérence scène à scène, audio natif synchronisé, rapide & scalable, sortie personnalisable)
- [x] Section "Étude de marché · Mai 2026" — tableau comparatif DIY (~80-130€+5-8h) / Freelance (~850-2500€) / **ScenIQ + Seedance 2.0** (69-159€ forfait)
- [x] Section agents fusionnée : 4 blocs (Concept, Storyboard, Ambiance, Prompt final unifié) — au lieu des 5 anciens
- [x] Grille pricing forfait par durée + bloc rassurance (formats, itérations, 48h, propriété)
- [x] FAQ 9 questions refondue agence (process, vs Runway/Kling/Veo, prix, livrable, droits, remboursement, délai, types projets, why no self-service)
- [x] CTA final repensé : "Prêt à lancer votre vidéo ?" + waitlist V2 2027
- [x] Menu réordonné dans l'ordre des sections : Réalisations → Seedance 2.0 → Équipe créa → Le process → Tarifs → FAQ
- [x] Page `/commande` placeholder (mailto bridge) → remplacée par checkout Stripe complet (22 mai 2026)
- [x] Fix overflow FAQ (max-height 180→1200px) + hero font clamp adaptatif (24-80px)
- [x] Retrait fausses promesses (lip-sync FR précis) — remplacé par note honnête sur EN/JP/ES/PT/ID supportés officiellement

**Backend (en prod aussi)**
- [x] 5 agents Claude opérationnels en parallèle via `runAllAgents()` (modèle `claude-sonnet-4-5`)
- [x] Storyboarder optimisé selon best practices officielles ByteDance (lumière #1, 1 caméra/shot, 60-100 mots, vocabulaire calibré)
- [x] Migration BDD `unique(project_id, agent)` sur `agent_outputs` — fix upsert silencieux qui empêchait la persistance
- [x] Migration BDD `brand_assets.type` accepte `voice` + route assets accepte audio MIME (mp3/wav/m4a/aac, 25 MB)
- [x] BytePlus Seedance 2.0 : payload v3 corrigé (`content[]` array, `ratio`, `generate_audio`, parsing `id`)
- [x] Filtre SVG/AVIF des refs Brand Memory avant Seedance + UI conforme spec ByteDance
- [x] UX agents : actions Régénérer + Modifier + Valider par card (route `/api/production/[projectId]/agent/[agentId]` POST/PATCH)
- [x] CRUD projet individuel : route `/api/projects/[id]` (GET pour pré-remplir Brief, PATCH pour update, DELETE pour supprimer)
- [x] Bouton 🗑 supprimer projet sur dashboard avec confirmation + cascade BDD
- [x] Pré-remplissage Brief sur projet existant (mocks "Maison Lumière" supprimés, vraies valeurs BDD)

**Infra & creds**
- [x] BYTEPLUS_AK + BYTEPLUS_SK créés et ajoutés à Vercel Environment Variables (root account, à migrer vers IAM user dédié en V2)
- [x] Service OmniHuman 1.5 activé en mode Free trial dans la console BytePlus (Vision AI section, pas ModelArk)
- [x] CDN Cloudflare R2 bucket "sceniq-showcase" — 26+ vidéos showcase + hero (zéro egress Vercel)
- [x] `scripts/push-videos.ts` — compression ffmpeg auto (cible 1.6 Mo, seuil 2 Mo) + upload R2 via wrangler
- [x] Google Analytics 4 intégré dans `app/layout.tsx` (NEXT_PUBLIC_GA4_MEASUREMENT_ID)
- [x] Bannière promo "50 premiers — Reel offert" + modale demande email → route `/api/promo`

### Ce qui reste à construire (V1, ordre de priorité)

**1. Page `/commande` (checkout) — ✅ code complet (22 mai 2026)**
- [x] Migration BDD : table `orders` — `supabase/migrations/20260518000000_orders.sql` + `20260521000000_orders_multicart.sql` *(supabase db push à faire par Pascal)*
- [x] Bucket Supabase `client-uploads` privé — `supabase/migrations/20260522000000_storage_client_uploads.sql` *(supabase db push à faire par Pascal)*
- [x] Page `/commande` multi-step (configuration → brief + upload refs → coordonnées + créneau → Stripe Checkout)
- [x] Route `/api/orders` POST → crée order + génère Stripe Checkout session → retourne URL
- [x] Webhook Stripe `checkout.session.completed` → marque order payée + déclenche emails (`app/api/webhooks/stripe-checkout/`)
- [x] Email notification → client (confirmation) + Pascal (nouvelle commande) via SMTP (`lib/email/` — SMTP credentials à ajouter sur Vercel)
- [x] Page `/commande/success` (post-paiement)

**2. Dashboard projet refondu (admin only) — ✅ livré (28-29 mai 2026)**
- [x] Whitelist Clerk email (`uxdesignparis@gmail.com` + `support@sceniq.studio`) — `app/(app)/layout.tsx`
- [x] Section Marque masquée du sidebar (code conservé pour V2)
- [x] Page Production refondue : 4 blocs UI (Concept, Storyboard, Ambiance, Prompt final unifié) + upload 6 images ref + polling génération 5s + CTA "Générer la vidéo"
- [x] Backend : route `/api/generation/[projectId]/unified` — 1 appel BytePlus prompt unifié multi-shot → 1 vidéo finale
- [x] `idealShots()` adaptatif : 5s=2 shots, 8-10s=3 shots, 12-15s=4 shots (`lib/utils/scenes.ts`)
- [x] Route `/api/projects/[id]/ref-images` — upload/delete images de référence projet (max 6)
- [x] 3 nouvelles colonnes BDD projects : `ref_image_urls text[]`, `final_video_url text`, `video_job_id text`
- [x] `scripts/push-videos.ts` — compression ffmpeg auto (cible 1.6 Mo, seuil 2 Mo, MAX_WIDTH 1280)

**3. Setup tech à finaliser (Pascal — actions manuelles)**
- [ ] Créer une clé Stripe `sceniq-prod` sur dashboard.stripe.com → ajouter `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` sur Vercel
- [ ] Enregistrer webhooks Stripe : `https://sceniq.studio/api/webhooks/stripe` (subscriptions) + `https://sceniq.studio/api/webhooks/stripe-checkout` (checkout.session.completed) → ajouter `STRIPE_WEBHOOK_SECRET` + `STRIPE_CHECKOUT_WEBHOOK_SECRET` sur Vercel
- [ ] Récupérer credentials SMTP IONOS `support@sceniq.studio` (host, port, user, pass) → ajouter `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` sur Vercel
- [ ] Appliquer les migrations en attente via `supabase db push` (orders table + client-uploads bucket — `projects_video_fields` déjà appliquée manuellement)
- [ ] Remplacer logo SVG par PNG dans Brand Memory existante (filtre code OK mais préfère PNG)

### Ce qui est volontairement absent de la V1

- ❌ Signup public Clerk (pas de self-service en V1)
- ❌ Section Marque UI dashboard (cachée, code conservé V2)
- ❌ Rate limiting API
- ❌ Job queue Seedance (timeout Vercel acceptable avec 1 appel API multi-shot)
- ❌ Sentry monitoring
- ✅ Domaine `sceniq.studio` configuré IONOS (A `@` → `216.198.79.1`, CNAME `www` → `cname.vercel-dns.com`) — en prod sur `sceniq-ashen.vercel.app` depuis le 22 mai 2026
- ⚠️ Clerk Production keys (encore en dev keys avec limites strictes)
- ⚠️ Lip-sync FR précis (Seedance ne le supporte pas officiellement — fausse promesse retirée du marketing, vrai pipeline OmniHuman en V1.5)

---

## V1.5 — Lip-sync FR via OmniHuman 1.5 (après V1 lancée)

### Objectif
Tenir la promesse "lip-sync français" via le vrai pipeline dédié (OmniHuman 1.5 + voix-off uploadée
ou clonée). Permet de servir les talking heads, témoignages clients, voix off pro en français.

### Architecture validée
- Storyboarder route : scènes "talking head" → OmniHuman, scènes "ambiance" → Seedance
- Workflow : Pascal upload manuellement un MP3 (ou client fournit) → OmniHuman synchronise lèvres + image personnage → vidéo lip-sync parfait
- Pas d'ElevenLabs en V1.5 (Pascal préfère uploader son propre MP3, pas de coût récurrent TTS)

### À faire
- [ ] Trouver doc API précise OmniHuman 1.5 (endpoint exact, payload schema, format réponse) — bloqueur actuel
- [ ] Coder `lib/byteplus/omnihuman.ts` avec signature VOLC V4 (HMAC-SHA256 + canonical request) — ~150-200 lignes
- [ ] Migration BDD : `scenes.voiceover_url` + `scenes.provider` (`seedance` | `omnihuman`)
- [ ] UI upload MP3 par scène dans la page Production
- [ ] Pipeline routing scene-by-scene dans `/api/generation/[sceneId]`
- [ ] Reformuler claims marketing : "Lip-sync FR avec ta propre voix-off" (positionnement honnête)

---

## V2 — Self-service plateforme (2027)

### Objectif
Ouvrir une vraie plateforme où n'importe quel pro peut s'inscrire, gérer ses propres marques,
générer ses vidéos sans passer par Pascal. Pour les pros formés au prompt engineering qui veulent
gérer eux-mêmes.

### À faire
- [ ] Réactiver signup public Clerk
- [ ] Réactiver/affiner Brand Memory UI (multi-users, par compte)
- [ ] Stripe Subscriptions (3 plans : Studio 49€, Agency 199€, White-label 599€) — code déjà en place, désactivé pour V1
- [ ] Webhook Clerk `user.deleted` (RGPD)
- [ ] Job queue Seedance (Inngest/Trigger.dev) pour éviter timeouts Vercel
- [ ] Rate limiting Upstash Redis (5 générations/min/user)
- [ ] Sentry monitoring + uptime
- [ ] Dashboard métriques métier
- [ ] Migration IAM user BytePlus dédié (au lieu de root account)
- [ ] API white-label pour intégrations Make/Zapier
- [ ] Export PDF dossier production
- [ ] Variation rapide (régénérer 1 scène sans relancer tout)

### Critères pour passer en V2
- 10+ clients agence services V1 actifs payants
- 1 demande explicite d'accès self-service
- Waitlist V2 (capturée via mailto sur landing) > 50 inscrits
