import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  DENIED_MESSAGE,
  ensurePlatformOperator,
  findAccount,
  IdentityNotConfiguredError,
  newId,
  provisionBusiness,
  STARTER_HEADING,
  type Admission,
  type AdmittedBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { invitePerson, peopleOf } from '../apps/control-app/src/people'
import { PORTAL_PATH } from '../apps/control-app/src/portal'
import {
  ADMIN_BUSINESSES_PATH,
  PEOPLE_PATH,
  PERSON_INVITE_PATH,
} from '../apps/control-app/src/router'
import { acceptTerms, TERMS_ACCEPT_PATH } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * STORY-7b1025b8 — *the invite provisions the account, login binds it*, as
 * reshaped by REQ-186 (BUNDLE-36): the invite is an owner-gated contact→invited
 * transition on one row that writes no membership and no grant, provisioning a
 * business is the separate act that gives a person something to run, and login
 * binds a proven identity to that record and provisions nothing.
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1 with
 * the deployed migration sequence applied by the same helper the store suites
 * use. Every case about who may invite, what the list reports and what a refused
 * visitor sees drives the Worker's own `fetch` with a real RS256 Access token
 * verified against a real JWKS. Rows are read back out of D1 rather than trusted
 * from a return value.
 *
 * `inviteAccount` IS A FIXTURE, not a shipped call: it composes the two shipped
 * calls (`invitePerson` into the 1st Contact business, then `provisionBusiness`)
 * so a case whose subject is admission can start from "an entitled account
 * exists". Cases whose subject is the invite or provisioning call those directly.
 */

const PLATFORM = 'story7b1025b8-r186-platform'
const TEAM = 'https://story7b1025b8-r186-team.cloudflareaccess.com'
const AUD = 'c'.repeat(64)
const KID = 'story7b1025b8-r186-key'

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
    ASSETS: { fetch: async () => new Response('asset-bytes', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A real Access token. Omitting the email mints a service token (`common_name`). */
async function mint(email?: string): Promise<string> {
  const header = { alg: 'RS256', kid: KID, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload: Record<string, unknown> = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600 }
  if (email) payload.email = email
  else payload.common_name = 'deploy-bot.access'
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
const anEmail = (): string => `story7b1025b8-r186-${(seq += 1)}@example.test`
const ISO = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString()
const DAY = 86_400_000

const prefixed = (path: string, businessId: string | null): string =>
  `https://app.example${businessId ? `/b/${businessId}` : ''}${path}`

const GET = (token: string, path = '/', businessId: string | null = null): Request =>
  new Request(prefixed(path, businessId), { headers: { 'cf-access-jwt-assertion': token } })

const POST = (token: string | null, path: string, body: unknown, businessId: string | null = null): Request =>
  new Request(prefixed(path, businessId), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'cf-access-jwt-assertion': token } : {}),
    },
    body: JSON.stringify(body),
  })

interface InvitedPersonJson {
  id: string
  email: string
  displayName: string | null
  invitedAt: string | null
}

const postInvite = async (token: string | null, body: unknown, businessId: string | null) =>
  worker.fetch(POST(token, PERSON_INVITE_PATH, body, businessId), workerEnv())

/** An entitled account of 1st Contact who has accepted the terms — setup, not a claim. */
async function anAccount(email: string, name = 'A Business') {
  const seeded = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id)
  return seeded
}

/** An owner of the 1st Contact business, seeded the way production seeds one. */
async function anOperator(email: string) {
  await ensurePlatformOperator(identityEnv(), email)
  const account = await findAccount(identityEnv(), email)
  if (!account) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), account.id)
  return account
}

/** A contact: known to a business, never invited. */
async function addContact(tenantId: string, email: string): Promise<string> {
  const id = `usr_contact_${(seq += 1)}`
  const now = ISO(0)
  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, tenantId, email, 'active', now, now)
    .run()
  return id
}

type UserDbRow = Record<string, unknown> & {
  id: string
  tenant_id: string
  email: string
  status: string
  display_name: string | null
  invited_at: string | null
  first_seen_at: string | null
  last_seen_at: string | null
}

async function rowsFor(tenantId: string, email: string): Promise<UserDbRow[]> {
  const { results } = await env.DB.prepare('SELECT * FROM users WHERE tenant_id = ? AND email = ?')
    .bind(tenantId, email)
    .all<UserDbRow>()
  return results ?? []
}

async function count(table: 'tenants' | 'memberships' | 'entitlements' | 'users' | 'sites'): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>()
  return row?.n ?? 0
}

async function columnsOf(table: string): Promise<Array<{ name: string; notnull: number }>> {
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string; notnull: number }>()
  return results ?? []
}

/** The admitted businesses keyed by id, or a failed expectation when refused. */
function byId(result: Admission): Map<string, AdmittedBusiness> {
  expect(result.ok, `admission was refused: ${!result.ok ? result.reason : ''}`).toBe(true)
  return new Map((result.ok ? result.businesses : []).map((b) => [b.businessId, b]))
}

async function setGrant(businessId: string, column: 'ends_at' | 'starts_at' | 'status', value: string) {
  await env.DB.prepare(`UPDATE entitlements SET ${column} = ? WHERE business_id = ?`)
    .bind(value, businessId)
    .run()
}

async function grantStatus(businessId: string): Promise<string | undefined> {
  const row = await env.DB.prepare('SELECT status FROM entitlements WHERE business_id = ?')
    .bind(businessId)
    .first<{ status: string }>()
  return row?.status
}

/** Write one grant directly, so states provisioning never writes can be built. */
async function grant(spec: {
  businessId: string
  accountId?: string | null
  plan?: string
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
      spec.plan ?? 'pro',
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
  vi.restoreAllMocks()
  resetJwksCache()
})

// ─── The invite: a transition on one row ────────────────────────────────────

