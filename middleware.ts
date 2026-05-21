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

  // Whitelist stricte pour le dashboard — Pascal uniquement
  if (isDashboardRoute(req)) {
    const email = auth().sessionClaims?.email as string | undefined
    if (email !== ADMIN_EMAIL) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }
})

export const config = {
  // Exclut : _next, fichiers statiques (images, vidéos, fonts, etc.)
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|mp4|webm|ogg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
