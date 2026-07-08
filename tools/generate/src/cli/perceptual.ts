/**
 * `1c diff` — the **perceptual-diff eye** (REQ-38, sibling of the value-manifest
 * diff [[REQ-31]] and the eyes [[REQ-13]], [[DOC-13]] §6).
 *
 * The value-diff reads *computed styles* and is structurally blind to
 * composition and geometry (it records section-level anchor only, not
 * per-element geometry — [[DOC-19]]). So an ellipse-vs-circle portrait, a
 * mis-rotated collage photo, or a few-px footer offset can sail through it while
 * being plainly wrong to the eye. This module closes that gap *mechanically*: it
 * diffs our reproduction's screenshot against the captured reference screenshot,
 * derives **severity-ranked regions of interest** by connected-components over a
 * block-averaged heatmap, and emits pre-cropped **ref / ours / diff triptychs**
 * so the eyes land straight on what moved.
 *
 * The image side reuses the {@link cmdShot} render→serve→shoot seam ([[REQ-13]]);
 * a pre-shot PNG (`--actual`) short-circuits the browser for offline re-diff.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import type { GlobalOptions } from './commands'
import { cmdShot } from './shot'
import type { BrowserDriverFactory } from './capture'
import type { RenderChannel } from '../store'

// ── geometry ─────────────────────────────────────────────────────────────────

/** A region bounding box in cropped-image pixel coords (contract shape: w/h). */
export interface RegionBox {
  x: number
  y: number
  w: number
  h: number
}

/** A decoded raster: max-channel diffing needs only RGB; alpha is ignored. */
export interface Raster {
  data: Uint8Array
  width: number
  height: number
  channels: number
}

// ── tuning ───────────────────────────────────────────────────────────────────

export interface DiffTuning {
  /** Grid cell size for block-averaging + region derivation (px, default 16). */
  blockPx?: number
  /** Per-pixel max-channel diff (0..255) above which a pixel is "over threshold". */
  pixelThreshold?: number
  /** Block-average (0..255) above which a cell seeds a region (default 24). */
  blockThreshold?: number
  /** Horizontal bands in the profile (default 16). */
  bands?: number
  /** Keep the top-N regions by score (default 12). */
  topN?: number
  /** Pixels of pad applied around each region bbox, clamped to image (default 0). */
  padPx?: number
}

const DEFAULTS: Required<DiffTuning> = {
  blockPx: 16,
  pixelThreshold: 32,
  blockThreshold: 24,
  bands: 16,
  topN: 12,
  padPx: 0,
}

// ── report shapes ─────────────────────────────────────────────────────────────

export interface DiffRegion {
  id: number
  bbox: RegionBox
  /** Sum of block-average diffs across the cluster — ranks large-faint ≈ small-intense. */
  score: number
  /** score / cellCount — the region's average intensity (0..255). */
  meanDiff: number
  /** bbox area in px². */
  area: number
}

export interface CoreDiffResult {
  dims: { w: number; h: number }
  blockPx: number
  /** Mean per-pixel max-channel diff on a 0..255 scale (contract's `meanDiff`). */
  meanDiff: number
  /** Percentage (0..100) of pixels whose diff exceeds `pixelThreshold`. */
  pctOverThreshold: number
  /** Per-band mean diff (0..255), top→bottom. */
  bands: number[]
  /** Percentage (0..100) of *blocks* whose average exceeds `pixelThreshold`. */
  blockPctOverThreshold: number
  /** Ranked regions of interest (no crop paths — the command layer writes those). */
  regions: DiffRegion[]
  /** Internal: per-pixel diff raster (0..255), row-major, for heatmap + crops. */
  diffData: Uint8Array
  /** Internal: block grid averages (0..255), row-major over gridW×gridH. */
  blocks: Float64Array
  gridW: number
  gridH: number
}

// ── core diff (pure — no I/O, no browser) ──────────────────────────────────────

/**
 * Diff two equal-dimension rasters. Per-pixel signal is the **max absolute
 * channel difference** (max-channel); block-averaging de-noises sub-pixel
 * registration jitter before regions are derived.
 */
