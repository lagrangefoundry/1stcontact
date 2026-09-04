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
 * **The invitation provisions the account, and every login binds a verified email
 * to a grant that is still live** — story `story-e7871ed7`, ACs 1591–1603.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real D1
 * database, with the schema applied from `db/migrations` by the same helper the
 * store suites use — so what is proved is the schema that will be deployed rather
 * than a fixture's approximation of it. The end-to-end cases drive the Worker's own
 * `fetch` with a real RS256 Access token, verified against a real JWKS the way a
 * real request would be; nothing about the gate is short-circuited on the way to
 * the thing under test.
 *
 * THE TWO CLAIMS EVERYTHING ELSE SUPPORTS:
 *
 *   1. A VERIFIED EMAIL IS NOT ADMISSION. The Access policy is identity-only
 *      ([[DOC-40]] §3) — one-time PIN, any email — so anyone who can receive mail
 *      reaches this Worker with a token that verifies perfectly. What stops them is
 *      a `users` row they do not have.
 *   2. EXPIRY ACTUALLY EXPIRES. A date-bounded grant whose end is never evaluated is
 *      worse than an open-ended one, because it was promised as bounded — and it is
 *      the one path that never runs during an alpha, so it is the one most likely to
 *      be silently absent. It is driven from both sides here, against a clock the
 *      test supplies rather than against the wall clock.
 */

const PLATFORM = 'story-e7871ed7-platform'
const TEAM = 'https://story-e7871ed7-team.cloudflareaccess.com'
const AUD = 'c'.repeat(64)

