/**
 * REQ-136 phase 1 — **how a picture is seen**, editable from the image segment
 * you clicked: framing, shape and colour adjustment.
 *
 * The editor could change WHICH picture; it could not change how that picture
 * appeared. This adds the controls — and the load-bearing claim of the whole
 * ticket is what it does NOT do: **no operation touches a file.** Every tool
 * writes a typed L1 axis and the renderer applies it, so one uploaded asset
 * serves many framings, an adjustment is an ordinary structured diff with the
 * same validator and undo as any other edit, and no image-decoding pipeline joins
 * the attack surface (DOC-2 / DOC-28 §9.2). AC-1 and AC-7 are the two halves of
 * that claim: the controls are all closed types, and the bytes on disk are
 * untouched.
 *
 * EDITOR/PAGE PARITY IS NOT A FEATURE HERE, IT IS A CONSEQUENCE. The editor's
 * preview *is* the edit render channel (DOC-28 §5.1) — same renderer, same
 * document — so an adjustment expressed as an axis cannot appear one way in the
 * editor and another on the page. AC-8 asserts that rather than assuming it,
 * because the day someone adds a second emitter is the day it stops being true.
 *
 * SHAPED TO FAIL IF THIS BECOMES A SECOND MECHANISM, on the pattern REQ-132/135
 * set: no new command, no new route, no new value vocabulary. The fields still
 * come from `copyFieldsOf`, the write still goes through `copy set` (the same
 * entry point `/api/copy` and the AI drive), and the whole-definition validator
 * still gates the file.
 *
 * THE FIXTURE IS THE AWKWARD SHAPES, NOT THE CONVENIENT ONE. A bare image with no
 * axes at all (does an identity edit invent an empty `axes: {}`?), an image the
 * fold left carrying a *feathered* mask the editor does not offer (does opening
 * it silently square the picture off?), and an image whose radius is the
 * `rounded-full` sentinel the fold clamps (does a bound refuse the status quo?).
 * Each is a way this could quietly do the wrong thing.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, run } from '../tools/generate/src/cli'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { foldFilter, foldObjectPosition } from '../tools/generate/src/l1/fold'

/** A plain image carrying no axes at all — the "invent nothing" fixture. */
const A_PLAIN = '0.0'
/** An image the AI gave a FEATHERED mask: a shape this control does not offer. */
const A_FEATHERED = '0.1'
/** An image whose radius is the pill sentinel — outside the control's range. */
const A_PILL = '0.2'

const draftPath = (cwd: string, slug: string, ...rest: string[]) =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

