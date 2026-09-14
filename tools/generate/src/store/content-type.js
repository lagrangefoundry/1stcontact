/**
 * Extension → content type, for every path that has to name one (REQ-143).
 *
 * WHY IT LIVES HERE. This map used to live in `serve.ts`, which is a `node:http`
 * server and therefore unreachable from a Worker. The D1/R2 store needs the same
 * answers — an asset put into R2 carries its content type as object metadata, so
 * `readAsset` can hand back bytes that a response will label correctly — and a
 * second copy of the table is a drift waiting to happen: the day `.avif` is
 * added to one of them, whichever path did not get it starts serving
 * `application/octet-stream` for reasons no one will connect to the change.
 *
 * THE DRIFT THIS HEADER PREDICTED DID HAPPEN ([[REQ-246]]). Three more copies
 * grew anyway — `apps/public-site/src/content-type.ts`, which held `otf`, `txt`,
 * `xml`, `mjs` and `webmanifest` that this one did not; `capture-material.ts`'s
 * `memberContentType`; and `capture/reextract.ts`'s own literal. All four are
 * merged here and all four call sites read {@link contentTypeOf}, which is why
 * the table itself is NOT exported: one table is only one table while there is
 * one way to read it. {@link contentTypeEntries} exists for a test that wants to
 * enumerate it, and for nothing else.
 *
 * (`material.ts`'s `TYPE_BY_EXTENSION` is deliberately NOT one of these. It is
 * not a general MIME database — every row is a format some step of the ingestion
 * pipeline can actually read — and it answers a different question: what a file
 * whose own declared type said *nothing* probably is. It stays separate.)
 *
 * ACTIVE VERSUS INERT, AND WHY THE SPLIT IS IN THE SOURCE. Serving an upload
 * under its real type turns the site's own origin into a place where a visitor's
 * browser will run what somebody put there — but only for the handful of types a
 * browser EXECUTES. That surface is already open: `html`, `js` and `svg` have
 * been served with their real types out of this bucket since the beginning, and
 * widening the table with documents, archives and media does not widen it,
 * because none of those is script. The two groups are separate literals so the
 * next addition has to decide which one it belongs in rather than appending to
 * an undifferentiated list.
 */

/** The answer for an extension the table does not hold. */
export const OCTET_STREAM = 'application/octet-stream'

/**
 * Types a browser will EXECUTE on our own origin.
 *
 * Every entry here is a stored-XSS surface: the bytes come out of the same
 * bucket a client's upload lands in, under the site's own hostname, so a
 * document the browser runs runs as the site. This group is closed — REQ-246
 * added nothing to it — and a new row is a security decision, not a convenience.
 *
 * `xml` is in here rather than with the documents because an XML document may
 * carry an `xml-stylesheet` processing instruction, and XSLT is a language.
 */
/** @type {Record<string, string>} */
const ACTIVE = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
}

/**
 * Types a browser renders or downloads and does not run.
 *
 * Breadth is safe here and is the point: a site carries a brochure, a price
 * list, a whitepaper and a video, and labelling each of them
 * `application/octet-stream` makes a browser download something it could have
 * shown.
 */
/** @type {Record<string, string>} */
const INERT = {
  // Stylesheets and data the render itself emits.
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',

  // Text a site serves directly — `robots.txt` is the one every site has.
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',

  // Images.
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  // REQ-218 — the drift this table's own header warns about, found by the first
  // consumer that needed every image type rather than the ones a site renders:
  // `edit.ts` has counted `.gif` and `.avif` as images since REQ-118 while this
  // table had no entry for either, so both were labelled `application/octet-stream`.
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',

  // Fonts.
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',

  // Documents — `.pdf` is the row REQ-246 was opened for. A whitepaper served as
  // `application/pdf` opens in the browser; whether a GATED delivery should
  // instead force a download is a `content-disposition` decision and is not made
  // by this table.
  '.pdf': 'application/pdf',
  '.rtf': 'application/rtf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives — a download, always.
  '.zip': 'application/zip',
  '.gz': 'application/gzip',

  // Media.
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
}

/** Every extension this table knows, in one map. Deliberately not exported. */
/** @type {Record<string, string>} */
const MIME = { ...ACTIVE, ...INERT }

/**
 * The types a browser executes, as VALUES rather than extensions.
 *
 * Exported so the claim "REQ-246 added no active type" is assertable against an
 * enumeration rather than against a reading of the diff.
 */
/** @type {readonly string[]} */
export const ACTIVE_CONTENT_TYPES = Object.freeze([
  ...new Set(Object.values(ACTIVE)),
])

/** Whether a content type is one a browser will run on our own origin. */
/**
 * @param {string} type
 * @returns {boolean}
 */
export function isActiveContentType(type) {
  return ACTIVE_CONTENT_TYPES.includes(type)
}

/**
 * The table, for a test that wants to enumerate it. Not a second reader:
 * production code asks {@link contentTypeOf} and nothing else.
 */
/** @returns {ReadonlyArray<readonly [string, string]>} */
export function contentTypeEntries() {
  return Object.entries(MIME)
}

/**
 * The lowercased extension of a store key or served path (`wordmark.svg` →
 * `.svg`), or `''`.
 *
 * PATH-AWARE, AND THAT IS WHAT LETS THE SERVED PATH AND THE STORED NAME SHARE
 * ONE READER ([[REQ-246]]). `public-site` asked this question of a whole key
 * (`sites/<k>/rev/3/out/assets/hero.png`) and had its own copy to do it with;
 * taking the last segment first means `a.b/c` has no extension rather than one
 * spelled `.b/c`.
 *
 * A LEADING DOT IS NOT AN EXTENSION: `.gitignore` is a name, not a bare
 * `gitignore` file, and `public-site`'s `dot <= 0` guard already said so.
 */
/**
 * @param {string} name
 * @returns {string}
 */
export function extensionOf(name) {
  const base = name.slice(name.lastIndexOf('/') + 1)
  const dot = base.lastIndexOf('.')
  return dot <= 0 ? '' : base.slice(dot).toLowerCase()
}

/**
 * The content type for a store key or a served path, falling back to the generic
 * binary type.
 *
 * `application/octet-stream` rather than a guess: an unknown extension is
 * something the framework does not ship a renderer for, and labelling it as
 * something it might be is how a `.svg`-shaped hole becomes an XSS one.
 */
/**
 * @param {string} name
 * @returns {string}
 */
export function contentTypeOf(name) {
  return MIME[extensionOf(name)] ?? OCTET_STREAM
}
