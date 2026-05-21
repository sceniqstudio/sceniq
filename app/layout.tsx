import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import './landing-v2.css'

// ── Constantes SEO ────────────────────────────────────────────────────────────
const SITE_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sceniq-ashen.vercel.app'
const SITE_NAME = 'ScenIQ'
const TITLE     = 'ScenIQ — Vidéos publicitaires IA en 48h'
const DESC      = 'Donnez-moi votre brief en 2 lignes. Cinq agents IA spécialisés (Director, Scriptwriter, Storyboarder, Music, Visual) génèrent le concept, le script, le storyboard et les clips Seedance 2.0 — livrés en 48h. Forfaits 69–159 €.'

// ── Metadata Next.js ─────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESC,
  keywords: [
    'vidéo publicitaire IA',
    'agence vidéo intelligence artificielle',
    'Seedance 2.0',
    'génération vidéo IA',
    'reel publicitaire',
    'clip vidéo agence pub',
    'production vidéo automatisée',
    'ScenIQ',
    'vidéo Meta Ads IA',
    'storyboard IA',
  ],
  authors: [{ name: 'Pascal Ekloui', url: SITE_URL }],
  creator: 'ScenIQ',
  publisher: 'ScenIQ',

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    type:        'website',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       TITLE,
    description: DESC,
    locale:      'fr_FR',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'ScenIQ — Vidéos publicitaires IA en 48h',
      },
    ],
  },

  // ── Twitter / X Card ───────────────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESC,
    images:      ['/og-image.png'],
    creator:     '@sceniqstudio',
  },

  // ── Favicons ───────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon-16x16.png',  sizes: '16x16',  type: 'image/png' },
      { url: '/favicon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/favicon-96x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/favicon.ico',        sizes: 'any' },
    ],
    apple:   [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other:   [
      { rel: 'icon', url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },

  // ── PWA Manifest ───────────────────────────────────────────────────────────
  manifest: '/site.webmanifest',

  // ── Robots ─────────────────────────────────────────────────────────────────
  robots: {
    index:        true,
    follow:       true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  // ── Verification (à compléter quand domaine final configuré) ──────────────
  // verification: { google: 'XXXX', yandex: 'XXXX' },

  // ── Alternate languages ────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
    languages: { 'fr-FR': SITE_URL, 'en-GB': SITE_URL },
  },
}

// ── JSON-LD Structured Data (SEO + GEO) ──────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // Service principal
    {
      '@type':       'Service',
      '@id':         `${SITE_URL}/#service`,
      name:          'ScenIQ — Production vidéo publicitaire IA',
      description:   'Agence IA de production vidéo publicitaire. Brief en 2 lignes → 5 agents spécialisés → clips Seedance 2.0 en 48h. Formats 5s à 15s, ratio 9:16 / 1:1 / 16:9.',
      url:           SITE_URL,
      provider: {
        '@type': 'LocalBusiness',
        name:    'ScenIQ',
        email:   'support@sceniq.studio',
        telephone: '+33756808831',
        address: { '@type': 'PostalAddress', addressCountry: 'FR' },
        priceRange: '€€',
        openingHours: 'Mo-Fr 09:00-18:00',
      },
      offers: [
        {
          '@type':           'Offer',
          name:              'Clip 5 secondes',
          description:       'Vidéo publicitaire IA 5 secondes, Seedance 2.0, 1080p, livraison 48h',
          price:             '69',
          priceCurrency:     'EUR',
          availability:      'https://schema.org/InStock',
          url:               `${SITE_URL}/commande`,
        },
        {
          '@type':           'Offer',
          name:              'Reel 8 secondes',
          description:       'Vidéo publicitaire IA 8 secondes, Seedance 2.0, 1080p, livraison 48h',
          price:             '89',
          priceCurrency:     'EUR',
          availability:      'https://schema.org/InStock',
          url:               `${SITE_URL}/commande`,
        },
        {
          '@type':           'Offer',
          name:              'Clip 10 secondes',
          description:       'Vidéo publicitaire IA 10 secondes, Seedance 2.0, 1080p, livraison 48h',
          price:             '109',
          priceCurrency:     'EUR',
          availability:      'https://schema.org/InStock',
          url:               `${SITE_URL}/commande`,
        },
        {
          '@type':           'Offer',
          name:              'Narration 12–15 secondes',
          description:       'Vidéo narrative IA 12 à 15 secondes, Seedance 2.0, 1080p, livraison 48h',
          price:             '159',
          priceCurrency:     'EUR',
          availability:      'https://schema.org/InStock',
          url:               `${SITE_URL}/commande`,
        },
      ],
      areaServed: { '@type': 'Country', name: 'France' },
      inLanguage: 'fr-FR',
    },

    // WebSite (pour le sitelinks searchbox)
    {
      '@type':        'WebSite',
      '@id':          `${SITE_URL}/#website`,
      url:            SITE_URL,
      name:           SITE_NAME,
      description:    DESC,
      inLanguage:     ['fr-FR', 'en-GB'],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },

    // Organization
    {
      '@type':    'Organization',
      '@id':      `${SITE_URL}/#organization`,
      name:       SITE_NAME,
      url:        SITE_URL,
      logo: {
        '@type':  'ImageObject',
        url:      `${SITE_URL}/favicon-512x512.png`,
        width:    512,
        height:   512,
      },
      contactPoint: {
        '@type':             'ContactPoint',
        telephone:           '+33-7-56-80-88-31',
        contactType:         'customer support',
        availableLanguage:   ['French', 'English'],
      },
      sameAs: [],
    },

    // FAQPage (GEO — aide les LLMs à extraire les réponses directes)
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Combien coûte une vidéo publicitaire IA avec ScenIQ ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les forfaits ScenIQ vont de 69 € pour un clip 5s à 159 € pour une narration 12-15s. Prix HT, paiement sécurisé par Stripe, livraison en 48h.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment fonctionne la production vidéo IA chez ScenIQ ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Vous soumettez un brief en 2 lignes. Cinq agents IA spécialisés (Director, Scriptwriter, Storyboarder, Music Supervisor, Visual Director) travaillent en parallèle pour produire concept, script et storyboard. Seedance 2.0 génère ensuite les clips vidéo 1080p. Vous recevez votre MP4 par email sous 48h.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quels formats vidéo propose ScenIQ ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ScenIQ produit des vidéos en format 9:16 (vertical Stories/Reels), 1:1 (carré) et 16:9 (horizontal). Durées disponibles : 5, 8, 10, 12 et 15 secondes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quelle technologie utilise ScenIQ pour générer les vidéos ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ScenIQ utilise Seedance 2.0 (BytePlus/ByteDance), le modèle de génération vidéo de référence en 1080p. Les agents IA créatifs sont propulsés par Claude (Anthropic).',
          },
        },
        {
          '@type': 'Question',
          name: 'Les vidéos ScenIQ sont-elles utilisables pour Meta Ads et TikTok ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. ScenIQ livre des MP4 1080p directement exploitables pour Meta Ads (Facebook/Instagram), TikTok, YouTube Shorts et toute autre plateforme. Le ratio vertical 9:16 est optimisé pour les formats Reels et Stories.',
          },
        },
      ],
    },
  ],
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
