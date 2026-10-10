import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, type IdentityEnv } from '../apps/control-app/src/identity'
import {
  RESERVED_INFRASTRUCTURE,
  RESERVED_PLATFORM_IDENTITY,
  RESERVED_PROTOCOL,
  businessAddresses,
} from '../apps/control-app/src/hostname'
import {
  BUSINESS_NAME_PATH,
  HOSTNAME_CHECK_PATH,
  HOSTNAME_CLAIM_PATH,
  PEOPLE_PATH,
  PERSON_ADD_PATH,
  PERSON_DELEGATE_PATH,
  PERSON_DELEGATE_REVOKE_PATH,
  PERSON_INBOUND_DISCARD_PATH,
  PERSON_INBOUND_PROMOTE_PATH,
  PERSON_INBOUND_RESTORE_PATH,
  PERSON_INVITE_PATH,
  PERSON_RECORD_PATH,
} from '../apps/control-app/src/router'
import { acceptTerms } from '../apps/control-app/src/terms'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { inviteAccount } from './support/invite-account'
import { personByEmail } from './support/person'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-395 — **the platform operator acts as a delegate in any business it
 * hosts, and the platform business may wear its own name.**
 *
 * WHAT MAKES IT EVIDENCE. Every case drives the WORKER'S OWN `fetch` inside
 * workerd against a real D1 with the deployed schema and a real RS256 Access
 * token, so each request goes through `index.ts`'s admission and `scope.ts`'s
 * hosting bypass exactly as the browser's does. Accounts come from the shipped
 * `inviteAccount` / `ensurePlatformOperator`; what landed is read back from
 * `site_domains` and `log_records` themselves.
 *
 * THE CLAIMS, one per line of the ticket's test plan:
 *
 *   1. The operator, not a member, claims an address for a customer business
 *      and it lands; a signed-in non-member making the same request is refused.
 *   2. Every owner-or-delegate route admits the operator inside an entered
 *      business — one parametrised case over the enumerated list.
 *   3. The owner-only routes (appointing and revoking a delegate) still refuse
 *      the operator.
 *   4. The request record names the operator as actor, never the owner.
 *   5. The operator claims a platform-identity label for the platform business
 *      and it lands; for a customer business it is refused.
 *   6. Infrastructure and protocol labels are refused for everybody.
 */

const PLATFORM = 'req395-platform'
const TEAM = 'https://req395-team.cloudflareaccess.com'
const AUD = 'c'.repeat(64)

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
  const header = { alg: 'RS256', kid: 'req395-key', typ: 'JWT' }
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

const post = (email: string, path: string, body: unknown): Promise<Response> =>
  ask(email, path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const under = (businessId: string, path: string): string =>
  `/b/${encodeURIComponent(businessId)}${path}`

let seq = 0
const anEmail = (): string => `req395-${(seq += 1)}@example.test`
const aLabel = (): string => `req395-${Date.now().toString(36)}-${(seq += 1)}`

/** The platform operator: owns 1st Contact AND holds the hosting capability. */
async function operator(): Promise<{ email: string; userId: string }> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const person = await personByEmail(identityEnv(), PLATFORM, email)
  if (!person) throw new Error('operator was not created')
  await acceptTerms(identityEnv(), person.id)
  return { email, userId: person.id }
}

async function customer(
  name: string,
): Promise<{ email: string; businessId: string; userId: string }> {
  const email = anEmail()
  const made = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), made.user.id)
  return { email, businessId: made.businessId, userId: made.user.id }
}

/**
 * The platform business's site — which production's has and this suite's
 * `ensurePlatformOperator` does not mint. Written through the same store calls
 * provisioning makes, so the claim lands on a site the product could serve.
 */
async function platformSite(): Promise<void> {
  const store = await d1r2SiteStore(identityEnv()).forTenant(PLATFORM)
  if ((await store.siteKeys('site')).length > 0) return
  const siteKey = await store.createDraft('site')
  await store.write(siteKey, {
    siteJson: starterSiteJson(siteKey, '1st Contact'),
    pages: [{ name: 'home.json', page: starterHomePage('1st Contact', 'Welcome') }],
  })
}

