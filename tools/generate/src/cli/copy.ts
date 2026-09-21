import { BUSINESSES_PATH, type BusinessesPayload } from '../../../../apps/control-app/src/router'
import { businessPath } from '../../../../apps/control-app/src/scope'
import {
  postSitePayload,
  type AccessServiceToken,
  type PushResult,
  type SitePayload,
} from './push'

/**
 * Copying one business's site between the local builder and the deployed one
 * ([[REQ-289]]).
 *
 * WHY IT IS NOT CALLED `publish`. `publish` already names an operation — take a
 * draft, freeze it as a version, make that version live. The push script this
 * replaced borrowed the word for a different one on a different axis: copy bytes
 * from this laptop to Cloudflare. Worse, it copied the wrong thing. It read the
 * git-tracked file tier, and the sites that actually exist were authored in the
 * builder and live in D1 and R2 — so until this pair there had never been a
 * command that moves a builder-authored site anywhere. REQ-290 retired both the
 * script and the tier it read.
 *
 * WHY IT IS TWO HTTP CALLS AND NOT A THIRD STORE ADAPTER. Under `wrangler dev`
 * the source is a miniflare SQLite file whose layout is an implementation
 * detail, plus a second SQLite and a blob directory beside it. Reading those
 * from Node is a store adapter with no contract behind it — which is exactly
 * the argument `push.ts` already makes for why an import is port-to-port and
 * writes through the Worker. This is that argument in reverse: the Worker
 * reads, through the very store it serves from, and this side chooses the two
 * origins.
 *
 * WHICH MAKES DIRECTION THE ONLY THING THAT VARIES. dev→prod, prod→dev and a
 * backup are the same route, the same payload and the same pair of calls with
 * the ends swapped — so there is one implementation here and two names in
 * `bin/`, because the operator reads the name back later and has to know which
 * way the bytes went.
 */

/** The deployed builder. Named here so neither script can spell it differently. */
export const CLOUD_ORIGIN = 'https://app.1stcontact.io'

/** `wrangler dev`'s control app. `--origin` overrides it; see {@link CopyOptions.local}. */
export const LOCAL_ORIGIN = 'http://localhost:8788'

/** Which way the bytes go. It is in the command's name, not in a flag. */
export type CopyDirection = 'to-cloud' | 'from-cloud'

/**
 * What is being copied.
 *
 * `contacts` IS RECOGNISED AND NOT IMPLEMENTED, AND THAT IS THE POINT
 * ([[REQ-289]]). See {@link assertDataClass}: the two directions answer
 * differently, and the difference is a decision rather than a gap, so it is
 * written down before the feature exists instead of being discovered by
 * whoever builds it.
 */
export type DataClass = 'site' | 'contacts'

/** One business, as the side that holds it names it. */
export interface BusinessRef {
  id: string
  name: string
}

export interface CopyOptions {
  direction: CopyDirection
  /** The non-cloud end — `wrangler dev`, or `bin/access-sim` in front of it. */
  local?: string
  /** The cloud end. Overridable so a UAT can aim both ends at a fake. */
  cloud?: string
  /**
   * The Cloudflare Access service token, sent to BOTH ends when it is set.
   *
   * REQUIRED FOR THE CLOUD END and merely useful for the other one. Access
   * fronts `app.1stcontact.io`, so a copy that touches it without the pair is
   * refused at the edge; but the local builder run behind `bin/access-sim` is
   * reached exactly the way production is — that is what `--origin` is for —
   * and it needs the same credential. Sending it to whichever end was asked for
   * costs nothing when that end does not care, and withholding it from the
   * local end would make the simulator unreachable for no reason.
   */
  access?: AccessServiceToken
  /** Replace a target carrying builder changes (BUG-51). Forwarded, never defaulted. */
  force?: boolean
  /** Defaults to `site`. See {@link assertDataClass}. */
  klass?: DataClass
  fetch?: typeof fetch
}

/** Where the bytes are read from and where they are written to. */
export interface CopyEnds {
  source: string
  destination: string
}

/**
 * The two origins, chosen by direction.
 *
 * ONE FUNCTION, so "from-cloud is to-cloud with the ends swapped" is a fact
 * about the code and not a claim in a comment.
 */
export function endsFor(
  direction: CopyDirection,
  local: string = LOCAL_ORIGIN,
  cloud: string = CLOUD_ORIGIN,
): CopyEnds {
  return direction === 'to-cloud'
    ? { source: local, destination: cloud }
    : { source: cloud, destination: local }
}

