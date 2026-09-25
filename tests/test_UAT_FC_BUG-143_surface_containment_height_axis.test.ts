/**
 * BUG-143 — the alarm for a backing surface separating from the content it backs,
 * and the viewport height it separates along.
 *
 * Three independent blindfolds meant the geometry engine could not see this class
 * of defect at all — not "did not report it", could not express it:
 *
 *   - the collision scan EXCLUDES every fold-synthesized backing surface by name
 *     (`section-band-*` / `section-bg-*` / `card-*`), correctly, because a fill
 *     painted behind its own runs overlaps them by design — and that exemption is
 *     the whole population this defect lives in;
 *   - nothing anywhere asked about CONTAINMENT. "Overlaps something it should not"
 *     was tested; "no longer covers what it exists to cover" was not a sentence
 *     the engine could say, because no surface took part in any geometric
 *     assertion of any kind;
 *   - viewport HEIGHT was not a variable. Every keyframe carried the height it was
 *     measured at (`atHeight`) and every response to that height was fitted and
 *     written down (`viewportResponse`), and nothing on the way back ever read
 *     either — so the axis the operator's report was loudest on was not
 *     undetected but unmodelled.
 *
 * What lands here, in the order the ticket puts it:
 *
 *   §4.1 the FOLD records which runs each synthesized surface backs (`backedBy`),
 *        so the relation is a recorded fact rather than a coincidence of
 *        coordinates, and the envelope validator refuses a name nothing answers to;
 *   §4.2 a CONTAINMENT assertion inside the evaluator: every backed run must stay
 *        covered by its surface, and a run that has left one is a finding naming
 *        the run, the surface and the overhang in pixels;
 *   §4.3 viewport height becomes an evaluator AXIS beside width, resolving each
 *        node's `viewportResponse` exactly as the renderer's `calc()` does, and
 *        the probes sample more than one height per width;
 *   §4.4 the off-sample probe samples two interior points per ladder segment
 *        instead of the constant pair 500 / 900px.
 *
 * Every probe here drives the real fold / validator / evaluator / acceptance-gate
 * entry points. The synthetic documents carry the evidence because the reference
 * bundles are gitignored; where a retained capture IS present the last case
 * cross-checks the same claims against it.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import {
  acceptanceGate,
  contentRobustnessProbe,
  deriveSurfaceBacking,
  envelopeHeights,
  evaluateLayout,
  foldToL1,
  measuredTextHeights,
  offSampleProbe,
  offSampleWidths,
  onSampleProbe,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src'
import { layoutCollisions } from '../tools/generate/src/cli/gate-core'

// ── fold fixtures (§4.1) ──────────────────────────────────────────────────────

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const BAND = '#e8dfd3'
const CARD = '#f8f5f2'

function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'text', color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400, box, ...over }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** Every node of a folded document, flattened. */
function nodesOf(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (n: L1Node): void => {
    out.push(n)
    const kids = n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []
    for (const k of kids) walk(k)
  }
  walk(doc.root)
  return out
}
const textsOf = (doc: L1Document): Array<Extract<L1Node, { kind: 'text' }>> =>
  nodesOf(doc).filter((n): n is Extract<L1Node, { kind: 'text' }> => n.kind === 'text')
// BUG-142 — both painting kinds, not `box` alone: a surface that owns the content
// it backs is a `container`, so a scan of the boxes finds none of them and the
// `backedBy` names below would answer to an empty list.
const surfaceIdsOf = (doc: L1Document): string[] =>
  nodesOf(doc).flatMap((n) => ((n.kind === 'box' || n.kind === 'container') && n.id ? [n.id] : []))

// ── hand-authored documents (§4.2 / §4.3 / §4.4) ──────────────────────────────

const WIDTHS = [320, 768, 1280]
const CAPTURED_HEIGHT = 800

type Frame = { at: number; x: number; y: number; width: number; height: number }
const frames = (fs: Frame[]): Array<Frame & { atHeight: number }> =>
  fs.map((f) => ({ ...f, atHeight: CAPTURED_HEIGHT }))

