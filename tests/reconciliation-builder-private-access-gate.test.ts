/**
 * story-182e8cb9 — **the builder is private**: only granted identities reach it,
 * on every address it answers on.
 *
 * The entry point under test is the control app's exported `fetch` handler —
 * the same function workerd calls — driven with real `Request` objects. Nothing
 * reaches into `guardAccess` or `verifyAccessJwt` directly: every claim below is
 * about a `Response` a caller would actually receive.
 *
 * THE JWTs ARE MINTED, NEVER FIXTURES. A fixture token expires, and a test that
 * pins expiry by freezing a fixture proves the freezing. Minting also makes the
 * forgery cases honest: the wrong-key case is signed by a key that genuinely is
 * not the team's, so the refusal comes from `crypto.subtle.verify` rather than
 * from a string comparison no real attacker would be subject to.
 *
 * THE ONLY THING STUBBED IS THE TEAM'S KEY PUBLICATION — `globalThis.fetch`,
 * which is the network and nothing this repository owns. The store bindings and
 * the assets binding are supplied as TRIPWIRES rather than as stubs of a
 * collaborator: they record that they were touched. That is what makes "refused
 * before anything behind the gate was reached" an observation instead of an
 * assumption, and the same tripwires are shown firing for an admitted caller so
 * that an empty record cannot mean "the tripwire was never armed".
 *
 * The live-origin half of this capability — that the deployed hostname
 * challenges an unauthenticated caller and that the platform-default hostname
 * does not answer — belongs to CAP-102 and is asserted against a deploy, not
 * here. What this file owns is the behaviour those checks observe and the
 * configuration that produces it.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import worker, { type Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { readWranglerConfig } from './support/wrangler-toml'

const REPO = path.resolve(import.meta.dirname, '..')
const CONTROL_APP = path.join(REPO, 'apps', 'control-app')
const TEAM = 'https://uat-team.cloudflareaccess.com'
const AUD = 'a'.repeat(64)

/** The gate's own refusal shape — plain text, never the surface's HTML. */
const REFUSAL_CONTENT_TYPE = /text\/plain/

let signing: CryptoKeyPair
let attacker: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function b64url(input: Uint8Array | string): string {
  const raw =
    typeof input === 'string' ? input : Array.from(input, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Mint one token against the stand-in team, or against a key that is not its. */
async function mint(
  claims: Record<string, unknown> = {},
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
 * The team's key publication, and nothing else. Any other outbound request is an
 * error rather than a silent success, so a route that reached the network behind
 * the gate would be reported rather than tolerated.
 */
function publishKeys(options: { status?: number; empty?: boolean } = {}) {
  const calls: string[] = []
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url !== certsUrl(TEAM)) throw new Error(`unexpected fetch to ${url}`)
    calls.push(url)
    if (options.status && options.status !== 200) return new Response('nope', { status: options.status })
    const body = options.empty ? { keys: [] } : jwks
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
  })
  vi.stubGlobal('fetch', impl)
  return { calls }
}

interface GateEnv {
  env: Env
  /** Every binding behind the gate that was touched, in order. */
  touched: string[]
}

/**
 * A configured gate whose bindings are tripwires.
 *
 * `DB`/`SITES` are getters because `storeFor` reads both the moment a route asks
 * for a store handle, so reading the property IS "the store was opened". `ASSETS`
 * records the fall-through that serves the builder's bytes. Neither is a stand-in
 * for behaviour any assertion below depends on — only for the fact of being
 * reached at all.
 */
function gateEnv(overrides: Partial<Record<string, unknown>> = {}): GateEnv {
  const touched: string[] = []
  const env = {
    TENANT_ID: 'uat-tenant',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: {
      fetch: async () => {
        touched.push('ASSETS')
        return new Response('build artifact bytes', {
          status: 200,
          headers: { 'content-type': 'application/javascript' },
        })
      },
    },
    get DB() {
      touched.push('DB')
      return {} as unknown
    },
    get SITES() {
      touched.push('SITES')
      return {} as unknown
    },
    ...overrides,
  }
  return { env: env as unknown as Env, touched }
}

const GET = (pathname = '/', headers: Record<string, string> = {}) =>
  new Request(`https://app.1stcontact.io${pathname}`, { headers })

/** Paths that reach something behind the gate when the caller is admitted. */
const BEHIND_THE_GATE = ['/api/sites', '/webui/shell.js']

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