describe('the invite is a transition, not a creation', () => {
  it('test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created', async () => {
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")
    const token = await mint(owner)

    const contact = anEmail()
    const contactId = await addContact(account.businessId, contact)
    expect((await rowsFor(account.businessId, contact))[0].invited_at).toBeNull()

    const promoted = await postInvite(token, { email: contact }, account.businessId)
    expect(promoted.status).toBe(200)
    const promotedBody = await promoted.json<{ created: boolean; person: InvitedPersonJson }>()
    expect(promotedBody.created, 'a promoted contact was reported as created').toBe(false)
    expect(promotedBody.person.id).toBe(contactId)
    const rows = await rowsFor(account.businessId, contact)
    expect(rows, 'the invite inserted a second row for one address').toHaveLength(1)
    expect(rows[0].id).toBe(contactId)
    expect(rows[0].invited_at, 'the promotion did not stamp the row').toBeTruthy()

    const fresh = anEmail()
    const inserted = await postInvite(token, { email: fresh }, account.businessId)
    expect(inserted.status).toBe(200)
    const insertedBody = await inserted.json<{ created: boolean; person: InvitedPersonJson }>()
    expect(insertedBody.created).toBe(true)
    const [row] = await rowsFor(account.businessId, fresh)
    expect(row.id).toBe(insertedBody.person.id)
    expect(row.status).toBe('active')
    expect(row.invited_at).toBeTruthy()
    expect(row.first_seen_at).toBeNull()
  })

  it('test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const customerOwner = anEmail()
    const customer = await anAccount(customerOwner, "Alice's Plumbing")

    const alice = anEmail()
    const bob = anEmail()
    const fromPlatform = await postInvite(
      await mint(operatorEmail),
      { email: alice, displayName: 'Same Name' },
      PLATFORM,
    )
    expect(fromPlatform.status).toBe(200)
    const fromCustomer = await postInvite(
      await mint(customerOwner),
      { email: bob, displayName: 'Same Name' },
      customer.businessId,
    )
    expect(fromCustomer.status).toBe(200)

    const [aliceRow] = await rowsFor(PLATFORM, alice)
    const [bobRow] = await rowsFor(customer.businessId, bob)
    expect(aliceRow.tenant_id).toBe(PLATFORM)
    expect(bobRow.tenant_id).toBe(customer.businessId)

    // Every column apart from identifiers, the address, timestamps and the tenant.
    const shape = (row: UserDbRow) =>
      Object.fromEntries(
        Object.entries(row).filter(
          ([k]) => !['id', 'email', 'tenant_id'].includes(k) && !k.endsWith('_at'),
        ),
      )
    expect(Object.keys(shape(aliceRow)).length).toBeGreaterThan(2)
    expect(shape(bobRow)).toEqual(shape(aliceRow))
    // Both were stamped as invited.
    expect(aliceRow.invited_at).toBeTruthy()
    expect(bobRow.invited_at).toBeTruthy()

    const columns = (await columnsOf('users')).map((c) => c.name)
    expect(columns.filter((c) => c.toLowerCase().includes('level'))).toEqual([])

    const customers = await peopleOf(identityEnv(), { businessId: customer.businessId })
    const ours = await peopleOf(identityEnv(), { businessId: PLATFORM })
    expect(customers.map((p) => p.email)).toContain(bob)
    expect(ours.map((p) => p.email)).not.toContain(bob)
  })

  it('test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_overwrites_a_name', async () => {
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")
    const token = await mint(owner)
    const email = anEmail()

    const first = await postInvite(token, { email }, account.businessId)
    expect(first.status).toBe(200)
    const firstBody = await first.json<{ person: InvitedPersonJson }>()
    expect(firstBody.person.displayName).toBeNull()
    const stamp = (await rowsFor(account.businessId, email))[0].invited_at
    expect(stamp).toBeTruthy()

    const second = await postInvite(token, { email, displayName: 'Bob Smith' }, account.businessId)
    expect(second.status).toBe(200)
    const secondBody = await second.json<{ created: boolean; person: InvitedPersonJson }>()
    expect(secondBody.created).toBe(false)
    expect(secondBody.person.id).toBe(firstBody.person.id)
    let [row] = await rowsFor(account.businessId, email)
    expect(row.invited_at, 'a re-invite restamped the invitation').toBe(stamp)
    expect(row.display_name, 'an empty name was not filled').toBe('Bob Smith')

    const third = await postInvite(token, { email, displayName: 'Robert Smith' }, account.businessId)
    expect(third.status).toBe(200)
    ;[row] = await rowsFor(account.businessId, email)
    expect(row.invited_at).toBe(stamp)
    expect(row.display_name, 'the invite overwrote an existing name').toBe('Bob Smith')
  })

  it('test_UAT_AC1743_re_inviting_a_known_address_reports_the_person_and_creates_nothing', async () => {
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")
    const token = await mint(owner)
    const email = anEmail()

    const before = {
      tenants: await count('tenants'),
      memberships: await count('memberships'),
      entitlements: await count('entitlements'),
    }
    const first = await postInvite(token, { email }, account.businessId)
    const again = await postInvite(token, { email }, account.businessId)
    expect(first.status).toBe(200)
    expect(again.status, 'a re-invite failed rather than reporting').toBe(200)

    const firstBody = await first.json<{ created: boolean; person: InvitedPersonJson }>()
    const againBody = await again.json<{ created: boolean; person: InvitedPersonJson }>()
    expect(againBody.created).toBe(false)
    expect(againBody.person.id).toBe(firstBody.person.id)
    expect(await rowsFor(account.businessId, email)).toHaveLength(1)
    expect({
      tenants: await count('tenants'),
      memberships: await count('memberships'),
      entitlements: await count('entitlements'),
    }).toEqual(before)
  })

  it('test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const token = await mint(operatorEmail)
    const email = anEmail()

    const first = await postInvite(token, { email: `  ${email.replace('story', 'StOrY')}  ` }, PLATFORM)
    expect(first.status).toBe(200)
    const firstBody = await first.json<{ created: boolean; person: InvitedPersonJson }>()
    expect(firstBody.created).toBe(true)
    const stored = await rowsFor(PLATFORM, email)
    expect(stored, 'the address was not stored casefolded and trimmed').toHaveLength(1)
    expect(stored[0].email).toBe(email)

    const again = await postInvite(token, { email: email.toUpperCase() }, PLATFORM)
    const againBody = await again.json<{ created: boolean; person: InvitedPersonJson }>()
    expect(againBody.created).toBe(false)
    expect(againBody.person.id).toBe(firstBody.person.id)
    expect(await rowsFor(PLATFORM, email)).toHaveLength(1)

    await provisionBusiness(identityEnv(), { accountUserId: firstBody.person.id, name: 'Cased', email })
    const admitted = await admit(identityEnv(), ` ${email.toUpperCase()} `)
    expect(admitted.ok).toBe(true)
    expect(admitted.ok && admitted.user.id).toBe(firstBody.person.id)
  })
})

