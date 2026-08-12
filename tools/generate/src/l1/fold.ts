/**
 * Capture → L1 fold (REQ-83 / REQ-79 B2).
 *
 * Folds a multi-viewport capture (the 6-sample `multistate.json` oracle) into a
 * single {@link L1Document}: match each node across the sampled widths (reusing
 * the `responsive-diff` alignment), then emit one L1 leaf per node carrying its
 * authored axes, a geometry keyframe track, per-segment `interpolate|snap`
 * flags, and a visibility rule derived from presence across the ladder.
 *
 * This is the **absolute-base** form (REQ-79 D1): every leaf is absolutely
 * placed by its per-width keyframes, which is always a valid layout and closes
 * the round-trip against the retained oracle with zero structural inference. The
 * structure primitives (container layout, sizing) are left empty — the fields the
 * AI recovers as an optional overlay.
 *
 * Reproduction is therefore near-mechanical: capture → fold → render → gate
 * against the oracle. Any residual delta is a serializer bug or a missing L1
 * axis — a framework fix, not a per-site one.
 */
import {
  L1_ENVELOPE,
  isSafeUrl,
  validateL1,
  type L1BlendMode,
  type L1Border,
  type L1Box,
  type L1SurfaceAxes,
  type L1Column,
  type L1ColumnAnchor,
  type L1ColumnTerm,
  type L1Control,
  type L1Document,
  type L1Filter,
  type L1FontFace,
  type L1Geometry,
  type L1GradientStop,
  type L1LinearGradient,
  type L1Image,
  type L1ImageAxes,
  type L1Keyframe,
  type L1Node,
  type L1ObjectPosition,
  type L1Padding,
  type L1PaddingResponsive,
  type L1ScalarKeyframe,
  type L1ScalarTrack,
  type L1Segment,
  type L1Shadow,
  type L1Slot,
  type L1Text,
  type L1TextAxes,
  type L1TextResponsive,
  type L1ViewportResponse,
} from '@1stcontact/site-schema'
import { buildResponsiveTable, elementKey, type LabelledProjection } from '../cli/responsive-diff'
import {
  boxDistance,
  clusterControls,
  foldedFormFor,
  submitProximityThreshold,
  type ControlRow,
  type FoldedForm,
} from './forms'
import {
  colorToHex,
  partitionProbes,
  type MultiStateCapture,
  type SectionValues,
  type StateProjection,
  type ValueElement,
} from '../cli/capture'

const FONT_SIZE = { min: 1, max: 400 }
const FONT_WEIGHT = { min: 1, max: 1000 }

/**
 * REQ-92 / BUG-6 (B2) — a structured signal for one captured element the fold
 * cannot yet express as an L1 leaf. The fold used to `continue` silently past
 * these (text-free media/fields, pure-surface panels, geometry-less runs); they
 * then reached the gate only as anonymous `unmatched` rows, so the *capability
 * gap* (folder power) hid behind a *silent drop*. Emitting a typed residual makes
 * the gap the completeness signal for the whole effort (DOC-21 growth loop): the
 * residual list names exactly what the language + folder still lack.
 */
export interface FoldResidual {
  /** Best-effort object kind of the un-folded element. */
  kind: 'image' | 'field' | 'box' | 'text'
  /** Why it has no faithful L1 leaf yet — the framework-gap this residual names. */
  reason: string
  /** The painted pixel-mover axes present on the element (the gap's substance). */
  capturedAxes: string[]
  /** The sampled widths the element appeared at (ascending). */
  widths: number[]
}

export interface FoldOptions {
  /** Preferred engine to fold from when a width was captured on several (default `chromium`). */
  engine?: string
  /**
   * REQ-90 — the capture's font-face substance (family → served `.woff2`), from
   * the bundle's mirrored assets. Only faces whose family is actually painted by a
   * folded text leaf are kept (an entry earns its place iff it moves a pixel), and
   * they populate the document's `resources.fonts` table so the renderer can emit
   * `@font-face` and the named face resolves instead of a serif fallback.
   */
  fonts?: L1FontFace[]
  /**
   * REQ-92 / BUG-6 (B2) — an out-collector for {@link FoldResidual}s. When
   * provided, every element the fold cannot yet express is pushed here instead of
   * being silently dropped, so a caller (the l1-gate) can surface the framework
   * gaps. Omitted → the fold still drops those elements, but no signal is kept.
   */
  residuals?: FoldResidual[]
  /**
   * REQ-93 — an out-collector for the behavior-module bindings the fold
   * recovered. Every captured form becomes a `slot` node in the tree; the
   * matching {@link FoldedForm} here carries the config a page needs to bind a
   * `contact-form` instance to that slot. Omitted → the slots are still emitted
   * (the layout is faithful either way), but nothing mounts into them.
   */
  forms?: FoldedForm[]
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** The primary font-family token — first comma segment, unquoted, lower-cased for matching. */
function primaryFamily(ff: string | undefined): string {
  return (ff ?? '').split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase()
}

/**
 * REQ-90 — the subset of the capture's font faces that a folded text leaf actually
 * paints, keyed by primary family. A face no text references moves no pixel, so it
 * is dropped from the table (DOC-27).
 *
 * A face whose `src` the envelope would reject is dropped too: an unmirrored or
 * otherwise unrepresentable asset is a content condition, and letting it reach
 * `validateL1` would throw the whole fold over one unresolvable face. Dropping it
 * degrades that family to the fallback face — the same outcome as before REQ-90 —
 * instead of crashing the capture/gate run.
 */
function usedFontFaces(fonts: L1FontFace[], nodes: L1Node[]): L1FontFace[] {
  const painted = new Set<string>()
  for (const n of nodes) {
    if (n.kind === 'text') painted.add(primaryFamily(n.axes?.fontFamily))
  }
  return fonts.filter((f) => painted.has(primaryFamily(f.family)) && isSafeUrl(f.src))
}

/**
 * One resting projection per width, preferring the requested engine, then any
 * engine — the fold reads a single DOM per width (cross-engine agreement is the
 * capture gate's concern, not the fold's).
 */
function restingByWidth(multiState: MultiStateCapture, engine: string): StateProjection[] {
  const byWidth = new Map<number, StateProjection>()
  // REQ-88 — the ladder defines the keyframes; a height probe is evidence about
  // the height axis and never a keyframe of its own ({@link heightProbesFor}).
  for (const p of partitionProbes(multiState.projections).ladder) {
    if (p.state !== 'rest') continue
    const w = p.viewport.width
    const existing = byWidth.get(w)
    if (!existing) byWidth.set(w, p)
    else if (existing.engine !== engine && p.engine === engine) byWidth.set(w, p)
  }
  return [...byWidth.values()].sort((a, b) => a.viewport.width - b.viewport.width)
}

// ── REQ-88 — the viewport-HEIGHT axis ─────────────────────────────────────────

/** A ladder width re-shot at a second viewport height (`HEIGHT_PROBE_VIEWPORTS`). */
interface HeightProbe {
  width: number
  /** Signed change in viewport height from the ladder projection to the probe. */
  deltaH: number
  ladder: StateProjection
  probe: StateProjection
}

/**
 * REQ-88 — pair each ladder projection with a resting projection at the SAME
 * width and a DIFFERENT viewport height. Without such a pair the height axis is
 * unidentifiable and every `100vh` rule reads as a pinned pixel height (see
 * {@link HEIGHT_PROBE_VIEWPORTS}); with one, the response is a finite difference.
 */
function heightProbesFor(multiState: MultiStateCapture, ladder: StateProjection[]): HeightProbe[] {
  const out: HeightProbe[] = []
  for (const p of partitionProbes(multiState.projections).probes) {
    if (p.state !== 'rest') continue
    const l = ladder.find((c) => c.viewport.width === p.viewport.width && c.engine === p.engine)
    if (!l) continue
    const deltaH = p.viewport.height - l.viewport.height
    if (Math.abs(deltaH) < 1) continue
    out.push({ width: l.viewport.width, deltaH, ladder: l, probe: p })
  }
  return out
}

/**
 * A measured `d(geometry)/d(viewport height)` ratio, cleaned up for emission.
 *
 * Snapping to eighths absorbs sub-pixel layout noise (a measured 0.9975 is the
 * `100vh` rule, not a 0.9975 one) without inventing structure: a ratio that is
 * not near an eighth is returned as measured, and a ratio indistinguishable from
 * zero returns `undefined` so no axis is emitted at all.
 */
/**
 * REQ-88 — how many lines the reference set this run on: its measured glyph
 * extent over its line height. Returns `undefined` when either is unavailable —
 * an unknown line count must never be mistaken for a single line, since that is
 * the reading that would pin a wrapping paragraph to one unbreakable row.
 */
function lineCountOf(el: ValueElement): number | undefined {
  const lh = el.lineHeightPx
  const glyphs = el.renderedTextBox
  if (!lh || lh <= 0 || !glyphs || !Number.isFinite(glyphs.height)) return undefined
  return Math.max(1, Math.round(glyphs.height / lh))
}

/**
 * REQ-88 — the smallest captured width from which the reference set this run on a
 * single line at *every* wider sample, or `undefined` if it never did.
 *
 * Taken as a suffix rather than a single width because pinning must never claim
 * more than the reference showed: a run that is one line at 1024 but two at 1280
 * (responsive type can grow faster than its column) yields 1440, not 1024. An
 * unmeasurable line count breaks the suffix for the same reason — unknown must
 * not read as "one line", or a real paragraph gets pinned and overprints the run
 * absolutely positioned below it.
 */
function nowrapThreshold(framed: Array<{ width: number; element: ValueElement }>): number | undefined {
  let threshold: number | undefined
  for (let i = framed.length - 1; i >= 0; i--) {
    if (lineCountOf(framed[i].element) !== 1) break
    threshold = framed[i].width
  }
  return threshold
}

function snapFactor(raw: number): number | undefined {
  if (!Number.isFinite(raw)) return undefined
  const eighth = Math.round(raw * 8) / 8
  const value = Math.abs(raw - eighth) <= 0.01 ? eighth : Math.round(raw * 1e3) / 1e3
  return Math.abs(value) < 0.005 ? undefined : value
}

/** Build `{yFactor, heightFactor}` from a measured box delta, or `undefined` if inert. */
function responseFrom(dy: number, dh: number, deltaH: number): L1ViewportResponse | undefined {
  const yFactor = snapFactor(dy / deltaH)
  const heightFactor = snapFactor(dh / deltaH)
  if (yFactor === undefined && heightFactor === undefined) return undefined
  const r: L1ViewportResponse = {}
  if (yFactor !== undefined) r.yFactor = yFactor
  if (heightFactor !== undefined) r.heightFactor = heightFactor
  return r
}

/**
 * REQ-88 — join a probe's elements to its ladder projection's, by the same
 * `elementKey` + document-order FIFO the responsive table uses, and record each
 * ladder element's measured height response. Keyed by element *identity*, so a
 * caller that already holds a ladder element can look its response up directly.
 */
function probeResponses(probes: HeightProbe[]): Map<ValueElement, L1ViewportResponse> {
  const out = new Map<ValueElement, L1ViewportResponse>()
  for (const { ladder, probe, deltaH } of probes) {
    const queues = new Map<string, ValueElement[]>()
    for (const el of probe.manifest.elements) {
      const k = elementKey(el)
      const q = queues.get(k)
      if (q) q.push(el)
      else queues.set(k, [el])
    }
    const taken = new Map<string, number>()
    for (const el of ladder.manifest.elements) {
      const k = elementKey(el)
      const i = taken.get(k) ?? 0
      taken.set(k, i + 1)
      const other = queues.get(k)?.[i]
      if (!other || !el.box || !other.box) continue
      const r = responseFrom(other.box.y - el.box.y, other.box.height - el.box.height, deltaH)
      if (r) out.set(el, r)
    }
  }
  return out
}

/**
 * REQ-88 — the same measurement for **section edges**, which is what a band's
 * extent is clamped to. A band cannot take its height response from the runs it
 * contains: a `min-h-screen` hero's copy sits in the top half and does not move,
 * while the band below it starts a full viewport height down. Sections join by
 * index (same page, same section list) and give the edge responses directly.
 *
 * The per-section factors are measured at the probe width and applied at every
 * width: the CSS rule producing them (`min-h-screen`) is not itself width-varying,
 * and re-probing at every width would multiply capture cost by the ladder length.
 */
function sectionEdgeResponses(
  probes: HeightProbe[],
  projections: StateProjection[],
): Map<number, Map<number, number>> {
  const byIndex = new Map<number, { top: number; bottom: number }>()
  for (const { ladder, probe, deltaH } of probes) {
    const a = ladder.manifest.sections ?? []
    const b = probe.manifest.sections ?? []
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const ab = a[i]?.box
      const bb = b[i]?.box
      if (!ab || !bb) continue
      byIndex.set(i, {
        top: snapFactor((bb.y - ab.y) / deltaH) ?? 0,
        bottom: snapFactor((bb.y + bb.height - (ab.y + ab.height)) / deltaH) ?? 0,
      })
    }
  }
  const out = new Map<number, Map<number, number>>()
  if (byIndex.size === 0) return out
  for (const p of projections) {
    const m = new Map<number, number>()
    const secs = p.manifest.sections ?? []
    secs.forEach((sv, i) => {
      const f = byIndex.get(i)
      if (!sv.box || !f) return
      m.set(Math.round(sv.box.y), f.top)
      m.set(Math.round(sv.box.y + sv.box.height), f.bottom)
    })
    out.set(p.viewport.width, m)
  }
  return out
}

