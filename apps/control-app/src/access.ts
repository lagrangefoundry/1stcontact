/**
 * Cloudflare Access, verified inside the Worker (REQ-147).
 *
 * WHY THE WORKER VERIFIES AT ALL. Access already enforces at the edge: an
 * unauthenticated request to `app.1stcontact.io` is challenged before this code
 * runs. That protects the HOSTNAME, and a policy attached to a hostname is only
 * as good as the claim that the hostname is the only way in. It is not — a
 * Worker with `workers_dev = true` also answers on
 * `<name>.<subdomain>.workers.dev`, which no Access policy covers. So the gate
 * is stated twice, in the two places it can be stated:
 *
 *   1. `workers_dev = false` in wrangler.toml removes the second door;
 *   2. this file refuses any request that did not arrive through Access,
 *      whatever door it came through.
 *
 * Either alone is a configuration away from open. Together, opening the Worker
 * takes two independent mistakes. That is what DOC-2's structural-not-procedural
 * stance means here.
 *
 * WHAT IS VERIFIED, and why each part is not optional:
 *
 *   signature   RS256 over the Access team's published JWKS. Without it the
 *               token is a self-asserted claim of identity.
 *   alg         pinned to RS256 from the JWKS entry, never taken from the
 *               token's own header. A token is untrusted input, including its
 *               statement about how to check it — `alg: none` and the HS256
 *               confusion attack are both "believe the header".
 *   aud         the Access application's AUD tag. Every application in a team is
 *               signed by the SAME keys, so signature alone proves only "someone
 *               in this team's Access", not "allowed into THIS application".
 *               Omitting it grants the builder to anyone with any app.
 *   iss         the team domain, so a token minted by another team's Access is
 *               not accepted on the strength of its own claim about its issuer.
 *   exp/nbf     ordinary expiry, with a small skew allowance.
 *
 * FAIL CLOSED. Missing configuration denies. An unverifiable token denies. A
 * JWKS that will not fetch denies. There is no code path where "we could not
 * check" becomes "let it through", because that path is the whole vulnerability
 * dressed as resilience.
 */

/** Clock skew tolerated on `exp` / `nbf` / `iat`, in seconds. */
const SKEW_SECONDS = 60

/** How long a fetched JWKS is reused before it is fetched again. */
const JWKS_TTL_MS = 60 * 60 * 1000

export interface AccessClaims {
  /** The Access application this token was minted for. */
  aud: string[]
  iss: string
  exp: number
  nbf?: number
  iat?: number
  /** Present for a human identity. */
  email?: string
  /** Present instead of `email` for a service token (automation). */
  common_name?: string
  [claim: string]: unknown
}

export type VerifyResult =
  | { ok: true; claims: AccessClaims; identity: string }
  | { ok: false; reason: string }

export interface VerifyOptions {
  token: string
  /** e.g. `gendev.cloudflareaccess.com`, with or without scheme. */
  teamDomain: string
  /** The Access application's AUD tag. */
  aud: string
  /** Seconds since the epoch; injectable so expiry is testable without waiting. */
  now?: number
  fetch?: typeof fetch
}

/**
 * A JWKS entry as Access publishes it. `JsonWebKey` does not carry `kid`, and
 * `kid` is the whole basis on which a token's signing key is selected.
 */
export interface AccessJwk extends JsonWebKey {
  kid?: string
}

interface CachedJwks {
  keys: AccessJwk[]
  fetchedAt: number
}

/**
 * Module-level, therefore per-isolate: warm isolates skip the fetch, cold ones
 * pay it once. Deliberately not a Worker cache or KV — the keys are public, tiny
 * and re-fetchable, so the cheapest correct cache is the simplest one.
 */
const jwksCache = new Map<string, CachedJwks>()

