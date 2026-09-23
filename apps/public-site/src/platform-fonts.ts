/**
 * [[REQ-312]] — the platform font origin.
 *
 * `/_fonts/…` is the one place every tenant's pages load a platform font from.
 * One shared copy, not a copy per site: fonts are small, but copying them around
 * gets fiddly in the way that rots, and shared serving turns a font takedown from
 * an N-tenant sweep with N rebuilds into a registry flip plus a purge.
 *
 * WHAT IS SERVED HERE
 *   `/_fonts/<slug>/<file>.woff2`  the face
 *   `/_fonts/<slug>/OFL.txt`       that family's own licence notice, beside its
 *                                  bytes, because OFL requires the notice to
 *                                  travel with the distribution
 *   `/_fonts/LICENSES.txt`         the aggregate index over every mirrored family
 *
 * ANSWERED BEFORE THE SITE GRAMMAR, and that is not an optimisation. A platform
 * font belongs to no site, so resolving it through `siteOfRoute` would ask the
 * cross-tenant guard a question it has no business answering — and get the wrong
 * answer on a bound customer domain, where that guard exists to refuse anything
 * that is not this host's site. `_fonts` is therefore a reserved first segment:
 * no published page can shadow it, and the leading underscore keeps it out of the
 * space of names a person would give a page.
 *
 * IMMUTABLE AND CROSS-ORIGIN, which is what makes one copy enough. A mirrored
 * file's name changes when upstream's bytes do — the manifest pins both — so it
 * can be cached for a year; and `Access-Control-Allow-Origin: *` is what lets
 * `alicesplumbing.com` load a face from the platform's origin at all, since a
 * font is a CORS-restricted subresource whatever its cache headers say.
 */

import { contentTypeOf } from '../../../tools/generate/src/store/content-type'
import { parsePlatformFontSrc, platformFontKey } from '../../../packages/site-schema/src/fonts'

/**
 * The mirror-relative path this request addresses, or `null` when it addresses no
 * platform font.
 *
 * ONE SPELLING, and it is the same function `1c fonts check` resolves a page's
 * `src` with. A second parser here is how a page comes to reference a font the
 * gate passed and this Worker has never heard of.
 */
export function platformFontTarget(pathname: string): string | null {
  return parsePlatformFontSrc(pathname)
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
