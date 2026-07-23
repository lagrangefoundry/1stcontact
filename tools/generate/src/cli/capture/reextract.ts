/**
 * Offline re-extraction (DOC-13 §9 — "capture once, re-map forever"). A written
 * bundle is fully self-contained: `rendered.html` plus every mirrored asset. We
 * re-derive `capture.json` by serving the bundle over an ephemeral loopback
 * server and running the *same* pipeline against it — the live site is never
 * re-hit. This is a real navigation of mirrored bytes, not a `setContent()`
 * shell, so it stays faithful to DOC-13 §2.3.
 */
import { createServer } from 'node:http'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { runCapturePipeline, type CapturePipelineOptions } from './pipeline'
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

/**
 * The content-type for a mirrored file. Google Fonts' stylesheet mirrors as the
 * extensionless basename `css2`; a browser rejects a `<link rel=stylesheet>` whose
 * MIME is not `text/css` (strict MIME checking), so an extensionless mirror whose
 * bytes look like CSS is served as `text/css` rather than the octet-stream default.
 */
function contentTypeFor(file: string): string {
  const known = MIME[path.extname(file).toLowerCase()]
  if (known) return known
  const head = readFileSync(file).subarray(0, 512).toString('utf8')
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
 * Re-extract a capture from a written bundle with no access to the live site.
 * The bundle's `rendered.html` carries root-relative asset references (as
 * authored), so we serve `/` as the rendered DOM and resolve every other path
 * to a mirrored asset by basename.
 */
export async function reextractFromBundle(
  bundleDir: string,
  opts: CapturePipelineOptions = {},
): Promise<CaptureResult> {
  // BUG-16 — the mirrored asset basenames. `rendered.html` (and any mirrored CSS,
  // e.g. Google Fonts' `css2`) references cross-origin subresources by their live
  // ABSOLUTE URL (`https://fonts.gstatic.com/…/X.woff2`). Those never reach this
  // loopback server, so offline the browser hits the dead network and the intended
  // @font-face never loads — the run is measured against a fallback face (wrong
  // family + wrong glyph metrics, `fontLoaded:false`), breaking DOC-13 §9's
  // "capture once, re-map forever" promise. Rewriting every absolute URL whose
  // basename we mirrored to a loopback-relative `/<basename>` makes re-extraction
  // truly self-contained: the mirror is served instead of the live origin.
  const mirrored = existsSync(path.join(bundleDir, 'assets'))
    ? new Set(readdirSync(path.join(bundleDir, 'assets')))
    : new Set<string>()

  const server = createServer((req, res) => {
    const reqPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    let file: string
    if (reqPath === '/' || reqPath === '/index.html') {
      file = path.join(bundleDir, 'rendered.html')
    } else {
      const base = reqPath.split('/').filter(Boolean).pop() ?? ''
      const inAssets = path.join(bundleDir, 'assets', base)
      file = existsSync(inAssets) ? inAssets : path.join(bundleDir, base)
    }
    if (!existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    const contentType = contentTypeFor(file)
    // Rewrite absolute → mirrored-relative refs inside text assets (HTML/CSS) so
    // the browser fetches the mirror we serve, not the dead live origin.
    if (contentType.startsWith('text/html') || contentType.startsWith('text/css')) {
      res.setHeader('content-type', contentType)
      res.end(rewriteMirroredRefs(readFileSync(file, 'utf8'), mirrored))
      return
    }
    res.setHeader('content-type', contentType)
    res.end(readFileSync(file))
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const port = (server.address() as AddressInfo).port
    return await runCapturePipeline(`http://127.0.0.1:${port}/`, opts)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}
