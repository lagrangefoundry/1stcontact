import { describe, expect, it } from 'vitest'
import {
  diffManifests,
  formatReport,
  type ObjectCard,
  type ValueElement,
  type ValueManifest,
  type ValuesDiffReport,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-74050e88 — the object-grouped fidelity
 * comparison report (REQ-51). One UAT per acceptance criterion, asserting the
 * object projection over the existing box-to-box pairing:
 *
 *   AC-575 one card per reference object, worst-object-first
 *   AC-576 box position is a first-class param on every card
 *   AC-577 unpaired objects reported loudly in both directions with counts
 *   AC-578 the expected column prints spec field names/units as a paste-able value
 *   AC-579 image / control objects carry kind-appropriate parameter tables
 *   AC-580 clean objects collapse to a count; non-object deltas render in a tail
 *   AC-581 the machine-readable report carries the object cards and unpaired list
 *
 * `diffManifests` is the comparison entry point (the CLI `cmdValuesDiff` is a
 * thin wrapper that calls it) and `formatReport` is the human rendering — the
 * two observable outputs the story delivers. Pure and browser-free: manifests
 * are built in code and diffed, no capture / render / network.
 */

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

/** A text run element with sensible defaults. */
function textEl(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#000000',
    fontFamily: 'sans',
    fontSizePx: 18,
    fontWeight: 400,
    box: box(0, 0, 100, 20),
    ...over,
  }
}

/** A text-free field element (control / image / divider): textless, paired on a11yRole + order. */
function fieldEl(over: Partial<ValueElement> = {}): ValueElement {
  const a11yRole = over.a11yRole ?? 'textbox'
  return {
    text: over.accessibleName ?? `(${a11yRole})`,
    role: a11yRole,
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole,
    accessibleName: '',
    nameSource: null,
    box: box(0, 0, 100, 40),
    ...over,
  }
}

const mani = (elements: ValueElement[]): ValueManifest => ({ source: 'x', elements, sections: [] })

const cardFor = (report: ValuesDiffReport, textSub: string): ObjectCard | undefined =>
  report.objects.find((o) => o.label.includes(textSub))
const paramOf = (card: ObjectCard, name: string) => card.params.find((p) => p.name === name)

// ── AC-575: one card per reference object, worst-object-first ──────────────────

describe('AC-575 object-grouped comparison — one card per object, worst first', () => {
  it('test_UAT_AC575_groups_deltas_into_one_card_per_object_worst_first', () => {
    // The wordmark reproduces with the RIGHT family + colour but the WRONG size +
    // position — the flat severity-sorted stream scatters those two deltas across
    // the list; the card gathers them onto one object's table. A second object
    // (a minor note) differs only on colour (LOW), so the wordmark — carrying a
    // CRITICAL position delta — must sort ahead of it.
    const expected = mani([
      textEl('Gigabyte Alchemy', {
        role: 'wordmark',
        fontFamily: 'Cinzel',
        fontSizePx: 72,
        color: '#f5e6a3',
        box: box(120, 40, 640, 72),
      }),
      textEl('Minor note', { role: 'body', color: '#111111', box: box(120, 900, 200, 20) }),
    ])
    const actual = mani([
      textEl('Gigabyte Alchemy', {
        role: 'wordmark',
        fontFamily: 'Cinzel', // right family
        fontSizePx: 48, // wrong size
        color: '#f5e6a3', // right colour
        box: box(120, 240, 300, 48), // wrong position (+200y) and size
      }),
      textEl('Minor note', { role: 'body', color: '#222222', box: box(120, 900, 200, 20) }),
    ])
    const report = diffManifests(expected, actual)

    // One card per reference object, in document order.
    expect(report.objects.map((o) => o.label)).toEqual(['Gigabyte Alchemy', 'Minor note'])

    const card = cardFor(report, 'Gigabyte Alchemy')!
    expect(card.kind).toBe('text')
    // The fixed text parameter table — all params present, both columns shown.
    const fixed = ['fontFamily', 'fontSizePx', 'fontWeight', 'color', 'letterSpacingPx', 'lineHeightPx', 'box']
    expect(card.params.slice(0, fixed.length).map((p) => p.name)).toEqual(fixed)
    for (const name of fixed) {
      const p = paramOf(card, name)!
      expect(typeof p.expected).toBe('string')
      expect(typeof p.actual).toBe('string')
    }
    // Exactly the differing axes flag; the agreeing axes do not — all on ONE card.
    expect(paramOf(card, 'fontSizePx')!.mismatch).toBe(true)
    expect(paramOf(card, 'box')!.mismatch).toBe(true)
    expect(paramOf(card, 'fontFamily')!.mismatch).toBe(false)
    expect(paramOf(card, 'color')!.mismatch).toBe(false)
    expect(paramOf(card, 'fontWeight')!.mismatch).toBe(false)

    // Worst-object-first: the CRITICAL-carrying wordmark outranks the LOW colour
    // note, both by card severity and in the rendered order.
    const note = cardFor(report, 'Minor note')!
    expect(card.worstSeverity).toBeGreaterThan(note.worstSeverity)
    const out = formatReport(report)
    expect(out.indexOf('Gigabyte Alchemy')).toBeLessThan(out.indexOf('Minor note'))
  })
})

