/**
 * story-c46abfa6 — **the site's asset store tells the truth**, the half of the
 * story BUG-44 reshaped: there is no site-level registry, so reading an asset
 * agrees with the listing, writing an asset writes bytes and never the
 * definition, the retired `assets` key is ignored rather than refused, the
 * asset-reference VALUE survives the registry's removal, and the assistant's
 * declared manual says nothing that makes registration a precondition for use.
 *
 * The listing itself (AC-1018/1020/1021/1022/1023) is proven in
 * `reconciliation-site-asset-listing.test.ts`; this file covers the criteria
 * that were added when the registry was deleted.
 *
 * Entry points, nothing between them stubbed:
 *
 * - the **command line** through `run(argv)` — argv in, an `{ok,data}` envelope
 *   and a process exit code out;
 * - the public **`validateSite`** of `@1stcontact/site-schema`, which is the
 *   boundary every stored definition passes through;
 * - the **declared control surface** (`l1-surface.json`), which is projected
 *   verbatim into the assistant's manual — asserted on the declaration, not on a
 *   model's obedience to it.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, run } from '../tools/generate/src/cli'
import { validateSite } from '../packages/site-schema/src/index'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'

const SLUG = 'acme'

/** A drawing the closed SVG grammar accepts. */
const DRAWING =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="#123456"/></svg>'
const REDRAWING =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="#abcdef"/></svg>'

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

interface JournalSlice {
  now: number
  changes: Array<{ op: string; label?: string }>
}

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
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

/** Seed raw bytes straight into the store, as an upload or a capture would leave them. */
function seedAssets(cwd: string, slug: string, files: Record<string, string>): void {
  mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(files)) {
    writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }
}

/** Every draft file that is the site DEFINITION — everything but the asset bytes. */
function snapshotDefinition(cwd: string, slug: string): Map<string, string> {
  const root = draftPath(cwd, slug)
  const out = new Map<string, string>()
  const walk = (dir: string, rel: string): void => {
    for (const name of readdirSync(dir)) {
      const abs = path.join(dir, name)
      const r = rel ? `${rel}/${name}` : name
      if (r === 'assets') continue
      if (statSync(abs).isDirectory()) walk(abs, r)
      else out.set(r, readFileSync(abs, 'latin1'))
    }
  }
  walk(root, '')
  return out
}

function readAssetBytes(cwd: string, slug: string, name: string): string | null {
  try {
    return readFileSync(draftPath(cwd, slug, 'assets', name), 'utf8')
  } catch {
    return null
  }
}

async function journal(cwd: string, slug: string): Promise<JournalSlice> {
  const res = await cli(cwd, 'changes', slug)
  expect(res.ok).toBe(true)
  return res.data as unknown as JournalSlice
}

const entriesOf = (result: CliResult): StoreEntry[] => result.data!.assets as unknown as StoreEntry[]

/**
 * Put a carousel behavior module on the home page, mounted at a slot, so a
 * component field can carry an asset-reference — the one place removal checks.
 */
function referenceFromComponent(cwd: string, slug: string, assetName: string): void {
  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 1,
      variant: 'default',
      dials: {},
      slot: 'gallery',
      content: {
        heading: { text: 'What people say' },
        items: [{ body: 'A great experience.' }],
        image: { id: assetName, src: `/assets/${assetName}`, alt: 'Logo' },
      },
    },
  ]
  home.l1.root.children.push({ kind: 'slot', name: 'gallery' })
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