/** What the ASSETS binding would serve if the refusal ever fell through to it. */
const ASSET_BYTES = 'the-asset-behind-the-gate'

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
      fetch: async () => new Response(ASSET_BYTES, { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * A REAL Access token — minted, not a fixture.
 *
 * A fixture token expires, and pinning expiry by freezing a fixture proves the
 * freezing. Minting also means the signature the Worker checks is one this process
 * actually produced against the key the stubbed JWKS actually publishes, so an
 * admitted request is admitted by `crypto.subtle.verify`.
 */
async function mint(email?: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'story-e7871ed7-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload: Record<string, unknown> = {
    iss: TEAM,
    aud: [AUD],
    iat: now,
    nbf: now,
    exp: now + 3600,
  }
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

const GET = (token?: string, path = '/'): Request =>
  new Request(
    `https://app.example${path}`,
    token ? { headers: { 'cf-access-jwt-assertion': token } } : undefined,
  )

/** An email nothing else in the run will collide with. */
let seq = 0
const anEmail = (): string => `story-e7871ed7-${(seq += 1)}@example.test`

/** Every identity table at once, for the "and nothing was created" half of a refusal. */
async function counts(): Promise<Record<string, number>> {
  const rows = await env.DB.batch<{ n: number }>([
    env.DB.prepare('SELECT COUNT(*) AS n FROM users'),
    env.DB.prepare('SELECT COUNT(*) AS n FROM tenants'),
    env.DB.prepare('SELECT COUNT(*) AS n FROM memberships'),
    env.DB.prepare('SELECT COUNT(*) AS n FROM entitlements'),
  ])
  const [users, accounts, memberships, entitlements] = rows.map((r) => r.results[0].n)
  return { users, accounts, memberships, entitlements }
}

/** The migration's DDL with its prose stripped — see AC-1601 for why that matters. */
const DDL = migration
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

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
  jwks = { keys: [{ ...jwk, kid: 'story-e7871ed7-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetJwksCache()
})

describe('the invitation provisions the account', () => {
  it('test_UAT_AC1591_an_invitation_creates_person_account_ownership_and_grant_as_one_operation', async () => {
    // The acceptance in its plainest form: one call, and afterwards every row the
    // login path will later look for exists — read back OUT OF D1 rather than out
    // of the return value, because a function that reported what it meant to write
    // would pass this test having written nothing.
    const email = anEmail()
    const endsAt = new Date(Date.now() + 30 * 86_400_000).toISOString()
    const result = await provisionInvite(identityEnv(), { email, endsAt, grantedBy: 'operator' })
    expect(result.created, 'a fresh invitation did not report creating a person').toBe(true)
    expect(result.accountId).toBeTruthy()

    // The person: in the platform's own tenant, active, invited, and NOT yet seen.
    const user = await env.DB.prepare('SELECT * FROM users WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, email)
      .first<{ id: string; status: string; invited_at: string | null; first_seen_at: string | null }>()
    expect(user?.status).toBe('active')
    expect(user?.invited_at, 'an invited person is not stamped as invited').toBeTruthy()
    expect(user?.first_seen_at, 'an invited person has already been seen').toBeNull()

    // The ownership: a row of its own joining that person to that account, in the
    // owner role, live. A column on the user would make an agency account — several
    // memberships against one account — a migration.
    const membership = await env.DB.prepare('SELECT * FROM memberships WHERE user_id = ?')
      .bind(user!.id)
      .first<{ account_id: string; role: string; status: string; revoked_at: string | null }>()
    expect(membership?.account_id).toBe(result.accountId)
    expect(membership?.role).toBe('owner')
    expect(membership?.status).toBe('active')
    expect(membership?.revoked_at).toBeNull()

    // The grant: active, administrative, with a start, with the end the invitation
    // supplied, and carrying BOTH the account it admits to and the email it was
    // made to — the email is the claim key for a grant made before an account
    // exists and the audit record of who it was made to.
    const grant = await env.DB.prepare('SELECT * FROM entitlements WHERE account_id = ?')
      .bind(result.accountId)
      .first<{
        plan: string
        source: string
        status: string
        email: string
        starts_at: string
        ends_at: string | null
      }>()
    expect(grant?.plan).toBe('pro')
    expect(grant?.source).toBe('admin_grant')
    expect(grant?.status).toBe('active')
    expect(grant?.email).toBe(email)
    expect(grant?.starts_at).toBeTruthy()
    expect(grant?.ends_at).toBe(endsAt)

    // The account is a REGISTERED tenant, not merely an id written onto other rows:
    // `forTenant` refuses an unregistered one, so an ownership pointing at an
    // account the registry has never heard of would be a row that can never be used.
    const tenant = await env.DB.prepare('SELECT status FROM tenants WHERE id = ?')
      .bind(result.accountId)
      .first<{ status: string }>()
    expect(tenant?.status).toBe('active')

    // An invitation supplying no end produces an OPEN-ENDED grant rather than one
    // that ends immediately — the other branch of the same argument.
    const openEnded = await provisionInvite(identityEnv(), { email: anEmail() })
    const openGrant = await env.DB.prepare('SELECT ends_at FROM entitlements WHERE account_id = ?')
      .bind(openEnded.accountId)
      .first<{ ends_at: string | null }>()
    expect(openGrant?.ends_at).toBeNull()
  })

  it('test_UAT_AC1592_a_new_account_has_exactly_one_starter_site_at_a_non_colliding_address', async () => {
    // A person logging in for the first time must find something to edit rather than
    // an empty account and a create-site flow that does not exist yet.
    const first = await provisionInvite(identityEnv(), { email: anEmail() })
    const second = await provisionInvite(identityEnv(), { email: anEmail() })

    for (const account of [first, second]) {
      const { results } = await env.DB.prepare('SELECT slug FROM sites WHERE tenant_id = ?')
        .bind(account.accountId)
        .all<{ slug: string }>()
      expect(
        (results ?? []).map((r) => r.slug),
        'a provisioned account did not hold exactly the one site it reported',
      ).toEqual([account.siteSlug])

      const page = await env.DB.prepare(
        'SELECT page FROM site_pages WHERE tenant_id = ? AND slug = ? AND name = ?',
      )
        .bind(account.accountId, account.siteSlug, 'home.json')
        .first<{ page: string }>()
      expect(page?.page).toContain(STARTER_HEADING)
    }

    // THE COLLISION PROPERTY, stated without naming the scheme: a published address
    // is claimed GLOBALLY (`published_sites` is keyed by slug alone, because
    // `/site/<slug>/` carries no tenant), so a starter site called `home` for
    // everybody would work perfectly until the SECOND account published and would
    // then be refused for a reason its owner could do nothing about.
    expect(first.siteSlug).not.toBe(second.siteSlug)
  })

  it('test_UAT_AC1593_the_account_identifier_is_opaque_and_not_derived_from_the_invitation', async () => {
    // An account id appears in R2 keys (`t/<tenant>/blob/…`) and is therefore
    // permanent, so it must not be derived from anything a human chose — a readable
    // id is one rename request away from being a lie. Two invitations carrying
    // IDENTICAL human-chosen inputs, for two different people, must produce
    // unrelated ids, and neither may contain any input it was given.
    const firstEmail = anEmail()
    const secondEmail = anEmail()
    const shared = { accountName: 'Sarah Chen Catering', displayName: 'Sarah Chen' }
    const first = await provisionInvite(identityEnv(), { email: firstEmail, ...shared })
    const second = await provisionInvite(identityEnv(), { email: secondEmail, ...shared })

    expect(first.accountId).not.toBe(second.accountId)
    for (const [id, email] of [
      [first.accountId, firstEmail],
      [second.accountId, secondEmail],
    ] as const) {
      const lower = id.toLowerCase()
      for (const input of [
        shared.accountName,
        shared.displayName,
        email,
        email.split('@')[0],
        'sarah',
        'chen',
        'catering',
      ]) {
        expect(lower, `the account id leaks "${input}"`).not.toContain(input.toLowerCase())
      }
    }

    // The human-readable label the invitation supplied is kept where it CAN change.
    const tenant = await env.DB.prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(first.accountId)
      .first<{ name: string }>()
    expect(tenant?.name).toBe(shared.accountName)
  })

  it('test_UAT_AC1594_re_inviting_a_known_email_reports_it_and_letter_case_is_not_a_difference', async () => {
    // `idx_users_tenant_email` would refuse a second row, and `UNIQUE constraint
    // failed` surfacing out of an admin console is a worse answer than the true one.
    // And SQLite's default collation is BYTE-EXACT, so without normalisation
    // `Sarah@…` and `sarah@…` would be two people and two accounts — the second
    // created by an invitation that looked like it had worked.
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email })
    expect(first.created).toBe(true)

    for (const variant of [email, email.toUpperCase(), `  ${email.toUpperCase()} `]) {
      const again = await provisionInvite(identityEnv(), { email: variant })
      expect(again.created, `inviting "${variant}" again reported creating something`).toBe(false)
      expect(again.user.id).toBe(first.user.id)
      expect(again.accountId).toBe(first.accountId)
    }

    // Exactly one person and one account exist for that address afterwards.
    const { results: people } = await env.DB.prepare(
      'SELECT id FROM users WHERE tenant_id = ? AND email = ?',
    )
      .bind(PLATFORM, email)
      .all<{ id: string }>()
    expect(people ?? []).toHaveLength(1)

    const { results: accounts } = await env.DB.prepare(
      'SELECT DISTINCT account_id FROM memberships WHERE user_id = ?',
    )
      .bind(first.user.id)
      .all<{ account_id: string }>()
    expect(accounts ?? []).toHaveLength(1)

    // …and the same indifference to case on the way IN, at login.
    const admitted = await admit(identityEnv(), `  ${email.toUpperCase()} `)
    expect(admitted.ok, 'a differently-capitalised address was treated as a stranger').toBe(true)
    expect(admitted.ok && admitted.user.id).toBe(first.user.id)
  })

  it('test_UAT_AC1595_an_unconfigured_tenant_or_an_empty_email_refuses_with_an_actionable_message', async () => {
    // A defaulted tenant id would be a misconfigured Worker filing real people into
    // whichever account happened to carry that name — and `idx_users_tenant_email`
    // would then make it permanent. Both operations refuse rather than guess, and
    // the message names what to set and where.
    const before = await counts()

    for (const tenant of ['', '   ', undefined]) {
      const broken = identityEnv({ TENANT_ID: tenant })
      await expect(provisionInvite(broken, { email: anEmail() })).rejects.toBeInstanceOf(
        IdentityNotConfiguredError,
      )
      await expect(admit(broken, anEmail())).rejects.toBeInstanceOf(IdentityNotConfiguredError)
      await expect(provisionInvite(broken, { email: anEmail() })).rejects.toThrow(/TENANT_ID/)
      await expect(admit(broken, anEmail())).rejects.toThrow(/wrangler\.toml/)
    }

    // An invitation with nothing to invite is likewise refused, and says so.
    for (const email of ['', '   ']) {
      await expect(provisionInvite(identityEnv(), { email })).rejects.toThrow(
        /invite needs an email address/i,
      )
    }

    expect(await counts(), 'a refused operation still wrote something').toEqual(before)
  })
})

describe('the login binds, and creates nothing', () => {
  it('test_UAT_AC1596_an_unknown_email_or_an_identity_with_no_email_is_refused_and_provisions_nothing', async () => {
    // Self-signup is a later branch and its ABSENCE is the feature: a login path
    // that quietly provisioned on first sight would make admission unbounded, since
    // anyone with an email address can pass a one-time PIN.
    const before = await counts()

    const stranger = await admit(identityEnv(), anEmail())
    expect(stranger.ok).toBe(false)
    expect(!stranger.ok && stranger.reason).toBe('no_user')

    // A service token authenticates as a `common_name` and carries no email at all,
    // and the email is what an account is bound to. A refusal rather than a crash:
    // automation reaching this Worker is a configuration mistake, not an attack.
    const machine = await admit(identityEnv(), null)
    expect(machine.ok).toBe(false)
    expect(!machine.ok && machine.reason).toBe('no_email')
    expect(!machine.ok && machine.email).toBeNull()

    expect(await counts(), 'a refused login signed someone up').toEqual(before)
  })

  it('test_UAT_AC1597_an_entitled_person_is_admitted_and_every_arrival_including_a_refused_one_is_recorded', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email })

    const admitted = await admit(identityEnv(), email)
    expect(admitted.ok, 'an invited person with a live grant was refused').toBe(true)
    expect(admitted.ok && admitted.user.id).toBe(invited.user.id)
    expect(admitted.ok && admitted.accountId).toBe(invited.accountId)
    expect(admitted.ok && admitted.entitlement.account_id).toBe(invited.accountId)
    expect(admitted.ok && admitted.entitlement.plan).toBe('pro')

    const seen = async () =>
      (await env.DB.prepare('SELECT first_seen_at, last_seen_at FROM users WHERE id = ?')
        .bind(invited.user.id)
        .first<{ first_seen_at: string; last_seen_at: string }>())!

    const first = await seen()
    expect(first.first_seen_at).toBeTruthy()
    expect(first.last_seen_at).toBeTruthy()

    // `first_seen_at` is the FIRST arrival and never moves; `last_seen_at` is the
    // most recent one and always does. A single "seen" column would answer only one
    // of the two questions an operator asks about a customer.
    await admit(identityEnv(), email, new Date(Date.now() + 60_000))
    const second = await seen()
    expect(second.first_seen_at).toBe(first.first_seen_at)
    expect(second.last_seen_at > first.last_seen_at).toBe(true)

    // THE STAMP HAPPENS AHEAD OF THE ADMISSION DECISION, deliberately: an operator
    // asking "did the customer whose access lapsed ever try to get in?" is asking
    // about a REFUSED visit, so a refused visit has to be recorded too.
    await env.DB.prepare('UPDATE entitlements SET status = ? WHERE account_id = ?')
      .bind('revoked', invited.accountId)
      .run()
    const refused = await admit(identityEnv(), email, new Date(Date.now() + 120_000))
    expect(refused.ok).toBe(false)

    const third = await seen()
    expect(third.first_seen_at).toBe(first.first_seen_at)
    expect(
      third.last_seen_at > second.last_seen_at,
      'a refused arrival was not recorded against the person',
    ).toBe(true)
  })

  it('test_UAT_AC1598_a_grants_period_is_evaluated_on_every_login_from_both_ends', async () => {
    // The single most likely silent failure in this story: a date-bounded grant
    // whose expiry is never evaluated is worse than an open-ended one, because it
    // was promised as bounded. Driven against a clock the test supplies — one side
    // alone would pass on code that always denied, or never looked at the date.
    const now = new Date('2026-06-15T12:00:00.000Z')
    const at = (deltaMs: number) => new Date(now.getTime() + deltaMs).toISOString()

    const cases: Array<{ name: string; startsAt: string; endsAt: string | null; admits: boolean }> = [
      { name: 'end already passed', startsAt: at(-86_400_000), endsAt: at(-1_000), admits: false },
      { name: 'end still in the future', startsAt: at(-86_400_000), endsAt: at(86_400_000), admits: true },
      { name: 'no end at all', startsAt: at(-86_400_000), endsAt: null, admits: true },
      { name: 'start not yet reached', startsAt: at(86_400_000), endsAt: null, admits: false },
    ]

    for (const scenario of cases) {
      const email = anEmail()
      const invited = await provisionInvite(identityEnv(), { email })
      await env.DB.prepare('UPDATE entitlements SET starts_at = ?, ends_at = ? WHERE account_id = ?')
        .bind(scenario.startsAt, scenario.endsAt, invited.accountId)
        .run()

      const result = await admit(identityEnv(), email, now)
      expect(result.ok, `a grant whose ${scenario.name} decided the wrong way`).toBe(scenario.admits)
      if (!result.ok) expect(result.reason).toBe('no_entitlement')
    }

    // The evaluation is against the MOMENT OF THE LOGIN, not against a value
    // captured when the grant was written: the same unchanged grant flips from
    // admitting to refusing purely by advancing the clock the login is judged at.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), {
      email,
      startsAt: at(-86_400_000),
      endsAt: at(3_600_000),
    })
    expect((await admit(identityEnv(), email, now)).ok).toBe(true)
    expect((await admit(identityEnv(), email, new Date(now.getTime() + 7_200_000))).ok).toBe(false)

    // …and nothing about the grant itself changed in between.
    const grant = await env.DB.prepare('SELECT status, ends_at FROM entitlements WHERE account_id = ?')
      .bind(invited.accountId)
      .first<{ status: string; ends_at: string }>()
    expect(grant).toEqual({ status: 'active', ends_at: at(3_600_000) })
  })

  it('test_UAT_AC1599_a_revoked_grant_a_withdrawn_ownership_or_a_suspended_person_each_refuse_alone', async () => {
    // A withdrawal holds whatever the dates say, and each of the three stands on its
    // own — checking only the grant would make the other two decorative. In every
    // scenario the OTHER two dimensions are asserted healthy, so the refusal can
    // only have come from the one under test.
    const scenarios: Array<{
      name: string
      reason: string
      withdraw: (accountId: string, userId: string) => Promise<unknown>
    }> = [
      {
        name: 'a revoked grant',
        reason: 'no_entitlement',
        withdraw: (accountId) =>
          env.DB.prepare('UPDATE entitlements SET status = ? WHERE account_id = ?')
            .bind('revoked', accountId)
            .run(),
      },
      {
        name: 'a withdrawn ownership',
        reason: 'no_membership',
        withdraw: (_accountId, userId) =>
          env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?')
            .bind(new Date().toISOString(), userId)
            .run(),
      },
      {
        name: 'an expired ownership',
        reason: 'no_membership',
        withdraw: (_accountId, userId) =>
          env.DB.prepare('UPDATE memberships SET expires_at = ? WHERE user_id = ?')
            .bind(new Date(Date.now() - 1_000).toISOString(), userId)
            .run(),
      },
      {
        name: 'a suspended person',
        reason: 'user_inactive',
        withdraw: (_accountId, userId) =>
          env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind('suspended', userId).run(),
      },
    ]

    for (const scenario of scenarios) {
      const email = anEmail()
      // An OPEN-ENDED grant, so nothing here can be explained by a date.
      const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
      expect((await admit(identityEnv(), email)).ok, `${scenario.name}: was not healthy first`).toBe(
        true,
      )

      await scenario.withdraw(invited.accountId, invited.user.id)

      const refused = await admit(identityEnv(), email)
      expect(refused.ok, `${scenario.name} still admitted`).toBe(false)
      expect(!refused.ok && refused.reason).toBe(scenario.reason)

      // Nothing is repaired to let the caller through, and the two dimensions not
      // under test are still healthy.
      const state = await env.DB.prepare(
        'SELECT u.status AS user_status, m.status AS membership_status, m.revoked_at, ' +
          'e.status AS grant_status, e.ends_at FROM users u ' +
          'LEFT JOIN memberships m ON m.user_id = u.id ' +
          'LEFT JOIN entitlements e ON e.account_id = ? WHERE u.id = ?',
      )
        .bind(invited.accountId, invited.user.id)
        .first<{
          user_status: string
          membership_status: string
          revoked_at: string | null
          grant_status: string
          ends_at: string | null
        }>()

      if (scenario.reason !== 'user_inactive') expect(state?.user_status).toBe('active')
      if (scenario.reason !== 'no_membership') {
        expect(state?.membership_status).toBe('active')
        expect(state?.revoked_at).toBeNull()
      }
      if (scenario.reason !== 'no_entitlement') {
        expect(state?.grant_status).toBe('active')
        expect(state?.ends_at).toBeNull()
      }
    }
  })

  it('test_UAT_AC1600_where_several_live_grants_cover_now_the_longest_lasting_one_decides', async () => {
    // Effective access is a SELECTION over the grants an account has accumulated,
    // not a read of one row: an account whose trial lapsed while its subscription
    // ran must not be locked out by its own history. "Best" is the grant that keeps
    // access LONGEST — open-ended ahead of bounded, later end ahead of earlier.
    const email = anEmail()
    // Created FIRST and ranked LAST, so passing cannot be an artefact of insertion
    // order or of whatever the query planner happened to return.
    const invited = await provisionInvite(identityEnv(), {
      email,
      endsAt: new Date(Date.now() + 3_600_000).toISOString(),
      plan: 'soon',
    })
    const now = new Date().toISOString()
    const insert = (plan: string, endsAt: string | null) =>
      env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, ends_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(newId('ent'), invited.accountId, plan, 'admin_grant', 'active', now, endsAt, now, now)
    // Second created, ranked first; third created, ranked second.
    await env.DB.batch([
      insert('open', null),
      insert('later', new Date(Date.now() + 30 * 86_400_000).toISOString()),
    ])

    const admitted = await admit(identityEnv(), email)
    expect(admitted.ok && admitted.entitlement.plan).toBe('open')

    // Deterministic: the same set of grants always yields the same one.
    const again = await admit(identityEnv(), email)
    expect(again.ok && again.entitlement.id).toBe(admitted.ok ? admitted.entitlement.id : null)

    // Remove the open-ended one and the later-ending bounded grant takes over —
    // not the sooner-ending one it was created before.
    await env.DB.prepare('DELETE FROM entitlements WHERE account_id = ? AND plan = ?')
      .bind(invited.accountId, 'open')
      .run()
    const next = await admit(identityEnv(), email)
    expect(next.ok && next.entitlement.plan).toBe('later')
  })

  it('test_UAT_AC1601_an_account_may_hold_several_grants_and_a_grant_may_name_tomorrows_plan', async () => {
    // The stored shape admits growth WITHOUT a storage change, so introducing a
    // trial plan or a warning state before expiry is a change to the code that
    // decides admission and not a migration of what is stored.
    const accountId = newId('acct')
    const now = new Date().toISOString()

    // Several grants at once. The claim is proved by the database ACCEPTING the
    // second insert — a unique index would refuse it, which is precisely the
    // single-row assumption the model exists to avoid.
    const insert = (plan: string, status: string) =>
      env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(newId('ent'), accountId, plan, 'admin_grant', status, now, now, now)
    await env.DB.batch([insert('pro', 'active'), insert('trial', 'warning')])

    const { results } = await env.DB.prepare(
      'SELECT plan, status FROM entitlements WHERE account_id = ? ORDER BY plan',
    )
      .bind(accountId)
      .all<{ plan: string; status: string }>()
    // Both readable back, and the values no current code path produces come back
    // UNCHANGED rather than coerced or refused.
    expect(results ?? []).toEqual([
      { plan: 'pro', status: 'active' },
      { plan: 'trial', status: 'warning' },
    ])

    // …and the declared shape is what permits it. Asserted over the DDL WITH ITS
    // PROSE STRIPPED: the migration argues at length about check constraints, and
    // matching the word in a comment would be a test that fails on its own
    // explanation.
    expect(DDL).toMatch(/CREATE TABLE IF NOT EXISTS entitlements/)
    expect(DDL, 'a closed value set was added to the grant').not.toMatch(/CHECK/i)
    expect(DDL, 'a one-grant-per-account restriction was added').not.toMatch(
      /CREATE\s+UNIQUE\s+INDEX[^;]*\bON\s+entitlements\b/i,
    )
  })
})