/** `gendev.cloudflareaccess.com` / `https://gendev.…/` → `https://gendev.…`. */
export function normaliseTeamDomain(teamDomain: string): string {
  const trimmed = teamDomain.trim().replace(/\/+$/, '')
  if (trimmed === '') return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function certsUrl(teamDomain: string): string {
  return `${normaliseTeamDomain(teamDomain)}/cdn-cgi/access/certs`
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function decodeJson(segment: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as Record<string, unknown>
  } catch {
    return undefined
  }
}

/**
 * Fetch the team's signing keys, reusing a recent copy.
 *
 * `force` bypasses the cache, which is how key ROTATION is survived: a token
 * signed by a key minted after the cache was filled would otherwise be rejected
 * for an hour, and "valid token, refused" is an outage.
 */
async function fetchJwks(url: string, doFetch: typeof fetch, force: boolean): Promise<AccessJwk[]> {
  const cached = jwksCache.get(url)
  if (!force && cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) return cached.keys

  const res = await doFetch(url)
  if (!res.ok) throw new Error(`${url} returned ${res.status}`)
  const body = (await res.json()) as { keys?: AccessJwk[] }
  const keys = Array.isArray(body.keys) ? body.keys : []
  if (keys.length === 0) throw new Error(`${url} published no keys`)

  jwksCache.set(url, { keys, fetchedAt: Date.now() })
  return keys
}

/** Drop every cached JWKS. Exported for tests; nothing in the request path uses it. */
export function resetJwksCache(): void {
  jwksCache.clear()
}

async function signatureIsValid(
  jwk: AccessJwk,
  signedPart: string,
  signature: Uint8Array,
): Promise<boolean> {
  // `alg` and `use` come from the JWKS — the team's own published statement
  // about its keys — never from the token being checked.
  if (jwk.kty !== 'RSA') return false
  let key: CryptoKey
  try {
    key = await crypto.subtle.importKey(
      'jwk',
      { ...jwk, alg: 'RS256', key_ops: ['verify'], ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
  } catch {
    return false
  }
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature as unknown as BufferSource,
    new TextEncoder().encode(signedPart) as unknown as BufferSource,
  )
}

/**
 * Verify one Access JWT.
 *
 * Returns a REASON rather than throwing, because every rejection is reported to
 * an operator staring at a 401 and "invalid token" is not a diagnosis.
 */
export async function verifyAccessJwt(options: VerifyOptions): Promise<VerifyResult> {
  const { token } = options
  const teamDomain = normaliseTeamDomain(options.teamDomain)
  const aud = options.aud.trim()
  const doFetch = options.fetch ?? globalThis.fetch
  const now = options.now ?? Math.floor(Date.now() / 1000)

  if (teamDomain === '' || aud === '') return { ok: false, reason: 'Access is not configured' }
  if (token.trim() === '') return { ok: false, reason: 'no Access token was presented' }

  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, reason: 'the token is not a three-part JWT' }
  const [headerPart, payloadPart, signaturePart] = parts

  const header = decodeJson(headerPart)
  const payload = decodeJson(payloadPart)
  if (!header || !payload) return { ok: false, reason: 'the token is not decodable' }

  // The header's `alg` is not trusted to choose the algorithm — it is only
  // required to AGREE with the one algorithm this gate accepts. `none` and
  // `HS256` are refused here rather than reaching a verifier.
  if (header.alg !== 'RS256') {
    return { ok: false, reason: `unsupported token algorithm '${String(header.alg)}', expected RS256` }
  }
  const kid = typeof header.kid === 'string' ? header.kid : undefined
  if (!kid) return { ok: false, reason: 'the token names no signing key (kid)' }

  const url = certsUrl(teamDomain)
  let keys: AccessJwk[]
  try {
    keys = await fetchJwks(url, doFetch, false)
    // A `kid` the cache has never seen is the shape of a rotation, so the cache
    // is refreshed once before the token is called unsigned.
    if (!keys.some((k) => k.kid === kid)) keys = await fetchJwks(url, doFetch, true)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: `the Access signing keys could not be fetched: ${message}` }
  }

  const jwk = keys.find((k) => k.kid === kid)
  if (!jwk) return { ok: false, reason: `no Access signing key matches kid '${kid}'` }

  const signature = base64UrlToBytes(signaturePart)
  const valid = await signatureIsValid(jwk, `${headerPart}.${payloadPart}`, signature)
  if (!valid) return { ok: false, reason: 'the token signature does not verify' }

  const claims = payload as AccessClaims
  const audience =
    typeof claims.aud === 'string' ? [claims.aud] : Array.isArray(claims.aud) ? claims.aud : []
  if (!audience.includes(aud)) {
    return {
      ok: false,
      reason:
        'the token was issued for another Access application — ' +
        'every application in a team shares these signing keys, so the AUD is what separates them',
    }
  }

  if (claims.iss !== teamDomain) {
    return { ok: false, reason: `the token was issued by '${String(claims.iss)}', not ${teamDomain}` }
  }

  if (typeof claims.exp !== 'number' || claims.exp + SKEW_SECONDS < now) {
    return { ok: false, reason: 'the token has expired' }
  }
  if (typeof claims.nbf === 'number' && claims.nbf - SKEW_SECONDS > now) {
    return { ok: false, reason: 'the token is not valid yet' }
  }
  if (typeof claims.iat === 'number' && claims.iat - SKEW_SECONDS > now) {
    return { ok: false, reason: 'the token was issued in the future' }
  }

  const identity =
    (typeof claims.email === 'string' && claims.email) ||
    (typeof claims.common_name === 'string' && `service-token:${claims.common_name}`) ||
    'unknown'

  return { ok: true, claims, identity }
}

