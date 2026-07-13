import { describe, expect, it } from 'vitest'
import { diffManifests, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'

/**
 * UATs for REQ-58 (T1) — the tight rendered-text-box axis.
 *
 * The gigabytealchemy re-import surfaced a class of delta invisible to the
 * mechanical gate: hero text that renders visibly *too big* while `values-diff`
 * reports `fontSizePx` (and weight, family, letter-spacing) all matching. The
 * reference and our render use the same font stack through the same engine, so a
 * real difference lives only in the *rendered glyph extent* — which the capture
 * did not measure (it stored the element box: for a block `<p>` that is the
 * container width, not the glyphs). And pixel-thresholding a glyph over a
 * photographic background is unreliable (DOC-19).
 *
 * T1 captures a tight `renderedTextBox` (Range.getBoundingClientRect over the
 * run's contents) for the reference AND our render, and `values-diff` compares it
 * as a RATIO of the glyph extent (default 1.2%). So "renders too big" becomes a
 * first-class, visible delta even when the computed font axes match.
 *
 * These drive the diff engine directly — the same code path the CLI runs. Widths
 * are the gigabytealchemy measurements: heading 503→540 (7%), eyebrow 320→326
 * (2%), subhead 745→742 (0.4%, sub-pixel noise).
 */

const rbox = (w: number, h: number) => ({ x: 0, y: 0, width: w, height: h })
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })
const hasDelta = (deltas: { text: string; property: string }[], sub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(sub) && d.property === property)
const hasProp = (deltas: { property: string }[], property: string): boolean =>
  deltas.some((d) => d.property === property)

describe('REQ-58 T1 — rendered text box surfaces size deltas the computed values miss', () => {
  it('test_UAT_FC_REQ-58_rendered_text_box_fires_when_fontsize_matches', () => {
    // The "Tools for clarity" case: identical fontSizePx/weight/family, but the
    // glyphs render 7% wider — invisible to every computed axis, visible here.
    const ref = mani('ref', [
      el('Tools for clarity', { fontSizePx: 24, fontWeight: 300, renderedTextBox: rbox(503, 28) }),
    ])
    const actual = mani('a', [
      el('Tools for clarity', { fontSizePx: 24, fontWeight: 300, renderedTextBox: rbox(540, 28) }),
    ])
    const { deltas } = diffManifests(ref, actual)
    // computed font-size is NOT a delta (it genuinely matches) …
    expect(hasDelta(deltas, 'Tools for clarity', 'fontSizePx')).toBe(false)
    // … but the rendered extent IS.
    expect(hasDelta(deltas, 'Tools for clarity', 'renderedTextBox')).toBe(true)
  })

  it('test_UAT_FC_REQ-58_rendered_text_box_ratio_tolerance', () => {
    // A ~2% short-label difference fires (the eyebrow); a ~0.4% long-line
    // difference does not (sub-pixel Range rounding on the subhead). A fixed-px
    // band could not separate these — the extent scales with text length.
    const ref = mani('ref', [
      el('Intentional Software', { renderedTextBox: rbox(320, 43) }),
      el('We are a software studio', { renderedTextBox: rbox(745, 80) }),
    ])
    const actual = mani('a', [
      el('Intentional Software', { renderedTextBox: rbox(326, 41) }), // +1.9%
      el('We are a software studio', { renderedTextBox: rbox(742, 79) }), // -0.4%
    ])
    const { deltas } = diffManifests(ref, actual)
    expect(hasDelta(deltas, 'Intentional Software', 'renderedTextBox')).toBe(true)
    expect(hasDelta(deltas, 'We are a software studio', 'renderedTextBox')).toBe(false)
  })

  it('test_UAT_FC_REQ-58_rendered_text_box_absent_no_delta', () => {
    // Pre-T1 bundles (or an unmeasurable run) carry no renderedTextBox on one or
    // both sides — the comparison is skipped, never a false delta.
    const ref = mani('ref', [el('Label', { renderedTextBox: rbox(200, 24) })])
    const actualNoBox = mani('a', [el('Label')]) // repro side lacks the field
    expect(hasProp(diffManifests(ref, actualNoBox).deltas, 'renderedTextBox')).toBe(false)
    const refNoBox = mani('ref', [el('Label')])
    const actualHasBox = mani('a', [el('Label', { renderedTextBox: rbox(240, 24) })])
    expect(hasProp(diffManifests(refNoBox, actualHasBox).deltas, 'renderedTextBox')).toBe(false)
  })

  it('test_UAT_FC_REQ-58_rendered_text_box_tolerant_flag_loosens', () => {
    // Under --tolerant the ratio band widens (0.03), so a 2% label difference that
    // fires by default is absorbed — the escape hatch for an accepted font gap.
    const ref = mani('ref', [el('Eyebrow', { renderedTextBox: rbox(320, 43) })])
    const actual = mani('a', [el('Eyebrow', { renderedTextBox: rbox(326, 43) })]) // +1.9%
    expect(hasProp(diffManifests(ref, actual).deltas, 'renderedTextBox')).toBe(true)
    expect(hasProp(diffManifests(ref, actual, { tolerant: true }).deltas, 'renderedTextBox')).toBe(false)
  })
})
