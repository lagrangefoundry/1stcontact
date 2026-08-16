import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { cmdNew, cmdRender, run } from '../tools/generate/src/cli'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * story-37a3921b — **how a run of copy is set**, through the same write path
 * that changes its words.
 *
 * This is the first thing the surface exposes that is a *parameter of the run
 * rather than its content*, and that difference is what shapes the suite. Content
 * is a scalar you overwrite; a parameter can be **responsive** — the page holds
 * not a number but a rule sampled at several viewport widths, of which the value
 * a region reports is only the representative one. A control that wrote the value
 * alone would appear to do nothing, and one that flattened the rule would break
 * the page at a width nobody opened. AC-1118 is that claim.
 *
 * Everything else stays where it was: no new command, no new endpoint, no new
 * value vocabulary. The fields still come from one derivation, the write still
 * goes through `copy set`, and the shared whole-definition validator still gates
 * the file — so this file also re-asserts the three criteria the typography phase
 * *widened* (AC-980's "the words come first", AC-988's per-field shape check and
 * read-only refusal, AC-991's four control shapes) in the context that widened
 * them.
 *
 * Every UAT drives the real `1c` entry point — argv in, an `{ok,data}` /
 * `{ok,error}` envelope and an exit code out — and reads a real observable: the
 * bytes of the draft page document, or the rendered page. Nothing internal is
 * stubbed.
 */

/**
 * The family as a run *asks* for it — a fallback stack — against the bare family
 * a declared face names. Every run on a real measured page looks like this, and
 * comparing the two whole finds no faces anywhere.
 */
const SATOSHI_STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const INTER_STACK = 'Inter, Segoe UI, sans-serif'

const HEADLINE_COPY = 'Designed for developers who ship'
const LEDE_COPY = 'A lede set in a weight this site declares no face for.'
const GIANT_COPY = 'Bigger than the control can ask for.'
const SYSTEM_COPY = 'Set in whatever the reader happens to have.'
const INHERITED_COPY = 'A run that declares no size of its own.'
const FULL_COPY = 'A run whose family declares an italic face.'
const SLIDE_COPY = 'The only slide.'
/** Long enough that a single-line control would hide most of it. */
const LONG_COPY =
  'A headline long enough that the box it was authored for cannot hold it, which is accepted: the operator gets the words they asked for and tidies the layout afterwards.'

// Addresses, as the edit render stamps them (`data-l1-path`).
/** Satoshi, a responsive size ladder, and several parameters beside it. */
const A_HEADLINE = '0.0'
/** Satoshi, a flat size, set in a weight the site declares no face for. */
const A_LEDE = '0.1'
/** Satoshi, captured outside the control's range — the status quo a bound must not touch. */
const A_GIANT = '0.2'
/** A system stack: the family declares no faces at all. */
const A_SYSTEM = '0.3'
/** Satoshi, declaring no size of its own. */
const A_INHERITED = '0.4'
/** Inter, whose declared faces include an italic one — nothing is locked here. */
const A_FULL = '0.5'
/** Long copy, for the multi-line control. */
const A_LONG = '0.6'
/** An image region — a plain-text alt beside a closed pick. */
const A_IMAGE = '0.7'
/** Rooted in the carousel instance's repeated `slide` slot. */
const A_SLIDE = '0'

const homeJsonPath = (cwd: string, slug: string): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')

/**
 * One page whose runs differ in exactly the ways that decide behaviour.
 *
 * `A_HEADLINE` carries `letterSpacingPx` and `color` on purpose: AC-1122 claims a
 * typography edit disturbs no other parameter, and a run carrying one parameter
 * could not tell "preserved" from "there was nothing to lose".
 *
 * Two families, declared differently on purpose. **Satoshi** declares four
 * weights and no italic face — positive evidence of absence, which is the only
 * thing that locks the italic control. **Inter** declares an italic face, so a
 * run in Inter has every one of the five fields live, which is what makes a
 * whole-form re-save (AC-1122) a real whole form rather than a partial one.
 */
function seedPage(cwd: string, slug: string): void {
  const homePath = homeJsonPath(cwd, slug)
  const home = JSON.parse(readFileSync(homePath, 'utf8'))

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      {
        kind: 'text',
        id: 'headline',
        text: HEADLINE_COPY,
        axes: {
          fontFamily: SATOSHI_STACK,
          fontSizePx: 72,
          fontWeight: 700,
          letterSpacingPx: -1.5,
          color: '#f6f7f4',
        },
        // The ladder a fold measures: 72 at the widest, 36 at the narrowest.
        responsive: {
          fontSizePx: {
            keyframes: [
              { at: 320, value: 36 },
              { at: 768, value: 54 },
              { at: 1440, value: 72 },
            ],
          },
        },
      },
      {
        kind: 'text',
        id: 'lede',
        text: LEDE_COPY,
        axes: { fontFamily: SATOSHI_STACK, fontSizePx: 18, fontWeight: 600 },
      },
      {
        kind: 'text',
        id: 'giant',
        text: GIANT_COPY,
        axes: { fontFamily: SATOSHI_STACK, fontSizePx: 160, fontWeight: 400 },
      },
      {
        kind: 'text',
        id: 'system',
        text: SYSTEM_COPY,
        axes: { fontFamily: 'system-ui, sans-serif', fontSizePx: 16 },
      },
      {
        kind: 'text',
        id: 'inherited',
        text: INHERITED_COPY,
        axes: { fontFamily: SATOSHI_STACK, fontWeight: 400 },
      },
      {
        kind: 'text',
        id: 'full',
        text: FULL_COPY,
        axes: { fontFamily: INTER_STACK, fontSizePx: 20, fontWeight: 400 },
      },
      {
        kind: 'text',
        id: 'long',
        text: LONG_COPY,
        axes: { fontFamily: SATOSHI_STACK, fontSizePx: 18, fontWeight: 400 },
      },
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
      { kind: 'slot', name: 'gallery' },
    ],
  }

  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root,
    resources: {
      fonts: [
        // Four weights, no italic — the measured shape of a real site's table.
        ...[400, 500, 700, 900].map((weight) => ({
          family: 'Satoshi',
          src: `/assets/satoshi-${weight}.woff2`,
          weight,
          style: 'normal',
        })),
        { family: 'Inter', src: '/assets/inter-400.woff2', weight: 400, style: 'normal' },
        { family: 'Inter', src: '/assets/inter-700.woff2', weight: 700, style: 'normal' },
        { family: 'Inter', src: '/assets/inter-400-italic.woff2', weight: 400, style: 'italic' },
      ],
    },
  }

  // A run inside a behavior module's presentation slot: its weights must be the
  // PAGE's, because a served face is declared once per rendered document.
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: {
        slide: [
          {
            kind: 'text',
            id: 'slide-one',
            text: SLIDE_COPY,
            axes: { fontFamily: SATOSHI_STACK, fontSizePx: 24, fontWeight: 700 },
          },
        ],
      },
    },
  ]

  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
}

