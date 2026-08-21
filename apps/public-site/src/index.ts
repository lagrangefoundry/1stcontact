import { contentTypeFor } from './content-type'
import { parseRoute, type Route } from './routes'
import { D1SiteStore, type SiteStore } from './site-store'

/**
 * `public-site` — the generic multi-tenant site server (REQ-111).
 *
 * Serves each site's live published revision: D1 says which revision that is,
 * R2 holds its bytes. Everything about *where* the truth lives is behind
 * {@link SiteStore}, and REQ-149 replaced one class behind it — the request path
 * below did not change, which is what the seam was for.
 *
 * ONE CHANNEL (REQ-149 D7). The sha-addressed draft previews are gone with the
 * deploy manifest that indexed them; sharing a draft returns as a builder
 * toolbar button rather than as a second channel here.
 *
 * There is no authentication, and published sites are public by definition.
 */

export interface Env {
  /** The bucket the control-app publishes rendered revisions to. */
  SITES: R2Bucket
  /** The database holding the revision log — which revision is live (REQ-149). */
  DB: D1Database
}

/**
 * Published URLs are not revision-scoped, so `/site/<slug>/assets/x.svg` cannot
 * be cached immutably. A publish therefore has a ≤60s window in which a client
 * can pair new HTML with cached old CSS. Accepted for v1; the fix is either
 * revision-scoped published asset paths or a purge-on-publish hook, and both are
 * additive to this.
 */
const PUBLISHED_CACHE = 'public, max-age=60'

/** Held back until the marketing site exists, so nothing goes public by accident. */
const APEX_BODY = 'Hello from 1stcontact.io'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' },
      })
    }

    const cache = edgeCache()
    if (cache && request.method === 'GET') {
      const hit = await cache.match(request)
      if (hit) return hit
    }

    const response = await route(request, new D1SiteStore(env.DB), env.SITES)

    // Only successful responses are stored. A 404 is the answer for both "never
    // existed" and "not published yet", and the second stops being true the
    // moment someone publishes — caching it would make a fresh publish look
    // broken.
    if (cache && request.method === 'GET' && response.status === 200) {
      ctx.waitUntil(cache.put(request, response.clone()))
    }
    return response
  },
} satisfies ExportedHandler<Env>

/**
 * The Cache API, when running somewhere that has one.
 *
 * Warm requests are answered at the edge without touching R2. Absent outside
 * the Workers runtime, where correctness is unaffected — every request simply
 * goes to the store.
 */
function edgeCache(): Cache | undefined {
  const api = (globalThis as { caches?: { default?: Cache } }).caches
  return api?.default
}

async function route(request: Request, store: SiteStore, bucket: R2Bucket): Promise<Response> {
  const url = new URL(request.url)
  const parsed = parseRoute(url.pathname)

  switch (parsed.kind) {
    case 'apex':
      return new Response(APEX_BODY, {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })

    case 'redirect':
      return new Response(null, {
        status: 301,
        headers: new Headers({ location: `${parsed.location}${url.search}` }),
      })

    case 'asset':
      return serve(request, parsed, store, bucket)

    default:
      return notFound()
  }
}

/** Fetch one object out of the snapshot the route names. */
async function serve(
  request: Request,
  target: Extract<Route, { kind: 'asset' }>,
  store: SiteStore,
  bucket: R2Bucket,
): Promise<Response> {
  const prefix = await store.resolve(target.slug)
  // An unknown slug and a site with nothing published are one answer, not two: a
  // 404 that said which would answer questions about sites the asker has no
  // business knowing exist.
  if (prefix === null) return notFound()

  // REQ-113 — the exact key first, then the extensionless → `.html` mapping the
  // route marked eligible. Ordered, not merged: a real object always wins, so
  // nothing that resolves today can start resolving somewhere else.
  const candidates = [target.path]
  if (target.htmlFallback) candidates.push(target.htmlFallback)

  const headers = new Headers()
  headers.set('cache-control', PUBLISHED_CACHE)

  if (request.method === 'HEAD') {
    for (const candidate of candidates) {
      const head = await bucket.head(`${prefix}/${candidate}`)
      if (head === null) continue
      // Typed from the key that answered, never from the requested path: a
      // fallback hit is HTML, and `/whitepapers` carries no extension to guess
      // from.
      headers.set('content-type', contentTypeFor(candidate))
      headers.set('content-length', String(head.size))
      if (head.httpEtag) headers.set('etag', head.httpEtag)
      return new Response(null, { status: 200, headers })
    }
    return notFound()
  }

  for (const candidate of candidates) {
    const object = await bucket.get(`${prefix}/${candidate}`)
    if (object === null) continue
    headers.set('content-type', contentTypeFor(candidate))
    if (object.httpEtag) headers.set('etag', object.httpEtag)
    return new Response(object.body, { status: 200, headers })
  }
  // A missing object is a 404 and never a directory listing: the bucket's key
  // space is not a browsable filesystem and must not become one by accident.
  return notFound()
}

function notFound(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
