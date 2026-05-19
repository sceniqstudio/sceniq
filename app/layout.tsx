import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import './landing-v2.css'

// Note : on garde TOUJOURS le <ClerkProvider> — la landing (app/page.tsx) utilise
// <SignInButton> / <SignUpButton> qui crashent sans ce contexte.
// Le bypass d'auth en mode sandbox se fait au niveau du middleware (cf. middleware.ts).

export const metadata: Metadata = {
  title: 'ScenIQ — Vidéos IA pour agences',
  description:
    'Brief → 5 agents IA → clips Seedance 2.0 → dossier de production. La première vidéo en moins de 4 minutes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'ScenIQ — Vidéos IA pour agences',
    description:
      'Décrivez votre vidéo. 5 agents IA spécialisés écrivent concept, script, storyboard et direction artistique — Seedance 2.0 génère les clips.',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
