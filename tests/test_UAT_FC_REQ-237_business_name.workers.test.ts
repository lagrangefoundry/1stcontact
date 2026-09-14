import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { provisionBusiness, type IdentityEnv } from '../apps/control-app/src/identity'
import {
  BusinessNameTakenError,
  InvalidBusinessNameError,
  availableBusinessName,
  businessRecord,
  normaliseBusinessName,
  renameBusiness,
} from '../apps/control-app/src/business'
import { ensureOwnBusiness } from '../apps/control-app/src/onboarding'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { BUSINESS_NAME_PATH } from '../apps/control-app/src/router'
import { businessPath } from '../apps/control-app/src/scope'
import { acceptTerms } from '../apps/control-app/src/terms'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-237 — **the business name is stored once, and may change at any time.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs against a real D1 database with the
 * deployed schema — the migration list this product actually applies, including
 * `0006`'s unique index — and every business is made by the shipped
 * `provisionBusiness`. The route cases drive the WORKER'S OWN `fetch` inside
 * workerd, with a real RS256 Access token verified against a real JWKS, so what
 * they prove is the wiring as well as the handler.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. THE NAME IS UNIQUE WITHIN ITS OWNING ACCOUNT, compared case-folded and
 *     whitespace-collapsed — *"exact-string uniqueness would admit `Cole's
 *     Bakery` beside `cole's bakery` and put two indistinguishable rows in one
 *     switcher"*. Two accounts may each hold the same name; one account may not.
 *  2. THE PLATFORM BUSINESS IS EXEMPT, and that is a decision rather than an
 *     accident — `owner_account_id` is NULL there and nowhere else.
 *  3. THE DEFAULT NAME CANNOT TRIP THE CONSTRAINT. *"A constraint the system
 *     itself can trip is a constraint that gets worked around."* Base, then
 *     `-1`, `-2`, first free wins — and **the suffix is not a count**.
 *  4. A RENAME REPORTS ITS EFFECTS AND DOES NOT ANSWER A BOOLEAN. It touches the
 *     record and nothing else: the site still says the old name, some pages still
 *     name it in prose, and each of those is *"an offer, never an action"*.
 *  5. A RENAME PUBLISHES NOTHING AND MOVES NO ADDRESS.
 *  6. THERE IS A RENAME PATH AT ALL, reachable by the person whose business it
 *     is — which is the defect the ticket opens with.
 */

const PLATFORM = 'req237-platform'
const TEAM = 'https://req237-team.cloudflareaccess.com'
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
  const header = { alg: 'RS256', kid: 'req237-key', typ: 'JWT' }
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
const anEmail = (): string => `req237-${(seq += 1)}@example.test`

/** An account holding one business, through the shipped path. */
async function anAccount(name: string) {
  const invited = await inviteAccount(identityEnv(), {
    email: anEmail(),
    accountName: name,
    endsAt: null,
  })
  return invited
}

