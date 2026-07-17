import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdDiff,
  writeRasterPng,
  ladderScreenshotPath,
  VIEWPORTS,
  type Raster,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-61 — `1c diff --size mobile|tablet|desktop`.
 *
 * A size-aware pixel diff shoots our reproduction at the chosen viewport and must
 * pair it against the SAME-width reference screenshot (screenshot-<width>.png),
 * not the single desktop shot. A bundle without the per-width screenshot fails
 * loudly rather than silently comparing across widths. Offline: the actual side
 * is a pre-shot PNG (`actualImagePath`), so no browser is launched.
 */

const tmpDirs: string[] = []
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A flat solid-grey raster of the given size. */
function solid(w: number, h: number, g: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(g)
  return { data, width: w, height: h, channels: 3 }
}

describe('REQ-61 — diff --size pairs against the same-width reference screenshot', () => {
  it('test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot', async () => {
    const bundle = mkdtempSync(path.join(tmpdir(), 'req61-pxbundle-'))
    tmpDirs.push(bundle)
    // The bundle carries a per-width tablet screenshot plus the legacy desktop one.
    await writeRasterPng(solid(64, 64, 10), ladderScreenshotPath(bundle, VIEWPORTS.tablet.width))
    await writeRasterPng(solid(64, 64, 200), path.join(bundle, 'screenshot.full.png'))

    const work = mkdtempSync(path.join(tmpdir(), 'req61-pxwork-'))
    tmpDirs.push(work)
    const actual = path.join(work, 'actual.png')
    await writeRasterPng(solid(64, 64, 10), actual)
    const out = path.join(work, 'out')

    const report = await cmdDiff({ ref: bundle, actualImagePath: actual, size: 'tablet', out })
    // The reference used is the tablet per-width screenshot, not screenshot.full.png.
    expect(report.ref).toBe(ladderScreenshotPath(bundle, VIEWPORTS.tablet.width))
    // Actual (grey 10) matches the tablet ref (grey 10) → clean; had it fallen back
    // to the desktop shot (grey 200) the mean would be ~190.
    expect(report.meanDiff).toBeCloseTo(0, 5)
  })

  it('test_UAT_FC_REQ-61_pixel_size_fails_loudly_without_width_screenshot', async () => {
    // A bundle with only the desktop shot (predates per-viewport screenshots) must
    // NOT silently diff a mobile render against desktop — it fails with re-capture guidance.
    const bundle = mkdtempSync(path.join(tmpdir(), 'req61-pxstale-'))
    tmpDirs.push(bundle)
    await writeRasterPng(solid(64, 64, 200), path.join(bundle, 'screenshot.full.png'))
    const work = mkdtempSync(path.join(tmpdir(), 'req61-pxwork2-'))
    tmpDirs.push(work)
    const actual = path.join(work, 'actual.png')
    await writeRasterPng(solid(64, 64, 10), actual)

    await expect(
      cmdDiff({ ref: bundle, actualImagePath: actual, size: 'mobile' }),
    ).rejects.toThrow(new RegExp(`screenshot-${VIEWPORTS.mobile.width}\\.png`))
  })

  it('test_UAT_FC_REQ-61_pixel_no_size_uses_default_full_screenshot', async () => {
    // Absent --size, the default screenshot.full.png path is unchanged.
    const bundle = mkdtempSync(path.join(tmpdir(), 'req61-pxdefault-'))
    tmpDirs.push(bundle)
    await writeRasterPng(solid(64, 64, 200), path.join(bundle, 'screenshot.full.png'))
    const work = mkdtempSync(path.join(tmpdir(), 'req61-pxwork3-'))
    tmpDirs.push(work)
    const actual = path.join(work, 'actual.png')
    await writeRasterPng(solid(64, 64, 200), actual)
    const out = path.join(work, 'out')

    const report = await cmdDiff({ ref: bundle, actualImagePath: actual, out })
    expect(report.ref).toBe(path.join(bundle, 'screenshot.full.png'))
    expect(report.meanDiff).toBeCloseTo(0, 5)
  })
})