// ── REQ-88 — the centred content column ───────────────────────────────────────

/** A fitted column plus what it evaluates to at each captured width. */
interface ColumnFit {
  column: L1Column
  originAt: Map<number, number>
  extentAt: Map<number, number>
}

/**
 * REQ-88 — recover the page's centred column (`mx-auto max-w-*` + horizontal
 * padding) from where content actually sits at each captured width.
 *
 * `origin(w)` is the left edge of the narrowest-indented content at `w`; the
 * column is then the two constants that reproduce every sampled origin:
 *
 *   inset     = origin at the narrowest width (below the container, only padding shows)
 *   container = w - 2 * (origin(w) - inset)   — from any width where the origin has risen
 *
 * The fit is rejected unless it reproduces *every* sampled origin and extent to
 * within a pixel, so a page with no centred column keeps its keyframes untouched.
 */
function fitColumn(projections: StateProjection[]): ColumnFit | undefined {
  const widths: number[] = []
  const originAt = new Map<number, number>()
  const extentAt = new Map<number, number>()
  for (const p of projections) {
    const w = p.viewport.width
    // Content only: a full-bleed band spans the viewport and says nothing about
    // the column that its contents are laid out in.
    const boxes = p.manifest.elements
      .filter((e) => e.box && e.text?.trim() && e.box.width < w - 1)
      .map((e) => e.box!)
    if (boxes.length === 0) return undefined
    // The MODAL left edge, not the minimum. A real page has more than one gutter
    // — this reference sets its header 8px wider than its content column — and the
    // extreme is whichever of them happens to be widest, which is not the column
    // the page is laid out in. The edge the most content shares is.
    const left = modal(boxes.map((b) => b.x))
    if (left === undefined) return undefined
    // Measured among that column's OWN runs, so a wide footer bar or an outdented
    // header cannot set the content width.
    const right = modal(boxes.filter((b) => Math.round(b.x) === Math.round(left)).map((b) => b.x + b.width))
    if (right === undefined) return undefined
    widths.push(w)
    originAt.set(w, left)
    extentAt.set(w, right - left)
  }
  if (widths.length < 3) return undefined

  const inset = Math.min(...widths.map((w) => originAt.get(w)!))
  if (inset < 0) return undefined
  const risen = widths.filter((w) => originAt.get(w)! > inset + 0.5)
  if (risen.length === 0) return undefined
  const containers = risen.map((w) => w - 2 * (originAt.get(w)! - inset))
  const containerPx = containers.reduce((a, b) => a + b, 0) / containers.length
  if (containers.some((c) => Math.abs(c - containerPx) > 1)) return undefined

  // The content cap is the extent wherever the column has stopped growing.
  const capped = widths.filter((w) => Math.min(containerPx, w) - 2 * inset > extentAt.get(w)! + 0.5)
  const maxWidthPx = capped.length ? Math.min(...capped.map((w) => extentAt.get(w)!)) : undefined

  const column: L1Column = { containerPx: round2(containerPx), insetPx: round2(inset) }
  if (maxWidthPx !== undefined) column.maxWidthPx = round2(maxWidthPx)

  // Verify against every sample — the fit must *reproduce* the page, not resemble it.
  for (const w of widths) {
    if (Math.abs(columnOrigin(column, w) - originAt.get(w)!) > 1) return undefined
    if (Math.abs(columnExtent(column, w) - extentAt.get(w)!) > 1) return undefined
  }
  return { column, originAt, extentAt }
}

/**
 * The most frequent value in a list, to the pixel; ties break toward the smaller.
 * Returns the unrounded representative so the fit keeps sub-pixel precision.
 */
function modal(values: number[]): number | undefined {
  const counts = new Map<number, { n: number; value: number }>()
  for (const v of values) {
    const key = Math.round(v)
    const hit = counts.get(key)
    if (hit) hit.n += 1
    else counts.set(key, { n: 1, value: v })
  }
  let best: { n: number; value: number } | undefined
  for (const entry of [...counts.values()].sort((a, b) => a.value - b.value)) {
    if (!best || entry.n > best.n) best = entry
  }
  return best?.value
}

/** Does any node in the tree carry a column anchor? */
function hasAnchoredNode(node: L1Node): boolean {
  if (node.geometry?.anchor) return true
  const kids = node.kind === 'container' || node.kind === 'box' ? node.children ?? [] : []
  return kids.some(hasAnchoredNode)
}

/**
 * Is this a plausible share of the column? A node spans some fraction of the
 * column (a full run 1, a 3-up tile ~1/3, a half ~1/2) or none of it. A steep
 * coefficient means the axis is tracking something else entirely — responsive
 * type, a glyph extent — that happens to correlate with the column's growth over
 * the sampled widths, and extrapolating it off-sample is how a run ends up
 * kilometres wide.
 */
const isSaneColumnFraction = (f: number): boolean => Number.isFinite(f) && Math.abs(f) <= 2

const round2 = (n: number): number => Math.round(n * 100) / 100
const columnOrigin = (c: L1Column, w: number): number => Math.max(0, (w - c.containerPx) / 2) + c.insetPx
const columnExtent = (c: L1Column, w: number): number => {
  const inner = Math.min(c.containerPx, w) - 2 * c.insetPx
  return c.maxWidthPx === undefined ? inner : Math.min(c.maxWidthPx, inner)
}

/**
 * REQ-88 — express a node's `x` / `width` as an affine function of the column
 * (`value = px + fraction * extent`), by least squares over the captured widths.
 *
 * Returned only when the fit reproduces every sample to within a pixel *on both
 * axes*. Both, because the renderer takes `x` and `width` from the anchor
 * together: a half-fitted node would keep keyframes for one axis and take the
 * column for the other, and the two would disagree everywhere off-sample.
 */
function fitAnchor(
  frames: Array<{ at: number; box: { x: number; width: number } }>,
  fit: ColumnFit,
  segments?: L1Segment[],
): L1ColumnAnchor | undefined {
  if (frames.length < 3) return undefined
  const extents = frames.map((f) => columnExtent(fit.column, f.at))
  // A single distinct extent cannot separate the constant from the fraction.
  if (new Set(extents.map(Math.round)).size < 2) return undefined

  /** Least-squares `px + fraction * extent` over the given subset, or undefined. */
  const solve = (idx: number[], ys: number[]): { px: number; fraction: number } | undefined => {
    const n = idx.length
    if (n < 2) return undefined
    const sx = idx.reduce((a, i) => a + extents[i], 0)
    const sxx = idx.reduce((a, i) => a + extents[i] * extents[i], 0)
    const sy = idx.reduce((a, i) => a + ys[i], 0)
    const sxy = idx.reduce((a, i) => a + extents[i] * ys[i], 0)
    const det = n * sxx - sx * sx
    if (Math.abs(det) < 1e-6) return undefined
    const fraction = (n * sxy - sx * sy) / det
    return { px: (sy - fraction * sx) / n, fraction }
  }

  /**
   * Fit one axis, allowing a cap. `min(maxPx, px + fraction * extent)` is what a
   * *nested* `max-w-*` looks like — a run that fills the column until its own
   * narrower maximum takes over — and it is common enough that refusing it left
   * neighbouring runs on different models (the 31px hero split).
   */
  const fitAxis = (ys: number[], allowCap: boolean): L1ColumnTerm | undefined => {
    const all = ys.map((_, i) => i)
    const plain = solve(all, ys)
    if (
      plain &&
      isSaneColumnFraction(plain.fraction) &&
      all.every((i) => Math.abs(plain.px + plain.fraction * extents[i] - ys[i]) <= 1)
    ) {
      return { px: round2(plain.px), fraction: round2(plain.fraction) }
    }
    if (!allowCap) return undefined
    // The cap is the largest value the axis reaches; fit the samples below it.
    const cap = Math.max(...ys)
    const below = all.filter((i) => ys[i] < cap - 0.5)
    // A two-unknown fit through two points is interpolation, not evidence: the
    // hero title's width (a shrink-to-fit glyph extent under responsive type) fits
    // ANY two of its samples and then "verifies" against the cap, yielding
    // `-684px + 3.14 * extent`. Demand an over-determined fit.
    if (below.length < 3) return undefined
    const capped = solve(below, ys)
    if (!capped || !isSaneColumnFraction(capped.fraction)) return undefined
    const ok = all.every((i) => Math.abs(Math.min(cap, capped.px + capped.fraction * extents[i]) - ys[i]) <= 1)
    return ok ? { px: round2(capped.px), fraction: round2(capped.fraction), maxPx: round2(cap) } : undefined
  }

  // A left edge has no meaningful cap — an element does not stop moving right at
  // some width — so only width may be capped.
  const dxs = frames.map((f, i) => f.box.x - columnOrigin(fit.column, frames[i].at))
  let x = fitAxis(dxs, false)
  // No closed form? Track the offset instead — but only for content that lives
  // INSIDE the column. A full-bleed band sits at x=0 absolutely; expressing that
  // as `origin + (-origin)` and then interpolating the residual walks it off the
  // left edge between samples, turning a correct band into a negative-x one.
  if (!x && frames.every((f) => f.box.width < f.at - 1)) {
    const track: L1ScalarTrack = { keyframes: frames.map((f, i) => ({ at: f.at, value: round2(dxs[i]) })) }
    // Inherit the node's own geometry segments. A 3-up grid that stacks below `md`
    // changes layout MODE at that breakpoint, and interpolating an inset across a
    // mode change slides the third column off the right edge at ~700px. The
    // geometry track already classifies that jump as a `snap`; the inset must
    // agree with it, or the two halves of one position disagree about where the
    // page's breakpoints are.
    if (segments) track.segments = segments
    x = { pxTrack: track }
  }
  const width = fitAxis(frames.map((f) => f.box.width), true)
  if (!x && !width) return undefined
  const anchor: L1ColumnAnchor = {}
  if (x) anchor.x = x
  if (width) anchor.width = width
  return anchor
}

const PADDING_MAX = 10_000
/**
 * BUG-17 — a captured element's per-side padding → the L1 `padding` axis. The
 * capture reads `getBoundingClientRect` (a border-box that already *includes*
 * padding), so the leaf's geometry width/height carry the pad; folding it here
 * (with the renderer's `box-sizing: border-box`) insets the content inside that
 * pinned box — giving badges/buttons their pill shape and click target — instead
 * of inflating geometry. Zero / absent / out-of-range sides are dropped; an
 * all-zero padding yields `undefined` (no axis emitted).
 */
function foldPadding(el: ValueElement): L1Padding | undefined {
  const side = (v: number | undefined): number | undefined =>
    v !== undefined && Number.isFinite(v) && v > 0 ? clamp(Math.round(v), 0, PADDING_MAX) : undefined
  const pad: L1Padding = {}
  const top = side(el.paddingTopPx)
  const right = side(el.paddingRightPx)
  const bottom = side(el.paddingBottomPx)
  const left = side(el.paddingLeftPx)
  if (top !== undefined) pad.topPx = top
  if (right !== undefined) pad.rightPx = right
  if (bottom !== undefined) pad.bottomPx = bottom
  if (left !== undefined) pad.leftPx = left
  return Object.keys(pad).length ? pad : undefined
}

/** Map a captured element's authored axes onto the typed L1 text-axis subset. */
function textAxes(el: ValueElement): L1TextAxes {
  const axes: L1TextAxes = {}
  // Colour is dropped when the capture only *guessed* it (the #000/#fff sentinel),
  // so a folded doc never pins a low-confidence colour.
  if (el.color && !el.colorInferred) axes.color = el.color
  if (el.fontFamily) axes.fontFamily = el.fontFamily
  if (Number.isFinite(el.fontSizePx)) axes.fontSizePx = clamp(Math.round(el.fontSizePx), FONT_SIZE.min, FONT_SIZE.max)
  if (Number.isFinite(el.fontWeight)) axes.fontWeight = clamp(Math.round(el.fontWeight), FONT_WEIGHT.min, FONT_WEIGHT.max)
  if (el.lineHeightPx !== undefined && el.lineHeightPx !== null) axes.lineHeightPx = Math.round(el.lineHeightPx)
  if (el.letterSpacingPx !== undefined) axes.letterSpacingPx = Math.round(el.letterSpacingPx * 100) / 100
  if (el.textAlign) axes.textAlign = el.textAlign
  const tt = el.textTransform
  if (tt === 'uppercase' || tt === 'lowercase' || tt === 'capitalize') axes.textTransform = tt
  if (el.fontStyle && /italic/i.test(el.fontStyle)) axes.fontStyle = 'italic'
  // ── REQ-91 text pixel-movers folded straight from the capture's structured
  //    values (gradient / decoration / caps / marker). Shadows are captured as a
  //    raw CSS string and are folded by the folder rebuild (REQ-88), not here.
  const grad = foldGradient(el.gradient)
  if (grad) axes.gradientFill = grad
  const dec = foldTextDecoration(el.textDecoration)
  if (dec) axes.textDecoration = dec
  const caps = foldFontVariantCaps(el.fontVariant)
  if (caps) axes.fontVariantCaps = caps
  const marker = foldListMarker(el.listMarker)
  if (marker) axes.listMarker = marker
  // A glyph glow / legibility shadow — paint-only, so it moves pixels without
  // perturbing the leaf's captured box (unlike transform/mask, which shift the
  // post-transform geometry the fold already pins and are deferred to a later
  // increment). Folding it is therefore idempotency-safe.
  const shadow = foldTextShadow(el.textShadow)
  if (shadow) axes.textShadow = shadow
  return axes
}