export function computeDiff(ref: Raster, actual: Raster, tuning: DiffTuning = {}): CoreDiffResult {
  const t = { ...DEFAULTS, ...stripUndefined(tuning) }
  if (ref.width !== actual.width || ref.height !== actual.height) {
    throw new Error(
      `computeDiff needs equal dimensions; got ${ref.width}×${ref.height} vs ${actual.width}×${actual.height}. Crop first.`,
    )
  }
  const width = ref.width
  const height = ref.height
  const n = width * height
  const diffData = new Uint8Array(n)

  let sum = 0
  let over = 0
  const rc = ref.channels
  const ac = actual.channels
  for (let i = 0; i < n; i++) {
    const rr = ref.data[i * rc]
    const rg = ref.data[i * rc + 1]
    const rb = ref.data[i * rc + 2]
    const ar = actual.data[i * ac]
    const ag = actual.data[i * ac + 1]
    const ab = actual.data[i * ac + 2]
    const d = Math.max(Math.abs(rr - ar), Math.abs(rg - ag), Math.abs(rb - ab))
    diffData[i] = d
    sum += d
    if (d > t.pixelThreshold) over++
  }
  const meanDiff = sum / n
  const pctOverThreshold = (over / n) * 100

  // Horizontal-band profile (top→bottom): mean diff within each band's rows.
  const bandCount = Math.max(1, t.bands)
  const bands: number[] = new Array(bandCount).fill(0)
  for (let b = 0; b < bandCount; b++) {
    const y0 = Math.floor((b * height) / bandCount)
    const y1 = Math.floor(((b + 1) * height) / bandCount)
    let bs = 0
    const rows = Math.max(1, y1 - y0)
    for (let y = y0; y < y1; y++) {
      const base = y * width
      for (let x = 0; x < width; x++) bs += diffData[base + x]
    }
    bands[b] = bs / (rows * width)
  }

  // Block-average the diff into a gridW×gridH grid (de-noise + region seeds).
  const block = Math.max(1, t.blockPx)
  const gridW = Math.ceil(width / block)
  const gridH = Math.ceil(height / block)
  const blocks = new Float64Array(gridW * gridH)
  let blocksOver = 0
  for (let gy = 0; gy < gridH; gy++) {
    const y0 = gy * block
    const y1 = Math.min(height, y0 + block)
    for (let gx = 0; gx < gridW; gx++) {
      const x0 = gx * block
      const x1 = Math.min(width, x0 + block)
      let s = 0
      let cnt = 0
      for (let y = y0; y < y1; y++) {
        const base = y * width
        for (let x = x0; x < x1; x++) {
          s += diffData[base + x]
          cnt++
        }
      }
      const avg = cnt > 0 ? s / cnt : 0
      blocks[gy * gridW + gx] = avg
      if (avg > t.pixelThreshold) blocksOver++
    }
  }
  const blockPctOverThreshold = (blocksOver / (gridW * gridH)) * 100

  const regions = deriveRegions(blocks, gridW, gridH, block, width, height, t)

  return {
    dims: { w: width, h: height },
    blockPx: block,
    meanDiff,
    pctOverThreshold,
    bands,
    blockPctOverThreshold,
    regions,
    diffData,
    blocks,
    gridW,
    gridH,
  }
}

/**
 * Derive regions of interest, "the simple definition": threshold the block grid,
 * flood-fill surviving cells (4-connectivity) into connected components, and
 * turn each component into a padded bbox + a score = Σ block-average over its
 * cells. Ranked by score descending, capped at `topN`.
 */
