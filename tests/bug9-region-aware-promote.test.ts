/**
 * BUG-9 — region-aware structure recovery (`promoteToFlow`).
 *
 * The predecessor promoted a failing node into ONE flat flow pile: it kept a
 * single median gap for the whole page and, promoting only some pinned siblings,
 * left the rest pinned for the grown pile to overrun — so on a flat, densely
 * packed page (gigabytealchemy) recovery reported `promoted == ['0']` yet
 * content-robustness still failed at every width.
 *
 * These UATs pin the fixed behaviour on a self-contained fixture that mirrors the
 * real failure shape: a flat root whose pinned text runs form several tightly
 * packed regions (a grid and a footer) separated by large gaps. Recovery must:
 *   - discover the distinct regions and promote each as its own flow sub-stack
 *     (`promoted` lists nested regions, not a single `['0']`);
 *   - leave nothing pinned behind, so off-sample + content-robustness both pass;
 *   - never regrade sample-fidelity (measured on the untouched absolute base);
 *   - leave a page that already survives perturbation fully absolute.
 */
import { describe, expect, it } from 'vitest'
import {
  contentRobustnessProbe,
  foldToL1,
  offSampleProbe,
  promoteToFlow,
  sampleFidelityProbe,
} from '../tools/generate/src'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import { validateL1 } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

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
 * A flat page with three tightly packed regions — a hero, a "grid" of three
 * cards, and a footer — each region's runs ~60px apart (so they overlap under a
 * 2.5× perturbation) but the regions themselves ~360px apart (so they stay
 * distinct even after growth). This is the shape the single-pile promote could
 * not recover: one flat stack cannot keep every region's interior sane at once.
 */
function multiRegionPage(ys: number[][]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1600 },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      viewport: { width, height: 1600 },
      sections: [],
      elements: ys.flatMap((region, r) =>
        // A ~10-char run: one line at rest, wraps to two under a 2.5× grow — the
        // same trigger `oracle()` uses, so a tight region overruns only when perturbed.
        region.map((y, i) => text(`col ${r}${i} row`, { x: 20, y, width: width - 40, height: 48 })),
      ),
    },
  }))
  return { url: 'http://multiregion.test/', notes: [], projections }
}

// Hero (y≈100), grid (y≈600), footer (y≈1100). Interior gap 60; region gap ≈360.
const GRID_AND_FOOTER = multiRegionPage([
  [100, 160, 220],
  [600, 660, 720],
  [1100, 1160],
])

describe('BUG-9 — region-aware structure recovery', () => {
  it('test_UAT_FC_BUG-9_recovery_promotes_nested_regions_not_single_pile', () => {
    const cap = GRID_AND_FOOTER
    const base = foldToL1(cap)

    // Precondition: the purely-pinned base fails content-robustness (each region's
    // interior overruns under growth) — the bug's trigger.
    expect(contentRobustnessProbe(base, { scale: 2.5 }).pass).toBe(false)

    const { doc: recovered, promoted } = promoteToFlow(base, { scale: 2.5 })

    // Region-aware, NOT a single flat pile: three distinct regions are promoted,
    // each reported by its own nested path — never a lone `['0']`.
    expect(promoted).not.toEqual(['0'])
    expect(promoted.length).toBe(3)
    expect(new Set(promoted).size).toBe(3)
    for (const p of promoted) expect(p).toMatch(/^0\.\d+$/)

    // The recovered overlay holds the envelope everywhere the base failed.
    expect(contentRobustnessProbe(recovered, { scale: 2.5 }).pass).toBe(true)
    expect(offSampleProbe(recovered).pass).toBe(true)

    // Recovery yields a valid L1 document.
    expect(validateL1(recovered).ok).toBe(true)
  })

  it('test_UAT_FC_BUG-9_recovery_never_regrades_base_fidelity', () => {
    const cap = GRID_AND_FOOTER
    const base = foldToL1(cap)

    // Fidelity is a property of the absolute base and is clean before recovery.
    const before = sampleFidelityProbe(base, cap, { tolerancePx: 2 })
    expect(before.pass).toBe(true)

    // Recovery returns a NEW document; the base it measured fidelity on is
    // untouched, so re-measuring against the same base is identical.
    promoteToFlow(base, { scale: 2.5 })
    const after = sampleFidelityProbe(base, cap, { tolerancePx: 2 })
    expect(after).toEqual(before)
  })

  it('test_UAT_FC_BUG-9_single_region_reports_node_path', () => {
    // One tightly packed region covering the whole page → the node IS the region;
    // recovery flows its children directly and reports the bare node path.
    const base = foldToL1(multiRegionPage([[100, 170, 240]]))
    expect(contentRobustnessProbe(base, { scale: 2.5 }).pass).toBe(false)

    const { doc: recovered, promoted } = promoteToFlow(base, { scale: 2.5 })
    expect(promoted).toEqual(['0'])
    expect(contentRobustnessProbe(recovered, { scale: 2.5 }).pass).toBe(true)
  })

  it('test_UAT_FC_BUG-9_roomy_page_left_absolute', () => {
    // Three runs 300px apart survive a 2.5× perturbation → no colliding group →
    // demand-driven recovery promotes nothing and the base stays absolute.
    const roomy = foldToL1(multiRegionPage([[100, 400, 700]]))
    expect(contentRobustnessProbe(roomy, { scale: 2.5 }).pass).toBe(true)
    expect(promoteToFlow(roomy, { scale: 2.5 }).promoted).toEqual([])
  })
})
