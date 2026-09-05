import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  ensurePlatformOperator,
  findAccount,
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { invitePerson, peopleOf } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PEOPLE_PATH, PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * REQ-186 — **the invite: the verb that turns a contact into a member**.
 *
 * WHAT THIS FILE PROVES, AND WHY IT DRIVES THE WORKER. Every case that concerns
 * who may invite goes through the deployed `fetch` inside workerd, against a real
 * D1 with the deployed schema and a real RS256 Access token verified against a
 * real JWKS. The gate is the whole ticket — reusing the FULFILMENT gate would
 * mean only 1st Contact could invite anybody and would foreclose level 2
 * ([[DOC-42]] §7) — and a suite that called `invitePerson` with a scope it built
 * itself would prove the SQL and say nothing about the authorisation, which is
 * the half that can silently be wrong.
 *
 * THE OTHER HALF IS THE ROW SHAPE, and those cases call `invitePerson` directly:
 * that the same call from two businesses differs only in `tenant_id`, that a
 * contact is UPDATED rather than duplicated, and that no entitlement is written.
 * Each is a named falsifier in [[DOC-42]] — §3's "a branch on which level a row
 * belongs to", §9's "an invite that inserts rather than updates", §5's "an
 * entitlement row created for every member and revoked for none" — so they are
 * asserted against D1 rather than against a return value.
 */

const PLATFORM = 'req186-platform'
const TEAM = 'https://req186-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)

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
  const header = { alg: 'RS256', kid: 'req186-key', typ: 'JWT' }
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
const anEmail = (): string => `req186-${(seq += 1)}@example.test`

/** An account of 1st Contact who has also accepted the terms — setup, not a claim. */
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

/** POST the invite, optionally naming a business in the path ([[REQ-179]]'s prefix). */
const postInvite = async (
  token: string | null,
  body: unknown,
  businessId: string | null = null,
): Promise<Response> =>
  worker.fetch(
    new Request(
      `https://app.example${businessId ? `/b/${businessId}` : ''}${PERSON_INVITE_PATH}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { 'cf-access-jwt-assertion': token } : {}),
        },
        body: JSON.stringify(body),
      },
    ),
    workerEnv(),
  )

const getPeople = async (token: string, businessId: string | null = null): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${businessId ? `/b/${businessId}` : ''}${PEOPLE_PATH}`, {
      headers: { 'cf-access-jwt-assertion': token },
    }),
    workerEnv(),
  )

const rowsFor = async (tenantId: string, email: string) => {
  const { results } = await env.DB.prepare(
    'SELECT id, tenant_id, email, status, display_name, invited_at FROM users ' +
      'WHERE tenant_id = ? AND email = ?',
  )
    .bind(tenantId, email)
    .all<{
      id: string
      tenant_id: string
      email: string
      status: string
      display_name: string | null
      invited_at: string | null
    }>()
  return results ?? []
}

