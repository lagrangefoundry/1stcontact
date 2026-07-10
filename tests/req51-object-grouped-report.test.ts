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
 * UATs for REQ-51 — the object-grouped inspection/comparison. `diffManifests`
 * already aligns reference↔repro object-by-object; these assert the *object*
 * projection over that pairing: one card per reference object carrying its full
 * parameter table (reference vs repro, `box` position first-class), unpaired
 * objects surfaced loudly in both directions, and `formatReport` rendering the
 * object cards as the primary read. Pure and browser-free — manifests are built
 * in code and diffed.
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

// ── object grouping: one card per object, full param table ────────────────────

describe('REQ-51 object-grouped comparison — one card per object', () => {
  // The gigabytealchemy wordmark: right family + colour, wrong size + position.
  // The flat list scatters those two deltas across the whole stream; the card
  // gathers this object's four axes into one table.
  const expected = mani([
    textEl('Gigabyte Alchemy', { role: 'wordmark', fontFamily: 'Cinzel', fontSizePx: 72, color: '#f5e6a3', box: box(120, 40, 640, 72) }),
    textEl('Tools for clarity', { role: 'subhead', color: '#f5e6a3', box: box(120, 130, 400, 30) }),
  ])
  const actual = mani([
    textEl('Gigabyte Alchemy', { role: 'wordmark', fontFamily: 'Cinzel', fontSizePx: 48, color: '#f5e6a3', box: box(120, 40, 300, 48) }),
    textEl('Tools for clarity', { role: 'subhead', color: '#f5e6a3', box: box(120, 130, 400, 30) }),
  ])

  it('test_UAT_FC_REQ-51_report_groups_deltas_by_object', () => {
    const report = diffManifests(expected, actual)
    // One card per reference object, in document order.
    expect(report.objects.map((o) => o.label)).toEqual(['Gigabyte Alchemy', 'Tools for clarity'])
    const card = cardFor(report, 'Gigabyte Alchemy')!
    expect(card.kind).toBe('text')
    // The two wrong axes flag; the two right axes do not — all on ONE card.
    expect(paramOf(card, 'fontSizePx')!.mismatch).toBe(true)
    expect(paramOf(card, 'box')!.mismatch).toBe(true)
    expect(paramOf(card, 'fontFamily')!.mismatch).toBe(false)
    expect(paramOf(card, 'color')!.mismatch).toBe(false)
  })

  it('test_UAT_FC_REQ-51_position_is_a_first_class_param_on_every_card', () => {
    const report = diffManifests(expected, actual)
    // `box {x,y,w,h}` is present on every object card — position is the residual
    // iteration converges, so it is a column, never a buried delta.
    for (const o of report.objects) {
      const p = paramOf(o, 'box')
      expect(p).toBeDefined()
      expect(p!.expected).toMatch(/\(\d+, \d+\) \d+×\d+/)
    }
  })

  it('test_UAT_FC_REQ-51_expected_column_is_the_pasteable_value', () => {
    const report = diffManifests(expected, actual)
    const card = cardFor(report, 'Gigabyte Alchemy')!
    // The `expected` column prints the value to transcribe, in the spec's own
    // units — the flagged fontSizePx row's expected is the raw px number `72`.
    expect(paramOf(card, 'fontSizePx')!.expected).toBe('72')
    expect(paramOf(card, 'fontSizePx')!.actual).toBe('48')
  })

  it('test_UAT_FC_REQ-51_clean_object_has_no_mismatches', () => {
    const report = diffManifests(expected, actual)
    const subhead = cardFor(report, 'Tools for clarity')!
    expect(subhead.deltaCount).toBe(0)
    expect(subhead.params.every((p) => !p.mismatch)).toBe(true)
    expect(subhead.worstTier).toBeNull()
  })
})

// ── loud unpaired reporting (item 3), both directions ─────────────────────────

describe('REQ-51 loud unpaired reporting', () => {
  const expected = mani([
    textEl('Kept heading', { role: 'heading' }),
    textEl('Dropped tagline', { role: 'tagline' }),
  ])
  const actual = mani([
    textEl('Kept heading', { role: 'heading' }),
    textEl('Extra badge', { role: 'badge' }),
  ])

  it('test_UAT_FC_REQ-51_unpaired_reference_and_repro_are_surfaced', () => {
    const report = diffManifests(expected, actual)
    // Reference object with no repro match → an unpaired card.
    const dropped = cardFor(report, 'Dropped tagline')!
    expect(dropped.paired).toBe(false)
    // Repro object that matched nothing → surfaced in unpairedActual, not a count.
    expect(report.unpairedActual.map((o) => o.label)).toContain('Extra badge')
  })

  it('test_UAT_FC_REQ-51_formatReport_is_object_grouped_and_loud', () => {
    const report = diffManifests(expected, actual)
    const out = formatReport(report)
    expect(out).toContain('UNPAIRED')
    expect(out).toContain('1 reference object(s) had no repro match')
    expect(out).toContain('1 repro object(s) matched nothing')
    expect(out).toContain('Extra badge')
  })
})

// ── formatReport renders object cards with inline flags ───────────────────────

describe('REQ-51 formatReport object cards', () => {
  it('test_UAT_FC_REQ-51_formatReport_renders_object_card_with_flags', () => {
    const expected = mani([
      textEl('Hero heading', { role: 'heading', fontSizePx: 64, box: box(120, 400, 600, 64) }),
    ])
    const actual = mani([
      textEl('Hero heading', { role: 'heading', fontSizePx: 40, box: box(120, 595, 600, 40) }),
    ])
    const out = formatReport(diffManifests(expected, actual))
    // Object heading (▸), the object's identity, and inline mismatch flags.
    expect(out).toContain('▸ text · "Hero heading" (heading)')
    expect(out).toContain('✗')
    expect(out).toContain('fontSizePx')
    // Clean single-object diff → the no-deltas line, no spurious cards.
    const clean = formatReport(diffManifests(expected, expected))
    expect(clean).toContain('✓ no value deltas')
  })
})

// ── images and controls carry their own relevant params ───────────────────────

describe('REQ-51 image and control cards carry relevant params', () => {
  it('test_UAT_FC_REQ-51_image_and_control_cards_carry_relevant_params', () => {
    const expected = mani([
      fieldEl({ a11yRole: 'img', accessibleName: 'Alchemist portrait', objectFit: 'cover', intrinsicAspect: 1, box: box(40, 40, 200, 200) }),
      fieldEl({ a11yRole: 'textbox', accessibleName: 'Your email', nameSource: 'placeholder', box: box(40, 300, 320, 44) }),
    ])
    const actual = mani([
      fieldEl({ a11yRole: 'img', accessibleName: 'Alchemist portrait', objectFit: 'fill', intrinsicAspect: 1, box: box(40, 40, 200, 200) }),
      fieldEl({ a11yRole: 'textbox', accessibleName: 'Your email', nameSource: 'label', box: box(40, 300, 320, 44) }),
    ])
    const report = diffManifests(expected, actual)

    const image = report.objects.find((o) => o.kind === 'image')!
    expect(image.params.map((p) => p.name)).toEqual(['name', 'objectFit', 'aspect', 'box'])
    expect(paramOf(image, 'objectFit')!.mismatch).toBe(true) // cover → fill flagged

    const control = report.objects.find((o) => o.kind === 'control')!
    expect(control.params.map((p) => p.name)).toEqual(['name', 'nameSource', 'box'])
    // placeholder-inside → label-above is a containment miss, flagged on nameSource.
    expect(paramOf(control, 'nameSource')!.mismatch).toBe(true)
  })
})
