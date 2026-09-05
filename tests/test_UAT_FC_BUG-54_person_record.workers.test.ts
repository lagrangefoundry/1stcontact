import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, findAccount, type IdentityEnv } from '../apps/control-app/src/identity'
import { invitePerson, peopleOf } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PERSON_RECORD_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * BUG-54 — **correcting who somebody is, and what that write may not touch**.
 *
 * WHAT THIS FILE PROVES, next to its browser sibling. That one proves the panel
 * offers the two fields and sends what is typed; this one proves the origin is
 * the authority — that a malformed address is refused even when nothing in a
 * browser checked it, that an address is casefolded so `admit` can still find
 * the person afterwards, that the index refusing a duplicate becomes a sentence
 * rather than a 500, and that the gate is *you own this business* and not *you
 * are 1st Contact*.
 *
 * IT DRIVES THE DEPLOYED `fetch` INSIDE WORKERD, against a real D1 with the
 * deployed schema and a real RS256 Access token verified against a real JWKS.
 * Calling `setPersonRecord` with a scope the suite built itself would prove the
 * SQL and say nothing about the authorisation — the half that can silently be
 * wrong, and the half [[DOC-42]] §7 is about.
 *
 * AND IT ASSERTS ON THE COLUMNS THAT DID NOT MOVE. The bug was a panel offering
 * to retype the record of what the system observed; locking the boxes is the
 * client half of the fix, and this is the other half — the route cannot write
 * `invited_at`, `tos_accepted_at`, `status` or `created_at` however it is
 * called, because the three states of the tab are derived from those and a
 * settable observation is not one.
 */

const PLATFORM = 'bug54-platform'
const TEAM = 'https://bug54-team.cloudflareaccess.com'
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
  const header = { alg: 'RS256', kid: 'bug54-key', typ: 'JWT' }
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
const anEmail = (): string => `bug54-${(seq += 1)}@example.test`

/** An account of 1st Contact who owns a business — setup, not a claim. */
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

