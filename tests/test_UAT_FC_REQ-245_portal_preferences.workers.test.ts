import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { ACCEPTANCES_PATH } from '../apps/control-app/src/router'
import { acceptTerms } from '../apps/control-app/src/terms'
import { ACCEPTANCE_TYPE, recordAcceptance } from '../apps/control-app/src/acceptances'
import {
  BETA_REQUESTED,
  NEWSLETTER,
  T_AND_C_ACCEPTED,
  WHITEPAPERS,
} from '../apps/control-app/src/builder/acceptances.js'
import {
  ACCEPTANCE_GRANTED,
  ACCEPTANCE_WITHDRAWN,
} from '../apps/control-app/src/builder/contact-events.js'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-245]] — **the portal's endpoint: what a contact is shown, and the one
 * thing they may change**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the WORKER'S OWN `fetch` — the
 * deployed entry point, with a real RS256 Access token verified against a real
 * JWKS, inside workerd against real D1 with the deployed schema. The node-side
 * sibling proves the surface; this proves the four things only a real request
 * can show: that the list is the business's own definitions, that the write
 * lands as state AND as history, that everything the portal must not do is
 * refused, and that a contact reaches nobody's answers but their own.
 *
 * THE FIVE CLAIMS:
 *
 *   1. THE LIST IS THE BUSINESS'S. What appears is what the business turned on,
 *      labelled by its own definition — and turning a new one on makes it appear
 *      with no code edited anywhere.
 *   2. A PREFERENCE GOES BOTH WAYS, and both directions survive as distinct rows
 *      in the event log, carrying the wording the contact was shown.
 *   3. THE OTHER TWO TYPES ARE SHOWN AND REFUSED. A document acceptance and a
 *      request are visible, carry no control, and no request the client can make
 *      changes either — asserted by attempting it.
 *   4. THE CONTRACT HOLDS EVERYWHERE ELSE. The account, its memberships and its
 *      grants are unchanged after the portal has been used, and there is nothing
 *      on this route that could change them.
 *   5. IT ANSWERS ABOUT THE CALLER AND NOBODY ELSE.
 */

const PLATFORM = 'req245-platform'
/**
 * A SECOND BUSINESS, which has turned nothing on.
 *
 * A definition is a ticket in the business's OWN store ([[REQ-240]] §3), so the
 * only honest way to ask "what does the portal do about a preference nobody
 * defined" is to ask it somewhere nothing is defined.
 */
const OTHER = 'req245-other-platform'
const TEAM = 'https://req245-team.cloudflareaccess.com'
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
    ASSETS: { fetch: async () => new Response('asset', { status: 404 }) } as unknown as Fetcher,
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
  const header = { alg: 'RS256', kid: 'req245-key', typ: 'JWT' }
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
const anEmail = (): string => `req245-${(seq += 1)}@example.test`

/** An account that has also accepted the terms — otherwise every route is the interstitial. */
async function accountIn(platform: string): Promise<{ email: string; userId: string }> {
  const envFor = identityEnv({ TENANT_ID: platform })
  const email = anEmail()
  const result = await inviteAccount(envFor, { email, accountName: 'Salon', endsAt: null })
  await acceptTerms(envFor, result.user.id)
  return { email, userId: result.user.id }
}

const account = (): Promise<{ email: string; userId: string }> => accountIn(PLATFORM)

const store = (): Promise<TicketStore> =>
  ticketStoreFor(workerEnv() as unknown as Parameters<typeof ticketStoreFor>[0], {
    businessId: PLATFORM,
  })

/**
 * TURN AN ACCEPTANCE ON — which is writing its definition, and nothing else.
 *
 * There is deliberately no second act. [[REQ-245]] §3: the definitions ARE the
 * answer to which acceptances a business holds, so "turned on" and "has a
 * definition" are the same sentence, and this helper is the whole mechanism
 * rather than a fixture standing in for one.
 */
async function turnOn(key: string, title: string, wording: string): Promise<string> {
  const { ticket } = await (await store()).create({
    type: ACCEPTANCE_TYPE,
    title,
    fields: { acceptance_key: key },
    body: wording,
  })
  return ticket.uid
}

