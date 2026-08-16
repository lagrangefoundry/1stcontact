import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
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
} from '../tools/generate/src/cli/edit'
import { CommandError } from '../tools/generate/src/cli/errors'
import { PreviewRenderer } from '../tools/generate/src/cli/preview'
import {
  makeFsSite,
  makeMemorySite,
  recordingStore,
  SITE_BACKENDS,
  type SiteFixture,
} from './support/site-factory'

/**
 * REQ-142 — the structured-edit surface reaches storage through a port.
 *
 * THE CLAIM THIS FILE MAKES, and the reason it is shaped this way: the same
 * assertions run against the filesystem adapter and against an adapter with no
 * filesystem at all. A command that still reached for a file would pass on the
 * left and fail on the right, which is what makes "no caller depends on the
 * filesystem" a checked property rather than a reading of the diff.
 *
 * The whole existing suite is the OTHER half of the correctness claim — this
 * ticket changed no assertion in it. This file only covers what that suite
 * cannot see: that the seam exists, that it is total, and that a multi-file
 * change crosses it as one call.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const EDIT_TS = path.join(HERE, '..', 'tools', 'generate', 'src', 'cli', 'edit.ts')

/** A minimal L1 page with a palette reference, for the rename and colour cases. */
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

describe('REQ-142 — the SiteStore port', () => {
  const open: SiteFixture[] = []
  const fixture = (make: (o?: never) => SiteFixture, options?: unknown): SiteFixture => {
    const f = (make as (o?: unknown) => SiteFixture)(options)
    open.push(f)
    return f
  }

  afterEach(() => {
    for (const f of open.splice(0)) f.dispose()
  })

  // ── AC-2: the seam is real, not described ─────────────────────────────────

  it('UAT_FC_REQ-142 edit.ts imports no filesystem module', () => {
    const source = readFileSync(EDIT_TS, 'utf8')
    // The claim is about IMPORTS, because a transitive one is just as fatal: a
    // module that pulls `node:fs` cannot be bundled for a Worker however little
    // of it it uses.
    expect(source).not.toMatch(/from 'node:fs'/)
    expect(source).not.toMatch(/from 'node:path'/)
    expect(source).not.toMatch(/from '\.\.\/store'/)
  })

  it('UAT_FC_REQ-142 the port and its model reach no filesystem', () => {
    const dir = path.join(HERE, '..', 'tools', 'generate', 'src', 'store')
    for (const name of ['site-store.ts', 'assemble.ts', 'journal-model.ts', 'memory-store.ts']) {
      const source = readFileSync(path.join(dir, name), 'utf8')
      expect(source, name).not.toMatch(/from 'node:/)
      expect(source, name).not.toMatch(/from '\.\/fsutil'/)
    }
  })

  // ── AC-4 / AC-7: one body of assertions, both adapters ────────────────────

  describe.each(SITE_BACKENDS)('over the $name store', ({ make }) => {
    it('UAT_FC_REQ-142 reads a site through the port', async () => {
      const { slug, opts } = fixture(make)

      expect(((await editPageList(slug, opts)).data as { pages: unknown[] }).pages).toHaveLength(1)
      expect(
        ((await editPageGet(slug, 'home', opts)).data as { page: { title: string } }).page.title,
      ).toBe('Home')
      expect(
        ((await editConfigGet(slug, 'config.businessName', opts)).data as { value: string }).value,
      ).toBe(slug)
    })

    it('UAT_FC_REQ-142 a write lands and is readable back', async () => {
      const { slug, opts } = fixture(make)

      await editPageAdd(slug, 'about', { ...opts, title: 'About us', path: 'about' })
      const pages = ((await editPageList(slug, opts)).data as { pages: { id: string }[] }).pages
      expect(pages.map((p) => p.id).sort()).toEqual(['about', 'home'])

      await editPageRm(slug, 'about', opts)
      expect(((await editPageList(slug, opts)).data as { pages: unknown[] }).pages).toHaveLength(1)
    })

    it('UAT_FC_REQ-142 every write advances the change count and a refusal does not', async () => {
      const { slug, opts } = fixture(make)

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

    it('UAT_FC_REQ-142 the copy surface reads and writes one segment', async () => {
      const { slug, opts } = fixture(make, seedWithPalette())

      const got = await editCopyGet(slug, 'home', '0.0', opts)
      expect((got.data as { kind: string }).kind).toBe('text')

      const set = await editCopySet(slug, 'home', '0.0', { text: 'Hello again' }, opts)
      expect((set.data as { changed: string[] }).changed).toEqual(['text'])

      const node = (await editL1Get(slug, 'home', '0.0', opts)).data as { node: { text: string } }
      expect(node.node.text).toBe('Hello again')
    })

    it('UAT_FC_REQ-142 an L1 subtree round-trips verbatim', async () => {
      const { slug, opts } = fixture(make, seedWithPalette())
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

    it('UAT_FC_REQ-142 the palette surface enforces its rules through the port', async () => {
      const { slug, opts } = fixture(make, seedWithPalette())

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

    it('UAT_FC_REQ-142 a rename rewrites site.json and every page referencing it', async () => {
      const { slug, opts } = fixture(make, seedWithPalette())

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

    it('UAT_FC_REQ-142 assets move as bytes, never as paths', async () => {
      const { slug, opts } = fixture(make)
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#0d9488"/></svg>'

      await editAssetWrite(slug, 'wordmark', svg, opts)
      const listed = (await editAssetList(slug, opts)).data as { assets: { id: string }[] }
      expect(listed.assets.map((a) => a.id)).toContain('wordmark.svg')

      // The bytes come back from the store, and they are the bytes written.
      const bytes = await opts.store.readAsset(slug, 'wordmark.svg')
      expect(bytes).not.toBeNull()
      expect(new TextDecoder().decode(bytes!)).toBe(svg)

      // Registered by the same call that stored the bytes.
      expect((await listSiteAssets(slug, opts)).find((a) => a.id === 'wordmark.svg')).toMatchObject(
        { registered: true, onDisk: true, kind: 'image' },
      )

      await editAssetRm(slug, 'wordmark.svg', opts)
      expect(await opts.store.readAsset(slug, 'wordmark.svg')).toBeNull()
    })

    it('UAT_FC_REQ-142 an asset the operator supplies is taken as bytes', async () => {
      const { slug, opts } = fixture(make)
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

    it('UAT_FC_REQ-142 a failure is a CommandError with its envelope intact', async () => {
      const { slug, opts } = fixture(make)

      // The envelope is the contract the modal renders as a 400 and the CLI maps
      // to an exit code, so it has to survive the port unchanged (AC-3).
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

    it('UAT_FC_REQ-142 the draft renders from whatever store served it', async () => {
      const { slug, opts } = fixture(make)
      const rendered = await new PreviewRenderer(opts.store).file(slug, 'draft', '/')
      expect(rendered?.kind).toBe('text')
      expect((rendered as { body: string }).body).toContain('<html')
    })

    it('UAT_FC_REQ-142 a preview asset comes back as bytes', async () => {
      const { slug, opts } = fixture(make)
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"></svg>'
      await editAssetWrite(slug, 'mark', svg, opts)

      const file = await new PreviewRenderer(opts.store).file(slug, 'draft', '/assets/mark.svg')
      expect(file).toMatchObject({ kind: 'bytes', contentType: 'image/svg+xml' })
      expect(new TextDecoder().decode((file as { body: Uint8Array }).body)).toBe(svg)
      // A traversal out of the assets root resolves to nothing on either adapter.
      expect(await new PreviewRenderer(opts.store).file(slug, 'draft', '/assets/../site.json')).toBe(
        null,
      )
    })
  })

  // ── AC-5: a multi-file change is ONE call ─────────────────────────────────

  it('UAT_FC_REQ-142 a palette rename crosses the port as a single write', async () => {
    const inner = makeMemorySite(seedWithPalette())
    open.push(inner)
    const { store, writes } = recordingStore(inner.store)
    const opts = { ...inner.opts, store }

    await editPaletteRename(inner.slug, 'brand-teal', 'brand-green', opts)

    // One call carrying BOTH halves. Two calls would leave a window in which
    // `site.json` had moved the key and the page still referenced the old one —
    // every reference orphaned, which is a validation failure and not a
    // fallback. Expressing it as one write is what lets the D1 adapter close
    // that window later without any caller here changing.
    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatchObject({
      slug: inner.slug,
      siteJson: true,
      pages: ['home.json'],
    })
  })

  it('UAT_FC_REQ-142 removing a page rewrites the nav in the same write', async () => {
    const inner = makeMemorySite({
      pages: { 'home.json': pageWithPaletteRef() },
      patchSiteJson: {
        palette: { 'brand-teal': { value: '#0d9488' } },
        nav: {
          pattern: 'top-tabs',
          entries: [{ label: 'About', target: { kind: 'page', pageId: 'about' } }],
        },
      },
    })
    open.push(inner)
    await editPageAdd(inner.slug, 'about', { ...inner.opts, title: 'About', path: 'about' })

    const { store, writes } = recordingStore(inner.store)
    await editPageRm(inner.slug, 'about', { ...inner.opts, store, force: true })

    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatchObject({ siteJson: true, removePages: ['about.json'] })
  })

  it('UAT_FC_REQ-142 a page write touches only the page it changed', async () => {
    const inner = makeMemorySite(seedWithPalette())
    open.push(inner)
    const { store, writes } = recordingStore(inner.store)

    await editCopySet(inner.slug, 'home', '0.0', { text: 'Changed' }, { ...inner.opts, store })

    // No `site.json` in the write: a copy edit changes a page and nothing else,
    // and a store asked to rewrite the document would churn it on every
    // keystroke-settle.
    expect(writes).toEqual([
      { slug: inner.slug, siteJson: false, pages: ['home.json'], removePages: [], assets: [], removeAssets: [] },
    ])
  })

  // ── AC-7: the two backends are interchangeable ────────────────────────────

  it('UAT_FC_REQ-142 both adapters answer identically for the same seed', async () => {
    const fs = makeFsSite({ slug: 'twin', ...seedWithPalette() })
    const mem = makeMemorySite({ slug: 'twin', ...seedWithPalette() })
    open.push(fs, mem)

    const ask = async (f: SiteFixture): Promise<unknown> => {
      await editPaletteRename(f.slug, 'brand-teal', 'brand-green', f.opts)
      await editPageAdd(f.slug, 'about', { ...f.opts, title: 'About', path: 'about' })
      return {
        pages: (await editPageList(f.slug, f.opts)).data,
        palette: (await editPaletteGet(f.slug, f.opts)).data,
        l1: (await editL1Get(f.slug, 'home', '0.0', f.opts)).data,
        count: await f.store.counter(f.slug),
      }
    }

    expect(await ask(mem)).toEqual(await ask(fs))
  })

  it('UAT_FC_REQ-142 the memory fixture holds no filesystem handle at all', () => {
    const mem = makeMemorySite()
    open.push(mem)
    // `cwd: null` is the fixture saying so out loud: a test that reaches for a
    // directory here has written something that cannot run on both backends.
    expect(mem.cwd).toBeNull()
    expect(mem.opts.cwd).toBeUndefined()
  })
})
