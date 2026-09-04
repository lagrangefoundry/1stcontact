import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { admit, provisionInvite, type IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { ADMIN_BUSINESSES_PATH, BUSINESSES_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-180 D2/D3 — **the operator adds a business, and nobody else can**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the WORKER'S OWN `fetch` — the
 * deployed entry point — inside workerd, against a real D1 database with the
 * deployed schema, with a real RS256 Access token verified against a real JWKS.
 * What it proves is therefore the wiring as well as the handler: the
 * authorisation happens in `index.ts` ahead of routing, and a suite calling
 * `route()` with an admission it built itself would prove the `if` and say
 * nothing about the half that can silently not exist.
 *
 * THE DECISION THIS FILE ENFORCES IS AN ABSENCE. [[REQ-180]] §2 proposed a
 * self-serve "add a business"; D2 reverses it. We are pre-billing, and
 * `provisionBusiness` writes a live `pro` grant, so any customer-reachable route
 * onto it is an unbounded free-plan mint. The operator's path exists because
 * adding a business has to be possible; it is behind `platform_admin`, and the
 * cases below are as much about who is refused as about what succeeds.
 *
 * AND IT ENFORCES THAT A BUSINESS AND ITS TENANT ARE ONE OPERATION (D3). The
 * model's load-bearing identity is *business == tenant*, so the failure worth
 * catching is a partial write: a `tenants` row with no membership is a business
 * nobody may operate, and `businessesFor`'s inner join drops it — so the
 * operator would read a 200 and see an unchanged switcher, with nothing anywhere
 * saying what went wrong. Every row is therefore asserted, and asserted through
 * `admit` rather than by reading the tables back, because `admit` is what the
 * product uses.
 */

const PLATFORM = 'req180-admin-platform'
const TEAM = 'https://req180-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A REAL Access token, minted against the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req180-key', typ: 'JWT' }
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
        return new Response(JSON.stringify(jwks), {
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

let seq = 0
const anEmail = (): string => `req180-admin-${(seq += 1)}@example.test`

/** An invitee who has also accepted the terms ([[REQ-169]]) — setup, not a claim. */
async function invite(spec: Parameters<typeof provisionInvite>[1]) {
  const result = await provisionInvite(identityEnv(), spec)
  await acceptTerms(identityEnv(), result.user.id)
  return result
}

/** The same, plus [[DOC-40]] §6's ambient flag. */
async function admin(spec: Parameters<typeof provisionInvite>[1]) {
  const result = await invite(spec)
  await env.DB.prepare('UPDATE users SET platform_admin = 1 WHERE id = ?').bind(result.user.id).run()
  return result
}

const addBusiness = async (
  token: string | null,
  body: unknown,
  over: Partial<Env> = {},
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${ADMIN_BUSINESSES_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      },
      body: JSON.stringify(body),
    }),
    workerEnv(over),
  )

const countBusinesses = async (email: string): Promise<number> => {
  const result = await admit(identityEnv(), email)
  return result.ok ? result.businesses.length : 0
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
  jwks = { keys: [{ ...jwk, kid: 'req180-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-180 — adding a business is the operator’s action', () => {
  it('test_UAT_FC_REQ-180_an_ordinary_customer_cannot_add_a_business', async () => {
    // The decision, as a test. This caller is fully admitted — verified by
    // Access, holding a live grant, terms accepted — and every ordinary route
    // answers them. They are still refused here, because the only thing standing
    // between a customer and an unlimited supply of free `pro` grants is this
    // check.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Salon', endsAt: null })

    const response = await addBusiness(await mint(email), { accountEmail: email, name: 'Studio' })

    expect(response.status).toBe(404)
    // Nothing was written. A refusal that provisioned first and reported second
    // would leave the mint open and the log clean.
    expect(await countBusinesses(email)).toBe(1)
  })

  it('test_UAT_FC_REQ-180_the_refusal_says_the_surface_is_not_there', async () => {
    // 404 rather than the 403 every other refusal uses. A 403 answers "does an
    // administrative surface exist" with *yes* — a fact about the system rather
    // than about the caller, and one they have no use for except to come back at
    // it. So the answer discloses what an unprivileged caller should be able to
    // observe, which is nothing.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Salon', endsAt: null })

    const response = await addBusiness(await mint(email), { accountEmail: email, name: 'Studio' })
    const body = await response.text()

    expect(response.status).toBe(404)
    // It names neither the route nor the privilege it wanted — either would be
    // the disclosure the status code just declined to make.
    expect(body.toLowerCase()).not.toContain('admin')
    expect(body.toLowerCase()).not.toContain('business')
  })

  it('test_UAT_FC_REQ-180_the_loopback_dev_door_is_not_an_administrator', async () => {
    // `isUnconfiguredLocalDev` skips Access AND `admit`, so on that path there is
    // no identity at all — and therefore nobody holding the flag. Provisioning
    // through the one door that authorises nothing is a shape that reads as a
    // convenience and would eventually be relied on; it is refused instead.
    const response = await addBusiness(
      null,
      { accountEmail: anEmail(), name: 'Studio' },
      { ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '', ACCESS_DEV_OPEN: '1' },
    )

    expect(response.status).toBe(404)
  })

  it('test_UAT_FC_REQ-180_an_operator_adds_a_business_to_an_existing_account', async () => {
    // The path that has to exist, because adding a business has to be possible.
    // It is asserted through `admit` — what the product actually reads — rather
    // than by querying the tables, so a business that was written but is not
    // reachable would fail here rather than pass.
    stubJwks()
    const owner = anEmail()
    const operator = anEmail()
    await invite({ email: owner, accountName: 'Salon', endsAt: null })
    await admin({ email: operator, accountName: 'Platform', endsAt: null })

    const response = await addBusiness(await mint(operator), {
      accountEmail: owner,
      name: 'Studio',
      endsAt: null,
    })
    expect(response.status).toBe(200)
    const created = (await response.json()) as { businessId: string; name: string; siteSlug: string }
    expect(created.name).toBe('Studio')

    const result = await admit(identityEnv(), owner)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.businesses.map((b) => b.name).sort()).toEqual(['Salon', 'Studio'])

    const added = result.businesses.find((b) => b.businessId === created.businessId)
    // Immediately operable, which is the only definition of "added" worth
    // reporting: the grant is live, so the switcher offers it rather than
    // listing it as something to ask us about.
    expect(added?.selectable).toBe(true)
    expect(added?.lapse).toBeNull()
  })

  it('test_UAT_FC_REQ-180_a_business_and_its_tenant_are_one_operation', async () => {
    // *business == tenant* is the model's load-bearing identity, so the four rows
    // a business consists of must be incapable of arriving apart. The one that
    // fails silently is the `tenants` row: without it `businessesFor`'s inner
    // join drops the membership and the operator sees a 200 and an unchanged
    // switcher. All four are asserted from the one call.
    stubJwks()
    const owner = anEmail()
    const operator = anEmail()
    const invited = await invite({ email: owner, accountName: 'Salon', endsAt: null })
    await admin({ email: operator, accountName: 'Platform', endsAt: null })

    const response = await addBusiness(await mint(operator), {
      accountEmail: owner,
      name: 'Studio',
      endsAt: null,
    })
    const created = (await response.json()) as { businessId: string; siteSlug: string }

    const tenant = await env.DB.prepare('SELECT id, name, status FROM tenants WHERE id = ?')
      .bind(created.businessId)
      .first<{ id: string; name: string; status: string }>()
    expect(tenant?.name).toBe('Studio')
    expect(tenant?.status).toBe('active')

    const membership = await env.DB.prepare(
      'SELECT role, status FROM memberships WHERE user_id = ? AND account_id = ?',
    )
      .bind(invited.user.id, created.businessId)
      .first<{ role: string; status: string }>()
    expect(membership).toEqual({ role: 'owner', status: 'active' })

    const grant = await env.DB.prepare(
      'SELECT plan, status, granted_by FROM entitlements WHERE account_id = ?',
    )
      .bind(created.businessId)
      .first<{ plan: string; status: string; granted_by: string | null }>()
    expect(grant?.status).toBe('active')
    // The audit record: who added it. An operator action with no operator on it
    // is the one a later question cannot be answered about.
    expect(grant?.granted_by).toBe(operator)

    // And something to edit, which is what makes the business usable rather than
    // merely present.
    expect(created.siteSlug).toBe(created.businessId)
  })

  it('test_UAT_FC_REQ-180_creating_an_account_provisions_its_first_business', async () => {
    // The other half of D2's answer: the operator does not have to do this twice.
    // Account creation and adding a business are one function's job
    // ([[REQ-178]]'s `provisionBusiness`), so an account never exists in the
    // no-business state that `admit` refuses with `no_membership`.
    const email = anEmail()
    const result = await provisionInvite(identityEnv(), {
      email,
      accountName: 'Salon',
      endsAt: null,
    })

    expect(result.businessId).toBeTruthy()
    const tenant = await env.DB.prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(result.businessId)
      .first<{ name: string }>()
    expect(tenant?.name).toBe('Salon')
    expect(await countBusinesses(email)).toBe(1)
  })

  it('test_UAT_FC_REQ-180_an_unknown_account_is_reported_plainly_to_the_operator', async () => {
    // The oracle argument that silences every other refusal does not apply to
    // someone already holding the flag that would answer the question anyway —
    // and an operator who mistyped an address is owed the difference between
    // "no such account" and "done".
    stubJwks()
    const operator = anEmail()
    await admin({ email: operator, accountName: 'Platform', endsAt: null })

    const response = await addBusiness(await mint(operator), {
      accountEmail: 'nobody@example.test',
      name: 'Studio',
    })
    expect(response.status).toBe(404)
    expect((await response.json()) as { error: string }).toEqual({
      error: 'No account with that email address.',
    })
  })

  it('test_UAT_FC_REQ-180_a_business_needs_an_account_and_a_name', async () => {
    // A missing name would otherwise reach `provisionBusiness` and throw, which
    // an operator reads as "the builder broke" rather than as "you left a field
    // out". 400 and the field names is the answer they can act on.
    stubJwks()
    const operator = anEmail()
    await admin({ email: operator, accountName: 'Platform', endsAt: null })
    const token = await mint(operator)

    expect((await addBusiness(token, { accountEmail: operator })).status).toBe(400)
    expect((await addBusiness(token, { name: 'Studio' })).status).toBe(400)
    expect((await addBusiness(token, { accountEmail: operator, name: '  ' })).status).toBe(400)
  })

  it('test_UAT_FC_REQ-180_the_chrome_offers_no_way_to_add_one', async () => {
    // The endpoint the browser actually reads reports businesses and the account
    // and nothing that could be posted back. If a self-serve creation contract
    // ever appears, it appears here first — so this is where its absence is
    // asserted, rather than in the client that would consume it.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Salon', endsAt: null })

    const response = await worker.fetch(
      new Request(`https://app.example${BUSINESSES_PATH}`, {
        headers: { 'cf-access-jwt-assertion': await mint(email) },
      }),
      workerEnv(),
    )
    const body = (await response.json()) as Record<string, unknown>

    expect(Object.keys(body).sort()).toEqual(['account', 'businesses'])
  })
})
