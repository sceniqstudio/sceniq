// app/commande/page.tsx
//
// PAGE PLACEHOLDER — sera remplacée par le vrai checkout multi-step dans le prochain commit.
// Pour l'instant : un message clair + un mailto enrichi pour que les visiteurs intéressés
// puissent quand même envoyer leur brief en attendant la mise en ligne du checkout Stripe.

import Link from 'next/link'

export const metadata = {
  title: 'Lancer ma vidéo — ScenIQ',
  description: 'Configurez votre vidéo, envoyez votre brief, je vous rappelle sous 4 h ouvrées.',
}

export default function CommandePage() {
  const mailtoHref = `mailto:support@sceniq.studio?subject=${encodeURIComponent(
    'Lancer ma vidéo — ScenIQ',
  )}&body=${encodeURIComponent(
    'Bonjour Pascal,\n\n' +
    "Je souhaite lancer ma vidéo. Voici les éléments :\n\n" +
    '— Mon brief (2-3 lignes) :\n\n\n' +
    '— Format souhaité (21:9, 16:9, 4:3, 1:1, 3:4, 9:16) :\n\n' +
    '— Durée souhaitée (5, 8, 10, 12 ou 15 sec) :\n\n' +
    '— Marque / contexte :\n\n' +
    '— Mes coordonnées :\n' +
    '  · Nom complet : \n' +
    '  · Société : \n' +
    '  · Téléphone (pour le rappel) : \n' +
    '  · Créneau préféré (matin / après-midi / soir) : \n\n' +
    '— Je vous transmets mes références (logo, charte, visuels, audio) par retour de mail.\n\n' +
    'Merci !',
  )}`

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a14',
        color: '#f5f2ec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        fontFamily: 'var(--f)',
      }}
    >
      <div style={{ maxWidth: 620, width: '100%', textAlign: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'rgba(255,255,255,.6)',
            textDecoration: 'none',
            marginBottom: 32,
          }}
        >
          ← Retour à l&apos;accueil
        </Link>

        <div
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#A5B4FC',
            background: 'rgba(165,180,252,.12)',
            padding: '5px 14px',
            borderRadius: 4,
            marginBottom: 22,
          }}
        >
          Checkout en cours de mise en ligne
        </div>

        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.1,
            marginBottom: 18,
            color: '#fff',
          }}
        >
          Le formulaire de commande arrive sous 48 h.
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,.78)',
            marginBottom: 36,
          }}
        >
          Je finalise le checkout sécurisé Stripe (paiement direct + upload de vos références). En
          attendant, envoyez-moi votre brief par email — je vous rappelle dans les 4 h ouvrées avec
          un créneau et toutes les étapes suivantes.
        </p>

        <a
          href={mailtoHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 28px',
            borderRadius: 8,
            background: '#A5B4FC',
            color: '#1E1B4B',
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: -0.1,
          }}
        >
          Envoyer mon brief par email →
        </a>

        <div
          style={{
            marginTop: 48,
            padding: '20px 24px',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 10,
            fontSize: 13,
            color: 'rgba(255,255,255,.65)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#fff' }}>Récap tarifs (HT, tout inclus)&nbsp;:</strong>
          <br />
          5s : 69&nbsp;€ &nbsp;·&nbsp; 8s : 89&nbsp;€ &nbsp;·&nbsp; 10s : 109&nbsp;€ &nbsp;·&nbsp;
          12s : 129&nbsp;€ &nbsp;·&nbsp; 15s : 159&nbsp;€
          <br />
          Tous formats inclus · 10 itérations · Livraison sous 48 h après validation
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 12,
            color: 'rgba(255,255,255,.45)',
          }}
        >
          Email direct&nbsp;:{' '}
          <a
            href="mailto:support@sceniq.studio"
            style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'underline' }}
          >
            support@sceniq.studio
          </a>
        </div>
      </div>
    </main>
  )
}