/**
 * The token Access attached to this request.
 *
 * The header is what Access sets on the request it forwards; the cookie is what
 * a browser holds and is the fallback for a request that reached the Worker by a
 * route where the header was not set. Both are the same JWT.
 */
export function accessTokenFrom(request: Request): string {
  const header = request.headers.get('cf-access-jwt-assertion')
  if (header && header.trim() !== '') return header.trim()

  const cookie = request.headers.get('cookie') ?? ''
  for (const pair of cookie.split(';')) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    if (pair.slice(0, eq).trim() === 'CF_Authorization') return pair.slice(eq + 1).trim()
  }
  return ''
}

export interface AccessEnv {
  /** The Access team domain, e.g. `gendev.cloudflareaccess.com`. */
  ACCESS_TEAM_DOMAIN?: string
  /** The Access application's AUD tag. */
  ACCESS_AUD?: string
}

/**
 * The gate itself: a Response to send INSTEAD of serving, or `undefined` when
 * the caller is allowed through.
 *
 * Two refusals, deliberately distinguished, because they need different fixes:
 *
 *   503  this Worker cannot check anyone — its Access configuration is missing.
 *        The operator's fix is in wrangler.toml, and a 401 would send them
 *        hunting for a login problem that does not exist.
 *   401  the caller did not present a valid token. Access at the edge would have
 *        challenged this request already, so a request that reaches here without
 *        one arrived by some other door — which is exactly the case this
 *        function exists for.
 */
export async function guardAccess(
  request: Request,
  env: AccessEnv,
  options: { fetch?: typeof fetch; now?: number } = {},
): Promise<Response | undefined> {
  const teamDomain = (env.ACCESS_TEAM_DOMAIN ?? '').trim()
  const aud = (env.ACCESS_AUD ?? '').trim()

  if (teamDomain === '' || aud === '') {
    const missing = [
      teamDomain === '' ? 'ACCESS_TEAM_DOMAIN' : undefined,
      aud === '' ? 'ACCESS_AUD' : undefined,
    ].filter(Boolean)
    return text(
      503,
      `Cloudflare Access is not configured: ${missing.join(' and ')} ${
        missing.length > 1 ? 'are' : 'is'
      } empty. ` +
        'This Worker refuses every request until it can verify one — see apps/control-app/ACCESS.md.',
    )
  }

  const result = await verifyAccessJwt({
    token: accessTokenFrom(request),
    teamDomain,
    aud,
    fetch: options.fetch,
    now: options.now,
  })

  if (!result.ok) {
    return text(401, `Cloudflare Access rejected this request: ${result.reason}.`)
  }
  return undefined
}

function text(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // Nothing behind this gate is cacheable by an intermediary, and a cached
      // refusal is as wrong as a cached admission.
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  })
}
