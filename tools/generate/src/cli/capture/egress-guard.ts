/**
 * REQ-157 — what a browser we launched on the operator's behalf is allowed to
 * fetch ([[DOC-2]]).
 *
 * WHY THIS EXISTS. `capture_site(url)` is the first operation in this system
 * that takes a URL **from the model** and fetches it. Everything the assistant
 * could reach before was the operator's own site. A tool that fetches an
 * arbitrary URL from inside our network is a server-side request forgery surface
 * whether or not anyone calls it that, and the interesting targets are not
 * websites: they are `169.254.169.254` and friends, which answer instance
 * credentials to anything that asks.
 *
 * WHY IT IS NOT A PRE-FLIGHT CHECK ON THE TYPED URL. Because that check cannot
 * see a redirect. A model asked to capture `https://example.com/x` has no idea
 * whether that 302s to link-local space, and neither does a function that only
 * ever looks at the string it was handed — by the time the redirect is followed
 * the request has already been made. The browser follows redirects itself and
 * issues every subresource request on its own, so the only place a rule can
 * cover all of them is the driver's per-request seam, which is where
 * {@link egressGuard} is installed. The typed URL is checked too, at the top, so
 * an obviously bad ask is refused without leasing a browser at all — but that is
 * an optimisation and a better error message, not the control.
 *
 * WHAT IT HONESTLY DOES NOT DO. It cannot defeat DNS rebinding: it sees
 * hostnames and URLs, not the address the browser resolved them to, and nothing
 * inside workerd can resolve a name to check. What it does cover is the literal
 * address space — which is what a metadata endpoint is named by — plus the
 * loopback and `.local`/`.internal` names, plus the redirect cap below. Cloudflare's own
 * network is not routable to an operator's LAN, so the residual exposure this
 * leaves is a name that resolves to a public address the operator would rather
 * we had not fetched, which is a different problem from the one this is for.
 *
 * EVERY REFUSAL IS NAMED AND JOURNALLED. A guard that silently drops a request
 * produces a screenshot of a half-loaded page and no explanation, which is the
 * worst outcome for a tool whose entire job is to be believed.
 */

/** Why a URL was refused. Each value is a sentence the operator can act on. */
export type RefusalReason =
  | 'scheme'
  | 'credentials'
  | 'private-address'
  | 'redirect-cap'

/**
 * What a request IS, as only the driver can know.
 *
 * BUG-127 — the guard cannot derive this from a URL. `https://cdn.example/x.woff2`
 * is a font on one page and a navigation on another, and the difference decides
 * whether a refusal leaves a hole in a screenshot or replaces the whole page with
 * the words "refused by egress policy". Playwright and puppeteer both label the
 * request at the seam the guard already runs at, so the answer is carried in
 * rather than guessed.
 */
export type RequestKind = 'document' | 'subresource'

/** A refusal derived from the URL alone — what {@link classifyUrl} can say. */
export interface UrlRefusal {
  url: string
  reason: RefusalReason
  detail: string
}

/** One refused request, as it reaches the journal. */
export interface EgressRefusal extends UrlRefusal {
  /**
   * BUG-127 — a refused font is a hole in a page; a refused *document* is not a
   * page at all. Recorded so the caller can tell the two apart instead of
   * handing back a bundle of refusal text with a list the reader must interpret.
   */
  kind: RequestKind
}

/**
 * The refusals as a capture reports them to a model ([[REQ-361]]).
 *
 * A COUNT PER REASON AND A FEW EXAMPLES, NEVER THE LIST. One capture refused 241 KB
 * of requests, almost all of them `data:` URLs whose whole payload IS the URL —
 * and every byte rode the conversation for the rest of the session. What a later
 * fidelity verdict needs from this is how much was refused and why; the URLs
 * themselves are evidence, and five of them, shortened, is enough to recognise
 * what kind.
 *
 * A `scheme` refusal is grouped by the scheme it named (`scheme: data:`), because
 * "41 data URLs" and "1 ftp link" are different findings under one reason.
 */