/**
 * A page of one full-bleed band with two runs painted on it.
 *
 * `bandSegments` / `runYs` are what each case bends: the defect is a surface whose
 * rule for following its content is wrong somewhere the page was never measured.
 */
function bandPage(opts: {
  band: Frame[]
  bandSegments?: Array<'interpolate' | 'snap'>
  bandResponse?: { yFactor?: number; heightFactor?: number }
  runs: Array<{
    text: string
    boxes: Frame[]
    segments?: Array<'interpolate' | 'snap'>
    response?: { yFactor?: number }
    /** Omit the pinned keyframe height, so the run's height is its content's. */
    naturalHeight?: boolean
  }>
  declare?: boolean
}): L1Document {
  const bandId = 'section-band-0'
  const band: L1Node = {
    kind: 'box',
    id: bandId,
    axes: { surfaceFill: BAND },
    geometry: {
      keyframes: frames(opts.band),
      ...(opts.bandSegments ? { segments: opts.bandSegments } : {}),
      ...(opts.bandResponse ? { viewportResponse: opts.bandResponse } : {}),
    },
  }
  const runs: L1Node[] = opts.runs.map((r) => ({
    kind: 'text',
    text: r.text,
    axes: { color: '#111111', fontSizePx: 18 },
    ...(opts.declare === false ? {} : { backedBy: bandId }),
    geometry: {
      keyframes: r.naturalHeight
        ? frames(r.boxes).map(({ height: _h, ...kf }) => kf)
        : frames(r.boxes),
      ...(r.segments ? { segments: r.segments } : {}),
      ...(r.response ? { viewportResponse: r.response } : {}),
    },
  }))
  return { widths: WIDTHS, background: BAND, root: { kind: 'box', children: [band, ...runs] } }
}

/** A band that holds its runs at every sampled width and height. */
const cleanPage = (): L1Document =>
  bandPage({
    band: [
      { at: 320, x: 0, y: 100, width: 320, height: 400 },
      { at: 768, x: 0, y: 100, width: 768, height: 400 },
      { at: 1280, x: 0, y: 100, width: 1280, height: 400 },
    ],
    runs: [
      {
        text: 'Presence',
        boxes: [
          { at: 320, x: 20, y: 150, width: 280, height: 40 },
          { at: 768, x: 20, y: 150, width: 700, height: 40 },
          { at: 1280, x: 20, y: 150, width: 1200, height: 40 },
        ],
      },
      {
        text: 'Connection',
        boxes: [
          { at: 320, x: 20, y: 220, width: 280, height: 40 },
          { at: 768, x: 20, y: 220, width: 700, height: 40 },
          { at: 1280, x: 20, y: 220, width: 1200, height: 40 },
        ],
      },
    ],
  })

/**
 * A band that travels down its upper segment while the run on it SNAPS across the
 * same segment: the two layers agree at every rung the fold captured and come
 * apart in the middle of the segment between them. A reflow the capture recorded
 * as a snap is exactly what `segmentKind` writes, so this is the shape of a real
 * bracket, not an invented one.
 */
const snappingPage = (declare = true): L1Document =>
  bandPage({
    declare,
    band: [
      { at: 320, x: 0, y: 100, width: 320, height: 200 },
      { at: 768, x: 0, y: 100, width: 768, height: 200 },
      { at: 1280, x: 0, y: 500, width: 1280, height: 200 },
    ],
    runs: [
      {
        text: 'Connection',
        segments: ['interpolate', 'snap'],
        boxes: [
          { at: 320, x: 20, y: 150, width: 280, height: 40 },
          { at: 768, x: 20, y: 150, width: 280, height: 40 },
          { at: 1280, x: 20, y: 550, width: 280, height: 40 },
        ],
      },
    ],
  })

/**
 * A band of a fixed measured height with copy on it that has no pinned height of
 * its own — the ordinary case, since a text leaf's height is its content's. The
 * copy reflows to more lines as it grows; the panel behind it cannot, because its
 * height is a constant the capture measured once.
 */