/** A contact: known to a business, never invited, and MAY become a member. */
async function addContact(tenantId: string, email: string, displayName: string | null = null) {
  const id = `usr_contact_${(seq += 1)}`
  const now = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, display_name, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, tenantId, email, 'active', displayName, now, now)
    .run()
  return id
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
  jwks = { keys: [{ ...jwk, kid: 'req186-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-186 — one control, both levels', () => {
  it('test_UAT_FC_REQ-186_an_invited_person_appears_in_that_business', async () => {
    // The acceptance in its plainest form: press the button, and the person is
    // in the tab. Asserted through `peopleOf` — the function the tab reads —
    // rather than by reading `users` back, because what the ticket owes is a
    // person who SHOWS UP, and the pipeline stage is what says where they stand
    // ([[DOC-44]] §3, §4, [[REQ-188]]).
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")
    const invitee = anEmail()

    const response = await postInvite(await mint(owner), { email: invitee }, account.businessId)
    expect(response.status).toBe(200)
    expect((await response.json<{ created: boolean }>()).created).toBe(true)

    const listed = await peopleOf(identityEnv(), { businessId: account.businessId })
    const them = listed.find((p) => p.email === invitee)
    expect(them, 'the invited person is not in the business they were invited to').toBeTruthy()
    expect(them?.pipelineStage, 'the invite left them at the stage before it').toBe('invited')
    expect(them?.invitedAt, 'the invite recorded no time for the act it performed').toBeTruthy()
    // AND NOT AS A MEMBER ([[REQ-188]]): the invite moves the pipeline axis, and
    // nothing it writes can record that they came.
    expect(them?.termsAcceptedAt, 'the invite made a member out of nobody').toBeNull()
    // `active` is the login control ([[DOC-42]] §5). An invite that left it unset
    // would produce a member refused `user_inactive` by the door it opened.
    expect(them?.status).toBe('active')
  })

  it('test_UAT_FC_REQ-186_the_same_invite_from_two_businesses_differs_only_in_tenant_id', async () => {
    // [[DOC-42]] §3's falsifier, as a test: a level is a POSITION and not a
    // property, so there must be no `level` column and no branch on which level a
    // row belongs to. Alice is made by inviting from 1st Contact and Bob by
    // inviting from Alice's business; the two rows are compared field by field
    // with `tenant_id` and the opaque id lifted out, and anything else that
    // differed would be the branch this ticket exists not to have.
    const alice = anEmail()
    const bob = anEmail()
    const account = await anAccount(anEmail(), "Alice's Plumbing")

    await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: alice })
    await invitePerson(identityEnv(), { businessId: account.businessId }, { email: bob })

    const [aliceRow] = await rowsFor(PLATFORM, alice)
    const [bobRow] = await rowsFor(account.businessId, bob)
    expect(aliceRow.tenant_id).toBe(PLATFORM)
    expect(bobRow.tenant_id).toBe(account.businessId)
    expect(aliceRow.tenant_id).not.toBe(bobRow.tenant_id)

    // Everything else about the two rows is the same shape.
    const shape = (row: typeof aliceRow) => ({
      status: row.status,
      displayName: row.display_name,
      invited: row.invited_at !== null,
      id: /^usr_[0-9a-f]{32}$/.test(row.id),
    })
    expect(shape(bobRow)).toEqual(shape(aliceRow))

    // AND THE SCHEMA CARRIES NO LEVEL TO BRANCH ON. Read from the database rather
    // than asserted about the migration text, so a column added later is caught.
    const { results } = await env.DB.prepare('PRAGMA table_info(users)').all<{ name: string }>()
    const columns = (results ?? []).map((c) => c.name)
    expect(columns).not.toContain('level')
    expect(columns.filter((c) => c.includes('level'))).toEqual([])
  })

  it('test_UAT_FC_REQ-186_a_level_two_member_reaches_no_business_of_ours', async () => {
    // Bob is a row in Alice's business and nothing of ours. The barrier is what
    // `peopleOf` reads, so this asserts the pair: he is in HER list and not in
    // 1st Contact's — which is the same claim as "the two paths differ only in
    // tenant_id", from the reading side.
    const account = await anAccount(anEmail(), "Alice's Plumbing")
    const bob = anEmail()
    await invitePerson(identityEnv(), { businessId: account.businessId }, { email: bob })

    const hers = await peopleOf(identityEnv(), { businessId: account.businessId })
    expect(hers.map((p) => p.email)).toContain(bob)
    const ours = await peopleOf(identityEnv(), { businessId: PLATFORM })
    expect(ours.map((p) => p.email)).not.toContain(bob)
  })
})

