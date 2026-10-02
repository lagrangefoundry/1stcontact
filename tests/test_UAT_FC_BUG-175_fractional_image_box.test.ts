/**
 * BUG-175 — an image box with a fractional size crashed the unpainted-image
 * check, so the gate died before writing `regions.json` or `gate.json` and
 * faelan.com and joyfulculinarycreations.com could never finish an iteration.
 *
 * `unpaintedImages` (BUG-161) hands manifest boxes — real capture geometry,
 * rounded to two decimals, e.g. faelan element 5 at height 205.70 — to
 * `extractRect`, which allocated `w·h·c` bytes at the fractional size and then
 * wrote its last row past the truncated buffer: `RangeError: offset is out of
 * bounds`.
 *
 * Evidence shape: the real `extractRect`, `unpaintedImages` and `cmdDiff` entry
 * points over synthetic rasters, plus one leg over the real faelan reference
 * bundle (gitignored — it runs in the main checkout and skips elsewhere). No
 * mocks, no browser: the actual side is handed in as a pre-shot PNG.
 */
import { afterAll, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdDiff, extractRect, unpaintedImages, type Raster } from '../tools/generate/src/cli'
import { flattenCapture } from '../tools/generate/src/cli/capture/values-diff'
import { readCapture, readMultiState } from '../tools/generate/src/cli/capture/bundle'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

const tmpDirs: string[] = []
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

type Fill = (x: number, y: number) => [number, number, number]

function raster(w: number, h: number, fill: Fill): Raster {
  const data = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      data.set(fill(x, y), i)
    }
  }
  return { data, width: w, height: h, channels: 3 }
}

/** A photograph's worth of texture: a deterministic pattern with real variance. */
const PHOTO: Fill = (x, y) => [(x * 7 + y * 13) % 256, (x * 3 + y * 29) % 256, (x * 17 + y * 5) % 256]
const FLAT: Fill = () => [122, 122, 122]

describe('BUG-175 — a fractional box is cropped, not thrown on', () => {
  it('test_UAT_FC_BUG-175_extractRect_snaps_a_fractional_box_to_whole_pixels', () => {
    // The filed geometry: faelan element 5 is 205.70px tall. Before the fix this
    // threw `offset is out of bounds` from the last row's `out.set`.
    const src = raster(400, 400, PHOTO)
    const { raster: out, box } = extractRect(src, { x: 10.4, y: 20.6, w: 100.3, h: 205.7 })

    for (const v of [box.x, box.y, box.w, box.h, out.width, out.height]) expect(Number.isInteger(v)).toBe(true)
    expect(out.data.length).toBe(out.width * out.height * out.channels)
    // Snapped outward: the crop covers every pixel the box touches.
    expect(box).toEqual({ x: 10, y: 20, w: 101, h: 207 })
    expect(box.x).toBeLessThanOrEqual(10.4)
    expect(box.x + box.w).toBeGreaterThanOrEqual(10.4 + 100.3)
    expect(box.y + box.h).toBeGreaterThanOrEqual(20.6 + 205.7)
    // And the pixels are the source's own, at the snapped origin.
    expect([...out.data.subarray(0, 3)]).toEqual(PHOTO(10, 20))
  })

  it('test_UAT_FC_BUG-175_a_whole_pixel_crop_is_byte_identical', () => {
    // The regression guard for extractRect's four callers: an integer box crops
    // exactly the pixels it did before, and an over-reaching one still clamps.
    const src = raster(64, 48, PHOTO)
    const { raster: out, box } = extractRect(src, { x: 5, y: 7, w: 20, h: 11 })
    expect(box).toEqual({ x: 5, y: 7, w: 20, h: 11 })
    const expected = raster(20, 11, (x, y) => PHOTO(x + 5, y + 7))
    expect(Buffer.from(out.data).equals(Buffer.from(expected.data))).toBe(true)

    const clamped = extractRect(src, { x: 50, y: 40, w: 30, h: 30 })
    expect(clamped.box).toEqual({ x: 50, y: 40, w: 14, h: 8 })
    expect(clamped.raster.data.length).toBe(14 * 8 * 3)
  })

  it('test_UAT_FC_BUG-175_unpaintedImages_measures_a_fractional_image_box', () => {
    // The crash site itself: a textured reference image at a fractional size,
    // left flat by the reproduction, is reported rather than killing the gate.
    const inBox = (x: number, y: number) => x >= 32 && x < 96 && y >= 32 && y < 98
    const ref = raster(128, 128, (x, y) => (inBox(x, y) ? PHOTO(x, y) : [255, 255, 255]))
    const actual = raster(128, 128, (x, y) => (inBox(x, y) ? FLAT(x, y) : [255, 255, 255]))
    const source = {
      viewport: { width: 128, height: 128 },
      elements: [{ src: 'assets/5.jpg', textless: true, box: { x: 32, y: 32, width: 64, height: 65.7 } }],
      sections: [],
    }

    const found = unpaintedImages(ref, actual, source, 1)

    expect(found.map((f) => f.handle)).toEqual(['assets/5.jpg'])
    expect(found[0].variance.ref).toBeGreaterThan(100)
  })

  it('test_UAT_FC_BUG-175_a_degenerate_box_costs_only_that_box', () => {
    // One bad record must not take down the gate: a non-finite or non-positive
    // box is skipped, and the good image beside it is still measured.
    const ref = raster(128, 128, PHOTO)
    const actual = raster(128, 128, FLAT)
    const source = {
      viewport: { width: 128, height: 128 },
      elements: [
        { src: 'assets/nan.jpg', textless: true, box: { x: 0, y: 0, width: Number.NaN, height: 40 } },
        { src: 'assets/inf.jpg', textless: true, box: { x: 0, y: 0, width: 40, height: Number.POSITIVE_INFINITY } },
        { src: 'assets/neg.jpg', textless: true, box: { x: 0, y: 0, width: -40, height: -40 } },
        { src: 'assets/good.jpg', textless: true, box: { x: 10, y: 10, width: 40.5, height: 40.5 } },
      ],
      sections: [{ index: 0, backgroundImageUrl: 'assets/zero.jpg', box: { x: 0, y: 0, width: 128, height: 0 } }],
    }

    expect(unpaintedImages(ref, actual, source, 1).map((f) => f.handle)).toEqual(['assets/good.jpg'])
  })
})

const FAELAN = path.resolve(__dirname, '../storage/references/faelan.com/index')
const FAELAN_PNG = path.join(FAELAN, 'screenshot.full.png')

describe('BUG-175 — the real faelan bundle', () => {
  it.skipIf(!existsSync(path.join(FAELAN, 'capture.json')) || !existsSync(FAELAN_PNG))(
    'test_UAT_FC_BUG-175_the_faelan_perceptual_diff_writes_its_regions',
    async () => {
      // The failed iteration's own path, browser-free: the reference manifest as
      // the gate builds it, and the reference screenshot handed in as the
      // actual side. Faelan carries the 205.70px image box that crashed it.
      const bundle = fsReferenceBundle(FAELAN)
      const expected = flattenCapture(await readCapture(bundle), await readMultiState(bundle))
      expect(expected.elements.some((e) => e.box && !Number.isInteger(e.box.height))).toBe(true)

      const out = mkdtempSync(path.join(tmpdir(), 'bug175-'))
      tmpDirs.push(out)
      const report = await cmdDiff({ ref: FAELAN, actualImagePath: FAELAN_PNG, out, nodeSources: { ref: expected } })

      expect(existsSync(path.join(out, 'regions.json'))).toBe(true)
      expect(Array.isArray(report.unpaintedImages)).toBe(true)
    },
  )
})
