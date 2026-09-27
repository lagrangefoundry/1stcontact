/**
 * BUG-153 item 3 — the content-robustness probe wrapped runs the document paints
 * `white-space: nowrap`, and that was 100% of a `structural-failure` verdict.
 *
 * `estimateTextHeight` is the whole growth model: characters ÷ characters-per-
 * line, rounded up, times the line height. It had no `nowrapFromPx` parameter —
 * `grep -n nowrap tools/generate/src/l1/probes.ts` returned NOTHING — so under
 * the probe's 2.5× content perturbation it gave extra lines to runs the renderer
 * pins to one, and then grew the oracle's measured height by that made-up ratio.
 *
 * The filed case, arithmetic closed. `'© 2025 Faelan Westhead. All rights
 * reserved.'` carries `nowrapFromPx: 375` and 44 characters at
 * `fontSizePx: 14`, `lineHeightPx: 20`, in a 327px column inside an 84px band:
 *
 *     chars   = ceil(44 × 2.5) = 110
 *     perLine = floor(327 / (14 × 0.5)) = 46
 *     lines   = ceil(110 / 46) = 3          → natural(2.5) = 60, natural(1) = 20
 *     grown   = 20 × (60 / 20) = 60,  run top 32 + 60 = 92,  92 − 84 = 8px
 *
 * — the 8px in `gate.json`'s two `escape` findings, and the `nextStep` they
 * produced: *"Make each escaping surface size itself from the content it
 * backs."* The band's height was never the problem; the run's inability to wrap
 * was, and the two have opposite fixes.
 *
 * The tell is WHICH widths fired: 375 and not 320. At 320 the run is below
 * `nowrapFromPx`, genuinely wraps, and the fold had already given that band the
 * room — so the only samples where the model and the renderer disagreed were the
 * only samples that reported a defect. That asymmetry is pinned below, because a
 * fix that simply stopped growing every run would pass a test that only looked
 * at 375.
 *
 * Measured against the real reproduction (`storage/tmp/repro-console/
 * repro-faelan-com/iteration-2/page.json`, untracked): the probe's finding count
 * falls from 26 to 14, and both 8px footer escapes and all four `Faelan overlaps
 * Worlds End Studio…` findings are gone. The synthetic fixture below reproduces
 * that shape from first principles so the evidence does not depend on a bundle
 * no checkout has.
 *
 * The second ask of the item is here too: a finding whose whole record was
 * `{kind, detail, paths}` could not be checked from the artifact at all.
 */
import { describe, expect, it } from 'vitest'
import { contentRobustnessProbe, evaluateLayout } from '../tools/generate/src/l1'
import { validateL1, type L1Document } from '../packages/site-schema/src/index'

/**
 * The filed shape: an 84px band whose only content is a 44-character footer line
 * at the top of it, pinned one line tall, in a column that fits it exactly once.
 *
 * `nowrapFromPx` is the single variable — everything else is held — so the two
 * legs below differ in nothing but whether the document says the run wraps.
 */
function footerDoc(nowrapFromPx: number | undefined): L1Document {
  const at = (width: number): { at: number; x: number; y: number; width: number } => ({
    at: width,
    x: 24,
    y: 32,
    width: width - 48,
  })
  return {
    widths: [320, 375],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'container',
          id: 'section-band-1',
          layout: 'stack',
          axes: { surfaceFill: '#0f172b' },
          geometry: {
            keyframes: [
              { at: 320, x: 0, y: 0, width: 320, height: 104 },
              { at: 375, x: 0, y: 0, width: 375, height: 84 },
            ],
            segments: ['interpolate'],
          },
          children: [
            {
              kind: 'text',
              text: '© 2025 Faelan Westhead. All rights reserved.',
              axes: {
                color: '#ffffff',
                fontFamily: 'sans-serif',
                fontSizePx: 14,
                lineHeightPx: 20,
                ...(nowrapFromPx === undefined ? {} : { nowrapFromPx }),
              },
              geometry: { keyframes: [at(320), at(375)], segments: ['interpolate'] },
            },
          ],
        },
      ],
    },
  } as L1Document
}

/** Every finding the probe raises, flattened with the sample that raised it. */
function findingsOf(doc: L1Document): string[] {
  return contentRobustnessProbe(doc, { heights: [768] }).byWidth.flatMap((w) =>
    w.findings.map((f) => `${w.width} ${f.kind}: ${f.detail}`),
  )
}

