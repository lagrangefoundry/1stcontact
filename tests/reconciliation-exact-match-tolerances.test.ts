import { describe, expect, it } from 'vitest'
import { diffManifests, run, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-dadb8475 — "Exact-match-by-default fidelity
 * comparison tolerances". Exact match is the DEFAULT in `1c values-diff` for
 * every axis we author directly and the browser renders verbatim; a documented
 * tolerance is retained only on the genuinely-emergent axes (box height, and the
 * art-directed gradient angle / overlay opacity / content anchor). `--tolerant`
 * is the single blanket opt-out that restores the old loose bands wholesale, and
 * per-axis overrides loosen exactly one axis and win over both the exact default
 * and the tolerant opt-out. There is no separate strict/exact toggle.
 *
 * These UATs drive the two real entry points: the `diffManifests` engine the
 * `values-diff` command runs, and the CLI `run(['help'])` usage surface.
 *
 * AC-582 directly-authored axes exact by default   AC-586 tolerant opt-out
 * AC-583 position exact (±1px rounding)             AC-587 per-axis override
 * AC-584 width exact / height wrapping tolerance    AC-588 no strict/exact toggle
 * AC-585 art-directed axes tolerant by default
 */

// ── fixture builders (mirror req31 / req35 / req53) ──────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
function mani(
  source: string,
  elements: ValueElement[],
  sections: ValueManifest['sections'] = [],
): ValueManifest {
  return { source, elements, sections }
}
const hasDelta = (deltas: { text: string; property: string }[], textSub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(textSub) && d.property === property)
const hasProp = (deltas: { property: string }[], property: string): boolean =>
  deltas.some((d) => d.property === property)

/** Run the CLI, capturing stdout/stderr and the resulting exit code (mirrors req11). */
async function runCli(args: string[]): Promise<{ out: string; err: string; code: number }> {
  const logs: string[] = []
  const errs: string[] = []
  const origLog = console.log
  const origErr = console.error
  console.log = (...a: unknown[]) => logs.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => errs.push(a.map(String).join(' '))
  process.exitCode = 0
  try {
    await run(args)
  } finally {
    console.log = origLog
    console.error = origErr
  }
  const code = process.exitCode ?? 0
  process.exitCode = 0
  return { out: logs.join('\n'), err: errs.join('\n'), code }
}

// ── AC-582 — directly-authored scalars are exact by default ──────────────────

describe('story-dadb8475 — AC-582 directly-authored axes require an exact match by default', () => {
  it('test_UAT_AC582_directly_authored_axes_exact_by_default', () => {
    // One ref element carrying every Group A axis, and a repro differing by a
    // single small step on each. Under the prior jitter policy each of these was
    // suppressed; by default each must now produce its own axis delta.
    const ref = mani('ref', [
      el('Body', {
        fontSizePx: 24,
        fontWeight: 400,
        lineHeightPx: 28,
        letterSpacingPx: 0.5,
        color: '#808080',
        paddingLeftPx: 10,
        borderLeft: { widthPx: 2, color: '#000000' },
        borderRadiusPx: 8,
      }),
    ])
    const actual = mani('a', [
      el('Body', {
        fontSizePx: 25, // Δ1px
        fontWeight: 500, // one weight step
        lineHeightPx: 29, // Δ1px
        letterSpacingPx: 0.8, // Δ0.3px
        color: '#818080', // near-neighbour colour
        paddingLeftPx: 11, // Δ1px
        borderLeft: { widthPx: 3, color: '#000000' }, // Δ1px border
        borderRadiusPx: 9, // Δ1px corner radius (property `shape`)
      }),
    ])
    const { deltas } = diffManifests(ref, actual)
    expect(hasDelta(deltas, 'Body', 'fontSizePx')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'fontWeight')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'lineHeightPx')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'letterSpacingPx')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'color')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'paddingLeftPx')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'borderLeft')).toBe(true)
    expect(hasDelta(deltas, 'Body', 'shape')).toBe(true)

    // An identical pair yields no delta on any of those axes.
    expect(diffManifests(ref, ref).deltas).toEqual([])
  })
})

