/**
 * REQ-274 — one projection over both sides: retiring the asymmetric-axis defect
 * as a category.
 *
 * The reference side (a stored capture bundle) and the reproduction side (a live
 * extraction) used to be read by two independent procedures — `flattenCapture`
 * and `flattenSignals`, ~185 lines between them — that happened to return the
 * same `ValueManifest` type. An axis projected on one side and not the other
 * produced no type error, no delta and no diagnostic: the comparator's
 * both-sides guard skipped it and the gate read CLEAN. Four of EPIC-19's
 * twenty-two defects were that one shape, fixed one axis at a time.
 *
 * There was a fifth, and it is the evidence these UATs are built on. REQ-64
 * added `paddingTopPx` / `paddingRightPx` / `paddingBottomPx` / `textAlign` to
 * the live extraction AND to the comparator, and never to `ContentRun`, so the
 * reference recorded nothing, the guard skipped every text run, and four
 * COMPARED axes have read clean by construction on every reproduction of every
 * site since. Recording them is the sibling capture-completeness ticket; saying
 * so instead of passing silently is this one.
 *
 * Six UATs, in the order the ticket asks for them:
 *
 *   1–2. an axis is declared once, and both projections cover it;
 *   3.   a half-projected axis is a statement in the table, not an omission;
 *   4.   the diff reports the one it actually ran into;
 *   5.   the gate says so rather than reading clean — and still passes, because
 *        an unmeasured axis is a fact, never a delta (BUG-106 / BUG-111);
 *   6.   a run that never reached the axis is not told about it.
 *
 * Plus 7: the coalesced-vs-raw asymmetry the ticket explicitly keeps — the two
 * sides' band axes are read from different places, in one row each.
 */