function seedSite(cwd: string, slug: string): void {
  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'image', id: 'plain', src: '/assets/hero.jpg', alt: 'The hero' },
      {
        kind: 'image',
        id: 'feathered',
        src: '/assets/portrait.jpg',
        alt: 'A portrait',
        // A feather is an EDGE TREATMENT, not one of the geometric shapes the
        // control offers — and the fold and the AI both write them.
        mask: { shape: 'featherBottom', featherPx: 48 },
        // Other axes on purpose: AC-6 claims a framing edit disturbs nothing else,
        // and a node with one axis could not tell "preserved" from "nothing to lose".
        axes: { objectFit: 'cover', surfaceFill: '#101418', opacity: 0.9 },
      },
      {
        kind: 'image',
        id: 'pill',
        src: '/assets/avatar.jpg',
        alt: 'An avatar',
        axes: { borderRadiusPx: 9999 },
      },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  // The trailing newline is the SAME byte the CLI's own writer ends a page with.
  // Without it a no-op save differs from the seed by one character, and the
  // byte-identical assertions below would be measuring the fixture's formatting
  // rather than whether the edit wrote anything.
  fs.writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`)
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string }
  exitCode: number
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

interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  min?: number
  max?: number
}

const WIDTHS = [320, 1280]

/** Validate and render one node, returning the stylesheet it produced. */
function renderNode(node: L1Node, opts: { edit?: boolean } = {}): string {
  const doc: L1Document = { widths: WIDTHS, root: { kind: 'box', children: [node] } }
  const res = validateL1(doc)
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(doc, opts).css
}

/** The declarations of the rule for `class`, as a set of trimmed strings. */
function declsFor(css: string, cls: string): string[] {
  const rule = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(css)
  if (!rule) throw new Error(`no rule for .${cls}`)
  return rule[1]
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
}

describe('REQ-136 — image framing, shape and colour adjustment', () => {
  let cwd: string

  const get = (addr: string) => cli(cwd, 'copy', 'get', 'acme', 'home', addr)
  const set = (addr: string, values: Record<string, unknown>) =>
    cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

  const fieldsOf = async (addr: string): Promise<Field[]> =>
    (await get(addr)).data!.fields as Field[]
  const valuesOf = async (addr: string): Promise<Record<string, unknown>> =>
    (await get(addr)).data!.values as Record<string, unknown>

  /** The draft page file, byte for byte — what a refused edit must not touch. */
  const draftBytes = () => fs.readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8')

  /** The node at a dotted address, out of the draft on disk. */
  function draftNode(addr: string): Record<string, unknown> {
    let node = JSON.parse(draftBytes()).l1.root as Record<string, unknown>
    for (const i of addr.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }

  const axesOf = (addr: string) =>
    (draftNode(addr).axes ?? {}) as Record<string, unknown>

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req136-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  // AC-1 — clicking a picture offers how it is FRAMED, SHAPED and ADJUSTED beside
  // which picture it is; every control is closed (a bounded integer or the axis's
  // own keyword list), so nothing on this surface can express a length, a colour
  // function or a path. That is the exposure rule as a property of the data
  // (DOC-28 §3), not a promise in a comment.
  it('test_UAT_FC_REQ-136_an_image_offers_framing_shape_and_colour_beside_the_picker', async () => {
    const fields = await fieldsOf(A_PLAIN)
    expect(fields.map((f) => f.name)).toEqual([
      'src',
      'alt',
      'objectFit',
      'objectPositionXPct',
      'objectPositionYPct',
      'shape',
      'cornerRadiusPx',
      'rotateDeg',
      'scalePct',
      'brightnessPct',
      'contrastPct',
      'saturatePct',
      'grayscalePct',
      'hueRotateDeg',
      'blurPx',
    ])

    for (const field of fields) {
      expect(['string', 'integer', 'boolean', 'enum']).toContain(field.type)
      if (field.type === 'enum') expect(field.enum!.length).toBeGreaterThan(0)
      if (field.type === 'integer') {
        expect(field.min).toBeTypeOf('number')
        expect(field.max).toBeTypeOf('number')
      }
    }

    // A picture with no axes reads back the values a browser would actually
    // paint — `fill`, dead centre, unrotated, unadjusted — rather than blanks. A
    // control showing nothing for "what is this now" is a control you cannot use.
    expect(await valuesOf(A_PLAIN)).toMatchObject({
      objectFit: 'fill',
      objectPositionXPct: 50,
      objectPositionYPct: 50,
      shape: 'rectangle',
      cornerRadiusPx: 0,
      rotateDeg: 0,
      scalePct: 100,
      brightnessPct: 100,
      saturatePct: 100,
      grayscalePct: 0,
      blurPx: 0,
    })
  })

  // AC-2 — a crop is a PAN, and it lands as a typed pair. Both components or
  // neither: CSS silently defaults an unspecified component to 50%, so a
  // half-written position is a 50% the document never said.
  it('test_UAT_FC_REQ-136_panning_a_picture_writes_a_typed_object_position_pair', async () => {
    const saved = await set(A_PLAIN, { objectPositionYPct: 15 })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['objectPositionYPct'])
    expect(axesOf(A_PLAIN).objectPosition).toEqual({ xPct: 50, yPct: 15 })

    expect(renderNode(draftNode(A_PLAIN) as L1Node)).toContain('object-position: 50% 15%')

    // Back to centre removes the axis rather than recording the browser's own
    // default — a no-op edit must leave no diff behind.
    expect((await set(A_PLAIN, { objectPositionYPct: 50 })).ok).toBe(true)
    expect(axesOf(A_PLAIN).objectPosition).toBeUndefined()
  })

  // AC-3 — colour adjustment lands as CSS-canonical FRACTIONS (what a browser
  // reports, so the capture fold can write what it measured) while the control
  // speaks percentages, and the renderer emits ONE `filter` in a FIXED ORDER.
  // Order is not cosmetic: filter functions compose in sequence, so taking it
  // from an object's key order would let the same axes paint two ways depending
  // on how a file happened to be written.
  it('test_UAT_FC_REQ-136_colour_adjustment_lands_as_fractions_and_renders_in_a_fixed_order', async () => {
    const saved = await set(A_PLAIN, { saturatePct: 40, grayscalePct: 60, brightnessPct: 110 })
    expect(saved.ok).toBe(true)
    expect(axesOf(A_PLAIN).filter).toEqual({ saturate: 0.4, grayscale: 0.6, brightness: 1.1 })

    const decls = declsFor(renderNode(draftNode(A_PLAIN) as L1Node), 'l1-1')
    const filter = decls.find((d) => d.startsWith('filter:'))!
    expect(filter).toBe('filter: grayscale(0.6) saturate(0.4) brightness(1.1)')
    // ONE declaration, never one per function.
    expect(decls.filter((d) => d.startsWith('filter:'))).toHaveLength(1)

    // Each control returned to its identity drops its axis, and emptying the
    // group drops the group — an empty `filter: {}` renders as nothing while
    // reading as something.
    await set(A_PLAIN, { saturatePct: 100, grayscalePct: 0, brightnessPct: 100 })
    expect(axesOf(A_PLAIN).filter).toBeUndefined()
  })

  // AC-4 — the answer to "can this picture be a circle, a rounded rectangle, a
  // parallelogram or a splat": yes, and each is a typed shape the RENDERER turns
  // into geometry. The document names an intent and never a path, so widening the
  // shape vocabulary never widens the attack surface.
  it('test_UAT_FC_REQ-136_a_picture_can_take_a_typed_shape_the_renderer_draws', async () => {
    expect((await set(A_PLAIN, { shape: 'circle' })).ok).toBe(true)
    expect(draftNode(A_PLAIN).mask).toEqual({ shape: 'circle' })
    expect(renderNode(draftNode(A_PLAIN) as L1Node)).toContain('clip-path: circle(50%)')

    // Rounded corners are the SHARED SURFACE's radius, not a mask — the two are
    // independent, so a rounded blob is expressible and neither control clobbers
    // the other.
    expect((await set(A_PLAIN, { cornerRadiusPx: 24 })).ok).toBe(true)
    expect(axesOf(A_PLAIN).borderRadiusPx).toBe(24)
    expect(draftNode(A_PLAIN).mask).toEqual({ shape: 'circle' })

    for (const shape of ['parallelogram', 'blob']) {
      expect((await set(A_PLAIN, { shape })).ok).toBe(true)
      expect(renderNode(draftNode(A_PLAIN) as L1Node)).toMatch(/clip-path: polygon\(/)
    }

    // A BLOB IS RANDOM-LOOKING BUT DETERMINISTIC. A shape that differed between
    // two renders of one document would break round-trip identity (DOC-23 §7) and
    // make the picture twitch on every editor save.
    const blob = (seed: number): string =>
      /clip-path: (polygon\([^)]*\))/.exec(
        renderNode({ kind: 'image', src: '/a.jpg', alt: '', mask: { shape: 'blob', seed } }),
      )![1]
    expect(blob(7)).toBe(blob(7))
    expect(blob(7)).not.toBe(blob(8))

    // Back to a rectangle removes the mask outright.
    expect((await set(A_PLAIN, { shape: 'rectangle' })).ok).toBe(true)
    expect(draftNode(A_PLAIN).mask).toBeUndefined()
  })

  // AC-5 — the shape list carries whatever the node ALREADY holds, even a
  // feathered edge this control does not offer. A select whose options omit its
  // own value renders with the first option selected, so without the union,
  // opening an AI-feathered picture and saving its alt text would silently square
  // it off. The same rule REQ-118's handle list and REQ-135's weight list state.
  it('test_UAT_FC_REQ-136_the_shape_list_carries_a_shape_the_control_does_not_offer', async () => {
    const shape = (await fieldsOf(A_FEATHERED)).find((f) => f.name === 'shape')!
    expect(shape.enum).toEqual([
      'rectangle',
      'circle',
      'ellipse',
      'parallelogram',
      'blob',
      'featherBottom',
    ])
    expect((await valuesOf(A_FEATHERED)).shape).toBe('featherBottom')

    // Re-saving it is a no-op, and the feather's own parameter survives.
    const before = draftBytes()
    const noop = await set(A_FEATHERED, { shape: 'featherBottom', alt: 'A portrait' })
    expect(noop.ok).toBe(true)
    expect(noop.data!.changed).toEqual([])
    expect(draftBytes()).toBe(before)
  })

  // AC-6 — a framing edit changes the axis it names and NOTHING else, and an
  // identity edit on a bare picture invents nothing. The second half is the
  // subtle one: every branch has to look in an axes bag, so creating one to look
  // in it would leave `axes: {}` behind on a node that had none.
  it('test_UAT_FC_REQ-136_a_framing_edit_disturbs_no_other_axis_and_invents_no_empty_bag', async () => {
    await set(A_FEATHERED, { rotateDeg: -8 })
    expect(axesOf(A_FEATHERED)).toEqual({
      objectFit: 'cover',
      surfaceFill: '#101418',
      opacity: 0.9,
    })
    expect(draftNode(A_FEATHERED).transform).toEqual({ rotateDeg: -8 })
    expect(draftNode(A_FEATHERED).mask).toEqual({ shape: 'featherBottom', featherPx: 48 })

    // And un-rotating removes the transform outright rather than leaving `{}`.
    await set(A_FEATHERED, { rotateDeg: 0 })
    expect(draftNode(A_FEATHERED).transform).toBeUndefined()

    const settled = draftBytes()
    const noop = await set(A_PLAIN, {
      objectFit: 'fill',
      objectPositionXPct: 50,
      shape: 'rectangle',
      rotateDeg: 0,
      scalePct: 100,
      saturatePct: 100,
    })
    expect(noop.ok).toBe(true)
    expect(noop.data!.changed).toEqual([])
    expect(draftNode(A_PLAIN).axes).toBeUndefined()
    expect(draftBytes()).toBe(settled)
  })

  // AC-7 — an out-of-range ask is REFUSED, never clamped, and leaves the draft
  // byte-identical; while the bound binds a CHANGE and not the status quo, so a
  // picture the fold clamped to the pill sentinel survives being opened and
  // re-saved. And the whole point of the ticket: none of this touches the asset.
  it('test_UAT_FC_REQ-136_an_out_of_range_ask_is_refused_and_no_edit_touches_the_asset', async () => {
    const before = draftBytes()
    for (const values of [{ saturatePct: 500 }, { objectPositionXPct: 140 }, { scalePct: 1 }]) {
      const refused = await set(A_PLAIN, values)
      expect(refused.ok).toBe(false)
      expect(refused.error!.message).toMatch(/at (most|least)/)
      expect(draftBytes()).toBe(before)
    }

    // The status quo passes regardless — the modal posts every staged field, not
    // only the touched ones.
    expect((await valuesOf(A_PILL)).cornerRadiusPx).toBe(9999)
    const reSaved = await set(A_PILL, { alt: 'Reworded.', cornerRadiusPx: 9999 })
    expect(reSaved.ok).toBe(true)
    expect(reSaved.data!.changed).toEqual(['alt'])

    // THE CLAIM THE WHOLE DESIGN RESTS ON: the picture on disk is untouched by
    // every edit above, and the node still points at the same handle.
    const assets = draftPath(cwd, 'acme', 'assets')
    const listing = fs.existsSync(assets) ? fs.readdirSync(assets).sort() : []
    await set(A_PLAIN, { grayscalePct: 100, rotateDeg: 30, shape: 'circle' })
    expect(fs.existsSync(assets) ? fs.readdirSync(assets).sort() : []).toEqual(listing)
    expect((draftNode(A_PLAIN) as { src: string }).src).toBe('/assets/hero.jpg')
  })

  // AC-8 — PARITY. The editor shows the page's own render, so an adjustment must
  // paint identically in both channels. It is structural — one renderer, one
  // document — and this asserts it rather than assuming it, because the day
  // someone adds a second emitter for drag feedback is the day it can stop being
  // true.
  it('test_UAT_FC_REQ-136_the_edit_render_paints_an_adjustment_exactly_as_the_page_does', async () => {
    await set(A_PLAIN, {
      objectFit: 'cover',
      objectPositionYPct: 20,
      saturatePct: 40,
      rotateDeg: 12,
      shape: 'blob',
    })
    const node = draftNode(A_PLAIN) as L1Node
    const paint = (css: string) =>
      declsFor(css, 'l1-1').filter((d) =>
        /^(object-|filter|clip-path|transform)/.test(d),
      )

    const page = paint(renderNode(node))
    expect(page).toEqual(paint(renderNode(node, { edit: true })))
    // Not vacuously equal: the adjustment really is in there.
    expect(page).toContain('object-position: 50% 20%')
    expect(page).toContain('filter: saturate(0.4)')
  })

  // AC-9 — the same two axes close a REPRODUCTION gap, not only an editor one.
  // `object-position` and `filter` were both read by the capture all along and
  // both dropped by the fold, because L1 had nowhere to put them — so a target
  // that panned a `cover` image or desaturated a photograph reproduced wrong and
  // reported a Type-A delta nothing could close.
  it('test_UAT_FC_REQ-136_the_fold_now_carries_a_captured_pan_and_colour_adjustment', () => {
    // The browser's own default folds to nothing: the axis is worth carrying only
    // when it says something the browser would not do anyway.
    expect(foldObjectPosition('50% 50%')).toBeUndefined()
    expect(foldObjectPosition('50% 12.5%')).toEqual({ xPct: 50, yPct: 12.5 })
    // A form the fold cannot read is a residual, never a guess.
    expect(foldObjectPosition('left top')).toBeUndefined()

    expect(foldFilter('none')).toBeUndefined()
    // Both spellings of a ratio are the same filter; both land as the fraction.
    expect(foldFilter('saturate(40%) blur(3px)')).toEqual({ saturate: 0.4, blurPx: 3 })
    expect(foldFilter('saturate(0.4)')).toEqual({ saturate: 0.4 })
    // The identity differs per function — `grayscale(0)` and `saturate(1)` are
    // both no-ops, and one rule for "skip the identity" would be wrong for half
    // of them. A fully-desaturated photograph must not fold to nothing.
    expect(foldFilter('grayscale(0) saturate(1)')).toBeUndefined()
    expect(foldFilter('grayscale(1) saturate(0)')).toEqual({ grayscale: 1, saturate: 0 })
  })
})
