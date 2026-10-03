import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, type IdentityEnv } from '../apps/control-app/src/identity'
import {
  ADMIN_SITES_PATH,
  BUSINESSES_PATH,
  PEOPLE_PATH,
  PERSON_ADD_PATH,
} from '../apps/control-app/src/router'
import { OPERATOR_ENTERED } from '../apps/control-app/src/builder/contact-events.js'
import { acceptTerms } from '../apps/control-app/src/terms'
import { inviteAccount } from './support/invite-account'
import { personByEmail } from './support/person'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-367 — **the platform operator opens any business** — the server half.
 *
 * WHAT MAKES IT EVIDENCE. Every case drives the WORKER'S OWN `fetch` inside
 * workerd, against a real D1 with the deployed schema and a real RS256 Access
 * token, so the request goes through `index.ts`'s admission and scope
 * resolution exactly as the browser's does. Accounts are made by the shipped
 * `inviteAccount` / `ensurePlatformOperator`. The audit is read back from
 * `contact_events` itself.
 *
 * THE CLAIMS, one per rule in the ticket:
 *
 *   1. THE CONSOLE'S LINK LANDS. `/b/<customer>/` serves the builder to the
 *      platform operator, and `/api/businesses` under that prefix names the
 *      business as ENTERED — beside the memberships, never among them.
 *   2. EACH ENTRY IS AUDITED: one `operator.entered` row on the operator's own
 *      contact, naming the business. Opening a business they hold records none.
 *   3. A CUSTOMER CANNOT DO IT. The same link refuses anyone without the
 *      hosting capability, and records nothing.
 *   4. OWNER CONTROLS STAY SHUT in v1: inside, the operator is told they cannot
 *      invite, and adding a contact is refused.
 *   5. THE CONSOLE STAYS REACHABLE from inside, because its gate reads the
 *      operator's own admission and not the business in scope.
 */

const PLATFORM = 'req367-platform'
const TEAM = 'https://req367-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req367-key', typ: 'JWT' }
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

const ask = async (email: string, path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers)
  headers.set('cf-access-jwt-assertion', await mint(email))
  return worker.fetch(new Request(`https://app.example${path}`, { ...init, headers }), workerEnv())
}

const under = (businessId: string, path: string): string =>
  `/b/${encodeURIComponent(businessId)}${path}`

let seq = 0
const anEmail = (): string => `req367-${(seq += 1)}@example.test`

/** The platform operator: owns 1st Contact AND holds the hosting capability. */
async function operator(): Promise<{ email: string; userId: string }> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const person = await personByEmail(identityEnv(), PLATFORM, email)
  if (!person) throw new Error('operator was not created')
  await acceptTerms(identityEnv(), person.id)
  return { email, userId: person.id }
}

async function customer(name: string): Promise<{ email: string; businessId: string }> {
  const email = anEmail()
  const made = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), made.user.id)
  return { email, businessId: made.businessId }
}

const entries = async (contactId: string) =>
  (
    await env.DB.prepare(
      'SELECT business_id, ref, detail FROM contact_events WHERE contact_id = ? AND kind = ?',
    )
      .bind(contactId, OPERATOR_ENTERED)
      .all<{ business_id: string; ref: string; detail: string }>()
  ).results

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
  jwks = { keys: [{ ...jwk, kid: 'req367-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-367 — the platform operator opens any business', () => {
  it('test_UAT_FC_REQ-367_the_open_link_lands_the_operator_in_the_business_as_entered', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon')

    const page = await ask(op.email, under(salon.businessId, '/'))
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toContain('text/html')

    const body = (await (await ask(op.email, under(salon.businessId, BUSINESSES_PATH))).json()) as {
      businesses: Array<{ id: string }>
      entered: { id: string; name: string } | null
      ownsPlatformBusiness: boolean
    }
    expect(body.entered).toEqual({ id: salon.businessId, name: 'Salon' })
    // BESIDE the memberships and never among them: the switcher's own list is
    // still the operator's, which is what makes getting back one choice.
    expect(body.businesses.map((b) => b.id)).toEqual([PLATFORM])
    expect(body.ownsPlatformBusiness).toBe(true)
  })

  it('test_UAT_FC_REQ-367_each_entry_is_audited_on_the_operators_own_contact', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Two')

    expect(await entries(op.userId)).toHaveLength(0)
    await ask(op.email, under(salon.businessId, '/'))
    await ask(op.email, under(salon.businessId, '/'))
    // API calls made from inside are not entries — the page load is.
    await ask(op.email, under(salon.businessId, BUSINESSES_PATH))

    const rows = await entries(op.userId)
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      // Filed in the OPERATOR's business, naming the business entered.
      expect(row.business_id).toBe(PLATFORM)
      expect(row.ref).toBe(salon.businessId)
      expect(JSON.parse(row.detail)).toMatchObject({ business: salon.businessId, name: 'Salon Two' })
    }
  })

  it('test_UAT_FC_REQ-367_opening_a_held_business_is_neither_entered_nor_audited', async () => {
    stubJwks()
    const op = await operator()

    expect((await ask(op.email, under(PLATFORM, '/'))).status).toBe(200)
    const body = (await (await ask(op.email, under(PLATFORM, BUSINESSES_PATH))).json()) as {
      entered: unknown
    }
    expect(body.entered).toBeNull()
    expect(await entries(op.userId)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-367_a_customer_cannot_open_another_business', async () => {
    stubJwks()
    const salon = await customer('Salon Three')
    const other = await customer('Studio')
    const person = await personByEmail(identityEnv(), PLATFORM, other.email)

    const page = await ask(other.email, under(salon.businessId, '/'))
    expect(page.status).toBe(403)
    const list = await ask(other.email, under(salon.businessId, BUSINESSES_PATH))
    expect(list.status).toBe(403)
    expect(await entries(person?.id ?? '')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-367_owner_controls_stay_shut_inside_an_entered_business', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Four')

    const people = (await (await ask(op.email, under(salon.businessId, PEOPLE_PATH))).json()) as {
      canInvite: boolean
    }
    expect(people.canInvite).toBe(false)

    const add = await ask(op.email, under(salon.businessId, PERSON_ADD_PATH), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.test', name: 'New Person' }),
    })
    expect(add.status).toBe(403)
  })

  it('test_UAT_FC_REQ-367_the_console_stays_reachable_from_inside', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Five')

    const sites = await ask(op.email, under(salon.businessId, ADMIN_SITES_PATH))
    expect(sites.status).toBe(200)
  })
})
