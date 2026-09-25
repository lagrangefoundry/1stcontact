/**
 * REQ-308 issue 1 — a control whose only ink is its placeholder was captured
 * with no typography at all.
 *
 * A placeholder-only control has no text run, so it went down the capture's
 * TEXT-FREE path (`fieldsUnder`), whose type axes were declared constants:
 * `fontSizePx: 0`, `fontFamily: ''`, `fontWeight: 0`, and no `lineHeightPx` key
 * at all. On BOTH sides of every diff, because both sides project through the
 * same table — so the fold had nothing to write onto the control's L1 axes, the
 * renderer's zero-look `font: inherit` reset was the only thing that governed,
 * and the field pass of `values-diff` compared no typography either.
 *
 * Measured on `storage/references/gigabytealchemy.ai/index`: the one `<textarea>`
 * on the page painted its placeholder three pixel rows high against the
 * reference (ink rows 12–29 against 15–29, identical columns, identical glyph
 * widths, identical darkest pixel) because its reference line-height is 24px and
 * the reproduction's was `normal`. That one control owned **159.48 of 159.48** of
 * the round's ranked region score — 100% of it — beside **zero** value deltas.
 * Only the perceptual eye ever saw it.
 *
 * Why only the textarea: a single-line `<input>` centres its inner editor
 * regardless of `line-height`, so the three inputs agreed to the pixel. A
 * `<textarea>`'s first line sits at the content-box top and its glyphs are offset
 * by the half-leading — the one metric neither side recorded.
 *
 * The fix runs the length of the pipeline, because every hop had the same hole:
 * capture reads it, the bundle carries it, the axis table declares it, the fold
 * writes it, the renderer emits it, and the diff compares it.
 */
import { describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CAPTURE_SCHEMA,
  chromiumAvailable,
  cmdCapturePage,
  staleCaptureAxes,
  type Capture,
  type Field,
  type MultiStateCapture,
} from '../tools/generate/src/cli/capture'
import { diffManifests, type StateProjection, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'
import { foldToL1 } from '../tools/generate/src'
import type { FoldedForm } from '../tools/generate/src/l1'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
import { renderL1Fragment } from '../packages/framework/src/l1/render'
import { contactFormControls } from '../packages/framework/src/modules/contact-form/controls'
import { validateL1 } from '../packages/site-schema/src/index'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', path.extname(file) === '.html' ? 'text/html; charset=utf-8' : 'image/png')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

async function captureFixture(): Promise<Capture> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'req308-'))
  try {
    const { capture } = await cmdCapturePage(`${server.origin}/req308-control-type.html`, fsReferenceStore(cwd))
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const allFields = (c: Capture): Field[] => c.sections.flatMap((s) => s.fields ?? [])
const fieldByName = (c: Capture, name: string): Field => {
  const field = allFields(c).find((f) => f.accessibleName === name)
  expect(field, `control "${name}" captured`).toBeDefined()
  return field!
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// Captured once and shared — a real Chromium run is the expensive part.
const fixture: Capture | undefined = browserOk ? await captureFixture() : undefined

// ── the shared non-browser fixture: a control as the manifest carries it ─────

/**
 * A text-free control element. `typed` false is the PRE-REQ-308 shape, byte for
 * byte: the constants every text-free element carried, which is exactly what a
 * stored bundle taken by an older extractor still holds.
 */
const control = (over: Partial<ValueElement> = {}): ValueElement =>
  ({
    role: 'textbox',
    text: 'Your message',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    accessibleName: 'Your message',
    nameSource: 'placeholder',
    controlType: 'textarea',
    placeholderColor: '#746f69',
    box: { x: 664, y: 3916, width: 528, height: 146 },
    ...over,
  }) as ValueElement

/** The gigabytealchemy textarea as the capture now records it. */
const typedControl = (over: Partial<ValueElement> = {}): ValueElement =>
  control({ fontFamily: 'Helvetica Neue, Arial, sans-serif', fontSizePx: 16, fontWeight: 500, lineHeightPx: 24, ...over })

const mani = (source: string, el: ValueElement): ValueManifest =>
  ({ source, elements: [el], sections: [] }) as ValueManifest
const props = (d: { property: string }[]): string[] => d.map((x) => x.property)

describe('REQ-308 — the capture reads a placeholder-only control’s type', () => {
  itB('test_UAT_FC_REQ-308_capture_records_a_placeholder_only_controls_type', () => {
    // THE FAILURE, on the page's own textarea: every one of these read `0` / `''`
    // / absent, on both sides of the diff, so nothing downstream could have
    // written the type and nothing could have compared it.
    const message = fieldByName(fixture!, 'Your message')
    expect(message.controlType).toBe('textarea')
    expect(message.fontSizePx).toBe(16)
    expect(message.fontWeight).toBe(500)
    expect(message.fontFamily).toContain('Helvetica Neue')
    // The axis the three-pixel shift was made of: an AUTHORED leading, which the
    // renderer's `font: inherit` reset otherwise replaces with `normal`.
    expect(message.lineHeightPx).toBe(24)
  })

  itB('test_UAT_FC_REQ-308_the_placeholder_pseudo_element_is_what_is_read', () => {
    // The placeholder is painted by a UA pseudo-element, and it can carry type of
    // its own — the control's own computed style is NOT the same measurement.
    // `#name::placeholder` authors 13px/300/20px over a control authoring
    // 16px/500/24px, so reading the element would report a size the page never
    // paints.
    const named = fieldByName(fixture!, 'Your name')
    expect(named.fontSizePx).toBe(13)
    expect(named.fontWeight).toBe(300)
    expect(named.lineHeightPx).toBe(20)
  })

  itB('test_UAT_FC_REQ-308_line_height_normal_is_recorded_as_normal', () => {
    // `normal`'s used value is a font metric no computed style exposes, so it is
    // recorded as null exactly as a text run records it — a MEASUREMENT of "this
    // control has no authored leading", not a gap. The control's other type axes
    // are still read, which is what tells the two apart.
    const loose = fieldByName(fixture!, 'Your email')
    expect(loose.fontSizePx).toBe(16)
    expect(loose.lineHeightPx ?? null).toBeNull()
  })

  itB('test_UAT_FC_REQ-308_an_element_with_no_type_still_has_none', () => {
    // The discrimination. A divider and an image are text-free too, and neither
    // has any type to describe — recording one for them would invent a value and
    // would fire a delta on every page that has a rule or a picture.
    const textFree = allFields(fixture!).filter((f) => !f.controlType)
    expect(textFree.length, 'the rule and the mark were captured').toBeGreaterThanOrEqual(2)
    for (const f of textFree) {
      expect(f.fontSizePx ?? 0, `${f.a11yRole} records no size`).toBe(0)
      expect(f.fontFamily ?? '', `${f.a11yRole} records no family`).toBe('')
      expect(f.lineHeightPx ?? null, `${f.a11yRole} records no leading`).toBeNull()
    }
  })
})

describe('REQ-308 — a stored bundle says it cannot express the new axis', () => {
  it('test_UAT_FC_REQ-308_capture_schema_names_the_control_type_axis', () => {
    // The ticket's own note: this value is PERSISTED in the bundle, so landing the
    // extractor change moves nothing until the operator re-captures — `1c refold`
    // cannot pick it up. REQ-270's machinery is what says so out loud, rather than
    // leaving the next round to re-measure a residual whose fix already shipped.
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(6)

    const band = (fields: Field[]): Capture['sections'][number] =>
      ({
        box: { x: 0, y: 0, width: 1280, height: 400 },
        screenshot: { x: 0, y: 0, width: 1280, height: 400 },
        background: { kind: 'color', color: '#ffffff' },
        layout: {
          textOverImage: false,
          contentAlign: 'left',
          arrangement: 'stack',
          columns: 1,
          contentMaxWidthPx: null,
          contentAnchorRatio: null,
        },
        content: [],
        items: [],
        fields,
      }) as Capture['sections'][number]
    const bundle = (schema: number, fields: Field[]): Capture =>
      ({
        url: 'http://fixture.test/',
        host: 'fixture.test',
        path: '/',
        capturedAt: '2026-09-23T01:58:40.658Z',
        captureSchema: schema,
        viewport: { width: 1280, height: 800 },
        theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
        sections: [band(fields)],
        assets: [],
      }) as Capture
    const oldField = { a11yRole: 'textbox', accessibleName: 'Your message', fontSizePx: 0 } as unknown as Field
    const newField = { a11yRole: 'textbox', accessibleName: 'Your message', fontSizePx: 16 } as unknown as Field

    // The gigabytealchemy bundle exactly: schema 5, controls carrying the constant.
    const stale = staleCaptureAxes(bundle(5, [oldField]))
    expect(stale.map((a) => a.axis).join(' | ')).toMatch(/fontSizePx/)

    // …and the probe only ever REMOVES an axis: a bundle that demonstrably carries
    // a real size is not told it is missing it, whatever its stamp says.
    const repaired = staleCaptureAxes(bundle(5, [newField]))
    expect(repaired.map((a) => a.axis).join(' | ')).not.toMatch(/fontSizePx/)
  })
})

describe('REQ-308 — L1, the fold and the renderer carry the type through', () => {
  it('test_UAT_FC_REQ-308_l1_accepts_a_controls_type_on_its_existing_axes', () => {
    // No new axis anywhere: `l1ControlAxesSchema` is the TEXT axes plus
    // `placeholderColor`, so the type it already had room for is the type the
    // capture now fills in. The bag is still closed — it gained no permission.
    const doc = (axes: Record<string, unknown>) => ({
      widths: [1280],
      root: {
        kind: 'box' as const,
        children: [
          {
            kind: 'control',
            control: 'message',
            axes,
            geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 528, height: 146 }] },
          },
        ],
      },
    })
    expect(validateL1(doc({ fontFamily: 'Helvetica Neue, Arial, sans-serif', fontSizePx: 16, lineHeightPx: 24 })).ok).toBe(true)
    expect(validateL1(doc({ placeholderFontSizePx: 16 })).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-308_fold_authors_the_captured_control_type', () => {
    const projections: StateProjection[] = [1024, 1280, 1440].map((w) => ({
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: {
        source: `t:${w}`,
        elements: [
          typedControl({ accessibleName: 'Your name', text: 'Your name', box: { x: 88, y: 200, width: 320, height: 50 } }),
          typedControl({ box: { x: 88, y: 262, width: 320, height: 146 } }),
        ],
        sections: [] as never,
        viewport: { width: w, height: 800 },
      },
    }))
    const forms: FoldedForm[] = []
    foldToL1({ url: 'http://fixture.test/', notes: [], projections }, { forms })
    expect(forms.length, 'the two controls clustered into one form').toBe(1)
    type Axes = { fontFamily?: string; fontSizePx?: number; fontWeight?: number; lineHeightPx?: number }
    const controls = (forms[0].form as { children?: Array<{ axes?: Axes }> }).children ?? []
    expect(controls.length).toBeGreaterThanOrEqual(2)
    for (const c of controls) {
      expect(c.axes?.fontSizePx).toBe(16)
      expect(c.axes?.fontWeight).toBe(500)
      expect(c.axes?.lineHeightPx).toBe(24)
      expect(c.axes?.fontFamily).toContain('Helvetica Neue')
    }
  })

  it('test_UAT_FC_REQ-308_a_pre_req308_bundle_folds_exactly_as_it_did', () => {
    // The whole guard is a real size, which the constant `0` cannot be. A document
    // folded from a bundle taken before the extractor read the axis emits no type
    // at all, so it renders precisely as it did.
    const projections: StateProjection[] = [1024, 1280, 1440].map((w) => ({
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: {
        source: `t:${w}`,
        elements: [
          control({ accessibleName: 'Your name', text: 'Your name', box: { x: 88, y: 200, width: 320, height: 50 } }),
          control({ box: { x: 88, y: 262, width: 320, height: 146 } }),
        ],
        sections: [] as never,
        viewport: { width: w, height: 800 },
      },
    }))
    const forms: FoldedForm[] = []
    foldToL1({ url: 'http://fixture.test/', notes: [], projections }, { forms })
    type Axes = { fontSizePx?: number; lineHeightPx?: number }
    const controls = (forms[0].form as { children?: Array<{ axes?: Axes }> }).children ?? []
    for (const c of controls) {
      expect(c.axes?.fontSizePx).toBeUndefined()
      expect(c.axes?.lineHeightPx).toBeUndefined()
    }
  })

  it('test_UAT_FC_REQ-308_fold_keeps_a_control_type_that_varies_across_the_ladder', () => {
    // BUG-18's defect, on the route BUG-18 did not cover: `axes` is read off the
    // WIDEST cell only, so a control whose type shrinks at mobile would be pinned
    // to its desktop size at every width. A control's type earns a track on the
    // same terms a text run's does.
    const sizes: Record<number, number> = { 375: 14, 1024: 15, 1280: 16 }
    const projections: StateProjection[] = [375, 1024, 1280].map((w) => ({
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: {
        source: `t:${w}`,
        elements: [
          typedControl({
            accessibleName: 'Your name',
            text: 'Your name',
            fontSizePx: sizes[w],
            box: { x: 88, y: 200, width: 320, height: 50 },
          }),
          typedControl({ fontSizePx: sizes[w], box: { x: 88, y: 262, width: 320, height: 146 } }),
        ],
        sections: [] as never,
        viewport: { width: w, height: 800 },
      },
    }))
    const forms: FoldedForm[] = []
    foldToL1({ url: 'http://fixture.test/', notes: [], projections }, { forms })
    type Node = { responsive?: { fontSizePx?: { keyframes: Array<{ at: number; value: number }> } } }
    const controls = (forms[0].form as { children?: Node[] }).children ?? []
    for (const c of controls) {
      const track = c.responsive?.fontSizePx?.keyframes
      expect(track, 'a type that varies earns a track').toBeDefined()
      expect(track!.map((k) => [k.at, k.value])).toEqual([
        [375, 14],
        [1024, 15],
        [1280, 16],
      ])
    }
    // …and the leading, which does NOT vary, stays a scalar rather than being
    // bloated into a track of one repeated value.
    for (const c of controls) expect((c as { responsive?: { lineHeightPx?: unknown } }).responsive?.lineHeightPx).toBeUndefined()
  })

  it('test_UAT_FC_REQ-308_renderer_emits_the_type_over_its_own_font_reset', () => {
    // The renderer's zero-look baseline pushes `font: inherit` into every control
    // BEFORE the axes, precisely so an authored axis still wins. That ordering is
    // what makes the emitted leading govern instead of the body's — and it is what
    // moves the placeholder's first line box back onto the reference's.
    const controls = contactFormControls(
      [{ name: 'message', label: 'Your message', labelMode: 'placeholder', type: 'textarea', required: false }],
      'Send',
    )
    const authored = renderL1Fragment(
      [
        {
          kind: 'control',
          control: 'message',
          axes: { fontFamily: 'Helvetica Neue, Arial, sans-serif', fontSizePx: 16, fontWeight: 500, lineHeightPx: 24 },
        },
      ],
      'cf',
      controls,
    )
    expect(authored.css).toMatch(/line-height: 24px/)
    expect(authored.css).toMatch(/font-size: 16px/)
    expect(authored.css).toMatch(/font-weight: 500/)
    expect(authored.css).toMatch(/font-family: [^;]*Helvetica Neue/)
    // The reset is still there, and still ahead of them.
    expect(authored.css.indexOf('font: inherit')).toBeLessThan(authored.css.indexOf('line-height: 24px'))

    // Absent, the pre-REQ-308 render is unchanged: `font: inherit` alone, which is
    // exactly the `normal` line box the reproduction used to paint against.
    const silent = renderL1Fragment([{ kind: 'control', control: 'message', axes: {} }], 'cf', controls)
    expect(silent.css).toMatch(/font: inherit/)
    expect(silent.css).not.toMatch(/line-height:/)
  })
})

