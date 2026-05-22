// middleware.ts — racine du projet
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// ── Whitelist admin ───────────────────────────────────────────────────────────
// V1 agence services : seul Pascal accède au dashboard.
// Le signup public est bloqué — /sign-up redirige vers /.
const ADMIN_EMAILS = ['uxdesignparis@gmail.com', 'support@sceniq.studio']

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  // /sign-up volontairement ABSENT → redirigé ci-dessous
  '/commande(.*)',        // Checkout public — pas d'auth requise
  '/mentions-legales',   // Pages légales publiques
  '/confidentialite',    // Pages légales publiques
  '/api/orders(.*)',     // API checkout public
  '/api/upload(.*)',     // Upload refs public
  '/api/contact(.*)',    // Formulaire contact public
  '/api/webhooks/(.*)',  // Stripe webhooks — pas d'auth Clerk
  '/sandbox(.*)',        // Sandbox de test agents — pas d'auth
])

const isSignUpRoute   = createRouteMatcher(['/sign-up(.*)'])
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/project(.*)'])

export default clerkMiddleware((auth, req) => {
  // Bloquer le signup public : rediriger vers la landing
  if (isSignUpRoute(req)) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (isPublicRoute(req)) return

  // Protège toutes les routes privées
  auth().protect()

  // Whitelist dashboard/project — Pascal uniquement
  // sessionClaims?.email n'est pas dans le JWT par défaut en Clerk v5.
  // On garde la protection minimale : tout userId authentifié = Pascal (V1).
  // La vérification email fine est faite dans app/(app)/layout.tsx via currentUser().
  if (isDashboardRoute(req)) {
    const { userId } = auth()
    if (!userId) {
      const url = req.nextUrl.clone()
      url.pathname = '/sign-in'
      return NextResponse.redirect(url)
    }
  }
})

export const config = {
  // Exclut : _next, fichiers statiques (images, vidéos, fonts, etc.)
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|mp4|webm|ogg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
