import http from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable, Writable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { contactForm as ContactForm } from '../packages/framework/src/modules/contact-form/component'
import type { BehaviorProps } from '../packages/framework/src/modules/behavior'
import { contactFormPreset } from '../packages/framework/src/l2/contact-form'
import { ctxOf, handleBuilderRequest, PreviewRenderer, run } from '../tools/generate/src/cli'
import { cmdNew } from '../tools/generate/src/cli/commands'
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
} from '../tools/generate/src/cli/edit'
import { CommandError } from '../tools/generate/src/cli/errors'
import { listFilesRel } from '../tools/generate/src/store'
import {
  makeFsSite,
  makeMemorySite,
  recordingStore,
  SITE_BACKENDS,
  type SiteFixture,
} from './support/site-factory'

/**
 * Reconciliation UATs for story-3f4a5f2b — "Site Storage Port: One Async Store
 * Behind Every Edit, Provable In The Workers Runtime" (AC-1321 … AC-1329).
 *
 * AC-1328 is the one criterion that cannot be proved here: its claim is that a
 * `*.workers.test.ts` file runs inside workerd against real D1/R2 bindings, and
 * a file asserting that has to BE one. It lives in the sibling
 * `reconciliation-site-storage-port.workers.test.ts`; this file carries the
 * other eight.
 *
 * This file imports `node:fs` at module scope, so it could only ever have
 * loaded in the runtime that has a filesystem — which is itself the routing
 * convention AC-1329 asserts.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const readRepo = (name: string): string => readFileSync(path.join(REPO, name), 'utf8')

const WORKERS_GLOB = 'tests/**/*.workers.test.ts'
const WORKERS_MARKER = '.workers.test.ts'

/** A minimal L1 page carrying a palette reference — the rename and copy target. */
function pageWithPaletteRef(text = 'Hello'): Record<string, unknown> {
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
            text,
            axes: { color: { ref: 'brand-teal' }, fontSizePx: 32 },
          },
        ],
      },
    },
  }
}

/** The seed the palette criteria need: one entry, referenced exactly once. */
function seedWithPalette(text?: string) {
  return {
    patchSiteJson: { palette: { 'brand-teal': { value: '#0d9488' } } },
    pages: { 'home.json': pageWithPaletteRef(text) },
  }
}

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s)
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"></svg>'

