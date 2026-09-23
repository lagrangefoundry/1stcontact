import {
  applyAccountChromeSession,
  hasAccountChrome,
} from '../../../packages/framework/src/modules/account-chrome/session'
import {
  applyTurnstileSitekey,
} from '../../../packages/framework/src/modules/contact-form/turnstile'
/**
 * THE ONE EXTENSION-TO-TYPE TABLE ([[REQ-246]]).
 *
 * This Worker held its own copy, on the reasoning that the Worker bundle could
 * not reach Node-side deploy code. The store's half is worker-safe and this
 * Worker already imports `revision-model` from beside it, so the boundary the
 * copy was justified by was not there — and the drift the store's own header
 * predicted had happened: `otf`, `txt`, `xml`, `mjs` and `webmanifest` existed
 * here and nowhere else, and `pdf` existed in neither, so every whitepaper on
 * every site was served as `application/octet-stream`.
 *
 * WHAT IS UNCHANGED IS THE QUESTION IT IS ASKED. The type is still derived from
 * the SERVED PATH and never from R2's stored `httpMetadata`, so what a visitor
 * is told does not depend on whichever upload mechanism happened to write the
 * object.
 */
import { contentTypeOf } from '../../../tools/generate/src/store/content-type'
import {
  blobKey,
  publishedAssetManifestKey,
  type StoredAssetManifest,
} from '../../../tools/generate/src/store/revision-model'
import { DOWNLOAD_PATH, gateTarget, handleGate, notFound, type GateEnv } from './gate'
import { handleLead, LEAD_PATH, type LeadEnv } from './lead'
import {
  parseRoute,
  siteOfRoute,
  withoutSitePrefix,
  type RootSite,
  type Route,
} from './routes'
import {
  D1SessionReader,
  readSessionId,
  type SessionCookieConfig,
  type SessionReader,
} from './session'
import { D1SiteStore, type HostBinding, type SiteStore } from './site-store'

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
 * IT RECEIVES ONE THING NOW ([[REQ-223]]). This Worker answered every method
 * other than GET/HEAD with `405` by construction, and said so as a statement of
 * character rather than of configuration. That is amended for exactly one path
 * and one method — `POST /api/lead`, the lead-capture endpoint — because a form
 * on a published page has to post to the page's own origin or meet Cloudflare
 * Access's `403` on its CORS preflight ([[BUG-78]]). The write itself is still
 * `control-app`'s and is handed over a service binding; nothing about serving
 * changed, every other method on every other path still answers `405`, and a UAT
 * holds it there. See `lead.ts`.
 *
 * AND IT GIVES ONE THING BACK PER CONTACT ([[REQ-244]]). `GET /api/download/…`
 * is a page listing the artifacts one form promised, reached by an unguessable
 * per-contact token, plus the artifacts themselves. It is a `GET`, so it amends
 * the character above not at all — and it is matched BEFORE the edge cache is
 * consulted, because a page minted for one person must never be stored in a cache
 * every visitor shares. `HEAD` is deliberately not matched: arriving is a recorded
 * fact and a prefetch is not an arrival. See `gate.ts`.
 *
 * PUBLISHED SITES ARE PUBLIC, AND THAT IS UNCHANGED ([[REQ-200]]). What changed
 * is narrower than it sounds: this Worker now reads a session cookie **to choose
 * which of `account-chrome`'s states to render**, and for nothing else. No page
 * becomes gated, nothing is refused for want of a session, and a site with no
 * accounts never has one read on its behalf — the trigger is the marker the
 * module itself puts in the bytes, so a page without the chrome is served exactly
 * as it was published.
 */