const postRecord = async (
  token: string | null,
  body: unknown,
  businessId: string | null = null,
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${businessId ? `/b/${businessId}` : ''}${PERSON_RECORD_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

interface UserRowShape {
  id: string
  email: string
  display_name: string | null
  status: string
  invited_at: string | null
  tos_accepted_at: string | null
  created_at: string
}

const rowById = async (tenantId: string, id: string): Promise<UserRowShape> => {
  const row = await env.DB.prepare(
    'SELECT id, email, display_name, status, invited_at, tos_accepted_at, created_at ' +
      'FROM users WHERE tenant_id = ? AND id = ?',
  )
    .bind(tenantId, id)
    .first<UserRowShape>()
  if (!row) throw new Error(`no such row: ${id}`)
  return row
}

/**
 * An owner of a business, and one person in it to correct.
 *
 * A LEVEL-2 MEMBER DELIBERATELY. Bob is a row in Alice's business and nothing of
 * ours, so every case below is exercising the tab at the level [[DOC-42]] §7's
 * uniformity claim is actually about — not the one where our own operator flag
 * would have covered for a wrong gate.
 */
async function aBusinessWithSomebodyInIt() {
  const owner = anEmail()
  const account = await anAccount(owner, "Alice's Plumbing")
  const bob = anEmail()
  const invited = await invitePerson(
    identityEnv(),
    { businessId: account.businessId },
    { email: bob, displayName: 'Bob' },
  )
  return { owner, businessId: account.businessId, bob, personId: invited.person.id }
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
  jwks = { keys: [{ ...jwk, kid: 'bug54-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('BUG-54 — the correction lands', () => {
  it('test_UAT_FC_BUG-54_an_owner_corrects_an_address_and_a_name', async () => {
    // The acceptance in its plainest form. Asserted through `peopleOf` — the
    // function the tab reads — as well as against `users`, because what the
    // ticket owes is a correction the operator can SEE, and a row updated
    // beneath a list that still says the old thing is not one.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()

    const named = await postRecord(
      await mint(owner),
      { id: personId, displayName: 'Bob Smith' },
      businessId,
    )
    expect(named.status).toBe(200)
    const addressed = await postRecord(
      await mint(owner),
      { id: personId, email: 'bob.smith@example.test' },
      businessId,
    )
    expect(addressed.status).toBe(200)

    const row = await rowById(businessId, personId)
    expect(row.display_name).toBe('Bob Smith')
    expect(row.email).toBe('bob.smith@example.test')
    const listed = await peopleOf(identityEnv(), { businessId })
    const them = listed.find((p) => p.id === personId)
    expect(them?.email).toBe('bob.smith@example.test')
    expect(them?.displayName).toBe('Bob Smith')
  })

  it('test_UAT_FC_BUG-54_an_absent_key_leaves_that_field_alone', async () => {
    // A PATCH AND NOT A RECORD. The panel commits one field at a time, so a
    // route that treated the body as the whole row would write back whatever
    // stale copy the pane was holding for every field it was not asked about.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()

    const response = await postRecord(
      await mint(owner),
      { id: personId, email: 'renamed@example.test' },
      businessId,
    )

    expect(response.status).toBe(200)
    expect((await rowById(businessId, personId)).display_name).toBe('Bob')
  })

  it('test_UAT_FC_BUG-54_the_address_is_casefolded_so_the_front_door_still_finds_them', async () => {
    // `idx_users_tenant_email` is byte-exact, which is what `0005` records. This
    // is the write that most needs the fold: an invite at least starts from a
    // fresh row, whereas a correction stored as typed strands a person who was
    // signing in yesterday — `admit` normalises, and would no longer match.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()

    const response = await postRecord(
      await mint(owner),
      { id: personId, email: '  Bob.Smith@Example.TEST ' },
      businessId,
    )

    expect(response.status).toBe(200)
    expect((await rowById(businessId, personId)).email).toBe('bob.smith@example.test')
  })

  it('test_UAT_FC_BUG-54_the_record_of_what_happened_is_not_writable_by_this_route', async () => {
    // The server half of the locked fields. The tab's three states are derived
    // from `invited_at` and `tos_accepted_at` ([[DOC-42]] §4.1) and the login is
    // `status`; a route that let any of them be set by hand would make them
    // assertions rather than observations, whatever the panel chose to render.
    // Every one is sent, and every one must be ignored.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()
    const before = await rowById(businessId, personId)

    const response = await postRecord(
      await mint(owner),
      {
        id: personId,
        displayName: 'Bob Smith',
        status: 'suspended',
        invitedAt: '1999-01-01T00:00:00.000Z',
        termsAcceptedAt: '1999-01-01T00:00:00.000Z',
        firstSeenAt: '1999-01-01T00:00:00.000Z',
        lastSeenAt: '1999-01-01T00:00:00.000Z',
        createdAt: '1999-01-01T00:00:00.000Z',
        state: 'Member',
      },
      businessId,
    )

    expect(response.status).toBe(200)
    const after = await rowById(businessId, personId)
    expect(after.display_name).toBe('Bob Smith')
    expect(after.status).toBe(before.status)
    expect(after.invited_at).toBe(before.invited_at)
    expect(after.tos_accepted_at).toBe(before.tos_accepted_at)
    expect(after.created_at).toBe(before.created_at)
  })
})

describe('BUG-54 — the origin is the authority on an address', () => {
  const MALFORMED = [
    ['no separator at all', 'bob.example.test'],
    ['no dot in the domain', 'bob@example'],
    ['two addresses pasted together', 'bob@a.test@b.test'],
    ['an empty first label', 'bob@.test'],
    ['an empty last label', 'bob@example.'],
    ['no local part', '@example.test'],
    ['a space inside', 'bob smith@example.test'],
    ['nothing at all', '   '],
  ] as const

  for (const [why, typed] of MALFORMED) {
    it(`test_UAT_FC_BUG-54_a_malformed_address_is_refused_400_${why.replace(/\W+/g, '_')}`, async () => {
      // 400 AND NOT 500. The panel's inline check is feedback; this is the
      // refusal that counts, and it runs for anyone who reaches the route by
      // another means. Reported as "the builder broke" the operator would have
      // nothing to correct.
      stubJwks()
      const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()
      const before = await rowById(businessId, personId)

      const response = await postRecord(await mint(owner), { id: personId, email: typed }, businessId)

      expect(response.status, `"${typed}" was accepted`).toBe(400)
      expect((await response.json<{ error: string }>()).error).toMatch(/address/i)
      expect((await rowById(businessId, personId)).email).toBe(before.email)
    })
  }

  it('test_UAT_FC_BUG-54_an_address_somebody_here_already_holds_is_a_sentence_not_a_500', async () => {
    // Two people in one business holding one address is what the index exists to
    // prevent, so hitting it is an ordinary outcome of a typo. The operator is
    // told WHICH of their two 400s it is, because "that is not an address" and
    // "that address is taken" are corrected differently.
    stubJwks()
    const { owner, businessId, personId, bob } = await aBusinessWithSomebodyInIt()
    const other = anEmail()
    await invitePerson(identityEnv(), { businessId }, { email: other })

    const response = await postRecord(await mint(owner), { id: personId, email: other }, businessId)

    expect(response.status).toBe(400)
    expect((await response.json<{ error: string }>()).error).toMatch(/already has that address/i)
    expect((await rowById(businessId, personId)).email).toBe(bob)
  })

  it('test_UAT_FC_BUG-54_the_same_address_in_two_businesses_is_two_people', async () => {
    // The other side of the duplicate refusal, and the reason it must be scoped:
    // identity is decided by `(tenant_id, email)` ([[DOC-40]] "contacts are
    // users"), so one address in two businesses is two unrelated people. A
    // uniqueness check written across tenants would make one customer's contact
    // list constrain another's — a cross-tenant read where there must be none.
    stubJwks()
    const first = await aBusinessWithSomebodyInIt()
    const second = await aBusinessWithSomebodyInIt()
    const shared = anEmail()
    const took = await postRecord(
      await mint(first.owner),
      { id: first.personId, email: shared },
      first.businessId,
    )
    expect(took.status).toBe(200)

    const response = await postRecord(
      await mint(second.owner),
      { id: second.personId, email: shared },
      second.businessId,
    )

    expect(response.status).toBe(200)
    expect((await rowById(second.businessId, second.personId)).email).toBe(shared)
    expect((await rowById(first.businessId, first.personId)).email).toBe(shared)
  })
})

describe('BUG-54 — who may correct a record', () => {
  it('test_UAT_FC_BUG-54_an_owner_corrects_their_own_business_at_level_two', async () => {
    // [[DOC-42]] §7 condition 1 ALONE — *you are an owner of this business* —
    // which is uniform and true of Alice on hers. This is the case that fails if
    // the gate drifts onto `ownsPlatformBusiness`, because Alice holds no
    // membership on the 1st Contact business at all.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt()

    const response = await postRecord(
      await mint(owner),
      { id: personId, displayName: 'Bob Smith' },
      businessId,
    )

    expect(response.status).toBe(200)
  })

  it('test_UAT_FC_BUG-54_a_business_owner_may_not_reach_into_another_businesss_people', async () => {
    // The barrier, at the write. Alice owns hers and holds nothing on Carol's, so
    // the scope refuses her before the route is reached — the same 403 and the
    // same reason, one frame earlier.
    stubJwks()
    const alice = await aBusinessWithSomebodyInIt()
    const carol = await aBusinessWithSomebodyInIt()
    const before = await rowById(carol.businessId, carol.personId)

    const response = await postRecord(
      await mint(alice.owner),
      { id: carol.personId, email: 'stolen@example.test' },
      carol.businessId,
    )

    expect(response.status).toBe(403)
    expect((await rowById(carol.businessId, carol.personId)).email).toBe(before.email)
  })

  it('test_UAT_FC_BUG-54_someone_who_can_reach_a_business_but_does_not_own_it_is_refused_403', async () => {
    // The gate, in isolation from the scope resolver. This caller is an owner of
    // 1st Contact, so `platform_operator` opens a business they hold no
    // membership on ([[DOC-42]] §8) — and that hosting power must not thereby
    // make them its OWNER. Correcting somebody's address is the owner's act, so
    // reaching the business is not enough and this is the case only
    // `ownsBusiness` decides.
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const theirs = await aBusinessWithSomebodyInIt()

    const response = await postRecord(
      await mint(operatorEmail),
      { id: theirs.personId, displayName: 'Reached' },
      theirs.businessId,
    )

    expect(response.status).toBe(403)
    expect((await response.json<{ error: string }>()).error).toContain('owner')
    expect((await rowById(theirs.businessId, theirs.personId)).display_name).toBe('Bob')
  })

  it('test_UAT_FC_BUG-54_an_id_that_names_nobody_here_is_404_and_not_a_500', async () => {
    // The non-oracle rule `personDetail` already keeps: not found and not yours
    // must be the same answer, or the route tells a caller in one business
    // whether an id exists in another.
    stubJwks()
    const { owner, businessId } = await aBusinessWithSomebodyInIt()

    const response = await postRecord(
      await mint(owner),
      { id: 'usr_nobody', displayName: 'Nobody' },
      businessId,
    )

    expect(response.status).toBe(404)
  })

  it('test_UAT_FC_BUG-54_an_id_belonging_to_another_business_is_the_same_404', async () => {
    // The half of that rule which actually protects something. Alice names one of
    // Carol's people while standing in her OWN business, where her gate passes —
    // so this reaches `setPersonRecord`, which scopes by tenant AND id, and must
    // answer exactly as it did for an id that never existed.
    stubJwks()
    const alice = await aBusinessWithSomebodyInIt()
    const carol = await aBusinessWithSomebodyInIt()
    const before = await rowById(carol.businessId, carol.personId)

    const response = await postRecord(
      await mint(alice.owner),
      { id: carol.personId, displayName: 'Reached' },
      alice.businessId,
    )

    expect(response.status).toBe(404)
    expect((await rowById(carol.businessId, carol.personId)).display_name).toBe(before.display_name)
  })
})