describe('story-3f4a5f2b — the SiteStore port', () => {
  const open: SiteFixture[] = []
  const track = (f: SiteFixture): SiteFixture => {
    open.push(f)
    return f
  }
  const temps: string[] = []
  const tempDir = (prefix: string): string => {
    const dir = mkdtempSync(path.join(tmpdir(), prefix))
    temps.push(dir)
    return dir
  }

  afterEach(() => {
    for (const f of open.splice(0)) f.dispose()
    for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  // ── AC-1321 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld', async () => {
    for (const { name, make } of SITE_BACKENDS) {
      const { slug, store, cwd } = track(
        make({ slug: 'totality', assets: { 'logo.svg': utf8(SVG) } }),
      )

      // EVERY answer is a promise, including the ones a filesystem could give
      // immediately — a caller must not be able to learn which adapter it got by
      // finding one of them already resolved.
      const asked = [
        store.hasDraft(slug),
        store.readSiteJson(slug),
        store.readPages(slug),
        store.listAssets(slug),
        store.readAsset(slug, 'logo.svg'),
        store.counter(slug),
        store.loadDraft(slug),
      ]
      for (const answer of asked) expect(answer, name).toBeInstanceOf(Promise)

      // …for a site the store holds.
      expect(await store.hasDraft(slug), name).toBe(true)

      const definition = await store.readSiteJson(slug)
      expect(definition, name).toBeTypeOf('object')
      expect(definition, name).not.toBeNull()
      expect((definition as { config: { businessName: string } }).config.businessName, name).toBe(
        slug,
      )

      const pages = await store.readPages(slug)
      expect(pages.map((p) => p.name), name).toEqual(['home.json'])
      expect(pages[0].page.id, name).toBe('home')

      expect(await store.listAssets(slug), name).toEqual(['logo.svg'])
      expect(new TextDecoder().decode((await store.readAsset(slug, 'logo.svg'))!), name).toBe(SVG)
      expect(await store.counter(slug), name).toBe(0)

      const draft = await store.loadDraft(slug)
      expect(draft, name).not.toBeNull()
      expect(draft!.result.ok, name).toBe(true)
      // The stamp is equal iff the definition is unchanged…
      expect((await store.loadDraft(slug))!.stamp, name).toBe(draft!.stamp)
      // …and moves when it changes, which is what lets a cached render be
      // invalidated by an edit made outside the process that cached it.
      await store.write(slug, { pages: [{ name: 'extra.json', page: pages[0].page }] })
      expect((await store.loadDraft(slug))!.stamp, name).not.toBe(draft!.stamp)

      // …and for a slug the store has never been given: empty, never raising,
      // and in particular no definition for a site that was never written.
      const ghost = 'never-given'
      expect(await store.hasDraft(ghost), name).toBe(false)
      expect(await store.readSiteJson(ghost), name).toBeNull()
      expect(await store.readPages(ghost), name).toEqual([])
      expect(await store.listAssets(ghost), name).toEqual([])
      expect(await store.readAsset(ghost, 'logo.svg'), name).toBeNull()
      expect(await store.counter(ghost), name).toBe(0)
      expect(await store.loadDraft(ghost), name).toBeNull()

      // A directory that exists but holds no definition is not a site with a
      // draft. Only askable of the adapter that has directories at all.
      if (cwd !== null) {
        mkdirSync(path.join(cwd, 'storage', 'sites', 'empty-dir'), { recursive: true })
        expect(await store.hasDraft('empty-dir'), name).toBe(false)
        expect(await store.readSiteJson('empty-dir'), name).toBeNull()
      }
    }
  })

  // ── AC-1322 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations', async () => {
    for (const { name, make } of SITE_BACKENDS) {
      // Load order is the sort order of the keys, so seed them out of order.
      const { slug, store, opts } = track(
        make({
          pages: {
            'zebra.json': { ...pageWithPaletteRef(), id: 'zebra', slug: 'zebra', title: 'Zebra' },
            'home.json': pageWithPaletteRef(),
            'alpha.json': { ...pageWithPaletteRef(), id: 'alpha', slug: 'alpha', title: 'Alpha' },
          },
          patchSiteJson: { palette: { 'brand-teal': { value: '#0d9488' } } },
        }),
      )

      // A page is identified by a KEY: no directory component, and load order is
      // the sort order of those keys.
      const pages = await store.readPages(slug)
      for (const page of pages) {
        expect(page.name, name).not.toContain('/')
        expect(page.name, name).not.toContain(path.sep)
      }
      const names = pages.map((p) => p.name)
      expect(names, name).toEqual(['alpha.json', 'home.json', 'zebra.json'])
      expect(names, name).toEqual([...names].sort())

      // An asset the operator already has crosses as bytes plus the name to
      // store it under — including on the adapter with no filesystem, which it
      // could not do if a path were being handed across.
      const bytes = utf8(SVG)
      await editAssetAdd(slug, 'logo.svg', bytes, opts)

      const readBack = await store.readAsset(slug, 'logo.svg')
      expect(readBack, name).toBeInstanceOf(Uint8Array)
      expect(readBack, name).toEqual(bytes)

      // Every asset-shaped answer is bytes or a bare key — never a location.
      const listed = await store.listAssets(slug)
      expect(listed, name).toEqual(['logo.svg'])
      for (const asset of listed) {
        expect(asset, name).not.toContain('/')
        expect(path.isAbsolute(asset), name).toBe(false)
      }

      // The surface's own asset listing names the asset, not a file.
      const surfaced = (await editAssetList(slug, opts)).data as { assets: { id: string }[] }
      for (const asset of surfaced.assets) {
        expect(asset.id, name).not.toContain(path.sep)
        expect(path.isAbsolute(asset.id), name).toBe(false)
      }

      // Writing generated bytes and removing them is the same currency.
      await editAssetWrite(slug, 'wordmark', SVG, opts)
      expect(await store.readAsset(slug, 'wordmark.svg'), name).toBeInstanceOf(Uint8Array)
      await editAssetRm(slug, 'wordmark.svg', opts)
      expect(await store.readAsset(slug, 'wordmark.svg'), name).toBeNull()
    }
  })

  // ── AC-1323 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change', async () => {
    // A claim about the SHAPE of the ask, not about the result — the resulting
    // definition is identical either way, so only the recorded call can show it.

    // Renaming a palette entry: `site.json` AND every page that referenced it.
    const rename = track(makeMemorySite(seedWithPalette()))
    const renameRec = recordingStore(rename.store)
    await editPaletteRename(rename.slug, 'brand-teal', 'brand-green', {
      ...rename.opts,
      store: renameRec.store,
    })
    expect(renameRec.writes).toHaveLength(1)
    expect(renameRec.writes[0]).toMatchObject({
      slug: rename.slug,
      siteJson: true,
      pages: ['home.json'],
      removePages: [],
    })

    // Removing a page: the nav rewrite AND the removal.
    const removal = track(
      makeMemorySite({
        pages: { 'home.json': pageWithPaletteRef() },
        patchSiteJson: {
          palette: { 'brand-teal': { value: '#0d9488' } },
          nav: {
            pattern: 'top-tabs',
            entries: [{ label: 'About', target: { kind: 'page', pageId: 'about' } }],
          },
        },
      }),
    )
    await editPageAdd(removal.slug, 'about', {
      ...removal.opts,
      title: 'About',
      path: 'about',
    })
    const removalRec = recordingStore(removal.store)
    await editPageRm(removal.slug, 'about', {
      ...removal.opts,
      store: removalRec.store,
      force: true,
    })
    expect(removalRec.writes).toHaveLength(1)
    expect(removalRec.writes[0]).toMatchObject({
      siteJson: true,
      pages: [],
      removePages: ['about.json'],
    })

    // Editing one page's copy names ONLY the page it altered.
    const copy = track(makeMemorySite(seedWithPalette()))
    const copyRec = recordingStore(copy.store)
    await editCopySet(copy.slug, 'home', '0.0', { text: 'Changed' }, {
      ...copy.opts,
      store: copyRec.store,
    })
    expect(copyRec.writes).toEqual([
      {
        slug: copy.slug,
        siteJson: false,
        pages: ['home.json'],
        removePages: [],
        assets: [],
        removeAssets: [],
      },
    ])

    // An empty change is legal and does nothing.
    const definitionOf = async (f: SiteFixture): Promise<unknown> => {
      const result = (await f.store.loadDraft(f.slug))!.result
      expect(result.ok).toBe(true)
      return (result as { ok: true; value: { site: unknown } }).value.site
    }
    const before = await definitionOf(copy)
    await expect(copy.store.write(copy.slug, {})).resolves.toBeUndefined()
    expect(await definitionOf(copy)).toEqual(before)
  })

  // ── AC-1324 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem', async () => {
    const site = track(makeMemorySite(seedWithPalette()))
    const { slug, opts, store } = site

    // The fixture holds no filesystem handle of any kind: a command that still
    // reached for a file fails here rather than quietly succeeding against the
    // operator's own disk.
    expect(site.cwd).toBeNull()
    expect(opts.cwd).toBeUndefined()

    // read
    expect(((await editPageList(slug, opts)).data as { pages: unknown[] }).pages).toHaveLength(1)
    expect(
      ((await editPageGet(slug, 'home', opts)).data as { page: { title: string } }).page.title,
    ).toBe('Home')

    // a write lands and reads back, and the change count advances on each one
    const added = await editPageAdd(slug, 'about', { ...opts, title: 'About', path: 'about' })
    expect(added.at).toBe(1)
    expect(
      ((await editPageList(slug, opts)).data as { pages: { id: string }[] }).pages
        .map((p) => p.id)
        .sort(),
    ).toEqual(['about', 'home'])
    const renamed = await editConfigSet(slug, 'config', { businessName: 'Renamed' }, opts)
    expect(renamed.at).toBe(2)

    // …and does not move on a refusal
    await expect(
      editPageAdd(slug, 'about', { ...opts, title: 'Again', path: 'about-2' }),
    ).rejects.toThrow(CommandError)
    expect(await store.counter(slug)).toBe(2)

    // a copy edit reads and writes one segment
    expect((await editCopyGet(slug, 'home', '0.0', opts)).data).toMatchObject({ kind: 'text' })
    expect(
      ((await editCopySet(slug, 'home', '0.0', { text: 'Hello again' }, opts)).data as {
        changed: string[]
      }).changed,
    ).toEqual(['text'])

    // a structured page subtree round-trips VERBATIM — the palette reference
    // survives unresolved
    const replacement = {
      kind: 'text',
      id: 'headline',
      text: 'Replaced',
      axes: { color: { ref: 'brand-teal' }, fontSizePx: 40 },
    }
    await editL1Set(slug, 'home', '0.0', replacement, opts)
    expect((await editL1Get(slug, 'home', '0.0', opts)).data).toMatchObject({ node: replacement })

    // the palette rules are enforced: a referenced entry is refused, an
    // unreferenced one goes, and an allowed rename carries its references
    await editPaletteAdd(slug, 'accent', '#ff8800', opts)
    await editPaletteSet(slug, 'accent', '#ff0088', opts)
    await expect(editPaletteRm(slug, 'brand-teal', opts)).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    await editPaletteRm(slug, 'accent', opts)
    expect((await editPaletteRename(slug, 'brand-teal', 'brand-green', opts)).data).toMatchObject({
      count: 1,
    })
    expect(
      ((await editPaletteGet(slug, opts)).data as { entries: { name: string }[] }).entries.map(
        (e) => e.name,
      ),
    ).toEqual(['brand-green'])

    // an asset is added and removed as bytes
    await editAssetAdd(slug, 'logo.svg', utf8(SVG), opts)
    expect(await store.readAsset(slug, 'logo.svg')).toEqual(utf8(SVG))
    await editAssetRm(slug, 'logo.svg', opts)
    expect(await store.readAsset(slug, 'logo.svg')).toBeNull()

    // status answers, and the draft renders from this store
    expect((await editStatus(slug, opts)).data).toBeTruthy()
    const rendered = await new PreviewRenderer(store).file(slug, 'draft', '/')
    expect(rendered?.kind).toBe('text')
    expect((rendered as { body: string }).body).toContain('<html')
  })

  // ── AC-1325 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores', async () => {
    const fs = track(makeFsSite({ slug: 'twin', ...seedWithPalette() }))
    const mem = track(makeMemorySite({ slug: 'twin', ...seedWithPalette() }))

    /** One sequence of commands, then everything the surface can be asked. */
    const applyAndAsk = async (f: SiteFixture): Promise<unknown> => {
      await editPaletteRename(f.slug, 'brand-teal', 'brand-green', f.opts)
      await editPageAdd(f.slug, 'about', { ...f.opts, title: 'About', path: 'about' })
      await editCopySet(f.slug, 'home', '0.0', { text: 'Shared' }, f.opts)
      await editAssetAdd(f.slug, 'logo.svg', utf8(SVG), f.opts)
      return {
        pages: (await editPageList(f.slug, f.opts)).data,
        palette: (await editPaletteGet(f.slug, f.opts)).data,
        l1: (await editL1Get(f.slug, 'home', '0.0', f.opts)).data,
        config: (await editConfigGet(f.slug, 'config.businessName', f.opts)).data,
        assets: (await editAssetList(f.slug, f.opts)).data,
        count: await f.store.counter(f.slug),
      }
    }

    // The identical body of assertions, not one adjusted for either adapter.
    expect(await applyAndAsk(mem)).toEqual(await applyAndAsk(fs))

    // And the ASSEMBLED definition each store now holds is the same definition.
    // `sourceDir` is excluded by construction: it is descriptive of where the
    // parts came from, which is exactly the thing the two adapters differ on.
    const assembled = async (f: SiteFixture) => {
      const draft = await f.store.loadDraft(f.slug)
      expect(draft!.result.ok).toBe(true)
      const value = (draft!.result as { ok: true; value: { site: unknown; assetFiles: string[] } })
        .value
      return { site: value.site, assetFiles: value.assetFiles }
    }
    expect(await assembled(mem)).toEqual(await assembled(fs))
  })

  // ── AC-1326 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged', async () => {
    const cwd = tempDir('ac1326-')
    cmdNew('acme', { cwd })

    /** The `1c` entry point: argv in, `--json` envelope and exit code out. */
    const cli = async (
      ...argv: string[]
    ): Promise<{
      ok: boolean
      data?: Record<string, unknown>
      error?: Record<string, unknown>
      exitCode: number
    }> => {
      const prevCwd = process.cwd()
      const prevLog = console.log
      const prevErr = console.error
      const out: string[] = []
      process.chdir(cwd)
      process.exitCode = 0
      console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
      console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
      try {
        await run([...argv, '--json'])
      } finally {
        console.log = prevLog
        console.error = prevErr
        process.chdir(prevCwd)
      }
      const exitCode = Number(process.exitCode ?? 0)
      process.exitCode = 0
      return { ...(JSON.parse(out.join('\n')) as { ok: boolean }), exitCode }
    }

    // `1c copy set` — same arguments, same output.
    const copy = await cli('copy', 'set', 'acme', 'home', '0.0', '--values', '{"text":"Trading"}')
    expect(copy.ok).toBe(true)
    expect(copy.data).toMatchObject({ changed: ['text'] })
    expect((await cli('copy', 'get', 'acme', 'home', '0.0')).data).toMatchObject({ kind: 'text' })

    // The palette commands.
    expect((await cli('palette', 'add', 'acme', 'accent', '#ff8800')).ok).toBe(true)
    expect((await cli('palette', 'set', 'acme', 'accent', '#ff0088')).ok).toBe(true)
    expect((await cli('palette', 'get', 'acme')).data).toMatchObject({
      entries: [{ name: 'accent', value: '#ff0088', count: 0 }],
    })
    expect((await cli('palette', 'rename', 'acme', 'accent', 'highlight')).data).toMatchObject({
      count: 0,
    })
    expect((await cli('palette', 'rm', 'acme', 'highlight')).ok).toBe(true)

    // The asset commands. `1c asset add <file> --as <name>` still takes a path
    // on the operator's own machine — a *source*, outside the site.
    const source = path.join(cwd, 'source-logo.svg')
    writeFileSync(source, SVG, 'utf8')
    const addition = await cli('asset', 'add', 'acme', source, '--as', 'logo.svg')
    expect(addition.ok).toBe(true)
    expect(addition.data).toMatchObject({ asset: { id: 'logo.svg', src: 'logo.svg' } })
    expect((await cli('asset', 'list', 'acme')).data).toMatchObject({
      assets: [{ id: 'logo.svg' }],
    })
    expect((await cli('asset', 'get', 'acme', 'logo.svg')).ok).toBe(true)
    expect((await cli('asset', 'rm', 'acme', 'logo.svg', '--force')).ok).toBe(true)

    // A missing SOURCE file is still refused with a not-found envelope naming
    // that path and hinting at a readable one.
    const missing = path.join(cwd, 'no-such-file.svg')
    const refusedSource = await cli('asset', 'add', 'acme', missing, '--as', 'x.svg')
    expect(refusedSource.ok).toBe(false)
    expect(refusedSource.error).toMatchObject({
      code: 'NOT_FOUND',
      path: missing,
      hint: 'Pass a path to a readable file.',
    })
    expect(refusedSource.exitCode).toBe(3)

    // A refusal from the editing surface carries a code, the path it concerns
    // and a hint…
    const refusal = await cli('page', 'get', 'acme', 'nope')
    expect(refusal.ok).toBe(false)
    expect(refusal.error).toMatchObject({
      code: 'NOT_FOUND',
      path: 'nope',
      hint: `List pages with '1c page list acme'.`,
    })

    // …and the SAME refusal driven through the builder's editing route arrives
    // at the browser as a 400 carrying those three fields.
    const response = await builderFetch(cwd, '/api/copy', {
      method: 'POST',
      body: JSON.stringify({ slug: 'acme', page: 'nope', path: '0.0', values: { text: 'x' } }),
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      code: 'NOT_FOUND',
      path: 'nope',
      hint: `List pages with '1c page list acme'.`,
    })
  })

  // ── AC-1327 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it', async () => {
    // A store with no filesystem behind it, and no site tree anywhere.
    const { slug, store, opts, cwd } = track(makeMemorySite(seedWithPalette('Before')))
    expect(cwd).toBeNull()
    const preview = new PreviewRenderer(store)

    // A draft PAGE renders from the store the builder was given.
    const page = await preview.file(slug, 'draft', '/')
    expect(page?.kind).toBe('text')
    expect((page as { body: string }).body).toContain('<html')
    expect((page as { body: string }).body).toContain('Before')

    // A draft ASSET resolves to that asset's bytes plus a content type derived
    // from its name.
    await editAssetWrite(slug, 'mark', SVG, opts)
    const asset = await preview.file(slug, 'draft', '/assets/mark.svg')
    expect(asset).toMatchObject({ kind: 'bytes', contentType: 'image/svg+xml' })
    expect((asset as { body: Uint8Array }).body).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode((asset as { body: Uint8Array }).body)).toBe(SVG)

    // An asset the store does not hold resolves to NOTHING — not an error, and
    // not an empty file.
    expect(await preview.file(slug, 'draft', '/assets/absent.svg')).toBeNull()

    // A change made to the draft outside the builder is picked up on the next
    // request, with no restart: the same renderer instance answers anew.
    await editCopySet(slug, 'home', '0.0', { text: 'After' }, opts)
    const refreshed = await preview.file(slug, 'draft', '/')
    expect((refreshed as { body: string }).body).toContain('After')
    expect((refreshed as { body: string }).body).not.toContain('Before')
  })

  // ── AC-1329 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1329_the_split_kept_the_filesystem_runtime_and_partitions_cleanly', async () => {
    // Behaviour modules still render in the runtime that has a filesystem, and
    // the criterion is still executed rather than asserted about. What changed
    // is only the mechanism: REQ-148 made the module a plain function, so it is
    // called directly instead of through Astro's container, and REQ-150 removed
    // the dependency that container came from. The claim — this runtime renders
    // a behaviour module, the workerd one does not — is untouched.
    const fields = [{ name: 'email', label: 'Email', type: 'email', required: true }] as const
    const html = ContactForm({
      config: { action: '/api/forms/contact', fields },
      slots: { form: contactFormPreset(fields) },
    } as unknown as BehaviorProps)
    expect(html).toMatch(/<form[^>]+method="post"/)
    expect(html).toMatch(/<input[^>]+name="email"[^>]+type="email"/)

    // That runtime is configured by Vitest directly now. It used to route
    // through Astro's build config (`getViteConfig`), which existed solely to
    // put the `.astro` transform on the path; with no `.astro` file left to
    // transform, REQ-150 replaced it with a plain `defineConfig`. The aliases
    // and timeouts the split established are kept exactly as they were.
    const node = readRepo('vitest.node.config.mts')
    expect(node).toContain("from 'vitest/config'")
    expect(node).toContain('defineConfig({')
    expect(node).not.toMatch(/from 'astro/)
    expect(node).toContain('resolve: { alias: webuiAliases() }')
    expect(node).toContain('testTimeout: 60000')
    expect(node).toContain('hookTimeout: 60000')
    expect(node).toContain(`include: ['tests/**/*.test.ts']`)
    expect(node).toContain(`exclude: ['${WORKERS_GLOB}']`)

    // Neither project carries Astro any more, so the assertion that the workerd
    // one does not is kept as a floor rather than as the distinguishing fact:
    // what separates the two now is the filesystem, which is why the render
    // above is executed here and cannot be routed to workerd by accident.
    const workers = readRepo('vitest.workers.config.mts')
    expect(workers).not.toContain('astro')
    expect(workers).toContain(`include: ['${WORKERS_GLOB}']`)

    // The same reason, one step further: a workerd project declaring a NEWER
    // runtime than the deployed Workers would also let a test pass for a reason
    // production does not have. Its compatibility settings are the apps' own.
    for (const app of ['apps/public-site/wrangler.toml', 'apps/control-app/wrangler.toml']) {
      const toml = readRepo(app)
      expect(toml, app).toContain('compatibility_date = "2025-07-01"')
      expect(toml, app).toContain('compatibility_flags = ["nodejs_compat"]')
    }
    expect(workers).toContain(`compatibilityDate: '2025-07-01'`)
    expect(workers).toContain(`compatibilityFlags: ['nodejs_compat']`)

    // The composing configuration declares no suite of its own, so a test placed
    // there could not run in neither runtime unnoticed.
    const root = readRepo('vitest.config.mts')
    expect(root).toContain("'./vitest.node.config.mts'")
    expect(root).toContain("'./vitest.workers.config.mts'")
    expect(root).not.toContain('include:')

    // The two inclusion rules partition the real test files: none claimed by
    // both, none by neither.
    const all = listFilesRel(path.join(REPO, 'tests')).filter((rel) => rel.endsWith('.test.ts'))
    const inWorkers = all.filter((rel) => rel.endsWith(WORKERS_MARKER))
    const inNode = all.filter((rel) => !rel.endsWith(WORKERS_MARKER))
    expect(all.length).toBeGreaterThan(0)
    expect(inWorkers.length).toBeGreaterThan(0)
    expect(inNode.length).toBeGreaterThan(0)
    expect(inNode.filter((rel) => inWorkers.includes(rel))).toEqual([])
    expect([...inNode, ...inWorkers].sort()).toEqual([...all].sort())
  })
})

