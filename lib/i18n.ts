// ─── ScenIQ — Traductions FR / EN ────────────────────────────────────────────
// Règle : toute mise à jour du copy FR doit être reflétée en EN dans ce fichier.
// EN = anglais natif — pas du mot à mot.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = 'fr' | 'en'

export const translations = {
  fr: {
    // ── Nav ──────────────────────────────────────────────────────────────────
    nav: {
      process:    'Comment ça marche',
      studio:     'Le studio',
      models:     'Comédiens IA',
      pricing:    'Tarifs',
      portfolio:  'Réalisations',
      faq:        'FAQ',
      question:   'Une question ?',
      order:      'Commander →',
      orderMobile:'Commander ma vidéo →',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      badge:    'Studio IA',
      badgeSub: 'Vidéos courtes sur mesure — Shorts · Reels · Stories · Clips',
      h1a:      'Du brief à l\'écran.',
      h1b:      '48 heures.',
      sub:      'Cinq agents IA forment une équipe créa complète. Vous écrivez le brief, ils livrent la pré-prod — script, storyboard, musique, visuels — sans réunion intermédiaire.',
      cta1:     'Commander ma vidéo →',
      cta2:     'Voir les réalisations',
      footnote: 'À partir de 69 € · 5 à 15 secondes · 10 itérations incluses',
    },

    // ── Trust strip ──────────────────────────────────────────────────────────
    trust: {
      label: 'Pour',
      items: ['Agences pub', 'Startups', 'E-commerce', 'Créateurs', 'Particuliers', 'Brand managers'],
    },

    // ── Process ──────────────────────────────────────────────────────────────
    process: {
      label: 'Comment ça marche',
      h2a:   'Du brief au MP4.',
      h2b:   'Cinq étapes.',
      sub:   'Vous écrivez deux lignes et vous payez. ScenIQ fait le reste — sans réunion, sans aller-retour interminable.',
      steps: [
        { n: '1', title: 'Brief',    desc: 'Deux lignes sur votre marque et votre objectif. Ajoutez des références visuelles ou audio si vous en avez.' },
        { n: '2', title: 'Commande', desc: 'Choisissez la durée. Paiement 100 % sécurisé par Stripe. Confirmation par email immédiate.' },
        { n: '3', title: 'Appel',    desc: 'On vous rappelle sous 4h ouvrées pour aligner la direction créative avant de lancer les agents.' },
        { n: '4', title: 'Pré-prod', desc: 'Director, Scriptwriter, Storyboarder, Music et Visual travaillent en parallèle. Pré-prod livrée sans intermédiaire.' },
        { n: '5', title: 'Livraison',desc: 'MP4 1080p envoyé par e-mail sous 48h. Pas d\'espace client, pas de compte. 10 itérations incluses.' },
      ],
    },

    // ── Studio ───────────────────────────────────────────────────────────────
    studio: {
      label: 'Le studio',
      h2a:   'Cinq agents IA.',
      h2b:   'Une équipe créa complète.',
      sub:   'Chaque agent est spécialisé. Ensemble, ils couvrent tout ce qu\'une équipe créa fait habituellement en plusieurs jours de réunions — sans que vous n\'ouvriez aucune interface.',
      agents: [
        { name: 'Director',     desc: 'direction créative, axe publicitaire, prise de position défendable' },
        { name: 'Scriptwriter', desc: 'script calibré à 2,2 mots/sec, voix-off structurée' },
        { name: 'Storyboarder', desc: 'découpage shot par shot, prompts multi-shot pour Seedance' },
        { name: 'Music',        desc: 'direction musicale avec BPM précis et références licenciables réelles' },
        { name: 'Visual',       desc: 'palette hex, typographie, ambiance lumière — spec exécutable directement' },
      ],
      videoAria: 'Lire la vidéo volt',
    },

    // ── Seedance ─────────────────────────────────────────────────────────────
    seedance: {
      label: 'Seedance 2.0 by ByteDance',
      h2a:   'Génération vidéo.',
      h2b:   'Un prompt. Un clip livré.',
      sub:   'Le Storyboarder produit un prompt multi-shot unifié. Un seul appel Seedance 2.0 génère la vidéo déjà montée — cohérence visuelle garantie entre chaque plan, sans post-prod ni assemblage manuel.',
      features: [
        'Résolution 1080p native — qualité broadcast, pas du 720p upscalé',
        'Audio natif intégré — ambiance sonore et voix off générées dans le même rendu',
        'Multi-shot en un seul appel — 2 à 4 plans selon la durée, déjà montés',
        'Formats 9:16, 1:1 et 16:9 inclus — prêts pour Meta Ads, TikTok et YouTube',
      ],
      note:      'Clips générés via Seedance 2.0 depuis un brief de 2 lignes',
      aria169:   'Lire exemple 16:9 en grand format',
      aria916:   'Lire exemple 9:16 en grand format',
    },

    // ── Stats ────────────────────────────────────────────────────────────────
    stats: [
      { num: '48h',  label: 'Livraison garantie',      sub: 'Du brief au MP4 final' },
      { num: '5',    label: 'Agents IA en parallèle',  sub: 'Concept · Script · Storyboard · Ambiance · Visuel' },
      { num: '1080p',label: 'Qualité native',           sub: 'Seedance 2.0 Pro — sans compression' },
      { num: 'MP4',  label: 'Format livré',             sub: 'Prêt pour Meta Ads · TikTok · YouTube' },
    ],

    // ── AI Models ────────────────────────────────────────────────────────────
    models: {
      label: 'Comédiens IA',
      h2a:   'Un comédien IA.',
      h2b:   'Créé pour votre marque.',
      sub:   'Un brief suffit. ScenIQ génère le comédien, l\'intègre au clip et vous livre la mention légale obligatoire. Rien d\'autre à gérer.',
      features: [
        { label: 'Pas de casting, pas de cachet',  desc: 'aucun contrat modèle, aucun droit à l\'image à négocier' },
        { label: 'Pas de tarif agence',             desc: '800–3 000 € de casting en agence — 49 € ici, dans votre forfait' },
        { label: 'Disponible à volonté',            desc: 'recadré, retravaillé ou remplacé à chaque itération' },
        { label: 'Mention légale fournie',          desc: 'conforme EU AI Act + loi influenceurs FR — livrée par écrit avec le MP4' },
      ],
      disclaimer: 'Personnages entièrement fictifs — aucune ressemblance avec une personne réelle. La mention « Image générée par IA » est obligatoire sur vos publications (EU AI Act art. 50 · loi FR 9 juin 2023). ScenIQ vous la fournit dans chaque livraison.',
      cta1: 'Voir les clips avec comédiens IA →',
      cta2: 'Ajouter l\'option · +49 €',
      renderLabel: 'Exemple de rendu',
      kaelysType:  'Comédienne IA · style influenceuse',
      modelTypes:  ['Tech · Urbain', 'Business'],
      noteIcon:    '💡',
      note:        'Ces visuels sont des exemples de rendu — votre comédien IA est généré sur mesure d\'après votre description (âge, style, ambiance, tenue).',
      noteHighlight: 'exemples de rendu',
    },

    // ── Pricing ──────────────────────────────────────────────────────────────
    pricing: {
      label:       'Tarifs',
      h2:          'Prix fixe. Sans surprise.',
      sub:         'Choisissez la durée. Chaque forfait inclut la production complète — script, storyboard, musique et montage final MP4 1080p. Livraison sous 48h.',
      subHighlight:'la production complète',
      langLine:    'Lip sync · voix off ou dialogue · sous-titres · 🇫🇷 🇺🇸 🇯🇵 🇪🇸 🇧🇷 🇮🇩 🇨🇳',
      toggleTitle: 'Ajouter un comédien IA',
      toggleDesc:  'Personnage généré sur mesure d\'après votre description',
      togglePrice: '+49 €',
      toggleNote:  '✓ Mention légale "Image générée par IA" fournie · conforme EU AI Act',
      badge:       '⭐ Populaire',
      plans: [
        { dur: '5 sec',  fmt: 'Format court',     price: 69,  shots: 2, voix: false, fmts: '9:16 · 1:1',         maxFmts: 2, featured: false },
        { dur: '8 sec',  fmt: 'Format reel',      price: 89,  shots: 3, voix: false, fmts: '9:16 · 1:1',         maxFmts: 2, featured: false },
        { dur: '10 sec', fmt: 'Format pub',       price: 109, shots: 3, voix: true,  fmts: '9:16 · 1:1 · 16:9', maxFmts: 3, featured: true  },
        { dur: '12 sec', fmt: 'Format narration', price: 129, shots: 4, voix: true,  fmts: '9:16 · 1:1 · 16:9', maxFmts: 3, featured: false },
        { dur: '15 sec', fmt: 'Format histoire',  price: 159, shots: 4, voix: true,  fmts: '9:16 · 1:1 · 16:9', maxFmts: 3, featured: false },
      ],
      perks: {
        shots:   (n: number, max: number, fmts: string) => `${n} shots · ${max} formats au choix`,
        script:  'Script IA + storyboard complet',
        music:   'Musique de fond + bruitages',
        lipsync: 'Lip sync · voix off ou dialogue',
        subs:    'Sous-titres inclus',
        voix:    'Voix-off au montage',
        model:   'Comédien IA sur mesure',
        modelIncluded: 'comédien inclus',
      },
      orderFeatured: 'Commander →',
      orderDefault:  'Commander',
      footer: 'MP4 livré par e-mail · Paiement sécurisé Stripe',
    },

    // ── Portfolio ────────────────────────────────────────────────────────────
    portfolio: {
      label:    'Réalisations',
      h2a:      'Créé avec ScenIQ',
      h2b:      'Seedance 2.0',
      sub:      'Produit 3D, action, lifestyle, animation, B2B. Tout ce qu\'une agence produit — généré en 48h.',
      hint:     'Glisser ou swiper',
      footer:   '✦ Vidéos générées via Seedance 2.0 · formats 9:16 · 1:1 · 16:9',
    },

    // ── Testimonials ─────────────────────────────────────────────────────────
    testimonials: {
      label: 'Témoignages',
      h2a:   'Ce que disent',
      h2b:   'les marques.',
      items: [
        { init: 'M', color: '#7C5CFC', name: 'Marie D.',  role: 'Responsable marketing · Bloom Studio', verified: true,  em: 'Reçu en 36h, exactement ce qu\'on voulait.', pre: '"Brief en 3 lignes. ', post: ' Une itération sur le texte, c\'était réglé. On refait."' },
        { init: 'T', color: '#059669', name: 'Thomas L.', role: 'Fondateur · Kōda',                      verified: true,  em: '109€ pour une pub 10s prête pour Meta Ads.', pre: '"Je croyais qu\'il fallait un budget agence. ', post: ' Meilleur CPM qu\'on ait eu ce trimestre."' },
        { init: 'S', color: '#D97706', name: 'Sophie R.', role: 'CMO · Maison Velours',                  verified: true,  em: 'Brief, paiement, call créa, livraison.', pre: '"Quatre étapes, zéro friction. ', post: ' On intègre ça dans chaque lancement produit."' },
        { init: 'A', color: '#DC2626', name: 'Alexis M.', role: 'Directeur créatif · Studio Arkhe',      verified: false, em: 'La question n\'est plus là.', pre: '"On était sceptiques sur l\'IA pour la vidéo. ', post: ' Le client a demandé une deuxième vidéo avant même la livraison."' },
      ],
    },

    // ── FAQ ──────────────────────────────────────────────────────────────────
    faq: {
      label: 'FAQ',
      h2:    'Questions fréquentes.',
      sub:   'Tout ce qu\'il faut savoir avant de commander.',
      left: [
        { q: 'Comment se déroule le processus exactement ?',         a: 'Vous commandez en ligne et remplissez un brief en 2 lignes. On vous rappelle sous 4h ouvrées pour aligner la direction créative. Les 5 agents IA génèrent la pré-prod en parallèle. La vidéo finale vous est envoyée par e-mail sous 48h.' },
        { q: 'Qu\'est-ce qui est livré exactement ?',                a: 'Un fichier MP4 1080p envoyé directement par e-mail. Pas d\'espace client, pas de compte à créer. Les formats 9:16, 1:1 et 16:9 sont inclus selon la durée choisie — prêts pour Meta Ads, TikTok, YouTube et Instagram.' },
        { q: 'Combien de temps pour recevoir ma vidéo ?',            a: '48h après validation de la direction créative lors de l\'appel. Le délai court à partir de cet appel, pas du paiement. En pratique, la plupart des livraisons se font en moins de 48h.' },
        { q: 'Puis-je fournir des références visuelles ou musicales ?', a: 'Oui, c\'est même recommandé. Lors de la commande vous pouvez uploader des images, vidéos ou fichiers audio. Plus vos références sont précises, plus la cohérence visuelle de la vidéo est forte.' },
        { q: 'Dois-je créer un compte ?',                            a: 'Non. Vous commandez, vous payez, vous recevez votre MP4 par e-mail. Aucun compte, aucun espace client. Un outil self-service est prévu pour 2027.' },
      ],
      right: [
        { q: 'Puis-je inclure un modèle ou une influenceuse IA dans ma vidéo ?', a: 'Oui — c\'est une option à +49 € sur votre forfait. Vous décrivez le profil (âge, style, ambiance), ScenIQ génère le personnage IA sur mesure. Tous les personnages sont entièrement fictifs. Conformément au EU AI Act et à la loi française sur les influenceurs (juin 2023), une mention \'Image générée par IA\' est obligatoire sur vos publications. ScenIQ vous fournit cette mention dans chaque livraison.' },
        { q: 'Pourquoi Seedance 2.0 et pas Runway, Veo 3 ou Sora ?', a: 'Seedance 2.0 est le moteur vidéo de ByteDance — la même entreprise que TikTok, donc optimisé pour les formats courts et les cuts dynamiques. Trois avantages concrets : (1) rendu 1080p natif avec audio intégré dans le même appel. (2) architecture multi-shot en un seul prompt — la cohérence visuelle entre les plans est meilleure qu\'en assemblant des clips séparés. (3) vitesse de rendu : un clip 10s est généré en moins de 3 minutes.' },
        { q: 'Que se passe-t-il si le résultat ne me convient pas ?', a: '10 itérations sont incluses dans chaque commande. Si après 10 allers-retours nous n\'arrivons pas à un résultat satisfaisant, vous êtes intégralement remboursé. C\'est rare — ça ne nous est pas encore arrivé.' },
        { q: 'Quelle durée choisir pour ma publicité ?',              a: '5–8s pour des accroches Reels/Stories sans narration. 10s pour une pub Meta classique avec voix-off courte. 12–15s pour un format avec storytelling ou démonstration produit. En cas de doute, le 10s est le plus polyvalent.' },
        { q: 'Comment se passe l\'appel de direction créative ?',     a: 'Un appel téléphonique de 15–20 minutes maximum. On valide avec vous l\'axe créatif, la tonalité et les éventuelles contraintes de marque avant de lancer la génération. Pas de visio obligatoire, pas d\'outil tiers.' },
        { q: 'La vidéo peut-elle inclure une voix-off ?',             a: 'Oui, à partir du format 10s. Le Scriptwriter calibre le script à 2,2 mots par seconde. Pour les voix-off françaises, une couche dédiée est ajoutée au montage final, sans surcoût.' },
        { q: 'Quel mode de paiement est accepté ?',                   a: 'Paiement 100 % à la commande via Stripe (CB, Apple Pay, Google Pay). Pas d\'acompte, pas de paiement différé. Une facture est générée automatiquement après le paiement.' },
      ],
    },

    // ── Final CTA ────────────────────────────────────────────────────────────
    cta: {
      label: 'Prêt à commencer ?',
      h2a:   'Votre prochain clip vidéo.',
      h2b:   'Deux lignes. 48 heures.',
      sub:   'Un brief, un paiement, un appel. Pré-prod livrée sans réunion intermédiaire.',
      btn1:  'Commander ma vidéo →',
      btn2:  'Une question ?',
      note:  'Vous recevez votre MP4 par e-mail. Pas de compte, pas d\'espace client.',
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
      desc:     'Agence IA de production vidéo publicitaire. Cinq agents spécialisés — Director, Scriptwriter, Storyboarder, Music, Visual — livrent la pré-prod en 48h.',
      colService: 'Service',
      colFormats: 'Formats',
      colContact: 'Contact',
      links: {
        process:  'Comment ça marche',
        models:   'Comédiens IA',
        pricing:  'Tarifs',
        portfolio:'Réalisations',
        order:    'Commander',
        f5:       'Pub 5 secondes — 69 €',
        f8:       'Reel 8 secondes — 89 €',
        f10:      'Clip 10 secondes — 109 €',
        f12:      'Narration 12–15s',
        legal:    'Mentions légales',
        privacy:  'Confidentialité',
      },
      bottom1: '© 2026 ScenIQ · Tous droits réservés',
      bottom2: 'Outil self-service prévu pour 2027',
    },

    // ── Modal question ───────────────────────────────────────────────────────
    modal: {
      closeAria:   'Fermer',
      preLabel:    'Avant de commander',
      h3:          'Une question ?',
      sub:         'Pas encore prêt(e) à commander ? Posez-moi votre question directement — vous parlez à une vraie personne, pas à un bot.',
      phone:       '📞 07 56 80 88 31 — appel direct',
      labelName:   'Prénom',
      placeName:   'Marie',
      labelMsg:    'Votre question',
      placeMsg:    'Sur quoi souhaitez-vous des précisions ?',
      submit:      'Envoyer ma question',
      sentTitle:   'Message reçu 👋',
      sentSub:     'Je vous réponds personnellement sous 4h ouvrées. Si c\'est urgent, appelez directement.',
      sentClose:   'Fermer',
    },

    // ── Misc ─────────────────────────────────────────────────────────────────
    misc: {
      langSwitch:    'EN',
      mobileClose:   'Fermer',
      mobileMenuAria:'Menu navigation',
      burgerOpen:    'Ouvrir le menu',
      burgerClose:   'Fermer le menu',
    },

    // ── Checkout ─────────────────────────────────────────────────────────────
    checkout: {
      back:       '← Retour',
      stepLabels: ['Vidéos', 'Brief', 'Contact', 'Paiement'] as string[],
      langLabels: { fr:'Français', en:'Anglais', ja:'Japonais', es:'Espagnol', pt:'Portugais', id:'Indonésien', zh:'Chinois' } as Record<string,string>,
      durLabels:  { 5:'Court', 8:'Reel', 10:'Pub', 12:'Narration', 15:'Histoire' } as Record<number,string>,
      callDays:   ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as string[],
      callTimes:  [
        { label:'Matin',      range:'9h – 12h'  },
        { label:'Après-midi', range:'13h – 18h' },
        { label:'Soir',       range:'18h – 20h' },
      ],
      s0: {
        h1:  'Composez votre commande',
        sub: 'Ajoutez autant de vidéos que vous voulez — durées, quantités et options différentes dans une seule commande.',
        langLabel:   'Langue de la voix-off / dialogue',
        video:       (n: number) => `Vidéo ${n}`,
        durLabel:    'Durée',
        formatsLabel:'Formats livrés',
        selected:    (n: number, max: number) => `${n}/${max} sélectionnés`,
        formatsNote: (max: number) => `Jusqu'à ${max} formats inclus dans ce forfait — MP4 1080p pour chaque format choisi`,
        qtyLabel:    'Quantité',
        subtotal:    'Sous-total :',
        aiModel:     'Comédien IA sur mesure',
        aiModelPrice:(price: number) => `+${price} € / vidéo`,
        aiModelPh:   'Ex : Femme 28–35 ans, style urbain, peau claire, cheveux châtains mi-longs, regard direct, ambiance moderne.',
        addVideo:    '+ Ajouter une autre vidéo',
        totalVoice:  (n: number, voice: string) => `${n} vidéo${n > 1 ? 's' : ''} · Voix ${voice}`,
        totalFmts1:  (n: number, list: string) => `${n} format${n > 1 ? 's' : ''} inclus (${list})`,
        totalFmts2:  (n: number) => `${n} exports MP4 au total`,
        totalMeta:   '10 allers-retours · MP4 1080p sous 48h ·',
        continue:    'Continuer →',
      },
      s1: {
        h1:         'Votre brief en 2–5 lignes',
        sub:        'Marque, ton, message, contexte. Je m\'occupe du reste.',
        briefLabel: 'Brief',
        briefPh:    'Ex : Vidéo de lancement pour notre eau pétillante haut-de-gamme. Ton urbain et posé. Public 25-40 ans, grandes villes. On veut montrer la bouteille dans des contextes lifestyle — terrasse, bureau moderne, après-sport.',
        refsLabel:  'Références (facultatif) — 10 max, 4 MB total',
        dropZone:   'Glissez vos fichiers ici ou',
        dropLink:   'parcourir',
        dropTypes:  'Images · audio · vidéos · logo · charte graphique',
        continue:   'Continuer →',
      },
      s2: {
        h1:        'Vos coordonnées',
        sub:       'On vous rappelle sous 4 h ouvrées pour aligner la direction créative avant de lancer les agents.',
        fullName:  'Nom complet',
        fullNamePh:'Marie Dupont',
        email:     'Email',
        emailPh:   'marie@exemple.fr',
        phone:     'Téléphone',
        phonePh:   '+33 6 12 34 56 78',
        company:   'Société',
        companyPh: 'Agence Pixel',
        callSlot:  'Créneau préféré pour l\'appel',
        review:    'Vérifier ma commande →',
      },
      s3: {
        h1:         'Récap de votre commande',
        sub:        'Vérifiez avant de payer — vous serez redirigé vers Stripe.',
        videosHdr:  (voice: string) => `Vidéos commandées — Voix ${voice}`,
        videoRow:   (dur: number, label: string) => `Vidéo ${dur}s · ${label}`,
        aiLine:     '+ Comédien IA sur mesure',
        totalRow:   (n: number) => `${n} vidéo${n > 1 ? 's' : ''} · 10 allers-retours · MP4 sous 48h`,
        briefLabel: 'Brief',
        contactLbl: 'Contact',
        slotLbl:    'Créneau :',
        refsLbl:    (n: number) => `Références (${n} fichier${n > 1 ? 's' : ''})`,
        assurance:  '🔒 Paiement sécurisé Stripe · Confirmation email immédiate · On vous rappelle sous 4 h ouvrées · 10 allers-retours inclus · Remboursement intégral si la direction créative ne convient pas',
        uploading:  'Upload des références…',
        redirecting:'Redirection Stripe…',
        pay:        (price: number) => `Payer ${price} € →`,
        stripeNote: "Vous serez redirigé vers Stripe. Aucune carte n'est stockée sur nos serveurs.",
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  ENGLISH — native copy, not a word-for-word translation
  // ══════════════════════════════════════════════════════════════════════════
  en: {
    nav: {
      process:    'How it works',
      studio:     'The studio',
      models:     'AI Talent',
      pricing:    'Pricing',
      portfolio:  'Work',
      faq:        'FAQ',
      question:   'Got a question?',
      order:      'Order now →',
      orderMobile:'Order my video →',
    },

    hero: {
      badge:    'AI Studio',
      badgeSub: 'Custom short-form video — Shorts · Reels · Stories · Clips',
      h1a:      'From brief to screen.',
      h1b:      '48 hours.',
      sub:      'Five AI agents form a complete creative team. Write the brief, they deliver the full pre-production — script, storyboard, music, visuals — no meetings required.',
      cta1:     'Order my video →',
      cta2:     'See the work',
      footnote: 'Starting at €69 · 5 to 15 seconds · 10 revisions included',
    },

    trust: {
      label: 'Built for',
      items: ['Ad agencies', 'Startups', 'E-commerce', 'Creators', 'Individuals', 'Brand managers'],
    },

    process: {
      label: 'How it works',
      h2a:   'From brief to MP4.',
      h2b:   'Five steps.',
      sub:   'Write two lines and pay. ScenIQ handles the rest — no meetings, no endless back-and-forth.',
      steps: [
        { n: '1', title: 'Brief',    desc: 'Two lines about your brand and your goal. Add visual or audio references if you have them.' },
        { n: '2', title: 'Order',    desc: 'Choose your duration. 100% secure payment via Stripe. Instant email confirmation.' },
        { n: '3', title: 'Call',     desc: 'We call you back within 4 business hours to align on the creative direction before launching the agents.' },
        { n: '4', title: 'Pre-prod', desc: 'Director, Scriptwriter, Storyboarder, Music and Visual work in parallel. Pre-production delivered with no middleman.' },
        { n: '5', title: 'Delivery', desc: '1080p MP4 sent by email within 48h. No client portal, no account needed. 10 revisions included.' },
      ],
    },

    studio: {
      label: 'The studio',
      h2a:   'Five AI agents.',
      h2b:   'A full creative team.',
      sub:   'Each agent is specialized. Together, they cover everything a creative team normally takes days of meetings to produce — without you opening a single interface.',
      agents: [
        { name: 'Director',     desc: 'creative direction, brand positioning, defensible creative angle' },
        { name: 'Scriptwriter', desc: 'script calibrated at 2.2 words/sec, structured voice-over' },
        { name: 'Storyboarder', desc: 'shot-by-shot breakdown, multi-shot prompts for Seedance' },
        { name: 'Music',        desc: 'musical direction with precise BPM and real licensable references' },
        { name: 'Visual',       desc: 'hex palette, typography, lighting — directly executable spec' },
      ],
      videoAria: 'Play volt video',
    },

    seedance: {
      label: 'Seedance 2.0 by ByteDance',
      h2a:   'Video generation.',
      h2b:   'One prompt. One clip delivered.',
      sub:   'The Storyboarder produces a unified multi-shot prompt. One Seedance 2.0 call generates the already-edited video — visual consistency guaranteed across every shot, no post-production or manual assembly.',
      features: [
        'Native 1080p resolution — broadcast quality, not upscaled 720p',
        'Native audio included — sound design and voice-over generated in the same render',
        'Multi-shot in a single call — 2 to 4 shots per duration, already edited',
        '9:16, 1:1 and 16:9 formats included — ready for Meta Ads, TikTok and YouTube',
      ],
      note:    'Clips generated via Seedance 2.0 from a 2-line brief',
      aria169: 'Play 16:9 example in full screen',
      aria916: 'Play 9:16 example in full screen',
    },

    stats: [
      { num: '48h',  label: 'Guaranteed delivery',    sub: 'From brief to final MP4' },
      { num: '5',    label: 'AI agents in parallel',  sub: 'Concept · Script · Storyboard · Mood · Visual' },
      { num: '1080p',label: 'Native quality',          sub: 'Seedance 2.0 Pro — no compression' },
      { num: 'MP4',  label: 'Format delivered',        sub: 'Ready for Meta Ads · TikTok · YouTube' },
    ],

    models: {
      label: 'AI Talent',
      h2a:   'An AI performer.',
      h2b:   'Built for your brand.',
      sub:   'One brief is all it takes. ScenIQ generates the performer, integrates them into the clip, and delivers the required legal disclosure. Nothing else to manage.',
      features: [
        { label: 'No casting, no fees',       desc: 'no model contract, no image rights to negotiate' },
        { label: 'No agency rates',           desc: '€800–3,000 in agency casting — €49 here, within your package' },
        { label: 'Available on demand',       desc: 'reframed, reworked or replaced at every revision' },
        { label: 'Legal disclosure included', desc: 'compliant with EU AI Act + French influencer law — delivered in writing with your MP4' },
      ],
      disclaimer:   'All characters are entirely fictional — no resemblance to any real person. The "AI-generated image" disclosure is mandatory on your publications (EU AI Act art. 50 · FR law June 9, 2023). ScenIQ provides this disclosure with every delivery.',
      cta1:         'See clips with AI performers →',
      cta2:         'Add the option · +€49',
      renderLabel:  'Sample render',
      kaelysType:   'AI performer · influencer style',
      modelTypes:   ['Tech · Urban', 'Business'],
      noteIcon:     '💡',
      note:         'These visuals are sample renders — your AI performer is generated on demand based on your description (age, style, vibe, outfit).',
      noteHighlight:'sample renders',
    },

    pricing: {
      label:       'Pricing',
      h2:          'One price. No surprises.',
      sub:         'Choose your duration. Every package includes the complete production — script, storyboard, music and final 1080p MP4. Delivered within 48h.',
      subHighlight:'the complete production',
      langLine:    'Lip sync · voice-over or dialogue · subtitles · 🇫🇷 🇺🇸 🇯🇵 🇪🇸 🇧🇷 🇮🇩 🇨🇳',
      toggleTitle: 'Add an AI performer',
      toggleDesc:  'Custom-generated character based on your description',
      togglePrice: '+€49',
      toggleNote:  '✓ "AI-generated image" disclosure provided · EU AI Act compliant',
      badge:       '⭐ Popular',
      plans: [
        { dur: '5 sec',  fmt: 'Short format',     price: 69,  shots: 2, voix: false, fmts: '9:16 · 1:1',         maxFmts: 2, featured: false },
        { dur: '8 sec',  fmt: 'Reel format',      price: 89,  shots: 3, voix: false, fmts: '9:16 · 1:1',         maxFmts: 2, featured: false },
        { dur: '10 sec', fmt: 'Ad format',        price: 109, shots: 3, voix: true,  fmts: '9:16 · 1:1 · 16:9', maxFmts: 3, featured: true  },
        { dur: '12 sec', fmt: 'Narration format', price: 129, shots: 4, voix: true,  fmts: '9:16 · 1:1 · 16:9', maxFmts: 3, featured: false },
        { dur: '15 sec', fmt: 'Story format',     price: 159, shots: 4, voix: true,  fmts: '9:16 · 1:1 · 16:9', maxFmts: 3, featured: false },
      ],
      perks: {
        shots:         (n: number, max: number, fmts: string) => `${n} shots · ${max} formats to choose from`,
        script:        'AI script + complete storyboard',
        music:         'Background music + sound effects',
        lipsync:       'Lip sync · voice-over or dialogue',
        subs:          'Subtitles included',
        voix:          'Voice-over at final edit',
        model:         'Custom AI performer',
        modelIncluded: 'performer included',
      },
      orderFeatured: 'Order →',
      orderDefault:  'Order',
      footer: 'MP4 delivered by email · Secure Stripe payment',
    },

    portfolio: {
      label:  'Work',
      h2a:    'Made with ScenIQ',
      h2b:    'Seedance 2.0',
      sub:    '3D product, action, lifestyle, animation, B2B. Everything an agency produces — generated in 48h.',
      hint:   'Drag or swipe',
      footer: '✦ Videos generated via Seedance 2.0 · formats 9:16 · 1:1 · 16:9',
    },

    testimonials: {
      label: 'Testimonials',
      h2a:   'What brands',
      h2b:   'are saying.',
      items: [
        { init: 'M', color: '#7C5CFC', name: 'Marie D.',  role: 'Marketing Manager · Bloom Studio',    verified: true,  em: 'Delivered in 36h, exactly what we wanted.', pre: '"Three-line brief. ', post: ' One text revision and it was done. We\'re ordering again."' },
        { init: 'T', color: '#059669', name: 'Thomas L.', role: 'Founder · Kōda',                      verified: true,  em: '€109 for a 10-second ad ready for Meta Ads.', pre: '"I thought you needed an agency budget. ', post: ' Best CPM we\'ve had this quarter."' },
        { init: 'S', color: '#D97706', name: 'Sophie R.', role: 'CMO · Maison Velours',                verified: true,  em: 'Brief, payment, creative call, delivery.', pre: '"Four steps, zero friction. ', post: ' We\'re integrating this into every product launch."' },
        { init: 'A', color: '#DC2626', name: 'Alexis M.', role: 'Creative Director · Studio Arkhe',    verified: false, em: 'The question is no longer relevant.', pre: '"We were skeptical about AI for video. ', post: ' The client asked for a second video before the first one even landed."' },
      ],
    },

    faq: {
      label: 'FAQ',
      h2:    'Common questions.',
      sub:   'Everything you need to know before ordering.',
      left: [
        { q: 'How does the process work, exactly?',         a: 'You order online and submit a 2-line brief. We call you back within 4 business hours to align on the creative direction. The 5 AI agents generate the full pre-production in parallel. The final video is sent to you by email within 48 hours.' },
        { q: 'What exactly do I receive?',                  a: 'A 1080p MP4 file sent directly by email. No client portal, no account required. The 9:16, 1:1 and 16:9 formats are included depending on your chosen duration — ready for Meta Ads, TikTok, YouTube and Instagram.' },
        { q: 'How long until I receive my video?',          a: '48 hours after we align on the creative direction during the call. The clock starts from that call, not the payment. In practice, most deliveries happen in under 48 hours.' },
        { q: 'Can I provide visual or music references?',   a: 'Yes — and we recommend it. During checkout you can upload images, videos or audio files. The more specific your references, the stronger the visual consistency of your video.' },
        { q: 'Do I need to create an account?',             a: 'No. You order, you pay, you receive your MP4 by email. No account, no client portal. A self-service tool is planned for 2027.' },
      ],
      right: [
        { q: 'Can I include an AI model or influencer in my video?',  a: 'Yes — it\'s an add-on at +€49 on your package. You describe the profile (age, style, vibe), ScenIQ generates the AI character on demand. All characters are entirely fictional. In accordance with the EU AI Act and French influencer law (June 2023), an "AI-generated image" disclosure is mandatory on your publications. ScenIQ provides this with every delivery.' },
        { q: 'Why Seedance 2.0 and not Runway, Veo 3 or Sora?',      a: 'Seedance 2.0 is ByteDance\'s video engine — the same company as TikTok, purpose-built for short-form content and dynamic cuts. Three concrete advantages: (1) native 1080p render with audio in the same call, where others charge separately. (2) multi-shot architecture from a single prompt — visual consistency is better than assembling separate clips. (3) render speed: a 10-second clip is ready in under 3 minutes.' },
        { q: 'What if I\'m not happy with the result?',               a: '10 revisions are included with every order. If after 10 rounds we can\'t reach a result you\'re satisfied with, you get a full refund. It\'s rare — it hasn\'t happened yet.' },
        { q: 'Which duration should I choose?',                        a: '5–8s for Reels/Stories hooks with no narration. 10s for a standard Meta ad with a short voice-over. 12–15s for storytelling or product demos. When in doubt, 10s is the most versatile.' },
        { q: 'What happens on the creative direction call?',           a: 'A 15–20 minute phone call — no video required, no third-party tool. We align on the creative angle, tone and any brand constraints before launching the generation.' },
        { q: 'Can the video include a voice-over?',                    a: 'Yes, from the 10-second format. The Scriptwriter calibrates the script at 2.2 words per second. For French voice-overs, a dedicated layer is added at the final edit, at no extra charge.' },
        { q: 'What payment methods do you accept?',                    a: 'Full payment at checkout via Stripe (card, Apple Pay, Google Pay). No deposit, no deferred payment. An invoice is generated automatically after payment.' },
      ],
    },

    cta: {
      label: 'Ready to start?',
      h2a:   'Your next video clip.',
      h2b:   'Two lines. 48 hours.',
      sub:   'One brief, one payment, one call. Pre-production delivered without a single meeting.',
      btn1:  'Order my video →',
      btn2:  'Got a question?',
      note:  'You receive your MP4 by email. No account, no client portal.',
    },

    footer: {
      desc:       'AI video production studio. Five specialized agents — Director, Scriptwriter, Storyboarder, Music, Visual — deliver the full pre-production in 48h.',
      colService: 'Service',
      colFormats: 'Formats',
      colContact: 'Contact',
      links: {
        process:  'How it works',
        models:   'AI Talent',
        pricing:  'Pricing',
        portfolio:'Work',
        order:    'Order',
        f5:       '5-second spot — €69',
        f8:       '8-second reel — €89',
        f10:      '10-second clip — €109',
        f12:      '12–15s narration',
        legal:    'Legal notice',
        privacy:  'Privacy',
      },
      bottom1: '© 2026 ScenIQ · All rights reserved',
      bottom2: 'Self-service tool planned for 2027',
    },

    modal: {
      closeAria:   'Close',
      preLabel:    'Before ordering',
      h3:          'Got a question?',
      sub:         'Not quite ready to order? Ask me directly — you\'re talking to a real person, not a bot.',
      phone:       '📞 +33 7 56 80 88 31 — call directly',
      labelName:   'First name',
      placeName:   'Alex',
      labelMsg:    'Your question',
      placeMsg:    'What would you like to know?',
      submit:      'Send my question',
      sentTitle:   'Message received 👋',
      sentSub:     'I\'ll get back to you personally within 4 business hours. If it\'s urgent, call directly.',
      sentClose:   'Close',
    },

    misc: {
      langSwitch:    'FR',
      mobileClose:   'Close',
      mobileMenuAria:'Navigation menu',
      burgerOpen:    'Open menu',
      burgerClose:   'Close menu',
    },

    // ── Checkout ─────────────────────────────────────────────────────────────
    checkout: {
      back:       '← Back',
      stepLabels: ['Videos', 'Brief', 'Contact', 'Payment'] as string[],
      langLabels: { fr:'French', en:'English', ja:'Japanese', es:'Spanish', pt:'Portuguese', id:'Indonesian', zh:'Chinese' } as Record<string,string>,
      durLabels:  { 5:'Short', 8:'Reel', 10:'Ad', 12:'Narration', 15:'Story' } as Record<number,string>,
      callDays:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as string[],
      callTimes:  [
        { label:'Morning',   range:'9am – 12pm' },
        { label:'Afternoon', range:'1pm – 6pm'  },
        { label:'Evening',   range:'6pm – 8pm'  },
      ],
      s0: {
        h1:  'Build your order',
        sub: 'Add as many videos as you need — different durations, quantities and options in a single order.',
        langLabel:   'Voice-over / dialogue language',
        video:       (n: number) => `Video ${n}`,
        durLabel:    'Duration',
        formatsLabel:'Delivered formats',
        selected:    (n: number, max: number) => `${n}/${max} selected`,
        formatsNote: (max: number) => `Up to ${max} formats included in this package — 1080p MP4 for each selected format`,
        qtyLabel:    'Quantity',
        subtotal:    'Subtotal:',
        aiModel:     'Custom AI performer',
        aiModelPrice:(price: number) => `+€${price} / video`,
        aiModelPh:   'e.g. Woman 28–35, urban style, light skin, medium brown hair, direct gaze, modern vibe.',
        addVideo:    '+ Add another video',
        totalVoice:  (n: number, voice: string) => `${n} video${n > 1 ? 's' : ''} · Voice ${voice}`,
        totalFmts1:  (n: number, list: string) => `${n} format${n > 1 ? 's' : ''} included (${list})`,
        totalFmts2:  (n: number) => `${n} MP4 exports total`,
        totalMeta:   '10 revisions · 1080p MP4 within 48h ·',
        continue:    'Continue →',
      },
      s1: {
        h1:         'Your brief in 2–5 lines',
        sub:        "Brand, tone, message, context. I'll handle the rest.",
        briefLabel: 'Brief',
        briefPh:    'e.g. Launch video for our premium sparkling water. Urban, understated tone. Audience 25–40, city dwellers. Show the bottle in lifestyle contexts — terrace, modern office, post-workout.',
        refsLabel:  'References (optional) — 10 max, 4 MB total',
        dropZone:   'Drop your files here or',
        dropLink:   'browse',
        dropTypes:  'Images · audio · videos · logo · brand guidelines',
        continue:   'Continue →',
      },
      s2: {
        h1:        'Your contact details',
        sub:       "We'll call you back within 4 business hours to align on the creative direction before launching the agents.",
        fullName:  'Full name',
        fullNamePh:'Alex Martin',
        email:     'Email',
        emailPh:   'alex@company.com',
        phone:     'Phone',
        phonePh:   '+1 555 234 5678',
        company:   'Company',
        companyPh: 'Pixel Agency',
        callSlot:  'Preferred call time',
        review:    'Review my order →',
      },
      s3: {
        h1:         'Order summary',
        sub:        "Check before paying — you'll be redirected to Stripe.",
        videosHdr:  (voice: string) => `Videos ordered — Voice ${voice}`,
        videoRow:   (dur: number, label: string) => `Video ${dur}s · ${label}`,
        aiLine:     '+ Custom AI performer',
        totalRow:   (n: number) => `${n} video${n > 1 ? 's' : ''} · 10 revisions · MP4 within 48h`,
        briefLabel: 'Brief',
        contactLbl: 'Contact',
        slotLbl:    'Slot:',
        refsLbl:    (n: number) => `References (${n} file${n > 1 ? 's' : ''})`,
        assurance:  "🔒 Secure Stripe payment · Instant email confirmation · We call you back within 4 business hours · 10 revisions included · Full refund if the creative direction doesn't work",
        uploading:  'Uploading references…',
        redirecting:'Redirecting to Stripe…',
        pay:        (price: number) => `Pay €${price} →`,
        stripeNote: "You'll be redirected to Stripe. No card details are stored on our servers.",
      },
    },
  },
} as const

export type Translations = typeof translations.fr
