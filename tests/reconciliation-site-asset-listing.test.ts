/**
 * story-c46abfa6 — **the site's asset store as a surface of its own**: ask a
 * site what assets it has and get one honest answer, without opening or clicking
 * anything on a page.
 *
 * The claim under test is that there is exactly ONE listing, reachable two ways,
 * and that its single source is the draft asset directory — the bytes the site's
 * store holds. It was the union of that directory and a declared registry in
 * `site.json` until BUG-44 removed the registry: nothing read the metadata it
 * carried, and its one behavioural effect was that an asset could be present and
 * still unaddressable. The tests are shaped to fail if the listing ever grows a
 * second source again, invents a second handle vocabulary, or reports a file the
 * store does not hold.
 *
 * AC-1019 — a declared asset contributing its identity and listing with no file —
 * IS WITHDRAWN with the registry, not regressed. Nothing declares an asset now,
 * so there is no second source to contribute anything and no way to name a byte
 * the store does not have.
 *
 * Two real entry points, nothing between them stubbed:
 *
 * - the **command line** through `run(argv)` — argv in, an `{ok,data}` envelope
 *   and a process exit code out, exactly what an operator or a tool call gets;
 * - the **builder origin** over HTTP through `startBuilder`, so "the same store
 *   with two ways in" is asserted about bytes on the wire rather than about a
 *   shared import.
 *
 * The only fixtures are a throwaway store per test and the seeded sites below.
 * Nothing here renders a page, opens an editing surface or names a region — that
 * is the point of the capability.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, run, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * The files a real site's `draft/assets/` holds: pictures alongside the fonts and
 * stylesheets a capture mirrors. The non-pictures are the fixture's point — the
 * store lists every asset of every kind, and only a caller narrows.
 */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'photo.jpg': 'bytes:photo',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'body.woff2': 'bytes:font',
  'site.css': 'body{}',
}

/** The site-local handle form a page already holds for an image. */
const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'

/** Every entry the site's store holds, in the order it reports them. */
const MIXED_STORE = [
  { id: 'beta.png', src: BETA, kind: 'image', onDisk: true },
  { id: 'body.woff2', src: '/assets/body.woff2', kind: 'font', onDisk: true },
  { id: 'hero.png', src: HERO, kind: 'image', onDisk: true },
  { id: 'logo.svg', src: '/assets/logo.svg', kind: 'image', onDisk: true },
  { id: 'photo.jpg', src: '/assets/photo.jpg', kind: 'image', onDisk: true },
  { id: 'site.css', src: '/assets/site.css', kind: 'other', onDisk: true },
]

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
}

/**
 * A site with files on disk.
 *
 * The home page carries an image node holding the fold's handle for one of those
 * files, so "the listing names an asset the way a page already does" is
 * measurable against a real page rather than against a restated constant.
 */
function seedSite(
  cwd: string,
  slug: string,
  opts: { files?: Record<string, string> } = {},
): void {
  const files = opts.files ?? ASSET_FILES
  mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(files)) {
    writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }

  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'image', id: 'hero-img', src: HERO, alt: 'The hero' }],
  }
  home.l1.root = root
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
}

interface StoreEntry {
  id: string
  src: string
  kind: string
  onDisk: boolean
}

/** Drive the real `1c` entry point — argv in, envelope and exit code out. */
async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
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
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  return { ...(JSON.parse(out[out.length - 1]) as CliResult), exitCode }
}

/** Ask a site for its assets from the command line — the site is the only input. */
async function askForAssets(cwd: string, slug: string): Promise<CliResult> {
  return cli(cwd, 'asset', 'list', slug)
}

const entriesOf = (result: CliResult): StoreEntry[] => result.data!.assets as unknown as StoreEntry[]

