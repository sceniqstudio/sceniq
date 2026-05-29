// Cloudflare Worker — sceniq-media
// ─────────────────────────────────────────────────────────────────────────────
// Sert les objets du bucket R2 `sceniq-showcase` (lié en BUCKET) via *.workers.dev.
// Objectif : remplacer l'endpoint public r2.dev (rate-limited, sans cache CDN,
// déconseillé en production par Cloudflare) par un vrai service edge avec cache
// et support des Range requests — indispensable pour l'autoplay vidéo sur iOS.
//
// URL d'accès : https://sceniq-media.<sous-domaine>.workers.dev/exemple1.mp4
// → à mettre dans NEXT_PUBLIC_R2_BASE_URL (sans slash final).

const ALLOWED_EXT = /\.(mp4|webm|ogg|jpg|jpeg|png|webp|gif)$/i

export default {
  /**
   * @param {Request} request
   * @param {{ BUCKET: R2Bucket }} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const url = new URL(request.url)
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))

    // Garde-fous : pas de clé vide, pas de traversée, extensions média seulement
    if (!key || key.includes('..') || !ALLOWED_EXT.test(key)) {
      return new Response('Not found', { status: 404 })
    }

    // ── Cache edge : on indexe la réponse PLEINE (200) par URL (sans la query) ──
    // Les requêtes Range sont ensuite servies en tranchant cette réponse pleine,
    // ce qui garantit un comportement correct quel que soit le navigateur.
    const cache    = caches.default
    const cacheKey = new Request(`${url.origin}/${key}`)

    let full = await cache.match(cacheKey)

    if (!full) {
      const object = await env.BUCKET.get(key)
      if (!object || !object.body) {
        return new Response('Not found', { status: 404 })
      }

      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      headers.set('accept-ranges', 'bytes')
      headers.set('cache-control', 'public, max-age=31536000, immutable')
      headers.set('access-control-allow-origin', '*')
      if (!headers.get('content-type')) {
        headers.set('content-type', key.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream')
      }

      full = new Response(object.body, { status: 200, headers })
      // Stocke la version pleine au edge pour les prochains visiteurs
      ctx.waitUntil(cache.put(cacheKey, full.clone()))
    }

    const range = request.headers.get('range')
    if (!range) {
      // HEAD : pas de corps
      if (request.method === 'HEAD') {
        return new Response(null, { status: 200, headers: full.headers })
      }
      return full
    }

    // ── Réponse partielle (206) pour les Range requests vidéo ──
    const buf   = await full.arrayBuffer()
    const total = buf.byteLength
    const m     = /bytes=(\d*)-(\d*)/.exec(range)

    let start = m && m[1] ? parseInt(m[1], 10) : 0
    let end   = m && m[2] ? parseInt(m[2], 10) : total - 1
    if (isNaN(start) || start < 0)   start = 0
    if (isNaN(end)   || end >= total) end = total - 1

    // Range non satisfaisable
    if (start > end || start >= total) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { 'content-range': `bytes */${total}`, 'access-control-allow-origin': '*' },
      })
    }

    const slice   = buf.slice(start, end + 1)
    const headers = new Headers(full.headers)
    headers.set('content-range', `bytes ${start}-${end}/${total}`)
    headers.set('content-length', String(slice.byteLength))

    if (request.method === 'HEAD') {
      return new Response(null, { status: 206, headers })
    }
    return new Response(slice, { status: 206, headers })
  },
}
