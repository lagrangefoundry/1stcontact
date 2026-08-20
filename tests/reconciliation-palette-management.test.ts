/**
 * story-ee073693 — **palette management**: read the site's colours with their
 * usage counts, and change, add, remove or rename them under guards the store
 * enforces.
 *
 * REAL EVERYTHING. The site is a real draft on disk, the reads and writes go
 * through the real `1c` entry point (`run`), the real builder origin
 * (`startBuilder`) and the real assistant Toolbox (`createL1Toolbox`), and the
 * rendered evidence comes from the real render path (`cmdRender`). The colour
 * arithmetic is imported from the module the renderer itself resolves through —
 * a second copy of it here would only prove the test agrees with itself.
 *
 * WHAT THE SUITE IS SHAPED TO CATCH.
 *
 *  - **The census is the load-bearing fact.** The fixture references one entry
 *    at three different positions in its family (plain, darker, lighter+alpha)
 *    and spreads another across two pages, so a census that counted only
 *    unshaded references, or only the first page, reports a different number
 *    here rather than passing quietly.
 *  - **One walk, one number.** The count reported before a rename, the count the
 *    rename reports rewriting, and the references actually in the files
 *    afterwards are asserted to be the same number.
 *  - **The guards are the store's, not a control's.** Every refusal is posted
 *    directly at the origin with no client in the way, because a stale tab is
 *    exactly the caller the rule exists to refuse — and the draft is compared
 *    byte-for-byte afterwards, so no partially-applied state can hide.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import {
  createL1Toolbox,
  L1_DECLARATION,
  l1Operations,
} from '../tools/generate/src/cli/ai/toolbox'
import { resolveL1Color } from '../packages/site-schema/src/l1/palette'
import { fsOpts } from './support/site-factory'
import type { L1Node } from '@1stcontact/site-schema'

/** The palette every fixture site carries. `spare` is declared and never used. */
const PALETTE = {
  primary: { value: '#2e86a3' },
  text: { value: '#1f2937' },
  surface: { value: '#fffef8' },
  spare: { value: '#7b3f61' },
}

/** Positions far enough from zero to move bytes, and not round numbers. */
const DARKER = -0.42
const LIGHTER = 0.31
/** Transparency on a *use* — the axis an entry deliberately cannot carry. */
const ALPHA = 0.55

/** The hex a reference paints, through the renderer's own resolution. */
function paint(entryHex: string, shade?: number, alpha?: number): string {
  return resolveL1Color({ ref: 'x', ...(shade === undefined ? {} : { shade }), ...(alpha === undefined ? {} : { alpha }) }, { x: { value: entryHex } })
}

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
}

const siteFile = (cwd: string, slug: string) => draftPath(cwd, slug, 'site.json')
const pageFile = (cwd: string, slug: string, name: string) =>
  draftPath(cwd, slug, 'pages', `${name}.json`)

const readText = (file: string) => fs.readFileSync(file, 'utf8')
const readSite = (cwd: string, slug: string) =>
  JSON.parse(readText(siteFile(cwd, slug))) as Record<string, unknown>

/** Every byte of the definition — `site.json` and every page, in a stable order. */
function draftBytes(cwd: string, slug: string): Record<string, string> {
  const pages = draftPath(cwd, slug, 'pages')
  const out: Record<string, string> = { 'site.json': readText(siteFile(cwd, slug)) }
  for (const name of fs.readdirSync(pages).sort()) out[name] = readText(path.join(pages, name))
  return out
}

/** References naming `entry` across every page file, counted in the written bytes. */
function refsInFiles(cwd: string, slug: string, entry: string): number {
  const pages = draftPath(cwd, slug, 'pages')
  let total = 0
  for (const name of fs.readdirSync(pages)) {
    const matches = readText(path.join(pages, name)).match(
      new RegExp(`"ref":\\s*"${entry}"`, 'g'),
    )
    total += matches?.length ?? 0
  }
  return total
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code?: string; message?: string; hint?: string }
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope out. */
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
  const envelope = JSON.parse(out.join('\n')) as Omit<CliResult, 'exitCode'>
  return { ...envelope, exitCode: Number(process.exitCode ?? 0) }
}

