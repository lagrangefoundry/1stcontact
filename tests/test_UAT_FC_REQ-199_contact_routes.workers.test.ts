import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, type IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { peopleOf } from '../apps/control-app/src/people'
import { PEOPLE_PATH, PERSON_ADD_PATH, PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import { personByEmail } from './support/person'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * REQ-199 — **the two acts, as routes, through the deployed Worker.**
 *
 * WHAT THIS FILE PROVES AND WHY IT DRIVES `worker.fetch`. `/api/people/add` is a
 * new door onto creating people, and a door's authorisation is the half that can
 * silently be wrong: a suite calling `addContact` with a scope it built itself
 * would prove the SQL and say nothing about who may reach it. So every case here
 * goes through the deployed `fetch` inside workerd, against a real D1 with the
 * deployed schema and a real RS256 Access token verified against a real JWKS.
 *
 * THE GATE IS THE INVITE'S AND MUST STAY THE INVITE'S. `ownsBusiness` is
 * [[DOC-42]] §7's first condition alone — *you own this business* — which is
 * true of Alice on hers. Reusing the FULFILMENT gate is the mistake this route
 * is most likely to attract, because the two sit adjacent in the route table and
 * select the same set today; it would mean only 1st Contact may write down a
 * contact, which forecloses level 2 entirely.
 *
 * NO CREDENTIAL IS CONFIGURED, deliberately. `MAIL_FROM` is set and
 * `RESEND_API_KEY` is not, so `mailerFor` returns the adapter that records and
 * delivers nothing — [[REQ-196]]'s falsifier (*a code path where running the
 * tests can send mail*) closed by there being no key rather than by a flag.
 */

const PLATFORM = 'req199-routes-platform'
const TEAM = 'https://req199-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

const identityEnv = (): IdentityEnv => ({
  DB: env.DB as D1Database,
  SITES: env.SITES as R2Bucket,
  TENANT_ID: PLATFORM,
})

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    MAIL_FROM: 'no-reply@example.test',
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
  const header = { alg: 'RS256', kid: 'req199-key', typ: 'JWT' }
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
const anEmail = (): string => `req199r-${(seq += 1)}@example.test`

const at = (businessId: string | null, path: string) =>
  `https://app.example${businessId ? `/b/${businessId}` : ''}${path}`

const post = async (
  token: string | null,
  path: string,
  body: unknown,
  businessId: string | null = null,
): Promise<Response> =>
  worker.fetch(
    new Request(at(businessId, path), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

const get = async (
  token: string,
  path: string,
  businessId: string | null = null,
): Promise<Response> =>
  worker.fetch(
    new Request(at(businessId, path), { headers: { 'cf-access-jwt-assertion': token } }),
    workerEnv(),
  )

/** An account of 1st Contact who has also accepted the terms — setup, not a claim. */
async function anAccount(email: string, name = 'A Business') {
  const seeded = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id)
  return seeded
}

/** An owner of the 1st Contact business, seeded the way production seeds one. */
async function anOperator(email: string) {
  await ensurePlatformOperator(identityEnv(), email)
  const account = await personByEmail(identityEnv(), PLATFORM, email)
  if (!account) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), account.id)
  return account
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
  jwks = { keys: [{ ...jwk, kid: 'req199-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-199 — POST /api/people/add', () => {
  it('test_UAT_FC_REQ-199_an_owner_adds_a_contact_and_the_new_row_is_a_lead', async () => {
    // THE ACCEPTANCE IN ITS PLAINEST FORM, through the door the tab uses: press
    // `+`, and the person is in the list as a **Lead** with nothing asked of
    // them. Asserted through `peopleOf` — the function the tab reads — because
    // what the ticket owes is a person who SHOWS UP.
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")
    const contact = anEmail()

    const response = await post(
      await mint(owner),
      PERSON_ADD_PATH,
      { email: contact, displayName: 'A Lead' },
      account.businessId,
    )

    expect(response.status).toBe(200)
    expect((await response.json<{ created: boolean }>()).created).toBe(true)

    const listed = await peopleOf(identityEnv(), { businessId: account.businessId })
    const them = listed.find((p) => p.email === contact)
    expect(them, 'the added contact is not in the business it was added to').toBeTruthy()
    expect(them?.pipelineStage).toBe('lead')
    expect(them?.invitedAt, 'adding a contact asked them something').toBeNull()
    expect(them?.termsAcceptedAt).toBeNull()
    expect(them?.name?.displayName).toBe('A Lead')
  })

  it('test_UAT_FC_REQ-199_an_add_with_no_address_is_refused_as_the_callers_mistake', async () => {
    // 400 and not the 500 a thrown error would otherwise become — an empty box
    // is the operator's mistake, and reporting it as "the builder broke" tells
    // them to retry the one thing that cannot work.
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")

    const response = await post(
      await mint(owner),
      PERSON_ADD_PATH,
      { email: '   ' },
      account.businessId,
    )
    expect(response.status).toBe(400)
  })

  it('test_UAT_FC_REQ-199_a_caller_who_does_not_own_the_business_may_not_add_to_it', async () => {
    // THE GATE IS `ownsBusiness` AND NOT `ownsPlatformBusiness`. This caller is
    // an owner of 1st Contact — so `resolveScope` opens the business for them —
    // and is refused for the one business they can reach but do not own, which
    // is the case `ownsBusiness` and nothing upstream of it decides.
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const someoneElse = await anAccount(anEmail(), 'Not Theirs')
    const contact = anEmail()

    const response = await post(
      await mint(operatorEmail),
      PERSON_ADD_PATH,
      { email: contact },
      someoneElse.businessId,
    )

    expect(response.status).toBe(403)
    expect((await response.json<{ error: string }>()).error).toContain('owner')
    const listed = await peopleOf(identityEnv(), { businessId: someoneElse.businessId })
    expect(listed.map((p) => p.email)).not.toContain(contact)
  })

  it('test_UAT_FC_REQ-199_the_loopback_path_may_not_add_people', async () => {
    // The dev-open branch skips Access and `admit` entirely, so there is nobody
    // there to own anything. A door onto creating people that opens only when
    // authentication is switched off is a shape that reads as a feature and
    // would eventually be relied upon.
    const contact = anEmail()
    const response = await worker.fetch(
      new Request(at(null, PERSON_ADD_PATH), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: contact }),
      }),
      workerEnv({ ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }),
    )

    expect(response.status).toBe(403)
    const listed = await peopleOf(identityEnv(), { businessId: PLATFORM })
    expect(listed.map((p) => p.email)).not.toContain(contact)
  })
})