describe('REQ-308 — and the values diff can finally see it', () => {
  it('test_UAT_FC_REQ-308_values_diff_reports_a_control_type_difference', () => {
    // The gigabytealchemy shape: same name, same role, same box to the byte, same
    // placeholder ink — and the whole of the type different. Every axis this pass
    // compared agreed, so the element that owned 100% of the ranked pixel residual
    // produced `deltas: []`.
    const seen = diffManifests(
      mani('ref', typedControl()),
      mani('act', typedControl({ fontSizePx: 20, fontWeight: 700, fontFamily: 'Georgia, serif' })),
    )
    expect(props(seen.deltas)).toContain('fontSizePx')
    expect(props(seen.deltas)).toContain('fontWeight')
    expect(props(seen.deltas)).toContain('fontFamily')

    // Agreement is silent.
    const agree = diffManifests(mani('ref', typedControl()), mani('act', typedControl()))
    expect(props(agree.deltas)).toEqual([])
  })

  it('test_UAT_FC_REQ-308_the_three_pixel_leading_difference_is_a_delta', () => {
    // THE DEFECT ITSELF, as the instrument now reads it: a reference leading of
    // 24px against a reproduction the fold left on `normal`. This is the one axis
    // where an absent value is NOT skipped — the both-sides guard above has already
    // established that both sides ran a typography-recording extractor, so `normal`
    // here is a measurement, and skipping it would leave the instrument blind to
    // its own defect the moment the fold stopped emitting the axis.
    const blind = diffManifests(
      mani('ref', typedControl()),
      mani('act', typedControl({ lineHeightPx: undefined })),
    )
    const lh = blind.deltas.find((d) => d.property === 'lineHeightPx')
    expect(lh, 'a reproduction on `normal` against an authored 24px is a delta').toBeDefined()
    expect(lh!.actual).toBe('normal')
    expect(lh!.expected).toBe('24')

    // Symmetric: a reference on `normal` against a reproduction that invented a
    // leading is the same defect facing the other way.
    const inverted = diffManifests(
      mani('ref', typedControl({ lineHeightPx: undefined })),
      mani('act', typedControl()),
    )
    expect(inverted.deltas.find((d) => d.property === 'lineHeightPx')?.expected).toBe('normal')

    // Both on `normal` agree — an absence shared is not a difference.
    const both = diffManifests(
      mani('ref', typedControl({ lineHeightPx: undefined })),
      mani('act', typedControl({ lineHeightPx: undefined })),
    )
    expect(props(both.deltas)).not.toContain('lineHeightPx')
  })

  it('test_UAT_FC_REQ-308_a_pre_req308_reference_stays_inert', () => {
    // A stored bundle taken before the extractor read the axis carries the
    // constants. Comparing them would fire a type delta against every control on
    // every page — the false-positive this guard exists to prevent, and the reason
    // the guard is a real SIZE rather than the presence of a key.
    const old = diffManifests(mani('ref', control()), mani('act', typedControl()))
    expect(props(old.deltas)).not.toContain('fontSizePx')
    expect(props(old.deltas)).not.toContain('lineHeightPx')
    expect(props(old.deltas)).not.toContain('fontFamily')

    // …and so does a text-free element that is not a control at all: an image and a
    // divider read the constant on both sides for ever.
    const image = (over: Partial<ValueElement> = {}): ValueElement =>
      control({ a11yRole: 'img', accessibleName: 'A mark', text: 'A mark', controlType: null, placeholderColor: null, ...over })
    const media = diffManifests(mani('ref', image()), mani('act', image()))
    expect(props(media.deltas)).not.toContain('fontSizePx')
  })

  it('test_UAT_FC_REQ-308_the_controls_card_shows_the_type_it_now_compares', () => {
    // REQ-51's grouped view is what an operator reads, and a control's card listed
    // its name, where the name renders, its placeholder ink and its box — every row
    // agreeing, beside a textarea painting its placeholder three pixels off. The
    // type rows are what make the card say what the diff now knows.
    const report = diffManifests(
      mani('ref', typedControl()),
      mani('act', typedControl({ fontSizePx: 20, lineHeightPx: undefined })),
    )
    const card = report.objects.find((o) => o.kind === 'control')
    expect(card, 'the control got a card').toBeDefined()
    const rows = new Map(card!.params.map((r) => [r.name, r]))
    expect(rows.get('fontSizePx')?.expected).toBe('16')
    expect(rows.get('fontSizePx')?.actual).toBe('20')
    // An absent leading on a control whose type WAS read is `normal`, not `—`:
    // a dash beside a reference's `24` reads as a gap in the report rather than
    // as the defect it is.
    expect(rows.get('lineHeightPx')?.actual).toBe('normal')
    expect(rows.get('lineHeightPx')?.expected).toBe('24')
  })
})
