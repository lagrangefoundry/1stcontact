/**
 * story-182e8cb9 / AC-1761 — **the gate's verdict is WHO, not WHETHER.**
 *
 * The gate used to answer a yes/no question: a `Response` to refuse with, or
 * nothing, meaning carry on. That was exact while passing the gate WAS admission.
 * It is not any more — the identity gateway's policy is identity-only, so anyone
 * who can receive an email at a permitted address can obtain a valid token, and a
 * verified identity therefore establishes *who* the caller is and says nothing
 * about whether they may be here. The decision that answers *that* sits behind
 * this gate and binds to the address; recovering the address there would mean
 * verifying the same token and fetching the same signing keys a second time per
 * request, and would let the two checks disagree about who the caller is.
 *
 * So the gate reports the identity it proved: the machine-or-person name in every
 * case, the email address only for a human — because an automation service
 * identity authenticates as a machine name and carries no address at all, and
 * absent is a different thing from guessed, defaulted, or filled in from the name.
 *
 * WHERE THIS FILE STOPS. The story's boundary is the gate's own verdict: it
 * "requires only that a granted identity is not stopped by this gate, and that
 * the gate hands onward what it proved." What the decision behind the gate then
 * does with that address — the records it reads, the refusal it sends, the
 * operator-facing log line it writes — belongs to the story that owns the second
 * check, which has a database to be entitled in. Asserting it here would make
 * this gate depend on the surface that depends on it.
 *
 * WHAT IS DRIVEN. Real `Request` objects, real RSA keys, real signatures — the
 * tokens are minted rather than fixtured, so "the address came out of the token"
 * is an observation rather than a restatement of a constant. The only stub is
 * `globalThis.fetch`, which is the team's key publication and is the network:
 * not this repository's to own. The signature checks are COUNTED at
 * `crypto.subtle.verify`, because "once per request, not once per consumer" is a
 * claim about how many times the work was done and nothing else can observe it.
 */
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import worker, { type Env } from '../apps/control-app/src/index'
import { certsUrl, guardAccess, resetJwksCache } from '../apps/control-app/src/access'

const TEAM = 'https://uat-verdict-team.cloudflareaccess.com'
const AUD = 'c'.repeat(64)
/** A person: an address is what the decision behind the gate binds to. */
const HUMAN = 'martin-github@westhead.me'
/** A machine: a service token authenticates as a name and carries no address. */
const MACHINE = 'deploy-bot.access'

/**
 * The verdict as AC-1761 describes it, declared structurally rather than imported.
 *
 * DELIBERATELY NOT `typeof guardAccess`. The criterion is the specification, and
 * a test whose shape is taken from the gate's current return type could only ever
 * agree with whatever the gate currently returns — including a gate that still
 * answers a yes/no. Reading the value through this type is what makes "it reports
 * the identity" an assertion instead of a tautology.
 */