export interface RefusalSummary {
  /** How many requests were refused in all. `0` is the ordinary case. */
  total: number
  /** How many under each reason, e.g. `{ "scheme: data:": 41 }`. */
  reasons: Record<string, number>
  /** At most {@link REFUSAL_EXAMPLES} of them, URLs shortened, one per reason first. */
  examples: { url: string; reason: string; detail: string }[]
}

export const REFUSAL_EXAMPLES = 5
/** How much of an example URL is kept: enough to recognise it, not its payload. */
export const REFUSAL_URL_CLIP = 120

function refusalLabel(refusal: UrlRefusal): string {
  if (refusal.reason !== 'scheme') return refusal.reason
  const match = /^([a-z][a-z0-9+.-]*:)/i.exec(refusal.url)
  return match ? `scheme: ${match[1].toLowerCase()}` : 'scheme: not a URL'
}

function clipUrl(url: string): string {
  return url.length <= REFUSAL_URL_CLIP ? url : `${url.slice(0, REFUSAL_URL_CLIP)}… [${url.length} characters]`
}

export function summariseRefusals(refusals: readonly UrlRefusal[]): RefusalSummary {
  const reasons: Record<string, number> = {}
  const firsts: UrlRefusal[] = []
  for (const refusal of refusals) {
    const label = refusalLabel(refusal)
    if (reasons[label] === undefined) firsts.push(refusal)
    reasons[label] = (reasons[label] ?? 0) + 1
  }
  const chosen = [...firsts, ...refusals.filter((r) => !firsts.includes(r))].slice(0, REFUSAL_EXAMPLES)
  return {
    total: refusals.length,
    reasons,
    examples: chosen.map((r) => ({
      url: clipUrl(r.url),
      reason: r.reason,
      // A detail quotes the URL it is about when it could not be parsed, so it is
      // shortened under the same rule as the URL.
      detail: r.detail.length <= 2 * REFUSAL_URL_CLIP ? r.detail : `${r.detail.slice(0, 2 * REFUSAL_URL_CLIP)}…`,
    })),
  }
}

/** Raised for the typed URL, before a browser is leased. */
export class UrlRefusedError extends Error {
  constructor(
    readonly url: string,
    readonly reason: RefusalReason,
    detail: string,
  ) {
    super(detail)
    this.name = 'UrlRefusedError'
  }
}

/**
 * Redirect hops ONE navigation chain may follow before it is treated as a loop.
 *
 * BUG-127 — per chain, and hops, both of which this once only claimed. It used
 * to count distinct origins seen over a whole capture, which is a different
 * quantity with the same name: every real site pulls a CDN, two font hosts, an
 * image host and a tag manager before anything unusual happens, so a cap of five
 * origins refused `stripe.com` and every other comp anyone asked for. Five hops
 * on one chain is loop detection; five origins on a page is a description of the
 * modern web.
 */
export const MAX_REDIRECTS = 5

/*
 * NO BYTE CAP ([[BUG-172]]). There was one — 32 MiB per capture, latching — and
 * it was a budget with nothing to protect. A capture is mechanical and cheap;
 * what this product spends is tokens, and nothing about how many bytes a browser
 * pulled reaches a model. What it did do was refuse ordinary sites: one capture
 * loads the page once per width on the ladder, so a marketing page with a few
 * large photographs crossed the cap a few widths in, and every later pass had
 * its page refused — which BUG-127's verdict then correctly reported as a
 * capture that failed. This guard is the SSRF control and the loop stop; how
 * long a capture may run is the session lease's business.
 */

/** Wall-clock ceiling on one capture, ms. Passed to the session lease. */
export const MAX_CAPTURE_MS = 60_000

/** Only these two schemes reach the network. `file:` and `data:` are the point. */
const ALLOWED_SCHEMES = new Set(['http:', 'https:'])

/** Schemes whose URL is its own payload — no request leaves the browser ([[BUG-202]]). */
const INLINE_SCHEMES = /^(data|blob):/i

/**
 * Hostnames that name this machine or its network by word rather than by
 * number. Matched on the whole label set, so `notlocalhost.com` is unaffected.
 */