describe('who may invite', () => {
  it('test_UAT_AC2172_only_an_owner_may_invite_and_every_refusal_writes_nothing', async () => {
    stubJwks()
    const alice = anEmail()
    const account = await anAccount(alice, "Alice's Plumbing")

    // An owner into their own business.
    const ok = await postInvite(await mint(alice), { email: anEmail() }, account.businessId)
    expect(ok.status).toBe(200)

    // Scoped to the 1st Contact business, which Alice does not own.
    const intoOurs = anEmail()
    const refusedOurs = await postInvite(await mint(alice), { email: intoOurs }, PLATFORM)
    expect(refusedOurs.status).toBe(403)
    expect(await rowsFor(PLATFORM, intoOurs)).toHaveLength(0)

    // A platform-operator holder with no owner membership on the scoped business.
    const operatorEmail = anEmail()
    const operator = await anOperator(operatorEmail)
    expect(operator.platform_operator, 'the operator does not hold the capability').toBe(1)
    const intoHers = anEmail()
    const refusedOperator = await postInvite(await mint(operatorEmail), { email: intoHers }, account.businessId)
    expect(refusedOperator.status).toBe(403)
    expect(await rowsFor(account.businessId, intoHers)).toHaveLength(0)

    // The dev-open loopback path carries no admission and owns nothing.
    const loopback = anEmail()
    const refusedLoopback = await worker.fetch(
      POST(null, PERSON_INVITE_PATH, { email: loopback }),
      workerEnv({ ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }),
    )
    expect(refusedLoopback.status).toBe(403)
    expect(await rowsFor(PLATFORM, loopback)).toHaveLength(0)

    // An owner posting an empty address.
    const usersBefore = await count('users')
    for (const blank of ['', '   ']) {
      const refusedEmpty = await postInvite(await mint(alice), { email: blank }, account.businessId)
      expect(refusedEmpty.status).toBe(400)
      expect((await refusedEmpty.json<{ error: string }>()).error).toMatch(/needs an email address/i)
    }
    expect(await count('users')).toBe(usersBefore)
  })

  it('test_UAT_AC2174_the_people_list_reports_canInvite_and_canFulfil_separately', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const ours = await (
      await worker.fetch(GET(await mint(operatorEmail), PEOPLE_PATH, PLATFORM), workerEnv())
    ).json<{ canInvite: boolean; canFulfil: boolean }>()
    expect(ours).toMatchObject({ canInvite: true, canFulfil: true })

    const alice = anEmail()
    const account = await anAccount(alice, "Alice's Plumbing")
    const hers = await (
      await worker.fetch(GET(await mint(alice), PEOPLE_PATH, account.businessId), workerEnv())
    ).json<{ canInvite: boolean; canFulfil: boolean }>()
    expect(hers).toMatchObject({ canInvite: true, canFulfil: false })

    // The operator, scoped through the bypass to a business they hold no owner
    // membership on.
    const notOwned = await worker.fetch(GET(await mint(operatorEmail), PEOPLE_PATH, account.businessId), workerEnv())
    expect(notOwned.status).toBe(200)
    const notOwnedBody = await notOwned.json<{ canInvite: boolean }>()
    expect(notOwnedBody.canInvite).toBe(false)
  })
})

describe('the invite writes no membership and no grant', () => {
  it('test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const email = anEmail()

    const memberships = await count('memberships')
    const entitlements = await count('entitlements')
    const response = await postInvite(await mint(operatorEmail), { email }, PLATFORM)
    expect(response.status).toBe(200)
    const invited = await response.json<{ person: InvitedPersonJson }>()
    expect(await count('memberships'), 'the invite wrote a membership').toBe(memberships)
    expect(await count('entitlements'), 'the invite wrote a grant').toBe(entitlements)

    const bare = await admit(identityEnv(), email)
    expect(bare.ok).toBe(false)
    expect(!bare.ok && bare.reason).toBe('no_membership')

    const business = await provisionBusiness(identityEnv(), {
      accountUserId: invited.person.id,
      name: 'Now Theirs',
      email,
    })
    const admitted = await admit(identityEnv(), email)
    expect([...byId(admitted).keys()]).toEqual([business.businessId])
    expect(await rowsFor(PLATFORM, email)).toHaveLength(1)
  })

  it('test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject', async () => {
    const entitlementCols = await columnsOf('entitlements')
    expect(entitlementCols.map((c) => c.name)).toContain('business_id')
    expect(entitlementCols.find((c) => c.name === 'account_id')?.notnull).toBe(0)
    const membershipCols = (await columnsOf('memberships')).map((c) => c.name)
    expect(membershipCols).toContain('business_id')
    expect(membershipCols).not.toContain('account_id')

    // The rows seeded before the rename are still readable, naming no account.
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
    const { results: misfiled } = await env.DB.prepare(
      'SELECT e.id FROM entitlements e JOIN tenants t ON t.id = e.account_id',
    ).all<{ id: string }>()
    expect(misfiled ?? []).toHaveLength(0)

    // The invite writes no grant; provisioning writes one naming the business only.
    const email = anEmail()
    const before = await count('entitlements')
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email })
    expect(await count('entitlements'), 'the invite wrote a grant').toBe(before)
    const business = await provisionBusiness(identityEnv(), { accountUserId: invited.person.id, name: 'Object', email })
    const { results: written } = await env.DB.prepare(
      'SELECT business_id, account_id FROM entitlements WHERE business_id = ?',
    )
      .bind(business.businessId)
      .all<{ business_id: string; account_id: string | null }>()
    expect(written).toEqual([{ business_id: business.businessId, account_id: null }])

    // Three grants against one business — none, A, B — stored and read back apart.
    const target = newId('acct')
    const a = newId('acct')
    const b = newId('acct')
    const ids = {
      none: await grant({ businessId: target, accountId: null }),
      a: await grant({ businessId: target, accountId: a }),
      b: await grant({ businessId: target, accountId: b }),
    }
    const { results } = await env.DB.prepare(
      'SELECT id, business_id, account_id FROM entitlements WHERE business_id = ?',
    )
      .bind(target)
      .all<{ id: string; business_id: string; account_id: string | null }>()
    const read = new Map((results ?? []).map((r) => [r.id, r]))
    expect(read.size).toBe(3)
    expect(read.get(ids.none)).toEqual({ id: ids.none, business_id: target, account_id: null })
    expect(read.get(ids.a)).toEqual({ id: ids.a, business_id: target, account_id: a })
    expect(read.get(ids.b)).toEqual({ id: ids.b, business_id: target, account_id: b })
  })
})

