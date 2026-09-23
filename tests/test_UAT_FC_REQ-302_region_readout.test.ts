/**
 * REQ-302 issue 7 — a NUMERIC readout of a ranked region's two crops.
 *
 * One measured round left 306.56 of 1043.47 ranked score (29.4%) unattributed:
 * four regions whose two sides carried the SAME text, whose boxes agreed to
 * within a quarter-pixel, and whose runs produced ZERO values-diff deltas. The
 * value gate saw nothing, the lead describer said "same text both sides", and
 * the only way left to tell a colour residual from a glyph-position one was to
 * open `region-N-ref.png` and look — the reconstruction-from-a-screenshot
 * DOC-19 forbids. So the round declined to guess and wrote down what would
 * separate it: "a per-channel histogram or a per-column mean over the two
 * crops, emitted as JSON by the region ranker."
 *
 * This is that readout, and these UATs measure the discrimination it exists to
 * provide — not that the numbers are computed, but that the two residual SHAPES
 * the round could not tell apart come out different.
 */
import { describe, expect, it } from 'vitest'
import {
  PROFILE_BUCKETS,
  regionReadout,
  type Raster,
  type RegionBox,
} from '../tools/generate/src/cli/perceptual-core'

/** A blank RGB raster. */
function raster(width: number, height: number, fill: [number, number, number]): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = fill[0]
    data[i * 3 + 1] = fill[1]
    data[i * 3 + 2] = fill[2]
  }
  return { data, width, height, channels: 3 }
}

/** Paint a vertical bar (a glyph stem) `x..x+w` across rows `y0..y1`. */
function stem(r: Raster, x: number, w: number, y0: number, y1: number, ink: [number, number, number]): void {
  for (let y = y0; y < y1; y++) {
    for (let px = x; px < x + w; px++) {
      const i = (y * r.width + px) * r.channels
      r.data[i] = ink[0]
      r.data[i + 1] = ink[1]
      r.data[i + 2] = ink[2]
    }
  }
}

const BOX: RegionBox = { x: 0, y: 0, w: 64, h: 32 }
const PAPER: [number, number, number] = [232, 223, 211]
const INK: [number, number, number] = [30, 41, 59]

/** Text rasterised at `xs`; the same text is the same stems in the same places. */
function textAt(xs: number[]): Raster {
  const r = raster(64, 32, PAPER)
  for (const x of xs) stem(r, x, 2, 12, 22, INK)
  return r
}

describe('REQ-302 — a region carries the numbers behind its two crops', () => {
  it('test_UAT_FC_REQ-302_a_glyph_shift_reads_as_position_not_colour', () => {
    // THE RESIDUAL THE ROUND COULD NOT ATTRIBUTE. The same glyphs, shifted by
    // the sub-pixel half-pixel issue 6 is about: identical ink, identical
    // paper, identical coverage — only the stems moved.
    const ref = textAt([8, 20, 32, 44])
    const actual = textAt([9, 21, 33, 45])
    const out = regionReadout(ref, actual, BOX)

    // Average colour is essentially untouched — the same ink over the same
    // paper in the same quantity. This is the half of the discriminator that
    // says "NOT a hue difference".
    for (const c of out.deltaRgb) expect(Math.abs(c)).toBeLessThan(2)

    // ...and the difference is concentrated at the stem edges rather than
    // spread over the crop. Peak column difference far exceeds the crop-wide
    // mean: that ratio is the signature of a positional residual.
    expect(out.meanAbsDiff).toBeGreaterThan(0)
    expect(out.peakColumnDiff).toBeGreaterThan(out.meanAbsDiff * 4)

    // Vertically it is confined to the text band, which is the corroborating
    // half: a colour shift would move every row.
    const band = out.rowDiff.slice(12, 22)
    const margin = [...out.rowDiff.slice(0, 12), ...out.rowDiff.slice(22)]
    expect(Math.max(...band)).toBeGreaterThan(0)
    expect(Math.max(...margin)).toBe(0)
  })

  it('test_UAT_FC_REQ-302_a_hue_difference_reads_as_colour_not_position', () => {
    // The OTHER shape the same four regions could have been: a paint axis the
    // comparator does not carry. Same glyphs in the same places, different
    // paper — so the whole crop moves together.
    const ref = textAt([8, 20, 32, 44])
    const actual = raster(64, 32, [212, 203, 191])
    for (const x of [8, 20, 32, 44]) stem(actual, x, 2, 12, 22, INK)
    const out = regionReadout(ref, actual, BOX)

    // A large SIGNED delta on every channel — the readout names the DIRECTION,
    // not just the magnitude, so "ours is 20 levels darker" is readable where
    // a region score can only say "these pixels differ".
    //
    // 20 levels of paper over the 1968 of 2048 pixels that are paper (the ink
    // stems are identical on both sides and contribute nothing) is -19.22, and
    // the readout is asserted against that rather than against a round number:
    // the mean is a measurement of the whole crop, which is the property that
    // makes it comparable between regions.
    const paperShare = (64 * 32 - 4 * 2 * 10) / (64 * 32)
    expect(out.deltaRgb[0]).toBeCloseTo(-20 * paperShare, 1)
    expect(out.deltaRgb.every((c) => c < -15)).toBe(true)

    // Broad and flat rather than peaky: unlike the shift above, the peak is
    // barely above the mean. The two tests together are the discrimination.
    expect(out.peakColumnDiff).toBeLessThan(out.meanAbsDiff * 2)

    // And it is NOT confined to the text band — every row differs.
    expect(Math.min(...out.rowDiff)).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-302_identical_crops_read_as_no_difference', () => {
    // The control. Without it, "always report a difference" passes both tests
    // above. Two identical crops must read as flatly zero on every field.
    const same = textAt([8, 20, 32, 44])
    const out = regionReadout(same, textAt([8, 20, 32, 44]), BOX)
    expect(out.deltaRgb).toEqual([0, 0, 0])
    expect(out.meanAbsDiff).toBe(0)
    expect(out.peakColumnDiff).toBe(0)
    expect(out.meanRgb.ref).toEqual(out.meanRgb.actual)
    expect(Math.max(...out.columnDiff, ...out.rowDiff)).toBe(0)
  })

  it('test_UAT_FC_REQ-302_a_wide_region_does_not_write_a_thousand_numbers', () => {
    // The profiles are bucketed so a full-width region stays readable in
    // `regions.json` — and the SHAPE has to survive the bucketing, which is
    // the only property being read off it. A 1280px-wide region with its
    // difference confined to one end must still show that concentration.
    const wide = raster(1280, 40, PAPER)
    const shifted = raster(1280, 40, PAPER)
    stem(wide, 100, 4, 10, 30, INK)
    stem(shifted, 104, 4, 10, 30, INK)
    const out = regionReadout(wide, shifted, { x: 0, y: 0, w: 1280, h: 40 })

    expect(out.columnDiff.length).toBeLessThanOrEqual(PROFILE_BUCKETS)
    expect(out.rowDiff.length).toBeLessThanOrEqual(PROFILE_BUCKETS)
    // Still peaky, and still peaky in the LEFT part of the crop where the
    // stems are — bucketing that flattened the profile would lose the answer.
    const peakAt = out.columnDiff.indexOf(Math.max(...out.columnDiff))
    expect(peakAt).toBeLessThan(out.columnDiff.length / 4)
    expect(out.peakColumnDiff).toBeGreaterThan(out.meanAbsDiff * 4)
  })
})
