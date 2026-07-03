import { afterAll, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdCrop,
  cmdDiff,
  computeDiff,
  decodeImage,
  writeRasterPng,
  type Raster,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-38 — the **perceptual-diff eye** ([[DOC-13]] §6, sibling of the
 * value-manifest diff [[REQ-31]]). Every UAT is browser-free: it drives the real
 * `computeDiff` / `cmdDiff` / `cmdCrop` entry points against synthetic PNG pairs
 * built with `sharp`, so the block-averaging math, connected-components region
 * derivation, score ranking, de-noise property, and crop-triptych emission are
 * all proven mechanically without a headless Chromium.
 */

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'req38-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

type Fill = (x: number, y: number) => [number, number, number]

/** Build an in-memory RGB raster from a per-pixel fill function. */
function raster(w: number, h: number, fill: Fill): Raster {
  const data = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y)
      const i = (y * w + x) * 3
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
  }
  return { data, width: w, height: h, channels: 3 }
}

/** Write a raster to a PNG file and return its path. */
async function writePng(dir: string, name: string, w: number, h: number, fill: Fill): Promise<string> {
  return writeRasterPng(raster(w, h, fill), path.join(dir, name))
}

const BLACK: Fill = () => [0, 0, 0]

describe('REQ-38 perceptual-diff — headline metrics', () => {
  it('test_UAT_FC_REQ-38_diff_reports_mean_and_bands', () => {
    // ref all black; actual black on the top half, gray(100) on the bottom half.
    // Over 64×64 the bottom 32 rows diff by 100 → mean 50; a 4-band profile is
    // [0, 0, 100, 100] (top→bottom).
    const ref = raster(64, 64, BLACK)
    const actual = raster(64, 64, (_x, y) => (y >= 32 ? [100, 100, 100] : [0, 0, 0]))
    const res = computeDiff(ref, actual, { blockPx: 16, bands: 4 })
    expect(res.meanDiff).toBeCloseTo(50, 5)
    expect(res.bands.map((b) => Math.round(b))).toEqual([0, 0, 100, 100])
    expect(res.dims).toEqual({ w: 64, h: 64 })
  })
})

describe('REQ-38 perceptual-diff — region derivation', () => {
  it('test_UAT_FC_REQ-38_regions_derived_by_connected_components', () => {
    // Two spatially separated hot blocks → exactly two connected components,
    // each a single-block bbox at the expected coordinates.
    const ref = raster(64, 64, BLACK)
    const actual = raster(64, 64, (x, y) => {
      const inA = x < 16 && y < 16
      const inB = x >= 48 && y >= 48
      return inA || inB ? [200, 200, 200] : [0, 0, 0]
    })
    const res = computeDiff(ref, actual, { blockPx: 16, blockThreshold: 24, padPx: 0 })
    expect(res.regions).toHaveLength(2)
    const boxes = res.regions.map((r) => r.bbox)
    expect(boxes).toContainEqual({ x: 0, y: 0, w: 16, h: 16 })
    expect(boxes).toContainEqual({ x: 48, y: 48, w: 16, h: 16 })
  })

  it('test_UAT_FC_REQ-38_regions_ranked_by_score', () => {
    // A large-faint patch (3 blocks × value 40 → Σ 120) must outrank a
    // small-intense patch (1 block × value 100 → Σ 100): score = sum-of-blocks
    // captures "large & faint" as strongly as "small & intense".
    const ref = raster(64, 64, BLACK)
    const actual = raster(64, 64, (x, y) => {
      const inLarge = x < 48 && y < 16 // blocks (0,0),(1,0),(2,0)
      const inSmall = x < 16 && y >= 48 // block (0,3)
      if (inLarge) return [40, 40, 40]
      if (inSmall) return [100, 100, 100]
      return [0, 0, 0]
    })
    const res = computeDiff(ref, actual, { blockPx: 16, blockThreshold: 24, padPx: 0 })
    expect(res.regions).toHaveLength(2)
    expect(res.regions[0].score).toBe(120)
    expect(res.regions[0].bbox).toEqual({ x: 0, y: 0, w: 48, h: 16 })
    expect(res.regions[1].score).toBe(100)
    expect(res.regions[0].score).toBeGreaterThan(res.regions[1].score)
  })

  it('test_UAT_FC_REQ-38_block_averaging_reduces_registration_noise', () => {
    // A wide-stripe pattern (period 16) shifted by 1px produces thin full-height
    // edge columns: many *pixels* exceed threshold, but block-averaging dilutes
    // every edge below threshold — so block-level over-threshold density is
    // strictly lower than pixel-level. That is the de-noise property.
    const actual = raster(64, 64, (x) => (((x >> 3) & 1) === 1 ? [200, 200, 200] : [0, 0, 0]))
    const ref = raster(64, 64, (x) => ((((x + 1) >> 3) & 1) === 1 ? [200, 200, 200] : [0, 0, 0]))
    const res = computeDiff(ref, actual, { blockPx: 16, pixelThreshold: 32, bands: 1 })
    expect(res.pctOverThreshold).toBeGreaterThan(0)
    expect(res.blockPctOverThreshold).toBeLessThan(res.pctOverThreshold)
    expect(res.blockPctOverThreshold).toBe(0)
  })
})

describe('REQ-38 perceptual-diff — crop primitive', () => {
  it('test_UAT_FC_REQ-38_crop_extracts_box', async () => {
    const dir = freshDir()
    const src = await writePng(dir, 'src.png', 100, 80, (x, y) => [x % 256, y % 256, 0])
    const out = path.join(dir, 'cropped.png')
    const { outFile } = await cmdCrop({ input: src, box: { x: 10, y: 20, w: 30, h: 25 }, out })
    expect(outFile).toBe(out)
    const cropped = await decodeImage(outFile)
    expect(cropped.width).toBe(30)
    expect(cropped.height).toBe(25)
  })
})

describe('REQ-38 perceptual-diff — end-to-end diff emission', () => {
  it('test_UAT_FC_REQ-38_diff_emits_region_crop_triptychs', async () => {
    const dir = freshDir()
    const refPng = await writePng(dir, 'ref.png', 64, 64, BLACK)
    const actualPng = await writePng(dir, 'actual.png', 64, 64, (x, y) =>
      x < 16 && y < 16 ? [200, 200, 200] : [0, 0, 0],
    )
    const outDir = path.join(dir, 'out')
    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: actualPng,
      out: outDir,
      tuning: { blockPx: 16, blockThreshold: 24, padPx: 0 },
    })

    // regions.json + both heatmaps written.
    expect(existsSync(path.join(outDir, 'regions.json'))).toBe(true)
    expect(existsSync(path.join(outDir, 'diff.png'))).toBe(true)
    expect(existsSync(path.join(outDir, 'diff-blocks.png'))).toBe(true)

    // The top region carries a ref/ours/diff crop triptych, all on disk.
    expect(report.regions.length).toBeGreaterThanOrEqual(1)
    const top = report.regions[0]
    expect(existsSync(top.crops.ref)).toBe(true)
    expect(existsSync(top.crops.actual)).toBe(true)
    expect(existsSync(top.crops.diff)).toBe(true)
  })
})
