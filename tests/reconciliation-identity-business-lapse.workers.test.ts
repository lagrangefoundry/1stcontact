import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  DENIED_MESSAGE,
  newId,
  provisionBusiness,
  provisionInvite,
  type Admission,
  type AdmittedBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'

/**
 * STORY-7b1025b8 (STORY-146), as reshaped by BUNDLE-35 — *membership admits;
 * entitlement does not*, and *a lapse explains itself*.
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * database with the deployed migration sequence applied in order (`0004` →
 * `0005` → `0006`), so the grant's subject/object columns are proved against a
 * database that already held `0005`'s rows. Businesses are provisioned through
 * the shipped entry points (`provisionInvite`, `provisionBusiness`) and admitted
 * through `admit`, the function the Worker's request path calls; grant state is
 * moved by the dates and statuses a test writes, never by the clock. The
 * end-to-end criterion drives the Worker's own `fetch` with a real RS256 Access
 * token verified against a real JWKS.
 *
 * THE SPLIT THESE CRITERIA PROVE. Being admitted is a property of the PERSON's
 * memberships; being selectable — and the lapse reason that explains it when it
 * is not — is a property of each BUSINESS's capacity grants. Only grants naming
 * no account answer the capacity question.
 */

const PLATFORM = 'story146-lapse-platform'
const TEAM = 'https://story146-lapse-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset-bytes', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A real Access token, signed by the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'story146-lapse-key', typ: 'JWT' }
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
const anEmail = (): string => `story146-lapse-${(seq += 1)}@example.test`

const ISO = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString()
const DAY = 86_400_000

/** The admitted businesses keyed by id, or a failed expectation when refused. */
function byId(result: Admission): Map<string, AdmittedBusiness> {
  expect(result.ok, `admission was refused: ${!result.ok ? result.reason : ''}`).toBe(true)
  return new Map((result.ok ? result.businesses : []).map((b) => [b.businessId, b]))
}

/** Move every grant against one business — the capacity grant provisioning wrote. */
async function setGrant(businessId: string, column: 'ends_at' | 'starts_at' | 'status', value: string) {
  await env.DB.prepare(`UPDATE entitlements SET ${column} = ? WHERE business_id = ?`)
    .bind(value, businessId)
    .run()
}

/** Write one grant directly, so states provisioning never writes can be built. */
async function grant(spec: {
  businessId: string
  accountId?: string | null
  status?: string
  startsAt?: string
  endsAt?: string | null
}): Promise<string> {
  const id = newId('ent')
  const now = ISO(0)
  await env.DB.prepare(
    'INSERT INTO entitlements (id, business_id, account_id, plan, source, status, starts_at, ' +
      'ends_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      spec.businessId,
      spec.accountId ?? null,
      'pro',
      'admin_grant',
      spec.status ?? 'active',
      spec.startsAt ?? ISO(-2 * DAY),
      spec.endsAt ?? null,
      now,
      now,
    )
    .run()
  return id
}

async function dropGrants(businessId: string): Promise<void> {
  await env.DB.prepare('DELETE FROM entitlements WHERE business_id = ?').bind(businessId).run()
}

