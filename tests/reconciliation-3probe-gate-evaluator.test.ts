/**
 * Reconciliation UATs for story-24098299 —
 * "End-to-end 3-probe reproduction acceptance gate" (second span).
 *
 * `tests/reconciliation-3probe-gate.test.ts` carries AC-705..710 + AC-724 (the
 * three probes, the combined gate, demand-driven recovery, the diagnostic
 * residual shape and the idempotence identity). This file carries the ACs the
 * BUNDLE-8 free-coded cycle added to the same story — the evaluator's flow model
 * and breakpoint-interval semantics, the backing-surface exception, and the
 * gate's fold-residual channel:
 *
 *   AC-734  analytic evaluator tiles a flex row along the main axis
 *   AC-735  geometry resolves against half-open breakpoint intervals
 *   AC-736  a painted backing surface is not a sibling overlap (but still clips)
 *   AC-737  gate report carries fold residuals as their own channel
 *
 * Each UAT drives a real boundary — `evaluateLayout` / `foldToL1` /
 * `sampleFidelityProbe` on the `tools/generate/src` surface, `cmdL1Gate` on the
 * command surface, and `run(argv)` on the `1c` CLI surface. No internal helper is
 * mocked; the only synthetic input is the capture bundle each test writes to a
 * temporary directory.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  evaluateLayout,
  foldToL1,
  sampleFidelityProbe,
  type LayoutFinding,
} from '../tools/generate/src'
import { cmdL1Gate } from '../tools/generate/src/cli/repro'
import { run, writeMultiState } from '../tools/generate/src/cli'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import {
  validateL1,
  type L1Document,
  type L1Geometry,
  type L1Node,
} from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

// ── shared builders ───────────────────────────────────────────────────────────

/** A geometry-free (in-flow) styled text leaf. */
function flowText(text: string, fontSizePx: number): L1Node {
  return {
    kind: 'text',
    text,
    axes: { color: '#111827', fontFamily: 'Arial', fontSizePx, fontWeight: 400 },
  }
}

/** A fixed-main-axis-width painted box wrapping one label — a deterministic row item. */
function fixedItem(label: string, px: number): L1Node {
  return {
    kind: 'box',
    axes: { surfaceFill: '#e5e7eb' },
    sizing: { width: { mode: 'fixed', px } },
    children: [flowText(label, 16)],
  }
}

/** Wrap a root node in a validated L1 document over the ladder. */
function mkDoc(root: L1Node): L1Document {
  const doc: L1Document = { widths: LADDER, background: '#ffffff', root }
  const result = validateL1(doc)
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return doc
}

/** Every evaluated leaf box at `width`, keyed by its text. */
function boxesByText(doc: L1Document, width: number, contentScale = 1) {
  const { leaves, findings } = evaluateLayout(doc, width, { contentScale })
  const byText = new Map<string, { x: number; y: number; width: number; height: number }>()
  for (const l of leaves) if (l.kind === 'text' && l.text) byText.set(l.text, l.box)
  return { byText, findings, leaves }
}

/** A resting `MultiStateCapture` over the ladder from a per-width element list. */
function multiFromLadder(
  elementsAt: (width: number) => ValueElement[],
  height = 1600,
): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A `kind:detail` signature of a finding list — path-independent, so it survives
 * the surface boxes that shift every content leaf's index path. */
function signature(findings: LayoutFinding[]): string[] {
  return findings.map((f) => `${f.kind}:${f.detail}`).sort()
}

// ── AC-734 — the analytic evaluator's flex-row flow model ─────────────────────