const LOCAL_SUFFIXES = ['.local', '.localhost', '.internal', '.home.arpa']

/** An IPv4 literal's four octets, or null when `host` is not one. */
function ipv4Octets(host: string): number[] | null {
  const parts = host.split('.')
  if (parts.length !== 4) return null
  const out: number[] = []
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const n = Number(part)
    if (n > 255) return null
    out.push(n)
  }
  return out
}

/**
 * Whether an IPv4 literal is in space that is private, loopback, link-local or
 * otherwise not the public internet.
 *
 * `169.254.0.0/16` is the one that matters most and is the reason this function
 * is not simply "starts with 10. or 192.168.": the cloud metadata endpoint lives
 * at `169.254.169.254` and answers credentials to an unauthenticated GET.
 */
function isPrivateIpv4(octets: number[]): boolean {
  const [a, b] = octets
  if (a === 0) return true // "this network"
  if (a === 10) return true // RFC1918
  if (a === 127) return true // loopback
  if (a === 169 && b === 254) return true // link-local — metadata endpoints
  if (a === 172 && b >= 16 && b <= 31) return true // RFC1918
  if (a === 192 && b === 168) return true // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT (RFC6598)
  if (a === 192 && b === 0) return true // IETF protocol assignments
  if (a >= 224) return true // multicast, reserved, broadcast
  return false
}

/**
 * Whether an IPv6 literal is loopback, link-local, unique-local, or an
 * IPv4-mapped address whose embedded v4 is private.
 *
 * The v4-mapped case is not pedantry: `[::ffff:169.254.169.254]` reaches the
 * same metadata endpoint as the bare literal, and a check that only read v4
 * would wave it through.
 */
function isPrivateIpv6(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, '').toLowerCase()
  if (bare === '::1' || bare === '::') return true
  if (bare.startsWith('fe80:')) return true // link-local
  if (/^f[cd][0-9a-f]{2}:/.test(bare)) return true // unique-local fc00::/7
  const mapped = /^::ffff:(.+)$/.exec(bare)
  if (mapped) {
    const octets = ipv4Octets(mapped[1])
    if (octets) return isPrivateIpv4(octets)
    // `::ffff:a9fe:a9fe` — the same address written as hex groups.
    const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(mapped[1])
    if (hex) {
      const high = parseInt(hex[1], 16)
      const low = parseInt(hex[2], 16)
      return isPrivateIpv4([high >> 8, high & 0xff, low >> 8, low & 0xff])
    }
  }
  return false
}

/** Whether `host` names private, loopback or link-local space. */
export function isPrivateHost(host: string): boolean {
  const lower = host.toLowerCase()
  if (lower === 'localhost') return true
  if (LOCAL_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true
  if (lower.includes(':') || lower.startsWith('[')) return isPrivateIpv6(lower)
  const octets = ipv4Octets(lower)
  if (octets) return isPrivateIpv4(octets)
  return false
}

/**
 * Classify one URL. Returns null when it may be fetched, or the refusal.
 *
 * Pure and total, so the same rule can be applied to the typed URL up front and
 * to every request the page makes afterwards without either caller re-deriving
 * it.
 */
export function classifyUrl(raw: string): UrlRefusal | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { url: raw, reason: 'scheme', detail: `'${raw}' is not a URL.` }
  }
  if (!ALLOWED_SCHEMES.has(url.protocol)) {
    return {
      url: raw,
      reason: 'scheme',
      detail: `'${url.protocol}' is not a scheme this can fetch — only http and https are.`,
    }
  }
  // Credentials in a URL are refused rather than stripped: a caller that put
  // them there meant them to be sent, and sending someone's password to a host
  // the model chose is not a thing to do quietly.
  if (url.username || url.password) {
    return {
      url: raw,
      reason: 'credentials',
      detail: 'a URL carrying a username or password is not fetched.',
    }
  }
  if (isPrivateHost(url.hostname)) {
    return {
      url: raw,
      reason: 'private-address',
      detail:
        `'${url.hostname}' is private, loopback or link-local address space, which is ` +
        `not reachable from this tool. Capture a public URL.`,
    }
  }
  return null
}