async function columnsOf(table: string): Promise<string[]> {
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>()
  return (results ?? []).map((r) => r.name)
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'story146-lapse-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('membership admits; entitlement does not', () => {
  it('test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides', async () => {
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, accountName: 'First', endsAt: ISO(DAY) })

    // Not yet ended: admitted, selectable, reporting that grant.
    const live = byId(await admit(identityEnv(), email))
    expect(live.get(first.businessId)?.selectable).toBe(true)
    expect(live.get(first.businessId)?.entitlement?.business_id).toBe(first.businessId)

    // Ended, nothing else changed: STILL admitted — listed, unselectable, no grant.
    await setGrant(first.businessId, 'ends_at', ISO(-1_000))
    const lapsed = await admit(identityEnv(), email)
    expect(lapsed.ok, 'a person with a live membership was refused on the entitlement').toBe(true)
    const lapsedSet = byId(lapsed)
    expect([...lapsedSet.keys()]).toEqual([first.businessId])
    expect(lapsedSet.get(first.businessId)?.selectable).toBe(false)
    expect(lapsedSet.get(first.businessId)?.entitlement).toBeNull()

    // An open-ended grant does not expire.
    const second = await provisionBusiness(identityEnv(), {
      accountUserId: first.user.id,
      name: 'Second',
      email,
      endsAt: null,
    })
    const mixed = byId(await admit(identityEnv(), email))
    expect(mixed.get(second.businessId)?.selectable).toBe(true)
    expect(mixed.get(second.businessId)?.entitlement?.ends_at).toBeNull()

    // Both lapsed — so code that stops at the first cannot pass: admitted, both
    // listed, neither selectable.
    await setGrant(second.businessId, 'ends_at', ISO(-1_000))
    const allLapsed = await admit(identityEnv(), email)
    expect(allLapsed.ok).toBe(true)
    if (!allLapsed.ok) return
    expect(allLapsed.businesses.map((b) => b.businessId).sort()).toEqual(
      [first.businessId, second.businessId].sort(),
    )
    expect(allLapsed.businesses.some((b) => b.selectable)).toBe(false)
    expect(allLapsed.businesses.every((b) => b.entitlement === null)).toBe(true)

    // And the person is refused only when no live membership remains.
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?')
      .bind(ISO(0), first.user.id)
      .run()
    const none = await admit(identityEnv(), email)
    expect(none.ok).toBe(false)
    expect(!none.ok && none.reason).toBe('no_membership')
  })

  it('test_UAT_AC2076_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason', async () => {
    const variants: Array<[string, 'ends_at' | 'starts_at' | 'status', () => string, string]> = [
      ['lapsed', 'ends_at', () => ISO(-1_000), 'expired'],
      ['not started', 'starts_at', () => ISO(DAY), 'not_yet'],
      ['revoked', 'status', () => 'revoked', 'revoked'],
    ]
    for (const [label, column, value, reason] of variants) {
      const email = anEmail()
      const live = await provisionInvite(identityEnv(), { email, accountName: 'Live', endsAt: null })
      const dead = await provisionBusiness(identityEnv(), { accountUserId: live.user.id, name: 'Dead', email })
      await setGrant(dead.businessId, column, value())

      const businesses = byId(await admit(identityEnv(), email))
      expect(businesses.size, `${label}: both businesses should be listed`).toBe(2)
      const d = businesses.get(dead.businessId)
      expect(d?.name, label).toBe('Dead')
      expect(d?.selectable, label).toBe(false)
      expect(d?.entitlement, label).toBeNull()
      expect(d?.lapse?.reason, label).toBe(reason)
      const l = businesses.get(live.businessId)
      expect(l?.selectable, label).toBe(true)
      expect(l?.entitlement?.business_id, label).toBe(live.businessId)
      expect(l?.lapse, label).toBeNull()

      // The other business lapsed too: still admitted, both listed, none selectable.
      await setGrant(live.businessId, column, value())
      const both = byId(await admit(identityEnv(), email))
      expect(both.size, `${label}: all-lapsed lost a business`).toBe(2)
      expect([...both.values()].some((b) => b.selectable), label).toBe(false)
      expect([...both.values()].every((b) => b.lapse?.reason === reason), label).toBe(true)
    }
  })
})

