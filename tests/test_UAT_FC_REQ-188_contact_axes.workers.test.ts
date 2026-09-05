import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, findAccount, type IdentityEnv } from '../apps/control-app/src/identity'
import { peopleOf, type Person } from '../apps/control-app/src/people'
import { acceptTerms, TERMS_ACCEPT_PATH, TERMS_VERSION } from '../apps/control-app/src/terms'
import { PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import { accessOf, stageOf } from '../apps/control-app/src/builder/people-axes.js'
import { provisionBusiness } from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * REQ-188 — **a contact sits on two independent axes**, and neither implies the
 * other ([[DOC-44]] §3).
 *
 * WHAT THIS FILE PROVES. That *access* — may this contact sign in, marked by
 * `tos_accepted_at` — and *pipeline* — where the relationship stands, held in
 * `pipeline_stage` — move separately. The operator presses invite and the
 * pipeline moves; the person themselves signs up and access moves; neither act
 * touches the other axis. It also proves the two combinations a single line
 * could not represent at all: an invited contact who never came, and a member
 * this business never invited.
 *
 * AND THAT THE STAGE IS READ FROM ITS OWN COLUMN. The last test writes a row
 * whose stamp and stage disagree in both directions and asserts the stage wins,
 * because a reader that inferred it from `invited_at` would pass every other
 * test in this file and fail the day a third stage was added ([[DOC-44]] §4).
 *
 * WHAT MAKES IT EVIDENCE. Both transitions are driven through the deployed
 * `fetch` inside workerd, against a real D1 with the deployed migrations and a
 * real RS256 Access token verified against a real JWKS: the invite through
 * `POST /api/people/invite` and the acceptance through `POST /api/terms/accept`,
 * which is the route the interstitial's own button posts to. Nothing stamps
 * `tos_accepted_at` by hand on the path under test, because the claim is that
 * SIGNING UP is what makes a member and a test that wrote the column itself would
 * prove only that a label reads a column.
 *
 * AND IT LABELS WITH THE SHIPPED DERIVATIONS. `stageOf` and `accessOf` are
 * imported from `builder/people-axes.js` — the same module the User tab draws
 * its rows from — so what is asserted is what an operator would actually see,
 * not a second copy of the rules written in this file and free to agree with
 * nothing.
 *
 * `admit` IS UNTOUCHED BY THIS TICKET. Everyone who accepts terms below reaches
 * the door holding an entitlement, because an unentitled person is refused at
 * admission today — [[DOC-42]] §10.1's gap, which is a different ticket and is
 * deliberately not fixed here.
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

/**
 * A contact: known to a business, never invited, and MAY become a member.
 *
 * `pipeline_stage` IS NOT NAMED, deliberately. The claim is that a contact
 * arrives at `lead` without anybody deciding to put them there, and a fixture
 * that wrote the value would prove that this file can spell it.
 */
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

/** Read one contact back through the query the tab itself uses. */
async function personFor(email: string): Promise<Person> {
  const people: Person[] = await peopleOf(identityEnv(), { businessId: PLATFORM })
  const them = people.find((p) => p.email === email)
  if (!them) throw new Error(`${email} is not in the business`)
  return them
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

/** Both axes as the tab would draw them, from the row the tab would draw. */
async function axesFor(email: string): Promise<{ stage: string; access: string }> {
  const them = await personFor(email)
  return { stage: stageOf(them), access: accessOf(them) }
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

describe('REQ-188 — two axes, moved by two parties', () => {
  it('test_UAT_FC_REQ-188_a_contact_nobody_has_touched_is_a_lead_and_not_a_member', async () => {
    // BOTH AXES AT THEIR INITIAL VALUE, and *Contact* is neither of them: it is
    // what the row IS ([[DOC-44]] §2). The stage a contact starts at is `lead`,
    // and it is the column's default rather than anything this test wrote.
    const email = anEmail()
    await addContact(PLATFORM, email)

    expect(await axesFor(email)).toEqual({ stage: 'lead', access: 'not_member' })
    expect((await personFor(email)).pipelineStage, 'the stage was not stored').toBe('lead')
  })

  it('test_UAT_FC_REQ-188_inviting_moves_the_pipeline_and_leaves_access_alone', async () => {
    // THE CORRECTION, IN ITS PLAINEST FORM. Pressing the button used to call this
    // person a Member on the next redraw. It records that we asked and moves them
    // along the pipeline; it cannot record that they came, and the second half of
    // that sentence is what the access axis is for.
    stubJwks()
    const operator = anEmail()
    await anOperator(operator)
    const invitee = anEmail()
    await addContact(PLATFORM, invitee)
    expect(await axesFor(invitee), 'not a lead before the invite').toEqual({
      stage: 'lead',
      access: 'not_member',
    })

    const response = await postInvite(await mint(operator), { email: invitee })
    expect(response.status).toBe(200)

    expect(await axesFor(invitee)).toEqual({ stage: 'invited', access: 'not_member' })
    // And the stamp the old model read is set — so this is the model changing its
    // mind about what that stamp MEANS, not the invite failing to write it.
    const them = await personFor(invitee)
    expect(them.invitedAt).toBeTruthy()
    expect(them.termsAcceptedAt, 'the invite stamped an acceptance nobody made').toBeNull()
  })

  it('test_UAT_FC_REQ-188_accepting_the_terms_makes_a_member_and_moves_no_stage', async () => {
    // THE SECOND TRANSITION, AND IT IS NOT THE OPERATOR'S. Driven through the
    // route the interstitial's own button posts to, by the person's OWN token —
    // no operator call of any kind sits between the two assertions. The stage is
    // asserted UNCHANGED, which is the independence claim in one line: signing up
    // says nothing about where the relationship stands.
    stubJwks()
    const email = anEmail()
    // Entitled, because `admit` refuses an unentitled account at the door today
    // ([[DOC-42]] §10.1) and this ticket does not change who may sign in.
    await inviteAccount(identityEnv(), { email, accountName: 'Theirs', endsAt: null })
    expect(await axesFor(email), 'invited is not yet signed up').toEqual({
      stage: 'invited',
      access: 'not_member',
    })

    const response = await postAccept(await mint(email))
    expect(response.ok, await response.text()).toBe(true)

    expect(await axesFor(email)).toEqual({ stage: 'invited', access: 'member' })
  })

  it('test_UAT_FC_REQ-188_a_member_this_business_never_invited_is_still_a_lead', async () => {
    // THE COMBINATION ONE LINE COULD NOT HOLD ([[DOC-44]] §3). A contact who was
    // never invited here signs up anyway — which is what every route that admits
    // somebody without stamping an invite produces — and comes out a MEMBER who
    // is still at the FIRST stage. Under the three-value model this row had to be
    // called one or the other, and calling it Member erased the pipeline fact
    // while calling it Lead denied a signed agreement.
    stubJwks()
    const email = anEmail()
    const id = await addContact(PLATFORM, email)
    // Membership and entitlement, and no invite: the door needs both, and
    // `provisionBusiness` writes exactly them without touching either axis.
    await provisionBusiness(identityEnv(), {
      accountUserId: id,
      name: 'Self-served',
      email,
      endsAt: null,
    })
    expect(await axesFor(email)).toEqual({ stage: 'lead', access: 'not_member' })

    const response = await postAccept(await mint(email))
    expect(response.ok, await response.text()).toBe(true)

    expect(await axesFor(email)).toEqual({ stage: 'lead', access: 'member' })
    expect((await personFor(email)).invitedAt, 'nobody invited them').toBeNull()
  })

  it('test_UAT_FC_REQ-188_the_stage_is_the_stored_value_and_not_inferred_from_stamps', async () => {
    // WHY THE COLUMN EXISTS ([[DOC-44]] §4). Asserted in BOTH directions against
    // rows whose stamp and stage disagree, because a reader that inferred the
    // stage from `invited_at` passes every other test in this file — every one of
    // them writes rows where the two agree — and would silently become the only
    // answer again the day a third stage arrived with no stamp of its own.
    const stamped = anEmail()
    await addContact(PLATFORM, stamped)
    await env.DB.prepare(
      "UPDATE users SET invited_at = ?, pipeline_stage = 'lead' WHERE tenant_id = ? AND email = ?",
    )
      .bind(new Date().toISOString(), PLATFORM, stamped)
      .run()

    const staged = anEmail()
    await addContact(PLATFORM, staged)
    await env.DB.prepare(
      "UPDATE users SET pipeline_stage = 'invited' WHERE tenant_id = ? AND email = ?",
    )
      .bind(PLATFORM, staged)
      .run()

    expect((await axesFor(stamped)).stage, 'a stamp decided the stage').toBe('lead')
    expect((await axesFor(staged)).stage, 'a missing stamp decided the stage').toBe('invited')
  })

  it('test_UAT_FC_REQ-188_membership_is_terms_acceptance_and_not_having_reached_the_door', async () => {
    // WHY THE ACCESS MARKER IS `tos_accepted_at` AND NOT `first_seen_at`. `admit`
    // stamps `first_seen_at` on the first request through the door and
    // `guardTerms` runs AFTER it — so a person who was served the interstitial
    // and closed the tab has been seen and has signed up for nothing. Asserted by
    // driving a request that is refused BY the terms gate, then reading both.
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

    const them = await personFor(email)
    expect(them.firstSeenAt, 'the door did not stamp first_seen_at').toBeTruthy()
    expect(them.termsAcceptedAt).toBeNull()
    expect(accessOf(them), 'reaching the interstitial made them a member').toBe('not_member')
  })
})
