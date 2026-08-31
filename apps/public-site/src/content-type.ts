/**
 * Extension → MIME type for the file kinds a rendered snapshot contains (REQ-111).
 *
 * Deliberately derived from the served path rather than from R2's stored
 * `httpMetadata`, so what a client is told does not depend on whichever upload
 * mechanism happened to write the object.
 *
 * THE PUBLISH SIDE STATES THE SAME TABLE, in `tools/generate/src/store/content-type.ts`
 * — where REQ-143 put it when the D1/R2 store replaced the `1c deploy` R2 module
 * this comment used to name. That copy labels objects as they are written; this
 * one labels them as they are served, and a Worker bundle cannot import the
 * Node-side package, so the duplication is across a deployment boundary rather
 * than an oversight.
 *
 * The copy that is pinned to this one by a UAT is `bin/smoke`'s, which runs
 * outside the bundle for the same reason (REQ-144).
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
