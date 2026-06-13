// Cloudflare Worker — sceniq-media
// ─────────────────────────────────────────────────────────────────────────────
// Sert les objets du bucket R2 `sceniq-showcase` (lié en BUCKET) via *.workers.dev,
// en remplacement de l'endpoint public r2.dev (rate-limited, sans cache, déconseillé
// en prod). Cache edge Cloudflare + Range requests complètes (autoplay vidéo iOS).
//
// Implémentation : on lit l'objet ENTIÈREMENT en mémoire (ArrayBuffer) puis on sert
// le 200 ou le 206 tranché depuis ce buffer. Évite tout souci de flux/tee qui
// pouvait stopper la fin du téléchargement (et donc le moov atom des MP4).
// Les vidéos showcase font < 8 Mo → buffer parfaitement OK dans un Worker.
//
// URL : https://sceniq-media.<sous-domaine>.workers.dev/exemple1.mp4
// → à mettre dans NEXT_PUBLIC_R2_BASE_URL (sans slash final).

const ALLOWED_EXT = /\.(mp4|webm|ogg|jpg|jpeg|png|webp|gif)$/i

// Namespace du cache edge. Incrémenter cette valeur (v2 → v3 …) puis redéployer
// = purge globale instantanée : toutes les anciennes entrées deviennent
// inaccessibles et chaque fichier est re-téléchargé frais depuis R2.
const CACHE_VERSION = 'v3'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-headers': 'Range, Content-Type',
  'access-control-expose-headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
}

function baseHeaders(contentType, etag, contentLength) {
  const h = new Headers(CORS)
  h.set('content-type', contentType)
  h.set('accept-ranges', 'bytes')
  // Cache 1h : assez pour d'excellents taux de hit, mais un remplacement de
  // vidéo (même nom de fichier) réapparaît automatiquement en < 1h, sans purge.
  // Pour forcer un rafraîchissement immédiat d'un fichier : ajouter ?v=2 à l'URL.
  h.set('cache-control', 'public, max-age=3600')
  if (etag) h.set('etag', etag)
  h.set('content-length', String(contentLength))
  return h
}

export default {
  /**
   * @param {Request} request
   * @param {{ BUCKET: R2Bucket }} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS })
    }

    const url = new URL(request.url)
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    if (!key || key.includes('..') || !ALLOWED_EXT.test(key)) {
      return new Response('Not found', { status: 404, headers: CORS })
    }

    // Cache edge indexé par URL sans query (le 200 plein sert de base aux Range)
    const cache    = caches.default
    // La query fait partie de la clé de cache → ajouter ?v=2 force une entrée
    // neuve (rafraîchissement immédiat après remplacement d'une vidéo).
    const cacheKey = new Request(`${url.origin}/${CACHE_VERSION}/${key}${url.search}`)

    let data           // ArrayBuffer du fichier complet
    let contentType = key.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream'
    let etag

    const cached = await cache.match(cacheKey)
    if (cached) {
      data        = await cached.arrayBuffer()
      contentType = cached.headers.get('content-type') || contentType
      etag        = cached.headers.get('etag') || undefined
    } else {
      const object = await env.BUCKET.get(key)
      if (!object) return new Response('Not found', { status: 404, headers: CORS })
      data = await object.arrayBuffer()
      const meta = new Headers()
      object.writeHttpMetadata(meta)
      contentType = meta.get('content-type') || contentType
      etag        = object.httpEtag
      // Met en cache la réponse PLEINE (200) — corps entièrement bufferisé
      ctx.waitUntil(
        cache.put(cacheKey, new Response(data, { status: 200, headers: baseHeaders(contentType, etag, data.byteLength) })),
      )
    }

    const total = data.byteLength
    const range = request.headers.get('range')

    // Requête sans Range → 200 complet
    if (!range) {
      const headers = baseHeaders(contentType, etag, total)
      return new Response(request.method === 'HEAD' ? null : data, { status: 200, headers })
    }

    // Requête Range → 206 tranché depuis le buffer
    const m   = /bytes=(\d*)-(\d*)/.exec(range)
    let start = m && m[1] ? parseInt(m[1], 10) : 0
    let end   = m && m[2] ? parseInt(m[2], 10) : total - 1
    if (isNaN(start) || start < 0)   start = 0
    if (isNaN(end)   || end >= total) end = total - 1

    if (start > end || start >= total) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { ...CORS, 'content-range': `bytes */${total}` },
      })
    }

    const slice   = data.slice(start, end + 1)
    const headers = baseHeaders(contentType, etag, slice.byteLength)
    headers.set('content-range', `bytes ${start}-${end}/${total}`)
    return new Response(request.method === 'HEAD' ? null : slice, { status: 206, headers })
  },
}