const growingPage = (): L1Document =>
  bandPage({
    band: [
      { at: 320, x: 0, y: 100, width: 320, height: 120 },
      { at: 768, x: 0, y: 100, width: 768, height: 120 },
      { at: 1280, x: 0, y: 100, width: 1280, height: 120 },
    ],
    runs: [
      {
        text: 'Technology that creates inner space for clarity and insight, helping you access it all',
        naturalHeight: true,
        boxes: [
          { at: 320, x: 20, y: 110, width: 280, height: 0 },
          { at: 768, x: 20, y: 110, width: 280, height: 0 },
          { at: 1280, x: 20, y: 110, width: 280, height: 0 },
        ],
      },
    ],
  })

/**
 * A band that travels with the viewport height and runs that do not — the
 * `min-h-screen` shape, and the axis the operator's report was loudest on. Exact
 * at the height every keyframe was captured at; nowhere else.
 */
const heightBlindPage = (): L1Document =>
  bandPage({
    band: [
      { at: 320, x: 0, y: 100, width: 320, height: 300 },
      { at: 768, x: 0, y: 100, width: 768, height: 300 },
      { at: 1280, x: 0, y: 100, width: 1280, height: 300 },
    ],
    bandResponse: { yFactor: 1 },
    runs: [
      {
        text: 'Positivity',
        boxes: [
          { at: 320, x: 20, y: 150, width: 280, height: 40 },
          { at: 768, x: 20, y: 150, width: 700, height: 40 },
          { at: 1280, x: 20, y: 150, width: 1200, height: 40 },
        ],
      },
    ],
  })

const escapes = (r: { byWidth: Array<{ findings: Array<{ kind: string }> }> }): number =>
  r.byWidth.reduce((n, w) => n + w.findings.filter((f) => f.kind === 'escape').length, 0)

describe('BUG-143 — the fold records which runs each synthesized surface backs', () => {
  it('test_UAT_FC_BUG-143_fold_records_the_surface_each_run_sits_on', () => {
    // A full-width band with two runs on it, and a narrower card with its own
    // treatment. Every run the reconstruction used names the surface it produced.
    const doc = foldToL1(
      multiFrom((w) => [
        run('Heading A', { x: 20, y: 100, width: w - 40, height: 40 }, { surfaceFill: BAND }),
        run('Intro A', { x: 20, y: 160, width: w - 40, height: 40 }, { surfaceFill: BAND }),
        run('Card copy', { x: 60, y: 300, width: 240, height: 40 }, {
          surfaceFill: CARD,
          borderLeft: { widthPx: 4, color: '#ffb900' },
        }),
      ]),
    )
    const ids = surfaceIdsOf(doc)
    const byText = new Map(textsOf(doc).map((t) => [typeof t.text === 'string' ? t.text : '', t]))
    expect(byText.get('Heading A')!.backedBy).toBe('section-band-0')
    expect(byText.get('Intro A')!.backedBy).toBe('section-band-0')
    expect(byText.get('Card copy')!.backedBy).toMatch(/^card-/)
    // The names answer to real surfaces — a dangling one is not a legal document.
    for (const t of byText.values()) if (t.backedBy) expect(ids).toContain(t.backedBy)
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_BUG-143_a_backing_name_nothing_answers_to_is_refused', () => {
    // The relation is only worth recording if it is checkable. A `backedBy` naming
    // a surface the document does not declare is an assertion that silently never
    // runs — the exact failure mode this axis exists to close — so the envelope
    // validator refuses it and says which name went unanswered.
    const dangling = snappingPage()
    const firstRun = (dangling.root as Extract<L1Node, { kind: 'box' }>).children!.find(
      (n) => n.kind === 'text',
    ) as Extract<L1Node, { kind: 'text' }>
    firstRun.backedBy = 'section-band-404'
    const res = validateL1(dangling)
    expect(res.ok).toBe(false)
    expect(JSON.stringify(res.ok ? [] : res.errors)).toContain('section-band-404')
    expect(JSON.stringify(res.ok ? [] : res.errors)).toContain('backedBy')
  })
})

