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
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Mark toupie */}
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#lg)"/>
            <path d="M16 4 C16 12 20 16 28 16 C20 16 16 20 16 28 C16 20 12 16 4 16 C12 16 16 12 16 4 Z" fill="white"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8485F8"/>
                <stop offset="1" stopColor="#4F52D8"/>
              </linearGradient>
            </defs>
          </svg>
          <span style={{
            fontSize:      '22px',
            fontWeight:    800,
            color:         '#fff',
            letterSpacing: '-0.6px',
          }}>
            ScenIQ
          </span>
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
