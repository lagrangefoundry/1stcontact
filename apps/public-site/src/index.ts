import { contentTypeFor } from './content-type'
import { parseRoute, type Channel, type Route } from './routes'
import { R2SiteStore, type SiteStore } from './site-store'

/**
 * `public-site` — the generic multi-tenant site server (REQ-111).
 *
 * Serves the snapshots `1c deploy` writes to R2: content-addressed draft
 * previews and each site's live published revision. Everything about *where*
 * the bytes live is behind {@link SiteStore}, so the D1 phase (REQ-7) replaces
 * one class and leaves the request path untouched.
 *
 * There is no authentication. Draft previews are unguessable-URL-private by
 * deliberate decision — real ACLs arrive with login, and holding publication
 * hostage to access control is not a trade worth making for v1.
 */

export interface Env {
  /** The bucket `1c deploy` publishes snapshots to (`1stcontact-sites`). */
  SITES: R2Bucket
}

/** Snapshot ids name their own bytes, so those bytes can never change. */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

/**
 * Published URLs are not revision-scoped, so `/site/<slug>/assets/x.svg` cannot
 * be cached immutably. A deploy therefore has a ≤60s window in which a client
 * can pair new HTML with cached old CSS. Accepted for v1; the fix is either
 * revision-scoped published asset paths or a purge-on-deploy hook, and both are
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

    const response = await route(request, new R2SiteStore(env.SITES), env.SITES)

    // Only successful responses are stored. A 404 is the answer for both "never
    // existed" and "not deployed yet", and the second stops being true the
    // moment someone deploys — caching it would make a fresh deploy look broken.
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
        headers: withDraftPolicy(
          new Headers({ location: `${parsed.location}${url.search}` }),
          parsed.channel,
        ),
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
  const prefix = await store.resolve(target.slug, target.channel, target.ref)
  // An unknown slug, a site with nothing published, and an expired preview id
  // are one answer, not three: a 404 that says which one would answer questions
  // about sites the asker has no business knowing exist.
  if (prefix === null) return notFound(target.channel)

  const key = `${prefix}/${target.path}`
  const headers = withDraftPolicy(new Headers(), target.channel)
  headers.set('content-type', contentTypeFor(target.path))
  headers.set('cache-control', target.channel === 'draft' ? IMMUTABLE_CACHE : PUBLISHED_CACHE)

  if (request.method === 'HEAD') {
    const head = await bucket.head(key)
    if (head === null) return notFound(target.channel)
    headers.set('content-length', String(head.size))
    if (head.httpEtag) headers.set('etag', head.httpEtag)
    return new Response(null, { status: 200, headers })
  }

  const object = await bucket.get(key)
  // A missing object is a 404 and never a directory listing: the bucket's key
  // space is not a browsable filesystem and must not become one by accident.
  if (object === null) return notFound(target.channel)
  if (object.httpEtag) headers.set('etag', object.httpEtag)
  return new Response(object.body, { status: 200, headers })
}

function notFound(channel?: Channel): Response {
  const headers = withDraftPolicy(
    new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
    channel,
  )
  return new Response('Not Found', { status: 404, headers })
}

/**
 * Keep preview snapshots out of search indexes.
 *
 * Applied to every draft-channel response, not only the successful ones: a
 * preview is a private artifact shared by URL, and a crawler that reached one
 * should be told so whatever it found there.
 */
function withDraftPolicy(headers: Headers, channel?: Channel): Headers {
  if (channel === 'draft') headers.set('x-robots-tag', 'noindex')
  return headers
}
