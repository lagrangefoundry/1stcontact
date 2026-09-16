/**
 * Route grammar for the multi-tenant site server (REQ-111).
 *
 * ```
 * /site/<siteKey>/<path…>   →  that site's live published revision
 * /<path…>                  →  the APEX site's live published revision
 * ```
 *
 * THE APEX IS A PUBLISHED SITE NOW ([[REQ-200]]), not a held-back string: `/`
 * is its index and every path outside `/site/` resolves against it. Which site
 * it is comes from configuration, never from the URL.
 *
 * THE FIRST SEGMENT IS THE SITE'S KEY, NOT ITS SLUG ([[REQ-190]]). It used to be
 * the slug — a name the operator chose — and because this URL carries no
 * business, that name had to be unique across the whole deployment for it to
 * name one site. So a slug was a key: two businesses could not both publish
 * `home`, the second was refused, and the refusal told them the first existed.
 * The segment is the site's own 128-bit key now. The GRAMMAR below is unchanged
 * — the pattern already admitted the key's character set — and what changed is
 * what the token means, which is why nothing in this file moved.
 *
 * Parsing is a pure function of the pathname so the whole grammar — including
 * the traversal and encoding edge cases, which are the parts that actually bite
 * — is testable without a bucket, a request, or a Worker runtime.
 *
 * THERE IS ONE CHANNEL NOW (REQ-149 D7). `/site/<slug>/draft/<sha>/…` served
 * sha-addressed shareable draft snapshots, which only `1c deploy` ever produced
 * and which the deploy manifest was the index of. Both are deleted, so the
 * grammar loses the channel rather than keeping a route that could only 404 —
 * a half-present feature is the legacy-mode split `CLAUDE.md` forbids. Sharing a
 * draft returns as a builder toolbar button, over the draft channel the builder
 * already renders on request (REQ-145).
 *
 * `draft` IS THEREFORE AN ORDINARY SEGMENT AGAIN. A published site may now
 * contain a top-level `draft/` page, because nothing shadows it.
 */

export type Route =
  /**
   * A byte to serve out of the APEX site's live revision ([[REQ-200]]).
   *
   * `1stcontact.io` used to answer `/` with a held-back string literal and 404
   * everything else. It is a real published 1c site now — in the `1stcontact`
   * tenant, carrying `account-chrome`, built the way a customer's is — so the
   * apex needs the same grammar every other site has: an index at `/`, and every
   * other path resolving against that site's revision. Which site that is comes
   * from configuration and never from the URL, so no request can name one.
   *
   * `path` and `htmlFallback` mean exactly what they mean on an `asset` route.
   */
  | { kind: 'apex'; path: string; htmlFallback?: string }
  /**
   * A directory-shaped URL missing its trailing slash.
   *
   * Load-bearing, not cosmetic: rendered pages reference their assets
   * document-relatively (`./theme.css` — REQ-109) so a snapshot is relocatable
   * under any prefix. Served at `/site/site_a3f9…` that resolves to
   * `/site/theme.css` — one level too high, and a page that loads with no
   * styles. The redirect is the only thing standing between the two.
   */
  | { kind: 'redirect'; location: string }
  /**
   * A byte to serve out of the site's live revision.
   *
   * `htmlFallback` is the key to try when `path` names no object — the
   * extensionless → `<path>.html` mapping (REQ-113). Present only when the
   * pathname is eligible; deciding that here keeps the rule a pure function of
   * the URL, testable without a bucket, while the *lookup* stays in the request
   * path where it belongs.
   */
  | { kind: 'asset'; siteKey: string; path: string; htmlFallback?: string }
  | { kind: 'not-found' }

/** The path prefix every site is served under. */
export const SITE_SEGMENT = 'site'

/**
 * The addressable-token pattern: boring filename characters, because the value
 * is concatenated into an R2 key.
 *
 * It is a REFUSAL and not a validation — nothing here decides that a token names
 * a site, only that it could not steer a key somewhere the grammar did not
 * intend. Whether the site exists is the store's answer.
 */
const SITE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

export function isValidSiteKey(siteKey: string): boolean {
  return SITE_KEY_PATTERN.test(siteKey)
}