describe('story-24098299 — analytic evaluator flow model', () => {
  it('test_UAT_AC734_row_tiles_along_main_axis_with_no_false_overflow', () => {
    // ── A row of three geometry-free children inside a known viewport ──────────
    // The row is the first child of a stack, so the marker that follows it starts
    // exactly at the row's resolved height — the observable form of "the row's
    // height is that of its tallest child".
    const MARKER = 'after the row'
    const rowDoc = mkDoc({
      kind: 'container',
      layout: 'stack',
      gapPx: 0,
      children: [
        {
          kind: 'container',
          layout: 'row',
          gapPx: 30,
          // The middle child is set at 40px (a 56px line box); the outer two at
          // 16px (a 22px line box), so the tallest child is unambiguous.
          children: [flowText('A', 16), flowText('B', 40), flowText('C', 16)],
        },
        flowText(MARKER, 16),
      ],
    })

    const { byText, findings } = boxesByText(rowDoc, 900)
    // Each child takes its own main-axis width: the gap-adjusted leftover extent
    // (900 − 2·30) split three ways = 280px each, at ascending x.
    expect(byText.get('A')).toMatchObject({ x: 0, y: 0, width: 280 })
    expect(byText.get('B')).toMatchObject({ x: 310, y: 0, width: 280 })
    expect(byText.get('C')).toMatchObject({ x: 620, y: 0, width: 280 })
    // The cursor advanced by each child's OWN width — the row spans its parent
    // exactly once (not 3×900), and no two children overlap.
    expect(byText.get('C')!.x + byText.get('C')!.width).toBe(900)
    expect(byText.get('B')!.x).toBeGreaterThanOrEqual(byText.get('A')!.x + byText.get('A')!.width)
    expect(byText.get('C')!.x).toBeGreaterThanOrEqual(byText.get('B')!.x + byText.get('B')!.width)
    // The row's resolved height is its tallest child (B's 56px, not A/C's 22px).
    expect(byText.get('A')!.height).toBe(22)
    expect(byText.get('B')!.height).toBe(56)
    expect(byText.get(MARKER)!.y).toBe(56)
    // A well-formed row raises NO envelope finding — no overlap, no clip.
    expect(findings).toEqual([])

    // ── One child declares a fixed width; the rest share the remainder ─────────
    const mixed = mkDoc({
      kind: 'container',
      layout: 'row',
      gapPx: 20,
      children: [fixedItem('F', 300), flowText('G', 16), flowText('H', 16)],
    })
    const mixedEval = boxesByText(mixed, 900)
    // F keeps its declared 300px; G and H share (900 − 2·20 − 300) = 560 → 280 each.
    expect(mixedEval.byText.get('F')).toMatchObject({ x: 0, width: 300 })
    expect(mixedEval.byText.get('G')).toMatchObject({ x: 320, width: 280 })
    expect(mixedEval.byText.get('H')).toMatchObject({ x: 620, width: 280 })
    expect(mixedEval.findings).toEqual([])

    // ── Fixed widths beyond the extent: a genuine clip, not a masked one ───────
    const overflowing = mkDoc({
      kind: 'container',
      layout: 'row',
      gapPx: 0,
      children: [fixedItem('P', 500), fixedItem('Q', 500), flowText('Z', 16)],
    })
    const over = boxesByText(overflowing, 900)
    // The two fixed children already exceed the 900px extent, so the flexible
    // child collapses to zero width rather than masking the overflow…
    expect(over.byText.get('Z')!.width).toBe(0)
    // …and the overflow surfaces as a horizontal clip beyond the viewport.
    const clips = over.findings.filter((f) => f.kind === 'clip')
    expect(clips.length).toBeGreaterThan(0)
    expect(clips[0].detail).toMatch(/exceeds viewport 900px/)

    // ── Stack containers are unaffected; grid is modelled as a stack ───────────
    const stackChildren = [flowText('s1', 16), flowText('s2', 16), flowText('s3', 16)]
    const stack = mkDoc({ kind: 'container', layout: 'stack', gapPx: 12, children: stackChildren })
    const stacked = boxesByText(stack, 900)
    for (const t of ['s1', 's2', 's3']) {
      expect(stacked.byText.get(t)).toMatchObject({ x: 0, width: 900 })
    }
    expect(stacked.byText.get('s2')!.y).toBeGreaterThan(stacked.byText.get('s1')!.y)
    expect(stacked.byText.get('s3')!.y).toBeGreaterThan(stacked.byText.get('s2')!.y)
    expect(stacked.findings).toEqual([])

    // A `grid` container resolves identically to the stack — envelope-conservative.
    const grid = mkDoc({ kind: 'container', layout: 'grid', gapPx: 12, children: stackChildren })
    const gridded = boxesByText(grid, 900)
    for (const t of ['s1', 's2', 's3']) {
      expect(gridded.byText.get(t)).toEqual(stacked.byText.get(t))
    }
    expect(gridded.findings).toEqual([])
  })
})

// ── AC-735 — half-open breakpoint intervals ───────────────────────────────────

