import { describe, expect, it } from 'vitest'
import {
  editAssetAdd,
  editAssetList,
  editAssetRm,
  editAssetWrite,
  editConfigGet,
  editConfigSet,
  editCopyGet,
  editCopySet,
  editL1Get,
  editL1Set,
  editPageAdd,
  editPageGet,
  editPageList,
  editPageRm,
  editPaletteAdd,
  editPaletteGet,
  editPaletteRename,
  editPaletteRm,
  editPaletteSet,
  editStatus,
  listSiteAssets,
} from '../../tools/generate/src/cli/edit'
import { CommandError } from '../../tools/generate/src/cli/errors'
import type { SiteFixture, SiteSeedOptions } from './site-factory'

/**
 * THE PORT'S CONTRACT — one body of assertions, run against every adapter.
 *
 * WHY THIS IS A MODULE AND NOT A TEST FILE. REQ-142 established that the same
 * assertions must pass over the filesystem and in-memory adapters; REQ-143 adds
 * a third (D1 + R2) which can only run inside workerd, in a different Vitest
 * project, with a different pool. "One port, one contract, three adapters" is
 * therefore not something a single `describe.each` can express — the adapters do
 * not share a runtime. What they can share is this: the assertions themselves,
 * imported by both projects' suites and registered against whatever fixture each
 * can build.
 *
 * That is a stronger claim than the two files agreeing, because there is nothing
 * to keep in step. A verb added to the port is asserted once here and every
 * adapter is held to it; an adapter that answers differently fails in its own
 * project with the same assertion text.
 *
 * WHAT IS NOT HERE, AND WHY. The two preview cases (`PreviewRenderer` renders
 * the draft; a preview asset comes back as bytes) live in the node suite alone.
 * Not because of D1 — the store serves them fine — but because rendering runs
 * through Astro's container API, which workerd has no transform for. Relocating
 * the render is DOC-12 §7's next step and REQ-145's scope; asserting it here
 * would mean asserting it nowhere, since the file would fail to load.
 */

/** What a suite hands this module: a name, and a way to make a site. */
export interface ContractBackend {
  name: string
  /**
   * Build a fixture for one site. Async because two of the three adapters have
   * to await something to make a site exist, and a contract that only fitted
   * the synchronous ones would be a contract shaped around the filesystem.
   */
  make(options?: SiteSeedOptions): Promise<SiteFixture>
}