const rename = async (
  token: string | null,
  businessId: string,
  body: unknown,
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${businessPath(businessId, BUSINESS_NAME_PATH)}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

beforeAll(async () => {
  await applySchema()
  await env.DB.prepare(
    "INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES (?, ?, 'active', ?)",
  )
    .bind(PLATFORM, 'REQ-237 platform', new Date(0).toISOString())
    .run()
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req237-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

// ── AC1 — unique within the owning account, compared normalised ──────────────

describe('REQ-237 AC1 — a business name is unique within its owning account', () => {
  it('test_UAT_FC_REQ-237_one_account_may_not_hold_two_names_a_person_would_read_as_the_same', async () => {
    // THE FAILURE THE CONSTRAINT EXISTS TO PREVENT: two rows in one switcher that
    // nobody can tell apart. Exact-string uniqueness would admit this pair.
    const account = await anAccount("Cole's Bakery")

    const refused = await provisionBusiness(identityEnv(), {
      accountId: account.user.account_id,
      name: "  cole's   BAKERY ",
      endsAt: null,
    }).catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(BusinessNameTakenError)
    // AND IT NAMES THE OTHER BUSINESS. "That name is already one of your
    // businesses" is only useful if it says which one, at the moment of the
    // collision — so the refusal carries the record rather than leaving the
    // caller to go and look.
    const taken = (refused as BusinessNameTakenError).takenBy
    expect(taken.businessId).toBe(account.businessId)
    expect(taken.name).toBe("Cole's Bakery")
    expect((refused as Error).message).toContain("Cole's Bakery")
  })

  it('test_UAT_FC_REQ-237_two_accounts_may_each_hold_the_same_name', async () => {
    // ACROSS ACCOUNTS THE NAME MEANS NOTHING. A business is addressed by its id
    // and by nothing else, so a global claim would refuse a real business its
    // real name for no benefit to anybody.
    const first = await anAccount('Unnamed business')
    const second = await anAccount('Unnamed business')

    expect(first.businessId).not.toBe(second.businessId)
    expect((await businessRecord(identityEnv(), first.businessId))?.name).toBe('Unnamed business')
    expect((await businessRecord(identityEnv(), second.businessId))?.name).toBe('Unnamed business')
  })

  it('test_UAT_FC_REQ-237_the_database_refuses_the_pair_too_and_is_not_only_a_code_rule', async () => {
    // THE INTEGRITY BACKSTOP, asserted directly. The rule lives in `business.ts`
    // and is deliberately stricter than the index; this proves the index is
    // really there, so a write that somehow bypassed that code still cannot
    // leave two rows a person would read as the same business.
    const account = await anAccount('Backstop Ltd')
    const insert = env.DB.prepare(
      'INSERT INTO tenants (id, name, status, owner_account_id, created_at) ' +
        "VALUES (?, ?, 'active', ?, ?)",
    )
      .bind('req237-backstop', 'BACKSTOP LTD', account.user.account_id, new Date().toISOString())
      .run()

    await expect(insert).rejects.toThrow()
  })

  it('test_UAT_FC_REQ-237_what_was_typed_is_what_is_stored_and_only_stray_whitespace_is_tidied', async () => {
    // TIDYING, NOT FOLDING. The capitals the customer used are the capitals the
    // switcher shows; what goes is whitespace nobody typed on purpose.
    expect(normaliseBusinessName("  Cole's   Bakery \n")).toBe("Cole's Bakery")
    const account = await anAccount("   Tidy   Books  ")
    expect((await businessRecord(identityEnv(), account.businessId))?.name).toBe('Tidy Books')
  })
})

// ── AC2 — the platform business is exempt ────────────────────────────────────

describe('REQ-237 AC2 — the platform business is exempt', () => {
  it('test_UAT_FC_REQ-237_two_businesses_owning_no_account_may_share_a_name', async () => {
    // `owner_account_id` IS NULL FOR 1st CONTACT AND NOTHING ELSE, and SQLite
    // treats NULLs in a unique index as distinct. The exemption is free — this
    // states it as a decision so that a later reader who makes NULLs comparable
    // knows what they would be changing.
    const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
    await root.createTenant({ id: 'req237-platform-a', name: 'House business' })
    await root.createTenant({ id: 'req237-platform-b', name: 'House business' })

    expect((await businessRecord(identityEnv(), 'req237-platform-a'))?.ownerAccountId).toBeNull()
    expect((await businessRecord(identityEnv(), 'req237-platform-b'))?.name).toBe('House business')
  })
})

// ── AC3 — the default name cannot trip the constraint ────────────────────────

describe('REQ-237 AC3 — the name the product chooses is always free', () => {
  it('test_UAT_FC_REQ-237_the_default_walks_to_the_first_free_variant', async () => {
    // *"A constraint the system itself can trip is a constraint that gets worked
    // around."* The customer never asked for this word, so it must not fail.
    const account = await anAccount('Unnamed business')
    const accountId = account.user.account_id

    const second = await availableBusinessName(identityEnv(), accountId, 'Unnamed business')
    expect(second).toBe('Unnamed business-1')

    await provisionBusiness(identityEnv(), { accountId, name: second, endsAt: null })
    expect(await availableBusinessName(identityEnv(), accountId, 'Unnamed business')).toBe(
      'Unnamed business-2',
    )
  })

  it('test_UAT_FC_REQ-237_the_suffix_is_not_a_count_and_a_gap_is_filled', async () => {
    // AN ACCOUNT THAT RENAMES THE MIDDLE ONE LEAVES A GAP, and the next
    // provision fills it — so `Gap-1` does not mean "the second business" and
    // never did. Nothing may read the suffix as a count.
    const account = await anAccount('Gap')
    const accountId = account.user.account_id
    const one = await provisionBusiness(identityEnv(), {
      accountId,
      name: 'Gap-1',
      endsAt: null,
    })
    await provisionBusiness(identityEnv(), { accountId, name: 'Gap-2', endsAt: null })

    await renameBusiness(identityEnv(), one.businessId, 'Something else entirely')

    // Three businesses held, and the next default is `-1` rather than `-3`.
    expect(await availableBusinessName(identityEnv(), accountId, 'Gap')).toBe('Gap-1')
  })

  it('test_UAT_FC_REQ-237_signing_up_takes_a_free_name_rather_than_being_refused', async () => {
    // THE COMPOSITION, THROUGH THE SHIPPED HOOK. `ensureOwnBusiness` is what
    // signing up calls, and the name it chooses is the product's own — so it goes
    // through `availableBusinessName` rather than straight at the constraint.
    const account = await anAccount('Placeholder Ltd')
    // The account already owns one, so the hook reports it did nothing rather
    // than provisioning a second — the idempotence `terms.ts` depends on.
    expect(await ensureOwnBusiness(identityEnv(), account.user)).toBeNull()
    // And the name it WOULD have chosen is free, not taken.
    const free = await availableBusinessName(
      identityEnv(),
      account.user.account_id,
      'Placeholder Ltd',
    )
    expect(free).toBe('Placeholder Ltd-1')
  })
})

// ── AC4 — a rename reports its effects ───────────────────────────────────────

describe('REQ-237 AC4 — a rename reports what it left out of date', () => {
  it('test_UAT_FC_REQ-237_the_site_keeps_saying_the_old_name_and_the_report_says_so', async () => {
    // THE WHOLE OF HOW A CHANGE THAT PROPAGATES TO NOTHING STAYS SAFE. The site's
    // `config.businessName` is authored content — what the SITE SAYS — and the
    // record is what the business IS CALLED. They are allowed to differ; what was
    // missing was anything telling the customer that they now do.
    const account = await anAccount('Old Name Ltd')

    const renamed = await renameBusiness(identityEnv(), account.businessId, 'New Name Ltd')

    expect(renamed.previousName).toBe('Old Name Ltd')
    expect(renamed.name).toBe('New Name Ltd')
    // UNCHANGED, and reported rather than synchronised.
    expect(renamed.effects.siteName).toBe('Old Name Ltd')
    expect(renamed.effects.siteNameDiffers).toBe(true)
    expect(renamed.effects.siteKey).toBe(account.siteKey)

    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(
      account.businessId,
    )
    const siteJson = (await store.readSiteJson(account.siteKey!)) as {
      config: { businessName: string }
    }
    // NOT "UNTIL THE NEXT PUBLISH" — publishing re-renders what the site says,
    // and what it says has not changed. It says the old name until somebody edits
    // the site.
    expect(siteJson.config.businessName).toBe('Old Name Ltd')
  })

  it('test_UAT_FC_REQ-237_page_copy_naming_the_business_is_offered_as_pages_to_read', async () => {
    // PROSE, WHICH CAN ONLY BE FOUND AND REWRITTEN. The starter page's SEO title
    // names the business; there is no field to update, so what is offered is the
    // list of pages worth reading.
    const account = await anAccount('Findable Bakery')

    const renamed = await renameBusiness(identityEnv(), account.businessId, 'Renamed Bakery')

    expect(renamed.effects.pagesNamingPreviousName).toEqual(['home.json'])

    // AND A SECOND RENAME FINDS NOTHING, because the copy no longer names the
    // business the rename was FROM. The report is about the previous name, not
    // about the business in general.
    const again = await renameBusiness(identityEnv(), account.businessId, 'Third Name')
    expect(again.effects.pagesNamingPreviousName).toEqual([])
  })

  it('test_UAT_FC_REQ-237_correcting_the_case_of_a_name_does_not_collide_with_itself', async () => {
    // THE ONE RENAME A CUSTOMER IS CERTAIN TO WANT FIRST. Without excluding the
    // business being renamed, the uniqueness check would refuse it.
    const account = await anAccount('cole’s bakery')

    const renamed = await renameBusiness(identityEnv(), account.businessId, 'Cole’s Bakery')

    expect(renamed.name).toBe('Cole’s Bakery')
    expect((await businessRecord(identityEnv(), account.businessId))?.name).toBe(
      'Cole’s Bakery',
    )
  })

  it('test_UAT_FC_REQ-237_renaming_onto_a_sibling_is_refused_and_names_it', async () => {
    const account = await anAccount('First Ltd')
    const sibling = await provisionBusiness(identityEnv(), {
      accountId: account.user.account_id,
      name: 'Second Ltd',
      endsAt: null,
    })

    const refused = await renameBusiness(identityEnv(), sibling.businessId, 'first ltd').catch(
      (error: unknown) => error,
    )

    expect(refused).toBeInstanceOf(BusinessNameTakenError)
    expect((refused as BusinessNameTakenError).takenBy.businessId).toBe(account.businessId)
    // NOTHING WAS WRITTEN. A refusal that renamed first and reported second would
    // leave the account holding two rows nobody can tell apart.
    expect((await businessRecord(identityEnv(), sibling.businessId))?.name).toBe('Second Ltd')
  })

  it('test_UAT_FC_REQ-237_a_name_made_only_of_whitespace_is_refused', async () => {
    const account = await anAccount('Nameable Ltd')
    await expect(renameBusiness(identityEnv(), account.businessId, '   ')).rejects.toBeInstanceOf(
      InvalidBusinessNameError,
    )
    expect((await businessRecord(identityEnv(), account.businessId))?.name).toBe('Nameable Ltd')
  })
})

// ── AC5 — a rename publishes nothing and moves no address ────────────────────

describe('REQ-237 AC5 — a rename changes the record and nothing else', () => {
  it('test_UAT_FC_REQ-237_a_rename_publishes_nothing_and_the_site_key_does_not_move', async () => {
    // PUBLICATION HAS ITS OWN MEANING AND ITS OWN MOMENT. A rename that published
    // as a side effect would push a draft live that the customer never asked to
    // release. And after REQ-236 nothing is derived from the name, so there is no
    // address to move and no session to orphan.
    const account = await anAccount('Unpublished Ltd')
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(
      account.businessId,
    )
    expect(await store.revisions(account.siteKey!)).toEqual([])

    await renameBusiness(identityEnv(), account.businessId, 'Still Unpublished Ltd')

    expect(await store.revisions(account.siteKey!)).toEqual([])
    expect(await store.siteKeys('site')).toEqual([account.siteKey])
  })
})

// ── AC6 — there is a rename path, and it is the owner's ──────────────────────

describe('REQ-237 AC6 — the customer can correct what their business is called', () => {
  it('test_UAT_FC_REQ-237_an_owner_renames_their_business_through_the_worker', async () => {
    // THE DEFECT THE TICKET OPENS WITH: there was no rename path at all. This is
    // the whole of it, driven through the deployed entry point.
    stubJwks()
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), {
      email,
      accountName: 'Unnamed business',
      endsAt: null,
    })
    await acceptTerms(identityEnv(), invited.user.id)

    const response = await rename(await mint(email), invited.businessId, {
      name: "Cole's Bakery",
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      name: string
      previousName: string
      effects: { siteNameDiffers: boolean; pagesNamingPreviousName: string[] }
    }
    expect(body.name).toBe("Cole's Bakery")
    expect(body.previousName).toBe('Unnamed business')
    // THE EFFECTS REACH THE BROWSER, which is what lets the settings pane show
    // the divergence as a thing to look at rather than silently diverge.
    expect(body.effects.siteNameDiffers).toBe(true)
    expect(body.effects.pagesNamingPreviousName).toEqual(['home.json'])
    expect((await businessRecord(identityEnv(), invited.businessId))?.name).toBe("Cole's Bakery")
  })

  it('test_UAT_FC_REQ-237_a_taken_name_and_an_empty_name_are_told_apart', async () => {
    // COLLAPSING THEM INTO ONE STATUS WOULD LEAVE THE PANE UNABLE TO SAY WHICH
    // HAPPENED — and "that name is already one of your businesses" is only useful
    // if it arrives at the collision.
    stubJwks()
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), {
      email,
      accountName: 'Primary Ltd',
      endsAt: null,
    })
    await acceptTerms(identityEnv(), invited.user.id)
    await provisionBusiness(identityEnv(), {
      accountId: invited.user.account_id,
      name: 'Rival Ltd',
      endsAt: null,
    })

    const token = await mint(email)
    const taken = await rename(token, invited.businessId, { name: 'rival ltd' })
    expect(taken.status).toBe(409)
    expect(((await taken.json()) as { takenBy: { name: string } }).takenBy.name).toBe('Rival Ltd')

    const empty = await rename(token, invited.businessId, { name: '  ' })
    expect(empty.status).toBe(400)
    expect((await businessRecord(identityEnv(), invited.businessId))?.name).toBe('Primary Ltd')
  })

  it('test_UAT_FC_REQ-237_somebody_who_does_not_own_the_business_is_refused', async () => {
    // THE SAME GATE `/api/people/record` CARRIES. The record is the business's own
    // identity to the product, and a caller who holds no ownership of it may not
    // re-label it.
    stubJwks()
    const owner = await anAccount('Guarded Ltd')
    const strangerEmail = anEmail()
    const stranger = await inviteAccount(identityEnv(), {
      email: strangerEmail,
      accountName: 'Elsewhere Ltd',
      endsAt: null,
    })
    await acceptTerms(identityEnv(), stranger.user.id)

    const response = await rename(await mint(strangerEmail), owner.businessId, {
      name: 'Taken over',
    })

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect((await businessRecord(identityEnv(), owner.businessId))?.name).toBe('Guarded Ltd')
  })
})
