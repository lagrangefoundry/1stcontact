import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  DENIED_MESSAGE,
  IdentityNotConfiguredError,
  newId,
  provisionInvite,
  STARTER_HEADING,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'
import migration from '../db/migrations/0004_identity.sql?raw'

/**
 * REQ-167 — **identity, accounts and entitlement**, in workerd.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database, with the schema applied from `db/migrations` by the same helper
 * the store suites use — so what is proved is the schema that will be deployed
 * rather than a fixture's approximation of it. The end-to-end cases drive the
 * Worker's own `fetch` with a real RS256 Access token, verified against a real
 * JWKS the way a real request would be; nothing about the gate is short-circuited
 * on the way to the thing under test.
 *
 * THE TWO CLAIMS THIS FILE EXISTS FOR, stated up front because everything else
 * is supporting work:
 *
 *   1. A VERIFIED EMAIL IS NOT ADMISSION. Cloudflare Access's policy is
 *      identity-only ([[DOC-40]] §3) — one-time PIN, any email — so anyone who can
 *      receive mail can reach this Worker with a token that verifies perfectly.
 *      What stops them is a `users` row they do not have.
 *   2. EXPIRY ACTUALLY EXPIRES. A date-bounded grant whose end date is never
 *      evaluated is worse than an open-ended one, because it was promised as
 *      bounded — and it is the one code path that never runs during an alpha, so
 *      it is the one most likely to be silently absent. It is driven from both
 *      sides here, against dates the test sets rather than against the clock.
 */

const PLATFORM = 'req167-platform'
const TEAM = 'https://req167-team.cloudflareaccess.com'
const AUD = 'c'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

/** The identity module's slice of the Worker's environment. */
function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

/** The whole Worker environment, with Access configured for real verification. */
function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw = typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * A REAL Access token — minted, not a fixture.
 *
 * A fixture token expires, and pinning expiry by freezing a fixture proves the
 * freezing. Minting also means the signature the Worker checks is one this
 * process actually produced against the key the stubbed JWKS actually publishes,
 * so an admitted request is admitted by `crypto.subtle.verify`.
 */
async function mint(email?: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req167-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload: Record<string, unknown> = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600 }
  if (email) payload.email = email
  else payload.common_name = 'deploy-bot.access'
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

/** The team's certs endpoint, and nothing else. */
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

const GET = (token?: string): Request =>
  new Request('https://app.example/', token ? { headers: { 'cf-access-jwt-assertion': token } } : undefined)

