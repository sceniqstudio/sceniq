import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { ToastProvider } from '@/app/(app)/_components/Toast'
import { StudioModeWatcher } from '@/app/(app)/_components/StudioModeWatcher'

// V1 agence services — accès dashboard restreint à ces emails uniquement
const ADMIN_EMAILS = ['uxdesignparis@gmail.com', 'support@sceniq.studio']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Vérification whitelist email — renvoie vers / si non autorisé
  const user = await currentUser()
  if (!user) redirect('/sign-in')
  const userEmail = user.emailAddresses[0]?.emailAddress ?? ''
  if (!ADMIN_EMAILS.includes(userEmail)) redirect('/?unauthorized=1')

  const userInitials = (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') || 'PE'

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
          <img src="/sceniq-logo-white.svg" alt="ScenIQ" height={48} style={{ height: 48, width: 'auto', display: 'block' }} />
        </Link>

        <ul className="app-nav">
          <li>
            <Link href="/dashboard">
              <span className="app-nav-ico">📁</span>
              Projets
            </Link>
          </li>
          <li>
            <Link href="/dashboard/studio">
              <span className="app-nav-ico">🎬</span>
              Studio
            </Link>
          </li>
          {/* Marques — masqué V1 agence services, réactivé en V2 self-service */}
          {/* <li>
            <Link href="/dashboard/brands">
              <span className="app-nav-ico">🏷️</span>
              Marques
            </Link>
          </li> */}
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