/**
 * AC-1375 — a granted identity is admitted and gets the surface's own response.
 *
 * The claim is that the gate is NOT what stops the builder working, so what the
 * surface answers is deliberately not pinned beyond being ITS answer: a success
 * status, its content type and its body — not the gate's plain-text refusal.
 */
it('test_UAT_AC1375_a_granted_identity_receives_the_response_of_the_surface_behind_the_gate', async () => {
  publishKeys()
  const { env } = gateEnv()
  const token = await mint({ email: 'martin-github@westhead.me' })

  const response = await worker.fetch(GET('/', { 'cf-access-jwt-assertion': token }), env)
  const body = await response.text()

  expect(response.status, 'a granted identity was not admitted').toBe(200)
  // The response is the SURFACE's, not the gate's: HTML the builder produced,
  // rather than the plain-text shape every refusal in this file carries.
  expect(response.headers.get('content-type')).toContain('text/html')
  expect(response.headers.get('content-type')).not.toMatch(REFUSAL_CONTENT_TYPE)
  expect(body).toContain('1st Contact builder')
  expect(body).not.toMatch(/Cloudflare Access (rejected|is not configured)/)
})

/**
 * AC-1376 — one identity, three ways of arriving, and the header wins.
 *
 * "Header wins" is asserted at the boundary rather than by reading the extractor:
 * a good token in the header beside a bad one in the cookie is ADMITTED, and the
 * reverse arrangement is REFUSED. Only a gate that reads the header first
 * produces both answers.
 */
it('test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity', async () => {
  publishKeys()
  const human = await mint({ email: 'martin-github@westhead.me' })
  const machine = await mint({ common_name: 'deploy-bot.access', email: undefined })

  const arrivals = [
    { what: 'the header Access attaches', headers: { 'cf-access-jwt-assertion': human } },
    {
      what: 'the cookie a browser holds, among unrelated cookies',
      headers: { cookie: `theme=dark; CF_Authorization=${human}; other=2` },
    },
    { what: 'an automation service identity', headers: { 'cf-access-jwt-assertion': machine } },
  ]

  for (const arrival of arrivals) {
    const { env } = gateEnv()
    const response = await worker.fetch(GET('/', arrival.headers), env)
    expect(response.status, `a valid identity on ${arrival.what} was refused`).toBe(200)
    expect(await response.text()).toContain('1st Contact builder')
  }

  // A service identity carries a machine name instead of an email, and is
  // admitted on exactly the same terms — so it must not have been let in by some
  // laxer path: the same token with a stale audience is still refused.
  const misaddressed = await mint({ common_name: 'deploy-bot.access', aud: ['b'.repeat(64)] })
  expect((await worker.fetch(GET('/', { 'cf-access-jwt-assertion': misaddressed }), gateEnv().env)).status).toBe(401)

  // Header first: the gateway attaches it, the cookie is the client's copy.
  const headerWins = await worker.fetch(
    GET('/', { 'cf-access-jwt-assertion': human, cookie: 'CF_Authorization=stale-and-invalid' }),
    gateEnv().env,
  )
  expect(headerWins.status, 'the stale cookie was used in place of the header').toBe(200)

  const headerLoses = await worker.fetch(
    GET('/', { 'cf-access-jwt-assertion': 'stale-and-invalid', cookie: `CF_Authorization=${human}` }),
    gateEnv().env,
  )
  expect(headerLoses.status, 'the cookie was used when the header was present').toBe(401)
  expect(await headerLoses.text()).toMatch(/three-part/)
})

/**
 * AC-1377 — every way of arriving without an identity the gateway issued is
 * refused, told which check failed, and stopped before anything behind the gate.
 *
 * Each case is run against a path that opens the store and a path that serves
 * bytes, so "nothing behind the gate was consulted" is checked on both kinds of
 * thing there are to consult. The final block arms the same tripwires with an
 * admitted caller: without it an empty record would be indistinguishable from a
 * tripwire that never worked.
 */
