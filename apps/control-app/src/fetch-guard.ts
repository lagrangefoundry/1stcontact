/**
 * The guard on fetching material we pull on a client's behalf (REQ-163).
 *
 * WHY A FETCH ENTRY POINT NEEDS ONE AT ALL. [[DOC-38]] class 3c is background we
 * retrieve for the client — an industry report, an article — and the address
 * comes from a conversation. A Worker's `fetch` reaches whatever it is given,
 * including addresses that mean something only from INSIDE the network it runs
 * in, so an unguarded fetch route is a request forgery surface. Nothing in this
 * repository guarded one before, because nothing in this repository fetched on
 * request before.
 *
 * AND THE FRAMING MATTERS MORE THAN "SSRF" SUGGESTS. What comes back does not go
 * into a response and stop there — it becomes a `material` ticket, which becomes
 * CORPUS, which the assistant reads. That makes this a prompt-injection path into
 * the assistant's context, not only a network-reach problem, and the two have
 * different remedies:
 *
 *   - the address guard below stops us reaching somewhere we should not, and
 *   - marking fetched material UNTRUSTED ([[DOC-10]] §5.2's treatment of
 *     retrieved content) is what covers the case the address guard cannot — a
 *     perfectly legitimate public URL whose contents were written to be read by
 *     an AI. That half lives on the ticket (`origin: fetched`, `rights:
 *     third_party`), not here.
 *
 * FOUR RULES, AND THE THIRD IS THE ONE PEOPLE FORGET:
 *
 *   1. HTTPS only. `http:` is refused rather than upgraded — the client asked for
 *      a specific address and silently fetching a different one is worse than
 *      saying no. `file:`, `data:` and the rest are refused with it.
 *   2. No private, loopback, link-local or metadata address. Checked on the
 *      literal host, which is what stops `http://169.254.169.254/` and
 *      `https://127.0.0.1:8788/` reaching the cloud metadata service and this
 *      Worker's own neighbours.
 *   3. **Every redirect hop is re-validated**, bounded by a cap. A guard applied
 *      only to the URL the caller typed is not a guard: a public address is free
 *      to 302 to `169.254.169.254`, and `redirect: 'follow'` would take it.
 *      Following by hand with `redirect: 'manual'` is the only way to see each
 *      hop.
 *   4. The size cap is the blob ceiling, enforced ON THE WAY IN. A remote server
 *      does not have to be honest about `content-length`, so the declared length
 *      is a fast refusal and the body is *also* counted as it arrives.
 *
 * WHAT IS DELIBERATELY NOT HERE: DNS resolution. A hostname that resolves to a
 * private address defeats rule 2, and workerd cannot resolve a name before
 * fetching it, so the check cannot be made complete from inside a Worker. Saying
 * so is better than implying the literal-host check is more than it is; closing
 * it needs a resolver the platform does not offer.
 */

/** How many redirects to follow before giving up. */
export const MAX_REDIRECTS = 5

/** A refusal a non-technical client can act on. */
export class FetchRefusedError extends Error {
  readonly name = 'FetchRefusedError'
  constructor(
    message: string,
    /** The address that was refused — the ORIGINAL where a hop was refused. */
    readonly url: string,
  ) {
    super(message)
  }
}

/**
 * Refuse an address we must not fetch.
 *
 * Throws rather than returning a verdict: every caller's only correct response to
 * a refusal is to stop, and a boolean invites one that forgets to check.
 */
export function assertFetchable(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new FetchRefusedError(`That does not look like a web address: ${raw}`, raw)
  }
  if (url.protocol !== 'https:') {
    throw new FetchRefusedError(
      `Only https addresses can be fetched, and this one is ${url.protocol.replace(':', '')}.`,
      raw,
    )
  }
  if (isPrivateHost(url.hostname)) {
    throw new FetchRefusedError(
      `That address is on a private network (${url.hostname}), so it cannot be fetched.`,
      raw,
    )
  }
  return url
}

