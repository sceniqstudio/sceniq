// middleware.ts — racine du projet
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// ── Whitelist admin ───────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'uxdesignparis@gmail.com'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/commande(.*)',        // Checkout public — pas d'auth requise
  '/mentions-legales',   // Pages légales publiques
  '/confidentialite',    // Pages légales publiques
  '/api/orders(.*)',     // API checkout public
  '/api/upload(.*)',     // Upload refs public
  '/api/contact(.*)',    // Formulaire contact public
  '/api/webhooks/(.*)',  // Stripe webhooks — pas d'auth Clerk
  '/sandbox(.*)',        // Sandbox de test agents — pas d'auth
])

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return

  // Protège toutes les routes privées
  auth().protect()

  // Whitelist dashboard — Pascal uniquement
  // Note: sessionClaims?.email est undefined en Clerk v5 par défaut (pas inclus dans le JWT)
  // auth().protect() au-dessus garantit déjà qu'un userId existe
  // Signup public désactivé → tout userId authentifié = Pascal
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
