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
  isSafeHref,
  isSafeUrl,
  l1PlainText,
  validateL1,
  type L1BlendMode,
  type L1Border,
  type L1Box,
  type L1SurfaceAxes,
  type L1Column,
  type L1ContainerNode,
  type L1ColumnAnchor,
  type L1ColumnTerm,
  type L1Control,
  type L1ControlAxes,
  type L1Document,
  type L1Filter,
  type L1FontFace,
  type L1AxisSizing,
  type L1Geometry,
  type L1GradientStop,
  type L1LinearGradient,
  type L1Image,
  type L1ImageAxes,
  type L1Heading,
  type L1Keyframe,
  type L1Link,
  type L1Mask,
  type L1Node,
  type L1ObjectPosition,
  type L1Overlay,
  type L1Padding,
  type L1PaddingResponsive,
  type L1ScalarKeyframe,
  type L1ScalarTrack,
  type L1Segment,
  type L1Shadow,
  type L1Slot,
  type L1Text,
  type L1TextAxes,
  type L1TextRun,
  type L1TextRunAxes,
  type L1TextResponsive,
  type L1Transform,
  type L1ViewportResponse,
} from '@1stcontact/site-schema'
// REQ-157 — from the TABLE, not the command. `responsive-diff.ts` is
// `1c responsive-diff`: it reads a bundle directory and writes JSON, so importing
// it here put `node:fs`, the filesystem stores and a loopback server into the
// graph of everything that folds a capture — including, once REQ-157 arrived, a
// Worker. The builder this actually uses is pure and now lives on its own.
import {
  buildResponsiveTable,
  elementKey,
  type LabelledProjection,
  type ResponsiveCell,
} from '../cli/responsive-table'
// REQ-211 — the ONE decision about which captured runs are pieces of one
// sentence, shared with the fidelity oracle in `probes.ts`. See that module's
// header for why it cannot be a branch in either caller.
import { flowLead, rejoinableFlows, type InlineFlow } from './inline-runs'
// REQ-350 — the rebase arithmetic, shared with `group_l1`.
import { frameAt, rebaseInto, responseAt, surfaceBorderInset } from './rebase'
// REQ-331 — the shared statement of what a captured CSS treatment actually
// paints: the shadow parse and the filter identity table, read by the fold here
// and by the comparator in `values-diff.ts`.
import { FILTER_FUNCTIONS, parseShadowLayers, type ShadowLayer } from '../cli/capture/treatments'
import { paintsMaskEdge } from '../cli/capture/mask-geometry'
import {
  boxDistance,
  clusterControls,
  foldedFormFor,
  submitProximityThreshold,
  type ControlRow,
  type FoldedForm,
} from './forms'
// REQ-157 — the deep path, not the `capture` barrel. That barrel re-exports
// `playwright-driver` (it says so in its own header, and declines to re-export
// the Browser Rendering driver for the same reason), so importing it here put
// Playwright into the graph of everything that folds a capture. The four values
// this actually uses are all in `values-diff.ts` and none of them wants a
// browser.
import {
  colorToHex,
  colorToHexAlpha,
  partitionProbes,
  type MultiStateCapture,
  type SectionValues,
  type StateProjection,
  type ValueElement,
} from '../cli/capture/values-diff'
// REQ-332 — the clip box an element is cut off at; the fold's only reader of it.
import type { ClipAncestor } from '../cli/capture/types'

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
 * REQ-370 — where the LINES of a run that is its own surface (a button, a pill
 * link: `surface.self`) actually sit, or `undefined` when its box already is
 * them.
 *
 * REQ-265 records a run's line box as its `box`, which holds for any run whose
 * element shrinks to its text. A self-surface run's element is the BUTTON: its
 * box is the border box, and the reference centres the label inside it (flex
 * `align-items: center`, or symmetric padding). Pinning the text node at that box
 * put the label on the button's top border — 13.9px high on hearingzone510.com's
 * 52px "SCHEDULE AN APPOINTMENT", 6px on its bordered phone pill.
 *
 * The glyphs say where the lines are: half-leading is symmetric, so the line
 * block is centred on the rendered text box. The returned top is the LINE BOX's,
 * less the run's own top padding, because the renderer insets the text by that
 * padding inside the box it is given.
 */
function selfSurfaceLines(el: ValueElement): { top: number; height: number } | undefined {
  // REQ-371 — a chip paints its own pill, so it keeps its box and states the
  // inset as padding instead (see {@link withChipInset}).
  if (isSelfPaintingRun(el)) return undefined
  const box = el.box
  const glyphs = el.renderedTextBox
  const lines = lineCountOf(el)
  if (!el.surface?.self || !box || !glyphs || lines === undefined || !el.lineHeightPx) return undefined
  const height = lines * el.lineHeightPx
  if (box.height <= height + 1) return undefined
  const centre = glyphs.y + glyphs.height / 2
  const top = Math.max(box.y, Math.min(box.y + box.height - height, centre - height / 2))
  const pad = el.paddingTopPx !== undefined && Number.isFinite(el.paddingTopPx) ? Math.max(0, el.paddingTopPx) : 0
  return { top: top - pad, height: height + pad }
}

/**
 * REQ-371 — a self-painting run (a chip: see {@link isSelfPaintingRun}) seen
 * through its BOX: the vertical inset that box holds around its lines, stated as
 * padding, or the element unchanged when its own padding already accounts for it.
 *
 * A chip paints its pill on the text node itself, and a text node's height is
 * natural — border + padding + lines. A pill sized by `min-height` and centred by
 * `display: flex; align-items: center` (Zyro's `.grid-button--primary`) has no
 * padding at all, so the node rendered at its line height: a 56px CTA 21px tall,
 * and every band below it 35px high.
 *
 * The lines sit where the glyphs say (half-leading is symmetric, so the line block
 * is centred on the rendered text box); what is left of the box above and below
 * them is the inset. The two sides are rounded so they still sum to the box, since
 * the padding axis is what fixes the node's height.
 */
function withChipInset(el: ValueElement): ValueElement {
  const box = el.box
  const glyphs = el.renderedTextBox
  if (!box || !glyphs || !Number.isFinite(glyphs.height) || glyphs.height <= 0) return el
  const lines = lineCountOf(el)
  const lineH = lines !== undefined && el.lineHeightPx ? lines * el.lineHeightPx : glyphs.height
  const border = el.border?.widthPx && Number.isFinite(el.border.widthPx) ? Math.max(0, el.border.widthPx) : 0
  const inner = box.height - 2 * border
  const own = (v: number | undefined): number => (v !== undefined && Number.isFinite(v) ? Math.max(0, v) : 0)
  if (inner - lineH - own(el.paddingTopPx) - own(el.paddingBottomPx) <= 1) return el
  const contentTop = box.y + border
  const centre = glyphs.y + glyphs.height / 2
  const lineTop = Math.max(contentTop, Math.min(contentTop + inner - lineH, centre - lineH / 2))
  const total = Math.round(inner - lineH)
  const top = Math.min(total, Math.round(lineTop - contentTop))
  return { ...el, paddingTopPx: top, paddingBottomPx: total - top }
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
 * REQ-351 (issue 3) — keyed by the WIDTH the probe measured at, not collapsed to
 * one pair per section.
 *
 * It used to be collapsed, with the reasoning stated in place: "the CSS rule
 * producing them (`min-h-screen`) is not itself width-varying, and re-probing at
 * every width would multiply capture cost by the ladder length." Both halves were
 * wrong. A height rule inside a media query IS width-varying — the reference
 * hero's `100vh` is overridden below 1024 and measured at 305.5px there — and
 * because `HEIGHT_PROBE_VIEWPORTS` held one entry, the last probe to be read
 * simply overwrote the others, so the collapse was not a considered average but
 * whichever width happened to come last. Keyed per width, a section that responds
 * at one width and not at another says exactly that, and a width nothing probed
 * says nothing at all.
 */
function sectionBoxFactors(
  probes: HeightProbe[],
): Map<number, Map<number, { top: number; bottom: number }>> {
  const byIndex = new Map<number, Map<number, { top: number; bottom: number }>>()
  for (const { ladder, probe, deltaH, width } of probes) {
    const a = ladder.manifest.sections ?? []
    const b = probe.manifest.sections ?? []
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const ab = a[i]?.box
      const bb = b[i]?.box
      if (!ab || !bb) continue
      const byWidth = byIndex.get(i) ?? new Map<number, { top: number; bottom: number }>()
      byWidth.set(width, {
        top: snapFactor((bb.y - ab.y) / deltaH) ?? 0,
        bottom: snapFactor((bb.y + bb.height - (ab.y + ab.height)) / deltaH) ?? 0,
      })
      byIndex.set(i, byWidth)
    }
  }
  return byIndex
}

/**
 * REQ-338 (issue 4) — the same measured section-edge factors, expressed as the
 * `viewportResponse` of the section's own BOX: its top travels by `top`, and its
 * height grows by the difference of its two edges.
 *
 * `foldSectionBackgrounds` had no viewport-height branch at all, so every
 * `section-bg-N` was PINNED while every run standing on it carried `yFactor: 1`.
 * At the captured heights the two agree by construction and the page is exact; at
 * every other height the content walks off its own backing surface — 161 of the
 * 367 `escape` findings on joyfulculinarycreations.com, and 100% of its
 * `structural-failure` verdict, on four boxes that answered the question with
 * nothing. The measurement was already in hand ({@link sectionEdgeResponses}
 * reads the identical probe pair); only the emission was missing.
 */
function sectionViewportResponses(
  probes: HeightProbe[],
): Map<number, Map<number, L1ViewportResponse>> {
  const out = new Map<number, Map<number, L1ViewportResponse>>()
  for (const [index, byWidth] of sectionBoxFactors(probes)) {
    const responses = new Map<number, L1ViewportResponse>()
    for (const [width, f] of byWidth) {
      const r: L1ViewportResponse = {}
      if (Math.abs(f.top) >= 0.005) r.yFactor = f.top
      const height = snapFactor(f.bottom - f.top)
      if (height !== undefined) r.heightFactor = height
      if (r.yFactor !== undefined || r.heightFactor !== undefined) responses.set(width, r)
    }
    if (responses.size > 0) out.set(index, responses)
  }
  return out
}

/**
 * REQ-88 — {@link sectionBoxFactors} keyed the way a BAND reads it: per width, by
 * the document `y` of each section edge, because a band's extent is clamped to
 * those edges and its own height response is the difference of the two it lands
 * between.
 */
