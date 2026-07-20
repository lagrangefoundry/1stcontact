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
import { validateL1, type L1Box, type L1Document, type L1Node, type L1Segment, type L1TextAxes } from '@1stcontact/site-schema'
import { buildResponsiveTable, type LabelledProjection } from '../cli/responsive-diff'
import type { MultiStateCapture, StateProjection, ValueElement } from '../cli/capture'

const FONT_SIZE = { min: 1, max: 400 }
const FONT_WEIGHT = { min: 1, max: 1000 }

export interface FoldOptions {
  /** Preferred engine to fold from when a width was captured on several (default `chromium`). */
  engine?: string
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * One resting projection per width, preferring the requested engine, then any
 * engine — the fold reads a single DOM per width (cross-engine agreement is the
 * capture gate's concern, not the fold's).
 */
function restingByWidth(multiState: MultiStateCapture, engine: string): StateProjection[] {
  const byWidth = new Map<number, StateProjection>()
  for (const p of multiState.projections) {
    if (p.state !== 'rest') continue
    const w = p.viewport.width
    const existing = byWidth.get(w)
    if (!existing) byWidth.set(w, p)
    else if (existing.engine !== engine && p.engine === engine) byWidth.set(w, p)
  }
  return [...byWidth.values()].sort((a, b) => a.viewport.width - b.viewport.width)
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
  return axes
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

  const children: L1Node[] = []
  for (const row of table.rows) {
    // Text-free nodes have no faithful L1 leaf yet (no src/text) — defer them.
    const sample = row.cells.find((c) => c.element)?.element
    if (!sample || sample.textless || sample.text.trim() === '') continue

    // Keyframes: one per present cell that carries a box, ascending by width.
    const framed = row.cells.filter((c) => c.element?.box)
    if (framed.length === 0) continue
    const keyframes = framed.map((c) => {
      const box = c.element!.box!
      return { at: c.width, x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width) }
    })

    // Axes from the widest present cell (the desktop rendering is the front door).
    const widest = framed[framed.length - 1].element!
    const node: Extract<L1Node, { kind: 'text' }> = {
      kind: 'text',
      text: widest.text,
      axes: textAxes(widest),
      geometry: { keyframes },
    }
    if (keyframes.length > 1) {
      node.geometry!.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    const vis = visibilityFor(framed.map((c) => c.width), widths)
    if (vis) node.visibility = vis
    children.push(node)
  }

  const root: L1Box = { kind: 'box', children }
  const doc: L1Document = { widths, root }

  const result = validateL1(doc)
  if (!result.ok) {
    const detail = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    throw new Error(`foldToL1: produced an invalid L1 document — ${detail}`)
  }
  return result.value
}