describe('a lapse explains itself', () => {
  it('test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing', async () => {
    const email = anEmail()
    const selectable = await provisionInvite(identityEnv(), { email, accountName: 'Open', endsAt: null })
    const add = (name: string) =>
      provisionBusiness(identityEnv(), { accountUserId: selectable.user.id, name, email })

    // expired — renewed once, so two ended grants; the LATER end is the answer.
    const expired = await add('Expired')
    await dropGrants(expired.businessId)
    const earlierEnd = ISO(-5 * DAY)
    const laterEnd = ISO(-1 * DAY)
    await grant({ businessId: expired.businessId, startsAt: ISO(-30 * DAY), endsAt: earlierEnd })
    await grant({ businessId: expired.businessId, startsAt: ISO(-5 * DAY), endsAt: laterEnd })

    // revoked — open-ended, withdrawn.
    const revoked = await add('Revoked')
    await setGrant(revoked.businessId, 'status', 'revoked')

    // not_yet — written, not started.
    const notYet = await add('NotYet')
    await setGrant(notYet.businessId, 'starts_at', ISO(DAY))

    // never_granted — no grant at all.
    const never = await add('Never')
    await dropGrants(never.businessId)

    // not_yet outranks expired: an ended grant beside a future one.
    const comingBack = await add('ComingBack')
    await dropGrants(comingBack.businessId)
    await grant({ businessId: comingBack.businessId, startsAt: ISO(-30 * DAY), endsAt: ISO(-1 * DAY) })
    await grant({ businessId: comingBack.businessId, startsAt: ISO(2 * DAY), endsAt: null })

    const businesses = byId(await admit(identityEnv(), email))
    expect(businesses.size).toBe(6)

    expect(businesses.get(expired.businessId)?.lapse).toEqual({ reason: 'expired', endedAt: laterEnd })
    expect(businesses.get(revoked.businessId)?.lapse).toEqual({ reason: 'revoked', endedAt: null })
    expect(businesses.get(notYet.businessId)?.lapse).toEqual({ reason: 'not_yet', endedAt: null })
    expect(businesses.get(never.businessId)?.lapse).toEqual({ reason: 'never_granted', endedAt: null })
    expect(businesses.get(comingBack.businessId)?.lapse).toEqual({ reason: 'not_yet', endedAt: null })
    expect(businesses.get(selectable.businessId)?.selectable).toBe(true)
    expect(businesses.get(selectable.businessId)?.lapse).toBeNull()

    // Selectability and the lapse never disagree, for any business listed.
    for (const b of businesses.values()) {
      expect(b.lapse === null, b.name).toBe(b.selectable)
    }
  })

  it('test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on', async () => {
    const aliceEmail = anEmail()
    const alice = await provisionInvite(identityEnv(), { email: aliceEmail, accountName: 'Alice Live', endsAt: null })
    const aliceLapsed = await provisionBusiness(identityEnv(), {
      accountUserId: alice.user.id,
      name: 'Alice Lapsed',
      email: aliceEmail,
    })
    await setGrant(aliceLapsed.businessId, 'ends_at', ISO(-1_000))

    const bobEmail = anEmail()
    const bob = await provisionInvite(identityEnv(), { email: bobEmail, accountName: 'Bob Lapsed', endsAt: null })
    await setGrant(bob.businessId, 'ends_at', ISO(-1_000))

    const admitted = await admit(identityEnv(), aliceEmail)
    const listed = byId(admitted)
    expect([...listed.keys()].sort()).toEqual([alice.businessId, aliceLapsed.businessId].sort())
    expect(listed.get(aliceLapsed.businessId)?.lapse?.reason).toBe('expired')
    expect(listed.has(bob.businessId)).toBe(false)
    expect(JSON.stringify(admitted)).not.toContain(bob.businessId)
    expect(JSON.stringify(admitted)).not.toContain('Bob Lapsed')

    // Withdraw Alice's membership on her lapsed business: gone, reason and all.
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE business_id = ?')
      .bind(ISO(0), aliceLapsed.businessId)
      .run()
    const after = await admit(identityEnv(), aliceEmail)
    expect([...byId(after).keys()]).toEqual([alice.businessId])
    expect(JSON.stringify(after)).not.toContain(aliceLapsed.businessId)
    expect(JSON.stringify(after)).not.toContain('expired')
  })
})

