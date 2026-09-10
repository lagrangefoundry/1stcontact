/**
 * **Marked Points** — what a pointed-at pixel resolves to (REQ-210, DOC-52 §4).
 *
 * THE PROBLEM. *"Move the st a little closer to the 1."* **A little** is a
 * continuous quantity with no efficient encoding in language, so the loop is
 * intent → words → guess → render → perception → words, and nothing in it
 * carries a number. It does not converge: the session DOC-52 was written from
 * ran thirteen iterations of exactly that and did not land the logo.
 *
 * WHY THIS FILE IS BESIDE `edit-client.ts`. It reads the same stamp the
 * renderer writes, and for the same reason: stamp-and-read is one contract, and
 * a copy in another package is free to drift from the markup it depends on.
 * What it adds to the bridge's *which segment is this* is *where in it*, in
 * every frame that turns out to matter.
 *
 * WHY THE PILL'S EXPANSION IS THE ENTIRE CHANNEL. `screenshot` renders
 * server-side; the marks live in the reader's own browser overlay and are never
 * in a render the assistant sees. That is good twice — marks cannot pollute
 * `compare` and cannot leak into the fidelity gates — but it means there is no
 * fallback where the assistant squints at a red X. Everything it will ever know
 * about a point is what {@link formatMarkedPoint} writes.
 *
 * WHY NOT RAW VIEWPORT PIXELS. `(142, 88)` asks the assistant to invert a
 * transform chain it cannot see: an SVG user space, inside an `<img>` of some
 * size, inside an L1 node, at some viewport width. So a point carries every
 * useful frame at once and inverts the chain here, where the browser can
 * actually measure it.
 *
 * NOTHING HERE WRITES. A gesture produces a *message*, never a mutation — no
 * diff, no validation, no re-render — which is why none of this comes near
 * DOC-28 §7.3's scope wall. Pointing at where you want something is
 * communicating, not designing.
 */
import { formatL1Path, type L1EditTarget, type L1SegmentKind } from '@1stcontact/site-schema'

// ── the labels ───────────────────────────────────────────────────────────────

/** The namespace a point is named from. 26 is far more than anyone needs. */
export const POINT_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/**
 * The lowest label not currently in use, or `null` when all are.
 *
 * LOWEST RATHER THAN NEXT, so a letter is reused once its point is deleted and
 * the namespace stays small — a reader who has placed and removed four points
 * is still on B, not on F. A reused letter cannot confuse the assistant,
 * because a sent point's expansion keeps its literal coordinates in the
 * transcript: history, needing no machinery.
 */
export function nextPointLabel(used: Iterable<string>): string | null {
  const taken = new Set(used)
  return POINT_LABELS.find((label) => !taken.has(label)) ?? null
}

// ── the pill's text form ─────────────────────────────────────────────────────

/** The pill as it sits in the composer. */
export function pointToken(label: string): string {
  return `[Point ${label}]`
}

/** `[Point A]` — the canonical form the overlay inserts. */
const BRACKETED = /\[\s*point\s+([a-z])\s*\]/gi
/** `Point A` — typed by hand, which DOC-52 §4.4 asks be a free safety net. */
const BARE = /\bpoint\s+([a-z])\b/gi

/**
 * The labels a draft refers to, in the order they first appear.
 *
 * LENIENT ON PURPOSE. The bracketed form is what the overlay inserts, but a
 * pill deleted by accident is the failure that motivated the `+` control, and a
 * reader who simply retypes `Point A` should be understood. Bare matching is
 * confined to labels that name a *live* point, so ordinary prose about a point
 * of view is never mistaken for a reference.
 */
export function referencedPointLabels(markdown: string, known: Iterable<string>): string[] {
  const live = new Set([...known].map((label) => label.toUpperCase()))
  const seen = new Set<string>()
  const out: { at: number; label: string }[] = []
  for (const pattern of [BRACKETED, BARE]) {
    pattern.lastIndex = 0
    for (let m = pattern.exec(markdown); m !== null; m = pattern.exec(markdown)) {
      const label = m[1].toUpperCase()
      if (!live.has(label) || seen.has(label)) continue
      seen.add(label)
      out.push({ at: m.index, label })
    }
  }
  return out.sort((a, b) => a.at - b.at).map((entry) => entry.label)
}

