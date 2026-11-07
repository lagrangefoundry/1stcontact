import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  accountById,
  admit,
  emailsOf,
  ensurePlatformOperator,
  newId,
  peopleOnAccount,
  provisionBusiness,
  userEmailInsert,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import type { Person } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { messagesFor } from '../apps/control-app/src/messages'
import { SEED_TEMPLATES, templateFor } from '../apps/control-app/src/templates'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Message, SendEmail } from '../apps/control-app/src/mail'
import { route, PERSON_ADD_PATH, PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'
import { personByEmail } from './support/person'

/**
 * story-7b1025b8 (BUNDLE-38, REQ-199) — **add records a Lead; invite mails a
 * selection.**
 *
 * Reconciliation UATs for the acceptance criteria this bundle added or restated.
 * Authorisation cases drive the deployed `worker.fetch` inside workerd against a
 * real D1 with the deployed schema and a real RS256 Access token verified
 * against a stubbed JWKS (the only external boundary). Cases that must OBSERVE
 * the mail port — how many messages, to whom, or a provider that refuses — call
 * the router's `route()` with the documented `sendEmail` seam and the admission
 * `admit` really produced, because the deployed default (`mailerFor` with no
 * credential) cannot be told to fail.
 *
 * The Contacts-tab half of AC-2336, AC-2337 and AC-2339 is the jsdom sibling,
 * `test_reconciliation_contacts_add_invite_tab.test.ts`.
 */

const PLATFORM = 'recon-addinv-platform'
const TEAM = 'https://recon-addinv.cloudflareaccess.com'
const AUD = 'e'.repeat(64)
const FROM = 'no-reply@example.test'

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
    MAIL_FROM: FROM,
    SESSION_COOKIE_NAME: 'session',
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
  const header = { alg: 'RS256', kid: 'recon-addinv-key', typ: 'JWT' }
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
const anEmail = (): string => `recon-addinv-${(seq += 1)}@example.test`

const at = (businessId: string | null, path: string) =>
  `https://app.example${businessId ? `/b/${businessId}` : ''}${path}`

/** Through the deployed Worker, as the browser calls it. */
async function viaWorker(
  token: string | null,
  method: 'GET' | 'POST',
  path: string,
  businessId: string | null,
  body?: unknown,
  overrides: Partial<Env> = {},
): Promise<Response> {
  return worker.fetch(
    new Request(at(businessId, path), {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    workerEnv(overrides),
  )
}

/**
 * Through the router with an observable mail port. The admission is the one
 * `admit` really produces for this caller, which is what `index.ts` hands down.
 */
async function viaRouter(
  callerEmail: string,
  method: 'GET' | 'POST',
  path: string,
  businessId: string,
  send: SendEmail,
  body?: unknown,
): Promise<Response> {
  const admission = await admit(identityEnv(), callerEmail)
  return route(
    new Request(at(businessId, path), {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    workerEnv(),
    { businessId },
    { admission, sendEmail: send },
  )
}

/** A mail port that records what it was handed. */
function recording(failFor: string | null = null): { send: SendEmail; sent: Message[] } {
  const sent: Message[] = []
  return {
    sent,
    send: async (message) => {
      if (failFor !== null && message.to === failFor) throw new Error('mailbox does not exist')
      sent.push(message)
      return { providerId: `prov_${sent.length}` }
    },
  }
}

/** An owner of a customer business who has accepted the terms. */
async function aCustomerOwner(name = 'A Business') {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id)
  return { email, businessId: seeded.businessId, personId: seeded.user.id }
}

/** An owner of the 1st Contact business, seeded the way production seeds one. */
async function anOperator() {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const person = await personByEmail(identityEnv(), PLATFORM, email)
  if (!person) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), person.id)
  return { email, personId: person.id }
}

const storeFor = (businessId: string): Promise<TicketStore> =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId })

