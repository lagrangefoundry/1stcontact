/**
 * Reconciliation UATs for story-24098299 —
 * "End-to-end 3-probe reproduction acceptance gate".
 *
 * One UAT per acceptance criterion, exercised at the module boundary
 * (`tools/generate/src` exports), against the analytic browser-free evaluator,
 * the three acceptance probes, the combined gate, and demand-driven structure
 * recovery.
 *
 *   AC-705  sample-fidelity probe matches reproduced boxes to the oracle
 *           (text by normalized text, image/box by kind — both by document-order
 *           occurrence; controls and empty runs excluded from the measure)
 *   AC-706  off-sample probe asserts the envelope at unsampled widths
 *   AC-707  content-robustness probe under perturbed (grown) content
 *   AC-708  combined gate over the absolute-base / structure-overlay split
 *   AC-709  demand-driven recovery promotes only the colliding regions, region-
 *           aware and recursive, leaving nothing pinned behind
 *   AC-710  each probe residual / finding is diagnostic
 *   AC-724  value-render is deterministic and per-occurrence faithful
 */
import { describe, expect, it } from 'vitest'
import {
  contentRobustnessProbe,
  evaluateLayout,
  foldToL1,
  offSampleProbe,
  promoteToFlow,
  sampleFidelityProbe,
  threeProbeGate,
} from '../tools/generate/src'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const HEADLINE = 'Front door'
const BODY = 'Body copy line'
const CAPTION = 'Caption row'

/** A text run with a box — the only fields the fold + probes read. */
function text(t: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box,
  }
}

/**
 * A fluid 3-run stack captured across the 6 ladder widths at y=100/170/240 with
 * a ~70px gap. At rest (and at the 500/900 off-sample widths) it renders sane;
 * perturbed 2.5× each run's pinned box grows to 120px and overruns the pinned
 * sibling below it — the discriminator the content-robustness probe catches.
 */
function oracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [
        text(HEADLINE, { x: 20, y: 100, width: width - 40, height: 48 }),
        text(BODY, { x: 20, y: 170, width: width - 40, height: 48 }),
        text(CAPTION, { x: 20, y: 240, width: width - 40, height: 48 }),
      ],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/**
 * The same 3-run stack but with 300px gaps (y=100/400/700). A 2.5× perturbation
 * grows each pinned box to 120px, well inside the gap — so the region already
 * survives content-robustness and must NOT be promoted.
 */
function roomyOracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `roomy@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [
        text(HEADLINE, { x: 20, y: 100, width: width - 40, height: 48 }),
        text(BODY, { x: 20, y: 400, width: width - 40, height: 48 }),
        text(CAPTION, { x: 20, y: 700, width: width - 40, height: 48 }),
      ],
    },
  }))
  return { url: 'http://roomy.test/', notes: [], projections }
}

/**
 * A single fixed-width run captured only at the wide widths [768..1440]. Its
 * box (x=20, width=728, right 748) fits every captured viewport. But the
 * renderer holds the base (768) keyframe below the first breakpoint, so at the
 * off-sample width 500 the 728px run clips beyond the 500px viewport — a
 * degradation that appears only at an unsampled width.
 */
const NARROW_LADDER = [768, 1024, 1280, 1440]
function narrowOracle(): MultiStateCapture {
  const projections: StateProjection[] = NARROW_LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `narrow@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [text(HEADLINE, { x: 20, y: 100, width: 728, height: 48 })],
    },
  }))
  return { url: 'http://narrow.test/', notes: [], projections }
}

/**
 * A stack carrying the SAME label ("Learn more") three times at distinct y
 * positions (100 / 500 / 900) plus a unique heading, at every ladder width.
 * Exercises the pairing rule: keying oracle↔reproduced by text alone collapses
 * the three occurrences onto one box (the last, y=900), so occurrences 0 and 1
 * would compare against y=900 → phantom dy of 800 / 400 at every width.
 */
const CTA = 'Learn more'
function repeatedTextOracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `dup@${width}`,
      viewport: { width, height: 1200 },
      sections: [],
      elements: [
        text('Unique heading', { x: 20, y: 20, width: width - 40, height: 48 }),
        text(CTA, { x: 20, y: 100, width: width - 40, height: 48 }),
        text(CTA, { x: 20, y: 500, width: width - 40, height: 48 }),
        text(CTA, { x: 20, y: 900, width: width - 40, height: 48 }),
      ],
    },
  }))
  return { url: 'http://dup.test/', notes: [], projections }
}

/** A text-free captured element — the shape images / surfaces / controls arrive in. */
function textless(over: Partial<ValueElement> & { box: ValueElement['box'] }): ValueElement {
  return {
    text: '',
    role: 'img',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    ...over,
  }
}

/**
 * A capture spanning every leaf kind the classifier distinguishes, so the
 * fidelity measure's *scope* and its non-text pairing are both observable:
 *
 *   - one text run,
 *   - TWO images at well-separated y (200 / 600) — they carry no text, so a
 *     kind→single-box map would compare occurrence 0 against occurrence 1's box
 *     and report a phantom dy of 400 at every width; only occurrence pairing
 *     within the `image` key gates clean,
 *   - one standalone painted surface (a `box` leaf),
 *   - a form control and an empty run — neither ever becomes a leaf, so both must
 *     be excluded from the measure rather than counted as coverage gaps.
 */
function mixedKindOracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1400 },
    state: 'rest',
    manifest: {
      source: `mixed@${width}`,
      viewport: { width, height: 1400 },
      sections: [],
      elements: [
        text(HEADLINE, { x: 20, y: 20, width: width - 40, height: 48 }),
        textless({
          a11yRole: 'img',
          objectFit: 'cover',
          intrinsicAspect: 1.5,
          src: 'https://cdn.example.com/one.jpg',
          alt: 'One',
          box: { x: 10, y: 200, width: width - 20, height: 300 },
        }),
        textless({
          a11yRole: 'img',
          objectFit: 'cover',
          intrinsicAspect: 1.5,
          src: 'https://cdn.example.com/two.jpg',
          alt: 'Two',
          box: { x: 10, y: 600, width: width - 20, height: 300 },
        }),
        textless({
          role: 'separator',
          a11yRole: 'separator',
          surfaceFill: '#f0eee9',
          borderRadiusPx: 8,
          box: { x: 40, y: 1000, width: width - 80, height: 4 },
        }),
        // Never a leaf: a form control is a behavior-module seam (DOC-25/26)…
        textless({ role: 'textbox', a11yRole: 'textbox', box: { x: 40, y: 1100, width: 260, height: 40 } }),
        // …and an empty run paints nothing.
        { ...text('', { x: 20, y: 1200, width: width - 40, height: 20 }), text: '' },
      ],
    },
  }))
  return { url: 'http://mixed.test/', notes: [], projections }
}

/** An image element sharing the fixture's geometry, for surplus-occurrence probes. */
function extraImage(width: number, y: number): ValueElement {
  return textless({
    a11yRole: 'img',
    objectFit: 'cover',
    intrinsicAspect: 1.5,
    src: 'https://cdn.example.com/surplus.jpg',
    alt: 'Surplus',
    box: { x: 10, y, width: width - 20, height: 100 },
  })
}

// ── the pinned-container fixture (AC-706 / AC-707 / AC-710) ──────────────────
//
// One mechanism, seen from three probes: a flow container pinned to a fixed
// keyframe height whose in-flow content stacks past it. The evaluator reports it
// under `clip` naming both heights and the CONTAINER's path — AC-710 grades the
// finding's shape, AC-706 catches it at an unsampled intermediate width, and
// AC-707 catches it under grown content.

/** A geometry-free (in-flow) text leaf — 16px type on a 22px line box. */
function flowText(text: string, extra: Partial<L1Node> = {}): L1Node {
  return {
    kind: 'text',
    text,
    axes: { color: '#111827', fontFamily: 'Arial', fontSizePx: 16, fontWeight: 400 },
    ...extra,
  } as L1Node
}

/** Three one-line rows: 3 × 22px + 2 × 10px gap = 86px of stacked content. */
function threeRows(text = 'Alpha row'): L1Node[] {
  return [flowText(text), flowText(text), flowText(text)]
}

/**
 * A `stack` container pinned by its own geometry at every ladder width, holding
 * `children` in flow, nested one level under the root so the container's own
 * index path (`0.0`) is distinct from the paths of the leaves inside it (`0.0.n`).
 *
 * `pinnedHeight` omitted → the keyframes carry no height at all, so the container
 * sizes to its content and no overflow is possible.
 */
function pinnedContainerDoc(children: L1Node[], pinnedHeight?: number): L1Document {
  const container = {
    kind: 'container',
    layout: 'stack',
    gapPx: 10,
    geometry: {
      keyframes: LADDER.map((at) => ({
        at,
        x: 0,
        y: 0,
        width: 300, // fits inside the narrowest ladder rung (320) and off-sample 500
        ...(pinnedHeight === undefined ? {} : { height: pinnedHeight }),
      })),
    },
    children,
  } as L1Node
  const doc: L1Document = {
    widths: LADDER,
    background: '#ffffff',
    root: { kind: 'container', layout: 'stack', gapPx: 0, children: [container] } as L1Node,
  }
  const result = validateL1(doc)
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return doc
}

/** The pinned-box content-overflow findings of a finding list. */
function pinnedOverflows(findings: { kind: string; detail: string; paths: string[] }[]) {
  return findings.filter((f) => f.kind === 'clip' && /exceeds pinned box height/.test(f.detail))
}

/**
 * A flat page of three tightly packed regions — a hero, a three-card grid, and a
 * footer. Each region's runs sit ~60px apart, so under a 2.5× content
 * perturbation a region overruns its own interior; the regions themselves are
 * ~360px apart, so they stay distinct even after growth.
 *
 * This is the shape single-level promotion could not recover: one flat pile with
 * one shared median gap cannot keep the grid's interior and the footer's interior
 * sane simultaneously, and the siblings it left pinned were overrun anyway.
 */