describe('BUG-143 — containment: a surface that has left the content it backs', () => {
  it('test_UAT_FC_BUG-143_escape_names_the_run_the_surface_and_the_overhang', () => {
    const doc = snappingPage()
    expect(validateL1(doc).ok).toBe(true)
    // At every captured width the two layers agree, so the page reads clean where
    // the reference was measured — which is exactly why nothing saw this before.
    expect(onSampleProbe(doc, { heights: [CAPTURED_HEIGHT] }).pass).toBe(true)

    // Between the rungs the band holds its snapped keyframe while the run keeps
    // interpolating, and the run walks off the bottom of its own panel.
    const off = offSampleProbe(doc, { heights: [CAPTURED_HEIGHT] })
    expect(off.pass).toBe(false)
    const found = off.byWidth.flatMap((w) => w.findings.filter((f) => f.kind === 'escape'))
    expect(found.length).toBeGreaterThan(0)
    // The finding is something an operator can go and look at: the run, the
    // surface it left, the overhang in px, and the side it left by.
    expect(found[0].detail).toContain("'Connection'")
    expect(found[0].detail).toContain('section-band-0')
    expect(found[0].detail).toMatch(/\d+px (below|above) its (bottom|top) edge/)
    expect(found[0].paths).toHaveLength(2)
    // …and it is reported at a width the fold never sampled.
    const at = off.byWidth.find((w) => w.findings.some((f) => f.kind === 'escape'))!
    expect(WIDTHS).not.toContain(at.width)
  })

  it('test_UAT_FC_BUG-143_escape_is_reported_under_content_growth', () => {
    // The other half of the operator's report: the copy grows and the panel does
    // not. The band's height is a constant it was measured at once; the run it
    // backs is not, so growth pushes the run straight through the bottom edge.
    const doc = growingPage()
    expect(validateL1(doc).ok).toBe(true)
    const grown = contentRobustnessProbe(doc, { scale: 2.5, heights: [CAPTURED_HEIGHT] })
    expect(grown.pass).toBe(false)
    expect(escapes(grown)).toBeGreaterThan(0)
    // Unperturbed at the same widths and height, the page is clean — the finding
    // is about the growth, not about a pairing that never held.
    expect(escapes(onSampleProbe(doc, { heights: [CAPTURED_HEIGHT] }))).toBe(0)
  })

  it('test_UAT_FC_BUG-143_a_document_declaring_nothing_is_still_gated', () => {
    // Every document folded before `backedBy` existed declares no backing at all.
    // Excluding them would leave the pages this defect was reported on ungated, so
    // a surface that covers a run at EVERY captured width backs it whether or not
    // anything wrote that down — and the same escape is reported.
    const undeclared = snappingPage(false)
    expect(textsOf(undeclared).every((t) => t.backedBy === undefined)).toBe(true)
    const backing = deriveSurfaceBacking(undeclared)
    expect(backing.size).toBe(1)
    expect(escapes(offSampleProbe(undeclared, { heights: [CAPTURED_HEIGHT] }))).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-143_a_reflowed_pairing_is_not_reported_as_an_escape', () => {
    // The guess has to be honest or the alarm is noise. A run that sits on this
    // band at desktop and somewhere else entirely at mobile is not covered by it at
    // every rung, so the reflow that moves it is NOT a surface coming apart — and
    // nothing here declares otherwise either.
    const reflowed = bandPage({
      declare: false,
      band: [
        { at: 320, x: 0, y: 100, width: 320, height: 200 },
        { at: 768, x: 0, y: 100, width: 768, height: 200 },
        { at: 1280, x: 0, y: 100, width: 1280, height: 200 },
      ],
      runs: [
        {
          text: 'Moves to another section on mobile',
          boxes: [
            { at: 320, x: 20, y: 900, width: 280, height: 40 },
            { at: 768, x: 20, y: 150, width: 700, height: 40 },
            { at: 1280, x: 20, y: 150, width: 1200, height: 40 },
          ],
        },
      ],
    })
    expect(deriveSurfaceBacking(reflowed).size).toBe(0)
    expect(escapes(offSampleProbe(reflowed))).toBe(0)
    expect(escapes(onSampleProbe(reflowed))).toBe(0)
  })
})

