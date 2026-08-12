import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish, run } from '../tools/generate/src/cli'
import type { L1Node } from '../packages/site-schema/src/index'

/**
 * story-37a3921b — **how a picture is seen**, through the same write path that
 * changes which picture it is.
 *
 * This is the fourth time the one validated, all-or-nothing edit has grown, and
 * the first time it grew without the field vocabulary growing with it: thirteen
 * new controls arrived as the bounded whole number and the closed pick REQ-135
 * had already added. That is the evidence the vocabulary was widened along the
 * right axis — what an operator can *say* grew, what a caller can *smuggle* did
 * not.
 *
 * The load-bearing claim of the whole phase is a negative one: **no control here
 * touches a file.** Framing, shaping and adjusting write structured parameters
 * the renderer applies; nothing decodes, resizes, re-encodes or bakes an asset.
 * That is what makes an adjustment an ordinary structured diff — same validator,
 * same atomicity, same undo — rather than a second write path.
 *
 * Every UAT drives the real `1c` entry point — argv in, an `{ok,data}` /
 * `{ok,error}` envelope and an exit code out — and reads a real observable: the
 * bytes of the draft page document, the rendered page on disk, or `1c status`.
 * Nothing internal is stubbed.
 *
 * THE FIXTURE IS THE AWKWARD PICTURES, NOT THE CONVENIENT ONE. A picture
 * declaring nothing at all (does reading it answer with blanks, and does an
 * identity save invent an empty bag?); one the AI gave a *feathered* edge this
 * control does not offer (does opening it to fix the alt text square it off?);
 * one the fold clamped to the pill sentinel, far outside the corner-rounding
 * control's range (does a bound refuse the status quo?); and one already panned
 * (does moving one component keep the other?). Each is a way this could quietly
 * do the wrong thing on a page nobody meant to reshape.
 */

/** A picture declaring NOTHING — no axes, no mask, no transform. */
const A_PLAIN = '0.0'
/** A picture the AI gave a FEATHERED edge, plus parameters this surface never offers. */
const A_FEATHERED = '0.1'
/** A picture whose corner rounding is the pill sentinel — far outside the control's range. */
const A_PILL = '0.2'
/** A picture already panned away from centre, in both components. */
const A_PANNED = '0.3'

const HERO_ALT = 'The hero'
const PORTRAIT_ALT = 'A portrait'

/** The parameters `imageFramingFields` derives, after the `src` + `alt` pair. */
const FRAMING_FIELDS = [
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
]

/**
 * What a browser paints a picture that declares none of them at: the CSS initial
 * `object-fit`, dead centre, unrounded, unturned, at full size, and every colour
 * adjustment at its OWN identity — 100% for the scaling functions, 0 for the rest.
 */
const AS_A_BROWSER_PAINTS_IT = {
  objectFit: 'fill',
  objectPositionXPct: 50,
  objectPositionYPct: 50,
  shape: 'rectangle',
  cornerRadiusPx: 0,
  rotateDeg: 0,
  scalePct: 100,
  brightnessPct: 100,
  contrastPct: 100,
  saturatePct: 100,
  grayscalePct: 0,
  hueRotateDeg: 0,
  blurPx: 0,
}

const homeJsonPath = (cwd: string, slug: string): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')

/**
 * One page whose pictures differ in exactly the ways that decide behaviour.
 *
 * `A_FEATHERED` carries `surfaceFill` and `opacity` beside its mask on purpose:
 * AC-1131 claims choosing a shape writes the shape alone and AC-1129/AC-1130
 * claim a framing edit disturbs nothing else, and a picture carrying one
 * parameter could not tell "preserved" from "there was nothing to lose".
 *
 * The trailing newline is the SAME byte the CLI's own writer ends a page with.
 * Without it a no-op save would differ from the seed by one character, and the
 * byte-identical assertions below would be measuring the fixture's formatting
 * rather than whether the edit wrote anything.
 */
