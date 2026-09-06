/**
 * Route grammar for the multi-tenant site server (REQ-111).
 *
 * ```
 * /site/<siteKey>/<path…>   →  the site's live published revision
 * /                         →  reserved for the apex marketing site
 * ```
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
  /** `/` — the apex, held back until the marketing site exists. */
  | { kind: 'apex' }
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
  if (pathname === '' || pathname === '/') return { kind: 'apex' }
  if (!pathname.startsWith('/')) return { kind: 'not-found' }

  const raw = pathname.slice(1).split('/')
  const trailingSlash = raw[raw.length - 1] === ''
  const encoded = trailingSlash ? raw.slice(0, -1) : raw
  if (encoded.length === 0) return { kind: 'apex' }

  const parts: string[] = []
  for (const segment of encoded) {
    const decoded = decodeSegment(segment)
    if (decoded === null) return { kind: 'not-found' }
    parts.push(decoded)
  }

  if (parts[0] !== SITE_SEGMENT) return { kind: 'not-found' }

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
