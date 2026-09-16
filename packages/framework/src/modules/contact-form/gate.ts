/**
 * What a gated download link OPENS, as the two servers that answer it agree it
 * ([[REQ-244]], [[BUG-97]]).
 *
 * WHY THIS IS HERE AND NOT IN A WORKER. `fields.ts` already owns
 * {@link DOWNLOAD_PATH} for the reason it owns {@link LEAD_PATH}: the parties
 * that must agree on a `contact-form`'s vocabulary cannot see each other. That
 * argument was written about two parties and there are three now —
 * `public-site`, which answers the link a visitor to a published site follows;
 * `control-app`, which answers the link the operator follows out of a preview
 * submission ([[BUG-97]]); and `control-app` again, which composes both. So the
 * GRAMMAR and the PAGE move here beside the path constant, and neither server
 * holds a copy.
 *
 * IT RETURNS DATA AND NEVER A `Response`. This module is loaded by a renderer
 * and by two Workers, and the one thing it must not do is make either server's
 * answer depend on a `Response` constructed somewhere neither of them can see —
 * see {@link GATE_HEADERS} for the part that must NOT be left to each caller.
 */

import { DOWNLOAD_PATH } from './fields'

/**
 * Which token, and which artifact of it, a download path names — or `null` when
 * the path is not the endpoint at all.
 *
 * `assetKey` is `null` for the page that LISTS the artifacts, and set for one
 * of them.
 */
export interface DownloadTarget {
  token: string
  /** The artifact they are taking, or `null` for the page that lists them. */
  assetKey: string | null
}

/**
 * The gate this path names, or `null`.
 *
 * `path` IS ALREADY RELATIVE TO THE SITE'S CHANNEL ROOT and carries no leading
 * slash — `api/download/<token>` — because that is the one shape both servers
 * can produce. `public-site` gets it from `parseRoute`, which has already
 * decided what the request's site key is and rejected the traversal and
 * percent-encoding cases; `control-app`'s preview gets it from the tail of its
 * own channel route. Neither hands this function a whole URL, so this function
 * cannot be the place a site key is decided — which is the property that keeps
 * the key something the SERVER resolved rather than something the caller named.
 *
 * EXACTLY TWO SHAPES, `<token>` AND `<token>/<assetKey>`. A third segment is not
 * a deeper gate, it is a caller guessing — so it is not the endpoint, and meets
 * whatever the ordinary serving path says about it.
 */
export function parseDownloadPath(path: string): DownloadTarget | null {
  const prefix = `${DOWNLOAD_PATH}/`
  if (!path.startsWith(prefix)) return null
  const parts = path.slice(prefix.length).split('/')
  if (parts.length > 2) return null
  const [token, assetKey] = parts
  if (!token) return null
  if (parts.length === 2 && !assetKey) return null
  return { token, assetKey: parts.length === 2 ? assetKey : null }
}

/**
 * A gated response is nobody else's, ever.
 *
 * `private` NAMES THE SHARED EDGE CACHE AS THE ONE PLACE THESE BYTES MUST NOT
 * GO, which for a page minted per contact is the difference between tracking one
 * person and serving the first arrival's page to everybody.
 *
 * SHIPPED WITH THE PAGE AND NOT LEFT TO THE CALLER, which is the whole reason
 * {@link downloadsPage} answers headers as well as a body. Two servers now
 * answer this page; a cache directive one of them had to remember to set is a
 * cache directive one of them eventually does not.
 */
export const GATE_CACHE = 'private, no-store'

/** Exactly the headers a gated page or artifact is answered with. */
export const GATE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'cache-control': GATE_CACHE,
  'x-robots-tag': 'noindex',
})

/** One artifact, as the page lists it. Where its bytes are is not the page's. */
export interface ListedAsset {
  key: string
  name: string
}

/** A page, as a server that has to answer it needs it. */
export interface GatePageBody {
  body: string
  headers: Record<string, string>
}

/** `&`, `<`, `>`, `"` — everything that could change what a name means in markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The page itself — a heading and the links, and deliberately nothing else.
 *
 * THIN IS THE DESIGN AND NOT A PLACEHOLDER ([[REQ-244]] §3). There is no beacon
 * and no client-side timer, so the interval between arriving and taking a paper
 * is the engagement signal — and that reading only holds while the page's whole
 * content IS the links. Anything else to read here would make the interval
 * measure the reading rather than the deciding.
 *
 * LINKS ARE BUILT FROM THE REQUEST'S OWN PATH rather than written relative. A
 * document-relative `<token>/<key>` resolves against the URL's DIRECTORY, which
 * is one segment above where the token sits — correct by accident today and
 * wrong the moment the path gains or loses a segment. `pathname` is therefore
 * the REQUEST's, whichever channel root it sat under, which is exactly what lets
 * one page serve a published site and a preview without knowing which it is in.
 *
 * AN EMPTY SET IS A PAGE AND NOT A 404. The form promised something when the mail
 * went out; a later publish can take it away, and telling the person who was sent
 * the link that their link is broken is worse than telling them there is nothing
 * here at the moment.
 */
export function downloadsPage(pathname: string, assets: readonly ListedAsset[]): GatePageBody {
  const base = pathname.replace(/\/+$/, '')
  const items = assets
    .map(
      (asset) =>
        `<li><a href="${escapeHtml(`${base}/${encodeURIComponent(asset.key)}`)}">` +
        `${escapeHtml(asset.name)}</a></li>`,
    )
    .join('')
  const body = [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex">',
    '<title>Your downloads</title></head>',
    '<body><h1>Your downloads</h1>',
    items === ''
      ? '<p>There is nothing here at the moment.</p>'
      : `<p>Here is what you asked for.</p><ul>${items}</ul>`,
    '</body></html>',
  ].join('')
  return {
    body,
    headers: { 'content-type': 'text/html; charset=utf-8', ...GATE_HEADERS },
  }
}