type AddBody = { created: boolean; person: Person }
type InviteBody = {
  results: Array<{
    contactId: string
    who: string
    to: string | null
    status: 'sent' | 'failed' | 'refused'
    reason: string | null
    person: Person | null
  }>
}

const peopleAt = async (tenantId: string, email: string): Promise<string[]> => {
  const { results } = await env.DB.prepare(
    'SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?',
  )
    .bind(tenantId, email)
    .all<{ user_id: string }>()
  return (results ?? []).map((r) => r.user_id)
}

const count = async (table: string): Promise<number> =>
  (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>())?.n ?? 0

const invitedAtOf = async (id: string): Promise<string | null> =>
  (await env.DB.prepare('SELECT invited_at FROM users WHERE id = ?').bind(id).first<{
    invited_at: string | null
  }>())?.invited_at ?? null

const stageOf = async (id: string): Promise<string | null> =>
  (await env.DB.prepare('SELECT pipeline_stage FROM users WHERE id = ?').bind(id).first<{
    pipeline_stage: string | null
  }>())?.pipeline_stage ?? null

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
  jwks = { keys: [{ ...jwk, kid: 'recon-addinv-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-7b1025b8 — the add', () => {
  it('test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite', async () => {
    const owner = await aCustomerOwner("Alice's Plumbing")
    const port = recording()
    const fresh = anEmail()

    const response = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
      email: fresh,
      displayName: 'A Lead',
    })
    expect(response.status).toBe(200)
    const made = await response.json<AddBody>()
    expect(made.created).toBe(true)
    const row = await env.DB.prepare('SELECT pipeline_stage, invited_at FROM users WHERE id = ?')
      .bind(made.person.id)
      .first<{ pipeline_stage: string; invited_at: string | null }>()
    expect(row?.pipeline_stage).toBe('lead')
    expect(row?.invited_at, 'adding stamped an invitation').toBeNull()
    expect(port.sent, 'adding a contact handed something to the mail port').toEqual([])
    expect(await messagesFor(await storeFor(owner.businessId), made.person.id)).toEqual([])

    // An `alsoInvite`-style flag changes nothing: still a Lead, nothing sent.
    const flagged = anEmail()
    const withFlag = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
      email: flagged,
      alsoInvite: true,
      invite: true,
    })
    expect(withFlag.status).toBe(200)
    const flaggedBody = await withFlag.json<AddBody>()
    expect(flaggedBody.created).toBe(true)
    expect(await stageOf(flaggedBody.person.id)).toBe('lead')
    expect(await invitedAtOf(flaggedBody.person.id)).toBeNull()
    expect(port.sent, 'a flag on the add route sent mail').toEqual([])

    // The same address again is reported as already there.
    const again = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
      email: fresh,
    })
    expect((await again.json<AddBody>()).created).toBe(false)

    // The invite route has no address-taking branch either: an address with no ids is refused.
    const peopleBefore = await count('users')
    const inviteWithAddress = await viaRouter(
      owner.email,
      'POST',
      PERSON_INVITE_PATH,
      owner.businessId,
      port.send,
      { email: anEmail(), add: true },
    )
    expect(inviteWithAddress.status).toBe(400)
    expect(await count('users')).toBe(peopleBefore)
    expect(port.sent).toEqual([])

    // An empty address is the caller's mistake.
    const empty = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
      email: '   ',
    })
    expect(empty.status).toBe(400)
  })

  it('test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one', async () => {
    stubJwks()
    const owner = await aCustomerOwner()
    const response = await viaWorker(await mint(owner.email), 'POST', PERSON_ADD_PATH, owner.businessId, {
      email: anEmail(),
    })
    expect(response.status).toBe(200)
    const made = await response.json<AddBody>()
    expect(made.created).toBe(true)

    const stored = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
      .bind(made.person.id)
      .first<{ account_id: string }>()
    expect(stored?.account_id).toBe(made.person.accountId)
    expect(stored?.account_id).toMatch(/^acct_[0-9a-f]{32}$/)
    const account = await accountById(identityEnv(), stored!.account_id)
    expect(account?.tenant_id, 'the account is not an account of the adding business').toBe(
      owner.businessId,
    )
    expect(account?.status).toBe('active')
    expect(await peopleOnAccount(identityEnv(), stored!.account_id)).toEqual([made.person.id])

    // The break-glass seed gives a new operator an account of their own.
    const operator = await anOperator()
    const operatorRow = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
      .bind(operator.personId)
      .first<{ account_id: string }>()
    expect(operatorRow?.account_id).toMatch(/^acct_[0-9a-f]{32}$/)
    expect(await peopleOnAccount(identityEnv(), operatorRow!.account_id)).toEqual([operator.personId])

    // The schema refuses a person with no account, and one naming a missing account.
    const before = await count('users')
    await expect(
      env.DB.prepare(
        'INSERT INTO users (id, tenant_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(newId('usr'), owner.businessId, 'active', '2026-01-01', '2026-01-01')
        .run(),
    ).rejects.toThrow()
    await expect(
      env.DB.prepare(
        'INSERT INTO users (id, tenant_id, account_id, status, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?)',
      )
        .bind(newId('usr'), owner.businessId, newId('acct'), 'active', '2026-01-01', '2026-01-01')
        .run(),
    ).rejects.toThrow()
    expect(await count('users')).toBe(before)
  })

  it('test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing', async () => {
    stubJwks()
    const owner = await aCustomerOwner()
    const token = await mint(owner.email)
    const email = anEmail()

    const counts = async () => ({
      users: await count('users'),
      tenants: await count('tenants'),
      memberships: await count('memberships'),
      entitlements: await count('entitlements'),
    })
    const before = await counts()

    const first = await viaWorker(token, 'POST', PERSON_ADD_PATH, owner.businessId, { email })
    expect(first.status).toBe(200)
    const firstBody = await first.json<AddBody>()
    expect(firstBody.created).toBe(true)
    const afterFirst = await counts()

    const second = await viaWorker(token, 'POST', PERSON_ADD_PATH, owner.businessId, { email })
    expect(second.status, 'the second add failed instead of finding the person').toBe(200)
    const secondBody = await second.json<AddBody>()
    expect(secondBody.created).toBe(false)
    expect(secondBody.person.id).toBe(firstBody.person.id)

    expect(await peopleAt(owner.businessId, email)).toEqual([firstBody.person.id])
    const after = await counts()
    // One person from the first add, nothing at all from the second.
    expect(afterFirst.users).toBe(before.users + 1)
    expect(after).toEqual(afterFirst)
    expect(after.tenants).toBe(before.tenants)
    expect(after.memberships).toBe(before.memberships)
    expect(after.entitlements).toBe(before.entitlements)
  })

  it('test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login', async () => {
    stubJwks()
    const operator = await anOperator()
    const token = await mint(operator.email)
    const email = anEmail()
    const typed = `  ${email.toUpperCase()}  `

    const first = await viaWorker(token, 'POST', PERSON_ADD_PATH, PLATFORM, { email: typed })
    expect(first.status).toBe(200)
    const made = await first.json<AddBody>()
    expect(made.created).toBe(true)
    expect((await emailsOf(identityEnv(), made.person.id)).map((e) => e.email)).toEqual([email])

    // The schema refuses an address that is not already casefolded.
    const now = new Date().toISOString()
    await expect(
      env.DB.prepare(
        'INSERT INTO user_emails (id, user_id, tenant_id, email, is_primary, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, 0, ?, ?)',
      )
        .bind(newId('eml'), made.person.id, PLATFORM, `Other-${email}`.toUpperCase(), now, now)
        .run(),
    ).rejects.toThrow()

    const again = await viaWorker(token, 'POST', PERSON_ADD_PATH, PLATFORM, {
      email: email.replace('recon', 'RECON'),
    })
    const againBody = await again.json<AddBody>()
    expect(againBody.created).toBe(false)
    expect(againBody.person.id).toBe(made.person.id)
    expect(await peopleAt(PLATFORM, email)).toEqual([made.person.id])

    await provisionBusiness(identityEnv(), { accountId: made.person.accountId, name: 'Cased Co' })
    const admitted = await admit(identityEnv(), ` ${email.toUpperCase()} `)
    expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
    expect(admitted.ok && admitted.user.id).toBe(made.person.id)
  })

  it('test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address', async () => {
    stubJwks()
    const operator = await anOperator()
    const token = await mint(operator.email)
    const primary = anEmail()
    const secondary = anEmail()

    const first = await viaWorker(token, 'POST', PERSON_ADD_PATH, PLATFORM, { email: primary })
    const made = await first.json<AddBody>()
    await userEmailInsert(identityEnv(), {
      userId: made.person.id,
      tenantId: PLATFORM,
      email: secondary,
      primary: false,
    }).run()

    const before = await count('users')
    const again = await viaWorker(token, 'POST', PERSON_ADD_PATH, PLATFORM, { email: secondary })
    expect(again.status).toBe(200)
    const againBody = await again.json<AddBody>()
    expect(againBody.created).toBe(false)
    expect(againBody.person.id).toBe(made.person.id)
    expect(await count('users'), 'adding a secondary address wrote a second person').toBe(before)
    expect(await peopleAt(PLATFORM, primary)).toEqual([made.person.id])
    expect(await peopleAt(PLATFORM, secondary)).toEqual([made.person.id])
    expect(await emailsOf(identityEnv(), made.person.id), 'the add gave them another address').toHaveLength(2)

    await provisionBusiness(identityEnv(), { accountId: made.person.accountId, name: 'Secondary Co' })
    const admitted = await admit(identityEnv(), secondary)
    expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
    expect(admitted.ok && admitted.user.id).toBe(made.person.id)
    expect(admitted.ok && admitted.user.email).toBe(primary)
  })

  it('test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp', async () => {
    stubJwks()
    const owner = await aCustomerOwner()
    const token = await mint(owner.email)
    const email = anEmail()

    const first = await viaWorker(token, 'POST', PERSON_ADD_PATH, owner.businessId, { email })
    const made = await first.json<AddBody>()
    expect(made.person.name).toBeNull()

    const second = await viaWorker(token, 'POST', PERSON_ADD_PATH, owner.businessId, {
      email,
      displayName: 'Bob Smith',
    })
    expect(second.status).toBe(200)
    const secondBody = await second.json<AddBody>()
    expect(secondBody.created).toBe(false)
    expect(secondBody.person.name?.displayName).toBe('Bob Smith')

    const third = await viaWorker(token, 'POST', PERSON_ADD_PATH, owner.businessId, {
      email,
      displayName: 'Robert Smith',
    })
    const thirdBody = await third.json<AddBody>()
    expect(thirdBody.person.name?.displayName, 'a later add superseded the name').toBe('Bob Smith')
    const { results } = await env.DB.prepare(
      'SELECT display_name, superseded_at FROM user_names WHERE user_id = ?',
    )
      .bind(made.person.id)
      .all<{ display_name: string; superseded_at: string | null }>()
    expect(results).toEqual([{ display_name: 'Bob Smith', superseded_at: null }])

    // The invite carries no name, and a re-invite does not restamp.
    const invite = await viaWorker(token, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      ids: [made.person.id],
    })
    expect(invite.status).toBe(200)
    const stamp = await invitedAtOf(made.person.id)
    expect(stamp).toBeTruthy()
    await new Promise((resolve) => setTimeout(resolve, 5))
    const reinvite = await viaWorker(token, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      ids: [made.person.id],
    })
    expect(reinvite.status, 're-inviting was an error').toBe(200)
    const reinviteBody = await reinvite.json<InviteBody>()
    expect(reinviteBody.results[0].person?.id).toBe(made.person.id)
    expect(await invitedAtOf(made.person.id), 'a re-invite restamped the invitation').toBe(stamp)
  })
})

