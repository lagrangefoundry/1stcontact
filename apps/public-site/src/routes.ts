/**
 * Route grammar for the multi-tenant site server (REQ-111).
 *
 * ```
 * /site/<slug>/draft/<sha>/<path…>   →  a content-addressed preview snapshot
 * /site/<slug>/<path…>               →  the site's live published revision
 * /                                  →  reserved for the apex marketing site
 * ```
 *
 * Parsing is a pure function of the pathname so the whole grammar — including
 * the traversal and encoding edge cases, which are the parts that actually bite
 * — is testable without a bucket, a request, or a Worker runtime.
 */

export type Channel = 'draft' | 'published'

export type Route =
  /** `/` — the apex, held back until the marketing site exists. */
  | { kind: 'apex' }
  /**
   * A directory-shaped URL missing its trailing slash.
   *
   * Load-bearing, not cosmetic: rendered pages reference their assets
   * document-relatively (`./theme.css` — REQ-109) so a snapshot is relocatable
   * under any prefix. Served at `/site/acme/draft/<sha>` that resolves to
   * `/site/acme/draft/theme.css` — one level too high, and a page that loads
   * with no styles. The redirect is the only thing standing between the two.
   */
  | { kind: 'redirect'; location: string; channel: Channel }
  /** A byte to serve out of a snapshot. `ref` is the snapshot id for drafts. */
  | { kind: 'asset'; slug: string; channel: Channel; ref?: string; path: string }
  | { kind: 'not-found' }

/**
 * The first path segment inside a site, reserved for the preview channel.
 *
 * A published snapshot may therefore not contain a top-level `draft` entry.
 * `1c deploy` refuses one outright (see `assertNoReservedSegment`), so the
 * collision is impossible rather than merely unlikely.
 */
export const DRAFT_SEGMENT = 'draft'

/** The path prefix every site is served under. */
export const SITE_SEGMENT = 'site'

/** Site slugs: a directory name in the store, so kept to boring filename characters. */
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

/**
 * Snapshot ids are a truncated tree digest (12 hex characters today). Matched
 * loosely on shape rather than pinned to a length so the id may grow without a
 * server change — the manifest, not this pattern, decides what actually exists.
 */
const SNAPSHOT_ID_PATTERN = /^[0-9a-f]{8,64}$/

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

export function isSnapshotId(ref: string): boolean {
  return SNAPSHOT_ID_PATTERN.test(ref)
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

  const slug = parts[1]
  if (slug === undefined || !isValidSlug(slug)) return { kind: 'not-found' }

  const rest = parts.slice(2)

  if (rest[0] === DRAFT_SEGMENT) {
    const ref = rest[1]
    if (ref === undefined || !isSnapshotId(ref)) return { kind: 'not-found' }
    const tail = rest.slice(2)
    if (tail.length === 0) {
      if (!trailingSlash) {
        return { kind: 'redirect', location: `${pathname}/`, channel: 'draft' }
      }
      return { kind: 'asset', slug, channel: 'draft', ref, path: 'index.html' }
    }
    return { kind: 'asset', slug, channel: 'draft', ref, path: tail.join('/') }
  }

  if (rest.length === 0) {
    if (!trailingSlash) {
      return { kind: 'redirect', location: `${pathname}/`, channel: 'published' }
    }
    return { kind: 'asset', slug, channel: 'published', path: 'index.html' }
  }

  return { kind: 'asset', slug, channel: 'published', path: rest.join('/') }
}
