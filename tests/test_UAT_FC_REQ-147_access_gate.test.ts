import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import worker from '../apps/control-app/src/index'
import { accessTokenFrom, certsUrl, resetJwksCache, verifyAccessJwt } from '../apps/control-app/src/access'
import { readWranglerConfig } from './support/wrangler-toml'
// @ts-expect-error — plain JS with no type declarations, deliberately: it has to
// run from a shell straight after a deploy with no transform available.
import { runSmoke } from '../tools/generate/bin/smoke.mjs'

/**
 * REQ-147 — the builder is private.
 *
 * The tests are pointed at the two doors independently, because the ticket's
 * whole finding is that a policy on `app.1stcontact.io` protects
 * `app.1stcontact.io` and nothing else:
 *
 *   - the workers.dev door is shut in configuration, asserted as a fact about
 *     the file that governs the deploy;
 *   - the Worker itself refuses anything without a valid Access JWT, asserted by
 *     driving the real handler with real RSA signatures.
 *
 * The JWTs here are MINTED, not fixtures. A fixture token expires, and a test
 * that pins expiry by freezing a fixture proves the freezing. Minting also makes
 * the forgery cases honest: the wrong-key case is signed by a key that really is
 * not the team's, so the rejection comes from `crypto.subtle.verify` rather than
 * from a string comparison a real attacker would not be subject to.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const TEAM = 'https://uat-team.cloudflareaccess.com'
const AUD = 'a'.repeat(64)
const ENV = { BUILDER_ORIGIN: 'http://builder.test', ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD }

let signing: CryptoKeyPair
let attacker: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string'
      ? bytes
      : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(
  claims: Record<string, unknown>,
  options: { key?: CryptoKeyPair; kid?: string; alg?: string; unsigned?: boolean } = {},
): Promise<string> {
  const header = { alg: options.alg ?? 'RS256', kid: options.kid ?? 'uat-key-1', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, ...claims }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  if (options.unsigned) return `${signed}.`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    (options.key ?? signing).privateKey,
    new TextEncoder().encode(signed),
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

/**
 * Global `fetch` is the seam for BOTH sides of this Worker: the JWKS it verifies
 * against and the builder origin it proxies to. Stubbing it once means an
 * admitted request is observed by the origin actually being reached — the only
 * evidence that distinguishes "allowed through" from "failed differently".
 */
function stubNetwork(options: { jwksStatus?: number } = {}) {
  const origin: Request[] = []
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url === certsUrl(TEAM)) {
      const status = options.jwksStatus ?? 200
      return status === 200
        ? new Response(JSON.stringify(jwks), { headers: { 'content-type': 'application/json' } })
        : new Response('nope', { status })
    }
    if (url.startsWith('http://builder.test')) {
      origin.push(input instanceof Request ? input : new Request(url, init))
      return new Response('the builder', { status: 200 })
    }
    throw new Error(`unexpected fetch to ${url}`)
  })
  vi.stubGlobal('fetch', impl)
  return { origin, impl }
}

const GET = (headers: Record<string, string> = {}) =>
  new Request('https://app.1stcontact.io/', { headers })

