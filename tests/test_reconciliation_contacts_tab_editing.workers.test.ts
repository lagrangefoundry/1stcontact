import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  ensurePlatformOperator,
  findAccount,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { invitePerson } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import {
  GRANTS_PATH,
  GRANT_REVOKE_PATH,
  PERSON_DETAIL_PATH,
  PERSON_RECORD_PATH,
  PERSON_STATUS_PATH,
} from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * story-a55c2f35 — **the Contacts tab, editing: the origin half.**
 *
 * Correcting who somebody is, opening and withdrawing grants, and the login
 * control — every case drives the deployed `fetch` inside workerd, against a
 * real D1 with the deployed migrations and a real RS256 Access token verified
 * against a stubbed JWKS (the JWKS fetch is the only external boundary). Rows
 * are written by shipped entry points (`inviteAccount`, `invitePerson`,
 * `ensurePlatformOperator`); the one exception is the non-owner member, a
 * hand-written `memberships` row with role `editor`, because nothing shipped
 * writes a non-owner membership yet and that caller is exactly the one the
 * owner gate exists to refuse. The browser half is the jsdom sibling.
 */

const PLATFORM = 'contacts-edit-platform'
const TEAM = 'https://contacts-edit-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
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

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'contacts-edit-key', typ: 'JWT' }
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
const anEmail = (): string => `contacts-edit-${(seq += 1)}@example.test`

/** An account of 1st Contact who owns a business of their own. */
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

/** An owner, their business, and one person in it to correct. */
async function aBusinessWithSomebodyInIt(name = "Alice's Plumbing") {
  const owner = anEmail()
  const account = await anAccount(owner, name)
  const bob = anEmail()
  const invited = await invitePerson(
    identityEnv(),
    { businessId: account.businessId },
    { email: bob, displayName: 'Bob' },
  )
  return { owner, businessId: account.businessId, bob, personId: invited.person.id }
}

/** An account that is a member of `businessId` but NOT its owner. */
async function aNonOwnerMemberOf(businessId: string): Promise<string> {
  const email = anEmail()
  const seeded = await anAccount(email, 'Their Own Business')
  await env.DB.prepare(
    'INSERT INTO memberships (id, user_id, business_id, role, status, granted_by, granted_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(`mem_editor_${(seq += 1)}`, seeded.user.id, businessId, 'editor', 'active', null, new Date().toISOString())
    .run()
  return email
}

const post = (
  token: string | null,
  path: string,
  body: unknown,
  businessId: string | null,
  overrides: Partial<Env> = {},
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${businessId ? `/b/${encodeURIComponent(businessId)}` : ''}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      },
      body: JSON.stringify(body),
    }),
    workerEnv(overrides),
  )