const OWNER_OR_DELEGATE = 'Only an owner or delegate of this business'

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
  jwks = { keys: [{ ...jwk, kid: 'req395-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-395 — the operator acts as a delegate inside a business it hosts', () => {
  it('test_UAT_FC_REQ-395_the_operator_chooses_a_customer_business_address_and_it_lands', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Faelan')
    const label = aLabel()

    const claimed = await post(op.email, under(salon.businessId, HOSTNAME_CLAIM_PATH), { label })
    expect(claimed.status).toBe(200)
    const addresses = await businessAddresses(identityEnv(), salon.businessId)
    expect(addresses.map((a) => a.host)).toContain(`${label}.1stc.site`)
  })

  it('test_UAT_FC_REQ-395_a_signed_in_non_member_is_still_refused', async () => {
    stubJwks()
    const salon = await customer('Salon Refused')
    const stranger = await customer('Stranger Co')

    const claimed = await post(stranger.email, under(salon.businessId, HOSTNAME_CLAIM_PATH), {
      label: aLabel(),
    })
    expect(claimed.status).toBe(403)
    expect(await businessAddresses(identityEnv(), salon.businessId)).toEqual([])
  })

  // EVERY ROUTE GATED ON `operatesBusiness`, enumerated from `router.ts`. The
  // body is deliberately minimal: what is asserted is that the GATE admitted the
  // operator — whatever the route then says about the body is its own business,
  // and is not the owner-or-delegate refusal.
  const ROUTES: Array<{ name: string; method: 'GET' | 'POST'; path: string }> = [
    { name: 'add a contact', method: 'POST', path: PERSON_ADD_PATH },
    { name: 'promote an inbound sender', method: 'POST', path: PERSON_INBOUND_PROMOTE_PATH },
    { name: 'discard inbound mail', method: 'POST', path: PERSON_INBOUND_DISCARD_PATH },
    { name: 'restore inbound mail', method: 'POST', path: PERSON_INBOUND_RESTORE_PATH },
    { name: 'edit a person', method: 'POST', path: PERSON_RECORD_PATH },
    { name: 'read an invite', method: 'GET', path: PERSON_INVITE_PATH },
    { name: 'send an invite', method: 'POST', path: PERSON_INVITE_PATH },
    { name: 'change the name', method: 'POST', path: BUSINESS_NAME_PATH },
    { name: 'choose the address', method: 'POST', path: HOSTNAME_CLAIM_PATH },
  ]

  it.each(ROUTES)(
    'test_UAT_FC_REQ-395_every_owner_or_delegate_route_admits_the_operator ($name)',
    async ({ method, path }) => {
      stubJwks()
      const op = await operator()
      const salon = await customer('Salon Routes')

      const response =
        method === 'GET'
          ? await ask(op.email, under(salon.businessId, path))
          : await post(op.email, under(salon.businessId, path), {})
      const text = await response.text()
      expect(response.status, text).not.toBe(403)
      expect(text).not.toContain(OWNER_OR_DELEGATE)
    },
  )

  it('test_UAT_FC_REQ-395_the_people_tab_offers_invite_but_not_delegation', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Tab')

    const people = (await (await ask(op.email, under(salon.businessId, PEOPLE_PATH))).json()) as {
      canInvite: boolean
      canDelegate: boolean
    }
    expect(people.canInvite).toBe(true)
    expect(people.canDelegate).toBe(false)
  })

  it('test_UAT_FC_REQ-395_owner_only_routes_still_refuse_the_operator', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Owner Only')

    const appoint = await post(op.email, under(salon.businessId, PERSON_DELEGATE_PATH), { id: 'x' })
    expect(appoint.status).toBe(403)
    const revoke = await post(op.email, under(salon.businessId, PERSON_DELEGATE_REVOKE_PATH), {
      id: 'x',
    })
    expect(revoke.status).toBe(403)
  })

  it('test_UAT_FC_REQ-395_the_record_names_the_operator_as_actor', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Record')

    const claimed = await post(op.email, under(salon.businessId, HOSTNAME_CLAIM_PATH), {
      label: aLabel(),
    })
    expect(claimed.status).toBe(200)

    const rows = (
      await env.DB.prepare(
        "SELECT actor FROM log_records WHERE business = ? AND event = 'request' AND status = 200",
      )
        .bind(salon.businessId)
        .all<{ actor: string | null }>()
    ).results
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.actor === op.userId)).toBe(true)
    expect(rows.some((r) => r.actor === salon.userId)).toBe(false)
  })
})

describe('REQ-395 — reserved names and the platform business', () => {
  it('test_UAT_FC_REQ-395_the_operator_claims_a_platform_identity_label_for_the_platform', async () => {
    stubJwks()
    const op = await operator()
    await platformSite()
    // ONE LABEL PER PLATFORM BUSINESS, which is what makes this case
    // single-shot: the platform business holds exactly one address.
    const label = RESERVED_PLATFORM_IDENTITY[0]

    const checked = (await (
      await ask(op.email, under(PLATFORM, `${HOSTNAME_CHECK_PATH}?label=${label}`))
    ).json()) as { available: boolean; reason: string | null }
    expect(checked.reason).not.toBe('reserved')

    const claimed = await post(op.email, under(PLATFORM, HOSTNAME_CLAIM_PATH), { label })
    expect(claimed.status, await claimed.clone().text()).toBe(200)
    const addresses = await businessAddresses(identityEnv(), PLATFORM)
    expect(addresses.map((a) => a.host)).toContain(`${label}.1stc.site`)
  })

  it('test_UAT_FC_REQ-395_a_platform_identity_label_is_refused_for_a_customer_business', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Reserved')

    for (const label of RESERVED_PLATFORM_IDENTITY) {
      const checked = (await (
        await ask(op.email, under(salon.businessId, `${HOSTNAME_CHECK_PATH}?label=${label}`))
      ).json()) as { reason: string | null }
      expect(checked.reason, label).toBe('reserved')
      const claimed = await post(op.email, under(salon.businessId, HOSTNAME_CLAIM_PATH), { label })
      expect(claimed.status, label).toBe(400)
    }
    expect(await businessAddresses(identityEnv(), salon.businessId)).toEqual([])
  })

  it('test_UAT_FC_REQ-395_infrastructure_and_protocol_labels_are_refused_for_everybody', async () => {
    stubJwks()
    const op = await operator()
    const salon = await customer('Salon Infra')

    for (const businessId of [PLATFORM, salon.businessId]) {
      for (const label of [...RESERVED_INFRASTRUCTURE, ...RESERVED_PROTOCOL]) {
        const checked = (await (
          await ask(op.email, under(businessId, `${HOSTNAME_CHECK_PATH}?label=${encodeURIComponent(label)}`))
        ).json()) as { available: boolean }
        expect(checked.available, `${businessId} ${label}`).toBe(false)
        const claimed = await post(op.email, under(businessId, HOSTNAME_CLAIM_PATH), { label })
        expect(claimed.status, `${businessId} ${label}`).toBe(400)
      }
    }
  })
})