describe('REQ-186 — a transition, not a creation', () => {
  it('test_UAT_FC_REQ-186_inviting_a_known_contact_updates_one_row_and_inserts_none', async () => {
    // [[DOC-42]] §9's own falsifier: *"an invite that inserts rather than
    // updates"*. The failure it names is a captured contact who is later invited
    // becoming a SECOND row with the same address — the exact case [[DOC-40]]
    // cites as the reason contacts and users are one table. From then on the CRM
    // and the User tab can disagree about a person who is both.
    const account = await anAccount(anEmail(), "Alice's Plumbing")
    const email = anEmail()
    const contactId = await addContact(account.businessId, email)

    const before = await rowsFor(account.businessId, email)
    expect(before).toHaveLength(1)
    expect(before[0].invited_at, 'a contact has not been invited').toBeNull()

    const outcome = await invitePerson(identityEnv(), { businessId: account.businessId }, { email })

    expect(outcome.created, 'a contact promoted is not a creation').toBe(false)
    const after = await rowsFor(account.businessId, email)
    expect(after, 'the invite inserted a second row for one address').toHaveLength(1)
    expect(after[0].id, 'the invite replaced the row rather than moving it').toBe(contactId)
    expect(after[0].invited_at, 'the transition did not stamp the row').toBeTruthy()
  })

  it('test_UAT_FC_REQ-186_a_differently_cased_address_is_the_same_person', async () => {
    // `idx_users_tenant_email` is byte-exact, which is what `0005` records: a
    // differently-cased row is a second person `admit` — which normalises — would
    // never find. So the address is casefolded on the way in and the second
    // invite finds the first one's row.
    const account = await anAccount(anEmail(), "Alice's Plumbing")
    const email = anEmail()

    const first = await invitePerson(identityEnv(), { businessId: account.businessId }, { email })
    const again = await invitePerson(
      identityEnv(),
      { businessId: account.businessId },
      { email: `  ${email.toUpperCase()} ` },
    )

    expect(again.created).toBe(false)
    expect(again.person.id).toBe(first.person.id)
    expect(await rowsFor(account.businessId, email)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-186_re_inviting_a_member_does_not_restamp_when_they_were_invited', async () => {
    // `invited_at` records WHEN this person was invited. Overwriting it on a
    // second press would falsify the one fact in the row the invite exists to
    // write — and a name somebody already set would go the same way, which is
    // [[REQ-183]] §5's surface and not this one's.
    const account = await anAccount(anEmail(), "Alice's Plumbing")
    const email = anEmail()
    const first = await invitePerson(
      identityEnv(),
      { businessId: account.businessId },
      { email, displayName: 'Bob Smith' },
    )

    const again = await invitePerson(
      identityEnv(),
      { businessId: account.businessId },
      { email, displayName: 'Robert Smith' },
    )

    expect(again.created).toBe(false)
    expect(again.person.invitedAt).toBe(first.person.invitedAt)
    expect(again.person.displayName).toBe('Bob Smith')
  })

  it('test_UAT_FC_REQ-186_an_invite_with_no_address_is_refused_as_the_callers_mistake', async () => {
    // 400 and not the 500 a thrown error would otherwise become — an empty box is
    // the operator's mistake, and reporting it as "the builder broke" tells them
    // to retry the thing that cannot work.
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")

    const response = await postInvite(await mint(owner), { email: '   ' }, account.businessId)
    expect(response.status).toBe(400)
  })
})

describe('REQ-186 — who may invite', () => {
  it('test_UAT_FC_REQ-186_an_owner_invites_into_their_own_business', async () => {
    // [[DOC-42]] §7 condition 1 ALONE — *you are an owner of this business* —
    // which is uniform and true of Alice on hers. This case is the one that would
    // fail if the fulfilment gate were reused, because Alice owns no membership
    // on the 1st Contact business at all.
    stubJwks()
    const alice = anEmail()
    const account = await anAccount(alice, "Alice's Plumbing")
    // Stated rather than assumed: Alice owns HERS and holds nothing at all on
    // 1st Contact's, which is the whole reason the fulfilment gate cannot serve
    // here.
    const admitted = await admit(identityEnv(), alice)
    expect(admitted.ok && admitted.businesses.map((b) => b.businessId)).toEqual([
      account.businessId,
    ])

    const response = await postInvite(await mint(alice), { email: anEmail() }, account.businessId)
    expect(response.status).toBe(200)
  })

  it('test_UAT_FC_REQ-186_an_owner_may_not_invite_into_a_business_they_do_not_own', async () => {
    // The other half, and it is the ticket's guard against the gate drifting onto
    // `ownsPlatformBusiness`: Alice owns hers and may not invite into 1st
    // Contact's. `resolveScope` refuses a business she holds no membership on
    // before the route is reached, so the refusal arrives as a scope refusal —
    // which is the same 403 and the same reason, arriving one frame earlier.
    stubJwks()
    const alice = anEmail()
    await anAccount(alice, "Alice's Plumbing")
    const before = await rowsFor(PLATFORM, 'req186-notinvited@example.test')

    const response = await postInvite(
      await mint(alice),
      { email: 'req186-notinvited@example.test' },
      PLATFORM,
    )

    expect(response.status).toBe(403)
    expect(await rowsFor(PLATFORM, 'req186-notinvited@example.test')).toHaveLength(before.length)
  })

  it('test_UAT_FC_REQ-186_a_member_who_owns_nothing_here_is_refused_403', async () => {
    // The gate, in isolation from the scope resolver. This caller is an owner of
    // 1st Contact — so `resolveScope` opens the business for them — and is then
    // refused for the one business they can reach but do not own, which is the
    // case `ownsBusiness` and nothing upstream of it decides.
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const someoneElse = await anAccount(anEmail(), 'Not Theirs')
    // `platform_operator` opens a business you hold no membership on ([[DOC-42]]
    // §8) — and it must not thereby make you its owner, which is why the invite
    // is still refused here.
    const response = await postInvite(
      await mint(operatorEmail),
      { email: anEmail() },
      someoneElse.businessId,
    )

    expect(response.status).toBe(403)
    expect((await response.json<{ error: string }>()).error).toContain('owner')
  })

  it('test_UAT_FC_REQ-186_the_loopback_path_may_not_create_people', async () => {
    // The dev-open branch skips Access and `admit` entirely, so there is nobody
    // there to own anything. A door onto creating people that opens only when
    // authentication is switched off is a shape that reads as a feature and would
    // eventually be relied upon — the same argument `/api/admin/businesses`
    // makes for itself.
    const email = anEmail()
    const response = await worker.fetch(
      new Request(`https://app.example${PERSON_INVITE_PATH}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      }),
      workerEnv({ ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }),
    )

    expect(response.status).toBe(403)
    expect(await rowsFor(PLATFORM, email)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-186_the_list_reports_who_may_invite_separately_from_who_may_fulfil', async () => {
    // Two flags because they are two conditions ([[DOC-42]] §7). `canInvite` is
    // *you own this business*, true of every owner; `canFulfil` adds *this
    // business's product is businesses*, true only of ours. Collapsing them is
    // what would gate the invite on being 1st Contact.
    stubJwks()
    const alice = anEmail()
    const account = await anAccount(alice, "Alice's Plumbing")

    const hers = await (
      await getPeople(await mint(alice), account.businessId)
    ).json<{ canInvite: boolean; canFulfil: boolean }>()
    expect(hers.canInvite, 'Alice may invite into her own business').toBe(true)
    expect(hers.canFulfil, 'Alice may not provision businesses').toBe(false)

    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const ours = await (
      await getPeople(await mint(operatorEmail), PLATFORM)
    ).json<{ canInvite: boolean; canFulfil: boolean }>()
    expect(ours.canInvite).toBe(true)
    expect(ours.canFulfil).toBe(true)
  })
})

describe('REQ-186 — the invite writes no entitlement', () => {
  it('test_UAT_FC_REQ-186_an_invited_person_holds_no_grant_and_no_membership', async () => {
    // [[DOC-42]] §5's falsifier — *"an entitlement row created for every member
    // and revoked for none"*. The Portal is what membership IS: an invited person
    // reaches their own payments, details and delete button by virtue of holding a
    // row at all. A grant that CAN be absent produces somebody who can sign in and
    // cannot reach their own erasure control ([[DOC-37]]).
    const account = await anAccount(anEmail(), "Alice's Plumbing")
    const bob = anEmail()

    const before = await env.DB.prepare('SELECT COUNT(*) AS n FROM entitlements').first<{
      n: number
    }>()
    const invited = await invitePerson(
      identityEnv(),
      { businessId: account.businessId },
      { email: bob },
    )
    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM entitlements').first<{
      n: number
    }>()
    expect(after?.n, 'the invite wrote an entitlement').toBe(before?.n)

    // Nor a membership: that is the right to RUN a business, which is a different
    // act and usually a different business ([[DOC-42]] §4).
    const membership = await env.DB.prepare('SELECT id FROM memberships WHERE user_id = ?')
      .bind(invited.person.id)
      .first<{ id: string }>()
    expect(membership).toBeNull()
  })

  it('test_UAT_FC_REQ-186_access_to_the_app_is_the_business_it_is_composed_with', async () => {
    // The [[DOC-42]] §1 sequence: invite Alice, provision her a business, and
    // Alice reaches exactly one business — hers — and nothing of ours. That is
    // `provisionInvite` decomposed into the two steps §9 describes, and this
    // asserts the composition rather than the halves.
    const alice = anEmail()
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: alice })

    // INVITED AND NO MORE IS `no_membership`, and that is the composition being
    // load-bearing rather than a gap in it. `admit` requires a relationship with
    // something, and an invite deliberately writes none ([[DOC-42]] §5) — so the
    // invite alone makes the member, and the business is what makes the app
    // reachable. Getting only one of the two is a visible, nameable state.
    const bare = await admit(identityEnv(), alice)
    expect(bare.ok).toBe(false)
    expect(bare.ok === false && bare.reason).toBe('no_membership')

    const business = await provisionBusiness(identityEnv(), {
      accountUserId: invited.person.id,
      name: "Alice's Plumbing",
      email: alice,
    })

    const admitted = await admit(identityEnv(), alice)
    expect(admitted.ok).toBe(true)
    if (!admitted.ok) throw new Error('unreachable')
    expect(admitted.businesses.map((b) => b.businessId)).toEqual([business.businessId])
    expect(admitted.businesses[0].selectable).toBe(true)
    expect(admitted.businesses[0].role).toBe('owner')
  })
})
