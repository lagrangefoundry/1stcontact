import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { editCopySet, editPageAdd, editPageGet } from '../tools/generate/src/cli/edit'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { d1r2SiteStore, UnknownTenantError } from '../tools/generate/src/store/d1r2-store'
import { importSite } from '../tools/generate/src/store/import-site'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import type { SiteStore, SiteWrite } from '../tools/generate/src/store/site-store'
import { StoreConflictError } from '../tools/generate/src/store/site-store'
import type { LoadedSite } from '../tools/generate/src/store/assemble'
import {
  applySchema,
  DEFAULT_TENANT,
  ensureTenant,
  makeD1Site,
  storeEnv,
  tenantStore,
} from './support/d1-site-factory'
import type { SiteFixture } from './support/site-seed'
import { nextSlug, siteSeed } from './support/site-seed'
import { askStorageQuestions } from './support/storage-questions'

/**
 * Reconciliation UATs for story-fde7370b — "Cloudflare Site Store: Definitions
 * In A Database, Bytes In An Object Store, Scoped To One Account".
 *
 * WHAT MAKES THESE ASSERTIONS WORTH ANYTHING. Every one runs INSIDE workerd,
 * against a real D1 database and a real R2 bucket supplied by
 * `@cloudflare/vitest-pool-workers`. Nothing is stubbed. SQLite enforces the
 * primary key the compare-and-set is built on, D1 runs `batch()` in a
 * transaction and rolls it back, R2 computes its own object metadata. A
 * hand-written double would let every one of these pass while proving nothing
 * about the deployed Worker — which is the entire point of a store whose reason
 * to exist is "reachable from a runtime with no filesystem".
 *
 * This file carries the ten criteria that are claims about the cloud store:
 * AC-1386 … AC-1390, AC-1392 … AC-1396. The four the host runtime owns —
 * AC-1385, AC-1391, AC-1397, AC-1398 — live in the sibling
 * `reconciliation-cloudflare-site-store.test.ts`, and the two meet at
 * `tests/support/storage-questions.ts`, the ONE question set both run.
 */

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"></svg>'
const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text)

/** A minimal L1 page carrying a palette reference — the copy-edit target. */
function pageWithPaletteRef(): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: [],
    l1: {
      widths: [1280],
      background: '#ffffff',
      textColor: '#111827',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            id: 'headline',
            text: 'Hello',
            axes: { color: { ref: 'brand-teal' }, fontSizePx: 32 },
          },
        ],
      },
    },
  }
}

function seedWithPalette() {
  return {
    patchSiteJson: { palette: { 'brand-teal': { value: '#0d9488' } } },
    pages: { 'home.json': pageWithPaletteRef() },
  }
}

/** A page definition by name, so a multi-page change is one expression. */
const pageNamed = (id: string): { name: string; page: Record<string, unknown> } => ({
  name: `${id}.json`,
  page: { id, slug: id, title: id.toUpperCase(), modules: [] },
})

/** A store that counts the writes it was asked to make. */
function recording(inner: SiteStore): { store: SiteStore; writes: SiteWrite[] } {
  const writes: SiteWrite[] = []
  const store: SiteStore = {
    ...inner,
    write(slug, change) {
      writes.push(change)
      return inner.write(slug, change)
    },
  }
  return { store, writes }
}

function unwrap(result: unknown, label: string): LoadedSite {
  const outcome = result as { ok: boolean; value?: LoadedSite; errors?: { message: string }[] }
  if (!outcome.ok) {
    throw new Error(`${label} failed to assemble: ${outcome.errors!.map((e) => e.message).join('; ')}`)
  }
  return outcome.value!
}

/** The assembled definition minus the one field that names its own store. */
const withoutStoreLabel = (site: LoadedSite): Record<string, unknown> => {
  const { sourceDir: _named, ...rest } = site
  return rest
}

