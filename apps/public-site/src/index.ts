import {
  applyAccountChromeSession,
  hasAccountChrome,
} from '../../../packages/framework/src/modules/account-chrome/session'
import { contentTypeFor } from './content-type'
import { parseRoute, type Route } from './routes'
import {
  D1SessionReader,
  readSessionId,
  type SessionCookieConfig,
  type SessionReader,
} from './session'
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
 * PUBLISHED SITES ARE PUBLIC, AND THAT IS UNCHANGED ([[REQ-200]]). What changed
 * is narrower than it sounds: this Worker now reads a session cookie **to choose
 * which of `account-chrome`'s states to render**, and for nothing else. No page
 * becomes gated, nothing is refused for want of a session, and a site with no
 * accounts never has one read on its behalf — the trigger is the marker the
 * module itself puts in the bytes, so a page without the chrome is served exactly
 * as it was published.
 */

export interface Env {
  /** The bucket the control-app publishes rendered revisions to. */
  SITES: R2Bucket
  /** The database holding the revision log — which revision is live (REQ-149). */
  DB: D1Database
  /**
   * [[REQ-200]] — the site served at the root of this deployment's own host.
   *
   * Configuration and never a URL segment: the apex is one named site, so no
   * request can ask for a different one. Absent, the apex 404s exactly as an
   * unpublished site does — a deployment with no apex site is a deployment whose
   * front page has not been published, which is the same answer.
   */
  APEX_SITE_KEY?: string
  /**
   * [[REQ-200]]/[[REQ-134]] — the name of the session cookie this deployment
   * issues. Absent means it issues none, and every visitor is signed out.
   */
  SESSION_COOKIE_NAME?: string
  /**
   * The `Domain` those cookies are issued under. A request whose host is not
   * within it carries no session THIS Worker may read, whatever its `Cookie`
   * header says — see `session.ts`.
   */
  SESSION_COOKIE_DOMAIN?: string
}

/**
 * Published URLs are not revision-scoped, so `/site/<slug>/assets/x.svg` cannot
 * be cached immutably. A publish therefore has a ≤60s window in which a client
 * can pair new HTML with cached old CSS. Accepted for v1; the fix is either
 * revision-scoped published asset paths or a purge-on-publish hook, and both are
 * additive to this.
 */