describe('BUG-143 — viewport height is an evaluator axis', () => {
  it('test_UAT_FC_BUG-143_height_response_resolves_against_the_sampled_height', () => {
    // `top: calc(y + yFactor * (100vh - atHeight))` is the CSS the renderer emits;
    // the evaluator now computes the same number. At the captured height the two
    // terms cancel, which is what makes the axis safe to add to every caller.
    const doc = heightBlindPage()
    const bandBox = (vh?: number): { y: number; height: number } => {
      const leaf = evaluateLayout(doc, 1280, { viewportHeight: vh }).leaves.find(
        (l) => l.id === 'section-band-0',
      )!
      return { y: leaf.box.y, height: leaf.box.height }
    }
    expect(bandBox(CAPTURED_HEIGHT)).toEqual({ y: 100, height: 300 })
    expect(bandBox(undefined)).toEqual({ y: 100, height: 300 })
    // A viewport 400px taller moves a yFactor-1 band down by exactly 400px.
    expect(bandBox(CAPTURED_HEIGHT + 400)).toEqual({ y: 500, height: 300 })
    // A run that declares no response does not move, which is the separation.
    const runAt = (vh: number): number =>
      evaluateLayout(doc, 1280, { viewportHeight: vh }).leaves.find((l) => l.kind === 'text')!.box.y
    expect(runAt(CAPTURED_HEIGHT)).toBe(150)
    expect(runAt(CAPTURED_HEIGHT + 400)).toBe(150)
    // The evaluation says which height it was about.
    expect(evaluateLayout(doc, 1280, { viewportHeight: 1200 }).height).toBe(1200)
  })

  it('test_UAT_FC_BUG-143_probes_sample_more_than_one_height_per_width', () => {
    // One height per width is a recorded constant, not an axis. The probes sample
    // the shortest height the ladder was captured at and one half again taller than
    // the tallest — a height nothing was captured at, which is the point.
    const doc = heightBlindPage()
    expect(envelopeHeights(doc)).toEqual([CAPTURED_HEIGHT, CAPTURED_HEIGHT * 1.5])
    const report = onSampleProbe(doc)
    expect([...new Set(report.byWidth.map((w) => w.width))]).toEqual(WIDTHS)
    for (const width of WIDTHS) {
      expect(report.byWidth.filter((w) => w.width === width).length).toBeGreaterThan(1)
    }
    // Clean at the captured height; comes apart at a height nothing measured.
    expect(escapes(onSampleProbe(doc, { heights: [CAPTURED_HEIGHT] }))).toBe(0)
    expect(escapes(onSampleProbe(doc, { heights: [CAPTURED_HEIGHT * 1.5] }))).toBeGreaterThan(0)
    // The reported sample names the height, so the operator can reproduce it.
    const failing = report.byWidth.find((w) => w.findings.some((f) => f.kind === 'escape'))!
    expect(failing.height).toBe(CAPTURED_HEIGHT * 1.5)
  })
})

describe('BUG-143 — the off-sample probe characterises each ladder segment', () => {
  it('test_UAT_FC_BUG-143_off_sample_samples_two_points_per_segment', () => {
    // Two points between six rungs cannot characterise the interpolation between
    // them: one segment got both, two got one each, two got none at all. Two
    // interior points per segment can see a bracket bend anywhere along its length.
    const ladderDoc: L1Document = { ...cleanPage(), widths: LADDER }
    const sampled = offSampleWidths(ladderDoc)
    expect(sampled.length).toBe(2 * (LADDER.length - 1))
    // Nothing sampled twice, nothing on a rung, and every segment covered twice.
    expect(new Set(sampled).size).toBe(sampled.length)
    for (const rung of LADDER) expect(sampled).not.toContain(rung)
    for (let i = 0; i < LADDER.length - 1; i++) {
      expect(sampled.filter((w) => w > LADDER[i] && w < LADDER[i + 1]).length).toBe(2)
    }
    // Nothing below the first rung or above the last: the renderer holds the end
    // keyframe there, so the only thing such a sample could report is that boxes
    // measured at 320px overflow a viewport narrower than 320px.
    expect(Math.min(...sampled)).toBeGreaterThan(LADDER[0])
    expect(Math.max(...sampled)).toBeLessThan(LADDER[LADDER.length - 1])
  })
})