describe('an entitlement has a subject and an object', () => {
  it('test_UAT_AC2115_grant_names_its_business_as_object_and_optionally_an_account_as_subject', async () => {
    // The columns as the database reports them, after 0004 → 0005 → 0006.
    const entitlementCols = await columnsOf('entitlements')
    expect(entitlementCols).toContain('business_id')
    expect(entitlementCols).toContain('account_id')
    const subject = await env.DB.prepare('PRAGMA table_info(entitlements)').all<{ name: string; notnull: number }>()
    expect(subject.results?.find((c) => c.name === 'account_id')?.notnull).toBe(0)
    const membershipCols = await columnsOf('memberships')
    expect(membershipCols).toContain('business_id')
    expect(membershipCols).not.toContain('account_id')

    // The rows 0005 wrote before the rename are still readable, naming no account.
    const seededGrant = await env.DB.prepare(
      'SELECT business_id, account_id, status FROM entitlements WHERE business_id = ?',
    )
      .bind('1stcontact')
      .first<{ business_id: string; account_id: string | null; status: string }>()
    expect(seededGrant).toEqual({ business_id: '1stcontact', account_id: null, status: 'active' })
    const seededMembership = await env.DB.prepare('SELECT business_id FROM memberships WHERE business_id = ?')
      .bind('1stcontact')
      .first<{ business_id: string }>()
    expect(seededMembership?.business_id).toBe('1stcontact')

    // No column named for an account holds a business id.
    const { results: businessIdsInAccountCol } = await env.DB.prepare(
      'SELECT e.id FROM entitlements e JOIN tenants t ON t.id = e.account_id',
    ).all<{ id: string }>()
    expect(businessIdsInAccountCol ?? []).toHaveLength(0)

    // Invite and additional-business provisioning write capacity grants: a
    // business, and no account.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, accountName: 'Invited', endsAt: null })
    const added = await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Added', email })
    for (const businessId of [invited.businessId, added.businessId]) {
      const row = await env.DB.prepare('SELECT business_id, account_id FROM entitlements WHERE business_id = ?')
        .bind(businessId)
        .first<{ business_id: string; account_id: string | null }>()
      expect(row).toEqual({ business_id: businessId, account_id: null })
    }

    // Three grants against one business — none, A, B — stored and read back apart.
    const target = newId('acct')
    const a = newId('acct')
    const b = newId('acct')
    const ids = {
      none: await grant({ businessId: target, accountId: null }),
      a: await grant({ businessId: target, accountId: a }),
      b: await grant({ businessId: target, accountId: b }),
    }
    const { results } = await env.DB.prepare('SELECT id, business_id, account_id FROM entitlements WHERE business_id = ?')
      .bind(target)
      .all<{ id: string; business_id: string; account_id: string | null }>()
    const read = new Map((results ?? []).map((r) => [r.id, r]))
    expect(read.size).toBe(3)
    expect(read.get(ids.none)).toEqual({ id: ids.none, business_id: target, account_id: null })
    expect(read.get(ids.a)).toEqual({ id: ids.a, business_id: target, account_id: a })
    expect(read.get(ids.b)).toEqual({ id: ids.b, business_id: target, account_id: b })
  })

  it('test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, accountName: 'AccountOnly', endsAt: null })

    // The only grant is a current one naming an account.
    await dropGrants(invited.businessId)
    await grant({ businessId: invited.businessId, accountId: invited.user.id, endsAt: null })

    const first = byId(await admit(identityEnv(), email))
    const accountOnly = first.get(invited.businessId)
    expect(accountOnly, 'the business was dropped rather than listed').toBeTruthy()
    expect(accountOnly?.selectable).toBe(false)
    expect(accountOnly?.entitlement).toBeNull()
    expect(accountOnly?.lapse?.reason).toBe('never_granted')

    // An ended capacity grant plus a current grant naming the person's account:
    // still unselectable, and the reason is the capacity grant's — expired.
    const lapsed = await provisionBusiness(identityEnv(), {
      accountUserId: invited.user.id,
      name: 'LapsedCapacity',
      email,
    })
    await setGrant(lapsed.businessId, 'ends_at', ISO(-1_000))
    await grant({ businessId: lapsed.businessId, accountId: invited.user.id, endsAt: ISO(30 * DAY) })

    const second = byId(await admit(identityEnv(), email))
    const l = second.get(lapsed.businessId)
    expect(l?.selectable).toBe(false)
    expect(l?.entitlement).toBeNull()
    expect(l?.lapse?.reason).toBe('expired')
  })
})

describe('the request path', () => {
  it('test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder', async () => {
    stubJwks()
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await acceptTerms(identityEnv(), invited.user.id)

    const response = await worker.fetch(
      new Request('https://app.example/', {
        headers: {
          'cf-access-jwt-assertion': await mint(email),
          accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        },
      }),
      workerEnv(),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const body = await response.text()
    expect(body).toContain('1st Contact builder')
    expect(body).not.toContain(DENIED_MESSAGE)
    expect(body).not.toContain('Terms of service')
  })
})