const REFLOW_WIDTHS = [375, 768, 1024]

/** A card heading captured at one width — a text run pinned to a box. */
function card(text: string, x: number, y: number, width: number): ValueElement {
  return {
    text,
    role: 'subheading',
    a11yRole: 'heading',
    color: '#111827',
    fontFamily: 'Arial',
    fontSizePx: 20,
    fontWeight: 600,
    box: { x, y, width, height: 28 },
  }
}

/**
 * A three-card grid that reflows at the interior captured breakpoint 768:
 * stacked at 375 (each 279px wide), a row at 768 (each narrows to 171px — enough
 * that the 375→768 segment classifies `snap`), a wider row at 1024.
 */
function reflowCapture(): MultiStateCapture {
  const perWidth: Record<number, ValueElement[]> = {
    375: [
      card('Presence', 48, 1804, 279),
      card('Positivity', 48, 2028, 279),
      card('Connection', 48, 2226, 279),
    ],
    768: [
      card('Presence', 48, 1831, 171),
      card('Positivity', 299, 1831, 171),
      card('Connection', 549, 1831, 171),
    ],
    1024: [
      card('Presence', 48, 1517, 229),
      card('Positivity', 357, 1517, 229),
      card('Connection', 667, 1517, 229),
    ],
  }
  return {
    url: 'http://reflow.test/',
    notes: [],
    projections: REFLOW_WIDTHS.map((width) => ({
      engine: 'chromium' as const,
      viewport: { width, height: 3000 },
      state: 'rest' as const,
      manifest: {
        source: `reflow@${width}`,
        elements: perWidth[width],
        sections: [],
        viewport: { width, height: 3000 },
      },
    })),
  }
}

/** Collect every pinned text leaf's geometry track from a folded document. */
function textGeometries(doc: L1Document): Map<string, L1Geometry> {
  const out = new Map<string, L1Geometry>()
  const walk = (n: L1Node): void => {
    if (n.kind === 'text' && n.geometry) out.set(n.text, n.geometry)
    for (const c of (n as { children?: L1Node[] }).children ?? []) walk(c)
  }
  walk(doc.root)
  return out
}

/**
 * The pre-fix resolver: the same math with a **closed** upper bound
 * (`width <= b.at`). Kept local to this UAT purely as the counterfactual the AC
 * asks for — "assert the guard bites by checking that resolving the interval with
 * a closed upper bound instead reproduces the pre-reflow box".
 */
function resolveClosedUpperBound(geo: L1Geometry, width: number) {
  const f = geo.keyframes
  if (width <= f[0].at) return f[0]
  for (let i = 0; i < f.length - 1; i++) {
    const a = f[i]
    const b = f[i + 1]
    if (width >= a.at && width <= b.at) {
      const seg = geo.segments?.[i] ?? 'interpolate'
      if (seg === 'snap') return a
      const t = b.at === a.at ? 0 : (width - a.at) / (b.at - a.at)
      return {
        at: width,
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        width: a.width + (b.width - a.width) * t,
      }
    }
  }
  return f[f.length - 1]
}