/** Assert the typed URL may be fetched, returning it parsed. */
export function assertPublicUrl(raw: string): URL {
  const refusal = classifyUrl(raw)
  if (refusal) throw new UrlRefusedError(refusal.url, refusal.reason, refusal.detail)
  return new URL(raw)
}

/**
 * The per-request rule the driver installs, plus the record of what it refused.
 *
 * STATEFUL ONLY IN WHAT IT REMEMBERS, and one instance belongs to one capture:
 * the refusals and whether a page was among them are that capture's verdict. No
 * rule here depends on an earlier request — the redirect cap is per-chain
 * (BUG-127) and there is no whole-capture allowance to spend ([[BUG-172]]) — so
 * a request is allowed or refused on its own merits whatever came before it.
 */
export interface EgressGuard {
  /**
   * Whether this request may proceed; records the refusal when it may not.
   *
   * `about` is what only the driver knows — whether this is the page or one of
   * the forty things the page pulls, and how many redirect hops led here. It is
   * optional so a caller that genuinely cannot tell (a test double, a driver
   * whose library does not expose it) still gets the URL rules; such a request
   * is treated as a subresource, which is the safe reading: it can be refused
   * on its own merits but it can never, on its own, condemn the capture.
   */
  allow(url: string, about?: EgressRequest): boolean
  /** Every refusal, in order — what the operation journals. */
  readonly refusals: readonly EgressRefusal[]
  /**
   * BUG-127 — whether a *navigation document* was refused, i.e. whether some
   * page in this capture is the words "refused by egress policy" rather than a
   * page. This is the capture's verdict: a caller that ignores it adopts a
   * bundle of black rectangles and finds out at screenshot time.
   */
  readonly documentRefused: boolean
}

/** What the driver knows about one request that its URL does not say. */
export interface EgressRequest {
  /** Default `'subresource'` — see {@link EgressGuard.allow}. */
  kind?: RequestKind
  /** Redirect hops already followed on THIS request's own chain. Default 0. */
  redirectDepth?: number
}

export function egressGuard(limits: { maxRedirects?: number } = {}): EgressGuard {
  const maxRedirects = limits.maxRedirects ?? MAX_REDIRECTS
  const refusals: EgressRefusal[] = []
  let documentRefused = false

  /** Record one refusal and answer `false`, so every refusal path is one line. */
  function refuse(one: UrlRefusal, kind: RequestKind): false {
    refusals.push({ ...one, kind })
    if (kind === 'document') documentRefused = true
    return false
  }

  return {
    refusals,
    get documentRefused() {
      return documentRefused
    },
    allow(url: string, about: EgressRequest = {}): boolean {
      const kind = about.kind ?? 'subresource'
      // BUG-202 — AN INLINE RESOURCE IS NOT EGRESS. A `data:` or `blob:` URL
      // carries its own bytes and reaches no host, so there is nothing for this
      // guard to refuse: refusing them broke a page's inline images and reported
      // 300 "refusals" on one site. The page itself is still never one.
      if (kind === 'subresource' && INLINE_SCHEMES.test(url)) return true
      // Nor is the blank page a driver leaves for before it closes.
      if (url === 'about:blank') return true
      const refusal = classifyUrl(url)
      if (refusal) return refuse(refusal, kind)
      // REDIRECTS COUNTED AS REDIRECTS (BUG-127). The depth is this request's
      // own chain, so forty images are forty chains of depth zero rather than
      // forty hops, and a genuine loop is still caught on the hop that closes
      // it. Nothing latches: a refusal here is a refusal of THIS request, and
      // the next navigation in the same capture starts its own chain at zero.
      const depth = about.redirectDepth ?? 0
      if (depth > maxRedirects) {
        return refuse(
          {
            url,
            reason: 'redirect-cap',
            detail:
              `this request arrived after ${depth} redirect hops, more than the ` +
              `${maxRedirects} one navigation may follow; treating it as a redirect loop.`,
          },
          kind,
        )
      }
      return true
    },
  }
}