/**
 * BUG-18 — the numeric type axes keyframed per captured width. Each reads its
 * value the SAME way {@link textAxes} rounds its scalar (so the widest keyframe
 * equals `axes.<name>`), and interpolates fluidly between captured widths.
 */
const RESPONSIVE_TEXT_AXES = {
  fontSizePx: (v: number) => clamp(Math.round(v), FONT_SIZE.min, FONT_SIZE.max),
  lineHeightPx: (v: number) => Math.round(v),
  letterSpacingPx: (v: number) => Math.round(v * 100) / 100,
} as const

/**
 * BUG-18 — per-width responsive tracks for the numeric type axes that actually
 * vary across the sampled ladder. The fold previously took a text run's axes from
 * the widest cell only, so `fontSizePx` (etc.) was one desktop value applied at
 * every width — text rendered oversized at mobile. Here each framed cell
 * contributes a keyframe; an axis whose value is identical across the ladder stays
 * single-valued (no track — static axes are not bloated into tracks), while one
 * that varies becomes a keyframe track the renderer emits per width. Segments are
 * omitted (default `interpolate`), mirroring geometry's fluid default.
 */
function responsiveTextTracks(
  framed: Array<{ width: number; element: ValueElement }>,
): L1TextResponsive | undefined {
  const out: L1TextResponsive = {}
  for (const [axis, round] of Object.entries(RESPONSIVE_TEXT_AXES) as Array<
    [keyof typeof RESPONSIVE_TEXT_AXES, (v: number) => number]
  >) {
    const keyframes: L1ScalarKeyframe[] = []
    for (const c of framed) {
      const raw = c.element[axis]
      if (raw === undefined || raw === null || !Number.isFinite(raw)) continue
      keyframes.push({ at: c.width, value: round(raw as number) })
    }
    // A track earns its place only when ≥2 widths carry the axis AND it varies —
    // a single value across the ladder stays a scalar in `axes`.
    if (keyframes.length < 2 || keyframes.every((k) => k.value === keyframes[0].value)) continue
    out[axis] = { keyframes }
  }
  return Object.keys(out).length ? out : undefined
}

/** The captured padding sides, in L1 field order, keyed by their capture axis. */
const PADDING_SIDES = {
  topPx: 'paddingTopPx',
  rightPx: 'paddingRightPx',
  bottomPx: 'paddingBottomPx',
  leftPx: 'paddingLeftPx',
} as const

/**
 * REQ-88 — per-width tracks for the padding sides that vary across the ladder,
 * mirroring {@link responsiveTextTracks}. A side that holds one value everywhere
 * stays a plain scalar on `padding` — a track earns its place only by varying.
 */
function responsivePaddingTracks(
  framed: Array<{ width: number; element: ValueElement }>,
): L1PaddingResponsive | undefined {
  const out: L1PaddingResponsive = {}
  for (const [field, axis] of Object.entries(PADDING_SIDES) as Array<
    [keyof L1PaddingResponsive, (typeof PADDING_SIDES)[keyof typeof PADDING_SIDES]]
  >) {
    const keyframes: L1ScalarKeyframe[] = []
    for (const c of framed) {
      const raw = c.element[axis]
      if (raw === undefined || raw === null || !Number.isFinite(raw)) continue
      keyframes.push({ at: c.width, value: clamp(Math.round(raw), 0, PADDING_MAX) })
    }
    if (keyframes.length < 2 || keyframes.every((k) => k.value === keyframes[0].value)) continue
    out[field] = { keyframes }
  }
  return Object.keys(out).length ? out : undefined
}

/**
 * A captured computed shadow string → the L1 structured shadow (REQ-92). Chrome
 * emits `[inset] <color> <offX>px <offY>px [<blur>px] [<spread>px]` (colour first);
 * we tolerate either colour position by pulling the colour token out and reading
 * the remaining px lengths positionally. Only the first shadow layer of a comma
 * list is folded; `none`/unparseable → undefined. `spread`/`inset` apply to a box
 * shadow; a text shadow passes neither.
 */
function foldShadow(
  css: string | null | undefined,
  opts: { spread: boolean; inset: boolean },
): L1Shadow | undefined {
  if (!css || /^none$/i.test(css.trim())) return undefined
  const first = css.split(/,(?![^(]*\))/)[0].trim() // first layer, not splitting inside rgb(...)
  const inset = opts.inset && /\binset\b/i.test(first)
  const colorTok = first.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/)
  const hex = colorTok ? colorToHex(colorTok[0]) : null
  if (!hex) return undefined
  let rest = colorTok ? first.replace(colorTok[0], ' ') : first
  rest = rest.replace(/\binset\b/i, ' ')
  const nums = (rest.match(/-?\d*\.?\d+px/g) ?? []).map((n) => parseFloat(n))
  if (nums.length < 2 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1])) return undefined
  const shadow: L1Shadow = { offsetXPx: nums[0], offsetYPx: nums[1], color: hex }
  if (nums.length >= 3 && Number.isFinite(nums[2]) && nums[2] >= 0) shadow.blurPx = nums[2]
  if (opts.spread && nums.length >= 4 && Number.isFinite(nums[3])) shadow.spreadPx = nums[3]
  if (inset) shadow.inset = true
  return shadow
}

/** A text-fill/glyph glow shadow (no spread, no inset). */
function foldTextShadow(css: string | null | undefined): L1Shadow | undefined {
  return foldShadow(css, { spread: false, inset: false })
}

const OBJECT_FITS = new Set(['cover', 'contain', 'fill', 'none', 'scale-down'])
/** A captured `object-fit` → the L1 enum, else undefined. */
function foldObjectFit(v: string | null | undefined): L1ImageAxes['objectFit'] {
  return v && OBJECT_FITS.has(v) ? (v as L1ImageAxes['objectFit']) : undefined
}

const BLEND_MODES = new Set([
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge',
  'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue',
  'saturation', 'color', 'luminosity',
])
/** A captured `mix-blend-mode` → the L1 enum, else undefined (`normal` is a no-op). */
function foldBlendMode(v: string | null | undefined): L1BlendMode | undefined {
  if (!v) return undefined
  const t = v.trim().toLowerCase()
  return t !== 'normal' && BLEND_MODES.has(t) ? (t as L1BlendMode) : undefined
}

const BORDER_STYLES = new Set(['solid', 'dashed', 'dotted', 'double'])
/** A captured box-border treatment → the L1 structured border, else undefined. */
function foldBorder(b: ValueElement['border']): L1Border | undefined {
  if (!b || !(b.widthPx > 0)) return undefined
  const color = colorToHex(b.color)
  if (!color) return undefined
  const border: L1Border = { widthPx: b.widthPx, color }
  if (b.style && BORDER_STYLES.has(b.style)) border.style = b.style as L1Border['style']
  return border
}

/**
 * REQ-136 — a captured `object-position` → the typed L1 pair, else undefined.
 *
 * ONLY THE PERCENTAGE-PAIR FORM. A computed `object-position` is normally
 * `50% 50%`, but a page may author keywords (`left top`) or lengths (`20px 0`),
 * and guessing at either would put a number in the definition that the target
 * never said. The conservative miss is what the fold does everywhere else: an
 * unreadable value folds to nothing and shows up as a residual, which is a
 * findable gap rather than a silent wrong answer.
 *
 * The CSS default (`50% 50%` — dead centre) folds to undefined, because the axis
 * is only worth carrying when it says something the browser would not do anyway.
 */