/** Strip the brackets, so the sent prose reads as a sentence rather than markup. */
export function flattenPointTokens(markdown: string, known: Iterable<string>): string {
  const live = new Set([...known].map((label) => label.toUpperCase()))
  BRACKETED.lastIndex = 0
  return markdown.replace(BRACKETED, (whole, letter: string) =>
    live.has(letter.toUpperCase()) ? `Point ${letter.toUpperCase()}` : whole,
  )
}

// ── what a point is ──────────────────────────────────────────────────────────

/** A named line near the point — {@link import('@1stcontact/site-schema').NearLine}, structurally. */
export interface MarkedPointNear {
  label: string
  axis: 'x' | 'y'
  /** `line − point`, so the sign says which side of the point the line is on. */
  delta: number
}

/** Where the point landed inside a drawing, once the chain has been inverted. */
export interface MarkedPointDrawing {
  /** The asset as the page names it, so it can be measured and written back. */
  asset: string
  viewBox: readonly [number, number, number, number]
  x: number
  y: number
}

/** One point, in every frame that turns out to matter. */
export interface MarkedPoint {
  label: string
  /** The segment it landed in, or `null` for a point on nothing editable. */
  target: L1EditTarget | null
  kind: L1SegmentKind | null
  /** DOCUMENT coordinates, so scroll position stops mattering (DOC-52 §4.6). */
  doc: { x: number; y: number }
  /** The preview's own width — L1 geometry is keyframed, so 375 ≠ 1200. */
  viewportWidth: number
  /** Where in the segment's box, and how big that box is. */
  node: { x: number; y: number; width: number; height: number } | null
  drawing: MarkedPointDrawing | null
  near: readonly MarkedPointNear[]
  /** The render it was taken against, so a stale reference is detectable. */
  render: { page: string | null; ordinal: number }
}

// ── the SVG inversion ────────────────────────────────────────────────────────

/**
 * A drawing's own view of itself, read from the asset's source.
 *
 * REACHED WITHOUT INLINING IT. The renderer emits `<img src="…svg">` and one
 * cannot hit-test inside an `<img>` — but one does not have to. Given the box,
 * the viewBox and `preserveAspectRatio`, user space is a scale-and-offset
 * inversion, and the bytes are on the same origin as the page.
 */
export interface DrawingIntrinsics {
  viewBox: readonly [number, number, number, number]
  /** The `width`/`height` attributes in px, when the drawing declares them. */
  intrinsic: { width: number; height: number } | null
  preserveAspectRatio: string
}

/** The replaced element's content box and the CSS that fills it. */
export interface ReplacedBox {
  width: number
  height: number
  objectFit: string
  /** `50% 50%` — percentages only; a length is treated as its own share of nothing. */
  objectPosition: string
}

/** `viewBox="0 0 320 86"` → the four numbers, or `null` if it is not four numbers. */
export function parseViewBox(source: string | null): [number, number, number, number] | null {
  if (!source) return null
  const parts = source.trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || !parts.every((n) => Number.isFinite(n))) return null
  return [parts[0], parts[1], parts[2], parts[3]]
}

/** Read what {@link DrawingIntrinsics} needs out of an SVG's source text. */
export function readDrawingIntrinsics(svg: string): DrawingIntrinsics | null {
  const open = /<svg\b[^>]*>/i.exec(svg)
  if (!open) return null
  const attr = (name: string): string | null => {
    const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(open[0])
    return m ? (m[2] ?? m[3] ?? '') : null
  }
  const viewBox = parseViewBox(attr('viewBox'))
  if (!viewBox) return null
  const w = Number.parseFloat(attr('width') ?? '')
  const h = Number.parseFloat(attr('height') ?? '')
  return {
    viewBox,
    intrinsic: Number.isFinite(w) && Number.isFinite(h) ? { width: w, height: h } : null,
    // The spec's default, said rather than left implicit — an omitted attribute
    // is `xMidYMid meet`, and treating it as `none` letterboxes nothing and
    // silently mislocates every point in a non-matching box.
    preserveAspectRatio: (attr('preserveAspectRatio') ?? 'xMidYMid meet').trim() || 'xMidYMid meet',
  }
}

