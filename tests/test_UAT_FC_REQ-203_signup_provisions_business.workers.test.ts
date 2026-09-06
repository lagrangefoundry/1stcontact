import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  ensurePlatformOperator,
  STARTER_HEADING,
  STARTER_SLUG,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { addContact, markInvited } from '../apps/control-app/src/people'
import {
  acceptTerms,
  TERMS_ACCEPT_PATH,
  TERMS_PATH,
  TERMS_VERSION,
} from '../apps/control-app/src/terms'
import { ensureOwnBusiness, UNNAMED_BUSINESS_NAME } from '../apps/control-app/src/onboarding'
import { SITE_TAB, TABS } from '../apps/control-app/src/builder/config.js'
import { LEAD } from '../apps/control-app/src/builder/people-axes.js'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'

/**
 * REQ-203 — **an accepted invitee gets a business, a starter site, and lands on
 * the Site tab**.
 *
 * WHAT MAKES THIS EVIDENCE. Every end-to-end case drives the Worker's own
 * `fetch` inside workerd, against a real D1 database with the deployed schema
 * applied, carrying a real RS256 Access token verified against a real JWKS. The
 * person under test is created by the shipped `addContact` — the same call the
 * Contacts tab makes — and nothing seeds them a membership, an entitlement or a
 * business, because their absence IS the state this ticket is about.
 *
 * THE CLAIMS THIS FILE EXISTS FOR:
 *
 *   1. AN INVITED CONTACT IS NO LONGER TOLD THEIR ACCESS HAS ENDED. They are
 *      admitted and served the terms, which is the only thing behind that door.
 *   2. ACCEPTING PROVISIONS A BUSINESS, through `provisionBusiness`, onto the
 *      account they already have — and writes no second `accounts` row, which is
 *      the ticket's own falsifier.
 *   3. IT IS IDEMPOTENT, including across a `TERMS_VERSION` bump, which is the
 *      day every existing member re-accepts.
 *   4. THE RELAXED ADMISSION OPENS NO ROUTE. A session with no membership can
 *      still reach nothing but the interstitial and the accept route.
 */

const PLATFORM = 'req203-platform'
const TEAM = 'https://req203-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    // A recognisable body, so "the asset was served" is an observation rather
    // than an absence of one.
    ASSETS: { fetch: async () => new Response('ASSET-BYTES', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A real Access token — minted here, signed by the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req203-key', typ: 'JWT' }
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

/** What a browser sends when it is going to RENDER the answer. */
const NAVIGATION = { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }
/** What a module script, an `<img>` or a `fetch()` sends. */
const SUBRESOURCE = { accept: '*/*' }

async function call(
  path: string,
  token: string,
  init: RequestInit & { headers?: Record<string, string> } = {},
): Promise<Response> {
  const headers = { ...(init.headers ?? {}), 'cf-access-jwt-assertion': token }
  return worker.fetch(new Request(`https://app.example${path}`, { ...init, headers }), workerEnv())
}

/** The POST the interstitial's own control makes. */
async function accept(token: string): Promise<Response> {
  return call(TERMS_ACCEPT_PATH, token, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version: TERMS_VERSION }),
  })
}

let seq = 0
const anEmail = (): string => `req203-${(seq += 1)}@example.test`

interface Contact {
  email: string
  token: string
  userId: string
  accountId: string
}

/**
 * A contact of 1st Contact with NOTHING ELSE: an account, an address, and no
 * membership, no entitlement and no business.
 *
 * THROUGH `addContact`, which is the call the Contacts tab makes, rather than
 * through `inviteAccount` — that fixture provisions a business, which is the
 * exact state this ticket exists to reach from the other side.
 */
async function aContact(options: { displayName?: string; invited?: boolean } = {}): Promise<Contact> {
  const email = anEmail()
  const made = await addContact(identityEnv(), { businessId: PLATFORM }, {
    email,
    displayName: options.displayName ?? null,
  })
  if (options.invited) await markInvited(identityEnv(), { businessId: PLATFORM }, made.person.id)
  const row = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
    .bind(made.person.id)
    .first<{ account_id: string }>()
  return { email, token: await mint(email), userId: made.person.id, accountId: row!.account_id }
}

async function businessesOwnedBy(accountId: string): Promise<{ id: string; name: string }[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, name FROM tenants WHERE owner_account_id = ? ORDER BY created_at, id',
  )
    .bind(accountId)
    .all<{ id: string; name: string }>()
  return results ?? []
}