function sectionEdgeResponses(
  probes: HeightProbe[],
  projections: StateProjection[],
): Map<number, Map<number, number>> {
  const byIndex = sectionBoxFactors(probes)
  const out = new Map<number, Map<number, number>>()
  if (byIndex.size === 0) return out
  for (const p of projections) {
    const m = new Map<number, number>()
    const secs = p.manifest.sections ?? []
    secs.forEach((sv, i) => {
      // REQ-351 (issue 3) — the factor measured AT THIS WIDTH. A width no probe
      // visited contributes no edge, so the band built across it carries no
      // response there rather than one borrowed from elsewhere on the ladder.
      const f = byIndex.get(i)?.get(p.viewport.width)
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

/**
 * REQ-302 — the precision every derived geometry number is written at.
 *
 * A capture measures `149.546875`; `l1KeyframeSchema` types `x`/`y`/`width` as
 * finite numbers, not integers; and the fold used to write `150`. That 0.45px is
 * not invisible — it shifts every glyph in the run across a different subpixel
 * grid and scored 127.69 of one reference's 1043.47 ranked perceptual difference
 * with no other measured difference on either side. Two decimals is well inside
 * what a browser resolves and removes the systematic half-pixel, and it is the
 * precision `lineHeightPx` / `letterSpacingPx` already use.
 */
const round2 = (n: number): number => Math.round(n * 100) / 100
/** {@link round2}'s upward twin, for a width that must never fall short. */
const ceil2 = (n: number): number => Math.ceil(n * 100) / 100
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

/**
 * REQ-269 — a captured element's navigation target → the L1 `link` role (REQ-106).
 *
 * The axis has existed since REQ-106 and the renderer has been its sole `<a>` sink
 * ever since, but the capture threw the `href` away after using it to decide an
 * a11y role — so the fold had nothing to write and every reproduced link folded to
 * dead text. The capture now projects the target for a reproduction to consume
 * (site-internal when same-origin, absolute otherwise); this checks it against the
 * same allowlist the validator applies, so an unfoldable target degrades to the
 * un-linked leaf rather than producing a document `validateL1` then rejects.
 */
function foldLink(el: ValueElement): L1Link | undefined {
  const href = el.href?.trim()
  if (!href || !isSafeHref(href)) return undefined
  return { href }
}

/**
 * REQ-269 — a captured run's outline depth → the L1 `heading` role.
 *
 * Bounded here as well as in the validator, for the same reason `foldLink` checks
 * the URL allowlist: a fold that emitted an out-of-range level would produce a
 * document `validateL1` then refuses, which turns a capture quirk into a failed
 * reproduction of the whole page.
 */
function foldHeading(el: ValueElement): L1Heading | undefined {
  const level = el.headingLevel
  if (level == null || !Number.isInteger(level) || level < 1 || level > 6) return undefined
  return { level }
}

/** Map a captured element's authored axes onto the typed L1 text-axis subset. */
/**
 * REQ-211 — the baseline lift a captured run declares, in `em` of its own size.
 *
 * `vertical-align` is a mixed vocabulary: two keywords that mean "a superscript"
 * and "a subscript" with no stated distance, a length, and a set of table/line
 * box keywords that are not a lift at all. Only the first two forms and a length
 * are read; `top` / `middle` / `bottom` align a run against its line box rather
 * than shifting it off a baseline, and rendering them as a shift would move
 * text the reference did not move.
 *
 * The keyword distances are the conventional ones browsers use for `<sup>` and
 * `<sub>`. They are approximations of an engine's own internal constants, which
 * are not exposed — this is a transcription face, and an approximate lift in the
 * right direction reproduces an ordinal, where no lift at all does not.
 */
function foldBaselineShift(el: ValueElement): number | undefined {
  const v = el.verticalAlign
  if (!v || v === 'baseline') return undefined
  if (v === 'super') return 0.4
  if (v === 'sub') return -0.2
  const px = /^(-?[\d.]+)px$/.exec(v)
  if (px && el.fontSizePx > 0) return clamp(Number(px[1]) / el.fontSizePx, -10, 10)
  return undefined
}

/**
 * REQ-211 — one captured run as an L1 run: its words, and only what it does
 * DIFFERENTLY from the node it is being rejoined into.
 *
 * Only the difference, because the node already declares the paragraph. A run
 * that restated the base colour would render identically and read as though the
 * author had picked it — and it would survive a later edit to the node's own
 * colour, silently pinning one word to the old palette entry.
 *
 * The size is a RATIO, which is the whole reason a scale exists rather than a
 * pixel size: the node routinely carries a per-width font-size track, and a run
 * pinned in pixels would win at every width that track covers.
 */
function foldTextRun(el: ValueElement, base: ValueElement): L1TextRun {
  const axes: L1TextRunAxes = {}
  if (el.color && !el.colorInferred && el.color !== base.color) axes.color = el.color
  if (base.fontSizePx > 0 && el.fontSizePx > 0 && el.fontSizePx !== base.fontSizePx) {
    axes.sizeScale = clamp(Math.round((el.fontSizePx / base.fontSizePx) * 1000) / 1000, 0.1, 8)
  }
  if (el.fontWeight && el.fontWeight !== base.fontWeight) axes.fontWeight = el.fontWeight
  const slope = (v: string | null | undefined): 'normal' | 'italic' =>
    v === 'italic' || v === 'oblique' ? 'italic' : 'normal'
  if (slope(el.fontStyle) !== slope(base.fontStyle)) axes.fontStyle = slope(el.fontStyle)
  const shift = foldBaselineShift(el)
  if (shift !== undefined) axes.baselineShiftEm = shift
  // REQ-331 — the two axes that made a rejoin LOSSY before they existed.
  //
  // Both are stated relative to the node's own (the lead run's), exactly as
  // colour, size, weight and slope above are: a run that decorates the same way
  // the paragraph does carries nothing, and the markup a rejoined node emits
  // stays the markup the same copy would have emitted as a plain string plus
  // the differences the reference actually painted.
  //
  // `none` is emitted, not skipped, when the base underlines and this run does
  // not — otherwise the run would inherit a line the reference does not paint.
  const dec = (v: string | null | undefined): L1TextRunAxes['textDecoration'] => foldTextDecoration(v) ?? 'none'
  if (dec(el.textDecoration) !== dec(base.textDecoration)) axes.textDecoration = dec(el.textDecoration)
  // REQ-365 — where the run's underline sits, on the same diff-against-base rule:
  // the node already places a line it paints itself, and the property inherits,
  // so a run restating the node's offset would carry nothing.
  const offset = el.underlineOffsetPx
  if (typeof offset === 'number' && offset !== base.underlineOffsetPx) axes.underlineOffsetPx = offset
  const run: L1TextRun = { text: el.textFlow ?? el.text }
  if (Object.keys(axes).length > 0) run.axes = axes
  // The anchor the run sits in, when it is not the one the whole node sits in.
  // Without this the fold could only keep a linked word by pinning it as its own
  // absolutely-positioned node — which is the transcription REQ-211 exists to
  // replace, so the rejoin would have traded a live link for a stable layout.
  const link = foldLink(el)
  if (link && link.href !== foldLink(base)?.href) run.link = link
  return run
}

function textAxes(el: ValueElement): L1TextAxes {
  const axes: L1TextAxes = {}
  // Colour is dropped when the capture only *guessed* it (the #000/#fff sentinel),
  // so a folded doc never pins a low-confidence colour.
  if (el.color && !el.colorInferred) axes.color = el.color
  if (el.fontFamily) axes.fontFamily = el.fontFamily
  if (Number.isFinite(el.fontSizePx)) axes.fontSizePx = clamp(Math.round(el.fontSizePx), FONT_SIZE.min, FONT_SIZE.max)
  if (Number.isFinite(el.fontWeight)) axes.fontWeight = clamp(Math.round(el.fontWeight), FONT_WEIGHT.min, FONT_WEIGHT.max)
  // REQ-269 — two decimals, exactly as letterSpacingPx on the next line. The axis
  // is `finite`, not an integer, and rounding here would discard the fraction the
  // capture now records (see `RESPONSIVE_TEXT_AXES.lineHeightPx`, which must agree).
  if (el.lineHeightPx !== undefined && el.lineHeightPx !== null)
    axes.lineHeightPx = Math.round(el.lineHeightPx * 100) / 100
  if (el.letterSpacingPx !== undefined) axes.letterSpacingPx = Math.round(el.letterSpacingPx * 100) / 100
  if (el.textAlign) axes.textAlign = el.textAlign
  // REQ-370 — spaces the reference lets take width.
  if (el.whiteSpace === 'break-spaces' || el.whiteSpace === 'pre-wrap') axes.whiteSpace = el.whiteSpace
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
  // REQ-365 — the capture records an offset only beside a painted underline.
  if (typeof el.underlineOffsetPx === 'number') axes.underlineOffsetPx = el.underlineOffsetPx
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
  lineHeightPx: (v: number) => Math.round(v * 100) / 100,
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
 * ONE parsed shadow layer → the L1 structured shadow (REQ-92).
 *
 * REQ-331 — the PARSE moved to `capture/treatments.ts`, because the values-diff
 * has to read the same string the same way (it used to read a shadow only as
 * present-or-absent). What is left here is the projection onto L1's typed shape:
 * which fields this axis admits (`textShadow` passes neither spread nor inset),
 * and the omission of a default (a zero spread is not written).
 *
 * The colour keeps its ALPHA. A shadow's colour is one the browser composites
 * itself, so a captured `rgba(0, 0, 0, 0.6)` is the value and `#000000` is a
 * different, solid, wrong one — measured on faelan.com as three drop shadows
 * reproducing as smears.
 */
function shadowLayerToL1(layer: ShadowLayer, opts: { spread: boolean; inset: boolean }): L1Shadow {
  const shadow: L1Shadow = { offsetXPx: layer.offsetXPx, offsetYPx: layer.offsetYPx, color: layer.color }
  if (layer.blurPx > 0) shadow.blurPx = layer.blurPx
  if (opts.spread && layer.spreadPx !== 0) shadow.spreadPx = layer.spreadPx
  if (opts.inset && layer.inset) shadow.inset = true
  return shadow
}

/**
 * A captured computed shadow string → EVERY layer of it, in paint order.
 *
 * REQ-331 — this used to take `css.split(…)[0]` and throw the rest away, and the
 * comment beside it said so: "first layer, not splitting inside rgb(...)". That
 * was not a shortcut, it was the axis being one object wide — there was nowhere
 * to put layer two. Now that {@link l1BoxShadowSchema} carries a stack, dropping
 * it would be a fold shortfall rather than a language one.
 *
 * What was being dropped, measured on faelan.com: three photographs each painted
 * `rgba(0,0,0,0.6) 0 15px 50px` PLUS `rgba(255,255,255,0.15) 0 0 30px` — and that
 * second, pale, outer glow is what separates a torn photograph from the dark
 * montage behind it.
 *
 * A layer that will not parse is skipped rather than ending the list: a stack
 * with its glow missing is nearer the reference than no shadow at all.
 */
function foldShadows(
  css: string | null | undefined,
  opts: { spread: boolean; inset: boolean },
): L1Shadow | L1Shadow[] | undefined {
  const layers = parseShadowLayers(css)
    .slice(0, L1_SHADOW_LAYERS_MAX)
    .map((layer) => shadowLayerToL1(layer, opts))
  if (layers.length === 0) return undefined
  // One layer is the object; two-or-more is the array. The schema states the same
  // rule ({@link l1BoxShadowSchema}) and refuses a one-element array, so this is
  // not a stylistic choice — it is the canonical form.
  return layers.length === 1 ? layers[0] : layers
}

/** The stack cap {@link l1BoxShadowSchema} enforces, so the fold never emits past it. */
const L1_SHADOW_LAYERS_MAX = 4

/** A single-layer shadow, for the axes L1 still types as one (`textShadow`). */
function foldShadow(
  css: string | null | undefined,
  opts: { spread: boolean; inset: boolean },
): L1Shadow | undefined {
  const first = parseShadowLayers(css)[0]
  return first ? shadowLayerToL1(first, opts) : undefined
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
/**
 * A captured box-border treatment → the L1 structured border, else undefined.
 *
 * REQ-336 — `colorToHexAlpha`, not `colorToHex`. A border is a colour the BROWSER
 * composites at paint time, so a translucent one is a real property of the page:
 * `rgba(255,255,255,.3)` is a hairline you can see the photograph through, and
 * truncating it to six digits paints a solid white ring. `colorToHex` would also
 * have *refused* the 8-digit literal the capture now records (its hex branch takes
 * three or six digits and slices, so `#ffffff4d` came back `#ffffff`), which is the
 * second half of the same loss and why both sites change together.
 */
function foldBorder(b: ValueElement['border']): L1Border | undefined {
  if (!b || !(b.widthPx > 0)) return undefined
  const color = colorToHexAlpha(b.color)
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

// REQ-331 — the filter identity table moved to `capture/treatments.ts`, so the
// values-diff can read the same statement of "this value paints nothing" the
// fold has always acted on. See {@link FILTER_FUNCTIONS} there.

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
  /**
   * REQ-332 — where each surviving function stood in the CAPTURED chain, so the
   * order can be written down beside the values.
   *
   * CSS filter functions do not commute — `contrast` lifts every channel and
   * `saturate` is a matrix on RGB, so the lift before and after the saturation
   * are different images — and the axis used to hold eight named scalars with no
   * order at all, leaving the renderer to impose one of its own. Measured on
   * joyfulculinarycreations.com's hero scrim, captured
   * `brightness(0.67) contrast(0.88) saturate(1.06)` and served
   * `saturate(1.06) brightness(0.67) contrast(0.88)`.
   */
  const position = new Map<string, number>()
  for (const fn of FILTER_FUNCTIONS) {
    const m = v.match(new RegExp(`(?:^|\\s)${fn.css}\\(\\s*(-?\\d*\\.?\\d+)(%|deg|px|)\\s*\\)`, 'i'))
    if (!m) continue
    if (m.index !== undefined) position.set(fn.axis, m.index)
    let n = parseFloat(m[1])
    if (!Number.isFinite(n)) continue
    // A ratio written as a percentage is the same filter written differently.
    if (fn.unit === 'ratio' && m[2] === '%') n /= 100
    // Clamped into the envelope rather than dropped: a value past a bound is a
    // real treatment the target paints, and the nearest expressible one reproduces
    // it far better than nothing does. Negative is not a treatment.
    if (fn.unit !== 'deg' && n < 0) continue
    // BOTH ENDS, from the envelope the validator enforces. A one-sided clamp let a
    // captured `hue-rotate(-5000deg)` — negative is meaningful for a rotation, so
    // the guard above lets it through — fold to a document `validateL1` then
    // refuses, which is the fold emitting output its own envelope rejects.
    n = Math.min(Math.max(n, fn.min), fn.max)
    n = Math.round(n * 1e4) / 1e4
    // The identity paints nothing, so carrying it would grow every folded
    // definition with declarations that cost a composite layer and move no pixel.
    if (n === fn.identity) continue
    filter[fn.axis] = n
  }
  const axes = Object.keys(filter)
  if (!axes.length) return undefined
  // REQ-332 — the order is only written down when it DIFFERS from the renderer's
  // own. A chain the emitter would have produced anyway needs no declaration, and
  // omitting it keeps the fold's output identical to what it was for every
  // document whose functions already happened to be in canonical order.
  const captured = [...axes].sort((a, b) => position.get(a)! - position.get(b)!)
  const canonical = FILTER_FUNCTIONS.map((f) => f.axis).filter((a) => a in filter)
  const out = filter as L1Filter
  if (captured.join() !== canonical.join()) out.order = captured as L1Filter['order']
  return out
}

/**
 * REQ-331 — a captured `mask-image` gradient → L1's typed feather mask.
 *
 * The capture has recorded `maskEdge` since REQ-48 and `l1MaskSchema` has had
 * `featherRadial` / `featherTop` / `featherBottom` since REQ-136; nothing
 * connected the two, so three feathered photographs on faelan.com reproduced
 * with hard rectangular edges and the only report of it was a bare
 * `mask: present → none`.
 *
 * FEATHER WIDTH IS THE VALUE THE AXIS CARRIES, so that is what is read: the
 * transparent run of the gradient (from the last fully-opaque stop to the
 * outermost one), as a fraction, times the box's smaller side. It is an
 * approximation and it is the RIGHT one to make — L1 names the intent ("this
 * edge is feathered, this far in") and the renderer owns the geometry, exactly
 * as it does for every other mask shape, so a reproduction that matched the
 * reference's gradient string character-for-character would be a document
 * authoring CSS.
 *
 * A gradient this cannot read — a conic sweep, an image mask, a `clip-path`
 * polygon — is left UNFOLDED rather than guessed at. A wrong mask crops the
 * photograph; a missing one is the hard edge that was there before, and the
 * residual report already names it.
 */
/**
 * REQ-333 — a `radial-gradient()`'s ENDING SHAPE, in px, against the box it masks.
 *
 * A radial gradient's colour stops are fractions of this shape, so it is the frame
 * every stop has to be read in. The size slot was previously never parsed at all —
 * the stop regex matched colours only, and `ellipse 92% 92% at 50% 50%` was
 * discarded wholesale — which is the whole of {@link foldMask}'s radial defect.
 *
 * Only a CENTRED shape is resolved: an off-centre origin is a genuinely different
 * mask that L1's feather axis does not name, and answering with a centred one would
 * be a guess. `null` means "unreadable", and {@link foldMask}'s contract for that is
 * to emit no mask rather than an invented one.
 */
function radialEndingShape(
  css: string,
  box: { width: number; height: number },
): { rx: number; ry: number } | null {
  const open = css.indexOf('(')
  const close = css.lastIndexOf(')')
  if (open < 0 || close <= open) return null
  const body = css.slice(open + 1, close)
  // The first TOP-LEVEL comma ends the size/position slot. `rgb(0, 0, 0)`'s commas
  // are nested, so depth-counting is what separates the slot from the first stop.
  let depth = 0
  let cut = body.length
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) {
      cut = i
      break
    }
  }
  let slot = body.slice(0, cut).trim()
  // A gradient that opens straight onto a colour stop has no size slot; CSS's
  // default ending shape is `farthest-corner`.
  if (/#|rgba?\(|transparent|\bblack\b|\bwhite\b/i.test(slot)) slot = ''
  // `at <position>`: only the centre is expressible.
  const at = /\bat\b([\s\S]*)$/i.exec(slot)
  if (at) {
    const pos = at[1].trim().toLowerCase()
    const centred = pos === '' || pos === 'center' || pos === 'center center' || pos === '50% 50%'
    if (!centred) return null
    slot = slot.slice(0, at.index).trim()
  }
  const circle = /\bcircle\b/i.test(slot)
  const tokens = slot
    .replace(/\b(circle|ellipse)\b/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const hx = box.width / 2
  const hy = box.height / 2
  if (tokens.length === 0 || /^(closest|farthest)-(side|corner)$/i.test(tokens[0] ?? '')) {
    const keyword = (tokens[0] ?? 'farthest-corner').toLowerCase()
    // Centred, so "closest" and "farthest" name the same side and the same corner.
    const corner = keyword.endsWith('-corner')
    // An ellipse through the corner keeps `closest-side`'s aspect ratio, so both
    // radii scale by sqrt(2); a circle's radius is the distance to the corner.
    if (corner) return circle ? { rx: Math.hypot(hx, hy), ry: Math.hypot(hx, hy) } : { rx: hx * Math.SQRT2, ry: hy * Math.SQRT2 }
    return circle ? { rx: Math.min(hx, hy), ry: Math.min(hx, hy) } : { rx: hx, ry: hy }
  }
  // Explicit radii. A percentage resolves against the box's corresponding
  // dimension (CSS: width for the horizontal radius, height for the vertical).
  const resolve = (tok: string, against: number): number | null => {
    const m = /^(-?\d*\.?\d+)(%|px)$/i.exec(tok)
    if (!m) return null
    const n = parseFloat(m[1])
    if (!Number.isFinite(n) || n < 0) return null
    return m[2] === '%' ? (n / 100) * against : n
  }
  if (tokens.length === 1) {
    const r = resolve(tokens[0], Math.min(box.width, box.height))
    return r === null ? null : { rx: r, ry: r }
  }
  const rx = resolve(tokens[0], box.width)
  const ry = resolve(tokens[1], box.height)
  return rx === null || ry === null ? null : { rx, ry }
}

function foldMask(
  css: string | null | undefined,
  box: { width: number; height: number } | undefined,
): L1Mask | undefined {
  if (!css || /^none$/i.test(css.trim()) || !box) return undefined
  // Colour stops, in order, with the offset each was given. A stop with no
  // offset cannot say where the feather starts, so an unoffset gradient reads as
  // unfoldable rather than as one starting at zero.
  const stops: Array<{ transparent: boolean; at: number }> = []
  const re = /(rgba?\(([^)]*)\)|#[0-9a-fA-F]{3,8}|transparent)\s*(\d*\.?\d+)%/gi
  for (const m of css.matchAll(re)) {
    const alpha = /^transparent$/i.test(m[1])
      ? 0
      : m[2] !== undefined
        ? (parseFloat(m[2].split(',')[3] ?? '1') ?? 1)
        : 1
    stops.push({ transparent: !(alpha > 0), at: parseFloat(m[3]) })
  }
  if (stops.length < 2) return undefined
  const outer = stops[stops.length - 1]
  const first = stops[0]
  // The run over which the mask goes from fully opaque to fully transparent, as
  // a fraction of the gradient's own extent.
  const run = (a: number, b: number): number => Math.abs(b - a) / 100

  if (/^radial-gradient\(/i.test(css.trim())) {
    // A radial feather fades OUTWARD: the last stop is the transparent one.
    if (!outer.transparent || first.transparent) return undefined
    const lastOpaque = [...stops].reverse().find((s) => !s.transparent)
    if (!lastOpaque) return undefined
    // REQ-333 — a colour stop is a fraction of the gradient's OWN ENDING SHAPE, not
    // of the box. Multiplying it by the box's smaller side is only right when the
    // two coincide (`closest-side`), and the "soft-edged photograph" idiom puts its
    // ending ellipse deliberately OUTSIDE the box: `ellipse 92% 92%` is ~1.84x the
    // half-extent, so a stop 28% in from that shape landed as a 62px band measured
    // in from the box edge and erased 21.5% of each of faelan.com's three collage
    // photographs, where the reference attenuates their corners by 0.17 at most.
    // So read the ending shape and work in ITS units.
    const ending = radialEndingShape(css, box)
    if (!ending) return undefined
    const { rx, ry } = ending
    if (!(rx > 0) || !(ry > 0)) return undefined
    // The extent is one number only when both radii are the same share of their own
    // box dimension — which is what `P% P%` and every extent keyword give. A pixel
    // radius on a non-square box is a genuinely two-number shape the axis cannot
    // hold, and so is a transparent stop short of the ending shape; both fall to the
    // one-parameter band below.
    const extentPct = (rx / box.width) * 100
    const uniform = Math.abs(rx / box.width - ry / box.height) < 5e-3
    if (uniform && Math.abs(outer.at - 100) < 0.5) {
      // The document's own three numbers, transcribed. Nothing is attenuated when
      // the opaque core already reaches the ending shape.
      if (lastOpaque.at >= 100) return undefined
      return {
        shape: 'featherRadial',
        extentPct: round2(extentPct),
        opaqueStopPct: round2(lastOpaque.at),
      }
    }
    // One-parameter fallback: the renderer's band is measured in from the box's own
    // half-extent, so that is the frame the source's opaque radius is converted
    // into. An opaque core that already reaches the half-extent attenuates nothing
    // INSIDE the box, and the honest answer there is no mask rather than a feather.
    const halfExtent = Math.min(box.width, box.height) / 2
    const featherPx = Math.round(halfExtent - (lastOpaque.at / 100) * Math.min(rx, ry))
    return featherPx > 0 ? { shape: 'featherRadial', featherPx } : undefined
  }

  const linear = /^linear-gradient\(\s*to\s+(top|bottom)/i.exec(css.trim())
  if (!linear) return undefined
  // Which EDGE of the box the transparent end sits at, resolved through the
  // gradient's own direction — `to bottom` runs top→bottom, `to top` the other
  // way, so the same stop list names opposite edges under the two.
  const towardsBottom = linear[1].toLowerCase() === 'bottom'
  const fadedEnd = first.transparent ? 'start' : outer.transparent ? 'end' : null
  if (fadedEnd === null) return undefined
  const atTop = fadedEnd === 'start' ? towardsBottom : !towardsBottom
  const opaque = fadedEnd === 'start' ? stops.find((s) => !s.transparent) : [...stops].reverse().find((s) => !s.transparent)
  if (!opaque) return undefined
  const featherPx = Math.round(run(opaque.at, fadedEnd === 'start' ? first.at : outer.at) * box.height)
  return featherPx > 0 ? { shape: atTop ? 'featherTop' : 'featherBottom', featherPx } : undefined
}

/**
 * REQ-336 — the captured wrapper transform → the L1 node's `transform` axis.
 *
 * A collage's photographs are turned a few degrees each by a `transform:rotate()`
 * on the `<div>` that wraps them. The capture has recorded that as
 * `transformRotateDeg` all along, `l1TransformSchema` has had `rotateDeg` all
 * along, and the renderer emits `rotate(<deg>)` — the fold was the only stage that
 * had nowhere to put it, so four turned pictures reproduced square-on and the
 * rotation was worth every one of the ranked pixel regions on faelan.com.
 *
 * A NODE FIELD, not an axis (the shape `mask` has): `transform` lives on
 * `nodeAxisGroupsShape`, so every leaf kind can carry one and this is read at each
 * of them rather than inside `imageAxes`. A wrapper rotation on a headline is the
 * same loss as one on a photograph.
 *
 * Out-of-envelope values are DROPPED rather than clamped: a rotation past ±3600°
 * (ten turns) or a non-positive scale is not a design this can half-honour, and
 * `validateL1` would refuse the document rather than ignore the field — which
 * would cost the whole fold over one element. The drop is not silent: it is
 * exactly what {@link droppedAxesOf} reports as a residual.
 *
 * The identity is not a transform. `rotate(0deg)` / `scale(1)` move no pixel, and
 * emitting one would cost a composite layer and promote the node into the
 * positioned paint layer for nothing — the same reason `foldFilter` drops an
 * identity function.
 */
function foldTransform(el: ValueElement): L1Transform | undefined {
  const transform: L1Transform = {}
  const rot = el.transformRotateDeg
  if (
    rot !== undefined &&
    Number.isFinite(rot) &&
    rot !== 0 &&
    rot >= L1_ENVELOPE.rotateDeg.min &&
    rot <= L1_ENVELOPE.rotateDeg.max
  ) {
    transform.rotateDeg = round2(rot)
  }
  const scale = el.transformScale
  if (
    scale !== undefined &&
    Number.isFinite(scale) &&
    scale !== 1 &&
    scale >= L1_ENVELOPE.transformScale.min &&
    scale <= L1_ENVELOPE.transformScale.max
  ) {
    transform.scale = round2(scale)
  }
  return Object.keys(transform).length ? transform : undefined
}

/**
 * REQ-347 — a captured `zIndex` → the L1 node's `paintOrder`, else undefined.
 *
 * The capture reads the level off the nearest ancestor the property applies to
 * (see `zIndexOf`), so what arrives here is the level the reference actually
 * paints this element at among its siblings — the fact a flat reproduction has no
 * other way to recover. Without it the renderer emits no `z-index` at all and
 * document order decides, which on faelan.com put a 64px headline underneath an
 * opaque collage photograph.
 *
 * ZERO IS NOT A LEVEL. `z-index: auto` and `z-index: 0` both arrive as 0 and both
 * mean "document order decides" to a flat document, which is exactly what absent
 * means — so the field is omitted rather than written, and a page that stacks
 * nothing folds byte-for-byte to what it folded before.
 *
 * CLAMPED, NOT DROPPED, at the envelope bound — the opposite of `foldTransform`'s
 * rule, and for a reason that is about what the axis IS. A rotation past ten turns
 * is not a design that can be half-honoured, so half-honouring it would be a
 * fabrication; a rank has no such property. `z-index: 2147483647` means "above
 * everything", clamping it to 1000 still means "above everything" relative to
 * every other level on the page, and dropping it would silently return the node to
 * document order — which is the defect, not a safe default.
 */
function foldPaintOrder(el: ValueElement): number | undefined {
  const z = el.zIndex
  if (z === undefined || !Number.isFinite(z)) return undefined
  const clamped = Math.max(L1_ENVELOPE.paintOrder.min, Math.min(L1_ENVELOPE.paintOrder.max, Math.round(z)))
  return clamped === 0 ? undefined : clamped
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
  // ── REQ-211 the inline flow this element belongs to ────────────────────────
  //
  // Declared here as well as on `ValueElement` because this shape is what the
  // FIDELITY ORACLE is handed (`OracleSource`), and the oracle has to rejoin
  // exactly the flows the fold rejoins. Leaving them off the declared contract
  // would make that agreement an accident of the concrete object rather than a
  // property of the interface both sides are written against.
  inlineGroup?: string
  inlineIndex?: number
  inlineBox?: { x: number; y: number; width: number; height: number } | null
  textFlow?: string
  verticalAlign?: string | null
  color?: string
  fontSizePx?: number
  fontWeight?: number
  fontStyle?: string | null
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
/**
 * BUG-173 — the tolerance, in px, within which a box's width "equals the
 * viewport" at a captured rung. Shared by the fold, which marks such a node as
 * tracking its container ({@link markViewportTracking}), and by the probe, which
 * holds such a surface to spanning the window — the two must agree on which
 * boxes they are about.
 */
export const FULL_BLEED_TOLERANCE_PX = 1.5

export const SYNTHESIZED_SURFACE_ID_PREFIXES = ['section-band-', 'section-bg-', 'card-'] as const

/** True for a fold-synthesized backing surface — see {@link SYNTHESIZED_SURFACE_ID_PREFIXES}. */
export function isSynthesizedSurfaceId(id: string | undefined): boolean {
  return id !== undefined && SYNTHESIZED_SURFACE_ID_PREFIXES.some((p) => id.startsWith(p))
}

/**
 * REQ-332 — the id prefix of a **captured backdrop**: a full-bleed, childless
 * `box` leaf that arrived as a capture element and paints only a fill (± a
 * background photograph) behind a whole section.
 *
 * WHY IT IS ITS OWN PREFIX AND NOT ONE OF THE THREE ABOVE. A captured backdrop is
 * a backing surface in every geometric sense — it is the thing an entire band of
 * copy stands on — but it is NOT fold-invented: it has an oracle counterpart of
 * its own, so it must stay in the fidelity pairing queue that
 * {@link SYNTHESIZED_SURFACE_ID_PREFIXES} exists to keep surfaces out of. The two
 * questions "did the fold invent this?" and "does this back content?" used to have
 * one answer because only the fold ever made a backdrop; a captured one separates
 * them, so there are now two predicates. {@link isBackingSurfaceId} is the second.
 *
 * Measured on `joyfulculinarycreations.com`, whose eleven section bands all arrive
 * as capture `field`s: named `box-*`, they were simultaneously OVER-asserted (1172
 * `overlap` findings, a fill colliding with the copy it was painted for) and
 * UN-asserted (0 `escape` findings, because no run could name one as its backing
 * surface) — the two states a surface must never be in at once.
 */
export const CAPTURED_BACKDROP_ID_PREFIX = 'backdrop-'

/**
 * REQ-332 — true for a box that BACKS CONTENT, however it arrived: a
 * fold-synthesized surface ({@link isSynthesizedSurfaceId}) or a captured backdrop
 * ({@link CAPTURED_BACKDROP_ID_PREFIX}).
 *
 * This is the predicate every *geometric* judgement about surfaces asks — the
 * overlap exemption, the `backedBy` attribution, and the containment probe that
 * holds a surface to the copy standing on it. `isSynthesizedSurfaceId` remains the
 * predicate for the one question that is genuinely about PROVENANCE: whether the
 * node has an oracle counterpart to be paired against.
 */
export function isBackingSurfaceId(id: string | undefined): boolean {
  return isSynthesizedSurfaceId(id) || (id !== undefined && id.startsWith(CAPTURED_BACKDROP_ID_PREFIX))
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
 * REQ-351 (issue 5) — does this run's text OCCUPY A LINE BOX?
 *
 * `String.prototype.trim()` strips the full Unicode whitespace set, U+00A0
 * included, so `'\u00a0'.trim() === ''` and a deliberate `&nbsp;` spacer — a run
 * whose ENTIRE content is the non-breaking space the page author put there to
 * hold a line open — read as "never had substance" and was dropped. On
 * joyfulculinarycreations.com that was the round's highest-severity value delta
 * (CRITICAL, severity 4060) and its only `unmatched`: a 162 × 21.59px line the
 * reference reserves and the reproduction does not.
 *
 * So substance is decided by stripping only the ASCII whitespace class. U+00A0,
 * U+2007 (figure space), U+202F (narrow no-break space), U+2060 (word joiner)
 * and U+200B (zero-width space) all count as content, because the author wrote
 * them to occupy space and the browser lays out a line box for them.
 *
 * Read by every stage that has to agree about which runs exist — the fold's own
 * leaf decision, the L1 oracle's reference-side run list ({@link
 * module:probes.oracleSamples}) and the round-trip projection — so a run one of
 * them keeps cannot be a run another silently drops.
 */
export function hasTextSubstance(text: string | undefined | null): text is string {
  return (text ?? '').replace(/[ \t\r\n\f\v]+/g, '') !== ''
}

/**
 * Decide the L1 leaf kind an element folds to. `text` (styled run), `image`
 * (media), `box` (standalone painted surface), `control` (a form control — a
 * behavior-module seam, never a raw leaf), `unknown` (a text-free element with
 * no recognised substance), or `empty` (an empty-string run). Ignores
 * geometry/src availability, which the fold gates separately.
 */
export function classifyElement(el: FoldableElement): FoldLeafKind {
  if (!el.textless) return hasTextSubstance(el.text) ? 'text' : 'empty'
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
  const shadow = foldShadows(el.boxShadow, { spread: true, inset: true })
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
  const shadow = foldShadows(el.boxShadow, { spread: true, inset: true })
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
  const shadow = foldShadows(el.boxShadow, { spread: true, inset: true })
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

/**
 * The painted pixel-mover axes {@link capturedAxesOf} enumerates.
 *
 * REQ-336 — a NAMED UNION rather than `string`, so {@link axisCarriedBy} cannot
 * fall out of step with it: the axis-by-axis decision there is an exhaustive
 * switch over this union, so adding an axis below is a compile error until
 * somebody says whether an emitted leaf carries it. That is the whole guard
 * against the instrument going blind again the way it did here — `transformRotateDeg`
 * was in this list, and reported on nothing.
 */
type CapturedAxis =
  | 'objectFit'
  | 'intrinsicAspect'
  | 'backgroundImageUrl'
  | 'surfaceFill'
  | 'surfaceGradient'
  | 'border'
  | 'borderRadiusPx'
  | 'boxShadow'
  | 'backdropFilter'
  | 'blendMode'
  | 'opacity'
  | 'maskEdge'
  | 'transformRotateDeg'
  | 'transformScale'
  | 'zIndex'
  | 'accessibleName'

/** The painted pixel-mover axes present on an element — the residual's substance (B2). */
function capturedAxesOf(el: ValueElement): CapturedAxis[] {
  const axes: CapturedAxis[] = []
  const has = (name: CapturedAxis, v: unknown): void => {
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
  // REQ-371 — an `inset(0)` clip clips nothing (see `paintsMaskEdge`).
  if (paintsMaskEdge(el.maskEdge)) axes.push('maskEdge')
  has('transformRotateDeg', el.transformRotateDeg)
  if (el.transformScale !== undefined && el.transformScale !== 1) axes.push('transformScale')
  // REQ-347 — a declared paint level. `has` already drops 0, which is the level
  // that means "document order decides" and is therefore nothing to lose.
  has('zIndex', el.zIndex)
  has('accessibleName', el.accessibleName)
  return axes
}

/**
 * REQ-336 — does the leaf the fold emitted carry this captured axis? `undefined`
 * when the node alone cannot say.
 *
 * A residual used to be a per-ELEMENT fact (emitted / not emitted) when the thing
 * it describes is a per-AXIS one. An element can fold faithfully in six axes and
 * lose the seventh, and that was indistinguishable from losing nothing: the four
 * rotated photographs on faelan.com were emitted as image leaves, so no residual
 * was ever considered for them, and `foldResiduals` read `[]` on a fold that had
 * just dropped four rotations it can already print the name of.
 *
 * THREE ANSWERS, NOT TWO. `false` claims a drop, and a false claim is worse than
 * silence here — this list is the completeness signal the growth loop reads
 * (DOC-21), so a row nobody can act on costs more than a row that is missing.
 * `undefined` is therefore the honest answer wherever the axis has no destination
 * ON THE NODE:
 *
 *   - a text run's `surfaceFill` / `surfaceGradient` / `border` / `borderRadiusPx` /
 *     `boxShadow` are read off an ANCESTOR (the enclosing card) or off the run's own
 *     element, and either way they are carried by the card/band boxes rebuilt AFTER
 *     this loop, not by the text node. Judging them from the node would report a
 *     residual for every run on a page with a background colour.
 *   - `intrinsicAspect` is a property of the ASSET, not a declared axis: L1 has no
 *     aspect field, and the rendered box already states the shape.
 *   - `accessibleName` is a name, not a painted axis. On an image it is `alt`; on a
 *     run it is the copy itself.
 */
function axisCarriedBy(axis: CapturedAxis, node: L1Node): boolean | undefined {
  const axes = (node as { axes?: Record<string, unknown> }).axes
  const on = (key: string): boolean => axes !== undefined && axes[key] !== undefined
  // The kinds whose OWN axis bag carries a surface treatment. A text leaf's does
  // not (see the doc comment above), and a `slot` / `container` paints nothing.
  const surfaceKind = node.kind === 'box' || node.kind === 'image'
  switch (axis) {
    case 'transformRotateDeg':
      return node.transform?.rotateDeg !== undefined
    case 'transformScale':
      return node.transform?.scale !== undefined
    case 'maskEdge':
      return node.mask !== undefined
    // REQ-347 — a node field on every kind, like `transform` and `mask`, so every
    // leaf can be judged on it.
    //
    // REQ-371 — except a backdrop, whose level is the fold's decision (it is
    // placed in the background layer, see the box leaf), so its captured level is
    // stated by where it sits rather than dropped.
    case 'zIndex':
      return node.kind === 'box' && isBackdrop(node) ? undefined : node.paintOrder !== undefined
    case 'objectFit':
      return node.kind === 'image' ? on('objectFit') : undefined
    case 'backgroundImageUrl':
      return node.kind === 'box' ? on('backgroundImageUrl') : undefined
    case 'surfaceFill':
      return node.kind === 'box' ? on('surfaceFill') : undefined
    case 'surfaceGradient':
      return node.kind === 'box' ? on('surfaceGradient') : undefined
    case 'backdropFilter':
      return node.kind === 'box' ? on('backdropBlurPx') : undefined
    case 'border':
      return surfaceKind ? on('border') : undefined
    case 'borderRadiusPx':
      return surfaceKind ? on('borderRadiusPx') : undefined
    case 'boxShadow':
      return surfaceKind ? on('boxShadow') : undefined
    case 'blendMode':
      return surfaceKind ? on('blendMode') : undefined
    case 'opacity':
      return surfaceKind ? on('opacity') : undefined
    case 'intrinsicAspect':
    case 'accessibleName':
      return undefined
  }
}

/**
 * REQ-336 — the painted axes an EMITTED leaf lost: the set difference between what
 * {@link capturedAxesOf} found on the element and what {@link axisCarriedBy} can see
 * on the node the fold produced for it. Capped to that enumeration by construction,
 * so it can never become a diff of every key.
 */
function droppedAxesOf(el: ValueElement, node: L1Node): CapturedAxis[] {
  return capturedAxesOf(el).filter((axis) => axisCarriedBy(axis, node) === false)
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
 * BUG-113 — promote {@link segmentKind}'s per-node verdict to a per-window one:
 * a ladder window in which ANY node reflows is a breakpoint, and across a
 * breakpoint every node holds.
 *
 * `segmentKind` is right about each node in isolation and that is exactly the
 * problem. A real page's media query moves some elements and leaves others
 * alone, so across `gigabytealchemy.ai`'s 375→768 window 15 of 70 nodes were
 * classified `snap` and correctly held, while the other 55 interpolated — each
 * one travelling smoothly to a position the two layouts either side of the
 * window agree it never occupies. Half a page holding while the other half
 * slides through it is how the reproduction came to paint its first text field
 * over the prose above it at 700px: a collision that exists at NO captured width
 * and is nobody's individual fault.
 *
 * A held window is also the more faithful model. Between breakpoints a
 * media-query page renders the lower layout unchanged; it does not glide toward
 * the next one. Interpolation is right only where the page is genuinely fluid,
 * and a window carrying a reflow has already said it is not.
 *
 * Fidelity cannot move: at a captured width `snap` and `interpolate` both
 * resolve to that width's own keyframe, so this changes the reproduction only
 * strictly between captured widths — which is the only place it was wrong.
 *
 * Every responsive track on a node is held, not just geometry. An inset track
 * inherits its node's segments by construction (see `insetTrack`), and a scalar
 * axis sliding its type size through a window whose geometry is holding would
 * re-introduce the same disagreement one axis down.
 *
 * `roots` is plural for the same reason the window is document-wide: a recovered
 * form's controls live in {@link FoldedForm.form}, OUTSIDE the document root, and
 * a page whose body holds while its text fields glide through it is the same
 * defect one seam over — it is literally how the field came to paint over the
 * prose. The evidence and the hold both span every root the page is assembled
 * from.
 *
 * REQ-337 — exported, because the fold is no longer the last pass to write a
 * responsive track. `promoteToFlow` INVENTS tracks after this has run (see
 * `withContentInset`), and a track born downstream of the hold carries no
 * `segments` at all, so the renderer's documented default takes over and it
 * interpolates through a window every other track on its own node is holding.
 * Twelve of twelve padding tracks on `gigabytealchemy.ai` were in that state,
 * and the page they serve was up to 201.67px too tall strictly between two
 * captured widths — invisible to every on-sample measure by construction, since
 * `snap` and `interpolate` agree at a rung.
 *
 * Re-running it over the recovery's output is the class fix rather than the site
 * fix: it is not `bottomPx` that is special, it is "a track that did not exist
 * when the windows were decided". It is idempotent over tracks that were already
 * held — a `snap` window recomputes to `snap` — so the second pass can only add.
 *
 * MUTATES IN PLACE. The second caller must own its tree: `promoteToFlow`'s
 * rewrite returns untouched nodes BY REFERENCE from the document it was handed,
 * and that document is the base the recovery is then scored against.
 */
export function holdAcrossReflowWindows(roots: L1Node[], widths: number[]): void {
  if (widths.length < 2) return
  /** Windows `[widths[i], widths[i+1])`, true where some node already snaps. */
  const reflow = new Array(widths.length - 1).fill(false)

  type Track = { keyframes: Array<{ at: number }>; segments?: L1Segment[] }
  /**
   * Every responsive track a node carries whose schema HAS a `segments` key:
   * geometry, and the scalar tracks under `responsive` / `responsivePadding`.
   *
   * BUG-180 — an explicit list, not "anything with a `keyframes` array".
   * `responsiveLayout` has keyframes too, but they are discrete layout modes
   * under a strict schema with no `segments` companion (a mode switch already
   * snaps — there is nothing to hold). Duck typing wrote `segments` onto it, and
   * every page with a layout switch inside a reflow window failed validation.
   */
  const tracksOf = (node: L1Node): Track[] => {
    const axes = node as unknown as {
      geometry?: Track
      responsive?: Record<string, Track | undefined>
      responsivePadding?: Record<string, Track | undefined>
    }
    return [
      axes.geometry,
      ...Object.values(axes.responsive ?? {}),
      ...Object.values(axes.responsivePadding ?? {}),
    ].filter((track): track is Track => !!track && track.keyframes.length > 1)
  }

  const walk = (node: L1Node, visit: (n: L1Node) => void): void => {
    visit(node)
    const children = node.kind === 'container' ? node.children : ((node as L1Box).children ?? [])
    for (const child of children) walk(child, visit)
  }

  for (const root of roots) {
    walk(root, (node) => {
      for (const track of tracksOf(node)) {
        track.segments?.forEach((seg, i) => {
          const window = widths.indexOf(track.keyframes[i].at)
          if (window >= 0 && window < reflow.length && seg === 'snap') reflow[window] = true
        })
      }
    })
  }
  if (!reflow.some(Boolean)) return

  const hold = (node: L1Node): void => {
    for (const track of tracksOf(node)) {
      const segments = track.keyframes.slice(1).map((_, i) => {
        const own = track.segments?.[i] ?? 'interpolate'
        const window = widths.indexOf(track.keyframes[i].at)
        return window >= 0 && reflow[window] ? 'snap' : own
      })
      if (segments.some((seg) => seg === 'snap')) track.segments = segments
    }
  }
  for (const root of roots) walk(root, hold)
}

/**
 * BUG-173 — mark every node that was the viewport's width at EVERY captured rung as
 * filling its container (`sizing.width: fluid`), so it keeps spanning the window
 * above the widest rung instead of freezing at that rung's literal.
 *
 * The capture already answers "does this box keep scaling?". A width that equals
 * the viewport at six rungs from 320 to 1440 is the identity line, and the fold
 * used to write it as six keyframes tracing that line — which the renderer then
 * held at 1440px for every wider window, while the column-anchored copy standing
 * on it kept following the viewport and walked off its right edge.
 *
 * Nothing is inferred beyond the evidence:
 *  - a node whose width PLATEAUS across the upper rungs (a capped page) is not the
 *    viewport's width at every rung, so it is left exactly as it was emitted and
 *    keeps holding its captured width — the reproduction scales above the top
 *    rung only where the original did;
 *  - a node is only marked where its containing block itself spans the viewport
 *    (the page root, a geometry-less wrapper of it, or another marked node, none
 *    of them inset by padding), because `fluid` fills the CONTAINER, and a fill
 *    of anything narrower would move the box at the rungs it already matches;
 *  - a node whose width is column-anchored (REQ-88) keeps its anchor, which
 *    already owns the axis.
 *
 * At every captured rung the rendered box is unchanged — it was already exactly
 * the viewport's width there.
 *
 * MUTATES IN PLACE, like {@link holdAcrossReflowWindows}.
 */
export function markViewportTracking(root: L1Node, widths: number[]): void {
  if (widths.length === 0) return
  const ladder = new Set(widths)
  const spansEveryRung = (geo: L1Geometry): boolean =>
    geo.keyframes.length === ladder.size &&
    geo.keyframes.every((kf) => ladder.has(kf.at) && Math.abs(kf.width - kf.at) <= FULL_BLEED_TOLERANCE_PX)
  const inset = (node: L1Node): boolean =>
    'padding' in node && (node.padding !== undefined || node.responsivePadding !== undefined)
  const walk = (node: L1Node, containerSpans: boolean): void => {
    const geo = 'geometry' in node ? node.geometry : undefined
    let spans = containerSpans && geo === undefined
    // Every kind that can carry geometry carries `sizing` too (REQ-105), so the
    // property is read structurally — a node folded without one has no key at all.
    const sized = node as { sizing?: L1AxisSizing }
    if (geo && containerSpans && !geo.anchor?.width && spansEveryRung(geo) && sized.sizing?.width === undefined) {
      sized.sizing = { ...sized.sizing, width: { mode: 'fluid' } }
      spans = true
    }
    const children = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
    for (const child of children) walk(child, spans && !inset(node))
  }
  walk(root, true)
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
function foldSectionBackgrounds(
  projections: StateProjection[],
  widths: number[],
  heightAt: ReadonlyMap<number, number>,
  sectionResponses: ReadonlyMap<number, ReadonlyMap<number, L1ViewportResponse>>,
): L1Box[] {
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
  for (const [index, entriesRaw] of [...byIndex.entries()].sort((a, b) => a[0] - b[0])) {
    const entries = entriesRaw.sort((a, b) => a.width - b.width)
    const keyframes: L1Keyframe[] = entries.map((e) => {
      const kf: L1Keyframe = {
        at: e.width,
        x: round2(e.sv.box!.x),
        y: round2(e.sv.box!.y),
        width: round2(e.sv.box!.width),
        height: round2(e.sv.box!.height),
      }
      // REQ-338 (issue 4) — the viewport height this box was MEASURED at, so the
      // response below is read against a stated baseline instead of an assumed one.
      const vh = heightAt.get(e.width)
      if (vh) kf.atHeight = vh
      // REQ-338 (issue 4) — and how the box answers a taller viewport, measured
      // from the same height probe every run standing on it is measured from. A
      // `100vh` hero gets `heightFactor: 1`; a band below one gets `yFactor: 1`; a
      // band that does neither gets nothing.
      //
      // REQ-351 (issue 4) — per keyframe, at the width the probe measured. The
      // hero of the page this was filed on is `100vh` at 1024 and above and a
      // content height below; one factor for the node asserted the wrong one of
      // those at three widths of six.
      const response = vh ? sectionResponses.get(index)?.get(e.width) : undefined
      if (response) kf.viewportResponse = response
      return kf
    })
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    // The URL / scrim are the band's; the widest width carrying each is
    // authoritative (they agree). Read per-axis rather than off the widest entry:
    // a section may paint an image at some widths and only a scrim at others.
    const axes: L1SurfaceAxes = {}
    // REQ-338 (issue 1) — the section's OWN measured fill, which is the base every
    // other layer of its background paints over. CSS puts `background-color` under
    // `background-image`, and the renderer does too within one box; emitting the
    // image without it reproduced the hero's photograph over the page backstop
    // instead of over the black it is composited on — and left the band builder's
    // reconstructed plate of the same colour as the only carrier of it, nested
    // INSIDE the image box, painting over the photograph it belongs under.
    const fill = [...entries].reverse().find((e) => typeof e.sv.surfaceFill === 'string')?.sv.surfaceFill
    if (typeof fill === 'string') axes.surfaceFill = fill
    const url = entries.filter((e) => e.sv.backgroundImageUrl).pop()?.sv.backgroundImageUrl
    if (url) axes.backgroundImageUrl = url
    const overlay = entries.filter((e) => e.sv.overlay).pop()?.sv.overlay
    if (overlay) axes.overlay = foldOverlayAxis(overlay)
    const node: L1Box = { kind: 'box', id: `section-bg-${idx++}`, geometry, axes }
    const vis = visibilityFor(entries.map((e) => e.width), widths)
    if (vis) node.visibility = vis
    nodes.push(node)
  }
  return nodes
}

/** A captured section scrim → the L1 `overlay` axis, blend mode included (REQ-338 issue 5). */
function foldOverlayAxis(overlay: NonNullable<SectionValues['overlay']>): L1Overlay {
  const axis: L1Overlay = { color: overlay.color, opacity: overlay.opacity }
  const blend = foldBlendMode(overlay.blendMode)
  if (blend) axis.blendMode = blend
  return axis
}

/**
 * REQ-338 (issues 1 + 2) — a section background that a CAPTURED BACKDROP already
 * paints better must not paint it a second time.
 *
 * Two probes see the same rectangle. The treatments probe reads the dedicated
 * overlay element as an element, with every axis it carries — on
 * joyfulculinarycreations.com's hero that is `opacity: 0.49` and
 * `brightness(67%) contrast(88%) saturate(106%)`, the page's own values to the
 * digit. The section-background probe reads the section, and gets the bare image
 * URL. Both were emitted, 24 absolutely-positioned siblings apart, so the
 * IMPOVERISHED copy painted last: the strip above the reconstructed band plate
 * measured `(243, 248, 251)` against the reference's `(77, 79, 80)` — the highest
 * mean residual on the page (142/255) over 156 of 4743 rows.
 *
 * The backdrop is strictly better informed, so it keeps the image and the section
 * box keeps everything the backdrop cannot express: the section's own base fill,
 * and its scrim — which is MOVED ONTO the backdrop, because a scrim paints over
 * the image it veils and the backdrop paints after this box.
 *
 * A section box left with no axis at all paints nothing and is dropped. Mutates
 * both node sets in place (they are this fold's own, freshly built).
 */
function mergeSectionBackgroundsIntoBackdrops(
  sectionBgNodes: L1Box[],
  backdrops: readonly L1Box[],
  widths: readonly number[],
): L1Box[] {
  if (!backdrops.length) return sectionBgNodes
  const rectsOf = (node: L1Box): Map<number, FoldRect> => {
    const out = new Map<number, FoldRect>()
    for (const kf of node.geometry?.keyframes ?? []) {
      out.set(kf.at, { x: kf.x, y: kf.y, width: kf.width, height: kf.height ?? 0 })
    }
    return out
  }
  const sameRect = (a: FoldRect, b: FoldRect): boolean =>
    Math.abs(a.x - b.x) <= FOLD_CONTAINS_EPS &&
    Math.abs(a.y - b.y) <= FOLD_CONTAINS_EPS &&
    Math.abs(a.width - b.width) <= FOLD_CONTAINS_EPS &&
    Math.abs(a.height - b.height) <= FOLD_CONTAINS_EPS
  const kept: L1Box[] = []
  for (const node of sectionBgNodes) {
    const url = node.axes?.backgroundImageUrl
    const mine = rectsOf(node)
    const twin =
      typeof url === 'string'
        ? backdrops.find((b) => {
            if (b.axes?.backgroundImageUrl !== url) return false
            const theirs = rectsOf(b)
            let shared = 0
            for (const at of widths) {
              const a = mine.get(at)
              const c = theirs.get(at)
              if (!a || !c) continue
              shared++
              if (!sameRect(a, c)) return false
            }
            return shared > 0
          })
        : undefined
    if (!twin) {
      kept.push(node)
      continue
    }
    delete node.axes!.backgroundImageUrl
    const overlay = node.axes!.overlay
    if (overlay) {
      delete node.axes!.overlay
      // The backdrop's own scrim wins if it has one: it was read off the element
      // that paints it, not inferred from the section around it.
      twin.axes = { ...(twin.axes ?? {}), overlay: twin.axes?.overlay ?? overlay }
    }
    if (Object.keys(node.axes!).length > 0) kept.push(node)
  }
  return kept
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
  /** REQ-331 — one layer, or the ordered stack, exactly as the axis carries it. */
  boxShadow?: L1Shadow | L1Shadow[]
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
  /**
   * REQ-351 (issue 2) — the resolved surface's rect at the widest present width
   * WHEN that surface spans the viewport, i.e. when it is the band the run stands
   * on rather than a card around it. Absent otherwise.
   *
   * `surfaceFrames` deliberately drops a band-wide shape (adopting the band's rect
   * would stretch a quote's accent rule across the whole section), and dropping it
   * silently left {@link fill} — read off the SAME element — looking like the run's
   * own card fill. Keeping the rect here is what lets the split below ask whether
   * the fill came from a band, which is the question that decides whether there is
   * a card at all.
   */
  bandSurface?: NonNullable<ValueElement['box']>
  /**
   * REQ-88 — the row's measured viewport-height response, inherited by its card.
   *
   * REQ-351 (issue 4) — keyed by WIDTH, because that is how it was measured: one
   * height probe per ladder width, each a fact about that width alone. Collapsed
   * to a single pair, a rule identified at one width was asserted at all of them.
   */
  viewportResponse?: ReadonlyMap<number, L1ViewportResponse>
  /**
   * BUG-143 — the text node this row was collected from, so the surface the
   * band/card reconstruction builds out of it can write its own id back onto the
   * run (`backedBy`).
   *
   * The link has to travel on the row because the two ends are known at different
   * times: the run exists inside the element loop, the surface only after the
   * whole page has been grouped into bands and cards. Carried here, the fold
   * states the relation as a FACT instead of leaving every later probe to guess it
   * from coordinates that happen to coincide at rest.
   */
  run?: { backedBy?: string }
}

/**
 * A captured asymmetric left-accent border (a card rule) → the L1 `borderLeft` axis.
 * REQ-336 — alpha-preserving on the same terms as {@link foldBorder}: an accent rule
 * is a border, and a translucent one is the common quote-bar idiom.
 */
function foldBorderLeftAxis(bl: ValueElement['borderLeft']): L1Border | undefined {
  if (!bl || !(bl.widthPx > 0)) return undefined
  const color = colorToHexAlpha(bl.color)
  if (!color) return undefined
  return { widthPx: bl.widthPx, color }
}

/** Whether a surface row carries any card treatment (so it is a card, never a plain band). */
function hasCardTreatment(r: SurfaceRow): boolean {
  return Boolean(
    r.borderLeft || r.border || r.boxShadow || (r.borderRadiusPx && r.borderRadiusPx > 0) || r.gradient,
  )
}

/**
 * REQ-351 (issue 2) — the treatments a row bears on ITS OWN element, which is a
 * different list from {@link hasCardTreatment}'s.
 *
 * `gradient` is excluded because it is read the same composited way `fill` is
 * (`surfaceGradientOf` walks the same ancestor chain); the border, the accent
 * rule, the shadow and the radius are measured on the run's own element and are
 * nobody else's. So a row whose colour belongs to the band can still be a card
 * for its border — with the colour removed.
 */
function hasOwnCardTreatment(r: SurfaceRow): boolean {
  return Boolean(r.borderLeft || r.border || r.boxShadow || (r.borderRadiusPx && r.borderRadiusPx > 0))
}

/**
 * REQ-351 (issue 2) — a predicate over surface rows: does this row's fill come
 * from a band that paints a PHOTOGRAPH or a VEIL, making the colour a composite
 * the browser resolved rather than anything the page declares?
 *
 * This is the card-side twin of {@link bandBaseFill}'s scrim guard, which REQ-338
 * landed for the band side. The defect it closes: on
 * joyfulculinarycreations.com, the testimonial quote stands directly on the
 * vegetable band — the capture records `surface.self: false` and a **1280-wide**
 * surface box — so the fill it reports is `darken(#141e14 @ 0.67)` over `#ffffff`
 * = `#636a63`, a colour the page declares nowhere. `shapeBoxAt` correctly declined
 * that 1280-wide rect as a card shape, but the fill from the same element survived
 * and the row was classified on the RUN's width (689 < 0.7 x 1280), so it became a
 * card: a 689 x 153.69px opaque plate of `#636a63` painted back over the very
 * photograph it was sampled from. 18.34% of that page's pixel disagreement — and
 * zero value deltas, because the comparator samples the same composite on both
 * sides and the mistake reproduces the measurement.
 *
 * Deliberately not the blunter "a run whose painting ancestor is not itself
 * contributes no fill": on a conventional page a card's runs are ALL
 * `surface.self: false` — that is what a card is — and the blunt form would delete
 * every card fill on every site. Nor the intermediate "any band-wide surface
 * contributes no fill": a full-width run standing on a plain solid band is
 * band-wide too, and its fill is the only evidence {@link buildSolidBands} has for
 * that band. What makes THIS case different is that the section record says the
 * band paints something the run's colour is a composite OF, so the section record
 * is strictly better evidence and the composite is not evidence at all.
 */
function compositedBandRows(
  sectionsAtWidest: readonly SectionValues[],
  sectionsByWidth: ReadonlyArray<readonly SectionValues[]>,
): (r: SurfaceRow) => boolean {
  return (r: SurfaceRow): boolean => {
    const surface = r.bandSurface
    if (!surface || !r.fill) return false
    // The band the surface lands on, by greatest vertical overlap — the same
    // resolution {@link bandBaseFill} uses, for the same reason: a section's own
    // record is the only thing that knows what it paints.
    let best: SectionValues | undefined
    let bestOverlap = 0
    for (const sv of sectionsAtWidest) {
      if (!sv.box) continue
      const top = Math.max(surface.y, sv.box.y)
      const bot = Math.min(surface.y + surface.height, sv.box.y + sv.box.height)
      if (bot - top > bestOverlap) {
        bestOverlap = bot - top
        best = sv
      }
    }
    if (!best) return false
    // At ANY sampled width, for the reason {@link bandBaseFill} reads every width:
    // a scrim is not always band-wide at the widest one, and a veil recorded at
    // four widths of seven is still the veil this colour composites through.
    return sectionsByWidth.some((sections) => {
      const sv = sections.find((x) => x.index === best!.index)
      return Boolean(sv && (sv.backgroundImageUrl || sv.overlay))
    })
  }
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
  // REQ-331 — a shadow is a STACK now, so the signature covers every layer: two
  // cards whose drop shadow matches but whose outer glow does not are two
  // different surfaces, and collapsing them would paint one card's glow on the
  // other.
  const layer = (l: L1Shadow): string => `${l.offsetXPx},${l.offsetYPx},${l.blurPx ?? 0},${String(l.color)}`
  const sh = r.boxShadow ? (Array.isArray(r.boxShadow) ? r.boxShadow : [r.boxShadow]).map(layer).join(';') : ''
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
 * REQ-271 — the base fill a reconstructed band may carry, given the fill that was
 * read off the runs standing on it.
 *
 * A band's fill is inferred from its runs' `surfaceFill`, and the capture
 * flattens a translucent scrim into every run it covers (the alpha loss itself is
 * BUG-24). So on a hero — a photograph under `bg-slate-950/30` — every run
 * reports an opaque `#030717`, and the band builder promoted that to the band's
 * BASE, painting an opaque navy plate under a section the reference paints
 * nothing on. The same colour was then re-applied properly, at 0.3, as the
 * `overlay` axis of the `section-bg` box emitted above it: the page painted
 * `#030717` twice, once as a plate nobody chose and once as the scrim it is.
 *
 * The two are distinguishable at fold time because the capture carries them
 * separately — `overlay` beside the band's own `surfaceFill`. A group fill equal
 * to the scrim over that band is the scrim, never the base; the base is whatever
 * the band itself paints, which is:
 *
 *  - a colour, when the capture measured one → carry it;
 *  - `null` (nothing), when the capture measured that it paints none → omit the
 *    band entirely, since a box with no fill paints nothing;
 *  - `undefined` (unmeasured — a bundle older than capture schema 3, whose
 *    transparent bands were recorded as an opaque fabrication) → omit as well.
 *    An unmeasured fill is not a licence to keep the scrim colour.
 *
 * REQ-338 (issue 3) — THE SCRIM IS LOOKED FOR AT EVERY SAMPLED WIDTH, not just
 * at the widest. A scrim belongs to the panel that paints it, and a panel that
 * is band-wide on a phone routinely narrows to a centred column on a desktop: on
 * joyfulculinarycreations.com the testimonial band's `#28542d` veil is recorded
 * at 320/375/768/1024 and is `null` at 1280/1440, where the panel it belongs to
 * is 770 of 1280px. Reading only the widest projection saw no overlay there,
 * returned on the first line, and promoted the flattened composite `#28542d` to
 * the band's OPAQUE base at every width — 32.28% of that page's pixel
 * disagreement, at mean 197/255, over a band the reference paints white.
 *
 * A scrim the capture saw at four of seven widths is a scrim. So the band's
 * geometric section is still identified at the widest width (that is the
 * grouping frame every other band decision uses), and the overlay is then looked
 * up by that section's INDEX across every projection — the section list is the
 * same list at every width, joined by index exactly as the values-diff joins it.
 *
 * REQ-338 (issue 1) — AND NOTHING AT ALL when the section box under the band
 * already paints exactly this colour. The reference paints each band once; the
 * fold painted it twice, because a section that carries an image or a scrim
 * emits a `section-bg` box for it AND the run-surface builder reconstructs a
 * plate of the same fill from the runs standing on it. The two are siblings by
 * area, so the plate nested INSIDE the image box and a child painted over its
 * parent: 644 × 1280 px of joyfulculinarycreations.com's hero photograph read
 * `(0, 0, 0)` under an opaque black plate carrying the very colour the section
 * box beneath it was already painting, at 25.96% of that page's diff mass and
 * zero value deltas.
 *
 * The section box is the better carrier — it is the box CSS itself paints, it
 * spans the whole section rather than the extent of the runs, and it holds the
 * image and the scrim that belong over the fill — so the plate is dropped. Only
 * when the section box covers the band EVERYWHERE the band is: a section whose
 * scrim is recorded at four widths of seven emits a box that disappears above
 * 1024 (see {@link visibilityFor}), and a band that stopped painting there would
 * trade one defect for another.
 */
function bandBaseFill(
  fill: string,
  band: { y: number; height: number; x: number; width: number },
  sectionsAtWidest: readonly SectionValues[],
  sectionsByWidth: ReadonlyArray<readonly SectionValues[]>,
): string | null {
  let best: SectionValues | undefined
  let bestOverlap = 0
  for (const sv of sectionsAtWidest) {
    if (!sv.box) continue
    const top = Math.max(band.y, sv.box.y)
    const bot = Math.min(band.y + band.height, sv.box.y + sv.box.height)
    if (bot - top > bestOverlap) {
      bestOverlap = bot - top
      best = sv
    }
  }
  if (!best) return fill
  /** The same section at every width the ladder sampled, widest last. */
  const samples = sectionsByWidth
    .map((sections) => sections.find((sv) => sv.index === best!.index))
    .filter((sv): sv is SectionValues => sv !== undefined)
  const scrimmed = samples.some(
    (sv) => sv.overlay && sv.overlay.color.toLowerCase() === fill.toLowerCase(),
  )
  // The band's own measured fill, from the widest sample that carries one. A
  // sample that measured `null` (paints nothing) is authoritative and must not be
  // skipped over in favour of an earlier width's colour, so the search is for the
  // last sample that measured the axis AT ALL.
  const measured = [...samples].reverse().find((sv) => sv.surfaceFill !== undefined)
  const base = scrimmed
    ? typeof measured?.surfaceFill === 'string'
      ? measured.surfaceFill
      : null
    : fill
  if (base === null) return null
  // REQ-338 (issue 1) — the section box already paints this, over the whole band,
  // at every width the ladder sampled. A second plate of the same colour can only
  // paint over the image and the scrim that belong above the fill.
  //
  // The test is exactly the condition under which {@link foldSectionBackgrounds}
  // emits a box at EVERY sampled width and {@link visibilityFor} therefore gates
  // it at none: the section is recorded at every width, carries a box at each, and
  // carries an image or a scrim at each. Anything weaker would drop the plate at a
  // width where the box that was supposed to replace it is absent, and the band
  // would paint nothing at all there.
  const boxed =
    samples.length === sectionsByWidth.length &&
    samples.every((sv) => !!sv.box && (!!sv.backgroundImageUrl || !!sv.overlay))
  const sectionFill = measured?.surfaceFill
  if (
    boxed &&
    typeof sectionFill === 'string' &&
    sectionFill.toLowerCase() === base.toLowerCase() &&
    best.box !== undefined &&
    foldRectContains(best.box, { x: band.x, y: band.y, width: band.width, height: band.height })
  ) {
    return null
  }
  return base
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
  sectionsAtWidest: readonly SectionValues[],
  sectionsByWidth: ReadonlyArray<readonly SectionValues[]>,
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
        y: round2(top),
        width: w,
        height: round2(Math.max(0, bottom - top)),
      }
      const vh = heightAt.get(w)
      if (vh) kf.atHeight = vh
      // REQ-88 — a band is bounded by SECTION EDGES, so its height response is the
      // difference of its two edges' responses, not anything its runs can report:
      // a `min-h-screen` hero's copy sits in the top half and never moves, while
      // the band's own bottom travels a full viewport height. Both edges are
      // measured, so a band that opens at a fixed edge and closes at a travelling
      // one comes out with exactly the growth the reference has.
      //
      // REQ-351 (issue 4) — written onto THIS keyframe. There used to be a gate
      // above the node-level field — "every width must agree, or the band is not
      // describable as one height rule" — which existed only because one field had
      // to serve the whole ladder: a band that grew with the viewport at the two
      // widest widths and not below was described as not growing anywhere. Per
      // keyframe there is nothing to reconcile, so the gate goes with the field.
      const edges = vh ? edgeResponses.get(w) : undefined
      if (edges) {
        const fTop = edges.get(Math.round(top))
        const fBottom = edges.get(Math.round(bottom))
        if (fTop !== undefined && fBottom !== undefined) {
          const r: L1ViewportResponse = {}
          if (Math.abs(fTop) >= 0.005) r.yFactor = fTop
          if (Math.abs(fBottom - fTop) >= 0.005) r.heightFactor = fBottom - fTop
          if (r.yFactor !== undefined || r.heightFactor !== undefined) kf.viewportResponse = r
        }
      }
      keyframes.push(kf)
      present.push(w)
    }
    if (keyframes.length === 0) return
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    // REQ-271 — the fill the runs reported is not always the band's own; see
    // {@link bandBaseFill}. A band whose only fill was the scrim over it paints
    // nothing, and a box that paints nothing is not emitted.
    const widestKf = keyframes.find((k) => k.at === widestW) ?? keyframes[keyframes.length - 1]
    const base = bandBaseFill(
      entry.g.fill,
      { x: widestKf.x, y: widestKf.y, width: widestKf.width ?? 0, height: widestKf.height ?? 0 },
      sectionsAtWidest,
      sectionsByWidth,
    )
    if (base === null) return
    const id = `section-band-${oi}`
    const node: L1Box = { kind: 'box', id, geometry, axes: { surfaceFill: base } }
    const vis = visibilityFor(present, widths)
    if (vis) node.visibility = vis
    // BUG-143 — the band claims the runs it was built from. Claimed AFTER the
    // `base === null` return above, so a band that paints nothing (and is
    // therefore never emitted) leaves no run pointing at a surface that does not
    // exist — which the envelope validator would refuse, correctly.
    for (const r of order[oi].g.rows) if (r.run) r.run.backedBy = id
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
        x: round2(x0),
        y: round2(y0),
        width: round2(x1 - x0),
        height: round2(y1 - y0),
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
    //
    // REQ-351 (issue 4) — per keyframe, from whichever enclosed run was measured
    // at that width. A card whose runs respond at 1280 and were never probed at
    // 768 grows at 1280 and stays pinned at 768, which is what the capture saw.
    for (const kf of keyframes) {
      if (kf.atHeight === undefined) continue
      const r = rows.map((row) => row.viewportResponse?.get(kf.at)).find(Boolean)
      if (r) kf.viewportResponse = r
    }
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
    const id = `card-${idx++}`
    const node: L1Box = { kind: 'box', id, geometry, axes }
    const vis = visibilityFor(present, widths)
    if (vis) node.visibility = vis
    // BUG-143 — the card claims the runs it is the union of. This is the tightest
    // and most load-bearing half of the record: a card is a panel a few px larger
    // than its copy, so it is the first surface to slide off what it backs.
    for (const r of rows) if (r.run) r.run.backedBy = id
    const wk = keyframes[keyframes.length - 1]
    boxes.push({ node, area: wk.width * (wk.height ?? 0) })
  }
  // Larger cards first (bottom); a small contained badge paints last (on top).
  return boxes.sort((a, b) => b.area - a.area).map((b) => b.node)
}

// ── BUG-142: a backing surface owns the content it backs ─────────────────────
//
// A band, a section background and a card were emitted as PINNED SIBLINGS of the
// runs they are painted behind, in one flat list. At rest a panel sat behind its
// runs only because their coordinates coincided, and nothing held the two
// together anywhere else: the runs joined the flow when the recovery promoted
// them and the panels were exempt from it, so a viewport an inch wider, a
// paragraph a line longer, or a window taller slid the two layers apart.
//
// The ownership is not an inference — the fold BUILDS each surface from the runs
// it backs. So it is stated in the tree: a surface that backs content becomes a
// `container` (REQ-98's "a container paints AND lays out"), the content it backs
// becomes its children, and containment holds by construction.
//
// A `container` rather than a `box` with children, because the renderer emits
// `display: flex` for one and a plain block for the other — and a block's first
// in-flow child has its `margin-top` COLLAPSE OUT of it, which would move the
// panel instead of its content: the same separation by another route.

/** The four numbers a keyframe resolves to — the rect ownership is decided on. */
interface FoldRect {
  x: number
  y: number
  width: number
  height: number
}

/** A node's own geometry track, for the kinds that carry one. */
function foldGeometryOf(node: L1Node): L1Geometry | undefined {
  return 'geometry' in node ? node.geometry : undefined
}

/**
 * Each node's resting rect at every width its geometry names, with a text leaf's
 * measured height filled in where the keyframe carries none.
 *
 * Shared by the two passes that reason about which box sits inside which —
 * {@link nestBackingSurfaces} (who owns whom) and {@link nameCapturedBackdrops}
 * (which full-bleed fill actually backs content) — so the two can never disagree
 * about the geometry they are reading.
 */
function foldRectsOf(
  nodes: readonly L1Node[],
  textHeights: ReadonlyMap<L1Node, Map<number, number>>,
): Map<L1Node, Map<number, FoldRect>> {
  const rects = new Map<L1Node, Map<number, FoldRect>>()
  for (const node of nodes) {
    const geo = foldGeometryOf(node)
    const byWidth = new Map<number, FoldRect>()
    const heights = textHeights.get(node)
    for (const kf of geo?.keyframes ?? []) {
      byWidth.set(kf.at, {
        x: kf.x,
        y: kf.y,
        width: kf.width,
        height: kf.height ?? heights?.get(kf.at) ?? 0,
      })
    }
    rects.set(node, byWidth)
  }
  return rects
}

/**
 * A pixel of slack: the fold rounds to a hundredth and a run's own border box can
 * sit flush with the panel's edge.
 */
const FOLD_CONTAINS_EPS = 1

/** Does `parent` fully cover `child`, within {@link FOLD_CONTAINS_EPS}? */
function foldRectContains(parent: FoldRect, child: FoldRect): boolean {
  return (
    child.x >= parent.x - FOLD_CONTAINS_EPS &&
    child.x + child.width <= parent.x + parent.width + FOLD_CONTAINS_EPS &&
    child.y >= parent.y - FOLD_CONTAINS_EPS &&
    child.y + child.height <= parent.y + parent.height + FOLD_CONTAINS_EPS
  )
}

/**
 * REQ-332 — name each captured backdrop for WHAT IT IS: a backing surface
 * (`backdrop-N`) when content actually stands on it, an ordinary painted panel
 * (`box-N`) when nothing does.
 *
 * WHY THE TEST IS CONTAINMENT AND NOT SIZE. {@link isBackdrop}'s full-bleed test
 * decides which PAINT LAYER a fill belongs in, and for that it is exactly right: a
 * 1200×4 divider spanning the page is painted behind the content as surely as a
 * 1280×1064 section band is. It is far too loose to decide whether a fill is a
 * *backing surface*, which is a claim about the copy standing on it — and that
 * claim is what the geometry envelope acts on (an exemption from the overlap scan,
 * an attributable `backedBy`, a containment assertion). Naming the divider a
 * backing surface would exempt a decorative rule from ever being reported as
 * colliding with anything.
 *
 * So the test is the one the claim is about: does this box cover at least one
 * content leaf? A section band covers the words painted on it; a divider covers
 * nothing.
 *
 * AT THE WIDEST WIDTH ONLY, deliberately — unlike {@link nestBackingSurfaces},
 * which demands containment at every width before it will restructure the tree.
 * The two need opposite defaults: nesting a band around copy it does not hold at
 * 320px would give the band a content extent it never had, whereas *naming* a band
 * that has slid off its copy at 320px is the only way the containment probe can
 * ever report that it has. A stricter test here would silently un-name exactly the
 * broken cases the probe exists to catch.
 */
function nameCapturedBackdrops(
  backdrops: readonly L1Box[],
  content: readonly L1Node[],
  textHeights: ReadonlyMap<L1Node, Map<number, number>>,
  widths: readonly number[],
  nextBoxIdx: number,
): number {
  const widest = Math.max(...widths)
  const rects = foldRectsOf([...backdrops, ...content], textHeights)
  const at = (node: L1Node): FoldRect | undefined => rects.get(node)?.get(widest)
  let backdropIdx = 0
  let boxIdx = nextBoxIdx
  for (const node of backdrops) {
    const own = at(node)
    const backs =
      own !== undefined &&
      own.width > 0 &&
      own.height > 0 &&
      content.some((c) => {
        const inner = at(c)
        return inner !== undefined && inner.width > 0 && inner.height > 0 && foldRectContains(own, inner)
      })
    node.id = backs ? `${CAPTURED_BACKDROP_ID_PREFIX}${backdropIdx++}` : `box-${boxIdx++}`
  }
  return boxIdx
}

/**
 * REQ-370 — how much of each other two boxes must cover before a photograph and a
 * backdrop are read as layers of ONE ground rather than as neighbours.
 */
const GROUND_MUTUAL_COVER = 0.9

/**
 * REQ-370 — the photographs the reference paints BENEATH a captured backdrop, per
 * backdrop.
 *
 * A Zyro (and Squarespace, and Wix) hero is a background wrapper holding an
 * `<img>` and an overlay `<div>` over it: the photograph, then a translucent veil.
 * The fold reads the overlay as a backdrop — a full-bleed fill, background layer,
 * nested in its band — and the `<img>` as a content image, emitted after the band
 * in reading order. So the photograph painted over its own veil, and the hero read
 * at full brightness where the reference is 45% darker (hearingzone510.com:
 * region 1, half the page's ranked score, zero value deltas).
 *
 * The test is the capture's, not a guess: the two boxes are the same box (each
 * covers {@link GROUND_MUTUAL_COVER} of the other at the widest width) and the
 * capture recorded the image at a LOWER level than the backdrop. An image level
 * with the backdrop or above it is left alone, because then the reference really
 * does paint the photograph over the fill.
 */
function groundImagesUnder(
  backdrops: readonly L1Box[],
  content: readonly L1Node[],
  level: ReadonlyMap<L1Node, number>,
  widths: readonly number[],
): Map<L1Box, L1Node[]> {
  const grounds = new Map<L1Box, L1Node[]>()
  const widest = Math.max(...widths)
  const rects = foldRectsOf([...backdrops, ...content], new Map())
  const at = (node: L1Node): FoldRect | undefined => rects.get(node)?.get(widest)
  const area = (r: FoldRect): number => Math.max(0, r.width) * Math.max(0, r.height)
  const overlap = (a: FoldRect, b: FoldRect): number =>
    Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  for (const node of content) {
    if (node.kind !== 'image') continue
    const own = at(node)
    const ownLevel = level.get(node) ?? 0
    if (!own || area(own) <= 0) continue
    let best: L1Box | undefined
    let bestCover = 0
    for (const b of backdrops) {
      const bLevel = level.get(b)
      const rect = at(b)
      if (bLevel === undefined || bLevel <= ownLevel || !rect || area(rect) <= 0) continue
      const shared = overlap(own, rect)
      if (shared < GROUND_MUTUAL_COVER * area(own) || shared < GROUND_MUTUAL_COVER * area(rect)) continue
      if (shared > bestCover) {
        bestCover = shared
        best = b
      }
    }
    if (!best) continue
    clipGroundTo(node, best)
    const list = grounds.get(best)
    if (list) list.push(node)
    else grounds.set(best, [node])
  }
  return grounds
}

/**
 * REQ-370 — a ground never paints past its backdrop. The wrapper both are read
 * from is the band's clipping background box (`overflow: hidden; inset: 0` on
 * every builder that uses the pattern), and a photograph left overhanging it —
 * 11.56px on hearingzone510.com — would hand the band a content extent the
 * reference never shows.
 */
function clipGroundTo(node: L1Node, backdrop: L1Box): void {
  const geo = foldGeometryOf(node)
  const frames = new Map((backdrop.geometry?.keyframes ?? []).map((kf) => [kf.at, kf]))
  for (const kf of geo?.keyframes ?? []) {
    const b = frames.get(kf.at)
    if (!b || b.height === undefined || kf.height === undefined) continue
    const x = Math.max(kf.x, b.x)
    const y = Math.max(kf.y, b.y)
    const right = Math.min(kf.x + kf.width, b.x + b.width)
    const bottom = Math.min(kf.y + kf.height, b.y + b.height)
    if (right <= x || bottom <= y) continue
    kf.x = round2(x)
    kf.y = round2(y)
    kf.width = round2(right - x)
    kf.height = round2(bottom - y)
  }
}

/** REQ-332 — one folded leaf and the clip box that cut it off, per width. */
interface ClipRow {
  node: L1Node
  frames: Map<number, ClipAncestor>
}

/**
 * REQ-332 — the leaves a clipping ancestor cuts off → a container that CLIPS.
 *
 * The capture records, per element, the box it disappears at and a document-wide
 * id for the ancestor that owns that box ({@link ClipAncestor}). Everything
 * carrying one id belongs inside one node: that is the whole reconstruction, and
 * it is why the id exists rather than a bare rectangle.
 *
 * ONLY WHERE THE CLIP ACTUALLY CUTS. A group whose every member sits wholly
 * inside its clip box at every width is not clipped in any observable sense — the
 * ancestor declares `overflow: hidden` and nothing reaches its edge — so no node
 * is built for it. That is not an optimisation: a container is a real node with
 * real geometry, and adding one per `overflow: hidden` on the page (a page-builder
 * site has dozens) would restructure documents that have no clipping defect, for
 * no pixel. The reconstruction earns its place exactly where the reference's own
 * geometry says content is being cut off.
 *
 * Measured on joyfulculinarycreations.com: one group of two, the testimonial
 * swiper's off-screen slides at `x: -419` and `x: 1027`, which made the
 * reproduction 1699.75px wide against the reference's 1280 — 10 `clip` findings,
 * all 56 of the round's `escape` findings, and two runs reading the page fill
 * because they had slid off the band that backs them.
 */
function nestClipRegions(
  rows: readonly ClipRow[],
  widths: readonly number[],
  heightAt: ReadonlyMap<number, number>,
): { built: Map<L1Node, L1ContainerNode>; members: Map<L1Node, L1Node> } {
  const built = new Map<L1Node, L1ContainerNode>()
  const members = new Map<L1Node, L1Node>()
  const groups = new Map<string, ClipRow[]>()
  for (const row of rows) {
    // The id is a property of the ancestor, so it is the same at every width the
    // element was captured at; the first frame is as good as any.
    const id = [...row.frames.values()][0]?.id
    if (id === undefined) continue
    // REQ-366 — a leaf joins only if that ancestor cuts it at EVERY width it is
    // laid out at. A node has one parent, so a leaf nested here is clipped to this
    // box at every width; one present at a width the ancestor never held it (a
    // header link whose row was stitched to a footer link's narrower widths) was
    // rebased 4572px above the footer menu and clipped away entirely.
    const laidOut = foldGeometryOf(row.node)?.keyframes ?? []
    if (laidOut.some((kf) => row.frames.get(kf.at)?.id !== id)) continue
    const g = groups.get(id)
    if (g) g.push(row)
    else groups.set(id, [row])
  }

  /**
   * REQ-338 (issue 8) — THE AGREEMENT IS CHECKED, NOT ASSUMED.
   *
   * Every member of a group names the same ancestor, so they record the same box
   * at each shared width — that was stated as holding by construction, and it was
   * the id that had to hold it. It did not (see {@link ClipAncestor}), and the
   * cost of taking it on trust was total: the box came from "whichever member
   * recorded it", so one mis-grouped leaf inherited a container 1400px away and
   * was rebased entirely outside it. A whole photograph vanished and produced no
   * value delta, because both sides lay it out in the same place and only one of
   * them paints it.
   *
   * So a group is split into runs of members that actually agree, greedily: a row
   * joins the first subgroup whose boxes match its own at every width both
   * recorded. Members of one real ancestor still land together (identical boxes,
   * first subgroup matches); a row that agrees with nobody gets its own, where the
   * worst it can do is describe its own clip box — which is the truth about it.
   */
  const agreeing = (group: readonly ClipRow[]): ClipRow[][] => {
    const subs: ClipRow[][] = []
    for (const row of group) {
      const fits = subs.find((sub) =>
        sub.every((other) =>
          [...row.frames].every(([at, box]) => {
            const theirs = other.frames.get(at)
            if (!theirs) return true
            return (
              Math.abs(theirs.x - box.x) <= FOLD_CONTAINS_EPS &&
              Math.abs(theirs.y - box.y) <= FOLD_CONTAINS_EPS &&
              Math.abs(theirs.width - box.width) <= FOLD_CONTAINS_EPS &&
              Math.abs(theirs.height - box.height) <= FOLD_CONTAINS_EPS
            )
          }),
        ),
      )
      if (fits) fits.push(row)
      else subs.push([row])
    }
    return subs
  }

  for (const group of [...groups.values()].flatMap(agreeing)) {
    // The clip box per width, from whichever member recorded it — every member of
    // a group names the same ancestor, and {@link agreeing} has established that
    // the members of THIS group really do.
    const boxes = new Map<number, ClipAncestor>()
    for (const row of group) {
      for (const [at, box] of row.frames) {
        if (box.width > 0 && box.height > 0) boxes.set(at, box)
      }
    }
    if (!boxes.size) continue
    // Does anything actually reach the edge? A member escaping at ANY captured
    // width is enough: a carousel whose slides are only off-screen below the
    // desktop breakpoint is still a carousel.
    const escapes = group.some((row) => {
      const geo = foldGeometryOf(row.node)
      return (geo?.keyframes ?? []).some((kf) => {
        const clip = boxes.get(kf.at)
        if (!clip) return false
        return (
          kf.x < clip.x - FOLD_CONTAINS_EPS ||
          kf.x + kf.width > clip.x + clip.width + FOLD_CONTAINS_EPS
        )
      })
    })
    if (!escapes) continue

    const at = widths.filter((w) => boxes.has(w))
    if (!at.length) continue
    const keyframes: L1Keyframe[] = at.map((w) => {
      const b = boxes.get(w)!
      const kf: L1Keyframe = {
        at: w,
        x: round2(b.x),
        y: round2(b.y),
        width: round2(b.width),
        height: round2(b.height),
      }
      const h = heightAt.get(w)
      if (h) kf.atHeight = h
      return kf
    })
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    const container: L1ContainerNode = {
      kind: 'container',
      layout: 'stack',
      clip: true,
      geometry,
      children: group.map((row) => rebaseInto(row.node, geometry, undefined)),
    }
    // The group's FIRST member carries the container, so it lands where the
    // earliest clipped element was in document order and the rest drop out.
    built.set(group[0].node, container)
    for (const row of group) members.set(row.node, container)
  }
  return { built, members }
}

/** What {@link nestBackingSurfaces} decided: the rebuilt nodes, and who was taken. */
interface OwnershipResult {
  /** A surface that owns content → the container it became. */
  built: Map<L1Node, L1Node>
  /** Every node that is now someone's child, so the caller drops it from the top level. */
  owned: Set<L1Node>
  /**
   * BUG-142 — the earliest position in the CAPTURE's own element order that a
   * node's subtree holds; absent for a node that holds no content at all.
   *
   * This is what the root's children are ordered by, and it is not tidiness.
   * `sampleFidelityProbe` pairs the k-th oracle element of a text key with the
   * k-th reproduced leaf of that key IN DOCUMENT ORDER, and so does the
   * measured-height queue. Nesting a run inside the panel that backs it moves it
   * in that order — a page with a wordmark in its header AND its footer then
   * measures each against the other, and reports the distance between two
   * different parts of the page as a fidelity miss (1038px on `faelan.com`).
   * Ordering panels by the earliest thing they hold restores the capture's order
   * through the nesting, so the ruler goes on measuring geometry.
   */
  readingOrder: Map<L1Node, number>
}

/**
 * BUG-142 — assign every backed node to the surface that backs it, and rebuild
 * those surfaces as containers that hold it.
 *
 * Ownership is the SMALLEST surface that contains the node at the widest
 * captured width. That orders naturally — a section background or band holds its
 * cards, a card holds its runs — and a surface may only sit inside a strictly
 * larger one (or, for two rects of the same size, inside the one painted first),
 * so the relation is a forest and cannot loop.
 *
 * The panel keeps its captured height here, in the absolute base, where it is
 * exactly the rect the capture measured. The bottom inset that lets it KEEP that
 * height once its content sizes it is the recovery's to compute (see
 * `promoteToFlow`), because only the recovery knows how tall the content turned
 * out to be once it was laid out.
 *
 * REQ-338 (issue 1) — `ownable` IS OWNED AND NEVER OWNS. The captured backdrops
 * are passed there, which is the only way their paint can land where the page
 * puts it: a section paints its own fill, then its overlay element over that,
 * then the copy over both. Left at the top level a backdrop paints in the
 * BACKGROUND layer, before every surface that holds content — so the hero's
 * photograph went under the plate carrying the black it is composited on, and
 * 644 × 1280 px of it read `(0, 0, 0)` against a reference whose mean there is
 * `[66.67, 60.55, 51.97]`. Nested, it is a child ordered before the content (it
 * has no reading-order key of its own) and after any surface sibling, which is
 * exactly CSS's own order for the element it was read from.
 *
 * They still own nothing: an element-level background photograph is a CAPTURED
 * element with its own oracle counterpart, not a surface the fold reconstructed
 * from the runs standing on it, so it is never a candidate parent.
 */
function nestBackingSurfaces(
  surfaces: readonly L1Box[],
  content: readonly L1Node[],
  textHeights: ReadonlyMap<L1Node, Map<number, number>>,
  widths: readonly number[],
  ownable: readonly L1Box[] = [],
  grounds: ReadonlyMap<L1Box, readonly L1Node[]> = new Map(),
): OwnershipResult {
  const built = new Map<L1Node, L1Node>()
  const owned = new Set<L1Node>()
  const readingOrder = new Map<L1Node, number>()
  content.forEach((node, i) => readingOrder.set(node, i))
  if (surfaces.length === 0 || content.length === 0) return { built, owned, readingOrder }
  const widest = Math.max(...widths)
  // Ownable-but-never-owning members sit between the surfaces and the content in
  // `order`, so a backdrop paints after the reconstructed band it shares a parent
  // with and before anything that holds copy.
  // REQ-370 — a backdrop's grounds sit immediately before it, so wherever the
  // backdrop lands they sort under it.
  const all: L1Node[] = [...surfaces, ...ownable.flatMap((b) => [...(grounds.get(b) ?? []), b]), ...content]
  const order = new Map<L1Node, number>(all.map((n, i) => [n, i]))
  const isSurfaceNode = new Set<L1Node>(surfaces)

  const rects = foldRectsOf(all, textHeights)
  const rectAt = (node: L1Node, at: number): FoldRect | undefined => rects.get(node)?.get(at)
  const contains = foldRectContains

  /**
   * Containment at EVERY width both are captured at, not just the widest.
   *
   * A tree has one shape, and the ladder is where that bites: a card that sits
   * inside a band at 1440 can be four thousand pixels below it at 320, where the
   * page has stacked and the bands have re-tiled. Owning it on the strength of
   * the desktop reading alone would hand the band a content extent it never had
   * — measured on `joyfulculinarycreations.com` as a 308px band reporting 4425px
   * of content at 320, and every section under it displaced by the difference.
   */
  const containsEverywhere = (surface: L1Node, node: L1Node): boolean => {
    let shared = 0
    for (const at of widths) {
      const parent = rectAt(surface, at)
      const child = rectAt(node, at)
      if (!parent || !child) continue
      shared++
      if (!contains(parent, child)) return false
    }
    return shared > 0
  }

  const ownerOf = (node: L1Node, isSurface: boolean): L1Box | undefined => {
    const child = rectAt(node, widest)
    if (!child || child.width <= 0 || child.height <= 0) return undefined
    const childArea = child.width * child.height
    let best: L1Box | undefined
    let bestArea = Infinity
    for (const surface of surfaces) {
      if (surface === node) continue
      const parent = rectAt(surface, widest)
      if (!parent || parent.width <= 0 || parent.height <= 0) continue
      if (!containsEverywhere(surface, node)) continue
      const parentArea = parent.width * parent.height
      if (isSurface) {
        if (parentArea < childArea) continue
        if (parentArea === childArea && (order.get(surface) ?? 0) > (order.get(node) ?? 0)) continue
      }
      if (parentArea < bestArea) {
        bestArea = parentArea
        best = surface
      }
    }
    return best
  }

  const kids = new Map<L1Node, L1Node[]>()
  const adopt = (parent: L1Box, node: L1Node): void => {
    owned.add(node)
    const list = kids.get(parent)
    if (list) list.push(node)
    else kids.set(parent, [node])
  }
  const claim = (node: L1Node, isSurface: boolean): L1Box | undefined => {
    const parent = ownerOf(node, isSurface)
    if (parent) adopt(parent, node)
    return parent
  }
  for (const surface of surfaces) claim(surface, true)
  // REQ-338 — as a surface for claiming purposes (a backdrop may only sit inside a
  // strictly larger box, or an equal-sized one painted before it), never as one
  // for parenting purposes.
  for (const node of ownable) {
    const parent = claim(node, true)
    // REQ-370 — a ground goes where its backdrop goes, without a containment
    // test of its own: the photograph under a hero's scrim routinely overhangs
    // the band by a few pixels the reference clips away, and leaving it at the
    // top level would paint it over the band's own scrim again.
    if (parent) for (const g of grounds.get(node) ?? []) adopt(parent, g)
  }
  for (const node of content) claim(node, false)

  const build = (surface: L1Box): L1Node => {
    const members = kids.get(surface) ?? []
    if (members.length === 0) return surface
    const geo = foldGeometryOf(surface)
    if (!geo) return surface
    // Build the members first: a nested surface's own reading-order key is only
    // known once its subtree has been walked.
    const inner = new Map<L1Node, L1Node>(
      members.map((member) => [member, isSurfaceNode.has(member) ? build(member as L1Box) : member]),
    )
    // The capture's own order, restored through the nesting. A member that holds
    // no content at all (a decorative panel) sorts by paint order, before the
    // members that do — it is a background and belongs under them.
    const keyOf = (member: L1Node): number => readingOrder.get(member) ?? -1
    const sorted = [...members].sort(
      (a, b) => keyOf(a) - keyOf(b) || (order.get(a) ?? 0) - (order.get(b) ?? 0),
    )
    const earliest = sorted.map(keyOf).filter((k) => k >= 0)
    if (earliest.length) readingOrder.set(surface, Math.min(...earliest))
    const nested = sorted.map((member) => rebaseInto(inner.get(member)!, geo, surface.axes))
    const { kind: _kind, children: _children, ...rest } = surface
    const container: L1ContainerNode = {
      ...rest,
      kind: 'container',
      layout: 'stack',
      children: nested,
    }
    return container
  }

  for (const surface of surfaces) {
    if (owned.has(surface)) continue
    const node = build(surface)
    if (node !== surface) {
      built.set(surface, node)
      const key = readingOrder.get(surface)
      if (key !== undefined) readingOrder.set(node, key)
    }
  }
  return { built, owned, readingOrder }
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
  const sectionResponses = sectionViewportResponses(probes)
  const columnFit = fitColumn(projections)

  // REQ-211 — the rejoin plan. Built from EVERY projection, not just the widest:
  // the row loop reads a row's widest PRESENT element, which for a run that
  // disappears on desktop is a narrower sample, and a plan keyed only on the
  // widest ladder rung would then not recognise it.
  const flowOf = new Map<ValueElement, InlineFlow<ValueElement>>()
  for (const p of projections) {
    for (const flow of rejoinableFlows(p.manifest.elements)) {
      for (const m of flow.members) flowOf.set(m, flow)
    }
  }

  /**
   * REQ-331 — the media elements the REFERENCE itself painted over something.
   *
   * BUG-112 gave L1 `stacked` so a deliberate composition could declare that its
   * overlap is the design, and nothing in the engine had ever emitted it: on a
   * collage page every reproduction failed the envelope's overlap probe for
   * reproducing the reference faithfully. Measured on faelan.com — a hero of four
   * montaged photographs over a headline — 218 findings across the on-sample,
   * off-sample and content-robustness probes, every single one `kind: "overlap"`,
   * and every single pair one the reference's own captured boxes also make.
   *
   * THE DECLARATION IS THE REFERENCE'S, not a guess. A fold produces a
   * reproduction, and an overlap the reference painted is a fact about the page
   * being reproduced rather than a defect in the copy of it. So the intent is
   * read off the captured geometry at the widths the capture actually sampled,
   * and an overlap the fold INVENTED — one whose two elements were captured
   * clear of each other — is still a finding. That is the property that keeps
   * the exemption from degenerating into "never report an overlap".
   *
   * ONLY THE PICTURE IS MARKED, never the words. One side of a pair is enough
   * ({@link keepsAbsolute}'s exemption takes either), and a collage's figure is
   * the photograph: marking the headline instead would additionally pin the copy
   * at its captured coordinates, which is the brittle transcription the flow
   * recovery exists to undo. Every colliding pair on a montage contains a
   * picture, so the narrower mark clears the same findings.
   */
  const stackedElements = new Set<ValueElement>()
  for (const p of projections) {
    const boxed = p.manifest.elements.filter((e) => e.box && e.box.width > 0 && e.box.height > 0)
    for (const a of boxed) {
      if (!isMediaElement(a)) continue
      for (const b of boxed) {
        if (b === a) continue
        const x = Math.min(a.box!.x + a.box!.width, b.box!.x + b.box!.width) - Math.max(a.box!.x, b.box!.x)
        const y = Math.min(a.box!.y + a.box!.height, b.box!.y + b.box!.height) - Math.max(a.box!.y, b.box!.y)
        if (!(x > 0 && y > 0)) continue
        // A partner that entirely CONTAINS this one is a ground, not a figure:
        // a full-bleed backdrop photograph (BUG-27) holds every element on its
        // band, and reading that as a montage would declare the whole page
        // stacked — which would additionally pin all of it, via `keepsAbsolute`.
        // Nothing is lost by the exclusion: where both sides are pictures, the
        // CONTAINER is still marked by this same scan (the contained one does not
        // contain it), and one side of a pair is enough to exempt it.
        const contains =
          b.box!.x <= a.box!.x &&
          b.box!.y <= a.box!.y &&
          b.box!.x + b.box!.width >= a.box!.x + a.box!.width &&
          b.box!.y + b.box!.height >= a.box!.y + a.box!.height
        if (contains) continue
        stackedElements.add(a)
        break
      }
    }
  }

  const residuals = opts.residuals
  const signal = (el: ValueElement, reason: string, presentWidths: number[]): void => {
    residuals?.push({ kind: residualKindOf(el), reason, capturedAxes: capturedAxesOf(el), widths: presentWidths })
  }
  /**
   * REQ-336 — the same signal for a leaf the fold DID emit, naming the painted axes
   * that leaf does not carry ({@link droppedAxesOf}). `signal` above reports an
   * element with no L1 leaf at all; this reports the other half of the same
   * question, which had no voice: a photograph emitted with its fit, its rounding,
   * its shadow and its feather intact, and its rotation thrown away.
   *
   * Silent when the leaf carried everything, so the list stays a list of gaps.
   */
  const signalDropped = (el: ValueElement, node: L1Node, presentWidths: number[]): void => {
    if (!residuals) return
    const dropped = droppedAxesOf(el, node)
    if (!dropped.length) return
    residuals.push({
      kind: residualKindOf(el),
      reason: `axes dropped from an emitted ${residualKindOf(el)} leaf`,
      capturedAxes: dropped,
      widths: presentWidths,
    })
  }

  const children: L1Node[] = []
  /**
   * BUG-142 — the captured height of a TEXT leaf, per width.
   *
   * A text keyframe pins no height (its height is the browser's, from flow), so
   * the node alone cannot say what vertical space the run occupied. Ownership
   * needs exactly that: which backing surface a run sits inside, and how far the
   * lowest run inside a surface reaches. Recorded here from the same cells the
   * keyframes are built from, so the two can never describe different boxes.
   */
  const textHeights = new Map<L1Node, Map<number, number>>()
  /** BUG-27 — box leaves painting a background photograph; they belong in the
   *  background layer, beneath all content (see where they are emitted below). */
  const backdropNodes: L1Box[] = []
  /**
   * REQ-370 — the level the reference captured for each backdrop and image leaf,
   * kept beside the node rather than on it: a backdrop's own layer is the fold's
   * decision (see the box leaf below), but WHICH of a backdrop and a photograph
   * sharing its box paints over the other is the capture's, and only the captured
   * levels can say. Read by {@link groundImagesUnder}.
   */
  const capturedLevel = new Map<L1Node, number>()
  /**
   * REQ-332 — each folded leaf beside the clip box that cuts it off, per width.
   * Collected here rather than derived later because the link between a leaf and
   * the capture row it came from only exists inside this loop.
   */
  const clipRows: ClipRow[] = []
  const recordClip = (node: L1Node, cells: readonly ResponsiveCell[]): void => {
    const frames = new Map<number, ClipAncestor>()
    for (const c of cells) {
      const clip = c.element?.clip
      if (clip) frames.set(c.width, clip)
    }
    if (frames.size) clipRows.push({ node, frames })
  }
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
    const buildGeometry = (withHeight: boolean, useFlowBox = false): L1Geometry => {
      // REQ-211 — a rejoined node lays out inside its FLOW ROOT, not inside the
      // tight box of whichever fragment carries it. The fragment's box is where one
      // piece of glyphs landed; the root's is the space the sentence has to flow in,
      // and pinning the fragment's would re-wrap the copy into the width of its
      // longest word.
      //
      // REQ-333 — and it is the ONE rect this geometry is built from, keyframes and
      // column anchor alike. The anchor used to read `element.box` unconditionally
      // while the keyframes read the flow box, so a rejoined sentence carried two
      // values for the same x that disagreed: `keyframes[].x` 102.39 (right) beside
      // `anchor.x.pxTrack` 55.88, the offset of its LAST fragment. The renderer
      // honours the anchor, so the sentence landed 169.48px to the right at every
      // breakpoint. The invariant every other node satisfied — `pxTrack = x −
      // columnOrigin` — only holds if both derivations read the same rect.
      const boxOf = (c: (typeof framed)[number]) =>
        (useFlowBox ? c.element!.inlineBox : undefined) ?? c.element!.box!
      const keyframes = framed.map((c) => {
        const box = boxOf(c)
        // REQ-88 — a text box rounds its width UP. A shrink-to-fit run's captured
        // box IS its glyph extent (element width === renderedTextBox width), so
        // rounding to nearest makes the box narrower than the text it must hold
        // whenever the fraction is below .5 — and CSS answers that by wrapping.
        // `Gigabyte Alchemy` measured 685.31 and was pinned at 685, so the hero
        // title reflowed onto a second line the reference never had. Ceil is the
        // smallest value at the fold's precision (REQ-302: two decimals, see
        // {@link ceil2}) that still contains the measured content; a box/image
        // leaf has no such constraint and stays on nearest.
        const width = withHeight ? round2(box.width) : ceil2(box.width)
        // REQ-370 — a text run that is its own surface sits where its lines are,
        // not on its border (see {@link selfSurfaceLines}).
        const lines = withHeight || useFlowBox ? undefined : selfSurfaceLines(c.element!)
        const kf: L1Keyframe = { at: c.width, x: round2(box.x), y: round2(lines?.top ?? box.y), width }
        if (withHeight && Number.isFinite(box.height)) kf.height = round2(box.height)
        // REQ-88 — the viewport height this keyframe was measured at, so a height
        // response has an origin to be measured from.
        const h = heightAt.get(c.width)
        if (h) kf.atHeight = h
        // REQ-88 — the viewport-height response, measured element-for-element
        // against the height probe at THIS width (REQ-351 issue 4). A run the
        // probe never visited at this width carries none, and stays where the
        // capture put it.
        const response = h ? responseOf.get(c.element!) : undefined
        if (response) kf.viewportResponse = response
        return kf
      })
      const geometry: L1Geometry = { keyframes }
      if (keyframes.length > 1) {
        geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
      }
      // REQ-88 — the centred-column anchor where `x`/`width` are that column's
      // function rather than a line through the samples.
      if (columnFit) {
        const anchor = fitAnchor(
          framed.map((c) => ({ at: c.width, box: boxOf(c) })),
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
    if (!sample.textless && hasTextSubstance(sample.text)) {
      if (framed.length === 0) {
        signal(sample, 'text run has no geometry (no box at any sampled width)', presentWidths)
        continue
      }
      // REQ-211 — a run that is one piece of a varying inline flow is folded as
      // part of that flow's node, not as a node of its own. The flow's LEAD run
      // carries it; every other member is consumed here, which is also what stops
      // it contributing a second surface row and a duplicate card behind the same
      // sentence. The oracle drops the same members (`probes.ts`), so nothing the
      // fold rejoins is left counted twice on the reference side.
      const flow = flowOf.get(widest)
      if (flow && flowLead(flow) !== widest) continue
      // BUG-20 — a self-painting chip (a `rounded-full` badge) carries its own
      // surface on the text leaf; a bare run carries only type axes.
      const chip = isSelfPaintingRun(widest)
      const axes: L1TextAxes = chip ? { ...textAxes(widest), ...chipAxes(widest) } : textAxes(widest)
      // REQ-88 — from the width at which the reference stopped wrapping this run,
      // pin it unbreakable. The fold hands the run a fixed-width box whose slack
      // over its own glyphs is routinely a fraction of a pixel, and each engine
      // measures glyphs differently — so without this the reference's own line
      // count is re-decided, per browser, by rounding. See `axes.nowrapFromPx`.
      // REQ-211 — never on a rejoined node. The threshold states a fact about ONE
      // fragment's glyph extent inside a box the fold pinned to it; a rejoined
      // node's box is the flow root's, which the reference already sized to hold
      // the whole sentence, so there is nothing left for a rounding error to
      // decide and pinning `nowrap` could only push the copy out of its own box.
      const nowrapFrom = flow
        ? undefined
        : nowrapThreshold(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (nowrapFrom !== undefined) axes.nowrapFromPx = nowrapFrom
      const node: Extract<L1Node, { kind: 'text' }> = {
        kind: 'text',
        text: flow ? flow.members.map((m) => foldTextRun(m, widest)) : widest.text,
        axes,
        geometry: buildGeometry(false, Boolean(flow)),
      }
      // BUG-18 — keyframe the numeric type axes that vary across the ladder, so
      // font-size (etc.) scales per width instead of pinning the desktop value.
      const responsive = responsiveTextTracks(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (responsive) node.responsive = responsive
      if (vis) node.visibility = vis
      // REQ-269 — the navigation role the capture now carries. The renderer retags
      // this very node as the `<a>`, so the run keeps every paint axis it folded.
      const link = foldLink(widest)
      if (link) node.link = link
      // REQ-269 — and the heading role, from the outline depth beside it. A linked
      // heading stays an `<a>`: the renderer's retag precedence is the reference's
      // own, since the capture reads the a11y role off the element bearing the href.
      const heading = foldHeading(widest)
      if (heading) node.heading = heading
      // REQ-336 — a rotated run (an angled pull-quote, a tilted badge) is the same
      // loss as a rotated photograph: `transform` is a node field, so the text leaf
      // carries one on exactly the terms the image and box leaves do.
      const textTransform = foldTransform(widest)
      if (textTransform) node.transform = textTransform
      // REQ-347 — the level the reference paints this run at (see `foldPaintOrder`).
      // NOT AN IMAGE AXIS: the loss that named this was a HEADLINE painted under a
      // photograph, so it is read at every leaf branch exactly as `transform` is.
      const textPaintOrder = foldPaintOrder(widest)
      if (textPaintOrder !== undefined) node.paintOrder = textPaintOrder
      // REQ-371 — a chip's pill height is its padding (see `withChipInset`).
      const padOf = (el: ValueElement): ValueElement => (chip ? withChipInset(el) : el)
      const pad = foldPadding(padOf(widest))
      if (pad) node.padding = pad
      // REQ-88 — a side that varies across the ladder gets its own track, so the
      // widest sample's inset is no longer replayed at every width.
      const padTracks = responsivePaddingTracks(framed.map((c) => ({ width: c.width, element: padOf(c.element!) })))
      if (padTracks) node.responsivePadding = padTracks
      children.push(node)
      recordClip(node, framed)
      signalDropped(widest, node, presentWidths)
      // BUG-142 — the run's measured height. The POSITION comes off the flow
      // root's box only for a rejoined run (above); the HEIGHT comes off it
      // wherever the capture recorded one.
      //
      // REQ-331 — those are two different questions and they used to share an
      // answer. A bare inline run's own `box` is its GLYPH rect (`height: 28` at
      // 24px/36px type), while the renderer lays the node out in a LINE box
      // (`height: lineHeightPx`, 36). So the fold's model of how much vertical
      // space a run occupies was 8px short of what its own output would produce,
      // and because each sibling's lead is measured from the previous one's
      // bottom the error accumulated down the chain: measured on faelan.com as
      // +4, then +8, then **+16 for every node after the last text run** — the
      // whole page, its band boundaries and its viewport height with it.
      //
      // `inlineBox` is the flow root's rect and therefore the line box the run
      // actually sits in, which is the height the renderer will give it. Taking
      // it here — not the run's own box — closes the gap for every run the
      // capture recorded a flow for, rejoined or not: a flow that did not vary
      // has no rejoin to fall back on, and it was exactly as displaced.
      textHeights.set(
        node,
        new Map(
          framed.map((c) => {
            const el = c.element!
            const lines = flow ? undefined : selfSurfaceLines(el)
            return [c.width, lines?.height ?? (el.inlineBox ?? el.box!).height] as const
          }),
        ),
      )

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
      const surfShadow = foldShadows(widest.boxShadow, { spread: true, inset: true })
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
      // REQ-351 (issue 2) — the surface `shapeBoxAt` just declined for spanning the
      // viewport. Declined as a card RECT, kept here as evidence about the fill.
      const widestShape = widest.surface?.box
      const bandSurface =
        widestShape && widestAt > 0 && widestShape.width >= widestAt ? widestShape : undefined
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
          bandSurface,
          viewportResponse: new Map(
            framed.flatMap((c) => {
              const r = responseOf.get(c.element!)
              return r ? [[c.width, r] as const] : []
            }),
          ),
          // BUG-143 — the run this row is about. Whichever surface the row ends
          // up part of writes its id back here (`backedBy`), which is the whole
          // ownership record the geometry envelope asserts against.
          run: node,
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
      if (widest.zIndex !== undefined && Number.isFinite(widest.zIndex)) capturedLevel.set(node, widest.zIndex)
      // REQ-331 — the montage declaration (see `stackedElements`). Marked on the
      // row's own cells rather than on `widest` alone, so a picture that only
      // overlaps at a narrow width is still declared.
      if (framed.some((c) => stackedElements.has(c.element!))) node.stacked = true
      // REQ-331 — the feathered edge the capture has always recorded (see
      // `foldMask`). A node axis, beside `padding`, not one of the image axes.
      const mask = foldMask(widest.maskEdge, widest.box)
      if (mask) node.mask = mask
      // REQ-336 — the wrapper rotation the capture records (see `foldTransform`).
      // A node field beside `mask`, for the same reason and read on the same terms.
      const transform = foldTransform(widest)
      if (transform) node.transform = transform
      // REQ-347 — the level the reference paints this photograph at, beside the
      // rotation and on the same terms.
      const paintOrder = foldPaintOrder(widest)
      if (paintOrder !== undefined) node.paintOrder = paintOrder
      // REQ-269 — a linked image is a link like any other; the renderer WRAPS this
      // one (a void element cannot be an anchor) rather than retagging it.
      const imageLink = foldLink(widest)
      if (imageLink) node.link = imageLink
      const pad = foldPadding(widest)
      if (pad) node.padding = pad
      // REQ-88 — a side that varies across the ladder gets its own track, so the
      // widest sample's inset is no longer replayed at every width.
      const padTracks = responsivePaddingTracks(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (padTracks) node.responsivePadding = padTracks
      children.push(node)
      recordClip(node, framed)
      signalDropped(widest, node, presentWidths)
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
      const node: L1Box = { kind: 'box', geometry: buildGeometry(true) }
      if (Object.keys(axes).length) node.axes = axes
      if (vis) node.visibility = vis
      // REQ-331 — a painted surface can be feathered too (a fading section edge
      // is the same axis as a fading photograph), so it reads `maskEdge` on the
      // same terms as the image leaf above.
      const boxMask = foldMask(widest.maskEdge, widest.box)
      if (boxMask) node.mask = boxMask
      // REQ-336 — a painted surface can be turned too; read on the same terms as
      // the image leaf above, because `transform` is a node field on every kind.
      const boxTransform = foldTransform(widest)
      if (boxTransform) node.transform = boxTransform
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
      // REQ-332 — a backdrop's id is NOT decided here. Whether a full-bleed fill
      // is a backing surface depends on whether anything actually stands on it,
      // which is not knowable until every leaf is folded — see
      // {@link nameCapturedBackdrops}, run once after this loop.
      if (isBackdrop(node)) {
        backdropNodes.push(node)
        if (widest.zIndex !== undefined && Number.isFinite(widest.zIndex)) capturedLevel.set(node, widest.zIndex)
      } else {
        node.id = `box-${boxIdx++}`
        // REQ-347 — a painted surface stacks too (a scrim over a hero, a badge
        // behind a card), read on the same terms as the text and image leaves
        // above — but ONLY once it is known not to be a backdrop.
        //
        // A BACKDROP'S LAYER IS THE FOLD'S DECISION, NOT THE CAPTURE'S. The
        // background layer above is built by putting the content-free surfaces
        // FIRST in document order, which is the whole mechanism that makes them
        // backgrounds; every node in it is a sibling of the content, not a child
        // of a separate stacking context. So a captured level written onto a
        // backdrop would let it climb out of that layer and paint over the very
        // content it is the ground for — a page whose hero wrapper declares
        // `z-index: 10` and whose copy declares nothing would hide its own words
        // behind its own photograph. The level a backdrop paints at is already
        // stated, by where the fold puts it.
        const boxPaintOrder = foldPaintOrder(widest)
        if (boxPaintOrder !== undefined) node.paintOrder = boxPaintOrder
        children.push(node)
        recordClip(node, framed)
      }
      signalDropped(widest, node, presentWidths)
      continue
    }

    signal(sample, 'text-free element is neither media, a painted surface, nor a known control — no L1 leaf yet', presentWidths)
  }

  // REQ-271 — the widest width's section records, which carry each band's own
  // measured fill alongside the scrim over it. The widest is the authoritative
  // sample for a per-band decision, exactly as the section-background fold reads
  // its URL from the widest entry that carries one.
  const sectionsAtWidest =
    projections.find((p) => p.viewport.width === Math.max(...widths))?.manifest.sections ?? []
  // REQ-338 (issue 3) — and EVERY width's records, because a scrim is not always
  // band-wide at the widest one (see {@link bandBaseFill}). Ascending by width,
  // so "the last sample that measured the axis" is the widest that did.
  const sectionsByWidth = projections.map((p) => p.manifest.sections ?? [])

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
  // REQ-351 (issue 2) — is this row's fill a colour the BROWSER composited out of
  // what the band paints, rather than a fill of the row's own?
  const onCompositedBand = compositedBandRows(sectionsAtWidest, sectionsByWidth)
  const bandRows: SurfaceRow[] = []
  const cardRows: SurfaceRow[] = []
  for (const r of surfaceRows) {
    const isBar = Boolean(r.fill) && !hasCardTreatment(r) && barFills.has(r.fill!)
    const onBand = !hasCardTreatment(r) && Boolean(r.fill) && bandFills.has(r.fill!)
    if (isBar) bandRows.push(r) // BUG-19 — a bar member defines the full-bleed bar band
    else if (onBand && isFullWidth(r)) bandRows.push(r)
    else if (onBand) continue // a narrow run on the band paints nothing of its own
    else if (onCompositedBand(r)) {
      // REQ-351 (issue 2) — the fill is the band's composite. Keep the row only
      // for the treatments the run's own element bears; never for its colour.
      if (!hasOwnCardTreatment(r)) continue
      cardRows.push({ ...r, fill: undefined, gradient: undefined })
    } else if (r.fill || r.gradient || hasCardTreatment(r)) cardRows.push(r)
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
  const bandNodes = buildSolidBands(
    bandRows,
    widths,
    sectionEdges,
    heightAt,
    edgeResponses,
    sectionsAtWidest,
    sectionsByWidth,
  )
  const cardNodes = buildCards(cardRows, widths, heightAt, columnFit)

  // REQ-351 (issue 1) — the page canvas is what the capture MEASURED on `<body>`,
  // and only failing that what the page is mostly painted in.
  //
  // The precedence used to run the other way: the fill covering the greatest total
  // band height won, and `manifest.bodyBackground` — the literal answer to "what
  // shows where nothing is painted", recorded at every projection — was consulted
  // only if that search came back empty, which on any real page it never does. On
  // joyfulculinarycreations.com the tallest fill is `#7a7a7a` (two bands totalling
  // 2281px against white's 1060px) while all seven projections record `#ffffff`,
  // so the three places the page lets its canvas show — two 15px testimonial
  // margins and a 1px gap — painted grey. |255 - 122| = 133/255 over 31 of 4743
  // rows: the highest mean anywhere on that page, 22.34% of its total pixel
  // disagreement, and ZERO value deltas, because the comparator infers the
  // reference's canvas from the same wrong evidence (filed separately).
  //
  // A band that is merely the tallest is evidence about BANDS, not about `<body>`.
  // The old comment defended the inversion — "where bands do not quite meet, the
  // dominant band reads truer than the canvas hiding behind them" — and that is
  // exactly the claim this page falsifies: where the bands do not meet, what shows
  // is the canvas, which is the one thing the browser was asked directly.
  let band: string | undefined = projections
    .map((p) => p.manifest.bodyBackground)
    .find((c): c is string => typeof c === 'string' && c.length > 0)
  if (!band) {
    // BUG-27 — no projection recorded a canvas: fall back to the band fill
    // covering the greatest total height. The captured backdrops count towards
    // that height alongside the reconstructed bands. They ARE full-bleed bands,
    // read straight off the page rather than inferred from the surfaces runs sit
    // on, so on a page whose panels are all nested (and which therefore
    // reconstructs almost no bands of its own) they are the only honest evidence
    // of what the page is mostly painted in.
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
    let bandExtent = 0
    for (const [fill, h] of bandHeightByFill) {
      if (h > bandExtent) {
        bandExtent = h
        band = fill
      }
    }
  }
  // Last resort when neither a canvas nor a full-bleed band was found: the most
  // common run fill.
  if (!band) {
    const counts = new Map<string, number>()
    for (const r of surfaceRows) if (r.fill) counts.set(r.fill, (counts.get(r.fill) ?? 0) + 1)
    let best = 0
    for (const [fill, n] of counts) if (n > best) ((best = n), (band = fill))
  }

  // BUG-13 — section/band background images (the hero). Paint order beneath
  // everything: solid bands, then section-image bands, then cards, then content.
  //
  // REQ-338 (issues 1 + 2) — and then deduplicated against the captured
  // backdrops, so a rectangle the treatments probe already read as an element
  // (with its `opacity` and `filter`) is not painted a second, poorer time by the
  // section probe's reading of the same thing.
  const sectionBgNodes = mergeSectionBackgroundsIntoBackdrops(
    foldSectionBackgrounds(projections, widths, heightAt, sectionResponses),
    backdropNodes,
    widths,
  )

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
          x: round2(box.x),
          y: round2(box.y),
          width: round2(box.width),
          height: round2(box.height),
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
        x: round2(box.x - seam.x),
        y: round2(box.y - seam.y),
        width: round2(box.width),
        height: round2(box.height),
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
      const axes: L1ControlAxes = chipAxes(widestEl)
      // REQ-265 — and the one painted value a chip run has no equivalent of: the
      // placeholder's ink. Without it the renderer's default (re-point the UA
      // pseudo-element at the field's own colour) is the only possible outcome,
      // which paints a reference's grey placeholder in the field's text colour.
      const placeholder = widestEl.placeholderColor ? colorToHex(widestEl.placeholderColor) : null
      if (placeholder) axes.placeholderColor = placeholder
      // REQ-308 — and the control's own TYPE, which the capture now records for
      // a placeholder-only control (`fieldsUnder` reads the `::placeholder`
      // pseudo-element's computed style). Without it the renderer's zero-look
      // `font: inherit` reset is the only thing that governs, so the control
      // inherits the body's type and its first line box starts wherever `normal`
      // leading puts it — measured on gigabytealchemy.ai as a textarea placeholder
      // painted three pixels high against a reference line-height of 24px.
      //
      // Guarded on a real size, which is exactly what a bundle taken before the
      // extractor read the axis cannot have: such a document folds as it always
      // did, and nothing is emitted for a media or backdrop box, which carry the
      // text-free constant.
      if (widestEl.fontSizePx > 0) {
        if (widestEl.fontFamily) axes.fontFamily = widestEl.fontFamily
        axes.fontSizePx = clamp(Math.round(widestEl.fontSizePx), FONT_SIZE.min, FONT_SIZE.max)
        if (widestEl.fontWeight > 0) {
          axes.fontWeight = clamp(Math.round(widestEl.fontWeight), FONT_WEIGHT.min, FONT_WEIGHT.max)
        }
        // Absent means `line-height: normal`, which is what the renderer's own
        // reset already produces — emitting nothing reproduces it exactly.
        if (widestEl.lineHeightPx !== undefined) {
          axes.lineHeightPx = Math.round(widestEl.lineHeightPx * 100) / 100
        }
      }
      if (Object.keys(axes).length) control.axes = axes
      // REQ-269 — the control's content inset, folded exactly as it is onto a text
      // leaf (AC-1626): same `foldPadding`, same per-side responsive tracks. The
      // renderer's zero-look reset pushes `padding: 0` into every control's base
      // rule BEFORE the axes, so an unauthored control has no inset at all and its
      // placeholder paints against the field's edge; this is the axis that wins.
      // A pre-REQ-269 bundle carries no padding sides, so nothing is emitted and
      // that document renders exactly as it did.
      const framedPad = row.samples.map((s2) => ({ width: s2.at, element: s2.element }))
      const pad = foldPadding(widestEl)
      if (pad) control.padding = pad
      const padTracks = responsivePaddingTracks(framedPad)
      if (padTracks) control.responsivePadding = padTracks
      // REQ-308 — and the per-width type tracks, read off the same framed samples
      // the padding tracks are. `axes` above is the WIDEST cell only, so a control
      // whose type shrinks at mobile would otherwise be pinned to its desktop size
      // at every width — BUG-18's defect, on the route BUG-18 did not cover. A type
      // that holds one value across the ladder stays a scalar and emits no track.
      const typeTracks = responsiveTextTracks(framedPad)
      if (typeTracks) control.responsive = typeTracks
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
      form.submitLabel = l1PlainText(chip.text)
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
  const bodyBeforeClip = claimedSubmits.size ? children.filter((c) => !claimedSubmits.has(c)) : children

  // REQ-332 — put the leaves a clipping ancestor cuts off inside a node that
  // clips, so the document is as wide as what the reader sees rather than as wide
  // as what was laid out. Before `nestBackingSurfaces`, because a clip region is
  // content like any other and a band that holds it should own the region, not
  // its individual slides.
  const inBody = new Set<L1Node>(bodyBeforeClip)
  const clipRegions = nestClipRegions(
    // Only leaves still standing in the page body: a run claimed by a form is
    // that form's control now, and putting it in a clip region as well would
    // paint the reference's one element twice.
    clipRows.filter((r) => inBody.has(r.node)),
    widths,
    heightAt,
  )
  const body = clipRegions.members.size
    ? bodyBeforeClip.flatMap((c) => {
        const region = clipRegions.built.get(c)
        if (region) return [region]
        return clipRegions.members.has(c) ? [] : [c]
      })
    : bodyBeforeClip

  // REQ-332 — name the captured backdrops now that every leaf exists, because the
  // question ("does anything stand on this fill?") cannot be answered until they
  // all do. Before this the ids were handed out in capture order inside the fold
  // loop and every backdrop was a `box-N`, which is the name the geometry
  // envelope reads as "ordinary painted content" — so a section band was reported
  // as colliding with its own copy, and no run could name it as what it sits on.
  nameCapturedBackdrops(backdropNodes, [...body, ...slotNodes], textHeights, widths, boxIdx)

  // REQ-370 — a photograph the capture recorded BENEATH a backdrop (a hero image
  // under its own scrim) leaves the content and travels with that backdrop, so it
  // lands in whatever owns the backdrop, immediately before it.
  const grounds = groundImagesUnder(backdropNodes, body, capturedLevel, widths)
  const grounded = new Set<L1Node>([...grounds.values()].flat())
  const bodyNodes = grounded.size ? body.filter((n) => !grounded.has(n)) : body
  /** The backdrop layer in paint order: each backdrop preceded by its grounds. */
  const backdropLayer: L1Node[] = backdropNodes.flatMap((b) => [...(grounds.get(b) ?? []), b])

  // BUG-142 — state the ownership the fold already knows. A band, a section
  // background and a card that back content become containers holding it, so the
  // panel and the words on it are one node from here on. A surface that backs
  // nothing is untouched and stays a pinned `box`, exactly as before.
  //
  // `backdropNodes` own nothing — an element-level background photograph is a
  // CAPTURED element with its own oracle counterpart, not a surface the fold
  // reconstructed from the runs standing on it. REQ-338 (issue 1): they ARE owned,
  // though, because paint order is the whole point of a backdrop and only nesting
  // can put a section's overlay element between the section's own fill and the
  // copy standing on it.
  const ownership = nestBackingSurfaces(
    [...bandNodes, ...sectionBgNodes, ...cardNodes],
    [...bodyNodes, ...slotNodes],
    textHeights,
    widths,
    backdropNodes,
    grounds,
  )
  /** The members of one paint layer that are still top-level, as rebuilt. */
  const topLevel = (layer: readonly L1Node[]): L1Node[] =>
    layer.filter((n) => !ownership.owned.has(n)).map((n) => ownership.built.get(n) ?? n)
  // BUG-27 — `backdropNodes` (element-level background photographs) sit with the
  // section-background boxes: both are backdrops, painted beneath cards and
  // content. Ordered after `sectionBgNodes` because a nested backdrop is, by
  // construction, inside the section whose background it overlays.
  const paintOrder = [
    ...topLevel(bandNodes),
    ...topLevel(sectionBgNodes),
    ...topLevel(backdropLayer),
    ...topLevel(cardNodes),
    ...topLevel(bodyNodes),
    ...topLevel(slotNodes),
  ]
  // BUG-142 — the BACKGROUND LAYER is everything at the top level that holds no
  // content: the surfaces nothing sits on and the captured backdrops. They paint
  // first, in the paint order above, which is what makes them backgrounds. What
  // remains holds content, and is ordered by the earliest capture element it
  // holds — see {@link OwnershipResult.readingOrder}.
  const background = paintOrder.filter((n) => ownership.readingOrder.get(n) === undefined)
  const holdsContent = paintOrder
    .filter((n) => ownership.readingOrder.get(n) !== undefined)
    .sort((a, b) => ownership.readingOrder.get(a)! - ownership.readingOrder.get(b)!)

  const root: L1Box = {
    kind: 'box',
    children: [...background, ...holdsContent],
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

  // BUG-113 — the last thing the fold decides, because it is the only decision
  // that needs the WHOLE page: one node's reflow is evidence about the window
  // every other node crosses too, including the controls inside a recovered form.
  holdAcrossReflowWindows([root, ...(opts.forms ?? []).map((f) => f.form)], widths)
  markViewportTracking(root, widths)

  const result = validateL1(doc)
  if (!result.ok) {
    const detail = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    throw new Error(`foldToL1: produced an invalid L1 document — ${detail}`)
  }
  return result.value
}
