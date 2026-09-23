import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { isOpaqueId, newId } from '../tools/generate/src/store/ids'
import { publishSite } from '../tools/generate/src/publish/publish'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * REQ-190 — **no data field is ever a key.**
 *
 * A key is a surrogate the system mints and never shows meaning through.
 * Anything a human chose, typed, or might change — an address, a slug, a
 * business name — is an attribute, and attributes get renamed. This file is the
 * evidence for that rule as a property of the schema rather than of a comment.
 *
 * WHAT MAKES IT EVIDENCE. Every assertion runs inside workerd against a real D1
 * database and a real R2 bucket, with the schema applied from the baseline, and
 * every row is written by a shipped entry point. The three claims that used to
 * be untestable — a business can be renamed, a site's slug can change, a site
 * can move to another business — are asserted the only way a *schema* property
 * can be: the fact is changed with one UPDATE and everything else is required to
 * be byte-identical afterwards. None of the three needs a product surface to
 * exist, and deliberately: the ticket defers the move TOOL and claims only that
 * the schema makes it one column.
 *
 * THE TWO INTEGER COLUMNS ARE NOT EXCEPTIONS TO THE RULE, they are outside it.
 * `site_revisions.id` is a position in a sequence — live is `MAX(id)` with no
 * head pointer — and `site_changes.at` is the journal counter. Where a number
 * orders rather than names, it stays a number, and the last case here pins that
 * so a later reader does not "finish" the sweep by randomising them.
 */

const PLATFORM = 'req190-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ...overrides,
  }
}

let seq = 0
const anEmail = (): string => `req190-${(seq += 1)}@example.test`

const root = () => d1r2SiteStore({ DB: env.DB, SITES: env.SITES })

/** A business, provisioned through the shipped path, plus a handle on it. */
async function aBusiness(name: string): Promise<{
  businessId: string
  siteKey: string
  store: TenantSiteStore
}> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  return {
    businessId: invited.businessId,
    // THE SITE'S KEY, WHICH IS NOW ITS ONLY NAME ([[REQ-236]]). This was
    // `siteSlug` and every case below spent a `siteKey(slug)` lookup turning it
    // into the value it actually wanted.
    siteKey: invited.siteKey,
    store: await root().forTenant(invited.businessId),
  }
}

/**
 * Fill a site with a real definition so a publish has something to freeze.
 *
 * IT TAKES A KEY, AND THE SEED IS NOT GIVEN ONE ([[REQ-236]]). It used to pass
 * the site's slug into `siteSeed({ slug })`, so the address it wrote to and the
 * name inside the definition were the same string. A key is not a name and must
 * not reach the content, so the seed takes the scaffolder's default and only the
 * heading distinguishes one filled site from another.
 */
async function fill(store: TenantSiteStore, site: string, heading: string): Promise<void> {
  const seed = siteSeed()
  await store.write(site, {
    siteJson: { ...(seed.siteJson as Record<string, unknown>), title: heading },
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
  })
}