describe('story-c46abfa6 — the asset store tells the truth (BUG-44)', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-c46abfa6-truth-'))
    cmdNew(SLUG, { cwd })
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC2010_reading_an_asset_answers_for_anything_listed_by_id_or_handle', async () => {
    // A file no definition has ever mentioned — the state an upload leaves.
    seedAssets(cwd, SLUG, { 'client-logo.png': 'bytes:logo', 'body.woff2': 'bytes:font' })

    const listed = await cli(cwd, 'asset', 'list', SLUG)
    expect(listed.ok).toBe(true)
    const entry = entriesOf(listed).find((a) => a.id === 'client-logo.png')!
    expect(entry).toBeDefined()

    // By its id — the listing's first column.
    const byId = await cli(cwd, 'asset', 'get', SLUG, entry.id)
    expect(byId.ok).toBe(true)
    expect(byId.data!.asset).toEqual(entry)

    // By its handle — the form a page's picture element holds.
    const byHandle = await cli(cwd, 'asset', 'get', SLUG, entry.src)
    expect(entry.src).toBe('/assets/client-logo.png')
    expect(byHandle.ok).toBe(true)
    expect(byHandle.data!.asset).toEqual(entry)

    // Every listed asset answers the same way, field for field.
    for (const a of entriesOf(listed)) {
      expect((await cli(cwd, 'asset', 'get', SLUG, a.id)).data!.asset).toEqual(a)
    }

    // A name the store does not hold is NOT_FOUND, pointing back at the listing.
    const missing = await cli(cwd, 'asset', 'get', SLUG, 'nope.png')
    expect(missing.ok).toBe(false)
    expect(missing.exitCode).not.toBe(0)
    expect(missing.error!.code).toBe('NOT_FOUND')
    expect(missing.error!.hint).toMatch(/asset list/)
  })

  it('test_UAT_AC2011_add_draw_and_remove_write_bytes_never_the_definition_and_are_journalled', async () => {
    referenceFromComponent(cwd, SLUG, 'held.png')
    seedAssets(cwd, SLUG, { 'held.png': 'bytes:held', 'loose.png': 'bytes:loose' })
    const definition = snapshotDefinition(cwd, SLUG)
    expect(definition.has('site.json')).toBe(true)

    const source = path.join(cwd, 'logo.png')
    writeFileSync(source, 'bytes:operator-logo')

    // ── add ──
    let before = await journal(cwd, SLUG)
    const added = await cli(cwd, 'asset', 'add', SLUG, source)
    expect(added.ok).toBe(true)
    expect(readAssetBytes(cwd, SLUG, 'logo.png')).toBe('bytes:operator-logo')
    expect(snapshotDefinition(cwd, SLUG)).toEqual(definition)
    let after = await journal(cwd, SLUG)
    expect(after.now).toBe(before.now + 1)
    expect(after.changes.at(-1)!.label).toBe('logo.png')

    // A second add under a held name: conflict, store unchanged, remedy named.
    writeFileSync(source, 'bytes:different')
    before = after
    const again = await cli(cwd, 'asset', 'add', SLUG, source)
    expect(again.ok).toBe(false)
    expect(again.error!.code).toBe('CONFLICT')
    expect(again.error!.hint).toMatch(/different name/i)
    expect(again.error!.hint).toMatch(/--as/)
    expect(readAssetBytes(cwd, SLUG, 'logo.png')).toBe('bytes:operator-logo')
    expect((await journal(cwd, SLUG)).now).toBe(before.now)

    // ── draw ──
    before = await journal(cwd, SLUG)
    const drawn = await cli(cwd, 'asset', 'write', SLUG, 'mark', '--content', DRAWING)
    expect(drawn.ok).toBe(true)
    expect(readAssetBytes(cwd, SLUG, 'mark.svg')).toBe(DRAWING)
    expect(snapshotDefinition(cwd, SLUG)).toEqual(definition)
    after = await journal(cwd, SLUG)
    expect(after.now).toBe(before.now + 1)
    expect(after.changes.at(-1)!.label).toBe('mark.svg')

    // A second draw without replacement: conflict, bytes unchanged.
    const redraw = await cli(cwd, 'asset', 'write', SLUG, 'mark', '--content', REDRAWING)
    expect(redraw.ok).toBe(false)
    expect(redraw.error!.code).toBe('CONFLICT')
    expect(readAssetBytes(cwd, SLUG, 'mark.svg')).toBe(DRAWING)

    // With replacement asked for, the bytes are replaced.
    const replaced = await cli(cwd, 'asset', 'write', SLUG, 'mark', '--content', REDRAWING, '--force')
    expect(replaced.ok).toBe(true)
    expect(readAssetBytes(cwd, SLUG, 'mark.svg')).toBe(REDRAWING)
    expect(snapshotDefinition(cwd, SLUG)).toEqual(definition)

    // ── remove ──
    before = await journal(cwd, SLUG)
    const removed = await cli(cwd, 'asset', 'rm', SLUG, 'loose.png')
    expect(removed.ok).toBe(true)
    expect(readAssetBytes(cwd, SLUG, 'loose.png')).toBeNull()
    expect(snapshotDefinition(cwd, SLUG)).toEqual(definition)
    after = await journal(cwd, SLUG)
    expect(after.now).toBe(before.now + 1)
    expect(after.changes.at(-1)!.label).toBe('loose.png')

    // A name the store does not hold: NOT_FOUND.
    const gone = await cli(cwd, 'asset', 'rm', SLUG, 'loose.png')
    expect(gone.ok).toBe(false)
    expect(gone.error!.code).toBe('NOT_FOUND')

    // An asset a component field references: refused, naming page/component/field.
    const blocked = await cli(cwd, 'asset', 'rm', SLUG, 'held.png')
    expect(blocked.ok).toBe(false)
    expect(blocked.error!.code).toBe('REFERENTIAL_INTEGRITY')
    expect(blocked.error!.message).toContain('home')
    expect(blocked.error!.message).toContain('gallery')
    expect(blocked.error!.message).toContain('image')
    expect(readAssetBytes(cwd, SLUG, 'held.png')).toBe('bytes:held')

    // Forced: removed, with the left-over reference count reported.
    const forced = await cli(cwd, 'asset', 'rm', SLUG, 'held.png', '--force')
    expect(forced.ok).toBe(true)
    expect(forced.data!.referencesIgnored).toBe(1)
    expect(readAssetBytes(cwd, SLUG, 'held.png')).toBeNull()
    expect(snapshotDefinition(cwd, SLUG)).toEqual(definition)
  })

  it('test_UAT_AC2009_a_definition_validates_with_or_without_the_retired_assets_key_and_nothing_reads_it', async () => {
    seedAssets(cwd, SLUG, { 'hero.png': 'bytes:hero' })
    const siteJsonPath = draftPath(cwd, SLUG, 'site.json')
    const site = JSON.parse(readFileSync(siteJsonPath, 'utf8'))
    const homePage = JSON.parse(readFileSync(draftPath(cwd, SLUG, 'pages', 'home.json'), 'utf8'))
    delete site.assets

    // The listing and a read, for the site WITHOUT the key.
    const listedWithout = await cli(cwd, 'asset', 'list', SLUG)
    const ghostWithout = await cli(cwd, 'asset', 'get', SLUG, 'ghost.png')
    const heroWithout = await cli(cwd, 'asset', 'get', SLUG, 'hero.png')

    // Validation: without, with an empty legacy key, and with a populated one.
    const assembled = { ...site, pages: [homePage] }
    expect(validateSite(assembled).ok).toBe(true)
    expect(validateSite({ ...assembled, assets: [] }).ok).toBe(true)
    const legacy = [
      { id: 'ghost', src: 'ghost.png', alt: 'Declared, never uploaded' },
      { id: 'hero', src: 'hero.png', alt: 'Alt text the registry once held' },
    ]
    expect(validateSite({ ...assembled, assets: legacy }).ok).toBe(true)

    // Now store the definition carrying the legacy key and ask again.
    writeFileSync(siteJsonPath, JSON.stringify({ ...site, assets: legacy }, null, 2))
    const listedWith = await cli(cwd, 'asset', 'list', SLUG)
    const ghostWith = await cli(cwd, 'asset', 'get', SLUG, 'ghost.png')
    const heroWith = await cli(cwd, 'asset', 'get', SLUG, 'hero.png')

    // Accepted, not refused — and the answers are exactly the same.
    expect(listedWith.ok).toBe(true)
    expect(listedWith.data).toEqual(listedWithout.data)
    expect(entriesOf(listedWith).map((a) => a.id)).toEqual(['hero.png'])
    expect(ghostWith.ok).toBe(false)
    expect(ghostWith.error!.code).toBe('NOT_FOUND')
    expect(ghostWith.error).toEqual(ghostWithout.error)
    expect(heroWith.ok).toBe(true)
    expect(heroWith.data).toEqual(heroWithout.data)
    expect(heroWith.data!.asset).not.toHaveProperty('alt')
  })

  it('test_UAT_AC2013_an_asset_reference_is_still_accepted_in_a_background_and_a_layer_child', () => {
    const site = JSON.parse(readFileSync(draftPath(cwd, SLUG, 'site.json'), 'utf8'))
    const ref = { id: 'hero.png', src: '/assets/hero.png', alt: 'The hero', focalPoint: { x: 0.5, y: 0.3 } }
    const section = {
      id: 'banner',
      type: 'hero',
      version: 1,
      variant: 'centered',
      dials: {},
      content: { heading: 'Welcome' },
      background: { type: 'image', asset: ref, fit: 'cover' },
      layer: {
        children: [{ kind: 'image', asset: ref, position: { x: 10, y: 20, z: 1 } }],
      },
    }
    const definition = {
      ...site,
      pages: [{ id: 'page-home', slug: 'home', title: 'Home', modules: [section] }],
    }
    delete definition.assets

    const result = validateSite(definition)
    expect(result.ok, JSON.stringify(result.ok ? null : result.errors)).toBe(true)
    if (!result.ok) return
    const module = result.value.pages[0].modules[0]
    expect(module.background).toEqual({ type: 'image', asset: ref, fit: 'cover' })
    expect(module.layer!.children[0]).toMatchObject({ kind: 'image', asset: ref })

    // Still the asset-reference SHAPE: one missing its required field is refused.
    const broken = structuredClone(definition)
    delete (broken.pages[0].modules[0].background.asset as Record<string, unknown>).alt
    expect(validateSite(broken).ok).toBe(false)
  })
})

