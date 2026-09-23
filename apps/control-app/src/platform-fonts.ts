/**
 * [[REQ-312]] — the platform font mirror, answered at the **preview's** snapshot
 * root (`COMMENT-3711`).
 *
 * WHY THIS EXISTS IN A SECOND APP. A page's font `src` names no host: it is
 * root-relative, and the renderer reduces it to a reference against the page's own
 * directory so a snapshot is relocatable (`relativizeUrl`, REQ-109). That is what
 * makes a published site self-contained — and it also means the bytes ask for
 * `_fonts/x` from whatever root they are being served at. `public-site` has two
 * such roots; this Worker has two more, `/preview/<key>/<channel>/` and
 * `/portal/`. A surface that does not answer for them shows the operator a
 * fallback face while telling them they chose Roboto, which is the one thing a
 * preview must not do.
 *
 * ONE COPY STILL. Nothing here is per-site and nothing is written: this reads the
 * same `platform/fonts/` prefix `1c fonts publish` filled, through the same key
 * function, and serves it beside a draft that has no idea it is there.
 *
 * WHERE THE BYTES COME FROM IS INJECTED, because this app runs in two places that
 * have nothing in common below the seam. Deployed, it is the R2 bucket. In the
 * Node builder transport, `env.SITES` is a Proxy that throws by design, and the
 * bytes are the staged mirror on the operator's own disk — so the reader is a
 * `RouterDeps` entry like the store and the ladder, rather than a branch here on
 * which runtime is running.
 */
import { contentTypeOf } from '../../../tools/generate/src/store/content-type'
import { platformFontKey, platformFontTarget } from '../../../packages/site-schema/src/fonts'

/**
 * The mirrored file a preview-relative path addresses, or `null` for anything
 * else.
 *
 * ONE SPELLING: {@link platformFontTarget} is the same function `public-site`
 * resolves a published request with and `1c fonts check` resolves a page's `src`
 * with — so the three cannot come to disagree about what a platform font path is.
 * What this adds is only the leading slash a preview `rel` carries and a snapshot
 * path does not.
 */
export function previewFontTarget(rel: string): string | null {
  return platformFontTarget(rel.replace(/^\/+/, ''))
}

/** Where a preview's platform fonts are read from. */
export interface PlatformFontReader {
  /** The mirrored bytes at a mirror-relative path, or `null` when absent. */
  read(path: string): Promise<Uint8Array | null>
}

/** The deployed reader: the same bucket, prefix and key function `1c fonts publish` wrote. */
export function r2PlatformFonts(bucket: R2Bucket): PlatformFontReader {
  return {
    async read(path) {
      const object = await bucket.get(platformFontKey(path))
      if (!object) return null
      return new Uint8Array(await object.arrayBuffer())
    },
  }
}

/**
 * Answer for one mirrored file, or `null` when this reader does not hold it —
 * which the caller turns into its own 404 rather than into a different one.
 *
 * NOT CACHED IMMUTABLY THE WAY THE PUBLISHED ORIGIN'S COPY IS. A preview is an
 * operator looking at their own draft over a logged-in session, and every other
 * byte this router returns is stamped uncacheable on the way out; a font is not
 * the place to make an exception, and the saving would be one request on a
 * loopback or an authenticated origin.
 */
export async function servePreviewPlatformFont(
  path: string,
  reader: PlatformFontReader,
): Promise<Response | null> {
  const bytes = await reader.read(path)
  if (!bytes) return null
  // Derived from the SERVED PATH and never from stored metadata — the rule every
  // other byte on this platform already follows.
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: { 'content-type': contentTypeOf(path) },
  })
}
