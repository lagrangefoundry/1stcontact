/**
 * Measuring a drawing, relating two anchors, and solving for the number to write
 * (REQ-209, DOC-52 §3.3–3.4 and §5).
 *
 * THE FAILURE THIS EXISTS TO END. Positioning anything in a drawing meant
 * authoring an absolute coordinate into a space the model could only see as a
 * picture: write, render, screenshot, squint, adjust, repeat. On 2026-09-09 that
 * loop ran thirteen writes and thirteen screenshots in sixteen minutes on the
 * 1st Contact wordmark and still did not land it, ending with a ruler grid drawn
 * into the drawing itself so a glyph edge could be read off a screenshot by eye.
 *
 * THE DIVISION OF LABOUR. `measure` gives the map, so the model knows what to
 * name. `relate` and `solve` do the arithmetic, so it never has to. If a caller
 * is doing sums on a `measure` result it should have called `solve` instead —
 * that is the organising principle, and it is why the measurement returns the
 * primitives every anchor derives from rather than the anchors themselves.
 *
 * WHAT IS DELIBERATELY NOT HERE. Nothing applies anything: `solve` returns a
 * number and a place to put it, and the model still authors the document. There
 * is no constraint system — a solved number is wrong again when its inputs
 * change, and the durable practice is to re-solve, which is what `assert` and
 * the recorded-intent comment support. And `solve` handles translation only:
 * alignment is entirely translational, so the delta `relate` already computed IS
 * the correction, and scale and rotation would be a different operation solving
 * a problem nobody has.
 */

import {
  AnchorError,
  anchorAxis,
  anchorValue,
  assertSameAxis,
  parseAnchorRef,
  parseRelation,
  recordedRelations,
  type FontMetrics,
  type Relation,
  type ResolvedAnchor,
} from '@1stcontact/site-schema'
import type { BrowserDriverFactory } from '../capture/types'
import { measureScript, type RawMeasurement, type RawNodeMeasurement } from '../capture/measure-svg'

/** What a measurer needs to put a drawing in front of a browser. */
export interface MeasureDeps {
  /** The site whose page supplies the `@font-face` rules — never model-supplied. */
  slug: string
  /** This deployment's own origin, for the preview channel. */
  origin: string
  /** A browser, already held to whatever egress policy the host applies. */
  driverFactory: BrowserDriverFactory
}

/** Renders one drawing and hands back its geometry. */
export type DrawingMeasurer = (svg: string) => Promise<RawMeasurement>

/**
 * A measurer backed by a real browser, rendering inside the site's own draft.
 *
 * THE PAGE IS THE FONT CONTEXT. A drawing's geometry is the geometry of the font
 * it actually gets, and which font that is depends on the `@font-face` rules the
 * site declares — so measuring against a blank document would measure a
 * different drawing from the one a visitor sees. The draft page carries those
 * rules and is already served in process by the preview origin resolver, so this
 * costs one navigation and no new plumbing. `measure-svg.ts` explains why the
 * drawing then goes into a shadow root rather than into the page's own body.
 */
export function browserMeasurer(deps: MeasureDeps): DrawingMeasurer {
  return async (svg: string) => {
    const url = new URL(
      `/preview/${encodeURIComponent(deps.slug)}/draft/`,
      new URL(deps.origin),
    ).toString()
    const driver = await deps.driverFactory()
    try {
      await driver.navigate(url)
      return await driver.query<RawMeasurement>(measureScript(svg))
    } finally {
      await driver.close()
    }
  }
}

/** Raised when a drawing cannot be measured on this deployment at all. */
export class MeasureUnavailableError extends Error {
  constructor() {
    super(
      'this builder has no browser, so a drawing cannot be rendered and therefore ' +
        'cannot be measured. Say so rather than guessing at coordinates.',
    )
    this.name = 'MeasureUnavailableError'
  }
}

/** Raised when a reference names a node the drawing has not got. */
export class NodeNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NodeNotFoundError'
  }
}

/** The node a reference names, or a refusal that says what is there instead. */
export function nodeOf(measurement: RawMeasurement, ref: string): RawNodeMeasurement {
  const found = measurement.nodes.find((node) => node.ref === ref)
  if (found) return found
  // The listing is the fix, not decoration: the commonest cause is a node with
  // no `id`, and seeing its path reference is what prompts giving it one.
  const known = measurement.nodes.map((node) => node.ref).join(', ')
  throw new NodeNotFoundError(
    `the drawing has no node called '${ref}'. It has: ${known || 'nothing measurable'}.`,
  )
}