describe('story-24098299 — half-open breakpoint intervals', () => {
  it('test_UAT_AC735_reflow_at_a_captured_breakpoint_does_not_cascade', () => {
    const capture = reflowCapture()
    const doc = foldToL1(capture)
    const tracks = textGeometries(doc)

    // Every element present at the reflow breakpoint carries a keyframe there —
    // capture and fold were never the defect; the evaluator was.
    for (const name of ['Presence', 'Positivity', 'Connection']) {
      expect(tracks.get(name)!.keyframes.map((k) => k.at), `${name} track`).toEqual(REFLOW_WIDTHS)
    }
    // The 375→768 span narrows enough to classify `snap` — the precondition that
    // made the closed upper bound hold the stale pre-reflow frame.
    expect(tracks.get('Positivity')!.segments?.[0]).toBe('snap')

    // At exactly 768 the segment STARTING there is active: each card resolves to
    // its post-reflow box, never the frame held from the width below.
    const at768 = evaluateLayout(doc, 768).leaves
    const boxOf = (text: string) => at768.find((l) => l.kind === 'text' && l.text === text)!.box
    expect(boxOf('Presence')).toMatchObject({ x: 48, y: 1831, width: 171 })
    expect(boxOf('Positivity')).toMatchObject({ x: 299, y: 1831, width: 171 })
    expect(boxOf('Connection')).toMatchObject({ x: 549, y: 1831, width: 171 })

    // The guard bites: a closed upper bound matches the segment ENDING at 768
    // first, so the `snap` returns the held 375 keyframe — the stale, wider,
    // pre-reflow box that used to cascade down the rest of the page.
    const stale = resolveClosedUpperBound(tracks.get('Positivity')!, 768)
    expect(stale.x).toBe(48)
    expect(stale.y).toBe(2028)
    expect(stale.width).toBe(279)
    expect(stale.x).not.toBe(boxOf('Positivity').x)

    // Because no stale frame displaces the elements resolved from it, the
    // fidelity probe is clean at EVERY captured width — the breakpoint included.
    const report = sampleFidelityProbe(doc, capture, { tolerancePx: 2 })
    expect(report.residuals, JSON.stringify(report.residuals)).toEqual([])
    expect(report.unmatched).toEqual([])
    expect(report.pass).toBe(true)
    expect(report.residuals.filter((r) => r.width === 768)).toEqual([])

    // The ends of the ladder are unchanged: below the first breakpoint the base
    // keyframe holds; above the last, the final keyframe holds.
    const below = evaluateLayout(doc, 320).leaves.find((l) => l.text === 'Positivity')!.box
    expect(below).toMatchObject({ x: 48, y: 2028, width: 279 })
    const above = evaluateLayout(doc, 1600).leaves.find((l) => l.text === 'Positivity')!.box
    expect(above).toMatchObject({ x: 357, y: 1517, width: 229 })
  })
})

// ── AC-736 — the painted backing-surface exception ────────────────────────────

const BAND = '#ffffff'
const PANEL = '#dbeafe'

/** A 25-char run: one line at rest, two lines under a 2.5× grow. */
function bandRun(text: string, y: number, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111111',
    fontFamily: 'Arial',
    fontSizePx: 18,
    fontWeight: 400,
    box: { x: 20, y, width: 300, height: 40 },
    ...over,
  }
}

/** The same four runs with and without their composited surface fills. */
function surfaceCapture(withSurfaces: boolean): MultiStateCapture {
  const fill = (hex: string) => (withSurfaces ? { surfaceFill: hex } : {})
  return multiFromLadder(() => [
    bandRun('Alpha band copy line here', 20, fill(BAND)),
    bandRun('Bravo band copy line here', 60, fill(BAND)),
    bandRun('Delta band copy line here', 100, fill(BAND)),
    bandRun('Panel card copy line here', 600, fill(PANEL)),
  ])
}

