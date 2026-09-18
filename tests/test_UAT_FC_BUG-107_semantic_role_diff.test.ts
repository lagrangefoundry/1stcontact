import { describe, expect, it } from 'vitest'
import { diffManifests, formatReport, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'

/**
 * UATs for BUG-107 — `values-diff` compared a fixed parameter table per object
 * kind and NO kind's table named the semantic role, so a reproduction that
 * emitted every heading and every link as a styled paragraph painted the same
 * glyphs at the same size in the same place, agreed on every compared axis, and
 * the report read `deltas: []` over eleven lost headings and two lost links.
 *
 * These pin the two halves of the fix: the role is diffed as a first-class
 * property (with the outline depth `a11yRole`'s single word flattens), and a
 * painted textless box is bucketed as a `box` rather than presented to a reader
 * as an unpaired form control.
 *
 * Pure and browser-free — manifests are built in code and diffed.
 */

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

/** A text run element with sensible defaults (matching the reference's typography). */
function textEl(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter',
    fontSizePx: 18,
    fontWeight: 400,
    box: box(0, 0, 200, 24),
    ...over,
  }
}

/** A textless element — a control, an image, a divider, or a painted box. */
function fieldEl(over: Partial<ValueElement> = {}): ValueElement {
  const a11yRole = over.a11yRole ?? 'generic'
  return {
    text: over.accessibleName || `(${a11yRole})`,
    role: a11yRole,
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole,
    accessibleName: '',
    nameSource: null,
    box: box(0, 0, 1280, 488),
    ...over,
  }
}

const mani = (elements: ValueElement[]): ValueManifest => ({ source: 'x', elements, sections: [] })

// ── the reported defect: a heading reproduced as a paragraph ──────────────────

describe('BUG-107 the semantic role is diffed', () => {
  // The gigabytealchemy round, in miniature: identical ink, identical metrics,
  // identical position — the ONLY difference is what the browser says each run is.
  const expected = mani([
    textEl('Our Mission', { role: 'heading', a11yRole: 'heading', fontSizePx: 36, fontWeight: 700 }),
    textEl('LinkedIn', { role: 'link', a11yRole: 'link' }),
    textEl('Tools for clarity', { role: 'body', a11yRole: 'generic' }),
  ])
  const actual = mani([
    textEl('Our Mission', { role: 'body', a11yRole: 'generic', fontSizePx: 36, fontWeight: 700 }),
    textEl('LinkedIn', { role: 'body', a11yRole: 'generic' }),
    textEl('Tools for clarity', { role: 'body', a11yRole: 'generic' }),
  ])

  it('test_UAT_FC_BUG-107_lost_heading_and_link_raise_role_deltas', () => {
    const report = diffManifests(expected, actual)
    const roleDeltas = report.deltas.filter((d) => d.property === 'a11yRole')

    // One delta per run whose role regressed — and ONLY those runs: the body copy
    // that agreed on its role raises nothing, so the axis adds no noise.
    expect(roleDeltas.map((d) => d.text).sort()).toEqual(['LinkedIn', 'Our Mission'])
    expect(roleDeltas.map((d) => `${d.expected}->${d.actual}`).sort()).toEqual([
      'heading->generic',
      'link->generic',
    ])
    // Structural, so it outranks every tonal/treatment axis — and authored, so the
    // repair is to copy the reference's role into place (Type A), not to measure it.
    for (const d of roleDeltas) {
      expect(d.tier).toBe('HIGH')
      expect(d.kind).toBe('semantics')
      expect(d.valueType).toBe('A')
    }
  })

  it('test_UAT_FC_BUG-107_role_shows_on_the_object_card_and_in_the_report', () => {
    const report = diffManifests(expected, actual)
    const card = report.objects.find((o) => o.label === 'Our Mission')!
    const roleParam = card.params.find((p) => p.name === 'a11yRole')!

    // The card is the primary human read, so the role is a row on it — first,
    // ahead of the typography that merely dresses the run — and it is flagged.
    expect(card.params[0].name).toBe('a11yRole')
    expect(roleParam.expected).toBe('heading')
    expect(roleParam.actual).toBe('generic')
    expect(roleParam.mismatch).toBe(true)
    // The clean run stays clean: its role row matches and its card reports no delta.
    const clean = report.objects.find((o) => o.label === 'Tools for clarity')!
    expect(clean.deltaCount).toBe(0)

    expect(formatReport(report)).toContain('a11yRole')
  })

  it('test_UAT_FC_BUG-107_role_diff_is_inert_when_a_side_never_captured_it', () => {
    // A manifest that predates the captured role carries none. Comparing an absent
    // value against a present one would report every run of an older reference as a
    // semantic regression — so the axis is guarded on BOTH sides carrying it.
    const old = mani([textEl('Our Mission', { role: 'heading', fontSizePx: 36, fontWeight: 700 })])
    const report = diffManifests(old, mani([textEl('Our Mission', { a11yRole: 'generic', fontSizePx: 36, fontWeight: 700 })]))
    expect(report.deltas.filter((d) => d.property === 'a11yRole')).toEqual([])
  })

  it('test_UAT_FC_BUG-107_heading_depth_is_compared_when_the_role_word_agrees', () => {
    // `a11yRole` reports the single word `heading` for all six tags, so an h2
    // reproduced as an h4 agrees on the role and still builds the wrong outline.
    const ref = mani([textEl('Our Mission', { a11yRole: 'heading', headingLevel: 2 })])
    const repro = mani([textEl('Our Mission', { a11yRole: 'heading', headingLevel: 4 })])
    const report = diffManifests(ref, repro)
    const d = report.deltas.find((x) => x.property === 'headingLevel')!
    expect(d).toBeDefined()
    expect(`${d.expected}->${d.actual}`).toBe('h2->h4')
    expect(d.kind).toBe('semantics')
    // Same depth on both sides raises nothing.
    expect(diffManifests(ref, ref).deltas.filter((x) => x.property === 'headingLevel')).toEqual([])
  })
})

