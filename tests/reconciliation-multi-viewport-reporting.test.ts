import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  clusterDefects,
  cmdValuesDiffMultiViewport,
  collapseMultiViewport,
  diffManifests,
  diffMultiState,
  formatClusterReport,
  formatCollapsedReport,
  formatMultiViewportReport,
  type CollapsedDefect,
  type MultiStateCapture,
  type StateDiff,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-16f2793c — the multi-viewport **reporting stack**
 * layered over the ladder: AC-1614 (`--collapse`), AC-1615 (`--clusters`) and
 * AC-1616 (the two rules that keep the roll-up honest).
 *
 * All three drive the real `collapseMultiViewport` / `clusterDefects` /
 * `formatCollapsedReport` / `formatClusterReport` — the exact functions
 * `values-diff --multi-viewport` calls at `index.ts:1040-1045`. Pure and
 * browser-free.
 *
 * Relationship to the free-coded evidence: `req63-values-diff-coverage.test.ts`
 * carries `test_UAT_FC_REQ-64_collapse_dedups_ladder_to_one_row_per_defect`,
 * `…_collapse_marks_fluid_value_structural`,
 * `…_position_is_derived_and_excluded_from_the_headline_count` and
 * `test_UAT_FC_REQ-76_defects_roll_up_into_causes_with_dispositions`. Those remain
 * REQ-64/REQ-76's own evidence and are neither renamed nor replaced. These tests
 * add the clauses each AC's Verification asks for that no sibling makes:
 *   • AC-1614 — that the UN-collapsed per-cell view is the default and reports one
 *     row per rung; that a full six-rung ladder collapses to a single row naming
 *     every rung; that an all-width and a narrow-only defect are distinguished
 *     within ONE run; and that the headline counts defects, not cells.
 *   • AC-1615 — the shape/border → "control styling" merge and its `fix`
 *     disposition; representatives; the count-first, worst-tier-second ranking;
 *     `@all` vs a narrow width scope; and the summary line's totals agreeing.
 *   • AC-1616 — the untaxonomised-property fallback (own name, `review`, still
 *     counted), which nothing anywhere covers.
 */

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const NARROW = [320, 375]

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [] }
}

/**
 * One ladder rung. The `Run` colour is wrong at EVERY width (one defect seen six
 * times); the `Wordmark` size is a fluid reference against our fixed 72, so it only
 * deltas at the narrow rungs.
 */
function rung(width: number): StateDiff {
  const refWordmark = NARROW.includes(width) ? 30 : 72
  return {
    engine: 'chromium',
    viewportWidth: width,
    state: 'rest',
    missing: false,
    report: diffManifests(
      mani('ref', [el('Run', { color: '#111111' }), el('Wordmark', { fontSizePx: refWordmark })]),
      mani('a', [el('Run', { color: '#222222' }), el('Wordmark', { fontSizePx: 72 })]),
    ),
  }
}

const ladderCells = (): StateDiff[] => LADDER.map(rung)

/** A collapsed-defect fixture, for the roll-up rules that are about the taxonomy. */
const cd = (over: Partial<CollapsedDefect>): CollapsedDefect => ({
  text: 'x',
  property: 'gap',
  valueType: 'B',
  repairClass: 'emergent',
  widths: [1280],
  expected: 'a',
  actual: 'b',
  tier: 'HIGH',
  derived: false,
  ...over,
})

// ── AC-1613 — the ladder-wide mode itself: every rung, worst cell first ──────