describe('story-c46abfa6 — the declared control surface tells the truth about assets', () => {
  interface Operation {
    op: string
    summary: string
    description?: string
    params?: Record<string, { description?: string }>
  }
  interface Declaration {
    operations: Operation[]
    absences: Array<{ name: string; note: string }>
    param_types: Record<string, { description?: string }>
  }
  const declaration = l1Surface as unknown as Declaration
  const operation = (op: string): Operation => {
    const found = declaration.operations.find((o) => o.op === op)
    if (!found) throw new Error(`no operation '${op}' in the declaration`)
    return found
  }

  it('test_UAT_AC2012_the_surface_offers_no_alt_on_assets_and_never_makes_registration_a_precondition', () => {
    // Adding and drawing offer no alt-text parameter.
    expect(operation('add_asset').params ?? {}).not.toHaveProperty('alt')
    expect(operation('write_image').params ?? {}).not.toHaveProperty('alt')
    // Reading disclaims alt text and says where it lives.
    const get = `${operation('get_asset').summary}\n${operation('get_asset').description ?? ''}`
    expect(get).toMatch(/does not carry alt text/i)
    expect(get).toMatch(/picture element/i)

    // No operation description, parameter description or absence presents
    // registration (or any step but writing a handle) as a precondition.
    const texts: string[] = []
    for (const o of declaration.operations) {
      texts.push(o.summary, o.description ?? '')
      for (const p of Object.values(o.params ?? {})) texts.push(p.description ?? '')
    }
    for (const t of Object.values(declaration.param_types)) texts.push(t.description ?? '')
    for (const a of declaration.absences) texts.push(a.name, a.note)
    const all = texts.join('\n')
    expect(all).not.toMatch(/regist(er|ered|ration|ry)/i)
    expect(`${operation('list_assets').description}`).toMatch(/no separate step/i)

    // The file absence: its title, the ask, the warning, and the description pointer.
    const absence = declaration.absences.find((a) => a.name === 'Fetching a picture, or any file, yourself')
    expect(absence).toBeDefined()
    const note = absence!.note
    expect(note).toMatch(/cannot go and get a file/i)
    expect(note).toMatch(/drop/i)
    expect(note).toMatch(/Site asset/)
    expect(note).toMatch(/Do not send anyone to a separate asset manager or builder screen/i)
    expect(note).toMatch(/description/i)
    expect(note).toMatch(/held with the material it came from/i)
    expect(note).toMatch(/write it onto the element/i)
  })
})
