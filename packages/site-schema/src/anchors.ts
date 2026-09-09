/**
 * The anchor vocabulary (REQ-209, DOC-52 §5).
 *
 * THE PROBLEM IT NAMES. "The top of the 1" is three different lines, and which
 * one you mean decides whether the result looks right. A digit sits at cap
 * height; the `t` in "st" rises above it. So aligning ink-tops and aligning
 * cap-tops give visibly different results, and the session that motivated this
 * ticket could see the difference and had no word for it. Likewise "where the 1
 * ends" is `ink-right` for tight optical spacing and `advance-end` for ordinary
 * typesetting — in the 1st Contact wordmark those differ by 8.4 user units.
 *
 * SO THE SET NAMES ITS FAMILIES EXPLICITLY, and that is the point of the file:
 *
 *   box       the element's own bounds — any node
 *   ink       the painted bounds of THIS string in THIS font — text only
 *   font      derived from the font's metrics × font-size, independent of the
 *             string — text only
 *   advance   where the pen lands — text only
 *
 * IT LIVES HERE RATHER THAN IN THE TOOL because it is a contract, not an
 * implementation: `measure_page` (DOC-52 §3.6) imports the same names for the
 * page surface, and a second definition site is free to drift from the first.
 * Nothing in this file renders, measures, or knows what a browser is — it is the
 * arithmetic that turns four measured primitives into fifteen named lines.
 *
 * AXIS IS INFERRED FROM THE ANCHOR, never passed. `relate(a.top, b.left)` is
 * then a refusal rather than a silently meaningless number, which is the whole
 * reason the caller never gets to say which axis it meant.
 */

/** Which family an anchor belongs to. The families are not interchangeable. */
export type AnchorFamily = 'box' | 'ink' | 'font' | 'advance'

/** The axis an anchor lies on. Inferred, never supplied. */
export type AnchorAxis = 'x' | 'y'

/** One anchor's placement in the vocabulary. */
export interface AnchorSpec {
  family: AnchorFamily
  axis: AnchorAxis
}

/**
 * The closed set. British spelling for the two centres, because every other
 * word the surface uses to a client is British and one American spelling in the
 * middle of the vocabulary is the kind of inconsistency a model copies.
 */
export const ANCHORS: Readonly<Record<string, AnchorSpec>> = Object.freeze({
  // box — any node
  left: { family: 'box', axis: 'x' },
  right: { family: 'box', axis: 'x' },
  'centre-x': { family: 'box', axis: 'x' },
  top: { family: 'box', axis: 'y' },
  bottom: { family: 'box', axis: 'y' },
  'centre-y': { family: 'box', axis: 'y' },
  // ink — text only
  'ink-left': { family: 'ink', axis: 'x' },
  'ink-right': { family: 'ink', axis: 'x' },
  'ink-top': { family: 'ink', axis: 'y' },
  'ink-bottom': { family: 'ink', axis: 'y' },
  // font — text only
  baseline: { family: 'font', axis: 'y' },
  'cap-top': { family: 'font', axis: 'y' },
  'x-top': { family: 'font', axis: 'y' },
  ascender: { family: 'font', axis: 'y' },
  descender: { family: 'font', axis: 'y' },
  // advance — text only
  'advance-start': { family: 'advance', axis: 'x' },
  'advance-end': { family: 'advance', axis: 'x' },
})

/** Every anchor name, in declaration order — for a refusal that lists them. */
export const ANCHOR_NAMES: readonly string[] = Object.freeze(Object.keys(ANCHORS))

/** The anchors any node answers. The other three families need text. */
export const BOX_ANCHORS: readonly string[] = Object.freeze(
  ANCHOR_NAMES.filter((name) => ANCHORS[name].family === 'box'),
)

/** Is `name` in the vocabulary? */
export function isAnchor(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(ANCHORS, name)
}

/** The axis `name` lies on, or `null` when it is not an anchor. */
export function anchorAxis(name: string): AnchorAxis | null {
  return isAnchor(name) ? ANCHORS[name].axis : null
}

/** The family `name` belongs to, or `null` when it is not an anchor. */
export function anchorFamily(name: string): AnchorFamily | null {
  return isAnchor(name) ? ANCHORS[name].family : null
}

/** A parsed `#node.anchor` reference. */
export interface AnchorRef {
  /** The node's reference, `#` included when the caller wrote one. */
  node: string
  anchor: string
}

