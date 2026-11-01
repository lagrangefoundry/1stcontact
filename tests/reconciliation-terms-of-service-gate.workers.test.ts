import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { admit, provisionInvite, type IdentityEnv } from '../apps/control-app/src/identity'
import {
  guardTerms,
  TERMS_ACCEPT_PATH,
  TERMS_PATH,
  TERMS_TEXT,
  TERMS_VERSION,
} from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'

/**
 * Story story-0cd18650 — Terms of Service Gate: an admitted person accepts the
 * current terms before anything behind them is served.
 *
 * Every case drives the Worker's own `fetch` inside workerd against a real D1
 * database, carrying a real RS256 Access token verified against a stubbed JWKS
 * (the only external boundary). The person under test is invited through
 * `provisionInvite`, so the terms check is the only thing that can stop them.
 * The assets binding answers a recognisable body so that a fall-through to the
 * builder is an observation rather than an inference.
 *
 * The one place `guardTerms` is called directly is the version-bump case: the
 * current version is a constant, and the gate's injectable version is the only
 * way to move it without editing source.
 */

const PLATFORM = 'tos-gate-platform'
const TEAM = 'https://tos-gate-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)
const KID = 'tos-gate-key'
const ASSET_BODY = 'TOS-GATE-ASSET-BYTES'
const BUMPED = '2099-01-01'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

const assets = { fetch: async () => new Response(ASSET_BODY, { status: 200 }) } as unknown as Fetcher

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: assets,
  } as Env
}

function devOpenEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: assets,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: KID, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, email }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