/** Drive `public-site`'s own entry point, with its own bindings. */
async function serve(path: string): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await publicSite.fetch(
    new Request(`https://1stcontact.io${path}`),
    { SITES: env.SITES, DB: env.DB } as PublicEnv,
    ctx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

/** Every R2 key under `prefix`, sorted — the object-store side of an assertion. */
async function keysUnder(prefix: string): Promise<string[]> {
  const keys: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await env.SITES.list({ prefix, cursor })
    for (const object of page.objects) keys.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return keys.sort()
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-190 — every primary key is opaque', () => {
  it('test_UAT_FC_REQ-190_every_primary_key_is_an_opaque_random_id', async () => {
    // THE RULE, read back out of the database. Every key a provisioning writes
    // is 128 bits from a CSPRNG: not a value a human typed or chose, and not a
    // digest of the row's own data. A digest would be data-as-key wearing a
    // disguise — `sha256(email)` still changes when the address changes and
    // still says two addresses are two people — so the test that rules it out is
    // the one below, where identical inputs produce unrelated ids.
    const invited = await inviteAccount(identityEnv(), {
      email: anEmail(),
      accountName: 'Sarah Chen Catering',
      endsAt: null,
    })
    const rows = {
      tenant: invited.businessId,
      user: invited.user.id,
      site: invited.siteKey,
      membership: (
        await env.DB.prepare('SELECT id FROM memberships WHERE business_id = ?')
          .bind(invited.businessId)
          .first<{ id: string }>()
      )?.id,
      entitlement: (
        await env.DB.prepare('SELECT id FROM entitlements WHERE business_id = ?')
          .bind(invited.businessId)
          .first<{ id: string }>()
      )?.id,
    }

    for (const [table, id] of Object.entries(rows)) {
      expect(id, `${table} has no key`).toBeTruthy()
      expect(isOpaqueId(id!), `${table} key '${id}' is not opaque`).toBe(true)
      // And it shows no meaning through: nothing a human supplied is in it.
      for (const chosen of ['sarah', 'chen', 'catering', 'req190', 'home', 'example']) {
        expect(id!.toLowerCase(), `${table} key leaks '${chosen}'`).not.toContain(chosen)
      }
    }
  })

  it('test_UAT_FC_REQ-190_identical_inputs_produce_unrelated_keys', async () => {
    // RANDOM, NOT A DIGEST. Two provisionings given byte-identical inputs must
    // produce keys with no relationship to each other — which is exactly what a
    // hash of the row's data could not do, and is the whole difference between
    // an identifier and a fingerprint.
    const spec = { accountName: 'Identical Ltd', endsAt: null as string | null }
    const first = await inviteAccount(identityEnv(), { email: anEmail(), ...spec })
    const second = await inviteAccount(identityEnv(), { email: anEmail(), ...spec })

    expect(first.businessId).not.toBe(second.businessId)
    // THE SITE KEYS TOO. This used to arrange for both sites to carry the SAME
    // slug, so that two identical names over two different keys made the claim
    // about the keys rather than the names. There is no name left to hold equal
    // ([[REQ-236]]), and the claim is simply stronger for it: identical inputs,
    // unrelated keys, and nothing shared to explain the difference away.
    expect(first.siteKey).not.toBe(second.siteKey)
    expect(first.siteKey).not.toContain('identical')
    expect(second.siteKey).not.toContain('identical')
  })

  it('test_UAT_FC_REQ-190_no_child_row_records_the_business', async () => {
    // THE SITE'S OWN ROW IS THE ONLY PLACE ITS BUSINESS IS RECORDED, and that is
    // what makes the move below an update of one column rather than a promise
    // about one. Asserted over the schema, because it is a claim about what
    // CANNOT be written rather than about what happens not to be.
    for (const table of ['site_pages', 'site_assets', 'site_changes', 'site_revisions']) {
      const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>()
      const columns = (results ?? []).map((r) => r.name)
      expect(columns, `${table} has no rows to read`).not.toHaveLength(0)
      expect(columns, `${table} still records its business`).not.toContain('tenant_id')
      expect(columns, `${table} still records its business`).not.toContain('business_id')
      expect(columns, `${table} does not name its site`).toContain('site_id')
      // And it does not carry the site's NAME either, which was the other half
      // of the same defect: a rename used to rewrite every one of these rows.
      expect(columns, `${table} still records the site's name`).not.toContain('slug')
    }
  })
})

