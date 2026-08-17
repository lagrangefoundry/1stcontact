import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { editCopySet, editPageAdd } from '../tools/generate/src/cli/edit'
import {
  d1r2SiteStore,
  UnknownTenantError,
} from '../tools/generate/src/store/d1r2-store'
import { importSite } from '../tools/generate/src/store/import-site'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { StoreConflictError } from '../tools/generate/src/store/site-store'
import {
  applySchema,
  DEFAULT_TENANT,
  ensureTenant,
  makeD1Site,
  storeEnv,
  tenantStore,
} from './support/d1-site-factory'
import { describeSiteStoreContract, seedWithPalette } from './support/site-store-contract'
import type { SiteFixture } from './support/site-seed'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-143 — the Cloudflare `SiteStore`: definitions in D1, bytes in R2.
 *
 * WHAT MAKES THESE ASSERTIONS WORTH ANYTHING. Everything below runs inside
 * workerd against a real D1 database and a real R2 bucket, supplied by
 * `@cloudflare/vitest-pool-workers`. Nothing is stubbed. SQLite enforces the
 * primary keys, D1 runs `batch()` in a transaction and rolls it back, R2
 * computes its own object metadata. A hand-written double would let every one of
 * these pass while proving nothing about the deployed Worker.
 *
 * THE CONTRACT IS IMPORTED, NOT RESTATED. `describeSiteStoreContract` is the
 * same body of assertions the node suite runs over the filesystem and in-memory
 * adapters. AC-1's "one port, one contract" is therefore not two files that
 * agree today — it is one file, run three times.
 */