describe('story-c46abfa6 — the site asset store', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-c46abfa6-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC1018_a_file_present_in_the_site_assets_is_listed_even_when_undeclared', async () => {
    // AC-1018 — the state EVERY real site in `storage/` is in, and since BUG-44
    // the only state there is: a full asset directory and nothing declaring any
    // of it. A listing that needed a declaration would name nothing at all here.
    cmdNew('undeclared', { cwd })
    seedSite(cwd, 'undeclared')

    const listed = await askForAssets(cwd, 'undeclared')
    expect(listed.ok).toBe(true)
    const assets = entriesOf(listed)

    // Every file on disk is in the answer, none of them declared.
    expect(assets.map((a) => a.src)).toEqual(
      Object.keys(ASSET_FILES)
        .map((name) => `/assets/${name}`)
        .sort(),
    )

    for (const name of Object.keys(ASSET_FILES)) {
      const entry = assets.find((a) => a.src === `/assets/${name}`)!
      // A file is its own identity: there is nowhere else an id could come from.
      expect(entry.id, name).toBe(name)
      expect(entry.onDisk, name).toBe(true)
      expect(typeof entry.kind, name).toBe('string')
      // Nothing on the entry says an asset needs declaring before it is used.
      expect(entry, name).not.toHaveProperty('registered')
    }
  })

  it('test_UAT_BUG-44_the_listing_reports_the_store_and_nothing_but_the_store', async () => {
    // The inverse of the withdrawn AC-1019. A site definition that still carries
    // the old `assets` array — every site written before BUG-44 does — is loaded
    // untouched, and not one of its entries reaches the listing. The key is
    // ignored, never refused: the site validates and nothing about it changes.
    const siteJson = draftPath(cwd, 'acme', 'site.json')
    const base = JSON.parse(readFileSync(siteJson, 'utf8'))
    base.assets = [
      { id: 'beta', src: 'beta.png', alt: 'The beta image' },
      { id: 'ghost', src: 'ghost.png', alt: 'Declared, never uploaded' },
    ]
    writeFileSync(siteJson, JSON.stringify(base, null, 2))

    const listed = await askForAssets(cwd, 'acme')
    expect(listed.ok).toBe(true)
    const assets = entriesOf(listed)

    // The stale declaration changes nothing: the same entries, from the store.
    expect(assets).toEqual(MIXED_STORE)
    // `ghost` names bytes the store does not hold, so it is not an asset at all.
    expect(assets.map((a) => a.id)).not.toContain('ghost')
    expect(assets.find((a) => a.src === BETA)!.id).toBe('beta.png')
    // And no entry carries the metadata that array existed to hold.
    for (const entry of assets) expect(entry).not.toHaveProperty('alt')
  })

  it('test_UAT_AC1020_every_listed_asset_is_named_in_the_site_local_handle_a_page_holds', async () => {
    // AC-1020 — one handle vocabulary. The store names a file bare (`beta.png`)
    // and a page names it qualified (`/assets/hero.png`); the listing speaks the
    // page's form, so what it hands back can be written straight into a node.
    const assets = entriesOf(await askForAssets(cwd, 'acme'))

    expect(assets.filter((a) => a.src === BETA)).toHaveLength(1)
    expect(assets.filter((a) => a.src === HERO)).toHaveLength(1)
    // The qualified site-local form, never the bare filename the store holds.
    expect(assets.map((a) => a.src)).not.toContain('beta.png')
    expect(assets.every((a) => a.src.startsWith('/assets/'))).toBe(true)

    // A handle read from the listing is what a page ALREADY holds for that file —
    // written straight in, with no translation step.
    const page = JSON.parse(readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8'))
    expect(assets.find((a) => a.src === HERO)!.src).toBe(page.l1.root.children[0].src)

    // Ordered by handle, so the same site yields the same order on every call.
    expect(assets.map((a) => a.src)).toEqual([...assets.map((a) => a.src)].sort())
    const again = entriesOf(await askForAssets(cwd, 'acme'))
    expect(again.map((a) => a.src)).toEqual(assets.map((a) => a.src))

    // The BOUNDARY of that normalisation used to be a declaration naming a byte
    // that is not the site's own — an `https://` src in the registry, reported as
    // it stood rather than prefixed into `/assets/https://…`. Nothing can declare
    // an asset now, and a store holds filenames rather than URLs, so the case is
    // unreachable and is withdrawn with the registry (BUG-44). What survives it
    // is the rule it was protecting, asserted above: every handle the listing
    // reports is one a page can hold unchanged.
  })

  it('test_UAT_AC1021_each_asset_reports_what_it_can_be_used_for', async () => {
    // AC-1021 — the kind comes from the file itself, and the listing narrows
    // nothing: a caller needing pictures filters, a caller browsing the store
    // still sees the font and the stylesheet.
    const assets = entriesOf(await askForAssets(cwd, 'acme'))

    const kindOf = (src: string) => assets.find((a) => a.src === src)!.kind
    expect(kindOf('/assets/hero.png')).toBe('image')
    expect(kindOf('/assets/photo.jpg')).toBe('image')
    expect(kindOf('/assets/logo.svg')).toBe('image')
    expect(kindOf('/assets/body.woff2')).toBe('font')
    expect(kindOf('/assets/site.css')).toBe('other')

    // Unfiltered: every asset of every kind is in the one answer.
    expect(assets.map((a) => a.src)).toEqual(MIXED_STORE.map((a) => a.src))
    expect(new Set(assets.map((a) => a.kind))).toEqual(new Set(['image', 'font', 'other']))
    // …and a caller needing one kind narrows the same list itself.
    expect(assets.filter((a) => a.kind === 'image').map((a) => a.src)).toEqual([
      BETA,
      HERO,
      '/assets/logo.svg',
      '/assets/photo.jpg',
    ])
  })

  it('test_UAT_AC1022_the_store_answers_from_the_command_line_with_no_editing_gesture', async () => {
    // AC-1022 — the site alone is enough input: no page rendered, no editing
    // surface opened, no region named.
    const listed = await askForAssets(cwd, 'acme')
    expect(listed.ok).toBe(true)
    expect(listed.exitCode).toBe(0)

    // The full entry shape, for every asset — identity, handle, usage kind and
    // present-in-the-store. There is nothing else an asset has.
    expect(entriesOf(listed)).toEqual(MIXED_STORE)

    // "This site has no assets" is an answer, not a failure.
    cmdNew('blank', { cwd })
    const empty = await askForAssets(cwd, 'blank')
    expect(empty.ok).toBe(true)
    expect(empty.exitCode).toBe(0)
    expect(entriesOf(empty)).toEqual([])
  })
})