// ── AC-583 — position exact with only an integer-rounding allowance ──────────

describe('story-dadb8475 — AC-583 element position is exact by default with a 1px rounding allowance', () => {
  it('test_UAT_AC583_position_exact_1px_allowance', () => {
    const ref = mani('ref', [el('Hero', { box: box(120, 100, 600, 60) })])
    // An 8px offset (the exact REQ-52 miss a loose band once hid) FAILS…
    const shifted = diffManifests(ref, mani('a', [el('Hero', { box: box(128, 100, 600, 60) })]))
    expect(hasDelta(shifted.deltas, 'Hero', 'position')).toBe(true)
    // …while a 1px integer-rounding difference in the captured box does not.
    const rounded = diffManifests(ref, mani('a', [el('Hero', { box: box(121, 100, 600, 60) })]))
    expect(hasProp(rounded.deltas, 'position')).toBe(false)
  })
})

// ── AC-584 — the size split: width exact, height keeps a wrapping tolerance ───

describe('story-dadb8475 — AC-584 box width exact by default while box height keeps a wrapping tolerance', () => {
  it('test_UAT_AC584_width_exact_height_wrapping_tolerance', () => {
    const ref = mani('ref', [el('Card', { box: box(0, 0, 300, 40) })])
    // (a) width differs by 4px, height identical → a size delta is reported.
    const wide = diffManifests(ref, mani('a', [el('Card', { box: box(0, 0, 304, 40) })]))
    expect(hasDelta(wide.deltas, 'Card', 'size')).toBe(true)
    // (b) height differs by 6px (within the 8px wrapping tolerance) → no size delta.
    const tall = diffManifests(ref, mani('a', [el('Card', { box: box(0, 0, 300, 46) })]))
    expect(hasProp(tall.deltas, 'size')).toBe(false)
    // (c) height differs by 20px (a whole extra wrapped line) → a size delta.
    const wrapped = diffManifests(ref, mani('a', [el('Card', { box: box(0, 0, 300, 60) })]))
    expect(hasDelta(wrapped.deltas, 'Card', 'size')).toBe(true)
  })
})

// ── AC-585 — art-directed axes stay tolerant by default ──────────────────────

describe('story-dadb8475 — AC-585 art-directed axes remain tolerant by default', () => {
  it('test_UAT_AC585_art_directed_axes_tolerant_by_default', () => {
    // Gradient direction within its ±20° band (measured, never authored to the
    // degree) produces no delta.
    const gradRef = mani('ref', [el('Wordmark', { gradient: { angleDeg: 90, stops: ['#aaaaaa', '#bbbbbb'] } })])
    const gradAct = mani('a', [el('Wordmark', { gradient: { angleDeg: 100, stops: ['#aaaaaa', '#bbbbbb'] } })])
    expect(hasProp(diffManifests(gradRef, gradAct).deltas, 'gradient')).toBe(false)

    // Hero scrim opacity within ±0.1 and vertical anchor within ±0.15 produce no
    // delta by default — both are measured perceptually, never authored precisely.
    const secRef = mani('ref', [], [{ index: 0, overlay: { color: '#000000', opacity: 0.5 }, contentAnchorRatio: 0.5 }])
    const secAct = mani('a', [], [{ index: 0, overlay: { color: '#000000', opacity: 0.55 }, contentAnchorRatio: 0.6 }])
    const { deltas } = diffManifests(secRef, secAct)
    expect(hasProp(deltas, 'overlay')).toBe(false)
    expect(hasProp(deltas, 'contentAnchor')).toBe(false)
  })
})

// ── AC-586 — the tolerant opt-out restores loose matching wholesale ──────────

