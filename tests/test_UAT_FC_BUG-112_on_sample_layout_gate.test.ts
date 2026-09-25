/**
 * BUG-112 — the gate could not see text painted over text.
 *
 * `evaluateLayout` has always reported `kind: 'overlap'` for two solid leaf boxes
 * that intersect, and on the `gigabytealchemy.ai` bundle it fired five times at
 * 1280px — the exact width the perceptual gate photographs. The verdict was
 * `pass`. Two independent reasons, both of them a discard rather than a miss:
 *
 *   - `sampleFidelityProbe` evaluates the SERVED document at every captured
 *     width and destructures `{ leaves }`, throwing the findings away on the
 *     same line;
 *   - the two probes that do report findings (off-sample, content-robustness)
 *     grade `promoteToFlow(base)`, which `1c repro` never writes to disk.
 *
 * So the only probe looking at the served document discarded its findings, and
 * the only probes reporting findings looked at a different document.
 *
 * These UATs pin the on-sample envelope probe, its route into the verdict, and
 * the one thing that must NOT become unconditionally red: a reproduction with no
 * collisions still passes. Both directions, per the epic's rail principle (§8.4).
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  acceptanceGate,
  chooseRecovery,
  evaluateLayout,
  foldToL1,
  onSampleProbe,
  promoteToFlow,
} from '../tools/generate/src'
import { formatGateReport, reconcileGates } from '../tools/generate/src/cli/gate'
import type { ReferenceCoverage } from '../tools/generate/src/cli/gate'
import type { EnvelopeReport } from '../tools/generate/src/l1/probes'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { validateL1 } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

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

function capture(url: string, elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `${url}@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: elementsAt(width),
    },
  }))
  return { url, notes: [], projections }
}

/**
 * The shape of the real defect, in miniature.
 *
 * A long run pinned in a 280px box — narrow enough to fit inside the narrowest
 * captured viewport, so nothing here is a clip. The capture recorded ONE line of
 * 48px, because that is what the reference's own font measured; but the
 * reproduction pins the box and takes the text's height from flow, and ninety
 * characters at 40px do not fit on one 280px line. The run occupies seven line
 * boxes where the document reserved one, and lands squarely on the pinned run
 * 70px below it. Unperturbed, at every captured width.
 */
const LONG = 'A sentence long enough that it cannot possibly fit on a single line inside this box'
const NEIGHBOUR = 'Directly below'
const BOX = { x: 20, width: 280, height: 48 }
const collidingCapture = (): MultiStateCapture =>
  capture('http://collides.test/', () => [
    text(LONG, { ...BOX, y: 100 }),
    text(NEIGHBOUR, { ...BOX, y: 170 }),
  ])

/** The same two runs, far enough apart that seven line boxes still clear. */
const cleanCapture = (): MultiStateCapture =>
  capture('http://clean.test/', () => [
    text(LONG, { ...BOX, y: 100 }),
    text(NEIGHBOUR, { ...BOX, y: 700 }),
  ])

const CLEAN_COVERAGE: ReferenceCoverage = {
  mirroredImages: 2,
  referencedImages: 2,
  unreferencedImages: [],
  sections: 4,
  pageHeightPx: 2000,
  pxPerSection: 500,
  findings: [],
}
const QUIET = { meanDiff: 0.3, pctOverThreshold: 0.1, regions: [] }
const NO_DELTAS = {
  deltas: [],
  matched: 40,
  unmatched: 0,
  unpairedActual: [],
  unpairedSections: [],
  unpairedActualSections: [],
  // BUG-139 — nothing was DECLINED on these fixtures either, and the empty array
  // is the claim rather than a filler: a layout collision is what these cells are
  // about, and none of them stands in for a page whose bands overlap.
  notComparableAxes: [],
}
const NO_COLLISIONS: EnvelopeReport = { pass: true, byWidth: [] }

/** Every child of the folded root, in document order. */
/**
 * Every node under the root, in document order.
 *
 * BUG-142 — a band that BACKS content now holds the runs it is painted behind,
 * so it is a `container` rather than a pinned `box` sibling of theirs. The band
 * this fixture synthesizes is the same band; the sweep is a walk.
 */
function childrenOf(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (nodes: readonly L1Node[]): void => {
    for (const n of nodes) {
      out.push(n)
      walk(n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : [])
    }
  }
  walk(doc.root.kind === 'box' ? (doc.root.children ?? []) : [])
  return out
}

