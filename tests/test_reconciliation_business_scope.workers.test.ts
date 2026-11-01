import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  DENIED_MESSAGE,
  provisionBusiness,
  provisionInvite,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import {
  BUSINESSES_PATH,
  route,
  resetChatHost,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { TenantNotConfiguredError, UnscopedError, type Scope } from '../apps/control-app/src/scope'
import { storeFor } from '../apps/control-app/src/store'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { acceptTerms } from '../apps/control-app/src/terms'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, runMigration } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { says, scriptedClient } from './support/scripted-model-client'
import operatorMembership from '../db/migrations/0005_operator_membership.sql?raw'

/**
 * **Every request operates exactly one business, chosen by who the caller is**
 * (story-7102ffe3 — AC-2117 … AC-2131, AC-2124 lives in the node sibling
 * `test_reconciliation_business_scope_single_reader.test.ts` because it reads
 * the source tree, which workerd has no filesystem for).
 *
 * WHAT MAKES THIS EVIDENCE. The HTTP cases drive the Worker's own `fetch` — a
 * real RS256 Access token verified against a JWKS, `admit`, `resolveScope` and
 * the route table, inside workerd against real D1 and R2 with every migration
 * applied. Businesses are provisioned through the shipped entry points. The one
 * double at the network edge is the JWKS fetch; the one at the model edge is the
 * scripted Anthropic client. Where a case needs a seam the Worker does not
 * expose (a store opener that fails once), it drives `route` — the same table
 * `fetch` hands off to — and says so.
 *
 * Every assertion names WHICH business answered: the failure under test is a
 * request that succeeds with somebody else's data.
 */

const PLATFORM = 'bscope-platform'
const TEAM = 'https://bscope-team.cloudflareaccess.com'
const AUD = 'b'.repeat(64)

const NO_BUSINESS_BODY =
  'No business on this account can be opened at the moment. The business switcher lists each one and says why.'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

/** Echoes the path it was asked for, so "routed as given" is observable. */
const ASSETS = {
  fetch: async (request: Request | string) =>
    new Response(`asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`, {
      status: 200,
    }),
} as unknown as Fetcher

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS,
    ...overrides,
  } as Env
}

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS,
  } as unknown as RouterEnv
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A REAL Access token, minted against the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'bscope-key', typ: 'JWT' }
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

let seq = 0
const anEmail = (): string => `bscope-${(seq += 1)}@example.test`

/** An invitee who has also accepted the terms — otherwise every route is the interstitial. */
async function invite(
  spec: Parameters<typeof provisionInvite>[1],
  envOverrides: Partial<IdentityEnv> = {},
): Promise<Awaited<ReturnType<typeof provisionInvite>>> {
  const result = await provisionInvite(identityEnv(envOverrides), spec)
  await acceptTerms(identityEnv(envOverrides), result.user.id)
  return result
}

/** One person holding two businesses, both live, granted in that order. */
async function twoBusinesses(): Promise<{ email: string; userId: string; a: string; b: string }> {
  const email = anEmail()
  const first = await invite({ email, accountName: 'Salon', endsAt: null })
  const second = await provisionBusiness(identityEnv(), {
    accountUserId: first.user.id,
    name: 'Studio',
    email,
  })
  return { email, userId: first.user.id, a: first.businessId, b: second.businessId }
}

/** Push a business's grant into the past — the "card expired" shape. */
async function lapse(businessId: string): Promise<void> {
  await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
    .bind(new Date(Date.now() - 1_000).toISOString(), businessId)
    .run()
}

async function deactivate(businessId: string): Promise<void> {
  await env.DB.prepare('UPDATE tenants SET status = ? WHERE id = ?').bind('suspended', businessId).run()
}

async function makeAdmin(userId: string): Promise<void> {
  await env.DB.prepare('UPDATE users SET platform_admin = 1 WHERE id = ?').bind(userId).run()
}

/** A site in a business, written through the same opener a route uses. */
async function siteIn(businessId: string, slug: string, assets: Record<string, Uint8Array> = {}) {
  const store = await storeFor(routerEnv(), { businessId })
  const seed = siteSeed({ slug, assets })
  await store.createDraft(slug)
  await store.write(slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: Object.entries(seed.assets).map(([name, bytes]) => ({ name, bytes })),
  })
}

