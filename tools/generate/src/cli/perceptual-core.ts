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

// ── region → node leads (BUG-99) ──────────────────────────────────────────────

/**
 * WHAT A DIFF REGION IS MISSING, AND WHY IT IS RESOLVED HERE.
 *
 * A region says *where* the two sides disagree. On its own that is a pointer,
 * and the only way to learn *what* is there is to open the crop and look — the
 * reconstruction-from-a-picture DOC-19 forbids. The material that answers it is
 * already computed beside the diff: both value manifests carry every element's
 * rendered box in the same document coordinate space the screenshots were shot
 * in. Intersecting the two is arithmetic, so it belongs in this module, beside
 * the region derivation whose output it annotates, rather than in the command
 * shell that happens to hold the files.
 *
 * STRUCTURAL INPUT, NOT AN IMPORT. {@link NodeSource} is the shape a
 * `ValueManifest` already has, declared locally so this module keeps its
 * defining property — no import of any kind, so the workerd surface can take
 * the maths without taking the capture library with it.
 */
export interface NodeSourceBox {
  x: number
  y: number
  width: number
  height: number
}

/** The subset of a value manifest the lead resolver reads. A `ValueManifest` satisfies it. */
export interface NodeSource {
  /** The viewport the manifest was projected at — the scale reference (see {@link resolveRegionNodes}). */
  viewport?: { width: number; height: number }
  elements?: ReadonlyArray<{
    text?: string
    role?: string
    a11yRole?: string
    src?: string | null
    box?: NodeSourceBox
    /** The manifest's own "this element carries no text of its own" flag — see {@link isBandPaint}. */
    textless?: boolean
  }>
  sections?: ReadonlyArray<{ index?: number; box?: NodeSourceBox }>
}

/** One lead: a manifest record whose rendered box intersects a region's bbox. */
export interface RegionNode {
  /** Which list the `index` indexes — `elements` or `sections` of the manifest. */
  kind: 'element' | 'section'
  /** Index into that list. The stable key back to the full record. */
  index: number
  /** Verbatim run text, truncated. Absent for a section and for a textless element. */
  text?: string
  /** The manifest's own `role`, or the a11y role when it carries no other. */
  role?: string
  /** A media element's resolved source, when it has one. */
  src?: string
  /** The node's own box, in the region's coordinate space (scaled if the manifest's differs). */
  box: RegionBox
  overlap: {
    /** Fraction of the REGION this node covers — how much of the disagreement it explains. */
    ofRegion: number
    /** Fraction of the NODE the region covers — a whole node moved vs a corner clipped. */
    ofNode: number
  }
}

/** Leads from both sides. Their asymmetry is the signal; see {@link resolveRegionNodes}. */
export interface RegionNodes {
  ref: RegionNode[]
  actual: RegionNode[]
}

export interface RegionNodeOptions {
  /** Leads kept per side, best-first (default 6). */
  maxPerSide?: number
  /** Leads below this `ofRegion` fraction are noise (default 0.02). */
  minOverlap?: number
  /** Longest `text` kept on a lead (default 80). */
  maxTextChars?: number
}

const NODE_DEFAULTS: Required<RegionNodeOptions> = { maxPerSide: 6, minOverlap: 0.02, maxTextChars: 80 }

/** Intersection area of two boxes in the same space; 0 when they do not meet. */
function intersectionArea(a: RegionBox, b: RegionBox): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * The factor that takes manifest coordinates into image coordinates.
 *
 * Screenshots are shot at DPR 1, so the two spaces are normally identical and
 * this is 1. It is derived rather than assumed because the diff crops both
 * rasters to a COMMON rectangle before comparing, and a caller may hand in a
 * manifest projected at a different width; a silent mis-registration there would
 * put every lead under the wrong region, which is worse than no lead at all.
 */
export function nodeScaleFor(source: NodeSource | undefined, imageWidth: number): number {
  const w = source?.viewport?.width
  if (!w || w <= 0 || imageWidth <= 0) return 1
  return imageWidth / w
}

/** Scale a manifest box into image space and express it in the contract's w/h shape. */
function toRegionBox(box: NodeSourceBox, scale: number): RegionBox {
  return { x: round(box.x * scale), y: round(box.y * scale), w: round(box.width * scale), h: round(box.height * scale) }
}