describe('story-c46abfa6 — the site asset store over the builder origin', () => {
  let cwd: string
  let builder: BuilderHandle

  beforeAll(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-c46abfa6-origin-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    builder = await startBuilder({ cwd })
  }, 120000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC1023_the_store_answers_from_the_builder_origin_and_refuses_a_missing_site', async () => {
    // AC-1023 — one store, two ways in. No page, no segment, no modal: a plain
    // GET on the origin, answering with what the command line answers.
    const res = await fetch(new URL('/api/assets?slug=acme', builder.url))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { assets: StoreEntry[] }

    expect(body.assets).toEqual(MIXED_STORE)
    // The same entries the command line returns for the same site — asserted
    // against the other entry point rather than against the constant alone.
    expect(body.assets).toEqual(entriesOf(await cli(cwd, 'asset', 'list', 'acme')))

    // Omitting the site is the CALLER's mistake: a client error naming the
    // missing input, never a server failure and never an empty success.
    const bad = await fetch(new URL('/api/assets', builder.url))
    expect(bad.status).toBe(400)
    const err = (await bad.json()) as { error?: string; assets?: unknown }
    expect(err.error).toMatch(/slug/i)
    expect(err.assets).toBeUndefined()

    // And the builder reaches it through its OWN client, not by hand-writing the
    // URL a second time — DOC-28 §9.2's asset browser mode is a consumer of this
    // module, so the module is what the criterion is asserted against. The only
    // shim is the one a browser supplies for free: a relative path resolved
    // against the origin it was served from.
    const { fetchAssets } = await import('../apps/control-app/src/builder/api.js')
    const browserFetch = (p: string): Promise<Response> => fetch(new URL(p, builder.url))

    const viaClient = (await fetchAssets('acme', browserFetch)) as { assets: StoreEntry[] }
    // The same list, entry for entry — one store, however it is reached.
    expect(viaClient.assets).toEqual(MIXED_STORE)

    // The caller fault survives the client too. Returning an empty list here
    // would put "this site has no assets" in front of a user whose site is full.
    await expect(fetchAssets('', browserFetch)).rejects.toThrow(/\/api\/assets/)
  })
})