function stubJwks(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url === certsUrl(TEAM)) {
        return new Response(JSON.stringify(jwks), { headers: { 'content-type': 'application/json' } })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

/** A browser navigation that will render the answer. */
const DOCUMENT = { accept: '*/*', 'sec-fetch-dest': 'document' }
/** A navigation recognised only by its Accept header. */
const HTML_ACCEPT = { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }
/** A fetch()/img/script with a wildcard Accept. */
const WILDCARD = { accept: '*/*' }
const JSON_POST = { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }

type Init = RequestInit & { headers?: Record<string, string> }

async function call(path: string, token: string | null, init: Init = {}, e: Env = workerEnv()): Promise<Response> {
  const headers = { ...(init.headers ?? {}), ...(token ? { 'cf-access-jwt-assertion': token } : {}) }
  return worker.fetch(new Request(`https://app.example${path}`, { ...init, headers }), e)
}

let seq = 0
async function anInvitee(): Promise<{ email: string; token: string; userId: string }> {
  const email = `tos-gate-${(seq += 1)}@example.test`
  const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
  return { email, token: await mint(email), userId: invited.user.id }
}

type Stored = { tos_version: string | null; tos_accepted_at: string | null }
async function storedTerms(userId: string): Promise<Stored> {
  const row = await env.DB.prepare('SELECT tos_version, tos_accepted_at FROM users WHERE id = ?')
    .bind(userId)
    .first<Stored>()
  return row ?? { tos_version: null, tos_accepted_at: null }
}

async function expectTermsPage(response: Response, version: string = TERMS_VERSION): Promise<string> {
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('text/html')
  expect(response.headers.get('location')).toBeNull()
  const body = await response.text()
  expect(body).toContain('Terms of service')
  expect(body).toContain(version)
  expect(body).toContain('I agree to these terms')
  expect(body).not.toContain(ASSET_BODY)
  expect(body).not.toContain('1st Contact builder')
  return body
}

async function expectRefusal(response: Response, label: string): Promise<void> {
  expect(response.status, label).toBe(403)
  expect(response.headers.get('content-type'), label).toContain('text/plain')
  const body = await response.text()
  expect(body, label).toContain('terms of service have not been accepted')
  expect(body, label).toContain('/terms')
  expect(body, label).not.toContain(ASSET_BODY)
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('Terms of service gate — before acceptance', () => {
  it('test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url', async () => {
    stubJwks()
    const never = await anInvitee()
    const stale = await anInvitee()
    await env.DB.prepare('UPDATE users SET tos_version = ?, tos_accepted_at = ? WHERE id = ?')
      .bind('2020-01-01', '2020-01-01T00:00:00.000Z', stale.userId)
      .run()

    for (const person of [never, stale]) {
      await expectTermsPage(await call('/', person.token, { headers: DOCUMENT }))
      await expectTermsPage(await call('/b/some-business/sites', person.token, { headers: DOCUMENT }))
    }
    // Identical treatment: the page served to both is the same document.
    const a = await (await call('/', never.token, { headers: DOCUMENT })).text()
    const b = await (await call('/', stale.token, { headers: DOCUMENT })).text()
    expect(a).toBe(b)
  })

  it('test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text', async () => {
    stubJwks()
    const { token } = await anInvitee()

    const cases: Array<[string, Init]> = [
      ['/builder/builder.css', { headers: { accept: 'text/css,*/*;q=0.1', 'sec-fetch-dest': 'style' } }],
      ['/builder/main.js', { headers: { accept: '*/*', 'sec-fetch-dest': 'script' } }],
      ['/builder/logo.png', { headers: { accept: 'image/avif,image/webp,*/*', 'sec-fetch-dest': 'image' } }],
      ['/api/businesses', { headers: { accept: 'application/json' } }],
      ['/some/deep/link', { headers: WILDCARD }],
      ['/some/deep/link', {}],
      ['/', { method: 'POST', headers: { ...HTML_ACCEPT, 'sec-fetch-dest': 'document' } }],
    ]
    for (const [path, init] of cases) {
      await expectRefusal(await call(path, token, init), `${init.method ?? 'GET'} ${path}`)
    }

    // The same GET, now naming text/html with no Sec-Fetch-Dest, is a navigation.
    await expectTermsPage(await call('/some/deep/link', token, { headers: HTML_ACCEPT }))
  })

  it('test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable', async () => {
    stubJwks()
    const { token } = await anInvitee()

    const responses: Array<[string, Response]> = [
      ['navigation', await call('/', token, { headers: DOCUMENT })],
      ['/terms', await call(TERMS_PATH, token, { headers: HTML_ACCEPT })],
      ['refusal', await call('/builder/main.js', token, { headers: WILDCARD })],
      ['accept 415', await call(TERMS_ACCEPT_PATH, token, { method: 'POST', body: 'x' })],
      ['accept 405', await call(TERMS_ACCEPT_PATH, token, { headers: WILDCARD })],
      ['accept 204', await call(TERMS_ACCEPT_PATH, token, JSON_POST)],
    ]
    for (const [label, response] of responses) {
      expect(response.headers.get('cache-control'), label).toBe('no-store')
      expect(response.headers.get('x-robots-tag'), label).toContain('noindex')
    }
  })

  it('test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external', async () => {
    stubJwks()
    const { token } = await anInvitee()
    const body = await expectTermsPage(await call('/', token, { headers: DOCUMENT }))

    const paragraphs = TERMS_TEXT.split(/\n\s*\n/).map((p) => p.trim())
    expect(paragraphs.length).toBeGreaterThan(1)
    for (const para of paragraphs) {
      const escaped = para.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      expect(body).toContain(`<p>${escaped}</p>`)
    }

    expect(body).not.toMatch(/<link\b[^>]*rel=["']?stylesheet/i)
    expect(body).not.toMatch(/<script[^>]+src=/i)
    expect(body).not.toMatch(/type=["']?module/i)
    expect(body).not.toContain('importmap')
    expect(body).toMatch(/<style>[\s\S]+<\/style>/)
    expect(body).toMatch(/<script>[\s\S]+<\/script>/)
  })

  it('test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing', async () => {
    stubJwks()
    const { token, userId } = await anInvitee()
    const body = await expectTermsPage(await call('/', token, { headers: DOCUMENT }))

    const buttons = body.match(/<button[^>]*>[^<]*<\/button>/g) ?? []
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toContain('I agree to these terms')
    expect(body).not.toMatch(/decline|reject|refuse|disagree|no thanks/i)

    for (const path of ['/api/terms/decline', '/api/terms/reject']) {
      await expectRefusal(await call(path, token, JSON_POST), `POST ${path}`)
    }
    expect(await storedTerms(userId)).toEqual({ tos_version: null, tos_accepted_at: null })
    await expectTermsPage(await call('/', token, { headers: DOCUMENT }))
  })
})

describe('Terms of service gate — acceptance', () => {
  it('test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time', async () => {
    stubJwks()
    const { email, token, userId } = await anInvitee()
    expect(await storedTerms(userId)).toEqual({ tos_version: null, tos_accepted_at: null })

    const before = Date.now()
    const response = await call(TERMS_ACCEPT_PATH, token, JSON_POST)
    const after = Date.now()
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')

    const first = await storedTerms(userId)
    expect(first.tos_version).toBe(TERMS_VERSION)
    expect(first.tos_accepted_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    const stamped = Date.parse(first.tos_accepted_at!)
    expect(stamped).toBeGreaterThanOrEqual(before - 1000)
    expect(stamped).toBeLessThanOrEqual(after + 1000)

    // Accepting again with an injected later time moves the timestamp forward
    // and keeps the version.
    const admission = await admit(identityEnv(), email)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    const later = new Date(stamped + 86_400_000)
    const again = await guardTerms(
      new Request(`https://app.example${TERMS_ACCEPT_PATH}`, JSON_POST),
      identityEnv(),
      admission,
      { now: later },
    )
    expect(again?.status).toBe(204)
    expect(await storedTerms(userId)).toEqual({
      tos_version: TERMS_VERSION,
      tos_accepted_at: later.toISOString(),
    })
  })

  it('test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched', async () => {
    stubJwks()
    const { token, userId } = await anInvitee()

    const forms: Array<[string, Record<string, string>]> = [
      ['none', {}],
      ['urlencoded', { 'content-type': 'application/x-www-form-urlencoded' }],
      ['multipart', { 'content-type': 'multipart/form-data; boundary=x' }],
      ['text/plain', { 'content-type': 'text/plain' }],
    ]
    for (const [label, headers] of forms) {
      const response = await call(TERMS_ACCEPT_PATH, token, { method: 'POST', headers, body: 'accept=1' })
      expect(response.status, label).toBe(415)
      expect(response.headers.get('content-type'), label).toContain('text/plain')
      expect(await response.text(), label).toContain('application/json')
    }

    const get = await call(TERMS_ACCEPT_PATH, token, { headers: HTML_ACCEPT })
    expect(get.status).toBe(405)

    expect(await storedTerms(userId)).toEqual({ tos_version: null, tos_accepted_at: null })
    await expectTermsPage(await call('/', token, { headers: DOCUMENT }))
  })

  it('test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally', async () => {
    stubJwks()
    const { token } = await anInvitee()

    const page = await expectTermsPage(await call('/', token, { headers: DOCUMENT }))
    expect(page).toContain(JSON.stringify(TERMS_ACCEPT_PATH))
    expect(page).toContain('location.reload()')
    expect(page).not.toMatch(/location\.(href|assign|replace)\s*[=(]/)
    await expectRefusal(await call('/builder/main.js', token, { headers: WILDCARD }), 'asset before')

    expect((await call(TERMS_ACCEPT_PATH, token, JSON_POST)).status).toBe(204)

    const chrome = await call('/', token, { headers: DOCUMENT })
    expect(chrome.status).toBe(200)
    const chromeBody = await chrome.text()
    expect(chromeBody).toContain('1st Contact builder')
    expect(chromeBody).not.toContain('I agree to these terms')

    const asset = await call('/builder/main.js', token, { headers: WILDCARD })
    expect(asset.status).toBe(200)
    expect(await asset.text()).toBe(ASSET_BODY)

    const api = await call('/api/businesses', token, { headers: { accept: 'application/json' } })
    expect(api.status).toBe(200)
    expect(api.headers.get('content-type')).toContain('application/json')
  })

  it('test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted', async () => {
    stubJwks()
    const { token, userId } = await anInvitee()

    for (const path of [TERMS_PATH, `/b/some-business${TERMS_PATH}`]) {
      const outstanding = await call(path, token, { headers: HTML_ACCEPT })
      const body = await expectTermsPage(outstanding)
      expect(body).toContain(TERMS_TEXT.split(/\n\s*\n/)[0].trim())
    }

    expect((await call(TERMS_ACCEPT_PATH, token, JSON_POST)).status).toBe(204)
    const acceptedOn = (await storedTerms(userId)).tos_accepted_at!.slice(0, 10)

    for (const path of [TERMS_PATH, `/b/some-business${TERMS_PATH}`]) {
      const response = await call(path, token, { headers: HTML_ACCEPT })
      expect(response.status, path).toBe(200)
      expect(response.headers.get('content-type'), path).toContain('text/html')
      const body = await response.text()
      expect(body).toContain('Terms of service')
      expect(body).toContain(TERMS_VERSION)
      expect(body).toContain(TERMS_TEXT.split(/\n\s*\n/)[0].trim())
      expect(body).toContain(`Accepted on ${acceptedOn}`)
      expect(body).not.toContain('<button')
      expect(body).not.toContain(ASSET_BODY)
    }
  })
})

describe('Terms of service gate — versions and configuration', () => {
  it('test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor', async () => {
    stubJwks()
    const { email, token, userId } = await anInvitee()
    expect((await call(TERMS_ACCEPT_PATH, token, JSON_POST)).status).toBe(204)
    expect(await (await call('/', token, { headers: DOCUMENT })).text()).toContain('1st Contact builder')
    const accepted = await storedTerms(userId)

    // (a) The current version moves on; the stored one does not.
    const admission = await admit(identityEnv(), email)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    const gate = (path: string, headers: Record<string, string>, init: RequestInit = {}) =>
      guardTerms(new Request(`https://app.example${path}`, { ...init, headers }), identityEnv(), admission, {
        version: BUMPED,
      })
    const nav = await gate('/', DOCUMENT)
    expect(nav).toBeDefined()
    await expectTermsPage(nav!, BUMPED)
    await expectRefusal((await gate('/builder/main.js', WILDCARD))!, 'asset at bumped version')
    expect(await storedTerms(userId)).toEqual(accepted)

    // (b) The stored version moves back; the current one is unchanged.
    await env.DB.prepare('UPDATE users SET tos_version = ? WHERE id = ?').bind('2020-01-01', userId).run()
    await expectTermsPage(await call('/', token, { headers: DOCUMENT }), TERMS_VERSION)
    await expectRefusal(await call('/builder/main.js', token, { headers: WILDCARD }), 'asset at stale version')
    expect((await storedTerms(userId)).tos_version).toBe('2020-01-01')

    // A fresh acceptance against the bumped version stamps the bumped version.
    const fresh = await gate(TERMS_ACCEPT_PATH, { 'content-type': 'application/json' }, { method: 'POST', body: '{}' })
    expect(fresh?.status).toBe(204)
    expect((await storedTerms(userId)).tos_version).toBe(BUMPED)
  })

  it('test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check', async () => {
    // Dev-open: no token, no admission, no terms check.
    const nav = await call('/', null, { headers: DOCUMENT }, devOpenEnv())
    expect(nav.status).toBe(200)
    const navBody = await nav.text()
    expect(navBody).toContain('1st Contact builder')
    expect(navBody).not.toContain('I agree to these terms')

    const asset = await call('/builder/main.js', null, { headers: WILDCARD }, devOpenEnv())
    expect(asset.status).toBe(200)
    expect(await asset.text()).toBe(ASSET_BODY)

    // With Access configured, an admitted unaccepted person is gated.
    stubJwks()
    const { token } = await anInvitee()
    await expectTermsPage(await call('/', token, { headers: DOCUMENT }))
    await expectRefusal(await call('/builder/main.js', token, { headers: WILDCARD }), 'configured asset')
  })
})
