import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { cmdNew, cmdPublish, cmdRender, run, startBuilder } from '../tools/generate/src/cli'
import type { BuilderHandle } from '../tools/generate/src/cli'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * story-37a3921b — **image selection as the second half of the copy-edit write
 * path**, not a second mechanism.
 *
 * Everything here drives `1c copy get|set` and `POST /api/copy`: there is no
 * image command and no image route to exercise, which is the story's central
 * claim. What an image adds is entirely in *what a region answers when asked
 * which fields it exposes* — a closed list of the site's images beside the alt
 * text — so that is what these measure, together with the properties the upgrade
 * widened from "a copy edit" to "any edit through this surface".
 *
 * Real entry points only, nothing internal stubbed:
 *
 * - the **command line** through `run(argv)` — argv in, an `{ok,data}` /
 *   `{ok,error}` envelope and a process exit code out;
 * - the **builder origin** over HTTP through `startBuilder`, so "the same
 *   surface, not a parallel implementation" is asserted about bytes on the wire;
 * - the **bytes on disk** — the draft page document, the rendered channels and
 *   the site's asset files — for every claim about what an edit did or did not
 *   change.
 */

/** The handles the seeded site's images are referenced by, in `enum` order. */
const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const LOGO = '/assets/logo.svg'
/** Every image the site can offer — sorted, deduplicated, images only. */
const SITE_IMAGES = [BETA, HERO, LOGO]
/** A handle the capture fold could not mirror: a real value, on no disk. */
const REMOTE = 'https://cdn.example.com/offsite.jpg'
/** A handle that is safe and well-formed but names nothing the site has. */
const ABSENT = '/assets/nowhere.png'

const HERO_ALT = 'The hero'
/** Long enough that a single-line control would hide most of it. */
const OFFSITE_ALT =
  'An offsite photograph the capture could not mirror into the site assets, described at length so the control able to show it in full is asked for.'
const SHORT_COPY = 'A painted band.'
/** A second run, so a violation can be planted somewhere no edit under test touches. */
const DECOY_COPY = 'A second line, never edited here.'
const SLIDE_ONE = 'The first slide.'

/**
 * What a real site's `draft/assets/` holds: images beside the fonts and
 * stylesheets a capture mirrors. The non-images are the fixture's point — both
 * are real assets, and neither is anything an `image.src` can point at.
 */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'body.woff2': 'bytes:font',
  'site.css': 'body{}',
}

// Addresses, as the edit render stamps them (`data-l1-path`).
// The root wrapper — a region exposing nothing. It paints no surface, so it is
// neither outlined nor editable. The painted container at '0.0' held this role
// until REQ-140 gave it its background colour.
const A_BARE_WRAPPER = '0'
const A_COPY = '0.0.0'
const A_DECOY = '0.0.1'
const A_IMAGE = '0.1' // the hero image, carrying an id and presentation axes
const A_OFFSITE = '0.2' // an image whose handle no file mirrors
const A_MODULE = '0.3' // the behavior-module instance's region
/** Rooted in the carousel instance's repeated `slide` slot. */
const A_SLIDE = '0'

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

const homeJsonPath = (cwd: string): string => draftPath(cwd, 'acme', 'pages', 'home.json')

/**
 * One site carrying every case this surface has to answer for: a painted
 * container and a module instance (regions exposing nothing), a run of copy, an
 * image with an id and presentation axes, an image pointing at a handle the
 * asset store never mirrored, and copy inside a behavior module's slot.
 *
 * The registry declares `beta` by its BARE filename while the directory holds
 * the same byte — two sources naming one handle, so a duplicated option would
 * show up in the picker if the listing ever stopped merging them.
 */
