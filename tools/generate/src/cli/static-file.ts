/**
 * Static-file resolution for every tree this repo serves over loopback.
 *
 * SPLIT OUT OF `serve.ts` (REQ-254), AND ONLY THAT. The rules below are
 * unchanged; what changed is what reaching them costs. `serve.ts` binds an
 * origin over a *site channel*, so it imports `distDir` from the node-only
 * store barrel — which drags the D1/R2 adapter and its `@cloudflare/workers-types`
 * ambients along with it. The reproduction console serves its own scratch
 * directories and needs none of that, and the alternative to this split was a
 * second copy of the confinement rule, which is exactly what `serve.ts`'s own
 * note says must not happen: a traversal guard present on one served tree and
 * missing on another.
 *
 * So there is still ONE definition of how a URL path becomes a file, and it is
 * now reachable without a store.
 */
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { contentTypeOf } from '../store/content-type'

/**
 * Resolve a URL path to a file inside `rootDir`, or a sentinel.
 *
 * Split out of the request handler (REQ-115) because the builder origin serves
 * several static trees — the rendered channels, the builder's own source, the
 * installed webui components — and every one of them needs the identical
 * confinement, directory-index and extensionless rules. One implementation, so
 * a traversal guard can never be present on one tree and missing on another.
 */
export async function resolveStaticFile(
  rootDir: string,
  pathname: string,
): Promise<string | null | 'forbidden'> {
  let rel = decodeURIComponent(pathname)
  if (rel.endsWith('/')) rel += 'index.html'
  // Resolve and confine to rootDir (no path traversal).
  const abs = path.join(rootDir, path.normalize(rel))
  if (!abs.startsWith(rootDir)) return 'forbidden'
  const info = await stat(abs).catch(() => null)
  let file = info?.isDirectory() ? path.join(abs, 'index.html') : abs
  let finalInfo = info?.isDirectory() ? await stat(file).catch(() => null) : info
  /**
   * REQ-113 — extensionless → sibling `.html`. `renderSite` emits a page at
   * `<slug>.html`, and Cloudflare Pages serves that at `/<slug>`. Without this
   * the preview server disagrees with production on the very URL the author
   * writes into the nav, and the tempting "fix" is to bake `.html` into the
   * site — wrong environment, permanent cost.
   *
   * Applied to `abs`, which is already confined to `rootDir`, so appending a
   * suffix cannot widen reach. Gated on there being no extension, so a missing
   * asset still 404s instead of silently returning HTML with the wrong MIME.
   * Runs last, so a real directory's `index.html` always wins over `<dir>.html`.
   */
  if (!finalInfo && !path.extname(abs)) {
    const htmlPath = `${abs}.html`
    const htmlInfo = await stat(htmlPath).catch(() => null)
    if (htmlInfo?.isFile()) {
      file = htmlPath
      finalInfo = htmlInfo
    }
  }
  return finalInfo ? file : null
}

/**
 * The one freshness directive this platform serves, written once.
 *
 * Both senders compose it from here rather than restating the string, so the
 * two cannot drift into near-misses — `no-store` on one path and
 * `no-store, must-revalidate` on another is the same hole in slow motion.
 */
export const NO_STORE = 'no-store, must-revalidate'

/**
 * Stream a resolved file with its content type.
 *
 * `no-store` because every byte this serves is a build artifact that the origin
 * itself rewrites underneath the browser — a save re-renders the channel the
 * preview iframe is currently showing. Without it the response carries no
 * freshness directive AND no validator (no `ETag`, no `Last-Modified`), which
 * is the worst combination available: the browser is free to apply heuristic
 * freshness, and a reload has nothing to revalidate *with*, so the iframe can
 * answer a post-save reload from cache and show the edit as having silently
 * failed. Correct bytes on disk, stale bytes on screen.
 *
 * This is a dev origin serving live-rebuilt artifacts, so there is nothing to
 * trade away: caching buys no meaningful speed here and costs correctness.
 */
export function sendFile(res: http.ServerResponse, file: string): void {
  res.writeHead(200, {
    'content-type': contentTypeOf(file),
    'cache-control': NO_STORE,
  })
  createReadStream(file).pipe(res)
}