export function deriveRegions(
  blocks: Float64Array,
  gridW: number,
  gridH: number,
  block: number,
  width: number,
  height: number,
  tuning: DiffTuning = {},
): DiffRegion[] {
  const t = { ...DEFAULTS, ...stripUndefined(tuning) }
  const seen = new Uint8Array(gridW * gridH)
  const clusters: { cells: number[]; minC: number; maxC: number; minR: number; maxR: number; score: number }[] = []

  for (let start = 0; start < blocks.length; start++) {
    if (seen[start] || blocks[start] <= t.blockThreshold) continue
    // BFS flood-fill this component (4-connected).
    const cells: number[] = []
    let minC = gridW
    let maxC = 0
    let minR = gridH
    let maxR = 0
    let score = 0
    const queue = [start]
    seen[start] = 1
    while (queue.length) {
      const idx = queue.pop() as number
      const c = idx % gridW
      const r = (idx - c) / gridW
      cells.push(idx)
      score += blocks[idx]
      if (c < minC) minC = c
      if (c > maxC) maxC = c
      if (r < minR) minR = r
      if (r > maxR) maxR = r
      const neigh = [
        r > 0 ? idx - gridW : -1,
        r < gridH - 1 ? idx + gridW : -1,
        c > 0 ? idx - 1 : -1,
        c < gridW - 1 ? idx + 1 : -1,
      ]
      for (const ni of neigh) {
        if (ni >= 0 && !seen[ni] && blocks[ni] > t.blockThreshold) {
          seen[ni] = 1
          queue.push(ni)
        }
      }
    }
    clusters.push({ cells, minC, maxC, minR, maxR, score })
  }

  clusters.sort((a, b) => b.score - a.score)
  const kept = clusters.slice(0, t.topN)

  return kept.map((cl, i) => {
    const rawX = cl.minC * block
    const rawY = cl.minR * block
    const rawW = (cl.maxC - cl.minC + 1) * block
    const rawH = (cl.maxR - cl.minR + 1) * block
    const x = Math.max(0, rawX - t.padPx)
    const y = Math.max(0, rawY - t.padPx)
    const w = Math.min(width - x, rawW + t.padPx * 2 + (rawX - x))
    const h = Math.min(height - y, rawH + t.padPx * 2 + (rawY - y))
    return {
      id: i + 1,
      bbox: { x, y, w, h },
      score: round(cl.score),
      meanDiff: round(cl.score / cl.cells.length),
      area: w * h,
    }
  })
}

// ── image codec (sharp) ────────────────────────────────────────────────────────

/** Decode a PNG (or any sharp-readable image) file into a {@link Raster}. */
export async function decodeImage(file: string): Promise<Raster> {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height, channels: info.channels }
}

/**
 * Decode in-memory PNG bytes (e.g. a {@link BrowserDriver} screenshot) into a
 * {@link Raster} without a temp-file round-trip. Used by the REQ-42 cross-browser
 * perceptual backstop, which diffs engine screenshots it never writes to disk.
 */
export async function decodeImageBytes(bytes: Uint8Array): Promise<Raster> {
  const { data, info } = await sharp(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength))
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
    channels: info.channels,
  }
}

/** Encode an RGB/RGBA raster to a PNG file (fixture + diagnostic helper). */
export async function writeRasterPng(src: Raster, outFile: string): Promise<string> {
  const channels = src.channels as 1 | 2 | 3 | 4
  const png = await sharp(Buffer.from(src.data.buffer, src.data.byteOffset, src.data.byteLength), {
    raw: { width: src.width, height: src.height, channels },
  })
    .png()
    .toBuffer()
  mkdirSync(path.dirname(outFile), { recursive: true })
  writeFileSync(outFile, png)
  return outFile
}

/** Top-left-anchored crop of a decoded raster to (w×h) — returns a new Raster. */
export function cropRaster(src: Raster, w: number, h: number): Raster {
  if (w === src.width && h === src.height) return src
  const c = src.channels
  const out = new Uint8Array(w * h * c)
  for (let y = 0; y < h; y++) {
    const srcBase = y * src.width * c
    const dstBase = y * w * c
    out.set(src.data.subarray(srcBase, srcBase + w * c), dstBase)
  }
  return { data: out, width: w, height: h, channels: c }
}

/** Encode a 0..255 grayscale raster (row-major, `width`×`height`) to a PNG file. */
async function writeGrayPng(values: Uint8Array, width: number, height: number, outFile: string): Promise<void> {
  const png = await sharp(Buffer.from(values.buffer, values.byteOffset, values.byteLength), {
    raw: { width, height, channels: 1 },
  })
    .png()
    .toBuffer()
  writeFileSync(outFile, png)
}

/**
 * `1c crop` — the magnifying glass. Extract `box` from an **existing** image on
 * disk (reference, our render, or a diff) into a PNG. Deliberately distinct from
 * `1c shot`, which takes a *live* screenshot; this only re-crops files already
 * written.
 */