function loadReal(host: string): MultiStateCapture | null {
  const p = path.join(process.cwd(), 'storage', 'references', host, 'index', 'multistate.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture) : null
}

describe('BUG-112 — on-sample layout collisions reach the verdict', () => {
  it('test_UAT_FC_BUG-112_on_sample_overlap_at_a_captured_width_fails_the_gate', () => {
    const oracle = collidingCapture()
    const base = foldToL1(oracle)

    // The served document collides at every captured width, unperturbed.
    for (const width of base.widths) {
      expect(evaluateLayout(base, width).findings, `base @${width}`).not.toEqual([])
    }

    // REQ-278 — AND NO RECOVERY TALKS IT AWAY. A recovery that keeps the captured
    // geometry repairs FRAGILITY: a page that breaks between sampled widths, or
    // when its copy grows. It cannot repair a page that already paints one run
    // over another AT a sampled width, because reproducing that position
    // faithfully is the contract it is built on — so the collision survives into
    // the recovery and the verdict has nowhere to hide it. (The predecessor did
    // "repair" this, by dropping the geometry and stacking everything; that is
    // the blind spot BUG-112 named and the miss BUG-113 measured.)
    const { doc: recovered } = promoteToFlow(base, { scale: 2.5 })
    for (const width of base.widths) {
      expect(evaluateLayout(recovered, width).findings, `recovered @${width}`).not.toEqual([])
    }

    const report = acceptanceGate(base, oracle, { served: base, contentScale: 2.5 })
    expect(report.onSample.pass).toBe(false)
    expect(report.pass).toBe(false)

    // Every captured width, and each finding names both colliding leaves.
    expect(report.onSample.byWidth.map((w) => w.width)).toEqual(base.widths)
    for (const { width, findings } of report.onSample.byWidth) {
      const overlaps = findings.filter((f) => f.kind === 'overlap')
      expect(overlaps.length, `overlaps @${width}`).toBeGreaterThan(0)
      expect(overlaps[0].detail).toContain(LONG)
      expect(overlaps[0].detail).toContain(NEIGHBOUR)
      expect(overlaps[0].paths.length).toBe(2)
    }
  })

  it('test_UAT_FC_BUG-112_a_reproduction_with_no_collisions_still_passes', () => {
    // The other rail. The same two runs, far enough apart that the grown text
    // clears its neighbour — the gate must not have become unconditionally red.
    const oracle = cleanCapture()
    const base = foldToL1(oracle)
    expect(validateL1(base).ok).toBe(true)

    const probe = onSampleProbe(base)
    expect(probe.pass).toBe(true)
    expect(probe.byWidth.flatMap((w) => w.findings)).toEqual([])

    // Assembled exactly as `cmdL1Gate` assembles it — same documents, same
    // perturbation — so "still passes" is a claim about the real gate.
    //
    // REQ-278 — and the document it is handed is the one `chooseRecovery` picks,
    // because that is the one `1c repro` writes. Grading the base here while the
    // operator is served the recovery would put the verdict back on a page nobody
    // loads, which is the defect BUG-113 closed.
    const choice = chooseRecovery(base, oracle, { scale: 2.5 })
    const report = acceptanceGate(choice.doc, oracle, { served: choice.doc, contentScale: 2.5 })
    expect(report.onSample.pass).toBe(true)
    expect(report.pass).toBe(true)

    const verdict = reconcileGates({
      l1Gate: report,
      coverage: CLEAN_COVERAGE,
      perceptual: QUIET,
      values: NO_DELTAS,
    })
    expect(verdict.verdict).toBe('pass')
    expect(verdict.layout).toEqual({ pass: true, findings: [] })
  })

  it('test_UAT_FC_BUG-112_verdict_names_the_colliding_leaves_and_widths', () => {
    const oracle = collidingCapture()
    const base = foldToL1(oracle)
    const l1Gate = acceptanceGate(base, oracle, { served: base, contentScale: 2.5 })

    const report = reconcileGates({
      l1Gate,
      coverage: CLEAN_COVERAGE,
      perceptual: QUIET,
      values: NO_DELTAS,
    })

    // A collision is a STRUCTURAL failure, not a ranked perceptual region: the
    // perceptual eye is well inside its floor on this fixture and the verdict is
    // red regardless.
    expect(report.perceptualBreach).toBe(false)
    expect(report.verdict).toBe('structural-failure')
    expect(report.pass).toBe(false)

    // The findings carry the SAME two keys a coverage finding does, so every
    // surface that prints one prints the other with no new format.
    expect(report.layout.pass).toBe(false)
    expect(report.layout.findings.length).toBeGreaterThan(0)
    const first = report.layout.findings[0]
    expect(Object.keys(first).sort()).toEqual(['detail', 'kind', 'paths', 'width'])
    expect(first.kind).toBe('overlap')
    expect(CLEAN_COVERAGE.findings).toEqual([]) // the shape is shared, the source is not

    // Named at 1280 — the width the perceptual gate photographs.
    const at1280 = report.layout.findings.filter((f) => f.width === 1280)
    expect(at1280.length).toBeGreaterThan(0)
    expect(at1280[0].detail).toContain('at 1280px:')
    expect(at1280[0].detail).toContain(LONG)
    expect(at1280[0].detail).toContain(NEIGHBOUR)

    // The diagnosis says what collided rather than "work the residuals", and the
    // next step names both ways out — give the region structure, or declare the
    // stack on the node.
    expect(report.diagnosis).toContain(LONG)
    expect(report.nextStep).toContain('stacked')

    // And the operator read prints them under the gate that found them.
    const printed = formatGateReport(report, 'collides.test')
    expect(printed).toContain('on-sample collision(s) on the SERVED document')
    expect(printed).toContain('at 1280px:')
  })

  it('test_UAT_FC_BUG-112_a_clean_run_says_nothing_about_collisions', () => {
    // The other rail for the verdict surface: a passing run carries an empty
    // finding list and the operator read stays silent about it. A row reading
    // "0 collisions" on every page forever is a row nobody reads by the time it
    // matters.
    const report = reconcileGates({
      l1Gate: { pass: true, onSample: NO_COLLISIONS },
      coverage: CLEAN_COVERAGE,
      perceptual: QUIET,
      values: NO_DELTAS,
    })
    expect(report.verdict).toBe('pass')
    expect(report.layout).toEqual({ pass: true, findings: [] })
    expect(formatGateReport(report, 'clean.test')).not.toContain('on-sample collision')
  })

  it('test_UAT_FC_BUG-112_clip_at_a_captured_width_is_surfaced_the_same_way', () => {
    // A run pinned wider than the viewport it was captured at. Nothing overlaps;
    // the page is cut off at its right edge, which the off-sample probe has always
    // caught at 500/900 and never at a width the reference was measured at.
    const oracle = capture('http://clips.test/', (width) => [
      text('Edge', { x: 20, y: 100, width: width + 400, height: 48 }),
    ])
    const base = foldToL1(oracle)
    const probe = onSampleProbe(base)
    expect(probe.pass).toBe(false)
    const kinds = new Set(probe.byWidth.flatMap((w) => w.findings.map((f) => f.kind)))
    expect(kinds).toEqual(new Set(['clip']))

    const report = reconcileGates({
      l1Gate: { pass: false, onSample: probe },
      coverage: CLEAN_COVERAGE,
      perceptual: QUIET,
      values: NO_DELTAS,
    })
    expect(report.layout.findings.every((f) => f.kind === 'clip')).toBe(true)
    expect(report.layout.findings[0].detail).toMatch(/^at \d+px: /)
    expect(report.diagnosis).toContain('exceeds viewport')
  })

  it('test_UAT_FC_BUG-112_synthesized_backing_surfaces_are_still_exempt', () => {
    // BUG-14's fold-invented surfaces sit BEHIND the runs they back by
    // construction, so a band overlapping its own paragraphs is the design. The
    // on-sample probe must inherit that exemption rather than re-litigate it.
    const BAND = '#e8dfd3'
    const oracle = capture('http://banded.test/', (width) => [
      { ...text('Heading', { x: 20, y: 100, width: width - 40, height: 48 }), surfaceFill: BAND },
      { ...text('Paragraph', { x: 20, y: 400, width: width - 40, height: 48 }), surfaceFill: BAND },
    ] as ValueElement[])
    const base = foldToL1(oracle)
    const bands = childrenOf(base).filter(
      (n) => (n.kind === 'box' || n.kind === 'container') && (n.id ?? '').startsWith('section-band-'),
    )
    expect(bands.length, 'the fixture actually synthesizes a band').toBeGreaterThan(0)
    expect(onSampleProbe(base).pass).toBe(true)
  })

  it('test_UAT_FC_BUG-112_a_declared_stack_is_exempt_and_an_unmarked_one_is_not', () => {
    // Where the overlap IS the design — a headline over a hero photograph — the
    // intent is recorded on the node and nowhere else. No measurement can tell a
    // deliberate composition from a collision, so the engine must not be allowed
    // to emit one unmarked: absent means "nobody has chosen", which stays a
    // finding.
    const hero = (stacked: boolean): L1Document => ({
      widths: [1280],
      background: '#ffffff',
      root: {
        kind: 'box',
        id: 'root',
        children: [
          {
            kind: 'image',
            id: 'image-0',
            src: '/assets/hero.jpg',
            alt: 'hero',
            geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 1280, height: 600 }] },
          },
          {
            kind: 'text',
            id: 'hero-title',
            text: 'Over the picture',
            axes: { fontSizePx: 64, lineHeightPx: 72, color: '#ffffff' },
            geometry: { keyframes: [{ at: 1280, x: 80, y: 220, width: 600 }] },
            ...(stacked ? { stacked: true as const } : {}),
          },
        ],
      },
    })

    // Both documents are legal L1 — `stacked` is part of the language, not a
    // convention smuggled past the validator.
    expect(validateL1(hero(false)).ok).toBe(true)
    expect(validateL1(hero(true)).ok).toBe(true)

    const unmarked = onSampleProbe(hero(false))
    expect(unmarked.pass).toBe(false)
    expect(unmarked.byWidth[0].findings[0].kind).toBe('overlap')
    expect(unmarked.byWidth[0].findings[0].detail).toContain('Over the picture')

    const declared = onSampleProbe(hero(true))
    expect(declared.pass).toBe(true)
    expect(declared.byWidth[0].findings).toEqual([])

    // One side of the pair is enough — the declaration is made by whichever node
    // is the composition, and it is never a silent default: `false` is not a
    // legal spelling of absent.
    const withFalse = hero(false) as unknown as { root: { children: Array<Record<string, unknown>> } }
    withFalse.root.children[1].stacked = false
    expect(validateL1(withFalse as unknown as L1Document).ok).toBe(false)
  })

  it('test_UAT_FC_BUG-112_the_real_gigabytealchemy_bundle_fails_and_names_1280', () => {
    // The bundle this ticket came from. It is not checked in
    // (`/storage/references/` is ignored), so the rails above carry the evidence
    // when it is absent; where it IS present this pins the property the ticket's
    // title names — **nothing computed is discarded**. Whatever the on-sample
    // probe finds on the served document, every one of those findings is in the
    // verdict the operator reads, at the width it was found at.
    //
    // Deliberately NOT a count. The five collisions this ticket opened on are a
    // measurement of one bundle at one moment, and BUG-113 owns the question of
    // whether they are real (the evaluator estimates a text run's height rather
    // than reading the oracle's measurement of it). Pinning `5` here would make
    // this UAT a trap for its own sibling: the invariant is the route from probe
    // to verdict, and that holds whether the count is five or zero.
    const oracle = loadReal('gigabytealchemy.ai')
    if (!oracle) return
    const base = foldToL1(oracle)
    const { doc: recovered } = promoteToFlow(base, { scale: 2.5 })

    const report = acceptanceGate(base, oracle, { recovered, served: base, contentScale: 2.5 })
    const verdict = reconcileGates({
      l1Gate: report,
      coverage: CLEAN_COVERAGE,
      perceptual: QUIET,
      values: NO_DELTAS,
    })

    // The served document is graded at exactly the widths the capture sampled.
    expect(report.onSample.byWidth.map((w) => w.width)).toEqual(base.widths)
    // And every finding survives the trip into the report, none dropped.
    const probed = onSampleProbe(base).byWidth.flatMap((w) => w.findings.map((f) => `${w.width}|${f.kind}|${f.detail}`))
    const reported = verdict.layout.findings.map((f) => `${f.width}|${f.kind}|${f.detail.replace(`at ${f.width}px: `, '')}`)
    expect(reported).toEqual(probed)
    expect(verdict.layout.pass).toBe(report.onSample.pass)
    // A collision on the served page is a structural failure, never a pass.
    if (probed.length > 0) {
      expect(report.pass).toBe(false)
      expect(verdict.verdict).toBe('structural-failure')
    }
  })
})