describe('BUG-153 item 3 — the growth model respects a run that cannot wrap', () => {
  it('test_UAT_FC_BUG-153_the_envelope_is_valid_l1_so_the_probe_is_reading_a_real_document', () => {
    // The fixture is not a hand-shaped object the probe happens to accept: it is
    // a document the L1 envelope validates, so `nowrapFromPx` is being read off
    // the same axis the renderer emits `white-space: nowrap` from.
    expect(validateL1(footerDoc(375)).ok).toBe(true)
    expect(validateL1(footerDoc(undefined)).ok).toBe(true)
  })

  it('test_UAT_FC_BUG-153_a_nowrap_footer_no_longer_escapes_the_band_it_sits_in', () => {
    // The filed finding. Before this, the 2.5× perturbation gave a 1-line run
    // 3 lines, pushed its bottom 8px past the band, and the gate told the
    // implementer to resize the band.
    expect(findingsOf(footerDoc(375)).filter((f) => f.includes('escape'))).toEqual([])
  })

  it('test_UAT_FC_BUG-153_the_same_run_that_really_wraps_still_reports_its_escape', () => {
    // The fix is a MEASUREMENT, not a suppression. Identical document, identical
    // copy, identical band — `nowrapFromPx` removed, so the run genuinely wraps
    // under growth and the probe still says so. Without this leg, "return one
    // line always" would pass the test above.
    const escapes = findingsOf(footerDoc(undefined)).filter((f) => f.includes('escape'))
    expect(escapes.length).toBeGreaterThan(0)
    expect(escapes.join('\n')).toMatch(/no longer covered by its backing surface section-band-1/)
  })

  it('test_UAT_FC_BUG-153_the_pin_starts_at_its_own_width_and_not_below_it', () => {
    // 375 and not 320 — the asymmetry that located the defect, and the reason the
    // rule is `width >= nowrapFromPx` rather than "this run never wraps". The
    // renderer emits the pin inside `@media (min-width: nowrapFromPx)`, so below
    // that width the run DOES wrap and the model has to wrap it too. One
    // document, one run, two widths: the growth is off above the pin and on
    // below it.
    const doc = footerDoc(375)
    const height = (width: number, scale: number): number =>
      evaluateLayout(doc, width, { contentScale: scale, viewportHeight: 768 }).leaves.find((l) => l.kind === 'text')!
        .box.height

    expect(height(375, 2.5)).toBe(height(375, 1))
    expect(height(320, 2.5)).toBeGreaterThan(height(320, 1))
  })

  it('test_UAT_FC_BUG-153_growth_still_reaches_a_run_the_document_lets_wrap', () => {
    // The model is not switched off: an unpinned run's estimated height still
    // rises with the content scale, which is the behaviour every other
    // content-robustness finding depends on.
    const doc = footerDoc(undefined)
    const height = (scale: number): number =>
      evaluateLayout(doc, 375, { contentScale: scale, viewportHeight: 768 }).leaves.find((l) => l.kind === 'text')!.box
        .height

    expect(height(2.5)).toBeGreaterThan(height(1))
    // …and a pinned run's does not, at any scale.
    const pinned = footerDoc(375)
    const pinnedHeight = (scale: number): number =>
      evaluateLayout(pinned, 375, { contentScale: scale, viewportHeight: 768 }).leaves.find((l) => l.kind === 'text')!
        .box.height
    expect(pinnedHeight(2.5)).toBe(pinnedHeight(1))
  })
})

describe('BUG-153 item 3 — a finding carries the geometry it asserts', () => {
  it('test_UAT_FC_BUG-153_an_escape_finding_can_be_checked_without_rerunning_the_evaluator', () => {
    // `l1-gate --json` said `'…' is no longer covered by its backing surface` at
    // twelve samples and carried no number to put against it: the record was
    // `{kind, detail, paths}`, so the only way to find out whether the run really
    // had left the surface — and by how much — was to re-run the evaluator.
    // `regions.json` has carried `bbox` and both sides' nodes since it existed.
    const report = contentRobustnessProbe(footerDoc(undefined), { heights: [768] })
    const found = report.byWidth.flatMap((w) => w.findings).find((f) => f.kind === 'escape')

    expect(found).toBeDefined()
    // One box per path, in the same order, plus the width that resolved them —
    // so the overhang the `detail` claims is arithmetic a reader can close.
    expect(found!.boxes).toHaveLength(found!.paths.length)
    expect(found!.width).toBeGreaterThan(0)
    const [run, surface] = found!.boxes!
    expect(run.y + run.height).toBeGreaterThan(surface.y + surface.height)
  })

  it('test_UAT_FC_BUG-153_an_overlap_finding_carries_both_boxes_that_intersect', () => {
    // The other kind the item names. Two runs pinned onto each other at the same
    // width: the finding says they overlap, and now says with what geometry.
    const doc = {
      widths: [375],
      root: {
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'FAELAN',
            axes: { color: '#fff', fontFamily: 'sans-serif', fontSizePx: 64, lineHeightPx: 96 },
            geometry: { keyframes: [{ at: 375, x: 24, y: 0, width: 300 }], segments: [] },
          },
          {
            kind: 'text',
            text: 'Artist • Musician • Creator',
            axes: { color: '#fff', fontFamily: 'sans-serif', fontSizePx: 24, lineHeightPx: 36 },
            geometry: { keyframes: [{ at: 375, x: 24, y: 40, width: 300 }], segments: [] },
          },
        ],
      },
    } as L1Document
    expect(validateL1(doc).ok).toBe(true)

    const found = evaluateLayout(doc, 375, { contentScale: 1, viewportHeight: 768 }).findings.find(
      (f) => f.kind === 'overlap',
    )

    expect(found).toBeDefined()
    expect(found!.width).toBe(375)
    const [a, b] = found!.boxes!
    // The intersection the detail asserts, closed from the record alone.
    expect(Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)).toBeGreaterThan(0)
  })
})