// ─── Provisioning a business ────────────────────────────────────────────────

describe('provisioning a business', () => {
  it('test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site', async () => {
    const email = anEmail()
    const tenantsBefore = await count('tenants')
    const sitesBefore = await count('sites')
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email })

    // The invite: no tenant, membership, grant or site for that person.
    expect(await count('tenants')).toBe(tenantsBefore)
    expect(await count('sites')).toBe(sitesBefore)
    expect(
      await env.DB.prepare('SELECT id FROM memberships WHERE user_id = ?').bind(invited.person.id).first(),
    ).toBeNull()
    expect(await env.DB.prepare('SELECT id FROM entitlements WHERE email = ?').bind(email).first()).toBeNull()

    const business = await provisionBusiness(identityEnv(), {
      accountUserId: invited.person.id,
      name: 'Harbour Bakery',
      email,
    })

    const tenant = await env.DB.prepare('SELECT name, status FROM tenants WHERE id = ?')
      .bind(business.businessId)
      .first<{ name: string; status: string }>()
    expect(tenant).toEqual({ name: 'Harbour Bakery', status: 'active' })
    const membership = await env.DB.prepare('SELECT user_id, role, status FROM memberships WHERE business_id = ?')
      .bind(business.businessId)
      .first<{ user_id: string; role: string; status: string }>()
    expect(membership).toEqual({ user_id: invited.person.id, role: 'owner', status: 'active' })
    const written = await env.DB.prepare('SELECT source, status FROM entitlements WHERE business_id = ?')
      .bind(business.businessId)
      .first<{ source: string; status: string }>()
    expect(written).toEqual({ source: 'admin_grant', status: 'active' })

    const { results: sites } = await env.DB.prepare('SELECT slug FROM sites WHERE tenant_id = ?')
      .bind(business.businessId)
      .all<{ slug: string }>()
    expect((sites ?? []).map((s) => s.slug)).toEqual([business.siteSlug])
    const page = await env.DB.prepare('SELECT page FROM site_pages WHERE tenant_id = ? AND slug = ? AND name = ?')
      .bind(business.businessId, business.siteSlug, 'home.json')
      .first<{ page: string }>()
    expect(page?.page).toContain(STARTER_HEADING)

    // Two businesses provisioned the same way cannot claim the same address.
    const second = await provisionBusiness(identityEnv(), {
      accountUserId: invited.person.id,
      name: 'Harbour Bakery',
      email,
    })
    expect(second.siteSlug).not.toBe(business.siteSlug)

    // Empty owner, empty name: refused before anything is written.
    const snapshot = async () => ({
      tenants: await count('tenants'),
      memberships: await count('memberships'),
      entitlements: await count('entitlements'),
    })
    const before = await snapshot()
    await expect(
      provisionBusiness(identityEnv(), { accountUserId: '  ', name: 'No Owner', email }),
    ).rejects.toThrow(/account/)
    await expect(
      provisionBusiness(identityEnv(), { accountUserId: invited.person.id, name: '   ', email }),
    ).rejects.toThrow(/name/)
    expect(await snapshot()).toEqual(before)
  })

  it('test_UAT_AC1741_the_identifier_is_opaque_and_the_label_is_separate', async () => {
    const human = { accountName: 'Sarah Chen Catering', displayName: 'Sarah Chen', endsAt: null }
    const first = await inviteAccount(identityEnv(), { email: anEmail(), ...human })
    const second = await inviteAccount(identityEnv(), { email: anEmail(), ...human })

    expect(first.businessId).not.toBe(second.businessId)
    expect(first.user.id).not.toBe(second.user.id)
    for (const id of [first.businessId, second.businessId, first.user.id, second.user.id]) {
      expect(id).toMatch(/^[a-z]+_[0-9a-f]{32}$/)
      for (const word of ['sarah', 'chen', 'catering']) expect(id.toLowerCase()).not.toContain(word)
    }
    const tenant = await env.DB.prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(first.businessId)
      .first<{ name: string }>()
    expect(tenant?.name).toBe('Sarah Chen Catering')
  })

  it('test_UAT_AC1746_several_concurrent_grants_and_unknown_plan_and_status_round_trip', async () => {
    const businessId = newId('acct')
    await grant({ businessId, plan: 'pro', status: 'active' })
    await grant({
      businessId,
      plan: 'a-plan-the-product-does-not-issue',
      status: 'a-status-the-product-does-not-issue',
    })
    const { results } = await env.DB.prepare(
      'SELECT plan, status FROM entitlements WHERE business_id = ? ORDER BY plan',
    )
      .bind(businessId)
      .all<{ plan: string; status: string }>()
    expect(results).toEqual([
      { plan: 'a-plan-the-product-does-not-issue', status: 'a-status-the-product-does-not-issue' },
      { plan: 'pro', status: 'active' },
    ])
  })
})

// ─── The DOC-42 §1 sequence ─────────────────────────────────────────────────