const askIn = async (
  token: string,
  platform: string,
  init: RequestInit = {},
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${ACCEPTANCES_PATH}`, {
      ...init,
      headers: { 'cf-access-jwt-assertion': token, ...(init.headers ?? {}) },
    }),
    workerEnv({ TENANT_ID: platform }),
  )

const ask = (token: string, init: RequestInit = {}): Promise<Response> =>
  askIn(token, PLATFORM, init)

const postIn = (token: string, platform: string, body: unknown): Promise<Response> =>
  askIn(token, platform, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })

const post = (token: string, body: unknown): Promise<Response> =>
  postIn(token, PLATFORM, body)

interface Entry {
  key: string
  label: string
  wording: string
  editable: boolean
  historic: boolean
  granted: boolean | null
  since: string | null
  outstanding: boolean
}

async function listedIn(token: string, platform: string): Promise<Entry[]> {
  const response = await askIn(token, platform)
  expect(response.status).toBe(200)
  return ((await response.json()) as { acceptances: Entry[] }).acceptances
}

const listed = (token: string): Promise<Entry[]> => listedIn(token, PLATFORM)

const find = (entries: Entry[], key: string): Entry | undefined =>
  entries.find((e) => e.key === key)

/** Every acceptance event this contact holds, newest first. */
async function eventKinds(contactId: string): Promise<string[]> {
  const { results } = await env.DB.prepare(
    "SELECT kind FROM contact_events WHERE contact_id = ? AND kind LIKE 'acceptance.%' " +
      'ORDER BY occurred_at ASC, rowid ASC',
  )
    .bind(contactId)
    .all<{ kind: string }>()
  return (results ?? []).map((r) => r.kind)
}

/** The rows that must survive a visit ([[REQ-183]] §4.1, [[REQ-245]] §5.6). */
async function footprint(userId: string): Promise<Record<string, number>> {
  const count = async (sql: string): Promise<number> =>
    (await env.DB.prepare(sql).bind(userId).first<{ n: number }>())?.n ?? 0
  return {
    memberships: await count('SELECT COUNT(*) AS n FROM memberships WHERE user_id = ?'),
    entitlements: await count(
      'SELECT COUNT(*) AS n FROM entitlements WHERE business_id IN ' +
        '(SELECT business_id FROM memberships WHERE user_id = ?)',
    ),
    users: await count('SELECT COUNT(*) AS n FROM users WHERE id = ?'),
    operator: await count('SELECT COUNT(*) AS n FROM users WHERE id = ? AND platform_operator = 1'),
  }
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
  jwks = { keys: [{ ...jwk, kid: 'req245-key', alg: 'RS256', use: 'sig' }] }
  await turnOn(NEWSLETTER, 'Newsletter', 'Send me occasional news and offers.')
  await turnOn(T_AND_C_ACCEPTED, 'Terms and conditions', 'The terms of using this service.')
  await turnOn(WHITEPAPERS, 'The papers', 'Send me the papers.')
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-245 — the preferences appear on their own', () => {
  it('test_UAT_FC_REQ-245_a_contact_sees_what_their_business_turned_on_in_its_own_words', async () => {
    // §3 and AC1. The list is the business's own definitions, labelled by the
    // definition's wording — not by a roster in the module, not by the operator's
    // phrase for the key. A business supplying its real copy is authoring a
    // ticket, which is what makes it a change without a deploy.
    stubJwks()
    const { email } = await account()
    const entries = await listed(await mint(email))

    expect(entries.map((e) => e.key)).toEqual([T_AND_C_ACCEPTED, NEWSLETTER, WHITEPAPERS])
    expect(find(entries, NEWSLETTER)?.label).toBe('Newsletter')
    expect(find(entries, NEWSLETTER)?.wording).toBe('Send me occasional news and offers.')
    // Nobody has put the newsletter question to this person, which is not the
    // same fact as a refusal and is not reported as one.
    expect(find(entries, NEWSLETTER)?.granted).toBeNull()
  })

  it('test_UAT_FC_REQ-245_turning_on_a_new_preference_makes_it_appear', async () => {
    // AC5. `beta_requested` is declared and this business has never defined it,
    // so it is absent; writing its definition is the whole of turning it on, and
    // nothing in the module, the endpoint or the page is edited to see it.
    stubJwks()
    const { email } = await account()
    const token = await mint(email)
    expect(find(await listed(token), BETA_REQUESTED)).toBeUndefined()

    await turnOn(BETA_REQUESTED, 'The beta', 'I would like to be considered for the beta.')

    const after = find(await listed(token), BETA_REQUESTED)
    expect(after?.label).toBe('The beta')
    expect(after?.editable).toBe(true)
  })

  it('test_UAT_FC_REQ-245_the_newest_definition_is_the_one_in_force', async () => {
    // [[REQ-240]] §3's rule, applied to the whole set: replacing a definition is
    // a WRITE and not an edit, so a record written last month still points at the
    // ticket that said what it said, and the portal shows today's words.
    stubJwks()
    const { email } = await account()
    // D1 stamps `created_at` to the millisecond, so "newest" needs a real gap.
    await new Promise((r) => setTimeout(r, 5))
    await turnOn(NEWSLETTER, 'Newsletter', 'We send one email a month. No more.')

    expect(find(await listed(await mint(email)), NEWSLETTER)?.wording).toBe(
      'We send one email a month. No more.',
    )
  })
})

describe('REQ-245 — a preference is the contact’s to set and unset', () => {
  it('test_UAT_FC_REQ-245_a_preference_goes_both_ways_and_each_way_is_recorded', async () => {
    // AC2. Both directions are facts and both are recorded as DISTINCT kinds — an
    // untouched box today is not the same fact as a withdrawal last week, and a
    // log that said "changed" would have lost the thing it was for.
    stubJwks()
    const { email, userId } = await account()
    const token = await mint(email)

    const on = await post(token, { key: NEWSLETTER, granted: true })
    expect(on.status).toBe(200)
    expect(((await on.json()) as { acceptance: Entry }).acceptance.granted).toBe(true)

    const off = await post(token, { key: NEWSLETTER, granted: false })
    expect(off.status).toBe(200)
    expect(((await off.json()) as { acceptance: Entry }).acceptance.granted).toBe(false)

    const again = await post(token, { key: NEWSLETTER, granted: true })
    expect(again.status).toBe(200)

    // The state reads the latest; all three transitions survive as their own rows.
    expect(find(await listed(token), NEWSLETTER)?.granted).toBe(true)
    expect(await eventKinds(userId)).toEqual([
      ACCEPTANCE_GRANTED,
      ACCEPTANCE_WITHDRAWN,
      ACCEPTANCE_GRANTED,
    ])
  })

  it('test_UAT_FC_REQ-245_the_event_carries_the_wording_the_business_wrote', async () => {
    // [[REQ-240]] §5. The evidence of what somebody was shown is read from the
    // business's own definition at the moment of the write — never supplied by
    // the caller, which is the one field on this wire worth forging.
    stubJwks()
    const { email, userId } = await account()
    const token = await mint(email)
    await post(token, { key: NEWSLETTER, granted: true, wording: 'I agree to anything' })

    const row = await env.DB.prepare(
      'SELECT detail FROM contact_events WHERE contact_id = ? AND kind = ? LIMIT 1',
    )
      .bind(userId, ACCEPTANCE_GRANTED)
      .first<{ detail: string }>()
    const detail = JSON.parse(row?.detail ?? '{}') as { wording?: string }
    expect(detail.wording).toBe('We send one email a month. No more.')
    expect(detail.wording).not.toBe('I agree to anything')
  })

  it('test_UAT_FC_REQ-245_a_direction_that_was_not_stated_is_refused', async () => {
    // Both directions are facts, so neither is what a missing value falls back
    // to: guessing would record a withdrawal nobody asked for as readily as a
    // grant.
    stubJwks()
    const { email, userId } = await account()
    const response = await post(await mint(email), { key: NEWSLETTER })
    expect(response.status).toBe(400)
    expect(await eventKinds(userId)).toEqual([])
  })

  it('test_UAT_FC_REQ-245_a_preference_the_business_has_not_turned_on_is_refused', async () => {
    // There would be no wording to record, so the transition could never be
    // evidenced — and a business that has not defined a preference has shown
    // nobody a sentence about it.
    //
    // IT IS ASKED OF A SECOND BUSINESS, which is the honest way to ask it: the
    // definitions are read from the contact's OWN store ([[REQ-240]] §3, AC8), so
    // a key the first business turned on is still unturned in the second, and
    // "not defined here" is what the refusal is actually about.
    stubJwks()
    const other = await accountIn(OTHER)
    const token = await mint(other.email)

    expect(await listedIn(token, OTHER)).toEqual([])
    const response = await postIn(token, OTHER, { key: NEWSLETTER, granted: true })
    expect([403, 404]).toContain(response.status)
    expect(await eventKinds(other.userId)).toEqual([])
  })
})

describe('REQ-245 — the other two types are shown and refused', () => {
  it('test_UAT_FC_REQ-245_a_document_is_shown_with_no_control_and_cannot_be_changed', async () => {
    // AC3. Both directions are attempted: withdrawing a document is not a state
    // this system can represent honestly, and granting one from here would be an
    // acceptance with nothing to say which document was agreed to.
    stubJwks()
    const { email, userId } = await account()
    const token = await mint(email)

    const shown = find(await listed(token), T_AND_C_ACCEPTED)
    expect(shown).toBeDefined()
    expect(shown?.editable).toBe(false)

    for (const granted of [true, false]) {
      const response = await post(token, { key: T_AND_C_ACCEPTED, granted })
      expect(response.status).toBe(403)
    }
    // Nothing was written either way — not the state, not the history.
    expect(await eventKinds(userId)).toEqual([])
    expect(find(await listed(token), T_AND_C_ACCEPTED)?.granted).toBeNull()
  })

  it('test_UAT_FC_REQ-245_a_request_is_shown_as_history_and_cannot_be_changed', async () => {
    // AC4. A request has no state row at all, so what the portal shows is the
    // event: they asked, and when. There is nothing to revoke, and asking to is
    // refused.
    stubJwks()
    const { email, userId } = await account()
    const token = await mint(email)
    await recordAcceptance(
      { DB: env.DB as D1Database },
      {
        contactId: userId,
        key: WHITEPAPERS,
        granted: true,
        wording: 'Send me the papers.',
        occurredAt: '2026-05-01T09:00:00.000Z',
      },
    )

    const shown = find(await listed(token), WHITEPAPERS)
    expect(shown?.editable).toBe(false)
    expect(shown?.historic).toBe(true)
    expect(shown?.granted).toBe(true)
    expect(shown?.since).toBe('2026-05-01T09:00:00.000Z')

    expect((await post(token, { key: WHITEPAPERS, granted: false })).status).toBe(403)
    expect((await post(token, { key: WHITEPAPERS, granted: true })).status).toBe(403)
    // The one event is the one the fixture wrote; the portal added none.
    const { results } = await env.DB.prepare(
      "SELECT kind FROM contact_events WHERE contact_id = ? AND kind LIKE 'acceptance.%'",
    )
      .bind(userId)
      .all<{ kind: string }>()
    expect(results).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-245_a_key_nobody_declares_is_refused', async () => {
    stubJwks()
    const { email } = await account()
    const response = await post(await mint(email), { key: 'free_pony', granted: true })
    expect(response.status).toBe(400)
  })
})

describe('REQ-245 — the contract holds everywhere except the one opening', () => {
  it('test_UAT_FC_REQ-245_the_portal_grants_nothing_and_destroys_nothing', async () => {
    // AC6. The whole of what this route can do is move a preference, and the rows
    // that decide access — the person, their memberships, their grants, the
    // operator flag — are compared before and after a write that succeeded. A
    // later hand wiring an entitlement onto this route has to fail this.
    stubJwks()
    const { email, userId } = await account()
    const token = await mint(email)
    const before = await footprint(userId)
    expect(before.memberships).toBeGreaterThan(0)

    expect((await post(token, { key: NEWSLETTER, granted: true })).status).toBe(200)

    expect(await footprint(userId)).toEqual(before)
  })

  it('test_UAT_FC_REQ-245_no_verb_but_the_two_the_module_makes_is_answered', async () => {
    // The route table is the other end of the client's bound: there is a read and
    // a write, and no method on this path a later hand could hang a destructive
    // action off without changing this.
    stubJwks()
    const { email } = await account()
    const token = await mint(email)
    for (const method of ['DELETE', 'PUT', 'PATCH']) {
      const response = await ask(token, { method })
      expect(response.status).not.toBe(200)
    }
  })

  it('test_UAT_FC_REQ-245_nobody_signed_in_reaches_nothing', async () => {
    // A configured tenant id is a business, not a person. There is no contact on
    // a deployment with no identity, and answering about "whoever the deployment
    // is configured as" would be answering about somebody.
    const response = await worker.fetch(
      new Request(`https://app.example${ACCEPTANCES_PATH}`),
      workerEnv({ ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }),
    )
    expect(response.status).not.toBe(200)
  })
})