describe('story-24098299 — painted backing surfaces', () => {
  it('test_UAT_AC736_backing_surface_is_not_an_overlap_but_still_clips', () => {
    const withCap = surfaceCapture(true)
    const withoutCap = surfaceCapture(false)
    const withDoc = foldToL1(withCap)
    const withoutDoc = foldToL1(withoutCap)

    // The composited fills are reconstructed as backing surfaces (BUG-14: one
    // section band per fill run-group); the same capture folded without them emits
    // no `box` leaf at all.
    expect(withDoc.background).toBe(BAND)
    const surfaces = evaluateLayout(withDoc, 1280).leaves.filter((l) => l.kind === 'box')
    expect(surfaces).toHaveLength(2)
    expect(evaluateLayout(withoutDoc, 1280).leaves.filter((l) => l.kind === 'box')).toEqual([])

    // The surface sits directly behind the content it backs — their boxes really
    // do intersect, so the exception below is load-bearing, not vacuous.
    const backedText = evaluateLayout(withDoc, 1280).leaves.find(
      (l) => l.text === 'Panel card copy line here',
    )!
    const t = backedText.box
    const s = surfaces.find((l) => l.box.y <= t.y && l.box.y + l.box.height >= t.y + t.height)!.box
    expect(Math.min(s.y + s.height, t.y + t.height) - Math.max(s.y, t.y)).toBeGreaterThan(2)

    // At every width, at rest AND under content perturbation: no overlap finding
    // names a surface box, and the content-leaf findings are identical to the
    // same capture folded without surfaces.
    let sawGenuineOverlap = false
    for (const width of [...LADDER, 500, 900]) {
      for (const contentScale of [1, 2.5]) {
        const withRes = evaluateLayout(withDoc, width, { contentScale })
        const withoutRes = evaluateLayout(withoutDoc, width, { contentScale })
        const surfacePaths = new Set(
          withRes.leaves.filter((l) => l.kind === 'box').map((l) => l.path),
        )
        for (const f of withRes.findings.filter((f) => f.kind === 'overlap')) {
          expect(
            f.paths.some((p) => surfacePaths.has(p)),
            `overlap at ${width}px ×${contentScale} names a surface: ${f.detail}`,
          ).toBe(false)
          sawGenuineOverlap = true
        }
        // Genuine collisions between content leaves are still reported, byte for
        // byte the same set as the surface-free fold.
        expect(signature(withRes.findings), `findings at ${width}px ×${contentScale}`).toEqual(
          signature(withoutRes.findings),
        )
      }
    }
    // The grown band runs really do collide — the equality above is not "both empty".
    expect(sawGenuineOverlap).toBe(true)

    // A surface whose right edge extends beyond the viewport IS still a clip:
    // surfaces are exempt from the overlap check only, not from the envelope.
    const wideSurface = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'box',
          id: 'card-wide',
          axes: { surfaceFill: PANEL },
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 1400, height: 200 }] },
        },
      ],
    })
    const wide = evaluateLayout(wideSurface, 1024)
    const surfaceClip = wide.findings.find((f) => f.kind === 'clip')
    expect(surfaceClip).toBeDefined()
    expect(surfaceClip!.detail).toMatch(/1400px exceeds viewport 1024px/)
    expect(surfaceClip!.paths).toEqual([wide.leaves.find((l) => l.kind === 'box')!.path])

    // Inert placeholder slots are excluded from the overlap check the same way.
    const slotDoc = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'slot',
          name: 'carousel',
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 300, height: 200 }] },
        },
        {
          kind: 'text',
          text: 'Sits inside the slot',
          axes: { color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400 },
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 300 }] },
        },
      ],
    })
    expect(evaluateLayout(slotDoc, 1024).findings.filter((f) => f.kind === 'overlap')).toEqual([])

    // …but a slot that runs past the viewport edge is a clip like any other leaf
    // — the slot exemption, like the surface one, is from the overlap check only.
    const wideSlot = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'slot',
          name: 'carousel',
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 1400, height: 200 }] },
        },
      ],
    })
    const wideSlotRes = evaluateLayout(wideSlot, 1024)
    const slotClip = wideSlotRes.findings.find((f) => f.kind === 'clip')
    expect(slotClip).toBeDefined()
    expect(slotClip!.detail).toMatch(/1400px exceeds viewport 1024px/)
    expect(slotClip!.paths).toEqual([wideSlotRes.leaves.find((l) => l.kind === 'slot')!.path])

    // ── the discriminator: exemption is keyed on SYNTHESIZED identity ──────────
    // Two genuinely captured standalone surfaces (`box-*`) that intersect are
    // real painted content colliding, and the overlap IS reported naming both.
    // Without this the exemption could be read as "painted surfaces never
    // collide", which would silently swallow a real reproduction defect.
    const capturedPair = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'box',
          id: 'box-3',
          axes: { surfaceFill: PANEL },
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 300, height: 200 }] },
        },
        {
          kind: 'box',
          id: 'box-7',
          axes: { surfaceFill: BAND },
          geometry: { keyframes: [{ at: 320, x: 100, y: 100, width: 300, height: 200 }] },
        },
      ],
    })
    const pairRes = evaluateLayout(capturedPair, 1024)
    const pairOverlaps = pairRes.findings.filter((f) => f.kind === 'overlap')
    expect(pairOverlaps).toHaveLength(1)
    expect(new Set(pairOverlaps[0].paths)).toEqual(new Set(['0.0', '0.1']))

    // The identical geometry under SYNTHESIZED ids reports nothing — so the
    // difference above is the id, not the shape.
    const synthesizedPair = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'box',
          id: 'section-band-0',
          axes: { surfaceFill: PANEL },
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 300, height: 200 }] },
        },
        {
          kind: 'box',
          id: 'card-1',
          axes: { surfaceFill: BAND },
          geometry: { keyframes: [{ at: 320, x: 100, y: 100, width: 300, height: 200 }] },
        },
      ],
    })
    expect(evaluateLayout(synthesizedPair, 1024).findings.filter((f) => f.kind === 'overlap')).toEqual([])

    // A captured surface sitting under content it appears to back is likewise
    // still reported — "looks like a background" is not the exemption either.
    const capturedUnderContent = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'box',
          id: 'box-11',
          axes: { surfaceFill: PANEL },
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 400, height: 200 }] },
        },
        {
          kind: 'text',
          text: 'Sits on the captured panel',
          axes: { color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400 },
          geometry: { keyframes: [{ at: 320, x: 20, y: 40, width: 300 }] },
        },
      ],
    })
    const underRes = evaluateLayout(capturedUnderContent, 1024)
    const underOverlaps = underRes.findings.filter((f) => f.kind === 'overlap')
    expect(underOverlaps).toHaveLength(1)
    expect(new Set(underOverlaps[0].paths)).toEqual(new Set(['0.0', '0.1']))

    // Sample fidelity for the text leaves is untouched by the surfaces.
    const withFidelity = sampleFidelityProbe(withDoc, withCap, { tolerancePx: 2 })
    const withoutFidelity = sampleFidelityProbe(withoutDoc, withoutCap, { tolerancePx: 2 })
    expect(withFidelity.pass).toBe(true)
    expect(withFidelity.residuals).toEqual([])
    expect(withFidelity.unmatched).toEqual([])
    expect(withFidelity).toEqual(withoutFidelity)
  })
})