describe('BUG-143 — the alarm does not fire on a page that holds together', () => {
  it('test_UAT_FC_BUG-143_a_page_whose_panels_hold_their_content_passes_every_probe', () => {
    const doc = cleanPage()
    expect(validateL1(doc).ok).toBe(true)
    expect(onSampleProbe(doc).pass).toBe(true)
    expect(offSampleProbe(doc).pass).toBe(true)
    expect(contentRobustnessProbe(doc, { scale: 1.2 }).pass).toBe(true)
    // …across every one of the width×height samples, not merely on average.
    expect(offSampleProbe(doc).byWidth.every((w) => w.findings.length === 0)).toBe(true)
  })
})

describe('BUG-143 — the verdict carries the findings', () => {
  it('test_UAT_FC_BUG-143_layout_findings_name_the_escapes_and_their_sample', () => {
    // `gate.json`'s `layout` block read `pass: true, findings: []` on a page whose
    // panels had slid off their copy, because it was built from the on-sample
    // report alone — and this defect is invisible at the captured widths by
    // construction. The block now carries every containment escape the other two
    // envelope probes found, each naming the sample it was found at.
    const doc = snappingPage()
    const collisions = layoutCollisions(
      onSampleProbe(doc, { heights: [CAPTURED_HEIGHT] }),
      offSampleProbe(doc, { heights: [CAPTURED_HEIGHT] }),
    )
    const found = collisions.filter((c) => c.kind === 'escape')
    expect(found.length).toBeGreaterThan(0)
    expect(found[0].detail).toMatch(/^at \d+px×\d+px: /)
    expect(found[0].height).toBe(CAPTURED_HEIGHT)
    expect(found[0].paths).toHaveLength(2)
  })
})

// ── the retained reference, where the checkout has one ────────────────────────

function loadReal(host: string): MultiStateCapture | null {
  const p = path.join(process.cwd(), 'storage', 'references', host, 'index', 'multistate.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture) : null
}

describe('BUG-143 — the reproduction the defect was reported on', () => {
  it('test_UAT_FC_BUG-143_the_reported_reproduction_fails_where_it_used_to_pass', () => {
    // The bundles are gitignored, so this case carries no evidence of its own —
    // the synthetic cases above do. Where a retained capture IS present it proves
    // the same claims against the page the operator actually resized: clean at rest
    // at every captured sample, and coming apart between the rungs, under content
    // growth, and at a viewport height nothing was captured at.
    const ms = loadReal('gigabytealchemy.ai')
    if (!ms) return
    const doc = foldToL1(ms)
    const measured = measuredTextHeights(ms)
    // §4.1 — the fold now says which runs each surface backs.
    expect(textsOf(doc).filter((t) => t.backedBy !== undefined).length).toBeGreaterThan(0)
    expect(validateL1(doc).ok).toBe(true)
    // Clean at rest, at every captured width and the height it was captured at.
    const rest = onSampleProbe(doc, { measured, heights: [800] })
    expect(escapes(rest)).toBe(0)
    // Between the rungs, and under a 15% content growth, panels leave their copy.
    expect(escapes(offSampleProbe(doc, { measured }))).toBeGreaterThan(0)
    expect(escapes(contentRobustnessProbe(doc, { measured, scale: 1.15 }))).toBeGreaterThan(0)
    // The acceptance gate's verdict carries them rather than reporting a clean
    // envelope: the whole point of the alarm landing before the fix.
    const gate = acceptanceGate(doc, ms, { measured })
    expect(gate.offSample.pass).toBe(false)
    expect(
      layoutCollisions(gate.onSample, gate.offSample, gate.contentRobustness).filter(
        (c) => c.kind === 'escape',
      ).length,
    ).toBeGreaterThan(0)
  })
})