function seedSite(cwd: string, slug: string): void {
  mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }

  const siteJson = draftPath(cwd, slug, 'site.json')
  const base = JSON.parse(readFileSync(siteJson, 'utf8'))
  base.assets = [{ id: 'beta', src: 'beta.png', alt: 'The beta image' }]
  writeFileSync(siteJson, JSON.stringify(base, null, 2))

  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      // [0.0] a painted container — a real region with nothing to edit.
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: '#101822' },
        children: [
          { kind: 'text', text: SHORT_COPY, axes: { fontSizePx: 32 } }, // [0.0.0]
          { kind: 'text', text: DECOY_COPY, axes: { fontSizePx: 18 } }, // [0.0.1]
        ],
      },
      // [0.1] the image under test. `id` and `axes` are what "nothing else
      // changed" is measured against — a framing parameter would live there.
      { kind: 'image', id: 'hero-img', src: HERO, alt: HERO_ALT, axes: { objectFit: 'cover' } },
      // [0.2] an image whose handle the asset store holds no file for.
      { kind: 'image', src: REMOTE, alt: OFFSITE_ALT }, // [0.2]
      // [0.3] the seam the behavior module mounts into.
      { kind: 'slot', name: 'gallery' },
    ],
  }
  home.l1.root = root
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: { slide: [{ kind: 'text', text: SLIDE_ONE }] },
    },
  ]
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  required?: boolean
  widget?: string
  min?: number
  max?: number
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
  /** Everything the command printed, in order — the human report when not `--json`. */
  output: string
}

/**
 * Drive the real `1c` entry point. `run` reads the working directory from the
 * process, so the test supplies one the way a shell would, and restores it —
 * along with the exit code the command set — before returning.
 */
async function invoke(cwd: string, argv: string[], json: boolean): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run(json ? [...argv, '--json'] : argv)
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  const output = out.join('\n')
  if (!json) return { ok: exitCode === 0, exitCode, output }
  const envelope = JSON.parse(out[out.length - 1]) as Omit<CliResult, 'exitCode' | 'output'>
  return { ...envelope, exitCode, output }
}

/** The machine-readable invocation — the shape an AI or an editor host drives. */
const cli = (cwd: string, ...argv: string[]): Promise<CliResult> => invoke(cwd, argv, true)
/** The same command in its human report mode. */
const cliHuman = (cwd: string, ...argv: string[]): Promise<CliResult> => invoke(cwd, argv, false)

/** The argv for a `copy set` with a JSON change map. */
function setArgs(addr: string, values: unknown, scope?: { module: string; slot?: string }): string[] {
  return [
    'copy',
    'set',
    'acme',
    'home',
    addr,
    ...(scope ? ['--module', scope.module] : []),
    ...(scope?.slot ? ['--slot', scope.slot] : []),
    '--values',
    JSON.stringify(values),
  ]
}

const readFields = async (cwd: string, ...rest: string[]): Promise<CliResult> =>
  cli(cwd, 'copy', 'get', 'acme', 'home', ...rest)

/** The draft page document, byte for byte — the thing a failed edit must not touch. */
const draftBytes = (cwd: string): string => readFileSync(homeJsonPath(cwd), 'utf8')

/**
 * A rendered channel's document, as the builder's iframe would receive it.
 *
 * REQ-119 renders the draft-side channels on request, so there is no artifact on
 * disk to read and the origin IS the observable — which is the stronger one
 * anyway: it is the bytes the operator's browser is shown.
 */
const servedBytes = async (builder: BuilderHandle, channel: 'edit' | 'draft'): Promise<string> =>
  (await fetch(new URL(`/preview/acme/${channel}/`, builder.url))).text()

/** The addressed node, read out of the draft definition by page-rooted address. */
function draftNode(cwd: string, addr: string): Record<string, unknown> {
  const page = JSON.parse(draftBytes(cwd))
  let node = page.l1.root as Record<string, unknown>
  for (const i of addr.split('.').slice(1)) {
    node = (node.children as Record<string, unknown>[])[Number(i)]
  }
  return node
}

/** Every asset file's bytes, size and mtime — the "nothing is baked" witness. */
function assetFingerprint(cwd: string): Record<string, string> {
  const dir = draftPath(cwd, 'acme', 'assets')
  const out: Record<string, string> = {}
  for (const name of readdirSync(dir).sort()) {
    const st = statSync(path.join(dir, name))
    out[name] = `${readFileSync(path.join(dir, name), 'utf8')}|${st.size}|${st.mtimeMs}`
  }
  return out
}

/** The field descriptors of a read, by name. */
const fieldNamed = (result: CliResult, name: string): Field =>
  (result.data!.fields as Field[]).find((f) => f.name === name)!

