// middleware.ts — racine du projet
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/commande(.*)',        // Checkout public — pas d'auth requise
  '/api/orders(.*)',     // API checkout public
  '/api/upload(.*)',     // Upload refs public
  '/api/webhooks/(.*)',  // Stripe webhooks — pas d'auth Clerk
  '/sandbox(.*)',        // Sandbox de test agents — pas d'auth
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  // Exclut : _next, fichiers statiques (images, vidéos, fonts, etc.)
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|mp4|webm|ogg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
