/**
 * Reconciliation UAT — story-3569e1a4 / STORY-81 "Responsive dials: length
 * parameters vary per breakpoint and the nav collapse point is configurable"
 * (reconciliation upgrade, AC-717).
 *
 * The responsive-across-widths capability that was once delivered by per-breakpoint
 * module dials ({ base, sm?, md?, lg?, xl? }) is now carried by the **L1 layout
 * substrate**: a node declares its geometry as an ascending-by-width keyframe track
 * with a per-segment `interpolate|snap` flag, and the renderer compiles that to
 * media-queried CSS so the published width varies per viewport width.
 *
 *   AC-717  per-viewport value variation is delivered by L1 geometry keyframes
 *           (per-width values + interpolate|snap segments) rather than by
 *           per-breakpoint module dials
 *
 * This probe is engine-free (it inspects the emitted CSS — the concrete observable
 * form of "the published page varies that geometry per viewport width") and runs
 * everywhere.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 375, 768, 1024, 1280, 1440]

/**
 * A single text node whose *width* keyframe track spans the ladder with two
 * segments: the lower band [320,768] is `interpolate` (width should vary
 * continuously with the viewport) and the upper band [768,1280] is `snap` (width
 * should hold the 768 keyframe's value, then jump at 1280). This is the same
 * per-viewport-width adaptation the deleted module length-dials expressed, now
 * re-homed in one typed substrate.
 */
function responsiveDoc(): L1Document {
  return {
    widths: WIDTHS,
    root: {
      kind: 'text',
      text: 'responsive band',
      axes: { color: '#111111', fontSizePx: 24, textAlign: 'center' },
      geometry: {
        keyframes: [
          { at: 320, x: 24, y: 100, width: 300 },
          { at: 768, x: 24, y: 100, width: 600 },
          { at: 1280, x: 24, y: 100, width: 900 },
        ],
        segments: ['interpolate', 'snap'],
      },
    },
  }
}

/**
 * The text between one `@media` marker and the next in the serialized CSS —
 * i.e. the declarations that apply within a single viewport band.
 */
function band(css: string, minWidth: number): string {
  return css.split('@media').find((b) => b.includes(`(min-width: ${minWidth}px)`)) ?? ''
}

/** Evaluate the emitted linear-interpolation formula at a concrete viewport width. */
function lerp(v1: number, w1: number, v2: number, w2: number, vw: number): number {
  return v1 + ((v2 - v1) * (vw - w1)) / (w2 - w1)
}

describe('AC-717 per-viewport value variation is delivered by L1 geometry keyframes', () => {
  it('test_UAT_AC717_per_viewport_width_varies_via_interpolate_and_snap_keyframes', () => {
    const doc = responsiveDoc()

    // The document is a well-formed L1 tree (the substrate is the real spec here,
    // not a per-breakpoint module dial bag).
    expect(validateL1(doc).ok).toBe(true)

    const { css } = renderL1Document(doc)

    // Geometry is positioned absolutely with the smallest keyframe held as the
    // base (covers below-ladder widths).
    expect(css).toMatch(/position: absolute/)
    // The base (bare, non-media) rule holds the smallest keyframe's width.
    const baseRule = css.split('@media')[0]
    expect(baseRule).toContain('width: 300px') // base = @320 keyframe

    // ── Interpolate band [320,768): width varies continuously with the viewport ──
    const interpBand = band(css, 320)
    // The width declaration is viewport-driven (a calc() over 100vw), so it is a
    // continuous function of screen width, not a fixed value.
    expect(interpBand).toContain('width: calc(')
    expect(interpBand).toContain('100vw')
    // The exact linear track between the two keyframe widths (300 → 600 over the
    // [320,768] band; dv=300, dw=448).
    expect(interpBand).toContain('width: calc(300px + (300 * (100vw - 320px) / 448))')

    // The emitted formula, evaluated at representative widths, is continuous and
    // hits the authored endpoints: 300px @320, 600px @768, strictly between mid-band.
    expect(lerp(300, 320, 600, 768, 320)).toBeCloseTo(300)
    expect(lerp(300, 320, 600, 768, 768)).toBeCloseTo(600)
    const mid = lerp(300, 320, 600, 768, 544)
    expect(mid).toBeGreaterThan(300)
    expect(mid).toBeLessThan(600)

    // ── Snap band [768,1280): width holds the lower keyframe, then jumps ─────────
    const snapBand = band(css, 768)
    // Held constant across the whole band — no viewport-driven interpolation.
    expect(snapBand).toContain('width: 600px')
    expect(snapBand).not.toContain('calc(')
    expect(snapBand).not.toContain('100vw')

    // At the upper keyframe the value jumps to the 1280 keyframe's width.
    const jumpBand = band(css, 1280)
    expect(jumpBand).toContain('width: 900px')
    expect(jumpBand).not.toContain('calc(') // a discrete jump, not a continuous ramp
  })
})