it('test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate', async () => {
  const cases = [
    { what: 'no identity at all', token: async () => undefined, reason: /no Access token was presented/ },
    { what: 'not a well-formed token', token: async () => 'not-a-jwt', reason: /three-part JWT/ },
    {
      what: 'signed by a key that is not the gateway’s',
      token: () => mint({}, { key: attacker }),
      reason: /signature does not verify/,
    },
    {
      what: 'unsigned, its own header claiming no algorithm is needed',
      token: () => mint({}, { alg: 'none', unsigned: true }),
      reason: /unsupported token algorithm 'none'/,
    },
    {
      what: 'issued for a different application in the same team',
      token: () => mint({ aud: ['b'.repeat(64)] }),
      reason: /another Access application/,
    },
    {
      what: 'issued by a different team',
      token: () => mint({ iss: 'https://someone-else.cloudflareaccess.com' }),
      reason: /was issued by 'https:\/\/someone-else\.cloudflareaccess\.com'/,
    },
    {
      what: 'expired',
      token: () => mint({ exp: Math.floor(Date.now() / 1000) - 3600 }),
      reason: /has expired/,
    },
    {
      what: 'naming a signing key the gateway does not publish',
      token: () => mint({}, { kid: 'never-published' }),
      reason: /no Access signing key matches kid 'never-published'/,
    },
  ]

  publishKeys()

  for (const kase of cases) {
    const presented = await kase.token()
    for (const pathname of BEHIND_THE_GATE) {
      const { env, touched } = gateEnv()
      const headers = presented === undefined ? {} : { 'cf-access-jwt-assertion': presented }

      const response = await worker.fetch(GET(pathname, headers), env)

      expect(response.status, `${kase.what} was not refused on ${pathname}`).toBe(401)
      expect(await response.text(), `${kase.what}: the refusal did not say which check failed`).toMatch(
        kase.reason,
      )
      expect(response.headers.get('content-type')).toMatch(REFUSAL_CONTENT_TYPE)
      // The refusal happened BEFORE the route table: no store handle, no bytes.
      expect(touched, `${kase.what}: something behind the gate was consulted on ${pathname}`).toEqual([])
    }
  }

  // The tripwires are real — an admitted caller trips every one of them.
  const admitted = await mint({ email: 'martin-github@westhead.me' })
  for (const pathname of BEHIND_THE_GATE) {
    const { env, touched } = gateEnv()
    await worker.fetch(GET(pathname, { 'cf-access-jwt-assertion': admitted }), env)
    expect(touched, `nothing behind the gate is reachable at ${pathname} even when admitted`).not.toEqual([])
  }
})

/**
 * AC-1378 — an incompletely configured gate refuses everything, with a status
 * that is NOT an authorisation failure, naming the setting it lacks.
 *
 * The distinction is the whole point: 401 sends the operator to a login problem
 * that does not exist, when the fix is in the deployment configuration.
 */