describe('REQ-190 — the key is the address', () => {
  it('test_UAT_FC_REQ-236_the_schema_carries_no_chosen_name_for_a_site', async () => {
    // REQ-190's FALSIFIER, FINISHED ([[REQ-236]]). This slot held [[BUG-90]]'s
    // claim that a site is named after its business — the last chosen name in
    // the multi-tenant schema, and the one REQ-190 left standing because
    // `/site/<slug>/` still needed a token to carry. It does not: the published
    // address is the key, so the name had no job left and is dropped.
    //
    // WHAT IS ASSERTED IS THE ABSENCE, over the database's own shape rather than
    // over the store, because the claim is about what CANNOT be written. A
    // column would be re-addable by a later migration and an index by a later
    // hand, and either would put a lookup back in front of every store verb.
    const { results } = await env.DB.prepare('PRAGMA table_info(sites)').all<{ name: string }>()
    const columns = (results ?? []).map((r) => r.name)
    expect(columns, 'sites has no rows to read').not.toHaveLength(0)
    expect(columns, 'sites still records a chosen name').not.toContain('slug')
    expect(columns, 'sites still records a chosen name').not.toContain('name')

    // AND NO UNIQUE INDEX OVER ONE. `UNIQUE (tenant_id, slug)` was the statement
    // that made a chosen name a key doing an attribute's job, so its absence is
    // the half of the falsifier a dropped column alone would not cover.
    const indexes = await env.DB.prepare('PRAGMA index_list(sites)').all<{ name: string }>()
    for (const index of indexes.results ?? []) {
      const info = await env.DB.prepare(`PRAGMA index_info(${index.name})`).all<{ name: string }>()
      const indexed = (info.results ?? []).map((r) => r.name)
      expect(indexed, `${index.name} indexes a chosen name`).not.toContain('slug')
    }

    // The site is still there and still addressable — by the one handle it has.
    const fresh = await aBusiness('Coles Bakery')
    expect(await fresh.store.siteKeys('site')).toEqual([fresh.siteKey])
    expect(await fresh.store.hasDraft(fresh.siteKey)).toBe(true)
  })

  it('test_UAT_FC_REQ-190_two_businesses_each_publish_their_own_site', async () => {
    // THE ACCEPTANCE THAT WAS LIVE RATHER THAN HYPOTHETICAL. `published_sites`
    // used to key on the slug GLOBALLY, because `/site/<slug>/` carried no
    // business — so the second customer to publish under the starter name was
    // refused a name they could do nothing about, and the refusal told them
    // another business on the deployment already held it.
    //
    // IT USED TO ARRANGE A SHARED NAME AND THERE IS NONE LEFT TO SHARE
    // ([[REQ-236]]). The case is not weaker for it: what it always meant was
    // "two businesses publish and neither can affect the other", and with the
    // address minted rather than chosen there is no name either could have
    // claimed in the first place.
    const alice = await aBusiness('Bakery')
    const bob = await aBusiness('Bakery')
    expect(alice.businessId).not.toBe(bob.businessId)
    expect(alice.siteKey).not.toBe(bob.siteKey)

    await fill(alice.store, alice.siteKey, 'Alices Bakery')
    await fill(bob.store, bob.siteKey, 'Bobs Bakery')

    // Neither publish refuses, and the second one is as ordinary as the first.
    await publishSite(alice.store, alice.siteKey, { message: 'first' })
    await publishSite(bob.store, bob.siteKey, { message: 'also first' })

    // Each address serves ITS OWN site's bytes, and that is asserted against
    // the objects the publish wrote rather than against a difference in the
    // rendered text — two sites with the same definition render the same page,
    // and a test that leaned on them differing would be asserting the fixture.
    for (const key of [alice.siteKey, bob.siteKey]) {
      const res = await serve(`/site/${key}/`)
      expect(res.status, `site ${key} did not serve`).toBe(200)
      const own = await env.SITES.get(`sites/${key}/rev/0001/out/index.html`)
      expect(own, `site ${key} published nothing of its own`).not.toBeNull()
      expect(await res.text()).toBe(await own!.text())
    }
    // And they really are two sites: two keys, two revision logs, two prefixes.
    expect(await keysUnder(`sites/${alice.siteKey}/`)).not.toEqual(
      await keysUnder(`sites/${bob.siteKey}/`),
    )
  })

  it('test_UAT_FC_REQ-190_the_same_key_is_used_in_joins_and_in_the_url', async () => {
    // ONE COLUMN, NOT TWO. An earlier design carried an integer key beside a
    // separate opaque `public_id`, because an incrementing key cannot appear in
    // a URL — `/b/2/` would probe every other business and turn a 403 into an
    // existence check. A key that is already unguessable needs no second column,
    // and this is that claim: the value in the URL is the value the rows join on.
    //
    // AND SINCE [[REQ-236]] IT IS THE VALUE THE STORE HANDS OUT TOO. The `sites`
    // read below used to select a row by `tenant_id` AND `slug` and check that
    // the id it found matched the address; there is nothing to look the row up
    // BY except the key now, so the statement selects on it directly.
    const business = await aBusiness('One Column')
    await fill(business.store, business.siteKey, 'One Column')
    await publishSite(business.store, business.siteKey, { message: 'r1' })

    expect(await (await serve(`/site/${business.siteKey}/`)).status).toBe(200)

    const row = await env.DB.prepare('SELECT id FROM sites WHERE tenant_id = ? AND id = ?')
      .bind(business.businessId, business.siteKey)
      .first<{ id: string }>()
    expect(row?.id).toBe(business.siteKey)

    const joined = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM site_revisions WHERE site_id = ?',
    )
      .bind(business.siteKey)
      .first<{ n: number }>()
    expect(Number(joined?.n ?? 0)).toBe(1)
  })

  it('test_UAT_FC_REQ-190_a_key_for_another_business_is_not_obtainable', async () => {
    // WHAT REPLACED "TENANT IN EVERY QUERY". The child tables stopped carrying
    // the business, so isolation rests on the key instead of on twenty-two WHERE
    // clauses — and that is only as strong as the claim that a handle cannot
    // produce another business's key.
    //
    // THE VERB THAT COULD IS GONE ([[REQ-236]]). `siteKey(slug)` was the one
    // statement that turned something a caller could guess into a key, and the
    // barrier was that it carried `WHERE tenant_id = ?`. With it deleted the
    // only way to learn a key at all is `siteKeys()`, which is business-scoped
    // by construction — so the claim is now about enumeration rather than
    // lookup, and is asserted both ways: what a handle CAN see, and that holding
    // another business's key buys nothing.
    const alice = await aBusiness('Alice Iso')
    const bob = await aBusiness('Bob Iso')

    expect(await alice.store.siteKeys()).toEqual([alice.siteKey])
    expect(await bob.store.siteKeys()).toEqual([bob.siteKey])
    expect(alice.siteKey).not.toBe(bob.siteKey)

    // AND THE KEY ITSELF IS NOT A CAPABILITY. Bob's handle, handed Alice's key,
    // answers about nothing — every verb is scoped to the handle's business as
    // well as to the key, which is what makes the enumeration the whole barrier.
    expect(await bob.store.hasDraft(alice.siteKey)).toBe(false)
    expect(await bob.store.readSiteJson(alice.siteKey)).toBeNull()
    expect(await bob.store.readPages(alice.siteKey)).toEqual([])
  })
})