describe('invite plus provisioning makes a customer', () => {
  it('test_UAT_AC2176_invite_provision_sign_in_reaches_only_that_business_and_its_account', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const operatorToken = await mint(operatorEmail)
    const alice = anEmail()

    const invited = await postInvite(operatorToken, { email: alice }, PLATFORM)
    expect(invited.status).toBe(200)
    const invitedBody = await invited.json<{ created: boolean; person: InvitedPersonJson }>()
    expect(invitedBody.created).toBe(true)

    const provisioned = await worker.fetch(
      POST(operatorToken, ADMIN_BUSINESSES_PATH, { accountEmail: alice, name: "Alice's Plumbing" }, PLATFORM),
      workerEnv(),
    )
    expect(provisioned.status).toBe(200)
    const business = await provisioned.json<{ businessId: string; name: string }>()

    const aliceToken = await mint(alice)
    const accepted = await worker.fetch(POST(aliceToken, TERMS_ACCEPT_PATH, {}), workerEnv())
    expect(accepted.status).toBe(204)

    const admitted = await admit(identityEnv(), alice)
    expect(admitted.ok).toBe(true)
    if (!admitted.ok) return
    expect(admitted.user.id).toBe(invitedBody.person.id)
    expect(admitted.businesses.map((b) => [b.businessId, b.name, b.selectable])).toEqual([
      [business.businessId, "Alice's Plumbing", true],
    ])

    const portal = await worker.fetch(GET(aliceToken, PORTAL_PATH), workerEnv())
    expect(portal.status).toBe(200)
    expect(await portal.text()).not.toBe(DENIED_MESSAGE)

    const fulfil = await worker.fetch(
      POST(aliceToken, ADMIN_BUSINESSES_PATH, { accountEmail: alice, name: 'Another' }),
      workerEnv(),
    )
    expect(fulfil.status).toBe(404)
  })
})

// ─── Admission ──────────────────────────────────────────────────────────────

describe('login binds, and provisions nothing', () => {
  it('test_UAT_AC1745_admission_refuses_an_unconfigured_platform_tenant_naming_what_is_missing', async () => {
    const email = anEmail()
    const seeded = await inviteAccount(identityEnv(), { email, endsAt: null })
    const stamps = () =>
      env.DB.prepare('SELECT first_seen_at, last_seen_at FROM users WHERE id = ?')
        .bind(seeded.user.id)
        .first<{ first_seen_at: string | null; last_seen_at: string | null }>()
    const before = await stamps()

    await expect(admit(identityEnv({ TENANT_ID: '' }), email)).rejects.toBeInstanceOf(IdentityNotConfiguredError)
    await expect(admit(identityEnv({ TENANT_ID: '' }), email)).rejects.toThrow(/TENANT_ID.*wrangler\.toml/s)
    expect(await stamps()).toEqual(before)

    // The invite carries no such refusal: it is scoped by the caller's business.
    const invited = await invitePerson(
      identityEnv({ TENANT_ID: '' }),
      { businessId: seeded.businessId },
      { email: anEmail() },
    )
    expect(invited.created).toBe(true)
  })

  it('test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing', async () => {
    const before = await count('users')
    const result = await admit(identityEnv(), anEmail())
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('no_user')
    expect(await count('users')).toBe(before)
  })

  it('test_UAT_AC1748_an_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, accountName: 'Corner Florist', endsAt: null })
    const written = await env.DB.prepare('SELECT id FROM entitlements WHERE business_id = ?')
      .bind(invited.businessId)
      .first<{ id: string }>()

    const first = await admit(identityEnv(), email)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.businesses.map((b) => [b.businessId, b.name, b.entitlement?.id])).toEqual([
      [invited.businessId, 'Corner Florist', written?.id],
    ])
    expect(Object.keys(first).sort()).toEqual(['businesses', 'ok', 'user'])

    await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Second', email })
    await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Third', email })
    const project = (r: Admission) =>
      r.ok ? r.businesses.map((b) => [b.businessId, b.name, b.entitlement?.id ?? null]) : null
    const a = project(await admit(identityEnv(), email))
    const b = project(await admit(identityEnv(), email))
    expect(a).toHaveLength(3)
    expect(b).toEqual(a)
  })

  it('test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, endsAt: null })
    const stamps = async () =>
      (await env.DB.prepare('SELECT first_seen_at, last_seen_at FROM users WHERE id = ?')
        .bind(invited.user.id)
        .first<{ first_seen_at: string; last_seen_at: string }>())!

    expect((await admit(identityEnv(), email)).ok).toBe(true)
    const arrival = await stamps()
    expect(arrival.first_seen_at).toBeTruthy()

    await admit(identityEnv(), email, new Date(Date.now() + 60_000))
    const returning = await stamps()
    expect(returning.first_seen_at).toBe(arrival.first_seen_at)
    expect(returning.last_seen_at > arrival.last_seen_at).toBe(true)

    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind('suspended', invited.user.id).run()
    const refused = await admit(identityEnv(), email, new Date(Date.now() + 120_000))
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('user_inactive')
    const afterRefusal = await stamps()
    expect(afterRefusal.last_seen_at > returning.last_seen_at).toBe(true)
    expect(afterRefusal.first_seen_at).toBe(arrival.first_seen_at)
  })

  it('test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed', async () => {
    const before = await count('users')
    const result = await admit(identityEnv(), null)
    expect(result).toEqual({ ok: false, reason: 'no_email', email: null })
    expect(await count('users')).toBe(before)
  })

  it('test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind('suspended', invited.user.id).run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('user_inactive')

    const membership = await env.DB.prepare('SELECT status, revoked_at, expires_at FROM memberships WHERE user_id = ?')
      .bind(invited.user.id)
      .first()
    expect(membership).toMatchObject({ status: 'active', revoked_at: null, expires_at: null })
    expect(await grantStatus(invited.businessId)).toBe('active')
  })

  it('test_UAT_AC1753_an_inactive_membership_excludes_its_business_and_refuses_only_when_none_remain', async () => {
    const withdrawals: Array<[string, string, () => string]> = [
      ['withdrawn', 'UPDATE memberships SET revoked_at = ? WHERE business_id = ?', () => ISO(0)],
      ['not active', 'UPDATE memberships SET status = ? WHERE business_id = ?', () => 'suspended'],
      ['expired', 'UPDATE memberships SET expires_at = ? WHERE business_id = ?', () => ISO(-1_000)],
    ]
    for (const [label, sql, value] of withdrawals) {
      const email = anEmail()
      const invited = await inviteAccount(identityEnv(), { email, endsAt: null })
      await env.DB.prepare(sql).bind(value(), invited.businessId).run()
      const refused = await admit(identityEnv(), email)
      expect(refused.ok, `${label}: still admitted`).toBe(false)
      expect(!refused.ok && refused.reason, `${label}: wrong reason`).toBe('no_membership')
      expect(await grantStatus(invited.businessId), `${label}: grant disturbed`).toBe('active')

      const other = anEmail()
      const kept = await inviteAccount(identityEnv(), { email: other, endsAt: null })
      const dropped = await provisionBusiness(identityEnv(), { accountUserId: kept.user.id, name: 'Dropped', email: other })
      await env.DB.prepare(sql).bind(value(), dropped.businessId).run()
      const admitted = await admit(identityEnv(), other)
      expect(admitted.ok && admitted.businesses.map((b) => b.businessId), label).toEqual([kept.businessId])
      expect(await grantStatus(dropped.businessId), `${label}: grant disturbed`).toBe('active')
    }
  })
})

