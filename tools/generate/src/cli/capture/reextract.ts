/**
 * Offline re-extraction (DOC-13 §9 — "capture once, re-map forever"). A written
 * bundle is fully self-contained: `rendered.html` plus every mirrored asset. We
 * re-derive `capture.json` by serving the bundle over an ephemeral loopback
 * server and running the *same* pipeline against it — the live site is never
 * re-hit. This is a real navigation of mirrored bytes, not a `setContent()`
 * shell, so it stays faithful to DOC-13 §2.3.
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
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
 * Re-extract a capture from a written bundle with no access to the live site.
 * The bundle's `rendered.html` carries root-relative asset references (as
 * authored), so we serve `/` as the rendered DOM and resolve every other path
 * to a mirrored asset by basename.
 */
export async function reextractFromBundle(
  bundleDir: string,
  opts: CapturePipelineOptions = {},
): Promise<CaptureResult> {
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
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
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