const tmpDirs: string[] = []
function tmp(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A `chromium:rest` projection carrying one wordmark of the given rendered width. */
function projection(width: number, wordmarkWidth: number): StateProjection {
  return {
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: mani(`@${width}`, [el('Wordmark', { box: box(0, 0, wordmarkWidth, 40) })]),
  }
}

const matrix = (projections: StateProjection[]): MultiStateCapture => ({ url: 'ref', projections, notes: [] })

/** The reference: a fluid wordmark tracking 20% of each rung's width. */
const referenceLadder = (): MultiStateCapture => matrix(LADDER.map((w) => projection(w, w * 0.2)))

/**
 * The reproduction: correct at the wide rungs, slightly off at 320, badly reflowed
 * at 375, and never projected at 1440.
 */
const reproLadder = (): MultiStateCapture =>
  matrix([
    projection(320, 70), // 64 expected — a small miss
    projection(375, 256), // 75 expected — the big reflow
    projection(768, 768 * 0.2), // clean
    projection(1024, 1024 * 0.2), // clean
    projection(1280, 1280 * 0.2), // clean
    // 1440 absent — the repro never projected a rung the reference has.
  ])

describe('story-16f2793c — AC-1613 multi-viewport projects every rung, worst first', () => {
  it('test_UAT_AC1613_one_cell_per_persisted_rung_none_skipped', () => {
    const cells = diffMultiState(referenceLadder(), reproLadder())

    // One cell per rung the REFERENCE persisted — the ladder is the reference's,
    // not a fixed default, so every rung is judged and none is skipped.
    expect(cells).toHaveLength(LADDER.length)
    expect([...cells.map((c) => c.viewportWidth)].sort((a, b) => a - b)).toEqual(LADDER)
    // Cell-for-cell: each pairs the same engine and state, never bleeding a
    // desktop or resting frame across a cell where it would mask the difference.
    expect(cells.every((c) => c.engine === 'chromium' && c.state === 'rest')).toBe(true)
  })

  it('test_UAT_AC1613_worst_cell_leads_without_the_caller_naming_a_width', () => {
    const cells = diffMultiState(referenceLadder(), reproLadder())
    const at = (w: number): number => cells.findIndex((c) => c.viewportWidth === w)

    // A rung the reproduction never projected is a coverage gap and leads
    // everything — it is not counted clean.
    expect(cells[0].missing).toBe(true)
    expect(cells[0].viewportWidth).toBe(1440)
    expect(cells[0].report).toBeNull()

    // Then the failing cells by descending severity. Nothing in the call named a
    // width: the 375 reflow surfaces because it is worst, which is the whole
    // point of the ladder-wide mode over `--size`.
    expect(at(375)).toBeLessThan(at(320))
    // …and both failing cells precede every clean one.
    const cleanFirst = Math.min(at(768), at(1024), at(1280))
    expect(at(375)).toBeLessThan(cleanFirst)
    expect(at(320)).toBeLessThan(cleanFirst)
    for (const w of [768, 1024, 1280]) {
      expect(cells[at(w)].report!.deltas, `@${w} clean`).toEqual([])
    }
  })

  it('test_UAT_AC1613_clean_cells_collapse_to_one_line_and_a_missing_cell_is_loud', () => {
    const out = formatMultiViewportReport(diffMultiState(referenceLadder(), reproLadder()))

    // The missing rung is reported loudly rather than padded over…
    expect(out).toMatch(/@1440 chromium:rest {2}MISSING/)
    // …each clean cell collapses to a single line rather than padding the output…
    for (const w of [768, 1024, 1280]) expect(out).toMatch(new RegExp(`@${w} chromium:rest {2}clean`))
    // …and the header counts the cells and the coverage gap.
    expect(out).toContain('6 cell(s) across the viewport ladder')
    expect(out).toMatch(/1 missing cell\(s\)/)
    // Order survives into the rendered report: missing, then worst, then clean.
    expect(out.indexOf('@1440')).toBeLessThan(out.indexOf('@375'))
    expect(out.indexOf('@375')).toBeLessThan(out.indexOf('@1280'))
  })

  it('test_UAT_AC1613_a_bundle_with_no_ladder_fails_loud_and_emits_no_report', async () => {
    // Like `--size` (AC-641), the mode fails loud rather than degrading to the
    // desktop-only comparison the caller did not ask for.
    const empty = tmp('ac1613-noladder-')
    const out = path.join(tmp('ac1613-out-'), 'cells.json')

    await expect(
      cmdValuesDiffMultiViewport({ slug: 'acme', refBundleDir: empty, out }),
    ).rejects.toThrow(/multistate\.json[\s\S]*re-capture/i)

    // No report was emitted — the clause the FC sibling does not assert.
    expect(existsSync(out)).toBe(false)
  })
})

// ── AC-1614 — --collapse is per defect; the per-cell view stays the default ───

describe('story-16f2793c — AC-1614 --collapse deduplicates cells to defects', () => {
  it('test_UAT_AC1614_uncollapsed_default_reports_one_row_per_rung', () => {
    const cells = ladderCells()

    // The DEFAULT (no flag) payload is the per-cell cells array, and its rows are
    // per rung: the colour defect appears once at each of the six widths, and the
    // narrow-only wordmark once at each of the two narrow ones. Eight rows for two
    // defects — the ×N-viewport multiplier the collapse layer exists to remove.
    const perCell = cells.flatMap((c) => (c.report?.deltas ?? []).map((d) => ({ width: c.viewportWidth, p: d.property })))
    expect(perCell.filter((r) => r.p === 'color').map((r) => r.width)).toEqual(LADDER)
    expect(perCell.filter((r) => r.p === 'fontSizePx').map((r) => r.width)).toEqual(NARROW)
    expect(perCell).toHaveLength(8)

    // Width attribution survives in the default view — which rungs a defect fires
    // at is itself diagnostic, which is why collapsing is opt-in.
    expect(new Set(perCell.map((r) => r.width))).toEqual(new Set(LADDER))
  })

  it('test_UAT_AC1614_collapse_reports_one_row_per_defect_naming_every_rung', () => {
    const defects = collapseMultiViewport(ladderCells())

    // Eight cell rows became two defect rows.
    expect(defects).toHaveLength(2)

    // The all-width defect is ONE row whose width list names every rung.
    const colour = defects.filter((d) => d.property === 'color')
    expect(colour).toHaveLength(1)
    expect(colour[0].widths).toEqual(LADDER)
    // …carrying the reference value to transcribe.
    expect(colour[0].expected).toBe('#111111')
  })

  it('test_UAT_AC1614_a_narrow_only_defect_is_distinguished_from_an_all_width_one', () => {
    // Both defects in ONE run: the point is that collapsing does not flatten them
    // into indistinguishable rows. A defect at the narrow rungs only is a
    // breakpoint problem; an all-width one is a value problem.
    const defects = collapseMultiViewport(ladderCells())

    const wordmark = defects.find((d) => d.property === 'fontSizePx')!
    expect(wordmark.widths).toEqual(NARROW)
    // A fluid reference against our fixed value is a responsive-ladder repair…
    expect(wordmark.repairClass).toBe('structural')
    // …while the all-width one is a flat value to copy.
    expect(defects.find((d) => d.property === 'color')!.repairClass).toBe('flat')
  })

  it('test_UAT_AC1614_collapsed_headline_counts_defects_not_cells', () => {
    const report = formatCollapsedReport(ladderCells())

    // The headline number is a count of things to fix (2), stated against the raw
    // cell count (8) it was reduced from, across the six widths.
    expect(report).toContain('2 unique defect(s)')
    expect(report).toContain('from 8 raw deltas across 6 width(s)')
    // Not the cell count — the failure this criterion names.
    expect(report).not.toContain('8 unique defect(s)')
  })
})

// ── AC-1615 — --clusters rolls defects into ranked, dispositioned causes ─────

describe('story-16f2793c — AC-1615 --clusters ranks causes with dispositions', () => {
  it('test_UAT_AC1615_several_properties_roll_into_one_cause_with_its_disposition', () => {
    const causes = clusterDefects([
      cd({ property: 'shape', text: 'Submit' }),
      cd({ property: 'border', text: 'Email field' }),
      cd({ property: 'arrangement', text: 'Cards', tier: 'CRITICAL' }),
      cd({ property: 'containment', text: 'Footer' }),
      cd({ property: 'fontLoad', text: 'Wordmark' }),
    ])
    const byCause = Object.fromEntries(causes.map((c) => [c.cause, c]))

    // shape + border are ONE cause — the pair no FC sibling exercises — and it is
    // a real, closeable gap.
    expect(byCause['control styling'].count).toBe(2)
    expect(byCause['control styling'].disposition).toBe('fix')
    // arrangement + containment likewise collapse, at the worst tier of members.
    expect(byCause['layout structure'].count).toBe(2)
    expect(byCause['layout structure'].tier).toBe('CRITICAL')
    expect(byCause['layout structure'].disposition).toBe('review')
    // A reference webfont FOUT is a capture artifact to sign off, not a gap to fix.
    expect(byCause['capture artifact (webfont FOUT)'].disposition).toBe('accept')

    // Every cause carries representative elements, so a cause is actionable
    // without drilling into its rows.
    expect(byCause['control styling'].examples).toEqual(['Submit', 'Email field'])
    expect(byCause['layout structure'].examples).toEqual(['Cards', 'Footer'])
  })

  it('test_UAT_AC1615_causes_are_ranked_count_first_then_worst_tier', () => {
    const causes = clusterDefects([
      // 3 × vertical spacing, all LOW — the largest count.
      cd({ property: 'gap', text: 'g1', tier: 'LOW' }),
      cd({ property: 'gap', text: 'g2', tier: 'LOW' }),
      cd({ property: 'gap', text: 'g3', tier: 'LOW' }),
      // 2 × layout structure, reaching CRITICAL.
      cd({ property: 'arrangement', text: 'a1', tier: 'CRITICAL' }),
      cd({ property: 'containment', text: 'c1', tier: 'HIGH' }),
      // 2 × control styling, worst tier only HIGH — ties on count, loses on tier.
      cd({ property: 'shape', text: 's1', tier: 'HIGH' }),
      cd({ property: 'border', text: 'b1', tier: 'HIGH' }),
    ])

    // Count first; worst tier breaks the 2-vs-2 tie.
    expect(causes.map((c) => c.cause)).toEqual(['vertical spacing', 'layout structure', 'control styling'])
    expect(causes.map((c) => c.count)).toEqual([3, 2, 2])
  })

  it('test_UAT_AC1615_report_shows_width_scope_and_a_summary_whose_totals_agree', () => {
    const report = formatClusterReport(ladderCells())

    // Two counted defects rolling up to two causes.
    expect(report).toContain('2 counted defect(s) roll up to 2 cause(s)')

    // Width scope is shown ALWAYS: the all-width colour cause is marked `@all`,
    // while the narrow-only one names just its rungs — the exact misreading a
    // ladder-merged view invites.
    expect(report).toMatch(/colour\s+@all/)
    expect(report).toMatch(/fontSizePx\s+@320,375/)

    // The per-disposition totals sum to the counted-defect total: colour is a
    // `fix`, and fontSizePx has no taxonomy entry so it awaits judgement.
    expect(report).toContain('fix 1 · review 1 · accept 0')
  })
})

// ── AC-1616 — the two rules that keep the roll-up honest ─────────────────────

describe('story-16f2793c — AC-1616 derived axes are uncounted, unknown ones are kept', () => {
  it('test_UAT_AC1616_a_derived_axis_is_never_a_cause_and_never_in_the_count', () => {
    // A real cause (the inter-row gap grew) and its downstream shadow (the second
    // row's absolute position). Counting the shadow would double-count the cause.
    const cell: StateDiff = {
      engine: 'chromium',
      viewportWidth: 1280,
      state: 'rest',
      missing: false,
      report: diffManifests(
        mani('ref', [el('Heading', { box: box(0, 0, 200, 40) }), el('Body', { box: box(0, 500, 200, 40) })]),
        mani('a', [el('Heading', { box: box(0, 0, 200, 40) }), el('Body', { box: box(0, 620, 200, 40) })]),
      ),
    }
    const collapsed = collapseMultiViewport([cell])
    const causes = clusterDefects(collapsed)

    // The derived row exists and is reachable for drill-down…
    const position = collapsed.find((d) => d.property === 'position')!
    expect(position).toBeTruthy()
    expect(position.derived).toBe(true)
    // …but it is not a cause of its own, under any label.
    expect(causes.some((c) => c.cause === 'position')).toBe(false)
    // The real cause is counted exactly once.
    expect(causes.find((c) => c.cause === 'vertical spacing')!.count).toBe(1)

    // And the exclusion is STATED in the report rather than left implicit.
    const report = formatClusterReport([cell])
    expect(report).toContain('1 counted defect(s) roll up to 1 cause(s)')
    expect(formatCollapsedReport([cell])).toContain('derived position drift, not counted')
  })

  it('test_UAT_AC1616_a_property_absent_from_the_taxonomy_is_kept_under_its_own_name', () => {
    // The rule that keeps the view honest as the captured axis set grows: a value
    // axis with no entry in the cause map must appear the day it lands — under its
    // own property name, awaiting judgement — not vanish from the count because
    // nobody extended the map. `letterSpacingPx` has no CAUSE_MAP entry.
    const causes = clusterDefects([
      cd({ property: 'letterSpacingPx', text: 'Wordmark' }),
      cd({ property: 'color', text: 'Run' }),
    ])
    const unknown = causes.find((c) => c.cause === 'letterSpacingPx')

    // Present under its own name…
    expect(unknown, 'an untaxonomised property still appears as a cause').toBeTruthy()
    // …at `review`, because nothing has judged it yet…
    expect(unknown!.disposition).toBe('review')
    // …and counted, not dropped.
    expect(unknown!.count).toBe(1)
    expect(causes.reduce((s, c) => s + c.count, 0)).toBe(2)
  })
})