describe('admission returns the set of businesses', () => {
  it('test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant', async () => {
    const email = anEmail()
    const salon = await inviteAccount(identityEnv(), { email, accountName: 'Salon', plan: 'pro', endsAt: null })
    const studio = await provisionBusiness(identityEnv(), {
      accountUserId: salon.user.id,
      name: 'Studio',
      email,
      plan: 'starter',
    })

    const businesses = byId(await admit(identityEnv(), email))
    expect(businesses.size).toBe(2)
    const s = businesses.get(salon.businessId)
    const t = businesses.get(studio.businessId)
    expect([s?.name, s?.selectable, s?.entitlement?.business_id, s?.entitlement?.plan]).toEqual([
      'Salon', true, salon.businessId, 'pro',
    ])
    expect([t?.name, t?.selectable, t?.entitlement?.business_id, t?.entitlement?.plan]).toEqual([
      'Studio', true, studio.businessId, 'starter',
    ])
    expect(s?.entitlement?.id).not.toBe(t?.entitlement?.id)
  })

  it('test_UAT_AC2077_a_withdrawn_or_expired_membership_is_absent_from_the_list', async () => {
    const email = anEmail()
    const kept = await inviteAccount(identityEnv(), { email, accountName: 'Kept', endsAt: null })
    const withdrawn = await provisionBusiness(identityEnv(), { accountUserId: kept.user.id, name: 'Withdrawn', email })
    const expired = await provisionBusiness(identityEnv(), { accountUserId: kept.user.id, name: 'Expired', email })
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE business_id = ?')
      .bind(ISO(0), withdrawn.businessId)
      .run()
    await env.DB.prepare('UPDATE memberships SET expires_at = ? WHERE business_id = ?')
      .bind(ISO(-1_000), expired.businessId)
      .run()

    const result = await admit(identityEnv(), email)
    expect(result.ok && result.businesses.map((b) => b.businessId)).toEqual([kept.businessId])
    const serialised = JSON.stringify(result)
    for (const absent of [withdrawn.businessId, expired.businessId, 'Withdrawn', 'Expired']) {
      expect(serialised).not.toContain(absent)
    }
    expect(await grantStatus(withdrawn.businessId)).toBe('active')
    expect(await grantStatus(expired.businessId)).toBe('active')
  })

  it('test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, endsAt: ISO(3_600_000), plan: 'ends-shortly' })
    await grant({ businessId: invited.businessId, plan: 'already-ended', startsAt: ISO(-DAY), endsAt: ISO(-1_000) })
    await grant({ businessId: invited.businessId, plan: 'open-ended', startsAt: ISO(-1_000), endsAt: null })

    const effective = (r: Admission) =>
      r.ok ? r.businesses.find((b) => b.businessId === invited.businessId)?.entitlement?.plan : undefined
    expect(effective(await admit(identityEnv(), email))).toBe('open-ended')

    await env.DB.prepare('DELETE FROM entitlements WHERE business_id = ? AND ends_at IS NULL')
      .bind(invited.businessId)
      .run()
    expect(effective(await admit(identityEnv(), email))).toBe('ends-shortly')
  })
})