describe('story-37a3921b — image selection through the copy-edit write path', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-image-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── what a region exposes ──────────────────────────────────────────────────

  it('test_UAT_AC1024_an_image_region_exposes_a_closed_list_of_the_sites_images_and_its_alt_text', async () => {
    // AC-1024 — through the SAME "what does this region expose" operation a run
    // of copy is read by, an image answers with which image goes there and its
    // alt text, in that order and first. REQ-136 put the picture's framing after
    // them (as REQ-135 did for a run's typography), so the claim is the pair and
    // its ORDER — the modal opens into the picker, and that depends on it — not
    // that the pair is the whole list.
    const got = await readFields(cwd, A_IMAGE)
    expect(got.ok).toBe(true)
    expect(got.data!.kind).toBe('image')
    const fields = got.data!.fields as Field[]
    expect(fields.map((f) => f.name).slice(0, 2)).toEqual(['src', 'alt'])

    // Which image goes here: a closed list, carried with the field itself, and
    // the field must hold a value.
    const src = fieldNamed(got, 'src')
    expect(src).toMatchObject({ label: 'Image', type: 'enum', required: true })
    expect(Array.isArray(src.enum)).toBe(true)

    // Narrowed to images. A font file and a stylesheet are real assets of this
    // site and are nothing an image region can point at, so neither is offered.
    expect(src.enum).toEqual(SITE_IMAGES)
    expect(src.enum).not.toContain('/assets/body.woff2')
    expect(src.enum).not.toContain('/assets/site.css')
    // Free of duplicates, though `beta` is named by BOTH the registry and the
    // directory, and in a stable order across reads.
    expect(new Set(src.enum).size).toBe(src.enum!.length)
    expect(src.enum).toEqual([...src.enum!].sort())
    expect((await readFields(cwd, A_IMAGE)).data!.fields).toEqual(fields)

    // Its alt text: a plain-text field, under the same multi-line rule copy uses.
    expect(fieldNamed(got, 'alt')).toEqual({ name: 'alt', label: 'Alt text', type: 'string' })
    const offsite = await readFields(cwd, A_OFFSITE)
    expect(fieldNamed(offsite, 'alt')).toEqual({
      name: 'alt',
      label: 'Alt text',
      type: 'string',
      widget: 'textarea',
    })

    // The current values are the handle and alt text as they stand in the draft.
    // `toMatchObject` since REQ-136 put the picture's framing in the same values
    // map. The claim is the picker's own two values, not that they are all of them.
    expect(got.data!.values).toMatchObject({ src: HERO, alt: HERO_ALT })
    expect(draftNode(cwd, A_IMAGE)).toMatchObject({ src: HERO, alt: HERO_ALT })

    // AFTER THE PAIR COMES HOW THE PICTURE IS SEEN — and every one of those is a
    // CLOSED control: a bounded whole number carrying both its bounds, or a pick
    // from a non-empty list of the words that parameter itself admits. Not one is
    // a free-form string, which is the load-bearing property rather than a
    // stylistic one: nothing on this surface can express a length, a colour
    // function or a path, so widening what an operator can SAY here never widens
    // what a caller can SMUGGLE through it (DOC-2).
    const framing = fields.slice(2)
    expect(framing.length).toBeGreaterThan(0)
    for (const field of framing) {
      expect(['integer', 'enum'], field.name).toContain(field.type)
      if (field.type === 'integer') {
        expect(field.min, field.name).toBeTypeOf('number')
        expect(field.max, field.name).toBeTypeOf('number')
      } else {
        expect(Array.isArray(field.enum), field.name).toBe(true)
        expect(field.enum!.length, field.name).toBeGreaterThan(0)
      }
    }
    // The sweep saw BOTH shapes, so neither branch above passed vacuously.
    expect(framing.some((f) => f.type === 'integer')).toBe(true)
    expect(framing.some((f) => f.type === 'enum')).toBe(true)

    // And the origin answers the identical thing — one derivation, two ways in.
    await withOrigin(cwd, async (builder) => {
      const body = (await (
        await fetch(new URL(`/api/copy?slug=acme&page=home&path=${A_IMAGE}`, builder.url))
      ).json()) as Record<string, unknown>
      expect(body.fields).toEqual(fields)
      expect(body.values).toEqual(got.data!.values)
    })
  })

  it('test_UAT_AC1025_a_regions_current_image_is_always_among_the_choices_it_offers', async () => {
    // AC-1025 — a folded reproduction can hold a handle the asset store never
    // mirrored. It must still be a legitimate choice: a chooser whose options
    // omit its own value presents the FIRST option as selected, so an operator
    // who opened the form only to fix the alt text would silently swap the image.
    expect(readdirSync(draftPath(cwd, 'acme', 'assets'))).not.toContain('offsite.jpg')

    const got = await readFields(cwd, A_OFFSITE)
    expect(got.ok).toBe(true)
    const src = fieldNamed(got, 'src')
    expect(src.enum).toContain(REMOTE)
    expect(src.enum).toEqual([...SITE_IMAGES, REMOTE].sort())
    // The reported current value IS that handle, so a chooser opens on it.
    expect((got.data!.values as Record<string, string>).src).toBe(REMOTE)

    // The consequence the rule exists for: an alt-text-only save leaves the
    // region pointing exactly where it did.
    const saved = await cli(cwd, ...setArgs(A_OFFSITE, { alt: 'Still offsite.' }))
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['alt'])
    expect(draftNode(cwd, A_OFFSITE)).toMatchObject({ src: REMOTE, alt: 'Still offsite.' })
  })

  it('test_UAT_AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list', async () => {
    // AC-981 — "there is nothing to edit here" is a property of the region,
    // decided once by the surface's own derivation, not a check every caller has
    // to remember. It is a success, not a failure or a missing region.
    for (const addr of [A_BARE_WRAPPER, A_MODULE]) {
      const got = await readFields(cwd, addr)
      expect(got.ok, addr).toBe(true)
      expect(got.exitCode, addr).toBe(0)
      expect(got.data!.fields, addr).toEqual([])
      expect(got.error, addr).toBeUndefined()

      // And it SAYS so, rather than reporting an absence the host must interpret.
      const human = await cliHuman(cwd, 'copy', 'get', 'acme', 'home', addr)
      expect(human.exitCode, addr).toBe(0)
      expect(human.output, addr).toContain('no editable copy')
    }

    // The contrasts that make the empty list meaningful, on the same page and
    // through the same operation: a copy region answers with its words, and an
    // image region with two fields — an image is emphatically NOT a region that
    // exposes nothing, because it exposes which image goes there and its alt
    // text. The copy side is asserted as NON-EMPTY rather than as one field:
    // REQ-135 put the run's typography beside its words, and EMPTY-versus-NOT is
    // the contrast this AC is drawing.
    const copyFields = (await readFields(cwd, A_COPY)).data!.fields as Field[]
    expect(copyFields.length).toBeGreaterThan(0)
    expect(copyFields.map((f) => f.name)).toContain('text')
    // The image side is asserted the same way and for the same reason (REQ-136
    // put its framing beside its handle): EMPTY-versus-NOT is the contrast.
    const image = await readFields(cwd, A_IMAGE)
    expect((image.data!.fields as Field[]).length).toBeGreaterThan(0)
    expect((image.data!.fields as Field[]).map((f) => f.name).slice(0, 2)).toEqual(['src', 'alt'])
  })

  // ── writing ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1026_choosing_an_image_updates_the_draft_and_the_rerendered_page_shows_it', async () => {
    // AC-1026 — the loop closes inside one operation: the draft holds the new
    // handle and the rendered page references it, with no further manual step.
    const saved = await cli(cwd, ...setArgs(A_IMAGE, { src: BETA }))
    expect(saved.ok).toBe(true)
    // It reports WHAT changed and WHERE the re-render landed.
    expect(saved.data!.changed).toEqual(['src'])
    expect(typeof saved.data!.rendered).toBe('string')

    expect(draftNode(cwd, A_IMAGE)).toMatchObject({ src: BETA })
    const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
    expect(html).toContain('assets/beta.png')
    expect(html).not.toContain('assets/hero.png')

    // Submitting the handle it already holds succeeds and says so explicitly,
    // rather than manufacturing a change.
    const again = await cli(cwd, ...setArgs(A_IMAGE, { src: BETA }))
    expect(again.ok).toBe(true)
    expect(again.exitCode).toBe(0)
    expect(again.data!.changed).toEqual([])
    expect((await cliHuman(cwd, ...setArgs(A_IMAGE, { src: BETA }))).output).toContain('No change')

    // A new image and a new alt text chosen together are ONE change, not two:
    // one operation, one modified document, both reported as changed.
    await cmdPublish('acme', { cwd, message: 'base' })
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual([])

    const both = await cli(cwd, ...setArgs(A_IMAGE, { src: LOGO, alt: 'Our mark' }))
    expect(both.ok).toBe(true)
    expect(both.data!.changed).toEqual(['src', 'alt'])
    expect(draftNode(cwd, A_IMAGE)).toMatchObject({ src: LOGO, alt: 'Our mark' })
    const status = await cli(cwd, 'status', 'acme')
    expect(status.data!.modified).toEqual(['pages/home.json'])
    expect(status.data!.added).toEqual([])
    expect(status.data!.removed).toEqual([])

    // Through the builder's origin the same save leaves BOTH renderings current —
    // an edit changes the page, not one rendering of it.
    await withOrigin(cwd, async (builder) => {
      const res = await fetch(new URL('/api/copy', builder.url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'acme', page: 'home', path: A_IMAGE, values: { src: HERO } }),
      })
      expect(res.status).toBe(200)
      expect(((await res.json()) as Record<string, unknown>).changed).toEqual(['src'])
      for (const channel of ['edit', 'draft'] as const) {
        const html = await servedBytes(builder, channel)
        expect(html, channel).toContain('assets/hero.png')
        expect(html, channel).not.toContain('assets/logo.svg')
      }
    })
  })

  it('test_UAT_AC1027_choosing_an_image_bakes_nothing_and_leaves_every_other_parameter_intact', async () => {
    // AC-1027 — choosing an image points the region at a different handle and
    // does nothing else at all. A published base gives `status` something to
    // diff against, so "what did this edit add?" has a countable answer.
    await cmdPublish('acme', { cwd, message: 'base' })
    const filesBefore = readdirSync(draftPath(cwd, 'acme', 'assets')).sort()
    const printBefore = assetFingerprint(cwd)
    const nodeBefore = draftNode(cwd, A_IMAGE)

    expect((await cli(cwd, ...setArgs(A_IMAGE, { src: BETA }))).ok).toBe(true)

    // No file written, copied, resized, converted or processed: every file is
    // byte-for-byte identical (contents, size and mtime alike) and no new file
    // appeared.
    expect(readdirSync(draftPath(cwd, 'acme', 'assets')).sort()).toEqual(filesBefore)
    expect(assetFingerprint(cwd)).toEqual(printBefore)
    const status = await cli(cwd, 'status', 'acme')
    expect(status.data!.added).toEqual([])
    expect(status.data!.removed).toEqual([])
    expect(status.data!.modified).toEqual(['pages/home.json'])

    // And the region differs from its former self in exactly one string. Its id
    // and its presentation axes survive — framing lives exactly there, and
    // nothing about choosing an image may displace it.
    const nodeAfter = draftNode(cwd, A_IMAGE)
    expect(nodeAfter).toEqual({ ...nodeBefore, src: BETA })
    expect(nodeAfter.axes).toEqual({ objectFit: 'cover' })
    expect(nodeAfter.id).toBe('hero-img')
    expect(nodeAfter.alt).toBe(HERO_ALT)

    // AND THE SAME OF ADJUSTING HOW IT IS SEEN — the claim the whole phase rests
    // on, and the half a choice of image alone cannot prove. A framing, a shape
    // and a colour adjustment saved together are structured parameters the
    // renderer applies: nothing is decoded, resized, re-encoded or baked, so one
    // uploaded picture serves any number of framings and no image-processing step
    // exists to be reached. If it were ever implemented by writing a derived
    // file, this is where a new asset would appear.
    const printBeforeFraming = assetFingerprint(cwd)
    const framed = await cli(
      cwd,
      ...setArgs(A_IMAGE, { objectPositionYPct: 20, shape: 'circle', grayscalePct: 100 }),
    )
    expect(framed.ok).toBe(true)
    expect(framed.data!.changed).toEqual(['objectPositionYPct', 'shape', 'grayscalePct'])

    expect(readdirSync(draftPath(cwd, 'acme', 'assets')).sort()).toEqual(filesBefore)
    expect(assetFingerprint(cwd)).toEqual(printBeforeFraming)
    const afterFraming = await cli(cwd, 'status', 'acme')
    expect(afterFraming.data!.added).toEqual([])
    expect(afterFraming.data!.removed).toEqual([])
    expect(afterFraming.data!.modified).toEqual(['pages/home.json'])

    // The adjustment moved how the picture is SEEN and never which picture it is:
    // the region points at the same handle it did before, and everything it
    // carried besides the three parameters named — its id, its alt text and the
    // captured `objectFit` beside them — is untouched.
    const adjusted = draftNode(cwd, A_IMAGE)
    expect(adjusted.src).toBe(BETA)
    expect(adjusted.id).toBe('hero-img')
    expect(adjusted.alt).toBe(HERO_ALT)
    expect(adjusted.axes).toEqual({
      objectFit: 'cover',
      objectPosition: { xPct: 50, yPct: 20 },
      filter: { grayscale: 1 },
    })
    expect(adjusted.mask).toEqual({ shape: 'circle' })
  })

  // ── refusing ───────────────────────────────────────────────────────────────

  it('test_UAT_AC988_an_unknown_field_a_non_text_value_or_a_choice_never_offered_is_refused', async () => {
    // AC-988 — every entry is checked before any is applied, and each of the
    // three refusals names the offending field and writes nothing.
    const before = draftBytes(cwd)

    // (1) A field the addressed region does not expose — the caller resolved
    // against a different region than it is writing to.
    const unknown = await cli(cwd, ...setArgs(A_IMAGE, { headline: 'Not a field here.' }))
    expect(unknown.ok).toBe(false)
    expect(unknown.error!.message).toContain('headline')
    expect(unknown.error!.path).toContain('headline')
    expect(draftBytes(cwd)).toBe(before)

    // (2) A value that is not text.
    for (const value of [42, [], {}] as unknown[]) {
      const label = JSON.stringify(value)
      const bad = await cli(cwd, ...setArgs(A_COPY, { text: value }))
      expect(bad.ok, label).toBe(false)
      expect(bad.error!.code, label).toBe('SCHEMA_INVALID')
      expect(bad.error!.path, label).toContain('text')
      expect(draftBytes(cwd), label).toBe(before)
    }

    // (3) A value for a closed-list field that is not one of its choices. This
    // is the refusal the shared whole-definition validator structurally CANNOT
    // make: `/assets/nowhere.png` is a perfectly well-formed, SAFE handle, so
    // validation would accept it and the page would render a broken image with
    // no error at all. A caller holding a stale asset listing is the realistic
    // source, so membership is checked at the field, server-side.
    expect(fieldNamed(await readFields(cwd, A_IMAGE), 'src').enum).not.toContain(ABSENT)
    const absent = await cli(cwd, ...setArgs(A_IMAGE, { src: ABSENT }))
    expect(absent.ok).toBe(false)
    expect(absent.error!.code).toBe('SCHEMA_INVALID')
    expect(absent.error!.message).toContain('nowhere.png')
    expect(absent.error!.path).toBe(`${A_IMAGE}/src`)
    expect(draftBytes(cwd)).toBe(before)
    // The region still points at the image it did before.
    expect(draftNode(cwd, A_IMAGE)).toMatchObject({ src: HERO })

    // A real asset of the wrong kind was never an option either, and neither is
    // a hostile scheme — refused at the field, before the envelope's allowlist.
    for (const src of ['/assets/body.woff2', 'javascript:alert(1)']) {
      const refused = await cli(cwd, ...setArgs(A_IMAGE, { src }))
      expect(refused.ok, src).toBe(false)
      expect(refused.error!.path, src).toBe(`${A_IMAGE}/src`)
      expect(draftBytes(cwd), src).toBe(before)
    }

    // Every existing value is intact after all of it. `toMatchObject` rather
    // than `toEqual` since REQ-136: the values map now also reports how the
    // picture is framed, and the claim here is that the two a refusal could have
    // damaged are unchanged.
    const still = await readFields(cwd, A_IMAGE)
    expect(still.data!.values).toMatchObject({ src: HERO, alt: HERO_ALT })
    expect((await readFields(cwd, A_COPY)).data!.values).toMatchObject({ text: SHORT_COPY })
  })

  it('test_UAT_AC986_any_edit_is_validated_over_the_whole_resulting_definition', async () => {
    // AC-986 — asserted by CONSEQUENCE, not by inspection: break a part of the
    // page no edit under test touches, past what only whole-definition
    // validation sees, and BOTH a copy edit and an image edit refuse for exactly
    // the reason an unrelated structured edit on the same site does. Neither
    // could do that if it validated only what it touched, or ran a validator of
    // its own. 9999px clears the schema's shape check and fails the L1
    // envelope's range, so only `validateL1` over the document catches it.
    const page = JSON.parse(draftBytes(cwd))
    page.l1.root.children[0].children[1].axes.fontSizePx = 9999
    writeFileSync(homeJsonPath(cwd), JSON.stringify(page, null, 2))
    const before = draftBytes(cwd)

    // The edits touch [0.0.0] and [0.1]; the violation is at [0.0.1].
    expect(A_DECOY).not.toBe(A_COPY)
    const copy = await cli(cwd, ...setArgs(A_COPY, { text: 'Untouched by this attempt.' }))
    const image = await cli(cwd, ...setArgs(A_IMAGE, { src: BETA }))
    const other = await cli(cwd, 'config', 'set', 'acme', 'displayName', 'Acme')

    for (const [label, result] of [
      ['copy set', copy],
      ['image set', image],
      ['config set', other],
    ] as const) {
      expect(result.ok, label).toBe(false)
      expect(result.error!.message, label).toContain('fontSizePx')
    }
    // The same validator, so the same fault — code, message and path alike.
    for (const [label, result] of [
      ['copy set', copy],
      ['image set', image],
    ] as const) {
      expect(result.error!.code, label).toBe(other.error!.code)
      expect(result.error!.message, label).toBe(other.error!.message)
      expect(result.error!.path, label).toBe(other.error!.path)
    }

    expect(draftBytes(cwd)).toBe(before)
  })

  // ── the shape of the surface ───────────────────────────────────────────────

  it('test_UAT_AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied', async () => {
    // AC-991 — "there is no raw-editing mode" is a property of the surface's
    // shape, not a rule it has to enforce. There are exactly two shapes of field
    // and neither can carry code.
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    const beforeDoc = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8')).window.document
    const scriptsBefore = beforeDoc.querySelectorAll('script').length
    const stylesBefore = beforeDoc.querySelectorAll('style').length

    const payload = '<script>alert(1)</script><style>*{display:none}</style><b>bold?</b>'

    // A plain-text field, in a run of copy and in an image region's alt text.
    expect((await cli(cwd, ...setArgs(A_COPY, { text: payload }))).ok).toBe(true)
    const saved = await cli(cwd, ...setArgs(A_IMAGE, { alt: payload }))
    expect(saved.ok).toBe(true)

    const doc = new JSDOM(
      readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8'),
    ).window.document

    // The copy region's LITERAL words: one leaf element whose text is the payload.
    const el = [...doc.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === payload,
    )
    expect(el, "the payload renders as one region's text").toBeTruthy()
    expect(el!.getAttribute('data-l1-segment')).toBe('copy')
    // And the alt text carries it verbatim, as an attribute value.
    const img = doc.querySelector(`[data-l1-path="${A_IMAGE}"]`)!
    expect(img.getAttribute('alt')).toBe(payload)

    // Neither created an element nor applied a style.
    expect(doc.querySelectorAll('script').length).toBe(scriptsBefore)
    expect(doc.querySelectorAll('style').length).toBe(stylesBefore)
    expect(
      [...doc.querySelectorAll('script')].some((s) => s.textContent?.includes('alert(1)')),
    ).toBe(false)
    expect(
      [...doc.querySelectorAll('style')].some((s) => s.textContent?.includes('*{display:none}')),
    ).toBe(false)
    expect(doc.querySelector('b')).toBeNull()

    // And no descriptor this surface emits could have carried markup as code in
    // the first place: read EVERY region the render stamps, and every offered
    // field is either plain text or a closed list — with the closed list always
    // carrying the values it will accept, so it can only return one of them.
    const pageRooted = [...doc.querySelectorAll('[data-l1-path]')]
      .filter((n) => n.closest('[data-fc-module]') === null)
      .map((n) => n.getAttribute('data-l1-path')!)
    expect(pageRooted.length).toBeGreaterThan(0)

    const reads = [
      ...pageRooted.map((addr) => ['copy', 'get', 'acme', 'home', addr]),
      ['copy', 'get', 'acme', 'home', A_SLIDE, '--module', 'gallery', '--slot', 'slide'],
    ]
    let plain = 0
    let closed = 0
    for (const argv of reads) {
      const got = await cli(cwd, ...argv)
      expect(got.ok, argv.join(' ')).toBe(true)
      for (const field of got.data!.fields as Field[]) {
        // REQ-135 widened the set with a bounded number and a bit — both
        // narrower than a string, so the surface is not widened with it.
        // REQ-140's colour is narrower still: it admits only a reference into a
        // palette the site itself declares.
        expect(['string', 'enum', 'integer', 'boolean', 'color'], argv.join(' ')).toContain(
          field.type,
        )
        if (field.type === 'enum') {
          expect(Array.isArray(field.enum), argv.join(' ')).toBe(true)
          expect(field.enum!.length, argv.join(' ')).toBeGreaterThan(0)
          closed += 1
        } else {
          plain += 1
        }
      }
    }
    // The sweep actually saw both shapes — an all-empty page would prove nothing.
    expect(plain).toBeGreaterThan(0)
    expect(closed).toBeGreaterThan(0)
  })

  // ── the same surface over the builder's origin ─────────────────────────────

  it('test_UAT_AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike', async () => {
    // AC-992 — one endpoint for a change of words and a change of image; there
    // is no separate image route. What it answers matches the command line, a
    // refusal is the CLIENT's fault carrying the validator's own words, and a
    // save leaves both renderings current.
    await withOrigin(cwd, async (builder) => {
      const get = (p: string) => fetch(new URL(p, builder.url))
      const post = (body: unknown) =>
        fetch(new URL('/api/copy', builder.url), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })

      // Reading is the same read — for a run of copy AND for an image, whose
      // option list rides the very same call, so a chooser costs no extra round
      // trip and cannot present an option the write path would reject.
      for (const addr of [A_COPY, A_IMAGE]) {
        const body = (await (
          await get(`/api/copy?slug=acme&page=home&path=${addr}`)
        ).json()) as Record<string, unknown>
        const fromCli = await readFields(cwd, addr)
        expect(body.fields, addr).toEqual(fromCli.data!.fields)
        expect(body.values, addr).toEqual(fromCli.data!.values)
      }
      expect(
        (
          (
            (await (await get(`/api/copy?slug=acme&page=home&path=${A_IMAGE}`)).json()) as {
              fields: Field[]
            }
          ).fields.find((f) => f.name === 'src')
        )!.enum,
      ).toEqual(SITE_IMAGES)

      // A refusal is a CLIENT fault, of each kind, carrying the same code, path
      // and hint the command line reports — never a generic server failure that
      // throws away the message naming the field.
      const rejections: Array<[string, Record<string, unknown>, string[]]> = [
        ['words', { text: 42 }, setArgs(A_COPY, { text: 42 })],
        ['image', { src: ABSENT }, setArgs(A_IMAGE, { src: ABSENT })],
      ]
      for (const [label, values, argv] of rejections) {
        const before = draftBytes(cwd)
        const addr = label === 'words' ? A_COPY : A_IMAGE
        const res = await post({ slug: 'acme', page: 'home', path: addr, values })
        expect(res.status, label).toBeGreaterThanOrEqual(400)
        expect(res.status, label).toBeLessThan(500)
        const body = (await res.json()) as Record<string, unknown>
        const refusal = await cli(cwd, ...argv)
        expect(refusal.ok, label).toBe(false)
        expect(body.code, label).toBe(refusal.error!.code)
        expect(body.path, label).toBe(refusal.error!.path)
        expect(body.hint, label).toBe(refusal.error!.hint)
        expect(body.message, label).toBe(refusal.error!.message)
        // The offending field is named in the fault, and nothing was written.
        expect(String(body.path), label).toContain(label === 'words' ? 'text' : 'src')
        expect(draftBytes(cwd), label).toBe(before)
      }

      // A valid edit of each kind: both the editable and the plain draft
      // renderings reflect it, with no render step in between.
      const words = 'Saved through the origin.'
      expect((await post({ slug: 'acme', page: 'home', path: A_COPY, values: { text: words } })).status).toBe(200)
      expect((await post({ slug: 'acme', page: 'home', path: A_IMAGE, values: { src: BETA } })).status).toBe(200)

      for (const channel of ['edit', 'draft'] as const) {
        const html = await servedBytes(builder, channel)
        expect(html, channel).toContain(words)
        expect(html, channel).not.toContain(SHORT_COPY)
        expect(html, channel).toContain('assets/beta.png')
        expect(html, channel).not.toContain('assets/hero.png')
      }
    })
  })
})

/**
 * Run `fn` against a live builder origin over the site already seeded in `cwd`.
 *
 * No pre-render: since REQ-119 the origin renders each draft-side channel from
 * the definition when it is asked for one, so "a save leaves both current" is
 * measured against whatever the definition says at that moment rather than
 * against an artifact someone had to remember to refresh.
 */
async function withOrigin(cwd: string, fn: (builder: BuilderHandle) => Promise<void>): Promise<void> {
  const builder = await startBuilder({ cwd })
  try {
    await fn(builder)
  } finally {
    await builder.close()
  }
}