/** `50% 50%` → `[0.5, 0.5]`. A keyword or a length falls back to centred. */
function positionShares(value: string): [number, number] {
  const parts = value.trim().split(/\s+/)
  const share = (token: string | undefined, keywords: Record<string, number>): number => {
    if (token === undefined) return 0.5
    if (token in keywords) return keywords[token]
    const pct = /^(-?[0-9]*\.?[0-9]+)%$/.exec(token)
    return pct ? Number(pct[1]) / 100 : 0.5
  }
  return [
    share(parts[0], { left: 0, center: 0.5, right: 1 }),
    share(parts[1] ?? parts[0], { top: 0, center: 0.5, bottom: 1 }),
  ]
}

interface Placed {
  x: number
  y: number
  width: number
  height: number
}

/** Fit `[w, h]` into `[cw, ch]` by the ratio, taking the min or the max scale. */
function fitted(w: number, h: number, cw: number, ch: number, pick: 'min' | 'max'): [number, number] {
  if (w <= 0 || h <= 0) return [cw, ch]
  const sx = cw / w
  const sy = ch / h
  const s = pick === 'min' ? Math.min(sx, sy) : Math.max(sx, sy)
  return [w * s, h * s]
}

/**
 * The concrete object box — where the drawing is actually painted inside the
 * element's content box, per `object-fit` and `object-position`.
 *
 * A viewBox-only drawing has a ratio and no intrinsic size, which is the
 * ordinary case here; CSS then resolves the default object size to the content
 * box, so `fill` fills and `contain` letterboxes against the ratio.
 */
export function concreteObjectBox(box: ReplacedBox, drawing: DrawingIntrinsics): Placed {
  const [, , vw, vh] = drawing.viewBox
  const natural = drawing.intrinsic ?? { width: vw, height: vh }
  let width = box.width
  let height = box.height
  switch (box.objectFit) {
    case 'contain':
      ;[width, height] = fitted(natural.width, natural.height, box.width, box.height, 'min')
      break
    case 'cover':
      ;[width, height] = fitted(natural.width, natural.height, box.width, box.height, 'max')
      break
    case 'none':
      width = natural.width
      height = natural.height
      break
    case 'scale-down': {
      const [cw, ch] = fitted(natural.width, natural.height, box.width, box.height, 'min')
      width = Math.min(cw, natural.width)
      height = Math.min(ch, natural.height)
      break
    }
    default: // `fill`, the initial value
      break
  }
  const [px, py] = positionShares(box.objectPosition)
  return { x: (box.width - width) * px, y: (box.height - height) * py, width, height }
}

/**
 * Invert the chain: a point in the element's content box → the drawing's own
 * user space.
 *
 * TWO STAGES, because there are two. `object-fit` decides the box the drawing
 * is painted into; the drawing's own `preserveAspectRatio` then decides how its
 * viewBox maps into *that*. They agree — and the second stage is a no-op —
 * whenever the two ratios match, which is the common case and exactly why
 * collapsing them looks harmless right up until an `object-fit: fill` on a
 * mismatched box puts every point in the wrong place.
 */
export function toUserSpace(
  point: { x: number; y: number },
  box: ReplacedBox,
  drawing: DrawingIntrinsics,
): { x: number; y: number } | null {
  const [minX, minY, vw, vh] = drawing.viewBox
  if (vw <= 0 || vh <= 0) return null
  const painted = concreteObjectBox(box, drawing)
  if (painted.width <= 0 || painted.height <= 0) return null

  const [align, meetOrSlice = 'meet'] = drawing.preserveAspectRatio.split(/\s+/)
  let sx = painted.width / vw
  let sy = painted.height / vh
  let ox = painted.x
  let oy = painted.y
  if (align !== 'none') {
    const s = meetOrSlice === 'slice' ? Math.max(sx, sy) : Math.min(sx, sy)
    const shareOf = (token: string): number =>
      token === 'Min' ? 0 : token === 'Max' ? 1 : 0.5
    ox += (painted.width - vw * s) * shareOf(align.slice(1, 4))
    oy += (painted.height - vh * s) * shareOf(align.slice(5, 8))
    sx = s
    sy = s
  }
  return { x: (point.x - ox) / sx + minX, y: (point.y - oy) / sy + minY }
}

// ── the expansion ────────────────────────────────────────────────────────────

