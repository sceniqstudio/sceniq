import Link from 'next/link'
import { ToastProvider } from '@/app/(app)/_components/Toast'
import { StudioModeWatcher } from '@/app/(app)/_components/StudioModeWatcher'
import { LogoMark } from '@/app/_components/Logo'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Mocks — en attente du wiring Clerk + Supabase
  const creditsBalance = 47
  const userInitials = 'PE'

  return (
    <ToastProvider>
    <StudioModeWatcher />
    <div className="app-shell">
      {/* Skip-link clavier — invisible jusqu'à focus */}
      <a href="#app-main" className="skip-link">
        Aller au contenu principal
      </a>

      {/* ── SIDEBAR ── */}
      <aside className="app-sidebar" aria-label="Navigation principale">
        <Link href="/" className="logo" aria-label="ScenIQ — Retour au site">
          <LogoMark size={34} className="logo-svg" />
          <span className="logo-name">
            Scen<span>IQ</span>
          </span>
        </Link>

        <ul className="app-nav">
          <li>
            <Link href="/dashboard">
              <span className="app-nav-ico">📁</span>
              Projets
            </Link>
          </li>
          <li>
            <Link href="/dashboard/brands">
              <span className="app-nav-ico">🏷️</span>
              Marques
            </Link>
          </li>
        </ul>

        <div className="app-nav-section">Compte</div>
        <ul className="app-nav">
          <li>
            <Link href="/dashboard/billing">
              <span className="app-nav-ico">💳</span>
              Facturation
            </Link>
          </li>
          <li>
            <Link href="/dashboard/settings">
              <span className="app-nav-ico">⚙️</span>
              Paramètres
            </Link>
          </li>
        </ul>

        <div className="app-sidebar-foot">
          <Link
            href="/"
            className="btn btn-g"
            style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
          >
            ← Retour site
          </Link>
        </div>
      </aside>

      {/* ── RIGHT COLUMN ── */}
      <div>
        {/* TOPBAR */}
        <header className="app-topbar">
          <div className="app-topbar-l">
            <span className="app-crumb">Espace agence</span>
            <span className="app-page-title">ScenIQ Studio</span>
          </div>
          <div className="app-topbar-r">
            <Link href="/dashboard/billing" className="app-credits">
              <span className="app-credits-dot"></span>
              <span className="app-credits-num">{creditsBalance}</span>
              crédits
            </Link>
            <div className="app-avatar" title="Pascal Ekloui">
              {userInitials}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main id="app-main" className="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}
