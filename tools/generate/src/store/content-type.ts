/**
 * Extension → content type, for every path that has to name one (REQ-143).
 *
 * WHY IT MOVED HERE. This map used to live in `serve.ts`, which is a `node:http`
 * server and therefore unreachable from a Worker. The D1/R2 store needs the same
 * answers — an asset put into R2 carries its content type as object metadata, so
 * `readAsset` can hand back bytes that a response will label correctly — and a
 * second copy of the table is a drift waiting to happen: the day `.avif` is
 * added to one of them, whichever path did not get it starts serving
 * `application/octet-stream` for reasons no one will connect to the change.
 *
 * So the table lives in the store's worker-safe half and `serve.ts` reads it.
 * One table, every consumer.
 */
export const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

/** The lowercased extension of a store key (`wordmark.svg` → `.svg`), or ''. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

/**
 * The content type for a store key, falling back to the generic binary type.
 *
 * `application/octet-stream` rather than a guess: an unknown extension is
 * something the framework does not ship a renderer for, and labelling it as
 * something it might be is how a `.svg`-shaped hole becomes an XSS one.
 */
export function contentTypeOf(name: string): string {
  return MIME[extensionOf(name)] ?? 'application/octet-stream'
}