function seedPage(cwd: string, slug: string): void {
  const homePath = homeJsonPath(cwd, slug)
  const home = JSON.parse(readFileSync(homePath, 'utf8'))

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'image', id: 'plain', src: '/assets/hero.jpg', alt: HERO_ALT },
      {
        kind: 'image',
        id: 'feathered',
        src: '/assets/portrait.jpg',
        alt: PORTRAIT_ALT,
        // A feather is an EDGE TREATMENT, not one of the geometric shapes the
        // control offers — and both the fold and the AI write them.
        mask: { shape: 'featherBottom', featherPx: 48 },
        axes: { objectFit: 'cover', surfaceFill: '#101418', opacity: 0.9 },
      },
      { kind: 'image', id: 'pill', src: '/assets/avatar.jpg', alt: 'An avatar', axes: { borderRadiusPx: 9999 } },
      {
        kind: 'image',
        id: 'panned',
        src: '/assets/wide.jpg',
        alt: 'A wide shot',
        axes: { objectFit: 'cover', objectPosition: { xPct: 20, yPct: 80 } },
      },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`)
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
}

/**
 * Drive the real `1c` entry point. `run` reads the working directory from the
 * process, so the test supplies one the way a shell would and restores it —
 * along with the exit code the command set — before returning.
 */
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
  const envelope = JSON.parse(out[out.length - 1]) as Omit<CliResult, 'exitCode'>
  return { ...envelope, exitCode }
}

/** One field descriptor as it comes off the wire. */
interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  format?: string
  required?: boolean
  widget?: string
  min?: number
  max?: number
  locked?: boolean
}

describe('story-37a3921b — how a picture is seen, through the same write path', () => {
  let cwd: string

  const get = (addr: string): Promise<CliResult> => cli(cwd, 'copy', 'get', 'acme', 'home', addr)
  const set = (addr: string, values: Record<string, unknown>): Promise<CliResult> =>
    cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

  const fieldsOf = async (addr: string): Promise<Field[]> => (await get(addr)).data!.fields as Field[]
  const valuesOf = async (addr: string): Promise<Record<string, unknown>> =>
    (await get(addr)).data!.values as Record<string, unknown>
  const fieldNamed = async (addr: string, name: string): Promise<Field | undefined> =>
    (await fieldsOf(addr)).find((f) => f.name === name)

  /** The draft page document, byte for byte — what a refused or no-op edit must not touch. */
  const draftBytes = (): string => readFileSync(homeJsonPath(cwd, 'acme'), 'utf8')

  /** The node at a dotted address, read straight out of the draft on disk. */
  function draftNode(addr: string): Record<string, unknown> {
    let node = JSON.parse(draftBytes()).l1.root as Record<string, unknown>
    for (const i of addr.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }

  /** The parameters the picture carries in the draft, or `{}` when it carries none. */
  const draftAxes = (addr: string): Record<string, unknown> =>
    (draftNode(addr).axes ?? {}) as Record<string, unknown>

  /** The page the save just rendered, as bytes — the L1 stylesheet is inline. */
  const renderedPage = (result: CliResult): string =>
    readFileSync(path.join(String(result.data!.rendered), 'index.html'), 'utf8')

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-frame-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC1132_a_picture_declaring_no_framing_answers_with_what_a_browser_paints', async () => {
    // AC-1132 — a control that cannot say what a thing is NOW is a control
    // nobody can use: an operator moving a slider from an empty position has no
    // idea what they are moving it from, and a client cannot render a form field
    // with no value. So a picture declaring nothing answers with the values the
    // browser is already painting, not with blanks.
    expect(draftNode(A_PLAIN).axes).toBeUndefined()
    expect(draftNode(A_PLAIN).mask).toBeUndefined()
    expect(draftNode(A_PLAIN).transform).toBeUndefined()

    const fields = await fieldsOf(A_PLAIN)
    const values = await valuesOf(A_PLAIN)

    // Every framing, shape and colour field is PRESENT in the answer...
    expect(fields.map((f) => f.name)).toEqual(['src', 'alt', ...FRAMING_FIELDS])
    expect(values).toMatchObject(AS_A_BROWSER_PAINTS_IT)

    // ...and none of them is blank or missing, whole numbers throughout, which
    // is what the controls accept.
    for (const field of fields) {
      expect(values[field.name], field.name).toBeDefined()
      expect(values[field.name], field.name).not.toBe('')
      expect(values[field.name], field.name).not.toBeNull()
      if (field.type === 'integer') {
        expect(Number.isInteger(values[field.name]), field.name).toBe(true)
      }
    }

    // BECAUSE the reported values are the ones the browser is already painting,
    // they are also the ones a save that touches nothing else correctly treats
    // as no change. The baseline is taken after a real save on a DIFFERENT
    // picture: the shared write helper rewrites the whole document with its own
    // escaping (a known cosmetic defect recorded on the story), so the seeded
    // bytes and the written bytes differ for reasons unrelated to this claim.
    expect((await set(A_FEATHERED, { alt: 'Settled.' })).ok).toBe(true)
    const baseline = draftBytes()

    const noop = await set(A_PLAIN, values)
    expect(noop.ok).toBe(true)
    expect(noop.exitCode).toBe(0)
    expect(noop.data!.changed).toEqual([])

    // The picture still declares NO framing parameters — and no empty group has
    // been left in their place. An empty bag renders as nothing while reading as
    // something, and it would be a diff on every save.
    expect(draftNode(A_PLAIN).axes).toBeUndefined()
    expect(draftNode(A_PLAIN).mask).toBeUndefined()
    expect(draftNode(A_PLAIN).transform).toBeUndefined()
    expect(draftBytes()).toBe(baseline)
  })

  it('test_UAT_AC1131_the_shape_list_carries_the_shape_the_picture_already_holds', async () => {
    // AC-1131 — the union is a CORRECTNESS rule, not a convenience. A chooser
    // whose options omit its own value presents the FIRST option as selected, so
    // a picture the AI or a captured design had given an edge treatment would be
    // silently squared off by an operator who opened it to change its alt text.
    const shape = (await fieldNamed(A_FEATHERED, 'shape'))!
    expect(shape.enum).toEqual([
      'rectangle',
      'circle',
      'ellipse',
      'parallelogram',
      'blob',
      'featherBottom',
    ])
    expect((await valuesOf(A_FEATHERED)).shape).toBe('featherBottom')

    // Re-saving that picture with its OWN shape and a new alt text reports only
    // the alt text as changed, and leaves the shape and its own parameter exactly
    // as they were.
    const reSaved = await set(A_FEATHERED, { shape: 'featherBottom', alt: 'Reworded.' })
    expect(reSaved.ok).toBe(true)
    expect(reSaved.data!.changed).toEqual(['alt'])
    expect(draftNode(A_FEATHERED).mask).toEqual({ shape: 'featherBottom', featherPx: 48 })

    // On a picture carrying no shape, choosing a geometric one writes THE SHAPE
    // ALONE: the parameters a shape carries (a parallelogram's slant, a blob's
    // roughness and seed) belong to the shape that names them, so a shape chosen
    // here takes the renderer's own defaults and tuning them stays with the AI.
    const shaped = await set(A_PLAIN, { shape: 'circle' })
    expect(shaped.ok).toBe(true)
    expect(shaped.data!.changed).toEqual(['shape'])
    expect(draftNode(A_PLAIN).mask).toEqual({ shape: 'circle' })

    // And "no shape at all" removes the shape from the region outright rather
    // than recording it — including the bag it lived in.
    const unshaped = await set(A_PLAIN, { shape: 'rectangle' })
    expect(unshaped.ok).toBe(true)
    expect(unshaped.data!.changed).toEqual(['shape'])
    expect(draftNode(A_PLAIN).mask).toBeUndefined()
    expect(draftNode(A_PLAIN).axes).toBeUndefined()
  })

  it('test_UAT_AC1130_colour_is_adjusted_in_percentages_over_the_fractions_the_definition_holds', async () => {
    // AC-1130 — a published base gives `status` something to diff against, so
    // "how many files did this save move?" has a countable answer.
    await cmdPublish('acme', { cwd, message: 'base' })
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual([])

    // Every colour control is a BOUNDED PERCENTAGE, never a free-form value.
    for (const name of ['brightnessPct', 'contrastPct', 'saturatePct', 'grayscalePct']) {
      const field = (await fieldNamed(A_PLAIN, name))!
      expect(field.type, name).toBe('integer')
      expect(field.min, name).toBe(0)
      expect(field.max, name).toBeTypeOf('number')
    }

    // Several adjustments in ONE form produce ONE change to the site, not one
    // per adjustment...
    const saved = await set(A_PLAIN, { saturatePct: 40, grayscalePct: 60, brightnessPct: 110 })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['saturatePct', 'grayscalePct', 'brightnessPct'])
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual(['pages/home.json'])

    // ...and the region stores them in the form a BROWSER reports, converted from
    // the percentages that were submitted. The control and the stored parameter
    // carry different names and different numbers on purpose: "saturation 40%"
    // is what an operator means, `saturate: 0.4` is what the definition holds, so
    // a page folded from a capture and a page adjusted by hand say the same thing
    // the same way.
    expect(draftAxes(A_PLAIN).filter).toEqual({ saturate: 0.4, grayscale: 0.6, brightness: 1.1 })

    // The rendered page carries the adjustment.
    expect(renderedPage(saved)).toContain('grayscale(0.6) saturate(0.4) brightness(1.1)')

    // A control left at its identity throughout is NEVER written — `contrastPct`,
    // `hueRotateDeg` and `blurPx` were offered and never submitted, and the
    // stored adjustment holds nothing for them.
    for (const axis of ['contrast', 'hueRotateDeg', 'blurPx']) {
      expect(draftAxes(A_PLAIN).filter).not.toHaveProperty(axis)
    }

    // THE IDENTITY IS NOT THE SAME NUMBER FOR EVERY CONTROL — unchanged (100%)
    // for the scaling adjustments, none-at-all (0) for the rest — so each is
    // judged against its own. Returning each to its identity removes that
    // adjustment...
    const back = await set(A_PLAIN, { saturatePct: 100, brightnessPct: 100 })
    expect(back.ok).toBe(true)
    expect(draftAxes(A_PLAIN).filter).toEqual({ grayscale: 0.6 })

    // ...and removing the LAST one removes the group holding them, leaving no
    // empty container behind — nor an empty bag around it on a picture that
    // carried nothing else.
    const cleared = await set(A_PLAIN, { grayscalePct: 0 })
    expect(cleared.ok).toBe(true)
    expect(cleared.data!.changed).toEqual(['grayscalePct'])
    expect(draftNode(A_PLAIN).axes).toBeUndefined()
  })

  it('test_UAT_AC1129_panning_writes_a_typed_percentage_pair_and_centre_removes_it', async () => {
    // AC-1129 — a picture that declares no position at all reports dead centre
    // for both components.
    expect(draftAxes(A_PLAIN).objectPosition).toBeUndefined()
    expect(await valuesOf(A_PLAIN)).toMatchObject({
      objectPositionXPct: 50,
      objectPositionYPct: 50,
    })

    // BOTH COMPONENTS OR NEITHER. A position naming only one of the two would be
    // completed silently by the browser at dead centre — a value the page never
    // said — so the pair is written whole whenever either half moves, seeded from
    // whatever the region currently reports.
    const panned = await set(A_PLAIN, { objectPositionYPct: 15 })
    expect(panned.ok).toBe(true)
    expect(panned.data!.changed).toEqual(['objectPositionYPct'])
    expect(draftAxes(A_PLAIN).objectPosition).toEqual({ xPct: 50, yPct: 15 })

    // The rendered page positions the picture at that pair.
    expect(renderedPage(panned)).toContain('object-position: 50% 15%')

    // CENTRE REMOVES IT: a picture put back where it started is byte-identical to
    // one that was never moved, rather than carrying the browser's own default
    // written in.
    const centred = await set(A_PLAIN, { objectPositionYPct: 50 })
    expect(centred.ok).toBe(true)
    expect(centred.data!.changed).toEqual(['objectPositionYPct'])
    expect(draftAxes(A_PLAIN).objectPosition).toBeUndefined()
    expect(draftNode(A_PLAIN).axes).toBeUndefined()

    // Only one of the two components may be named in a change map; the other
    // keeps the value the region reported. On an already-panned picture that is
    // a real value rather than the centre, which is what makes the claim bite.
    expect(await valuesOf(A_PANNED)).toMatchObject({
      objectPositionXPct: 20,
      objectPositionYPct: 80,
    })
    const half = await set(A_PANNED, { objectPositionYPct: 35 })
    expect(half.ok).toBe(true)
    expect(half.data!.changed).toEqual(['objectPositionYPct'])
    expect(draftAxes(A_PANNED).objectPosition).toEqual({ xPct: 20, yPct: 35 })
    // And the parameter it was carrying beside the pair is none of this control's
    // business.
    expect(draftAxes(A_PANNED).objectFit).toBe('cover')
  })

  // ── the properties the picture half inherits from the write path ───────────
  //
  // AC-1121 and AC-1122 are not image claims that happen to be tested here: they
  // are claims about EVERY bounded control and EVERY parameter edit this surface
  // offers, and REQ-136 widened what "every" means. A run's size proved them for
  // typography; these prove the same two rules did not stop at the text half.

  it('test_UAT_AC1121_a_pictures_bounds_bind_a_change_and_never_the_status_quo', async () => {
    // AC-1121 — a saved form carries every field the region exposed, not only
    // the ones that were touched. A picture the fold captured as a fully-round
    // avatar carries a corner rounding far outside anything the control offers,
    // so a bound that judged the status quo would make it unopenable and
    // unsavable — for the sake of an operator fixing its alt text.
    expect(draftAxes(A_PILL).borderRadiusPx).toBe(9999)
    expect((await fieldNamed(A_PILL, 'cornerRadiusPx'))!.max).toBeLessThan(9999)
    // The region reports it as its current value regardless, so the control opens
    // on what the picture actually is.
    expect((await valuesOf(A_PILL)).cornerRadiusPx).toBe(9999)

    const reSaved = await set(A_PILL, { alt: 'Reworded.', cornerRadiusPx: 9999 })
    expect(reSaved.ok).toBe(true)
    expect(reSaved.data!.changed).toEqual(['alt'])
    expect(draftAxes(A_PILL).borderRadiusPx).toBe(9999)

    // A genuinely NEW value outside a range is refused at the field, naming the
    // bound and the value asked for — across the three families of control the
    // picture adds, because a range enforced on one and forgotten on another is
    // the failure this covers.
    for (const asked of [
      { saturatePct: 500 },
      { objectPositionXPct: 140 },
      { scalePct: 1 },
    ] as Array<Record<string, number>>) {
      const [name, value] = Object.entries(asked)[0]
      const before = draftBytes()
      const refused = await set(A_PILL, asked)
      expect(refused.ok, name).toBe(false)
      expect(refused.exitCode, name).not.toBe(0)
      expect(refused.error!.message, name).toMatch(/at (most|least)/)
      expect(refused.error!.message, name).toContain(String(value))
      expect(refused.error!.path, name).toContain(name)

      // NOTHING IS WRITTEN AND NOTHING IS CLAMPED. Quietly reshaping a page
      // nobody edited is the worse failure of the two, and it is invisible — so
      // the whole draft, not merely the field, is asserted byte-for-byte.
      expect(draftBytes(), name).toBe(before)
      expect(draftAxes(A_PILL).borderRadiusPx, name).toBe(9999)
      expect(draftAxes(A_PILL).filter, name).toBeUndefined()
      expect(draftAxes(A_PILL).objectPosition, name).toBeUndefined()
      expect(draftNode(A_PILL).transform, name).toBeUndefined()
    }
  })

  it('test_UAT_AC1122_a_framing_edit_writes_among_the_parameters_the_picture_already_carries', async () => {
    // AC-1122 — the parameter named is the only one that moves. `A_FEATHERED`
    // carries a fill, an opacity and an edge treatment this surface never offers,
    // so "disturbs nothing else" is measured against parameters no control here
    // could have written back — a picture holding one parameter could not tell
    // "preserved" from "there was nothing to lose".
    const turned = await set(A_FEATHERED, { rotateDeg: -8 })
    expect(turned.ok).toBe(true)
    expect(turned.data!.changed).toEqual(['rotateDeg'])
    expect(draftNode(A_FEATHERED).transform).toEqual({ rotateDeg: -8 })
    expect(draftAxes(A_FEATHERED)).toEqual({
      objectFit: 'cover',
      surfaceFill: '#101418',
      opacity: 0.9,
    })
    expect(draftNode(A_FEATHERED).mask).toEqual({ shape: 'featherBottom', featherPx: 48 })
    expect(draftNode(A_FEATHERED).alt).toBe(PORTRAIT_ALT)

    // ABSENT IS THE DEFAULT, AND NO EMPTY CONTAINER IS LEFT BEHIND. Turning the
    // picture back removes the parameter, and because it was the only one in the
    // group, the group goes with it rather than lingering as `{}` — which would
    // render as nothing while reading as something, and be a diff on every save.
    const straight = await set(A_FEATHERED, { rotateDeg: 0 })
    expect(straight.ok).toBe(true)
    expect(straight.data!.changed).toEqual(['rotateDeg'])
    expect(draftNode(A_FEATHERED).transform).toBeUndefined()
    expect(draftAxes(A_FEATHERED)).toEqual({
      objectFit: 'cover',
      surfaceFill: '#101418',
      opacity: 0.9,
    })

    // A CHANGE MAP THAT CHANGES NOTHING IS REPORTED AS CHANGING NOTHING, on the
    // picture that declares nothing at all — the case where every branch has to
    // look in a parameter bag, so creating one to look in it would leave `axes:
    // {}` behind on a node that had none.
    //
    // The baseline is taken AFTER a real save rather than from the seed: the
    // shared write helper rewrites the whole document with its own escaping, a
    // known cosmetic defect recorded on the story, so the seeded bytes and the
    // written bytes differ for reasons that have nothing to do with this claim.
    const baseline = draftBytes()

    // The WHOLE form, exactly as the region reports it — which is what a save
    // actually posts, not only the fields someone touched.
    const reported = await valuesOf(A_PLAIN)
    expect(Object.keys(reported)).toEqual(['src', 'alt', ...FRAMING_FIELDS])
    const noop = await set(A_PLAIN, reported)
    expect(noop.ok).toBe(true)
    expect(noop.exitCode).toBe(0)
    expect(noop.data!.changed).toEqual([])

    expect(draftNode(A_PLAIN).axes).toBeUndefined()
    expect(draftNode(A_PLAIN).mask).toBeUndefined()
    expect(draftNode(A_PLAIN).transform).toBeUndefined()
    expect(draftBytes()).toBe(baseline)
  })
})