function multiRegionOracle(regions: number[][]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1600 },
    state: 'rest',
    manifest: {
      source: `region@${width}`,
      viewport: { width, height: 1600 },
      sections: [],
      elements: regions.flatMap((ys, r) =>
        // A ~10-char run: one line at rest, two under a 2.5× grow — so a tight
        // region overruns only when perturbed, exactly like `oracle()`.
        ys.map((y, i) => text(`col ${r}${i} row`, { x: 20, y, width: width - 40, height: 48 })),
      ),
    },
  }))
  return { url: 'http://region.test/', notes: [], projections }
}

/**
 * Hero (y≈100), grid (y≈600), footer (y≈1200). The bands carry DIFFERENT interior
 * pitches — 60 / 90 / 60 — while every band sits ~330px clear of its neighbours.
 * A single shared median gap cannot be all three at once, which is exactly what
 * region-aware recovery has to get right.
 *
 * The trailing lone run (y=1500) collides with nothing: it is a **survivor** — a
 * pinned sibling of the recovering node that belongs to no colliding group. It is
 * what the "nothing is left pinned behind" clause is about, since the superseded
 * promote left exactly this kind of sibling absolute for a grown region to overrun.
 */
const GRID_AND_FOOTER = [
  [100, 160, 220],
  [600, 690, 780],
  [1200, 1260],
  [1500],
]

/** Every node beneath `node` that still carries absolute geometry (is pinned). */
function pinnedDescendants(node: L1Node, path = '0'): string[] {
  const out: string[] = []
  if ((node as { geometry?: unknown }).geometry !== undefined) out.push(path)
  const kids = (node as { children?: L1Node[] }).children ?? []
  kids.forEach((c, i) => out.push(...pinnedDescendants(c, `${path}.${i}`)))
  return out
}