export interface Env extends LeadEnv, GateEnv {
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

/**
 * [[REQ-222]] — the path prefix a publish writes DELIVERY RENDITIONS under, and
 * the only bytes here that may be cached forever.
 *
 * THE NAME IS THE CONTENT. A rendition is called `<sha>-<width><ext>` over the
 * source bytes and the width it was rendered at, so a file at this path can
 * never change meaning: different bytes or a different width produce a different
 * name. That is precisely the property `PUBLISHED_CACHE`'s note says it is
 * waiting for, and it holds here whether or not it ever holds for the rest of a
 * published revision — so the ladder takes it now rather than waiting.
 *
 * IT MATTERS MOST FOR EXACTLY THE VISITOR THIS LADDER IS FOR. The point of
 * serving a phone a 640px photograph is that it pays for fewer bytes; a repeat
 * visit that pays for them again halves the saving.
 */
const DERIVED_PREFIX = 'assets/d/'
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

/**
 * The path prefix a site's own uploaded assets are served under.
 *
 * NAMED HERE BECAUSE TWO RULES NOW TURN ON IT ([[REQ-304]]): which paths carry
 * the immutable cache ({@link DERIVED_PREFIX}, a strictly narrower prefix), and
 * which resolve through a revision's asset manifest rather than against the
 * revision's own key space.
 */
const ASSETS_PREFIX = 'assets/'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    /*
     * `public-site` RECEIVES ONE THING NOW, AND EXACTLY ONE ([[REQ-223]] §3.1).
     *
     * This file used to say it serves pages and receives nothing, and answered
     * every non-GET with `405` by construction. That is amended for ONE path and
     * ONE method — the lead endpoint, on the page's own origin, for the four
     * reasons `lead.ts` records. Everything else still answers `405`, and a UAT
     * proves it: the amendment is a doorway, not a change of character.
     *
     * THE PATH IS RESOLVED THROUGH THE SAME GRAMMAR EVERY PUBLISHED BYTE GOES
     * THROUGH, which is what makes the site key non-caller-controlled. There is
     * no second parser here that could disagree with `routes.ts` about which site
     * a URL names.
     */
    const url = new URL(request.url)
    const store = new D1SiteStore(env.DB)