/** A minimal L1 page with a palette reference, for the rename and colour cases. */
export function pageWithPaletteRef(): Record<string, unknown> {
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

/** The seed the palette cases need: one entry, referenced once. */
export function seedWithPalette(): SiteSeedOptions {
  return {
    patchSiteJson: { palette: { 'brand-teal': { value: '#0d9488' } } },
    pages: { 'home.json': pageWithPaletteRef() },
  }
}

/**
 * Register the port's contract against one adapter.
 *
 * Call inside a `describe`. `track` is how the calling suite disposes fixtures —
 * each project owns its own `afterEach`, because what disposal *means* differs
 * (a temp directory to remove, a Map entry to drop, rows and objects to delete).
 */
export function describeSiteStoreContract(
  backend: ContractBackend,
  track: (fixture: SiteFixture) => void,
): void {
  const fixture = async (options?: SiteSeedOptions): Promise<SiteFixture> => {
    const f = await backend.make(options)
    track(f)
    return f
  }

  describe(`over the ${backend.name} store`, () => {
    it('UAT_FC_REQ-143 reads a site through the port', async () => {
      const { slug, opts } = await fixture()

      expect(((await editPageList(slug, opts)).data as { pages: unknown[] }).pages).toHaveLength(1)
      expect(
        ((await editPageGet(slug, 'home', opts)).data as { page: { title: string } }).page.title,
      ).toBe('Home')
      expect(
        ((await editConfigGet(slug, 'config.businessName', opts)).data as { value: string }).value,
      ).toBe(slug)
    })

    it('UAT_FC_REQ-143 a write lands and is readable back', async () => {
      const { slug, opts } = await fixture()

      await editPageAdd(slug, 'about', { ...opts, title: 'About us', path: 'about' })
      const pages = ((await editPageList(slug, opts)).data as { pages: { id: string }[] }).pages
      expect(pages.map((p) => p.id).sort()).toEqual(['about', 'home'])

      await editPageRm(slug, 'about', opts)
      expect(((await editPageList(slug, opts)).data as { pages: unknown[] }).pages).toHaveLength(1)
    })

    it('UAT_FC_REQ-143 every write advances the change count and a refusal does not', async () => {
      const { slug, opts } = await fixture()

      const first = await editConfigSet(slug, 'config', { businessName: 'Renamed' }, opts)
      expect(first.at).toBe(1)
      const second = await editPageAdd(slug, 'about', { ...opts, title: 'About', path: 'about' })
      expect(second.at).toBe(2)

      // A refused write appends nothing — the counter is what a caller's
      // staleness check rests on, so a refusal that moved it would be worse than
      // the refusal itself.
      await expect(
        editPageAdd(slug, 'about', { ...opts, title: 'Again', path: 'about-2' }),
      ).rejects.toThrow(CommandError)
      expect((await editStatus(slug, opts)).data).toBeTruthy()
      expect(await opts.store.counter(slug)).toBe(2)
    })

    it('UAT_FC_REQ-143 the change journal reports what happened since a counter', async () => {
      const { slug, opts } = await fixture()

      await editConfigSet(slug, 'config', { businessName: 'One' }, opts)
      await editConfigSet(slug, 'config', { businessName: 'Two' }, opts)

      const all = await opts.store.changesSince(slug)
      expect(all).toMatchObject({ since: 0, now: 2, truncated: false })
      expect(all.changes.map((c) => c.at)).toEqual([1, 2])

      // Asked from where it already was: the cheap "nothing happened" answer,
      // an empty list rather than an error.
      expect(await opts.store.changesSince(slug, 2)).toMatchObject({
        since: 2,
        now: 2,
        truncated: false,
        changes: [],
      })
      expect((await opts.store.changesSince(slug, 1)).changes.map((c) => c.at)).toEqual([2])
    })

    it('UAT_FC_REQ-143 the site version moves on every write', async () => {
      const { slug, opts } = await fixture()

      const before = await opts.store.version(slug)
      expect(before).not.toBeNull()
      await editConfigSet(slug, 'config', { businessName: 'Moved' }, opts)
      expect(await opts.store.version(slug)).not.toBe(before)

      // A site the store does not hold has no version — the same `null` every
      // adapter answers `hasDraft` false with.
      expect(await opts.store.version('no-such-site')).toBeNull()
    })

    it('UAT_FC_REQ-143 the copy surface reads and writes one segment', async () => {
      const { slug, opts } = await fixture(seedWithPalette())

      const got = await editCopyGet(slug, 'home', '0.0', opts)
      expect((got.data as { kind: string }).kind).toBe('text')

      const set = await editCopySet(slug, 'home', '0.0', { text: 'Hello again' }, opts)
      expect((set.data as { changed: string[] }).changed).toEqual(['text'])

      const node = (await editL1Get(slug, 'home', '0.0', opts)).data as { node: { text: string } }
      expect(node.node.text).toBe('Hello again')
    })

    it('UAT_FC_REQ-143 an L1 subtree round-trips verbatim', async () => {
      const { slug, opts } = await fixture(seedWithPalette())
      const replacement = {
        kind: 'text',
        id: 'headline',
        text: 'Replaced',
        axes: { color: { ref: 'brand-teal' }, fontSizePx: 40 },
      }

      await editL1Set(slug, 'home', '0.0', replacement, opts)
      // Verbatim: the palette REFERENCE survives, unresolved. A store that
      // resolved on the way in or out would silently convert every site's
      // authoring overlay into literals.
      expect((await editL1Get(slug, 'home', '0.0', opts)).data).toMatchObject({
        node: replacement,
      })
    })

    it('UAT_FC_REQ-143 the palette surface enforces its rules through the port', async () => {
      const { slug, opts } = await fixture(seedWithPalette())

      const listed = (await editPaletteGet(slug, opts)).data as {
        entries: { name: string; count: number }[]
      }
      expect(listed.entries).toEqual([{ name: 'brand-teal', value: '#0d9488', count: 1 }])

      await editPaletteAdd(slug, 'accent', '#ff8800', opts)
      await editPaletteSet(slug, 'accent', '#ff0088', opts)

      // Deleting an entry in use is refused, and the refusal is evaluated
      // against what the store holds NOW rather than a count a caller sent.
      await expect(editPaletteRm(slug, 'brand-teal', opts)).rejects.toMatchObject({
        code: 'CONFLICT',
      })
      // An unreferenced one goes.
      await editPaletteRm(slug, 'accent', opts)
      expect(
        ((await editPaletteGet(slug, opts)).data as { entries: { name: string }[] }).entries.map(
          (e) => e.name,
        ),
      ).toEqual(['brand-teal'])
    })

    it('UAT_FC_REQ-143 a rename rewrites site.json and every page referencing it', async () => {
      const { slug, opts } = await fixture(seedWithPalette())

      const out = await editPaletteRename(slug, 'brand-teal', 'brand-green', opts)
      expect((out.data as { count: number }).count).toBe(1)

      const page = (await editL1Get(slug, 'home', '0.0', opts)).data as {
        node: { axes: { color: { ref: string } } }
      }
      expect(page.node.axes.color.ref).toBe('brand-green')
      const base = (await editConfigGet(slug, 'palette', opts)).data as {
        value: Record<string, unknown>
      }
      expect(Object.keys(base.value)).toEqual(['brand-green'])
    })

    it('UAT_FC_REQ-143 assets move as bytes, never as paths', async () => {
      const { slug, opts } = await fixture()
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#0d9488"/></svg>'

      await editAssetWrite(slug, 'wordmark', svg, opts)
      const listed = (await editAssetList(slug, opts)).data as { assets: { id: string }[] }
      expect(listed.assets.map((a) => a.id)).toContain('wordmark.svg')

      // The bytes come back from the store, and they are the bytes written.
      const bytes = await opts.store.readAsset(slug, 'wordmark.svg')
      expect(bytes).not.toBeNull()
      expect(new TextDecoder().decode(bytes!)).toBe(svg)

      // Registered by the same call that stored the bytes.
      expect((await listSiteAssets(slug, opts)).find((a) => a.id === 'wordmark.svg')).toMatchObject({
        registered: true,
        onDisk: true,
        kind: 'image',
      })

      await editAssetRm(slug, 'wordmark.svg', opts)
      expect(await opts.store.readAsset(slug, 'wordmark.svg')).toBeNull()
    })

    it('UAT_FC_REQ-143 an asset the operator supplies is taken as bytes', async () => {
      const { slug, opts } = await fixture()
      const bytes = new TextEncoder().encode(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"></svg>',
      )

      await editAssetAdd(slug, 'logo.svg', bytes, opts)
      expect(await opts.store.readAsset(slug, 'logo.svg')).toEqual(bytes)
      // Refused on a second add of the same name, through the store's listing.
      await expect(editAssetAdd(slug, 'logo.svg', bytes, opts)).rejects.toMatchObject({
        code: 'CONFLICT',
      })
    })

    it('UAT_FC_REQ-143 a failure is a CommandError with its envelope intact', async () => {
      const { slug, opts } = await fixture()

      // The envelope is the contract the modal renders as a 400 and the CLI maps
      // to an exit code, so it has to survive the port unchanged.
      await expect(editPageGet(slug, 'nope', opts)).rejects.toMatchObject({
        name: 'CommandError',
        code: 'NOT_FOUND',
        path: 'nope',
        hint: `List pages with '1c page list ${slug}'.`,
      })
      await expect(editPageGet('no-such-site', 'home', opts)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: `Site 'no-such-site' has no draft.`,
      })
    })

    it('UAT_FC_REQ-143 the draft assembles and validates from whatever store served it', async () => {
      const { slug, opts } = await fixture(seedWithPalette())

      const snapshot = await opts.store.loadDraft(slug)
      expect(snapshot).not.toBeNull()
      expect(snapshot!.result.ok).toBe(true)
      const loaded = (snapshot!.result as { ok: true; value: { site: { pages: unknown[] } } }).value
      expect(loaded.site.pages).toHaveLength(1)
      // The stamp is opaque, but it must MOVE when the definition does — it is
      // what keys the render cache, so one that stood still would serve a stale
      // page after an edit made outside the builder.
      await editCopySet(slug, 'home', '0.0', { text: 'Moved' }, opts)
      expect((await opts.store.loadDraft(slug))!.stamp).not.toBe(snapshot!.stamp)

      // A site the store does not hold is null, not an empty draft.
      expect(await opts.store.loadDraft('no-such-site')).toBeNull()
    })
  })
}
