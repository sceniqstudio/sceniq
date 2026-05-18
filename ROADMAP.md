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

1. Client va sur sceniq.app → clique "Lancer ma vidéo" → page `/commande` (à coder)
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
- [x] Page `/commande` placeholder (mailto bridge en attendant le vrai checkout Stripe)
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

### Ce qui reste à construire (V1, ordre de priorité)

**1. Page `/commande` (checkout) — gros chantier (3-4 h)**
- [ ] Migration BDD : table `orders` (id, status, format, duration, price, brief, client_name, email, phone, company, preferred_call_slot, stripe_session_id, created_at)
- [ ] Bucket Supabase `client-uploads` privé (signed URLs 24h) — pour les refs uploadées
- [ ] Page `/commande` multi-step (configuration → brief + upload refs → coordonnées + créneau → Stripe Checkout)
- [ ] Route `/api/orders` POST → crée order + génère Stripe Checkout session → retourne URL
- [ ] Webhook Stripe `checkout.session.completed` → marque order payée + déclenche emails
- [ ] Email notification → client (confirmation) + Pascal (nouvelle commande) via SMTP IONOS `support@sceniq.studio`
- [ ] Page `/commande/success` (post-paiement)

**2. Dashboard projet refondu (admin only) — gros chantier (3-4 h)**
- [ ] Whitelist Clerk email (`uxdesignparis@gmail.com` + `support@sceniq.studio`) — bloquer signup public
- [ ] Cacher section Marque du sidebar (code conservé pour V2)
- [ ] Page Projet refondue selon flow Figma : upload 6 images max (renommées Image1/Image2…), 3 blocs modifiables (Concept, Storyboard 4 scènes, Ambiance sonore), Prompt final unifié, CTA "Générer la vidéo"
- [ ] Backend : refactor route generation → 1 seul appel API BytePlus avec prompt unifié multi-shot → 1 vidéo finale (au lieu de N appels par scène)
- [ ] `idealShots()` adaptatif : 5s=2 shots, 8-10s=3 shots, 12-15s=4 shots

**3. Setup tech à finaliser (Pascal)**
- [ ] Créer une clé Stripe `sceniq-prod` sur dashboard.stripe.com → ajouter `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` sur Vercel
- [ ] Récupérer credentials SMTP IONOS `support@sceniq.studio` (host, port, user, pass) → ajouter sur Vercel
- [ ] Remplacer logo SVG par PNG dans Brand Memory existante (le SVG cassait la génération Seedance — filtre code OK mais préfère PNG)

### Ce qui est volontairement absent de la V1

- ❌ Signup public Clerk (pas de self-service en V1)
- ❌ Section Marque UI dashboard (cachée, code conservé V2)
- ❌ Rate limiting API
- ❌ Job queue Seedance (timeout Vercel acceptable avec 1 appel API multi-shot)
- ❌ Sentry monitoring
- ⚠️ Domaine sceniq.app (acheté IONOS, DNS à pointer Vercel) — voir SWITCH_PROD.md
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