it('test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting', async () => {
  publishKeys()
  const valid = await mint({ email: 'martin-github@westhead.me' })

  const cases = [
    { what: 'the team identifier is empty', overrides: { ACCESS_TEAM_DOMAIN: '' }, names: ['ACCESS_TEAM_DOMAIN'] },
    { what: 'the audience identifier is empty', overrides: { ACCESS_AUD: '' }, names: ['ACCESS_AUD'] },
    {
      what: 'both are empty',
      overrides: { ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' },
      names: ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD'],
    },
  ]

  for (const kase of cases) {
    const { env, touched } = gateEnv(kase.overrides)

    const response = await worker.fetch(GET('/api/sites', { 'cf-access-jwt-assertion': valid }), env)
    const body = await response.text()

    // Service-unavailable class, and specifically NOT the authorisation failure.
    expect(response.status, `${kase.what}: an otherwise-valid identity was not refused`).toBe(503)
    expect(response.status, `${kase.what}: an unconfigured gate answered as an auth failure`).not.toBe(401)
    for (const name of kase.names) {
      expect(body, `${kase.what}: the refusal does not name ${name}`).toContain(name)
    }
    expect(touched, `${kase.what}: something behind the gate was consulted`).toEqual([])
  }
})

/**
 * AC-1379 — keys that cannot be obtained deny. Both shapes of "cannot": the
 * publication errors, and the publication is reachable but carries no keys.
 * Neither may become "carry on" — that path is the whole vulnerability dressed
 * as resilience.
 */
it('test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit', async () => {
  const cases = [
    { what: 'the key publication answers with an error status', options: { status: 500 } },
    { what: 'the gateway publishes no keys at all', options: { empty: true } },
  ]

  for (const kase of cases) {
    resetJwksCache()
    publishKeys(kase.options)
    const { env, touched } = gateEnv()
    const valid = await mint({ email: 'martin-github@westhead.me' })

    const response = await worker.fetch(GET('/api/sites', { 'cf-access-jwt-assertion': valid }), env)

    expect(response.status, `${kase.what}: an unverifiable request was admitted`).toBe(401)
    expect(await response.text(), `${kase.what}: the refusal does not say why`).toMatch(
      /signing keys could not be fetched/,
    )
    expect(touched, `${kase.what}: something behind the gate was consulted`).toEqual([])
    vi.unstubAllGlobals()
  }
})

/**
 * AC-1380 — a key first published after the gate read the key set is honoured,
 * on the same running gate. Without the refresh every valid identity would be
 * refused for the cache lifetime, and "valid identity, refused" is an outage
 * that reads to an operator like a break-in.
 */
it('test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart', async () => {
  const net = publishKeys()

  // Admit one request, so the gate has read and retained the current key set.
  const warm = await worker.fetch(
    GET('/', { 'cf-access-jwt-assertion': await mint({ email: 'martin-github@westhead.me' }) }),
    gateEnv().env,
  )
  expect(warm.status, 'the gate did not admit before the rotation').toBe(200)
  const readsBefore = net.calls.length
  expect(readsBefore).toBeGreaterThan(0)

  // The gateway begins publishing an additional key, and issues an identity
  // signed by it. No restart, no redeploy, no configuration change.
  const rotated = await crypto.subtle.exportKey('jwk', attacker.publicKey)
  jwks = { keys: [...jwks.keys, { ...rotated, kid: 'uat-key-2', alg: 'RS256', use: 'sig' }] }
  const token = await mint({ email: 'martin-github@westhead.me' }, { key: attacker, kid: 'uat-key-2' })

  const response = await worker.fetch(GET('/', { 'cf-access-jwt-assertion': token }), gateEnv().env)

  expect(response.status, 'an identity signed by a newly published key was refused').toBe(200)
  expect(await response.text()).toContain('1st Contact builder')
  // It was honoured by re-reading the publication, not by having never cached.
  expect(net.calls.length, 'the gate did not re-read the key set').toBeGreaterThan(readsBefore)

  // Leave the published key set as the rest of the file expects to find it.
  jwks = { keys: jwks.keys.filter((k) => (k as { kid?: string }).kid === 'uat-key-1') }
})

/**
 * AC-1381 — no refusal is storable by an intermediary or indexable by a crawler.
 * Asserted on both refusals the gate produces: one stored 401 served back to the
 * admitted identity is the same failure as never having gated at all.
 */
it('test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler', async () => {
  publishKeys()

  const refusals = [
    { what: 'an unauthorised caller', env: gateEnv().env, status: 401 },
    { what: 'an unconfigured gate', env: gateEnv({ ACCESS_AUD: '' }).env, status: 503 },
  ]

  for (const refusal of refusals) {
    const response = await worker.fetch(GET('/'), refusal.env)

    expect(response.status, `${refusal.what} was not refused`).toBe(refusal.status)
    expect(response.headers.get('cache-control'), `${refusal.what}: the refusal is storable`).toContain(
      'no-store',
    )
    expect(response.headers.get('x-robots-tag'), `${refusal.what}: the refusal is indexable`).toContain(
      'noindex',
    )
  }
})

/**
 * AC-1382 — the platform-assigned hostname, which no hostname-attached policy
 * can cover, is disabled everywhere it can be declared. Stated as a fact about
 * the file, because the file governs every future deploy rather than one past
 * one. The operator-facing route is asserted too: a configuration that closed
 * every door would satisfy the first half and serve nobody.
 */
it('test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front', () => {
  const toml = readFileSync(path.join(CONTROL_APP, 'wrangler.toml'), 'utf8')

  const declarations = [...toml.matchAll(/^\s*workers_dev\s*=\s*(\w+)/gm)].map((m) => m[1])

  expect(declarations.length, 'the control app does not declare workers_dev at all').toBeGreaterThan(0)
  expect(
    declarations.filter((value) => value !== 'false'),
    'a workers.dev hostname is a second address no hostname-attached policy covers',
  ).toEqual([])
  // Top level AND the production environment, so the control cannot be lost by
  // someone reasoning incorrectly about what a named environment inherits.
  expect(declarations, 'the production environment does not restate workers_dev').toHaveLength(2)

  // The door the gate DOES front is still declared.
  expect(toml, 'the operator-facing route is not declared').toMatch(
    /pattern\s*=\s*"app\.1stcontact\.io\/\*"/,
  )
})

/**
 * AC-1383 — both settings the gate reads are declared on both sides of the
 * inheritance line. A named environment inherits no vars, so a setting declared
 * once at the top level is simply absent in production — which for this gate is
 * the incomplete-configuration state AC-1378 pins, i.e. a deployed builder that
 * refuses everyone.
 */
it('test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to', () => {
  const config = readWranglerConfig(path.join(CONTROL_APP, 'wrangler.toml'))

  expect(Object.keys(config.envs), 'the control app declares no named environment').toContain('production')

  for (const setting of ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
    expect(config.topLevel.vars, `${setting} is not declared at the top level`).toContain(setting)
    expect(
      config.envs.production.vars,
      `${setting} is not declared for production, which inherits nothing`,
    ).toContain(setting)
  }
})

/**
 * AC-1384 — the policy record, asserted on the substance an operator would need
 * six months from now rather than on the headings being present.
 *
 * This is also where the one thing no test in this repository can assert lives:
 * an identity that authenticates but is not on the policy is refused by the
 * gateway before the application ever sees the request.
 */
it('test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository', () => {
  const doc = readFileSync(path.join(CONTROL_APP, 'ACCESS.md'), 'utf8')
  /**
   * The BODY rows of the table under a heading — the header row and the
   * separator are dropped, so "a row with no reason in it" is a claim about a
   * recorded identity rather than about the column titles.
   */
  const rows = (heading: string): string[][] => {
    const section = (doc.split(new RegExp(`^#+ .*${heading}.*$`, 'm'))[1] ?? '').split(/^#+ /m)[0]
    const lines = section.split('\n').filter((line) => line.trim().startsWith('|'))
    const separator = lines.findIndex((line) => /^\s*\|[\s:|-]+\|\s*$/.test(line))
    expect(separator, `no table is recorded under '${heading}'`).toBeGreaterThanOrEqual(0)
    return lines
      .slice(separator + 1)
      .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
  }

  // Both settings the gate reads, by name, each with where its value is obtained.
  const settings = rows('Configuration')
  for (const setting of ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
    const row = settings.find((cells) => cells[0]?.includes(setting))
    expect(row, `ACCESS.md does not record the setting ${setting}`).toBeDefined()
    expect(row?.[1], `${setting} is recorded with no statement of what it is`).toBeTruthy()
    expect(
      (row?.[2] ?? '').length,
      `${setting} is recorded with no statement of where its value is obtained`,
    ).toBeGreaterThan(10)
  }

  // Both controls, each with what it protects against.
  const controls = rows('gate is stated twice')
  expect(controls.length, 'ACCESS.md records fewer than two controls').toBeGreaterThanOrEqual(2)
  expect(controls.map((cells) => cells.join(' ')).join('\n')).toContain('workers_dev = false')
  expect(controls.map((cells) => cells.join(' ')).join('\n')).toMatch(/access\.ts/)
  for (const control of controls) {
    expect(
      (control[2] ?? '').length,
      `a control is recorded with no statement of what it protects against: ${control.join(' | ')}`,
    ).toBeGreaterThan(20)
  }

  // At least one granted identity, each with a stated reason. A table with no
  // identity in it, or identities with no reasons, records nothing.
  const granted = rows('Granted identities').filter((cells) => cells[0]?.includes('@'))
  expect(granted.length, 'ACCESS.md grants no identity').toBeGreaterThan(0)
  for (const identity of granted) {
    expect(
      (identity[1] ?? '').length,
      `a granted identity carries no reason: ${identity.join(' | ')}`,
    ).toBeGreaterThan(10)
  }

  // How automation authenticates, and where its secret belongs.
  expect(doc, 'ACCESS.md does not say how automation authenticates').toMatch(/service token/i)
  expect(doc, 'ACCESS.md does not say the automation secret belongs in a secret store').toMatch(
    /secret store/i,
  )
  expect(doc, 'ACCESS.md does not say the automation secret stays out of this repository').toMatch(
    /never\s+into this repository/i,
  )

  // Where customer sign-in goes instead, so the operator gate is not mistaken
  // for the product's login.
  expect(doc, 'ACCESS.md does not distinguish the operator gate from customer login').toMatch(
    /customer[\s\S]{0,200}REQ-143/,
  )

  // The exclusion this record exists to carry, because no test can assert it.
  expect(doc, 'ACCESS.md does not record what the gateway refuses before the Worker sees it').toMatch(
    /not on the policy is refused/i,
  )

  // No credential. The audience identifier belongs; a service-identity secret
  // does not.
  expect(doc, 'a service-token secret value is recorded in the repository').not.toMatch(
    /CF-Access-Client-Secret\s*[:=]\s*\S/,
  )
})