/** The font metrics a node's font anchors read, or null when it has none. */
function fontOf(measurement: RawMeasurement, node: RawNodeMeasurement): FontMetrics | null {
  if (!node.font) return null
  return measurement.fonts.find((font) => font.key === node.font) ?? null
}

/**
 * Resolve `#ord.cap-top` against a measurement.
 *
 * The parse failure and the lookup failure are separate sentences on purpose: a
 * misspelt anchor and a missing node are different mistakes with different fixes,
 * and one message covering both would fit neither.
 */
export function resolveAnchorRef(measurement: RawMeasurement, ref: string): ResolvedAnchor {
  const parsed = parseAnchorRef(ref)
  if (!parsed) {
    throw new AnchorError(
      `'${ref}' is not an anchor reference. Write it as <node>.<anchor>, e.g. ` +
        `'#wordmark.cap-top' — the node as measure_drawing reports it, then one of ` +
        `the anchor names it lists.`,
    )
  }
  const node = nodeOf(measurement, parsed.node)
  const axis = anchorAxis(parsed.anchor)
  if (axis === null) throw new AnchorError(`'${parsed.anchor}' is not an anchor.`)
  return {
    ref,
    node: parsed.node,
    anchor: parsed.anchor,
    axis,
    value: anchorValue({ node, font: fontOf(measurement, node) }, parsed.anchor),
  }
}

/** What `relate` answers: one signed number and the axis it lies on. */
export interface RelateResult {
  a: ResolvedAnchor
  b: ResolvedAnchor
  axis: 'x' | 'y'
  /** How far `b` is past `a`. Zero means the relation holds exactly. */
  delta: number
}

/**
 * The signed distance from `a` to `b`, refusing a mismatched pair.
 *
 * `delta` is `b − a` rather than `a − b` so that it reads as the CORRECTION: it
 * is what `a` must move by to meet `b`, which is what `solve` then applies and
 * what an `assert` reports when it does not hold.
 */
export function relateAnchors(measurement: RawMeasurement, aRef: string, bRef: string): RelateResult {
  const a = resolveAnchorRef(measurement, aRef)
  const b = resolveAnchorRef(measurement, bRef)
  assertSameAxis(a, b)
  return { a, b, axis: a.axis, delta: round(b.value - a.value) }
}

/** Which attribute moves which kind of node, per axis. */
const MOVES: Readonly<Record<string, { x: string; y: string }>> = Object.freeze({
  text: { x: 'x', y: 'y' },
  tspan: { x: 'x', y: 'y' },
  rect: { x: 'x', y: 'y' },
  circle: { x: 'cx', y: 'cy' },
  ellipse: { x: 'cx', y: 'cy' },
})

/** What `solve` answers. Never a bare number — see below. */
export interface SolveResult {
  node: string
  attr: string
  /** What to write. */
  value: number
  /** What is there now. */
  from: number
  axis: 'x' | 'y'
  /** The root-space correction this achieves. */
  delta: number
}

/** What one `solve` is asked for. */
export interface SolveRequest {
  /** The node to move. Optional — `so` already names it. */
  move?: string
  /** The anchor on the moving node. */
  so: string
  /** The anchor it should meet. */
  equals: string
  /** How far past `equals` to land. */
  offset?: number
}

/**
 * The attribute value that achieves a stated relation.
 *
 * IT RETURNS THE NODE AND THE ATTRIBUTE, NEVER A BARE NUMBER. The measurement is
 * in root user space; an attribute is written in local space. Handing a number
 * across that asymmetry with nothing naming where it goes is a bug factory —
 * the number would be right and would land somewhere it means something else.
 */