beforeAll(async () => {
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  attacker = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'uat-key-1', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-147 — the builder is private', () => {
  /**
   * AC3 — the door the hostname policy misses.
   *
   * Stated as a fact about the file rather than about a deploy, because the file
   * is what governs every future deploy. `workers_dev` IS inheritable, so the
   * top-level value already decides production; production is asserted anyway,
   * so the control cannot be lost by someone reasoning about inheritance.
   */
  it('test_UAT_FC_REQ-147_control_app_answers_on_no_workers_dev_hostname', () => {
    const file = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
    const toml = readFileSync(file, 'utf8')

    const declarations = [...toml.matchAll(/^\s*workers_dev\s*=\s*(\w+)/gm)].map((m) => m[1])
    expect(declarations.length, 'control-app does not declare workers_dev at all').toBeGreaterThan(0)
    expect(
      declarations.every((value) => value === 'false'),
      `control-app declares workers_dev = ${declarations.join(', ')} — a workers.dev hostname is ` +
        'a second door that no Cloudflare Access policy covers',
    ).toBe(true)
    expect(declarations, 'the production environment does not restate workers_dev').toHaveLength(2)

    // The Access-protected route is still the way in — a gate that closed every
    // door would pass the assertion above and serve nobody.
    expect(toml).toContain('app.1stcontact.io/*')
  })

  /** AC4/AC6 — the vars the gate reads exist on both sides of the inheritance line. */
  it('test_UAT_FC_REQ-147_access_configuration_is_declared_for_every_environment', () => {
    const config = readWranglerConfig(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'))
    for (const key of ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
      expect(config.topLevel.vars, `${key} is not declared at the top level`).toContain(key)
      expect(config.envs.production.vars, `${key} is not declared for production`).toContain(key)
    }
  })

  /**
   * AC4 — an unverified caller reaching the Worker DIRECTLY is refused.
   *
   * Each row is a distinct way a caller can arrive without a token Access
   * issued. They are separated rather than folded into one "invalid token" case
   * because they fail at different points, and a gate that caught only the empty
   * one would pass a single combined assertion.
   */
  it.each([
    { what: 'no token at all', headers: {} as Record<string, string>, reason: /no Access token/ },
    { what: 'a token that is not a JWT', token: () => Promise.resolve('not-a-jwt'), reason: /three-part/ },
    {
      what: 'a token signed by a key that is not the team\'s',
      token: () => mint({}, { key: attacker }),
      reason: /signature does not verify/,
    },
    {
      what: 'an unsigned token claiming alg: none',
      token: () => mint({}, { alg: 'none', unsigned: true }),
      reason: /unsupported token algorithm 'none'/,
    },
    {
      what: 'a token for another Access application in the same team',
      token: () => mint({ aud: ['b'.repeat(64)] }),
      reason: /another Access application/,
    },
    {
      what: 'a token issued by another team',
      token: () => mint({ iss: 'https://someone-else.cloudflareaccess.com' }),
      reason: /issued by/,
    },
    {
      what: 'an expired token',
      token: () => mint({ exp: Math.floor(Date.now() / 1000) - 3600 }),
      reason: /expired/,
    },
    {
      what: 'a token signed by a key the team does not publish',
      token: () => mint({}, { kid: 'rotated-away' }),
      reason: /no Access signing key matches/,
    },
  ])(
    'test_UAT_FC_REQ-147_worker_refuses_a_request_without_a_valid_access_jwt — $what',
    async ({ token, headers, reason }) => {
      const net = stubNetwork()
      const request = GET(
        headers ?? { 'cf-access-jwt-assertion': await (token as () => Promise<string>)() },
      )

      const response = await worker.fetch(request, ENV)

      expect(response.status, 'an unverified caller was not refused').toBe(401)
      expect(await response.text()).toMatch(reason)
      // Not merely refused — refused BEFORE the builder was consulted. A gate
      // that proxied first and judged afterwards has already leaked.
      expect(net.origin, 'the origin was reached by an unverified caller').toHaveLength(0)
    },
  )

  /**
   * AC5 — a valid identity reaches the Worker and gets its response, whatever it
   * currently is. This ticket does not require a working builder; it requires
   * that the gate is not what stops one.
   */
  it('test_UAT_FC_REQ-147_a_valid_access_identity_reaches_the_worker', async () => {
    stubNetwork()
    const token = await mint({ email: 'martin-github@westhead.me' })

    const response = await worker.fetch(GET({ 'cf-access-jwt-assertion': token }), ENV)

    // What lies BEHIND the gate changed with REQ-145 — there is no origin to
    // forward to any more, so an admitted caller now gets the Worker's own
    // chrome document instead of a proxied body. The claim under test is
    // unchanged and is the one this ticket owns: a valid identity is let
    // through, and the gate is not what stops the builder working.
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('1st Contact builder')
  })

  /** A browser holds the same JWT in a cookie; the gate must read either. */
  it('test_UAT_FC_REQ-147_the_access_cookie_is_accepted_like_the_header', async () => {
    stubNetwork()
    const token = await mint({ email: 'martin-github@westhead.me' })

    const response = await worker.fetch(
      GET({ cookie: `other=1; CF_Authorization=${token}; another=2` }),
      ENV,
    )

    expect(response.status).toBe(200)
    expect(accessTokenFrom(GET({ cookie: `CF_Authorization=${token}` }))).toBe(token)
    // The header wins when both are present — it is what Access sets on the
    // request it forwards, and the cookie is the copy the client controls.
    expect(
      accessTokenFrom(GET({ cookie: 'CF_Authorization=stale', 'cf-access-jwt-assertion': token })),
    ).toBe(token)
  })

  /** Automation authenticates as a service token, which carries no email. */
  it('test_UAT_FC_REQ-147_a_service_token_identity_is_accepted', async () => {
    stubNetwork()
    const token = await mint({ common_name: 'deploy-bot.access' })

    const result = await verifyAccessJwt({ token, teamDomain: TEAM, aud: AUD })

    expect(result.ok).toBe(true)
    expect(result.ok && result.identity).toBe('service-token:deploy-bot.access')
    expect((await worker.fetch(GET({ 'cf-access-jwt-assertion': token }), ENV)).status).toBe(200)
  })

  /**
   * AC4 — the failure modes that would otherwise fail OPEN.
   *
   * Unconfigured and unverifiable are the two states where "we could not check"
   * is most tempting to treat as "carry on". Both deny, and the unconfigured one
   * says which var is missing, because a 401 would send an operator hunting for
   * a login problem that does not exist.
   */
  it.each([
    { what: 'no team domain', env: { ...ENV, ACCESS_TEAM_DOMAIN: '' }, status: 503, says: /ACCESS_TEAM_DOMAIN/ },
    { what: 'no AUD', env: { ...ENV, ACCESS_AUD: '' }, status: 503, says: /ACCESS_AUD/ },
    { what: 'neither', env: { ...ENV, ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }, status: 503, says: /ACCESS_AUD/ },
  ])('test_UAT_FC_REQ-147_an_unconfigured_gate_denies_rather_than_serves — $what', async ({ env, status, says }) => {
    const net = stubNetwork()

    const response = await worker.fetch(GET({ 'cf-access-jwt-assertion': await mint({}) }), env)

    expect(response.status).toBe(status)
    expect(await response.text()).toMatch(says)
    expect(net.origin).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-147_an_unfetchable_jwks_denies_rather_than_serves', async () => {
    const net = stubNetwork({ jwksStatus: 500 })

    const response = await worker.fetch(GET({ 'cf-access-jwt-assertion': await mint({}) }), ENV)

    expect(response.status).toBe(401)
    expect(await response.text()).toMatch(/signing keys could not be fetched/)
    expect(net.origin).toHaveLength(0)
  })

  /** A refusal must not be cacheable, or one 401 becomes everybody's answer. */
  it('test_UAT_FC_REQ-147_a_refusal_is_never_cached_or_indexed', async () => {
    stubNetwork()

    const response = await worker.fetch(GET(), ENV)

    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-robots-tag')).toContain('noindex')
  })

  /**
   * Key rotation: a token signed by a key minted after the keys were cached must
   * be accepted. Without the refresh it would be refused for the cache lifetime,
   * and "valid token, refused" is an outage that looks like a break-in.
   */
  it('test_UAT_FC_REQ-147_a_rotated_signing_key_is_picked_up_without_a_restart', async () => {
    stubNetwork()
    // Warm the cache with the current key set.
    expect((await worker.fetch(GET({ 'cf-access-jwt-assertion': await mint({}) }), ENV)).status).toBe(200)

    // The team rotates: a new key appears in the JWKS, tokens are signed by it.
    const rotatedJwk = await crypto.subtle.exportKey('jwk', attacker.publicKey)
    jwks = { keys: [...jwks.keys, { ...rotatedJwk, kid: 'uat-key-2', alg: 'RS256', use: 'sig' }] }
    const rotated = await mint({}, { key: attacker, kid: 'uat-key-2' })

    expect((await worker.fetch(GET({ 'cf-access-jwt-assertion': rotated }), ENV)).status).toBe(200)
  })

  /**
   * AC1/AC3, as something that RUNS against a deploy rather than a claim in a
   * document. Table-driven on the answers a live Access deployment actually
   * gives, because a check that only recognised one of them would fail a
   * correctly-protected origin.
   */
  it.each([
    {
      what: 'a browser challenge',
      response: () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://uat-team.cloudflareaccess.com/cdn-cgi/access/login/app...' },
        }),
    },
    { what: 'a non-browser refusal', response: () => new Response('unauthorized', { status: 401 }) },
    { what: 'the Worker refusing an unconfigured gate', response: () => new Response('no vars', { status: 503 }) },
  ])('test_UAT_FC_REQ-147_smoke_accepts_a_protected_control_app — $what', async ({ response }) => {
    const report = await runSmoke({
      controlOrigin: 'https://app.1stcontact.io',
      workersDevOrigin: 'https://control.uat.workers.dev',
      fetch: async (url: string) => {
        if (String(url).startsWith('https://app.1stcontact.io')) return response()
        if (String(url).startsWith('https://control.uat.workers.dev')) {
          throw new TypeError('fetch failed: getaddrinfo ENOTFOUND')
        }
        return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } })
      },
    })

    const named = (name: string) => report.checks.find((c: { name: string }) => c.name === name)
    expect(named('control_app_challenges_unauthenticated').status).toBe('pass')
    expect(named('control_app_workers_dev_closed').status).toBe('pass')
  })

  /** And it fails — naming the check — on each way the builder could be public. */
  it.each([
    {
      what: 'the Access hostname serving unauthenticated',
      url: 'https://app.1stcontact.io',
      check: 'control_app_challenges_unauthenticated',
      detail: /served publicly/,
    },
    {
      what: 'the workers.dev hostname still answering',
      url: 'https://control.uat.workers.dev',
      check: 'control_app_workers_dev_closed',
      detail: /no Access policy covers/,
    },
  ])('test_UAT_FC_REQ-147_smoke_fails_when_the_builder_is_public — $what', async ({ url, check, detail }) => {
    const report = await runSmoke({
      controlOrigin: 'https://app.1stcontact.io',
      workersDevOrigin: 'https://control.uat.workers.dev',
      fetch: async (target: string) => {
        if (String(target).startsWith(url)) {
          return new Response('<html>the builder</html>', {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          })
        }
        if (String(target).startsWith('https://control.uat.workers.dev')) {
          throw new TypeError('fetch failed: getaddrinfo ENOTFOUND')
        }
        return new Response(null, {
          status: 302,
          headers: { location: 'https://uat-team.cloudflareaccess.com/cdn-cgi/access/login/x' },
        })
      },
    })

    expect(report.ok).toBe(false)
    expect(report.failed.map((c: { name: string }) => c.name)).toContain(check)
    expect(report.failed.find((c: { name: string }) => c.name === check).detail).toMatch(detail)
  })

  /** Nothing to test against is skipped, never quietly counted as protected. */
  it('test_UAT_FC_REQ-147_smoke_skips_the_access_checks_when_no_origin_is_given', async () => {
    const report = await runSmoke({
      fetch: async () => new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }),
    })

    const skipped = report.checks
      .filter((c: { status: string }) => c.status === 'skip')
      .map((c: { name: string }) => c.name)
    expect(skipped).toContain('control_app_challenges_unauthenticated')
    expect(skipped).toContain('control_app_workers_dev_closed')
  })

  /**
   * AC6 — the policy lives in Cloudflare, so what is granted and why must live
   * here. Asserted on the substance an operator would need six months from now,
   * not on the file merely existing.
   */
  it('test_UAT_FC_REQ-147_the_access_policy_is_recorded_in_the_repository', () => {
    const doc = readFileSync(path.join(REPO, 'apps', 'control-app', 'ACCESS.md'), 'utf8')

    for (const required of [
      'ACCESS_TEAM_DOMAIN',
      'ACCESS_AUD',
      'workers_dev = false',
      'Granted identities',
      'service token',
      'REQ-143', // where customer login goes instead
    ]) {
      expect(doc, `ACCESS.md does not record '${required}'`).toContain(required)
    }

    // An identity table with no identity in it records nothing. Each row must
    // carry a reason, which is the half a dashboard cannot hold.
    const rows = doc
      .split('\n')
      .filter((line) => line.startsWith('|') && line.includes('@') && !line.includes('---'))
    expect(rows.length, 'ACCESS.md grants no identity').toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.split('|').filter((c) => c.trim() !== '').length, `no reason given: ${row}`)
        .toBeGreaterThanOrEqual(3)
    }

    // No credential is recorded here. The AUD is an identifier and belongs; a
    // service-token secret is a credential and does not.
    expect(doc).not.toMatch(/CF-Access-Client-Secret\s*[:=]\s*\S/)
  })
})