describe('REQ-190 — names change and keys do not', () => {
  it('test_UAT_FC_REQ-190_a_business_is_renamed_with_no_key_rewritten', async () => {
    // A business is *called* something in `tenants.name`, where it can change,
    // and is *keyed* by a value with no relationship to what it is called. The
    // rename is one UPDATE and nothing else in the schema records the name.
    const business = await aBusiness('Before Ltd')
    await fill(business.store, business.siteKey, 'Before Ltd')
    await publishSite(business.store, business.siteKey, { message: 'r1' })
    const objectsBefore = await keysUnder('')

    await env.DB.prepare('UPDATE tenants SET name = ? WHERE id = ?')
      .bind('After Ltd', business.businessId)
      .run()

    const renamed = await env.DB.prepare('SELECT id, name FROM tenants WHERE id = ?')
      .bind(business.businessId)
      .first<{ id: string; name: string }>()
    expect(renamed?.name).toBe('After Ltd')
    expect(renamed?.id).toBe(business.businessId)

    // Everything still resolves, through the same key, from the same objects.
    // ASKED OF THE ENUMERATION rather than of a name lookup ([[REQ-236]]): a
    // fresh handle on the renamed business still hands out the one key it held
    // before, which is the property the rename must not disturb.
    expect(await (await root().forTenant(business.businessId)).siteKeys()).toEqual([
      business.siteKey,
    ])
    expect(await (await serve(`/site/${business.siteKey}/`)).status).toBe(200)
    expect(await keysUnder('')).toEqual(objectsBefore)
  })

  it('test_UAT_FC_REQ-236_a_site_has_no_second_name_to_change', async () => {
    // THIS SLOT HELD `a_sites_slug_changes_with_no_key_rewritten`, and the
    // supersession is the point. REQ-190's claim was that renaming a site is one
    // UPDATE because the rows are keyed by something else — true, and it was the
    // strongest thing that could be said while a site still had a name.
    //
    // [[REQ-236]] MAKES IT VACUOUS BY REMOVING THE NAME, which is a stronger
    // guarantee of the same thing: a rename cannot rewrite a row when there is
    // nothing to rename. What replaces the case is the property that survives —
    // the site's ADDRESS is its key, its business is renameable, and neither
    // touches the other.
    const business = await aBusiness('Renamer')
    await business.store.write(business.siteKey, {
      assets: [{ name: 'mark.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await fill(business.store, business.siteKey, 'Renamer')
    await publishSite(business.store, business.siteKey, { message: 'r1' })

    const objectsBefore = await keysUnder('')
    const pagesBefore = await business.store.readPages(business.siteKey)
    const revisionsBefore = await business.store.revisions(business.siteKey)

    // The only name this site has anywhere near it is its BUSINESS's, and it is
    // free to change — which is exactly the case that used to move the site's
    // own name with it, and now cannot.
    await env.DB.prepare('UPDATE tenants SET name = ? WHERE id = ?')
      .bind('Renamed Ltd', business.businessId)
      .run()

    const after = await root().forTenant(business.businessId)
    expect(await after.siteKeys()).toEqual([business.siteKey])
    expect(await (await serve(`/site/${business.siteKey}/`)).status).toBe(200)
    // Nor did a single row or object belonging to it.
    expect(await after.readPages(business.siteKey)).toEqual(pagesBefore)
    expect(await after.revisions(business.siteKey)).toEqual(revisionsBefore)
    expect(await after.listAssets(business.siteKey)).toEqual(['mark.svg'])
    expect(await keysUnder('')).toEqual(objectsBefore)
  })

  it('test_UAT_FC_REQ-190_a_site_moves_business_by_one_column_with_no_object_copied', async () => {
    // THE WORKED EXAMPLE. `xgd.dev` was provisioned as a second business while
    // the `xgd` site it is named after sat in the platform's, and moving it was
    // a five-table rewrite plus an object-store copy — because the owning
    // business was baked into the key of everything the site is made of. It is
    // an UPDATE of one column now, and the assertion is the strong form: not
    // merely that the move works, but that NOTHING ELSE CHANGED.
    const from = await aBusiness('Origin Ltd')
    const to = await aBusiness('Destination Ltd')
    // A SECOND SITE, so the destination is holding two afterwards. It used to be
    // here because both businesses already held a starter under one name and the
    // destination's had to be free; there is no name to be free ([[REQ-236]]),
    // so it stays only for what it always also proved — that the move lands on a
    // business that is already occupied and disturbs neither site.
    const moving = await from.store.createDraft()
    await from.store.write(moving, {
      assets: [{ name: 'logo.svg', bytes: new TextEncoder().encode('<svg id="moved"/>') }],
    })
    await fill(from.store, moving, 'Origin Ltd')
    await publishSite(from.store, moving, { message: 'r1' })

    const objectsBefore = await keysUnder('')
    const childRows = async () => ({
      pages: (
        await env.DB.prepare('SELECT name, page FROM site_pages WHERE site_id = ? ORDER BY name')
          .bind(moving)
          .all<{ name: string; page: string }>()
      ).results,
      assets: (
        await env.DB.prepare(
          'SELECT name, r2_key FROM site_assets WHERE site_id = ? ORDER BY name',
        )
          .bind(moving)
          .all<{ name: string; r2_key: string }>()
      ).results,
      revisions: (
        await env.DB.prepare('SELECT id, sha FROM site_revisions WHERE site_id = ? ORDER BY id')
          .bind(moving)
          .all<{ id: number; sha: string }>()
      ).results,
    })
    const rowsBefore = await childRows()

    // THE MOVE. One column.
    await env.DB.prepare('UPDATE sites SET tenant_id = ? WHERE id = ?')
      .bind(to.businessId, moving)
      .run()

    // It is the destination's now, and reachable there under its own key.
    const destination = await root().forTenant(to.businessId)
    expect(await destination.siteKeys()).toEqual([to.siteKey, moving].sort())
    expect(await destination.listAssets(moving)).toEqual(['logo.svg'])

    // And it is NOT the origin's — which is the isolation half of the same move.
    const origin = await root().forTenant(from.businessId)
    expect(await origin.siteKeys()).toEqual([from.siteKey])
    expect(await origin.hasDraft(moving)).toBe(false)

    // No row in another table was rewritten and no R2 object was copied.
    expect(await childRows()).toEqual(rowsBefore)
    expect(await keysUnder('')).toEqual(objectsBefore)
    // The published address is unchanged, because it never named the business.
    expect(await (await serve(`/site/${moving}/`)).status).toBe(200)
  })

  it('test_UAT_FC_REQ-236_a_move_can_no_longer_collide_because_there_is_no_name', async () => {
    // THIS SLOT HELD `a_move_onto_a_taken_slug_is_refused_by_the_constraint`,
    // which asserted that `UNIQUE (tenant_id, slug)` refused a move that would
    // give one business two sites called the same thing. That was the right
    // guarantee while a business addressed its sites BY that name — the builder
    // could not have told them apart otherwise.
    //
    // [[REQ-236]] DROPS THE INDEX BECAUSE IT DROPS THE NAME, and the case
    // inverts rather than disappears: a move that used to be refused now
    // succeeds, and BOTH sites stay addressable, because two minted keys cannot
    // coincide. Pinned as behaviour rather than left implied, so a later reader
    // does not restore the constraint over a column that no longer exists.
    const from = await aBusiness('Colliding')
    const to = await aBusiness('Colliding')

    await env.DB.prepare('UPDATE sites SET tenant_id = ? WHERE id = ?')
      .bind(to.businessId, from.siteKey)
      .run()

    const destination = await root().forTenant(to.businessId)
    expect(await destination.siteKeys()).toEqual([to.siteKey, from.siteKey].sort())
    // Two sites, two keys, both readable — which is the thing the refusal
    // existed to prevent being ambiguous, and no longer can be.
    expect(await destination.hasDraft(from.siteKey)).toBe(true)
    expect(await destination.hasDraft(to.siteKey)).toBe(true)
    expect(await (await root().forTenant(from.businessId)).siteKeys()).toEqual([])
  })
})

describe('REQ-190 — the object store follows the keys', () => {
  it('test_UAT_FC_REQ-190_erasure_reaches_every_object_by_enumerating_site_keys', async () => {
    // R2 prefixes and the erasure path follow the new keys. A site's objects
    // live under `draft/<siteId>/` and `sites/<siteId>/rev/…` with no business
    // in either — which is what makes a move copy nothing, and which is exactly
    // why erasure can no longer be one prefix sweep. It enumerates instead, and
    // the property that matters is that the enumeration is COMPLETE: no object
    // belonging to the business is left stranded under a prefix nothing reaches.
    const business = await aBusiness('Erasable')
    // A SECOND SITE, MINTED RATHER THAN NAMED ([[REQ-236]]). It used to be
    // `createDraft('second')` — a word the caller chose and then addressed the
    // site by. The verb hands back the key it minted now, which is what makes
    // "two sites, and the enumeration finds both" a claim about the store rather
    // than about two strings the test happened to remember.
    const second = await business.store.createDraft()
    await business.store.write(second, {
      assets: [{ name: 'a.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await business.store.write(business.siteKey, {
      assets: [{ name: 'b.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await fill(business.store, business.siteKey, 'Erasable')
    await publishSite(business.store, business.siteKey, { message: 'r1' })

    const siteKeys = await business.store.siteKeys()
    expect(siteKeys).toHaveLength(2)

    // Everything this business owns, found the way erasure would find it.
    const reached = new Set<string>()
    for (const key of siteKeys) {
      for (const k of await keysUnder(`draft/${key}/`)) reached.add(k)
      for (const k of await keysUnder(`sites/${key}/`)) reached.add(k)
    }
    for (const prefix of [
      `t/${business.businessId}/blob/`,
      `t/${business.businessId}/ref/`,
      `kb/${business.businessId}/`,
    ]) {
      for (const k of await keysUnder(prefix)) reached.add(k)
    }

    // Nothing is stranded: every object either belongs to another business or
    // was found above. The check is stated over the whole bucket rather than
    // over what this test wrote, so an object written by a path this test does
    // not know about would still count against it.
    const others = new Set<string>()
    for (const other of [
      await (await root().forTenant((await aBusiness('Bystander')).businessId)).siteKeys(),
    ].flat()) {
      for (const k of await keysUnder(`draft/${other}/`)) others.add(k)
      for (const k of await keysUnder(`sites/${other}/`)) others.add(k)
    }
    const mine = (await keysUnder('')).filter(
      (k) => !others.has(k) && (k.includes(business.businessId) || siteKeys.some((s) => k.includes(s))),
    )
    expect(mine.length).toBeGreaterThan(0)
    for (const key of mine) expect(reached.has(key), `${key} is stranded`).toBe(true)
  })

  it('test_UAT_FC_REQ-190_forget_removes_the_site_and_its_objects', async () => {
    // The same enumeration, exercised through the verb that already does it: a
    // site dropped by its own business leaves no row and no object behind, which
    // is the per-site half of the erasure obligation.
    const business = await aBusiness('Forgetful')
    await business.store.write(business.siteKey, {
      assets: [{ name: 'x.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await fill(business.store, business.siteKey, 'Forgetful')
    await publishSite(business.store, business.siteKey, { message: 'r1' })
    const siteKey = business.siteKey
    // UNDER THE SITE'S OWN PUBLISHED ROOT ([[REQ-304]]). An asset's bytes are
    // addressed by their CONTENT now, at `sites/<siteKey>/blob/<digest>` — one
    // object named by the draft, by every revision that froze it and by the
    // served site — so the draft prefix holds nothing of a site written today.
    // What erasure has to reach is unchanged and is asserted below: everything
    // this site owns, under either prefix.
    expect(await keysUnder(`sites/${siteKey}/`)).not.toHaveLength(0)

    await business.store.forget(siteKey)

    // ASKED OF THE ENUMERATION, which is the only verb that hands a key out
    // ([[REQ-236]]) — a forgotten site is one the business no longer lists.
    expect(await business.store.siteKeys()).toEqual([])
    expect(await business.store.hasDraft(siteKey)).toBe(false)
    expect(await keysUnder(`draft/${siteKey}/`)).toEqual([])
    expect(await keysUnder(`sites/${siteKey}/`)).toEqual([])
    for (const table of ['site_pages', 'site_assets', 'site_changes', 'site_revisions']) {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE site_id = ?`)
        .bind(siteKey)
        .first<{ n: number }>()
      expect(Number(row?.n ?? 0), `${table} kept rows`).toBe(0)
    }
    // And the address stops answering, which is what erasure has to mean.
    expect((await serve(`/site/${siteKey}/`)).status).toBe(404)
  })
})

describe('REQ-190 — ordinal is not identity', () => {
  it('test_UAT_FC_REQ-190_a_revision_id_and_a_journal_counter_stay_ordinals', async () => {
    // THE CARVE-OUT, PINNED. `site_revisions.id` is a POSITION — live is
    // `MAX(id)` with no head pointer, and the published layout is `rev/0001` —
    // and `site_changes.at` is the counter the retention window is trimmed by.
    // Randomising either destroys the ordering that is its entire meaning, so
    // the rule's "no integer sequence" does not reach them and this says so
    // before somebody finishes the sweep by hand.
    const business = await aBusiness('Ordinals')
    await fill(business.store, business.siteKey, 'Ordinals')
    const first = await publishSite(business.store, business.siteKey, { message: 'r1' })
    await fill(business.store, business.siteKey, 'Ordinals, again')
    const second = await publishSite(business.store, business.siteKey, { message: 'r2' })

    expect(first.id).toBe(1)
    expect(second.id).toBe(2)
    expect((await business.store.revisions(business.siteKey)).map((r) => r.id)).toEqual([1, 2])

    const at = await business.store.appendChange(business.siteKey, { kind: 'edit' } as never)
    expect(at).toBeGreaterThan(0)
    expect(await business.store.appendChange(business.siteKey, { kind: 'edit' } as never)).toBe(at + 1)
  })

  it('test_UAT_FC_REQ-190_the_id_prefix_is_a_reading_aid_and_nothing_branches_on_it', async () => {
    // The prefix says which table a value in a log came from and is never
    // parsed: two ids with the same prefix are not related and two with
    // different prefixes are not ordered. Stated here because a prefix is the
    // one part of an opaque key that LOOKS like it means something.
    expect(isOpaqueId(newId('site'), 'site')).toBe(true)
    expect(isOpaqueId(newId('site'), 'acct')).toBe(false)
    expect(isOpaqueId('home')).toBe(false)
    expect(isOpaqueId('acct_1stcontact')).toBe(false)
  })
})