// ── AC-576: box position is a first-class param on every card ──────────────────

describe('AC-576 every card shows the box position as a first-class param', () => {
  it('test_UAT_AC576_box_is_present_and_flagged_on_every_card', () => {
    const expected = mani([
      textEl('Shifted heading', { role: 'heading', box: box(120, 400, 600, 64) }),
      textEl('Steady subhead', { role: 'subhead', box: box(120, 500, 400, 30) }),
    ])
    const actual = mani([
      textEl('Shifted heading', { role: 'heading', box: box(120, 595, 600, 64) }), // position drift only
      textEl('Steady subhead', { role: 'subhead', box: box(120, 500, 400, 30) }), // identical
    ])
    const report = diffManifests(expected, actual)

    // Position-drift object: box row present, both columns carry {x,y} w×h, flagged.
    const shifted = cardFor(report, 'Shifted heading')!
    const shiftedBox = paramOf(shifted, 'box')!
    expect(shiftedBox).toBeDefined()
    expect(shiftedBox.expected).toMatch(/\(\d+, \d+\) \d+×\d+/)
    expect(shiftedBox.actual).toMatch(/\(\d+, \d+\) \d+×\d+/)
    expect(shiftedBox.mismatch).toBe(true)

    // Fully-matching object: box row still present, flagged matched (never omitted).
    const steady = cardFor(report, 'Steady subhead')!
    const steadyBox = paramOf(steady, 'box')!
    expect(steadyBox).toBeDefined()
    expect(steadyBox.expected).toMatch(/\(\d+, \d+\) \d+×\d+/)
    expect(steadyBox.actual).toMatch(/\(\d+, \d+\) \d+×\d+/)
    expect(steadyBox.mismatch).toBe(false)

    // Every card, regardless of kind or drift, carries a box row.
    for (const o of report.objects) expect(paramOf(o, 'box')).toBeDefined()
  })
})

// ── AC-577: unpaired objects reported loudly in both directions, with counts ───