interface Ask {
  method?: string
  body?: BodyInit
  json?: unknown
  env?: Partial<Env>
  token?: string | null
}

/** One request through the Worker's own `fetch`. */
async function ask(path: string, email: string | null, opts: Ask = {}): Promise<Response> {
  const headers: Record<string, string> = {}
  if (email !== null) headers['cf-access-jwt-assertion'] = opts.token ?? (await mint(email))
  let body = opts.body
  if (opts.json !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(opts.json)
  }
  return worker.fetch(
    new Request(`https://app.example${path}`, { method: opts.method ?? 'GET', headers, body }),
    workerEnv(opts.env),
  )
}

async function slugsOf(response: Response): Promise<string[]> {
  expect(response.status, await response.clone().text()).toBe(200)
  return ((await response.json()) as Array<{ slug: string }>).map((s) => s.slug).sort()
}

/** The structured log lines `index.ts` writes, parsed. */
let warn: ReturnType<typeof vi.spyOn>
function events(): Array<Record<string, unknown>> {
  return warn.mock.calls
    .map((call) => {
      try {
        return JSON.parse(String(call[0])) as Record<string, unknown>
      } catch {
        return null
      }
    })
    .filter((e): e is Record<string, unknown> => e !== null)
}

function expectUniformRefusal(response: Response, body: string): void {
  expect(response.status).toBe(403)
  expect(response.headers.get('content-type')).toContain('text/plain')
  expect(response.headers.get('cache-control')).toContain('no-store')
  expect(body).toBe(DENIED_MESSAGE)
}

async function frames(response: Response): Promise<{ kind: string }[]> {
  return (await response.text())
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

/** Everything a business's ticket store holds, bodies and comments, as one string. */
async function everythingIn(businessId: string): Promise<string> {
  const store: TicketStore = await ticketStoreFor(routerEnv(), { businessId })
  const { tickets } = await store.query({ limit: 'all' })
  const parts: string[] = []
  for (const t of tickets) {
    parts.push(t.title ?? '', t.body ?? '', JSON.stringify(t.fields ?? {}))
    const { comments } = await store.comments({ uid: t.uid })
    for (const c of comments) parts.push(c.body ?? '')
  }
  return parts.join('\n')
}

async function chatTickets(businessId: string): Promise<{ uid: string; transcript: string }[]> {
  const store = await ticketStoreFor(routerEnv(), { businessId })
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const out: { uid: string; transcript: string }[] = []
  for (const t of tickets) {
    const { comments } = await store.comments({ uid: t.uid })
    const transcript = comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')
    out.push({ uid: t.uid, transcript: transcript?.body ?? '' })
  }
  return out
}

beforeAll(async () => {
  await applySchema()
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'bscope-key', alg: 'RS256', use: 'sig' }] }
})

