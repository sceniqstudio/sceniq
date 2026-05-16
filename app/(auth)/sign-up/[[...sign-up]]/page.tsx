'use client'

import { SignUp, useClerk, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const clerk = useClerk()
  const [forcedSignOut, setForcedSignOut] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && !forcedSignOut) {
      void clerk.signOut().then(() => setForcedSignOut(true))
    } else if (isSignedIn && forcedSignOut) {
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
      <SignUp />
    </div>
  )
}
