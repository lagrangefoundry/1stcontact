/**
 * story-c46abfa6 — **the site's asset store as a surface of its own**: ask a
 * site what assets it has and get one honest answer, without opening or clicking
 * anything on a page.
 *
 * The claim under test is that there is exactly ONE listing, reachable two ways,
 * and that it is the UNION of two sources that genuinely disagree — the site
 * definition's declared registry (metadata, no bytes) and the draft asset
 * directory (bytes, no metadata). Every real site in `storage/` has an empty
 * registry beside a full directory, so a registry-only answer names nothing at
 * all on the sites actually being built; the tests are shaped to fail if the
 * listing ever regresses to one source, invents a second handle vocabulary, or
 * flattens the disagreement between the two sources into a guess.
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

/**
 * What the site definition declares.
 *
 * Deliberately three shapes at once: a bare filename (the form `asset add`
 * writes), an already-qualified path (the form a capture fold writes), and a
 * declaration whose file was never uploaded. The first two name files that DO
 * exist on disk, so the merge has something to merge.
 */
const REGISTRY = [
  { id: 'beta', src: 'beta.png', alt: 'The beta image' },
  { id: 'hero', src: '/assets/hero.png', alt: 'The hero' },
  { id: 'ghost', src: 'ghost.png', alt: 'Declared, never uploaded' },
]

/** The site-local handle form a page already holds for an image. */
const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const GHOST = '/assets/ghost.png'

/** Every entry the mixed site's store holds, in the order it reports them. */
const MIXED_STORE = [
  {
    id: 'beta',
    src: BETA,
    alt: 'The beta image',
    kind: 'image',
    onDisk: true,
    registered: true,
  },
  {
    id: 'body.woff2',
    src: '/assets/body.woff2',
    alt: '',
    kind: 'font',
    onDisk: true,
    registered: false,
  },
  {
    id: 'ghost',
    src: GHOST,
    alt: 'Declared, never uploaded',
    kind: 'image',
    onDisk: false,
    registered: true,
  },
  { id: 'hero', src: HERO, alt: 'The hero', kind: 'image', onDisk: true, registered: true },
  {
    id: 'logo.svg',
    src: '/assets/logo.svg',
    alt: '',
    kind: 'image',
    onDisk: true,
    registered: false,
  },
  {
    id: 'photo.jpg',
    src: '/assets/photo.jpg',
    alt: '',
    kind: 'image',
    onDisk: true,
    registered: false,
  },
  {
    id: 'site.css',
    src: '/assets/site.css',
    alt: '',
    kind: 'other',
    onDisk: true,
    registered: false,
  },
]

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
}

/**
 * A site with files on disk and, optionally, a declared registry.
 *
 * The home page carries an image node holding the fold's handle for one of those
 * files, so "the listing names an asset the way a page already does" is
 * measurable against a real page rather than against a restated constant.
 */
function seedSite(
  cwd: string,
  slug: string,
  opts: { files?: Record<string, string>; registry?: Record<string, unknown>[] } = {},
): void {
  const files = opts.files ?? ASSET_FILES
  mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(files)) {
    writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }

  const siteJson = draftPath(cwd, slug, 'site.json')
  const base = JSON.parse(readFileSync(siteJson, 'utf8'))
  base.assets = opts.registry ?? []
  writeFileSync(siteJson, JSON.stringify(base, null, 2))

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
  alt: string
  kind: string
  onDisk: boolean
  registered: boolean
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
    seedSite(cwd, 'acme', { registry: REGISTRY })
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC1018_a_file_present_in_the_site_assets_is_listed_even_when_undeclared', async () => {
    // AC-1018 — the state EVERY real site in `storage/` is in: a full asset
    // directory beside an empty declared registry. A registry-only listing would
    // name nothing here, which is why the union exists.
    cmdNew('undeclared', { cwd })
    seedSite(cwd, 'undeclared', { registry: [] })

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
      // An undeclared file has no metadata to borrow, so it is its own identity.
      expect(entry.id, name).toBe(name)
      expect(entry.onDisk, name).toBe(true)
      expect(entry.registered, name).toBe(false)
      expect(typeof entry.kind, name).toBe('string')
    }
  })

  it('test_UAT_AC1019_a_declared_asset_contributes_its_identity_and_is_listed_with_no_file', async () => {
    // AC-1019 — the definition's metadata is what the directory cannot supply,
    // and the two sources merge into ONE entry per handle rather than two.
    const assets = entriesOf(await askForAssets(cwd, 'acme'))

    const beta = assets.filter((a) => a.src === BETA)
    expect(beta).toHaveLength(1)
    expect(beta[0]).toEqual({
      id: 'beta',
      src: BETA,
      alt: 'The beta image',
      kind: 'image',
      onDisk: true,
      registered: true,
    })

    // Declared, never uploaded: still listed, and the disagreement between the
    // two sources is visible rather than silently resolved either way.
    const ghost = assets.filter((a) => a.src === GHOST)
    expect(ghost).toHaveLength(1)
    expect(ghost[0]).toMatchObject({
      id: 'ghost',
      alt: 'Declared, never uploaded',
      registered: true,
      onDisk: false,
    })
  })

  it('test_UAT_AC1020_every_listed_asset_is_named_in_the_site_local_handle_a_page_holds', async () => {
    // AC-1020 — one handle vocabulary. The registry declares `beta.png` bare and
    // `/assets/hero.png` qualified; both files are also on disk. Four sources of
    // naming, one handle each, no entry counted twice.
    const assets = entriesOf(await askForAssets(cwd, 'acme'))

    expect(assets.filter((a) => a.src === BETA)).toHaveLength(1)
    expect(assets.filter((a) => a.src === HERO)).toHaveLength(1)
    // The qualified site-local form, never the bare filename the registry used.
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
      GHOST,
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

    // The full entry shape, for every asset — identity, handle, descriptive
    // text, usage kind, present-on-disk and declared-in-definition.
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
    seedSite(cwd, 'acme', { registry: REGISTRY })
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
  })
})
