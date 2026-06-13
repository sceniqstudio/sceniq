/**
 * ScenIQ — logo mark
 * Gem — carré tourné 14° avec dégradé indigo clair → indigo profond.
 * Spark (étoile 4 branches) centré en blanc pour l'accent IA.
 * Ombre au sol elliptique floutée pour la profondeur.
 *
 * Le viewBox 0 0 60 60 permet d'afficher le mark à n'importe quelle taille.
 * useId() garantit des IDs SVG uniques quand plusieurs instances coexistent dans la page.
 */
'use client'

import { useId } from 'react'

interface LogoMarkProps {
  size?:      number   // px — default 34
  className?: string
  /** À passer à true si le logo n'a pas de texte associé à côté (ex: favicon) */
  decorative?: boolean
}

export function LogoMark({ size = 34, className = '', decorative = true }: LogoMarkProps) {
  const uid = useId()
  const gradId    = `sceniq-grad-${uid}`
  const shadowId  = `sceniq-shadow-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : 'ScenIQ'}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#9EA2FA" />
          <stop offset="55%"  stopColor="#6B6EF0" />
          <stop offset="100%" stopColor="#4448CC" />
        </linearGradient>
        <filter id={shadowId} x="-60%" y="-200%" width="220%" height="600%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      {/* GROUND SHADOW — ellipse horizontale floutée sous le gem */}
      <ellipse
        cx="31" cy="57" rx="12" ry="2.2"
        fill="#1E1B4B"
        opacity="0.55"
        filter={`url(#${shadowId})`}
      />

      {/* GEM — carré arrondi tourné 14° avec dégradé indigo (pivote en continu via .lv2-gem) */}
      <rect
        className="lv2-gem"
        x="10" y="10" width="40" height="40" rx="9"
        fill={`url(#${gradId})`}
        transform="rotate(14 30 30)"
      />

      {/* SPARK — étoile 4 branches avec cusps bezier (centre 30,30 R=13 d=6.5) */}
      <path
        d="M30,17 C30,23.5 36.5,30 43,30 C36.5,30 30,36.5 30,43 C30,36.5 23.5,30 17,30 C23.5,30 30,23.5 30,17 Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  )
}

/**
 * Logo complet (mark + wordmark "ScenIQ"), utilisé dans nav / sidebar.
 * Le wordmark utilise la classe .logo-name déjà stylée dans globals.css.
 * "IQ" est mis en évidence via le span interne (stylé en indigo dans globals.css).
 */
interface LogoProps {
  size?:      number
  className?: string
}

export function Logo({ size = 34, className = '' }: LogoProps) {
  return (
    <span className={`logo-inner ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <LogoMark size={size} className="logo-svg" />
      <span className="logo-name">
        Scen<span>IQ</span>
      </span>
    </span>
  )
}
