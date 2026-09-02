/**
 * The perceptual-diff **core** — arithmetic over rasters, and nothing else
 * (REQ-156).
 *
 * SPLIT OUT OF `perceptual.ts` SO THE WORKER CAN IMPORT IT. Removing `sharp`
 * was only half of what stood between `1c diff` and workerd: the module that
 * held the diff also read the filesystem, spawned a browser and wrote report
 * files, so importing the maths dragged `node:fs` into the isolate and the
 * import failed before a single number was computed. This file is therefore
 * pure by construction — no `node:` import, no I/O, no global beyond the
 * language — and `perceptual.ts` is the shell that gives it files and a browser.
 *
 * The split is a consequence of REQ-156 AC3 rather than a refactor for its own
 * sake: "the same code runs in workerd" is only a claim worth making if it is
 * the same code, so the workerd UAT imports THIS module, not a copy of it.
 *
 * Everything here was moved verbatim. The diff verdicts are the one thing
 * REQ-156 promises not to move (AC2), and a rewrite on the way past would have
 * made that promise unverifiable.
 */

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

// ── raster arithmetic ─────────────────────────────────────────────────────────

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


/**
 * Extract an arbitrary rectangle from a decoded raster — what `sharp`'s
 * `.extract()` did for `1c crop` and `1c aligned-crops` before REQ-156.
 *
 * The box is CLAMPED rather than validated, because both callers derive it from
 * a diff region's bbox and the bottom-most band of a tall page routinely
 * over-reaches the image by a few pixels. Throwing there would fail the run over
 * an edge the operator did not choose; clamping returns the pixels that exist,
 * which is what the previous implementation also did.
 */
export function extractRect(src: Raster, box: RegionBox): { raster: Raster; box: RegionBox } {
  const c = src.channels
  const x = clamp(box.x, 0, Math.max(0, src.width - 1))
  const y = clamp(box.y, 0, Math.max(0, src.height - 1))
  const w = clamp(box.w, 1, src.width - x)
  const h = clamp(box.h, 1, src.height - y)
  const out = new Uint8Array(w * h * c)
  for (let row = 0; row < h; row++) {
    const from = ((y + row) * src.width + x) * c
    out.set(src.data.subarray(from, from + w * c), row * w * c)
  }
  return { raster: { data: out, width: w, height: h, channels: c }, box: { x, y, w, h } }
}

// ── helpers ────────────────────────────────────────────────────────────────────

export function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] !== undefined) out[k] = o[k]
  return out
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function round(v: number): number {
  return Math.round(v * 100) / 100
}

/**
 * Box-filter downscale to a bounded longest edge — REQ-157's image cap.
 *
 * WHY IT IS HERE AND NOT IN THE SURFACE. It is raster arithmetic with no I/O,
 * which is exactly what this module is for and exactly what the fidelity surface
 * cannot import `sharp` (or anything else native) to obtain. It sits beside
 * {@link cropRaster} because it is the same kind of operation: pixels in, pixels
 * out, no opinion about where either came from.
 *
 * WHY A BOX FILTER rather than nearest-neighbour. The images this reduces are
 * screenshots of text, and nearest-neighbour sampling of antialiased glyphs at a
 * non-integer ratio produces shimmer that reads, to a model asked to judge
 * fidelity, as a rendering defect that is not there. Averaging the source pixels
 * that fall under each destination pixel is the cheapest filter that does not
 * invent one.
 *
 * An image already within `maxEdge` is returned UNCHANGED — the same identity
 * `cropRaster` observes — so a mobile shot is never resampled for the sake of
 * going through this function.
 */
export function downsampleRaster(src: Raster, maxEdge: number): Raster {
  const longest = Math.max(src.width, src.height)
  if (longest <= maxEdge) return src

  const scale = maxEdge / longest
  const w = Math.max(1, Math.floor(src.width * scale))
  const h = Math.max(1, Math.floor(src.height * scale))
  const c = src.channels
  const out = new Uint8Array(w * h * c)

  // The source rectangle each destination pixel averages. Computed from the
  // destination grid rather than by stepping the source, so every source pixel
  // lands in exactly one box and none is counted twice or dropped.
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor((y * src.height) / h)
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * src.height) / h))
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * src.width) / w)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * src.width) / w))
      const n = (y1 - y0) * (x1 - x0)
      for (let ch = 0; ch < c; ch++) {
        let sum = 0
        for (let sy = y0; sy < y1; sy++) {
          const rowBase = sy * src.width * c
          for (let sx = x0; sx < x1; sx++) sum += src.data[rowBase + sx * c + ch]
        }
        out[(y * w + x) * c + ch] = Math.round(sum / n)
      }
    }
  }

  return { data: out, width: w, height: h, channels: c }
}