export function foldObjectPosition(v: string | null | undefined): L1ObjectPosition | undefined {
  const m = v?.trim().match(/^(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%$/)
  if (!m) return undefined
  const xPct = Math.round(parseFloat(m[1]) * 100) / 100
  const yPct = Math.round(parseFloat(m[2]) * 100) / 100
  if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return undefined
  if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return undefined
  return xPct === 50 && yPct === 50 ? undefined : { xPct, yPct }
}

/**
 * The CSS filter functions L1 carries: how each one's argument is read, the value
 * at which it paints nothing, and the largest value the envelope admits.
 *
 * The two `identity` values are the whole reason this is a table rather than a
 * list of names. `grayscale(0)` and `saturate(1)` are both no-ops; `grayscale(1)`
 * and `saturate(0)` are both extremes. One rule for "skip the identity" would be
 * wrong for half of them, and the failure would be silent — a fully desaturated
 * photograph would fold to no filter at all.
 */
const FILTER_FUNCTIONS = [
  { css: 'grayscale', axis: 'grayscale', unit: 'ratio', identity: 0, max: 1 },
  { css: 'sepia', axis: 'sepia', unit: 'ratio', identity: 0, max: 1 },
  { css: 'invert', axis: 'invert', unit: 'ratio', identity: 0, max: 1 },
  { css: 'saturate', axis: 'saturate', unit: 'ratio', identity: 1, max: L1_ENVELOPE.filterAmount.max },
  { css: 'brightness', axis: 'brightness', unit: 'ratio', identity: 1, max: L1_ENVELOPE.filterAmount.max },
  { css: 'contrast', axis: 'contrast', unit: 'ratio', identity: 1, max: L1_ENVELOPE.filterAmount.max },
  { css: 'hue-rotate', axis: 'hueRotateDeg', unit: 'deg', identity: 0, max: 3600 },
  { css: 'blur', axis: 'blurPx', unit: 'px', identity: 0, max: 10_000 },
] as const

/**
 * REQ-136 — a captured `filter` → the typed L1 colour-adjustment stack.
 *
 * A ratio argument may be written as a number or a percentage (`saturate(0.4)`
 * and `saturate(40%)` are the same filter), and which one a browser reports is
 * not something the fold should depend on — so both are read and both land as
 * the CSS-canonical fraction the axis holds.
 *
 * `drop-shadow` is deliberately NOT read: it is a shadow, and L1 already carries
 * one (`boxShadow` / `textShadow`) with its own typed shape. Folding it here
 * would give the substrate two ways to say one thing, which is the legacy-mode
 * state the project forbids. It stays a residual until it has a home.
 */
export function foldFilter(v: string | null | undefined): L1Filter | undefined {
  if (!v || v.trim() === 'none') return undefined
  const filter: Record<string, number> = {}
  for (const fn of FILTER_FUNCTIONS) {
    const m = v.match(new RegExp(`(?:^|\\s)${fn.css}\\(\\s*(-?\\d*\\.?\\d+)(%|deg|px|)\\s*\\)`, 'i'))
    if (!m) continue
    let n = parseFloat(m[1])
    if (!Number.isFinite(n)) continue
    // A ratio written as a percentage is the same filter written differently.
    if (fn.unit === 'ratio' && m[2] === '%') n /= 100
    // Clamped into the envelope rather than dropped: a value past the ceiling is
    // a real treatment the target paints, and the nearest expressible one
    // reproduces it far better than nothing does. Negative is not a treatment.
    if (fn.unit !== 'deg' && n < 0) continue
    n = Math.min(n, fn.max)
    n = Math.round(n * 1e4) / 1e4
    // The identity paints nothing, so carrying it would grow every folded
    // definition with declarations that cost a composite layer and move no pixel.
    if (n === fn.identity) continue
    filter[fn.axis] = n
  }
  return Object.keys(filter).length ? (filter as L1Filter) : undefined
}

/** A captured `backdrop-filter: blur(Npx)` → N (px), else undefined. */
function foldBackdropBlur(v: string | null | undefined): number | undefined {
  if (!v) return undefined
  const m = v.match(/blur\(\s*(-?\d*\.?\d+)px\s*\)/i)
  if (!m) return undefined
  const n = parseFloat(m[1])
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** ARIA roles that name a form control — a behavior-module seam, never a raw L1 leaf (DOC-25/26). */
const FORM_CONTROL_ROLES = new Set([
  'textbox', 'searchbox', 'button', 'checkbox', 'radio', 'radiogroup', 'combobox',
  'listbox', 'option', 'slider', 'spinbutton', 'switch', 'menuitem',
  'menuitemcheckbox', 'menuitemradio',
])

/**
 * The minimal element shape the leaf-kind decision reads — satisfied by a
 * {@link ValueElement} and by a retained multistate-oracle element alike. The
 * gate's `sampleFidelityProbe` classifies oracle elements through the SAME
 * {@link classifyElement} so its image/box pairing matches exactly what the fold
 * emitted (no duplicated, driftable classification logic).
 */
export interface FoldableElement {
  text?: string
  textless?: boolean
  a11yRole?: string
  objectFit?: string | null
  intrinsicAspect?: number | null
  surfaceFill?: string | null
  surfaceGradient?: unknown
  border?: unknown
  boxShadow?: string | null
  borderRadiusPx?: number
  opacity?: number
  backdropFilter?: string | null
  blendMode?: string | null
  /** BUG-27 — a painted CSS `background-image` handle (the hero / section imagery). */
  backgroundImageUrl?: string | null
}

/**
 * The L1 leaf kind an element folds to (independent of geometry/src
 * availability). `control` and `unknown` are both "not a measurable leaf", but
 * they are distinct gaps: a `control` is a *known* behavior-module seam
 * (DOC-25/26), while `unknown` is a text-free element with no recognised
 * substance at all. Keeping them apart is what lets the residual namer stay a
 * pure lookup instead of re-deriving the kind (see `RESIDUAL_KIND_BY_LEAF`).
 */
export type FoldLeafKind = 'text' | 'image' | 'box' | 'control' | 'unknown' | 'empty'

/**
 * Id prefixes of a **synthesized backing surface** (BUG-14): the `box` leaves the
 * fold reconstructs *behind* the text runs whose composited section/card fill
 * would otherwise vanish — the full-bleed section bands, the section background
 * images, and the cards. None is a captured element: each one's source elements
 * classify as `text` and are measured through their own text leaves, so they have
 * **no oracle counterpart** and must never enter the gate's non-text pairing queue
 * (doing so mispairs every real `box-*` leaf and reports phantom fidelity
 * deltas). {@link isSynthesizedSurfaceId} is the single place that knows this.
 */
export const SYNTHESIZED_SURFACE_ID_PREFIXES = ['section-band-', 'section-bg-', 'card-'] as const

/** True for a fold-synthesized backing surface — see {@link SYNTHESIZED_SURFACE_ID_PREFIXES}. */
export function isSynthesizedSurfaceId(id: string | undefined): boolean {
  return id !== undefined && SYNTHESIZED_SURFACE_ID_PREFIXES.some((p) => id.startsWith(p))
}

/** A text-free element that carries media substance (an `<img>`): it becomes an `image` leaf. */
function isMediaElement(el: FoldableElement): boolean {
  return el.objectFit != null || el.intrinsicAspect != null || el.a11yRole === 'img'
}

/** A text-free element that paints a surface (a divider / decorative panel): a `box` leaf. */
function paintsSurface(el: FoldableElement): boolean {
  return Boolean(
    // BUG-27 — a painted background photograph IS a surface, and the loudest one
    // on the page. Listed first: on a photography-led page nothing else about the
    // element (no fill, no border, no radius) would qualify it, so before this the
    // hero fell through to "no L1 leaf yet" and the page reproduced as flat colour.
    el.backgroundImageUrl ||
      el.surfaceFill ||
      el.surfaceGradient ||
      el.border ||
      el.boxShadow ||
      (el.borderRadiusPx !== undefined && el.borderRadiusPx > 0) ||
      (el.opacity !== undefined && el.opacity < 1) ||
      el.backdropFilter ||
      el.blendMode,
  )
}

/**
 * Decide the L1 leaf kind an element folds to. `text` (styled run), `image`
 * (media), `box` (standalone painted surface), `control` (a form control — a
 * behavior-module seam, never a raw leaf), `unknown` (a text-free element with
 * no recognised substance), or `empty` (an empty-string run). Ignores
 * geometry/src availability, which the fold gates separately.
 */
export function classifyElement(el: FoldableElement): FoldLeafKind {
  if (!el.textless) return (el.text ?? '').trim() !== '' ? 'text' : 'empty'
  if (isMediaElement(el)) return 'image'
  if (el.a11yRole && FORM_CONTROL_ROLES.has(el.a11yRole)) return 'control'
  if (paintsSurface(el)) return 'box'
  return 'unknown' // not measured — a residual, not a leaf
}

/**
 * BUG-27 — is this box leaf a BACKDROP (paints behind content) rather than a
 * standalone decorative panel? A painted photograph always is. A solid fill is
 * one when it spans the viewport: a full-bleed band is by construction the thing
 * everything else sits on, while a narrower painted box is a card beside its
 * neighbours. Derived from the folded geometry, so it needs no capture-side flag.
 */
const BACKDROP_FULL_BLEED = 0.9
function isBackdrop(node: L1Box): boolean {
  if (node.axes?.backgroundImageUrl) return true
  if (!node.axes?.surfaceFill || !node.geometry) return false
  const kf = node.geometry.keyframes[node.geometry.keyframes.length - 1]
  return kf !== undefined && kf.width !== undefined && kf.width >= BACKDROP_FULL_BLEED * kf.at
}

/** Map a captured textless surface element's axes onto the typed L1 box-axis subset. */
function boxAxes(el: ValueElement): L1SurfaceAxes {
  const axes: L1SurfaceAxes = {}
  const fill = el.surfaceFill ? colorToHex(el.surfaceFill) : null
  if (fill) axes.surfaceFill = fill
  // BUG-27 — the painted background photograph. Carried as the captured origin
  // URL; `localizeAssets` rewrites it to the bundle's mirror (or reports it as an
  // unmirrored gap), exactly as it already does for a section background.
  if (el.backgroundImageUrl && isSafeUrl(el.backgroundImageUrl)) {
    axes.backgroundImageUrl = el.backgroundImageUrl
  }
  const grad = foldGradient(el.surfaceGradient)
  if (grad) axes.surfaceGradient = grad
  if (el.borderRadiusPx !== undefined && el.borderRadiusPx > 0) axes.borderRadiusPx = Math.round(el.borderRadiusPx)
  if (el.opacity !== undefined && el.opacity < 1) axes.opacity = el.opacity
  const border = foldBorder(el.border)
  if (border) axes.border = border
  const shadow = foldShadow(el.boxShadow, { spread: true, inset: true })
  if (shadow) axes.boxShadow = shadow
  const blur = foldBackdropBlur(el.backdropFilter)
  if (blur !== undefined) axes.backdropBlurPx = blur
  // REQ-136 — the surface's OWN colour adjustment, distinct from the backdrop
  // blur above it: `filter` was already a Type-A axis the values-diff compared,
  // so before this every target that painted one reported a delta with no fold
  // that could close it.
  const filter = foldFilter(el.filter)
  if (filter) axes.filter = filter
  const blend = foldBlendMode(el.blendMode)
  if (blend) axes.blendMode = blend
  return axes
}

/**
 * BUG-20 / BUG-21 — is this run **self-painting**: does its own border-box already
 * span the painted surface, so no separate card box belongs behind it? Two families
 * qualify — a pill badge (BUG-20, below) and a padded control (BUG-21, see
 * {@link isPaddedControlRun}). The capture reads
 * `borderRadiusPx` / `boxShadow` / `border` from the element's OWN computed style,
 * unlike `surfaceFill` / `surfaceGradient` / `borderLeft`, which walk ancestors to
 * find the enclosing card. So an own radius belongs to the run's own element —
 * but that alone does not make it a chip: a single-run *card* also paints a modest
 * rounding on itself (BUG-14).
 *
 * The discriminator is **pill saturation**: a radius that reaches half the run's
 * painted height is fully-rounded, which is what a badge is and what a card never
 * is. Such a run's element *is* the surface (a `rounded-full` "Coming soon"
 * badge, a tag pill), so it folds to a text leaf carrying its own surface and
 * contributes no card row — it paints itself. Everything else stays a card row and
 * keeps BUG-14's section-band → card → text reconstruction untouched.
 */
function isSelfPaintingRun(el: ValueElement): boolean {
  const h = el.box?.height ?? 0
  if (h > 0 && (el.borderRadiusPx ?? 0) * 2 >= h - 1) return true
  return isPaddedControlRun(el)
}

/**
 * BUG-21 — the second family of self-painting run: a **padded control** (a button,
 * a submit link). Pill saturation misses it, because a button's rounding is modest
 * (`rounded-lg` → 8px on a 48px box), so `Subscribe` / `Send message` folded to a
 * card row and the card path then *outset* the box by an inferred padding — giving
 * every button 2x its height and ~50px of extra width, bleeding past both screen
 * edges at 320.
 *
 * The discriminator is an authored **vertical inset**: normal block flow gives a
 * text element zero vertical padding, so a non-zero `padding-top`/`bottom` is
 * authored on that very element — which means its border-box already spans the
 * painted surface (the capture reads `getBoundingClientRect`, see BUG-17). Nothing
 * beyond it needs painting, so it takes the chip path and contributes no card row.
 *
 * Horizontal padding alone is deliberately *not* enough: a `pl`-indented run inside
 * a card is a common shape and its fill genuinely belongs to the enclosing card.
 * Two further guards keep an ancestor-attributed treatment on the card box, where
 * the chip axes cannot carry it: a `surfaceGradient` (no chip gradient axis) and a
 * `borderLeft` accent bar (no chip borderLeft axis).
 */
function isPaddedControlRun(el: ValueElement): boolean {
  const vPad = (el.paddingTopPx ?? 0) + (el.paddingBottomPx ?? 0)
  if (!(vPad > 0)) return false
  if (!el.surfaceFill) return false
  if (el.surfaceGradient) return false
  if (el.borderLeft && el.borderLeft.widthPx > 0) return false
  return true
}

/**
 * BUG-20 — the chip surface a self-painting run carries on its own text leaf.
 * A pill's authored radius is often a saturating sentinel (`rounded-full` computes
 * to 33554400px); it is clamped into the L1 envelope's length range, which renders
 * identically (any radius ≥ half the height paints the same pill).
 */
function chipAxes(el: ValueElement): Pick<L1TextAxes, 'surfaceFill' | 'borderRadiusPx' | 'boxShadow' | 'border'> {
  const axes: Pick<L1TextAxes, 'surfaceFill' | 'borderRadiusPx' | 'boxShadow' | 'border'> = {}
  const fill = el.surfaceFill ? colorToHex(el.surfaceFill) : null
  if (fill) axes.surfaceFill = fill
  if (el.borderRadiusPx !== undefined && el.borderRadiusPx > 0) {
    axes.borderRadiusPx = Math.min(Math.round(el.borderRadiusPx), L1_ENVELOPE.lengthPx.max)
  }
  const shadow = foldShadow(el.boxShadow, { spread: true, inset: true })
  if (shadow) axes.boxShadow = shadow
  const border = foldBorder(el.border)
  if (border) axes.border = border
  return axes
}

/** Map a captured media element's axes onto the typed L1 image-axis subset. */
function imageAxes(el: ValueElement): L1ImageAxes {
  const axes: L1ImageAxes = {}
  const fit = foldObjectFit(el.objectFit)
  if (fit) axes.objectFit = fit
  // REQ-136 — which part of the picture the box shows. Captured all along
  // (`extract.ts` reads it per image) and dropped by the fold because L1 had
  // nowhere to put it, so a `cover` image the target panned to its top edge
  // reproduced centred, with the delta reported as an unclosable Type-A gap.
  const position = foldObjectPosition(el.objectPosition)
  if (position) axes.objectPosition = position
  const filter = foldFilter(el.filter)
  if (filter) axes.filter = filter
  if (el.borderRadiusPx !== undefined && el.borderRadiusPx > 0) axes.borderRadiusPx = Math.round(el.borderRadiusPx)
  if (el.opacity !== undefined && el.opacity < 1) axes.opacity = el.opacity
  const blend = foldBlendMode(el.blendMode)
  if (blend) axes.blendMode = blend
  const border = foldBorder(el.border)
  if (border) axes.border = border
  const shadow = foldShadow(el.boxShadow, { spread: true, inset: true })
  if (shadow) axes.boxShadow = shadow
  return axes
}

/**
 * The residual kind for each leaf kind {@link classifyElement} can report. A
 * residual names the leaf the fold *would* have emitted, so the two must agree:
 * `classifyElement` is the single source of the kind decision and this map is
 * only the naming (`control` reads as `field` in a residual; an empty run is
 * still text substance).
 */
const RESIDUAL_KIND_BY_LEAF: Record<FoldLeafKind, FoldResidual['kind']> = {
  text: 'text',
  empty: 'text',
  image: 'image',
  box: 'box',
  control: 'field',
  unknown: 'box',
}

/** Best-effort object kind for a residual an element that has no L1 leaf yet (B2). */
function residualKindOf(el: ValueElement): FoldResidual['kind'] {
  return RESIDUAL_KIND_BY_LEAF[classifyElement(el)]
}

/** The painted pixel-mover axes present on an element — the residual's substance (B2). */
function capturedAxesOf(el: ValueElement): string[] {
  const axes: string[] = []
  const has = (name: string, v: unknown): void => {
    if (v !== null && v !== undefined && v !== '' && v !== 0) axes.push(name)
  }
  has('objectFit', el.objectFit)
  has('intrinsicAspect', el.intrinsicAspect)
  has('backgroundImageUrl', el.backgroundImageUrl)
  has('surfaceFill', el.surfaceFill)
  has('surfaceGradient', el.surfaceGradient)
  has('border', el.border)
  has('borderRadiusPx', el.borderRadiusPx)
  has('boxShadow', el.boxShadow)
  has('backdropFilter', el.backdropFilter)
  has('blendMode', el.blendMode)
  if (el.opacity !== undefined && el.opacity < 1) axes.push('opacity')
  has('maskEdge', el.maskEdge)
  has('transformRotateDeg', el.transformRotateDeg)
  if (el.transformScale !== undefined && el.transformScale !== 1) axes.push('transformScale')
  has('accessibleName', el.accessibleName)
  return axes
}

/** A captured `TextGradient` → an L1 gradient axis (≥2 hex stops), else undefined. */
// REQ-103 — a capture yields a linear gradient (the extractor hexifies
// `linear-gradient(…)` only), so the fold builds the linear branch by name rather
// than the union: an `angleDeg` is meaningless on a radial and TS says so.
function foldGradient(g: ValueElement['gradient']): L1LinearGradient | undefined {
  if (!g || !Array.isArray(g.stops)) return undefined
  const stops = g.stops
    .filter((s) => typeof s.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(s.color))
    .map((s) => {
      const stop: L1GradientStop = { color: s.color }
      if (s.position !== null && s.position !== undefined && Number.isFinite(s.position)) {
        stop.position = clamp(s.position, 0, 100)
      }
      return stop
    })
  if (stops.length < 2) return undefined
  const out: L1LinearGradient = { stops }
  if (g.angleDeg !== null && g.angleDeg !== undefined && Number.isFinite(g.angleDeg)) {
    out.angleDeg = g.angleDeg
  }
  return out
}

/** A captured `text-decoration-line` → the L1 enum, else undefined. */
function foldTextDecoration(v: string | null | undefined): L1TextAxes['textDecoration'] {
  if (!v) return undefined
  if (/underline/i.test(v)) return 'underline'
  if (/line-through/i.test(v)) return 'line-through'
  if (/overline/i.test(v)) return 'overline'
  return undefined
}

/** A captured `font-variant(-caps)` → the L1 small-caps enum, else undefined. */
function foldFontVariantCaps(v: string | null | undefined): L1TextAxes['fontVariantCaps'] {
  if (!v) return undefined
  if (/all-small-caps/i.test(v)) return 'all-small-caps'
  if (/small-caps/i.test(v)) return 'small-caps'
  return undefined
}

const LIST_MARKERS = new Set([
  'disc',
  'circle',
  'square',
  'decimal',
  'decimal-leading-zero',
  'lower-alpha',
  'upper-alpha',
  'lower-roman',
  'upper-roman',
])

/** A captured `list-style-type` → the L1 marker enum (known values only), else undefined. */
function foldListMarker(v: string | null | undefined): L1TextAxes['listMarker'] {
  if (!v) return undefined
  const t = v.trim().toLowerCase()
  return LIST_MARKERS.has(t) ? (t as L1TextAxes['listMarker']) : undefined
}

/** The smallest rect containing both — a group's extent at one width (REQ-93). */
function unionBox<T extends { x: number; y: number; width: number; height: number }>(a: T, b: T): T {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    ...a,
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

/**
 * Classify the transition between two adjacent keyframes purely from geometry:
 *   - `snap`        — a reflow: the element jumps horizontally by more than a
 *                     quarter of the viewport (a column/stacking change), or it
 *                     grows *narrower* as the viewport grows *wider* (against the
 *                     fluid grain). A held-then-snapped hold reproduces this.
 *   - `interpolate` — fluid: position/size change smoothly, so a linear `calc()`
 *                     between the endpoints approximates the intermediate widths.
 */
function segmentKind(a: { at: number; x: number; width: number }, b: { at: number; x: number; width: number }): L1Segment {
  const dx = b.x - a.x
  const dw = b.width - a.width
  if (Math.abs(dx) > 0.25 * b.at) return 'snap'
  if (dw < -0.1 * a.width) return 'snap'
  return 'interpolate'
}

/**
 * A visibility rule from the widths a node is present at, against the full ladder:
 * `fromPx` when the node is absent below its first present width, `untilPx` when it
 * is absent above its last present width. A node present at every width gets no
 * rule (always visible).
 */
function visibilityFor(presentWidths: number[], ladder: number[]): { fromPx?: number; untilPx?: number } | undefined {
  if (presentWidths.length === 0 || presentWidths.length === ladder.length) return undefined
  const min = presentWidths[0]
  const max = presentWidths[presentWidths.length - 1]
  const rule: { fromPx?: number; untilPx?: number } = {}
  if (min > ladder[0]) rule.fromPx = min
  const nextAbove = ladder.find((w) => w > max)
  if (nextAbove !== undefined) rule.untilPx = nextAbove
  return rule.fromPx === undefined && rule.untilPx === undefined ? undefined : rule
}

/**
 * BUG-13 — section/band CSS `background-image`s → L1 `box` leaves.
 *
 * The page's hero + section imagery is painted as a `background-image` on the
 * band (a `<section>`/`<div>`), not as `<img>` elements, so it never enters the
 * element manifest and the element loop above never sees it. The capture instead
 * carries it as `SectionValues.backgroundImageUrl` + `box` (per band, per width).
 * Here we match those section entries by ordinal `index` across the sampled
 * widths and emit one `box` per section carrying `backgroundImageUrl` and a
 * geometry keyframe track from the band boxes — the renderer already paints the
 * URL (an allowlisted scheme, guaranteed by the projection). These paint beneath
 * all content (emitted first by the caller).
 *
 * BUG-24 — the same box also carries the band's translucent **scrim**
 * (`SectionValues.overlay`, a colour WITH alpha). The capture has projected it all
 * along but nothing folded it, so a hero veil (`bg-slate-950/30` over the photo)
 * was dropped and the image rendered at full brightness. The renderer already
 * layers `overlay` above `backgroundImageUrl` within one box, so the scrim needs
 * no node of its own. A section is therefore folded when it paints an image OR a
 * scrim — an overlay over a solid band is carried just as faithfully.
 */
function foldSectionBackgrounds(projections: StateProjection[], widths: number[]): L1Box[] {
  // section ordinal → its (width, values) samples across the ladder
  const byIndex = new Map<number, Array<{ width: number; sv: SectionValues }>>()
  for (const p of projections) {
    for (const sv of p.manifest.sections ?? []) {
      if (!sv.box) continue
      if (!sv.backgroundImageUrl && !sv.overlay) continue
      const arr = byIndex.get(sv.index) ?? []
      arr.push({ width: p.viewport.width, sv })
      byIndex.set(sv.index, arr)
    }
  }
  const nodes: L1Box[] = []
  let idx = 0
  for (const [, entriesRaw] of [...byIndex.entries()].sort((a, b) => a[0] - b[0])) {
    const entries = entriesRaw.sort((a, b) => a.width - b.width)
    const keyframes: L1Keyframe[] = entries.map((e) => ({
      at: e.width,
      x: Math.round(e.sv.box!.x),
      y: Math.round(e.sv.box!.y),
      width: Math.round(e.sv.box!.width),
      height: Math.round(e.sv.box!.height),
    }))
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    // The URL / scrim are the band's; the widest width carrying each is
    // authoritative (they agree). Read per-axis rather than off the widest entry:
    // a section may paint an image at some widths and only a scrim at others.
    const axes: L1SurfaceAxes = {}
    const url = entries.filter((e) => e.sv.backgroundImageUrl).pop()?.sv.backgroundImageUrl
    if (url) axes.backgroundImageUrl = url
    const overlay = entries.filter((e) => e.sv.overlay).pop()?.sv.overlay
    if (overlay) axes.overlay = { color: overlay.color, opacity: overlay.opacity }
    const node: L1Box = { kind: 'box', id: `section-bg-${idx++}`, geometry, axes }
    const vis = visibilityFor(entries.map((e) => e.width), widths)
    if (vis) node.visibility = vis
    nodes.push(node)
  }
  return nodes
}

/**
 * BUG-14 — the surface a captured text run sits on, plus its per-width geometry.
 * The capture attributes the composited card/panel/section fill and the card
 * treatments (`borderLeft` accent, uniform `border`, `boxShadow`, radius) onto
 * each *run* (never as a standalone box). We collect one of these per surface-
 * bearing run, then rebuild the **section-band → card → text** hierarchy from them
 * (`buildSolidBands` + `buildCards`) instead of emitting a rectangle per run.
 */
interface SurfaceRow {
  fill?: string
  gradient?: L1LinearGradient
  borderLeft?: L1Border
  border?: L1Border
  boxShadow?: L1Shadow
  borderRadiusPx?: number
  /** Per-width run box (has height), ascending by width. */
  frames: Array<{ at: number; box: NonNullable<ValueElement['box']> }>
  /** The run's box at the widest present width — the grouping/classification frame. */
  widest: NonNullable<ValueElement['box']>
  /**
   * REQ-88 — the **captured** surface-bearing box per width (`SurfaceShape.box`),
   * ascending by width. The capture already resolves which ancestor paints the
   * run's surface and records that element's own rect, so the card's edges are a
   * measured fact, not something to re-derive from where its text happens to sit.
   * Empty when the capture carried no surface shape (a synthetic manifest).
   */
  surfaceFrames: Array<{ at: number; box: NonNullable<ValueElement['box']> }>
  /** Captured corner radius of the surface-bearing box (0/undefined when square). */
  surfaceRadiusPx?: number
  /** REQ-88 — the row's measured viewport-height response, inherited by its card. */
  viewportResponse?: L1ViewportResponse
}

/** A captured asymmetric left-accent border (a card rule) → the L1 `borderLeft` axis. */
function foldBorderLeftAxis(bl: ValueElement['borderLeft']): L1Border | undefined {
  if (!bl || !(bl.widthPx > 0)) return undefined
  const color = colorToHex(bl.color)
  if (!color) return undefined
  return { widthPx: bl.widthPx, color }
}

/** Whether a surface row carries any card treatment (so it is a card, never a plain band). */
function hasCardTreatment(r: SurfaceRow): boolean {
  return Boolean(
    r.borderLeft || r.border || r.boxShadow || (r.borderRadiusPx && r.borderRadiusPx > 0) || r.gradient,
  )
}

/** Count of distinct treatments present — the representative-row tiebreak for a card. */
function treatmentScore(r: SurfaceRow): number {
  let n = 0
  if (r.fill) n++
  if (r.gradient) n++
  if (r.borderLeft) n++
  if (r.border) n++
  if (r.boxShadow) n++
  if (r.borderRadiusPx && r.borderRadiusPx > 0) n++
  return n
}

/** A stable identity for a card surface — two rows with the same signature can be one card. */
function surfaceSignature(r: SurfaceRow): string {
  const g = r.gradient ? `${r.gradient.angleDeg ?? ''}:${r.gradient.stops.map((s) => `${s.color}@${s.position ?? ''}`).join(',')}` : ''
  const bl = r.borderLeft ? `${r.borderLeft.widthPx}/${r.borderLeft.color}` : ''
  const bd = r.border ? `${r.border.widthPx}/${r.border.color}` : ''
  const sh = r.boxShadow ? `${r.boxShadow.offsetXPx},${r.boxShadow.offsetYPx},${r.boxShadow.blurPx ?? 0},${r.boxShadow.color}` : ''
  const rad = r.borderRadiusPx && r.borderRadiusPx > 0 ? Math.round(r.borderRadiusPx) : ''
  return `${r.fill ?? ''}|${g}|${bl}|${bd}|${sh}|${rad}`
}

type Rect = NonNullable<ValueElement['box']>
const xOverlap = (a: Rect, b: Rect): boolean =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0
const vGap = (a: Rect, b: Rect): number => {
  const iy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return iy >= 0 ? 0 : -iy
}

/** A surface box identity key — two runs on the same card share one rect. */
function surfaceKey(box: NonNullable<ValueElement['box']>): string {
  return `${Math.round(box.x)},${Math.round(box.y)},${Math.round(box.width)},${Math.round(box.height)}`
}

/** Extra height added below the last band so a trailing band has a visible tail. */
const BAND_TAIL_PAD = 48

/**
 * BUG-19 — detect full-bleed **bar** fills (a footer / nav strip). A bar paints
 * its solid fill edge-to-edge, but its text runs are individually narrow and
 * horizontally *distributed* (space-between: items hug the left and right edges
 * with a large empty gap between), so no single run is full-width and the
 * single-run band rule misses it — each run wrongly becomes a tiny card, exposing
 * the page background across the bar.
 *
 * A fill is a bar when its same-fill, no-treatment runs share a horizontal row
 * whose union spans full content width AND whose largest internal horizontal gap
 * is dominant (the empty bar showing between the edge-hugging items). This
 * distinguishes a distributed bar from an evenly-tiled card grid (small, even
 * gaps — e.g. a Presence/Positivity/Connection tile row), which stays cards.
 */
function barBandFills(rows: SurfaceRow[], pageContentWidth: number, fullWidthFrac: number): Set<string> {
  const FULL = fullWidthFrac * pageContentWidth
  const GAP = 0.2 * pageContentWidth // a bar's central empty stretch dwarfs a grid's inter-tile gap
  const out = new Set<string>()
  const byFill = new Map<string, SurfaceRow[]>()
  for (const r of rows) {
    if (!r.fill || hasCardTreatment(r)) continue
    const g = byFill.get(r.fill)
    if (g) g.push(r)
    else byFill.set(r.fill, [r])
  }
  for (const [fill, group] of byFill) {
    // Cluster same-fill runs into horizontal rows (vertically-overlapping boxes).
    const remaining = group.slice().sort((a, b) => a.widest.y - b.widest.y)
    while (remaining.length) {
      const seed = remaining.shift()!
      const row = [seed]
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (vGap(seed.widest, remaining[i].widest) === 0) {
          row.push(remaining[i])
          remaining.splice(i, 1)
        }
      }
      if (row.length < 2) continue // a lone run is handled by the single-run rule
      const sorted = row.slice().sort((a, b) => a.widest.x - b.widest.x)
      const minX = Math.min(...sorted.map((r) => r.widest.x))
      const maxX = Math.max(...sorted.map((r) => r.widest.x + r.widest.width))
      if (maxX - minX < FULL) continue // not a full-width span → not a bar
      let maxGap = 0
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].widest.x - (sorted[i - 1].widest.x + sorted[i - 1].widest.width)
        if (gap > maxGap) maxGap = gap
      }
      if (maxGap >= GAP) out.add(fill)
    }
  }
  return out
}

