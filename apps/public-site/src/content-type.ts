/**
 * Extension → MIME type for the file kinds a rendered snapshot contains (REQ-111).
 *
 * Deliberately derived from the served path rather than from R2's stored
 * `httpMetadata`, so what a client is told does not depend on whichever upload
 * mechanism happened to write the object. The table mirrors the one `1c deploy`
 * publishes with (`tools/generate/src/deploy/r2.ts`); the duplication is across
 * a deployment boundary — the Worker bundle cannot import Node-side deploy code
 * — and the pair is pinned together by a UAT rather than by hope.
 */
const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml',
  webmanifest: 'application/manifest+json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
}

/** The type to serve `path` as; `application/octet-stream` when the extension is unknown. */
export function contentTypeFor(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return 'application/octet-stream'
  return CONTENT_TYPES[name.slice(dot + 1).toLowerCase()] ?? 'application/octet-stream'
}