/**
 * Decode one path segment, rejecting anything that could steer a key somewhere
 * the grammar did not intend.
 *
 * `..` cannot escape a bucket the way it escapes a filesystem — an R2 key is an
 * opaque string, so `a/../b` simply names an object nobody uploaded. It is
 * rejected anyway: keys are built by concatenation here, and a component that
 * *looks* like traversal is a component whose meaning depends on who reads it.
 * Returns `null` when the segment is unusable.
 */
function decodeSegment(segment: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    return null // malformed percent-encoding
  }
  if (decoded === '' || decoded === '.' || decoded === '..') return null
  if (decoded.includes('/') || decoded.includes('\\') || decoded.includes('\0')) return null
  return decoded
}

/**
 * REQ-113 — the extensionless → `<path>.html` mapping, as a rule about the URL.
 *
 * A page authored with slug `whitepapers` renders to `whitepapers.html`, and the
 * link the author writes is `/whitepapers`. `1c serve` already resolves that;
 * without the same mapping here the preview and the deployed site disagree on
 * the very URL in the nav, and the tempting "fix" is to bake `.html` into the
 * site — wrong environment, permanent cost.
 *
 * Two conditions, and the second is load-bearing rather than tidiness:
 *
 *   - **No extension.** Only the LAST segment is examined, so `v1.2/page` is
 *     eligible and `assets/logo.svg` is not. A missing asset must keep 404ing
 *     rather than silently returning HTML under its own MIME type.
 *   - **No trailing slash.** Rendered pages reference their assets
 *     document-relatively (REQ-109), so the request URL's *directory* is what
 *     every `theme.css` resolves against. Served at `…/<sha>/whitepapers` that
 *     directory is `…/<sha>/` and the references land; served at
 *     `…/<sha>/whitepapers/` it is `…/whitepapers/` and every one of them
 *     resolves a level too low, giving an unstyled page. This is the same
 *     failure the {@link Route} `redirect` case exists to prevent at the
 *     snapshot root — so a trailing-slash path is simply never eligible.
 */
function htmlFallbackFor(path: string, trailingSlash: boolean): string | undefined {
  if (trailingSlash) return undefined
  const lastSegment = path.slice(path.lastIndexOf('/') + 1)
  return lastSegment.includes('.') ? undefined : `${path}.html`
}

/** Parse `pathname` (percent-encoded, as it arrives on the wire) into a {@link Route}. */
export function parseRoute(pathname: string): Route {
  if (pathname === '' || pathname === '/') return { kind: 'apex', path: 'index.html' }
  if (!pathname.startsWith('/')) return { kind: 'not-found' }

  const raw = pathname.slice(1).split('/')
  const trailingSlash = raw[raw.length - 1] === ''
  const encoded = trailingSlash ? raw.slice(0, -1) : raw
  if (encoded.length === 0) return { kind: 'apex', path: 'index.html' }

  const parts: string[] = []
  for (const segment of encoded) {
    const decoded = decodeSegment(segment)
    if (decoded === null) return { kind: 'not-found' }
    parts.push(decoded)
  }

  // Not under `/site/`, so it addresses the apex site — the one site this
  // deployment serves at the root of its own host. `/site/` stays a reserved
  // first segment: it is how every OTHER site is addressed, so an apex page may
  // not be called `site` and a request under it is never the apex's.
  if (parts[0] !== SITE_SEGMENT) {
    const apexPath = parts.join('/')
    return {
      kind: 'apex',
      path: apexPath,
      htmlFallback: htmlFallbackFor(apexPath, trailingSlash),
    }
  }

  const siteKey = parts[1]
  if (siteKey === undefined || !isValidSiteKey(siteKey)) return { kind: 'not-found' }

  const rest = parts.slice(2)

  if (rest.length === 0) {
    if (!trailingSlash) return { kind: 'redirect', location: `${pathname}/` }
    return { kind: 'asset', siteKey, path: 'index.html' }
  }

  const path = rest.join('/')
  return { kind: 'asset', siteKey, path, htmlFallback: htmlFallbackFor(path, trailingSlash) }
}