/**
 * REQ-271 — is this element the band's own PAINT rather than an object standing
 * on the band?
 *
 * The two sides represent band paint in structurally different places. A
 * conventional page nests its content inside the band element, so the fill lives
 * on the band record and the reference manifest holds no textless element for it
 * at all. An L1 render paints each band as a real full-bleed box — so the same
 * fact reaches the reproduction manifest twice, and the box copy can never pair,
 * because there is nothing on the reference side to pair it with.
 *
 * Recognised in the REPORTING and deliberately not by dropping the element from
 * the manifest: a full-bleed textless box is exactly what the fold reads to
 * rebuild a backdrop (BUG-27), so removing it upstream would take a hero
 * photograph out of the fold's input on a page-builder site. The manifest stays
 * faithful to what was painted; only the readers that would otherwise
 * double-count it — the values diff's unpaired tally, and the region leads —
 * recognise it for what it is.
 *
 * Tight by construction — the box must be full-bleed and coincide with a band's
 * own box to within a pixel of layout noise. A box that merely sits ON a band,
 * or a layer with its own geometry (a photograph inside a taller fill), is an
 * object in its own right and is still reported.
 *
 * BUG-148 — DECLARED HERE, in the import-free core, because both readers need
 * it and this is the only module the other two can both reach: the values diff
 * imports it, and `regionNodeLeads` below would otherwise have had to reach into
 * the capture library, which is the one thing this file may not do. Structural
 * parameters for the same reason — a `ValueElement` and a `SectionValues`
 * satisfy them, and no type crosses the boundary.
 */
export function isBandPaint(
  el: { box?: NodeSourceBox; textless?: boolean },
  sections: ReadonlyArray<{ box?: NodeSourceBox }>,
  pageWidth: number,
): boolean {
  const b = el.box
  // `textless` is the projection's own flag for "this element carries no text"
  // (`fieldToElement`); an empty `text` is NOT the same test — a field's text is
  // its accessible name, falling back to `(<role>)`, and is never the empty
  // string. On a container it is the flag and not the text: BUG-142's nesting
  // gives a band element the CONCATENATED text of everything standing on it, so
  // `text` is long and `textless` is still true.
  if (!b || !el.textless) return false
  const TOL = 2
  if (b.x > TOL || b.x + b.width < pageWidth - TOL) return false
  return sections.some(
    (s) => s.box && Math.abs(s.box.y - b.y) <= TOL && Math.abs(s.box.height - b.height) <= TOL,
  )
}

/**
 * The leads for ONE region out of ONE manifest, best-first.
 *
 * Ordered by `ofRegion × ofNode` descending — how much of the disagreement the
 * node explains, times how specifically it explains it. A node the region
 * swallows whole and which fills the region scores 1; a node that covers the
 * region entirely but for which the region is a rounding error scores ~0, and
 * that is the point.
 *
 * BUG-148 — THIS WAS `ofRegion` DESCENDING WITH `ofNode` AS A TIE-BREAK, and
 * the tie-break was unreachable. It assumed a run standing on a band would also
 * score `ofRegion` 1 and so meet the band on the first comparator; it does not,
 * because a region's bbox is snapped to the `blockPx` grid while a manifest box
 * sits at the browser's fractional coordinates, so a run that IS the region
 * still scores 0.89 against the band's 1 and loses before `ofNode` is consulted.
 * The result was a 1257px band leading a 32px subheading on 9 of 12 regions of
 * a real round, each printing "section (100% of region)" — true, and carrying no
 * information. Nothing about that was a tie.
 *
 * The product keeps the intent the tie-break was reaching for — a band surfaces
 * first only where there is genuinely no element to beat it — and makes it hold
 * for a run at any offset, with no floor to tune and no special case for
 * sections. A band that a region really does land on alone still wins, because
 * everything else near it scores lower still.
 */
