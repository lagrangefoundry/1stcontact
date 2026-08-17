import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  editAssetWrite,
  editCopySet,
  editL1Get,
  editPageAdd,
  editPageList,
  editPageRm,
  editPaletteGet,
  editPaletteRename,
} from '../tools/generate/src/cli/edit'
import { PreviewRenderer } from '../tools/generate/src/cli/preview'
import {
  makeFsSite,
  makeMemorySite,
  recordingStore,
  type SiteFixture,
  type SiteSeedOptions,
} from './support/site-factory'
import {
  describeSiteStoreContract,
  pageWithPaletteRef,
  seedWithPalette,
} from './support/site-store-contract'

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

describe('REQ-142 — the SiteStore port', () => {
  const open: SiteFixture[] = []
  const fixture = (make: (o?: never) => SiteFixture, options?: unknown): SiteFixture => {
    const f = (make as (o?: unknown) => SiteFixture)(options)
    open.push(f)
    return f
  }

  afterEach(async () => {
    for (const f of open.splice(0)) await f.dispose()
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
    // REQ-143 added three more to the worker-safe half; each is listed because
    // the property is per-file and a new module is exactly where it lapses.
    for (const name of [
      'site-store.ts',
      'assemble.ts',
      'journal-model.ts',
      'memory-store.ts',
      'content-type.ts',
      'import-site.ts',
      'd1r2-store.ts',
    ]) {
      const source = readFileSync(path.join(dir, name), 'utf8')
      expect(source, name).not.toMatch(/from 'node:/)
      expect(source, name).not.toMatch(/from '\.\/fsutil'/)
    }
  })

  // ── AC-4 / AC-7: one body of assertions, every adapter ────────────────────
  //
  // The assertions themselves moved to `support/site-store-contract.ts` when
  // REQ-143 added a third adapter that can only run inside workerd, in a
  // different Vitest project. They are unchanged; what changed is that this file
  // no longer owns them, so the D1/R2 suite is held to the same text rather than
  // to a copy of it that has to be kept in step.
  for (const backend of [
    { name: 'filesystem', make: async (o?: SiteSeedOptions) => makeFsSite(o) },
    { name: 'memory', make: async (o?: SiteSeedOptions) => makeMemorySite(o) },
  ]) {
    describeSiteStoreContract(backend, (f) => open.push(f))
  }

  // The two cases the contract deliberately leaves here: they render, and the
  // render runs through Astro's container API, which workerd has no transform
  // for. Relocating it is DOC-12 §7's next step (REQ-145), not this one's.
  describe.each([
    { name: 'filesystem', make: makeFsSite },
    { name: 'memory', make: makeMemorySite },
  ])('rendering over the $name store', ({ make }) => {
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