beforeEach(() => {
  stubJwks()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resetJwksCache()
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC-2117 ─────────────────────────────────────────────────────────────────

describe('a path prefix selects one held business', () => {
  it('test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites', async () => {
    const { email, a, b } = await twoBusinesses()
    await siteIn(a, 'salon-only')
    await siteIn(b, 'studio-only')

    // Each prefix answers with its own business's sites and never the other's.
    expect(await slugsOf(await ask(`/b/${a}/api/sites`, email))).toEqual([a, 'salon-only'].sort())
    expect(await slugsOf(await ask(`/b/${b}/api/sites`, email))).toEqual([b, 'studio-only'].sort())

    // The prefix is stripped before routing: `/b/<A>/api/sites` is `/api/sites`
    // scoped to A, answered by the same route table.
    const unprefixed = await route(new Request('https://app.example/api/sites'), routerEnv(), {
      businessId: a,
    })
    const prefixed = await ask(`/b/${a}/api/sites`, email)
    expect(await slugsOf(prefixed)).toEqual(await slugsOf(unprefixed))

    // `/b/<A>` with no trailing path is `/` — the chrome.
    const bare = await ask(`/b/${a}`, email)
    expect(bare.status).toBe(200)
    expect(bare.headers.get('content-type')).toContain('text/html')

    // An empty prefix id is not a target: the path reaches the table untouched
    // and falls through to the asset binding as `/b//api/sites`.
    const empty = await ask('/b//api/sites', email)
    expect(await empty.text()).toBe('asset:/b//api/sites')
  })
})

// ── AC-2118 ─────────────────────────────────────────────────────────────────

describe('a named business the caller does not hold', () => {
  it('test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted', async () => {
    const mine = anEmail()
    const owner = await invite({ email: mine, accountName: 'Mine', endsAt: null })
    const stranger = await invite({ email: anEmail(), accountName: 'Theirs', endsAt: null })
    await siteIn(owner.businessId, 'mine-only')
    await siteIn(stranger.businessId, 'theirs-only')

    for (const target of [stranger.businessId, 'acct_does_not_exist_anywhere']) {
      const response = await ask(`/b/${target}/api/sites`, mine)
      const body = await response.text()
      expectUniformRefusal(response, body)
      // Nothing from either business, and not a fallback to the one they hold.
      for (const leak of [owner.businessId, 'mine-only', stranger.businessId, 'theirs-only']) {
        expect(body).not.toContain(leak)
      }
    }

    const refusal = events().find(
      (e) => e.event === 'scope_refused' && e.business === stranger.businessId,
    )
    expect(refusal).toBeDefined()
    expect(refusal?.reason).toBe('not_a_member')
  })
})

// ── AC-2119 ─────────────────────────────────────────────────────────────────

describe('a named business whose grant lapsed', () => {
  it('test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement', async () => {
    const { email, a: live, b: lapsed } = await twoBusinesses()
    await lapse(lapsed)

    const response = await ask(`/b/${lapsed}/api/sites`, email)
    const body = await response.text()
    expectUniformRefusal(response, body)
    expect(body).not.toContain(live)
    expect(body).not.toContain(lapsed)

    const logged = events().filter((e) => e.event === 'scope_refused' && e.business === lapsed)
    expect(logged.map((e) => e.reason)).toEqual(['no_entitlement'])

    // The live one still resolves.
    expect(await slugsOf(await ask(`/b/${live}/api/sites`, email))).toEqual([live])
  })
})

// ── AC-2120 ─────────────────────────────────────────────────────────────────

describe('a request with no target', () => {
  it('test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform', async () => {
    // The platform business has a site of its own, so falling back to it would
    // be visible in the answer.
    await siteIn(PLATFORM, 'platform-site')
    const { email, a: oldest, b: second } = await twoBusinesses()
    await lapse(oldest)

    const slugs = await slugsOf(await ask('/api/sites', email))
    expect(slugs).toEqual([second])
    expect(slugs).not.toContain('platform-site')
    expect(slugs).not.toContain(oldest)
  })
})

// ── AC-2121 ─────────────────────────────────────────────────────────────────

describe('the platform admin bypass', () => {
  it('test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated', async () => {
    const adminEmail = anEmail()
    const admin = await invite({ email: adminEmail, accountName: 'Ops', endsAt: null })
    await makeAdmin(admin.user.id)
    const customer = await invite({ email: anEmail(), accountName: 'Customer', endsAt: null })
    await siteIn(customer.businessId, 'customer-site')

    // The premise: no membership is doing the work.
    const admission = await admit(identityEnv(), adminEmail)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    expect(admission.businesses.map((x) => x.businessId)).not.toContain(customer.businessId)

    // Operates it exactly as its owner would.
    expect(await slugsOf(await ask(`/b/${customer.businessId}/api/sites`, adminEmail))).toEqual(
      [customer.businessId, 'customer-site'].sort(),
    )

    // Lapsed → 403, uniform, logged no_entitlement.
    await lapse(customer.businessId)
    const lapsedRes = await ask(`/b/${customer.businessId}/api/sites`, adminEmail)
    expectUniformRefusal(lapsedRes, await lapsedRes.text())
    expect(
      events().find((e) => e.event === 'scope_refused' && e.business === customer.businessId)?.reason,
    ).toBe('no_entitlement')

    // Unknown → 403, uniform, logged unknown_business.
    const ghost = 'acct_bscope_never_provisioned'
    const unknownRes = await ask(`/b/${ghost}/api/sites`, adminEmail)
    expectUniformRefusal(unknownRes, await unknownRes.text())
    expect(events().find((e) => e.event === 'scope_refused' && e.business === ghost)?.reason).toBe(
      'unknown_business',
    )

    // Deactivated (with a live grant) → refused, not served.
    const suspended = await invite({ email: anEmail(), accountName: 'Suspended', endsAt: null })
    await deactivate(suspended.businessId)
    const deadRes = await ask(`/b/${suspended.businessId}/api/sites`, adminEmail)
    const deadBody = await deadRes.text()
    expectUniformRefusal(deadRes, deadBody)
    expect(deadBody).not.toContain(suspended.businessId)
  })
})

// ── AC-2122 ─────────────────────────────────────────────────────────────────

describe('a deactivated business', () => {
  it('test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403', async () => {
    const { email, a: dead, b: live } = await twoBusinesses()
    await deactivate(dead)

    const admission = await admit(identityEnv(), email)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    expect(admission.businesses.filter((x) => x.businessId === dead && x.selectable)).toEqual([])

    // Skipped by the fallback…
    expect(await slugsOf(await ask('/api/sites', email))).toEqual([live])

    // …and naming it is the 403 refusal, not a 503 from the store.
    const named = await ask(`/b/${dead}/api/sites`, email)
    expectUniformRefusal(named, await named.text())
  })
})

// ── AC-2123 ─────────────────────────────────────────────────────────────────

describe('the loopback dev-open path', () => {
  it('test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target', async () => {
    const devPlatform = 'bscope-devopen-platform'
    await siteIn(devPlatform, 'devopen-site')
    const other = await invite({ email: anEmail(), accountName: 'Elsewhere', endsAt: null })

    const devOpen: Partial<Env> = {
      ACCESS_DEV_OPEN: '1',
      ACCESS_TEAM_DOMAIN: '',
      ACCESS_AUD: '',
      TENANT_ID: devPlatform,
    }

    // No token at all — there is no identity on this path.
    expect(await slugsOf(await ask('/api/sites', null, { env: devOpen }))).toEqual(['devopen-site'])
    const targeted = await slugsOf(await ask(`/b/${other.businessId}/api/sites`, null, { env: devOpen }))
    expect(targeted).toEqual(['devopen-site'])
    expect(targeted).not.toContain(other.businessId)

    // Unset or blank: a configuration error, not an invented default.
    for (const blank of ['', '   ']) {
      const res = await ask('/api/sites', null, { env: { ...devOpen, TENANT_ID: blank } })
      expect(res.status).toBe(503)
      const message = await res.text()
      expect(message).toContain('TENANT_ID is not configured')
      expect(message).toContain('wrangler.toml')
    }
  })
})

// ── AC-2125 ─────────────────────────────────────────────────────────────────

describe('store openers given an empty scope', () => {
  it('test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error', async () => {
    // Every binding throws on touch, so "before any data access" is observed
    // rather than assumed: a refusal that came after a read would be this error.
    const untouchable = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === 'then') return undefined
          throw new Error(`data access attempted: ${String(prop)}`)
        },
      },
    )
    const hostile = { DB: untouchable, SITES: untouchable, BLOBS: untouchable } as unknown as RouterEnv
    const empty: Scope = { businessId: '' }

    const openers: Array<[string, () => Promise<unknown>]> = [
      ['storeFor', () => storeFor(hostile, empty)],
      ['ticketStoreFor', () => ticketStoreFor(hostile, empty)],
    ]
    for (const [name, open] of openers) {
      const outcome = await open().then(
        (handle) => ({ handle }),
        (err: unknown) => ({ err }),
      )
      expect('handle' in outcome, `${name} produced a handle for the empty scope`).toBe(false)
      const err = (outcome as { err: unknown }).err
      expect(err).toBeInstanceOf(UnscopedError)
      expect(err).not.toBeInstanceOf(TenantNotConfiguredError)
      const message = (err as Error).message
      expect(message).toContain(name)
      expect(message).toMatch(/scope with no business id/)
      expect(message).toMatch(/by hand/)
      expect(message).not.toMatch(/TENANT_ID is not configured/)
      expect(message).not.toMatch(/unknown tenant/i)
      expect(message).not.toMatch(/data access attempted/)
      expect((err as Error).name).not.toBe('UnknownTenantError')
    }
  })
})