describe('story-7b1025b8 — who may add and invite', () => {
  it('test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing', async () => {
    stubJwks()
    const logged: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '))
    })
    const mailLines = () => logged.filter((line) => line.startsWith('[mail]'))

    // An owner of a customer business may add and invite into it.
    const owner = await aCustomerOwner("Alice's Plumbing")
    const ownerToken = await mint(owner.email)
    const added = await viaWorker(ownerToken, 'POST', PERSON_ADD_PATH, owner.businessId, {
      email: anEmail(),
    })
    expect(added.status).toBe(200)
    const contact = (await added.json<AddBody>()).person
    const invited = await viaWorker(ownerToken, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      ids: [contact.id],
    })
    expect(invited.status).toBe(200)
    expect(mailLines(), 'the owner invite did not reach the mail port').toHaveLength(1)

    const refusalsWriteNothing = async (responses: Promise<Response>[], label: string) => {
      const usersBefore = await count('users')
      const mailBefore = mailLines().length
      for (const response of await Promise.all(responses)) {
        expect(response.status, label).toBe(403)
      }
      expect(await count('users'), `${label}: a refusal wrote a person`).toBe(usersBefore)
      expect(mailLines().length, `${label}: a refusal sent mail`).toBe(mailBefore)
    }
    const allThree = (token: string | null, businessId: string | null, overrides = {}) => [
      viaWorker(token, 'POST', PERSON_ADD_PATH, businessId, { email: anEmail() }, overrides),
      viaWorker(token, 'GET', PERSON_INVITE_PATH, businessId, undefined, overrides),
      viaWorker(token, 'POST', PERSON_INVITE_PATH, businessId, { ids: [contact.id] }, overrides),
    ]

    // The customer owner scoped to the 1st Contact business, where they own nothing.
    await refusalsWriteNothing(allThree(ownerToken, PLATFORM), 'customer owner in 1st Contact')

    // A platform operator opens the customer's business without a membership — and is not its owner.
    const operator = await anOperator()
    await refusalsWriteNothing(
      allThree(await mint(operator.email), owner.businessId),
      'platform operator without an owner membership',
    )

    // The dev-open loopback path carries no admission.
    await refusalsWriteNothing(
      allThree(null, null, { ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }),
      'dev-open loopback',
    )
    expect(await invitedAtOf(contact.id)).toBeTruthy()

    // An empty address, and an empty selection, are 400 and write nothing.
    const usersBefore = await count('users')
    const mailBefore = mailLines().length
    const emptyAdd = await viaWorker(ownerToken, 'POST', PERSON_ADD_PATH, owner.businessId, {
      email: '  ',
    })
    expect(emptyAdd.status).toBe(400)
    expect((await emptyAdd.json<{ error: string }>()).error).toMatch(/address/i)
    const emptyInvite = await viaWorker(ownerToken, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      ids: [],
    })
    expect(emptyInvite.status).toBe(400)
    expect(await count('users')).toBe(usersBefore)
    expect(mailLines().length).toBe(mailBefore)
  })
})