describe('story-24098299 — 3-probe reproduction acceptance gate', () => {
  it('test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance', () => {
    const cap = oracle()
    const doc = foldToL1(cap)

    // Clean: the absolute base reproduces the oracle boxes at every captured
    // width — empty residuals, empty unmatched, max delta within tolerance.
    const clean = sampleFidelityProbe(doc, cap, { tolerancePx: 2 })
    expect(clean.pass).toBe(true)
    expect(clean.residuals).toEqual([])
    expect(clean.unmatched).toEqual([])
    expect(clean.maxDelta).toBeLessThanOrEqual(2)
    // All six captured widths were retained and are the ones the probe checks.
    expect(doc.widths).toEqual(LADDER)

    // Perturb one reproduced box beyond tolerance AT THE LAST WIDTH — proving
    // the probe iterates every captured width — and assert the residual carries
    // the run text, the width, and the per-axis deltas.
    const shifted = structuredClone(cap)
    const lastProj = shifted.projections.find((p) => p.viewport.width === 1440)!
    lastProj.manifest.elements[0].box.x += 10
    const withResidual = sampleFidelityProbe(doc, shifted, { tolerancePx: 2 })
    expect(withResidual.pass).toBe(false)
    expect(withResidual.residuals).toHaveLength(1)
    const r = withResidual.residuals[0]
    expect(r.text).toBe(HEADLINE)
    expect(r.width).toBe(1440)
    expect(r.dx).toBeCloseTo(10, 5)
    expect(r.dy).toBeCloseTo(0, 5)
    expect(r.dw).toBeCloseTo(0, 5)

    // Drop a run (an oracle sample with no reproduced leaf) → unmatched.
    const withGap = structuredClone(cap)
    const proj768 = withGap.projections.find((p) => p.viewport.width === 768)!
    proj768.manifest.elements.push(text('Ghost row', { x: 20, y: 400, width: 200, height: 48 }))
    const withUnmatched = sampleFidelityProbe(doc, withGap, { tolerancePx: 2 })
    expect(withUnmatched.pass).toBe(false)
    expect(withUnmatched.unmatched).toContainEqual({ text: 'Ghost row', width: 768 })

    // ── Pairing rule: occurrence index in document order, not a text→box map ──
    const dupCap = repeatedTextOracle()
    const dupDoc = foldToL1(dupCap)

    // (a) N occurrences of one label → N independent comparisons, each against
    // its own box. A text-keyed map would collapse them and report phantom
    // deltas of 400 / 800px here; occurrence pairing gates clean.
    const dupLeaves = evaluateLayout(dupDoc, 1440).leaves.filter(
      (l) => l.kind === 'text' && l.text === CTA,
    )
    expect(dupLeaves).toHaveLength(3)
    const dupClean = sampleFidelityProbe(dupDoc, dupCap, { tolerancePx: 2 })
    expect(dupClean.pass).toBe(true)
    expect(dupClean.residuals).toEqual([])
    expect(dupClean.unmatched).toEqual([])
    expect(dupClean.maxDelta).toBeLessThanOrEqual(2)

    // (b) A surplus oracle occurrence — reproduced runs for the key exhausted
    // before the oracle's — is exactly one unmatched entry, NOT a re-pair
    // against an already-consumed box. The other three still pair cleanly.
    const dupWithGap = structuredClone(dupCap)
    dupWithGap.projections
      .find((p) => p.viewport.width === 768)!
      .manifest.elements.push(text(CTA, { x: 20, y: 1100, width: 200, height: 48 }))
    const dupUnmatched = sampleFidelityProbe(dupDoc, dupWithGap, { tolerancePx: 2 })
    expect(dupUnmatched.pass).toBe(false)
    expect(dupUnmatched.unmatched).toEqual([{ text: CTA, width: 768 }])
    expect(dupUnmatched.residuals).toEqual([])

    // (c) Drift on ONE occurrence of a repeated key is attributed to that
    // occurrence — exactly one residual with its width and per-axis deltas.
    // A nearest-box or last-writer match would have absorbed it silently.
    const dupShifted = structuredClone(dupCap)
    const shiftedProj = dupShifted.projections.find((p) => p.viewport.width === 1440)!
    const middleCta = shiftedProj.manifest.elements.filter((e) => e.text === CTA)[1]!
    middleCta.box!.y += 30
    const dupResidual = sampleFidelityProbe(dupDoc, dupShifted, { tolerancePx: 2 })
    expect(dupResidual.pass).toBe(false)
    expect(dupResidual.residuals).toHaveLength(1)
    const dr = dupResidual.residuals[0]
    expect(dr.text).toBe(CTA)
    expect(dr.width).toBe(1440)
    expect(dr.dy).toBeCloseTo(30, 5)

    // ── Which oracle samples are measured: the fold's own classifier ──────────
    // A capture spanning every leaf kind — text, two images, a painted surface,
    // plus a form control and an empty run that never become leaves.
    const mixedCap = mixedKindOracle()
    const mixedDoc = foldToL1(mixedCap)

    // Scope: an oracle sample exists exactly where the fold emits a leaf. Since
    // REQ-96 a captured control is no longer dropped *and* is never painted as a
    // raw L1 field: it folds into the behavior module's mount seam, so the
    // reproduced tree carries one text, two images, one box and that `slot`. The
    // empty run still produces no leaf at all.
    const mixedLeaves = evaluateLayout(mixedDoc, 1440).leaves
    const kinds = mixedLeaves.map((l) => l.kind).sort()
    expect(kinds).toEqual(['box', 'image', 'image', 'slot', 'text'])
    const capturedAt1440 = mixedCap.projections.find((p) => p.viewport.width === 1440)!.manifest.elements
    expect(capturedAt1440.some((e) => e.a11yRole === 'textbox')).toBe(true) // control present…
    expect(capturedAt1440.some((e) => !e.textless && e.text === '')).toBe(true) // …and an empty run

    // …and because they are excluded from the measure rather than counted as
    // coverage gaps, the probe gates clean: no residual, and crucially no
    // unmatched entry for either of them.
    const mixedClean = sampleFidelityProbe(mixedDoc, mixedCap, { tolerancePx: 2 })
    expect(mixedClean.pass).toBe(true)
    expect(mixedClean.residuals).toEqual([])
    expect(mixedClean.unmatched).toEqual([])

    // (d) Kind-keyed occurrence pairing for text-free leaves. The two images
    // carry no text, so they key on kind: the k-th image oracle sample pairs
    // with the k-th reproduced image leaf. A kind→single-box map would compare
    // occurrence 0 (y=200) against occurrence 1's box (y=600) and report a
    // phantom dy of 400 at every width — the clean report above rules that out.
    // Drift on ONE image occurrence is attributed to that occurrence alone.
    const imgShifted = structuredClone(mixedCap)
    const imgProj = imgShifted.projections.find((p) => p.viewport.width === 1440)!
    imgProj.manifest.elements.filter((e) => e.a11yRole === 'img')[1].box!.y += 25
    const imgResidual = sampleFidelityProbe(mixedDoc, imgShifted, { tolerancePx: 2 })
    expect(imgResidual.pass).toBe(false)
    expect(imgResidual.residuals).toHaveLength(1)
    expect(imgResidual.residuals[0].text).toBe('(image)') // labelled by kind — it has no text
    expect(imgResidual.residuals[0].width).toBe(1440)
    expect(imgResidual.residuals[0].dy).toBeCloseTo(25, 5)

    // (e) A surplus non-text occurrence — the reproduced leaves of that kind are
    // exhausted before the oracle's — is exactly one unmatched entry labelled by
    // kind, not a re-pair against an already-consumed box. Holds for `(image)`…
    const surplusImg = structuredClone(mixedCap)
    surplusImg.projections
      .find((p) => p.viewport.width === 768)!
      .manifest.elements.push(extraImage(768, 1300))
    const imgUnmatched = sampleFidelityProbe(mixedDoc, surplusImg, { tolerancePx: 2 })
    expect(imgUnmatched.pass).toBe(false)
    expect(imgUnmatched.unmatched).toEqual([{ text: '(image)', width: 768 }])
    expect(imgUnmatched.residuals).toEqual([]) // the other two images still pair cleanly

    // …and identically for `(box)`.
    const surplusBox = structuredClone(mixedCap)
    surplusBox.projections
      .find((p) => p.viewport.width === 1024)!
      .manifest.elements.push(
        textless({ surfaceFill: '#101010', box: { x: 40, y: 1320, width: 200, height: 4 } }),
      )
    const boxUnmatched = sampleFidelityProbe(mixedDoc, surplusBox, { tolerancePx: 2 })
    expect(boxUnmatched.pass).toBe(false)
    expect(boxUnmatched.unmatched).toEqual([{ text: '(box)', width: 1024 }])
    expect(boxUnmatched.residuals).toEqual([])
  })

  it('test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths', () => {
    // Pass: the fluid base renders sane at the default 500 / 900 off-sample
    // widths — no overlap, no clip, per-width findings empty.
    const doc = foldToL1(oracle())
    const passReport = offSampleProbe(doc)
    expect(passReport.pass).toBe(true)
    expect(passReport.byWidth.map((w) => w.width)).toEqual([500, 900])
    for (const w of passReport.byWidth) expect(w.findings).toEqual([])

    // Fail: a document whose fixed-width run is only captured at wide widths
    // degrades at the unsampled 500px width (the held base keyframe clips) —
    // the probe reports that finding at the affected width and pass = false.
    const narrow = foldToL1(narrowOracle())
    const failReport = offSampleProbe(narrow, { widths: [500, 900] })
    expect(failReport.pass).toBe(false)
    const at500 = failReport.byWidth.find((w) => w.width === 500)!
    expect(at500.findings.some((f) => f.kind === 'clip')).toBe(true)
    // The width that was fine when captured (900 interpolates safely) is clean.
    const at900 = failReport.byWidth.find((w) => w.width === 900)!
    expect(at900.findings).toEqual([])

    // Fail #2: a pinned container that only overruns its pinned height at an
    // UNSAMPLED width. The middle row is visible across [400, 700) only, so at
    // every captured ladder rung the container holds two rows (64px, the hidden
    // row still costing its gap) inside its 70px pin, and at the off-sample
    // 500px it holds three (86px) and overruns.
    // The probe's pass condition is exactly the evaluator's finding set, so it
    // fails that width even though no leaf crossed the viewport edge.
    const bandRow = flowText('Mid-width only', { visibility: { fromPx: 400, untilPx: 700 } })
    const pinnedDoc = pinnedContainerDoc(
      [flowText('Alpha row'), bandRow, flowText('Beta row')],
      70,
    )
    const pinnedReport = offSampleProbe(pinnedDoc)
    expect(pinnedReport.pass).toBe(false)
    const pinnedAt500 = pinnedReport.byWidth.find((w) => w.width === 500)!
    expect(pinnedOverflows(pinnedAt500.findings)).toHaveLength(1)
    expect(pinnedOverflows(pinnedAt500.findings)[0].paths).toEqual(['0.0'])
    // 900 is past the band, so the container is back inside its pin there.
    expect(pinnedReport.byWidth.find((w) => w.width === 900)!.findings).toEqual([])
    // …and every CAPTURED width stays clean — only the off-sample probe sees it.
    for (const w of pinnedDoc.widths) expect(evaluateLayout(pinnedDoc, w).findings).toEqual([])

    // The probe also holds after region-aware recovery on a MULTI-REGION page
    // (hero / grid / footer): each colliding region becomes its own flow stack
    // and no sibling is left pinned, so the envelope holds at both off-sample
    // widths. Single-level promotion left pinned survivors behind here.
    const regionBase = foldToL1(multiRegionOracle(GRID_AND_FOOTER))
    const regionRecovered = promoteToFlow(regionBase, { scale: 2.5 })
    expect(regionRecovered.promoted.length).toBeGreaterThan(1) // genuinely multi-region
    const regionOffSample = offSampleProbe(regionRecovered.doc)
    expect(regionOffSample.pass).toBe(true)
    for (const w of regionOffSample.byWidth) expect(w.findings).toEqual([])
  })

  it('test_UAT_AC707_content_robustness_under_grown_content', () => {
    const base = foldToL1(oracle())

    // Purely-pinned region: 2.5× content overruns the fixed-position sibling
    // below — overlap finding, pass = false. Findings are reported per width.
    const before = contentRobustnessProbe(base, { scale: 2.5 })
    expect(before.pass).toBe(false)
    expect(before.byWidth.map((w) => w.width)).toEqual(base.widths)
    const overlaps = before.byWidth.flatMap((w) => w.findings).filter((f) => f.kind === 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)

    // A flow-structured equivalent (interior flows) absorbs the extra content —
    // envelope holds, pass = true, empty findings at every captured width.
    const flowed = promoteToFlow(base, { scale: 2.5 }).doc
    const after = contentRobustnessProbe(flowed, { scale: 2.5 })
    expect(after.pass).toBe(true)
    for (const w of after.byWidth) expect(w.findings).toEqual([])

    // ── pinned container: content with nowhere to go inside a box that cannot
    // grow. The container is pinned to exactly the 86px its unperturbed rows
    // fill, so at rest it is clean; at 2.5× each row wraps to three lines and
    // the interior stacks to 218px, which the pin cannot absorb. Nothing crosses
    // the viewport edge — this is the clip the probe exists to catch.
    const COPY = 'A line of body copy that fits.' // 30 chars: 1 line at rest, 3 grown
    const pinnedExact = pinnedContainerDoc([flowText(COPY), flowText(COPY), flowText(COPY)], 86)
    const atRest = contentRobustnessProbe(pinnedExact, { scale: 1 })
    expect(atRest.pass).toBe(true)
    for (const w of atRest.byWidth) expect(w.findings).toEqual([])

    const grown = contentRobustnessProbe(pinnedExact, { scale: 2.5 })
    expect(grown.pass).toBe(false)
    const grownClips = pinnedOverflows(grown.byWidth.flatMap((w) => w.findings))
    expect(grownClips.length).toBe(base.widths.length) // reported at every captured width
    expect(grownClips[0].detail).toMatch(/content height 218px/)
    expect(grownClips[0].detail).toMatch(/pinned box height 86px/)
    expect(grownClips[0].paths).toEqual(['0.0']) // names the container

    // The same container left UNPINNED sizes to its content, so the grown rows
    // have somewhere to go and the envelope holds.
    const unpinned: L1Document = {
      widths: LADDER,
      background: '#ffffff',
      root: {
        kind: 'container',
        layout: 'stack',
        gapPx: 0,
        children: [
          {
            kind: 'container',
            layout: 'stack',
            gapPx: 10,
            children: [flowText(COPY), flowText(COPY), flowText(COPY)],
          },
        ],
      } as L1Node,
    }
    expect(validateL1(unpinned).ok).toBe(true)
    const unpinnedGrown = contentRobustnessProbe(unpinned, { scale: 2.5 })
    expect(unpinnedGrown.pass).toBe(true)
    for (const w of unpinnedGrown.byWidth) expect(w.findings).toEqual([])

    // The same holds on a MULTI-REGION page (hero / grid / footer), where a
    // single flat pile with one shared median gap could not keep every region's
    // interior sane at once. The pinned base collides inside each region at the
    // narrow widths (where the grown run wraps), and the report names those
    // widths; region-aware recovery clears every captured width.
    const regionBase = foldToL1(multiRegionOracle(GRID_AND_FOOTER))
    const regionBefore = contentRobustnessProbe(regionBase, { scale: 2.5 })
    expect(regionBefore.pass).toBe(false)
    const failingWidths = regionBefore.byWidth.filter((w) => w.findings.length > 0)
    expect(failingWidths.length).toBeGreaterThan(0)
    for (const w of failingWidths) expect(w.findings.every((f) => f.kind === 'overlap')).toBe(true)
    // Each region's interior collides independently — the collisions are not one
    // pile but several, which is what forces region-aware (not flat) recovery.
    const collidingChildren = new Set(
      failingWidths.flatMap((w) => w.findings.flatMap((f) => f.paths.map((p) => p.split('.')[1]))),
    )
    expect(collidingChildren.size).toBeGreaterThan(2)

    const regionRecovered = promoteToFlow(regionBase, { scale: 2.5 })
    expect(regionRecovered.promoted.length).toBeGreaterThan(1) // genuinely multi-region
    const regionAfter = contentRobustnessProbe(regionRecovered.doc, { scale: 2.5 })
    expect(regionAfter.pass).toBe(true)
    for (const w of regionAfter.byWidth) expect(w.findings).toEqual([])
  })

  it('test_UAT_AC708_combined_gate_non_vacuous_over_base_overlay_split', () => {
    const cap = oracle()
    const base = foldToL1(cap)
    const recovered = promoteToFlow(base, { scale: 2.5 }).doc

    // Non-vacuous #1: run against the purely-pinned base with NO recovery
    // overlay → pass = false, driven by content-robustness failing. Fidelity is
    // still measured on the absolute base and passes.
    const ungated = threeProbeGate(base, cap, { contentScale: 2.5 })
    expect(ungated.pass).toBe(false)
    expect(ungated.contentRobustness.pass).toBe(false)
    expect(ungated.sampleFidelity.pass).toBe(true)

    // Non-vacuous #2: same base + a structure-recovered overlay → pass = true,
    // with every sub-report passing.
    const gated = threeProbeGate(base, cap, { recovered, contentScale: 2.5 })
    expect(gated.pass).toBe(true)
    expect(gated.sampleFidelity.pass).toBe(true)
    expect(gated.offSample.pass).toBe(true)
    expect(gated.contentRobustness.pass).toBe(true)

    // The report carries each probe's sub-report (with its residuals/findings).
    expect(Array.isArray(gated.sampleFidelity.residuals)).toBe(true)
    expect(Array.isArray(gated.offSample.byWidth)).toBe(true)
    expect(Array.isArray(gated.contentRobustness.byWidth)).toBe(true)
  })

  it('test_UAT_AC709_demand_driven_recovery_promotes_only_failing_groups', () => {
    // ── Whole-node region: the node IS the region, so it reports its own path ──
    const base = foldToL1(oracle())
    expect(contentRobustnessProbe(base, { scale: 2.5 }).pass).toBe(false)

    const { doc: recovered, promoted } = promoteToFlow(base, { scale: 2.5 })
    // The failing root region is reported as promoted (its index path).
    expect(promoted).toEqual(['0'])
    // After recovery the region keeps the envelope at every captured width.
    const after = contentRobustnessProbe(recovered, { scale: 2.5 })
    expect(after.pass).toBe(true)
    for (const w of after.byWidth) expect(w.findings).toEqual([])
    // The returned document is a valid L1 document (satisfies the validator).
    expect(validateL1(recovered).ok).toBe(true)

    // ── Region-aware and recursive: distinct regions stay distinct ────────────
    // A page of three tightly packed regions (hero / grid / footer). Recovery
    // must discover each colliding component of the root's direct children and
    // promote it as its OWN flow sub-stack with its own interior gap — not
    // collapse the page into one pile with one shared gap.
    const regionCap = multiRegionOracle(GRID_AND_FOOTER)
    const regionBase = foldToL1(regionCap)
    expect(contentRobustnessProbe(regionBase, { scale: 2.5 }).pass).toBe(false)

    const regionResult = promoteToFlow(regionBase, { scale: 2.5 })

    // Three nested regions, each reported by its own path under the root —
    // never the single `['0']` a one-level promotion produces.
    expect(regionResult.promoted).not.toEqual(['0'])
    expect(regionResult.promoted).toHaveLength(3)
    expect(new Set(regionResult.promoted).size).toBe(3)
    for (const p of regionResult.promoted) expect(p).toMatch(/^0\.\d+$/)

    // Each promoted path names a flow `stack` container carrying its OWN interior
    // gap, derived from its members' absolute measurements. The fixture's grid
    // band is pitched 90px apart against the hero's and footer's 60px, so the
    // recovered gaps differ where the absolute spacing differed — one shared
    // median gap across the page could not reproduce all three.
    const regionNodes = regionResult.promoted.map((p) => {
      const idx = Number(p.split('.')[1])
      return ((regionResult.doc.root as { children?: L1Node[] }).children ?? [])[idx]
    })
    for (const n of regionNodes) {
      expect(n.kind).toBe('container')
      expect((n as { layout?: string }).layout).toBe('stack')
      expect((n as { gapPx?: number }).gapPx).toBeGreaterThan(0)
    }
    const regionGaps = regionNodes.map((n) => (n as { gapPx?: number }).gapPx)
    expect(regionGaps).toEqual([60, 90, 60])
    expect(new Set(regionGaps).size).toBeGreaterThan(1)

    // Nothing is left pinned behind: a recovering node flows ALL of its children
    // (regions as sub-stacks, and the non-colliding survivor flowed alongside),
    // so no absolute geometry survives anywhere beneath it for a grown region to
    // overrun. The fixture's lone y=1500 run is that survivor — it belongs to no
    // colliding group, yet it must not remain pinned.
    expect(pinnedDescendants(regionBase.root).length).toBeGreaterThan(0) // was pinned
    expect(regionResult.promoted).toHaveLength(3) // …and is not one of the regions
    expect(pinnedDescendants(regionResult.doc.root)).toEqual([])

    // The previously-failing regions now keep the envelope under the same
    // perturbation, at every captured width and at unsampled widths alike.
    const regionAfter = contentRobustnessProbe(regionResult.doc, { scale: 2.5 })
    expect(regionAfter.pass).toBe(true)
    for (const w of regionAfter.byWidth) expect(w.findings).toEqual([])
    expect(offSampleProbe(regionResult.doc).pass).toBe(true)
    expect(validateL1(regionResult.doc).ok).toBe(true)

    // Fidelity is measured on the untouched absolute base, so recovery never
    // regrades it — the same base yields the identical report afterwards.
    const fidelityBefore = sampleFidelityProbe(regionBase, regionCap, { tolerancePx: 2 })
    expect(fidelityBefore.pass).toBe(true)
    promoteToFlow(regionBase, { scale: 2.5 })
    const fidelityAfter = sampleFidelityProbe(regionBase, regionCap, { tolerancePx: 2 })
    expect(JSON.stringify(fidelityAfter)).toEqual(JSON.stringify(fidelityBefore))

    // ── Demanded, not applied by default ──────────────────────────────────────
    // A region that already survives perturbation is left absolute — not
    // promoted (empty promotion list).
    const roomyBase = foldToL1(roomyOracle())
    expect(contentRobustnessProbe(roomyBase, { scale: 2.5 }).pass).toBe(true)
    expect(promoteToFlow(roomyBase, { scale: 2.5 }).promoted).toEqual([])
    expect(pinnedDescendants(roomyBase.root).length).toBeGreaterThan(0) // stayed pinned
  })

  it('test_UAT_AC710_probe_findings_are_diagnostic', () => {
    const cap = oracle()
    const doc = foldToL1(cap)

    // A fidelity residual names the run, the width, and the per-axis deltas.
    const shifted = structuredClone(cap)
    const proj = shifted.projections.find((p) => p.viewport.width === 1280)!
    proj.manifest.elements[1].box.y += 7
    const fidelity = sampleFidelityProbe(doc, shifted, { tolerancePx: 2 })
    expect(fidelity.pass).toBe(false)
    const residual = fidelity.residuals.find((d) => d.text === BODY && d.width === 1280)!
    expect(residual).toBeDefined()
    expect(residual.dy).toBeCloseTo(7, 5)
    expect(typeof residual.dx).toBe('number')
    expect(typeof residual.dw).toBe('number')

    // An overlap finding carries kind, a human-readable detail, and the index
    // paths of the two leaves involved.
    const robustness = contentRobustnessProbe(doc, { scale: 2.5 })
    const overlap = robustness.byWidth.flatMap((w) => w.findings).find((f) => f.kind === 'overlap')!
    expect(overlap).toBeDefined()
    expect(overlap.kind).toBe('overlap')
    expect(overlap.detail.length).toBeGreaterThan(0)
    expect(overlap.paths.length).toBeGreaterThanOrEqual(2)
    for (const p of overlap.paths) expect(p).toMatch(/^\d+(\.\d+)*$/)

    // A clip finding carries kind, a detail with the offending magnitude (px),
    // and the offending leaf's index path.
    const narrow = foldToL1(narrowOracle())
    const clip = evaluateLayout(narrow, 500).findings.find((f) => f.kind === 'clip')!
    expect(clip).toBeDefined()
    expect(clip.kind).toBe('clip')
    expect(clip.detail).toMatch(/\d+px/)
    expect(clip.paths.length).toBeGreaterThanOrEqual(1)
    for (const p of clip.paths) expect(p).toMatch(/^\d+(\.\d+)*$/)

    // ── the third envelope violation: pinned-box content overflow ─────────────
    // A flow container pinned to 40px whose three in-flow rows stack to 86px.
    // Nothing crosses the viewport edge here, so this is reported by the flow
    // walk itself, not by the horizontal-clip pass.
    const overflowing = pinnedContainerDoc(threeRows(), 40)
    const overflowResult = evaluateLayout(overflowing, 900)
    const pinnedClips = pinnedOverflows(overflowResult.findings)
    expect(pinnedClips).toHaveLength(1)
    const pinnedClip = pinnedClips[0]
    expect(pinnedClip.kind).toBe('clip')
    // The detail names BOTH magnitudes — the flowed content height and the
    // pinned box height — not just "it overflowed".
    expect(pinnedClip.detail).toMatch(/content height 86px/)
    expect(pinnedClip.detail).toMatch(/pinned box height 40px/)
    // …and the path is the CONTAINER's own, not a leaf's inside it.
    expect(pinnedClip.paths).toEqual(['0.0'])
    const leafPaths = overflowResult.leaves.map((l) => l.path)
    expect(leafPaths).not.toContain('0.0')
    expect(leafPaths).toEqual(['0.0.0', '0.0.1', '0.0.2'])
    // It is the ONLY finding: no sibling overlap, no viewport clip.
    expect(overflowResult.findings).toHaveLength(1)

    // Negative 1 — the same container pinned to a height that accommodates its
    // content raises nothing.
    expect(evaluateLayout(pinnedContainerDoc(threeRows(), 200), 900).findings).toEqual([])
    // Negative 2 — the same container carrying NO pinned height at all sizes to
    // its content, so there is nothing to overflow.
    expect(evaluateLayout(pinnedContainerDoc(threeRows()), 900).findings).toEqual([])
  })

  it('test_UAT_AC724_value_render_deterministic_and_per_occurrence_faithful', () => {
    // The idempotence identity the fidelity verdict rests on:
    // value-render(value-render(X)) == value-render(X), with repeated text
    // present. Without it a clean sample-fidelity report could be an artefact
    // of collapsed or re-ordered runs rather than genuine reproduction.
    const cap = repeatedTextOracle()
    const doc = foldToL1(cap)

    for (const width of LADDER) {
      // Deterministic: the analytic value-render is a pure function of the
      // document and the width — same runs, same order, same boxes.
      const first = evaluateLayout(doc, width).leaves
      const second = evaluateLayout(doc, width).leaves
      expect(second).toEqual(first)

      // Per-occurrence faithful: N oracle elements sharing a text key yield N
      // distinct reproduced runs (not one collapsed run), and the k-th run
      // reproduces the k-th oracle element's own box within tolerance.
      const proj = cap.projections.find((p) => p.viewport.width === width)!
      const oracleCtas = proj.manifest.elements.filter((e) => e.text === CTA)
      const reproCtas = first.filter((l) => l.kind === 'text' && l.text === CTA)
      expect(oracleCtas).toHaveLength(3)
      expect(reproCtas).toHaveLength(oracleCtas.length)
      oracleCtas.forEach((o, i) => {
        expect(Math.abs(reproCtas[i].box.y - o.box!.y)).toBeLessThanOrEqual(2)
        expect(Math.abs(reproCtas[i].box.x - o.box!.x)).toBeLessThanOrEqual(2)
      })
    }
  })
})
