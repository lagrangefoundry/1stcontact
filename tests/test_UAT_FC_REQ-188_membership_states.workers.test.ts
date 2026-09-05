import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, findAccount, type IdentityEnv } from '../apps/control-app/src/identity'
import { peopleOf, type Person } from '../apps/control-app/src/people'
import { acceptTerms, TERMS_ACCEPT_PATH, TERMS_VERSION } from '../apps/control-app/src/terms'
import { PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import { stateOf } from '../apps/control-app/src/builder/people-state.js'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * REQ-188 — **a member is someone who has signed up, not someone we invited**.
 *
 * WHAT THIS FILE PROVES. The population has THREE states of one row, and the two
 * transitions between them are performed by two different parties: the operator
 * presses invite, and the person themselves accepts the terms. The old model had
 * two states and made `invited_at` the marker, which described what *we* did — so
 * pressing the button called somebody a member before they had ever arrived.
 *
 * WHAT MAKES IT EVIDENCE. Both transitions are driven through the deployed
 * `fetch` inside workerd, against a real D1 with the deployed migrations and a
 * real RS256 Access token verified against a real JWKS: the invite through
 * `POST /api/people/invite` and the acceptance through `POST /api/terms/accept`,
 * which is the route the interstitial's own button posts to. Nothing here stamps
 * `tos_accepted_at` by hand on the path under test, because the claim is that
 * SIGNING UP is what makes a member and a test that wrote the column itself would
 * prove only that the label reads a column.
 *
 * AND IT LABELS WITH THE SHIPPED DERIVATION. `stateOf` is imported from
 * `builder/people-state.js` — the same module the User tab draws its rows from —
 * so what is asserted is the state an operator would actually see, not a second
 * copy of the rule written in this file and free to agree with nothing.
 *
 * `admit` IS UNTOUCHED BY THIS TICKET. Everyone who accepts terms below reaches
 * the door holding an entitlement, because an invited-but-unentitled person is
 * refused at admission today — [[DOC-42]] §10.1's gap, which is a different
 * ticket and is deliberately not fixed here.
 */

const PLATFORM = 'req188-platform'
const TEAM = 'https://req188-team.cloudflareaccess.com'
const AUD = 'a'.repeat(64)

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
  const header = { alg: 'RS256', kid: 'req188-key', typ: 'JWT' }
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
const anEmail = (): string => `req188-${(seq += 1)}@example.test`

/** An owner of the 1st Contact business, seeded the way production seeds one. */
async function anOperator(email: string): Promise<string> {
  await ensurePlatformOperator(identityEnv(), email)
  const account = await findAccount(identityEnv(), email)
  if (!account) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), account.id)
  return account.id
}

/** A contact: known to a business, never invited, and MAY become a member. */
async function addContact(tenantId: string, email: string): Promise<string> {
  const id = `usr_contact_${(seq += 1)}`
  const now = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, tenantId, email, 'active', now, now)
    .run()
  return id
}

const postInvite = async (token: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${PERSON_INVITE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

const postAccept = async (token: string): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${TERMS_ACCEPT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
      body: JSON.stringify({ version: TERMS_VERSION }),
    }),
    workerEnv(),
  )

/** The state the tab would show for this address, read through the tab's own query. */
async function stateFor(email: string): Promise<string> {
  const people: Person[] = await peopleOf(identityEnv(), { businessId: PLATFORM })
  const them = people.find((p) => p.email === email)
  if (!them) throw new Error(`${email} is not in the business`)
  return stateOf(them)
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
  jwks = { keys: [{ ...jwk, kid: 'req188-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-188 — three states of one row', () => {
  it('test_UAT_FC_REQ-188_a_person_who_was_never_invited_is_a_contact', async () => {
    // The first state, and the one that has not moved: known here, never asked.
    const email = anEmail()
    await addContact(PLATFORM, email)

    expect(await stateFor(email)).toBe('Contact')
  })

  it('test_UAT_FC_REQ-188_inviting_someone_makes_them_invited_and_never_a_member', async () => {
    // THE CORRECTION, IN ITS PLAINEST FORM. Pressing the button used to call this
    // person a Member on the next redraw. It records that we asked; it cannot
    // record that they came, and the second half of that sentence is the ticket.
    stubJwks()
    const operator = anEmail()
    await anOperator(operator)
    const invitee = anEmail()
    await addContact(PLATFORM, invitee)
    expect(await stateFor(invitee), 'not a contact before the invite').toBe('Contact')

    const response = await postInvite(await mint(operator), { email: invitee })
    expect(response.status).toBe(200)

    expect(await stateFor(invitee)).toBe('Invited')
    // And the marker the old model read is set — so this is the model changing
    // its mind about what that marker MEANS, not the invite failing to write it.
    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const them = people.find((p) => p.email === invitee)
    expect(them?.invitedAt).toBeTruthy()
    expect(them?.termsAcceptedAt, 'the invite stamped an acceptance nobody made').toBeNull()
  })

  it('test_UAT_FC_REQ-188_accepting_the_terms_makes_them_a_member_with_no_operator_action', async () => {
    // THE SECOND TRANSITION, AND IT IS NOT THE OPERATOR'S. Driven through the
    // route the interstitial's own button posts to, by the person's OWN token —
    // no operator call of any kind sits between the two assertions.
    stubJwks()
    const email = anEmail()
    // Entitled, because `admit` refuses an unentitled account at the door today
    // ([[DOC-42]] §10.1) and this ticket does not change who may sign in.
    await inviteAccount(identityEnv(), { email, accountName: 'Theirs', endsAt: null })
    expect(await stateFor(email), 'invited is not yet signed up').toBe('Invited')

    const response = await postAccept(await mint(email))
    expect(response.ok, await response.text()).toBe(true)

    expect(await stateFor(email)).toBe('Member')
  })

  it('test_UAT_FC_REQ-188_membership_is_terms_acceptance_and_not_having_reached_the_door', async () => {
    // WHY THE MARKER IS `tos_accepted_at` AND NOT `first_seen_at`. `admit` stamps
    // `first_seen_at` on the first request through the door and `guardTerms` runs
    // AFTER it — so a person who was served the interstitial and closed the tab
    // has been seen and has signed up for nothing. Asserted by driving a request
    // that is refused BY the terms gate, then reading both columns.
    stubJwks()
    const email = anEmail()
    await inviteAccount(identityEnv(), { email, accountName: 'Theirs', endsAt: null })

    const refused = await worker.fetch(
      new Request('https://app.example/builder', {
        headers: {
          'cf-access-jwt-assertion': await mint(email),
          accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        },
      }),
      workerEnv(),
    )
    expect(refused.status, 'the terms gate let an unaccepted session through').toBe(200)
    expect(await refused.text()).toContain('Terms of service')

    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const them = people.find((p) => p.email === email)
    expect(them?.firstSeenAt, 'the door did not stamp first_seen_at').toBeTruthy()
    expect(them?.termsAcceptedAt).toBeNull()
    expect(stateOf(them), 'reaching the interstitial made them a member').toBe('Invited')
  })
})