/**
 * Drive the real `1c` entry point. `run` reads the working directory from the
 * process, so the test supplies one the way a shell would and restores it — along
 * with the exit code the command set — before returning.
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

/** The four shapes of control this surface is capable of offering, and no fifth. */
const CONTROL_SHAPES = ['string', 'enum', 'integer', 'boolean']

describe('story-37a3921b — how a run of copy is set, through the same write path', () => {
  let cwd: string

  const get = (addr: string, ...scope: string[]): Promise<CliResult> =>
    cli(cwd, 'copy', 'get', 'acme', 'home', addr, ...scope)
  const set = (addr: string, values: Record<string, unknown>): Promise<CliResult> =>
    cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

  const fieldsOf = async (addr: string, ...scope: string[]): Promise<Field[]> =>
    (await get(addr, ...scope)).data!.fields as Field[]
  const valuesOf = async (addr: string, ...scope: string[]): Promise<Record<string, unknown>> =>
    (await get(addr, ...scope)).data!.values as Record<string, unknown>
  const fieldNamed = async (addr: string, name: string): Promise<Field | undefined> =>
    (await fieldsOf(addr)).find((f) => f.name === name)

  /** The draft page document, byte for byte — what a refused edit must not touch. */
  const draftBytes = (): string => readFileSync(homeJsonPath(cwd, 'acme'), 'utf8')

  /** The node at a dotted address, read straight out of the draft on disk. */
  function draftNode(addr: string): Record<string, unknown> {
    let node = JSON.parse(draftBytes()).l1.root as Record<string, unknown>
    for (const i of addr.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }

  /** The parameters the run carries in the draft. */
  const draftAxes = (addr: string): Record<string, unknown> =>
    draftNode(addr).axes as Record<string, unknown>

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-type-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── asking what a run exposes ──────────────────────────────────────────────

  it('test_UAT_AC980_the_words_come_first_now_that_a_run_also_reports_how_it_is_set', async () => {
    // AC-980 — the first field is the words, exactly as they stand in the draft.
    // Being FIRST is the load-bearing part: a client opening a copy region finds
    // the words by where they sit in the answer, and it can no longer find them
    // by their being the only thing in it.
    const fields = await fieldsOf(A_HEADLINE)
    expect(fields[0]).toEqual({ name: 'text', label: 'Text', type: 'string' })
    // The claim only means something because the list is no longer one long.
    expect(fields.length).toBeGreaterThan(1)
    // Character for character what stands in the draft, not a rendering of it.
    expect((await valuesOf(A_HEADLINE)).text).toBe(draftNode(A_HEADLINE).text)
    expect((await valuesOf(A_HEADLINE)).text).toBe(HEADLINE_COPY)

    // A long or line-broken run additionally asks for the multi-line control;
    // a short one does not.
    const long = await fieldsOf(A_LONG)
    expect(long[0]).toEqual({ name: 'text', label: 'Text', type: 'string', widget: 'textarea' })
    expect((await valuesOf(A_LONG)).text).toBe(LONG_COPY)
    expect(fields[0].widget).toBeUndefined()

    // And it is still first on every kind of run the page carries, whatever
    // parameters follow it.
    for (const addr of [A_LEDE, A_GIANT, A_SYSTEM, A_INHERITED, A_FULL]) {
      const first = (await fieldsOf(addr))[0]
      expect(first.name, addr).toBe('text')
      expect(first.type, addr).toBe('string')
    }
  })

  it('test_UAT_AC1117_a_copy_region_reports_how_the_run_is_set_beside_its_words', async () => {
    // AC-1117 — the words first, and beside them the four parameters: size as a
    // bounded whole number, weight as a closed pick, italic as a yes/no, and
    // capitalisation as the keyword list the parameter itself admits.
    const fields = await fieldsOf(A_HEADLINE)
    expect(fields.map((f) => f.name)).toEqual([
      'text',
      'fontSizePx',
      'fontWeight',
      'italic',
      'textTransform',
    ])

    const size = fields.find((f) => f.name === 'fontSizePx')!
    // A whole number carrying its INCLUSIVE bounds — a range the caller can read
    // rather than one it has to discover by being refused.
    expect(size).toMatchObject({ type: 'integer', min: 6, max: 128 })
    expect(Number.isInteger(size.min)).toBe(true)
    expect(Number.isInteger(size.max)).toBe(true)

    expect(fields.find((f) => f.name === 'fontWeight')!.type).toBe('enum')
    expect(fields.find((f) => f.name === 'italic')!.type).toBe('boolean')
    const transform = fields.find((f) => f.name === 'textTransform')!
    expect(transform.type).toBe('enum')
    // The parameter's own vocabulary, mirrored as the closed list.
    expect(transform.enum).toEqual(['none', 'uppercase', 'lowercase', 'capitalize'])

    // The values reported are the run's OWN — and for size that is the
    // representative (widest) value of its rule, never one viewport's keyframe.
    expect(await valuesOf(A_HEADLINE)).toMatchObject({
      fontSizePx: 72,
      fontWeight: '700',
      italic: false,
      textTransform: 'none',
    })
    expect(draftNode(A_HEADLINE).responsive).toMatchObject({
      fontSizePx: { keyframes: [{ at: 320, value: 36 }, { at: 768, value: 54 }, { at: 1440, value: 72 }] },
    })

    // Every field offered is one of the four shapes, and every closed list is
    // non-empty — a list-typed field with no list would be a free string wearing
    // a narrower label.
    for (const field of fields) {
      expect(CONTROL_SHAPES, field.name).toContain(field.type)
      if (field.type === 'enum') expect(field.enum!.length, field.name).toBeGreaterThan(0)
    }

    // Nothing else about the run is exposed: not its colour, not its family, and
    // nothing geometric — even though the run carries all three.
    const names = fields.map((f) => f.name)
    for (const withheld of ['color', 'fontFamily', 'letterSpacingPx', 'lineHeightPx', 'geometry']) {
      expect(names, withheld).not.toContain(withheld)
    }
    expect(draftAxes(A_HEADLINE)).toMatchObject({ color: '#f6f7f4', fontFamily: SATOSHI_STACK })

    // A control that would have to lie about what it does is WITHHELD rather
    // than fabricated. A run declaring no size of its own has no honest number
    // to show — the value it renders at lives in the browser, not in the page.
    const inherited = await fieldsOf(A_INHERITED)
    expect(inherited.map((f) => f.name)).not.toContain('fontSizePx')
    expect(await valuesOf(A_INHERITED)).not.toHaveProperty('fontSizePx')

    // ...and a run whose family yields fewer than two weights is offered no
    // weight chooser, because a chooser holding its only option is a label.
    const system = await fieldsOf(A_SYSTEM)
    expect(system.map((f) => f.name)).not.toContain('fontWeight')
    expect(system.map((f) => f.name)).toEqual(['text', 'fontSizePx', 'italic', 'textTransform'])

    // Inside a behavior module's presentation slot the answer has the same
    // shape, and the faces are the PAGE's own — a served face is declared once
    // per rendered document, so reading them anywhere else would offer a weight
    // the render cannot serve.
    const slotFields = await fieldsOf(A_SLIDE, '--module', 'gallery', '--slot', 'slide')
    expect(slotFields.map((f) => f.name)).toEqual([
      'text',
      'fontSizePx',
      'fontWeight',
      'italic',
      'textTransform',
    ])
    expect(slotFields.find((f) => f.name === 'fontWeight')!.enum).toEqual([
      '400',
      '500',
      '700',
      '900',
    ])
    expect(await valuesOf(A_SLIDE, '--module', 'gallery', '--slot', 'slide')).toMatchObject({
      text: SLIDE_COPY,
      fontSizePx: 24,
      fontWeight: '700',
    })
  })

  it('test_UAT_AC1119_the_weights_offered_are_the_declared_faces_for_the_first_family_plus_the_runs_own', async () => {
    // AC-1119 — the list is the faces the site declares FOR THAT RUN'S FAMILY,
    // in union with the weight the run already carries, and nothing else.
    //
    // The family is matched on the FIRST family of the run's stack. Every run
    // asks for a fallback chain while every declared face names a bare family,
    // so comparing them whole is a guaranteed miss that would withdraw the
    // control from the whole site silently — the assertion below is what would
    // catch that, because this run's stack is four names long.
    expect(draftAxes(A_HEADLINE).fontFamily).toBe(SATOSHI_STACK)
    expect((await fieldNamed(A_HEADLINE, 'fontWeight'))!.enum).toEqual(['400', '500', '700', '900'])

    // The run's own weight is always among its options, declared or not. 600 is
    // a weight this site serves no face for, and it is what this run is set in;
    // a chooser omitting it would present the first option as selected, so an
    // operator who opened the form to fix the words and saved would silently
    // re-weight the run.
    expect(draftAxes(A_LEDE).fontWeight).toBe(600)
    const lede = (await fieldNamed(A_LEDE, 'fontWeight'))!
    expect(lede.enum).toEqual(['400', '500', '600', '700', '900'])
    expect((await valuesOf(A_LEDE)).fontWeight).toBe('600')

    // A different family gets that family's faces, not the site's faces at large.
    expect((await fieldNamed(A_FULL, 'fontWeight'))!.enum).toEqual(['400', '700'])

    // A weight in neither set is refused AT THE FIELD, naming the value asked
    // for, with the draft untouched. It is not something the browser refuses —
    // it synthesises it, smeared differently by every engine — so it is a
    // safe-looking value the page cannot honour.
    const before = draftBytes()
    const refused = await set(A_HEADLINE, { fontWeight: '850' })
    expect(refused.ok).toBe(false)
    expect(refused.exitCode).not.toBe(0)
    expect(refused.error!.message).toContain('850')
    expect(refused.error!.path).toContain('fontWeight')
    expect(draftBytes()).toBe(before)

    // One that IS offered is applied, and the stored run carries it.
    const accepted = await set(A_HEADLINE, { fontWeight: '500' })
    expect(accepted.ok).toBe(true)
    expect(accepted.data!.changed).toEqual(['fontWeight'])
    expect(draftAxes(A_HEADLINE).fontWeight).toBe(500)
  })

  it('test_UAT_AC1120_italic_is_read_only_only_on_positive_evidence_of_absence', async () => {
    // AC-1120 — italic is always offered, and locked in exactly one
    // circumstance: the run's family declares faces and none of them is italic.
    expect((await fieldNamed(A_HEADLINE, 'italic'))!.locked).toBe(true)

    // A family that declares NO faces keeps a live control: such a run is
    // painted by the reader's own system font, which has real italics, so
    // locking there would disable a control that works.
    expect((await fieldNamed(A_SYSTEM, 'italic'))!.locked).toBeFalsy()
    // And a family that declares an italic face is likewise live — which is what
    // makes the lock evidence of absence rather than merely evidence of a table.
    expect((await fieldNamed(A_FULL, 'italic'))!.locked).toBeFalsy()

    // It is shown read-only rather than dropped: a missing row reads as "this
    // build has no italics", a locked one as "this site's font has none", and
    // the two have very different fixes.
    expect((await fieldsOf(A_HEADLINE)).map((f) => f.name)).toContain('italic')

    // A value posted for a read-only field is REFUSED — not applied, not
    // silently dropped — leaving the draft byte-for-byte unchanged.
    const before = draftBytes()
    const refused = await set(A_HEADLINE, { italic: true })
    expect(refused.ok).toBe(false)
    expect(refused.exitCode).not.toBe(0)
    expect(refused.error!.path).toContain('italic')
    expect(draftBytes()).toBe(before)
    expect(draftAxes(A_HEADLINE).fontStyle).toBeUndefined()

    // Where it is live it simply works...
    expect((await set(A_SYSTEM, { italic: true })).ok).toBe(true)
    expect(draftAxes(A_SYSTEM).fontStyle).toBe('italic')
    // ...and turning it back off REMOVES the parameter rather than writing the
    // default in.
    const off = await set(A_SYSTEM, { italic: false })
    expect(off.ok).toBe(true)
    expect(off.data!.changed).toEqual(['italic'])
    expect(draftAxes(A_SYSTEM)).not.toHaveProperty('fontStyle')
  })

  // ── writing a parameter as the rule it is ──────────────────────────────────

  it('test_UAT_AC1118_resizing_a_run_scales_every_keyframe_of_its_responsive_rule', async () => {
    // AC-1118 — THE CRITERION THIS PHASE LIVES ON. The page holds a rule sampled
    // at several widths and the region reports only its representative value, so
    // changing the size has to move the whole rule in proportion.
    const saved = await set(A_HEADLINE, { fontSizePx: 96 })
    expect(saved.ok).toBe(true)
    // One field named, one field changed.
    expect(saved.data!.changed).toEqual(['fontSizePx'])

    expect(draftAxes(A_HEADLINE).fontSizePx).toBe(96)

    // 72 → 96 is ×4/3, applied to EVERY keyframe: the shape the page was
    // captured with survives and only its magnitude moves.
    const track = (
      draftNode(A_HEADLINE).responsive as Record<string, { keyframes: { at: number; value: number }[] }>
    ).fontSizePx
    expect(track.keyframes).toEqual([
      { at: 320, value: 48 },
      { at: 768, value: 72 },
      { at: 1440, value: 96 },
    ])
    // Both cheaper alternatives, refused, and both would have failed silently:
    // writing the representative value alone would have left the rule to win at
    // every width it covers (the edit would appear to do nothing)...
    expect(track.keyframes.map((kf) => kf.value)).not.toEqual([36, 54, 72])
    // ...and replacing the rule with the new value at every width would have
    // deleted the narrow-viewport keyframe, breaking a width nobody opened.
    expect(new Set(track.keyframes.map((kf) => kf.value)).size).toBe(3)
    // The widths themselves do not move.
    expect(track.keyframes.map((kf) => kf.at)).toEqual([320, 768, 1440])

    // A run whose size does NOT vary by viewport gains no rule from being
    // resized: exactly the one write, reported as exactly the one field.
    const flat = await set(A_LEDE, { fontSizePx: 20 })
    expect(flat.ok).toBe(true)
    expect(flat.data!.changed).toEqual(['fontSizePx'])
    expect(draftAxes(A_LEDE).fontSizePx).toBe(20)
    expect(draftNode(A_LEDE).responsive).toBeUndefined()
  })

  it('test_UAT_AC1121_the_size_bound_binds_a_change_and_never_the_status_quo', async () => {
    // AC-1121 — a saved form carries every field the region exposed, not only
    // the ones that were touched. So a run the page was captured at 160px with
    // must survive being opened to fix a typo.
    expect((await valuesOf(A_GIANT)).fontSizePx).toBe(160)
    expect((await fieldNamed(A_GIANT, 'fontSizePx'))!.max).toBe(128)

    // A value equal to the one the region just reported is accepted whatever it
    // is — and only the words are reported as changed.
    const reSaved = await set(A_GIANT, { text: 'Reworded, nothing else.', fontSizePx: 160 })
    expect(reSaved.ok).toBe(true)
    expect(reSaved.data!.changed).toEqual(['text'])
    expect(draftAxes(A_GIANT).fontSizePx).toBe(160)

    // A genuinely NEW value outside the range is refused at the field, naming
    // the bound and the value asked for, with nothing written...
    for (const asked of [200, 4]) {
      const before = draftBytes()
      const refused = await set(A_GIANT, { fontSizePx: asked })
      expect(refused.ok, String(asked)).toBe(false)
      expect(refused.exitCode, String(asked)).not.toBe(0)
      expect(refused.error!.message, String(asked)).toMatch(/at (most|least)/)
      expect(refused.error!.message, String(asked)).toContain(String(asked))
      expect(refused.error!.path, String(asked)).toContain('fontSizePx')
      expect(draftBytes(), String(asked)).toBe(before)
      // ...and never clamped to the nearest permitted value: quietly reshaping a
      // page nobody edited is the worse failure of the two, and it is invisible.
      expect(draftAxes(A_GIANT).fontSizePx, String(asked)).toBe(160)
    }
  })

  it('test_UAT_AC1122_a_typography_edit_writes_into_the_runs_parameters_and_a_no_op_produces_no_diff', async () => {
    // AC-1122 — the parameter named is the only one that moves. Every other
    // parameter the run holds survives byte-identical, which is what makes
    // "restyling a run disturbs nothing else" true of the whole run.
    const changed = await set(A_HEADLINE, { textTransform: 'uppercase' })
    expect(changed.ok).toBe(true)
    expect(changed.data!.changed).toEqual(['textTransform'])
    expect(draftAxes(A_HEADLINE)).toEqual({
      fontFamily: SATOSHI_STACK,
      fontSizePx: 72,
      fontWeight: 700,
      letterSpacingPx: -1.5,
      color: '#f6f7f4',
      textTransform: 'uppercase',
    })
    // The words, and the rule beside them, are equally none of this control's
    // business.
    expect(draftNode(A_HEADLINE).text).toBe(HEADLINE_COPY)
    expect(draftNode(A_HEADLINE).responsive).toMatchObject({
      fontSizePx: { keyframes: [{ at: 320, value: 36 }, { at: 768, value: 54 }, { at: 1440, value: 72 }] },
    })

    // ABSENT IS THE DEFAULT. Setting a parameter back to the value it has when
    // nothing is declared REMOVES it rather than writing the default in —
    // otherwise the definition would grow on every save.
    const back = await set(A_HEADLINE, { textTransform: 'none' })
    expect(back.ok).toBe(true)
    expect(back.data!.changed).toEqual(['textTransform'])
    expect(draftAxes(A_HEADLINE)).not.toHaveProperty('textTransform')

    // A CHANGE MAP THAT CHANGES NOTHING IS REPORTED AS CHANGING NOTHING, and
    // leaves the stored draft byte-identical — so the modal cannot put a history
    // in the draft that nobody asked for.
    //
    // The baseline is taken AFTER a real save rather than from the seed: the
    // shared write helper rewrites the whole document with its own escaping, a
    // known cosmetic defect recorded on the story, so the seeded bytes and the
    // written bytes differ for reasons that have nothing to do with this claim.
    const settled = await set(A_FULL, { text: 'A settled run.' })
    expect(settled.ok).toBe(true)
    const baseline = draftBytes()

    // Every value exactly as the region reports it — the WHOLE form, which is
    // what a save actually posts. Nothing on this run is read-only, so nothing
    // is held back.
    const reported = await valuesOf(A_FULL)
    expect(Object.keys(reported).sort()).toEqual(
      ['fontSizePx', 'fontWeight', 'italic', 'text', 'textTransform'].sort(),
    )
    const noop = await set(A_FULL, reported)
    expect(noop.ok).toBe(true)
    expect(noop.exitCode).toBe(0)
    expect(noop.data!.changed).toEqual([])
    expect(draftBytes()).toBe(baseline)
  })

  // ── refusing legibly ───────────────────────────────────────────────────────

  it('test_UAT_AC988_a_value_of_the_wrong_shape_for_its_own_field_or_one_for_a_read_only_field_is_refused', async () => {
    // AC-988 — every entry is checked before any is applied, and the shape test
    // is PER FIELD: the region says of each field whether it holds text, one of
    // a closed list, a whole number or a yes/no, and the value is measured
    // against that one.
    const before = draftBytes()

    // A field the region does not expose — the caller resolved against a
    // different region than it is writing to.
    const unknown = await set(A_FULL, { headline: 'Not a field here.' })
    expect(unknown.ok).toBe(false)
    expect(unknown.error!.message).toContain('headline')
    expect(unknown.error!.path).toContain('headline')
    expect(draftBytes()).toBe(before)

    // A value of the wrong shape for THAT field, one shape at a time.
    const wrongShape: Array<[string, unknown]> = [
      // a number, a list, an object and a bit, where text is expected
      ['text', 42],
      ['text', []],
      ['text', {}],
      ['text', true],
      // a fractional and a non-numeric value, where a whole number is expected
      ['fontSizePx', 20.5],
      ['fontSizePx', '24'],
      ['fontSizePx', true],
      // a non-boolean, where a yes/no is expected
      ['italic', 'yes'],
      ['italic', 1],
      // a non-string, where one of a closed list is expected
      ['fontWeight', 400],
    ]
    for (const [name, value] of wrongShape) {
      const label = `${name}=${JSON.stringify(value)}`
      const bad = await set(A_FULL, { [name]: value })
      expect(bad.ok, label).toBe(false)
      expect(bad.error!.code, label).toBe('SCHEMA_INVALID')
      // The offending field is NAMED, so the caller can tell what it got wrong.
      expect(bad.error!.message, label).toContain(name)
      expect(bad.error!.path, label).toContain(name)
      expect(draftBytes(), label).toBe(before)
    }

    // A value that is not one of the choices the field offered. This refusal is
    // made at the field, before the shared whole-definition validator runs,
    // because it is one that validator structurally cannot make: a weight the
    // site serves no face for is perfectly well-formed and safe.
    const offList = await set(A_FULL, { fontWeight: '900' })
    expect(offList.ok).toBe(false)
    expect(offList.error!.message).toContain('900')
    expect(draftBytes()).toBe(before)

    // The same, for an image region: a handle that is safe and well-formed but
    // names no asset the site has. Validation would accept it and the page would
    // then render a broken image with no error at all.
    const image = await get(A_IMAGE)
    expect((image.data!.fields as Field[])[0].enum).not.toContain('/assets/not-here.png')
    const stale = await set(A_IMAGE, { src: '/assets/not-here.png' })
    expect(stale.ok).toBe(false)
    expect(stale.error!.path).toContain('src')
    expect(draftBytes()).toBe(before)
    // The region is still pointing at its previous image.
    expect((await valuesOf(A_IMAGE)).src).toBe('assets/hero.jpg')

    // A value for a field the region offered READ-ONLY. The widget draws such a
    // field unchangeable, so a value for it can only have come from a caller
    // that ignored what the region said about itself.
    expect((await fieldNamed(A_HEADLINE, 'italic'))!.locked).toBe(true)
    const readOnly = await set(A_HEADLINE, { italic: true })
    expect(readOnly.ok).toBe(false)
    expect(readOnly.error!.message).toContain('italic')
    expect(draftBytes()).toBe(before)

    // Every region's existing values are intact after all of it.
    expect(await valuesOf(A_FULL)).toMatchObject({
      text: FULL_COPY,
      fontSizePx: 20,
      fontWeight: '400',
      italic: false,
      textTransform: 'none',
    })
    expect(draftAxes(A_HEADLINE)).not.toHaveProperty('fontStyle')
  })

  // ── being incapable of raw code ────────────────────────────────────────────

  it('test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal', async () => {
    // AC-991 — there are exactly four shapes of field this surface can offer and
    // none of them can carry code. The vocabulary has now grown twice, and every
    // growth is a NARROWING: a closed list can only hand back an option the
    // surface itself supplied, and a whole number and a bit cannot express a
    // character at all.
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    const beforeDoc = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8')).window.document
    const scriptsBefore = beforeDoc.querySelectorAll('script').length
    const stylesBefore = beforeDoc.querySelectorAll('style').length

    const payload = '<script>alert(1)</script><style>*{display:none}</style><b>bold?</b>'

    // A plain-text field stores and renders its content as the region's literal
    // words: the markup creates no element and applies no style.
    const saved = await set(A_HEADLINE, { text: payload })
    expect(saved.ok).toBe(true)
    const doc = new JSDOM(readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8'))
      .window.document
    const el = [...doc.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === payload,
    )
    expect(el, "the payload renders as one region's literal text").toBeTruthy()
    expect(doc.querySelectorAll('script').length).toBe(scriptsBefore)
    expect(doc.querySelectorAll('style').length).toBe(stylesBefore)
    expect(doc.querySelector('b')).toBeNull()

    // The surface's other plain-text field — an image's alt text — leaves the
    // renderer as an ATTRIBUTE rather than as a run of words, so it is a
    // different escape path and earns its own evidence.
    const altSaved = await set(A_IMAGE, { alt: payload })
    expect(altSaved.ok).toBe(true)
    const altDoc = new JSDOM(
      readFileSync(path.join(String(altSaved.data!.rendered), 'index.html'), 'utf8'),
    ).window.document
    const img = altDoc.querySelector(`img[data-l1-path="${A_IMAGE}"]`)
    expect(img, 'the image region renders').toBeTruthy()
    expect(img!.getAttribute('alt')).toBe(payload)
    expect(altDoc.querySelectorAll('script').length).toBe(scriptsBefore)
    expect(altDoc.querySelectorAll('style').length).toBe(stylesBefore)
    expect(altDoc.querySelector('b')).toBeNull()

    // A run of copy exposes at least one field of each of the narrower shapes,
    // which is what makes the sweep below meaningful rather than vacuous.
    const runShapes = (await fieldsOf(A_FULL)).map((f) => f.type)
    for (const shape of CONTROL_SHAPES) expect(runShapes, shape).toContain(shape)

    // Now read EVERY region the render stamps and assert there is no fifth
    // shape, no freeform option, and no mode through which markup could be
    // submitted as code.
    const pageRooted = [...altDoc.querySelectorAll('[data-l1-path]')]
      .filter((n) => n.closest('[data-fc-module]') === null)
      .map((n) => n.getAttribute('data-l1-path')!)
    expect(pageRooted.length).toBeGreaterThan(0)

    const reads: string[][] = [
      ...pageRooted.map((addr) => [addr]),
      [A_SLIDE, '--module', 'gallery', '--slot', 'slide'],
    ]
    const seen = { string: 0, enum: 0, integer: 0, boolean: 0 } as Record<string, number>
    for (const [addr, ...scope] of reads) {
      const got = await get(addr, ...scope)
      expect(got.ok, addr).toBe(true)
      for (const field of got.data!.fields as Field[]) {
        expect(CONTROL_SHAPES, `${addr}/${field.name}`).toContain(field.type)
        if (field.type === 'enum') {
          // A closed list is only narrower than a string if the caller is told
          // what it may return, so the options travel with the descriptor.
          expect(Array.isArray(field.enum), `${addr}/${field.name}`).toBe(true)
          expect(field.enum!.length, `${addr}/${field.name}`).toBeGreaterThan(0)
          for (const option of field.enum!) expect(typeof option).toBe('string')
        }
        if (field.type === 'integer') {
          // A bounded whole number carries its inclusive limits with it.
          expect(typeof field.min, `${addr}/${field.name}`).toBe('number')
          expect(typeof field.max, `${addr}/${field.name}`).toBe('number')
          expect(field.min!, `${addr}/${field.name}`).toBeLessThan(field.max!)
        }
        seen[field.type] += 1
      }
    }
    // The sweep actually saw all four shapes — an all-string page would never
    // enter the branches above and would prove nothing.
    for (const shape of CONTROL_SHAPES) expect(seen[shape], shape).toBeGreaterThan(0)
  })
})
