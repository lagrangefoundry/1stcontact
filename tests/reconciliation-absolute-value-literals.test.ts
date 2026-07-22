/**
 * Reconciliation UAT — story-c490f1cf "Absolute-or-overlay values: every colour,
 * length, and radius dial accepts a literal or a named overlay" (STORY-80).
 *
 * The absolute base of the absolute-or-overlay model is re-homed in L1 leaf axes:
 * each leaf carries the concrete value directly as a typed literal, the envelope
 * validator guarantees it is well-formed and in range, and the single safe emitter
 * carries it through verbatim.
 *
 *   AC-716  L1 leaf axes carry the absolute (literal) value, validated by the
 *           envelope: hex colour + finite px length/geometry/radius emitted
 *           verbatim; a malformed literal (non-hex colour, non-finite / out-of-range
 *           number) is rejected by the envelope validator.
 *
 * Validator + emitter only — engine-free, runs everywhere.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 375, 768, 1024, 1280, 1440]

// ── AC-716: L1 leaf axes carry the absolute literal, validated by the envelope ──

describe('AC-716 L1 leaf axes carry the absolute (literal) colour / length / radius value', () => {
  it('test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected', () => {
    // A document whose leaf axes set distinct absolute colour, length, and radius
    // literals — every hex colour form (#rgb / #rrggbb / #rrggbbaa) and finite px
    // numbers for font-size, letter-spacing, line-height, and corner radius.
    const doc: L1Document = {
      widths: WIDTHS,
      background: '#11223344',
      root: {
        kind: 'box',
        axes: { surfaceFill: '#0a0b0c', borderRadiusPx: 12 },
        sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 400 } },
        children: [
          {
            kind: 'text',
            text: 'Absolute',
            axes: {
              color: '#f0a',
              fontFamily: 'Georgia',
              fontSizePx: 42,
              fontWeight: 700,
              lineHeightPx: 50,
              letterSpacingPx: 3,
            },
          },
        ],
      },
    }

    // 1. The literal document is accepted by the envelope validator.
    expect(validateL1(doc).ok).toBe(true)

    // 2. Every literal is carried through the safe emitter verbatim — no rounding,
    //    no palette indirection, no re-derivation. The exact authored strings and
    //    numbers reappear in the emitted CSS.
    const { css } = renderL1Document(doc)
    expect(css).toContain('color: #f0a') //         short hex, verbatim
    expect(css).toContain('background-color: #0a0b0c') // 6-digit hex, verbatim
    expect(css).toContain('body { background-color: #11223344 }') // 8-digit hex, verbatim
    expect(css).toContain('font-size: 42px') //     length literal, verbatim
    expect(css).toContain('line-height: 50px') //   length literal, verbatim
    expect(css).toContain('letter-spacing: 3px') // length literal, verbatim
    expect(css).toContain('border-radius: 12px') // radius literal, verbatim

    // 3. A malformed literal in the same axes is rejected by the envelope validator.
    //    Each variant below violates exactly one literal well-formedness rule and
    //    must be rejected — the safe substrate carries only well-formed literals.
    const rejected: Record<string, unknown> = {
      // Colour must be hex — an rgb() function form is not a literal hex value.
      nonHexColourRgb: {
        widths: WIDTHS,
        root: { kind: 'text', text: 'x', axes: { color: 'rgb(255, 0, 170)' } },
      },
      // Colour must be hex — a CSS keyword is not a hex literal.
      nonHexColourKeyword: {
        widths: WIDTHS,
        root: { kind: 'text', text: 'x', axes: { color: 'magenta' } },
      },
      // Colour must be hex — a url() surface fill is not a hex literal.
      nonHexSurfaceFillUrl: {
        widths: WIDTHS,
        root: { kind: 'box', axes: { surfaceFill: 'url(evil.png)' }, children: [] },
      },
      // A length literal must be finite.
      nonFiniteLength: {
        widths: WIDTHS,
        root: { kind: 'text', text: 'x', axes: { fontSizePx: Number.NaN } },
      },
      // A font-size length literal must be within the envelope range [1, 400].
      fontSizeOutOfRange: {
        widths: WIDTHS,
        root: { kind: 'text', text: 'x', axes: { fontSizePx: 5000 } },
      },
      // A radius literal must be non-negative (a corner cannot round inward).
      negativeRadius: {
        widths: WIDTHS,
        root: { kind: 'box', axes: { borderRadiusPx: -8 }, children: [] },
      },
      // A geometry coordinate literal must be within the envelope range (±100k).
      geometryLengthOutOfRange: {
        widths: WIDTHS,
        root: {
          kind: 'text',
          text: 'x',
          geometry: { keyframes: [{ at: 320, x: 200000, y: 0, width: 100 }] },
        },
      },
    }

    for (const [name, bad] of Object.entries(rejected)) {
      expect(validateL1(bad).ok, `${name} must be rejected by the envelope`).toBe(false)
    }
  })
})