const getDetail = (token: string, businessId: string, id: string): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/b/${encodeURIComponent(businessId)}${PERSON_DETAIL_PATH}?id=${id}`, {
      headers: { 'cf-access-jwt-assertion': token },
    }),
    workerEnv(),
  )

interface UserRowShape {
  id: string
  email: string
  display_name: string | null
  status: string
  pipeline_stage: string | null
  invited_at: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  tos_accepted_at: string | null
  created_at: string
}

const rowById = async (tenantId: string, id: string): Promise<UserRowShape> => {
  const row = await env.DB.prepare(
    'SELECT id, email, display_name, status, pipeline_stage, invited_at, first_seen_at, ' +
      'last_seen_at, tos_accepted_at, created_at FROM users WHERE tenant_id = ? AND id = ?',
  )
    .bind(tenantId, id)
    .first<UserRowShape>()
  if (!row) throw new Error(`no such row: ${id}`)
  return row
}

const grantCount = async (): Promise<number> =>
  (await env.DB.prepare('SELECT COUNT(*) AS n FROM entitlements').first<{ n: number }>())!.n

const grantRow = async (id: string) =>
  env.DB.prepare('SELECT id, status, revoked_at, source, granted_by FROM entitlements WHERE id = ?')
    .bind(id)
    .first<{ id: string; status: string; revoked_at: string | null; source: string; granted_by: string | null }>()

/** The capacity grant `provisionBusiness` wrote for a business. */
const capacityGrantOf = async (businessId: string): Promise<string> =>
  (await env.DB.prepare('SELECT id FROM entitlements WHERE business_id = ? AND account_id IS NULL')
    .bind(businessId)
    .first<{ id: string }>())!.id

const errorOf = async (response: Response): Promise<string> =>
  (await response.json<{ error: string }>()).error

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
  jwks = { keys: [{ ...jwk, kid: 'contacts-edit-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

const MALFORMED = ['a@b', 'a@@b.c', 'a@.c', 'a@b.', '@b.c', 'a b@example.test', '']

describe('story-a55c2f35 — an owner corrects who somebody is', () => {
  it('test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own', async () => {
    stubJwks()
    const first = await aBusinessWithSomebodyInIt("Alice's Plumbing")
    const token = await mint(first.owner)

    const response = await post(
      token,
      PERSON_RECORD_PATH,
      { id: first.personId, email: 'Alice@Example.COM', displayName: 'Bob Smith' },
      first.businessId,
    )
    expect(response.status).toBe(200)
    const returned = await response.json<{ id: string; email: string; displayName: string | null }>()
    expect(returned.id).toBe(first.personId)
    expect(returned.email).toBe('alice@example.com')
    expect(returned.displayName).toBe('Bob Smith')

    // Persisted, and readable through the detail the tab reads.
    const read = await getDetail(token, first.businessId, first.personId)
    expect(read.status).toBe(200)
    const detail = await read.json<{ person: { email: string; displayName: string | null } }>()
    expect(detail.person.email).toBe('alice@example.com')
    expect(detail.person.displayName).toBe('Bob Smith')

    // A whitespace-only name is stored as no name.
    const blanked = await post(token, PERSON_RECORD_PATH, { id: first.personId, displayName: '   ' }, first.businessId)
    expect(blanked.status).toBe(200)
    const blankedRow = await rowById(first.businessId, first.personId)
    expect(blankedRow.display_name).toBeNull()
    // Stored casefolded — the form `admit` normalises any casing to.
    expect(blankedRow.email).toBe('alice@example.com')

    // The same, for the owner of a second, unrelated customer business.
    const second = await aBusinessWithSomebodyInIt("Carol's Salon")
    const theirs = await post(
      await mint(second.owner),
      PERSON_RECORD_PATH,
      { id: second.personId, email: 'client@salon.test', displayName: 'A Client' },
      second.businessId,
    )
    expect(theirs.status).toBe(200)
    const row = await rowById(second.businessId, second.personId)
    expect(row.email).toBe('client@salon.test')
    expect(row.display_name).toBe('A Client')
  })

  it('test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields', async () => {
    stubJwks()
    const { owner, businessId, personId, bob } = await aBusinessWithSomebodyInIt()
    const token = await mint(owner)

    // Only a name: the email is untouched.
    expect((await post(token, PERSON_RECORD_PATH, { id: personId, displayName: 'Bob Smith' }, businessId)).status).toBe(200)
    expect((await rowById(businessId, personId)).email).toBe(bob)

    // Only an email: the name is untouched.
    expect((await post(token, PERSON_RECORD_PATH, { id: personId, email: 'renamed@example.test' }, businessId)).status).toBe(200)
    expect((await rowById(businessId, personId)).display_name).toBe('Bob Smith')

    // Observed fields sent alongside a valid name are ignored, byte for byte.
    const before = await rowById(businessId, personId)
    const response = await post(
      token,
      PERSON_RECORD_PATH,
      {
        id: personId,
        displayName: 'Robert',
        status: 'suspended',
        pipelineStage: 'customer',
        invitedAt: '1999-01-01T00:00:00.000Z',
        termsAcceptedAt: '1999-01-01T00:00:00.000Z',
        firstSeenAt: '1999-01-01T00:00:00.000Z',
        lastSeenAt: '1999-01-01T00:00:00.000Z',
        createdAt: '1999-01-01T00:00:00.000Z',
      },
      businessId,
    )
    expect(response.status).toBe(200)
    const after = await rowById(businessId, personId)
    expect(after).toEqual({ ...before, display_name: 'Robert' })

    // Neither field: refused.
    const nothing = await post(token, PERSON_RECORD_PATH, { id: personId }, businessId)
    expect(nothing.status).toBe(400)
    expect(await errorOf(nothing)).toBe('Nothing to change.')
    expect(await rowById(businessId, personId)).toEqual(after)
  })

  it('test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged', async () => {
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()
    const token = await mint(owner)
    const before = await rowById(businessId, personId)

    for (const typed of MALFORMED) {
      const response = await post(
        token,
        PERSON_RECORD_PATH,
        { id: personId, email: typed, displayName: 'Should Not Land' },
        businessId,
      )
      expect(response.status, `"${typed}" was not refused 400`).toBe(400)
      const error = await errorOf(response)
      expect(error).toContain('Email')
      expect(error).toContain('must be an address like name@example.com')
      const row = await rowById(businessId, personId)
      expect(row.email, `"${typed}" changed the email`).toBe(before.email)
      expect(row.display_name, `"${typed}" changed the name`).toBe(before.display_name)
    }
  })

  it('test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule', async () => {
    // The origin half of the shared rule: every shape the panel refuses inline
    // is a 400 here, and the minimum shape it accepts is a 200 here.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()
    const token = await mint(owner)

    for (const typed of MALFORMED) {
      const response = await post(token, PERSON_RECORD_PATH, { id: personId, email: typed }, businessId)
      expect(response.status, `"${typed}"`).toBe(400)
    }
    const accepted = await post(token, PERSON_RECORD_PATH, { id: personId, email: 'a@b.c' }, businessId)
    expect(accepted.status).toBe(200)
    expect((await rowById(businessId, personId)).email).toBe('a@b.c')
  })

  it('test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine', async () => {
    stubJwks()
    const a = await aBusinessWithSomebodyInIt('Business A')
    const token = await mint(a.owner)
    const second = await invitePerson(identityEnv(), { businessId: a.businessId }, { email: anEmail() })
    const firstBefore = await rowById(a.businessId, a.personId)
    const secondBefore = await rowById(a.businessId, second.person.id)

    const response = await post(
      token,
      PERSON_RECORD_PATH,
      { id: second.person.id, email: a.bob.toUpperCase() },
      a.businessId,
    )
    expect(response.status).toBe(400)
    expect(await errorOf(response)).toBe('Somebody in this business already has that address.')
    expect(await rowById(a.businessId, a.personId)).toEqual(firstBefore)
    expect(await rowById(a.businessId, second.person.id)).toEqual(secondBefore)

    // Address X held in business B only: setting a person in A to X is accepted.
    const b = await aBusinessWithSomebodyInIt('Business B')
    const accepted = await post(token, PERSON_RECORD_PATH, { id: a.personId, email: b.bob }, a.businessId)
    expect(accepted.status).toBe(200)
    expect((await rowById(a.businessId, a.personId)).email).toBe(b.bob)
    expect((await rowById(b.businessId, b.personId)).email).toBe(b.bob)
  })

  it('test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404', async () => {
    stubJwks()
    const a = await aBusinessWithSomebodyInIt('Business A')
    const b = await aBusinessWithSomebodyInIt('Business B')
    const token = await mint(a.owner)
    const bBefore = await rowById(b.businessId, b.personId)

    const unknown = await post(token, PERSON_RECORD_PATH, { id: 'usr_no_such_person', displayName: 'X' }, a.businessId)
    const elsewhere = await post(token, PERSON_RECORD_PATH, { id: b.personId, displayName: 'X' }, a.businessId)

    expect(unknown.status).toBe(404)
    expect(elsewhere.status).toBe(404)
    expect(await unknown.text()).toBe(await elsewhere.text())
    expect(await rowById(b.businessId, b.personId)).toEqual(bBefore)
  })

  it('test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403', async () => {
    stubJwks()
    const theirs = await aBusinessWithSomebodyInIt()
    const before = await rowById(theirs.businessId, theirs.personId)
    const MESSAGE = 'Only an owner of this business may edit its people.'

    // A member who is not an owner.
    const member = await aNonOwnerMemberOf(theirs.businessId)
    const asMember = await post(
      await mint(member),
      PERSON_RECORD_PATH,
      { id: theirs.personId, displayName: 'Changed' },
      theirs.businessId,
    )
    expect(asMember.status).toBe(403)
    expect(await errorOf(asMember)).toBe(MESSAGE)

    // A platform operator, who can enter the business without owning it.
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const asOperator = await post(
      await mint(operatorEmail),
      PERSON_RECORD_PATH,
      { id: theirs.personId, displayName: 'Changed' },
      theirs.businessId,
    )
    expect(asOperator.status).toBe(403)
    expect(await errorOf(asOperator)).toBe(MESSAGE)

    // The dev-open loopback path: nobody there owns anything.
    const loopback = await post(
      null,
      PERSON_RECORD_PATH,
      { id: theirs.personId, displayName: 'Changed' },
      null,
      { ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' },
    )
    expect(loopback.status).toBe(403)

    expect(await rowById(theirs.businessId, theirs.personId)).toEqual(before)
  })
})

describe('story-a55c2f35 — grants', () => {
  it('test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const holder = await anAccount(anEmail(), 'Holder Ltd')
    const token = await mint(operatorEmail)

    const response = await post(
      token,
      GRANTS_PATH,
      {
        businessId: holder.businessId,
        accountId: holder.user.id,
        plan: 'support',
        source: 'stripe',
        status: 'revoked',
        endsAt: '2027-06-01T00:00:00.000Z',
        note: 'comped for launch',
      },
      PLATFORM,
    )
    expect(response.status).toBe(200)
    const grant = await response.json<{
      id: string
      businessId: string
      businessName: string | null
      accountId: string | null
      plan: string
      source: string
      status: string
      startsAt: string
      endsAt: string | null
      note: string | null
    }>()
    expect(grant.businessId).toBe(holder.businessId)
    expect(grant.businessName).toBe('Holder Ltd')
    expect(grant.accountId).toBe(holder.user.id)
    expect(grant.plan).toBe('support')
    expect(grant.source).toBe('admin_grant')
    expect(grant.status).toBe('active')
    expect(Math.abs(Date.parse(grant.startsAt) - Date.now())).toBeLessThan(60_000)
    expect(grant.endsAt).toBe('2027-06-01T00:00:00.000Z')
    expect(grant.note).toBe('comped for launch')
    expect((await grantRow(grant.id))?.granted_by).toBe(operatorEmail)

    // Open-ended when no end is given, and no subject is allowed.
    const capacity = await post(token, GRANTS_PATH, { businessId: holder.businessId, plan: 'pro' }, PLATFORM)
    expect(capacity.status).toBe(200)
    const opened = await capacity.json<{ accountId: string | null; endsAt: string | null }>()
    expect(opened.accountId).toBeNull()
    expect(opened.endsAt).toBeNull()

    // It appears in the subject's detail, under the business it names.
    const read = await getDetail(token, PLATFORM, holder.user.id)
    expect(read.status).toBe(200)
    const detail = await read.json<{ grants: Array<{ id: string; businessId: string }> }>()
    expect(detail.grants.find((g) => g.id === grant.id)?.businessId).toBe(holder.businessId)

    // Refused: no business, then no plan — 400 with the sentence, nothing written.
    const count = await grantCount()
    const noBusiness = await post(token, GRANTS_PATH, { businessId: '', plan: 'pro' }, PLATFORM)
    expect(noBusiness.status).toBe(400)
    expect(await errorOf(noBusiness)).toBe('A grant must name the business it is for.')
    const noPlan = await post(token, GRANTS_PATH, { businessId: holder.businessId, plan: '' }, PLATFORM)
    expect(noPlan.status).toBe(400)
    expect(await errorOf(noPlan)).toBe('A grant must name a plan.')
    expect(await grantCount()).toBe(count)
  })

  it('test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const holderEmail = anEmail()
    const holder = await anAccount(holderEmail, 'Withdrawn Ltd')
    const token = await mint(operatorEmail)

    // Before: the business is selectable on the strength of its one grant.
    const admittedBefore = await admit(identityEnv(), holderEmail)
    expect(admittedBefore.ok).toBe(true)
    if (admittedBefore.ok) {
      expect(admittedBefore.businesses.find((b) => b.businessId === holder.businessId)?.selectable).toBe(true)
    }

    const grantId = await capacityGrantOf(holder.businessId)
    const response = await post(token, GRANT_REVOKE_PATH, { id: grantId }, PLATFORM)
    expect(response.status).toBe(200)

    const row = await grantRow(grantId)
    expect(row, 'the grant row was deleted').not.toBeNull()
    expect(row?.status).toBe('revoked')
    expect(row?.revoked_at).not.toBeNull()

    // After: the revoked grant confers nothing.
    const admittedAfter = await admit(identityEnv(), holderEmail)
    expect(admittedAfter.ok).toBe(true)
    if (admittedAfter.ok) {
      expect(admittedAfter.businesses.find((b) => b.businessId === holder.businessId)?.selectable).toBe(false)
    }

    // The detail still lists it, as revoked.
    const read = await getDetail(token, PLATFORM, holder.user.id)
    const detail = await read.json<{ grants: Array<{ id: string; status: string }> }>()
    expect(detail.grants.find((g) => g.id === grantId)?.status).toBe('revoked')

    // An id naming no grant is refused 400 with the sentence.
    const unknown = await post(token, GRANT_REVOKE_PATH, { id: `ent_${crypto.randomUUID()}` }, PLATFORM)
    expect(unknown.status).toBe(400)
    expect(await errorOf(unknown)).toBe('No such grant.')
  })

  it('test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner', async () => {
    stubJwks()
    const theirs = await aBusinessWithSomebodyInIt('Gated Ltd')
    const existing = await capacityGrantOf(theirs.businessId)
    const member = await aNonOwnerMemberOf(theirs.businessId)
    const asMember = await mint(member)

    const countBefore = await grantCount()
    const personBefore = await rowById(theirs.businessId, theirs.personId)

    const open = await post(asMember, GRANTS_PATH, { businessId: theirs.businessId, plan: 'pro' }, theirs.businessId)
    expect(open.status, 'a non-owner opened a grant').toBe(403)
    const revoke = await post(asMember, GRANT_REVOKE_PATH, { id: existing }, theirs.businessId)
    expect(revoke.status, 'a non-owner withdrew a grant').toBe(403)
    const status = await post(
      asMember,
      PERSON_STATUS_PATH,
      { id: theirs.personId, status: 'suspended' },
      theirs.businessId,
    )
    expect(status.status, "a non-owner changed a person's login").toBe(403)

    expect(await grantCount()).toBe(countBefore)
    expect((await grantRow(existing))?.status).toBe('active')
    expect((await rowById(theirs.businessId, theirs.personId)).status).toBe(personBefore.status)

    // The owner performs all three.
    const asOwner = await mint(theirs.owner)
    expect((await post(asOwner, GRANTS_PATH, { businessId: theirs.businessId, plan: 'pro' }, theirs.businessId)).status).toBe(200)
    expect((await post(asOwner, PERSON_STATUS_PATH, { id: theirs.personId, status: 'suspended' }, theirs.businessId)).status).toBe(200)
    expect((await post(asOwner, GRANT_REVOKE_PATH, { id: existing }, theirs.businessId)).status).toBe(200)
    expect(await grantCount()).toBe(countBefore + 1)
    expect((await grantRow(existing))?.status).toBe('revoked')
    expect((await rowById(theirs.businessId, theirs.personId)).status).toBe('suspended')
  })
})

describe('story-a55c2f35 — the login control, server-side only', () => {
  it('test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const holderEmail = anEmail()
    const holder = await anAccount(holderEmail, 'Suspended Ltd')
    const token = await mint(operatorEmail)

    expect((await admit(identityEnv(), holderEmail)).ok).toBe(true)

    const suspended = await post(token, PERSON_STATUS_PATH, { id: holder.user.id, status: 'inactive' }, PLATFORM)
    expect(suspended.status).toBe(200)
    const refused = await admit(identityEnv(), holderEmail)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.reason).toBe('user_inactive')

    const restored = await post(token, PERSON_STATUS_PATH, { id: holder.user.id, status: 'active' }, PLATFORM)
    expect(restored.status).toBe(200)
    expect((await admit(identityEnv(), holderEmail)).ok).toBe(true)

    const empty = await post(token, PERSON_STATUS_PATH, { id: holder.user.id, status: '' }, PLATFORM)
    expect(empty.status).toBe(400)
    expect(await errorOf(empty)).toBe('A status is required.')

    const unknown = await post(token, PERSON_STATUS_PATH, { id: 'usr_no_such_person', status: 'inactive' }, PLATFORM)
    expect(unknown.status).toBe(404)
  })
})