/** An email nothing else in the run will collide with. */
let seq = 0
const anEmail = (): string => `req167-${(seq += 1)}@example.test`

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
  jwks = { keys: [{ ...jwk, kid: 'req167-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-167 — the migration', () => {
  it('test_UAT_FC_REQ-167_plan_and_status_carry_no_check_constraint', () => {
    // [[DOC-40]] §5. `plan` and `status` are unconstrained TEXT so that adding
    // `'warning'` when billing lands, or `'trial'` when self-signup lands, is a
    // code change and not a schema migration. A `CHECK (status IN (…))` is
    // exactly the kind of tidiness a later hand adds without seeing what it
    // costs, so the absence is asserted rather than trusted to a comment.
    //
    // Asserted over the DDL WITH ITS PROSE STRIPPED: this file argues at length
    // about check constraints, and matching the word in a comment would be a
    // test that fails on its own explanation.
    const ddl = migration
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
    expect(ddl).toMatch(/CREATE TABLE IF NOT EXISTS entitlements/)
    expect(ddl).not.toMatch(/CHECK/i)
  })

  it('test_UAT_FC_REQ-167_an_account_may_hold_several_grants_at_once', async () => {
    // There is deliberately NO unique index on `entitlements.account_id`: an
    // account accumulates grants over its life and effective access is the best
    // active one covering now. The claim is proved by the database ACCEPTING a
    // second grant — a unique index would refuse this insert, which is precisely
    // the single-row assumption the model exists to avoid.
    const accountId = newId('acct')
    const now = new Date().toISOString()
    for (const plan of ['pro', 'trial']) {
      await env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(newId('ent'), accountId, plan, 'admin_grant', 'active', now, now, now)
        .run()
    }
    const { results } = await env.DB.prepare('SELECT plan FROM entitlements WHERE account_id = ?')
      .bind(accountId)
      .all<{ plan: string }>()
    expect((results ?? []).map((r) => r.plan).sort()).toEqual(['pro', 'trial'])
  })
})

describe('REQ-167 — the invite provisions the account', () => {
  it('test_UAT_FC_REQ-167_an_invite_creates_user_account_membership_grant_and_a_site', async () => {
    // The acceptance in its plainest form: one call, and afterwards every row
    // the login path will look for exists — read back out of D1 rather than out
    // of the return value, because a function that reported what it meant to
    // write would pass this test having written nothing.
    const email = anEmail()
    const result = await provisionInvite(identityEnv(), { email, endsAt: null })
    expect(result.created).toBe(true)

    const user = await env.DB.prepare('SELECT * FROM users WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, email)
      .first<{ id: string; invited_at: string | null; first_seen_at: string | null }>()
    expect(user?.invited_at, 'an invited user is not stamped as invited').toBeTruthy()
    expect(user?.first_seen_at, 'an invited user has already been seen').toBeNull()

    const membership = await env.DB.prepare('SELECT * FROM memberships WHERE user_id = ?')
      .bind(user!.id)
      .first<{ account_id: string; role: string; status: string }>()
    expect(membership?.account_id).toBe(result.businessId)
    expect(membership?.role).toBe('owner')

    const grant = await env.DB.prepare('SELECT * FROM entitlements WHERE account_id = ?')
      .bind(result.businessId)
      .first<{ plan: string; source: string; status: string; email: string }>()
    expect(grant?.plan).toBe('pro')
    expect(grant?.source).toBe('admin_grant')
    expect(grant?.status).toBe('active')
    // Both keys are kept: the email is the claim key for a grant made before an
    // account exists, and the audit record of who it was made to.
    expect(grant?.email).toBe(email)

    // The account is a REGISTERED tenant, not just an id on a membership row —
    // `forTenant` refuses an unregistered one, so a membership pointing at an
    // account the registry has never heard of could never be used.
    const tenant = await env.DB.prepare('SELECT status FROM tenants WHERE id = ?')
      .bind(result.businessId)
      .first<{ status: string }>()
    expect(tenant?.status).toBe('active')
  })

  it('test_UAT_FC_REQ-167_the_new_account_has_one_starter_site_to_edit', async () => {
    // [[REQ-170]]'s starter site, provisioned here: a person logging in for the
    // first time finds something to edit rather than an empty tenant and a
    // create-site flow that does not exist yet.
    const result = await provisionInvite(identityEnv(), { email: anEmail(), endsAt: null })

    const { results } = await env.DB.prepare('SELECT slug FROM sites WHERE tenant_id = ?')
      .bind(result.businessId)
      .all<{ slug: string }>()
    expect((results ?? []).map((r) => r.slug)).toEqual([result.siteSlug])

    const page = await env.DB.prepare(
      'SELECT page FROM site_pages WHERE tenant_id = ? AND slug = ? AND name = ?',
    )
      .bind(result.businessId, result.siteSlug, 'home.json')
      .first<{ page: string }>()
    expect(page?.page).toContain(STARTER_HEADING)

    // The slug is the ACCOUNT ID, and that is a collision property rather than a
    // naming preference: `published_sites` claims a slug GLOBALLY, so a starter
    // site called `home` for everybody would be refused for the second account
    // that published, for a reason its owner could do nothing about.
    expect(result.siteSlug).toBe(result.businessId)
  })

  it('test_UAT_FC_REQ-167_the_account_id_is_opaque_and_not_a_function_of_the_invite', async () => {
    // A tenant id appears in R2 keys and is therefore permanent, so it must not
    // be derived from anything a human chose — a readable id is one rename
    // request away from being a lie. Two invites carrying IDENTICAL inputs but
    // for different people must produce unrelated ids, and neither id may
    // contain any input it was given.
    const first = await provisionInvite(identityEnv(), {
      email: anEmail(),
      accountName: 'Sarah Chen Catering',
      displayName: 'Sarah Chen',
      endsAt: null,
    })
    const second = await provisionInvite(identityEnv(), {
      email: anEmail(),
      accountName: 'Sarah Chen Catering',
      displayName: 'Sarah Chen',
      endsAt: null,
    })

    expect(first.businessId).not.toBe(second.businessId)
    for (const id of [first.businessId, second.businessId]) {
      expect(id).toMatch(/^acct_[0-9a-f]{32}$/)
      expect(id.toLowerCase()).not.toContain('sarah')
      expect(id.toLowerCase()).not.toContain('chen')
      expect(id.toLowerCase()).not.toContain('catering')
    }
    // The human label is kept where it CAN change.
    const tenant = await env.DB.prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(first.businessId)
      .first<{ name: string }>()
    expect(tenant?.name).toBe('Sarah Chen Catering')
  })

  it('test_UAT_FC_REQ-167_re_inviting_an_existing_email_reports_rather_than_duplicates', async () => {
    // The unique index would refuse a second row, and `UNIQUE constraint failed`
    // surfacing out of an admin console is a worse answer than the true one. So
    // the existing person is reported, with the account they already own, and no
    // second account is created.
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, endsAt: null })
    const again = await provisionInvite(identityEnv(), { email, endsAt: null })

    expect(again.created).toBe(false)
    expect(again.businessId).toBe(first.businessId)
    expect(again.user.id).toBe(first.user.id)

    const { results } = await env.DB.prepare(
      'SELECT id FROM users WHERE tenant_id = ? AND email = ?',
    )
      .bind(PLATFORM, email)
      .all<{ id: string }>()
    expect(results ?? []).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-167_a_casefolded_email_is_the_same_person', async () => {
    // SQLite's default collation is byte-exact, so without normalisation
    // `Sarah@…` and `sarah@…` would be two rows, two accounts and one confused
    // person — and the second account would be created by an invite that looked
    // like it had worked.
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, endsAt: null })
    const again = await provisionInvite(identityEnv(), { email: `  ${email.toUpperCase()} `, endsAt: null })
    expect(again.created).toBe(false)
    expect(again.user.id).toBe(first.user.id)

    const admitted = await admit(identityEnv(), email.toUpperCase())
    expect(admitted.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-167_an_unconfigured_platform_tenant_refuses_rather_than_guesses', async () => {
    // A defaulted tenant id would be a misconfigured Worker writing users into
    // whichever account happened to carry that name — the same argument
    // `store.ts` makes for its own refusal.
    await expect(
      provisionInvite(identityEnv({ TENANT_ID: '' }), { email: anEmail(), endsAt: null }),
    ).rejects.toBeInstanceOf(IdentityNotConfiguredError)
  })
})