describe('AC-577 unpaired objects surfaced loudly in both directions', () => {
  it('test_UAT_AC577_reports_both_unpaired_directions_with_counts_and_labels', () => {
    const expected = mani([
      textEl('Kept heading', { role: 'heading' }),
      textEl('Dropped tagline', { role: 'tagline' }),
    ])
    const actual = mani([
      textEl('Kept heading', { role: 'heading' }),
      textEl('Extra badge', { role: 'badge' }),
    ])
    const report = diffManifests(expected, actual)

    // Reference object with no repro match → an unpaired card, not folded away.
    const dropped = cardFor(report, 'Dropped tagline')!
    expect(dropped.paired).toBe(false)
    // Repro object that matched nothing → a distinct unpaired-actual entry.
    expect(report.unpairedActual.map((o) => o.label)).toContain('Extra badge')

    // The human rendering names BOTH counts, ahead of the cards, and lists each label.
    const out = formatReport(report)
    expect(out).toContain('UNPAIRED')
    expect(out).toContain('1 reference object(s) had no repro match')
    expect(out).toContain('1 repro object(s) matched nothing')
    expect(out).toContain('Dropped tagline')
    expect(out).toContain('Extra badge')
  })
})

// ── AC-578: the expected column is the spec-named, spec-unit paste-able value ───

describe('AC-578 expected column prints spec field names and units', () => {
  it('test_UAT_AC578_expected_column_is_pasteable_spec_value', () => {
    const expected = mani([
      textEl('Hero heading', { role: 'heading', fontSizePx: 72, box: box(120, 400, 600, 72) }),
    ])
    const actual = mani([
      textEl('Hero heading', { role: 'heading', fontSizePx: 48, box: box(120, 400, 600, 48) }),
    ])
    const card = cardFor(diffManifests(expected, actual), 'Hero heading')!

    // The flagged font-size row is labelled with the spec parameter name…
    const fontSize = paramOf(card, 'fontSizePx')!
    expect(fontSize.name).toBe('fontSizePx')
    // …and its expected column is the raw reference pixel number an operator
    // pastes into the spec — `72`, not a re-formatted / unit-annotated string.
    expect(fontSize.expected).toBe('72')
    expect(fontSize.actual).toBe('48')
    expect(fontSize.mismatch).toBe(true)

    // Other params likewise appear under their spec parameter names.
    expect(paramOf(card, 'color')).toBeDefined()
    expect(paramOf(card, 'box')).toBeDefined()
  })
})

// ── AC-579: image / control objects carry kind-appropriate parameter tables ────

describe('AC-579 image and control cards carry kind-appropriate params', () => {
  it('test_UAT_AC579_image_and_control_carry_own_tables', () => {
    const expected = mani([
      fieldEl({ a11yRole: 'img', accessibleName: 'Alchemist portrait', objectFit: 'cover', intrinsicAspect: 1, box: box(40, 40, 200, 200) }),
      fieldEl({ a11yRole: 'textbox', accessibleName: 'Your email', nameSource: 'placeholder', box: box(40, 300, 320, 44) }),
    ])
    const actual = mani([
      fieldEl({ a11yRole: 'img', accessibleName: 'Alchemist portrait', objectFit: 'fill', intrinsicAspect: 1, box: box(40, 40, 200, 200) }),
      fieldEl({ a11yRole: 'textbox', accessibleName: 'Your email', nameSource: 'label', box: box(40, 300, 320, 44) }),
    ])
    const report = diffManifests(expected, actual)

    // Image: fit/aspect/box table (not the text typography table); object-fit flagged.
    const image = report.objects.find((o) => o.kind === 'image')!
    expect(image.params.map((p) => p.name)).toEqual(['name', 'objectFit', 'aspect', 'box'])
    expect(paramOf(image, 'objectFit')!.mismatch).toBe(true) // cover → fill flagged
    expect(paramOf(image, 'fontFamily')).toBeUndefined() // not rendered with the text table

    // Control: name/name-source/box table; placeholder-inside → label-above flagged.
    const control = report.objects.find((o) => o.kind === 'control')!
    expect(control.params.map((p) => p.name)).toEqual(['name', 'nameSource', 'box'])
    expect(paramOf(control, 'nameSource')!.mismatch).toBe(true)
  })
})

// ── AC-580: clean objects collapse to a count; non-object deltas in a tail ──────

