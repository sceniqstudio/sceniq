'use client'

import { SignIn, useClerk, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Page Sign-in robuste contre les "sessions zombies" :
// si Clerk JS croit qu'on est signed-in mais le serveur Next nous a renvoyés
// sur /sign-in (donc côté serveur on ne l'est PAS), on force un signOut() client
// puis on laisse l'user se reconnecter proprement.

export default function SignInPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const clerk = useClerk()
  const [forcedSignOut, setForcedSignOut] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && !forcedSignOut) {
      // Session zombie : on est sur /sign-in alors que Clerk JS dit signed-in.
      // Le middleware Next nous a redirigés ici → côté serveur on n'est PAS authentifié.
      // On purge la session côté client pour casser la boucle.
      void clerk.signOut().then(() => {
        setForcedSignOut(true)
      })
    } else if (isSignedIn && forcedSignOut) {
      // Au cas où signOut ne marche pas (cas rare), on retente côté URL
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, clerk, router, forcedSignOut])

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#9CA3AF' }}>
        Chargement…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24, background: '#0a0a14' }}>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#7C5CFC',
            colorBackground: '#13121f',
            colorInputBackground: '#1a1927',
            colorInputText: '#f5f2ec',
            colorText: '#f5f2ec',
            colorTextSecondary: 'rgba(245,242,236,0.55)',
            colorNeutral: '#f5f2ec',
            borderRadius: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
          elements: {
            card: {
              boxShadow: '0 0 0 1px rgba(124,92,252,0.18), 0 24px 64px rgba(0,0,0,0.5)',
              border: '1px solid rgba(124,92,252,0.15)',
            },
            headerTitle: { color: '#fff' },
            headerSubtitle: { color: 'rgba(245,242,236,0.55)' },
            socialButtonsBlockButton: {
              background: '#1a1927',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f5f2ec',
            },
            dividerLine: { background: 'rgba(255,255,255,0.08)' },
            dividerText: { color: 'rgba(245,242,236,0.35)' },
            formFieldLabel: { color: 'rgba(245,242,236,0.7)' },
            formFieldInput: {
              background: '#1a1927',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#f5f2ec',
            },
            footerActionLink: { color: '#A5B4FC' },
            identityPreviewText: { color: '#f5f2ec' },
            identityPreviewEditButton: { color: '#A5B4FC' },
          },
        }}
      />
    </div>
  )
}