/**
 * BUG-14 — full-bleed **section-band** boxes. Band rows (full-width content runs
 * with no card treatment) are grouped into maximal consecutive-same-fill runs in
 * document order; the groups are ordered top-to-bottom and each band **tiles**
 * from its own top to the next band's top, so a band covers its whole section —
 * including any cards that sit on it — rather than hugging just its heading. Each
 * band paints its solid fill full-bleed (`x:0`, `width:viewport`) at every width.
 *
 * REQ-88 — tiling to the next band's first RUN overshoots whenever the next
 * section opens with padding: the hero band swallowed the 96px of cream above
 * "A Different Approach" and painted it near-black. The runs only bound the
 * band's CONTENT; the captured `sections[].box` edges are where the sections
 * actually change. So the bottom is clamped to the first real section edge at or
 * after this band's own content — the boundary is read from the capture instead
 * of guessed from where the next paragraph happens to start.
 */
function buildSolidBands(
  bandRows: SurfaceRow[],
  widths: number[],
  sectionEdges: Map<number, number[]>,
  heightAt: Map<number, number>,
  edgeResponses: Map<number, Map<number, number>>,
): L1Box[] {
  const groups: Array<{ fill: string; rows: SurfaceRow[] }> = []
  for (const r of bandRows) {
    if (!r.fill) continue
    const last = groups[groups.length - 1]
    if (last && last.fill === r.fill) last.rows.push(r)
    else groups.push({ fill: r.fill, rows: [r] })
  }
  if (groups.length === 0) return []
  const widestW = Math.max(...widths)
  const topAt = (g: { rows: SurfaceRow[] }, w: number): number | undefined => {
    let t = Infinity
    for (const r of g.rows) {
      const f = r.frames.find((f) => f.at === w)
      if (f) t = Math.min(t, f.box.y)
    }
    return t === Infinity ? undefined : t
  }
  const botAt = (g: { rows: SurfaceRow[] }, w: number): number | undefined => {
    let b = -Infinity
    for (const r of g.rows) {
      const f = r.frames.find((f) => f.at === w)
      if (f) b = Math.max(b, f.box.y + f.box.height)
    }
    return b === -Infinity ? undefined : b
  }
  // Slab order top-to-bottom (fixed across widths by the widest-width top).
  const order = groups
    .map((g, i) => ({ g, i, top: topAt(g, widestW) ?? Infinity }))
    .sort((a, b) => a.top - b.top)
  const boxes: L1Box[] = []
  /**
   * REQ-88 — a band's TOP snapped up to the section edge that opens it. The runs
   * only mark where the band's content starts; a section opening with padding put
   * the edge higher (the footer band began at its copyright line, 52px below the
   * navy strip's real top, leaving a cream sliver above it). The snap may never
   * cross into the previous band's content, so a missing edge just leaves the
   * run-derived top as-is.
   */
  const snappedTop = (oi: number, w: number): number | undefined => {
    const raw = topAt(order[oi].g, w)
    if (raw === undefined) return undefined
    const floor = oi > 0 ? (botAt(order[oi - 1].g, w) ?? -Infinity) : 0
    // The edge that OPENS this band is the closest one at or above the previous
    // band's content and at or below this band's first run — i.e. the GREATEST
    // qualifying edge. Taking the smallest instead would snap the band up over
    // every section between them (the footer swallowed the whole contact section).
    let best = -Infinity
    for (const edge of sectionEdges.get(w) ?? []) {
      if (edge <= raw && edge >= floor && edge > best) best = edge
    }
    return best === -Infinity ? raw : best
  }
  order.forEach((entry, oi) => {
    const keyframes: L1Keyframe[] = []
    const present: number[] = []
    const responseSamples: Array<{ y: number; height: number }> = []
    for (const w of widths) {
      const top = snappedTop(oi, w)
      if (top === undefined) continue
      let bottom: number | undefined
      for (let k = oi + 1; k < order.length; k++) {
        const nt = snappedTop(k, w)
        if (nt !== undefined && nt > top) {
          bottom = nt
          break
        }
      }
      if (bottom === undefined) {
        const ob = botAt(entry.g, w)
        bottom = ob !== undefined ? ob + BAND_TAIL_PAD : top
      }
      // Clamp to the first captured section edge at/after this band's own content:
      // the runs bound the content, the section box bounds the SURFACE.
      const contentBottom = botAt(entry.g, w)
      if (contentBottom !== undefined) {
        for (const edge of sectionEdges.get(w) ?? []) {
          if (edge >= contentBottom && edge < bottom) {
            bottom = edge
            break
          }
        }
      }
      const kf: L1Keyframe = {
        at: w,
        x: 0,
        y: Math.round(top),
        width: w,
        height: Math.round(Math.max(0, bottom - top)),
      }
      const vh = heightAt.get(w)
      if (vh) kf.atHeight = vh
      keyframes.push(kf)
      present.push(w)
      // REQ-88 — a band is bounded by SECTION EDGES, so its height response is the
      // difference of its two edges' responses, not anything its runs can report:
      // a `min-h-screen` hero's copy sits in the top half and never moves, while
      // the band's own bottom travels a full viewport height. Both edges are
      // measured, so a band that opens at a fixed edge and closes at a travelling
      // one comes out with exactly the growth the reference has.
      const edges = edgeResponses.get(w)
      if (edges) {
        const fTop = edges.get(Math.round(top))
        const fBottom = edges.get(Math.round(bottom))
        if (fTop !== undefined && fBottom !== undefined) {
          responseSamples.push({ y: fTop, height: fBottom - fTop })
        }
      }
    }
    if (keyframes.length === 0) return
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    // Every width must agree, or the band is not describable as one height rule.
    const first = responseSamples[0]
    if (first && responseSamples.every((s) => s.y === first.y && s.height === first.height)) {
      const r: L1ViewportResponse = {}
      if (Math.abs(first.y) >= 0.005) r.yFactor = first.y
      if (Math.abs(first.height) >= 0.005) r.heightFactor = first.height
      if (r.yFactor !== undefined || r.heightFactor !== undefined) geometry.viewportResponse = r
    }
    const node: L1Box = { kind: 'box', id: `section-band-${oi}`, geometry, axes: { surfaceFill: entry.g.fill } }
    const vis = visibilityFor(present, widths)
    if (vis) node.visibility = vis
    boxes.push(node)
  })
  return boxes
}