describe('AC-580 clean count, non-object tail, and the no-value-deltas line', () => {
  it('test_UAT_AC580_clean_count_tail_section_and_no_deltas', () => {
    // A pair mixing: a dirty object, a clean object, and a section-level overlay
    // delta (belongs to no reference object → the dedicated tail).
    const expected: ValueManifest = {
      source: 'ref',
      elements: [
        textEl('Dirty heading', { role: 'heading', fontSizePx: 64, box: box(120, 400, 600, 64) }),
        textEl('Clean subhead', { role: 'subhead', box: box(120, 500, 400, 30) }),
      ],
      sections: [{ index: 0, overlay: { color: '#000000', opacity: 0.6 }, contentAnchorRatio: null }],
    }
    const actual: ValueManifest = {
      source: 'repro',
      elements: [
        textEl('Dirty heading', { role: 'heading', fontSizePx: 40, box: box(120, 595, 600, 40) }),
        textEl('Clean subhead', { role: 'subhead', box: box(120, 500, 400, 30) }),
      ],
      sections: [{ index: 0, overlay: null, contentAnchorRatio: null }],
    }
    const out = formatReport(diffManifests(expected, actual))

    // The dirty object renders as a card…
    expect(out).toContain('▸ text · "Dirty heading"')
    // …the clean object appears ONLY as a count, never as a card.
    expect(out).toContain('1 object(s) reproduced clean')
    expect(out).not.toContain('▸ text · "Clean subhead"')
    // The section-level delta lives in the dedicated non-object tail.
    expect(out).toContain('section / render-only checks:')
    expect(out).toContain('[overlay]')

    // A fully-matching comparison → one explicit no-value-deltas result, no cards.
    const clean = formatReport(diffManifests(expected, expected))
    expect(clean).toContain('✓ no value deltas')
    expect(clean).not.toContain('▸')
  })
})

// ── AC-581: the machine-readable report carries cards + unpaired list ──────────

describe('AC-581 machine-readable report carries object cards and unpaired list', () => {
  it('test_UAT_AC581_structured_report_has_cards_and_unpaired_collection', () => {
    const expected = mani([
      textEl('Mismatched heading', { role: 'heading', box: box(120, 400, 600, 64) }),
      textEl('Clean note', { role: 'body', box: box(120, 600, 200, 20) }),
      textEl('Dropped ref', { role: 'tagline', box: box(120, 700, 300, 20) }),
    ])
    const actual = mani([
      textEl('Mismatched heading', { role: 'heading', box: box(120, 600, 600, 64) }), // position drift
      textEl('Clean note', { role: 'body', box: box(120, 600, 200, 20) }), // identical
      textEl('Extra repro', { role: 'badge', box: box(120, 800, 100, 20) }), // repro-only
    ])
    const report = diffManifests(expected, actual)

    // A per-object collection: entries carry parameter rows (incl. a box row) with
    // per-row mismatch flags, a mismatch count, and an ordering severity.
    expect(Array.isArray(report.objects)).toBe(true)
    const mismatched = cardFor(report, 'Mismatched heading')!
    expect(paramOf(mismatched, 'box')).toBeDefined()
    for (const p of mismatched.params) expect(typeof p.mismatch).toBe('boolean')
    expect(mismatched.deltaCount).toBe(mismatched.params.filter((p) => p.mismatch).length)
    expect(mismatched.deltaCount).toBeGreaterThan(0)
    expect(mismatched.worstSeverity).toBeGreaterThan(0)

    // A clean object carries a card with a zero mismatch count.
    expect(cardFor(report, 'Clean note')!.deltaCount).toBe(0)

    // A distinct collection lists the reproduction-only object that matched nothing…
    expect(report.unpairedActual.map((o) => o.label)).toContain('Extra repro')
    expect(report.unpairedActual.map((o) => o.label)).not.toContain('Dropped ref')
    // …while the dropped reference object is an unpaired CARD, not in unpairedActual.
    expect(cardFor(report, 'Dropped ref')!.paired).toBe(false)
  })
})
