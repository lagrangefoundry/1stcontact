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

/**
 * STORY-7b1025b8 — *the invite provisions the account, login binds it*.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database, with the schema applied from `db/migrations` by the same helper
 * the store suites use — so what is proved is the schema that will be deployed
 * rather than a fixture's approximation of it. The end-to-end criteria drive the
 * Worker's own `fetch` with a real RS256 Access token, verified against a real
 * JWKS the way a real request would be; nothing about the identity gate is
 * short-circuited on the way to the admission check under test.
 *
 * THE ASYMMETRY THE STORY EXISTS FOR. `provisionInvite` creates the whole set —
 * person, account, membership, grant, starter site. `admit` creates nothing: it
 * is lookup plus one arrival stamp, and a proven email with no row behind it is
 * refused rather than signed up. Both halves are asserted, because a gate that
 * refused everybody would satisfy every refusal criterion on its own.
 */

const PLATFORM = 'story7b1025b8-platform'
const TEAM = 'https://story7b1025b8-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

/** The identity module's slice of the Worker's environment. */
function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ...overrides,
  }
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
      fetch: async () => new Response('asset-bytes', { status: 200 }),
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
 * Minting means the signature the Worker checks is one this process actually
 * produced against the key the stubbed JWKS actually publishes, so an admitted
 * request is admitted by `crypto.subtle.verify` rather than by a short circuit.
 * Omitting the email mints a SERVICE token, which authenticates as a
 * `common_name` and is the shape the "no address at all" criterion needs.
 */