// ── AC-2126 ─────────────────────────────────────────────────────────────────

describe('a preview sub-resource keeps its business', () => {
  it('test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page', async () => {
    const { email, a, b } = await twoBusinesses()
    const enc = new TextEncoder()
    const A_BYTES = '<svg xmlns="http://www.w3.org/2000/svg"><title>business-A-logo</title></svg>'
    const B_BYTES = '<svg xmlns="http://www.w3.org/2000/svg"><title>business-B-logo</title></svg>'
    // Same slug, same asset path, different bytes.
    await siteIn(a, 'shared-site', { 'logo.svg': enc.encode(A_BYTES) })
    await siteIn(b, 'shared-site', { 'logo.svg': enc.encode(B_BYTES) })

    for (const [business, bytes, other] of [
      [a, A_BYTES, B_BYTES],
      [b, B_BYTES, A_BYTES],
    ] as const) {
      const pageUrl = `https://app.example/b/${business}/preview/shared-site/draft/`
      const page = await ask(new URL(pageUrl).pathname, email)
      expect(page.status, await page.clone().text()).toBe(200)
      expect(page.headers.get('content-type')).toContain('text/html')

      // Resolved the way a browser resolves a document-relative reference.
      const assetPath = new URL('assets/logo.svg', pageUrl).pathname
      expect(assetPath).toBe(`/b/${business}/preview/shared-site/draft/assets/logo.svg`)

      const asset = await ask(assetPath, email)
      expect(asset.status).toBe(200)
      const served = await asset.text()
      expect(served).toBe(bytes)
      expect(served).not.toBe(other)
    }
  })
})