export function regionNodeLeads(
  bbox: RegionBox,
  source: NodeSource | undefined,
  scale: number,
  options: RegionNodeOptions = {},
): RegionNode[] {
  if (!source) return []
  const o = { ...NODE_DEFAULTS, ...stripUndefined(options) }
  const regionArea = bbox.w * bbox.h
  if (regionArea <= 0) return []

  const leads: RegionNode[] = []
  const consider = (kind: 'element' | 'section', index: number, raw: NodeSourceBox | undefined, rest: Partial<RegionNode>) => {
    if (!raw) return
    const box = toRegionBox(raw, scale)
    const nodeArea = box.w * box.h
    if (nodeArea <= 0) return
    const inter = intersectionArea(bbox, box)
    if (inter <= 0) return
    const ofRegion = inter / regionArea
    if (ofRegion < o.minOverlap) return
    leads.push({ kind, index, ...rest, box, overlap: { ofRegion: round(ofRegion), ofNode: round(inter / nodeArea) } })
  }

  const sections = source.sections ?? []
  const pageWidth = source.viewport?.width ?? 0

  const elements = source.elements ?? []
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    // BUG-148 — a band's own paint is a band, and is offered as `kind: "section"`
    // or not at all. The two sides put it in different lists (see {@link
    // isBandPaint}), so leaving it in `elements` let the reproduction answer a
    // region with a full-bleed aggregate while the reference could only answer
    // with its section record — 12 of 12 `element` against 9 of 12 `section` on
    // a round whose two sides in fact agreed. "A lead on one side and nothing
    // like it on the other is usually the whole finding" is advice a round is
    // given, and it has to be safe to follow.
    if (isBandPaint(el, sections, pageWidth)) continue
    const text = el.text?.trim()
    consider('element', i, el.box, {
      ...(text ? { text: text.length > o.maxTextChars ? `${text.slice(0, o.maxTextChars)}…` : text } : {}),
      ...(el.role || el.a11yRole ? { role: el.role || el.a11yRole } : {}),
      ...(el.src ? { src: el.src } : {}),
    })
  }

  // Sections are carried because a band is what a region lands on when the
  // disagreement is a background — a wrong fill or a missing hero image produces
  // a large region with no text run anywhere near it, which would otherwise
  // resolve to nothing at all and read as "we have no idea".
  for (let i = 0; i < sections.length; i++) {
    consider('section', sections[i].index ?? i, sections[i].box, { role: 'section' })
  }

  // Ranked on the ROUNDED pair the record carries, not on the full-precision
  // intermediates, so the order is re-derivable from `regions.json` alone — a
  // reader who suspects a lead can check the sort without re-running the diff.
  const explains = (n: RegionNode): number => n.overlap.ofRegion * n.overlap.ofNode
  leads.sort(
    (a, b) =>
      explains(b) - explains(a) ||
      b.overlap.ofRegion - a.overlap.ofRegion ||
      b.overlap.ofNode - a.overlap.ofNode,
  )
  return leads.slice(0, o.maxPerSide)
}

/**
 * Annotate every region with the leads from both manifests.
 *
 * BOTH SIDES, BECAUSE THE ASYMMETRY IS THE SIGNAL. A region with a `ref` lead
 * and no `actual` lead is something the reference has that the reproduction did
 * not draw; the reverse is something the reproduction invented. A region with
 * the same text on both sides is that element rendered differently, and the two
 * boxes say whether it moved or merely recoloured.
 *
 * Returns a NEW array; the input regions are untouched.
 */