describe('membership admits; entitlement does not', () => {
  it('test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides', async () => {
    const email = anEmail()
    const first = await inviteAccount(identityEnv(), { email, accountName: 'First', endsAt: ISO(DAY) })

    const live = byId(await admit(identityEnv(), email))
    expect(live.get(first.businessId)?.selectable).toBe(true)
    expect(live.get(first.businessId)?.entitlement?.business_id).toBe(first.businessId)

    await setGrant(first.businessId, 'ends_at', ISO(-1_000))
    const lapsed = byId(await admit(identityEnv(), email))
    expect([...lapsed.keys()]).toEqual([first.businessId])
    expect(lapsed.get(first.businessId)?.selectable).toBe(false)
    expect(lapsed.get(first.businessId)?.entitlement).toBeNull()

    const second = await provisionBusiness(identityEnv(), { accountUserId: first.user.id, name: 'Second', email, endsAt: null })
    const mixed = byId(await admit(identityEnv(), email))
    expect(mixed.get(second.businessId)?.selectable).toBe(true)
    expect(mixed.get(second.businessId)?.entitlement?.ends_at).toBeNull()

    await setGrant(second.businessId, 'ends_at', ISO(-1_000))
    const allLapsed = await admit(identityEnv(), email)
    expect(allLapsed.ok).toBe(true)
    if (!allLapsed.ok) return
    expect(allLapsed.businesses.map((b) => b.businessId).sort()).toEqual([first.businessId, second.businessId].sort())
    expect(allLapsed.businesses.some((b) => b.selectable)).toBe(false)
    expect(allLapsed.businesses.every((b) => b.entitlement === null)).toBe(true)

    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?').bind(ISO(0), first.user.id).run()
    const none = await admit(identityEnv(), email)
    expect(!none.ok && none.reason).toBe('no_membership')
  })

  it('test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason', async () => {
    const variants: Array<[string, 'ends_at' | 'starts_at' | 'status', () => string, string]> = [
      ['lapsed', 'ends_at', () => ISO(-1_000), 'expired'],
      ['not started', 'starts_at', () => ISO(DAY), 'not_yet'],
      ['revoked', 'status', () => 'revoked', 'revoked'],
    ]
    for (const [label, column, value, reason] of variants) {
      const email = anEmail()
      const live = await inviteAccount(identityEnv(), { email, accountName: 'Live', endsAt: null })
      const dead = await provisionBusiness(identityEnv(), { accountUserId: live.user.id, name: 'Dead', email })
      await setGrant(dead.businessId, column, value())

      const businesses = byId(await admit(identityEnv(), email))
      expect(businesses.size, label).toBe(2)
      const d = businesses.get(dead.businessId)
      expect([d?.name, d?.selectable, d?.entitlement, d?.lapse?.reason], label).toEqual(['Dead', false, null, reason])
      const l = businesses.get(live.businessId)
      expect([l?.selectable, l?.entitlement?.business_id, l?.lapse], label).toEqual([true, live.businessId, null])

      await setGrant(live.businessId, column, value())
      const both = byId(await admit(identityEnv(), email))
      expect(both.size, label).toBe(2)
      expect([...both.values()].some((b) => b.selectable), label).toBe(false)
      expect([...both.values()].every((b) => b.lapse?.reason === reason), label).toBe(true)
    }
  })

  it('test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused', async () => {
    const email = anEmail()
    const scheduled = await inviteAccount(identityEnv(), { email, accountName: 'Scheduled', endsAt: null })
    await setGrant(scheduled.businessId, 'starts_at', ISO(DAY))

    const alone = byId(await admit(identityEnv(), email))
    expect([...alone.keys()]).toEqual([scheduled.businessId])
    const s = alone.get(scheduled.businessId)
    expect([s?.selectable, s?.entitlement, s?.lapse]).toEqual([false, null, { reason: 'not_yet', endedAt: null }])

    const entitled = await provisionBusiness(identityEnv(), { accountUserId: scheduled.user.id, name: 'Entitled', email })
    const both = byId(await admit(identityEnv(), email))
    expect(both.get(scheduled.businessId)?.selectable).toBe(false)
    expect(both.get(scheduled.businessId)?.entitlement).toBeNull()
    expect(both.get(entitled.businessId)?.selectable).toBe(true)
  })

  it('test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, accountName: 'Revoked', endsAt: null })
    await setGrant(invited.businessId, 'status', 'revoked')
    const dates = await env.DB.prepare('SELECT starts_at, ends_at FROM entitlements WHERE business_id = ?')
      .bind(invited.businessId)
      .first<{ starts_at: string; ends_at: string | null }>()
    expect(dates?.ends_at).toBeNull()
    expect(dates!.starts_at <= ISO(0)).toBe(true)

    const alone = byId(await admit(identityEnv(), email))
    const r = alone.get(invited.businessId)
    expect([r?.selectable, r?.entitlement, r?.lapse]).toEqual([false, null, { reason: 'revoked', endedAt: null }])

    const other = await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'Other', email })
    const both = byId(await admit(identityEnv(), email))
    expect(both.get(invited.businessId)?.selectable).toBe(false)
    expect(both.get(invited.businessId)?.entitlement).toBeNull()
    expect(both.get(other.businessId)?.selectable).toBe(true)
  })
})

describe('a lapse explains itself', () => {
  it('test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing', async () => {
    const email = anEmail()
    const open = await inviteAccount(identityEnv(), { email, accountName: 'Open', endsAt: null })
    const add = (name: string) => provisionBusiness(identityEnv(), { accountUserId: open.user.id, name, email })

    const expired = await add('Expired')
    await dropGrants(expired.businessId)
    const laterEnd = ISO(-1 * DAY)
    await grant({ businessId: expired.businessId, startsAt: ISO(-30 * DAY), endsAt: ISO(-5 * DAY) })
    await grant({ businessId: expired.businessId, startsAt: ISO(-5 * DAY), endsAt: laterEnd })

    const revoked = await add('Revoked')
    await setGrant(revoked.businessId, 'status', 'revoked')

    const notYet = await add('NotYet')
    await setGrant(notYet.businessId, 'starts_at', ISO(DAY))

    const never = await add('Never')
    await dropGrants(never.businessId)

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
    expect(businesses.get(open.businessId)?.selectable).toBe(true)
    expect(businesses.get(open.businessId)?.lapse).toBeNull()
    for (const b of businesses.values()) expect(b.lapse === null, b.name).toBe(b.selectable)
  })

  it('test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on', async () => {
    const aliceEmail = anEmail()
    const alice = await inviteAccount(identityEnv(), { email: aliceEmail, accountName: 'Alice Live', endsAt: null })
    const aliceLapsed = await provisionBusiness(identityEnv(), {
      accountUserId: alice.user.id,
      name: 'Alice Lapsed',
      email: aliceEmail,
    })
    await setGrant(aliceLapsed.businessId, 'ends_at', ISO(-1_000))

    const bobEmail = anEmail()
    const bob = await inviteAccount(identityEnv(), { email: bobEmail, accountName: 'Bob Lapsed', endsAt: null })
    await setGrant(bob.businessId, 'ends_at', ISO(-1_000))

    const admitted = await admit(identityEnv(), aliceEmail)
    const listed = byId(admitted)
    expect([...listed.keys()].sort()).toEqual([alice.businessId, aliceLapsed.businessId].sort())
    expect(listed.get(aliceLapsed.businessId)?.lapse?.reason).toBe('expired')
    expect(JSON.stringify(admitted)).not.toContain(bob.businessId)
    expect(JSON.stringify(admitted)).not.toContain('Bob Lapsed')

    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE business_id = ?')
      .bind(ISO(0), aliceLapsed.businessId)
      .run()
    const after = await admit(identityEnv(), aliceEmail)
    expect([...byId(after).keys()]).toEqual([alice.businessId])
    expect(JSON.stringify(after)).not.toContain(aliceLapsed.businessId)
    expect(JSON.stringify(after)).not.toContain('expired')
  })

  it('test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, accountName: 'AccountOnly', endsAt: null })
    await dropGrants(invited.businessId)
    await grant({ businessId: invited.businessId, accountId: invited.user.id, endsAt: null })

    const accountOnly = byId(await admit(identityEnv(), email)).get(invited.businessId)
    expect(accountOnly, 'the business was dropped rather than listed').toBeTruthy()
    expect([accountOnly?.selectable, accountOnly?.entitlement, accountOnly?.lapse?.reason]).toEqual([
      false, null, 'never_granted',
    ])

    const lapsed = await provisionBusiness(identityEnv(), { accountUserId: invited.user.id, name: 'LapsedCapacity', email })
    await setGrant(lapsed.businessId, 'ends_at', ISO(-1_000))
    await grant({ businessId: lapsed.businessId, accountId: invited.user.id, endsAt: ISO(30 * DAY) })
    const l = byId(await admit(identityEnv(), email)).get(lapsed.businessId)
    expect([l?.selectable, l?.entitlement, l?.lapse?.reason]).toEqual([false, null, 'expired'])
  })
})