describe('story-7b1025b8 — the invite', () => {
  it('test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404', async () => {
    stubJwks()
    const owner = await aCustomerOwner()
    const other = await aCustomerOwner('Someone Else')
    const token = await mint(owner.email)
    const email = anEmail()
    const logged: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '))
    })
    const mailLines = () => logged.filter((line) => line.startsWith('[mail]'))

    const added = await viaWorker(token, 'POST', PERSON_ADD_PATH, owner.businessId, { email })
    const contactId = (await added.json<AddBody>()).person.id

    const invited = await viaWorker(token, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      ids: [contactId],
    })
    expect(invited.status).toBe(200)
    const body = await invited.json<InviteBody>()
    expect(body.results.map((r) => r.contactId)).toEqual([contactId])
    expect(await peopleAt(owner.businessId, email), 'the invite wrote a second row').toEqual([
      contactId,
    ])
    expect(mailLines()).toHaveLength(1)

    // Another business's contact and a non-existent id: identical 404s, nothing sent.
    const theirs = await viaWorker(await mint(other.email), 'POST', PERSON_ADD_PATH, other.businessId, {
      email: anEmail(),
    })
    const theirId = (await theirs.json<AddBody>()).person.id
    const foreign = await viaWorker(token, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      ids: [theirId],
    })
    const missing = await viaWorker(token, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      ids: [newId('usr')],
    })
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(await foreign.text()).toBe(await missing.text())
    expect(mailLines(), 'an unknown id reached the mail port').toHaveLength(1)
    expect(await invitedAtOf(theirId)).toBeNull()

    // No ids is 400; an address with no ids is 400 and writes nobody.
    const empty = await viaWorker(token, 'POST', PERSON_INVITE_PATH, owner.businessId, { ids: [] })
    expect(empty.status).toBe(400)
    const before = await count('users')
    const byAddress = await viaWorker(token, 'POST', PERSON_INVITE_PATH, owner.businessId, {
      email: anEmail(),
    })
    expect(byAddress.status).toBe(400)
    expect(await count('users')).toBe(before)
  })

  it('test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment', async () => {
    // A business that has never had an `invite` template is given the default.
    const owner = await aCustomerOwner('Never Templated')
    const store = await storeFor(owner.businessId)
    const existing = await store.query({
      predicate: 'type=template AND fields.template_key=invite',
      limit: 'all',
    })
    expect(existing.tickets, 'the business already had an invite template').toHaveLength(0)

    const port = recording()
    const draftResponse = await viaRouter(owner.email, 'GET', PERSON_INVITE_PATH, owner.businessId, port.send)
    expect(draftResponse.status).toBe(200)
    const draft = await draftResponse.json<{
      from: string
      subject: string
      body: string
      declared: string[]
      templateKey: string
      templateUid: string
    }>()
    expect(draft.from).toBe(FROM)
    expect(draft.subject).toBe(SEED_TEMPLATES.invite.subject)
    expect(draft.body).toBe(SEED_TEMPLATES.invite.body)
    expect(draft.templateKey).toBe('invite')
    const seeded = await templateFor(store, 'invite')
    expect(seeded.uid, 'the draft did not come from a template that now exists').toBe(draft.templateUid)

    // Two contacts, one message each, each from the deployment's address.
    const a = anEmail()
    const b = anEmail()
    const ids: string[] = []
    for (const email of [a, b]) {
      const added = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
        email,
      })
      ids.push((await added.json<AddBody>()).person.id)
    }
    const sent = await viaRouter(owner.email, 'POST', PERSON_INVITE_PATH, owner.businessId, port.send, {
      ids,
      from: 'ceo@spoofed.example',
    })
    expect(sent.status).toBe(200)
    expect(port.sent, 'one message per contact').toHaveLength(2)
    expect(port.sent.map((m) => m.to)).toEqual([a, b])
    for (const message of port.sent) {
      expect(typeof message.to).toBe('string')
      expect(message.to).not.toMatch(/[,;]/)
      expect(message.from, 'a `from` in the request was honoured').toBe(FROM)
    }
  })

  it('test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending', async () => {
    const owner = await aCustomerOwner()
    const store = await storeFor(owner.businessId)
    const before = await templateFor(store, 'invite')
    const port = recording()
    const added = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
      email: anEmail(),
    })
    const contactId = (await added.json<AddBody>()).person.id

    const edited = await viaRouter(owner.email, 'POST', PERSON_INVITE_PATH, owner.businessId, port.send, {
      ids: [contactId],
      subject: 'Come and see what we built',
      body: '<p>Hello — <a href="{{cta_url}}">have a look</a>.</p>',
    })
    expect(edited.status).toBe(200)
    expect(port.sent).toHaveLength(1)
    expect(port.sent[0].subject).toBe('Come and see what we built')
    expect(port.sent[0].body).toContain('have a look')
    expect(port.sent[0].body).not.toContain('{{cta_url}}')
    expect(port.sent[0].body).toMatch(/href="https?:\/\//)
    const after = await templateFor(store, 'invite')
    expect(after.uid).toBe(before.uid)
    expect(after.fields.subject, 'the send rewrote the template subject').toBe(before.fields.subject)
    expect(after.body, 'the send rewrote the template body').toBe(before.body)

    // A body that has dropped {{cta_url}} is refused; nothing is sent, nobody moves.
    const lead = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
      email: anEmail(),
    })
    const leadId = (await lead.json<AddBody>()).person.id
    const refused = await viaRouter(owner.email, 'POST', PERSON_INVITE_PATH, owner.businessId, port.send, {
      ids: [leadId],
      subject: 'Hello',
      body: '<p>No link at all.</p>',
    })
    expect(refused.status).toBe(400)
    const error = (await refused.json<{ error: string }>()).error
    expect(error).toContain('cta_url')
    expect(error).toContain('invite')
    expect(port.sent, 'a refused copy reached the mail port').toHaveLength(1)
    expect(await stageOf(leadId)).toBe('lead')

    // Only one half of the edit: the template's own copy goes, not a mix.
    const half = await viaRouter(owner.email, 'POST', PERSON_INVITE_PATH, owner.businessId, port.send, {
      ids: [leadId],
      subject: 'Only a subject',
    })
    expect(half.status).toBe(200)
    expect(port.sent).toHaveLength(2)
    expect(port.sent[1].subject).not.toBe('Only a subject')
    expect(port.sent[1].subject).toBe(String(before.fields.subject))
  })

  it('test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name', async () => {
    const owner = await aCustomerOwner()
    const port = recording()
    const add = async (email: string, displayName?: string) => {
      const response = await viaRouter(owner.email, 'POST', PERSON_ADD_PATH, owner.businessId, port.send, {
        email,
        displayName,
      })
      return (await response.json<AddBody>()).person
    }

    // One with a primary and a secondary; one with a single primary; one whose only address is unflagged.
    const two = await add(anEmail())
    const secondary = anEmail()
    await userEmailInsert(identityEnv(), {
      userId: two.id,
      tenantId: owner.businessId,
      email: secondary,
      primary: false,
    }).run()
    const one = await add(anEmail())
    const unflaggedAddress = anEmail()
    const unflagged = await add(unflaggedAddress, 'Cara Unflagged')
    await env.DB.prepare('UPDATE user_emails SET is_primary = 0 WHERE user_id = ?').bind(unflagged.id).run()

    const response = await viaRouter(owner.email, 'POST', PERSON_INVITE_PATH, owner.businessId, port.send, {
      ids: [two.id, one.id, unflagged.id],
    })
    expect(response.status).toBe(200)
    const { results } = await response.json<InviteBody>()
    expect(results.map((r) => r.contactId)).toEqual([two.id, one.id, unflagged.id])
    expect(results.map((r) => r.status)).toEqual(['sent', 'sent', 'refused'])
    expect(port.sent.map((m) => m.to)).toEqual([two.email, one.email])
    expect(port.sent.some((m) => m.to === secondary || m.to === unflaggedAddress)).toBe(false)
    expect(results[2].who).toBe('Cara Unflagged')
    expect(results[2].to).toBeNull()
    expect(results[2].reason).toMatch(/primary address/i)
    expect(await messagesFor(await storeFor(owner.businessId), unflagged.id)).toEqual([])

    // A provider refusal is `failed`, with the provider's reason.
    const failing = await add(anEmail())
    const failingPort = recording(failing.email)
    const failed = await viaRouter(owner.email, 'POST', PERSON_INVITE_PATH, owner.businessId, failingPort.send, {
      ids: [failing.id],
    })
    const [failedResult] = (await failed.json<InviteBody>()).results
    expect(failedResult.status).toBe('failed')
    expect(failedResult.reason).toContain('mailbox does not exist')
  })
})