export interface CropOptions {
  input: string
  box: RegionBox
  out?: string
}

export async function cmdCrop(opts: CropOptions): Promise<{ outFile: string; box: RegionBox }> {
  const { input, box } = opts
  if (!existsSync(input)) throw new Error(`crop: input image not found: ${input}`)
  const meta = await sharp(input).metadata()
  const iw = meta.width ?? 0
  const ih = meta.height ?? 0
  // Clamp the box to the image so an over-reaching bbox never throws.
  const left = clamp(box.x, 0, Math.max(0, iw - 1))
  const top = clamp(box.y, 0, Math.max(0, ih - 1))
  const width = clamp(box.w, 1, iw - left)
  const height = clamp(box.h, 1, ih - top)
  const outFile = path.resolve(opts.out ?? defaultCropName(input, { x: left, y: top, w: width, h: height }))
  const png = await sharp(input).extract({ left, top, width, height }).png().toBuffer()
  mkdirSync(path.dirname(outFile), { recursive: true })
  writeFileSync(outFile, png)
  return { outFile, box: { x: left, y: top, w: width, h: height } }
}

// ── the diff command ───────────────────────────────────────────────────────────

export interface DiffOptions extends GlobalOptions {
  /** Site slug whose rendered draft is the *actual* side (render→serve→shoot). */
  slug?: string
  /** Which channel of our site to shoot (default `draft`). */
  source?: RenderChannel
  /**
   * The *reference* side. Either a capture bundle directory (uses its
   * `screenshot.full.png`) or a direct PNG path. Required.
   */
  ref: string
  /** Pre-shot actual PNG — short-circuits the browser (offline re-diff). */
  actualImagePath?: string
  /** Output directory for diff.png / diff-blocks.png / regions.json / crops. */
  out?: string
  /** Diff tuning knobs. */
  tuning?: DiffTuning
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Fixed serve port; defaults to an ephemeral port. */
  port?: number
}

/** The full report written to `regions.json` and returned by {@link cmdDiff}. */
export interface PerceptualDiffReport {
  ref: string
  actual: string
  dims: { w: number; h: number }
  blockPx: number
  meanDiff: number
  pctOverThreshold: number
  bands: number[]
  regions: (DiffRegion & { crops: { ref: string; actual: string; diff: string } })[]
}

/** Resolve `--ref` to an image path: a bundle dir → its screenshot.full.png. */
function resolveRefImage(ref: string): string {
  if (existsSync(ref) && statSync(ref).isDirectory()) {
    const shot = path.join(ref, 'screenshot.full.png')
    if (!existsSync(shot)) throw new Error(`diff: ref bundle has no screenshot.full.png: ${ref}`)
    return shot
  }
  if (!existsSync(ref)) throw new Error(`diff: reference image not found: ${ref}`)
  return ref
}

/**
 * Render → serve → shoot our draft (or accept a pre-shot `--actual` PNG), diff
 * it against the reference screenshot, and write the heatmaps, `regions.json`,
 * and per-region ref/ours/diff crop triptychs.
 */