// ── AC-737 — the gate's fold-residual channel ─────────────────────────────────

/** A roomy three-band page (all three probes pass) carrying three elements the
 * fold cannot yet express: text-free media with no geometry, a form control, and
 * a geometry-less text run. */
function gapCapture(): MultiStateCapture {
  return multiFromLadder((w) => [
    {
      text: 'Front door heading',
      role: 'heading',
      color: '#111827',
      fontFamily: 'Inter',
      fontSizePx: 40,
      fontWeight: 700,
      lineHeightPx: 48,
      box: { x: 20, y: 100, width: w - 40, height: 48 },
    },
    {
      text: 'Second band',
      role: 'body',
      color: '#111827',
      fontFamily: 'Inter',
      fontSizePx: 40,
      fontWeight: 400,
      lineHeightPx: 48,
      box: { x: 20, y: 500, width: w - 40, height: 48 },
    },
    {
      text: 'Third band',
      role: 'body',
      color: '#111827',
      fontFamily: 'Inter',
      fontSizePx: 40,
      fontWeight: 400,
      lineHeightPx: 48,
      box: { x: 20, y: 900, width: w - 40, height: 48 },
    },
    // Text-free media, never boxed at any sampled width → no image leaf.
    {
      text: '',
      role: 'image',
      color: '#000000',
      fontFamily: 'Inter',
      fontSizePx: 0,
      fontWeight: 400,
      textless: true,
      objectFit: 'cover',
      intrinsicAspect: 1.5,
    },
    // A form control — a behavior-module seam, never a raw L1 leaf.
    {
      text: '',
      role: 'field',
      color: '#000000',
      fontFamily: 'Inter',
      fontSizePx: 16,
      fontWeight: 400,
      textless: true,
      a11yRole: 'textbox',
      accessibleName: 'Email',
      box: { x: 20, y: 1300, width: 240, height: 40 },
    },
    // A run present at every width but never boxed → no geometry → no leaf.
    {
      text: 'Ghost Run',
      role: 'body',
      color: '#111111',
      fontFamily: 'Inter',
      fontSizePx: 18,
      fontWeight: 400,
    },
  ])
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac737-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Write a fixture capture bundle carrying a multistate oracle; return its dir. */
function bundleWith(multistate: MultiStateCapture): string {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(dir, { recursive: true })
  writeMultiState(dir, multistate)
  return dir
}

/** Invoke the `1c` CLI, capturing stdout, stderr and the resulting exit code. */
async function runCli(argv: string[]): Promise<{ code: number; out: string; err: string }> {
  const out: string[] = []
  const err: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void out.push(a.join(' ')))
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void err.push(a.join(' ')))
  const prev = process.exitCode
  process.exitCode = 0
  try {
    await run(argv)
    const code = typeof process.exitCode === 'number' ? process.exitCode : 0
    return { code, out: out.join('\n'), err: err.join('\n') }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
    process.exitCode = prev
  }
}