/** At most one decimal, and never a trailing `.0`. */
function n(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/** `2.1u above` / `17u right` — the sign read as a direction. */
function nearPhrase(line: MarkedPointNear): string {
  const away = Math.abs(line.delta)
  const side =
    line.axis === 'y' ? (line.delta < 0 ? 'above' : 'below') : line.delta < 0 ? 'left' : 'right'
  return `${line.label} (${n(away)}u ${side})`
}

/** `image node 0.1`, or `module hero / slot body node 0.2`, or `no segment`. */
export function describeTarget(point: MarkedPoint): string {
  if (!point.target) return 'not inside any editable segment'
  const path = formatL1Path(point.target.path)
  const where = `${point.kind ?? 'segment'} node ${path}`
  if (!point.target.moduleId) return `inside ${where}`
  const slot = point.target.slot ? ` slot ${point.target.slot}` : ''
  return `inside module ${point.target.moduleId}${slot} ${where}`
}

/**
 * One point, as the assistant will read it.
 *
 * EVERY FRAME AT ONCE, because which one is wanted is not knowable from here.
 * The user-space line is directly the number to write into a `y=`; the
 * node-relative line is what a container instruction needs; the viewport line
 * plus its width is what makes an L1 keyframe answerable at all.
 */
export function formatMarkedPoint(point: MarkedPoint): string {
  const asset = point.drawing ? ` (asset ${point.drawing.asset})` : ''
  const lines = [`Point ${point.label} — ${describeTarget(point)}${asset}`]
  const row = (name: string, value: string): void => {
    lines.push(`  ${(name + ':').padEnd(15)} ${value}`)
  }

  if (point.drawing) {
    const [a, b, c, d] = point.drawing.viewBox
    row(
      'svg user space',
      `(${n(point.drawing.x)}, ${n(point.drawing.y)})    [viewBox ${a} ${b} ${c} ${d}]`,
    )
  }
  if (point.node) {
    row(
      'node-relative',
      `(${n(point.node.x)}, ${n(point.node.y)}) of ${n(point.node.width)}×${n(point.node.height)}`,
    )
  }
  row('viewport', `(${n(point.doc.x)}, ${n(point.doc.y)}) at width ${n(point.viewportWidth)}`)
  if (point.near.length) row('near', point.near.map(nearPhrase).join(', '))
  row(
    'render',
    `${point.render.page ? `page ${point.render.page}, ` : ''}render ${point.render.ordinal}`,
  )
  return lines.join('\n')
}

/** Heading the block sits under, so the prose above it stays a sentence. */
const BLOCK_HEADING = 'Marked points (this turn):'

/**
 * The width-ambiguity rule (DOC-52 §4.9), carried where the assistant will read
 * it.
 *
 * A point INSIDE A DRAWING is width-independent: one coordinate space, no
 * breakpoints, one meaning. A point on an L1 node is not — marked at desktop,
 * *"move it here"* might mean at this width or at every width, which are
 * different edits to different keyframes. The viewport width in the pill is what
 * tells the assistant to ask, and this is what tells it that that is the rule.
 */
const WIDTH_NOTE =
  'At least one point is on an L1 node rather than inside a drawing, and L1 geometry is ' +
  'keyframed across widths — so ask which width the instruction is for unless it has been said.'

/**
 * Expand a draft: normalise its pills, then append what they refer to.
 *
 * ONLY REFERENCED POINTS ARE CARRIED. A point whose pill was deleted and never
 * restored is one the reader chose not to mention, and sending it anyway would
 * make the `+` control pointless and the message wrong.
 */
export function expandMarkedPoints(
  markdown: string,
  points: readonly MarkedPoint[],
): { markdown: string; used: MarkedPoint[] } {
  const byLabel = new Map(points.map((p) => [p.label, p]));
  const used = referencedPointLabels(markdown, byLabel.keys())
    .map((label) => byLabel.get(label))
    .filter((p): p is MarkedPoint => p !== undefined)
  if (!used.length) return { markdown, used: [] }
  const blocks = used.map(formatMarkedPoint)
  if (used.some((p) => !p.drawing)) blocks.push(WIDTH_NOTE)
  const prose = flattenPointTokens(markdown, byLabel.keys()).trimEnd()
  return { markdown: `${prose}\n\n${BLOCK_HEADING}\n\n${blocks.join('\n\n')}\n`, used }
}