const PUBLISHED_CACHE = 'public, max-age=60'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' },
      })
    }

    const cookie: SessionCookieConfig = {
      name: env.SESSION_COOKIE_NAME,
      domain: env.SESSION_COOKIE_DOMAIN,
    }
    const sessionId = readSessionId(request, cookie)

    const cache = edgeCache()
    // A REQUEST CARRYING A SESSION NEVER READS THE SHARED CACHE ([[REQ-200]]).
    // What is stored there is the anonymous rendering — correct for everybody who
    // is not signed in, and exactly wrong for somebody who is. Storing is refused
    // separately below; both halves are needed, because an entry put there before
    // a page grew its chrome would otherwise still be served to a signed-in reader.
    if (cache && request.method === 'GET' && sessionId === null) {
      const hit = await cache.match(request)
      if (hit) return hit
    }

    const response = await route(request, {
      store: new D1SiteStore(env.DB),
      bucket: env.SITES,
      apexSiteKey: env.APEX_SITE_KEY,
      sessionId,
      sessions: new D1SessionReader(env.DB),
    })

    // Only successful responses are stored. A 404 is the answer for both "never
    // existed" and "not published yet", and the second stops being true the
    // moment someone publishes — caching it would make a fresh publish look
    // broken. A response whose content depended on a session says so in its
    // `cache-control`, and is never stored in a cache every visitor shares.
    if (
      cache &&
      request.method === 'GET' &&
      response.status === 200 &&
      !isSessionDependent(response)
    ) {
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

/** Everything a request needs resolved for it, gathered once per request. */
interface Serving {
  store: SiteStore
  bucket: R2Bucket
  /** The site served at the root of this host, when this deployment has one. */
  apexSiteKey?: string
  /** The session this request carries for THIS host, or null. */
  sessionId: string | null
  sessions: SessionReader
}

/**
 * The `cache-control` a session-dependent response carries ([[REQ-200]]).
 *
 * `private` is the load-bearing word: it names the shared edge cache as the one
 * place these bytes must not go, which is exactly the property the acceptance
 * asks for. `vary: cookie` is what makes any cache downstream of us agree.
 */
const SESSION_CACHE = 'private, no-store'

/** Whether this response's content depended on who was asking. */
function isSessionDependent(response: Response): boolean {
  return (response.headers.get('cache-control') ?? '').includes('private')
}

/** Whether a served path's own type is HTML — and so may carry account chrome. */
function isHtml(contentType: string): boolean {
  return contentType.startsWith('text/html')
}

async function route(request: Request, serving: Serving): Promise<Response> {
  const url = new URL(request.url)
  const parsed = parseRoute(url.pathname)

  switch (parsed.kind) {
    case 'apex':
      // The apex is an ordinary site served at the root of this host ([[REQ-200]]).
      // Which site is configuration; a deployment with none serves the same 404
      // an unpublished site does, because that is the same fact.
      if (!serving.apexSiteKey) return notFound()
      return serve(
        request,
        { kind: 'asset', siteKey: serving.apexSiteKey, path: parsed.path, htmlFallback: parsed.htmlFallback },
        serving,
      )

    case 'redirect':
      return new Response(null, {
        status: 301,
        headers: new Headers({ location: `${parsed.location}${url.search}` }),
      })

    case 'asset':
      return serve(request, parsed, serving)

    default:
      return notFound()
  }
}

/** Fetch one object out of the snapshot the route names. */
async function serve(
  request: Request,
  target: Extract<Route, { kind: 'asset' }>,
  serving: Serving,
): Promise<Response> {
  const prefix = await serving.store.resolve(target.siteKey)
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
      // HTML takes the GET path even for a HEAD ([[REQ-200]]): the chrome's state
      // is chosen by rewriting the bytes, so the length R2 stored is not the
      // length that would be served and a HEAD promising it would be lying.
      // Everything else keeps the metadata-only read it always had.
      if (isHtml(contentTypeFor(candidate))) continue
      const head = await serving.bucket.head(`${prefix}/${candidate}`)
      if (head === null) continue
      // Typed from the key that answered, never from the requested path: a
      // fallback hit is HTML, and `/whitepapers` carries no extension to guess
      // from.
      headers.set('content-type', contentTypeFor(candidate))
      headers.set('content-length', String(head.size))
      if (head.httpEtag) headers.set('etag', head.httpEtag)
      return new Response(null, { status: 200, headers })
    }
  }

  for (const candidate of candidates) {
    const object = await serving.bucket.get(`${prefix}/${candidate}`)
    if (object === null) continue
    const contentType = contentTypeFor(candidate)
    headers.set('content-type', contentType)

    if (isHtml(contentType)) {
      const body = await object.text()
      // THE TRIGGER IS THE MARKER IN THE BYTES, not a column somewhere. A page
      // with no account chrome cannot depend on a session, so it keeps its etag,
      // its shared cacheability, and the exact bytes that were published.
      if (!hasAccountChrome(body)) {
        if (object.httpEtag) headers.set('etag', object.httpEtag)
        return respond(request, body, headers)
      }
      const facts = serving.sessionId ? await serving.sessions.read(serving.sessionId) : null
      const selected = applyAccountChromeSession(body, {
        signedIn: facts !== null,
        operatesBusiness: facts?.operatesBusiness ?? false,
      })
      // No etag: the entity served is not the entity R2 stored, so R2's etag
      // would claim two different bodies are the same one.
      headers.set('cache-control', SESSION_CACHE)
      headers.set('vary', 'cookie')
      return respond(request, selected, headers)
    }

    if (object.httpEtag) headers.set('etag', object.httpEtag)
    return new Response(object.body, { status: 200, headers })
  }
  // A missing object is a 404 and never a directory listing: the bucket's key
  // space is not a browsable filesystem and must not become one by accident.
  return notFound()
}

/** A 200 carrying `body`, or its headers alone when the request was a HEAD. */
function respond(request: Request, body: string, headers: Headers): Response {
  if (request.method === 'HEAD') {
    headers.set('content-length', String(new TextEncoder().encode(body).length))
    return new Response(null, { status: 200, headers })
  }
  return new Response(body, { status: 200, headers })
}

function notFound(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
