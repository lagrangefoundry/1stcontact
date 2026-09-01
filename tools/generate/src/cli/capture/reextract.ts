/**
 * Offline re-extraction ([[DOC-13]] §9 — "capture once, re-map forever"). A
 * written bundle is fully self-contained: `rendered.html` plus every mirrored
 * asset. We re-derive `capture.json` by serving the bundle over an ephemeral
 * loopback server and running the *same* pipeline against it — the live site is
 * never re-hit. This is a real navigation of mirrored bytes, not a
 * `setContent()` shell, so it stays faithful to [[DOC-13]] §2.3.
 *
 * THIS MODULE READS THROUGH THE PORT AND STILL DOES NOT RUN IN A WORKER, and the
 * two halves of that sentence are the REQ-155 decision. Its `readdirSync` was the
 * stated reason {@link ReferenceBundle.list} exists, and it is gone: the members
 * arrive as bytes from whichever adapter the caller holds, so a bundle in R2
 * re-extracts as readily as one on disk. What cannot move is `createServer` —
 * the real navigation above is the point, and workerd has no loopback server to
 * perform it against. So this keeps `node:http`/`node:net`, stays node-only, and
 * is reached the same way `playwright-driver` is. A Worker route streaming
 * members to a browser over the public internet is a different design, with
 * [[REQ-154]]'s Access problem attached, and is not this ticket.
 *
 * THE BUNDLE IS HELD IN MEMORY while the server runs. Real bundles measured at
 * 11–23MB whole ([[DOC-38]] §14), which is nothing for a node process and is the
 * price of not having a path to open lazily. The largest single member observed
 * is 7.4MB.
 */
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { runCapturePipeline, type CapturePipelineOptions } from './pipeline'
import { ASSETS_PREFIX, RENDERED_MEMBER, type ReferenceBundle } from '../../store/reference-store'
import type { CaptureResult } from './types'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

/** The extension of a member key, lowercased, or `''` when it has none. */
function extname(member: string): string {
  const base = member.split('/').pop() ?? ''
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(dot).toLowerCase() : ''
}

/**
 * The content-type for a mirrored member. Google Fonts' stylesheet mirrors as the
 * extensionless basename `css2`; a browser rejects a `<link rel=stylesheet>` whose
 * MIME is not `text/css` (strict MIME checking), so an extensionless mirror whose
 * bytes look like CSS is served as `text/css` rather than the octet-stream default.
 */
export function contentTypeFor(member: string, bytes: Uint8Array): string {
  const known = MIME[extname(member)]
  if (known) return known
  const head = new TextDecoder().decode(bytes.subarray(0, 512))
  if (/@font-face|@import|:root\s*\{|\/\*/.test(head)) return 'text/css; charset=utf-8'
  return 'application/octet-stream'
}

/**
 * Rewrite every absolute `http(s)` URL inside a text asset whose basename (path
 * tail, sans query/fragment) is a mirrored asset → a loopback-relative
 * `/<basename>`. Precise by construction: only URLs we actually hold a mirror for
 * are touched, so a live URL with no mirror is left to fail exactly as before.
 */
export function rewriteMirroredRefs(text: string, mirrored: Set<string>): string {
  return text.replace(/https?:\/\/[^\s"'()<>]+/g, (url) => {
    const base = url.split('#')[0].split('?')[0].split('/').filter(Boolean).pop() ?? ''
    return mirrored.has(base) ? '/' + base : url
  })
}

/**
 * Re-extract a capture from a stored bundle with no access to the live site.
 * The bundle's `rendered.html` carries root-relative asset references (as
 * authored), so we serve `/` as the rendered DOM and resolve every other path
 * to a mirrored asset by basename.
 */
export async function reextractFromBundle(
  bundle: ReferenceBundle,
  opts: CapturePipelineOptions = {},
): Promise<CaptureResult> {
  const rendered = await bundle.read(RENDERED_MEMBER)
  if (!rendered) {
    throw new Error(`Bundle '${bundle.name}' has no ${RENDERED_MEMBER} to re-extract from.`)
  }

  // BUG-16 — the mirrored asset basenames. `rendered.html` (and any mirrored CSS,
  // e.g. Google Fonts' `css2`) references cross-origin subresources by their live
  // ABSOLUTE URL (`https://fonts.gstatic.com/…/X.woff2`). Those never reach this
  // loopback server, so offline the browser hits the dead network and the intended
  // @font-face never loads — the run is measured against a fallback face (wrong
  // family + wrong glyph metrics, `fontLoaded:false`), breaking DOC-13 §9's
  // "capture once, re-map forever" promise. Rewriting every absolute URL whose
  // basename we mirrored to a loopback-relative `/<basename>` makes re-extraction
  // truly self-contained: the mirror is served instead of the live origin.
  const assetKeys = await bundle.list(ASSETS_PREFIX)
  const byBasename = new Map<string, Uint8Array>()
  for (const key of assetKeys) {
    const bytes = await bundle.read(key)
    if (bytes) byBasename.set(key.slice(ASSETS_PREFIX.length), bytes)
  }
  const mirrored = new Set(byBasename.keys())

  /** A request path → the member bytes and the key they came from, or null. */
  const resolve = async (reqPath: string): Promise<{ key: string; bytes: Uint8Array } | null> => {
    if (reqPath === '/' || reqPath === '/index.html') {
      return { key: RENDERED_MEMBER, bytes: rendered }
    }
    const base = reqPath.split('/').filter(Boolean).pop() ?? ''
    const inAssets = byBasename.get(base)
    if (inAssets) return { key: `${ASSETS_PREFIX}${base}`, bytes: inAssets }
    // A top-level member (a sibling of `rendered.html`) — the same fallback the
    // filesystem version made when the name was not under `assets/`.
    const top = await bundle.read(base)
    return top ? { key: base, bytes: top } : null
  }

  const server = createServer((req, res) => {
    const reqPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    void resolve(reqPath).then((hit) => {
      if (!hit) {
        res.statusCode = 404
        res.end()
        return
      }
      const contentType = contentTypeFor(hit.key, hit.bytes)
      res.setHeader('content-type', contentType)
      // Rewrite absolute → mirrored-relative refs inside text assets (HTML/CSS) so
      // the browser fetches the mirror we serve, not the dead live origin.
      if (contentType.startsWith('text/html') || contentType.startsWith('text/css')) {
        res.end(rewriteMirroredRefs(new TextDecoder().decode(hit.bytes), mirrored))
        return
      }
      res.end(Buffer.from(hit.bytes))
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const port = (server.address() as AddressInfo).port
    return await runCapturePipeline(`http://127.0.0.1:${port}/`, opts)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}
