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
import { copyFileSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { GlobalOptions } from './commands'
import { cmdShot, VIEWPORTS, type ViewportName } from './shot'
import type { BrowserDriverFactory } from './capture'
import { ladderScreenshotPath } from '../store/fs-reference-store'
import type { RenderChannel } from '../store'
import { decodePng, encodePng } from './png'
import {
  computeDiff,
  cropRaster,
  deriveRegions,
  extractRect,
  nodeScaleFor,
  regionReadout,
  resolveRegionNodes,
  round,
  type CoreDiffResult,
  type DiffRegion,
  type DiffTuning,
  type NodeSource,
  type Raster,
  type RegionBox,
  type RegionNode,
  type RegionNodeOptions,
  type RegionNodes,
  type RegionReadout,
} from './perceptual-core'

/**
 * The core is re-exported from here so REQ-156's split is invisible to callers.
 * `cli/index.ts` and the suites import these names from `perceptual`, and the
 * point of moving the arithmetic was to let workerd reach it — not to make every
 * existing importer chase it.
 */
export {
  computeDiff,
  cropRaster,
  deriveRegions,
  extractRect,
  nodeScaleFor,
  regionReadout,
  resolveRegionNodes,
  type CoreDiffResult,
  type DiffRegion,
  type DiffTuning,
  type NodeSource,
  type Raster,
  type RegionBox,
  type RegionNode,
  type RegionNodeOptions,
  type RegionNodes,
  type RegionReadout,
}

// ── image I/O (the shell around the codec) ────────────────────────────────────

/**
 * These four wrap {@link decodePng} / {@link encodePng} with the filesystem, and
 * that is the ONLY thing they add.
 *
 * Before REQ-156 they wrapped `sharp`, and they carried a deferred `await
 * import('sharp')` apiece so that a missing native module could not crash `1c`
 * at load time and pre-empt the REQ-44 preflight refusal. The codec is now part
 * of this repo, so there is no install to be missing, no load to defer, and no
 * refusal to protect — the lazy loader and its explanation are gone with the
 * dependency that needed them.
 */

/** Decode a PNG file into a {@link Raster}. */
export async function decodeImage(file: string): Promise<Raster> {
  return decodePng(new Uint8Array(readFileSync(file)), file)
}

/**
 * Decode in-memory PNG bytes (e.g. a {@link BrowserDriver} screenshot) into a
 * {@link Raster} without a temp-file round-trip. Used by the REQ-42 cross-browser
 * perceptual backstop, which diffs engine screenshots it never writes to disk.
 */
export async function decodeImageBytes(bytes: Uint8Array): Promise<Raster> {
  return decodePng(bytes, 'screenshot')
}

/** Encode an RGB/RGBA raster to a PNG file (fixture + diagnostic helper). */
export async function writeRasterPng(src: Raster, outFile: string): Promise<string> {
  const png = await encodePng(src)
  mkdirSync(path.dirname(outFile), { recursive: true })
  writeFileSync(outFile, png)
  return outFile
}

/** Encode a 0..255 grayscale raster (row-major, `width`×`height`) to a PNG file. */
async function writeGrayPng(values: Uint8Array, width: number, height: number, outFile: string): Promise<void> {
  const png = await encodePng({ data: values, width, height, channels: 1 })
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
  // Decoded whole rather than windowed: `sharp` could seek to the box, but PNG
  // filters each row against the one above it, so there is no row to reconstruct
  // without reconstructing every row before it. The window is taken afterwards.
  const src = await decodePng(new Uint8Array(readFileSync(input)), `crop: ${input}`)
  const { raster, box: clamped } = extractRect(src, box)
  const outFile = path.resolve(opts.out ?? defaultCropName(input, clamped))
  mkdirSync(path.dirname(outFile), { recursive: true })
  writeFileSync(outFile, await encodePng(raster))
  return { outFile, box: clamped }
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
  /**
   * REQ-61 — diff at a named viewport size (`mobile` | `tablet` | `desktop`). The
   * actual side is shot at that viewport and, for a bundle ref, the same-width
   * reference screenshot (`screenshot-<width>.png`) is used — so our tablet render
   * is compared against a tablet reference, not the desktop shot. Absent → the
   * default `screenshot.full.png` (desktop) path.
   */
  size?: ViewportName
  /** Output directory for diff.png / diff-blocks.png / regions.json / crops. */
  out?: string
  /**
   * BUG-103 — keep the REPRODUCTION's screenshot at this path.
   *
   * Without it the shot goes to a `mkdtemp` scratch directory that is deleted in
   * the `finally` below, while `regions.json` persists the deleted path as its
   * `actual` field — a stored report naming a file that does not exist. The
   * per-region `-ours.png` crops survive, so what is lost is every part of the
   * reproduction the region ranker did not happen to pick, and the ability to
   * re-run `1c diff --actual <png>` offline. Same discard as the value
   * manifest's, one artifact over.
   */
  actualOut?: string
  /** Diff tuning knobs. */
  tuning?: DiffTuning
  /**
   * BUG-99 — the two value manifests, so each region can name the nodes under it.
   *
   * OPTIONAL BY CONSTRUCTION. Resolving a lead needs element geometry the
   * perceptual eye does not itself compute, and `1c diff` is routinely pointed at
   * a pair of loose PNGs with no manifest anywhere; a required input would have
   * made the cheapest use of this command impossible. Supplied → every region
   * carries `nodes`; absent → the region record is exactly what it was, which is
   * what keeps `--actual <png>` working with no bundle in sight.
   *
   * `1c gate` always supplies both, because it has already computed them for the
   * value eye. That is the path a diagnosing round reads.
   */
  nodeSources?: { ref?: NodeSource; actual?: NodeSource }
  /** BUG-99 — lead-resolution knobs (leads per side, overlap floor, text length). */
  nodeOptions?: RegionNodeOptions
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Fixed serve port; defaults to an ephemeral port. */
  port?: number
}

/** The full report written to `regions.json` and returned by {@link cmdDiff}. */
export interface PerceptualDiffReport {
  ref: string
  actual: string
  /**
   * The image dimensions every `bbox` — and every `nodes[].box` — is relative to.
   * The two rasters are cropped to a common rectangle before diffing, so this is
   * the intersection, not either source's own size.
   */
  dims: { w: number; h: number }
  blockPx: number
  meanDiff: number
  pctOverThreshold: number
  bands: number[]
  /**
   * BUG-99 — the key `regions` is ordered by, descending. Stated rather than
   * left implicit in array order, so "regions, largest first" is a guarantee a
   * reader can rely on instead of an assumption they have to make.
   *
   * It is `score` (Σ block-average over the cluster's cells) and NOT `area`,
   * deliberately: score ranks a large-faint region alongside a small-intense
   * one, where area alone promotes a big pale wash over a small hard mismatch.
   * `area` is carried per region, so the other order is available to anyone who
   * wants it.
   */
  rankedBy: 'score'
  /** BUG-99 — manifest→image scale used to resolve `nodes`, per side. Absent when no manifest was supplied. */
  nodeScale?: { ref: number; actual: number }
  regions: (DiffRegion & {
    crops: { ref: string; actual: string; diff: string }
    /** BUG-99 — the manifest records under this region. Absent when no manifest was supplied. */
    nodes?: RegionNodes
    /**
     * REQ-302 — the numbers behind the two crops: per-channel means and signed
     * delta, and the column/row difference profiles.
     *
     * Emitted beside the PNGs, not instead of them, and for the same reason the
     * PNGs are emitted at all — except that a number can be read by the round
     * that has to attribute the residual, and a PNG can only be looked at. A
     * region whose two sides carry the same text, agree on their boxes and
     * produce no values-diff delta is otherwise unattributable; `deltaRgb` near
     * zero with a peaky `columnDiff` says "glyph position", a large flat
     * `deltaRgb` says "a colour axis nothing compares". See {@link RegionReadout}.
     */
    readout: RegionReadout
  })[]
}

/**
 * Resolve `--ref` to a reference image path. A bundle dir → its
 * `screenshot.full.png` (default) or, under REQ-61 `--size`, the same-width
 * `screenshot-<width>.png` — failing loudly if the bundle predates per-viewport
 * screenshots rather than comparing our sized render against the desktop shot. A
 * direct PNG path is used verbatim (the caller owns matching it to the size).
 */
function resolveRefImage(ref: string, size?: ViewportName): string {
  if (existsSync(ref) && statSync(ref).isDirectory()) {
    if (size) {
      const width = VIEWPORTS[size].width
      // REQ-155 — the ladder shot is resolved as a PATH here, deliberately, and
      // from the filesystem adapter rather than the port. `--ref` is polymorphic
      // (a bundle directory OR a loose PNG, told apart two lines below by
      // `statSync`), which is a command-line argument resolution the CLI performs
      // above the port; and what this feeds is the image layer, which still takes
      // a path until [[REQ-156]]. The port's byte-returning `readLadderScreenshot`
      // is what a non-filesystem caller uses.
      const shot = ladderScreenshotPath(ref, width)
      if (!existsSync(shot)) {
        throw new Error(
          `diff --size ${size}: bundle '${ref}' has no screenshot-${width}.png. Re-capture with ` +
            `'1c capture page <url>' to persist per-viewport reference screenshots, then re-run.`,
        )
      }
      return shot
    }
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
  const refImage = resolveRefImage(opts.ref, opts.size)

  // Resolve the actual side. A pre-shot PNG skips the browser entirely; else we
  // reuse the eyes seam (render→serve→shoot) to a scratch PNG at the chosen size.
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
      viewport: opts.size,
      out: shotOut,
      driverFactory: opts.driverFactory,
      port: opts.port,
    })
    actualImage = shotOut
  }
  // BUG-103 — before the scratch directory is torn down, and unconditional so a
  // pre-shot `--actual` is copied out too: the flag names where the actual side
  // is, regardless of which path produced it.
  if (opts.actualOut) {
    const kept = path.resolve(opts.actualOut)
    mkdirSync(path.dirname(kept), { recursive: true })
    if (path.resolve(actualImage) !== kept) copyFileSync(actualImage, kept)
    actualImage = kept
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

    // BUG-99 — resolve the node leads BEFORE cutting the crops, so the annotated
    // region is the one thing carried forward. The crops and the leads describe
    // the same rectangle; deriving them from two different objects is how they
    // drift apart.
    const hasSources = opts.nodeSources?.ref !== undefined || opts.nodeSources?.actual !== undefined
    const annotated = hasSources
      ? resolveRegionNodes(core.regions, opts.nodeSources ?? {}, w, opts.nodeOptions)
      : core.regions

    // Per-region crop triptychs (ref / ours / diff), extracted at the bbox.
    const regionsWithCrops = [] as PerceptualDiffReport['regions']
    for (const region of annotated) {
      const b = region.bbox
      const refCrop = path.join(outDir, `region-${region.id}-ref.png`)
      const oursCrop = path.join(outDir, `region-${region.id}-ours.png`)
      const diffCrop = path.join(outDir, `region-${region.id}-diff.png`)
      await Promise.all([
        cmdCrop({ input: refImage, box: b, out: refCrop }),
        cmdCrop({ input: actualImage, box: b, out: oursCrop }),
        cmdCrop({ input: diffPng, box: b, out: diffCrop }),
      ])
      regionsWithCrops.push({
        ...region,
        crops: { ref: refCrop, actual: oursCrop, diff: diffCrop },
        // REQ-302 — measured off the SAME two rasters the crops are cut from, in
        // the same loop, so the numbers and the PNGs can never describe different
        // pixels (the failure BUG-99's comment above guards against for leads).
        readout: regionReadout(refR, actR, b),
      })
    }

    const report: PerceptualDiffReport = {
      ref: refImage,
      actual: actualImage,
      dims: core.dims,
      blockPx: core.blockPx,
      meanDiff: round(core.meanDiff),
      pctOverThreshold: round(core.pctOverThreshold),
      bands: core.bands.map(round),
      rankedBy: 'score',
      ...(hasSources
        ? {
            nodeScale: {
              ref: nodeScaleFor(opts.nodeSources?.ref, w),
              actual: nodeScaleFor(opts.nodeSources?.actual, w),
            },
          }
        : {}),
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
  const rows = report.regions.map((r) => {
    const line = `  #${r.id} score ${r.score.toFixed(1)} (mean ${r.meanDiff.toFixed(1)}) @ ${r.bbox.x},${r.bbox.y} ${r.bbox.w}×${r.bbox.h}`
    // BUG-99 — the best lead from each side, on a continuation line. A region
    // whose sides name different things (or where one side names nothing) is the
    // most informative thing this report can say, so it is said here rather than
    // left for whoever opens `regions.json`.
    const lead = r.nodes ? `\n       ref: ${describeLead(r.nodes.ref[0])} · ours: ${describeLead(r.nodes.actual[0])}` : ''
    // REQ-302 — the shape of the difference, said here rather than left in
    // `regions.json`. It is the line that separates "a colour nothing compares"
    // from "the glyphs moved", which is the question a region with matching
    // leads and no values delta otherwise leaves open.
    const d = r.readout.deltaRgb
    const readout =
      `\n       ΔRGB ${d[0] >= 0 ? '+' : ''}${d[0]},${d[1] >= 0 ? '+' : ''}${d[1]},` +
      `${d[2] >= 0 ? '+' : ''}${d[2]} · |Δ| ${r.readout.meanAbsDiff.toFixed(1)} · ` +
      `peak col ${r.readout.peakColumnDiff.toFixed(1)}`
    return line + lead + readout
  })
  return `${head}\n${band}\n${rows.join('\n')}`
}

// ── helpers ────────────────────────────────────────────────────────────────────

/** One lead in one phrase — `nothing` when the side has none, which is itself the finding. */
function describeLead(lead: RegionNode | undefined): string {
  if (!lead) return 'nothing'
  const what = lead.text ? `“${lead.text}”` : (lead.src ?? lead.role ?? lead.kind)
  return `${what} (${Math.round(lead.overlap.ofRegion * 100)}% of region)`
}

function defaultCropName(input: string, box: RegionBox): string {
  const ext = path.extname(input)
  const stem = path.basename(input, ext)
  return path.join(path.dirname(input), `${stem}-crop-${box.x}_${box.y}_${box.w}x${box.h}.png`)
}