describe('story-24098299 — gate fold-residual channel', () => {
  it('test_UAT_AC737_gate_reports_fold_residuals_as_their_own_channel', async () => {
    const ref = bundleWith(gapCapture())
    const report = cmdL1Gate({ cwd, ref })

    // The gate returns the three probe reports AND the promoted regions AND a
    // distinct fold-residual list.
    expect(report.sampleFidelity).toBeDefined()
    expect(report.offSample).toBeDefined()
    expect(report.contentRobustness).toBeDefined()
    expect(Array.isArray(report.promoted)).toBe(true)
    expect(Array.isArray(report.foldResiduals)).toBe(true)

    // Each folder-power gap is actionable: a kind, a reason, the captured axes it
    // carried, and the widths it appeared at — never an anonymous count.
    // Since REQ-96 a captured control is no longer a folder-power gap: it binds
    // to its behavior module through a `control` seam, so what remains here are
    // the two genuine gaps — media the fold never boxed, and a run with no
    // geometry to place it at.
    expect(report.foldResiduals.map((r) => r.kind).sort()).toEqual(['image', 'text'])
    for (const r of report.foldResiduals) {
      expect(r.reason.length, JSON.stringify(r)).toBeGreaterThan(0)
      expect(Array.isArray(r.capturedAxes)).toBe(true)
      expect(r.widths).toEqual(LADDER)
    }
    expect(report.foldResiduals.find((r) => r.kind === 'image')!.capturedAxes).toEqual(
      expect.arrayContaining(['objectFit']),
    )
    // …and the control the fixture carries is absent from the channel entirely,
    // rather than being reported as a gap the folder could not close.
    expect(report.foldResiduals.some((r) => r.kind === 'field')).toBe(false)
    expect(report.foldResiduals.find((r) => r.kind === 'text')!.reason).toMatch(/geometry/i)

    // Those same elements never appear as a fidelity residual or an unmatched
    // entry — the folder-power gap is not laundered into the mispairing bucket.
    expect(report.sampleFidelity.residuals).toEqual([])
    expect(report.sampleFidelity.unmatched).toEqual([])
    // The two channels are different arrays of different shapes.
    expect(report.foldResiduals).not.toBe(report.sampleFidelity.residuals)

    // Fold residuals do not by themselves fail the gate: the verdict is the
    // conjunction of the three probes, all of which pass on this roomy page.
    expect(report.sampleFidelity.pass).toBe(true)
    expect(report.offSample.pass).toBe(true)
    expect(report.contentRobustness.pass).toBe(true)
    expect(report.pass).toBe(true)

    // ── The human-readable CLI output ─────────────────────────────────────────
    const { code, out } = await runCli(['l1-gate', '--ref', ref])
    expect(code).toBe(0)
    const lines = out.split('\n')

    // The fold-residual count gets its own line, labelled as folder-power gaps.
    const foldLine = lines.find((l) => l.includes('fold residuals'))
    expect(foldLine, out).toBeDefined()
    expect(foldLine).toContain('fold residuals (folder-power gaps): 2')
    // …alongside, NOT merged into, the per-probe residual / unmatched counts.
    expect(foldLine).not.toMatch(/unmatched/)
    const fidelityLine = lines.find((l) => l.includes('sample-fidelity'))!
    expect(fidelityLine).toContain('0 residual(s), 0 unmatched')
    expect(fidelityLine).not.toMatch(/fold residuals/)

    // …and the residuals are itemised, each naming its kind and reason.
    expect(out).toMatch(/- image: .+/)
    expect(out).toMatch(/- text: .+/)
    expect(out).not.toMatch(/- field: .+/)

    // The JSON form carries the same three channels side by side.
    const json = await runCli(['l1-gate', '--ref', ref, '--json'])
    expect(json.code).toBe(0)
    const parsed = JSON.parse(json.out)
    expect(parsed.pass).toBe(true)
    expect(parsed.foldResiduals).toHaveLength(2)
    expect(parsed.sampleFidelity.residuals).toEqual([])
    expect(parsed.sampleFidelity.unmatched).toEqual([])
    expect(parsed.promoted).toEqual([])
  })
})