// ── AC-2127 ─────────────────────────────────────────────────────────────────

describe('chat hosts are per business within one isolate', () => {
  it('test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached', async () => {
    // Driven through `route`, the table `fetch` hands off to, because the one
    // seam this criterion needs — a store opener that can be made to fail once —
    // is not something the Worker's own `fetch` exposes.
    const { a, b } = await twoBusinesses()
    const c = (await invite({ email: anEmail(), accountName: 'Flaky', endsAt: null })).businessId

    const opened: string[] = []
    let failNextFor: string | null = null
    const deps: RouterDeps = {
      knowledge: async () => null,
      store: async (e, scope) => {
        opened.push(scope.businessId)
        if (failNextFor === scope.businessId) {
          failNextFor = null
          throw new Error('transient binding failure')
        }
        return storeFor(e, scope)
      },
    }
    const post = (businessId: string, path: string, body: unknown) =>
      route(
        new Request(`https://app.example/b/${businessId}${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
        routerEnv(),
        { businessId },
        deps,
      )
    const seed = async (businessId: string, slug: string) => {
      const s = siteSeed({ slug })
      const res = await post(businessId, '/api/import', {
        slug,
        siteJson: s.siteJson,
        pages: Object.entries(s.pages).map(([name, page]) => ({ name, page })),
        assets: [],
      })
      expect(res.status).toBe(200)
    }
    const open = async (businessId: string, slug: string): Promise<string> => {
      const res = await post(businessId, '/api/ai/session', { slug })
      expect(res.status, await res.clone().text()).toBe(200)
      return ((await res.json()) as { sessionId: string }).sessionId
    }
    const speak = async (businessId: string, sessionId: string, text: string, answer: string) => {
      const client = scriptedClient([says(answer)])
      setModelClient(client)
      const res = await post(businessId, '/api/ai/prompt', { sessionId, text })
      const events = await frames(res)
      expect(events.at(-1)?.kind).toBe('done')
      expect(client.seen.length).toBeGreaterThan(0)
    }

    await seed(a, 'chat-a-site')
    await seed(b, 'chat-b-site')
    await seed(c, 'chat-c-site')

    const SAID_A = 'Business A secret: the spring menu launches on a Tuesday.'
    const ANSWER_A = 'Noted for business A only.'
    const SAID_B = 'Business B secret: we are moving to the harbour.'
    const ANSWER_B = 'Noted for business B only.'

    opened.length = 0
    const sessionA = await open(a, 'chat-a-site')
    await speak(a, sessionA, SAID_A, ANSWER_A)
    const sessionB = await open(b, 'chat-b-site')
    await speak(b, sessionB, SAID_B, ANSWER_B)

    // Two hosts, each built over its own business's store.
    expect(opened).toEqual([a, b])

    // Neither turn is visible in the other business's transcripts or corpus.
    const inA = await everythingIn(a)
    const inB = await everythingIn(b)
    expect(inA).toContain(SAID_A)
    expect(inB).toContain(SAID_B)
    for (const leak of [SAID_A, ANSWER_A]) expect(inB).not.toContain(leak)
    for (const leak of [SAID_B, ANSWER_B]) expect(inA).not.toContain(leak)

    // Repeated turns within one business reuse its conversation state.
    const SAID_A2 = 'And a second thing for business A.'
    await speak(a, sessionA, SAID_A2, 'Still business A.')
    expect(opened).toEqual([a, b])
    const chatsA = await chatTickets(a)
    expect(chatsA).toHaveLength(1)
    expect(chatsA[0].transcript).toContain(SAID_A)
    expect(chatsA[0].transcript).toContain(SAID_A2)
    expect(await everythingIn(b)).not.toContain(SAID_A2)

    // A failed build is not cached: the next request for that business builds
    // afresh and succeeds, and other businesses are unaffected meanwhile.
    failNextFor = c
    const failed = await post(c, '/api/ai/session', { slug: 'chat-c-site' }).catch((e: unknown) => e)
    expect(failed instanceof Response ? failed.status : 'threw').not.toBe(200)
    const stillB = await post(b, '/api/ai/session', { slug: 'chat-b-site' })
    expect(stillB.status).toBe(200)
    const retried = await open(c, 'chat-c-site')
    expect(typeof retried).toBe('string')
    expect(opened.filter((id) => id === c)).toHaveLength(2)
  })
})

// ── AC-2128 ─────────────────────────────────────────────────────────────────

describe('a session resumed after membership expiry', () => {
  it('test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host', async () => {
    const { email, userId, a } = await twoBusinesses()

    const s = siteSeed({ slug: 'resume-site' })
    const imported = await ask(`/b/${a}/api/import`, email, {
      method: 'POST',
      json: {
        slug: 'resume-site',
        siteJson: s.siteJson,
        pages: Object.entries(s.pages).map(([name, page]) => ({ name, page })),
        assets: [],
      },
    })
    expect(imported.status, await imported.clone().text()).toBe(200)

    const opened = await ask(`/b/${a}/api/ai/session`, email, {
      method: 'POST',
      json: { slug: 'resume-site' },
    })
    expect(opened.status, await opened.clone().text()).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    // One completed turn, so A's chat host is warm in this isolate.
    const first = scriptedClient([says('A warm reply.')])
    setModelClient(first)
    const turn = await ask(`/b/${a}/api/ai/prompt`, email, {
      method: 'POST',
      json: { sessionId, text: 'Warm the host up.' },
    })
    expect((await frames(turn)).at(-1)?.kind).toBe('done')
    expect(first.seen.length).toBeGreaterThan(0)

    const before = await chatTickets(a)
    expect(before).toHaveLength(1)
    expect(before[0].transcript).toContain('A warm reply.')

    // The membership on A expires.
    await env.DB.prepare('UPDATE memberships SET expires_at = ? WHERE user_id = ? AND business_id = ?')
      .bind(new Date(Date.now() - 1_000).toISOString(), userId, a)
      .run()

    const second = scriptedClient([says('THIS REPLY MUST NEVER BE PRODUCED')])
    setModelClient(second)
    const resumed = await ask(`/b/${a}/api/ai/prompt`, email, {
      method: 'POST',
      json: { sessionId, text: 'Are you still there?' },
    })
    const body = await resumed.text()

    expect(resumed.status).toBe(403)
    expect(resumed.headers.get('content-type')).toContain('text/plain')
    expect(body).toBe(DENIED_MESSAGE)
    expect(body).not.toContain('data:')
    expect(second.seen).toHaveLength(0)

    const after = await chatTickets(a)
    expect(after).toEqual(before)
    expect(after[0].transcript).not.toContain('Are you still there?')
  })
})

// ── AC-2129 ─────────────────────────────────────────────────────────────────

/** Two businesses, both lapsed — admitted by membership, nothing selectable. */
async function aWhollyLapsedAccount(): Promise<{ email: string; first: string; second: string }> {
  const { email, a, b } = await twoBusinesses()
  await lapse(a)
  await lapse(b)
  return { email, first: a, second: b }
}

describe('an admitted account with nothing selectable keeps its chrome', () => {
  it('test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable', async () => {
    const { email, first, second } = await aWhollyLapsedAccount()

    const chrome = await ask('/', email)
    expect(chrome.status).toBe(200)
    expect(chrome.headers.get('content-type')).toContain('text/html')

    const listing = await ask(BUSINESSES_PATH, email)
    expect(listing.status).toBe(200)
    const payload = (await listing.json()) as {
      businesses: Array<{ id: string; selectable: boolean; lapse: { reason: string } | null }>
    }
    expect(payload.businesses.map((x) => x.id).sort()).toEqual([first, second].sort())
    for (const business of payload.businesses) {
      expect(business.selectable).toBe(false)
      expect(business.lapse?.reason).toBeTruthy()
    }
  })
})

// ── AC-2130 ─────────────────────────────────────────────────────────────────

describe('a business-scoped route with nothing selectable', () => {
  it('test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement', async () => {
    const { email, first } = await aWhollyLapsedAccount()

    const material = new FormData()
    material.append('file', new File(['hello'], 'note.txt', { type: 'text/plain' }))
    const routes: Array<[string, Ask]> = [
      ['/api/sites', {}],
      ['/api/material', {}],
      ['/api/material', { method: 'POST', body: material }],
      ['/api/ai/session', { method: 'POST', json: { slug: first } }],
    ]
    for (const [path, opts] of routes) {
      const response = await ask(path, email, opts)
      const body = await response.text()
      expect(response.status, `${opts.method ?? 'GET'} ${path}`).toBe(403)
      expect(response.headers.get('content-type')).toContain('text/plain')
      expect(response.headers.get('cache-control')).toContain('no-store')
      expect(body).toBe(NO_BUSINESS_BODY)
      expect(body).not.toBe(DENIED_MESSAGE)
    }

    const logged = events().filter((e) => e.event === 'no_business')
    expect(logged).toHaveLength(routes.length)
    for (const e of logged) {
      expect(e.reason).toBe('no_entitlement')
      expect(e.email).toBe(email)
    }

    // One live grant and the same request succeeds against that business.
    await env.DB.prepare('UPDATE entitlements SET ends_at = NULL WHERE business_id = ?').bind(first).run()
    expect(await slugsOf(await ask('/api/sites', email))).toEqual([first])
  })
})

// ── AC-2131 ─────────────────────────────────────────────────────────────────

describe('the operator keeps the existing 1stcontact business', () => {
  it('test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing', async () => {
    const OPERATOR = 'martin-github@westhead.me'
    const opEnv = { TENANT_ID: '1stcontact' }
    await siteIn('1stcontact', 'operator-existing-site')

    const admission = await admit(identityEnv(opEnv), OPERATOR)
    expect(admission.ok, 'the operator was refused at the door').toBe(true)
    if (!admission.ok) return
    await acceptTerms(identityEnv(opEnv), admission.user.id)

    // A membership and an open-ended grant, and no platform_admin.
    expect(admission.user.platform_admin ? 1 : 0).toBe(0)
    const membership = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM memberships WHERE user_id = ? AND business_id = ?',
    )
      .bind(admission.user.id, '1stcontact')
      .first<{ n: number }>()
    expect(Number(membership?.n)).toBe(1)
    const grant = await env.DB.prepare(
      "SELECT ends_at FROM entitlements WHERE business_id = '1stcontact' AND status = 'active'",
    ).all<{ ends_at: string | null }>()
    expect(grant.results).toHaveLength(1)
    expect(grant.results[0].ends_at).toBeNull()

    // No target → 1stcontact, with its existing sites.
    const sites = await slugsOf(await ask('/api/sites', OPERATOR, { env: opEnv }))
    expect(sites).toContain('operator-existing-site')

    // Re-applying changes nothing in the identity tables. Column names are mapped
    // forward exactly as the REQ-184 rename did, because 0005 is history written
    // against the pre-0006 schema; what must hold is its `WHERE NOT EXISTS` guard.
    const snapshot = async () => ({
      users: (await env.DB.prepare('SELECT * FROM users ORDER BY id').all()).results,
      memberships: (await env.DB.prepare('SELECT * FROM memberships ORDER BY id').all()).results,
      entitlements: (await env.DB.prepare('SELECT * FROM entitlements ORDER BY id').all()).results,
    })
    const before = await snapshot()
    await runMigration(operatorMembership.replace(/\baccount_id\b/g, 'business_id'))
    const after = await snapshot()
    expect(after.users.length).toBe(before.users.length)
    expect(after.memberships.length).toBe(before.memberships.length)
    expect(after.entitlements.length).toBe(before.entitlements.length)
    expect(after).toEqual(before)
  })
})
