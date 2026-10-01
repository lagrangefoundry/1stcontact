import { describe, it, expect } from 'vitest'
import { buildTheme } from '../tools/generate/src/cli/capture/theme'
import type { RawRun, RawSignals } from '../tools/generate/src/cli/capture/extract'
import { diffManifests } from '../tools/generate/src/cli/capture/values-diff'
import type { ValueElement, ValueManifest } from '../tools/generate/src/cli/capture/values-diff'
import type { ThemeSubScales } from '../tools/generate/src/cli/capture/types'

/** A RawRun with sensible geometry defaults; override only what the case needs. */
function run(over: Partial<RawRun>): RawRun {
  return {
    role: 'body',
    text: 'x',
    color: '#000000',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    letterSpacingPx: 0,
    gradientCss: null,
    borderLeftWidthPx: 0,
    borderLeftColor: null,
    paddingLeftPx: 0,
    box: { x: 0, y: 0, width: 100, height: 24 },
    borderRadiusPx: 0,
    boxShadow: null,
    a11yRole: '',
    arrangement: null,
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

/** A one-band RawSignals carrying the given content runs. */
function signalsWith(content: RawRun[]): RawSignals {
  return {
    viewport: { width: 1200, height: 800 },
    bands: [
      {
        box: { x: 0, y: 0, width: 1200, height: 800 },
        backgroundColor: null,
        backgroundImage: 'none',
        colorScheme: 'light',
        fontFamily: 'Inter',
        textAlign: 'left',
        paddingTopPx: 0,
        paddingBottomPx: 0,
        overlay: null,
        content,
        items: [],
        fields: [],
      },
    ],
    colorUsage: [],
    fontFaces: [],
    typeScale: [14, 16],
    spacingScalePx: [],
    containerMaxWidthPx: null,
    images: [],
  }
}

/** A pill (badge-shaped) run: strongly rounded, short text, small. */
const pill = (over: Partial<RawRun>) =>
  run({ borderRadiusPx: 10, box: { x: 0, y: 0, width: 40, height: 20 }, ...over })

// REQ-350 — the theme-level `typography.subScales` block, and the
// `--subscale-*` properties it emitted, went with the theme's typography group:
// nothing live read them. A badge's or a checklist's type is a named text style
// now. The capture still reads a systemic ramp off a page (below), which is what
// values-diff attributes a subscale gap to.

/**
 * Phase 4 (capture) — buildTheme reads a systemic badge/checklist ramp off a
 * captured page as a theme-level subscale, in the render's px vocabulary. The
 * capture-side machinery (`tools/generate` capture) survives the framework pivot.
 */
describe('REQ-56 component-owned typography — capture reads subscales', () => {
  it('test_UAT_FC_REQ-56_capture_reads_label_scale', () => {
    // A page whose badges (pills) and checklist (listitems) each use one ramp →
    // buildTheme reads each as a theme-level subscale, in the render's px
    // vocabulary. Badges: 14/20; checklist: 16/24 (the REQ-52 reference values).
    const theme = buildTheme(
      signalsWith([
        pill({ role: 'body', text: 'New', fontSizePx: 14, lineHeightPx: 20 }),
        pill({ role: 'body', text: 'Beta', fontSizePx: 14, lineHeightPx: 20 }),
        pill({ role: 'body', text: 'Live', fontSizePx: 14, lineHeightPx: 20 }),
        run({ role: 'listitem', text: 'One thing', fontSizePx: 16, lineHeightPx: 24 }),
        run({ role: 'listitem', text: 'Two thing', fontSizePx: 16, lineHeightPx: 24 }),
        run({ role: 'listitem', text: 'Three now', fontSizePx: 16, lineHeightPx: 24 }),
        // Body prose — neither a pill nor a listitem — must be ignored.
        run({ role: 'body', text: 'This is ordinary body prose to ignore', fontSizePx: 16 }),
      ]),
      new Map(),
    )
    expect(theme.subScales.badge).toEqual({
      fontSizePx: 14,
      fontWeight: 400,
      lineHeightPx: 20,
      letterSpacingPx: 0,
      count: 3,
    })
    expect(theme.subScales.checklist).toEqual({
      fontSizePx: 16,
      fontWeight: 400,
      lineHeightPx: 24,
      letterSpacingPx: 0,
      count: 3,
    })
  })

  it('test_UAT_FC_REQ-56_capture_ignores_one_off_pill', () => {
    // A subscale is a *systemic* ramp — a lone badge/listitem is not aggregated.
    const theme = buildTheme(
      signalsWith([pill({ role: 'body', text: 'Solo', fontSizePx: 14, lineHeightPx: 20 })]),
      new Map(),
    )
    expect(theme.subScales.badge).toBeUndefined()
  })
})

/**
 * Phase 5 (values-diff attribution) — a systemic subscale gap surfaces as ONE
 * theme-level finding; the per-element badge/checklist rows it explains are
 * rolled up by default, and restored under the `keepSubscaleDeltas` opt-out
 * (option C). Setting our subscale to the reference closes the gap systemically.
 */
describe('REQ-56 component-owned typography — values-diff subscale attribution', () => {
  /** A ValueElement with defaults; override only what the case needs. */
  function el(over: Partial<ValueElement>): ValueElement {
    return {
      text: 'x',
      role: 'body',
      color: '#000000',
      fontFamily: 'Inter',
      fontSizePx: 16,
      fontWeight: 400,
      lineHeightPx: 24,
      letterSpacingPx: 0,
      ...over,
    }
  }
  /** A badge (pill) element carrying its type. */
  const badgeEl = (text: string, fontSizePx: number, lineHeightPx: number): ValueElement =>
    el({ text, role: 'body', fontSizePx, lineHeightPx, borderRadiusPx: 10, box: { x: 0, y: 0, width: 40, height: 20 } })
  const checkEl = (text: string, lineHeightPx: number): ValueElement =>
    el({ text, role: 'listitem', fontSizePx: 16, lineHeightPx })

  function manifest(elements: ValueElement[], subScales: ThemeSubScales): ValueManifest {
    return { source: 's', elements, sections: [], viewport: { width: 1200, height: 800 }, subScales }
  }

  const refSubs: ThemeSubScales = {
    badge: { fontSizePx: 14, fontWeight: 600, lineHeightPx: 20, letterSpacingPx: 0, count: 2 },
    checklist: { fontSizePx: 16, fontWeight: 400, lineHeightPx: 24, letterSpacingPx: 0, count: 2 },
  }
  // Our render: badge 12/13 and checklist leading 28 — the REQ-52 systemic gaps.
  const ourSubs: ThemeSubScales = {
    badge: { fontSizePx: 12, fontWeight: 600, lineHeightPx: 13, letterSpacingPx: 0, count: 2 },
    checklist: { fontSizePx: 16, fontWeight: 400, lineHeightPx: 28, letterSpacingPx: 0, count: 2 },
  }
  const expected = () =>
    manifest(
      [badgeEl('New', 14, 20), badgeEl('Beta', 14, 20), checkEl('One thing', 24), checkEl('Two thing', 24)],
      refSubs,
    )
  const ours = () =>
    manifest(
      [badgeEl('New', 12, 13), badgeEl('Beta', 12, 13), checkEl('One thing', 28), checkEl('Two thing', 28)],
      ourSubs,
    )

  it('test_UAT_FC_REQ-56_systemic_gap_is_one_theme_finding', () => {
    const report = diffManifests(expected(), ours())
    const subscaleRows = report.deltas.filter((d) => d.role === 'subscale')
    // One finding per differing subscale (badge + checklist), not N per-element.
    expect(subscaleRows.map((d) => d.text).sort()).toEqual(['⟨badge subscale ×2⟩', '⟨checklist subscale ×2⟩'])
    const badgeRow = subscaleRows.find((d) => d.text.includes('badge'))!
    expect(badgeRow.expected).toContain('size 14')
    expect(badgeRow.expected).toContain('leading 20')
    expect(badgeRow.actual).toContain('size 12')
    // The per-element badge/checklist type rows are rolled up (suppressed).
    const perElement = report.deltas.filter(
      (d) => !d.systemic && (d.property === 'fontSizePx' || d.property === 'lineHeightPx'),
    )
    expect(perElement).toEqual([])
    expect(report.suppressed).toBeGreaterThanOrEqual(4)
  })

  it('test_UAT_FC_REQ-56_keep_subscale_deltas_opt_out', () => {
    const report = diffManifests(expected(), ours(), { keepSubscaleDeltas: true })
    // The theme finding is still emitted …
    expect(report.deltas.some((d) => d.role === 'subscale')).toBe(true)
    // … and the per-element rows survive for debugging.
    const perElement = report.deltas.filter(
      (d) => !d.systemic && (d.property === 'fontSizePx' || d.property === 'lineHeightPx'),
    )
    expect(perElement.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-56_gigabytealchemy_badges_close_via_theme', () => {
    // Set our subscale to the reference → badges/checklist match; the systemic
    // gap closes with no subscale finding and no per-element type deltas.
    const closed = manifest(
      [badgeEl('New', 14, 20), badgeEl('Beta', 14, 20), checkEl('One thing', 24), checkEl('Two thing', 24)],
      refSubs,
    )
    const report = diffManifests(expected(), closed)
    expect(report.deltas.filter((d) => d.role === 'subscale')).toEqual([])
    expect(report.deltas.filter((d) => d.property === 'fontSizePx' || d.property === 'lineHeightPx')).toEqual([])
  })
})
