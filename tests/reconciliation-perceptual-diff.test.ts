import { afterAll, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdCrop,
  cmdDiff,
  cmdNew,
  computeDiff,
  decodeImage,
  run,
  writeRasterPng,
  type BrowserDriver,
  type CapturedResponse,
  type Raster,
  type Viewport,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-1570884a — the **perceptual-diff eye** (`1c diff`)
 * and the **image crop** (`1c crop`) vision tooling (REQ-38, [[DOC-13]] §6,
 * sibling of the value-manifest diff [[REQ-31]]). One UAT per acceptance
 * criterion (AC-536 … AC-544), each driving a real entry point:
 *   - the exported CLI dispatcher `run(argv)` for the command-surface ACs
 *     (exit status, `--json`, usage errors, the `1c crop` CLI);
 *   - the `cmdDiff` / `cmdCrop` command APIs for the render/offline diff ACs
 *     (an injected fake {@link BrowserDriver} stands in for a real Chromium);
 *   - the pure `computeDiff` core for the region-derivation / de-noise ACs.
 *
 * These prove behavior that ALREADY EXISTS: the ACs are the spec, the code is
 * evidence of current state. Every assertion is browser-free — the slug render
 * path (AC-536) injects a fake driver that returns a real PNG, so the
 * render→serve→shoot seam is exercised without a headless browser.
 */

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'recon-pdiff-'))
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
/** A single hot patch in the top-left 16×16 block, black elsewhere. */
const TOP_LEFT_PATCH: Fill = (x, y) => (x < 16 && y < 16 ? [200, 200, 200] : [0, 0, 0])

/**
 * A fake driver that returns a fixed, *real* PNG (so `cmdDiff` can decode the
 * "shot" it produces). Enough to exercise the render→serve→shoot seam without a
 * browser.
 */
