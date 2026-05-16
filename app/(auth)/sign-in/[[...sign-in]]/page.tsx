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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <SignIn />
    </div>
  )
}
