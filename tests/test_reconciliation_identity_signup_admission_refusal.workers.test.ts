import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  DENIED_MESSAGE,
  ensurePlatformOperator,
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { addContact } from '../apps/control-app/src/people'
import { PERSON_ADD_PATH, PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import { acceptTerms, TERMS_PATH } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * STORY-7b1025b8 — the admission criteria BUNDLE-38 restated: REQ-203 (a contact
 * who is signing up is admitted with nothing, bounded by the terms gate) and
 * BUG-62 (the single refusal sentence, and the one structured log line admission
 * writes per refusal).
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1 with
 * the deployed schema applied. The cases about what a visitor is served drive the
 * Worker's own `fetch` with a real RS256 Access token verified against a real
 * JWKS. Contacts are made through the add and invite routes, or the shipped
 * `addContact`, and the rows are counted out of D1 rather than trusted from a
 * return value. The log is observed by parsing what `console.warn` received.
 */

const PLATFORM = 'story7b1025b8-b38-platform'
const TEAM = 'https://story7b1025b8-b38-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)
const KID = 'story7b1025b8-b38-key'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

/** A deliverable deployment, so the invite route can send ([[REQ-199]]). */
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
    SESSION_COOKIE_NAME: 'session',
    // A recognisable body, so a fall-through to the asset handler is visible.
    ASSETS: { fetch: async () => new Response('ASSET-BYTES', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: KID, typ: 'JWT' }
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

const NAVIGATION = { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }
const SUBRESOURCE = { accept: '*/*' }

async function get(path: string, email: string, headers: Record<string, string> = SUBRESOURCE): Promise<Response> {
  return worker.fetch(
    new Request(`https://app.example${path}`, {
      headers: { ...headers, 'cf-access-jwt-assertion': await mint(email) },
    }),
    workerEnv(),
  )
}

async function post(path: string, email: string, body: unknown, businessId: string): Promise<Response> {
  return worker.fetch(
    new Request(`https://app.example/b/${businessId}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': await mint(email) },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )
}

let seq = 0
const anEmail = (): string => `story7b1025b8-b38-${(seq += 1)}@example.test`
const NOW = (): string => new Date().toISOString()

async function count(table: 'memberships' | 'entitlements'): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>()
  return row?.n ?? 0
}

async function personFor(email: string): Promise<{ id: string; account_id: string; tos_accepted_at: string | null }> {
  const row = await env.DB.prepare(
    'SELECT u.id, u.account_id, u.tos_accepted_at FROM users u WHERE u.tenant_id = ? AND u.id IN ' +
      '(SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?)',
  )
    .bind(PLATFORM, PLATFORM, email)
    .first<{ id: string; account_id: string; tos_accepted_at: string | null }>()
  if (!row) throw new Error(`no person for ${email}`)
  return row
}

/** An owner of the 1st Contact business who has accepted the terms. */
async function anOperator(): Promise<string> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  await acceptTerms(identityEnv(), (await personFor(email)).id)
  return email
}

interface LogLine {
  event?: string
  reason?: string
  email?: string | null
  platformAdminSeed?: boolean
}

/** Every structured `console.warn` line written while `run` was in flight. */
async function logged(run: () => Promise<unknown>): Promise<LogLine[]> {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  let calls: unknown[][] = []
  try {
    await run()
  } finally {
    calls = warn.mock.calls.map((call) => [...call])
    warn.mockRestore()
  }
  return calls
    .map(([first]) => {
      try {
        return JSON.parse(String(first)) as LogLine
      } catch {
        return null
      }
    })
    .filter((line): line is LogLine => line !== null)
}

const denials = (lines: LogLine[]): LogLine[] => lines.filter((l) => l.event === 'admission_denied')

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

describe('a contact who is signing up is admitted with nothing', () => {
  it('test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused', async () => {
    stubJwks()
    const operator = await anOperator()

    // ADD AND INVITE WRITE NO MEMBERSHIP AND NO GRANT.
    const memberships = await count('memberships')
    const entitlements = await count('entitlements')
    const invitee = anEmail()
    const added = await post(PERSON_ADD_PATH, operator, { email: invitee }, PLATFORM)
    expect(added.status).toBe(200)
    const { person } = await added.json<{ person: { id: string } }>()
    const invited = await post(PERSON_INVITE_PATH, operator, { ids: [person.id] }, PLATFORM)
    expect(invited.status).toBe(200)
    const { results } = await invited.json<{ results: Array<{ status: string }> }>()
    expect(results.map((r) => r.status)).toEqual(['sent'])
    expect(await count('memberships'), 'add/invite wrote a membership').toBe(memberships)
    expect(await count('entitlements'), 'add/invite wrote a grant').toBe(entitlements)

    // Signing up (no acceptance, account owns nothing): ADMITTED with no businesses.
    const lead = anEmail()
    await addContact(identityEnv(), { businessId: PLATFORM }, { email: lead, displayName: null })
    for (const [label, email] of [
      ['invited contact', invitee],
      ['lead nobody invited', lead],
    ] as const) {
      expect((await personFor(email)).tos_accepted_at, label).toBeNull()
      const admission = await admit(identityEnv(), email)
      expect(admission.ok, `${label} refused: ${!admission.ok ? admission.reason : ''}`).toBe(true)
      expect(admission.ok && admission.businesses, label).toEqual([])

      // THE ADMISSION OPENS NO ROUTE: a navigation is answered with the terms,
      // and every asset and API request is refused 403.
      const navigation = await get('/', email, NAVIGATION)
      expect(navigation.status, label).toBe(200)
      const page = await navigation.text()
      expect(page, label).toContain('Terms of service')
      expect(page, label).not.toContain('/builder/main.js')
      for (const path of ['/builder/main.js', '/api/sites', '/api/people']) {
        const refused = await get(path, email)
        expect(refused.status, `${label} ${path}`).toBe(403)
        expect(await refused.text(), `${label} ${path}`).not.toContain('ASSET-BYTES')
      }
      const terms = await get(TERMS_PATH, email, NAVIGATION)
      expect(terms.status, label).toBe(200)
    }

    // THE REFUSAL SURVIVES (1): the account owns a business, the only person's
    // membership was withdrawn.
    const withdrawnEmail = anEmail()
    await addContact(identityEnv(), { businessId: PLATFORM }, { email: withdrawnEmail, displayName: null })
    const withdrawn = await personFor(withdrawnEmail)
    await provisionBusiness(identityEnv(), { accountId: withdrawn.account_id, name: 'Withdrawn Co' })
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?').bind(NOW(), withdrawn.id).run()
    const withdrawnLines = await logged(async () => {
      const result = await admit(identityEnv(), withdrawnEmail)
      expect(result.ok).toBe(false)
      expect(!result.ok && result.reason).toBe('no_membership')
    })
    expect(denials(withdrawnLines).map((l) => l.reason)).toEqual(['no_membership'])
    const rendered = await get('/', withdrawnEmail, NAVIGATION)
    expect(rendered.status).toBe(403)
    expect(await rendered.text()).toBe(DENIED_MESSAGE)

    // THE REFUSAL SURVIVES (2): accepted the terms, owns nothing, holds nothing.
    const acceptedEmail = anEmail()
    await addContact(identityEnv(), { businessId: PLATFORM }, { email: acceptedEmail, displayName: null })
    await acceptTerms(identityEnv(), (await personFor(acceptedEmail)).id)
    const accepted = await admit(identityEnv(), acceptedEmail)
    expect(accepted.ok).toBe(false)
    expect(!accepted.ok && accepted.reason).toBe('no_membership')
  })
})

describe('the refusal the visitor reads', () => {
  it('test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable', async () => {
    stubJwks()
    const SENTENCE =
      '1st Contact cannot open this for you at the moment. Please get in touch and we will sort it out.'

    const stranger = anEmail()

    const withdrawnEmail = anEmail()
    const withdrawn = await inviteAccount(identityEnv(), { email: withdrawnEmail, endsAt: null })
    await acceptTerms(identityEnv(), withdrawn.user.id)
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?').bind(NOW(), withdrawn.user.id).run()

    const suspendedEmail = anEmail()
    const suspended = await inviteAccount(identityEnv(), { email: suspendedEmail, endsAt: null })
    await env.DB.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").bind(suspended.user.id).run()

    // An admitted person naming a business that is not theirs.
    const memberEmail = anEmail()
    const member = await inviteAccount(identityEnv(), { email: memberEmail, endsAt: null })
    await acceptTerms(identityEnv(), member.user.id)
    const other = await inviteAccount(identityEnv(), { email: anEmail(), endsAt: null })
    expect((await get(`/b/${member.businessId}/api/sites`, memberEmail)).status, 'own business').toBe(200)

    const responses: Array<[string, Response]> = [
      ['never invited', await get('/', stranger, NAVIGATION)],
      ['withdrawn member', await get('/', withdrawnEmail, NAVIGATION)],
      ['suspended person', await get('/', suspendedEmail, NAVIGATION)],
      ['scope refusal', await get(`/b/${other.businessId}/api/sites`, memberEmail)],
    ]

    const bodies: string[] = []
    for (const [label, response] of responses) {
      const bytes = new Uint8Array(await response.arrayBuffer())
      const body = new TextDecoder().decode(bytes)
      bodies.push(body)
      expect(response.status, label).toBe(403)
      expect(response.status, label).not.toBe(401)
      expect(body, label).toBe(SENTENCE)
      for (const word of ['ended', 'expired', 'revoked']) {
        expect(body.toLowerCase(), `${label} claims '${word}'`).not.toContain(word)
      }
      for (const reason of ['no_user', 'no_email', 'no_membership', 'user_inactive', 'membership', 'suspend', 'member']) {
        expect(body.toLowerCase(), `${label} names '${reason}'`).not.toContain(reason)
      }
      expect(response.headers.get('cache-control'), label).toContain('no-store')
      expect(response.headers.get('x-robots-tag'), label).toContain('noindex')
    }
    expect(new Set(bodies).size, 'the refusals are not byte-identical').toBe(1)
    expect(DENIED_MESSAGE).toBe(SENTENCE)
  })
})

describe('the refusal the operator reads', () => {
  it('test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag', async () => {
    stubJwks()

    // no_email — a caller with no address at all, at the decision itself.
    const noEmail = denials(await logged(() => admit(identityEnv(), null)))
    expect(noEmail).toEqual([{ event: 'admission_denied', reason: 'no_email', email: null, platformAdminSeed: false }])

    const stranger = anEmail()

    const inactive = anEmail()
    const inactiveSeed = await inviteAccount(identityEnv(), { email: inactive, endsAt: null })
    await env.DB.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").bind(inactiveSeed.user.id).run()

    const unmembered = anEmail()
    const unmemberedSeed = await inviteAccount(identityEnv(), { email: unmembered, endsAt: null })
    await acceptTerms(identityEnv(), unmemberedSeed.user.id)
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?').bind(NOW(), unmemberedSeed.user.id).run()

    // The other three, driven THROUGH THE WORKER, so a second line written by the
    // renderer would show up as two.
    for (const [email, reason] of [
      [stranger, 'no_user'],
      [inactive.toUpperCase(), 'user_inactive'],
      [unmembered, 'no_membership'],
    ] as const) {
      const lines = denials(await logged(async () => {
        expect((await get('/', email, NAVIGATION)).status, reason).toBe(403)
      }))
      expect(lines, `${reason}: not exactly one line`).toHaveLength(1)
      expect(lines[0], reason).toEqual({
        event: 'admission_denied',
        reason,
        email: email.toLowerCase(),
        platformAdminSeed: false,
      })
    }

    // An admitted request writes no denial line.
    const admittedEmail = anEmail()
    const admittedSeed = await inviteAccount(identityEnv(), { email: admittedEmail, endsAt: null })
    await acceptTerms(identityEnv(), admittedSeed.user.id)
    const admittedLines = await logged(async () => {
      expect((await get('/api/sites', admittedEmail)).status).toBe(200)
    })
    expect(denials(admittedLines)).toEqual([])

    // The operator list names a DIFFERENT address: no_user, platformAdminSeed false.
    const operator = anEmail()
    const misconfigured = denials(await logged(() =>
      admit(identityEnv({ PLATFORM_ADMINS: anEmail() }), operator),
    ))
    expect(misconfigured).toEqual([
      { event: 'admission_denied', reason: 'no_user', email: operator, platformAdminSeed: false },
    ])
    // Named correctly: seeded, admitted, no denial line.
    const configured = await logged(async () => {
      expect((await admit(identityEnv({ PLATFORM_ADMINS: operator }), operator)).ok).toBe(true)
    })
    expect(denials(configured)).toEqual([])

    // NO ELIGIBLE GRANT IS NOT AN ADMISSION REFUSAL: an admitted person (terms
    // accepted) whose only grant lapsed is refused a business-scoped route, and
    // a separate structured line records the missing business.
    const lapsedEmail = anEmail()
    const lapsed = await inviteAccount(identityEnv(), { email: lapsedEmail, endsAt: null })
    await acceptTerms(identityEnv(), lapsed.user.id)
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(new Date(Date.now() - 1_000).toISOString(), lapsed.businessId)
      .run()
    const lapsedLines = await logged(async () => {
      expect((await get('/api/sites', lapsedEmail)).status).toBe(403)
    })
    expect(denials(lapsedLines), 'a lapsed member was logged as an admission denial').toEqual([])
    expect(lapsedLines).toContainEqual(expect.objectContaining({ event: 'no_business', email: lapsedEmail }))
  })
})
