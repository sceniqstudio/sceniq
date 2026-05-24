'use client'
// app/_components/LegalHeader.tsx
// Header partagé pour les pages légales (mentions légales, confidentialité)

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LegalHeader() {
  const router = useRouter()

  return (
    <nav style={{
      position:        'sticky',
      top:             0,
      zIndex:          100,
      background:      'rgba(7,7,15,0.88)',
      backdropFilter:  'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      borderBottom:    '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        maxWidth:       '1160px',
        margin:         '0 auto',
        padding:        '0 32px',
        height:         '80px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '16px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/sceniq-logo-dark.svg" alt="ScenIQ" style={{ height: 44, width: 'auto', display: 'block' }} />
        </Link>

        {/* Retour */}
        <button
          onClick={() => router.back()}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '8px',
            background:     'rgba(255,255,255,0.08)',
            border:         '1px solid rgba(255,255,255,0.15)',
            borderRadius:   '10px',
            padding:        '12px 22px',
            color:          'rgba(255,255,255,0.9)',
            fontSize:       '15px',
            fontWeight:     600,
            cursor:         'pointer',
            transition:     'background 0.15s',
            letterSpacing:  '-0.2px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          ← Retour
        </button>
      </div>
    </nav>
  )
}
