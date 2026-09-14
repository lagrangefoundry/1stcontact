import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import {
  HostnameAlreadyHeldError,
  HostnameTakenError,
  InvalidHostnameError,
  PLATFORM_APEX,
  RESERVED_INFRASTRUCTURE,
  RESERVED_LABELS,
  RESERVED_PLATFORM_IDENTITY,
  RESERVED_PROTOCOL,
  ReservedHostnameError,
  addressesOf,
  businessAddresses,
  checkHostname,
  claimHostname,
  revokeHostname,
} from '../apps/control-app/src/hostname'
import { isOpaqueId } from '../tools/generate/src/store/ids'
import {
  HOSTNAME_CHECK_PATH,
  HOSTNAME_CLAIM_PATH,
  HOSTNAME_PATH,
  HOSTNAME_REVOKE_PATH,
} from '../apps/control-app/src/router'
import { businessPath } from '../apps/control-app/src/scope'
import { acceptTerms } from '../apps/control-app/src/terms'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-238 — **the `1stc.site` hostname: chosen once, and required before
 * publishing.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs against a real D1 database with the
 * deployed schema — the migration list this product actually applies, including
 * `0008`'s unique index on `host`, which is the thing most of these claims are
 * ABOUT. Every business is made by the shipped `inviteAccount` → `provisionBusiness`
 * path, so the sites addresses are claimed for are sites the product minted. The
 * route cases drive the WORKER'S OWN `fetch` inside workerd with a real RS256
 * Access token verified against a real JWKS.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. `site_domains` PER [[DOC-45]] §5 — an opaque primary key, `site_id` naming
 *     the site by key, `host` with a UNIQUE INDEX, `kind`, `status`. *"The host
 *     is an attribute with a unique index and never a primary key."*
 *  2. THE SYNTACTIC RULES ARE ENFORCED — 1–63 characters, `a-z0-9-`, no leading
 *     or trailing hyphen, and `xn--` refused *"so nobody hand-rolls a punycode
 *     lookalike"*.
 *  3. THE RESERVED TECHNICAL FAMILY IS REFUSED, in [[TODO-6]] §2's three built
 *     groups — and the fourth group is deliberately NOT built, which is a
 *     decision this suite pins rather than a gap it ignores.
 *  4. A CHECK IS NOT A PROMISE AND THE CLAIM IS THE AUTHORITY. Two customers can
 *     check the same name in the same second and both be told yes; the unique
 *     index decides, and the loser is refused at the claim — *"that one went
 *     while you were deciding"*.
 *  5. FINAL. **There is no update path on `host`** — not a guarded one, not an
 *     operator-only one — and one business holds one hostname, at a time.
 *  6. REVOCATION EXISTS FROM DAY ONE ([[TODO-6]] §2), it is ours and not the
 *     owner's, and **a revoked host is never re-issued**.
 *  7. THE TWO OPERATIONS STAND ALONE. *"A route to claiming a hostname that
 *     exists only inside a conversation"* is a falsifier, so both are reachable
 *     by a browser with no conversation anywhere in the picture.
 *  8. THE CHOICE IS PRESENTED AS THE WHOLE HOST — `alice.1stc.site`, never a
 *     bare label, in every value that leaves this module.
 */

const PLATFORM = 'req238-platform'
const TEAM = 'https://req238-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ...overrides,
  }
}

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
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
  const header = { alg: 'RS256', kid: 'req238-key', typ: 'JWT' }
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
const anEmail = (): string => `req238-${(seq += 1)}@example.test`

/**
 * A LABEL NOTHING ELSE IN THE SUITE WILL ASK FOR.
 *
 * `1stc.site` is a first-come namespace and nothing is ever re-issued, so a
 * shared spelling would make a case pass or fail depending on which ran first.
 * Cases that care about a particular word claim it themselves against a business
 * they made.
 */
const aLabel = (): string => `req238x${(seq += 1)}`

/** An account holding one business with one site, through the shipped path. */
async function anAccount(name = 'Unnamed business') {
  const invited = await inviteAccount(identityEnv(), {
    email: anEmail(),
    accountName: name,
    endsAt: null,
  })
  await acceptTerms(identityEnv(), invited.user.id)
  return invited
}

