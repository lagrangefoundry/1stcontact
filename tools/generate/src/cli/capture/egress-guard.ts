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
 * loopback and `.local`/`.internal` names, plus the caps below. Cloudflare's own
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
  | 'response-cap'

/** One refused request, as it reaches the journal. */
export interface EgressRefusal {
  url: string
  reason: RefusalReason
  detail: string
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

/** Redirect hops one capture may follow before it is treated as a loop. */
export const MAX_REDIRECTS = 5

/** Bytes one capture may pull in total before it is refused as over-large. */
export const MAX_RESPONSE_BYTES = 32 * 1024 * 1024

/** Wall-clock ceiling on one capture, ms. Passed to the session lease. */
export const MAX_CAPTURE_MS = 60_000

/** Only these two schemes reach the network. `file:` and `data:` are the point. */
const ALLOWED_SCHEMES = new Set(['http:', 'https:'])

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
export function classifyUrl(raw: string): EgressRefusal | null {
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
 * The per-request rule the driver installs, plus the running totals the caps are
 * counted against.
 *
 * STATEFUL BY CONSTRUCTION, and one instance belongs to one capture. Redirect
 * and byte budgets are properties of a whole navigation, not of any single
 * request, so they cannot live in a pure function — and a guard shared across
 * two captures would let the first one's traffic refuse the second's.
 */
export interface EgressGuard {
  /** Whether this request may proceed; records the refusal when it may not. */
  allow(url: string): boolean
  /** Count bytes a response delivered, refusing once the total is over cap. */
  record(bytes: number): void
  /** Every refusal, in order — what the operation journals. */
  readonly refusals: readonly EgressRefusal[]
  /** Whether a cap has been tripped, so the caller can stop rather than limp. */
  readonly tripped: boolean
}

export function egressGuard(
  limits: { maxRedirects?: number; maxBytes?: number } = {},
): EgressGuard {
  const maxRedirects = limits.maxRedirects ?? MAX_REDIRECTS
  const maxBytes = limits.maxBytes ?? MAX_RESPONSE_BYTES
  const refusals: EgressRefusal[] = []
  // Documents, not subresources: a page with forty images is not forty
  // redirects, and counting them as such would refuse ordinary sites.
  const documents = new Set<string>()
  let bytes = 0
  let tripped = false

  return {
    refusals,
    get tripped() {
      return tripped
    },
    allow(url: string): boolean {
      if (tripped) return false
      const refusal = classifyUrl(url)
      if (refusal) {
        refusals.push(refusal)
        return false
      }
      documents.add(new URL(url).origin)
      if (documents.size > maxRedirects) {
        tripped = true
        refusals.push({
          url,
          reason: 'redirect-cap',
          detail: `more than ${maxRedirects} distinct origins were followed; treating this as a redirect loop.`,
        })
        return false
      }
      return true
    },
    record(n: number): void {
      bytes += n
      if (bytes > maxBytes && !tripped) {
        tripped = true
        refusals.push({
          url: '(total)',
          reason: 'response-cap',
          detail: `the page delivered more than ${maxBytes} bytes; capture refused.`,
        })
      }
    },
  }
}