describe('REQ-143 — the D1/R2 SiteStore', () => {
  const open: SiteFixture[] = []

  beforeAll(async () => {
    await applySchema()
  })

  afterEach(async () => {
    for (const f of open.splice(0)) await f.dispose()
  })

  // ── AC-1: the port's contract, over D1 and R2 ─────────────────────────────

  describeSiteStoreContract(
    { name: 'D1/R2', make: (options) => makeD1Site(options) },
    (f) => open.push(f),
  )

  // ── AC-2: version compare-and-set ─────────────────────────────────────────

  it('UAT_FC_REQ-143 the losing writer of a concurrent write is refused, and one write survives', async () => {
    const { slug, store } = await makeD1Site(seedWithPalette()).then((f) => (open.push(f), f))

    // Both writers read the same version — the window a lost update lives in.
    const seen = await store.version(slug)
    expect(seen).not.toBeNull()

    await store.write(slug, {
      pages: [{ name: 'home.json', page: { id: 'home', slug: 'home', title: 'A wins', modules: [] } }],
      expect: seen!,
    })

    // B computed its change against `seen`, which has since moved.
    const loser = store.write(slug, {
      pages: [{ name: 'home.json', page: { id: 'home', slug: 'home', title: 'B wins', modules: [] } }],
      expect: seen!,
    })
    await expect(loser).rejects.toBeInstanceOf(StoreConflictError)
    await expect(loser).rejects.toMatchObject({ expected: seen, actual: seen! + 1 })

    // Exactly one of the two writes is in the store, and it is the winner's.
    const pages = await store.readPages(slug)
    expect(pages).toHaveLength(1)
    expect((pages[0].page as { title: string }).title).toBe('A wins')
  })

  it('UAT_FC_REQ-143 a write with no expectation is unconditional and still moves the version', async () => {
    const f = await makeD1Site()
    open.push(f)

    const before = (await f.store.version(f.slug))!
    // No `expect`: the caller is not claiming to have read anything, so there is
    // nothing to be stale against. This is the path every command takes today.
    await f.store.write(f.slug, { siteJson: { ...(await f.store.readSiteJson(f.slug))!, x: 1 } })
    expect(await f.store.version(f.slug)).toBe(before + 1)
  })

  // ── AC-3: a multi-page write is one transaction ───────────────────────────

  it('UAT_FC_REQ-143 a refused multi-page write leaves no partial state', async () => {
    const f = await makeD1Site()
    open.push(f)
    const { slug, store } = f

    const stale = (await store.version(slug))!
    // Something else lands first, so `stale` is now behind.
    await store.write(slug, { siteJson: { ...(await store.readSiteJson(slug))!, marker: 'winner' } })

    // The refused write carries FOUR page inserts and a `site.json` replacement.
    // Every one of those statements executes inside the transaction before the
    // guard fires — that is why the guard is the second-to-last statement rather
    // than the first (see `d1r2-store.ts`). What this asserts is that D1 undid
    // all of them: the filesystem adapter, applying the same change as a
    // sequence of `writeFileSync` calls, would leave four new pages behind.
    await expect(
      store.write(slug, {
        siteJson: { clobbered: true },
        pages: ['a', 'b', 'c', 'd'].map((id) => ({
          name: `${id}.json`,
          page: { id, slug: id, title: id.toUpperCase(), modules: [] },
        })),
        expect: stale,
      }),
    ).rejects.toBeInstanceOf(StoreConflictError)

    expect((await store.readPages(slug)).map((p) => p.name)).toEqual(['home.json'])
    expect(await store.readSiteJson(slug)).toMatchObject({ marker: 'winner' })
    // And the version did not move: a rolled-back write is not a write.
    expect(await store.version(slug)).toBe(stale + 1)
  })

  it('UAT_FC_REQ-143 a multi-page write that succeeds lands every page at once', async () => {
    const f = await makeD1Site()
    open.push(f)

    await f.store.write(f.slug, {
      siteJson: { ...(await f.store.readSiteJson(f.slug))!, marker: 'together' },
      pages: ['one', 'two', 'three'].map((id) => ({
        name: `${id}.json`,
        page: { id, slug: id, title: id, modules: [] },
      })),
      expect: (await f.store.version(f.slug))!,
    })

    expect((await f.store.readPages(f.slug)).map((p) => p.name)).toEqual([
      'home.json',
      'one.json',
      'three.json',
      'two.json',
    ])
    expect(await f.store.readSiteJson(f.slug)).toMatchObject({ marker: 'together' })
  })

  // ── AC-4: the tenant is the barrier ───────────────────────────────────────

  it('UAT_FC_REQ-143 a handle for one tenant cannot read or write another tenant s site', async () => {
    const slug = nextSlug('shared-slug')
    const a = await tenantStore('tenant-a')
    const b = await tenantStore('tenant-b')

    await a.createDraft(slug)
    await a.write(slug, {
      siteJson: { config: { businessName: "A's site" } },
      pages: [{ name: 'home.json', page: { id: 'home', slug: 'home', title: 'A', modules: [] } }],
    })

    // The same slug in both accounts is not a collision — a site is an object
    // INSIDE a tenant (DOC-10 §4.1), so `home` may exist once per account.
    expect(await b.hasDraft(slug)).toBe(false)
    expect(await b.readSiteJson(slug)).toBeNull()
    expect(await b.readPages(slug)).toEqual([])
    expect(await b.slugs()).not.toContain(slug)

    // B cannot write into it either — from B's handle the site does not exist,
    // so the write is refused rather than silently landing in A's rows.
    await expect(
      b.write(slug, { siteJson: { config: { businessName: 'B took it' } } }),
    ).rejects.toThrow()

    // B making its own site of the same name leaves A's untouched.
    await b.createDraft(slug)
    await b.write(slug, { siteJson: { config: { businessName: "B's site" } } })
    expect(await a.readSiteJson(slug)).toMatchObject({ config: { businessName: "A's site" } })
    expect(await b.readSiteJson(slug)).toMatchObject({ config: { businessName: "B's site" } })

    await a.forget(slug)
    await b.forget(slug)
  })

  it('UAT_FC_REQ-143 an unknown or inactive tenant is a typed error, never a silent default', async () => {
    const root = d1r2SiteStore(storeEnv())

    await expect(root.forTenant('no-such-tenant')).rejects.toBeInstanceOf(UnknownTenantError)
    await expect(root.forTenant('no-such-tenant')).rejects.toMatchObject({
      tenantId: 'no-such-tenant',
    })

    // Registered but suspended is refused too. The dangerous alternative is a
    // handle that reads nothing, which is indistinguishable from "this account
    // has no sites yet" at every call site that would see it.
    await ensureTenant('tenant-suspended', 'suspended')
    await expect(root.forTenant('tenant-suspended')).rejects.toBeInstanceOf(UnknownTenantError)

    await ensureTenant('tenant-live', 'active')
    const live = await root.forTenant('tenant-live')
    expect(live.tenantId).toBe('tenant-live')
  })

  it('UAT_FC_REQ-143 tenancy is bound into the handle, not passed at call sites', async () => {
    const store = await tenantStore(DEFAULT_TENANT)
    // Not a style observation: no verb on the port takes a tenant, so there is
    // no call site at which the wrong one could be supplied. Crossing the
    // barrier requires constructing a second handle, which is visible in a diff.
    for (const verb of ['readSiteJson', 'readPages', 'write', 'readAsset', 'loadDraft'] as const) {
      expect(typeof store[verb]).toBe('function')
    }
    expect(store.readSiteJson.length).toBe(1)
    expect(store.write.length).toBe(2)
  })

  // ── AC-5: bytes round-trip through R2, typed ──────────────────────────────

  it('UAT_FC_REQ-143 asset bytes round-trip through R2 with the right content type', async () => {
    const f = await makeD1Site()
    open.push(f)
    const { slug, store } = f
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"></svg>',
    )
    // Deliberately non-textual: a byte sequence that is not valid UTF-8 survives
    // only if it was never decoded on the way in or out.
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xfe, 0x00])

    await store.write(slug, {
      assets: [
        { name: 'mark.svg', bytes: svg },
        { name: 'photo.png', bytes: png },
      ],
    })

    expect(await store.listAssets(slug)).toEqual(['mark.svg', 'photo.png'])
    expect(await store.readAsset(slug, 'photo.png')).toEqual(png)
    expect(await store.readAsset(slug, 'mark.svg')).toEqual(svg)

    // R2 holds the object with the content type the store derived, so a response
    // built from it is labelled without a second guess at the extension.
    const { SITES } = storeEnv()
    const object = await SITES.get(`draft/${DEFAULT_TENANT}/${slug}/assets/mark.svg`)
    expect(object).not.toBeNull()
    expect(object!.httpMetadata?.contentType).toBe('image/svg+xml')
    expect((await SITES.get(`draft/${DEFAULT_TENANT}/${slug}/assets/photo.png`))!.httpMetadata
      ?.contentType).toBe('image/png')

    // An unknown name is null, and so is one that tries to leave the assets
    // namespace — the same answer the filesystem adapter gives.
    expect(await store.readAsset(slug, 'absent.svg')).toBeNull()
    expect(await store.readAsset(slug, '../site.json')).toBeNull()

    await store.write(slug, { removeAssets: ['mark.svg'] })
    expect(await store.listAssets(slug)).toEqual(['photo.png'])
    expect(await store.readAsset(slug, 'mark.svg')).toBeNull()
  })

  // ── AC-6 (half): a real site imported into D1 assembles identically ───────

  it('UAT_FC_REQ-143 a real site imported into D1 assembles identically to the source store', async () => {
    // The actual definitions from `storage/sites/`, inlined by Vite at build
    // time — workerd has no filesystem, so this is how the real bytes reach it.
    // Nothing is hand-written: these are the sites the operator builds with.
    const modules = import.meta.glob('../storage/sites/*/draft/**/*.json', {
      eager: true,
      import: 'default',
    }) as Record<string, Record<string, unknown>>

    const bySlug = new Map<string, { siteJson?: Record<string, unknown>; pages: Record<string, Record<string, unknown>> }>()
    for (const [file, value] of Object.entries(modules)) {
      const match = /storage\/sites\/([^/]+)\/draft\/(.+)$/.exec(file)
      if (!match) continue
      const [, slug, rest] = match
      const entry = bySlug.get(slug) ?? { pages: {} }
      if (rest === 'site.json') entry.siteJson = value
      else if (rest.startsWith('pages/')) entry.pages[rest.slice('pages/'.length)] = value
      bySlug.set(slug, entry)
    }
    expect(bySlug.size).toBeGreaterThan(0)

    const store = await tenantStore(DEFAULT_TENANT)
    for (const [slug, parts] of bySlug) {
      if (!parts.siteJson) continue
      const importSlug = `import-${slug}`

      // The source: the same definitions, held by an adapter with nothing behind
      // it. It stands in for `storage/sites/` because the bytes ARE the ones
      // from `storage/sites/` — what differs is only which store holds them.
      const source = memorySiteStore()
      source.seed(importSlug, { siteJson: parts.siteJson, pages: parts.pages })

      await store.createDraft(importSlug)
      const summary = await importSite(source, store, importSlug)
      expect(summary.siteJson).toBe(true)
      expect(summary.pages.sort()).toEqual(Object.keys(parts.pages).sort())

      const fromSource = await source.loadDraft(importSlug)
      const fromD1 = await store.loadDraft(importSlug)
      expect(fromD1).not.toBeNull()
      expect(fromD1!.result.ok, `${slug} assembled from D1`).toBe(true)

      // The whole assembled, validated, palette-resolved definition — which is
      // the ONLY input `renderSiteFiles` reads. Equal here means the two stores
      // cannot render differently; the node suite proves that second half, since
      // the render needs Astro's container API and workerd has no transform for
      // it (DOC-12 §7 / REQ-145).
      const strip = (r: unknown): unknown => {
        const value = (r as { ok: true; value: Record<string, unknown> }).value
        // `sourceDir` is descriptive and names its own store by design — it is
        // documented as read by nothing at request time.
        const { sourceDir: _drop, ...rest } = value
        return rest
      }
      expect(strip(fromD1!.result)).toEqual(strip(fromSource!.result))

      await store.forget(importSlug)
    }
  })

  it('UAT_FC_REQ-143 an import lands whole or not at all', async () => {
    const seed = siteSeed({ pages: { 'home.json': { id: 'home', slug: 'home', title: 'H', modules: [] } } })
    const source = memorySiteStore()
    source.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages })

    const store = await tenantStore(DEFAULT_TENANT)
    // A destination that does not hold the site is refused rather than created:
    // creating one is an adapter's own admin verb, and an import that invented
    // sites would be able to resurrect a deliberately deleted one.
    await expect(importSite(source, store, seed.slug)).rejects.toThrow(/does not exist/)

    await store.createDraft(seed.slug)
    await importSite(source, store, seed.slug)
    expect((await store.readPages(seed.slug)).map((p) => p.name)).toEqual(['home.json'])
    await store.forget(seed.slug)
  })

  // ── The edit surface itself, through D1 ───────────────────────────────────

  it('UAT_FC_REQ-143 the structured-edit surface drives D1 with no filesystem anywhere', async () => {
    const f = await makeD1Site(seedWithPalette())
    open.push(f)

    // The point is not that these commands work — the contract already asserts
    // that. It is that they work HERE, inside workerd, which is the runtime
    // DOC-12 §7 phase 2 exists to reach. Before REQ-143 this file could not even
    // be loaded: `edit.ts` imported the framework barrel and dragged two `.astro`
    // components into a runtime with no transform for them.
    await editCopySet(f.slug, 'home', '0.0', { text: 'Edited in a Worker' }, f.opts)
    await editPageAdd(f.slug, 'about', { ...f.opts, title: 'About', path: 'about' })

    expect((await f.store.readPages(f.slug)).map((p) => p.name)).toEqual([
      'about.json',
      'home.json',
    ])
    expect(await f.store.counter(f.slug)).toBe(2)
    expect(navigator.userAgent).toBe('Cloudflare-Workers')
  })
})