interface Verdict {
  ok?: unknown
  identity?: unknown
  email?: unknown
  response?: unknown
}

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function b64url(input: Uint8Array | string): string {
  const raw =
    typeof input === 'string' ? input : Array.from(input, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Mint one token against the stand-in team. */
async function mint(claims: Record<string, unknown> = {}): Promise<string> {
  const header = { alg: 'RS256', kid: 'uat-verdict-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, ...claims }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed),
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

/** The team's key publication, counted. Any other outbound request is an error. */
function publishKeys() {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url !== certsUrl(TEAM)) throw new Error(`unexpected fetch to ${url}`)
      calls.push(url)
      return new Response(JSON.stringify(jwks), {
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
  return { calls }
}

/** A configured gate, with the bindings behind it present but inert. */
function gateEnv(): Env {
  return {
    TENANT_ID: 'uat-tenant',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('build artifact bytes') },
    DB: {},
    SITES: {},
  } as unknown as Env
}

const GET = (pathname = '/', headers: Record<string, string> = {}) =>
  new Request(`https://app.1stcontact.io${pathname}`, { headers })

/**
 * The gate's verdict on one presented token.
 *
 * A gate that still answers a yes/no returns nothing at all for an admitted
 * caller; that arrives here as a verdict with no fields rather than as a
 * `TypeError`, so the assertion that fails is the one about the claim, and the
 * failure names the property that was missing.
 */
async function verdictFor(token: string): Promise<Verdict> {
  const outcome: unknown = await guardAccess(GET('/', { 'cf-access-jwt-assertion': token }), gateEnv())
  return (outcome ?? {}) as Verdict
}

beforeAll(async () => {
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'uat-verdict-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetJwksCache()
})

it('test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no', async () => {
  publishKeys()

  // ── A human identity: the name AND the address, both out of the token. ──────
  const human = await verdictFor(await mint({ email: HUMAN }))

  expect(
    human.ok,
    'the gate returned no verdict for a currently-valid human identity — it still answers ' +
      'a yes/no (a Response to refuse with, or nothing). The change that makes it report an ' +
      'identity is REQ-167 (61a0becc61), which is not an ancestor of this branch: ' +
      'apps/control-app/src/identity.ts is absent here. This is missing code, not a broken test.',
  ).toBe(true)
  expect(human.identity, 'the gate did not report the identity it proved').toBe(HUMAN)
  expect(
    human.email,
    'the gate did not carry out the address the decision behind it binds to',
  ).toBe(HUMAN)

  // ── An automation service identity: a machine name, and NO address. ─────────
  // A service token authenticates as a `common_name`. The name is always
  // reported; the address is reported as EXPLICITLY ABSENT — the one thing that
  // can be absent is the one thing admission binds to, so a defaulted or
  // name-derived value would be a fabricated account holder.
  const machine = await verdictFor(await mint({ common_name: MACHINE }))

  expect(machine.ok, 'a currently-valid service identity was not let past the gate').toBe(true)
  expect(
    String(machine.identity ?? ''),
    'the gate did not report the machine name it proved',
  ).toContain(MACHINE)
  expect(
    machine.email,
    'a service identity was given an address, which it does not carry',
  ).toBeNull()
  expect(
    String(machine.email ?? ''),
    'the absent address was filled in from the machine name',
  ).not.toContain(MACHINE)
  expect(machine.email, 'the absent address was defaulted to a human one').not.toBe(HUMAN)

  // ── A refusal carries nothing onward: the refusal is the whole verdict. ─────
  const refused = await verdictFor('not-a-jwt')

  expect(refused.ok, 'an unverifiable caller was let past the gate').toBe(false)
  expect(refused.identity, 'a refused caller was carried onward as an identity').toBeUndefined()
  expect(refused.email, 'a refused caller was carried onward as an address').toBeUndefined()

  // And the refusal is unchanged in SHAPE — the caller receives the gate's own
  // response, exactly as before the verdict started carrying an identity.
  const served = await worker.fetch(GET('/', { 'cf-access-jwt-assertion': 'not-a-jwt' }), gateEnv())
  expect(served.status, 'the refusal a caller receives changed shape').toBe(401)
  expect(await served.text()).toMatch(/Cloudflare Access rejected this request/)

  // ── One signature check and one key-set read, per request. ─────────────────
  // This is the reason the verdict carries the identity at all: a decision behind
  // the gate that had to recover the address would verify the same token again
  // and read the same publication again. Counted rather than reasoned about,
  // because the count is the only thing that can observe a second consumer.
  const token = await mint({ email: HUMAN })
  resetJwksCache()
  const net = publishKeys()
  const verifies = vi.spyOn(crypto.subtle, 'verify')

  const admitted = await worker.fetch(GET('/api/sites', { 'cf-access-jwt-assertion': token }), gateEnv())

  expect(admitted.status, 'the request was refused as unauthenticated').not.toBe(401)
  expect(
    net.calls.length,
    'the signing keys were read more than once for a single request',
  ).toBe(1)
  expect(
    verifies.mock.calls.length,
    'the token was verified more than once for a single request — the identity is being recovered rather than carried',
  ).toBe(1)
})
