import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  ensurePlatformOperator,
  findAccount,
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import type { Person } from '../apps/control-app/src/people'
import { acceptTerms, TERMS_ACCEPT_PATH, TERMS_VERSION } from '../apps/control-app/src/terms'
import { PEOPLE_PATH, PERSON_DETAIL_PATH, PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import {
  accessLabel,
  accessOf,
  isMember,
  stageLabel,
  stageOf,
} from '../apps/control-app/src/builder/people-axes.js'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * story-0ea74f39 — **every contact sits on two independent axes**, at the origin.
 *
 * Access (Member / Not a member) is read from terms acceptance; the pipeline
 * stage (Lead → Invited) is a stored value. Every case drives the deployed
 * `fetch` inside workerd against a real D1 with the deployed migrations and a
 * real RS256 Access token verified against a stubbed JWKS — the JWKS fetch is
 * the only external boundary. Labels are taken from `builder/people-axes.js`,
 * the module the Contacts tab draws its rows with, so what is asserted is what
 * the operator sees. The rendering half (rows, facets, stylesheet) is the jsdom
 * sibling; the migration is its own workers file because it needs a database
 * that has not yet run 0009.
 */

const PLATFORM = 'axes-platform'
const TEAM = 'https://axes-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)

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
  const header = { alg: 'RS256', kid: 'axes-key', typ: 'JWT' }
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
const anEmail = (): string => `axes-${(seq += 1)}@example.test`

/** An owner of the platform business who has signed up, seeded the production way. */
async function anOperator(): Promise<string> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const account = await findAccount(identityEnv(), email)
  if (!account) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), account.id)
  return mint(email)
}

/**
 * A contact created by a non-invite route. `pipeline_stage` is deliberately not
 * named: the claim is that a contact arrives at `lead` without anyone writing it.
 */
