/**
 * [[REQ-312]] — the shared platform font mirror, served **on the site's own
 * domain**.
 *
 * `_fonts/…` is where every tenant's pages load a platform font from. One shared
 * copy in R2, not a copy per site: fonts are small, but copying them around gets
 * fiddly in the way that rots, and shared storage turns a font takedown from an
 * N-tenant sweep with N rebuilds into a registry flip plus a purge.
 *
 * WHAT IS SERVED HERE
 *   `<root>/_fonts/<slug>/<file>.woff2`  the face
 *   `<root>/_fonts/<slug>/OFL.txt`       that family's own licence notice, beside
 *                                        its bytes, because OFL requires the
 *                                        notice to travel with the distribution
 *   `<root>/_fonts/LICENSES.txt`         the aggregate index over every family
 *
 * `<root>` IS THE SNAPSHOT ROOT AND THIS WORKER HAS TWO OF THEM (`COMMENT-3711`).
 * A page's `src` is root-relative and the renderer reduces it to a
 * document-relative reference so a snapshot is relocatable (`relativizeUrl`,
 * REQ-109) — so the SAME bytes ask for `_fonts/x` from `/` on a bound customer
 * domain and from `/site/<key>/` on the platform's own host. Answering only the
 * first would 404 every font on the second, which is why the match is made on the
 * parsed route's path rather than on the request pathname: the grammar has already
 * taken the root off, whichever root it was, and has already refused the traversal
 * and percent-encoding cases.
 *
 * ANSWERED BEFORE THE CROSS-TENANT GUARD, and that is not an optimisation. A
 * platform font belongs to no site, so resolving `/site/<key>/_fonts/x` through
 * `siteOfRoute` would ask whether this host may serve THAT SITE — and on a bound
 * customer domain the correct answer to that question is "no", which is the wrong
 * answer to this one. Nothing leaks by skipping it: the bytes are the same for
 * every tenant and the key in the path selects none of them. `_fonts` is a
 * reserved first segment of a snapshot, so no published page can shadow it, and
 * the leading underscore keeps it out of the space of names a person would give a
 * page.
 *
 * IMMUTABLE, AND THAT IS WHAT MAKES ONE COPY ENOUGH. A mirrored file's name
 * changes when upstream's bytes do — the manifest pins both — so it can be cached
 * for a year. `Access-Control-Allow-Origin: *` is no longer load-bearing now that
 * a font is an ordinary same-origin subresource, and is kept only for the case
 * that still is cross-origin: a preview served from a different host than the one
 * the page will finally live on.
 */
import { contentTypeOf } from '../../../tools/generate/src/store/content-type'
import { platformFontKey, platformFontTarget } from '../../../packages/site-schema/src/fonts'
import type { Route } from './routes'

/**
 * The mirror-relative path this ROUTE addresses, or `null` when it addresses no
 * platform font.
 *
 * IT TAKES THE PARSED ROUTE AND NOT THE PATHNAME, which is what makes one rule
 * cover both of this Worker's snapshot roots — see the module note. `apex` and
 * `asset` are the two kinds that carry a snapshot-relative path; a `redirect` or
 * a `not-found` addresses no byte at all, so neither can be a font.
 *
 * ONE SPELLING: {@link platformFontTarget} is the same function `1c fonts check`
 * resolves a page's `src` with, and the same one the builder preview answers on.
 * A second parser here is how a page comes to reference a font the gate passed
 * and this Worker has never heard of.
 */
export function platformFontOfRoute(parsed: Route): string | null {
  if (parsed.kind !== 'apex' && parsed.kind !== 'asset') return null
  return platformFontTarget(parsed.path)
}

/** A year — see the module note on why these bytes may be cached for one. */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

/**
 * Serve one mirrored object.
 *
 * A 404 here means the mirror does not hold it, which — for a page that cleared
 * `1c fonts check` — means the mirror was never published rather than that the
 * page is wrong. That is the same absence `1c fonts check` reports as
 * *NOT POPULATED*, seen from the serving end.
 */
export async function servePlatformFont(
  path: string,
  request: Request,
  bucket: R2Bucket,
): Promise<Response> {
  const object = await bucket.get(platformFontKey(path))
  if (!object) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const headers = new Headers({
    // Derived from the SERVED PATH and never from R2's stored metadata, the rule
    // every other byte this Worker hands back already follows: what a visitor is
    // told does not depend on whichever upload mechanism wrote the object.
    'content-type': contentTypeOf(path),
    'cache-control': IMMUTABLE_CACHE,
    'access-control-allow-origin': '*',
    etag: object.httpEtag,
  })
  // A `HEAD` is answered with the headers and no body, so a client can ask how
  // big a face is without paying for it.
  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}