async function mint(email?: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'story7b1025b8-key', typ: 'JWT' }
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
        return new Response(JSON.stringify(jwks), {
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

const GET = (token: string, path = '/'): Request =>
  new Request(`https://app.example${path}`, { headers: { 'cf-access-jwt-assertion': token } })

/** An email nothing else in the run will collide with. */
let seq = 0
const anEmail = (): string => `story7b1025b8-${(seq += 1)}@example.test`

const ISO = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString()

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
  jwks = { keys: [{ ...jwk, kid: 'story7b1025b8-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetJwksCache()
})

describe('the invite provisions', () => {
  it('test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant', async () => {
    // Read back out of D1 rather than out of the return value: an operation that
    // reported what it MEANT to write would otherwise pass having written nothing.
    const email = anEmail()
    const result = await provisionInvite(identityEnv(), { email, endsAt: null })
    expect(result.created).toBe(true)

    const user = await env.DB.prepare('SELECT * FROM users WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, email)
      .first<{ id: string; invited_at: string | null; first_seen_at: string | null }>()
    expect(user?.invited_at, 'an invited person is not stamped as invited').toBeTruthy()
    expect(user?.first_seen_at, 'an invited person has already been seen').toBeNull()

    const membership = await env.DB.prepare('SELECT * FROM memberships WHERE user_id = ?')
      .bind(user!.id)
      .first<{ account_id: string; role: string; status: string }>()
    expect(membership?.account_id).toBe(result.accountId)
    expect(membership?.role).toBe('owner')
    expect(membership?.status).toBe('active')

    const grant = await env.DB.prepare('SELECT * FROM entitlements WHERE account_id = ?')
      .bind(result.accountId)
      .first<{ plan: string; source: string; status: string; email: string; starts_at: string; ends_at: string | null }>()
    expect(grant?.plan).toBeTruthy()
    // An administrator issued it — the source is the audit record of that.
    expect(grant?.source).toBe('admin_grant')
    expect(grant?.status).toBe('active')
    expect(grant?.starts_at).toBeTruthy()
    // Open-ended, because the invite supplied no end.
    expect(grant?.ends_at).toBeNull()
    // Both keys are kept: the address is the claim key for a grant made before an
    // account exists, and the audit record of who received it.
    expect(grant?.email).toBe(email)

    // The account is a REGISTERED tenant, not merely an id written on another
    // row — `forTenant` refuses an unregistered one, so a membership pointing at
    // an account the registry never heard of could never be used.
    const tenant = await env.DB.prepare('SELECT status FROM tenants WHERE id = ?')
      .bind(result.accountId)
      .first<{ status: string }>()
    expect(tenant?.status).toBe('active')
  })

  it('test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate', async () => {
    // A tenant id appears in R2 keys and is therefore permanent, so it must not
    // be derived from anything a human chose. Two invites carrying IDENTICAL
    // human inputs for two different people must produce unrelated identifiers.
    const human = { accountName: 'Sarah Chen Catering', displayName: 'Sarah Chen' }
    const first = await provisionInvite(identityEnv(), { email: anEmail(), endsAt: null, ...human })
    const second = await provisionInvite(identityEnv(), { email: anEmail(), endsAt: null, ...human })

    expect(first.accountId).not.toBe(second.accountId)
    for (const id of [first.accountId, second.accountId]) {
      expect(id).toMatch(/^acct_[0-9a-f]{32}$/)
      for (const word of ['sarah', 'chen', 'catering']) {
        expect(id.toLowerCase()).not.toContain(word)
      }
    }

    // The human label lives where it CAN change.
    const tenant = await env.DB.prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(first.accountId)
      .first<{ name: string }>()
    expect(tenant?.name).toBe('Sarah Chen Catering')
  })

  it('test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide', async () => {
    const first = await provisionInvite(identityEnv(), { email: anEmail(), endsAt: null })

    const { results } = await env.DB.prepare('SELECT slug FROM sites WHERE tenant_id = ?')
      .bind(first.accountId)
      .all<{ slug: string }>()
    expect((results ?? []).map((r) => r.slug)).toEqual([first.siteSlug])

    const page = await env.DB.prepare(
      'SELECT page FROM site_pages WHERE tenant_id = ? AND slug = ? AND name = ?',
    )
      .bind(first.accountId, first.siteSlug, 'home.json')
      .first<{ page: string }>()
    expect(page?.page).toContain(STARTER_HEADING)

    // The PROPERTY, not the naming scheme: published addresses are claimed across
    // the whole platform, so two accounts provisioned the same way must not be
    // able to claim the same one. A readable per-account address may replace the
    // current scheme without falsifying this.
    const second = await provisionInvite(identityEnv(), { email: anEmail(), endsAt: null })
    expect(second.siteSlug).not.toBe(first.siteSlug)
  })

  it('test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates', async () => {
    // The unique index would refuse a second row, and `UNIQUE constraint failed`
    // surfacing out of an admin console is a worse answer than the true one.
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, endsAt: null })
    const again = await provisionInvite(identityEnv(), { email, endsAt: null })

    expect(again.created).toBe(false)
    expect(again.user.id).toBe(first.user.id)
    expect(again.accountId).toBe(first.accountId)

    const { results } = await env.DB.prepare('SELECT id FROM users WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, email)
      .all<{ id: string }>()
    expect(results ?? []).toHaveLength(1)

    const memberships = await env.DB.prepare('SELECT id FROM memberships WHERE user_id = ?')
      .bind(first.user.id)
      .all<{ id: string }>()
    expect(memberships.results ?? []).toHaveLength(1)
  })

  it('test_UAT_AC1744_case_and_padding_do_not_make_a_second_person', async () => {
    // SQLite's default collation is byte-exact, so without normalisation
    // `Sarah@…` and `sarah@…` would be two rows, two accounts and one confused
    // person — and the second would be created by an invite that LOOKED like it
    // had worked. Both paths are checked, because normalising only the invite
    // would lock the person out at login instead.
    const email = anEmail()
    const first = await provisionInvite(identityEnv(), { email, endsAt: null })

    const again = await provisionInvite(identityEnv(), {
      email: `  ${email.toUpperCase()} `,
      endsAt: null,
    })
    expect(again.created).toBe(false)
    expect(again.user.id).toBe(first.user.id)

    const admitted = await admit(identityEnv(), email.toUpperCase())
    expect(admitted.ok).toBe(true)
  })

  it('test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing', async () => {
    // A defaulted value would write people into whichever account happened to
    // carry that name — the same refusal the site store already makes.
    const email = anEmail()
    const before = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()

    await expect(
      provisionInvite(identityEnv({ TENANT_ID: '' }), { email, endsAt: null }),
    ).rejects.toBeInstanceOf(IdentityNotConfiguredError)
    // The refusal NAMES what is missing and where to set it.
    await expect(
      provisionInvite(identityEnv({ TENANT_ID: '' }), { email, endsAt: null }),
    ).rejects.toThrow(/TENANT_ID.*wrangler\.toml/s)

    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()
    expect(after?.n).toBe(before?.n)
    const orphan = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string }>()
    expect(orphan).toBeNull()
  })

  it('test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values', async () => {
    // The store places NO value constraint on a grant's plan or status and does
    // not assume one grant per account, so adding a plan, a billing state or a
    // second concurrent grant later is a code change rather than a migration.
    // Proved by the database ACCEPTING both, which a unique index or a CHECK
    // constraint would refuse.
    const accountId = newId('acct')
    const now = new Date().toISOString()

    for (const [plan, status] of [
      ['pro', 'active'],
      ['a-plan-the-product-does-not-issue', 'a-status-the-product-does-not-issue'],
    ]) {
      await env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(newId('ent'), accountId, plan, 'admin_grant', status, now, now, now)
        .run()
    }

    const { results } = await env.DB.prepare(
      'SELECT plan, status FROM entitlements WHERE account_id = ? ORDER BY plan',
    )
      .bind(accountId)
      .all<{ plan: string; status: string }>()

    // Both survive — the account holds two grants at once.
    expect(results ?? []).toHaveLength(2)
    // …and the unrecognised values round-trip EXACTLY: no rejection, no
    // substitution to some recognised default.
    expect(results?.[0]).toEqual({
      plan: 'a-plan-the-product-does-not-issue',
      status: 'a-status-the-product-does-not-issue',
    })
  })
})

describe('login binds, and provisions nothing', () => {
  it('test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing', async () => {
    // Self-signup is a later branch and its absence here is the point: a login
    // path that quietly provisioned would make admission unbounded, because the
    // identity policy admits anyone who can receive an email.
    const before = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()

    const result = await admit(identityEnv(), anEmail())

    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('no_user')

    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()
    expect(after?.n).toBe(before?.n)
  })

  it('test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })

    const first = await admit(identityEnv(), email)
    expect(first.ok).toBe(true)
    expect(first.ok && first.accountId).toBe(invited.accountId)

    const grant = await env.DB.prepare('SELECT id FROM entitlements WHERE account_id = ?')
      .bind(invited.accountId)
      .first<{ id: string }>()
    expect(first.ok && first.entitlement.id).toBe(grant?.id)

    // DETERMINISTIC: the same person with the same memberships resolves to the
    // same account every time, rather than to whatever the planner returned first.
    const second = await admit(identityEnv(), email)
    expect(second.ok && second.accountId).toBe(first.ok && first.accountId)
  })

  it('test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included', async () => {
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })

    const stamps = async (): Promise<{ first_seen_at: string; last_seen_at: string }> =>
      (await env.DB.prepare('SELECT first_seen_at, last_seen_at FROM users WHERE id = ?')
        .bind(invited.user.id)
        .first<{ first_seen_at: string; last_seen_at: string }>())!

    expect((await admit(identityEnv(), email)).ok).toBe(true)
    const arrival = await stamps()
    expect(arrival.first_seen_at, 'no first-arrival stamp after an admission').toBeTruthy()

    // A second, later admission: the first arrival is a fact about the past and
    // must not move; the latest arrival is the question an operator asks about
    // now, and must.
    await admit(identityEnv(), email, new Date(Date.now() + 60_000))
    const returning = await stamps()
    expect(returning.first_seen_at).toBe(arrival.first_seen_at)
    expect(returning.last_seen_at > arrival.last_seen_at).toBe(true)

    // A REFUSED visit is an arrival too — "did the customer whose grant expired
    // ever try?" is a question about a refused visit, so the stamp is made before
    // the decision rather than after it.
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
      .bind(ISO(-1_000), invited.accountId)
      .run()
    const refused = await admit(identityEnv(), email, new Date(Date.now() + 120_000))
    expect(refused.ok).toBe(false)

    const afterRefusal = await stamps()
    expect(afterRefusal.last_seen_at > returning.last_seen_at).toBe(true)
    expect(afterRefusal.first_seen_at).toBe(arrival.first_seen_at)
  })

  it('test_UAT_AC1750_a_grant_end_is_evaluated_from_both_sides', async () => {
    // Both directions are REQUIRED: one alone would pass against code that always
    // denied, or against code that never evaluated the date at all.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: ISO(86_400_000) })
    expect((await admit(identityEnv(), email)).ok, 'a grant that has not ended did not admit').toBe(
      true,
    )

    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
      .bind(ISO(-1_000), invited.accountId)
      .run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok, 'a grant whose end has passed still admitted').toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')
  })

  it('test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit', async () => {
    // Access written ahead of time is a promise about the future, not access
    // today — otherwise an operator could hand out access by scheduling it.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET starts_at = ? WHERE account_id = ?')
      .bind(ISO(86_400_000), invited.accountId)
      .run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')
  })

  it('test_UAT_AC1752_a_revoked_grant_refuses_whatever_its_dates_say', async () => {
    // Revocation and expiry are INDEPENDENT: a revocation that only took effect
    // once an end date arrived would make revoking an open-ended grant a no-op.
    // So the grant below is open-ended and no date is touched.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET status = ? WHERE account_id = ?')
      .bind('revoked', invited.accountId)
      .run()

    const dates = await env.DB.prepare('SELECT ends_at FROM entitlements WHERE account_id = ?')
      .bind(invited.accountId)
      .first<{ ends_at: string | null }>()
    expect(dates?.ends_at, 'the grant under test is no longer open-ended').toBeNull()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.reason).toBe('no_entitlement')
  })

  it('test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone', async () => {
    // Three ways a membership stops admitting, and after each one the ACCOUNT's
    // grant must still be active — removing one person from an account must not
    // remove the access the account's other people are living on.
    const withdrawals: Array<[string, string, string]> = [
      ['revoked', 'UPDATE memberships SET revoked_at = ? WHERE user_id = ?', new Date().toISOString()],
      ['not active', 'UPDATE memberships SET status = ? WHERE user_id = ?', 'suspended'],
      ['expired', 'UPDATE memberships SET expires_at = ? WHERE user_id = ?', ISO(-1_000)],
    ]

    for (const [label, sql, value] of withdrawals) {
      const email = anEmail()
      const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
      await env.DB.prepare(sql).bind(value, invited.user.id).run()

      const refused = await admit(identityEnv(), email)
      expect(refused.ok, `a ${label} membership still admitted`).toBe(false)
      // The reported reason is the MEMBERSHIP, not the entitlement.
      expect(!refused.ok && refused.reason, `a ${label} membership blamed the wrong check`).toBe(
        'no_membership',
      )

      const grant = await env.DB.prepare('SELECT status FROM entitlements WHERE account_id = ?')
        .bind(invited.accountId)
        .first<{ status: string }>()
      expect(grant?.status, `a ${label} membership disturbed the account's grant`).toBe('active')
    }
  })

  it('test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest', async () => {
    // Effective access is a SELECTION over the grants an account has accumulated,
    // not a read of one row — otherwise an account whose trial lapsed while its
    // subscription ran would be locked out by its own history.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), {
      email,
      endsAt: ISO(3_600_000),
      plan: 'ends-shortly',
    })
    const now = new Date().toISOString()
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, ends_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(
        newId('ent'),
        invited.accountId,
        'already-ended',
        'admin_grant',
        'active',
        ISO(-86_400_000),
        ISO(-1_000),
        now,
        now,
      ),
      env.DB.prepare(
        'INSERT INTO entitlements (id, account_id, plan, source, status, starts_at, ends_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)',
      ).bind(newId('ent'), invited.accountId, 'open-ended', 'admin_grant', 'active', now, now, now),
    ])

    // An open-ended grant preserves access longest, so it wins over both.
    const open = await admit(identityEnv(), email)
    expect(open.ok && open.entitlement.plan).toBe('open-ended')

    // Remove it, and the winner is the latest-ending grant still covering now —
    // NOT the lapsed one, which is ignored rather than selected.
    await env.DB.prepare('DELETE FROM entitlements WHERE account_id = ? AND ends_at IS NULL')
      .bind(invited.accountId)
      .run()
    const bounded = await admit(identityEnv(), email)
    expect(bounded.ok && bounded.entitlement.plan).toBe('ends-shortly')
  })

  it('test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed', async () => {
    // An automated caller authenticates as a machine name and carries no email at
    // all, so there is nothing to bind to. It is a REFUSAL rather than a raised
    // error, because automation reaching this surface is a configuration mistake
    // rather than an attack.
    const before = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()

    const result = await admit(identityEnv(), null)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('no_email')
    expect(!result.ok && result.email).toBeNull()

    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()
    expect(after?.n).toBe(before?.n)
  })

  it('test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account', async () => {
    // Suspending one person must not require touching the account other people
    // are living on, so the refusal is about the PERSON and happens before their
    // account is resolved.
    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?')
      .bind('suspended', invited.user.id)
      .run()

    const refused = await admit(identityEnv(), email)
    expect(refused.ok).toBe(false)
    // The reason names the PERSON's status, not the membership or the entitlement.
    expect(!refused.ok && refused.reason).toBe('user_inactive')

    const membership = await env.DB.prepare(
      'SELECT status, revoked_at, expires_at FROM memberships WHERE user_id = ?',
    )
      .bind(invited.user.id)
      .first<{ status: string; revoked_at: string | null; expires_at: string | null }>()
    expect(membership).toMatchObject({ status: 'active', revoked_at: null, expires_at: null })

    const grant = await env.DB.prepare('SELECT status FROM entitlements WHERE account_id = ?')
      .bind(invited.accountId)
      .first<{ status: string }>()
    expect(grant?.status).toBe('active')
  })
})