/**
 * Parse `#ord.cap-top` — the only form either side of a relation ever takes.
 *
 * The node part is everything before the LAST dot, because a node reference may
 * legitimately contain one (`0.3` is what an un-id'd node is called) and every
 * anchor name is dot-free. Returns `null` rather than throwing: the caller has
 * the better sentence to say, since it knows which argument this was.
 */
export function parseAnchorRef(ref: string): AnchorRef | null {
  const trimmed = ref.trim()
  const dot = trimmed.lastIndexOf('.')
  if (dot <= 0 || dot === trimmed.length - 1) return null
  const node = trimmed.slice(0, dot)
  const anchor = trimmed.slice(dot + 1)
  if (!isAnchor(anchor)) return null
  if (node === '#' || node === '') return null
  return { node, anchor }
}

/**
 * The four primitives every anchor derives from, in root user space.
 *
 * PRIMITIVES, NOT ANCHORS. Fifteen scalars per node would be larger than this
 * *and* unable to answer the sixteenth relationship nobody enumerated — so the
 * measurement returns what was measured and this file does the arithmetic.
 */
export interface NodeGeometry {
  /** `[x, y, width, height]` — the element's own bounds. */
  box: readonly [number, number, number, number]
  /** `[x, y, width, height]` — the painted bounds. Text only. */
  ink?: readonly [number, number, number, number] | null
  /** The text baseline's y. Text only. */
  baseline?: number | null
  /** Where the pen starts, on the x axis. Text only. */
  advanceStart?: number | null
  /** How far the pen travels. Text only. */
  advanceWidth?: number | null
  /** Which font entry the font-family anchors read their ratios from. */
  font?: string | null
  /** The rendered size, in user units, the font ratios multiply. */
  fontSize?: number | null
}

/**
 * A font's metrics, as ratios of the em — reported ONCE PER FONT rather than
 * once per node, which is where most of a measurement's compression comes from.
 */
export interface FontMetrics {
  /** The font-family value as authored. */
  requested: string
  /** The family the browser actually used, as far as it can be determined. */
  resolved: string
  /** True when `resolved` is a generic or platform keyword, not a named face. */
  generic: boolean
  capHeight: number
  xHeight: number
  ascender: number
  /** Negative: below the baseline. */
  descender: number
}

/** Everything `anchorValue` needs to answer for one node. */
export interface AnchorContext {
  node: NodeGeometry
  /** The metrics of `node.font`, when the node is text and its font was read. */
  font?: FontMetrics | null
}

/**
 * Why an anchor could not be answered. A refusal, never a zero — a zero here
 * would be a coordinate, and a wrong one.
 */
export class AnchorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnchorError'
  }
}

/**
 * The value of one anchor on one node, in root user space.
 *
 * Every font line is `baseline − ratio × fontSize`, which is the closed form
 * that makes cap-height alignment arithmetic rather than a search: given two
 * runs of the same font at different sizes, the y that aligns their cap-tops
 * falls straight out and no iteration happens at all.
 */
export function anchorValue(context: AnchorContext, anchor: string): number {
  const spec = ANCHORS[anchor]
  if (!spec) {
    throw new AnchorError(
      `'${anchor}' is not an anchor. Use one of: ${ANCHOR_NAMES.join(', ')}.`,
    )
  }
  const { node, font } = context
  const [bx, by, bw, bh] = node.box

  if (spec.family === 'box') {
    switch (anchor) {
      case 'left':
        return bx
      case 'right':
        return bx + bw
      case 'centre-x':
        return bx + bw / 2
      case 'top':
        return by
      case 'bottom':
        return by + bh
      default:
        return by + bh / 2
    }
  }

  if (spec.family === 'ink') {
    const ink = node.ink
    if (!ink) {
      throw new AnchorError(
        `'${anchor}' is an ink anchor and this node paints no glyphs, so it has ` +
          `no ink. Use a box anchor (${BOX_ANCHORS.join(', ')}) instead.`,
      )
    }
    const [ix, iy, iw, ih] = ink
    switch (anchor) {
      case 'ink-left':
        return ix
      case 'ink-right':
        return ix + iw
      case 'ink-top':
        return iy
      default:
        return iy + ih
    }
  }

  if (spec.family === 'advance') {
    const start = node.advanceStart
    if (start === null || start === undefined) {
      throw new AnchorError(
        `'${anchor}' is an advance anchor and this node is not text, so no pen ` +
          `advances across it. Use a box anchor (${BOX_ANCHORS.join(', ')}) instead.`,
      )
    }
    return anchor === 'advance-start' ? start : start + (node.advanceWidth ?? 0)
  }

  // font
  const baseline = node.baseline
  if (baseline === null || baseline === undefined) {
    throw new AnchorError(
      `'${anchor}' is a font anchor and this node is not text, so it has no ` +
        `baseline. Use a box anchor (${BOX_ANCHORS.join(', ')}) instead.`,
    )
  }
  if (anchor === 'baseline') return baseline
  if (!font) {
    throw new AnchorError(
      `'${anchor}' needs the font's metrics and none were read for this node.`,
    )
  }
  const size = node.fontSize ?? 0
  const ratio =
    anchor === 'cap-top'
      ? font.capHeight
      : anchor === 'x-top'
        ? font.xHeight
        : anchor === 'ascender'
          ? font.ascender
          : font.descender
  // y grows downward, so every line above the baseline is a subtraction and the
  // descender's negative ratio carries it back below without a special case.
  return baseline - ratio * size
}