// ── a painted textless box is a box, not a form control ──────────────────────

describe('BUG-107 painted boxes are bucketed as boxes', () => {
  it('test_UAT_FC_BUG-107_unpaired_painted_band_is_reported_as_a_box', () => {
    // The reproduction paints section bands the reference does not have as their
    // own objects. They are flat coloured rectangles; calling them unpaired *form
    // controls* (the old default for anything textless that was not an image or a
    // separator) tells a reader the page grew seven inputs it did not grow.
    const report = diffManifests(
      mani([textEl('Our Mission', { a11yRole: 'generic' })]),
      mani([
        textEl('Our Mission', { a11yRole: 'generic' }),
        fieldEl({ a11yRole: 'generic', surfaceFill: '#e8dfd3', box: box(0, 800, 1280, 488) }),
      ]),
    )
    expect(report.unpairedActual.map((o) => o.kind)).toEqual(['box'])
    // A real control still reads as a control — the bucket says what a thing IS,
    // and an interactive role is the positive test for it.
    const withControl = diffManifests(
      mani([textEl('Our Mission', { a11yRole: 'generic' })]),
      mani([textEl('Our Mission', { a11yRole: 'generic' }), fieldEl({ a11yRole: 'textbox', accessibleName: 'Email' })]),
    )
    expect(withControl.unpairedActual.map((o) => o.kind)).toEqual(['control'])
  })

  it('test_UAT_FC_BUG-107_box_card_reports_its_painted_fill', () => {
    // A band's whole visible substance is its fill, and it was compared only where
    // a text run sat on top of it — so a textless band painted the wrong colour
    // reported its geometry, matched, and said nothing.
    const report = diffManifests(
      mani([fieldEl({ surfaceFill: '#e8dfd3' })]),
      mani([fieldEl({ surfaceFill: '#0f172b' })]),
    )
    const card = report.objects[0]
    expect(card.kind).toBe('box')
    expect(card.params.map((p) => p.name)).toEqual(['surfaceFill', 'backgroundImage', 'box'])
    const fill = card.params.find((p) => p.name === 'surfaceFill')!
    expect(fill.expected).toBe('#e8dfd3')
    expect(fill.actual).toBe('#0f172b')
    expect(fill.mismatch).toBe(true)
    expect(report.deltas.some((d) => d.property === 'surfaceFill')).toBe(true)
    // The same fill on both sides raises nothing.
    const same = diffManifests(mani([fieldEl({ surfaceFill: '#e8dfd3' })]), mani([fieldEl({ surfaceFill: '#e8dfd3' })]))
    expect(same.deltas).toEqual([])
  })
})