describe('REQ-167 — login binds, and does not provision', () => {
  it('test_UAT_FC_REQ-167_a_verified_email_with_no_user_row_is_refused_and_nothing_is_created', async () => {
    // Claim 1 of the file header, at its sharpest. Self-signup is [[DOC-40]] §5's
    // later branch, so the refusal must ALSO be a non-write: a login path that
    // quietly provisioned would make admission unbounded.
    const email = anEmail()
    const before = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()

    const result = await admit(identityEnv(), email)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('no_user')
    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()
    expect(after?.n).toBe(before?.n)
  })

  it('test_UAT_FC_REQ-167_an_invited_person_is_admitted_and_their_arrival_is_stamped', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    // REQ-178 moved the business off the admission's singular `accountId` and
    // into the list, one entry per business the account may operate. An invited
    // person holds exactly one, so the shape is a one-element list rather than
    // an id.
    expect(result.ok && result.businesses.map((b) => b.businessId)).toEqual([invited.businessId])
    expect(result.ok && result.businesses[0].entitlement?.plan).toBe('pro')

    const first = await env.DB.prepare('SELECT first_seen_at, last_seen_at FROM users WHERE id = ?')
      .bind(invited.user.id)
      .first<{ first_seen_at: string; last_seen_at: string }>()
    expect(first?.first_seen_at).toBeTruthy()

    // `first_seen_at` is the FIRST arrival and never moves; `last_seen_at` is the
    // most recent one and always does. A single "seen" column would answer only
    // one of the two questions an operator asks about a customer.
    await admit(identityEnv(), email, new Date(Date.now() + 60_000))
    const second = await env.DB.prepare('SELECT first_seen_at, last_seen_at FROM users WHERE id = ?')
      .bind(invited.user.id)
      .first<{ first_seen_at: string; last_seen_at: string }>()
    expect(second?.first_seen_at).toBe(first?.first_seen_at)
    expect(second?.last_seen_at > first!.last_seen_at).toBe(true)
  })

  it('test_UAT_FC_REQ-167_an_expired_grant_refuses_and_an_unexpired_one_admits', async () => {
    // Claim 2 of the file header, driven from BOTH sides against dates the test
    // sets. One side alone would pass on code that always denied, or on code
    // that never evaluated the date at all.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), {
      email,
      endsAt: new Date(Date.now() + 86_400_000).toISOString(),
    })
    expect((await admit(identityEnv(), email)).ok, 'a live grant did not admit').toBe(true)

    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
      .bind(new Date(Date.now() - 1_000).toISOString(), invited.businessId)
      .run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok, 'a grant whose end date has passed still admitted').toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')
  })

  it('test_UAT_FC_REQ-167_a_grant_that_has_not_started_yet_does_not_admit', async () => {
    // The other end of the same window. A grant written ahead of time is a
    // promise about the future, and reading it as access today would let an
    // operator hand out access by scheduling it.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET starts_at = ? WHERE account_id = ?')
      .bind(new Date(Date.now() + 86_400_000).toISOString(), invited.businessId)
      .run()

    expect((await admit(identityEnv(), email)).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-167_a_revoked_grant_refuses_whatever_its_dates_say', async () => {
    // Status and dates refuse INDEPENDENTLY. A revocation that only took effect
    // once the end date arrived would make revoking an open-ended grant a no-op.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET status = ? WHERE account_id = ?')
      .bind('revoked', invited.businessId)
      .run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')
  })

  it('test_UAT_FC_REQ-167_a_revoked_membership_refuses_whatever_the_grant_says', async () => {
    // The membership is a separate refusal from the entitlement, and it has to
    // be: removing a person from an account must not require revoking the
    // account's access, which is what the other users of that account are living
    // on.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?')
      .bind(new Date().toISOString(), invited.user.id)
      .run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_membership')
    // The grant is untouched — the account still has access; this person does not.
    const grant = await env.DB.prepare('SELECT status FROM entitlements WHERE account_id = ?')
      .bind(invited.businessId)
      .first<{ status: string }>()
    expect(grant?.status).toBe('active')
  })

  it('test_UAT_FC_REQ-167_the_best_active_grant_covering_now_is_the_one_that_lasts_longest', async () => {
    // Effective access is a SELECTION over the grants an account has accumulated,
    // not a read of one row. Three grants — one expired, one short, one open —
    // and the answer must be the open one, or an account whose trial lapsed
    // while its subscription ran would be locked out by its own history.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), {
      email,
      endsAt: new Date(Date.now() + 3_600_000).toISOString(),
      plan: 'short',
    })
    const now = new Date().toISOString()
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, ends_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(
        newId('ent'),
        invited.businessId,
        'lapsed',
        'admin_grant',
        'active',
        new Date(Date.now() - 86_400_000).toISOString(),
        new Date(Date.now() - 1_000).toISOString(),
        now,
        now,
      ),
      env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, ends_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)',
      ).bind(newId('ent'), invited.businessId, 'open', 'admin_grant', 'active', now, now, now),
    ])

    const result = await admit(identityEnv(), email)
    expect(result.ok && result.businesses[0].entitlement?.plan).toBe('open')
  })

  it('test_UAT_FC_REQ-167_an_identity_with_no_email_has_nothing_to_bind_to', async () => {
    // A service token authenticates as a `common_name` and carries no email at
    // all, and the email is what an account is bound to ([[DOC-40]] §2). It is a
    // refusal rather than a crash, because automation reaching this Worker is a
    // configuration mistake and not an attack.
    const result = await admit(identityEnv(), null)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('no_email')
  })
})