export async function cmdDiff(opts: DiffOptions): Promise<PerceptualDiffReport> {
  const refImage = resolveRefImage(opts.ref)

  // Resolve the actual side. A pre-shot PNG skips the browser entirely; else we
  // reuse the eyes seam (render→serve→shoot) to a scratch PNG.
  let actualImage = opts.actualImagePath
  let scratch: string | undefined
  if (!actualImage) {
    if (!opts.slug) {
      throw new Error('diff needs a <slug> (or --actual <png>) for the actual side.')
    }
    scratch = mkdtempSync(path.join(tmpdir(), 'req38-diff-'))
    const shotOut = path.join(scratch, 'actual.png')
    await cmdShot({
      ...opts,
      slug: opts.slug,
      source: opts.source ?? 'draft',
      out: shotOut,
      driverFactory: opts.driverFactory,
      port: opts.port,
    })
    actualImage = shotOut
  }

  try {
    const [refRasterFull, actRasterFull] = await Promise.all([decodeImage(refImage), decodeImage(actualImage)])
    // Reference and reproduction rarely match exactly (faelan was 1195 vs 1184):
    // crop both to a common top-left-anchored rectangle before diffing.
    const w = Math.min(refRasterFull.width, actRasterFull.width)
    const h = Math.min(refRasterFull.height, actRasterFull.height)
    const refR = cropRaster(refRasterFull, w, h)
    const actR = cropRaster(actRasterFull, w, h)

    const core = computeDiff(refR, actR, opts.tuning)

    const outDir = path.resolve(opts.out ?? path.dirname(actualImage))
    mkdirSync(outDir, { recursive: true })

    // diff.png — per-pixel heatmap, amplified so faint deltas are legible.
    const amp = 4
    const heat = new Uint8Array(core.diffData.length)
    for (let i = 0; i < heat.length; i++) heat[i] = Math.min(255, core.diffData[i] * amp)
    const diffPng = path.join(outDir, 'diff.png')
    await writeGrayPng(heat, w, h, diffPng)

    // diff-blocks.png — block-averaged heatmap (de-noised), upscaled to full size.
    const blockHeat = new Uint8Array(w * h)
    for (let y = 0; y < h; y++) {
      const gy = Math.floor(y / core.blockPx)
      for (let x = 0; x < w; x++) {
        const gx = Math.floor(x / core.blockPx)
        blockHeat[y * w + x] = Math.min(255, core.blocks[gy * core.gridW + gx] * amp)
      }
    }
    await writeGrayPng(blockHeat, w, h, path.join(outDir, 'diff-blocks.png'))

    // Per-region crop triptychs (ref / ours / diff), extracted at the bbox.
    const regionsWithCrops = [] as PerceptualDiffReport['regions']
    for (const region of core.regions) {
      const b = region.bbox
      const refCrop = path.join(outDir, `region-${region.id}-ref.png`)
      const oursCrop = path.join(outDir, `region-${region.id}-ours.png`)
      const diffCrop = path.join(outDir, `region-${region.id}-diff.png`)
      await Promise.all([
        cmdCrop({ input: refImage, box: b, out: refCrop }),
        cmdCrop({ input: actualImage, box: b, out: oursCrop }),
        cmdCrop({ input: diffPng, box: b, out: diffCrop }),
      ])
      regionsWithCrops.push({ ...region, crops: { ref: refCrop, actual: oursCrop, diff: diffCrop } })
    }

    const report: PerceptualDiffReport = {
      ref: refImage,
      actual: actualImage,
      dims: core.dims,
      blockPx: core.blockPx,
      meanDiff: round(core.meanDiff),
      pctOverThreshold: round(core.pctOverThreshold),
      bands: core.bands.map(round),
      regions: regionsWithCrops,
    }
    writeFileSync(path.join(outDir, 'regions.json'), JSON.stringify(report, null, 2))
    return report
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true })
  }
}

/** One-line-per-region human rendering + the headline metrics and band profile. */
export function formatDiffReport(report: PerceptualDiffReport): string {
  const head = `perceptual-diff: ${report.ref} ⇄ ${report.actual}\n  mean ${report.meanDiff.toFixed(2)} / 255 · ${report.pctOverThreshold.toFixed(1)}% pixels over threshold · ${report.regions.length} region(s)`
  const band = `  bands: ${report.bands.map((b) => b.toFixed(1)).join(' ')}`
  if (report.regions.length === 0) return `${head}\n${band}\n  ✓ no regions of interest`
  const rows = report.regions.map(
    (r) => `  #${r.id} score ${r.score.toFixed(1)} (mean ${r.meanDiff.toFixed(1)}) @ ${r.bbox.x},${r.bbox.y} ${r.bbox.w}×${r.bbox.h}`,
  )
  return `${head}\n${band}\n${rows.join('\n')}`
}

// ── helpers ────────────────────────────────────────────────────────────────────

function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] !== undefined) out[k] = o[k]
  return out
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function round(v: number): number {
  return Math.round(v * 100) / 100
}

function defaultCropName(input: string, box: RegionBox): string {
  const ext = path.extname(input)
  const stem = path.basename(input, ext)
  return path.join(path.dirname(input), `${stem}-crop-${box.x}_${box.y}_${box.w}x${box.h}.png`)
}