/**
 * BUG-14 — **card** boxes. Card rows (a surface distinct from their band, or any
 * card treatment) are grouped by connected component under "same surface signature
 * AND horizontally-overlapping AND vertically-adjacent" — so a card's stacked runs
 * (title / body / checklist), bridged by its full-width body run, coalesce into
 * ONE box, while side-by-side grid columns (disjoint x) stay separate cards and a
 * distinct badge (different fill) becomes its own small box. Each card box is the
 * union of its runs plus inferred padding, carrying the card treatments
 * (`borderLeft` accent, border, shadow, radius). Larger cards paint first so a
 * contained badge lands on top.
 */
function buildCards(
  cardRows: SurfaceRow[],
  widths: number[],
  heightAt: Map<number, number>,
  columnFit?: ColumnFit,
): L1Box[] {
  const n = cardRows.length
  if (n === 0) return []
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  const sig = cardRows.map(surfaceSignature)
  // REQ-88 — the captured surface rect at the widest width, when the capture
  // resolved one. It is an exact identity: two runs painted by the same element
  // share it, and two runs on different cards never do.
  const skey = cardRows.map((r) => {
    const f = r.surfaceFrames[r.surfaceFrames.length - 1]
    return f ? surfaceKey(f.box) : undefined
  })
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // A measured surface identity decides membership outright — same rect joins,
      // different rects stay apart. Proximity heuristics only arbitrate rows whose
      // surface the capture could not resolve.
      if (skey[i] !== undefined || skey[j] !== undefined) {
        if (skey[i] !== undefined && skey[i] === skey[j]) parent[find(i)] = find(j)
        continue
      }
      if (sig[i] !== sig[j]) continue
      const a = cardRows[i].widest
      const b = cardRows[j].widest
      if (!xOverlap(a, b)) continue
      if (vGap(a, b) <= 2.5 * Math.max(a.height, b.height, 40)) parent[find(i)] = find(j)
    }
  }
  const groups = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    const g = groups.get(r)
    if (g) g.push(i)
    else groups.set(r, [i])
  }
  const boxes: Array<{ node: L1Box; area: number }> = []
  let idx = 0
  for (const members of groups.values()) {
    const rows = members.map((m) => cardRows[m])
    const rep = rows.slice().sort((a, b) => treatmentScore(b) - treatmentScore(a))[0]
    const keyframes: L1Keyframe[] = []
    const present: number[] = []
    for (const w of widths) {
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity,
        any = false
      for (const r of rows) {
        // REQ-88 — prefer the surface-bearing element's OWN captured rect. It is
        // the card's edge as measured, so nothing has to be inferred from where
        // the text sits; only a row whose surface the capture missed falls back to
        // its run box (and then reaches no further than that box).
        const sf = r.surfaceFrames.find((f) => f.at === w)
        const f = sf ?? r.frames.find((f) => f.at === w)
        if (!f) continue
        any = true
        x0 = Math.min(x0, f.box.x)
        y0 = Math.min(y0, f.box.y)
        x1 = Math.max(x1, f.box.x + f.box.width)
        y1 = Math.max(y1, f.box.y + f.box.height)
      }
      if (!any) continue
      const kf: L1Keyframe = {
        at: w,
        x: Math.round(x0),
        y: Math.round(y0),
        width: Math.round(x1 - x0),
        height: Math.round(y1 - y0),
      }
      const h = heightAt.get(w)
      if (h) kf.atHeight = h
      keyframes.push(kf)
      present.push(w)
    }
    if (keyframes.length === 0) continue
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    // REQ-88 — a card inherits the height response of the runs it encloses, and
    // takes the column anchor when its own edges are that column's function.
    const cardResponse = rows.map((r) => r.viewportResponse).find(Boolean)
    if (cardResponse) geometry.viewportResponse = cardResponse
    if (columnFit) {
      const anchor = fitAnchor(
        keyframes.map((k) => ({ at: k.at, box: { x: k.x, width: k.width } })),
        columnFit,
        geometry.segments,
      )
      if (anchor) geometry.anchor = anchor
    }
    const axes: L1SurfaceAxes = {}
    if (rep.fill) axes.surfaceFill = rep.fill
    if (rep.gradient) axes.surfaceGradient = rep.gradient
    if (rep.borderLeft) axes.borderLeft = rep.borderLeft
    if (rep.border) axes.border = rep.border
    if (rep.boxShadow) axes.boxShadow = rep.boxShadow
    // REQ-88 — rounding belongs to the box that paints the surface, not to the text
    // run sitting on it. A panel's runs are square; the panel element carries r=8.
    const radius = rep.surfaceRadiusPx ?? rep.borderRadiusPx
    if (radius && radius > 0) axes.borderRadiusPx = Math.round(radius)
    const node: L1Box = { kind: 'box', id: `card-${idx++}`, geometry, axes }
    const vis = visibilityFor(present, widths)
    if (vis) node.visibility = vis
    const wk = keyframes[keyframes.length - 1]
    boxes.push({ node, area: wk.width * (wk.height ?? 0) })
  }
  // Larger cards first (bottom); a small contained badge paints last (on top).
  return boxes.sort((a, b) => b.area - a.area).map((b) => b.node)
}

/**
 * Fold a multi-viewport capture into one L1 document. Text nodes fold to `text`
 * leaves (the round-trip oracle compares text axes); text-free nodes (fields,
 * images) carry no `src` in the manifest and are deferred. The result is
 * validated against the L1 envelope and returned; an invalid fold throws with the
 * machine-readable errors.
 */