/** Entries as the read reports them, in the read's own sorted order. */
type Entry = { name: string; value: string; count: number }
const entriesOf = (result: CliResult) => result.data!.entries as Entry[]
const countOf = (entries: Entry[], name: string) => entries.find((e) => e.name === name)?.count

/**
 * A site whose references sit at three positions in one entry's family and
 * spread another entry across two pages.
 *
 * That spread is the fixture's whole point: a census counting only unshaded
 * references would say `primary` is used once, and one counting only the first
 * page would say `text` is used once. Both are the bugs the single structural
 * walk over the document and every page exists to prevent.
 */
async function seedSite(cwd: string, slug: string): Promise<void> {
  cmdNew(slug, { cwd })

  const base = readSite(cwd, slug)
  base.palette = PALETTE
  fs.writeFileSync(siteFile(cwd, slug), `${JSON.stringify(base, null, 2)}\n`)

  const home = JSON.parse(readText(pageFile(cwd, slug, 'home'))) as Record<string, unknown>
  const homeRoot: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: { ref: 'surface' } },
    children: [
      { kind: 'text', id: 'a', text: 'Plain primary.', axes: { color: { ref: 'primary' } } },
      {
        kind: 'text',
        id: 'b',
        text: 'Darker primary.',
        axes: { color: { ref: 'primary', shade: DARKER } },
      },
      {
        kind: 'text',
        id: 'c',
        text: 'Lighter, translucent primary.',
        axes: { color: { ref: 'primary', shade: LIGHTER, alpha: ALPHA } },
      },
      { kind: 'text', id: 'd', text: 'Body copy.', axes: { color: { ref: 'text' } } },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root: homeRoot }
  fs.writeFileSync(pageFile(cwd, slug, 'home'), `${JSON.stringify(home, null, 2)}\n`)

  // A SECOND page, added through the real command, referencing `text` once more.
  // "Every page" is otherwise indistinguishable from "the first page".
  const added = await cli(cwd, 'page', 'add', slug, 'about')
  if (!added.ok) throw new Error(`seed failed to add a second page: ${added.error?.message}`)

  const about = JSON.parse(readText(pageFile(cwd, slug, 'about'))) as Record<string, unknown>
  about.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [{ kind: 'text', id: 'e', text: 'About us.', axes: { color: { ref: 'text' } } }],
    } as L1Node,
  }
  fs.writeFileSync(pageFile(cwd, slug, 'about'), `${JSON.stringify(about, null, 2)}\n`)
}

/** The rendered draft home page — the bytes an operator actually looks at. */
async function renderedHome(cwd: string, slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, edit: false })
  return readText(path.join(outDir, 'index.html'))
}