    if (request.method === 'POST') {
      const target = leadTarget(url.pathname, await rootSite(url, store, env.APEX_SITE_KEY))
      if (target) return await handleLead(request, { siteKey: target, env })
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' },
      })
    }

    /*
     * THE GATED PAGE, BEFORE THE CACHE IS CONSULTED ([[REQ-244]]).
     *
     * Ordered rather than routed for one reason: what comes back is minted for
     * ONE contact, and the block below stores every 200 in the cache every
     * visitor shares. Answering here means there is no path by which a gated
     * response can reach it — a property of the ordering, not of a header
     * somebody has to remember to set.
     *
     * `GET` ONLY. A `HEAD` falls through to the ordinary serving path and meets
     * the ordinary 404, because arriving is a recorded fact and a prefetcher's
     * probe is not an arrival.
     */
    if (isGatePath(url.pathname) && (request.method === 'GET' || request.method === 'HEAD')) {
      const root = await rootSite(url, store, env.APEX_SITE_KEY)
      // THE ADDRESS RULES APPLY TO A MAILED LINK TOO, AND FIRST ([[REQ-258]]).
      // The link this endpoint answers is the one most likely to be carrying the
      // old `/site/<key>/` shape, because `recipientSiteUrl` has been minting it
      // into gated-download emails — so it is the path where *"redundant prefix
      // 301s to the root-relative form"* has to hold rather than the one where it
      // is skipped for tidiness. Asked BEFORE the gate, so an arrival is recorded
      // once, against the request that actually displayed the page.
      const location = relocation(url, root)
      if (location) return redirect(location)
      if (request.method === 'GET') {
        const gate = gateTarget(url.pathname, root)
        if (gate) {
          return await handleGate(request, gate, { env, store, bucket: env.SITES })
        }
      }
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
      store,
      bucket: env.SITES,
      root: await rootSite(url, store, env.APEX_SITE_KEY),
      sessionId,
      sessions: new D1SessionReader(env.DB),
      turnstileSitekey: env.TURNSTILE_SITEKEY,
      assets: manifestReader(store, env.SITES),
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

/**
 * The site this `POST` writes into, or `null` when the path is not the endpoint.
 *
 * IT REUSES `parseRoute` RATHER THAN MATCHING A STRING. The grammar already
 * decides what `/api/lead` and `/site/<siteKey>/api/lead` mean — including the
 * traversal and percent-encoding edge cases, which are the parts that actually
 * bite — so asking it is the only way this cannot come to disagree with the
 * server that resolves every other byte.
 *
 * AN APEX SUBMISSION NEEDS AN APEX SITE. A deployment with none has no front
 * page, so it has no form either; the answer is `null` and the request meets the
 * ordinary `405`, which is the same thing an unpublished site says.
 */
function leadTarget(pathname: string, root: RootSite): string | null {
  const parsed = parseRoute(pathname)
  const path = parsed.kind === 'apex' || parsed.kind === 'asset' ? parsed.path : ''
  if (path !== LEAD_PATH) return null
  // THE CROSS-TENANT GUARD APPLIES TO THE WRITE PATH TOO ([[REQ-258]]), and it
  // is the same rule spelled once: `siteOfRoute` refuses a `/site/<key>/` path
  // whose key is not the site the host is bound to. Without it, a form posted to
  // `alicesplumbing.com/site/<bob's key>/api/lead` would file an enquiry into
  // Bob's contact list from Alice's domain.
  return siteOfRoute(parsed, root)
}

/**
 * Whether this path could be the gated page or one of its artifacts.
 *
 * A CHEAP PRE-TEST, AND ITS ONLY JOB IS TO KEEP A DATABASE READ OFF THE WARM
 * PATH. {@link gateTarget} needs the host resolved, and resolving the host is a
 * D1 query; asking it for every GET would put that query in front of the edge
 * cache, which answers most requests without touching a store at all. The
 * grammar's own segment is what is matched, so this cannot come to disagree with
 * the parser about which paths are gate paths — it is deliberately LOOSER than
 * `gateTarget` and never tighter, so a path it admits is still decided over
 * there.
 */
function isGatePath(pathname: string): boolean {
  return pathname.includes(`/${DOWNLOAD_PATH}`) || pathname.startsWith(`/${DOWNLOAD_PATH}`)
}

/**
 * The site served at the root of the host this request arrived on
 * ([[REQ-258]]).
 *
 * THE HOST DECIDES, AND `APEX_SITE_KEY` IS THE FALLBACK RATHER THAN THE ANSWER.
 * A host with a `site_domains` row is BOUND: it serves exactly that site and
 * nothing else, which is what a customer's own domain has to mean. A host with
 * no row is this product's own front door, where the root site is deployment
 * configuration and every other site is addressable under `/site/<key>/` — the
 * behaviour that existed before this ticket, unchanged, because deleting the
 * prefix grammar is a later cleanup and the platform apex is what it is
 * load-bearing for.
 *
 * MEMOISED BY THE STORE, so the three callers in one request share one read.
 */
async function rootSite(
  url: URL,
  store: SiteStore,
  apexSiteKey: string | undefined,
): Promise<RootSite> {
  const binding = await store.siteForHost(url.hostname)
  if (!binding) return { siteKey: apexSiteKey, bound: false }
  const elsewhere = binding.canonicalHost !== url.hostname.toLowerCase()
  return {
    siteKey: binding.siteKey,
    bound: true,
    redirectTo: elsewhere ? binding.canonicalHost : undefined,
  }
}

/** Everything a request needs resolved for it, gathered once per request. */
interface Serving {
  store: SiteStore
  bucket: R2Bucket
  /**
   * The Turnstile sitekey this deployment's forms use ([[REQ-223]] §6).
   *
   * Stamped onto served HTML rather than baked into a published revision: the
   * key is deployment configuration and a revision is an immutable record of
   * what a site said, so baking it in would make a key rotation a republish of
   * every site that has ever carried a form. Empty leaves the bytes untouched
   * and the mount inert — and the endpoint refuses, which is where that failure
   * belongs.
   */
  turnstileSitekey?: string
  /** The site served at the root of this host, and whether the host is bound to it. */
  root: RootSite
  /** The session this request carries for THIS host, or null. */
  sessionId: string | null
  sessions: SessionReader
  /**
   * One site's live revision asset manifest, or null when it has none
   * ([[REQ-304]]).
   *
   * GATHERED PER REQUEST AND MEMOISED, on `D1SiteStore.live`'s reasoning: one
   * request may ask twice (the HEAD path, then the GET path), and two reads of
   * one small object to answer one question is the cost this indirection must
   * not have. It is a FIELD rather than a module-level cache because a cache
   * that outlived the request would go on answering with a revision that is no
   * longer live.
   */
  assets(siteKey: string, outPrefix: string): Promise<StoredAssetManifest | null>
}

/**
 * The per-request manifest reader {@link Serving.assets} is.
 *
 * THE KEY IS BUILT FROM THE STORE'S ANSWER AND NEVER FROM THE REQUEST. The
 * revision id comes from `live`, which reads D1, and the site key has already
 * been through the route grammar and the cross-host guard — so no URL, however
 * crafted, can steer this at an object outside the revision it names.
 *
 * `outPrefix` IS TAKEN AS EVIDENCE THE SITE RESOLVES, not used to build the key:
 * the caller has one because `resolve` answered, which is the same read `live`
 * is memoised from.
 */
function manifestReader(store: SiteStore, bucket: R2Bucket): Serving['assets'] {
  const pending = new Map<string, Promise<StoredAssetManifest | null>>()
  return (siteKey, outPrefix) => {
    const cached = pending.get(outPrefix)
    if (cached) return cached
    const read = (async (): Promise<StoredAssetManifest | null> => {
      const live = await store.live(siteKey)
      if (live === null) return null
      const object = await bucket.get(publishedAssetManifestKey(siteKey, live))
      if (object === null) return null
      try {
        const parsed = JSON.parse(await object.text()) as StoredAssetManifest | null
        return parsed && typeof parsed.assets === 'object' ? parsed : null
      } catch {
        // A manifest that does not parse is not one this store wrote. Serving
        // falls back to the revision's own key space, which is the same answer
        // a revision with no manifest gets — never a 500 on a customer's page.
        return null
      }
    })()
    pending.set(outPrefix, read)
    return read
  }
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

  /*
   * A SITE SITS AT THE ROOT OF ITS HOST ([[REQ-258]], [[DOC-45]] §4), and the
   * `/site/<key>/` prefix survives on a bound host as a GUARDED REDIRECT.
   *
   * A customer who buys `alicesplumbing.com` and is given
   * `alicesplumbing.com/site/dom_9f3a…/` has not been given an address. But the
   * prefix cannot simply stop working either, because it is already in the post:
   * `recipientSiteUrl` has been minting `https://<host>/site/<key>/…` into gated
   * download emails, and a mailed link is permanent and unrecallable. So on a
   * bound host the prefix 301s to the root-relative form — every already-posted
   * link keeps working, and deleting the grammar becomes a later cleanup rather
   * than a flag day.
   *
   * AND A KEY THAT IS NOT THIS HOST'S SITE 404s, which is the rule that matters
   * and is a CROSS-TENANT GUARD rather than tidiness. It is applied by
   * `siteOfRoute` for the paths that serve; what is here is the redirect for the
   * key that DOES match, which is a statement about addresses rather than about
   * access.
   */
  const location = relocation(url, serving.root)
  if (location) return redirect(location)

  switch (parsed.kind) {
    case 'apex':
    case 'asset': {
      // ONE BRANCH FOR BOTH NOW. The apex is an ordinary site served at the root
      // of this host ([[REQ-200]]) and a bound host serves exactly one site at
      // its root, so *which site* is the same question in both cases and
      // `siteOfRoute` is the one place it is answered — including the refusal
      // for a key this host may not serve.
      const siteKey = siteOfRoute(parsed, serving.root)
      // A deployment with no root site serves the same 404 an unpublished site
      // does, because that is the same fact; so does a host asking for a site it
      // is not bound to, because a 404 that said which would answer questions
      // about sites the asker has no business knowing exist.
      if (siteKey === null) return notFound()
      return serve(
        request,
        { kind: 'asset', siteKey, path: parsed.path, htmlFallback: parsed.htmlFallback },
        serving,
      )
    }

    case 'redirect':
      return redirect(`${parsed.location}${url.search}`)

    default:
      return notFound()
  }
}

/**
 * Where this request belongs instead, or `null` when it is already there
 * ([[REQ-258]]).
 *
 * TWO RULES, ONE PLACE, AND ONE HOP.
 *
 *   - **A site sits at the root of its host** ([[DOC-45]] §4). On a bound host
 *     the `/site/<key>/` prefix is redundant — the host already names the site —
 *     so it 301s to the root-relative form. It cannot simply stop working,
 *     because it is already in the post: `recipientSiteUrl` has been minting
 *     `https://<host>/site/<key>/…` into gated-download emails, and a mailed
 *     link is permanent and unrecallable.
 *   - **A host that is not the address 301s to the one that is.** `www` is what
 *     forces this: both records are written, both resolve, and
 *     `site_domains.canonical` is what says which one a link is composed from
 *     and which one redirects — including so a search engine is not handed the
 *     same site twice under two names.
 *
 * BOTH CAN APPLY TO ONE REQUEST — `www.alicesplumbing.com/site/<key>/about` —
 * and redirecting twice would put an extra round trip in front of exactly the
 * visitor who followed an old link from a stale address. So the path is decided
 * first and the host second, and the reader lands on `/about` on the address in
 * one move.
 *
 * A KEY THIS HOST MAY NOT SERVE IS NOT REDIRECTED ANYWHERE. It is refused, by
 * `siteOfRoute`, wherever the request ends up — a 301 would confirm that the
 * site exists, which is the half of the cross-tenant guard that is about
 * information rather than about bytes.
 *
 * NEVER FOR A `POST`, which is why the lead endpoint is matched before this is
 * ever asked: a 301 drops the body, and the endpoint resolves to the same site
 * from either host anyway.
 */
function relocation(url: URL, root: RootSite): string | null {
  if (!root.bound) return null
  const parsed = parseRoute(url.pathname)
  const prefixed = parsed.kind === 'asset' && parsed.siteKey === root.siteKey
  const path = prefixed ? withoutSitePrefix(url.pathname) : url.pathname
  if (root.redirectTo) return `https://${root.redirectTo}${path}${url.search}`
  return prefixed ? `${path}${url.search}` : null
}

/**
 * A permanent redirect, and every one this Worker gives is one.
 *
 * `301` AND NOT `302`, DELIBERATELY, on [[TODO-6]] §4's reasoning one level
 * down: a permanent redirect is the only form that is both honest about which
 * address is canonical and safe to have printed on something physical. A
 * temporary one tells a search engine to keep indexing the address that
 * redirects, which is precisely the duplicate-content outcome the canonical
 * record exists to prevent.
 */
function redirect(location: string): Response {
  return new Response(null, { status: 301, headers: new Headers({ location }) })
}

/**
 * The R2 key one of a revision's candidate paths actually resolves to
 * ([[REQ-304]]).
 *
 * WHY THERE IS AN INDIRECTION AT ALL. A publish used to write a copy of every
 * picture on the site under each revision's own `out/assets/`, so `<prefix>/<path>`
 * was the whole answer — at the price of moving the entire site's bytes on every
 * publish, whether or not anything had changed, and keeping a copy per revision
 * for ever. Asset bytes live once per site now, addressed by content, and the
 * revision records WHICH content each name was. Resolving that is one small
 * object read, and it is what makes freezing a revision free.
 *
 * ONLY `assets/<name>` IS RESOLVED THIS WAY, and the two exclusions are both
 * deliberate. A page, a stylesheet or anything else under the revision prefix is
 * rendered output and belongs to that revision alone. A DERIVED rendition
 * (`assets/d/…`) is already content-addressed in its own name and is written per
 * revision by the ladder, so it needs no manifest and must not pay for one.
 *
 * A REVISION WITH NO MANIFEST FALLS BACK TO THE PREFIX, which is how revisions
 * published before this change go on being served: their copies are still there,
 * still immutable, and still exactly what they were. Nothing detects a mode —
 * the bucket's own shape decides, and a site that republishes once stops taking
 * the fallback for ever.
 *
 * MEMOISED FOR THE LIFE OF THE REQUEST, on `D1SiteStore.live`'s reasoning: a
 * page with ten pictures is ten requests, but a request that asks twice — the
 * HEAD path and then the GET path — must not read twice.
 */
async function assetKeyOf(
  serving: Serving,
  siteKey: string,
  prefix: string,
  candidate: string,
): Promise<string> {
  if (!candidate.startsWith(ASSETS_PREFIX) || candidate.startsWith(DERIVED_PREFIX)) {
    return `${prefix}/${candidate}`
  }
  const manifest = await serving.assets(siteKey, prefix)
  const digest = manifest?.assets[candidate.slice(ASSETS_PREFIX.length)]?.digest
  return digest === undefined ? `${prefix}/${candidate}` : blobKey(siteKey, digest)
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
  // The requested path decides, NOT the key that answered: the HTML fallback can
  // only ever resolve to a page, and a page is not content-addressed.
  headers.set(
    'cache-control',
    target.path.startsWith(DERIVED_PREFIX) ? IMMUTABLE_CACHE : PUBLISHED_CACHE,
  )

  if (request.method === 'HEAD') {
    for (const candidate of candidates) {
      // HTML takes the GET path even for a HEAD ([[REQ-200]]): the chrome's state
      // is chosen by rewriting the bytes, so the length R2 stored is not the
      // length that would be served and a HEAD promising it would be lying.
      // Everything else keeps the metadata-only read it always had.
      if (isHtml(contentTypeOf(candidate))) continue
      const head = await serving.bucket.head(
        await assetKeyOf(serving, target.siteKey, prefix, candidate),
      )
      if (head === null) continue
      // Typed from the key that answered, never from the requested path: a
      // fallback hit is HTML, and `/whitepapers` carries no extension to guess
      // from.
      headers.set('content-type', contentTypeOf(candidate))
      headers.set('content-length', String(head.size))
      if (head.httpEtag) headers.set('etag', head.httpEtag)
      return new Response(null, { status: 200, headers })
    }
  }

  for (const candidate of candidates) {
    const object = await serving.bucket.get(
      await assetKeyOf(serving, target.siteKey, prefix, candidate),
    )
    if (object === null) continue
    const contentType = contentTypeOf(candidate)
    headers.set('content-type', contentType)

    if (isHtml(contentType)) {
      // THE WIDGET IS STAMPED BEFORE ANYTHING ELSE IS DECIDED ([[REQ-223]] §6).
      // It is the same for every visitor, so a stamped page stays exactly as
      // shared-cacheable as the one that came out of the bucket — unlike the
      // chrome's state below, which is about who asked. A page with no form in it
      // is returned untouched and cannot acquire a third-party script by accident.
      const stored = await object.text()
      const body = applyTurnstileSitekey(stored, serving.turnstileSitekey ?? '')
      // THE TRIGGER IS THE MARKER IN THE BYTES, not a column somewhere. A page
      // with no account chrome cannot depend on a session, so it keeps its
      // shared cacheability and the bytes that were published.
      if (!hasAccountChrome(body)) {
        // NO ETAG ONCE THE BYTES HAVE BEEN STAMPED. R2's etag is the etag of what
        // R2 stored, and a stamped page is not that entity — claiming otherwise
        // would tell a cache two different bodies are the same one.
        if (object.httpEtag && body === stored) headers.set('etag', object.httpEtag)
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