class PngDriver implements BrowserDriver {
  navigatedUrl?: string
  constructor(private readonly png: Uint8Array) {}
  async navigate(url: string): Promise<void> {
    this.navigatedUrl = url
  }
  async screenshot(_viewport?: Viewport): Promise<Uint8Array> {
    return this.png
  }
  async query<T = unknown>(): Promise<T> {
    return null as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  async content(): Promise<string> {
    return ''
  }
  async close(): Promise<void> {}
}

/** Run the CLI dispatcher, capturing stdout/stderr and the resulting exit code. */
async function runCli(argv: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const out: string[] = []
  const err: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void out.push(String(m)))
  const errSpy = vi.spyOn(console, 'error').mockImplementation((m?: unknown) => void err.push(String(m)))
  const prev = process.exitCode
  process.exitCode = 0
  try {
    await run(argv)
    return { stdout: out.join('\n'), stderr: err.join('\n'), exitCode: Number(process.exitCode ?? 0) }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
    process.exitCode = prev
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('story-1570884a — 1c diff / 1c crop (reconciliation UATs)', () => {
  // AC-536 — `1c diff <slug> --ref <bundleDir|refPng>` renders → serves →
  // screenshots the draft, diffs it against the reference, and writes both
  // heatmaps + regions.json. A bundle dir resolves to its screenshot.full.png; a
  // bare PNG is used directly. Omitting --ref is a usage error (non-zero exit).
  it(
    'test_UAT_AC536_diff_shoots_draft_and_emits_artifacts',
    async () => {
      const cwd = freshDir()
      cmdNew('acme', { cwd })

      // The reproduction side comes from an injected fake driver returning a real
      // PNG with a hot patch; the reference is all-black, so a region is found.
      const shotFile = await writePng(freshDir(), 'shot.png', 64, 64, TOP_LEFT_PATCH)
      const shotBytes = new Uint8Array(readFileSync(shotFile))
      const factory = async (): Promise<BrowserDriver> => new PngDriver(shotBytes)
      const tuning = { blockPx: 16, blockThreshold: 24, padPx: 0 }

      // --ref as a capture bundle directory → its screenshot.full.png is the ref.
      const bundleDir = path.join(freshDir(), 'bundle')
      const bundleShot = path.join(bundleDir, 'screenshot.full.png')
      await writeRasterPng(raster(64, 64, BLACK), bundleShot)
      const outBundle = path.join(cwd, 'out-bundle')
      const bundleReport = await cmdDiff({
        cwd,
        slug: 'acme',
        ref: bundleDir,
        out: outBundle,
        driverFactory: factory,
        tuning,
      })
      expect(existsSync(path.join(outBundle, 'diff.png'))).toBe(true)
      expect(existsSync(path.join(outBundle, 'diff-blocks.png'))).toBe(true)
      expect(existsSync(path.join(outBundle, 'regions.json'))).toBe(true)
      // The bundle dir resolved to its full-page screenshot.
      expect(bundleReport.ref).toBe(bundleShot)
      expect(typeof bundleReport.actual).toBe('string')
      expect(bundleReport.regions.length).toBeGreaterThanOrEqual(1)

      // --ref as a bare PNG → used directly as the reference.
      const refPng = await writePng(freshDir(), 'ref.png', 64, 64, BLACK)
      const outPng = path.join(cwd, 'out-png')
      const pngReport = await cmdDiff({
        cwd,
        slug: 'acme',
        ref: refPng,
        out: outPng,
        driverFactory: factory,
        tuning,
      })
      expect(existsSync(path.join(outPng, 'diff.png'))).toBe(true)
      expect(existsSync(path.join(outPng, 'diff-blocks.png'))).toBe(true)
      expect(existsSync(path.join(outPng, 'regions.json'))).toBe(true)
      expect(pngReport.ref).toBe(refPng)

      // Omitting --ref → usage error and a non-zero exit, without a browser.
      const missing = await runCli(['diff', 'acme'])
      expect(missing.exitCode).not.toBe(0)
      expect(missing.stderr).toMatch(/--ref/)
    },
    60000,
  )

  // AC-537 — `1c diff --ref <refPng> --actual <ourPng>` diffs the two supplied
  // images offline: no slug, no browser. The report's `actual` is the supplied
  // PNG and the same artifacts are produced as the render path.
  it('test_UAT_AC537_offline_actual_skips_the_browser', async () => {
    const dir = freshDir()
    const refPng = await writePng(dir, 'ref.png', 64, 64, BLACK)
    const ourPng = await writePng(dir, 'ours.png', 64, 64, TOP_LEFT_PATCH)
    const outDir = path.join(dir, 'out')

    // A driver factory that would throw if the browser seam were ever entered —
    // proving the pre-shot `--actual` short-circuits it entirely.
    const throwingFactory = async (): Promise<BrowserDriver> => {
      throw new Error('browser must not be launched when --actual is supplied')
    }

    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: ourPng,
      out: outDir,
      driverFactory: throwingFactory,
      tuning: { blockPx: 16, blockThreshold: 24, padPx: 0 },
    })

    // Artifacts produced identically to the render path...
    expect(existsSync(path.join(outDir, 'diff.png'))).toBe(true)
    expect(existsSync(path.join(outDir, 'diff-blocks.png'))).toBe(true)
    expect(existsSync(path.join(outDir, 'regions.json'))).toBe(true)
    // ...and the actual side is exactly the supplied PNG (no screenshot step).
    expect(report.actual).toBe(ourPng)
    expect(report.regions.length).toBeGreaterThanOrEqual(1)
  })

  // AC-538 — when the reference and reproduction differ in size, the diff is
  // computed over a common top-left-anchored rectangle whose dimensions are the
  // per-axis minimum, and the report's `dims` reflect that rectangle.
  it('test_UAT_AC538_mismatched_dims_cropped_to_common_rectangle', async () => {
    const dir = freshDir()
    const refPng = await writePng(dir, 'ref.png', 80, 80, BLACK)
    const actPng = await writePng(dir, 'act.png', 60, 100, BLACK)
    const outDir = path.join(dir, 'out')

    // Differing widths (80 vs 60) and heights (80 vs 100) must not error.
    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: actPng,
      out: outDir,
      tuning: { blockPx: 16 },
    })
    expect(report.dims).toEqual({ w: 60, h: 80 })
  })

  // AC-539 — the diff writes a per-pixel heatmap and a block-averaged heatmap,
  // both at the cropped dimensions; the block-averaging suppresses sub-pixel
  // registration jitter (a 1px shift lands above threshold per-pixel but below
  // threshold once block-averaged).
  it('test_UAT_AC539_emits_per_pixel_and_block_averaged_heatmaps', async () => {
    const dir = freshDir()
    const refPng = await writePng(dir, 'ref.png', 64, 64, BLACK)
    const actPng = await writePng(dir, 'act.png', 64, 64, TOP_LEFT_PATCH)
    const outDir = path.join(dir, 'out')
    await cmdDiff({ ref: refPng, actualImagePath: actPng, out: outDir, tuning: { blockPx: 16 } })

    // Both heatmaps written at the cropped dimensions (64×64).
    const perPixel = await decodeImage(path.join(outDir, 'diff.png'))
    expect([perPixel.width, perPixel.height]).toEqual([64, 64])
    const blockHeat = await decodeImage(path.join(outDir, 'diff-blocks.png'))
    expect([blockHeat.width, blockHeat.height]).toEqual([64, 64])

    // De-noise property: an image vs a 1px-shifted copy of itself. Many *pixels*
    // exceed threshold at the shifted edges, but block-averaging dilutes every
    // edge below threshold — the concrete, code-realized form of "block-averaged
    // suppresses jitter that the raw per-pixel diff does not".
    const actual = raster(64, 64, (x) => (((x >> 3) & 1) === 1 ? [200, 200, 200] : [0, 0, 0]))
    const ref = raster(64, 64, (x) => ((((x + 1) >> 3) & 1) === 1 ? [200, 200, 200] : [0, 0, 0]))
    const res = computeDiff(ref, actual, { blockPx: 16, pixelThreshold: 32, bands: 1 })
    expect(res.pctOverThreshold).toBeGreaterThan(0)
    expect(res.blockPctOverThreshold).toBeLessThan(res.pctOverThreshold)
  })

  // AC-540 — human (non-`--json`) output includes the overall mean per-pixel diff
  // (0–255), the percentage of pixels over threshold, the region count, and a
  // horizontal-band profile (one mean per band, top→bottom).
  it('test_UAT_AC540_summary_reports_mean_pct_and_band_profile', async () => {
    const dir = freshDir()
    // ref all black; actual gray(100) over the bottom half → mean 50, half the
    // pixels over threshold, a 4-band profile of [0, 0, 100, 100], one region.
    const refPng = await writePng(dir, 'ref.png', 64, 64, BLACK)
    const actPng = await writePng(dir, 'act.png', 64, 64, (_x, y) => (y >= 32 ? [100, 100, 100] : [0, 0, 0]))
    const outDir = path.join(dir, 'out')

    const res = await runCli([
      'diff', '--ref', refPng, '--actual', actPng, '--out', outDir, '--block', '16', '--bands', '4',
    ])
    expect(res.stdout).toContain('mean 50.00 / 255')
    expect(res.stdout).toMatch(/50\.0% pixels over threshold/)
    expect(res.stdout).toMatch(/\b1 region\(s\)/)
    expect(res.stdout).toContain('bands: 0.0 0.0 100.0 100.0')
    expect(res.exitCode).not.toBe(0)
  })

  // AC-541 — regions are derived by 4-connected flood-fill over block cells above
  // the block threshold, scored by summed block-average diff, ranked descending,
  // capped at top-N; the top-level report carries the documented fields.
  it('test_UAT_AC541_regions_by_connected_components_scored_by_summed_diff', async () => {
    // Two spatially separated hot blocks → exactly two single-block components.
    const ref = raster(64, 64, BLACK)
    const twoPatches = raster(64, 64, (x, y) => {
      const inA = x < 16 && y < 16
      const inB = x >= 48 && y >= 48
      return inA || inB ? [200, 200, 200] : [0, 0, 0]
    })
    const res = computeDiff(ref, twoPatches, { blockPx: 16, blockThreshold: 24, padPx: 0 })
    expect(res.regions).toHaveLength(2)
    const boxes = res.regions.map((r) => r.bbox)
    expect(boxes).toContainEqual({ x: 0, y: 0, w: 16, h: 16 })
    expect(boxes).toContainEqual({ x: 48, y: 48, w: 16, h: 16 })
    for (const r of res.regions) {
      expect(Number.isInteger(r.id)).toBe(true)
      expect(r.bbox).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
        w: expect.any(Number),
        h: expect.any(Number),
      })
      expect(typeof r.score).toBe('number')
      expect(typeof r.meanDiff).toBe('number')
      expect(r.area).toBe(r.bbox.w * r.bbox.h)
    }

    // Ranking: a large-faint patch (3 blocks × 40 → Σ 120) must outrank a
    // small-intense patch (1 block × 100 → Σ 100). Summed-diff — not peak
    // intensity or area alone — governs rank.
    const ranked = computeDiff(
      raster(64, 64, BLACK),
      raster(64, 64, (x, y) => {
        const large = x < 48 && y < 16 // blocks (0,0),(1,0),(2,0)
        const small = x < 16 && y >= 48 // block (0,3)
        if (large) return [40, 40, 40]
        if (small) return [100, 100, 100]
        return [0, 0, 0]
      }),
      { blockPx: 16, blockThreshold: 24, padPx: 0 },
    )
    expect(ranked.regions).toHaveLength(2)
    expect(ranked.regions[0].score).toBe(120)
    expect(ranked.regions[1].score).toBe(100)
    expect(ranked.regions[0].score).toBeGreaterThan(ranked.regions[1].score)
    expect(ranked.regions[0].bbox).toEqual({ x: 0, y: 0, w: 48, h: 16 })

    // The full report (from cmdDiff) carries the documented top-level fields.
    const dir = freshDir()
    const refPng = await writePng(dir, 'ref.png', 64, 64, BLACK)
    const actPng = await writePng(dir, 'act.png', 64, 64, TOP_LEFT_PATCH)
    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: actPng,
      out: path.join(dir, 'out'),
      tuning: { blockPx: 16, blockThreshold: 24, padPx: 0 },
    })
    for (const key of ['ref', 'actual', 'dims', 'blockPx', 'meanDiff', 'pctOverThreshold', 'bands', 'regions']) {
      expect(report).toHaveProperty(key)
    }
  })

  // AC-542 — for each ranked region, three crops (ref / ours / diff) are written
  // at the region's bbox, and the region entry records their paths under
  // `crops` ({ ref, actual, diff }).
  it('test_UAT_AC542_writes_ref_ours_diff_crop_triptych_per_region', async () => {
    const dir = freshDir()
    const refPng = await writePng(dir, 'ref.png', 64, 64, BLACK)
    const actPng = await writePng(dir, 'act.png', 64, 64, TOP_LEFT_PATCH)
    const outDir = path.join(dir, 'out')
    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: actPng,
      out: outDir,
      tuning: { blockPx: 16, blockThreshold: 24, padPx: 0 },
    })

    expect(report.regions.length).toBeGreaterThanOrEqual(1)
    for (const region of report.regions) {
      expect(region.crops).toEqual({
        ref: expect.any(String),
        actual: expect.any(String),
        diff: expect.any(String),
      })
      expect(existsSync(region.crops.ref)).toBe(true)
      expect(existsSync(region.crops.actual)).toBe(true)
      expect(existsSync(region.crops.diff)).toBe(true)
      // Each crop is written at the region's bbox dimensions.
      const [refCrop, oursCrop, diffCrop] = await Promise.all([
        decodeImage(region.crops.ref),
        decodeImage(region.crops.actual),
        decodeImage(region.crops.diff),
      ])
      expect([refCrop.width, refCrop.height]).toEqual([region.bbox.w, region.bbox.h])
      expect([oursCrop.width, oursCrop.height]).toEqual([region.bbox.w, region.bbox.h])
      expect([diffCrop.width, diffCrop.height]).toEqual([region.bbox.w, region.bbox.h])
    }
  })

  // AC-543 — `1c diff` exits non-zero when ≥1 region is found and zero when none
  // are; with `--json` the parsed stdout is the full report object including the
  // regions array.
  it('test_UAT_AC543_exit_code_and_json_reflect_regions', async () => {
    const dir = freshDir()
    const refPng = await writePng(dir, 'ref.png', 64, 64, BLACK)
    const diffPng = await writePng(dir, 'act-diff.png', 64, 64, TOP_LEFT_PATCH)
    const samePng = await writePng(dir, 'act-same.png', 64, 64, BLACK)

    // A pair with a known difference → at least one region → non-zero exit.
    const withDiff = await runCli(['diff', '--ref', refPng, '--actual', diffPng, '--out', path.join(dir, 'a')])
    expect(withDiff.exitCode).not.toBe(0)

    // Two identical images → no region → zero exit.
    const identical = await runCli(['diff', '--ref', refPng, '--actual', samePng, '--out', path.join(dir, 'b')])
    expect(identical.exitCode).toBe(0)

    // --json → the parsed stdout is the full report including the regions array.
    const json = await runCli(['diff', '--ref', refPng, '--actual', diffPng, '--out', path.join(dir, 'c'), '--json'])
    const parsed = JSON.parse(json.stdout)
    expect(Array.isArray(parsed.regions)).toBe(true)
    expect(parsed.regions.length).toBeGreaterThanOrEqual(1)
    for (const key of ['ref', 'actual', 'dims', 'blockPx', 'meanDiff', 'pctOverThreshold', 'bands', 'regions']) {
      expect(parsed).toHaveProperty(key)
    }
    expect(json.exitCode).not.toBe(0)
  })

  // AC-544 — `1c crop <image> --box x,y,w,h [--out <png>]` writes a PNG of exactly
  // the requested box; an over-reaching box is clamped to the image bounds
  // (never errors); a malformed/missing `--box` is an error.
  it('test_UAT_AC544_crop_extracts_bounds_clamped_box', async () => {
    const dir = freshDir()
    const src = await writePng(dir, 'src.png', 100, 80, (x, y) => [x % 256, y % 256, 0])

    // In-bounds box → output PNG has exactly the requested width/height.
    const inBoundsOut = path.join(dir, 'in-bounds.png')
    const inBounds = await runCli(['crop', src, '--box', '10,20,30,25', '--out', inBoundsOut])
    expect(inBounds.exitCode).toBe(0)
    const cropped = await decodeImage(inBoundsOut)
    expect([cropped.width, cropped.height]).toEqual([30, 25])

    // Over-reaching box (90,70 + 50×50 on a 100×80 image) → clamped to the
    // remaining 10×10 rather than erroring.
    const clampedOut = path.join(dir, 'clamped.png')
    const clamped = await runCli(['crop', src, '--box', '90,70,50,50', '--out', clampedOut])
    expect(clamped.exitCode).toBe(0)
    const clampedImg = await decodeImage(clampedOut)
    expect([clampedImg.width, clampedImg.height]).toEqual([10, 10])

    // Malformed `--box` (not four numbers) → error.
    await expect(run(['crop', src, '--box', '10,20,30'])).rejects.toThrow(/box/i)
    // Missing `--box` → error.
    await expect(run(['crop', src])).rejects.toThrow(/box/i)

    // Guard: this operates only on files already on disk.
    await expect(cmdCrop({ input: path.join(dir, 'nope.png'), box: { x: 0, y: 0, w: 4, h: 4 } })).rejects.toThrow(
      /not found/i,
    )
  })
})