/**
 * Which site this host serves at its root, and whether the host is BOUND to it
 * ([[REQ-258]]).
 *
 * TWO FIELDS AND NOT ONE, because *\"which site\"* and *\"may this host serve any
 * other\"* are different questions with different answers on the product's own
 * front door. `1stcontact.io` serves the apex site at `/` and every other site
 * under `/site/<key>/`, which is correct: it is this product's address, not a
 * customer's. `alicesplumbing.com` serves exactly one site and nothing else, and
 * the difference between those two sentences is this boolean.
 */
export interface RootSite {
  /** The site served at the root of this host, or `undefined` for a host with none. */
  siteKey?: string
  /**
   * Whether a `site_domains` row binds this host to that site.
   *
   * `false` FOR THE PLATFORM'S OWN HOSTS, where the root site is deployment
   * configuration (`APEX_SITE_KEY`) rather than a mapping — and where serving
   * every site under `/site/<key>/` is the whole job.
   */
  bound: boolean
  /**
   * The host this one is not — set only when the site's address is elsewhere.
   *
   * A SITE HAS EXACTLY ONE ADDRESS ([[DOC-45]] §4) AND SEVERAL HOSTS MAY REACH
   * IT. Attaching a domain writes the apex and its `www`, because a visitor who
   * types `www.` must not meet a certificate error; one of the two is the
   * address and the other 301s to it. Absent means this host IS the address,
   * which is the ordinary case and the one that must cost nothing.
   */
  redirectTo?: string
}

/**
 * The site a parsed route names, or `null` when it names none.
 *
 * THE CROSS-TENANT GUARD IS HERE AND IS THE REASON THIS FUNCTION EXISTS.
 * `public-site` serves `/site/<any-key>/` on whatever host it is routed to,
 * which is correct on this product's front door and is a leak the moment the
 * host belongs to a customer: `alicesplumbing.com/site/<bob's key>/` would serve
 * Bob's site to anyone holding his key, from Alice's domain, under Alice's
 * certificate. Routing a customer domain to this Worker is what creates that
 * exposure, so the refusal lives in the grammar every path goes through rather
 * than in the one handler somebody remembered.
 *
 * ONE SPELLING, AND THAT IS WHAT MAKES IT A GUARD. The page server, the lead
 * endpoint and the download gate all resolve a request to a site, and all three
 * ask this — so there is no path by which one of them can come to disagree with
 * the other two about which sites a host may serve.
 */
export function siteOfRoute(parsed: Route, root: RootSite): string | null {
  // EMPTY IS ABSENT, NOT A SITE KEY. `APEX_SITE_KEY` is declared as `""` in
  // every `wrangler.toml` this product ships, because a named environment
  // inherits no vars and a missing declaration is worse than an empty one — so
  // *"this deployment has no apex site"* arrives as an empty string far more
  // often than as `undefined`, and `??` would let it through as a key and send
  // the store looking for a site called nothing.
  if (parsed.kind === 'apex') return root.siteKey || null
  if (parsed.kind !== 'asset') return null
  if (root.bound && parsed.siteKey !== root.siteKey) return null
  return parsed.siteKey
}

/**
 * `/site/<key>/rest…` as `/rest…` — the root-relative form of a prefixed path.
 *
 * WHY THE PREFIX CANNOT SIMPLY STOP WORKING. `recipientSiteUrl` has been minting
 * `https://<host>/site/<key>/api/download/<token>` into gated-download emails,
 * and a mailed link is permanent and unrecallable. On a bound host the prefix is
 * redundant — the host already names the site — so it 301s here instead of
 * 404ing, which keeps every already-posted link working and makes deleting the
 * grammar a later cleanup rather than a flag day.
 *
 * IT WORKS ON THE RAW PATHNAME rather than on the parsed route, so percent
 * encoding and the trailing slash survive the trip: the redirect has to land on
 * the SAME byte, and a re-encoded path is a different one.
 */
export function withoutSitePrefix(pathname: string): string {
  const rest = pathname.split('/').slice(3).join('/')
  return rest === '' ? '/' : `/${rest}`
}