import { describe, expect, it } from 'vitest'
import {
  AXIS_TABLES,
  CAPTURE_SCHEMA,
  FIELD_AXES,
  GEOMETRY_AXES,
  MANIFEST_AXES,
  RUN_AXES,
  SECTION_AXES,
  UNMEASURED_AXES,
  diffManifests,
  flattenCapture,
  flattenSignals,
  formatGateReport,
  observedUnmeasuredAxes,
  reconcileGates,
  unmeasuredAxesOf,
  unsupplied,
  type Capture,
  type ContentRun,
  type RawBand,
  type RawRun,
  type RawSignals,
  type Section,
  type SectionValues,
  type UnmeasuredAxis,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

// ── fixtures: one page, described by each side in its own vocabulary ─────────
//
// The same band and the same run, as a capture bundle records them and as the
// live extractor hands them over. Deliberately BOTH fully populated: the point
// of UAT 2 is that a two-sided axis lands on both manifests, which a sparse
// fixture could satisfy by accident.

function refRun(over: Partial<ContentRun> = {}): ContentRun {
  return {
    role: 'heading',
    text: 'Gigabyte Alchemy',
    color: '#0f172b',
    fontFamily: 'Inter',
    fontSizePx: 48,
    fontWeight: 700,
    lineHeightPx: 56,
    letterSpacingPx: -0.5,
    gradient: { angleDeg: 90, stops: [{ color: '#f5e6a3', position: 0 }] },
    borderLeft: { widthPx: 4, color: '#f5e6a3' },
    accentBox: { x: 32, y: 100, width: 4, height: 56 },
    paddingLeftPx: 24,
    // REQ-302 — the four REQ-64 Type-A axes, which `ContentRun` now records. The
    // comment on the reproduction fixture below used to read "the four the
    // reference cannot record. Present here, and only here"; the reference can
    // record them, so this fixture must carry them or the two-sided coverage
    // check below is asserting a gap that no longer exists.
    paddingTopPx: 12,
    paddingRightPx: 24,
    paddingBottomPx: 12,
    textAlign: 'left',
    surfaceFill: '#e8dfd3',
    surfaceGradient: null,
    renderedTextBox: { x: 40, y: 104, width: 420, height: 48 },
    colorInferred: true,
    // `fontLoaded` stays TRUE on both: it is written only when the intended face
    // did NOT load, so the no-op is absence on both sides — symmetric, which is
    // the invariant, and a `false` here would be a real fontLoad delta.
    fontLoaded: true,
    inlineGroup: 'flow-1',
    inlineIndex: 0,
    inlineBox: { x: 40, y: 100, width: 600, height: 56 },
    textFlow: 'Gigabyte Alchemy ',
    verticalAlign: null,
    fontStyle: null,
    textDecoration: null,
    textTransform: 'uppercase',
    fontVariant: null,
    listMarker: null,
    box: { x: 40, y: 100, width: 600, height: 56 },
    borderRadiusPx: 0,
    borderWidthPx: 0,
    borderColor: null,
    borderStyle: null,
    boxShadow: null,
    surface: null,
    backdropFilter: null,
    blendMode: null,
    opacity: 1,
    outline: null,
    pseudo: null,
    a11yRole: 'heading',
    href: 'https://gigabytealchemy.ai/about',
    headingLevel: 1,
    arrangement: 'stack',
    zIndex: 0,
    filter: null,
    textShadow: null,
    maskEdge: null,
    transformRotateDeg: 0,
    transformScale: 1,
    motion: null,
    ...over,
  }
}

function rawRun(over: Partial<RawRun> = {}): RawRun {
  return {
    role: 'heading',
    text: 'Gigabyte Alchemy',
    color: '#0f172b',
    colorInferred: true,
    fontFamily: 'Inter',
    fontLoaded: true,
    fontSizePx: 48,
    fontWeight: 700,
    fontStyle: null,
    textDecoration: null,
    textTransform: 'uppercase',
    fontVariant: null,
    listMarker: null,
    lineHeightPx: 56,
    letterSpacingPx: -0.5,
    gradientCss: 'linear-gradient(90deg, #f5e6a3 0%)',
    borderLeftWidthPx: 4,
    borderLeftColor: '#f5e6a3',
    accentBox: { x: 32, y: 100, width: 4, height: 56 },
    paddingLeftPx: 24,
    // REQ-64 — the four Type-A run axes. Present on BOTH fixtures since REQ-302
    // added them to `ContentRun`; this side alone carried them before that.
    paddingTopPx: 12,
    paddingRightPx: 24,
    paddingBottomPx: 12,
    textAlign: 'left',
    inlineGroup: 'flow-1',
    inlineIndex: 0,
    inlineBox: { x: 40, y: 100, width: 600, height: 56 },
    textFlow: 'Gigabyte Alchemy ',
    verticalAlign: null,
    surfaceFill: '#e8dfd3',
    surfaceGradientCss: null,
    renderedTextBox: { x: 40, y: 104, width: 420, height: 48 },
    box: { x: 40, y: 100, width: 600, height: 56 },
    surface: null,
    borderRadiusPx: 0,
    borderWidthPx: 0,
    borderColor: null,
    borderStyle: null,
    boxShadow: null,
    backdropFilter: null,
    blendMode: null,
    opacity: 1,
    outline: null,
    pseudo: null,
    a11yRole: 'heading',
    href: 'https://gigabytealchemy.ai/about',
    headingLevel: 1,
    arrangement: 'stack',
    zIndex: 0,
    filter: null,
    textShadow: null,
    maskEdge: null,
    transformRotateDeg: 0,
    transformScale: 1,
    motion: null,
    ...over,
  }
}

function refSection(over: Partial<Section> = {}): Section {
  return {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: {
      kind: 'image',
      color: '#030717',
      // The bundle spells the band's imagery as its own mirrored asset path.
      image: 'assets/AlchemistLabWithTech.png',
      overlay: { color: '#030717', opacity: 0.3 },
    },
    layout: {
      textOverImage: true,
      contentAlign: 'left',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: 1120,
      contentAnchorRatio: 0.53,
    },
    content: [refRun()],
    items: [],
    fields: [],
    ...over,
  }
}

function capture(over: Partial<Capture> = {}): Capture {
  return {
    url: 'https://gigabytealchemy.ai/',
    host: 'gigabytealchemy.ai',
    path: '/',
    capturedAt: '2026-09-18T00:00:00.000Z',
    captureSchema: CAPTURE_SCHEMA,
    viewport: { width: 1280, height: 800 },
    theme: {
      colors: [],
      fonts: [],
      typeScale: [48],
      spacingScalePx: [24],
      containerMaxWidthPx: 1120,
      subScales: {},
    },
    sections: [refSection()],
    assets: [],
    ...over,
  }
}

function rawBand(over: Partial<RawBand> = {}): RawBand {
  return {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    backgroundColor: '#030717',
    // The extractor hands over raw computed CSS, absolute-URL'd by the origin.
    backgroundImage: 'url("https://gigabytealchemy.ai/img/AlchemistLabWithTech.png")',
    colorScheme: 'dark',
    fontFamily: 'Inter',
    textAlign: 'left',
    paddingTopPx: 96,
    paddingBottomPx: 96,
    overlay: { color: '#030717', opacity: 0.3 },
    contentAnchorRatio: 0.53,
    content: [rawRun()],
    items: [],
    fields: [],
    ...over,
  }
}

function signals(over: Partial<RawSignals> = {}): RawSignals {
  return {
    viewport: { width: 1280, height: 800 },
    bands: [rawBand()],
    colorUsage: [],
    fontFaces: [],
    typeScale: [48],
    spacingScalePx: [24],
    containerMaxWidthPx: 1120,
    images: [],
    bodyBackground: '#030717',
    title: 'Gigabyte Alchemy',
  } as RawSignals extends { title: string } ? RawSignals : RawSignals
}

/** Every row of every table, tagged with the scope it projects into. */
const ALL_ROWS = AXIS_TABLES.flatMap((t) =>
  t.rows.map((row) => ({ scope: t.scope, ...(row as unknown as Record<string, unknown>) })),
) as Array<{
  scope: 'manifest' | 'section' | 'element'
  axis: string
  role: 'compared' | 'carried'
  note: string
  reference: unknown
  reproduction: unknown
}>

/** The manifest fields that are containers or positions, not axes — declared in
 *  `value-axes.ts` as having no row, and re-stated here so the coverage check
 *  below fails on a NEW unexplained key rather than quietly widening. */
const STRUCTURAL_KEYS = new Set(['source', 'elements', 'sections', 'engine', 'state', 'index'])

// ── the gate harness ─────────────────────────────────────────────────────────
//
// The narrowest input `reconcileGates` accepts, so the only thing varying
// between UAT 5 and UAT 6 is the values report. Every other gate is clean and
// within its floor, which is what makes "pass, and NOT silent" the whole claim.

function gateOn(values: ReturnType<typeof diffManifests>) {
  return reconcileGates({
    l1Gate: { pass: true, onSample: { pass: true, byWidth: [{ width: 1280, findings: [] }] } },
    coverage: {
      mirroredImages: 0,
      referencedImages: 0,
      unreferencedImages: [],
      sections: 1,
      pageHeightPx: 800,
      pxPerSection: 800,
      findings: [],
    },
    perceptual: { meanDiff: 0, pctOverThreshold: 0, regions: [] },
    values,
  })
}

describe('REQ-274 — one declaration site for every value axis', () => {
  it('test_UAT_FC_REQ-274_every_axis_is_declared_once_with_both_sides_stated', () => {
    // Behaviour 1. A row names the axis, says what it is, says whether the diff
    // compares it, and states BOTH sides — a reader, or an explicit inability to
    // read with the reason. A side left out is a compile error (the row type's
    // properties are required); what this proves at runtime is the other half:
    // no row can satisfy the shape by supplying something that is neither.
    expect(ALL_ROWS.length).toBeGreaterThan(60)

    for (const row of ALL_ROWS) {
      expect(row.axis, 'every row names its axis').toBeTruthy()
      expect(row.role, `${row.axis}: compared or carried`).toMatch(/^(compared|carried)$/)
      expect(row.note.length, `${row.axis}: the note says what the axis is`).toBeGreaterThan(20)

      for (const side of ['reference', 'reproduction'] as const) {
        const declared = row[side]
        expect(declared, `${row.axis}.${side} is stated`).toBeDefined()
        const isReader = typeof declared === 'function'
        const reason = (declared as { unsupplied?: string })?.unsupplied
        expect(isReader || typeof reason === 'string', `${row.axis}.${side} is a reader or an unsupplied(reason)`).toBe(
          true,
        )
        // An inability is only useful if it says WHY, so the enumeration can
        // report something an operator can act on.
        if (!isReader) expect(reason!.length, `${row.axis}.${side} says why it cannot`).toBeGreaterThan(20)
      }

      // A row neither side can read is not an axis, it is a typo.
      expect(
        typeof row.reference === 'function' || typeof row.reproduction === 'function',
        `${row.axis}: at least one side can read it`,
      ).toBe(true)
    }

    // ONE declaration site: an element axis belongs to exactly one of the three
    // element tables, so there is never a second row to forget to update.
    const elementAxes = [...GEOMETRY_AXES, ...RUN_AXES, ...FIELD_AXES].map((r) => r.axis)
    const runAndGeometry = [...GEOMETRY_AXES, ...RUN_AXES].map((r) => r.axis)
    const fieldAndGeometry = [...GEOMETRY_AXES, ...FIELD_AXES].map((r) => r.axis)
    expect(new Set(runAndGeometry).size, 'no axis is declared twice on the text-run route').toBe(runAndGeometry.length)
    expect(new Set(fieldAndGeometry).size, 'no axis is declared twice on the text-free route').toBe(
      fieldAndGeometry.length,
    )
    expect(elementAxes.length).toBeGreaterThan(50)

    // The section and manifest tables are single tables, so uniqueness there is
    // the whole claim.
    const sectionAxes = SECTION_AXES.map((r) => r.axis)
    const manifestAxes = MANIFEST_AXES.map((r) => r.axis)
    expect(new Set(sectionAxes).size).toBe(sectionAxes.length)
    expect(new Set(manifestAxes).size).toBe(manifestAxes.length)
  })

  it('test_UAT_FC_REQ-274_both_projections_cover_every_two_sided_axis', () => {
    // Behaviour 1, the other half: the table is not a description of the
    // projections, it IS the projections. Given inputs that populate everything
    // either side can record, every two-sided row lands on BOTH manifests — and
    // nothing lands on either manifest that the table does not declare, which is
    // what closes the hole (an axis written into one projection body and not the
    // other has nowhere to come from any more).
    const expected = flattenCapture(capture())
    const actual = flattenSignals(signals(), 'draft:fixture')

    const present = (o: object, axis: string): boolean => (o as Record<string, unknown>)[axis] !== undefined
    const twoSided = ALL_ROWS.filter((r) => typeof r.reference === 'function' && typeof r.reproduction === 'function')
    const fieldOnly = new Set(FIELD_AXES.map((f) => f.axis).filter((a) => !GEOMETRY_AXES.some((g) => g.axis === a)))

    // "Present on both sides or on neither" — the ticket's own words, and the
    // assertion that actually closes the category. A few axes collapse a no-op
    // to absence by design (`fontLoaded` is written only when the face did NOT
    // load), so demanding presence would be demanding the wrong thing; demanding
    // AGREEMENT is the invariant that was broken.
    let landed = 0
    for (const row of twoSided) {
      if (row.scope === 'manifest') {
        expect(present(expected, row.axis), `manifest ${row.axis}`).toBe(present(actual, row.axis))
        if (present(expected, row.axis)) landed++
      } else if (row.scope === 'section') {
        expect(present(expected.sections[0], row.axis), `section ${row.axis}`).toBe(
          present(actual.sections[0], row.axis),
        )
        if (present(expected.sections[0], row.axis)) landed++
      } else if (fieldOnly.has(row.axis)) {
        // Field-only rows need a text-free element to land on, and this fixture
        // is a text run. They are covered by the declaration checks above.
        continue
      } else {
        expect(present(expected.elements[0], row.axis), `run ${row.axis}`).toBe(present(actual.elements[0], row.axis))
        if (present(expected.elements[0], row.axis)) landed++
      }
    }
    // …and the fixture is not vacuous: the overwhelming majority of the
    // two-sided rows really did land on both manifests.
    expect(landed).toBeGreaterThan(35)

    // Nothing reaches a manifest except through a row.
    const declared = new Set(ALL_ROWS.map((r) => r.axis))
    const unexplained: string[] = []
    for (const m of [expected, actual]) {
      for (const k of Object.keys(m)) if (!declared.has(k) && !STRUCTURAL_KEYS.has(k)) unexplained.push(`manifest.${k}`)
      for (const s of m.sections) {
        for (const k of Object.keys(s)) if (!declared.has(k) && !STRUCTURAL_KEYS.has(k)) unexplained.push(`section.${k}`)
      }
      for (const e of m.elements) {
        for (const k of Object.keys(e)) if (!declared.has(k) && !STRUCTURAL_KEYS.has(k)) unexplained.push(`element.${k}`)
      }
    }
    expect(unexplained, 'every projected key is a declared axis').toEqual([])
  })

  it('test_UAT_FC_REQ-274_a_one_sided_compared_axis_is_reported_unmeasured', () => {
    // Behaviour 2. The mechanism, exercised on a table that is not the live one:
    // add a row with a reference-side reader and no reproduction-side reader and
    // the axis reports UNMEASURED. Provable without first breaking the real
    // projection to prove it.
    const synthetic = unmeasuredAxesOf([
      {
        scope: 'element',
        rows: [
          {
            axis: 'placeholderColor',
            role: 'compared',
            reference: (e: unknown) => e,
            reproduction: unsupplied('the reproduction-side extractor has no reader for this axis yet'),
          },
          {
            axis: 'src',
            role: 'carried',
            reference: (e: unknown) => e,
            reproduction: unsupplied('carried for the fold, so a missing side is a fold gap, not gate evidence'),
          },
        ],
      },
    ])
    expect(synthetic).toEqual([
      {
        axis: 'placeholderColor',
        scope: 'element',
        side: 'reproduction',
        reason: 'the reproduction-side extractor has no reader for this axis yet',
      },
    ])

    // And the live table's own answer. This used to be REQ-64's four Type-A
    // text-run axes — the FIFTH instance of the category the four earlier fixes
    // each closed one at a time. REQ-302 closed it, and it was the last one, so
    // the honest answer today is NONE.
    //
    // That is the success condition for this whole module, not the loss of a
    // fixture: the declaration exists so a gap can be seen and then closed, and
    // an empty list is what "all of them are closed" looks like. The mechanism
    // is proven by the synthetic table above, which is why it was written
    // against a table that is not the live one — precisely so this assertion
    // could go to zero without taking the evidence with it.
    expect(UNMEASURED_AXES.map((u) => u.axis).sort()).toEqual([])

    // The shape of a live row is still pinned, against whatever the table
    // declares if it ever declares one again — so a future gap cannot arrive
    // malformed just because none is open today.
    for (const u of UNMEASURED_AXES) {
      expect(['manifest', 'section', 'element']).toContain(u.scope)
      expect(['reference', 'reproduction']).toContain(u.side)
      expect(u.reason.length).toBeGreaterThan(0)
    }
  })

  it('test_UAT_FC_REQ-274_the_diff_reports_the_unmeasured_axis_it_ran_into', () => {
    // The fact reaches the report, off the REAL projections. This was written
    // against `paddingTopPx` — the reproduction carried 12, the reference could
    // carry nothing, and the comparator therefore compared neither. REQ-302
    // closed that gap, so the gap is DECLARED here instead of borrowed from the
    // live table (`declaredUnmeasured`, the same parameter `unmeasuredAxesOf`
    // has always taken, forwarded one step into `diffManifests`).
    //
    // What is being proven is unchanged and is not about padding: a declared
    // one-sided axis that the comparison actually RAN INTO reaches the report.
    // Borrowing a live gap only ever made the evidence hostage to that gap
    // staying open, which is the opposite of what the module is for.
    const DECLARED: readonly UnmeasuredAxis[] = [
      {
        axis: 'paddingTopPx',
        scope: 'element',
        side: 'reference',
        reason: 'the reference-side projection has no reader for this axis yet',
      },
    ]

    const expected = flattenCapture(capture({ sections: [refSection({ content: [refRun({ paddingTopPx: undefined })] })] }))
    const actual = flattenSignals(signals(), 'draft:fixture')

    // The precondition the declaration describes: one side carries the value
    // and the other does not.
    expect(expected.elements[0].paddingTopPx, 'this side cannot supply it').toBeUndefined()
    expect(actual.elements[0].paddingTopPx, 'and this side can').toBe(12)

    const report = diffManifests(expected, actual, { declaredUnmeasured: DECLARED })
    expect(report.unmeasuredAxes.map((u) => u.axis)).toEqual(['paddingTopPx'])
    expect(report.unmeasuredAxes[0].reason).toMatch(/no reader for this axis yet/)

    // It reports what was NOT measured and never manufactures a defect out of
    // the gap — the half that keeps an unmeasured axis a report fact rather
    // than a verdict.
    expect(report.deltas.filter((d) => /paddingTopPx/.test(d.property))).toEqual([])

    // And the counterweight, on the same pair of manifests: with nothing
    // declared, nothing is reported. The row comes from the declaration, not
    // from the comparator noticing an absence on its own.
    expect(diffManifests(expected, actual, { declaredUnmeasured: [] }).unmeasuredAxes).toEqual([])
  })

  it('test_UAT_FC_REQ-274_the_gate_says_so_rather_than_reading_clean', () => {
    // Behaviour 2's consequence, in the place BUG-106 / BUG-111 put theirs. The
    // run PASSES — an unmeasured axis is a report fact, never a verdict, and the
    // ticket's own acceptance is "no regression in the gate verdict" — but the
    // pass rung no longer claims there is nothing outstanding, and it names the
    // axes rather than counting them, because "1 axis unmeasured" is not
    // actionable and "the reference records no text-run padding" is.
    // REQ-302 — the declared gap, for the reason given on the UAT above: the
    // live table no longer has one, and the behaviour under test is the gate's,
    // not the table's.
    const DECLARED: readonly UnmeasuredAxis[] = [
      {
        axis: 'paddingTopPx',
        scope: 'element',
        side: 'reference',
        reason: 'the reference-side projection has no reader for this axis yet',
      },
    ]
    const expected = flattenCapture(capture({ sections: [refSection({ content: [refRun({ paddingTopPx: undefined })] })] }))
    const report = diffManifests(expected, flattenSignals(signals(), 'draft:fixture'), {
      declaredUnmeasured: DECLARED,
    })
    const gate = gateOn(report)

    expect(gate.verdict).toBe('pass')
    expect(gate.pass).toBe(true)
    expect(gate.values.deltas).toBe(0)
    expect(gate.values.unmeasuredAxes.map((u) => u.axis)).toContain('paddingTopPx')
    expect(gate.nextStep).not.toBe('Nothing outstanding from this gate.')
    expect(gate.nextStep).toMatch(/could only be read on ONE side of the projection/)
    expect(gate.nextStep).toMatch(/no reader for this axis yet/)

    // And the operator reading the terminal sees it on the values block, not
    // only in the JSON — the trip BUG-111 exists to remove.
    const printed = formatGateReport(gate, 'gigabytealchemy.ai/index')
    expect(printed).toMatch(/compared axis\/axes readable on ONE side only/)
    expect(printed).toMatch(/element\.paddingTopPx/)
  })

  it('test_UAT_FC_REQ-274_an_axis_the_run_never_reached_is_not_reported', () => {
    // The counterweight. `UNMEASURED_AXES` is a property of the INSTRUMENT and is
    // true of every comparison; a permanent row on every report is a row nobody
    // reads by the time it matters. An axis is unmeasured HERE only when the side
    // that can read it actually carried a value — there was something to compare
    // and nothing to compare it with.
    const bare = (source: string): ValueManifest => ({
      source,
      elements: [
        {
          text: 'Gigabyte Alchemy',
          role: 'heading',
          color: '#0f172b',
          fontFamily: 'Inter',
          fontSizePx: 48,
          fontWeight: 700,
        } satisfies ValueElement,
      ],
      sections: [{ index: 0, overlay: null, contentAnchorRatio: null } satisfies SectionValues],
    })

    expect(observedUnmeasuredAxes(bare('ref'), bare('draft'))).toEqual([])

    const gate = gateOn(diffManifests(bare('ref'), bare('draft')))
    expect(gate.verdict).toBe('pass')
    expect(gate.values.unmeasuredAxes).toEqual([])
    expect(gate.nextStep).toBe('Nothing outstanding from this gate.')
  })

  it('test_UAT_FC_REQ-274_the_coalesced_vs_raw_asymmetry_stays_and_is_named', () => {
    // Behaviour 4, and behaviour 3's re-landing of REQ-270 #2. The two sides
    // genuinely read a band's axes from different places — the bundle stores a
    // mirrored `assets/…` path and a coalesced style-scope band, the extractor
    // hands over raw computed `background-image` CSS on a raw `<body>` child —
    // and each of those is ONE ROW with two readers rather than two bodies.
    const expected = flattenCapture(capture())
    const actual = flattenSignals(signals(), 'draft:fixture')

    expect(expected.sections[0].backgroundImageUrl).toBe('assets/AlchemistLabWithTech.png')
    expect(actual.sections[0].backgroundImageUrl).toBe(
      'https://gigabytealchemy.ai/img/AlchemistLabWithTech.png',
    )
    // Same axis, two spellings of the same bytes — which is exactly why the
    // comparator joins them by mirrored basename and reports no delta.
    expect(diffManifests(expected, actual).deltas.filter((d) => d.property === 'backgroundImage')).toEqual([])

    // The band's text alignment is `layout.contentAlign` on one side and
    // `textAlign` on the other. One row, one axis name downstream.
    expect(expected.sections[0].textAlign).toBe('left')
    expect(actual.sections[0].textAlign).toBe('left')

    // REQ-271's schema gate lives in the row, not beside it: a pre-schema-3
    // bundle recorded a transparent band as an opaque fabrication, so the axis
    // reads UNMEASURED there rather than asserting a fill it never took.
    const older = flattenCapture(capture({ captureSchema: 2 }))
    expect(older.sections[0].surfaceFill, 'below schema 3 the axis was not measured').toBeUndefined()
    expect(expected.sections[0].surfaceFill, 'at schema 3 it is').toBe('#030717')

    // And the join itself is untouched: the two sides' section INDICES still do
    // not correspond, and the diff still pairs bands by geometry.
    expect(actual.sections[0].index).toBe(0)
    expect(actual.sections[0].box).toEqual({ x: 0, y: 0, width: 1280, height: 800 })
  })
})