/**
 * Refuse a data class this direction may not carry — before anything is read.
 *
 * `--contacts` ON `copy-from-cloud` IS REFUSED WITH ITS REASON, and the refusal
 * is here before the feature is. Contacts are real people's data; a laptop's
 * dev store runs with `ACCESS_DEV_OPEN=1`, which is a builder reachable on
 * loopback with no identity check at all. Pulling a customer's contacts into it
 * is not a smaller version of copying a site, and the asymmetry has to be
 * written down now — otherwise whoever implements `--contacts` later makes it
 * symmetric without ever meeting the decision.
 *
 * ON `copy-to-cloud` IT IS SIMPLY NOT BUILT YET, which is a different sentence
 * and gets one.
 *
 * NEITHER IS AN UNKNOWN-FLAG ERROR. The flag is known; what it means is the
 * thing being stated.
 */
export function assertDataClass(klass: DataClass, direction: CopyDirection): void {
  if (klass !== 'contacts') return
  if (direction === 'from-cloud') {
    throw new Error(
      'copy-from-cloud will not carry --contacts. Contacts are real people, and ' +
        'the local builder runs with ACCESS_DEV_OPEN=1 — a copy would put a ' +
        "customer's contact records in a store reachable on loopback with no " +
        'identity check. This is a decision, not a gap; copy the site instead.',
    )
  }
  throw new Error(
    'copy-to-cloud does not carry --contacts yet. Only --site is implemented. ' +
      'The flag is recognised so that it can be refused rather than misread.',
  )
}

/**
 * The service-token pair, or nothing — never half of one.
 *
 * HALF A CREDENTIAL IS NOT A WEAKER CREDENTIAL. A request carrying one header
 * is declined at the edge with a message about identity rather than about the
 * half that was missing here, so the refusal belongs on this side. Lifted out
 * of the push handler so both commands refuse identically.
 *
 * `CLOUDFLARE_API_TOKEN` IS NAMED IN THE REFUSAL because it is the credential
 * an operator reaches for and the one thing that cannot work: it is an API
 * credential for `api.cloudflare.com`, and Access exchanges a service-token
 * pair at the edge for the JWT it forwards. Being told it is refused "like no
 * credential at all" only helps if the sentence says the name.
 */
export function serviceToken(
  clientId: string | undefined,
  clientSecret: string | undefined,
): AccessServiceToken | undefined {
  const id = (clientId ?? '').trim()
  const secret = (clientSecret ?? '').trim()
  if (id !== '' && secret !== '') return { clientId: id, clientSecret: secret }
  if (id === '' && secret === '') return undefined
  throw new Error(
    'A Cloudflare Access service token is a PAIR. Set both CF_ACCESS_CLIENT_ID ' +
      'and CF_ACCESS_CLIENT_SECRET (or pass both --client-id and --client-secret). ' +
      'CLOUDFLARE_API_TOKEN is an API credential for api.cloudflare.com and is not ' +
      'what Access accepts. Run bin/access-token to provision one.',
  )
}

/** The headers every call in this module sends. */
function headersFor(access: AccessServiceToken | undefined): Record<string, string> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (access) {
    headers['CF-Access-Client-Id'] = access.clientId
    headers['CF-Access-Client-Secret'] = access.clientSecret
  }
  return headers
}

/**
 * One GET, with Access's refusals reported as refusals.
 *
 * `redirect: 'manual'` for the reason `pushSite` gives: Access answers an
 * unauthenticated request with a 302 to its login page, and followed, that
 * returns 200 with an HTML document — so `res.ok` is true and the operator
 * meets `JSON.parse` choking on `<!DOCTYPE html>` instead of being told to get
 * a credential.
 */
async function getJson(
  url: string,
  what: string,
  opts: { access?: AccessServiceToken; fetch?: typeof fetch },
): Promise<unknown> {
  const doFetch = opts.fetch ?? globalThis.fetch
  const res = await doFetch(url, {
    method: 'GET',
    headers: headersFor(opts.access),
    redirect: 'manual',
  })
  const body = (await res.text()).trim()
  if (!res.ok) {
    const bounced = res.status === 0 || (res.status >= 300 && res.status < 400)
    const refusedByAccess = bounced || res.status === 401 || res.status === 403
    throw new Error(
      `${what} was refused with ` +
        `${bounced ? `${res.status || 'a redirect'} to a login page` : res.status}: ` +
        `${body || '(no body)'}\n` +
        (refusedByAccess
          ? 'That end is behind Cloudflare Access. Set CF_ACCESS_CLIENT_ID and ' +
            'CF_ACCESS_CLIENT_SECRET to a service token, or pass --client-id and ' +
            '--client-secret. Run bin/access-token to provision one.'
          : ''),
    )
  }
  return JSON.parse(body) as unknown
}