/** The same, plus a signed-in owner who can drive the routes. */
async function anOwner(name = 'Unnamed business') {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), invited.user.id)
  return { ...invited, email, token: await mint(email) }
}

const call = (
  token: string | null,
  businessId: string,
  routePath: string,
  init: RequestInit = {},
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${businessPath(businessId, routePath)}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
        ...(init.headers ?? {}),
      },
    }),
    workerEnv(),
  )

beforeAll(async () => {
  await applySchema()
  await env.DB.prepare(
    "INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES (?, ?, 'active', ?)",
  )
    .bind(PLATFORM, 'REQ-238 platform', new Date(0).toISOString())
    .run()
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req238-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

// ── the mapping table, per DOC-45 §5 ─────────────────────────────────────────

describe('REQ-238 — site_domains, per DOC-45 §5', () => {
  it('test_UAT_FC_REQ-238_the_host_is_an_attribute_with_a_unique_index_and_never_a_key', async () => {
    // THE RULE THIS ROW IS A TEST OF: no data field is ever a key. The hostname
    // is a name somebody chose and typed, so it is an attribute with an opaque
    // surrogate beside it — AND it is globally unique, because DNS is a global
    // namespace whether we like it or not. Both facts, recorded separately.
    const account = await anAccount()
    const label = aLabel()

    const claimed = await claimHostname(identityEnv(), account.businessId, label)

    expect(isOpaqueId(claimed.id, 'dom')).toBe(true)
    expect(claimed.siteKey).toBe(account.siteKey)
    expect(claimed.kind).toBe('platform')
    expect(claimed.host).toBe(`${label}.${PLATFORM_APEX}`)

    // ONE ROW FOR ONE HOST. A mapping table with two would simply be broken: a
    // request carries exactly one `Host:` and the answer has to be one site.
    const row = await env.DB.prepare(
      'SELECT id, site_id, host, kind, status FROM site_domains WHERE host = ?',
    )
      .bind(claimed.host)
      .all<{ id: string; site_id: string; host: string; kind: string; status: string }>()
    expect(row.results).toHaveLength(1)
    expect(row.results![0]).toMatchObject({
      site_id: account.siteKey,
      host: claimed.host,
      kind: 'platform',
      status: 'active',
    })
  })

  it('test_UAT_FC_REQ-238_the_unique_index_refuses_a_second_row_for_one_host', async () => {
    // THE DATABASE IS THE AUTHORITY AND NOT THE CODE, which is the opposite
    // arrangement from `0007`'s business-name index. Asserted against the
    // database directly, because what is being claimed is a property of the
    // schema rather than of the function that writes through it.
    const account = await anAccount()
    const claimed = await claimHostname(identityEnv(), account.businessId, aLabel())

    const second = await env.DB.prepare(
      "INSERT INTO site_domains (id, site_id, host, kind, status, created_at) " +
        "VALUES ('dom_second', 'site_other', ?, 'platform', 'active', ?)",
    )
      .bind(claimed.host, new Date().toISOString())
      .run()
      .catch((error: unknown) => error)

    expect(second).toBeInstanceOf(Error)
  })
})

// ── the syntactic rules ──────────────────────────────────────────────────────

describe('REQ-238 — the syntactic rules are enforced', () => {
  const REFUSED: Array<[string, string]> = [
    ['', 'an empty label is not a hostname'],
    ['a'.repeat(64), '64 characters is one past the DNS limit'],
    ['-alice', 'a leading hyphen'],
    ['alice-', 'a trailing hyphen'],
    ['al_ice', 'an underscore is outside a-z0-9-'],
    ['al ice', 'a space is outside a-z0-9-'],
    ['al.ice', 'a dot would be a second label'],
    ['xn--pple-43d', 'a hand-rolled punycode lookalike'],
  ]

  it.each(REFUSED)('test_UAT_FC_REQ-238_refuses_%s', async (label) => {
    // THE CHECK AND THE CLAIM APPLY THE SAME RULE, which is what stops the field
    // telling somebody a name is free and then refusing it — the one thing a
    // registrar's box must never do.
    const account = await anAccount()

    const checked = await checkHostname(identityEnv(), label)
    expect(checked.available).toBe(false)
    expect(checked.refusal).toBeTruthy()

    const refused = await claimHostname(identityEnv(), account.businessId, label).catch(
      (error: unknown) => error,
    )
    expect(refused).toBeInstanceOf(InvalidHostnameError)
    expect(await businessAddresses(identityEnv(), account.businessId)).toEqual([])
  })

  it('test_UAT_FC_REQ-238_sixty_three_characters_is_allowed_and_sixty_four_is_not', async () => {
    // THE BOUNDARY IS THE DNS ONE, asserted on both sides of itself so that a
    // rule written with the wrong comparison cannot pass.
    const sixtyThree = `r${'a'.repeat(62)}`
    expect((await checkHostname(identityEnv(), sixtyThree)).available).toBe(true)
    expect((await checkHostname(identityEnv(), `${sixtyThree}a`)).available).toBe(false)
  })
})

// ── the reserved technical family ────────────────────────────────────────────

describe('REQ-238 — the reserved technical family is refused', () => {
  it('test_UAT_FC_REQ-238_every_label_the_ticket_names_is_refused', async () => {
    // THE FAILURE IS NOT SYMMETRIC: a label wrongly refused is a mild annoyance,
    // and a label wrongly granted is unrecoverable once somebody is using it as
    // their business address — which finality makes literally true.
    const account = await anAccount()
    for (const label of [
      'www',
      'app',
      'api',
      'mail',
      'admin',
      'ns1',
      'mx',
      '_acme-challenge',
      'portal',
      'support',
      '1stcontact',
    ]) {
      const checked = await checkHostname(identityEnv(), label)
      expect(checked.available, label).toBe(false)
      const refused = await claimHostname(identityEnv(), account.businessId, label).catch(
        (error: unknown) => error,
      )
      // `_acme-challenge` IS REFUSED BY THE CHARACTER RULE BEFORE THE LIST IS
      // REACHED, which is why the assertion is on the refusal and not on its
      // class. It is on the list anyway so that widening the character set later
      // cannot silently hand somebody the label certificate issuance runs on.
      expect(refused, label).toBeInstanceOf(Error)
      expect((refused as Error).message, label).toBeTruthy()
    }
  })

  it('test_UAT_FC_REQ-238_the_three_built_groups_stay_separate_in_code', () => {
    // FOUR GROUPS BECAUSE THEY CHANGE FOR FOUR DIFFERENT REASONS ([[TODO-6]] §2),
    // and flattening them into one array is how the reason a label is on the list
    // gets lost. Three are built; the fourth is not.
    for (const group of [
      RESERVED_INFRASTRUCTURE,
      RESERVED_PROTOCOL,
      RESERVED_PLATFORM_IDENTITY,
    ]) {
      expect(group.length).toBeGreaterThan(0)
      for (const label of group) expect(RESERVED_LABELS.has(label)).toBe(true)
    }
    // EACH GROUP HOLDS WHAT ITS NAME SAYS, so a label cannot be moved between
    // them by accident and lose the reason it is refused.
    expect(RESERVED_INFRASTRUCTURE).toContain('www')
    expect(RESERVED_PROTOCOL).toContain('_acme-challenge')
    expect(RESERVED_PLATFORM_IDENTITY).toContain('1stcontact')
  })

  it('test_UAT_FC_REQ-238_what_is_refused_beyond_the_technical_family_is_not_decided_here', async () => {
    // DELIBERATELY NOT DECIDED ([[DOC-45]] §11 item 6). A substring blocklist
    // eventually refuses a real business its real name, and answering it badly is
    // worse than deferring it — so a brand name and an ordinary word are treated
    // alike, and REVOCATION is what carries the gap meanwhile.
    expect((await checkHostname(identityEnv(), 'hsbc')).available).toBe(true)
    expect(RESERVED_LABELS.has('hsbc')).toBe(false)
  })
})

// ── a check is not a promise; the claim is the authority ─────────────────────

describe('REQ-238 — check is not a promise, and claim is the authority', () => {
  it('test_UAT_FC_REQ-238_two_businesses_are_both_told_yes_and_the_second_claim_is_refused', async () => {
    // THE RACE, STATED AND THEN RUN. Both are told yes because a check reserves
    // nothing; the unique index decides; the loser is refused at the claim rather
    // than handed a duplicate.
    const first = await anAccount()
    const second = await anAccount()
    const label = aLabel()

    expect((await checkHostname(identityEnv(), label)).available).toBe(true)
    expect((await checkHostname(identityEnv(), label)).available).toBe(true)

    await claimHostname(identityEnv(), first.businessId, label)
    const refused = await claimHostname(identityEnv(), second.businessId, label).catch(
      (error: unknown) => error,
    )

    expect(refused).toBeInstanceOf(HostnameTakenError)
    expect((refused as HostnameTakenError).host).toBe(`${label}.${PLATFORM_APEX}`)
    expect((refused as Error).message).toContain('while you were deciding')
    // AND THE LOSER GOT NOTHING. Not a duplicate, and not a half-written row.
    expect(await businessAddresses(identityEnv(), second.businessId)).toEqual([])
  })

  it('test_UAT_FC_REQ-238_a_check_writes_nothing_at_all', async () => {
    // A CHECK THAT RESERVED ANYTHING WOULD BE A HOLD ON A FINITE PUBLIC
    // NAMESPACE, with no expiry, obtainable by typing.
    const label = aLabel()
    const before = await env.DB.prepare('SELECT count(*) AS n FROM site_domains').first<{
      n: number
    }>()

    for (let i = 0; i < 5; i += 1) {
      expect((await checkHostname(identityEnv(), label)).available).toBe(true)
    }

    const after = await env.DB.prepare('SELECT count(*) AS n FROM site_domains').first<{
      n: number
    }>()
    expect(after!.n).toBe(before!.n)
  })
})

// ── final: no update path, one at a time ─────────────────────────────────────

describe('REQ-238 — a hostname is chosen once and does not change', () => {
  // THE OTHER HALF OF THIS CLAIM — *"any path that updates `site_domains.host`
  // in place"* — is pinned by a source scan in
  // `test_UAT_FC_REQ-238_settings_surface.test.ts`, which runs on the node side
  // where there is a filesystem to read the shipped source from.
  it('test_UAT_FC_REQ-238_a_business_that_has_one_cannot_take_another', async () => {
    // ONE AT A TIME, PER BUSINESS ([[EPIC-4]]'s settlement of [[DOC-45]] §11
    // item 4) — and the refusal NAMES the one they hold, because "you already
    // have one" without saying which is the least useful true sentence
    // available.
    const account = await anAccount()
    const first = await claimHostname(identityEnv(), account.businessId, aLabel())

    const refused = await claimHostname(identityEnv(), account.businessId, aLabel()).catch(
      (error: unknown) => error,
    )

    expect(refused).toBeInstanceOf(HostnameAlreadyHeldError)
    expect((refused as HostnameAlreadyHeldError).held.host).toBe(first.host)
    expect((refused as Error).message).toContain('cannot be changed')
    // AND NOTHING MOVED. The address they hold is the one they held.
    expect(await businessAddresses(identityEnv(), account.businessId)).toEqual([first])
  })
})

// ── revocation: ours, and never re-issued ────────────────────────────────────

describe('REQ-238 — revocation exists from day one, and is ours', () => {
  it('test_UAT_FC_REQ-238_a_revoked_host_stops_resolving_and_is_never_re_issued', async () => {
    // FINALITY IS WHAT CREATES THE NEED: an owner cannot change their own
    // hostname, so one that has to go can only go by our hand. And the row STAYS
    // — which is how nothing is ever re-issued, from the same unique index that
    // makes a claimed host permanent.
    const account = await anAccount()
    const stranger = await anAccount()
    const claimed = await claimHostname(identityEnv(), account.businessId, aLabel())

    const revoked = await revokeHostname(identityEnv(), claimed.host)

    expect(revoked?.host).toBe(claimed.host)
    // IT STOPPED RESOLVING, because every read is filtered to `active`.
    expect(await addressesOf(identityEnv(), account.siteKey!)).toEqual([])
    // IT IS STILL REFUSED TO EVERYBODY ELSE.
    expect((await checkHostname(identityEnv(), claimed.host)).available).toBe(false)
    const reclaim = await claimHostname(identityEnv(), stranger.businessId, claimed.host).catch(
      (error: unknown) => error,
    )
    expect(reclaim).toBeInstanceOf(HostnameTakenError)
    // AND THE ROW IS STILL THERE, carrying the host it was created with.
    const row = await env.DB.prepare('SELECT host, status FROM site_domains WHERE id = ?')
      .bind(claimed.id)
      .first<{ host: string; status: string }>()
    expect(row).toMatchObject({ host: claimed.host, status: 'revoked' })
  })

  it('test_UAT_FC_REQ-238_the_business_can_choose_again_after_a_revocation', async () => {
    // A CONSEQUENCE RATHER THAN A COURTESY. A revoked hostname leaves the site
    // with no address, and a site with no address cannot be published — so a
    // business that could never choose again could never publish again.
    const account = await anAccount()
    const first = await claimHostname(identityEnv(), account.businessId, aLabel())
    await revokeHostname(identityEnv(), first.host)

    const second = await claimHostname(identityEnv(), account.businessId, aLabel())

    expect(second.host).not.toBe(first.host)
    expect(await businessAddresses(identityEnv(), account.businessId)).toEqual([second])
  })

  it('test_UAT_FC_REQ-238_revoking_something_already_revoked_answers_the_same_thing', async () => {
    // AN OPERATOR REPEATING A COMMAND UNDER PRESSURE SHOULD GET THE SAME ANSWER
    // TWICE, rather than a failure that reads as "it is still up".
    const account = await anAccount()
    const claimed = await claimHostname(identityEnv(), account.businessId, aLabel())
    expect(await revokeHostname(identityEnv(), claimed.host)).not.toBeNull()
    expect(await revokeHostname(identityEnv(), claimed.host)).toBeNull()
  })

  it('test_UAT_FC_REQ-238_an_owner_may_not_revoke_their_own_hostname', async () => {
    // NOT SELF-SERVICE, AND THIS IS THE HALF THAT MAKES "FINAL" TRUE. An owner
    // who could revoke could re-choose, which is a change path wearing two
    // calls. The gate is `ownsPlatformBusiness` — the same predicate the
    // business-provisioning fulfilment route carries — and a customer's own
    // owner is not that.
    stubJwks()
    const owner = await anOwner()
    const claimed = await claimHostname(identityEnv(), owner.businessId, aLabel())

    const response = await call(owner.token, owner.businessId, HOSTNAME_REVOKE_PATH, {
      method: 'POST',
      body: JSON.stringify({ host: claimed.host }),
    })

    expect(response.status).toBe(403)
    expect(await businessAddresses(identityEnv(), owner.businessId)).toEqual([claimed])
  })
})

// ── two operations, reachable without a conversation ─────────────────────────

describe('REQ-238 — the pane calls them directly, and no conversation is required', () => {
  it('test_UAT_FC_REQ-238_a_browser_checks_and_claims_over_http', async () => {
    // THE FALSIFIER: *"a route to claiming a hostname that exists only inside a
    // conversation."* This is a browser, with an Access token and nothing else —
    // no session, no transcript, no assistant anywhere in the picture.
    stubJwks()
    const owner = await anOwner()
    const label = aLabel()

    const free = await call(
      owner.token,
      owner.businessId,
      `${HOSTNAME_CHECK_PATH}?label=${label}`,
      { method: 'GET' },
    )
    expect(free.status).toBe(200)
    expect(await free.json()).toEqual({
      host: `${label}.${PLATFORM_APEX}`,
      available: true,
      refusal: null,
    })

    const claimed = await call(owner.token, owner.businessId, HOSTNAME_CLAIM_PATH, {
      method: 'POST',
      body: JSON.stringify({ label }),
    })
    expect(claimed.status).toBe(200)
    expect((await claimed.json()) as { host: string }).toMatchObject({
      host: `${label}.${PLATFORM_APEX}`,
      kind: 'platform',
    })

    // AND THE CHECK NOW SAYS SO, which is the same question answered by the same
    // route after the only operation with a consequence.
    const taken = await call(
      owner.token,
      owner.businessId,
      `${HOSTNAME_CHECK_PATH}?label=${label}`,
      { method: 'GET' },
    )
    expect((await taken.json()) as { available: boolean }).toMatchObject({ available: false })
  })

  it('test_UAT_FC_REQ-238_the_route_reports_the_whole_host_and_the_apex', async () => {
    // THE CHOICE IS PRESENTED AS THE WHOLE HOST. A permanent name, entered as
    // free text by the low-tech customer this product is for, is a permanent typo
    // waiting to happen — so nothing that leaves this Worker is a bare label, and
    // the apex travels with the list rather than being assembled in a browser.
    stubJwks()
    const owner = await anOwner()
    const label = aLabel()
    await claimHostname(identityEnv(), owner.businessId, label)

    const response = await call(owner.token, owner.businessId, HOSTNAME_PATH, { method: 'GET' })

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      apex: string
      addresses: Array<{ host: string; kind: string }>
    }
    expect(body.apex).toBe(PLATFORM_APEX)
    expect(body.addresses).toEqual([
      expect.objectContaining({ host: `${label}.${PLATFORM_APEX}`, kind: 'platform' }),
    ])
  })

  it('test_UAT_FC_REQ-238_the_whole_host_is_accepted_where_a_label_is_asked_for', async () => {
    // BECAUSE THE WHOLE HOST IS WHAT WE SHOWED THEM. A careful person pastes back
    // the string they were given, and refusing it would be refusing them the one
    // we just printed.
    const label = aLabel()
    const bare = await checkHostname(identityEnv(), label)
    const whole = await checkHostname(identityEnv(), `${label}.${PLATFORM_APEX}`)
    expect(whole).toEqual(bare)
    // AND CASE AND SURROUNDING SPACE ARE TIDIED, because a hostname has neither.
    expect((await checkHostname(identityEnv(), `  ${label.toUpperCase()} `)).host).toBe(bare.host)
  })

  it('test_UAT_FC_REQ-238_somebody_who_does_not_own_the_business_may_not_claim', async () => {
    // OWNERS ONLY, the same gate `/api/business/name` carries and for a stronger
    // version of the same reason: this is the one decision on the tab that cannot
    // be undone by the person it is done to.
    stubJwks()
    const owner = await anOwner('Guarded Ltd')
    const stranger = await anOwner('Elsewhere Ltd')
    const label = aLabel()

    const response = await call(stranger.token, owner.businessId, HOSTNAME_CLAIM_PATH, {
      method: 'POST',
      body: JSON.stringify({ label }),
    })

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(await businessAddresses(identityEnv(), owner.businessId)).toEqual([])
  })

  it('test_UAT_FC_REQ-238_a_taken_name_and_a_reserved_name_are_told_apart', async () => {
    // COLLAPSING THEM WOULD LEAVE THE PANE UNABLE TO SAY WHICH HAPPENED. 409 is
    // *somebody has it* and is answered by trying another; 400 is *that is not a
    // hostname we can issue* and is answered by a different word.
    stubJwks()
    const first = await anOwner()
    const second = await anOwner()
    const label = aLabel()
    await claimHostname(identityEnv(), first.businessId, label)

    const taken = await call(second.token, second.businessId, HOSTNAME_CLAIM_PATH, {
      method: 'POST',
      body: JSON.stringify({ label }),
    })
    expect(taken.status).toBe(409)
    expect((await taken.json()) as { taken: boolean }).toMatchObject({ taken: true })

    const reserved = await call(second.token, second.businessId, HOSTNAME_CLAIM_PATH, {
      method: 'POST',
      body: JSON.stringify({ label: 'billing' }),
    })
    expect(reserved.status).toBe(400)
    expect(await businessAddresses(identityEnv(), second.businessId)).toEqual([])
  })
})

// ── the module's own refusal classes, so the surface can re-code them ────────

describe('REQ-238 — the refusals are distinguishable', () => {
  it('test_UAT_FC_REQ-238_a_reserved_label_and_a_malformed_one_raise_different_errors', async () => {
    // THE TWO WANT DIFFERENT WORDS: one says *that is not a hostname*, the other
    // says *that one is ours* — and only the second is worth offering an
    // alternative for.
    const account = await anAccount()
    const reserved = await claimHostname(identityEnv(), account.businessId, 'admin').catch(
      (e: unknown) => e,
    )
    const malformed = await claimHostname(identityEnv(), account.businessId, 'alice-').catch(
      (e: unknown) => e,
    )
    expect(reserved).toBeInstanceOf(ReservedHostnameError)
    expect(malformed).toBeInstanceOf(InvalidHostnameError)
  })
})