// ─── The request path ───────────────────────────────────────────────────────

describe('the request path', () => {
  it('test_UAT_AC1757_admission_is_decided_before_any_route_is_served', async () => {
    stubJwks()
    const token = await mint(anEmail())
    for (const path of ['/', '/assets/app.js', '/no-such-path']) {
      const response = await worker.fetch(GET(token, path), workerEnv())
      expect(response.status, path).toBe(403)
      const body = await response.text()
      expect(body, path).toBe(DENIED_MESSAGE)
      expect(body).not.toContain('asset-bytes')
    }
  })

  it('test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable', async () => {
    stubJwks()
    const stranger = await worker.fetch(GET(await mint(anEmail())), workerEnv())

    const withdrawnEmail = anEmail()
    const withdrawn = await inviteAccount(identityEnv(), { email: withdrawnEmail, endsAt: null })
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?').bind(ISO(0), withdrawn.user.id).run()
    const withdrawnResponse = await worker.fetch(GET(await mint(withdrawnEmail)), workerEnv())

    const suspendedEmail = anEmail()
    const suspended = await inviteAccount(identityEnv(), { email: suspendedEmail, endsAt: null })
    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind('suspended', suspended.user.id).run()
    const suspendedResponse = await worker.fetch(GET(await mint(suspendedEmail)), workerEnv())

    const strangerBody = await stranger.text()
    expect(stranger.status).toBe(403)
    for (const [label, refusal] of [
      ['stranger', stranger],
      ['withdrawn member', withdrawnResponse],
      ['suspended person', suspendedResponse],
    ] as const) {
      const body = label === 'stranger' ? strangerBody : await refusal.text()
      expect(refusal.status, label).toBe(403)
      expect(body, label).toBe(strangerBody)
      expect(body, label).toBe(DENIED_MESSAGE)
      for (const hint of ['user', 'membership', 'entitlement', 'grant', 'expired', 'reason', 'suspend']) {
        expect(body.toLowerCase(), `${label}: hints at '${hint}'`).not.toContain(hint)
      }
      expect(refusal.headers.get('cache-control'), label).toBe('no-store')
      expect(refusal.headers.get('x-robots-tag'), label).toContain('noindex')
    }
  })

  it('test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason', async () => {
    const strangerEmail = anEmail()

    const inactive = anEmail()
    const inactiveSeed = await inviteAccount(identityEnv(), { email: inactive, endsAt: null })
    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind('suspended', inactiveSeed.user.id).run()

    // Invited and given no business: no live membership.
    const unmembered = anEmail()
    await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: unmembered })

    const ungranted = anEmail()
    const ungrantedSeed = await inviteAccount(identityEnv(), { email: ungranted, endsAt: null })
    await acceptTerms(identityEnv(), ungrantedSeed.user.id)
    await setGrant(ungrantedSeed.businessId, 'ends_at', ISO(-1_000))

    const reasons: string[] = []
    for (const address of [null, strangerEmail, inactive, unmembered]) {
      const result = await admit(identityEnv(), address)
      reasons.push(!result.ok ? result.reason : 'admitted')
    }
    expect(reasons).toEqual(['no_email', 'no_user', 'user_inactive', 'no_membership'])
    expect((await admit(identityEnv(), ungranted)).ok, 'a lapsed member was refused at the door').toBe(true)

    stubJwks()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const [address, path] of [
      [strangerEmail, '/'],
      [inactive, '/'],
      [unmembered, '/'],
      [ungranted, '/api/sites'],
    ] as const) {
      const response = await worker.fetch(GET(await mint(address), path), workerEnv())
      expect(response.status, address).toBe(403)
    }
    expect((await worker.fetch(GET(await mint()), workerEnv())).status).toBe(403)

    const records = warn.mock.calls
      .map(([line]) => {
        try {
          return JSON.parse(String(line)) as Record<string, unknown>
        } catch {
          return null
        }
      })
      .filter((r): r is Record<string, unknown> => r !== null)
    for (const [reason, email] of [
      ['no_user', strangerEmail],
      ['user_inactive', inactive],
      ['no_membership', unmembered],
      ['no_entitlement', ungranted],
      ['no_email', null],
    ] as const) {
      expect(records, reason).toContainEqual(expect.objectContaining({ reason, email }))
    }
    expect(new Set(records.map((r) => r.reason)).size).toBe(5)
  })

  it('test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder', async () => {
    stubJwks()
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, endsAt: null })
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
