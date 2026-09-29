/**
 * UATs for BUG-169 — the reference's page background was inferred from the
 * tallest band, so the one value a bundle records seven times was never compared.
 *
 * The reproduction of joyfulculinarycreations.com painted the wrong canvas, and
 * `values-diff` reported ZERO deltas for it — not because the axis was tolerant,
 * but because the comparator derived the REFERENCE's canvas by the same broken
 * rule the reproduction used, and then compared a wrong value against itself.
 * `pageBaseOf` took the largest-area band carrying a background: `sections[3]`,
 * 1280×1332 of `#7a7a7a`, over the `#ffffff` the bundle's own `multistate.json`
 * recorded at all seven projections. Both sides read `#7a7a7a`. The axis was also
 * `role: 'carried'`, so even agreeing sides were never compared.
 *
 * What it cost on that page: three strips where no band paints and the canvas
 * shows through, each reading a mean difference of exactly 133/255 at full width
 * — the highest mean anywhere on the page, 22% of its absolute pixel-difference
 * mass, 28% of its ranked region score — and nothing in `values-diff` could
 * follow the two regions that named it.
 *
 * The UATs below, in the order the ticket asks for them:
 *
 *   1. the reference reads the RECORDED canvas, not the tallest band;
 *   2. a wrong canvas is one delta rather than silence (the axis is COMPARED);
 *   3. a right canvas is still clean, so the axis is a measurement not an alarm;
 *   4. a bundle with no projection ladder still infers, rather than declining;
 *   5. the canvas is resolved at the capture's OWN width, not ladder-wide;
 *   6. the axis is declared compared with readers on both sides, so the gate
 *      cannot count it unmeasured;
 *   7. a canvas NO side recorded is unmeasured, not clean — never a fabricated
 *      default compared against a real value.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  MANIFEST_AXES,
  UNMEASURED_AXES,
  cmdValuesDiff,
  readerOf,
  type Capture,
  type MultiStateCapture,
  type Section,
  type ValueManifest,
  type ValuesDiffReport,
} from '../tools/generate/src/cli'

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'bug169-'))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── the reference: the shape of the page that filed the ticket ───────────────
//
// A tall grey band that is the largest thing on the page, a taller-than-viewport
// black hero, a short white band, and two `kind: 'none'` strips where nothing is
// painted and the canvas is what shows. The canvas is WHITE, and the widest band
// is not it — which is the whole defect, reduced to five bands.

function band(y: number, height: number, background: Section['background']): Section {
  const box = { x: 0, y, width: 1280, height }
  return {
    box,
    screenshot: box,
    background,
    layout: {
      textOverImage: false,
      contentAlign: 'center',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio: 0.5,
    },
    content: [],
    items: [],
    fields: [],
  }
}

/** The bands, in document order. `sections[1]` is the widest painted one. */
const BANDS: Section[] = [
  band(0, 525, { kind: 'color', color: '#ffffff' }),
  band(525, 1332, { kind: 'color', color: '#7a7a7a' }),
  band(1857, 15, { kind: 'none' }),
  band(1872, 800, { kind: 'color', color: '#000000' }),
  band(2672, 15, { kind: 'none' }),
]

function capture(over: Partial<Capture> = {}): Capture {
  return {
    url: 'https://canvas.example/',
    host: 'canvas.example',
    path: '/',
    capturedAt: '2026-09-29T19:46:13.536Z',
    viewport: { width: 1280, height: 2687 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: BANDS,
    assets: [],
    ...over,
  }
}

/**
 * The bundle's projection ladder. Each cell's manifest is what the extractor
 * wrote from the REFERENCE's own `<body>` at capture time — the value the bundle
 * records directly, and the one `capture.json` has no key for.
 */
function ladder(byWidth: Record<number, string>): MultiStateCapture {
  return {
    url: 'https://canvas.example/',
    projections: Object.entries(byWidth).map(([width, bodyBackground]) => ({
      engine: 'chromium' as const,
      viewport: { width: Number(width), height: 800 },
      state: 'rest' as const,
      manifest: {
        source: `https://canvas.example/@chromium:${width}:rest`,
        elements: [],
        sections: [],
        viewport: { width: Number(width), height: 800 },
        bodyBackground,
      } satisfies ValueManifest,
    })),
  }
}

/** Write a bundle on disk: `capture.json`, and `multistate.json` when given one. */
function writeBundle(dir: string, opts: { capture?: Capture; ladder?: MultiStateCapture } = {}): string {
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(opts.capture ?? capture(), null, 2))
  if (opts.ladder) writeFileSync(path.join(dir, 'multistate.json'), JSON.stringify(opts.ladder, null, 2))
  return dir
}