/**
 * Is this host one we must never reach?
 *
 * LITERAL ADDRESSES ONLY, and the module note says why that is the honest limit.
 * The ranges are the ones that mean something different from inside a network
 * than outside it: loopback, the three RFC 1918 blocks, link-local (which is
 * where every cloud metadata service lives), carrier-grade NAT, and the IPv6
 * equivalents.
 */
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === '' || host === 'localhost' || host.endsWith('.localhost')) return true
  // `.local` is mDNS and `.internal` is the conventional private zone; neither is
  // resolvable from the public internet, so a request for one is a request for
  // something on this side of the boundary.
  if (host.endsWith('.local') || host.endsWith('.internal')) return true

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true // link-local, incl. 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
    if (a >= 224) return true // multicast and reserved
    return false
  }
  if (host.includes(':')) {
    if (host === '::' || host === '::1') return true
    // fc00::/7 unique-local, fe80::/10 link-local, and the IPv4-mapped forms,
    // which would otherwise smuggle 127.0.0.1 past the check above.
    if (/^f[cd]/.test(host) || /^fe[89ab]/.test(host)) return true
    if (host.startsWith('::ffff:')) return isPrivateHost(host.slice('::ffff:'.length))
    return false
  }
  return false
}

/** What a guarded fetch brought back. */
export interface FetchedMaterial {
  bytes: Uint8Array
  contentType: string
  /** The address the bytes finally came from — the LAST hop, not the first. */
  finalUrl: string
  /** The address the caller asked for. Kept because it is what they will recognise. */
  requestedUrl: string
}

/**
 * Fetch an address, refusing anything the guard refuses at every hop.
 *
 * `fetch` is injected so a UAT can prove the redirect re-validation without a
 * network: the claim is about which addresses are refused, and a test that had to
 * stand up a redirecting server to make it would be testing the server.
 */
export async function guardedFetch(
  raw: string,
  maxBytes: number,
  deps: { fetch?: typeof fetch } = {},
): Promise<FetchedMaterial> {
  const doFetch = deps.fetch ?? fetch
  let url = assertFetchable(raw)

  for (let hop = 0; ; hop++) {
    if (hop > MAX_REDIRECTS) {
      throw new FetchRefusedError(
        `That address redirected more than ${MAX_REDIRECTS} times, so the fetch was stopped.`,
        raw,
      )
    }
    // `manual` rather than `follow`, and this is the whole of rule 3: `follow`
    // would take every hop before returning, so the guard would only ever see
    // the address the caller typed.
    const response = await doFetch(url.toString(), { redirect: 'manual' })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        throw new FetchRefusedError(
          `That address redirected without saying where to (${response.status}).`,
          raw,
        )
      }
      // Resolved against the hop it came from, because a `Location` may be
      // relative — and then re-validated from scratch, which is the point.
      url = assertFetchable(new URL(location, url).toString())
      continue
    }
    if (!response.ok) {
      throw new FetchRefusedError(
        `That address answered ${response.status} ${response.statusText}, so there was nothing to store.`,
        raw,
      )
    }

    // The DECLARED length first — a cheap refusal that avoids pulling megabytes
    // to discover they are too many.
    const declared = Number(response.headers.get('content-length') ?? '')
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new FetchRefusedError(tooBig(declared, maxBytes), raw)
    }
    const bytes = await readCapped(response, maxBytes, raw)
    return {
      bytes,
      contentType: (response.headers.get('content-type') ?? 'application/octet-stream')
        .split(';')[0]
        .trim(),
      finalUrl: url.toString(),
      requestedUrl: raw,
    }
  }
}

/**
 * Read a body, stopping the moment it exceeds the cap.
 *
 * COUNTED AS IT ARRIVES, because `content-length` is the remote server's claim
 * about itself. Trusting it would let a server that lies — or simply omits the
 * header — stream past the ceiling the isolate has to hold, which is exactly the
 * out-of-memory [[DOC-38]] §14 chose a stated ceiling to avoid.
 */
async function readCapped(response: Response, maxBytes: number, raw: string): Promise<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array(0)
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new FetchRefusedError(tooBig(total, maxBytes), raw)
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.byteLength
  }
  return out
}

/** The over-the-ceiling message, in megabytes, said once. */
export function tooBig(bytes: number, maxBytes: number): string {
  const mb = (n: number) => (n / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')
  return `That file is ${mb(bytes)}MB, and the limit is ${mb(maxBytes)}MB. Try a smaller version of it.`
}