describe('story-dadb8475 — AC-586 the tolerant opt-out restores loose matching on every default-exact axis', () => {
  it('test_UAT_AC586_tolerant_optout_restores_loose_matching', () => {
    // A pair differing on a Group A axis (font size Δ1) and a Group B axis
    // (position Δ8) — plus more — all within the old loose bands.
    const ref = mani('ref', [
      el('Body', { fontSizePx: 24, fontWeight: 400, lineHeightPx: 28, letterSpacingPx: 0.5, color: '#808080', box: box(100, 100, 300, 40) }),
    ])
    const actual = mani('a', [
      el('Body', { fontSizePx: 25, fontWeight: 500, lineHeightPx: 30, letterSpacingPx: 0.8, color: '#818080', box: box(108, 100, 304, 40) }),
    ])
    // Exact default: the Group A font-size delta and the Group B position delta both fire.
    const base = diffManifests(ref, actual)
    expect(hasProp(base.deltas, 'fontSizePx')).toBe(true)
    expect(hasProp(base.deltas, 'position')).toBe(true)
    // The single `tolerant` opt-out collapses back to the loose bands → every delta suppressed.
    expect(diffManifests(ref, actual, { tolerant: true }).deltas).toEqual([])
  })
})

// ── AC-587 — a per-axis override loosens one axis and overrides both modes ────

describe('story-dadb8475 — AC-587 a per-axis tolerance override loosens one axis and overrides both modes', () => {
  it('test_UAT_AC587_per_axis_override_loosens_one_axis', () => {
    // A pair differing on two axes at once: a 30px position offset and a colour drift.
    const ref = mani('ref', [el('Body', { color: '#808080', box: box(100, 100, 300, 40) })])
    const actual = mani('a', [el('Body', { color: '#818080', box: box(130, 100, 300, 40) })])

    // By default both axes fire.
    const base = diffManifests(ref, actual)
    expect(hasDelta(base.deltas, 'Body', 'position')).toBe(true)
    expect(hasDelta(base.deltas, 'Body', 'color')).toBe(true)

    // The tolerant opt-out ALONE does not clear this 30px offset (its loose band is 24px) —
    // proving it is the override, not the mode, that suppresses the axis below.
    expect(hasProp(diffManifests(ref, actual, { tolerant: true }).deltas, 'position')).toBe(true)

    // Only the position override, sized to cover the offset: the position delta is
    // suppressed while colour stays exact — the override wins over the exact default.
    const overridden = diffManifests(ref, actual, { positionTolerancePx: 40 })
    expect(hasProp(overridden.deltas, 'position')).toBe(false)
    expect(hasDelta(overridden.deltas, 'Body', 'color')).toBe(true)

    // The override still suppresses that axis when combined with the tolerant opt-out —
    // it wins over the blanket loosening too.
    expect(hasProp(diffManifests(ref, actual, { positionTolerancePx: 40, tolerant: true }).deltas, 'position')).toBe(false)
  })
})

// ── AC-588 — no legacy strict/exact toggle; exact default + single opt-out ────

describe('story-dadb8475 — AC-588 no legacy strict/exact toggle; exact is the default with a single opt-out', () => {
  it('test_UAT_AC588_no_strict_exact_toggle_single_optout', async () => {
    const { out, code } = await runCli(['help'])
    expect(code).toBe(0)
    // The values-diff tolerance surface advertises exact-by-default…
    expect(out).toContain('values-diff')
    expect(out).toContain('EXACT by default')
    // …a single blanket tolerant opt-out…
    expect(out).toContain('--tolerant')
    // …and per-axis override flags that loosen one axis.
    for (const flag of ['--color-tol', '--font-size-tol', '--position-tol', '--width-tol', '--height-tol', '--radius-tol']) {
      expect(out).toContain(flag)
    }
    // …with NO separate strict/exact-match toggle (no legacy dual-mode path).
    expect(out).not.toContain('--strict')
    expect(out).not.toContain('--exact')
  })
})