/** One side of a relation, resolved to a number and the axis it lies on. */
export interface ResolvedAnchor {
  ref: string
  node: string
  anchor: string
  axis: AnchorAxis
  value: number
}

/**
 * Refuse a pair whose anchors lie on different axes.
 *
 * The refusal is the feature. `relate(a.top, b.left)` has an arithmetic answer
 * and no meaning, and a number with no meaning is worse than no number.
 */
export function assertSameAxis(a: ResolvedAnchor, b: ResolvedAnchor): void {
  if (a.axis !== b.axis) {
    throw new AnchorError(
      `'${a.ref}' lies on the ${a.axis} axis and '${b.ref}' on the ${b.axis} axis, ` +
        `so the distance between them is not a thing. Relate two anchors of the ` +
        `same axis — two of ${a.axis === 'x' ? 'left/right/centre-x/ink-left/ink-right/advance-start/advance-end' : 'top/bottom/centre-y/ink-top/ink-bottom/baseline/cap-top/x-top/ascender/descender'}.`,
    )
  }
}

/**
 * One stated relation: where `a` should sit relative to `b`.
 *
 * ONE SYNTAX, TWO PLACES. This is what an `assert` entry says, and it is what a
 * recorded-intent comment in the drawing says (`<!-- #ord.cap-top = #one.cap-top -->`).
 * They are the same sentence because they are the same claim — the assert block
 * checks it now, the comment keeps it legible when the font-size changes later
 * and the number has to be solved again rather than guessed again.
 */
export interface Relation {
  a: string
  b: string
  /** `a` should sit `offset` past `b` along their shared axis. */
  offset: number
}

/** `#ord.cap-top = #one.cap-top`, optionally `+ 2` or `- 2`. */
const RELATION = /^\s*(\S+)\s*=\s*(\S+)\s*(?:([+-])\s*([0-9]*\.?[0-9]+)\s*)?$/

/**
 * Parse one relation, or `null` when it is not one.
 *
 * Deliberately strict: no operators but `=`, `+` and `-`, and no expressions.
 * A relation is a claim about two anchors, and anything richer is a constraint
 * system — which this is explicitly not (DOC-52 §5.4).
 */
export function parseRelation(source: string): Relation | null {
  const match = RELATION.exec(source)
  if (!match) return null
  const [, a, b, sign, magnitude] = match
  if (!parseAnchorRef(a) || !parseAnchorRef(b)) return null
  const offset = magnitude === undefined ? 0 : Number(magnitude) * (sign === '-' ? -1 : 1)
  return { a, b, offset }
}

/** The comment form a drawing records a solved relation in. */
const RECORDED = /<!--([^>]*?)-->/g

/**
 * Every relation recorded as a comment in a drawing's own source.
 *
 * A NOTE, NOT A CONSTRAINT. Nothing enforces these and nothing rewrites the
 * document to satisfy them; SVG has no constraint system and none is proposed.
 * What they buy is that the *intention* survives the number — a solved value is
 * wrong again the moment its inputs change, and a drawing that still says what
 * it was trying to do can be re-solved instead of re-guessed.
 */
export function recordedRelations(svg: string): Relation[] {
  const out: Relation[] = []
  RECORDED.lastIndex = 0
  for (let match = RECORDED.exec(svg); match !== null; match = RECORDED.exec(svg)) {
    const relation = parseRelation(match[1])
    if (relation) out.push(relation)
  }
  return out
}
