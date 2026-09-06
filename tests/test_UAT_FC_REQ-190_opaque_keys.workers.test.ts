import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { isOpaqueId, newId } from '../tools/generate/src/store/ids'
import { publishSite } from '../tools/generate/src/publish/publish'
import {
  provisionBusiness,
  STARTER_SLUG,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
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
  siteSlug: string
  store: TenantSiteStore
}> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  return {
    businessId: invited.businessId,
    siteSlug: invited.siteSlug,
    store: await root().forTenant(invited.businessId),
  }
}

/** Fill a site with a real definition so a publish has something to freeze. */
async function fill(store: TenantSiteStore, slug: string, heading: string): Promise<void> {
  const seed = siteSeed({ slug })
  await store.write(slug, {
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
    const store = await root().forTenant(invited.businessId)
    const siteId = await store.siteKey(invited.siteSlug)

    const rows = {
      tenant: invited.businessId,
      user: invited.user.id,
      site: siteId!,
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
    // The site keys too — and their slugs are the SAME word, which is what makes
    // this a statement about the keys rather than about the names.
    const a = await (await root().forTenant(first.businessId)).siteKey(first.siteSlug)
    const b = await (await root().forTenant(second.businessId)).siteKey(second.siteSlug)
    expect(first.siteSlug).toBe(second.siteSlug)
    expect(a).not.toBe(b)
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
  it('test_UAT_FC_REQ-190_a_new_account_finds_its_one_site_visibly_unnamed', async () => {
    // THE DEFAULT IS LEGIBLE AS A DEFAULT, which is the whole of what the word
    // buys. `home` was the obvious candidate and is the wrong one: it reads as a
    // decision somebody made, so nothing about it asks to be changed, and every
    // account's one site would sit under a name that says nothing about the
    // business it belongs to — the `acct_057f…` complaint in a friendlier font.
    //
    // BOTH SURFACES SAY IT, because an operator meets the site twice. The slug
    // is what the builder addresses and lists; `config.businessName` is prose
    // and reaches the `<title>` of every rendered page. A starter that was
    // provisional in one place and confident in the other would be worse than
    // either.
    const fresh = await aBusiness('Coles Bakery')
    expect(fresh.siteSlug).toBe('unnamed')

    const site = (await fresh.store.readSiteJson('unnamed')) as {
      config?: { businessName?: string; tagline?: string }
    } | null
    expect(site, 'the starter site was not written').not.toBeNull()
    expect(site!.config?.businessName).toBe('Unnamed')
    expect(site!.config?.tagline).toContain('Unnamed')

    // AND IT IS NOT THE BUSINESS NAME. Provisioning knows the account is called
    // "Coles Bakery" and deliberately does not use it: the site is not the
    // business, an account will own several, and a name asserted on the owner's
    // behalf is one they never chose — the same objection as `home`, arrived at
    // from the other direction.
    expect(site!.config?.businessName).not.toContain('Coles')

    // NOTHING RESERVES THE WORD. It is an ordinary attribute, so naming the site
    // is the one UPDATE this ticket's worked example is built on, and the site
    // is fully addressable under its new name immediately afterwards.
    const key = (await fresh.store.siteKey('unnamed'))!
    await env.DB.prepare('UPDATE sites SET slug = ? WHERE id = ?').bind('bakery', key).run()
    expect(await fresh.store.siteKey('bakery')).toBe(key)
    expect(await fresh.store.siteKey('unnamed')).toBeNull()
  })

  it('test_UAT_FC_REQ-190_two_businesses_each_publish_a_site_called_home', async () => {
    // THE ACCEPTANCE THAT WAS LIVE RATHER THAN HYPOTHETICAL. `published_sites`
    // used to key on the slug GLOBALLY, because `/site/<slug>/` carried no
    // business — so the second customer to publish under the starter name was
    // refused a name they could do nothing about, and the refusal told them
    // another business on the deployment already held it. Both businesses
    // publish it here, both are served, and each gets its own bytes.
    //
    // THE WORD ITSELF IS NOT THE PROPERTY, which is why this reads the constant
    // rather than a literal. What is being asserted is that EVERY account is
    // provisioned under the SAME slug and no two collide — true of `home`, of
    // `unnamed`, and of whatever the starter is next called.
    const alice = await aBusiness('Alices Plumbing')
    const bob = await aBusiness('Bobs Salon')
    expect(alice.siteSlug).toBe(STARTER_SLUG)
    expect(bob.siteSlug).toBe(STARTER_SLUG)

    await fill(alice.store, STARTER_SLUG, 'Alices Plumbing')
    await fill(bob.store, STARTER_SLUG, 'Bobs Salon')

    // Neither publish refuses, and the second one is as ordinary as the first.
    await publishSite(alice.store, STARTER_SLUG, { message: 'first' })
    await publishSite(bob.store, STARTER_SLUG, { message: 'also first' })

    const aliceKey = (await alice.store.siteKey(STARTER_SLUG))!
    const bobKey = (await bob.store.siteKey(STARTER_SLUG))!
    expect(aliceKey).not.toBe(bobKey)

    // Each address serves ITS OWN site's bytes, and that is asserted against
    // the objects the publish wrote rather than against a difference in the
    // rendered text — two sites with the same definition render the same page,
    // and a test that leaned on them differing would be asserting the fixture.
    for (const key of [aliceKey, bobKey]) {
      const res = await serve(`/site/${key}/`)
      expect(res.status, `site ${key} did not serve`).toBe(200)
      const own = await env.SITES.get(`sites/${key}/rev/0001/out/index.html`)
      expect(own, `site ${key} published nothing of its own`).not.toBeNull()
      expect(await res.text()).toBe(await own!.text())
    }
    // And they really are two sites: two keys, two revision logs, two prefixes.
    expect(await keysUnder(`sites/${aliceKey}/`)).not.toEqual(
      await keysUnder(`sites/${bobKey}/`),
    )
  })

  it('test_UAT_FC_REQ-190_the_same_key_is_used_in_joins_and_in_the_url', async () => {
    // ONE COLUMN, NOT TWO. An earlier design carried an integer key beside a
    // separate opaque `public_id`, because an incrementing key cannot appear in
    // a URL — `/b/2/` would probe every other business and turn a 403 into an
    // existence check. A key that is already unguessable needs no second column,
    // and this is that claim: the value in the URL is the value the rows join on.
    const business = await aBusiness('One Column')
    await fill(business.store, STARTER_SLUG, 'One Column')
    await publishSite(business.store, STARTER_SLUG, { message: 'r1' })

    const siteKey = (await business.store.siteKey(STARTER_SLUG))!
    expect(await (await serve(`/site/${siteKey}/`)).status).toBe(200)

    const row = await env.DB.prepare('SELECT id FROM sites WHERE tenant_id = ? AND slug = ?')
      .bind(business.businessId, STARTER_SLUG)
      .first<{ id: string }>()
    expect(row?.id).toBe(siteKey)

    const joined = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM site_revisions WHERE site_id = ?',
    )
      .bind(siteKey)
      .first<{ n: number }>()
    expect(Number(joined?.n ?? 0)).toBe(1)
  })

  it('test_UAT_FC_REQ-190_a_key_for_another_business_is_not_obtainable', async () => {
    // WHAT REPLACED "TENANT IN EVERY QUERY". The child tables stopped carrying
    // the business, so isolation rests on the key instead of on twenty-two WHERE
    // clauses — and that is only as strong as the claim that a handle cannot
    // produce another business's key. It cannot: the one lookup that mints one
    // is scoped to the handle's own business.
    const alice = await aBusiness('Alice Iso')
    const bob = await aBusiness('Bob Iso')

    expect(await alice.store.siteKey(STARTER_SLUG)).not.toBeNull()
    expect(await bob.store.siteKey(STARTER_SLUG)).not.toBeNull()
    expect(await alice.store.siteKeys()).toEqual([(await alice.store.siteKey(STARTER_SLUG))!])
    // Bob's handle answers about Bob's `home`, never Alice's — the slug is the
    // same word in both, which is what makes this test say something.
    expect(await bob.store.siteKey(STARTER_SLUG)).not.toBe(await alice.store.siteKey(STARTER_SLUG))
  })
})

describe('REQ-190 — names change and keys do not', () => {
  it('test_UAT_FC_REQ-190_a_business_is_renamed_with_no_key_rewritten', async () => {
    // A business is *called* something in `tenants.name`, where it can change,
    // and is *keyed* by a value with no relationship to what it is called. The
    // rename is one UPDATE and nothing else in the schema records the name.
    const business = await aBusiness('Before Ltd')
    await fill(business.store, STARTER_SLUG, 'Before Ltd')
    await publishSite(business.store, STARTER_SLUG, { message: 'r1' })
    const siteKey = (await business.store.siteKey(STARTER_SLUG))!
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
    expect(await (await root().forTenant(business.businessId)).siteKey(STARTER_SLUG)).toBe(siteKey)
    expect(await (await serve(`/site/${siteKey}/`)).status).toBe(200)
    expect(await keysUnder('')).toEqual(objectsBefore)
  })

  it('test_UAT_FC_REQ-190_a_sites_slug_changes_with_no_key_rewritten', async () => {
    // The slug is the thing the operator calls a site and is no longer the thing
    // rows are keyed by. Changing it used to rewrite `site_pages`,
    // `site_assets`, `site_changes`, `site_revisions`, `published_sites` and
    // every R2 key the site owned; now it is one column and nothing else moves.
    const business = await aBusiness('Renamer')
    await business.store.write(STARTER_SLUG, {
      assets: [{ name: 'mark.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await fill(business.store, STARTER_SLUG, 'Renamer')
    await publishSite(business.store, STARTER_SLUG, { message: 'r1' })

    const siteKey = (await business.store.siteKey(STARTER_SLUG))!
    const objectsBefore = await keysUnder('')
    const pagesBefore = await business.store.readPages(STARTER_SLUG)
    const revisionsBefore = await business.store.revisions(STARTER_SLUG)

    await env.DB.prepare('UPDATE sites SET slug = ? WHERE id = ?').bind('shop', siteKey).run()

    const after = await root().forTenant(business.businessId)
    expect(await after.slugs()).toEqual(['shop'])
    // The KEY did not move, so the public address did not either.
    expect(await after.siteKey('shop')).toBe(siteKey)
    expect(await (await serve(`/site/${siteKey}/`)).status).toBe(200)
    // Nor did a single row or object belonging to it.
    expect(await after.readPages('shop')).toEqual(pagesBefore)
    expect(await after.revisions('shop')).toEqual(revisionsBefore)
    expect(await after.listAssets('shop')).toEqual(['mark.svg'])
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
    // A SECOND SITE, because both businesses already hold a starter called
    // `home` and the destination's slug has to be free. That is the constraint
    // doing its job rather than an obstacle: a business may hold one site per
    // slug, so a move onto a name the destination already uses is refused — see
    // the case below. The worked example has this shape too, `xgd` moving into
    // the business named after it.
    await from.store.createDraft('shopfront')
    await from.store.write('shopfront', {
      assets: [{ name: 'logo.svg', bytes: new TextEncoder().encode('<svg id="moved"/>') }],
    })
    await fill(from.store, 'shopfront', 'Origin Ltd')
    await publishSite(from.store, 'shopfront', { message: 'r1' })

    const siteKey = (await from.store.siteKey('shopfront'))!
    const objectsBefore = await keysUnder('')
    const childRows = async () => ({
      pages: (
        await env.DB.prepare('SELECT name, page FROM site_pages WHERE site_id = ? ORDER BY name')
          .bind(siteKey)
          .all<{ name: string; page: string }>()
      ).results,
      assets: (
        await env.DB.prepare(
          'SELECT name, r2_key FROM site_assets WHERE site_id = ? ORDER BY name',
        )
          .bind(siteKey)
          .all<{ name: string; r2_key: string }>()
      ).results,
      revisions: (
        await env.DB.prepare('SELECT id, sha FROM site_revisions WHERE site_id = ? ORDER BY id')
          .bind(siteKey)
          .all<{ id: number; sha: string }>()
      ).results,
    })
    const rowsBefore = await childRows()

    // THE MOVE. One column.
    await env.DB.prepare('UPDATE sites SET tenant_id = ? WHERE id = ?')
      .bind(to.businessId, siteKey)
      .run()

    // It is the destination's now, and reachable there under its own name.
    const destination = await root().forTenant(to.businessId)
    expect(await destination.slugs()).toEqual(['shopfront', STARTER_SLUG])
    expect(await destination.siteKey('shopfront')).toBe(siteKey)
    expect(await destination.listAssets('shopfront')).toEqual(['logo.svg'])

    // And it is NOT the origin's — which is the isolation half of the same move.
    const origin = await root().forTenant(from.businessId)
    expect(await origin.siteKey('shopfront')).toBeNull()
    expect(await origin.slugs()).toEqual([STARTER_SLUG])

    // No row in another table was rewritten and no R2 object was copied.
    expect(await childRows()).toEqual(rowsBefore)
    expect(await keysUnder('')).toEqual(objectsBefore)
    // The published address is unchanged, because it never named the business.
    expect(await (await serve(`/site/${siteKey}/`)).status).toBe(200)
  })

  it('test_UAT_FC_REQ-190_a_move_onto_a_taken_slug_is_refused_by_the_constraint', async () => {
    // THE OTHER SIDE OF "UNIQUE PER BUSINESS, NEVER GLOBAL". A slug means
    // nothing across businesses — that is what lets two of them publish `home` —
    // but inside one it must still name at most one site, or the builder could
    // not address either. So a move that would give the destination two sites
    // called the same thing is refused by the DATABASE, not by a check a caller
    // could forget, and the site stays where it was.
    const from = await aBusiness('Colliding Origin')
    const to = await aBusiness('Colliding Destination')
    const siteKey = (await from.store.siteKey(STARTER_SLUG))!

    await expect(
      env.DB.prepare('UPDATE sites SET tenant_id = ? WHERE id = ?')
        .bind(to.businessId, siteKey)
        .run(),
    ).rejects.toThrow(/UNIQUE constraint failed/)

    expect(await from.store.siteKey(STARTER_SLUG)).toBe(siteKey)
    expect(await (await root().forTenant(to.businessId)).siteKey(STARTER_SLUG)).not.toBe(siteKey)
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
    await business.store.createDraft('second')
    await business.store.write('second', {
      assets: [{ name: 'a.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await business.store.write(STARTER_SLUG, {
      assets: [{ name: 'b.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await fill(business.store, STARTER_SLUG, 'Erasable')
    await publishSite(business.store, STARTER_SLUG, { message: 'r1' })

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
    await business.store.write(STARTER_SLUG, {
      assets: [{ name: 'x.svg', bytes: new TextEncoder().encode('<svg/>') }],
    })
    await fill(business.store, STARTER_SLUG, 'Forgetful')
    await publishSite(business.store, STARTER_SLUG, { message: 'r1' })
    const siteKey = (await business.store.siteKey(STARTER_SLUG))!
    expect(await keysUnder(`draft/${siteKey}/`)).not.toHaveLength(0)
    expect(await keysUnder(`sites/${siteKey}/`)).not.toHaveLength(0)

    await business.store.forget(STARTER_SLUG)

    expect(await business.store.siteKey(STARTER_SLUG)).toBeNull()
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
    await fill(business.store, STARTER_SLUG, 'Ordinals')
    const first = await publishSite(business.store, STARTER_SLUG, { message: 'r1' })
    await fill(business.store, STARTER_SLUG, 'Ordinals, again')
    const second = await publishSite(business.store, STARTER_SLUG, { message: 'r2' })

    expect(first.id).toBe(1)
    expect(second.id).toBe(2)
    expect((await business.store.revisions(STARTER_SLUG)).map((r) => r.id)).toEqual([1, 2])

    const at = await business.store.appendChange(STARTER_SLUG, { kind: 'edit' } as never)
    expect(at).toBeGreaterThan(0)
    expect(await business.store.appendChange(STARTER_SLUG, { kind: 'edit' } as never)).toBe(at + 1)
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