// ── the reproduction: an offline manifest, the documented `--actual` seam ─────

/** Our reproduction's manifest. `bodyBackground` is read off `<body>` — the one
 *  side that was always right, and the side the comparator agreed with wrongly. */
function reproManifest(bodyBackground?: string): ValueManifest {
  return {
    source: 'draft:canvas-repro',
    elements: [],
    sections: [],
    viewport: { width: 1280, height: 2687 },
    ...(bodyBackground === undefined ? {} : { bodyBackground }),
  }
}

/** Run the real `values-diff` command offline, and hand back what it computed
 *  for the REFERENCE side beside the report it produced. */
async function diff(opts: {
  capture?: Capture
  ladder?: MultiStateCapture
  reproCanvas?: string
}): Promise<{ report: ValuesDiffReport; expected: ValueManifest }> {
  const cwd = freshDir()
  const ref = writeBundle(path.join(cwd, 'bundle'), { capture: opts.capture, ladder: opts.ladder })
  const actualPath = path.join(cwd, 'actual.json')
  writeFileSync(actualPath, JSON.stringify(reproManifest(opts.reproCanvas), null, 2))
  const expectedOut = path.join(cwd, 'expected.json')
  const report = await cmdValuesDiff({
    cwd,
    refBundleDir: ref,
    actualManifestPath: actualPath,
    expectedOut,
  })
  return { report, expected: JSON.parse(readFileSync(expectedOut, 'utf8')) as ValueManifest }
}

const canvasDeltas = (report: ValuesDiffReport) => report.deltas.filter((d) => d.property === 'bodyBackground')