export function foldToL1(multiState: MultiStateCapture, opts: FoldOptions = {}): L1Document {
  const engine = opts.engine ?? 'chromium'
  const projections = restingByWidth(multiState, engine)
  const widths = projections.map((p) => p.viewport.width)
  if (widths.length === 0) {
    throw new Error('foldToL1: no resting projections to fold (empty ladder — re-capture with 1c capture page)')
  }

  const labelled: LabelledProjection[] = projections.map((p) => ({
    size: { name: String(p.viewport.width), width: p.viewport.width },
    manifest: p.manifest,
  }))
  const table = buildResponsiveTable(labelled)

  // REQ-88 — the two viewport functions the width ladder alone cannot express.
  // Both are *fitted and verified* against every captured sample; where a fit does
  // not reproduce the page exactly, nothing is emitted and the node keeps its
  // keyframes, so a page with no centred column or no `100vh` block is unchanged.
  const heightAt = new Map(projections.map((p) => [p.viewport.width, p.viewport.height]))
  const probes = heightProbesFor(multiState, projections)
  const responseOf = probeResponses(probes)
  const edgeResponses = sectionEdgeResponses(probes, projections)
  const columnFit = fitColumn(projections)

  const residuals = opts.residuals
  const signal = (el: ValueElement, reason: string, presentWidths: number[]): void => {
    residuals?.push({ kind: residualKindOf(el), reason, capturedAxes: capturedAxesOf(el), widths: presentWidths })
  }

  const children: L1Node[] = []
  /** BUG-27 — box leaves painting a background photograph; they belong in the
   *  background layer, beneath all content (see where they are emitted below). */
  const backdropNodes: L1Box[] = []
  let imageIdx = 0
  let boxIdx = 0
  // BUG-14 — the surface each text run sits on, collected per run for the post-loop
  // section-band → card → text reconstruction (replaces BUG-11's per-run backing
  // box, which produced a rectangle behind every paragraph).
  const surfaceRows: SurfaceRow[] = []
  // REQ-93 — captured form controls, collected for the post-loop grouping into
  // behavior-module slots (a control is never an L1 leaf; see below).
  const controlRows: ControlRow[] = []
  // REQ-93 — a captured submit affordance carries text, so the text-leaf branch
  // claims it before the control branch ever sees it. That is right for a *page*
  // button and wrong for a *form's* button: left as a page-level run it sits
  // beside a form that also renders its own default button. Buttons are recorded
  // here and, after clustering, one that sits with a form is lifted out of the
  // page body into that form's `submit` slot.
  const submitCandidates: Array<{
    node: L1Node
    frames: Array<{ at: number; box: NonNullable<ValueElement['box']> }>
  }> = []
  for (const row of table.rows) {
    const present = row.cells.filter((c) => c.element)
    const sample = present[0]?.element
    if (!sample) continue // a truly empty row — nothing was captured, nothing to signal
    const presentWidths = present.map((c) => c.width)

    // Keyframes: one per present cell that carries a box, ascending by width. A
    // box/image leaf pins all four sides (height too); a text leaf's height is
    // natural (from flow), so its keyframes omit height (the text path below).
    const framed = row.cells.filter((c) => c.element?.box)
    const buildGeometry = (withHeight: boolean): L1Geometry => {
      const keyframes = framed.map((c) => {
        const box = c.element!.box!
        // REQ-88 — a text box rounds its width UP. A shrink-to-fit run's captured
        // box IS its glyph extent (element width === renderedTextBox width), so
        // rounding to nearest makes the box narrower than the text it must hold
        // whenever the fraction is below .5 — and CSS answers that by wrapping.
        // `Gigabyte Alchemy` measured 685.31 and was pinned at 685, so the hero
        // title reflowed onto a second line the reference never had. Ceil is the
        // smallest integer that still contains the measured content; a box/image
        // leaf has no such constraint and stays on nearest.
        const width = withHeight ? Math.round(box.width) : Math.ceil(box.width)
        const kf: L1Keyframe = { at: c.width, x: Math.round(box.x), y: Math.round(box.y), width }
        if (withHeight && Number.isFinite(box.height)) kf.height = Math.round(box.height)
        // REQ-88 — the viewport height this keyframe was measured at, so a height
        // response has an origin to be measured from.
        const h = heightAt.get(c.width)
        if (h) kf.atHeight = h
        return kf
      })
      const geometry: L1Geometry = { keyframes }
      if (keyframes.length > 1) {
        geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
      }
      // REQ-88 — the viewport-height response, measured element-for-element
      // against the height probe, and the centred-column anchor where `x`/`width`
      // are that column's function rather than a line through the samples.
      const response = framed.map((c) => responseOf.get(c.element!)).find(Boolean)
      if (response) geometry.viewportResponse = response
      if (columnFit) {
        const anchor = fitAnchor(
          framed.map((c) => ({ at: c.width, box: c.element!.box! })),
          columnFit,
          geometry.segments,
        )
        if (anchor) geometry.anchor = anchor
      }
      return geometry
    }
    const widest = (framed[framed.length - 1] ?? present[present.length - 1]).element!
    const vis = framed.length ? visibilityFor(framed.map((c) => c.width), widths) : undefined

    // ── Text leaf (the round-trip oracle compares text axes) ───────────────────
    if (!sample.textless && sample.text.trim() !== '') {
      if (framed.length === 0) {
        signal(sample, 'text run has no geometry (no box at any sampled width)', presentWidths)
        continue
      }
      // BUG-20 — a self-painting chip (a `rounded-full` badge) carries its own
      // surface on the text leaf; a bare run carries only type axes.
      const chip = isSelfPaintingRun(widest)
      const axes: L1TextAxes = chip ? { ...textAxes(widest), ...chipAxes(widest) } : textAxes(widest)
      // REQ-88 — from the width at which the reference stopped wrapping this run,
      // pin it unbreakable. The fold hands the run a fixed-width box whose slack
      // over its own glyphs is routinely a fraction of a pixel, and each engine
      // measures glyphs differently — so without this the reference's own line
      // count is re-decided, per browser, by rounding. See `axes.nowrapFromPx`.
      const nowrapFrom = nowrapThreshold(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (nowrapFrom !== undefined) axes.nowrapFromPx = nowrapFrom
      const node: Extract<L1Node, { kind: 'text' }> = {
        kind: 'text',
        text: widest.text,
        axes,
        geometry: buildGeometry(false),
      }
      // BUG-18 — keyframe the numeric type axes that vary across the ladder, so
      // font-size (etc.) scales per width instead of pinning the desktop value.
      const responsive = responsiveTextTracks(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (responsive) node.responsive = responsive
      if (vis) node.visibility = vis
      const pad = foldPadding(widest)
      if (pad) node.padding = pad
      // REQ-88 — a side that varies across the ladder gets its own track, so the
      // widest sample's inset is no longer replayed at every width.
      const padTracks = responsivePaddingTracks(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (padTracks) node.responsivePadding = padTracks
      children.push(node)

      // REQ-93 — see `submitCandidates`. Recorded, not yet claimed: whether this
      // button belongs to a form is only knowable once the controls are grouped.
      if (sample.a11yRole === 'button') {
        const frames = framed
          .map((c) => ({ at: c.width, box: c.element!.box }))
          .filter((f): f is { at: number; box: NonNullable<ValueElement['box']> } => Boolean(f.box))
        if (frames.length) submitCandidates.push({ node, frames })
      }

      // BUG-20 — a chip paints its own surface on the text leaf above, so it
      // contributes no surface row: emitting one would duplicate the pill as a
      // card box behind the run (and pollute band/card signature detection with
      // the chip's own fill). The enclosing card is defined by its other runs.
      if (chip) continue

      // BUG-14 — record this run's immediate surface (composited fill / gradient +
      // card treatments) with its per-width geometry. No backing box is emitted
      // here; the band/card hierarchy is rebuilt from these rows after the loop.
      const surfFill = (widest.surfaceFill ? colorToHex(widest.surfaceFill) : null) ?? undefined
      const surfGrad = foldGradient(widest.surfaceGradient)
      const surfBorderLeft = foldBorderLeftAxis(widest.borderLeft)
      const surfBorder = foldBorder(widest.border)
      const surfShadow = foldShadow(widest.boxShadow, { spread: true, inset: true })
      const surfRadius = widest.borderRadiusPx
      // REQ-88 — the surface-bearing element's own rect + rounding, per width. The
      // capture resolves the painting ancestor (BUG-22's `SurfaceShape`), so the
      // card's edges and corners are measured rather than inferred from its runs.
      //
      // A surface that spans the whole viewport is the *band*, not a card: the run
      // sits directly on the section with no card element between them. Bands are
      // reconstructed separately ({@link buildSolidBands}), so such a row keeps its
      // run box here — adopting the band rect would stretch a quote's accent rule
      // across the entire section.
      //
      // REQ-88 (round 6) — a run whose only card treatment is an ACCENT RULE has
      // no fill, so `surface` resolves straight past its wrapper to the band and
      // the clause above discards it. Falling through to the run's own box put the
      // 4px rule at the text's left edge — indented by the wrapper's padding from
      // where the reference paints it, and (since a border paints inside its own
      // border box) overlapping the first glyph. `accentBox` is that wrapper's
      // measured rect; it is consulted only when no card-shaped fill was resolved,
      // so a card that paints both keeps its fill rect for both.
      const shapeBoxAt = (el: ValueElement, at: number): NonNullable<ValueElement['box']> | undefined => {
        const shape = el.surface?.box
        return shape && shape.width < at ? shape : undefined
      }
      const surfFrames = framed
        .map((c) => {
          const el = c.element!
          const box = shapeBoxAt(el, c.width) ?? (el.borderLeft ? el.accentBox ?? undefined : undefined)
          return { at: c.width, box }
        })
        .filter((f): f is { at: number; box: NonNullable<ValueElement['box']> } => Boolean(f.box))
      // Rounding belongs to the resolved *surface* shape. An accent wrapper is a
      // different element with its own (square) corners, so a row that fell back
      // to `accentBox` must not inherit the band's radius along the way.
      const widestAt = framed[framed.length - 1]?.width ?? 0
      const surfShapeRadius = shapeBoxAt(widest, widestAt) ? widest.surface?.borderRadiusPx : undefined
      if (
        widest.box &&
        (surfFill ||
          surfGrad ||
          surfBorderLeft ||
          surfBorder ||
          surfShadow ||
          (surfRadius && surfRadius > 0) ||
          (surfShapeRadius && surfShapeRadius > 0))
      ) {
        surfaceRows.push({
          fill: surfFill,
          gradient: surfGrad,
          borderLeft: surfBorderLeft,
          border: surfBorder,
          boxShadow: surfShadow,
          borderRadiusPx: surfRadius,
          frames: framed.map((c) => ({ at: c.width, box: c.element!.box! })),
          widest: widest.box,
          surfaceFrames: surfFrames,
          surfaceRadiusPx: surfShapeRadius,
          viewportResponse: framed.map((c) => responseOf.get(c.element!)).find(Boolean),
        })
      }
      continue
    }

    // An empty-string text run (not text-free) never had substance — signal, drop.
    if (!sample.textless) {
      signal(sample, 'empty text run — no leaf emitted', presentWidths)
      continue
    }

    // ── Image leaf — a text-free media element (`<img>`) with a resolvable src ──
    if (isMediaElement(sample)) {
      // An src the envelope will not accept (a `data:` lazy-load placeholder, a
      // paren-bearing URL) is a *content* condition, not a system bug: signal it
      // as a folder-power gap rather than letting it reach `validateL1` and take
      // the fold-level throw path, which would burn the whole capture/gate run
      // over one image (BUG-6 / REQ-92 — signal, don't drop; never crash).
      if (framed.length === 0 || !widest.src || !isSafeUrl(widest.src)) {
        signal(
          sample,
          !widest.src
            ? 'media element captured without a resolvable src'
            : !isSafeUrl(widest.src)
              ? 'media element src is not an allowed URL (http/https or relative only) — asset must be mirrored before it can fold'
              : 'media element has no geometry at any sampled width',
          presentWidths,
        )
        continue
      }
      const axes = imageAxes(widest)
      const node: L1Image = {
        kind: 'image',
        id: `image-${imageIdx++}`,
        src: widest.src,
        alt: widest.alt ?? widest.accessibleName ?? '',
        geometry: buildGeometry(true),
      }
      if (Object.keys(axes).length) node.axes = axes
      if (vis) node.visibility = vis
      const pad = foldPadding(widest)
      if (pad) node.padding = pad
      // REQ-88 — a side that varies across the ladder gets its own track, so the
      // widest sample's inset is no longer replayed at every width.
      const padTracks = responsivePaddingTracks(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (padTracks) node.responsivePadding = padTracks
      children.push(node)
      continue
    }

    // Form controls (inputs, textareas, Turnstile) belong to a behavior module,
    // not a raw L1 leaf (DOC-25/26) — so the fold never synthesizes an `<input>`.
    //
    // REQ-93 — but declining to fake one is not the same as dropping it. The
    // controls are collected here and, after the loop, grouped into the forms
    // they visibly belong to; each group becomes a `slot` node at its union rect
    // that a `contact-form` instance mounts into. A control with no geometry at
    // any width has nothing to mount at, so it stays a residual.
    if (sample.a11yRole && FORM_CONTROL_ROLES.has(sample.a11yRole)) {
      if (framed.length === 0) {
        signal(sample, 'form control has no geometry at any sampled width — no slot to mount at', presentWidths)
        continue
      }
      controlRows.push({
        samples: framed.map((c) => ({ at: c.width, element: c.element!, box: c.element!.box! })),
      })
      continue
    }

    // ── Box leaf — a text-free element that paints a standalone surface ─────────
    if (paintsSurface(sample)) {
      // The gap is *geometry*, not expressiveness — name it as such rather than
      // falling through to the "neither media nor a surface" reason below (which
      // would misreport a surface the language can already express).
      if (framed.length === 0) {
        signal(sample, 'painted surface has no geometry at any sampled width', presentWidths)
        continue
      }
      const axes = boxAxes(widest)
      const node: L1Box = { kind: 'box', id: `box-${boxIdx++}`, geometry: buildGeometry(true) }
      if (Object.keys(axes).length) node.axes = axes
      if (vis) node.visibility = vis
      const pad = foldPadding(widest)
      if (pad) node.padding = pad
      // REQ-88 — a side that varies across the ladder gets its own track, so the
      // widest sample's inset is no longer replayed at every width.
      const padTracks = responsivePaddingTracks(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (padTracks) node.responsivePadding = padTracks
      // BUG-27 — a box painting a background PHOTOGRAPH, or a full-bleed panel
      // fill, is a backdrop rather than content. The manifest lists every text-free
      // element after the runs of its band, so pushing one into `children` (which
      // the renderer paints in document order, absolutely positioned with no
      // z-index) would lay the hero image OVER the hero's own headline. Backdrops
      // are collected separately and placed in the background layer, beside the
      // section-background boxes they are a peer of.
      if (isBackdrop(node)) backdropNodes.push(node)
      else children.push(node)
      continue
    }

    signal(sample, 'text-free element is neither media, a painted surface, nor a known control — no L1 leaf yet', presentWidths)
  }

  // BUG-14 — rebuild the section-band → card → text hierarchy from the collected
  // surface rows. A row is a *band* row when it is a full-width content run with no
  // card treatment; its fill is a band fill. A row *sits on* its band (emits no
  // box) when it carries a band fill and no treatment. Everything else with a
  // surface is a *card* — grouped into card boxes carrying their treatments.
  const pageContentWidth = Math.max(1, ...surfaceRows.map((r) => r.widest.width))
  const FULL_WIDTH_FRAC = 0.7
  const isFullWidth = (r: SurfaceRow): boolean => r.widest.width >= FULL_WIDTH_FRAC * pageContentWidth
  const bandFills = new Set<string>()
  for (const r of surfaceRows) {
    if (r.fill && isFullWidth(r) && !hasCardTreatment(r)) bandFills.add(r.fill)
  }
  // BUG-19 — full-bleed **bar** fills (footer / nav strip). A bar paints its fill
  // edge-to-edge, but its runs are individually narrow and horizontally
  // *distributed* (space-between), so no single run is full-width and the
  // single-run rule above misses it — each run would wrongly become a tiny card,
  // exposing the page background across the bar. Its members become band rows.
  const barFills = barBandFills(surfaceRows, pageContentWidth, FULL_WIDTH_FRAC)
  const bandRows: SurfaceRow[] = []
  const cardRows: SurfaceRow[] = []
  for (const r of surfaceRows) {
    const isBar = Boolean(r.fill) && !hasCardTreatment(r) && barFills.has(r.fill!)
    const onBand = !hasCardTreatment(r) && Boolean(r.fill) && bandFills.has(r.fill!)
    if (isBar) bandRows.push(r) // BUG-19 — a bar member defines the full-bleed bar band
    else if (onBand && isFullWidth(r)) bandRows.push(r)
    else if (onBand) continue // a narrow run on the band paints nothing of its own
    else if (r.fill || r.gradient || hasCardTreatment(r)) cardRows.push(r)
  }
  // REQ-88 — the captured section boundaries per width: every section box's top
  // and bottom edge, ascending. These are where the page's surfaces actually
  // change, and they bound how far a band may tile past its own content.
  const sectionEdges = new Map<number, number[]>()
  for (const p of projections) {
    const edges = new Set<number>()
    for (const sv of p.manifest.sections ?? []) {
      if (!sv.box) continue
      edges.add(Math.round(sv.box.y))
      edges.add(Math.round(sv.box.y + sv.box.height))
    }
    // BUG-27 — a backdrop's edges are section edges too. Style-scope segmentation
    // only ever sees TOP-LEVEL bands, so a page-builder site whose panels are all
    // nested inside one wrapper yields a single section and no interior edge at
    // all — leaving the clamp above with nothing to clamp to (exactly the case
    // this bug was filed on). A captured background photograph marks a real
    // surface change by construction, so its top and bottom bound a band the same
    // way a section edge does: without this the hero's black fill, read off the
    // runs sitting on it, tiles 3200px down a page that is white below 900.
    for (const node of backdropNodes) {
      const kf = node.geometry?.keyframes.find((k) => k.at === p.viewport.width)
      if (!kf || kf.height === undefined) continue
      edges.add(Math.round(kf.y))
      edges.add(Math.round(kf.y + kf.height))
    }
    sectionEdges.set(p.viewport.width, [...edges].sort((a, b) => a - b))
  }
  const bandNodes = buildSolidBands(bandRows, widths, sectionEdges, heightAt, edgeResponses)
  const cardNodes = buildCards(cardRows, widths, heightAt, columnFit)

  // The page base is the band fill covering the greatest total height (shows only
  // through gaps between the full-bleed bands).
  //
  // BUG-27 — the captured backdrops count towards that height alongside the
  // reconstructed bands. They ARE full-bleed bands, read straight off the page
  // rather than inferred from the surfaces runs sit on, so on a page whose panels
  // are all nested (and which therefore reconstructs almost no bands of its own)
  // they are the only honest evidence of what the page is mostly painted in.
  const bandHeightByFill = new Map<string, number>()
  for (const b of [...bandNodes, ...backdropNodes]) {
    // REQ-114 — a colour axis is `hex | PaletteRef`; the fold only ever emits
    // literals (palette assignment is a separate, re-runnable pass over a folded
    // site), so a non-literal here is not this code's to interpret.
    const fill = b.axes?.surfaceFill
    if (typeof fill !== 'string' || !b.geometry) continue
    const kf = b.geometry.keyframes[b.geometry.keyframes.length - 1]
    bandHeightByFill.set(fill, (bandHeightByFill.get(fill) ?? 0) + (kf.height ?? 0))
  }
  let band: string | undefined
  let bandExtent = 0
  for (const [fill, h] of bandHeightByFill) {
    if (h > bandExtent) {
      bandExtent = h
      band = fill
    }
  }
  // Fallback when no full-bleed bands were found: the most common run fill, and
  // failing that the captured canvas fill (BUG-27 — `<body>`'s own background, the
  // literal answer to "what shows where nothing is painted"). The canvas is the
  // LAST resort, not the first: where bands do not quite meet, the dominant band
  // reads truer than the canvas hiding behind them.
  if (!band) {
    const counts = new Map<string, number>()
    for (const r of surfaceRows) if (r.fill) counts.set(r.fill, (counts.get(r.fill) ?? 0) + 1)
    let best = 0
    for (const [fill, n] of counts) if (n > best) ((best = n), (band = fill))
  }
  if (!band) {
    band = projections
      .map((p) => p.manifest.bodyBackground)
      .find((c): c is string => typeof c === 'string' && c.length > 0)
  }

  // BUG-13 — section/band background images (the hero). Paint order beneath
  // everything: solid bands, then section-image bands, then cards, then content.
  const sectionBgNodes = foldSectionBackgrounds(projections, widths)

  // REQ-93 — the behaviour seams. Each cluster of captured controls is one form;
  // its `slot` node is pinned at the cluster's union rect per width, so the
  // mounted behaviour occupies exactly the space the reference gave the form.
  // Emitted last so a mounted form paints above the surfaces behind it.
  const slotNodes: L1Slot[] = []
  const claimedSubmits = new Set<L1Node>()
  clusterControls(controlRows).forEach((group, i) => {
    const name = `form-${i}`
    const byWidth = new Map<number, NonNullable<ValueElement['box']>>()
    for (const row of group) {
      for (const s of row.samples) {
        const prev = byWidth.get(s.at)
        byWidth.set(s.at, prev ? unionBox(prev, s.box) : s.box)
      }
    }
    // REQ-93 — claim this form's submit button, if the reference gave it one.
    // Matching is geometric because the capture reads painted boxes, not the
    // DOM's `<form>` boundaries: the nearest unclaimed button within the same
    // gap scale that separates fields *within* a form (never the one belonging
    // to the other form on the page — see `submitProximityThreshold`).
    const widestWidth = Math.max(...byWidth.keys())
    const groupWidest = byWidth.get(widestWidth)!
    const threshold = submitProximityThreshold(
      group.map((r) => r.samples[r.samples.length - 1]?.box.height ?? 0),
    )
    let submit: { node: L1Node; frames: typeof submitCandidates[number]['frames'] } | undefined
    let best = Infinity
    for (const cand of submitCandidates) {
      if (claimedSubmits.has(cand.node)) continue
      const box = cand.frames.find((f) => f.at === widestWidth)?.box
      if (!box) continue
      const d = boxDistance(groupWidest, box)
      if (d <= threshold && d < best) ((best = d), (submit = cand))
    }
    if (submit) {
      claimedSubmits.add(submit.node)
      // The button is the form's, so the form's seam must be big enough to hold
      // it — otherwise the mounted button would render outside its own slot.
      for (const f of submit.frames) {
        const prev = byWidth.get(f.at)
        byWidth.set(f.at, prev ? unionBox(prev, f.box) : f.box)
      }
    }
    const keyframes: L1Keyframe[] = [...byWidth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([at, box]) => {
        const kf: L1Keyframe = {
          at,
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        }
        const h = heightAt.get(at)
        if (h) kf.atHeight = h
        return kf
      })
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, k) => segmentKind(keyframes[k], kf))
    }
    const node: L1Slot = { kind: 'slot', id: name, name, behavior: 'contact-form', geometry }
    const vis = visibilityFor([...byWidth.keys()].sort((a, b) => a - b), widths)
    if (vis) node.visibility = vis
    slotNodes.push(node)

    // REQ-96 — the form's presentation, as `control` leaves inside a box pinned
    // at the seam. Every control keeps the geometry and paint the capture
    // measured; only the ORIGIN changes, from the page to the seam the module
    // mounts at. Under REQ-93 the module placed its own controls from a
    // stylesheet, which is why the reference's field heights and surfaces — and
    // its inline submit button — could not reproduce at all.
    const rebase = (box: NonNullable<ValueElement['box']>, at: number): L1Keyframe => {
      const seam = byWidth.get(at)!
      return {
        at,
        x: Math.round(box.x - seam.x),
        y: Math.round(box.y - seam.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    }
    const rebasedGeometry = (
      frames: Array<{ at: number; box: NonNullable<ValueElement['box']> }>,
    ): L1Geometry => {
      const kfs = frames
        .filter((f) => byWidth.has(f.at))
        .sort((a, b) => a.at - b.at)
        .map((f) => {
          const kf = rebase(f.box, f.at)
          const h = heightAt.get(f.at)
          if (h) kf.atHeight = h
          return kf
        })
      const geo: L1Geometry = { keyframes: kfs }
      if (kfs.length > 1) geo.segments = kfs.slice(1).map((kf, k) => segmentKind(kfs[k], kf))
      return geo
    }

    const form = foldedFormFor(name, group, { kind: 'box', children: [] })
    const controlNodes: L1Node[] = group.map((row, fi) => {
      const widestEl = row.samples[row.samples.length - 1].element
      const control: L1Control = {
        kind: 'control',
        id: `${name}-${form.fields[fi].name}`,
        control: form.fields[fi].name,
        geometry: rebasedGeometry(row.samples.map((s) => ({ at: s.at, box: s.box }))),
      }
      // A captured control paints its surface on its own element, exactly as a
      // chip run does — same axes, same reader.
      const axes = chipAxes(widestEl)
      if (Object.keys(axes).length) control.axes = axes
      return control
    })
    if (submit) {
      const chip = submit.node as L1Text
      const submitControl: L1Control = {
        kind: 'control',
        id: `${name}-submit`,
        control: 'submit',
        geometry: rebasedGeometry(submit.frames),
      }
      if (chip.axes) submitControl.axes = chip.axes
      if (chip.responsive) submitControl.responsive = chip.responsive
      if (chip.padding) submitControl.padding = chip.padding
      if (chip.responsivePadding) submitControl.responsivePadding = chip.responsivePadding
      controlNodes.push(submitControl)
      form.submitLabel = chip.text
    }
    form.form = {
      kind: 'box',
      id: `${name}-body`,
      geometry: {
        keyframes: keyframes.map((kf) => ({ ...kf, x: 0, y: 0 })),
        ...(geometry.segments ? { segments: geometry.segments } : {}),
      },
      children: controlNodes,
    }
    opts.forms?.push(form)
  })

  // A claimed button is the form's control now, not a page-level run — leaving it
  // in the body as well would paint the reference's one button twice.
  const body = claimedSubmits.size ? children.filter((c) => !claimedSubmits.has(c)) : children

  const root: L1Box = {
    kind: 'box',
    // BUG-27 — `backdropNodes` (element-level background photographs) sit with the
    // section-background boxes: both are backdrops, painted beneath cards and
    // content. Ordered after `sectionBgNodes` because a nested backdrop is, by
    // construction, inside the section whose background it overlays.
    children: [...bandNodes, ...sectionBgNodes, ...backdropNodes, ...cardNodes, ...body, ...slotNodes],
  }
  const doc: L1Document = { widths, root }
  if (band) doc.background = band
  // REQ-88 — declared only when at least one node actually anchors to it, so an
  // unfitted page carries no dead constant and the validator's "anchor without a
  // column" check stays meaningful.
  if (columnFit && hasAnchoredNode(root)) doc.column = columnFit.column

  // REQ-90 — bind painted family handles to their served substance so the render
  // resolves the real face. Built before validation so the envelope scheme-checks
  // each font `src` alongside the rest of the document.
  if (opts.fonts && opts.fonts.length) {
    const fonts = usedFontFaces(opts.fonts, children)
    if (fonts.length) doc.resources = { fonts }
  }

  const result = validateL1(doc)
  if (!result.ok) {
    const detail = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    throw new Error(`foldToL1: produced an invalid L1 document — ${detail}`)
  }
  return result.value
}