/**
 * One request over the builder origin's REAL routing table, with no socket.
 *
 * `handleBuilderRequest` is exported for exactly this, so the 400 asserted above
 * is the status and body the browser receives rather than a re-derivation of
 * them. A bound port would make the criterion unaskable on a machine that
 * refuses `listen`, and nothing about it is TCP's.
 */
async function builderFetch(cwd: string, url: string, init: RequestInit): Promise<Response> {
  const opts = { cwd }
  const ctx = ctxOf(opts)
  const payload = init.body == null ? [] : [Buffer.from(String(init.body))]

  const req = Readable.from(payload) as unknown as http.IncomingMessage
  Object.assign(req, {
    url,
    method: (init.method ?? 'GET').toUpperCase(),
    headers: { 'content-type': 'application/json' },
  })

  const chunks: Buffer[] = []
  const headers: Record<string, string> = {}
  let status = 200
  let finished: () => void = () => {}
  const done = new Promise<void>((resolve) => {
    finished = resolve
  })

  const res = new Writable({
    write(chunk, _encoding, cb) {
      chunks.push(Buffer.from(chunk as Buffer))
      cb()
    },
  })
  res.on('finish', () => finished())
  Object.assign(res, {
    setHeader(name: string, value: unknown) {
      headers[name.toLowerCase()] = String(value)
      return res
    },
    getHeader: (name: string) => headers[name.toLowerCase()],
    removeHeader: (name: string) => void delete headers[name.toLowerCase()],
    writeHead(code: number, given?: Record<string, unknown>) {
      status = code
      for (const [k, v] of Object.entries(given ?? {})) headers[k.toLowerCase()] = String(v)
      return res
    },
  })

  await handleBuilderRequest(ctx, opts, req, res as unknown as http.ServerResponse)
  await done
  delete headers['content-length']
  return new Response(Buffer.concat(chunks), { status, headers })
}