export function solveTranslation(measurement: RawMeasurement, request: SolveRequest): SolveResult {
  const so = resolveAnchorRef(measurement, request.so)
  const equals = resolveAnchorRef(measurement, request.equals)
  assertSameAxis(so, equals)
  if (request.move !== undefined && request.move !== '' && request.move !== so.node) {
    throw new AnchorError(
      `'${request.move}' is not the node '${request.so}' is an anchor of. Move the ` +
        `node the anchor belongs to, or name the anchor on '${request.move}'.`,
    )
  }
  const node = nodeOf(measurement, so.node)
  const moves = MOVES[node.kind]
  if (!moves) {
    throw new AnchorError(
      `a <${node.kind}> has no single attribute that moves it, so there is nothing ` +
        `to solve for. This moves ${Object.keys(MOVES).map((k) => `<${k}>`).join(', ')}; ` +
        `for anything else, put it in a <g> and translate that by hand.`,
    )
  }
  const attr = moves[so.axis]
  const scale = so.axis === 'x' ? (node.scale?.[0] ?? 1) : (node.scale?.[1] ?? 1)
  if (node.skewed) {
    throw new AnchorError(
      `'${so.node}' is inside a rotated or skewed transform, so moving it along one ` +
        `axis is not something one attribute can do. Solve it on the untransformed ` +
        `node, or adjust the transform by hand.`,
    )
  }
  if (!Number.isFinite(scale) || scale === 0) {
    throw new AnchorError(`'${so.node}' is scaled to nothing on the ${so.axis} axis.`)
  }
  const raw = node.attrs?.[attr]
  if (raw !== undefined && raw !== null && raw !== '' && !Number.isFinite(Number(raw))) {
    throw new AnchorError(
      `'${so.node}' carries ${attr}="${raw}", which is a list rather than one number. ` +
        `A per-glyph position is not something this can solve for.`,
    )
  }
  const from = raw === undefined || raw === null || raw === '' ? 0 : Number(raw)
  const delta = equals.value + (request.offset ?? 0) - so.value
  return {
    node: so.node,
    attr,
    value: round(from + delta / scale),
    from: round(from),
    axis: so.axis,
    delta: round(delta),
  }
}

/** One asserted relation, and whether the drawing satisfies it. */
export interface AssertionResult {
  relation: string
  /** Zero means it holds exactly. Absent when the relation could not be read. */
  delta?: number
  holds?: boolean
  /** Why it could not be evaluated, when it could not. */
  why?: string
}

/**
 * Evaluate a set of stated relations against a measurement.
 *
 * ADVISORY, NEVER GATING. A non-zero delta is reported and nothing is refused.
 * The model may have changed something deliberately, and a blocked write on a
 * stale assertion is a new failure mode with no upside — a visible delta is
 * strictly better than a document that would not go in.
 *
 * A relation that cannot be evaluated at all — a node that is gone, an anchor
 * that is misspelt — is reported as such rather than dropped, because a silently
 * absent assertion reads exactly like one that passed.
 */
export function evaluateRelations(
  measurement: RawMeasurement,
  relations: readonly (string | Relation)[],
  tolerance = 0.05,
): AssertionResult[] {
  return relations.map((entry) => {
    const source = typeof entry === 'string' ? entry : `${entry.a} = ${entry.b}${offsetText(entry.offset)}`
    const relation = typeof entry === 'string' ? parseRelation(entry) : entry
    if (!relation) {
      return {
        relation: source,
        why:
          'this is not a relation. Write it as <node>.<anchor> = <node>.<anchor>, ' +
          'optionally followed by + or - a number.',
      }
    }
    try {
      const related = relateAnchors(measurement, relation.a, relation.b)
      // `delta` is how far b is past a; the relation asks a to sit `offset` past
      // b, so what is left over is the delta minus the offset it was allowed.
      const residual = round(related.delta + relation.offset)
      return { relation: source, delta: residual, holds: Math.abs(residual) <= tolerance }
    } catch (error) {
      return { relation: source, why: error instanceof Error ? error.message : String(error) }
    }
  })
}

function offsetText(offset: number): string {
  if (!offset) return ''
  return offset > 0 ? ` + ${offset}` : ` - ${Math.abs(offset)}`
}

/**
 * The measurement as the model receives it.
 *
 * The internal fields `solve` needs — the current attribute values, the scale
 * from local to root space — are dropped here. They are how the arithmetic is
 * done, not something to do arithmetic with, and every field a model can see is
 * a field it may try to reason from.
 */
export function measurementResponse(
  drawing: string,
  measurement: RawMeasurement,
  svg: string,
): Record<string, unknown> {
  const recorded = recordedRelations(svg)
  return {
    drawing,
    viewBox: measurement.viewBox,
    space: measurement.space,
    fonts: measurement.fonts,
    nodes: measurement.nodes.map(
      ({ attrs: _attrs, scale: _scale, skewed: _skewed, path: _path, ...node }) => node,
    ),
    // Every relation the drawing itself records, with what it is worth NOW. This
    // is the point of recording one: the intent outlives the number, so when the
    // font-size changes the claim is still legible and can be re-solved.
    recorded: recorded.length > 0 ? evaluateRelations(measurement, recorded) : [],
    warnings: measurement.warnings,
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}