describe('REQ-199 — GET /api/people/invite', () => {
  it('test_UAT_FC_REQ-199_the_draft_reports_the_sender_and_the_businesses_own_copy', async () => {
    // WHAT WOULD THIS SEND, answered before anything is sent. `from` is the
    // deployment's `MAIL_FROM`, and the copy is this business's own `invite`
    // template — seeded on first ask, so a fresh deployment finds content rather
    // than an empty box.
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")

    const response = await get(await mint(owner), PERSON_INVITE_PATH, account.businessId)
    expect(response.status).toBe(200)
    const draft = await response.json<{
      from: string
      subject: string
      body: string
      declared: string[]
      templateKey: string
    }>()

    expect(draft.from).toBe('no-reply@example.test')
    expect(draft.templateKey).toBe('invite')
    expect(draft.subject.length).toBeGreaterThan(0)
    expect(draft.body).toContain('{{cta_url}}')
    expect(draft.declared).toContain('cta_url')
  })

  it('test_UAT_FC_REQ-199_a_caller_who_does_not_own_the_business_may_not_read_its_invite_copy', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const someoneElse = await anAccount(anEmail(), 'Not Theirs')

    const response = await get(await mint(operatorEmail), PERSON_INVITE_PATH, someoneElse.businessId)
    expect(response.status).toBe(403)
  })
})

describe('REQ-199 — the two acts are two paths', () => {
  it('test_UAT_FC_REQ-199_the_add_path_and_the_invite_path_are_different_routes', async () => {
    // TWO FUNCTIONS, NOT ONE WITH A FLAG — as URLs. One route taking an
    // `alsoInvite` boolean would make the difference between recording a person
    // and emailing a stranger a field in a JSON body, which is the kind of
    // parameter that eventually arrives wrong from a client nobody updated.
    expect(PERSON_ADD_PATH).not.toBe(PERSON_INVITE_PATH)

    // AND THE ADD PATH REFUSES A SELECTION. It takes an address; handing it ids
    // is a client that got out of step, and it must not quietly succeed.
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")
    const before = await peopleOf(identityEnv(), { businessId: account.businessId })

    const response = await post(
      await mint(owner),
      PERSON_ADD_PATH,
      { ids: ['usr_whatever'] },
      account.businessId,
    )
    expect(response.status).toBe(400)
    const after = await peopleOf(identityEnv(), { businessId: account.businessId })
    expect(after).toHaveLength(before.length)
  })

  it('test_UAT_FC_REQ-199_the_add_path_never_sends_and_the_list_shows_it', async () => {
    // ADDING CANNOT MAIL ANYBODY. Proved from the list rather than from the
    // absence of an exception: the contact is there, at `lead`, with no stamp —
    // which is the state an invite could not leave them in.
    stubJwks()
    const owner = anEmail()
    const account = await anAccount(owner, "Alice's Plumbing")
    const contact = anEmail()

    await post(await mint(owner), PERSON_ADD_PATH, { email: contact }, account.businessId)

    const listed = await (
      await get(await mint(owner), PEOPLE_PATH, account.businessId)
    ).json<{ people: Array<{ email: string | null; pipelineStage: string; invitedAt: string | null }> }>()
    const them = listed.people.find((p) => p.email === contact)
    expect(them?.pipelineStage).toBe('lead')
    expect(them?.invitedAt).toBeNull()
  })
})