describe('the request path', () => {
  it('test_UAT_AC1602_every_refusal_is_one_uncacheable_unindexable_message_with_the_reason_logged', async () => {
    // Distinguishing "no such person" from "expired grant" on the wire is an
    // account-existence oracle to anyone who can pass a one-time PIN, which is
    // anyone with an email address. So the two refusals must be BYTE-IDENTICAL to
    // the caller, and the distinction must be somewhere the operator can still
    // get at it.
    stubJwks()
    const operatorLog = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const strangerEmail = anEmail()
    const stranger = await worker.fetch(GET(await mint(strangerEmail)), workerEnv())

    const expiredEmail = anEmail()
    const invited = await provisionInvite(identityEnv(), { email: expiredEmail })
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
      .bind(new Date(Date.now() - 1_000).toISOString(), invited.accountId)
      .run()
    const expired = await worker.fetch(GET(await mint(expiredEmail)), workerEnv())

    const strangerBody = await stranger.text()
    const expiredBody = await expired.text()
    expect(expired.status).toBe(stranger.status)
    expect(expired.status).toBe(403)
    expect(expiredBody, 'the two refusals are distinguishable').toBe(strangerBody)
    expect(expiredBody).toBe(DENIED_MESSAGE)

    // The refusal arrives BEFORE any part of the surface behind it. The Access gate
    // and this check both sit ahead of routing, so a page, an asset and an API
    // response are all the same single refusal.
    for (const path of ['/', '/webui/app.js', '/api/site']) {
      const response = await worker.fetch(GET(await mint(strangerEmail), path), workerEnv())
      const body = await response.text()
      expect(response.status, `${path} was not refused`).toBe(403)
      expect(body).toBe(DENIED_MESSAGE)
      expect(body, `${path} served the asset behind the gate`).not.toContain(ASSET_BYTES)
      expect(body, `${path} served the builder behind the gate`).not.toContain('1st Contact builder')
    }

    // Not cacheable and not indexable: one cached refusal would become everybody's
    // answer including the entitled, and an indexed one would publish the existence
    // of the surface by having refused.
    for (const response of [stranger, expired]) {
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('x-robots-tag')).toContain('noindex')
    }

    // The difference the caller is not told is one the OPERATOR can search out of
    // the deployment's own logs, naming both the reason and the email it applied to.
    const denials = operatorLog.mock.calls
      .map((call) => String(call[0]))
      .filter((line) => line.includes('admission_denied'))
      .map((line) => JSON.parse(line) as { reason: string; email: string | null })
    expect(denials).toContainEqual({
      event: 'admission_denied',
      reason: 'no_user',
      email: strangerEmail,
    })
    expect(denials).toContainEqual({
      event: 'admission_denied',
      reason: 'no_entitlement',
      email: expiredEmail,
    })
  })

  it('test_UAT_AC1603_an_invited_and_entitled_person_reaches_the_builder_through_the_real_path', async () => {
    // The half that would otherwise be assumed: the admission check must let the
    // RIGHT person through, not merely refuse the wrong one — a gate that denied
    // everybody would pass every assertion above. End to end: a real RS256 token,
    // verified against a real JWKS, admission decided ahead of any routing, and the
    // surface behind it then served normally.
    stubJwks()
    const email = anEmail()
    await provisionInvite(identityEnv(), { email })

    const admitted = await worker.fetch(GET(await mint(email)), workerEnv())

    expect(admitted.status).toBe(200)
    expect(admitted.headers.get('content-type')).toContain('text/html')
    expect(await admitted.text()).toContain('1st Contact builder')

    // The contrast, on the same path with the same kind of token: an identity that
    // was never invited is refused, so this test cannot be passed by a check that
    // admits everybody either.
    const stranger = await worker.fetch(GET(await mint(anEmail())), workerEnv())
    expect(stranger.status).toBe(403)
    expect(await stranger.text()).toBe(DENIED_MESSAGE)
  })
})