/**
 * Resolve a business NAME to that side's own id.
 *
 * INDEPENDENTLY ON EACH SIDE, which is the whole reason the command takes a
 * name. A business id is minted by the store that holds it, so the local
 * builder's Lagrange Foundry and the deployed one's are two different strings
 * for the thing the operator calls one name. Asking each side what it calls it
 * is the only way the pair of calls can address the same business.
 *
 * THE LIST IS `/api/businesses` — the switcher's own, which reports exactly
 * what this caller may operate and discloses nothing else. So "no such
 * business" and "not yours" arrive as one sentence, which is correct: from out
 * here they are the same fact, and the useful half is the list of what the side
 * DID offer.
 *
 * TWO BUSINESSES ANSWERING TO ONE NAME IS REFUSED, not resolved by first match
 * — the same refusal `/api/import` makes over two sites, for the same reason.
 * Guessing on the read hands back a site nobody asked for; guessing on the
 * write overwrites one.
 */
export async function resolveBusiness(
  origin: string,
  name: string,
  opts: { access?: AccessServiceToken; fetch?: typeof fetch },
): Promise<BusinessRef> {
  const payload = (await getJson(
    new URL(BUSINESSES_PATH, origin).toString(),
    `Listing the businesses at ${origin}`,
    opts,
  )) as BusinessesPayload
  const offered = Array.isArray(payload?.businesses) ? payload.businesses : []
  const wanted = name.trim().toLowerCase()
  const matches = offered.filter((b) => String(b.name ?? '').trim().toLowerCase() === wanted)
  if (matches.length > 1) {
    throw new Error(
      `${origin} offers ${matches.length} businesses called '${name}', so the ` +
        'name has no unambiguous target. Nothing was read or written.',
    )
  }
  const found = matches[0]
  if (!found) {
    throw new Error(
      `No business called '${name}' at ${origin}. This command never creates ` +
        'one — create it in the builder there first. What that side offers: ' +
        `${offered.map((b) => `'${b.name}'`).join(', ') || '(nothing)'}.`,
    )
  }
  return { id: found.id, name: found.name }
}

export interface ExportResult {
  business: BusinessRef
  origin: string
  payload: SitePayload
}

/** Read one business's site out of `origin`, through `GET /api/export`. */
export async function exportSite(
  origin: string,
  business: string,
  opts: { access?: AccessServiceToken; fetch?: typeof fetch },
): Promise<ExportResult> {
  const ref = await resolveBusiness(origin, business, opts)
  const payload = (await getJson(
    new URL(businessPath(ref.id, '/api/export'), origin).toString(),
    `Exporting '${ref.name}' from ${origin}`,
    opts,
  )) as SitePayload
  return { business: ref, origin, payload }
}

export interface CopyResult {
  direction: CopyDirection
  ends: CopyEnds
  /** What each side calls the business. The ids differ; the name does not. */
  from: BusinessRef
  to: BusinessRef
  pages: string[]
  assets: string[]
  landed: PushResult['landed']
}

/**
 * Read one business's site from one end and write it to the other.
 *
 * THE DESTINATION BUSINESS MUST ALREADY EXIST, and {@link resolveBusiness}
 * enforces that by construction: there is no call here that could create one.
 * A deployment acquiring a business nobody signed up for, from a laptop script,
 * is the failure that refusal exists to prevent — and production holds one
 * tenant and no sites today, so this path is reached on the very first use.
 * The SITE is a different matter: `/api/import` mints one for a business
 * holding none, which is a site inside a business somebody did sign up for.
 *
 * THE DESTINATION IS RESOLVED BEFORE THE SOURCE IS READ. A copy that fails at
 * the far end after transferring a site's worth of assets has spent the
 * operator's time to tell them something it could have said first.
 *
 * BUG-51's REFUSAL IS FORWARDED, NOT REINTERPRETED. `/api/import` refuses a
 * target carrying builder-authored changes and says how many; this reports that
 * sentence with the business named, and `--force` is how the operator says they
 * meant it.
 */
export async function copySite(business: string, opts: CopyOptions): Promise<CopyResult> {
  assertDataClass(opts.klass ?? 'site', opts.direction)
  const ends = endsFor(opts.direction, opts.local, opts.cloud)
  const wire = { access: opts.access, fetch: opts.fetch }

  const to = await resolveBusiness(ends.destination, business, wire)
  const read = await exportSite(ends.source, business, wire)

  const payload: SitePayload = { ...read.payload }
  // Set only when asked, so an ordinary copy sends a body with no `force` key
  // at all rather than one that says `false`. The wire then shows what was
  // meant — `push.ts`'s rule, kept.
  if (opts.force === true) payload.force = true

  const landed = await postSitePayload(payload, {
    url: new URL(businessPath(to.id, '/api/import'), ends.destination).toString(),
    subject: `Copy of '${to.name}'`,
    access: opts.access,
    fetch: opts.fetch,
  })

  return {
    direction: opts.direction,
    ends,
    from: read.business,
    to,
    pages: payload.pages.map((p) => p.name),
    assets: payload.assets.map((a) => a.name),
    landed,
  }
}