describe('story-fde7370b — the cloud site store, inside the Workers runtime', () => {
  const open: SiteFixture[] = []

  beforeAll(async () => {
    await applySchema()
  })

  afterEach(async () => {
    for (const f of open.splice(0)) await f.dispose()
  })

  // ── AC-1386 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1386_a_store_handle_sees_exactly_one_account_and_no_operation_takes_one', async () => {
    const shared = nextSlug('ac1386-shared')
    const a = await tenantStore('ac1386-a')
    const b = await tenantStore('ac1386-b')

    // Two accounts, each holding a site under the SAME name — a site is an
    // object inside an account, so `home` may exist once per account.
    for (const [store, who] of [
      [a, 'a'],
      [b, 'b'],
    ] as const) {
      await store.createDraft(shared)
      await store.createDraft(`${shared}-${who}-only`)
      await store.write(shared, {
        siteJson: { config: { businessName: `${who}'s site` } },
        pages: [pageNamed(`${who}-page`)],
        assets: [{ name: 'mark.svg', bytes: utf8(`<!-- ${who} -->${SVG}`) }],
      })
    }

    // Each handle reports its OWN account's definition, pages and assets.
    expect(await a.readSiteJson(shared)).toMatchObject({ config: { businessName: "a's site" } })
    expect(await b.readSiteJson(shared)).toMatchObject({ config: { businessName: "b's site" } })
    expect((await a.readPages(shared)).map((p) => p.name)).toEqual(['a-page.json'])
    expect((await b.readPages(shared)).map((p) => p.name)).toEqual(['b-page.json'])
    expect(new TextDecoder().decode((await a.readAsset(shared, 'mark.svg'))!)).toContain('<!-- a -->')
    expect(new TextDecoder().decode((await b.readAsset(shared, 'mark.svg'))!)).toContain('<!-- b -->')

    // Neither lists the other's site among the account's own.
    expect(await a.slugs()).toContain(`${shared}-a-only`)
    expect(await a.slugs()).not.toContain(`${shared}-b-only`)
    expect(await b.slugs()).not.toContain(`${shared}-a-only`)

    // A write through one changes only that account's site — including its
    // version, which is the number a conditional write is checked against.
    const bBefore = {
      siteJson: await b.readSiteJson(shared),
      pages: await b.readPages(shared),
      assets: await b.listAssets(shared),
      version: await b.version(shared),
    }
    await a.write(shared, {
      siteJson: { config: { businessName: 'a moved on' } },
      pages: [pageNamed('a-second')],
      assets: [{ name: 'extra.svg', bytes: utf8(SVG) }],
    })
    expect(await b.readSiteJson(shared)).toEqual(bBefore.siteJson)
    expect(await b.readPages(shared)).toEqual(bBefore.pages)
    expect(await b.listAssets(shared)).toEqual(bBefore.assets)
    expect(await b.version(shared)).toBe(bBefore.version)

    // NO STORAGE OPERATION TAKES AN ACCOUNT. Not a style observation: supplying
    // the wrong one at a call site is not expressible, because there is no
    // parameter to supply it through. Reaching a second account required
    // constructing a second handle above, which is visible in a diff.
    expect(a.tenantId).toBe('ac1386-a')
    expect(b.tenantId).toBe('ac1386-b')
    expect(a.hasDraft.length).toBe(1)
    expect(a.readSiteJson.length).toBe(1)
    expect(a.readPages.length).toBe(1)
    expect(a.write.length).toBe(2)
    expect(a.listAssets.length).toBe(1)
    expect(a.readAsset.length).toBe(2)
    expect(a.version.length).toBe(1)
    expect(a.loadDraft.length).toBe(1)
    // The store's own administrative verbs are scoped the same way.
    expect(a.createDraft.length).toBe(1)
    expect(a.forget.length).toBe(1)
    expect(a.slugs.length).toBe(0)

    // Dropping a site takes only this account's, even when the names collide.
    await a.forget(shared)
    expect(await a.hasDraft(shared)).toBe(false)
    expect(await b.hasDraft(shared)).toBe(true)
    expect(await b.readSiteJson(shared)).toEqual(bBefore.siteJson)

    await b.forget(shared)
    await a.forget(`${shared}-a-only`)
    await b.forget(`${shared}-b-only`)
  })

  // ── AC-1387 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1387_an_unknown_or_inactive_account_is_refused_when_the_handle_is_asked_for', async () => {
    const root = d1r2SiteStore(storeEnv())

    // Never registered at all.
    let unknown: unknown = null
    try {
      await root.forTenant('ac1387-nobody')
    } catch (err) {
      unknown = err
    }
    expect(unknown).toBeInstanceOf(UnknownTenantError)
    expect(unknown).toMatchObject({ tenantId: 'ac1387-nobody' })
    expect((unknown as Error).message).toContain('ac1387-nobody')
    expect((unknown as Error).message).toMatch(/No tenant/)

    // Registered, but not active. The dangerous alternative to refusing is a
    // handle that reads nothing — indistinguishable from a real, empty account
    // at every call site that would ever see it.
    await ensureTenant('ac1387-suspended', 'suspended')
    let inactive: unknown = null
    try {
      await root.forTenant('ac1387-suspended')
    } catch (err) {
      inactive = err
    }
    expect(inactive).toBeInstanceOf(UnknownTenantError)
    expect(inactive).toMatchObject({ tenantId: 'ac1387-suspended' })
    expect((inactive as Error).message).toMatch(/not active/)

    // The two are distinguishable in prose, for whoever reads the log.
    expect((inactive as Error).message).not.toBe((unknown as Error).message)

    // …AND THE REASON IS A VALUE, not only prose. The two cases license opposite
    // responses — a caller that owns the deployment's configuration may resolve
    // "not registered" by registering the one account it names, and may never
    // resolve "not active" — so telling them apart may not require parsing a
    // sentence somebody will reword.
    expect((unknown as UnknownTenantError).reason).toBe('unknown')
    expect((inactive as UnknownTenantError).reason).toBe('inactive')
    expect((unknown as UnknownTenantError).reason).not.toBe(
      (inactive as UnknownTenantError).reason,
    )

    // NO HANDLE IS PRODUCED in either case — the refusal is the value.
    await expect(root.forTenant('ac1387-nobody')).rejects.toBeInstanceOf(UnknownTenantError)
    await expect(root.forTenant('ac1387-suspended')).rejects.toBeInstanceOf(UnknownTenantError)

    // ── the discriminant, exercised as a caller actually branches on it ───────
    // Written the way `apps/control-app/src/store.ts` writes it: register on
    // `unknown`, rethrow anything else. Driving the branch rather than reading
    // the field is what makes the value load-bearing — with the reason deleted,
    // or with both cases collapsed back into one, this stops compiling or stops
    // refusing, instead of staying green while the guarantee is gone.
    const bootstrap = async (id: string) => {
      try {
        return await root.forTenant(id)
      } catch (err) {
        if (!(err instanceof UnknownTenantError) || err.reason !== 'unknown') throw err
        await root.createTenant({ id, name: id })
        return root.forTenant(id)
      }
    }

    // `unknown` is the one that licenses registration: the account is created
    // and the handle opens.
    const bootstrapped = await bootstrap('ac1387-nobody')
    expect(bootstrapped.tenantId).toBe('ac1387-nobody')
    expect((await root.listTenants()).find((t) => t.id === 'ac1387-nobody')).toMatchObject({
      id: 'ac1387-nobody',
      status: 'active',
    })

    // `inactive` is not. A deactivation a caller could retry past would be a
    // suggestion rather than a decision — and it is still deactivated after.
    await expect(bootstrap('ac1387-suspended')).rejects.toBeInstanceOf(UnknownTenantError)
    expect((await root.listTenants()).find((t) => t.id === 'ac1387-suspended')).toMatchObject({
      id: 'ac1387-suspended',
      status: 'suspended',
    })

    // An account that exists and is active yields a handle that names it, and
    // the failure above was discovered at construction: no read was needed.
    await ensureTenant('ac1387-live', 'active')
    const live = await root.forTenant('ac1387-live')
    expect(live.tenantId).toBe('ac1387-live')
    expect(await live.slugs()).toEqual([])
  })

  // ── AC-1388 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1388_a_site_version_is_readable_and_advances_on_every_write', async () => {
    const f = await makeD1Site()
    open.push(f)
    const { slug, store } = f

    const before = await store.version(slug)
    expect(before).toBeTypeOf('number')

    // An unconditional change always lands, and the version afterwards is
    // strictly greater.
    await store.write(slug, { pages: [pageNamed('about')] })
    const after = await store.version(slug)
    expect(after).toBeGreaterThan(before!)

    // THE VERSION IS NOT THE CHANGE COUNT. This write journals nothing, so the
    // change count stands still while the version moves — a number that could
    // stand still across a write would be unusable as the thing a conditional
    // write is checked against.
    const counterBefore = await store.counter(slug)
    await store.write(slug, { pages: [pageNamed('contact')] })
    expect(await store.counter(slug)).toBe(counterBefore)
    expect(await store.version(slug)).toBeGreaterThan(after!)

    // …and they move independently in the other direction too.
    const versionBeforeJournal = await store.version(slug)
    expect(await store.appendChange(slug, { actor: 'cli', op: 'copy.set', summary: 'noted' })).toBe(
      counterBefore + 1,
    )
    expect(await store.version(slug)).toBe(versionBeforeJournal)

    // A site the store does not hold has no version — an absence, not a zero.
    expect(await store.version('ac1388-no-such-site')).toBeNull()
  })

  // ── AC-1389 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1389_a_stale_expectation_is_refused_with_both_versions_and_one_racer_survives', async () => {
    const f = await makeD1Site(seedWithPalette())
    open.push(f)
    const { slug, store } = f

    // Carried and still current: the change lands and the version advances.
    const seen = await store.version(slug)
    expect(seen).not.toBeNull()
    await store.write(slug, {
      pages: [{ name: 'home.json', page: { ...pageWithPaletteRef(), title: 'A wins' } }],
      expect: seen!,
    })
    expect(await store.version(slug)).toBe(seen! + 1)

    // Carried and stale: refused, with BOTH versions — what the writer thought
    // it was changing, and what is actually there.
    const loser = store.write(slug, {
      pages: [{ name: 'home.json', page: { ...pageWithPaletteRef(), title: 'B wins' } }],
      expect: seen!,
    })
    await expect(loser).rejects.toBeInstanceOf(StoreConflictError)
    const refusal = await loser.catch((err: StoreConflictError) => err)
    expect(refusal.expected).toBe(seen)
    expect(refusal.actual).toBe(seen! + 1)
    expect(refusal.actual!).toBeGreaterThan(refusal.expected)
    // Distinguishable from any other failure, so a caller can report "someone
    // else changed this, re-read and try again" without parsing a database
    // message.
    expect(refusal.name).toBe('StoreConflictError')
    expect(refusal.message).toContain(slug)

    // …and the site shows no trace of the loser's change.
    const pages = await store.readPages(slug)
    expect(pages).toHaveLength(1)
    expect((pages[0].page as { title: string }).title).toBe('A wins')

    // THE RACE, run directly: two writers read the same version and both write
    // different content carrying it. Exactly one succeeds.
    const race = await store.version(slug)
    const settled = await Promise.allSettled([
      store.write(slug, {
        pages: [{ name: 'home.json', page: { ...pageWithPaletteRef(), title: 'racer one' } }],
        expect: race!,
      }),
      store.write(slug, {
        pages: [{ name: 'home.json', page: { ...pageWithPaletteRef(), title: 'racer two' } }],
        expect: race!,
      }),
    ])
    const won = settled.filter((r) => r.status === 'fulfilled')
    const lost = settled.filter((r) => r.status === 'rejected')
    expect(won).toHaveLength(1)
    expect(lost).toHaveLength(1)
    expect((lost[0] as PromiseRejectedResult).reason).toBeInstanceOf(StoreConflictError)

    const survivor = (await store.readPages(slug))[0].page as { title: string }
    expect(['racer one', 'racer two']).toContain(survivor.title)
    // The winner's content is what the site holds — the loser left no trace.
    const winnerIndex = settled.findIndex((r) => r.status === 'fulfilled')
    expect(survivor.title).toBe(winnerIndex === 0 ? 'racer one' : 'racer two')
  })

  // ── AC-1390 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1390_a_refused_multi_part_write_leaves_no_page_definition_or_version_behind', async () => {
    const f = await makeD1Site()
    open.push(f)
    const { slug, store } = f

    const stale = await store.version(slug)
    // Something unrelated lands, so the reading above is now behind.
    await store.write(slug, {
      siteJson: { ...(await store.readSiteJson(slug))!, marker: 'winner' },
    })

    const definitionBefore = await store.readSiteJson(slug)
    const pagesBefore = (await store.readPages(slug)).map((p) => p.name)
    const versionBefore = await store.version(slug)

    // The refused change writes a new definition AND four new pages together.
    // Every one of those statements executes inside the transaction before the
    // guard fires — the guard is deliberately the second-to-last statement — so
    // what this asserts is that D1 undid work that really happened, not that a
    // caller-side pre-check turned the write away before it was attempted.
    await expect(
      store.write(slug, {
        siteJson: { clobbered: true },
        pages: ['alpha', 'beta', 'gamma', 'delta'].map(pageNamed),
        expect: stale!,
      }),
    ).rejects.toBeInstanceOf(StoreConflictError)

    // None of those pages exists afterwards…
    const pagesAfter = (await store.readPages(slug)).map((p) => p.name)
    expect(pagesAfter).toEqual(pagesBefore)
    for (const name of ['alpha.json', 'beta.json', 'gamma.json', 'delta.json']) {
      expect(pagesAfter).not.toContain(name)
    }
    // …the definition is exactly what it was…
    expect(await store.readSiteJson(slug)).toEqual(definitionBefore)
    expect(await store.readSiteJson(slug)).toMatchObject({ marker: 'winner' })
    // …and the version did not move. A rolled-back write is not a write.
    expect(await store.version(slug)).toBe(versionBefore)

    // The end state is indistinguishable from the change never having been
    // attempted: the same questions answer the same way.
    expect({
      pages: (await store.readPages(slug)).map((p) => p.name),
      definition: await store.readSiteJson(slug),
      version: await store.version(slug),
    }).toEqual({ pages: pagesBefore, definition: definitionBefore, version: versionBefore })
  })

  // ── AC-1392 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable', async () => {
    const f = await makeD1Site()
    open.push(f)
    const { slug, store } = f
    const { SITES } = storeEnv()

    const svg = utf8(SVG)
    // Deliberately NOT valid text: a byte run that any decode on the way in or
    // out would corrupt. It survives only if it was never decoded.
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xfe, 0x00])
    expect(() => new TextDecoder('utf-8', { fatal: true }).decode(png)).toThrow()

    // Two assets in ONE change — written out of order, listed sorted.
    await store.write(slug, {
      assets: [
        { name: 'photo.png', bytes: png },
        { name: 'mark.svg', bytes: svg },
      ],
    })

    expect(await store.listAssets(slug)).toEqual(['mark.svg', 'photo.png'])
    expect(await store.readAsset(slug, 'mark.svg')).toEqual(svg)
    expect(await store.readAsset(slug, 'photo.png')).toEqual(png)

    // The stored object carries the content type the NAME implies, so a response
    // built from it is labelled without re-guessing the extension.
    const key = (name: string): string => `draft/${DEFAULT_TENANT}/${slug}/assets/${name}`
    const stored = await SITES.get(key('mark.svg'))
    expect(stored).not.toBeNull()
    expect(stored!.httpMetadata?.contentType).toBe('image/svg+xml')
    expect((await SITES.get(key('photo.png')))!.httpMetadata?.contentType).toBe('image/png')

    // An asset the store does not hold reports ABSENCE, not empty bytes.
    const absent = await store.readAsset(slug, 'never-written.svg')
    expect(absent).toBeNull()
    expect(absent).not.toEqual(new Uint8Array())

    // Removing one takes it out of the listing and out of a read; the others are
    // untouched.
    await store.write(slug, { removeAssets: ['mark.svg'] })
    expect(await store.listAssets(slug)).toEqual(['photo.png'])
    expect(await store.readAsset(slug, 'mark.svg')).toBeNull()
    expect(await store.readAsset(slug, 'photo.png')).toEqual(png)
  })

  // ── AC-1393 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1393_an_unsafe_asset_name_reads_as_absent_and_writes_nothing', async () => {
    const f = await makeD1Site()
    open.push(f)
    const { slug, store } = f
    const { SITES } = storeEnv()

    await store.write(slug, { assets: [{ name: 'good.svg', bytes: utf8(SVG) }] })

    // Real content really does exist OUTSIDE the site's assets namespace — the
    // condition that makes the confinement worth asserting rather than vacuous.
    const outside = `draft/${DEFAULT_TENANT}/${slug}/secret.txt`
    await SITES.put(outside, utf8('the definition, or worse'))
    expect(await SITES.get(outside)).not.toBeNull()

    // Reading a name that would leave the namespace reports ABSENCE — the same
    // answer the filesystem store gives — and never content from outside it.
    for (const unsafe of [
      '..',
      '../secret.txt',
      '../../other-site/assets/good.svg',
      'nested/good.svg',
      'nested\\good.svg',
    ]) {
      expect(await store.readAsset(slug, unsafe), unsafe).toBeNull()
    }

    // WRITING one stores nothing under it — and the rest of the same change
    // still lands, because a whole change is one call and discarding a caller's
    // other edits over one malformed name would lose work they had every right
    // to expect.
    await store.write(slug, {
      assets: [
        { name: 'wellformed.svg', bytes: utf8(SVG) },
        { name: '../escaped.svg', bytes: utf8('<!-- escaped -->') },
        { name: 'nested/escaped.svg', bytes: utf8('<!-- nested -->') },
      ],
    })

    expect(await store.listAssets(slug)).toEqual(['good.svg', 'wellformed.svg'])
    expect(await store.readAsset(slug, 'wellformed.svg')).toEqual(utf8(SVG))
    expect(await store.readAsset(slug, '../escaped.svg')).toBeNull()
    expect(await store.readAsset(slug, 'nested/escaped.svg')).toBeNull()

    // No bytes are reachable through the unsafe names either: the object store
    // holds nothing the change tried to put under them.
    const written = await SITES.list({ prefix: `draft/${DEFAULT_TENANT}/${slug}/` })
    expect(written.objects.map((o) => o.key)).not.toContain(`${outside}/../escaped.svg`)
    for (const object of written.objects) {
      expect(object.key, object.key).not.toContain('escaped.svg')
    }

    await SITES.delete(outside)
  })

  // ── AC-1394 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1394_a_whole_draft_copies_between_any_two_stores_as_one_whole_change', async () => {
    const slug = nextSlug('ac1394')
    const seed = siteSeed({
      slug,
      pages: {
        'home.json': pageWithPaletteRef(),
        ...Object.fromEntries(['about', 'contact', 'terms'].map((id) => [`${id}.json`, pageNamed(id).page])),
      },
      assets: { 'mark.svg': utf8(SVG), 'photo.png': new Uint8Array([0x89, 0x50, 0xff, 0x00]) },
      patchSiteJson: { palette: { 'brand-teal': { value: '#0d9488' } } },
    })

    const source = memorySiteStore()
    source.seed(slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })

    // ── between two filesystem-free stores, neither knowing what the other is ──
    const twin = memorySiteStore()
    twin.seed(slug, { siteJson: {}, pages: {} })
    const summary = await importSite(source, twin, slug)
    expect(summary).toEqual({
      slug,
      siteJson: true,
      pages: ['about.json', 'contact.json', 'home.json', 'terms.json'],
      assets: ['mark.svg', 'photo.png'],
    })
    expect(await twin.readSiteJson(slug)).toEqual(await source.readSiteJson(slug))
    expect(await twin.readPages(slug)).toEqual(await source.readPages(slug))
    expect(await twin.readAsset(slug, 'photo.png')).toEqual(seed.assets['photo.png'])

    // ── into the cloud store, and back out again ─────────────────────────────
    const cloud = await tenantStore('ac1394-account')
    await cloud.createDraft(slug)
    const recorded = recording(cloud)
    const intoCloud = await importSite(source, recorded.store, slug)
    expect(intoCloud.pages).toEqual(['about.json', 'contact.json', 'home.json', 'terms.json'])
    expect(intoCloud.assets).toEqual(['mark.svg', 'photo.png'])
    expect(await cloud.readSiteJson(slug)).toEqual(await source.readSiteJson(slug))
    expect(await cloud.readPages(slug)).toEqual(await source.readPages(slug))
    expect(await cloud.readAsset(slug, 'mark.svg')).toEqual(seed.assets['mark.svg'])

    // IT CROSSES AS ONE WHOLE CHANGE. Against the transactional store that is a
    // single `db.batch()`, which is what makes "whole or not at all" true rather
    // than hoped for.
    expect(recorded.writes).toHaveLength(1)
    expect((recorded.writes[0].pages ?? []).map((p) => p.name)).toEqual([
      'about.json',
      'contact.json',
      'home.json',
      'terms.json',
    ])

    const back = memorySiteStore()
    back.seed(slug, { siteJson: {}, pages: {} })
    await importSite(cloud, back, slug)
    expect(await back.readPages(slug)).toEqual(await source.readPages(slug))

    // ── a destination that does not already hold the site is REFUSED ─────────
    // The copy does not create sites; making one exist is the store's own
    // administrative operation, and a copy that invented sites could resurrect
    // one that was deliberately dropped.
    const empty = await tenantStore('ac1394-empty')
    await expect(importSite(source, empty, slug)).rejects.toThrow(/does not exist/)
    expect(await empty.hasDraft(slug)).toBe(false)
    expect(await empty.slugs()).not.toContain(slug)

    // ── a source that holds no draft is REFUSED, destination untouched ───────
    const barren = memorySiteStore()
    const destinationBefore = await twin.readPages(slug)
    await expect(importSite(barren, twin, slug)).rejects.toThrow(/no draft in the source/)
    expect(await twin.readPages(slug)).toEqual(destinationBefore)

    // ── a source that lists an asset it cannot produce is REFUSED ────────────
    // Copying a zero-length asset over it would bake the source's inconsistency
    // into the destination as real content.
    const inconsistent: SiteStore = {
      ...source,
      listAssets: async (s: string) => [...(await source.listAssets(s)), 'phantom.svg'],
      readAsset: async (s: string, name: string) =>
        name === 'phantom.svg' ? null : source.readAsset(s, name),
    }
    const victim = memorySiteStore()
    victim.seed(slug, { siteJson: {}, pages: {} })
    await expect(importSite(inconsistent, victim, slug)).rejects.toThrow(/has no bytes/)
    expect(await victim.listAssets(slug)).toEqual([])
    expect(await victim.readPages(slug)).toEqual([])

    // ── a copy that fails part-way leaves NO pages from it, not some ─────────
    const partial = await tenantStore('ac1394-partial')
    await partial.createDraft(slug)
    // The destination says it holds the site, and then does not — the shape of a
    // copy interrupted between its check and its write.
    const vanishing: SiteStore = { ...partial, hasDraft: async () => true }
    await partial.forget(slug)
    await expect(importSite(source, vanishing, slug)).rejects.toThrow(/No site/)
    await partial.createDraft(slug)
    expect(await partial.readPages(slug)).toEqual([])
    expect(await partial.readSiteJson(slug)).toBeNull()

    await cloud.forget(slug)
    await partial.forget(slug)
  })

  // ── AC-1395 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1395_a_real_site_copied_into_the_cloud_store_assembles_and_renders_identically',
    async () => {
      // The operator's ACTUAL site definitions, inlined by Vite at build time —
      // workerd has no filesystem, so this is how the real bytes reach it.
      // Nothing here is a hand-written fixture.
      const modules = import.meta.glob('../storage/sites/*/draft/**/*.json', {
        eager: true,
        import: 'default',
      }) as Record<string, Record<string, unknown>>

      const bySlug = new Map<
        string,
        { siteJson?: Record<string, unknown>; pages: Record<string, Record<string, unknown>> }
      >()
      for (const [file, value] of Object.entries(modules)) {
        const match = /storage\/sites\/([^/]+)\/draft\/(.+)$/.exec(file)
        if (!match) continue
        const [, slug, rest] = match
        const entry = bySlug.get(slug) ?? { pages: {} }
        if (rest === 'site.json') entry.siteJson = value
        else if (rest.startsWith('pages/')) entry.pages[rest.slice('pages/'.length)] = value
        bySlug.set(slug, entry)
      }
      // A guard, not decoration: an empty `storage/sites/` would make everything
      // below vacuous and the test would go green having asserted nothing.
      expect(bySlug.size).toBeGreaterThan(0)

      const cloud = await tenantStore('ac1395-account')
      for (const [realSlug, parts] of bySlug) {
        if (!parts.siteJson) continue
        const slug = `ac1395-${realSlug}`

        // The source: the same definitions, held by a store with nothing behind
        // it. What differs between the two ends is only which store holds them.
        const source = memorySiteStore()
        source.seed(slug, { siteJson: parts.siteJson, pages: parts.pages })

        await cloud.createDraft(slug)
        const summary = await importSite(source, cloud, slug)
        expect(summary.siteJson, realSlug).toBe(true)
        expect(summary.pages.sort(), realSlug).toEqual(Object.keys(parts.pages).sort())

        // ── the assembled definition ───────────────────────────────────────
        const fromSource = unwrap((await source.loadDraft(slug))!.result, `${realSlug} (source)`)
        const fromCloud = unwrap((await cloud.loadDraft(slug))!.result, `${realSlug} (cloud)`)
        // The whole assembled, palette-resolved definition, modulo only the
        // descriptive label naming which store served it — which nothing reads
        // when answering a request.
        expect(withoutStoreLabel(fromCloud), realSlug).toEqual(withoutStoreLabel(fromSource))
        expect(fromCloud.sourceDir, realSlug).not.toBe(fromSource.sourceDir)

        // ── the rendered output ────────────────────────────────────────────
        const renderedFromSource = await renderSiteFiles(fromSource)
        const renderedFromCloud = await renderSiteFiles(fromCloud)
        expect(renderedFromSource.files.size, realSlug).toBeGreaterThan(0)
        expect([...renderedFromCloud.files.keys()].sort(), realSlug).toEqual(
          [...renderedFromSource.files.keys()].sort(),
        )
        // Byte-for-byte, every emitted file — not a spot check on the pages.
        // The generated stylesheet and script are where a dropped asset or a
        // reordered page would surface.
        for (const [file, content] of renderedFromSource.files) {
          expect(renderedFromCloud.files.get(file), `${realSlug}/${file}`).toBe(content)
        }
        expect([...renderedFromCloud.files.keys()].some((f) => f.endsWith('.css')), realSlug).toBe(
          true,
        )
        expect(renderedFromCloud.pages, realSlug).toEqual(renderedFromSource.pages)

        // …and indistinguishable on every OTHER question too: the same shared
        // question set the host-runtime suite runs over the filesystem and
        // filesystem-free stores, run here against the cloud store (AC-1385).
        expect(await askStorageQuestions(cloud, slug), realSlug).toEqual(
          await askStorageQuestions(source, slug),
        )

        await cloud.forget(slug)
      }
    },
    30_000,
  )

  // ── AC-1396 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1396_the_editing_surface_completes_inside_the_workers_runtime', async () => {
    const f = await makeD1Site(seedWithPalette())
    open.push(f)

    // THE RUNTIME IS THE CLAIM. This is workerd, not the host — and the bindings
    // the store is driving are a real D1 database and a real R2 bucket, not
    // doubles. There is no filesystem anywhere on this path: the fixture holds
    // no directory handle at all.
    expect(navigator.userAgent).toBe('Cloudflare-Workers')
    expect(f.cwd).toBeNull()
    expect(f.opts.cwd).toBeUndefined()

    // Editing a copy segment, and adding a page. Before this store existed the
    // editing surface could not even be LOADED here — importing the framework's
    // main entry pulled in components no Worker bundle can resolve, which made
    // the importer node-only transitively and silently. A regression in what the
    // editing surface imports shows up as this file failing to load at all,
    // which is the point.
    const edited = await editCopySet(f.slug, 'home', '0.0', { text: 'Edited in a Worker' }, f.opts)
    expect((edited.data as { changed: string[] }).changed).toEqual(['text'])
    await editPageAdd(f.slug, 'about', { ...f.opts, title: 'About', path: 'about' })

    // Afterwards the site holds both pages under their store keys, in load
    // order…
    expect((await f.store.readPages(f.slug)).map((p) => p.name)).toEqual([
      'about.json',
      'home.json',
    ])
    // …and the change count reflects both edits.
    expect(await f.store.counter(f.slug)).toBe(2)

    // Refusals in this runtime carry the same envelope — a code, the path the
    // refusal concerns, and a hint — as they do on the operator's machine.
    await expect(editPageGet(f.slug, 'nope', f.opts)).rejects.toMatchObject({
      name: 'CommandError',
      code: 'NOT_FOUND',
      path: 'nope',
      hint: `List pages with '1c page list ${f.slug}'.`,
    })
  })
})