describe('story-ee073693 palette management', () => {
  let cwd: string

  beforeAll(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-palette-'))
  })

  afterAll(() => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  // ── AC-1229: the read ──────────────────────────────────────────────────────

  it('test_UAT_AC1229_read_answers_every_entry_with_its_count_across_the_definition_and_every_page', async () => {
    const slug = 'census'
    await seedSite(cwd, slug)

    const read = await cli(cwd, 'palette', 'get', slug)
    expect(read.ok).toBe(true)

    // Every declared entry, its colour, and how many places reference it.
    expect(entriesOf(read)).toEqual([
      { name: 'primary', value: '#2e86a3', count: 3 },
      { name: 'spare', value: '#7b3f61', count: 0 },
      { name: 'surface', value: '#fffef8', count: 1 },
      { name: 'text', value: '#1f2937', count: 2 },
    ])

    // `primary` is used three times at THREE DIFFERENT POSITIONS in its family —
    // plain, darker, and lighter-with-transparency. A census that counted a
    // reference only at shade zero would report 1 here.
    expect(countOf(entriesOf(read), 'primary')).toBe(3)

    // `text` is used once per page across TWO pages, so the count is the whole
    // site's total rather than a per-page tally.
    expect(countOf(entriesOf(read), 'text')).toBe(2)
    expect(refsInFiles(cwd, slug, 'text')).toBe(2)

    // The unreferenced entry is REPORTED AT ZERO, not omitted — zero is the
    // delete rule's entire subject, so it is the one count that must be
    // reportable.
    expect(entriesOf(read).map((e) => e.name)).toContain('spare')
    expect(countOf(entriesOf(read), 'spare')).toBe(0)

    // A site declaring no palette is a legitimate state, and reads as an empty
    // palette that says so — not an error, not a failure.
    cmdNew('unpainted', { cwd })
    const empty = await cli(cwd, 'palette', 'get', 'unpainted')
    expect(empty.ok).toBe(true)
    expect(empty.exitCode).toBe(0)
    expect(empty.data!.entries).toEqual([])
  })

  // ── AC-1230: changing a colour ─────────────────────────────────────────────

  it('test_UAT_AC1230_changing_an_entry_repaints_every_use_at_every_position_touching_no_page', async () => {
    const slug = 'repaint'
    await seedSite(cwd, slug)

    const before = await renderedHome(cwd, slug)
    const uses: Array<[number | undefined, number | undefined]> = [
      [undefined, undefined],
      [DARKER, undefined],
      [LIGHTER, ALPHA],
    ]
    for (const [shade, alpha] of uses) {
      expect(before).toContain(paint(PALETTE.primary.value, shade, alpha))
    }

    const pagesBefore = draftBytes(cwd, slug)
    const NEW = '#a33b12'
    const write = await cli(cwd, 'palette', 'set', slug, 'primary', NEW)
    expect(write.ok).toBe(true)

    // ONE EDIT, AND THE WHOLE FAMILY FOLLOWS. The shaded and translucent uses are
    // the ones that could have been left behind: under a stored-steps model they
    // were separate hexes, and changing the base left them at the old colour.
    const after = await renderedHome(cwd, slug)
    for (const [shade, alpha] of uses) {
      expect(after).toContain(paint(NEW, shade, alpha))
      expect(after).not.toContain(paint(PALETTE.primary.value, shade, alpha))
    }
    // And nothing else moved.
    expect(after).toContain(PALETTE.text.value)

    // NO PAGE IS REWRITTEN — only the palette entry moves. Every use reads
    // through the entry, so repainting them is not something this write has to
    // implement.
    const pagesAfter = draftBytes(cwd, slug)
    expect(pagesAfter['home.json']).toBe(pagesBefore['home.json'])
    expect(pagesAfter['about.json']).toBe(pagesBefore['about.json'])
    expect(pagesAfter['site.json']).not.toBe(pagesBefore['site.json'])

    // The answer says how much it repainted.
    expect(write.data!.count).toBe(3)
    expect(write.data!.value).toBe(NEW)

    // Naming an entry the palette does not declare is NOT FOUND, names the site
    // and the entry, and writes nothing.
    const captured = draftBytes(cwd, slug)
    const missing = await cli(cwd, 'palette', 'set', slug, 'nonesuch', '#010203')
    expect(missing.ok).toBe(false)
    expect(missing.error?.code).toBe('NOT_FOUND')
    expect(missing.error?.message).toContain(slug)
    expect(missing.error?.message).toContain('nonesuch')
    expect(draftBytes(cwd, slug)).toEqual(captured)
  })

  // ── AC-1231: adding ────────────────────────────────────────────────────────

  it('test_UAT_AC1231_adding_an_entry_makes_it_usable_and_refuses_a_duplicate_bad_name_or_transparency', async () => {
    const slug = 'adding'
    await seedSite(cwd, slug)

    const added = await cli(cwd, 'palette', 'add', slug, 'brand-teal', '#0f766e')
    expect(added.ok).toBe(true)

    // Immediately part of the palette, at a count of zero.
    const read = await cli(cwd, 'palette', 'get', slug)
    expect(entriesOf(read)).toContainEqual({ name: 'brand-teal', value: '#0f766e', count: 0 })

    // ...and immediately REFERENCEABLE: a page pointed at it validates and
    // renders, which is what "part of the palette" has to mean.
    const home = JSON.parse(readText(pageFile(cwd, slug, 'home'))) as Record<string, unknown>
    const l1 = home.l1 as { root: { children: L1Node[] } }
    l1.root.children[0].axes = { color: { ref: 'brand-teal' } }
    fs.writeFileSync(pageFile(cwd, slug, 'home'), `${JSON.stringify(home, null, 2)}\n`)
    expect(await renderedHome(cwd, slug)).toContain('#0f766e')
    expect(countOf(entriesOf(await cli(cwd, 'palette', 'get', slug)), 'brand-teal')).toBe(1)

    // Each refusal states its reason AND leaves the definition byte-unchanged.
    const captured = draftBytes(cwd, slug)

    const duplicate = await cli(cwd, 'palette', 'add', slug, 'brand-teal', '#123456')
    expect(duplicate.ok).toBe(false)
    expect(duplicate.error?.code).toBe('CONFLICT')
    expect(duplicate.error?.message).toMatch(/already has a palette color 'brand-teal'/)

    const malformed = await cli(cwd, 'palette', 'add', slug, 'Brand Teal', '#123456')
    expect(malformed.ok).toBe(false)
    expect(malformed.error?.code).toBe('SCHEMA_INVALID')
    expect(malformed.error?.hint).toMatch(/kebab-case/i)

    // An 8-digit hex carries transparency, and transparency is a property of a
    // USE: an entry carrying it would make one conceptual colour occupy N entries.
    const translucent = await cli(cwd, 'palette', 'add', slug, 'ghost', '#12345680')
    expect(translucent.ok).toBe(false)
    expect(translucent.error?.code).toBe('SCHEMA_INVALID')
    expect(`${translucent.error?.message} ${translucent.error?.hint}`).toMatch(/translucen/i)

    expect(draftBytes(cwd, slug)).toEqual(captured)
  })

  // ── AC-1232: removing what nothing uses ────────────────────────────────────

  it('test_UAT_AC1232_removing_an_unreferenced_entry_succeeds_and_leaves_every_other_entry_untouched', async () => {
    const slug = 'removing'
    await seedSite(cwd, slug)

    const before = entriesOf(await cli(cwd, 'palette', 'get', slug)).filter(
      (e) => e.name !== 'spare',
    )

    const removed = await cli(cwd, 'palette', 'rm', slug, 'spare')
    expect(removed.ok).toBe(true)
    expect(removed.data!.removed).toBe(true)
    expect(removed.data!.name).toBe('spare')

    // Gone from the next read, and every other entry keeps its colour AND its
    // count — a removal is not an occasion for anything else to move.
    const after = entriesOf(await cli(cwd, 'palette', 'get', slug))
    expect(after.map((e) => e.name)).not.toContain('spare')
    expect(after).toEqual(before)
    expect(Object.keys(readSite(cwd, slug).palette as object)).not.toContain('spare')

    // The site still validates and renders.
    const html = await renderedHome(cwd, slug)
    expect(html).toContain(paint(PALETTE.primary.value, DARKER))
    expect(html.length).toBeGreaterThan(0)
  })

  // ── AC-1234: rename is total ───────────────────────────────────────────────

  it('test_UAT_AC1234_rename_moves_the_key_in_place_and_rewrites_every_reference_in_one_write', async () => {
    const slug = 'rename-total'
    await seedSite(cwd, slug)

    const before = await renderedHome(cwd, slug)
    const orderBefore = Object.keys(readSite(cwd, slug).palette as object)
    expect(orderBefore).toEqual(['primary', 'text', 'surface', 'spare'])

    const renamed = await cli(cwd, 'palette', 'rename', slug, 'primary', 'brand')
    expect(renamed.ok).toBe(true)

    // The palette declares the new name and not the old one.
    const palette = readSite(cwd, slug).palette as Record<string, { value: string }>
    expect(Object.keys(palette)).toContain('brand')
    expect(Object.keys(palette)).not.toContain('primary')
    expect(palette.brand.value).toBe(PALETTE.primary.value)

    // The key moved IN PLACE, so a palette an operator arranged keeps that
    // arrangement rather than having the renamed entry re-appended at the end.
    expect(Object.keys(palette)).toEqual(['brand', 'text', 'surface', 'spare'])

    // No reference to the old name survives ANYWHERE, and the new name carries
    // exactly the count the old one had.
    expect(refsInFiles(cwd, slug, 'primary')).toBe(0)
    expect(refsInFiles(cwd, slug, 'brand')).toBe(3)
    expect(readText(siteFile(cwd, slug))).not.toMatch(/"ref":\s*"primary"/)

    // POSITION AND TRANSPARENCY SURVIVE EXACTLY. Only which entry a reference
    // names changes — a shade and an alpha are properties of the use and say
    // nothing about the entry's name.
    const home = JSON.parse(readText(pageFile(cwd, slug, 'home'))) as {
      l1: { root: { children: { axes?: { color?: { ref: string; shade?: number; alpha?: number } } }[] } }
    }
    const brandRefs = home.l1.root.children
      .map((c) => c.axes?.color)
      .filter((c) => c?.ref === 'brand')
    expect(brandRefs).toEqual([
      { ref: 'brand' },
      { ref: 'brand', shade: DARKER },
      { ref: 'brand', shade: LIGHTER, alpha: ALPHA },
    ])

    // The site still validates and renders BYTE-IDENTICALLY. Nothing about how it
    // looks was supposed to change.
    expect(await renderedHome(cwd, slug)).toBe(before)
  })

  // ── AC-1236: one walk, one number ──────────────────────────────────────────

  it('test_UAT_AC1236_the_count_read_before_a_rename_is_the_count_it_reports_and_the_references_rewritten', async () => {
    const slug = 'one-walk'
    await seedSite(cwd, slug)

    // The count REPORTED BEFORE, on a site whose references to `primary` sit at
    // three different positions in its family — the case where two independently
    // maintained traversals would disagree.
    const shown = countOf(entriesOf(await cli(cwd, 'palette', 'get', slug)), 'primary')

    // The count the rename REPORTS REWRITING.
    const renamed = await cli(cwd, 'palette', 'rename', slug, 'primary', 'brand')
    expect(renamed.ok).toBe(true)
    const reported = renamed.data!.count as number

    // The references ACTUALLY PRESENT in the written files afterwards.
    const actual = refsInFiles(cwd, slug, 'brand')

    expect(shown).toBe(3)
    expect([shown, reported, actual]).toEqual([3, 3, 3])
    expect(reported).toBe(shown)
    expect(actual).toBe(shown)
  })

  /**
   * The criteria whose subject is the ORIGIN — the guards posted at with no
   * client in the way, and the channels served after a write.
   *
   * Grouped behind their own origin so the criteria that need no socket are not
   * held hostage to one: a sandbox that forbids `listen` fails these four and
   * leaves the rest reporting on their own terms.
   */
  describe('through the builder origin', () => {
    let builder: BuilderHandle

    const origin = (rel: string) => new URL(rel, builder.url).toString()
    const post = (body: Record<string, unknown>) =>
      fetch(origin('/api/palette'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    beforeAll(async () => {
      builder = await startBuilder({ cwd })
    }, 120000)

    afterAll(async () => {
      await builder?.close()
    })

    // ── AC-1233: removing what is in use ─────────────────────────────────────

    it('test_UAT_AC1233_removing_a_referenced_entry_is_refused_naming_the_count_and_cannot_be_overridden', async () => {
      const slug = 'remove-guard'
      await seedSite(cwd, slug)
      const captured = draftBytes(cwd, slug)

      // POSTED DIRECTLY AT THE ORIGIN, with no client-side check in the way —
      // exactly as a tab left open while the site changed underneath it would
      // post. A disabled button is an explanation of the rule; never the rule.
      const refused = await post({ slug, op: 'rm', name: 'primary' })
      expect(refused.status).toBe(400)
      expect(refused.status).toBeLessThan(500)
      const body = (await refused.json()) as { code?: string; message?: string; hint?: string }
      expect(body.code).toBe('CONFLICT')

      // The refusal NAMES THE COUNT, in the same number the read reports...
      expect(body.message).toMatch(/used 3 times and cannot be deleted/)
      expect(countOf(entriesOf(await cli(cwd, 'palette', 'get', slug)), 'primary')).toBe(3)
      // ...and states the next step: deciding what each use becomes comes first.
      expect(`${body.message} ${body.hint}`).toMatch(/deciding what each use becomes/)

      // Nothing moved: the entry and all three references are still there.
      expect(draftBytes(cwd, slug)).toEqual(captured)
      expect(Object.keys(readSite(cwd, slug).palette as object)).toContain('primary')
      expect(refsInFiles(cwd, slug, 'primary')).toBe(3)

      // And there is NO OVERRIDE. An orphaned reference is a validation failure
      // rather than a fallback, so a force flag would be a one-keystroke route
      // to an invalid site.
      const fromCli = await cli(cwd, 'palette', 'rm', slug, 'primary')
      expect(fromCli.ok).toBe(false)
      expect(fromCli.error?.code).toBe('CONFLICT')

      const forced = await cli(cwd, 'palette', 'rm', slug, 'primary', '--force')
      expect(forced.ok).toBe(false)

      expect(draftBytes(cwd, slug)).toEqual(captured)
    })

    // ── AC-1235: rename's refusals ───────────────────────────────────────────

    it('test_UAT_AC1235_rename_onto_an_existing_or_malformed_name_is_refused_leaving_the_draft_byte_unchanged', async () => {
      const slug = 'rename-guard'
      await seedSite(cwd, slug)
      const captured = draftBytes(cwd, slug)

      // Onto a name the palette already declares — that would MERGE two colours,
      // the same class of decision as deleting one in use.
      const collision = await post({ slug, op: 'rename', name: 'primary', to: 'text' })
      expect(collision.status).toBe(400)
      const conflict = (await collision.json()) as {
        code?: string
        message?: string
        hint?: string
      }
      expect(conflict.code).toBe('CONFLICT')
      expect(conflict.message).toMatch(/already has a palette color 'text'/)
      expect(`${conflict.message} ${conflict.hint}`).toMatch(/merge two colors/)

      // Onto a name that is not kebab-case — a schema refusal naming the form.
      const malformed = await post({ slug, op: 'rename', name: 'primary', to: 'Brand Teal' })
      expect(malformed.status).toBe(400)
      const schema = (await malformed.json()) as { code?: string; hint?: string }
      expect(schema.code).toBe('SCHEMA_INVALID')
      expect(schema.hint).toMatch(/kebab-case/i)

      // NO PARTIALLY-RENAMED STATE IS REACHABLE. Both halves of a rename are
      // validated before either is written, so after either refusal the site
      // definition AND every page are byte-identical to what they were: the key
      // did not move and no reference was rewritten.
      expect(draftBytes(cwd, slug)).toEqual(captured)
      expect(refsInFiles(cwd, slug, 'primary')).toBe(3)
    })

  // ── AC-1237: the origin ────────────────────────────────────────────────────

  it('test_UAT_AC1237_the_origin_answers_alike_under_a_closed_vocabulary_and_returns_the_retaken_census', async () => {
    const slug = 'origin'
    await seedSite(cwd, slug)

    // The origin read is the command-line read — a transport over the same
    // function, not a parallel implementation.
    const viaHttp = await (await fetch(origin(`/api/palette?slug=${slug}`))).json()
    expect(viaHttp).toEqual((await cli(cwd, 'palette', 'get', slug)).data)

    // ...and it requires the site to be named.
    expect((await fetch(origin('/api/palette'))).status).toBe(400)

    // The operation vocabulary is CLOSED: an undeclared verb is a client error
    // naming the operation, not an exception rendered as a server failure.
    const undeclared = await post({ slug, op: 'merge', name: 'primary' })
    expect(undeclared.status).toBe(400)
    expect(undeclared.status).toBeLessThan(500)
    expect(((await undeclared.json()) as { error?: string }).error).toContain('merge')

    // EVERY WRITE ANSWERS WITH THE RE-TAKEN CENSUS as well as its own result, so
    // a caller redrawing the palette does so from what the site now holds rather
    // than from its own guess at what changed.
    const write = (await post({ slug, op: 'add', name: 'accent', value: '#8b5c2a' })) as Response
    expect(write.status).toBe(200)
    const answer = (await write.json()) as Record<string, unknown> & { entries: Entry[] }
    // the operation's own result...
    expect(answer.name).toBe('accent')
    expect(answer.value).toBe('#8b5c2a')
    // ...and the whole list of entries with their counts as they now stand.
    expect(answer.entries).toEqual([
      { name: 'accent', value: '#8b5c2a', count: 0 },
      { name: 'primary', value: '#2e86a3', count: 3 },
      { name: 'spare', value: '#7b3f61', count: 0 },
      { name: 'surface', value: '#fffef8', count: 1 },
      { name: 'text', value: '#1f2937', count: 2 },
    ])
    // A removal changes the LIST and a rename changes a NAME and no count — the
    // caller needs neither to know which, because it is handed both.
    const dropped = (await (await post({ slug, op: 'rm', name: 'accent' })).json()) as {
      removed?: boolean
      entries: Entry[]
    }
    expect(dropped.removed).toBe(true)
    expect(dropped.entries.map((e) => e.name)).not.toContain('accent')

    const moved = (await (
      await post({ slug, op: 'rename', name: 'spare', to: 'reserve' })
    ).json()) as { from?: string; to?: string; entries: Entry[] }
    expect([moved.from, moved.to]).toEqual(['spare', 'reserve'])
    expect(moved.entries.map((e) => e.name)).toContain('reserve')

    // The SAME four writes are available from the command line, each reporting
    // the result of the operation.
    const cliSlug = 'origin-cli'
    await seedSite(cwd, cliSlug)
    expect((await cli(cwd, 'palette', 'add', cliSlug, 'accent', '#8b5c2a')).data!.value).toBe(
      '#8b5c2a',
    )
    expect((await cli(cwd, 'palette', 'set', cliSlug, 'accent', '#7a4f24')).data!.value).toBe(
      '#7a4f24',
    )
    expect((await cli(cwd, 'palette', 'rename', cliSlug, 'accent', 'highlight')).data!.to).toBe(
      'highlight',
    )
    expect((await cli(cwd, 'palette', 'rm', cliSlug, 'highlight')).data!.removed).toBe(true)
    expect(Object.keys(readSite(cwd, cliSlug).palette as object)).toEqual([
      'primary',
      'text',
      'surface',
      'spare',
    ])
  })

  // ── AC-1238: nothing to keep in step ───────────────────────────────────────

  it('test_UAT_AC1238_a_write_needs_no_rebuild_because_both_draft_side_channels_render_on_request', async () => {
    const slug = 'no-rebuild'
    await seedSite(cwd, slug)

    const NEW = '#123456'
    const write = await cli(cwd, 'palette', 'set', slug, 'primary', NEW)
    expect(write.ok).toBe(true)

    // WITH NO OTHER COMMAND IN BETWEEN — no rebuild, no refresh step — the very
    // next request for either draft-side channel serves the new colour, because
    // both render the definition at request time. There is no build artifact left
    // for the write to have to keep in step.
    for (const channel of ['draft', 'edit']) {
      const html = await (await fetch(origin(`/preview/${slug}/${channel}/`))).text()
      expect(html, channel).toContain(paint(NEW, DARKER))
      expect(html, channel).toContain(paint(NEW, LIGHTER, ALPHA))
      expect(html, channel).not.toContain(paint(PALETTE.primary.value, DARKER))
      expect(html, channel).not.toContain(PALETTE.primary.value)
    }
  })
  })

  // ── AC-1239: the assistant ─────────────────────────────────────────────────

  it('test_UAT_AC1239_the_assistant_is_offered_the_read_and_the_four_writes_in_one_grantable_group', async () => {
    const slug = 'assistant'
    await seedSite(cwd, slug)

    interface Group {
      group: string
      effect: string
      operations: string[]
    }
    interface Operation {
      op: string
      tool: string
      effect: string
    }
    const groups = L1_DECLARATION.groups as Group[]
    const operations = L1_DECLARATION.operations as Operation[]

    const READ = 'get_palette'
    const WRITES = [
      'set_palette_color',
      'add_palette_color',
      'remove_palette_color',
      'rename_palette_color',
    ]
    const ALL = [READ, ...WRITES]

    // ALL FIVE OPERATIONS ARE DECLARED and every one is actually implemented —
    // a declared operation with no method is a capability nothing can reach.
    const callable = Object.keys(l1Operations(slug, fsOpts(cwd)))
    for (const tool of ALL) {
      expect(operations.map((o) => o.tool), tool).toContain(tool)
      expect(callable, tool).toContain(tool)
    }

    // The read is classified as a read and sits in the grant carrying the site's
    // other reads; the four writes are classified as writes and sit in ONE
    // grantable group of their own, so palette editing can be granted or
    // withheld independently of every other write group.
    expect(operations.find((o) => o.tool === READ)!.effect).toBe('read')
    for (const tool of WRITES) {
      expect(operations.find((o) => o.tool === tool)!.effect, tool).toBe('write')
    }
    const readGroup = groups.filter((g) => g.operations.includes(READ))
    expect(readGroup.map((g) => g.group)).toEqual(['ReadSite'])
    expect(readGroup[0].effect).toBe('read')

    const writeGroups = new Set(
      WRITES.map((tool) => groups.find((g) => g.operations.includes(tool))!.group),
    )
    expect([...writeGroups]).toEqual(['ManagePalette'])
    expect(groups.find((g) => g.group === 'ManagePalette')!.effect).toBe('write')

    // EVERY ONE OF THE FIVE BELONGS TO EXACTLY ONE grantable group.
    for (const tool of ALL) {
      expect(groups.filter((g) => g.operations.includes(tool)).map((g) => g.group), tool).toHaveLength(1)
    }

    // ── a session GRANTED the palette writes ─────────────────────────────────
    interface Toolbox {
      run: (tool: string, input: Record<string, unknown>) => unknown
      toolNames: () => string[]
    }
    const ask = async (box: Toolbox, tool: string, input: Record<string, unknown>) => {
      const out = await box.run(tool, input)
      return typeof out === 'string' ? out : JSON.stringify(out)
    }

    const granted: Toolbox = await createL1Toolbox(slug, { cwd })
    for (const tool of ALL) expect(granted.toolNames(), tool).toContain(tool)

    // It can change, add, rename and remove — and the site definition moves
    // exactly as it does from the command line.
    await ask(granted, 'add_palette_color', { name: 'accent', color: '#8b5c2a' })
    expect(readSite(cwd, slug).palette).toHaveProperty('accent')

    await ask(granted, 'set_palette_color', { name: 'accent', color: '#7a4f24' })
    expect((readSite(cwd, slug).palette as Record<string, { value: string }>).accent.value).toBe(
      '#7a4f24',
    )

    await ask(granted, 'rename_palette_color', { name: 'accent', to: 'highlight' })
    expect(Object.keys(readSite(cwd, slug).palette as object)).toContain('highlight')
    expect(Object.keys(readSite(cwd, slug).palette as object)).not.toContain('accent')

    await ask(granted, 'remove_palette_color', { name: 'highlight' })
    expect(Object.keys(readSite(cwd, slug).palette as object)).not.toContain('highlight')

    // AND IT MEETS THE SAME REFUSALS AN OPERATOR DOES — the guards live where the
    // write happens, so they hold for the assistant exactly as for the CLI.
    const captured = draftBytes(cwd, slug)

    const inUse = await ask(granted, 'remove_palette_color', { name: 'primary' })
    const cliInUse = await cli(cwd, 'palette', 'rm', slug, 'primary')
    expect(cliInUse.error?.code).toBe('CONFLICT')
    expect(inUse).toContain('CONFLICT')
    // ...and the removal refusal NAMES THE COUNT, in the same number the read
    // reports. This is the half of the refusal that turns "no" into a next step:
    // the operator is told to ask the assistant precisely because the assistant
    // can talk the choice through, and it cannot do that without knowing how many
    // uses are at stake. Soft so the rest of the criterion still reports.
    expect.soft(inUse).toContain(cliInUse.error!.message!)
    expect.soft(inUse).toMatch(/used 3 times and cannot be deleted/)

    // A rename onto an existing name is refused as a COLLISION.
    const collision = await ask(granted, 'rename_palette_color', { name: 'primary', to: 'text' })
    const cliCollision = await cli(cwd, 'palette', 'rename', slug, 'primary', 'text')
    expect(cliCollision.error?.code).toBe('CONFLICT')
    expect(collision).toContain('CONFLICT')

    expect(draftBytes(cwd, slug)).toEqual(captured)

    // ── a session NOT granted the palette writes ─────────────────────────────
    const readOnly: Toolbox = await createL1Toolbox(
      slug,
      { cwd },
      { config: { l1: { groups: ['ReadSite'] } } },
    )
    // The four writes are NOT OFFERED AT ALL — a consumer is never told about a
    // capability it does not have, so it cannot propose one or probe for it.
    for (const tool of WRITES) expect(readOnly.toolNames(), tool).not.toContain(tool)
    // ...and cannot be invoked anyway: effect is gated independently of what is
    // offered.
    const denied = await ask(readOnly, 'set_palette_color', { name: 'primary', color: '#000000' })
    expect(denied).toMatch(/not enabled|no write access/i)
    expect(draftBytes(cwd, slug)).toEqual(captured)

    // While READING THE PALETTE WITH COUNTS STILL WORKS.
    expect(readOnly.toolNames()).toContain(READ)
    const stillReads = await ask(readOnly, READ, {})
    expect(stillReads).toContain('primary')
    expect(stillReads).toMatch(/"count":\s*3|used 3/)
  })
})