describe('REQ-167 — the request path', () => {
  it('test_UAT_FC_REQ-167_a_perfectly_valid_access_token_is_refused_without_an_entitlement', async () => {
    // THE WHOLE TICKET, END TO END. The token below verifies — real RS256, real
    // JWKS, the Access gate passes it — and the Worker still refuses, because
    // Access's policy is identity-only and anyone with an email address can get
    // one of these. The refusal is checked to land BEFORE any route: an assets
    // fall-through would mean the gate had already served bytes.
    stubJwks()
    const response = await worker.fetch(GET(await mint(anEmail())), workerEnv())

    expect(response.status).toBe(403)
    expect(await response.text()).toBe(DENIED_MESSAGE)
  })

  it('test_UAT_FC_REQ-167_the_refusal_does_not_say_which_check_failed', async () => {
    // Distinguishing "no such user" from "expired grant" on the wire is an
    // account-existence oracle to anyone who can pass a one-time PIN, which is
    // anyone. So the two refusals must be BYTE-IDENTICAL to the caller, and the
    // distinction must be somewhere the operator can still get at it.
    stubJwks()
    const stranger = await worker.fetch(GET(await mint(anEmail())), workerEnv())

    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
      .bind(new Date(Date.now() - 1_000).toISOString(), invited.businessId)
      .run()
    const expired = await worker.fetch(GET(await mint(email)), workerEnv())

    expect(expired.status).toBe(stranger.status)
    expect(await expired.text()).toBe(await stranger.text())
    // …and the difference the caller is not told is one `admit` still reports.
    expect(!(await admit(identityEnv(), email)).ok).toBe(true)
    expect((await admit(identityEnv(), email)) as { reason: string }).toMatchObject({
      reason: 'no_entitlement',
    })

    // A refusal must not be cacheable or indexable: one cached 403 would become
    // everybody's answer, including the entitled.
    expect(expired.headers.get('cache-control')).toBe('no-store')
    expect(expired.headers.get('x-robots-tag')).toContain('noindex')
  })

  it('test_UAT_FC_REQ-167_an_invited_and_entitled_person_reaches_the_builder', async () => {
    // The other half, and the half that would otherwise be assumed: the second
    // check must let the right person through, not merely refuse the wrong one.
    // A gate that denied everybody would pass every assertion above.
    stubJwks()
    const email = anEmail()
    await provisionInvite(identityEnv(), { email, endsAt: null })

    const response = await worker.fetch(GET(await mint(email)), workerEnv())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('1st Contact builder')
  })
})