describe('REQ-245 — a contact reaches their own answers and nobody else’s', () => {
  it('test_UAT_FC_REQ-245_a_contact_sees_only_their_own', async () => {
    // AC7, first half. Two people in one business, opposite answers on one key.
    stubJwks()
    const mine = await account()
    const theirs = await account()
    const myToken = await mint(mine.email)
    const theirToken = await mint(theirs.email)

    expect((await post(myToken, { key: NEWSLETTER, granted: true })).status).toBe(200)
    expect((await post(theirToken, { key: NEWSLETTER, granted: false })).status).toBe(200)

    expect(find(await listed(myToken), NEWSLETTER)?.granted).toBe(true)
    expect(find(await listed(theirToken), NEWSLETTER)?.granted).toBe(false)
  })

  it('test_UAT_FC_REQ-245_a_request_naming_another_contact_is_refused', async () => {
    // AC7, second half. The contact is read off the session, and a body naming a
    // different one is REFUSED rather than ignored: somebody who believed they
    // had written to another person must be told they did not.
    stubJwks()
    const mine = await account()
    const theirs = await account()
    const myToken = await mint(mine.email)

    const response = await post(myToken, {
      key: NEWSLETTER,
      granted: true,
      contactId: theirs.userId,
    })
    expect(response.status).toBe(403)
    // And nothing landed on either of them.
    expect(await eventKinds(theirs.userId)).toEqual([])
    expect(await eventKinds(mine.userId)).toEqual([])
  })
})