async function addContact(email: string, extra: Record<string, string | null> = {}): Promise<string> {
  const id = `usr_axes_${(seq += 1)}`
  const now = new Date().toISOString()
  const cols = ['id', 'tenant_id', 'email', 'status', 'created_at', 'updated_at', ...Object.keys(extra)]
  await env.DB.prepare(
    `INSERT INTO users (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
  )
    .bind(id, PLATFORM, email, 'active', now, now, ...Object.values(extra))
    .run()
  return id
}

const call = (token: string, path: string, body?: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/b/${encodeURIComponent(PLATFORM)}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    workerEnv(),
  )

/** The people list, through the route the Contacts tab reads. */
async function listed(token: string): Promise<Person[]> {
  const response = await call(token, PEOPLE_PATH)
  expect(response.status).toBe(200)
  return (await response.json<{ people: Person[] }>()).people
}

async function listedOne(token: string, email: string): Promise<Person> {
  const them = (await listed(token)).find((p) => p.email === email)
  if (!them) throw new Error(`${email} is not in the people list`)
  return them
}

/** What the tab's row would draw for this person: stage label and badge presence. */
const row = (p: Person) => ({ stage: stageLabel(stageOf(p)), badge: isMember(p) })

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
  jwks = { keys: [{ ...jwk, kid: 'axes-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-0ea74f39 — two axes at the origin', () => {
  it('test_UAT_AC2203_member_if_and_only_if_terms_accepted', async () => {
    stubJwks()
    const token = await anOperator()
    const now = new Date().toISOString()
    const accepted = anEmail()
    const seenOnly = anEmail()
    const invitedOnly = anEmail()
    const nothing = anEmail()
    await addContact(accepted, { tos_accepted_at: now, tos_version: TERMS_VERSION })
    await addContact(seenOnly, { first_seen_at: now })
    await addContact(invitedOnly, { invited_at: now, pipeline_stage: 'invited' })
    await addContact(nothing)

    const people = await listed(token)
    const of = (email: string) => people.find((p) => p.email === email)!

    // (a) accepted → Member, with the timestamp carried on the list response.
    expect(of(accepted).termsAcceptedAt).toBeTruthy()
    expect(isMember(of(accepted))).toBe(true)
    expect(accessLabel(accessOf(of(accepted)))).toBe('Member')

    // (b), (c), (d) — first seen, invited, nothing — are all Not a member.
    for (const email of [seenOnly, invitedOnly, nothing]) {
      const p = of(email)
      expect(p.termsAcceptedAt, email).toBeNull()
      expect(isMember(p), email).toBe(false)
      expect(accessOf(p), email).toBe('not_member')
      expect(accessLabel(accessOf(p))).toBe('Not a member')
    }
    expect(of(seenOnly).firstSeenAt, 'first seen must be set and still not count').toBeTruthy()

    // The detail response carries the same timestamp.
    const detail = await call(token, `${PERSON_DETAIL_PATH}?id=${of(accepted).id}`)
    expect(detail.status).toBe(200)
    const body = await detail.json<{ person: Person }>()
    expect(body.person.termsAcceptedAt).toBe(of(accepted).termsAcceptedAt)
  })

  it('test_UAT_AC2204_contact_begins_at_lead', async () => {
    stubJwks()
    const token = await anOperator()
    const email = anEmail()
    const id = await addContact(email)

    const stored = await env.DB.prepare('SELECT pipeline_stage FROM users WHERE id = ?')
      .bind(id)
      .first<{ pipeline_stage: string }>()
    expect(stored?.pipeline_stage).toBe('lead')

    const them = await listedOne(token, email)
    expect(them.pipelineStage).toBe('lead')
    expect(row(them).stage).toBe('Lead')

    const detail = await call(token, `${PERSON_DETAIL_PATH}?id=${id}`)
    expect(detail.status).toBe(200)
    expect((await detail.json<{ person: Person }>()).person.pipelineStage).toBe('lead')
  })

  it('test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp', async () => {
    stubJwks()
    const token = await anOperator()

    // 1. A new address.
    const fresh = anEmail()
    const first = await call(token, PERSON_INVITE_PATH, { email: fresh })
    expect(first.status).toBe(200)
    const made = (await first.json<{ person: Person }>()).person
    expect(made.pipelineStage).toBe('invited')
    expect(made.invitedAt).toBeTruthy()
    expect(made.termsAcceptedAt).toBeNull()
    const readBack = await listedOne(token, fresh)
    expect(readBack.pipelineStage).toBe('invited')
    expect(readBack.termsAcceptedAt).toBeNull()
    expect(row(readBack)).toEqual({ stage: 'Invited', badge: false })

    // 2. The same address again: the original invite time stands.
    await new Promise((resolve) => setTimeout(resolve, 5))
    const again = await call(token, PERSON_INVITE_PATH, { email: fresh })
    expect(again.status).toBe(200)
    const reread = await listedOne(token, fresh)
    expect(reread.invitedAt).toBe(readBack.invitedAt)
    expect(reread.pipelineStage).toBe('invited')

    // 3. An existing Lead who has already accepted the terms.
    const member = anEmail()
    const memberId = await addContact(member)
    await acceptTerms(identityEnv(), memberId)
    const before = await listedOne(token, member)
    expect(before.pipelineStage).toBe('lead')
    expect(before.termsAcceptedAt).toBeTruthy()

    const invitingMember = await call(token, PERSON_INVITE_PATH, { email: member })
    expect(invitingMember.status).toBe(200)
    const after = await listedOne(token, member)
    expect(after.pipelineStage).toBe('invited')
    expect(after.termsAcceptedAt).toBe(before.termsAcceptedAt)
    expect(row(after)).toEqual({ stage: 'Invited', badge: true })
  })

  it('test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage', async () => {
    stubJwks()
    const token = await anOperator()

    // A Lead who may reach the door: membership + entitlement, no invite.
    const lead = anEmail()
    const leadId = await addContact(lead)
    await provisionBusiness(identityEnv(), { accountUserId: leadId, name: 'Lead Co', email: lead, endsAt: null })
    // An Invited contact who may reach the door.
    const invited = anEmail()
    await inviteAccount(identityEnv(), { email: invited, accountName: 'Invited Co', endsAt: null })

    expect((await listedOne(token, lead)).pipelineStage).toBe('lead')
    expect((await listedOne(token, invited)).pipelineStage).toBe('invited')
    expect(isMember(await listedOne(token, lead))).toBe(false)
    expect(isMember(await listedOne(token, invited))).toBe(false)

    // Each accepts the terms with their own token — no operator action.
    for (const email of [lead, invited]) {
      const response = await worker.fetch(
        new Request(`https://app.example${TERMS_ACCEPT_PATH}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': await mint(email) },
          body: JSON.stringify({ version: TERMS_VERSION }),
        }),
        workerEnv(),
      )
      expect(response.ok, await response.text()).toBe(true)
    }

    const leadAfter = await listedOne(token, lead)
    const invitedAfter = await listedOne(token, invited)
    expect(leadAfter.termsAcceptedAt).toBeTruthy()
    expect(invitedAfter.termsAcceptedAt).toBeTruthy()
    expect(leadAfter.pipelineStage).toBe('lead')
    expect(invitedAfter.pipelineStage).toBe('invited')
    expect(row(leadAfter)).toEqual({ stage: 'Lead', badge: true })
    expect(row(invitedAfter)).toEqual({ stage: 'Invited', badge: true })
  })

  it('test_UAT_AC2207_stage_is_the_stored_value_not_inferred', async () => {
    stubJwks()
    const token = await anOperator()
    const now = new Date().toISOString()
    const stampedLead = anEmail()
    const unstampedInvited = anEmail()
    const unknown = anEmail()
    await addContact(stampedLead, { invited_at: now, pipeline_stage: 'lead' })
    await addContact(unstampedInvited, { pipeline_stage: 'invited' })
    await addContact(unknown, { invited_at: now, pipeline_stage: 'qualified' })

    const people = await listed(token)
    const of = (email: string) => people.find((p) => p.email === email)!

    expect(of(stampedLead).invitedAt).toBeTruthy()
    expect(of(stampedLead).pipelineStage).toBe('lead')
    expect(row(of(stampedLead)).stage).toBe('Lead')

    expect(of(unstampedInvited).invitedAt).toBeNull()
    expect(of(unstampedInvited).pipelineStage).toBe('invited')
    expect(row(of(unstampedInvited)).stage).toBe('Invited')

    // An unrecognised stage is reported and displayed as its own value, never Lead.
    expect(of(unknown).pipelineStage).toBe('qualified')
    expect(row(of(unknown)).stage).toBe('qualified')

    // Lead is the fallback only when nothing is stored at all.
    expect(stageLabel(stageOf({ pipelineStage: null }))).toBe('Lead')
  })
})