describe('BUG-169 — the page canvas is read off the bundle and compared', () => {
  /**
   * UAT 1 — the headline. The bundle records `#ffffff` in its ladder and its
   * largest band paints `#7a7a7a`; the reference side must read the former. Before
   * this, the reference manifest read `#7a7a7a` — the value the reproduction was
   * wrongly painting — while the bundle it was derived from said white.
   */
  it('test_UAT_FC_BUG-169_reference_reads_the_recorded_canvas_not_the_tallest_band', async () => {
    const { expected } = await diff({ ladder: ladder({ 1280: '#ffffff' }), reproCanvas: '#7a7a7a' })

    expect(expected.bodyBackground, 'the canvas the bundle recorded').toBe('#ffffff')
    // Named explicitly: the widest band's fill is present in the bundle and is
    // NOT the answer, so a future regression to `pageBaseOf` fails here.
    expect(expected.bodyBackground).not.toBe('#7a7a7a')
  })

  /**
   * UAT 2 — the axis is COMPARED. A reproduction painting the widest band's grey
   * as its canvas produces exactly one delta, expected→actual, ranked as the
   * colour defect it is and marked Type A (copy the reference's value). This is
   * the delta that did not exist: the page's largest single disagreement, silent.
   */
  it('test_UAT_FC_BUG-169_a_wrong_canvas_is_one_delta_not_silence', async () => {
    const { report } = await diff({ ladder: ladder({ 1280: '#ffffff' }), reproCanvas: '#7a7a7a' })

    const found = canvasDeltas(report)
    expect(found, 'one delta per document, not one per band').toHaveLength(1)
    expect(found[0].expected).toBe('#ffffff')
    expect(found[0].actual).toBe('#7a7a7a')
    expect(found[0].kind, 'a wrong canvas is a colour defect').toBe('color')
    expect(found[0].valueType, 'authored: copy the reference value').toBe('A')
  })

  /**
   * UAT 3 — and it is a measurement, not an alarm: a reproduction that paints the
   * recorded canvas is clean on the axis. Without this, UAT 2 would pass for a row
   * that fires unconditionally.
   */
  it('test_UAT_FC_BUG-169_a_reproduced_canvas_that_matches_is_clean', async () => {
    const { report, expected } = await diff({ ladder: ladder({ 1280: '#ffffff' }), reproCanvas: '#ffffff' })

    expect(expected.bodyBackground).toBe('#ffffff')
    expect(canvasDeltas(report)).toHaveLength(0)
  })

  /**
   * UAT 4 — a bundle captured before the projection ladder existed has nothing
   * better than the widest band, and inferring beats declining: the fallback is
   * still there, and it is only a fallback. This is what keeps the fix free of a
   * re-capture requirement for old bundles.
   */
  it('test_UAT_FC_BUG-169_a_bundle_with_no_ladder_falls_back_to_the_widest_band', async () => {
    const { report, expected } = await diff({ reproCanvas: '#7a7a7a' })

    expect(expected.bodyBackground, 'inferred from the widest band').toBe('#7a7a7a')
    // Inferred on the reference and read truly on the reproduction: they agree
    // here only because the reproduction happens to paint the inference.
    expect(canvasDeltas(report)).toHaveLength(0)
  })

  /**
   * UAT 5 — resolved at the capture's OWN width. The canvas is recorded per
   * projection and a media-query / colour-scheme canvas legitimately differs
   * across the ladder, so the desktop capture must be graded against the desktop
   * cell — not against whichever cell the ladder happens to list first.
   */
  it('test_UAT_FC_BUG-169_the_canvas_is_resolved_at_the_captures_own_width', async () => {
    const { report, expected } = await diff({
      // 375 leads the ladder, as it does in a real bundle; the capture is 1280.
      ladder: ladder({ 375: '#ffffff', 1280: '#0b0b0d' }),
      reproCanvas: '#0b0b0d',
    })

    expect(expected.bodyBackground, 'the cell at the capture width').toBe('#0b0b0d')
    expect(canvasDeltas(report)).toHaveLength(0)
  })

  /**
   * UAT 6 — the declaration itself. `bodyBackground` is a COMPARED axis with a
   * reader on both sides, so it is absent from the unmeasured set: the gate can
   * neither skip it silently nor report it as a gap. The note is checked for the
   * claim that made the defect invisible — "the only place a bundle records it" —
   * because that sentence is what stopped anyone looking at `multistate.json`.
   */
  it('test_UAT_FC_BUG-169_the_canvas_axis_is_compared_with_readers_on_both_sides', () => {
    const row = MANIFEST_AXES.find((r) => r.axis === 'bodyBackground')
    expect(row, 'the canvas has a row').toBeDefined()
    expect(row!.role).toBe('compared')
    expect(readerOf(row!.reference), 'the bundle side reads it').not.toBeNull()
    expect(readerOf(row!.reproduction), 'the reproduction side reads it').not.toBeNull()
    expect(UNMEASURED_AXES.map((a) => a.axis)).not.toContain('bodyBackground')
    expect(row!.note).toContain('multistate')
  })

  /**
   * UAT 7 — unmeasured is not clean, and never a fabricated default. A bundle with
   * no ladder AND no band carrying a background has recorded no answer: the axis
   * is absent from the reference manifest and fires no delta, rather than
   * asserting white and reporting a delta against every such reference.
   */
  it('test_UAT_FC_BUG-169_a_canvas_no_side_recorded_is_unmeasured_not_clean', async () => {
    const bare = capture({ sections: [band(0, 800, { kind: 'none' })] })
    const { report, expected } = await diff({ capture: bare, reproCanvas: '#ffffff' })

    expect(expected.bodyBackground, 'nothing recorded it, so nothing asserts it').toBeUndefined()
    expect(canvasDeltas(report)).toHaveLength(0)
  })
})