async function accountCount(): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM accounts').first<{ n: number }>()
  return row?.n ?? 0
}

beforeAll(async () => {
  await applySchema()
  await d1r2SiteStore(identityEnv()).createTenant({ id: PLATFORM, name: '1st Contact' })
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req203-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-203 — signing up is what gives somebody a business', () => {
  it('test_UAT_FC_REQ-203_an_invited_contact_is_admitted_rather_than_told_their_access_has_ended', async () => {
    // THE STATE THE TICKET OPENS ON. An invited contact holds a `users` row, an
    // address and an account, and no membership at all — the invite deliberately
    // writes neither a membership nor an entitlement. Before this they were
    // refused `no_membership` and shown "your access to 1st Contact has ended",
    // five minutes after being invited.
    stubJwks()
    const contact = await aContact({ invited: true })

    const admission = await admit(identityEnv(), contact.email)
    expect(admission.ok).toBe(true)
    if (admission.ok) expect(admission.businesses).toEqual([])

    const response = await call('/', contact.token, { headers: NAVIGATION })
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(body).toContain('Terms of service')
    expect(body).not.toContain('has ended')
  })

  it('test_UAT_FC_REQ-203_the_relaxed_admission_reaches_the_terms_and_nothing_else', async () => {
    // WHY ADMITTING SOMEBODY WITH NO MEMBERSHIP IS SAFE. `guardTerms` runs
    // immediately after `admit`, so a session that has not signed up is refused
    // every asset and every API route — the assets binding here answers with a
    // recognisable body precisely so a fall-through would be visible rather than
    // inferred. The only doors this admission opens are the two that end it.
    stubJwks()
    const contact = await aContact()

    for (const path of ['/builder/main.js', '/api/sites', '/api/businesses', '/api/material']) {
      const response = await call(path, contact.token, { headers: SUBRESOURCE })
      expect(response.status, `${path} was not refused`).toBe(403)
      expect(await response.text()).not.toContain('ASSET-BYTES')
    }

    // And the terms themselves are reachable, which is the exception that makes
    // the admission worth anything.
    const terms = await call(TERMS_PATH, contact.token, { headers: NAVIGATION })
    expect(terms.status).toBe(200)
    expect(await terms.text()).toContain('Terms of service')
  })

  it('test_UAT_FC_REQ-203_accepting_the_terms_provisions_a_business_with_a_membership_and_an_open_grant', async () => {
    // THE WHOLE OF WHAT A BUSINESS IS, written by `provisionBusiness` and not by
    // a second copy of it: the `tenants` row owned by this account, an `owner`
    // membership for the contact, and an entitlement that is active and
    // open-ended — a dated one would expire somebody out of their own business
    // at a wall-clock time nobody chose.
    stubJwks()
    const contact = await aContact()
    expect(await businessesOwnedBy(contact.accountId)).toEqual([])

    const response = await accept(contact.token)
    expect(response.status).toBe(204)

    const owned = await businessesOwnedBy(contact.accountId)
    expect(owned).toHaveLength(1)
    const businessId = owned[0].id

    const membership = await env.DB.prepare(
      'SELECT role, status FROM memberships WHERE user_id = ? AND business_id = ?',
    )
      .bind(contact.userId, businessId)
      .first<{ role: string; status: string }>()
    expect(membership).toEqual({ role: 'owner', status: 'active' })

    const grant = await env.DB.prepare(
      'SELECT status, ends_at, account_id FROM entitlements WHERE business_id = ?',
    )
      .bind(businessId)
      .first<{ status: string; ends_at: string | null; account_id: string | null }>()
    expect(grant?.status).toBe('active')
    // OPEN-ENDED, which is what `ends_at` null means.
    expect(grant?.ends_at).toBeNull()
    // A CAPACITY GRANT, subject absent — the business holds the plan, not the
    // person, so a second member does not need re-granting.
    expect(grant?.account_id).toBeNull()
  })

  it('test_UAT_FC_REQ-203_no_second_account_is_written_and_the_business_belongs_to_the_one_they_had', async () => {
    // THE TICKET'S OWN FALSIFIER: an `INSERT INTO accounts` on this path.
    // `addContact` mints an account alongside every contact — including a Lead
    // nobody will ever bill — precisely so there is no row that names none, so
    // minting a second here would give one person two and put the payer
    // somewhere no reader expects.
    stubJwks()
    const contact = await aContact()
    const before = await accountCount()

    expect((await accept(contact.token)).status).toBe(204)

    expect(await accountCount()).toBe(before)
    const owned = await businessesOwnedBy(contact.accountId)
    expect(owned).toHaveLength(1)
    // And the account the business names is the one on their own row.
    const user = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
      .bind(contact.userId)
      .first<{ account_id: string }>()
    expect(user?.account_id).toBe(contact.accountId)
  })

  it('test_UAT_FC_REQ-203_the_new_business_has_a_starter_site_that_is_servable_at_once', async () => {
    // The shortest path from "I was invited" to "I am using it" is a site that
    // is already there to edit. Read back through the store's own handle rather
    // than out of a row, because that is what the builder serves from.
    stubJwks()
    const contact = await aContact()
    expect((await accept(contact.token)).status).toBe(204)

    const businessId = (await businessesOwnedBy(contact.accountId))[0].id
    const store = await d1r2SiteStore(identityEnv()).forTenant(businessId)
    expect(await store.hasDraft(STARTER_SLUG)).toBe(true)
    const pages = await store.readPages(STARTER_SLUG)
    expect(pages.map((p) => p.name)).toEqual(['home.json'])
    expect(JSON.stringify(pages[0])).toContain(STARTER_HEADING)
  })

  it('test_UAT_FC_REQ-203_accepting_a_second_time_provisions_nothing_further', async () => {
    // IDEMPOTENT, AND THE REASON IS NOT HYPOTHETICAL. `needsAcceptance` compares
    // against `TERMS_VERSION`, so the day the terms change every existing member
    // re-accepts — and a naive version of this would hand each of them a second
    // business, with a second starter site, on a document revision. The guard is
    // `tenants.owner_account_id`.
    stubJwks()
    const contact = await aContact()

    expect((await accept(contact.token)).status).toBe(204)
    const first = await businessesOwnedBy(contact.accountId)
    expect(first).toHaveLength(1)

    // A second press of the same button.
    expect((await accept(contact.token)).status).toBe(204)
    expect(await businessesOwnedBy(contact.accountId)).toEqual(first)

    // And the terms-bump case, driven by moving the STORED version backwards —
    // which is what a person accepted at the previous document looks like on the
    // day the constant moves.
    await env.DB.prepare('UPDATE users SET tos_version = ? WHERE id = ?')
      .bind('2020-01-01', contact.userId)
      .run()
    expect((await accept(contact.token)).status).toBe(204)
    expect(await businessesOwnedBy(contact.accountId)).toEqual(first)
  })

  it('test_UAT_FC_REQ-203_an_operator_who_re_accepts_is_not_given_a_business_of_their_own', async () => {
    // THE PLATFORM BUSINESS NAMES NO OWNER — that is the schema's rule, because
    // 1st Contact is not somebody's product. So "does this account own a
    // business" answers no for an operator, and the guard that keeps them from
    // being handed one is the membership they already hold.
    stubJwks()
    const email = anEmail()
    await ensurePlatformOperator(identityEnv(), email)
    const token = await mint(email)
    const user = await env.DB.prepare(
      'SELECT u.id AS id, u.account_id AS account_id FROM users u ' +
        'JOIN user_emails e ON e.user_id = u.id WHERE e.email = ?',
    )
      .bind(email)
      .first<{ id: string; account_id: string }>()

    expect((await accept(token)).status).toBe(204)

    expect(await businessesOwnedBy(user!.account_id)).toEqual([])
    const { results } = await env.DB.prepare(
      'SELECT business_id FROM memberships WHERE user_id = ?',
    )
      .bind(user!.id)
      .all<{ business_id: string }>()
    expect((results ?? []).map((r) => r.business_id)).toEqual([PLATFORM])
  })

  it('test_UAT_FC_REQ-203_after_accepting_they_land_in_the_builder_and_the_site_tab_is_first', async () => {
    // WHERE THEY LAND. Acceptance returns them to the builder root and the
    // default tab stands — no new destination is invented, because `SITE_TAB` is
    // already first in `TABS`.
    stubJwks()
    const contact = await aContact()

    // Before: the interstitial, served AT the URL they asked for.
    expect(await (await call('/', contact.token, { headers: NAVIGATION })).text()).toContain(
      'Terms of service',
    )

    expect((await accept(contact.token)).status).toBe(204)

    const after = await call('/', contact.token, { headers: NAVIGATION })
    const body = await after.text()
    expect(after.status).toBe(200)
    expect(body).toContain('/builder/main.js')
    expect(body).not.toContain('Terms of service')

    expect(TABS[0]).toBe(SITE_TAB)
    expect(SITE_TAB.id).toBe('site')

    // AND THE CONTROL ITSELF SENDS THEM THERE FROM THE TERMS PATH, which is the
    // one page a reload would leave them sitting on — correctly, since an
    // accepted caller may still read what they agreed to, and uselessly for a
    // brand new invitee who came to build a site.
    const page = await (await call(TERMS_PATH, contact.token, { headers: NAVIGATION })).text()
    expect(page).toContain(`location.pathname === "${TERMS_PATH}"`)
    expect(page).toContain("location.assign('/')")
  })

  it('test_UAT_FC_REQ-203_a_lead_nobody_invited_is_treated_identically', async () => {
    // NOTHING HERE BRANCHES ON PIPELINE STAGE. Being asked is one axis and
    // signing up is the other, and this path reads only the second — so a Lead
    // who somehow reaches the terms page gets exactly what an invitee gets, and
    // their stage is left exactly where it was.
    stubJwks()
    const contact = await aContact()
    const before = await env.DB.prepare('SELECT pipeline_stage FROM users WHERE id = ?')
      .bind(contact.userId)
      .first<{ pipeline_stage: string }>()
    expect(before?.pipeline_stage).toBe(LEAD)

    expect((await accept(contact.token)).status).toBe(204)

    expect(await businessesOwnedBy(contact.accountId)).toHaveLength(1)
    const after = await env.DB.prepare('SELECT pipeline_stage FROM users WHERE id = ?')
      .bind(contact.userId)
      .first<{ pipeline_stage: string }>()
    expect(after?.pipeline_stage).toBe(LEAD)
  })

  it('test_UAT_FC_REQ-203_the_business_is_named_after_the_contact_or_visibly_unnamed', async () => {
    // They have not been asked yet, because the flow that asks does not exist.
    // So: their own display name where they have one, otherwise a name that
    // reads as obviously provisional — the operator sees it in the Contacts tab
    // before the invitee ever renames it, and `tenants.name` may change.
    stubJwks()
    const named = await aContact({ displayName: 'Sarah Jones' })
    expect((await accept(named.token)).status).toBe(204)
    expect((await businessesOwnedBy(named.accountId))[0].name).toBe('Sarah Jones')

    const nameless = await aContact()
    expect((await accept(nameless.token)).status).toBe(204)
    expect((await businessesOwnedBy(nameless.accountId))[0].name).toBe(UNNAMED_BUSINESS_NAME)
    // Provisional rather than a decision somebody made, on `STARTER_SLUG`'s
    // argument: a name that reads as settled gives nobody a reason to change it.
    expect(UNNAMED_BUSINESS_NAME.toLowerCase()).toContain('unnamed')
  })

  it('test_UAT_FC_REQ-203_a_member_who_holds_nothing_is_still_refused', async () => {
    // THE REFUSAL THAT SURVIVES. `no_membership` names a relationship that
    // ENDED, which is the one state "your access to 1st Contact has ended" is
    // true about — so somebody who has signed up and holds nothing is still
    // turned away at the door, and the relaxation is exactly the not-yet case.
    stubJwks()
    const contact = await aContact()
    await acceptTerms(identityEnv(), contact.userId)

    const admission = await admit(identityEnv(), contact.email)
    expect(admission.ok).toBe(false)
    if (!admission.ok) expect(admission.reason).toBe('no_membership')

    const response = await call('/', contact.token, { headers: NAVIGATION })
    expect(response.status).toBe(403)
  })

  it('test_UAT_FC_REQ-203_provisioning_is_the_hook_and_reports_whether_it_acted', async () => {
    // THE HOOK ITSELF, which a real onboarding flow takes the place of. It
    // returns the business it made and NULL when it made none, so a no-op is
    // distinguishable from the act at every call site that logs or reports —
    // and it refuses a contact with no account rather than minting one.
    const seeded = await inviteAccount(identityEnv(), { email: anEmail(), endsAt: null })
    expect(await ensureOwnBusiness(identityEnv(), seeded.user)).toBeNull()

    const contact = await aContact()
    const made = await ensureOwnBusiness(identityEnv(), {
      id: contact.userId,
      account_id: contact.accountId,
    })
    expect(made?.siteSlug).toBe(STARTER_SLUG)
    expect(await ensureOwnBusiness(identityEnv(), {
      id: contact.userId,
      account_id: contact.accountId,
    })).toBeNull()

    await expect(
      ensureOwnBusiness(identityEnv(), { id: contact.userId, account_id: '' }),
    ).rejects.toThrow(/account/)
  })
})