export function resolveRegionNodes<T extends { bbox: RegionBox }>(
  regions: readonly T[],
  sources: { ref?: NodeSource; actual?: NodeSource },
  imageWidth: number,
  options: RegionNodeOptions = {},
): (T & { nodes: RegionNodes })[] {
  const refScale = nodeScaleFor(sources.ref, imageWidth)
  const actualScale = nodeScaleFor(sources.actual, imageWidth)
  return regions.map((region) => ({
    ...region,
    nodes: {
      ref: regionNodeLeads(region.bbox, sources.ref, refScale, options),
      actual: regionNodeLeads(region.bbox, sources.actual, actualScale, options),
    },
  }))
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

/**
 * REQ-302 (issue 7) — a NUMERIC readout of one region's two crops.
 *
 * A ranked region says "these pixels differ and here is the score." It does not
 * say WHY, and for a class of residual the rest of the instrument is silent
 * about — same text on both sides, boxes agreeing to a quarter-pixel, zero
 * values-diff deltas — the only way left to tell was to open the two PNGs and
 * look, which is the reconstruction-from-a-screenshot that DOC-19 forbids. One
 * measured round left 306.56 of 1043.47 ranked score (29.4%) unattributed for
 * exactly that reason and wrote down what would separate it. This is that.
 *
 * The discriminator is the SHAPE of the difference, not its size:
 *
 * - A **colour** residual (a paint axis the comparator does not carry) moves the
 *   whole crop the same way: {@link deltaRgb} is large and {@link columnDiff} is
 *   broad and flat.
 * - A **glyph-position** residual (subpixel rasterisation, a half-pixel shift)
 *   leaves the average colour almost untouched — {@link deltaRgb} near zero —
 *   and concentrates the difference into narrow spikes at stem edges, so
 *   {@link columnDiff} is peaky and {@link rowDiff} is confined to the text band.
 *
 * Both profiles are bucketed to at most {@link PROFILE_BUCKETS} entries so a
 * full-width region does not write a thousand numbers into `regions.json`; the
 * shape survives the bucketing, which is all that is being read off it.
 */
export interface RegionReadout {
  /** Per-channel mean over the crop, 0..255, each side. */
  meanRgb: { ref: [number, number, number]; actual: [number, number, number] }
  /** Signed per-channel mean difference, `actual - ref`. Near zero ⇒ not a hue difference. */
  deltaRgb: [number, number, number]
  /** Mean |Δ| over all channels and pixels — the same units as `meanDiff`. */
  meanAbsDiff: number
  /** The largest single-bucket column difference. Peaky ⇒ a positional residual. */
  peakColumnDiff: number
  /** Column-wise mean max-channel difference, left to right, bucketed. */
  columnDiff: number[]
  /** Row-wise mean max-channel difference, top to bottom, bucketed. */
  rowDiff: number[]
}

/** Maximum entries in either {@link RegionReadout} profile. */
export const PROFILE_BUCKETS = 64

/** Mean of each bucket when `values` is squeezed into at most `buckets` of them. */
function bucketed(values: number[], buckets: number): number[] {
  if (values.length <= buckets) return values.map(round)
  const out: number[] = []
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor((b * values.length) / buckets)
    const to = Math.max(from + 1, Math.floor(((b + 1) * values.length) / buckets))
    let sum = 0
    for (let i = from; i < to; i++) sum += values[i]
    out.push(round(sum / (to - from)))
  }
  return out
}

/**
 * Measure one region's two crops. Pure — takes decoded rasters and a box, so it
 * is the same computation whether a caller has PNGs on disk or not.
 *
 * The two rasters are the FULL images (already cropped to their common
 * rectangle by {@link computeDiff}'s caller); `box` selects the region, exactly
 * as the crop triptych does, so the numbers describe the same pixels the PNGs do.
 */
export function regionReadout(ref: Raster, actual: Raster, box: RegionBox): RegionReadout {
  const a = extractRect(ref, box).raster
  const b = extractRect(actual, box).raster
  const w = Math.min(a.width, b.width)
  const h = Math.min(a.height, b.height)
  const sums: [number, number, number] = [0, 0, 0]
  const sumsB: [number, number, number] = [0, 0, 0]
  const colMax = new Array<number>(w).fill(0)
  const rowMax = new Array<number>(h).fill(0)
  let absTotal = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ia = (y * a.width + x) * a.channels
      const ib = (y * b.width + x) * b.channels
      let maxCh = 0
      for (let c = 0; c < 3; c++) {
        const va = a.data[ia + c]
        const vb = b.data[ib + c]
        sums[c] += va
        sumsB[c] += vb
        const d = Math.abs(vb - va)
        absTotal += d
        if (d > maxCh) maxCh = d
      }
      colMax[x] += maxCh
      rowMax[y] += maxCh
    }
  }
  const px = Math.max(1, w * h)
  const meanA: [number, number, number] = [round(sums[0] / px), round(sums[1] / px), round(sums[2] / px)]
  const meanB: [number, number, number] = [round(sumsB[0] / px), round(sumsB[1] / px), round(sumsB[2] / px)]
  const cols = colMax.map((v) => v / Math.max(1, h))
  const rows = rowMax.map((v) => v / Math.max(1, w))
  const columnDiff = bucketed(cols, PROFILE_BUCKETS)
  return {
    meanRgb: { ref: meanA, actual: meanB },
    deltaRgb: [round(meanB[0] - meanA[0]), round(meanB[1] - meanA[1]), round(meanB[2] - meanA[2])],
    meanAbsDiff: round(absTotal / (px * 3)),
    peakColumnDiff: round(columnDiff.length ? Math.max(...columnDiff) : 0),
    columnDiff,
    rowDiff: bucketed(rows, PROFILE_BUCKETS),
  }
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