describe('the request path', () => {
  it('test_UAT_AC1757_admission_is_decided_before_any_route_is_served', async () => {
    // The token below verifies — real RS256, real JWKS, the identity gate passes
    // it — and the Worker still refuses. Several paths, because the failure this
    // guards against is a fall-through: an asset handler answering would mean the
    // gate had already served bytes to someone who was merely able to receive an
    // email.
    stubJwks()
    const token = await mint(anEmail())

    for (const path of ['/', '/assets/app.js', '/no-such-path']) {
      const response = await worker.fetch(GET(token, path), workerEnv())
      expect(response.status, `${path} did not refuse`).toBe(403)
      const body = await response.text()
      expect(body, `${path} served content instead of refusing`).toBe(DENIED_MESSAGE)
      // The asset stub's bytes are the tell that a route ran.
      expect(body).not.toContain('asset-bytes')
    }
  })

  it('test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable', async () => {
    // Distinguishing "no such person" from "expired grant" on the wire is an
    // account-existence oracle to anyone who can pass a one-time PIN, which is
    // anyone with an email address.
    stubJwks()
    const stranger = await worker.fetch(GET(await mint(anEmail())), workerEnv())

    const email = anEmail()
    const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
      .bind(ISO(-1_000), invited.accountId)
      .run()
    const expired = await worker.fetch(GET(await mint(email)), workerEnv())

    const strangerBody = await stranger.text()
    const expiredBody = await expired.text()
    expect(expired.status).toBe(stranger.status)
    expect(expiredBody).toBe(strangerBody)

    // FORBIDDEN, not a challenge: the caller already proved who they are, so
    // sending them back round the login loop would produce the same token and the
    // same refusal forever.
    expect(expired.status).toBe(403)
    expect(expired.status).not.toBe(401)

    // The one message, naming no check.
    expect(expiredBody).toBe(DENIED_MESSAGE)
    for (const hint of ['user', 'membership', 'entitlement', 'grant', 'expired', 'reason']) {
      expect(expiredBody.toLowerCase(), `the refusal hints at '${hint}'`).not.toContain(hint)
    }

    // Neither storable nor indexable — one cached refusal would become
    // everybody's answer, including the entitled.
    expect(expired.headers.get('cache-control')).toBe('no-store')
    expect(expired.headers.get('x-robots-tag')).toContain('noindex')
  })

  it('test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason', async () => {
    // The distinction the caller is not told is one the operator still gets.
    const strangerEmail = anEmail()

    const inactive = anEmail()
    const inactiveInvite = await provisionInvite(identityEnv(), { email: inactive, endsAt: null })
    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?')
      .bind('suspended', inactiveInvite.user.id)
      .run()

    const unmembered = anEmail()
    const unmemberedInvite = await provisionInvite(identityEnv(), { email: unmembered, endsAt: null })
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?')
      .bind(new Date().toISOString(), unmemberedInvite.user.id)
      .run()

    const ungranted = anEmail()
    const ungrantedInvite = await provisionInvite(identityEnv(), { email: ungranted, endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
      .bind(ISO(-1_000), ungrantedInvite.accountId)
      .run()

    // Five causes, five different recorded answers — all distinguishable from one
    // another, which is what makes the record useful to an operator debugging a
    // customer's "it says no".
    const reasons: string[] = []
    for (const address of [null, strangerEmail, inactive, unmembered, ungranted]) {
      const result = await admit(identityEnv(), address)
      expect(result.ok).toBe(false)
      reasons.push(!result.ok ? result.reason : 'admitted')
    }
    expect(reasons).toEqual([
      'no_email',
      'no_user',
      'user_inactive',
      'no_membership',
      'no_entitlement',
    ])
    expect(new Set(reasons).size).toBe(5)

    // …and the operational record for a refused REQUEST carries both the reason
    // and the address, structured rather than prose so refusals can be queried
    // out of the platform's own logs.
    stubJwks()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await worker.fetch(GET(await mint(ungranted)), workerEnv())

    const records = warn.mock.calls
      .map(([line]) => {
        try {
          return JSON.parse(String(line)) as Record<string, unknown>
        } catch {
          return null
        }
      })
      .filter((r): r is Record<string, unknown> => r !== null)
    expect(records).toContainEqual(
      expect.objectContaining({ reason: 'no_entitlement', email: ungranted }),
    )
  })

  it('test_UAT_AC1760_an_invited_and_entitled_person_reaches_the_builder', async () => {
    // The half that would otherwise be assumed: the second check must let the
    // RIGHT person through, not merely refuse the wrong one. A gate that denied
    // everybody would satisfy every refusal criterion above.
    stubJwks()
    const email = anEmail()
    await provisionInvite(identityEnv(), { email, endsAt: null })

    const response = await worker.fetch(GET(await mint(email)), workerEnv())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const body = await response.text()
    expect(body).toContain('1st Contact builder')
    expect(body).not.toContain(DENIED_MESSAGE)
  })
})
