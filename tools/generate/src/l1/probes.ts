/**
 * REQ-86 — end-to-end reproduction gate (the 3-probe acceptance).
 *
 * This module ties the L1 pipeline together at its acceptance boundary. The fold
 * (REQ-83) turns a multi-viewport capture into an absolute-base L1 document + a
 * retained oracle; the renderer (REQ-82) is the one emitter; this module is the
 * **gate** that decides whether a reproduced document is good enough, and the
 * **demand-driven structure recovery** that promotes only the pinned regions that
 * fail.
 *
 * The probes:
 *   (a) sample-fidelity     — reproduced geometry matches the oracle at the 6
 *                             captured widths within tolerance.
 *   (b) off-sample          — renders sane (no overlap / clip) at intermediate
 *                             widths (500 / 900px) the fold never sampled.
 *   (c) content-robustness  — perturbed content (longer text / taller image)
 *                             keeps the envelope: no overlap / clip.
 *   (d) on-sample           — BUG-112 — renders sane at the CAPTURED widths,
 *                             unperturbed, on the document actually served. The
 *                             three above were the whole gate for long enough
 *                             that the name `threeProbeGate` outlived its truth;
 *                             what it missed was the plainest case of all, a
 *                             page that collides as it stands at the width the
 *                             reference was measured at.
 *
 * The evaluator is **analytic and browser-free**: it mirrors exactly what the
 * renderer emits — the absolute `interpolate|snap` geometry math and CSS flow
 * stacking — and estimates a text run's natural height so content perturbation is
 * expressible. Being analytic (not gated on a live Chromium) makes every probe a
 * deterministic, always-run piece of evidence rather than a cross-engine skip.
 * The round-trip spine in `roundtrip.ts` remains the browser-backed
 * `capture(render(L1)) ≈ L1` check; this is the geometry-envelope gate that sits
 * on top of it.
 *
 * Each residual a probe reports is a **framework gap** — a missing L1 axis, a
 * missing structural hint, or a region that needs promoting to flow — not a
 * per-site patch.
 */
import {
  l1PlainText,
  resolveLayoutMode,
  validateL1,
  type L1Document,
  type L1Geometry,
  type L1Node,
  type L1ScalarTrack,
  type L1Text,
} from '@1stcontact/site-schema'
import { classifyElement, isSynthesizedSurfaceId, type FoldableElement } from './fold'
// REQ-211 — the same rejoin decision the fold makes, asked here so the oracle
// and the reproduction count the same things. See `inline-runs.ts`.
import { flowLead, flowText, rejoinableFlows, type InlineFlow } from './inline-runs'

// ── geometry & box helpers ────────────────────────────────────────────────────

/** A rendered box in document coordinates. */
export interface EvalBox {
  x: number
  y: number
  width: number
  height: number
}

/** One evaluated leaf (text / image / box / slot) at a given width. */
export interface EvalLeaf {
  /** Index path from the root (`0.2.1`), stable across a single evaluation. */
  path: string
  kind: L1Node['kind']
  text?: string
  /** REQ-92 — the leaf's stable `id` (image/box leaves carry one), for non-text pairing. */
  id?: string
  box: EvalBox
  /** True when the leaf is placed by absolute geometry (out of flow). */
  pinned: boolean
  /**
   * BUG-112 — the node declared `stacked: true`: an overlap it takes part in is
   * the design, not a collision. Carried onto the leaf so the overlap scan can
   * read it without walking back up to the node.
   */
  stacked?: true
}

/** A geometry-envelope violation found during evaluation. */
export interface LayoutFinding {
  kind: 'overlap' | 'clip'
  detail: string
  /** Paths of the leaves involved. */
  paths: string[]
}

/** The result of analytically laying an L1 document out at one width. */
export interface LayoutResult {
  width: number
  leaves: EvalLeaf[]
  findings: LayoutFinding[]
}

export interface EvaluateOptions {
  /**
   * Content-perturbation factor (default 1). Scales a text run's effective
   * length and a box/image leaf's pinned height, so the content-robustness probe
   * can grow content and watch the envelope.
   */
  contentScale?: number
  /** Overlap / overflow tolerance in px (default 2). */
  epsilonPx?: number
  /**
   * BUG-113 — the oracle's own text heights, from {@link measuredTextHeights}.
   *
   * A text leaf pins no height (the renderer lets the glyph box size itself), so
   * without this the envelope is drawn around an ESTIMATE — and the estimate is
   * what manufactured the findings. On `gigabytealchemy.ai` the oracle's element
   * boxes have zero overlapping pairs at every captured width and the reproduced
   * boxes match them to 0.89px, yet this evaluator reported five overlaps per
   * width, because a 0.5em average glyph advance over-counted 14 of 53 runs by
   * exactly one line. Every one of those five was the model arguing with itself.
   *
   * Supplied, a run's height at a captured width is the height the browser
   * actually gave it, and between captured widths it is interpolated exactly as
   * the renderer interpolates geometry. The estimate survives where no
   * measurement does — an authored document, a leaf the oracle never saw — which
   * is the only place a model belongs.
   */
  measured?: MeasuredTextHeights
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Evaluate a geometry track at `width`, mirroring the renderer's CSS exactly. */
function evalGeometry(geo: L1Geometry, width: number): EvalBox {
  const f = geo.keyframes
  // Below/at the first breakpoint: hold the base keyframe (renderer's base rule).
  if (width <= f[0].at) return { x: f[0].x, y: f[0].y, width: f[0].width, height: f[0].height ?? 0 }
  for (let i = 0; i < f.length - 1; i++) {
    const a = f[i]
    const b = f[i + 1]
    // Half-open `[a.at, b.at)` — REQ-92. The renderer stacks `min-width` rules so
    // the HIGHEST breakpoint ≤ width wins; at an exact interior breakpoint width
    // (e.g. 768) the segment STARTING there is active, not the one ending there.
    // A closed upper bound instead matched the ending segment first, so a `snap`
    // ending at 768 returned the held lower (375) keyframe — the stale, wider
    // pre-reflow box — and every element below inherited the cascade (the 1616px
    // 768 FAIL). Exact-width resolution here mirrors the renderer's winning rule.
    if (width >= a.at && width < b.at) {
      const seg = geo.segments?.[i] ?? 'interpolate'
      if (seg === 'snap') return { x: a.x, y: a.y, width: a.width, height: a.height ?? 0 }
      const t = b.at === a.at ? 0 : (width - a.at) / (b.at - a.at)
      const height =
        a.height !== undefined && b.height !== undefined ? lerp(a.height, b.height, t) : undefined
      return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        width: lerp(a.width, b.width, t),
        height: height ?? 0,
      }
    }
  }
  // Above the last breakpoint: hold the final keyframe (renderer's final rule).
  const last = f[f.length - 1]
  return { x: last.x, y: last.y, width: last.width, height: last.height ?? 0 }
}

/**
 * BUG-18 — evaluate a responsive scalar-axis track at `width`, mirroring the
 * renderer's cascade exactly (the same half-open `[a.at, b.at)` resolution as
 * {@link evalGeometry}): below the first breakpoint hold the base value; within a
 * segment `interpolate` linearly or hold the lower value on `snap`; above the last
 * breakpoint hold the final value. At a sampled width the result equals that
 * width's keyframe, so the round-trip gate compares the value the browser actually
 * renders there.
 */
export function evalScalarTrack(track: L1ScalarTrack, width: number): number {
  const f = track.keyframes
  if (width <= f[0].at) return f[0].value
  for (let i = 0; i < f.length - 1; i++) {
    const a = f[i]
    const b = f[i + 1]
    if (width >= a.at && width < b.at) {
      const seg = track.segments?.[i] ?? 'interpolate'
      if (seg === 'snap') return a.value
      const t = b.at === a.at ? 0 : (width - a.at) / (b.at - a.at)
      return lerp(a.value, b.value, t)
    }
  }
  return f[f.length - 1].value
}

/**
 * BUG-113 — the oracle's own text heights, keyed the way the fidelity probe
 * pairs: normalised copy plus occurrence index, one measurement per captured
 * width.
 *
 * Built by {@link measuredTextHeights} from the same {@link OracleSource} the
 * fidelity probe reads, so a run the oracle carries is measured here and a run
 * it does not carry is simply absent — there is no third state and no default.
 */
export interface MeasuredTextHeights {
  /** `${normalisedText}#${occurrence}` → heights ascending by captured width. */
  tracks: Map<string, Array<{ at: number; height: number }>>
}

/**
 * Project an oracle into a per-run height track: what the browser gave each text
 * run at each captured width.
 *
 * This is the one number the fold cannot put in the document. Geometry keyframes
 * carry x / y / width for a text leaf and deliberately NOT height — the renderer
 * lets the glyph box size itself, which is what makes the reproduction survive a
 * different font stack — so the analytic evaluator had to estimate it. The
 * measurement exists; it just lived only in the oracle. See
 * {@link EvaluateOptions.measured} for what estimating it instead cost.
 */
export function measuredTextHeights(oracle: OracleSource): MeasuredTextHeights {
  const tracks = new Map<string, Array<{ at: number; height: number }>>()
  const byWidth = new Map<number, OracleBox[]>()
  for (const row of oracleBoxes(oracle)) {
    if (row.kind !== 'text') continue
    const bucket = byWidth.get(row.width)
    if (bucket) bucket.push(row)
    else byWidth.set(row.width, [row])
  }
  // Ascending width, so each key's track is already a keyframe ladder.
  for (const width of [...byWidth.keys()].sort((a, b) => a - b)) {
    const cursor = new Map<string, number>()
    for (const row of byWidth.get(width) ?? []) {
      const key = normText(row.text)
      const idx = cursor.get(key) ?? 0
      cursor.set(key, idx + 1)
      const id = `${key}#${idx}`
      const track = tracks.get(id)
      if (track) track.push({ at: width, height: row.box.height })
      else tracks.set(id, [{ at: width, height: row.box.height }])
    }
  }
  return { tracks }
}

/**
 * Resolve a measured track at `width`, with the renderer's own cascade: hold the
 * first measurement below the ladder, interpolate within a segment, hold the
 * last above it. The same rule {@link evalGeometry} applies to position, applied
 * to the height that travels with it — at a captured width it returns that
 * width's measurement exactly, so a resting evaluation is the oracle.
 */
function measuredAt(track: Array<{ at: number; height: number }>, width: number): number | undefined {
  if (!track.length) return undefined
  if (width <= track[0].at) return track[0].height
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i]
    const b = track[i + 1]
    if (width >= a.at && width < b.at) {
      const t = b.at === a.at ? 0 : (width - a.at) / (b.at - a.at)
      return lerp(a.height, b.height, t)
    }
  }
  return track[track.length - 1].height
}

/** Consume this text leaf's occurrence of its key, returning the measurement if any. */
function takeMeasured(ctx: Ctx, node: L1Text, width: number): number | undefined {
  const key = normText(l1PlainText(node.text))
  const idx = ctx.textCursor.get(key) ?? 0
  ctx.textCursor.set(key, idx + 1)
  if (!ctx.measured) return undefined
  const track = ctx.measured.tracks.get(`${key}#${idx}`)
  return track ? measuredAt(track, width) : undefined
}

/**
 * Estimate a text run's natural (flow) height. Coarse but monotonic — longer
 * text or a narrower column yields more lines and a taller box. The probe only
 * needs the *behaviour* (does growing content break the envelope?), so absolute
 * fidelity to a browser's shaper is not required.
 */
function estimateTextHeight(
  content: L1Text['text'],
  fontSizePx: number,
  lineHeightPx: number | undefined,
  availWidth: number,
  scale: number,
): number {
  const fs = fontSizePx > 0 ? fontSizePx : 16
  const lh = lineHeightPx && lineHeightPx > 0 ? lineHeightPx : Math.round(fs * 1.4)
  const avgChar = fs * 0.5
  const perLine = Math.max(1, Math.floor(Math.max(1, availWidth) / avgChar))
  const chars = Math.max(1, Math.ceil(runCharCost(content) * scale))
  const lines = Math.max(1, Math.ceil(chars / perLine))
  return lines * lh
}

/**
 * REQ-211 — how much line a node's copy consumes, in characters of the node's
 * OWN size.
 *
 * The model measures a line as a character count against one average glyph
 * width, so a run set at 0.6 of the node's size does not consume 0.6 of a line
 * per character — it consumes 0.6 of a character. Weighting each run's length by
 * its scale is the smallest change that keeps the model's one assumption
 * (advance is proportional to size) true of a node whose runs are not all the
 * same size.
 *
 * A node whose runs declare no scale therefore costs exactly `text.length`,
 * which is what the plain string of the same copy costs — so the estimate over a
 * multi-run node is IDENTICAL to the estimate over the same words written as one
 * run, and emphasising a word cannot move a page's predicted height.
 *
 * Line-height is deliberately not scaled with the runs. A taller run does raise
 * the line box it sits in, but the node still declares one `lineHeightPx` and
 * the browser resolves the rest; guessing at it here would trade a known
 * approximation for an unknown one.
 */
function runCharCost(content: L1Text['text']): number {
  if (typeof content === 'string') return content.length
  return content.reduce((n, run) => n + run.text.length * (run.axes?.sizeScale ?? 1), 0)
}

/** A node's geometry track, whichever placement frame it declares. */
function geometryOf(node: L1Node): L1Geometry | undefined {
  return 'geometry' in node ? node.geometry : undefined
}

/**
 * Whether a node is out of flow (positioned by its own absolute geometry).
 *
 * REQ-278 — a track that declares `place: 'flow'` is NOT out of flow: it reads
 * the same keyframes as leading offsets from the flow cursor, so the node stacks
 * with its siblings and is pushed down when one of them grows. That is the whole
 * distinction the axis exists to draw, and it is drawn here once.
 */
function isPinned(node: L1Node): boolean {
  const geo = geometryOf(node)
  return geo !== undefined && geo.place !== 'flow'
}

/**
 * REQ-278 — an in-flow node's leading offset at `width`: the `margin-left` /
 * `margin-top` its keyframes resolve to, or `undefined` for every other node.
 */
function leadingOffset(node: L1Node, width: number): { x: number; y: number } | undefined {
  const geo = geometryOf(node)
  if (!geo || geo.place !== 'flow') return undefined
  const box = evalGeometry(geo, width)
  return { x: box.x, y: box.y }
}

/** REQ-278 — an in-flow node's own declared width at `width` (its keyframe extent). */
function flowWidth(node: L1Node, width: number): number | undefined {
  const geo = geometryOf(node)
  if (!geo || geo.place !== 'flow') return undefined
  return evalGeometry(geo, width).width
}

/**
 * The height a node declares for itself at `width`, from whichever placement
 * frame it uses — `undefined` when its keyframes pin none, which is the signal
 * that the height belongs to the content (every text run, and every node the
 * recovery put in flow precisely so its content could size it).
 */
function declaredHeight(node: L1Node, width: number): number | undefined {
  const geo = geometryOf(node)
  if (!geo || geo.keyframes[0].height === undefined) return undefined
  return evalGeometry(geo, width).height
}

/** Whether a node is hidden at `width` by its visibility rule. */
function hidden(node: L1Node, width: number): boolean {
  const v = 'visibility' in node ? node.visibility : undefined
  if (!v) return false
  if (v.fromPx !== undefined && width < v.fromPx) return true
  if (v.untilPx !== undefined && width >= v.untilPx) return true
  return false
}

/** A node's fixed main-axis width if it declares one (clamped to its min/max). */
function fixedWidth(node: L1Node): number | undefined {
  const w = 'sizing' in node ? node.sizing?.width : undefined
  if (!w || w.mode !== 'fixed' || w.px === undefined) return undefined
  let px = w.px
  if (w.minPx !== undefined) px = Math.max(px, w.minPx)
  if (w.maxPx !== undefined) px = Math.min(px, w.maxPx)
  return px
}

/**
 * REQ-97 — the width a node actually paints at: the extent its parent offered,
 * narrowed by the node's own `sizing.width`. Mirrors the CSS the renderer emits
 * (`width` / `min-width` / `max-width`), where a max-width caps a fluid or
 * geometry-pinned width alike.
 *
 * This matters for `text` above all other kinds, because a text leaf's *height*
 * is a function of its width: a run that declares a measure wraps to more lines
 * than the frame alone would predict, and an analytic model that ignored the
 * measure would report a phantom drift against the browser.
 */
function constrainWidth(node: L1Node, avail: number): number {
  const w = 'sizing' in node ? node.sizing?.width : undefined
  if (!w) return avail
  let px = w.mode === 'fixed' && w.px !== undefined ? w.px : avail
  if (w.minPx !== undefined) px = Math.max(px, w.minPx)
  if (w.maxPx !== undefined) px = Math.min(px, w.maxPx)
  return px
}

/**
 * Main-axis widths for a flex row's flow children, mirroring the renderer's
 * `display:flex; flex-direction:row`. A child that declares a fixed width takes
 * it; the remaining children share the leftover main-axis extent equally — the
 * analytic stand-in for flex-grow / natural width, chosen so a well-formed row
 * tiles its parent without overlap or overflow. If fixed widths already exceed
 * the available extent the flexible children collapse to 0 (and the fixed ones
 * surface as a genuine clip, not a false one).
 */
function rowChildWidths(children: L1Node[], avail: number, gap: number, vw: number): number[] {
  const n = children.length
  if (n === 0) return []
  // REQ-278 — an in-flow child's keyframe width is a declared width exactly as
  // `sizing.width: fixed` is, so a recovered row of them tiles by its captured
  // geometry rather than by an equal share of whatever is left.
  const fixed = children.map((c) => fixedWidth(c) ?? flowWidth(c, vw))
  const fixedSum = fixed.reduce((s: number, w) => s + (w ?? 0), 0)
  const leadSum = children.reduce((t: number, c) => t + (leadingOffset(c, vw)?.x ?? 0), 0)
  const flexCount = fixed.filter((w) => w === undefined).length
  const remaining = Math.max(0, avail - gap * (n - 1) - leadSum - fixedSum)
  const share = flexCount > 0 ? remaining / flexCount : 0
  return fixed.map((w) => (w === undefined ? share : w))
}

/**
 * REQ-104 — greedily pack a wrapping row's children into lines: a child that no
 * longer fits on the current line starts the next one. Returns the child indices
 * per line, so a row that fits comes back as a single line and the caller's model
 * is identical to the non-wrapping one.
 */
function packRowLines(widths: number[], avail: number, gap: number, eps: number): number[][] {
  const lines: number[][] = []
  let line: number[] = []
  let used = 0
  widths.forEach((w, i) => {
    const cost = line.length ? gap + w : w
    if (line.length > 0 && used + cost > avail + eps) {
      lines.push(line)
      line = [i]
      used = w
    } else {
      line.push(i)
      used += cost
    }
  })
  if (line.length) lines.push(line)
  return lines
}

// ── analytic layout ───────────────────────────────────────────────────────────

interface Ctx {
  width: number
  opts: Required<Omit<EvaluateOptions, 'measured'>>
  leaves: EvalLeaf[]
  /**
   * REQ-278 — the corner an absolutely-placed node is absolute TO: the nearest
   * in-flow ancestor's own box, or the page (0,0) when there is none. The fold's
   * flat document has none, so this is 0,0 for every node of an un-recovered
   * page and the model is unchanged for it.
   */
  origin: { x: number; y: number }
  /** Clip findings accumulated during the walk (pinned-box content overflow). */
  clips: LayoutFinding[]
  /** BUG-113 — the oracle's text heights, if the caller has them. */
  measured?: MeasuredTextHeights
  /**
   * Per-key occurrence cursor for {@link measured}. The k-th text leaf of a key
   * in document order takes the k-th measurement of that key — the SAME pairing
   * {@link sampleFidelityProbe} uses, for the same reason: repeated copy (a CTA
   * label, a repeated caption) collides in a plain text→height map and only the
   * last box survives. Advanced for every text leaf, measured or not, so one
   * unmeasured run cannot shift every later occurrence onto the wrong row.
   */
  textCursor: Map<string, number>
  /**
   * BUG-112 / REQ-288 — an ancestor declared `stacked: true`, so every leaf this
   * subtree pushes is part of that declared composition.
   *
   * The declaration is made by whichever node IS the composition, and with a
   * static translate (REQ-288) that node is routinely a container — a caption
   * plaque, a badge — whose leaves are its children. Without the inheritance the
   * plaque's own declaration would exempt nothing at all, because a container
   * pushes no leaf of its own, and the operator would have to repeat `stacked` on
   * every run inside it to say the one thing they already said.
   */
  stacked?: true
}

/**
 * REQ-288 — move a subtree's already-resolved leaf boxes by the node's static
 * translate, WITHOUT touching the height it advanced its parent's flow by.
 *
 * That split is the axis: a translate is a paint offset, so the boxes the reader
 * sees move and the flow the boxes came out of does not. Modelling it any other
 * way would make the evaluator disagree with the browser about the one thing the
 * axis exists to do — and this model is what the geometry envelope's overlap and
 * clip findings are computed from, so the disagreement would surface as findings
 * for overlaps that are not there and silence about the ones that are.
 *
 * The percentage resolves against the node's OWN box, exactly as CSS resolves it,
 * which is why this runs after the subtree is laid out rather than before: for a
 * container, "half my own height" is not knowable until its children have been
 * placed.
 */
function translateSubtree(node: L1Node, box: EvalBox, ctx: Ctx, fromLeaf: number): void {
  const t = node.transform
  if (!t) return
  const dx = ((t.translateXPct ?? 0) / 100) * box.width + (t.translateXPx ?? 0)
  const dy = ((t.translateYPct ?? 0) / 100) * box.height + (t.translateYPx ?? 0)
  if (dx === 0 && dy === 0) return
  // Every leaf the subtree pushed, the node's own included — a translated
  // container carries its children with it, as the browser's compositor does.
  for (let i = fromLeaf; i < ctx.leaves.length; i++) {
    ctx.leaves[i].box.x += dx
    ctx.leaves[i].box.y += dy
  }
}

/**
 * Lay `node` out inside `frame` (the box the parent assigned it) and return its
 * resolved height. Pinned children float by their own geometry (out of flow);
 * in-flow children stack. Leaf boxes (text / image / slot) are pushed to
 * `ctx.leaves`; boxes / containers are structural.
 *
 * REQ-288 — the node's own static translate is applied to the leaves this call
 * pushed, after they are placed; the height returned to the caller's flow is the
 * untranslated one (see {@link translateSubtree}).
 */
function layout(node: L1Node, frame: EvalBox, path: string, ctx: Ctx): number {
  const fromLeaf = ctx.leaves.length
  const { advance, box } = layoutInFlow(node, frame, path, ctx)
  translateSubtree(node, box, ctx, fromLeaf)
  return advance
}

/** {@link layout}'s body: the flow placement, before any paint-time translate. */
function layoutInFlow(
  node: L1Node,
  frame: EvalBox,
  path: string,
  ctx: Ctx,
): { advance: number; box: EvalBox } {
  const { width, opts } = ctx
  if (hidden(node, width)) return { advance: 0, box: { ...frame, height: 0 } }

  // A pinned node resolves its own box from geometry, ignoring the parent frame.
  // REQ-278 — an in-flow track resolves against the frame instead: its `x`/`y`
  // are the leading offsets the renderer emits as margins, so the node sits where
  // the flow put it plus its own lead, at its own declared width.
  //
  // `ctx.origin` is what an absolute box is absolute TO. The fold writes page
  // coordinates and the document it writes is flat, so the origin is 0,0 and a
  // pinned box reads exactly as folded. Recovery nests, and a node it put in flow
  // renders `position: relative` — which is a containing block, so every absolute
  // descendant of it is placed from ITS corner, not the page's. That is the CSS
  // the renderer already emits; the model has to read the same frame or it
  // reports collisions a browser would never paint (a contact form mounted into a
  // seam 182px into its section appearing 182px down the PAGE, over the header).
  const pinned = isPinned(node)
  const lead = leadingOffset(node, width)
  const box: EvalBox = pinned
    ? (() => {
        const g = evalGeometry(node.geometry!, width)
        return { ...g, x: g.x + ctx.origin.x, y: g.y + ctx.origin.y }
      })()
    : lead
      ? { x: frame.x + lead.x, y: frame.y + lead.y, width: flowWidth(node, width)!, height: 0 }
      : { ...frame }
  // A node the recovery put in flow becomes the origin for its own subtree; every
  // other node passes its parent's along unchanged.
  const placed: Ctx = lead ? { ...ctx, origin: { x: box.x, y: box.y } } : ctx
  // BUG-112 / REQ-288 — the declaration covers the subtree it was made about.
  const inner: Ctx = node.stacked ? { ...placed, stacked: true } : placed
  /**
   * REQ-278 — what this node consumes of its parent's flow: its own height plus
   * the leading offset it was placed by. A stack's cursor and a row's line height
   * both advance by this, so a node with a 40px `margin-top` pushes what follows
   * it down by 40px more than its own box — which is what the browser does and
   * what makes a leading offset able to reproduce a captured gap exactly.
   */
  const adv = (h: number): number => (lead ? lead.y + h : h)
  // REQ-97 — the node's own `sizing.width` narrows whatever extent it was given,
  // for every kind alike (the renderer emits the same width/min/max CSS for all
  // of them). It reads loudest on `text`, whose *height* is a function of its
  // width: a run declaring a measure wraps to more lines than the frame alone
  // predicts, and a model that ignored it would report a phantom drift.
  box.width = constrainWidth(node, box.width)

  switch (node.kind) {
    case 'text': {
      const a = node.axes ?? {}
      const natural = estimateTextHeight(
        node.text,
        a.fontSizePx ?? 16,
        a.lineHeightPx,
        box.width,
        opts.contentScale,
      )
      // A pinned text keyframe may pin a height; otherwise the height is natural.
      const pinnedH = declaredHeight(node, width)
      // BUG-113 — where the oracle measured this run, the measurement IS the
      // natural height. Under perturbation it is grown by the estimator's own
      // line-count ratio rather than replaced by the estimate: the model is
      // trusted for how much taller longer copy gets, never for how tall the
      // copy already is. Below `contentScale` 1 that ratio is 1, so a resting
      // evaluation is the measurement exactly.
      const measured = takeMeasured(ctx, node, width)
      const grown =
        measured === undefined
          ? undefined
          : measured *
            (opts.contentScale === 1
              ? 1
              : natural /
                Math.max(
                  1,
                  estimateTextHeight(node.text, a.fontSizePx ?? 16, a.lineHeightPx, box.width, 1),
                ))
      box.height =
        pinnedH !== undefined ? pinnedH * opts.contentScale : (grown ?? natural)
      // The WORDS, whatever shape the node holds them in. This is the fidelity
      // measure's join key (see `sampleFidelity`), and the oracle side joins the
      // same run group into the same string — so a node that emphasises a word
      // still pairs with the element it was folded from.
      ctx.leaves.push({ path, kind: 'text', text: l1PlainText(node.text), id: node.id, box, pinned, ...stackedOf(node, ctx) })
      return { advance: adv(box.height), box }
    }
    case 'image': {
      const own = declaredHeight(node, width)
      if (own !== undefined) box.height = own * opts.contentScale
      ctx.leaves.push({ path, kind: 'image', id: node.id, box, pinned, ...stackedOf(node, ctx) })
      return { advance: adv(box.height), box }
    }
    case 'slot': {
      // A slot's extent is the seam the module mounts into — a pinned frame read
      // it off `evalGeometry` for free, an in-flow one has to ask for it.
      const own = declaredHeight(node, width)
      if (own !== undefined) box.height = own
      ctx.leaves.push({ path, kind: 'slot', id: node.id, box, pinned, ...stackedOf(node, ctx) })
      return { advance: adv(box.height), box }
    }
    case 'control': {
      // REQ-96 — a control is a leaf like any other: the module contributes its
      // element, L1 contributes the box, so the geometry model is unchanged. A
      // pinned keyframe height wins; otherwise the parent's frame stands.
      const own = declaredHeight(node, width)
      if (own !== undefined) box.height = own * opts.contentScale
      ctx.leaves.push({ path, kind: 'control', id: node.id, box, pinned, ...stackedOf(node, ctx) })
      return { advance: adv(box.height), box }
    }
    case 'box':
    case 'container': {
      const children = node.kind === 'container' ? node.children : (node.children ?? [])
      // A childless `box` is a leaf surface (a divider / painted panel) — REQ-92:
      // it has its own geometry box, so push it as a leaf the fidelity probe pairs.
      if (node.kind === 'box' && children.length === 0) {
        const own = declaredHeight(node, width)
        if (own !== undefined) box.height = own * opts.contentScale
        ctx.leaves.push({ path, kind: 'box', id: node.id, box, pinned, ...stackedOf(node, ctx) })
        return { advance: adv(box.height), box }
      }
      const gap = node.kind === 'container' ? (node.gapPx ?? 0) : 0
      // A `row` container flows horizontally along the main axis; a `box` and a
      // `stack`/`grid` container flow vertically (full-width, stacked). Grid is
      // modelled as a stack here — envelope-conservative, and the folder does not
      // emit grid yet.
      //
      // REQ-104 — the mode is resolved AT THIS WIDTH, through the same shared
      // cascade the renderer compiles. Reading the static `layout` would model a
      // container that stacks at mobile as a row there, and report the phantom
      // overlap/clip findings of a layout the page never renders.
      const row = node.kind === 'container' && resolveLayoutMode(node, width) === 'row'
      const wrapping = row && node.kind === 'container' && node.wrap === true

      // Out-of-flow (pinned) children float independently; in-flow children flow.
      //
      // REQ-278 — THE WALK IS IN DOCUMENT ORDER, pinned and flowing alike. It
      // used to lay every pinned child out first and the flow afterwards, which
      // is arithmetically identical (an out-of-flow child neither reads nor moves
      // the cursor) but pushes the leaves in the wrong order — and leaf order is
      // not decoration. Both the fidelity pairing and the oracle's measured-height
      // queue take the k-th leaf of a key IN DOCUMENT ORDER, so a document that
      // mixes the two kinds under one parent — which is exactly what a recovery
      // produces, flow where the flow runs forwards and the base's absolute
      // placement everywhere else — had every repeated run re-paired against
      // another occurrence's box. On `gigabytealchemy.ai` that read 742px and 36
      // residuals: six identical check glyphs, each measured against a different
      // one of themselves.
      const flowChildren: L1Node[] = children.filter((c) => !isPinned(c))
      const flowIndex = new Map<L1Node, number>()
      flowChildren.forEach((c, k) => flowIndex.set(c, k))

      let maxChildBottom = box.y
      if (row) {
        // Flex row: children sit side by side, each taking its own main-axis
        // width; the row's height is the tallest child (cross axis). Mirrors the
        // renderer's `display:flex; flex-direction:row`.
        //
        // REQ-104 — with `wrap`, children that no longer fit start a new line
        // instead of squeezing, and the row's height is the sum of its lines. A
        // row whose children DO fit packs into exactly one line, so the model is
        // unchanged wherever wrapping never happens.
        const widths = rowChildWidths(flowChildren, box.width, gap, width)
        const lines = wrapping
          ? packRowLines(widths, box.width, gap, opts.epsilonPx)
          : [flowChildren.map((_, k) => k)]
        // The line each flow child belongs to, so the document-order walk below
        // knows when one line has ended and the next begins.
        const lineOf = new Map<number, number>()
        lines.forEach((line, li) => line.forEach((k) => lineOf.set(k, li)))
        let cursorY = box.y
        let cursorX = box.x
        let lineHeight = 0
        let openLine = -1
        const closeLine = (): void => {
          if (openLine < 0) return
          cursorY += lineHeight + gap
          maxChildBottom = Math.max(maxChildBottom, cursorY - gap)
          cursorX = box.x
          lineHeight = 0
        }
        children.forEach((child, i) => {
          if (isPinned(child)) {
            layout(child, { ...box }, `${path}.${i}`, inner)
            return
          }
          const k = flowIndex.get(child)!
          const li = lineOf.get(k) ?? 0
          if (li !== openLine) {
            closeLine()
            openLine = li
          }
          const childFrame: EvalBox = { x: cursorX, y: cursorY, width: widths[k], height: 0 }
          const h = layout(child, childFrame, `${path}.${i}`, inner)
          lineHeight = Math.max(lineHeight, h)
          // REQ-278 — a row's cursor advances past the child's own leading
          // offset as well as its width, exactly as a flex `margin-left` does.
          cursorX += (leadingOffset(child, width)?.x ?? 0) + widths[k] + gap
        })
        closeLine()
      } else {
        // Stack: each child fills the width and stacks vertically.
        let cursorY = box.y
        children.forEach((child, i) => {
          if (isPinned(child)) {
            layout(child, { ...box }, `${path}.${i}`, inner)
            return
          }
          const childFrame: EvalBox = { x: box.x, y: cursorY, width: box.width, height: 0 }
          const h = layout(child, childFrame, `${path}.${i}`, inner)
          cursorY += h + gap
        })
        // REQ-278 — a column's content height is where its CURSOR ends, not the
        // lowest point any child reached. The two agree for as long as every
        // child advances the cursor forward, which was the whole world before an
        // in-flow leading offset could be negative; they part company the moment
        // one is, and flexbox sums the outer sizes (a negative margin genuinely
        // shortens the column) rather than taking a running maximum. Taking the
        // max here made a recovered region read 476px taller than the browser
        // makes it, and every sibling below it inherited the error.
        if (flowChildren.length) maxChildBottom = cursorY - gap
      }

      // Natural content height of the flow interior.
      const contentHeight = flowChildren.length ? maxChildBottom - box.y : 0
      // A pinned box/container with a fixed keyframe height that the content
      // overflows is a clip.
      const pinnedH = declaredHeight(node, width)
      if (pinnedH !== undefined && contentHeight > pinnedH + opts.epsilonPx) {
        ctx.clips.push({
          kind: 'clip',
          detail: `content height ${Math.round(contentHeight)}px exceeds pinned box height ${pinnedH}px`,
          paths: [path],
        })
      }
      // The node's own resolved height, so a translate expressed as a share of it
      // (REQ-288) has something to resolve against.
      box.height = pinnedH !== undefined ? pinnedH : contentHeight
      return { advance: adv(box.height), box }
    }
  }
}

/**
 * BUG-112 — the declared stacking intent in force for this leaf: its own, or the
 * one an ancestor made on its behalf (REQ-288 — see {@link Ctx.stacked}). A
 * spreadable fragment, so an unmarked leaf carries no key at all rather than an
 * explicit `undefined`, which would survive `JSON.stringify` into every
 * serialized leaf.
 */
function stackedOf(node: L1Node, ctx: Ctx): { stacked?: true } {
  return node.stacked || ctx.stacked ? { stacked: true } : {}
}

/** Do two boxes overlap by more than `eps` on both axes? */
function overlaps(a: EvalBox, b: EvalBox, eps: number): boolean {
  const ix = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const iy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return ix > eps && iy > eps
}

/**
 * Analytically evaluate an L1 document at `width`: resolve every leaf's box and
 * report geometry-envelope violations (sibling overlap, horizontal clip beyond
 * the viewport, and pinned-box content overflow).
 */
export function evaluateLayout(
  doc: L1Document,
  width: number,
  options: EvaluateOptions = {},
): LayoutResult {
  const opts: Required<Omit<EvaluateOptions, 'measured'>> = {
    contentScale: options.contentScale ?? 1,
    epsilonPx: options.epsilonPx ?? 2,
  }
  const ctx: Ctx = {
    width,
    opts,
    leaves: [],
    clips: [],
    origin: { x: 0, y: 0 },
    measured: options.measured,
    textCursor: new Map(),
  }
  const rootFrame: EvalBox = { x: 0, y: 0, width, height: 0 }
  layout(doc.root, rootFrame, '0', ctx)

  const findings: LayoutFinding[] = [...ctx.clips]

  // Horizontal clip: any leaf extending beyond the viewport width.
  for (const leaf of ctx.leaves) {
    if (leaf.box.x + leaf.box.width > width + opts.epsilonPx) {
      findings.push({
        kind: 'clip',
        detail: `leaf right edge ${Math.round(leaf.box.x + leaf.box.width)}px exceeds viewport ${width}px`,
        paths: [leaf.path],
      })
    }
  }

  // Overlap: any two non-empty leaf boxes that intersect. Slots are inert
  // placeholders (Phase-D seams), and a *fold-synthesized* backing surface
  // (`section-band-*` / `section-bg-*` / `card-*`, BUG-14) is the fill painted
  // behind the runs it backs — a background overlapping its own content is by
  // design, not a collision, and a card sits on its band for the same reason. A
  // genuine captured standalone surface (`box-*`) is real painted content and
  // still participates, so two of them colliding is still reported. Either way a
  // box that overflows the viewport is caught by the horizontal-clip check.
  const solid = ctx.leaves.filter(
    (l) =>
      l.kind !== 'slot' &&
      !(l.kind === 'box' && isSynthesizedSurfaceId(l.id)) &&
      l.box.height > 0 &&
      l.box.width > 0,
  )
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      // BUG-112 — the DECLARED exemption, beside the synthesized-surface one
      // above. The two are the same judgement reached two ways: a backing
      // surface is known to be intentional because the fold invented it to sit
      // behind its own runs, and a `stacked` node is known to be intentional
      // because a document says so in as many words. One side of the pair is
      // enough — an overlap has a figure and a ground, and the declaration is
      // made by whichever node is the composition.
      if (solid[i].stacked || solid[j].stacked) continue
      if (overlaps(solid[i].box, solid[j].box, opts.epsilonPx)) {
        findings.push({
          kind: 'overlap',
          detail: `${solid[i].text ?? solid[i].kind} overlaps ${solid[j].text ?? solid[j].kind}`,
          paths: [solid[i].path, solid[j].path],
        })
      }
    }
  }

  return { width, leaves: ctx.leaves, findings }
}

// ── the oracle ────────────────────────────────────────────────────────────────

/** The L1 leaf kind an oracle sample is measured against (text / image / box). */
export type OracleKind = 'text' | 'image' | 'box'

/** One oracle sample: a captured element's box at a captured width, tagged by kind. */
export interface OracleBox {
  text: string
  /** REQ-92 — the leaf kind this element folds to; the pairing key for non-text. */
  kind: OracleKind
  width: number
  box: EvalBox
}

/**
 * Project the retained multi-viewport oracle into a flat `(kind, text, width) →
 * box` table. Accepts the `multistate.json` shape structurally, so the probe does
 * not depend on the capture package's concrete types. Each element is classified
 * through the fold's own {@link classifyElement}, so an oracle `image`/`box` sample
 * exists exactly where the fold emitted an image/box leaf — controls and empty
 * runs (never leaves) are excluded from the fidelity measure.
 */
export interface OracleSource {
  projections: Array<{
    viewport: { width: number }
    state?: string
    manifest: { elements: Array<FoldableElement & { box?: EvalBox }> }
  }>
}

function normText(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function oracleBoxes(oracle: OracleSource): OracleBox[] {
  const out: OracleBox[] = []
  // REQ-88 — the width ladder only. A height probe re-shoots a ladder width at a
  // second viewport height; admitting it hands the fidelity measure a second full
  // set of oracle rows at that width whose reproduced-leaf queues are already
  // drained, reporting every text run on the page as `unmatched`.
  //
  // Deduped here on `(width, state)` rather than through the capture package's
  // `partitionProbes`, so `OracleSource` stays structural (it deliberately carries
  // no `engine`, and the gate re-folds for one engine anyway). Same rule: the
  // first projection at a key is the ladder, later ones are evidence.
  const seenKey = new Set<string>()
  for (const p of oracle.projections) {
    const key = `${p.viewport.width}:${p.state ?? 'rest'}`
    if (seenKey.has(key)) continue
    seenKey.add(key)
    if (p.state && p.state !== 'rest') continue
    // REQ-211 — the oracle counts what the FOLD counts. A varying inline flow is
    // one node after the fold, so it is one oracle box here: its runs' text
    // rejoined, in the flow root's rect. Leaving the fragments in would report
    // every rejoined sentence as N-1 unmatched runs on the reference side — the
    // measure manufacturing the defects it exists to find. `inline-runs.ts` is
    // the single place that decides which flows those are.
    type OracleElement = (typeof p.manifest.elements)[number]
    const rejoined = new Map<OracleElement, InlineFlow<OracleElement>>()
    for (const flow of rejoinableFlows(p.manifest.elements)) {
      for (const m of flow.members) rejoined.set(m, flow)
    }
    for (const el of p.manifest.elements) {
      if (!el.box) continue
      const kind = classifyElement(el)
      if (kind === 'text') {
        if (!el.text || el.text.trim() === '') continue
        const flow = rejoined.get(el)
        if (flow) {
          if (flowLead(flow) !== el || !flow.box) continue
          out.push({ text: flowText(flow), kind, width: p.viewport.width, box: flow.box })
          continue
        }
        out.push({ text: el.text, kind, width: p.viewport.width, box: el.box })
      } else if (kind === 'image' || kind === 'box') {
        out.push({ text: el.text ?? '', kind, width: p.viewport.width, box: el.box })
      }
      // 'control' / 'unknown' / 'empty' are never leaves — excluded from the measure.
    }
  }
  return out
}

// ── probe (a): sample fidelity ────────────────────────────────────────────────

export interface FidelityDelta {
  text: string
  width: number
  dx: number
  dy: number
  dw: number
}

export interface SampleFidelityReport {
  pass: boolean
  tolerancePx: number
  maxDelta: number
  /** Deltas that exceed tolerance — each a residual (serializer bug / missing axis). */
  residuals: FidelityDelta[]
  /** Oracle samples with no matching reproduced leaf — coverage gaps. */
  unmatched: Array<{ text: string; width: number }>
  /**
   * REQ-88 — oracle text this probe deliberately did not grade, because a
   * behaviour slot covers it: the run is rendered by a mounted behavior module
   * (a form's own submit button), not by L1.
   *
   * Reported rather than silently dropped. Grading L1 on markup it does not emit
   * would fail the gate for a correct reproduction; dropping it *quietly* would
   * turn every mounted region into an ungraded hole nobody could see. The number
   * is the size of what the L1 gate is not the right instrument for.
   */
  mounted: Array<{ text: string; width: number }>
}

export interface SampleFidelityOptions {
  /** Captured widths to check (default the document's ladder). */
  widths?: number[]
  /** Per-axis tolerance in px (default 2). */
  tolerancePx?: number
  /** BUG-113 — the oracle's text heights, so a slot's cover test uses real boxes. */
  measured?: MeasuredTextHeights
}

/**
 * Probe (a) — reproduce the document at each captured width and compare every
 * text leaf's box (x / y / width) to the retained oracle within tolerance. A
 * clean absolute fold reproduces the oracle exactly (the fold copied the boxes),
 * so this both proves fidelity and catches a serializer that mangles geometry.
 *
 * Pairing is by **stable occurrence identity**, not by a `text → box` map. The
 * fold (`foldToL1`) builds one leaf per responsive-table row, and that table
 * assigns each oracle element to a row by its occurrence index within its text
 * key (FIFO document order — see `buildResponsiveTable`). So the k-th reproduced
 * text leaf of a key corresponds to the k-th oracle element of that key at each
 * width. Pairing by that occurrence index (rather than keying a map by text,
 * where duplicate labels/CTAs collide and only the last box survives) is what
 * kills the phantom deltas — repeated text no longer mispairs against the wrong
 * box, and genuine coverage gaps (more oracle occurrences than reproduced
 * leaves) surface as `unmatched` rather than being masked by a stale map hit.
 */
export function sampleFidelityProbe(
  doc: L1Document,
  oracle: OracleSource,
  options: SampleFidelityOptions = {},
): SampleFidelityReport {
  const widths = options.widths ?? doc.widths
  const tol = options.tolerancePx ?? 2
  const table = oracleBoxes(oracle)
  const residuals: FidelityDelta[] = []
  const unmatched: Array<{ text: string; width: number }> = []
  const mounted: Array<{ text: string; width: number }> = []
  let maxDelta = 0

  for (const width of widths) {
    const { leaves } = evaluateLayout(doc, width, { measured: options.measured })
    // REQ-88 — the rects a behavior module mounts into. Oracle text inside one is
    // the behaviour's markup, not L1's, so it is set aside rather than graded.
    const slotBoxes = leaves.filter((l) => l.kind === 'slot').map((l) => l.box)
    const insideSlot = (b: EvalBox): boolean =>
      slotBoxes.some(
        (s) =>
          b.x + b.width / 2 >= s.x &&
          b.x + b.width / 2 <= s.x + s.width &&
          b.y + b.height / 2 >= s.y &&
          b.y + b.height / 2 <= s.y + s.height,
      )
    // FIFO queues of reproduced text-leaf boxes by key, in document order — the
    // same occurrence order the fold's rows were built in.
    const leafQueues = new Map<string, EvalBox[]>()
    for (const l of leaves) {
      if (l.kind !== 'text' || !l.text) continue
      const k = normText(l.text)
      const q = leafQueues.get(k)
      if (q) q.push(l.box)
      else leafQueues.set(k, [l.box])
    }
    // Consume each key's queue occurrence-by-occurrence as the oracle presents
    // its elements (also in document order), so occurrence i pairs with leaf i.
    const cursor = new Map<string, number>()
    for (const o of table.filter((t) => t.width === width && t.kind === 'text')) {
      const k = normText(o.text)
      const idx = cursor.get(k) ?? 0
      cursor.set(k, idx + 1)
      const got = leafQueues.get(k)?.[idx]
      if (!got) {
        if (insideSlot(o.box)) mounted.push({ text: o.text, width })
        else unmatched.push({ text: o.text, width })
        continue
      }
      const dx = Math.abs(got.x - o.box.x)
      const dy = Math.abs(got.y - o.box.y)
      const dw = Math.abs(got.width - o.box.width)
      maxDelta = Math.max(maxDelta, dx, dy, dw)
      if (dx > tol || dy > tol || dw > tol) residuals.push({ text: o.text, width, dx, dy, dw })
    }

    // REQ-92 — non-text (image / box) leaves pair by the SAME document-order
    // occurrence mechanism, keyed by kind since they carry no text. The k-th
    // image/box oracle sample pairs with the k-th reproduced leaf of that kind.
    //
    // BUG-14's synthesized backing surfaces (bands, section images, cards) are
    // excluded: they are fold-invented boxes painted behind *text* runs (whose
    // source elements the oracle classifies as `text`, and which are already
    // measured through their own text leaves), so they have no oracle
    // counterpart. Leaving them in the queue would
    // shift every real `box-*` leaf by the number of surfaces before it and
    // report phantom deltas.
    const nonTextQueues = new Map<string, EvalBox[]>()
    for (const l of leaves) {
      if (l.kind !== 'image' && l.kind !== 'box') continue
      if (isSynthesizedSurfaceId(l.id)) continue
      const q = nonTextQueues.get(l.kind)
      if (q) q.push(l.box)
      else nonTextQueues.set(l.kind, [l.box])
    }
    const nonTextCursor = new Map<string, number>()
    for (const o of table.filter((t) => t.width === width && t.kind !== 'text')) {
      const idx = nonTextCursor.get(o.kind) ?? 0
      nonTextCursor.set(o.kind, idx + 1)
      const label = o.text || `(${o.kind})`
      const got = nonTextQueues.get(o.kind)?.[idx]
      if (!got) {
        unmatched.push({ text: label, width })
        continue
      }
      const dx = Math.abs(got.x - o.box.x)
      const dy = Math.abs(got.y - o.box.y)
      const dw = Math.abs(got.width - o.box.width)
      maxDelta = Math.max(maxDelta, dx, dy, dw)
      if (dx > tol || dy > tol || dw > tol) residuals.push({ text: label, width, dx, dy, dw })
    }
  }

  return {
    pass: residuals.length === 0 && unmatched.length === 0,
    tolerancePx: tol,
    maxDelta,
    residuals,
    unmatched,
    mounted,
  }
}

// ── probe (b): off-sample fidelity ────────────────────────────────────────────

export interface EnvelopeReport {
  pass: boolean
  byWidth: Array<{ width: number; findings: LayoutFinding[] }>
}

/**
 * The one thing every envelope probe does: lay the document out at each width
 * and keep the findings. The probes differ only in WHICH document, WHICH widths
 * and HOW MUCH content perturbation — so that is all each of them says.
 */
function envelopeAt(
  doc: L1Document,
  widths: number[],
  contentScale: number,
  measured?: MeasuredTextHeights,
): EnvelopeReport {
  const byWidth = widths.map((width) => ({
    width,
    findings: evaluateLayout(doc, width, { contentScale, measured }).findings,
  }))
  return { pass: byWidth.every((w) => w.findings.length === 0), byWidth }
}

/**
 * Probe (b) — evaluate the document at intermediate widths the fold never
 * sampled (default 500 / 900px) and assert the envelope holds: no sibling
 * overlap, no horizontal clip. Catches interpolation / snap brackets that
 * degrade between captured widths.
 */
export function offSampleProbe(
  doc: L1Document,
  options: { widths?: number[]; measured?: MeasuredTextHeights } = {},
): EnvelopeReport {
  return envelopeAt(doc, options.widths ?? [500, 900], 1, options.measured)
}

// ── probe (d): on-sample envelope ─────────────────────────────────────────────

/**
 * BUG-112 — probe (d) — the envelope at the **captured** widths, with content
 * exactly as the document holds it.
 *
 * This is the case the other two envelope probes structurally could not cover,
 * and the hole was not small: a reproduction that painted five pairs of text
 * over each other at 1280px — the width the perceptual gate photographs —
 * returned `pass`, because
 *
 *   - probe (b) looks only at 500 / 900px, which no capture samples, and
 *   - probe (c) looks at the captured widths but only under a 2.5x content
 *     perturbation, which is a question about *resilience*, and
 *   - probe (a) evaluates the document at every captured width, unperturbed —
 *     and destructured `{ leaves }`, discarding the findings on the same line.
 *
 * So the collisions were computed, at the right widths, on the right document,
 * three times per run, and thrown away every time.
 *
 * Unperturbed collisions at a sampled width are a different class of defect from
 * the other two probes' findings. Probe (b) and (c) report *fragility* — this
 * would break if the viewport were between samples, or if the copy grew. This
 * reports a page that is broken **as it stands, at a width the reference itself
 * was measured at**, and no averaging of pixels can make that faithful.
 */
export function onSampleProbe(
  doc: L1Document,
  options: { widths?: number[]; measured?: MeasuredTextHeights } = {},
): EnvelopeReport {
  return envelopeAt(doc, options.widths ?? doc.widths, 1, options.measured)
}

// ── probe (c): content robustness ─────────────────────────────────────────────

/**
 * Probe (c) — perturb content (grow every text run's length and every pinned
 * box/image height by `scale`) and assert the envelope still holds at the
 * captured widths. A purely-pinned region fails here (growing text overruns a
 * fixed-y sibling); a flow region survives (siblings reflow). This is the probe
 * whose failures drive `promoteToFlow`.
 */
export function contentRobustnessProbe(
  doc: L1Document,
  options: { scale?: number; widths?: number[]; measured?: MeasuredTextHeights } = {},
): EnvelopeReport {
  return envelopeAt(doc, options.widths ?? doc.widths, options.scale ?? 2.5, options.measured)
}

// ── the acceptance gate ───────────────────────────────────────────────────────

export interface AcceptanceReport {
  pass: boolean
  sampleFidelity: SampleFidelityReport
  offSample: EnvelopeReport
  contentRobustness: EnvelopeReport
  /**
   * BUG-112 — the envelope at the captured widths, unperturbed, on the document
   * the reproduction is actually SERVED from ({@link AcceptanceOptions.served}).
   */
  onSample: EnvelopeReport
}

export interface AcceptanceOptions {
  fidelity?: SampleFidelityOptions
  offSampleWidths?: number[]
  contentScale?: number
  /**
   * BUG-113 — the document the browser actually paints, for the envelope probes.
   * Defaults to `doc`.
   *
   * This option USED to be `recovered`, and took `promoteToFlow(base).doc`: the
   * envelope probes graded a structure-recovered overlay that nothing ever wrote
   * to disk. The split it implemented was real — fidelity belongs to the
   * absolute base — but the second half of it was answering the question with an
   * artifact the operator could not open. The gate reported zero layout findings
   * at every width while the served page carried 78 `position: absolute` rules
   * and five overlaps per width, because the two sentences were about different
   * documents.
   *
   * So what belongs here is the SERVED composition: the page body plus each
   * behaviour module's presentation mounted at its slot ({@link mountBehaviours}),
   * which is what a browser is given. Fidelity stays on `doc`, the base written
   * to `pages/home.json`; inside a slot L1 is not the emitter, which is the fact
   * {@link SampleFidelityReport.mounted} already existed to state.
   */
  served?: L1Document
  /** BUG-113 — the oracle's text heights, threaded into every probe. */
  measured?: MeasuredTextHeights
}

/**
 * Run every acceptance probe against a reproduced document + its oracle.
 *
 * TWO documents, both of which exist on disk:
 *   - fidelity is a property of the absolute base `doc`, which is what
 *     `pages/home.json` carries and what reproduces the oracle;
 *   - every envelope probe — on-sample, off-sample and content-robustness —
 *     measures `options.served`, the composition a browser is handed.
 *
 * BUG-112 opened `served` and put the on-sample envelope on it, leaving the
 * other two on a `recovered` overlay and saying in as many words that BUG-113
 * owned the question of whether that overlay was the right document. It is not,
 * and it was never even a candidate: `promoteToFlow`'s output is written
 * nowhere, so the two probes reading it were answering with an artifact the
 * operator cannot open — which is how a page carrying five overlaps per width
 * reported a clean envelope. Resilience under perturbation is a property of the
 * page we ship, and if the page we ship does not have it, that is the finding.
 *
 * Recovery still runs, as a priced alternative reported beside the verdict
 * (`RecoveryCost` in `gate-core.ts`). It is graded by nothing.
 *
 * The gate passes only when every probe passes; each residual a sub-report
 * carries names a framework gap to feed back.
 */
export function acceptanceGate(
  doc: L1Document,
  oracle: OracleSource,
  options: AcceptanceOptions = {},
): AcceptanceReport {
  const served = options.served ?? doc
  const measured = options.measured
  const sampleFidelity = sampleFidelityProbe(doc, oracle, { measured, ...options.fidelity })
  const offSample = offSampleProbe(served, { widths: options.offSampleWidths, measured })
  const contentRobustness = contentRobustnessProbe(served, { scale: options.contentScale, measured })
  const onSample = onSampleProbe(served, { widths: options.fidelity?.widths, measured })
  return {
    pass: sampleFidelity.pass && offSample.pass && contentRobustness.pass && onSample.pass,
    sampleFidelity,
    offSample,
    contentRobustness,
    onSample,
  }
}

// ── demand-driven structure recovery ──────────────────────────────────────────

/** The direct-child index of `path` under `parentPath`, or null if not a descendant. */
function directChildIndex(parentPath: string, path: string): number | null {
  if (!path.startsWith(parentPath + '.')) return null
  const seg = path.slice(parentPath.length + 1).split('.')[0]
  const idx = Number(seg)
  return Number.isInteger(idx) ? idx : null
}

/**
 * Connected components (size ≥ 2) of a parent's direct children under the
 * "overlap under perturbation" relation. Union-find over `links`; each returned
 * component is the set of children indices that collide (directly or
 * transitively) and therefore must share one flow region — the smallest grouping
 * the probe demands, so distinct regions (hero / grid / footer) stay distinct.
 */
function overlapComponents(childCount: number, links: Array<[number, number]>): number[][] {
  const parent = Array.from({ length: childCount }, (_, i) => i)
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  for (const [a, b] of links) parent[find(a)] = find(b)
  const groups = new Map<number, number[]>()
  for (let i = 0; i < childCount; i++) {
    const r = find(i)
    const g = groups.get(r)
    if (g) g.push(i)
    else groups.set(r, [i])
  }
  return [...groups.values()].filter((g) => g.length >= 2)
}

export interface PromoteResult {
  doc: L1Document
  /** Paths of the flow regions recovered — a whole-node region reports the node's
   * path; sub-band regions report their path in the rewritten tree. */
  promoted: string[]
}

/**
 * REQ-278 — the node kinds recovery deliberately leaves absolutely positioned.
 *
 * A backing surface (BUG-14's `section-band-*` / `section-bg-*` / `card-*`) and a
 * node that declares `stacked: true` are the two things on a page that are
 * SUPPOSED to be underneath their neighbours. Flowing them would give each one a
 * band of vertical space of its own and push the content it backs out from
 * behind it — an 800px-tall section fill becoming an 800px-tall empty panel. They
 * are also, for exactly the same reason, the two classes the envelope scan
 * already exempts, so they never demand recovery and nothing is lost by leaving
 * them where the capture put them: at rest the recovered flow reproduces the
 * captured positions, so the fill still lands behind the runs it was painted for.
 */
function keepsAbsolute(node: L1Node): boolean {
  if (node.stacked) return true
  return node.kind === 'box' && isSynthesizedSurfaceId(node.id)
}

/**
 * REQ-278 — the resting box of every node in `doc`, at every captured width.
 *
 * Recovery rewrites absolute coordinates into leading offsets, and an offset is
 * only exact if it is measured from where the previous sibling actually ENDS —
 * which for a text run is the height the browser gave it, not a number any
 * keyframe carries. The analytic evaluator already resolves exactly that (with
 * {@link EvaluateOptions.measured} it resolves the oracle's own heights), so the
 * recovery reads its resting evaluation rather than keeping a second, weaker
 * model of the same thing.
 */
function restingBoxes(doc: L1Document, measured?: MeasuredTextHeights): Map<number, Map<string, EvalBox>> {
  const out = new Map<number, Map<string, EvalBox>>()
  for (const width of doc.widths) {
    const byPath = new Map<string, EvalBox>()
    for (const leaf of evaluateLayout(doc, width, { measured }).leaves) byPath.set(leaf.path, leaf.box)
    out.set(width, byPath)
  }
  return out
}

/**
 * The resting box of the node at `path`, falling back to its own geometry plus
 * the extent of its subtree for a structural node the leaf scan never pushed.
 */
function restOf(
  rest: Map<string, EvalBox>,
  node: L1Node,
  path: string,
  width: number,
): EvalBox {
  const own = rest.get(path)
  if (own) return own
  const geo = geometryOf(node)
  const frame = geo ? evalGeometry(geo, width) : { x: 0, y: 0, width: 0, height: 0 }
  if (geo?.keyframes[0].height !== undefined) return frame
  // A structural node with no pinned height is as tall as the deepest leaf under it.
  let bottom = frame.y
  for (const [p, box] of rest) {
    if (p === path || p.startsWith(path + '.')) bottom = Math.max(bottom, box.y + box.height)
  }
  return { ...frame, height: Math.max(0, bottom - frame.y) }
}

/**
 * REQ-278 — split a set of sibling boxes into horizontal BANDS.
 *
 * A band is a maximal run of siblings that share vertical space: the row of a
 * grid, a check glyph and the line of copy beside it, a label and its value. The
 * members of one band must stay side by side or the recovery has destroyed the
 * horizontal geometry it exists to keep; members of different bands are what the
 * recovery makes flow, so that when one grows the next moves down instead of
 * being landed on.
 *
 * Found by the standard sweep — sort by top edge, start a new band wherever a
 * sibling begins at or below everything seen so far. Decided once, at the widest
 * captured width, because a tree has one shape: what varies across the ladder is
 * whether a band is laid out as a row or as a stack, which is a per-width layout
 * mode ([[REQ-104]]) rather than a per-width grouping.
 */
function bandsOf(indices: number[], boxAt: (i: number) => EvalBox, eps: number): number[][] {
  const sorted = [...indices].sort((a, b) => {
    const ba = boxAt(a)
    const bb = boxAt(b)
    return ba.y - bb.y || ba.x - bb.x
  })
  const bands: number[][] = []
  let current: number[] = []
  let runningBottom = -Infinity
  for (const i of sorted) {
    const box = boxAt(i)
    if (current.length > 0 && box.y >= runningBottom - eps) {
      bands.push(current)
      current = []
      runningBottom = -Infinity
    }
    current.push(i)
    runningBottom = Math.max(runningBottom, box.y + box.height)
  }
  if (current.length) bands.push(current)
  // DOCUMENT ORDER, restored — the sweep above needs the siblings sorted by top
  // edge to find the bands at all, but the tree it produces must keep the order
  // the fold wrote, both inside a band and between bands.
  //
  // This is not tidiness. The fidelity measure pairs the k-th oracle element of a
  // text key with the k-th reproduced leaf of that key IN DOCUMENT ORDER (see
  // {@link sampleFidelityProbe}), and non-text leaves pair the same way by kind.
  // A page whose DOM order is not its visual order — a grid whose second card is
  // written first, a collage — therefore re-pairs every repeated run the moment a
  // recovery sorts it visually, and reports the *distance between two different
  // check glyphs* as a fidelity miss. On `gigabytealchemy.ai` that alone read
  // 742px and 60 residuals on a recovery whose every box matched the base's
  // exactly. A leading offset reproduces its captured position from wherever flow
  // put it, negative where the document runs backwards, so keeping the fold's
  // order costs the recovery nothing and keeps the ruler measuring geometry
  // rather than ordering.
  for (const band of bands) band.sort((a, b) => a - b)
  bands.sort((a, b) => a[0] - b[0])
  return bands
}

/**
 * REQ-278 — recover the COLUMN CELLS of a responsive grid from flat bands.
 *
 * A band alone is a one-dimensional reading of a two-dimensional page, and a
 * responsive grid is the case where that shows. Take a three-card grid of
 * title-over-copy: at the widest width the three titles share a band and the
 * three bodies share the next one, and as two bands they flow perfectly well
 * there. But the SAME six runs are one vertical column at a mobile width, and a
 * tree has only one shape — so at that width the two bands become "all three
 * titles, then all three bodies", which reproduces at rest only through negative
 * offsets and collides the moment a title grows.
 *
 * The cell is the missing axis: the card, as a column of its own. Emitted as
 * three cells the grid is a row of three cards at the desktop widths and a stack
 * of the same three cards at the mobile ones, with each title still directly
 * above its own body in both. That is the structure the page had before it was
 * flattened into absolute coordinates, recovered from the geometry rather than
 * guessed at.
 *
 * The trigger is deliberately narrow: a band whose layout mode is a row at some
 * widths and a stack at others, followed by bands that match it column for
 * column. A band that is a row at EVERY width — a check glyph beside its line of
 * copy, repeated down a list — is left as bands, because there the flat reading
 * is the better one: the glyph stays beside its own line, and a line that grows
 * pushes the next PAIR down rather than sliding one column out of step with the
 * other. Cells are what a mode change needs, not a general-purpose grouping, and
 * grouping wherever the geometry merely allows it costs more than it buys.
 */
function gridCells(
  bands: number[][],
  boxAt: (i: number, width: number) => EvalBox | null,
  widths: number[],
  widest: number,
  eps: number,
): number[][] {
  const modesOf = (band: number[]): boolean[] =>
    widths.map((w) =>
      bandIsRow(band.map((i) => boxAt(i, w)).filter((b): b is EvalBox => b !== null), eps),
    )
  /** Assign each member of `next` to the cell it sits directly below, or null. */
  const columnMatch = (group: number[][], next: number[]): number[] | null => {
    if (next.length !== group.length) return null
    const taken = new Set<number>()
    const assignment: number[] = []
    for (const member of next) {
      const box = boxAt(member, widest)
      if (!box) return null
      let found = -1
      for (let c = 0; c < group.length; c++) {
        if (taken.has(c)) continue
        const above = boxAt(group[c][group[c].length - 1], widest)
        if (!above) continue
        const ix = Math.min(above.x + above.width, box.x + box.width) - Math.max(above.x, box.x)
        if (ix > eps && box.y + eps >= above.y + above.height) {
          found = c
          break
        }
      }
      if (found < 0) return null
      taken.add(found)
      assignment.push(found)
    }
    return assignment
  }

  const cells: number[][] = []
  let i = 0
  while (i < bands.length) {
    const band = bands[i]
    const modes = modesOf(band)
    if (band.length >= 2 && modes.some((m) => m) && modes.some((m) => !m)) {
      const group = band.map((m) => [m])
      let j = i + 1
      for (; j < bands.length; j++) {
        const assignment = columnMatch(group, bands[j])
        if (!assignment) break
        bands[j].forEach((m, k) => group[assignment[k]].push(m))
      }
      if (j > i + 1) {
        for (const cell of group) cell.sort((a, b) => a - b)
        group.sort((a, b) => a[0] - b[0])
        cells.push(...group)
        i = j
        continue
      }
    }
    cells.push(...band.map((m) => [m]))
    i++
  }
  return cells
}

/**
 * REQ-278 — lay a sequence of boxes out as a flow row or column from `top` /
 * `left`, returning each one's leading offset and where the sequence ends.
 *
 * This is the whole arithmetic of the recovery, in one place: an offset is the
 * distance from where flow would have put the node to where the capture did, so
 * a row measures from the previous item's right edge and a column from its
 * bottom. A `null` box is a member the viewport hides at this width — it takes no
 * offset and moves no pen, because the browser does not lay it out at all.
 */
function placeFlow(
  boxes: Array<EvalBox | null>,
  row: boolean,
  top: number,
  left: number,
): { leads: Array<{ x: number; y: number } | null>; bottom: number } {
  const leads: Array<{ x: number; y: number } | null> = []
  let penX = left
  let penY = top
  let bottom = top
  for (const box of boxes) {
    if (!box) {
      leads.push(null)
      continue
    }
    if (row) {
      leads.push({ x: box.x - penX, y: box.y - top })
      penX = box.x + box.width
      bottom = Math.max(bottom, box.y + box.height)
    } else {
      leads.push({ x: box.x - left, y: box.y - penY })
      penY = box.y + box.height
      bottom = penY
    }
  }
  return { leads, bottom }
}

/**
 * Whether a band's members can be laid out as a ROW at `width`: taken in their
 * tree order, each one starts at or after the previous one's right edge.
 *
 * A row is what preserves the horizontal geometry — each member keeps its own
 * width and its own place along the line — and it is what survives content
 * growth, because flex items sit beside each other however tall they get. Where
 * the members are NOT horizontally disjoint (the same grid at a mobile width,
 * where the three cards are stacked one above the other) a row would need
 * negative leading offsets to reproduce them, so the band is a stack there
 * instead and the layout mode says so at that width.
 */
function bandIsRow(members: EvalBox[], eps: number): boolean {
  if (members.length < 2) return false
  const byX = [...members].sort((a, b) => a.x - b.x)
  for (let i = 1; i < byX.length; i++) {
    if (byX[i].x + eps < byX[i - 1].x + byX[i - 1].width) return false
  }
  return true
}

/**
 * REQ-278 — rewrite a node's geometry track into the in-flow placement frame,
 * keyframe by keyframe, from leading offsets already computed per captured width.
 *
 * The horizontal half of the track survives intact: `width` is the captured
 * width and `x` is the captured position expressed as an offset from wherever
 * flow put the node. The vertical half is given back to the flow — `y` becomes
 * the leading gap and a height the node does not declare for itself is dropped,
 * because a node whose height comes from its content is precisely the node that
 * must grow when the content does.
 */
function toFlowPlacement(
  node: L1Node,
  leads: Array<{ at: number; x: number; y: number; width: number }>,
  keepHeight: boolean,
  snapSegments: ReadonlySet<number> = new Set(),
): L1Node {
  const geo = geometryOf(node)!
  const hasHeight = keepHeight && geo.keyframes[0].height !== undefined
  const keyframes = leads.map((lead) => {
    const atHeight = atHeightAt(geo, lead.at)
    return {
      at: lead.at,
      x: round(lead.x),
      y: round(lead.y),
      width: round(lead.width),
      ...(hasHeight ? { height: round(evalGeometry(geo, lead.at).height) } : {}),
      ...(atHeight !== undefined ? { atHeight } : {}),
    }
  })
  // A height response still applies to a height the node keeps; a `y` response
  // does not, because `y` is no longer a position (the validator refuses the pair).
  const heightFactor = hasHeight ? geo.viewportResponse?.heightFactor : undefined
  // The track is re-sampled onto the document's whole ladder (a leading offset is
  // a fact about a specific width and cannot be interpolated from a coarser
  // track), so its per-segment interpolate/snap flags are re-derived from
  // whichever of the ORIGINAL segments covers each new one. A reflow the capture
  // recorded as a snap stays a snap; interpolating across it is the defect
  // [[REQ-92]] names, where a held pre-reflow box is read as the live one.
  const segments = keyframes
    .slice(0, -1)
    .map((kf, i) => (snapSegments.has(i) ? ('snap' as const) : originalSegmentAt(geo, kf.at)))
  const next = {
    ...node,
    geometry: {
      keyframes,
      ...(segments.length > 0 ? { segments } : {}),
      ...(heightFactor !== undefined ? { viewportResponse: { heightFactor } } : {}),
      place: 'flow' as const,
    },
  }
  return next as L1Node
}

/**
 * REQ-278 — give an INVENTED container (a recovered cell) its in-flow placement.
 *
 * The recovery authors exactly one kind of node the fold never wrote: the column
 * a grid's cards are made of. It has no captured track of its own, so its
 * keyframes are the leads computed for it plus the width of the column it holds,
 * and it declares no height at all — a cell is as tall as its cards.
 */
function withFlowGeometry(
  node: L1Node,
  leads: Array<{ at: number; x: number; y: number; width: number }>,
  snapSegments: ReadonlySet<number> = new Set(),
): L1Node {
  const segments = leads
    .slice(0, -1)
    .map((_, i) => (snapSegments.has(i) ? ('snap' as const) : ('interpolate' as const)))
  return {
    ...node,
    geometry: {
      keyframes: leads.map((lead) => ({
        at: lead.at,
        x: round(lead.x),
        y: round(lead.y),
        width: round(lead.width),
      })),
      ...(segments.some((seg) => seg === 'snap') ? { segments } : {}),
      place: 'flow' as const,
    },
  } as L1Node
}

/**
 * The interpolate/snap behaviour the ORIGINAL track declares across the segment
 * that begins at `at` — the segment of the original that covers it, or `snap`
 * above the original's last keyframe (where the renderer holds the final rung).
 */
function originalSegmentAt(geo: L1Geometry, at: number): 'interpolate' | 'snap' {
  const f = geo.keyframes
  for (let i = 0; i < f.length - 1; i++) {
    if (at >= f[i].at && at < f[i + 1].at) return geo.segments?.[i] ?? 'interpolate'
  }
  return 'snap'
}

/**
 * The viewport HEIGHT a track was captured at, at `at` — resolved through the
 * same cascade as the geometry it travels with, so a re-sampled keyframe still
 * measures its height response from the right origin.
 */
function atHeightAt(geo: L1Geometry, at: number): number | undefined {
  const f = geo.keyframes.filter((kf) => kf.atHeight !== undefined)
  if (f.length === 0) return undefined
  if (at <= f[0].at) return f[0].atHeight
  for (let i = 0; i < f.length - 1; i++) {
    if (at >= f[i].at && at < f[i + 1].at) {
      const t = f[i + 1].at === f[i].at ? 0 : (at - f[i].at) / (f[i + 1].at - f[i].at)
      return round(lerp(f[i].atHeight!, f[i + 1].atHeight!, t))
    }
  }
  return f[f.length - 1].atHeight
}

/** Round to a tenth of a pixel — the offsets are derived, not captured. */
function round(n: number): number {
  return Math.round(n * 10) / 10
}

/** A node whose own height is its content's, so recovery gives it back to flow. */
function heightBelongsToContent(node: L1Node): boolean {
  if (node.kind === 'text') return true
  const kids = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
  return kids.length > 0
}

/**
 * REQ-278 — how a candidate document measures, in the two currencies the choice
 * between them is made in: how faithfully it reproduces the oracle, and how well
 * its envelope holds.
 */
export interface RecoveryScore {
  /** Envelope findings across on-sample, off-sample and content-robustness. */
  findings: number
  /** Envelope findings at the CAPTURED widths — the contract the page was made from. */
  onSample: number
  /** Envelope findings under the two perturbations: width between rungs, and grown content. */
  envelope: number
  /** Largest per-axis miss against the oracle, in px. */
  maxDelta: number
  /** Oracle samples placed out of tolerance. */
  residuals: number
  /** Oracle samples the document carries no leaf for at all. */
  unmatched: number
}

/** REQ-278 — the choice `1c repro` makes, with both sides of it measured. */
export interface RecoveryVerdict {
  /** The document to serve — the base, or the recovery, whichever won. */
  doc: L1Document
  /** True when the recovery won and is what will be written to disk. */
  served: boolean
  /** Paths of the pinned sibling groups the recovery flowed. */
  promoted: string[]
  base: RecoveryScore
  recovery: RecoveryScore
}

export interface RecoveryChoiceOptions {
  scale?: number
  measured?: MeasuredTextHeights
  offSampleWidths?: number[]
  /**
   * The composition a browser is actually handed — the page body with each
   * behaviour's presentation mounted at its slot. The envelope is a property of
   * THAT, not of the body alone (BUG-113), and the caller owns the mounting.
   */
  compose?: (doc: L1Document) => L1Document
}

/** Score one candidate: its envelope as composed, its fidelity as written. */
function scoreCandidate(
  doc: L1Document,
  oracle: OracleSource,
  options: RecoveryChoiceOptions,
): RecoveryScore {
  const measured = options.measured
  const served = options.compose ? options.compose(doc) : doc
  const count = (r: EnvelopeReport): number =>
    r.byWidth.reduce((n, w) => n + w.findings.length, 0)
  const fidelity = sampleFidelityProbe(doc, oracle, { measured })
  const onSample = count(onSampleProbe(served, { measured }))
  const envelope =
    count(offSampleProbe(served, { widths: options.offSampleWidths, measured })) +
    count(contentRobustnessProbe(served, { scale: options.scale, measured }))
  return {
    findings: onSample + envelope,
    onSample,
    envelope,
    maxDelta: fidelity.maxDelta,
    residuals: fidelity.residuals.length,
    unmatched: fidelity.unmatched.length,
  }
}

/**
 * REQ-278 — decide which document to serve, and price both.
 *
 * BUG-113 asked this question and answered it by hand, in a comment, because the
 * only recovery available cleared the envelope by discarding geometry and there
 * was nothing to weigh: 1426px of miss buys no amount of resilience. A recovery
 * that keeps the geometry makes it a real comparison, so it is made here — ONCE,
 * by both `1c repro` (which writes the winner) and `1c l1-gate` (which grades
 * it), so the page that is served and the verdict that is reported can never
 * again be about two different documents.
 *
 * THE RULE, in three parts, in the order they bind:
 *
 *   1. FIDELITY IS NOT FOR SALE. The recovery must give up nothing against the
 *      oracle — no extra residual, no unmatched sample, not one pixel of
 *      worst-case miss beyond the rounding the offsets are written at. This is
 *      the epic's doctrine: resilience bought with fidelity is the 80%-faithful
 *      copy, and a page that reproduces the capture is the product.
 *   2. NEITHER ARE THE CAPTURED WIDTHS. On-sample findings must not go up. Those
 *      are the widths the page was measured at, so a collision there is a defect
 *      in the recovery and not a judgement call.
 *   3. THEN, AND ONLY THEN, THE ENVELOPE MUST STRICTLY IMPROVE — the off-sample
 *      and content-robustness findings taken together, because both ask the same
 *      question (does the page hold when the conditions are not the captured
 *      ones?) and differ only in which condition they move. Taken together, not
 *      probe by probe: a flow trades a little width-interpolation accuracy
 *      between rungs for a great deal of resilience to content that grows, and
 *      refusing that trade at any margin would refuse flow itself. The split is
 *      in {@link RecoveryScore} and printed by the gate, so what the trade cost
 *      is never hidden inside the verdict.
 *
 * Anything short of all three leaves the absolute base in place. It is the same
 * judgement BUG-113 made, expressed as a computation over the current
 * measurement rather than as a conclusion about the recovery that existed then.
 */
export function chooseRecovery(
  base: L1Document,
  oracle: OracleSource,
  options: RecoveryChoiceOptions = {},
): RecoveryVerdict {
  const { doc: recovered, promoted } = promoteToFlow(base, {
    scale: options.scale,
    measured: options.measured,
  })
  const baseScore = scoreCandidate(base, oracle, options)
  const recoveryScore = scoreCandidate(recovered, oracle, options)
  // A tenth of a pixel: the recovery's leading offsets are rounded to that, so a
  // difference at or below it is the rounding and not a regression.
  const wins =
    recoveryScore.residuals <= baseScore.residuals &&
    recoveryScore.unmatched <= baseScore.unmatched &&
    recoveryScore.maxDelta <= baseScore.maxDelta + 0.1 &&
    recoveryScore.onSample <= baseScore.onSample &&
    recoveryScore.envelope < baseScore.envelope
  return {
    doc: wins ? recovered : base,
    served: wins,
    promoted,
    base: baseScore,
    recovery: recoveryScore,
  }
}

/**
 * Demand-driven, **region-aware, geometry-preserving** structure recovery.
 *
 * Two predecessors stand behind this. The first promoted a failing node into one
 * flat pile, keeping a single median gap for the whole page and leaving the
 * un-promoted siblings pinned for that pile to overrun (BUG-9). The second fixed
 * the regions but still cleared the envelope the only way it knew — by DROPPING
 * each promoted member's geometry, so a 14px check glyph in a grid became a
 * full-bleed stacked row. BUG-113 measured what that cost and declined to serve
 * it: 1426px of miss on a 1440px viewport is not a repaired page, it is a
 * different one.
 *
 * So this recovery keeps the geometry and changes only the FRAME it is read in:
 *
 *   - Colliding pinned siblings are grouped into {@link bandsOf} bands — the rows
 *     of a grid, a glyph and the copy beside it. A band's members stay side by
 *     side in a `row` (each with its own captured width and its own place along
 *     the line), at every width where they are horizontally disjoint; where they
 *     are not — the same grid at a mobile width — the band is a `stack` there,
 *     carried by a per-width layout track ([[REQ-104]]).
 *   - Every member is placed by {@link L1Geometry.place} `'flow'`: the same
 *     keyframes, read as leading offsets from the flow cursor. An offset measured
 *     from the previous sibling's captured bottom reproduces the captured
 *     position EXACTLY at every sampled width — so recovery costs no fidelity at
 *     rest — while leaving the page free to push its own content down when a run
 *     wraps one line more than the capture did.
 *   - Backing surfaces and declared-`stacked` nodes stay absolute
 *     ({@link keepsAbsolute}), because a fill that joins the flow stops being
 *     behind the thing it fills.
 *   - A node with no colliding group is left absolute entirely — recovery is
 *     applied where the probe demands it, per DOC-27's absolute-base / flow-
 *     overlay split.
 *
 * Fidelity is still measured on the absolute base, so recovery never regrades
 * `sampleFidelity`. Returns a validated document.
 */
export function promoteToFlow(
  doc: L1Document,
  options: { scale?: number; measured?: MeasuredTextHeights } = {},
): PromoteResult {
  const scale = options.scale ?? 2.5
  const eps = 2
  const promoted: string[] = []
  const widths = doc.widths
  const widest = Math.max(...widths)
  const rest = restingBoxes(doc, options.measured)

  // Perturbed overlap pairs across every captured width, computed once. Each pair
  // is a (leafPathA, leafPathB) that collide when content grows by `scale`.
  const overlapPairs: Array<[string, string]> = []
  for (const width of widths) {
    for (const f of evaluateLayout(doc, width, { contentScale: scale, measured: options.measured })
      .findings) {
      if (f.kind === 'overlap' && f.paths.length >= 2) {
        overlapPairs.push([f.paths[0], f.paths[1]])
      }
    }
  }

  /**
   * Rewrite `node`, whose content box starts at `lefts[w]` / `tops[w]` at each
   * captured width. The two frames are what every leading offset is measured
   * against, threaded down rather than re-derived: a node's own geometry says
   * where IT is, never where its parent's content begins.
   */
  function rewrite(
    node: L1Node,
    path: string,
    lefts: Map<number, number>,
    tops: Map<number, number>,
  ): L1Node {
    if (node.kind !== 'box' && node.kind !== 'container') return node
    const originalChildren: L1Node[] = node.kind === 'container' ? node.children : (node.children ?? [])
    const childFrame = (child: L1Node, i: number, axis: 'x' | 'y'): Map<number, number> => {
      const geo = geometryOf(child)
      const map = new Map<number, number>()
      for (const w of widths) {
        const outer = (axis === 'x' ? lefts : tops).get(w) ?? 0
        map.set(w, geo && geo.place !== 'flow' ? evalGeometry(geo, w)[axis] : outer)
      }
      return map
    }
    const children: L1Node[] = originalChildren.map((c, i) =>
      rewrite(c, `${path}.${i}`, childFrame(c, i, 'x'), childFrame(c, i, 'y')),
    )

    // Links between THIS node's direct children whose subtrees collide under
    // perturbation (any leaf under child a overlaps any leaf under child b).
    const links: Array<[number, number]> = []
    for (const [p, q] of overlapPairs) {
      const a = directChildIndex(path, p)
      const b = directChildIndex(path, q)
      if (a !== null && b !== null && a !== b) links.push([a, b])
    }

    // Only pinned children are promotable; components restricted to them.
    const pinned = new Set(children.map((c, i) => (isPinned(c) ? i : -1)).filter((i) => i >= 0))
    const components = overlapComponents(children.length, links)
      .map((g) => g.filter((i) => pinned.has(i)))
      .filter((g) => g.length >= 2)

    if (components.length === 0) {
      return node.kind === 'container' ? { ...node, children } : { ...node, children }
    }

    const boxOf = (i: number, w: number): EvalBox =>
      restOf(rest.get(w)!, children[i], `${path}.${i}`, w)

    // The children that join the flow, and the ones the composition needs left
    // behind it. A non-pinned child is already in flow and stays where it is.
    const visibleBox = (i: number, w: number): EvalBox | null =>
      hidden(children[i], w) ? null : boxOf(i, w)
    const cellBox = (cell: number[], w: number): EvalBox | null => {
      let out: EvalBox | null = null
      for (const i of cell) {
        const box = visibleBox(i, w)
        if (!box) continue
        if (!out) out = { ...box }
        else {
          const right = Math.max(out.x + out.width, box.x + box.width)
          const bottom = Math.max(out.y + out.height, box.y + box.height)
          out.x = Math.min(out.x, box.x)
          out.y = Math.min(out.y, box.y)
          out.width = right - out.x
          out.height = bottom - out.y
        }
      }
      return out
    }

    type Lead = { at: number; x: number; y: number; width: number }
    type Item = { region: number; bands: number[][] }
    interface Plan {
      absolute: number[]
      cells: number[][]
      bands: number[][]
      items: Item[]
      rowAt: Map<number, Map<number, boolean>>
      cellLeads: Map<number, Lead[]>
      memberLeads: Map<number, Lead[]>
    }

    /**
     * Read this node's children as a flow: the grouping into cells and bands,
     * the region each band belongs to, and every member's leading offset at every
     * captured width. Pure — it constructs no nodes, so the emission below reads
     * one consistent plan rather than re-deriving it band by band.
     */
    const plan = (): Plan => {
      const flowing: number[] = []
      const absolute: number[] = []
      children.forEach((c, i) => {
        if (!isPinned(c)) return
        if (keepsAbsolute(c)) absolute.push(i)
        else flowing.push(i)
      })
      // The two-dimensional read of the node's flow children: columns first
      // (`gridCells`), then the bands those cells fall into. A cell that is alone
      // in its band is inlined — a wrapper around one column of a one-column band
      // is a node that says nothing.
      const memberBands = bandsOf(flowing, (i) => boxOf(i, widest), eps)
      const cells = gridCells(memberBands, visibleBox, widths, widest, eps)
      const cellIndices = cells.map((_, ci) => ci)
      const bands = bandsOf(
        cellIndices,
        (ci) => cellBox(cells[ci], widest) ?? { x: 0, y: 0, width: 0, height: 0 },
        eps,
      )

      // Which region each band belongs to: the component of any member it holds.
      // Bands that hold members of two components merge them — one band is one
      // line of layout, so it cannot be split between two flow regions.
      const regionOf = new Map<number, number>()
      components.forEach((cl, ci) => cl.forEach((i) => regionOf.set(i, ci)))
      const bandRegion = bands.map((band) => {
        for (const ci of band) {
          for (const i of cells[ci]) {
            const r = regionOf.get(i)
            if (r !== undefined) return r
          }
        }
        return -1
      })

      // Group consecutive bands of the same region into one flow region
      // container; a band belonging to no component is a survivor and flows alone.
      const items: Item[] = []
      bands.forEach((band, bi) => {
        const region = bandRegion[bi]
        const last = items[items.length - 1]
        if (region >= 0 && last && last.region === region) last.bands.push(band)
        else items.push({ region, bands: [band] })
      })

      // The running flow cursor, per width: where the next band's leading offset
      // is measured from. It starts at the parent's own content top.
      const cursor = new Map<number, number>(widths.map((w) => [w, tops.get(w) ?? 0]))
      const rowAt = new Map<number, Map<number, boolean>>()
      const cellLeads = new Map<number, Lead[]>()
      const memberLeads = new Map<number, Lead[]>()

      for (const band of bands) {
        const single = band.length === 1
        const modes = new Map<number, boolean>(
          widths.map((w) => [
            w,
            bandIsRow(
              band.map((ci) => cellBox(cells[ci], w)).filter((b): b is EvalBox => b !== null),
              eps,
            ),
          ]),
        )
        band.forEach((ci) => {
          rowAt.set(ci, modes)
          cellLeads.set(ci, [])
          cells[ci].forEach((i) => memberLeads.set(i, []))
        })
        for (const w of widths) {
          const top = cursor.get(w)!
          const left = lefts.get(w) ?? 0
          if (single) {
            const cell = cells[band[0]]
            const placed = placeFlow(cell.map((i) => visibleBox(i, w)), false, top, left)
            cell.forEach((i, k) => {
              const lead = placed.leads[k]
              const box = visibleBox(i, w)
              memberLeads.get(i)!.push({ at: w, x: lead?.x ?? 0, y: lead?.y ?? 0, width: box?.width ?? 0 })
            })
            cursor.set(w, placed.bottom)
            continue
          }
          const boxes = band.map((ci) => cellBox(cells[ci], w))
          const placed = placeFlow(boxes, modes.get(w)!, top, left)
          band.forEach((ci, k) => {
            const lead = placed.leads[k]
            const box = boxes[k]
            cellLeads.get(ci)!.push({ at: w, x: lead?.x ?? 0, y: lead?.y ?? 0, width: box?.width ?? 0 })
            // A cell's own members stack inside it, measured from where the cell
            // itself landed — which, by construction, is where it was captured.
            const inner = placeFlow(
              cells[ci].map((i) => visibleBox(i, w)),
              false,
              box?.y ?? top,
              box?.x ?? left,
            )
            cells[ci].forEach((i, m) => {
              const memberBox = visibleBox(i, w)
              const innerLead = inner.leads[m]
              memberLeads.get(i)!.push({
                at: w,
                x: innerLead?.x ?? 0,
                y: innerLead?.y ?? 0,
                width: memberBox?.width ?? 0,
              })
            })
          })
          cursor.set(w, placed.bottom)
        }
      }
      return { absolute, cells, bands, items, rowAt, cellLeads, memberLeads }
    }

    const { absolute, cells, bands, items, rowAt, cellLeads, memberLeads } = plan()

    /**
     * REQ-278 — the segments of the ladder the flow is DISCONTINUOUS across.
     *
     * A leading offset is a fact about a specific width: the distance from where
     * flow put the node to where the capture did. Between two captured widths the
     * renderer interpolates it, which tracks the cursor closely enough while the
     * flow between them is the same flow — the cursor drifts as text reflows, and
     * a linearly-drifting offset drifts with it. Two things break that, and both
     * make a segment SNAP instead: hold the lower rung's offsets until the layout
     * that made them true has actually changed.
     *
     * A BAND THAT CHANGES LAYOUT MODE. A band that is a row at one captured width
     * and a stack at the next moves the cursor by the whole height of the stacked
     * band, while `responsiveLayout` holds the mode until the upper rung — so an
     * interpolated offset is measured against a flow that has not happened yet
     * and every node after it lands short.
     *
     * A RUN THAT GOES BACKWARDS. A page whose DOM order is not its visual order —
     * a grid whose cards are written out of sequence, a footer run declared above
     * the body it sits under — needs NEGATIVE offsets to reproduce. Those are
     * real CSS and reproduce the capture exactly at every sampled width, so the
     * recovery keeps them rather than abandoning the region (measured: holding
     * those members out of the flow instead left 193 findings where flowing them
     * leaves 116, and cost six off-sample collisions rather than two, because a
     * held-back member stays put while its flowed neighbours drift). What cannot
     * be trusted is INTERPOLATING one: blending two "how far back to go" numbers
     * against a cursor that moved by real reflow lands the node on its neighbour
     * at a width the capture never saw.
     */
    const discontinuous = new Set<number>()
    for (const band of bands) {
      const modes = rowAt.get(band[0])!
      for (let i = 0; i < widths.length - 1; i++) {
        if (modes.get(widths[i]) !== modes.get(widths[i + 1])) discontinuous.add(i)
      }
    }

    /** A member, or a whole cell, rewritten into the in-flow placement frame. */
    const flowNode = (node: L1Node, leads: Lead[], keepHeight: boolean): L1Node =>
      toFlowPlacement(node, leads, keepHeight, discontinuous)

    /** Build one band's nodes from the leads the plan computed for it. */
    const buildBand = (band: number[]): L1Node[] => {
      const single = band.length === 1
      const cellNode = (ci: number): L1Node => {
        const members = cells[ci].map((i) =>
          flowNode(children[i], memberLeads.get(i)!, !heightBelongsToContent(children[i])),
        )
        if (members.length === 1 && single) return members[0]
        if (members.length === 1) {
          // One member: it IS the cell, so it takes the cell's own offset rather
          // than being wrapped in a container that carries nothing but that offset.
          const only = children[cells[ci][0]]
          return flowNode(only, cellLeads.get(ci)!, !heightBelongsToContent(only))
        }
        const container: L1Node = { kind: 'container', layout: 'stack', children: members }
        return single ? container : withFlowGeometry(container, cellLeads.get(ci)!, discontinuous)
      }

      if (single) {
        return cells[band[0]].map((i) =>
          flowNode(children[i], memberLeads.get(i)!, !heightBelongsToContent(children[i])),
        )
      }

      // The band's own layout mode, per width, and the representative (widest)
      // value beside it — REQ-104's shape, so the renderer and the evaluator read
      // the same cascade rather than two approximations of it.
      const modes = rowAt.get(band[0])!
      const keyframes: Array<{ at: number; value: 'row' | 'stack' }> = []
      for (const w of widths) {
        const value = modes.get(w)! ? ('row' as const) : ('stack' as const)
        if (keyframes.length === 0 || keyframes[keyframes.length - 1].value !== value) {
          keyframes.push({ at: w, value })
        }
      }
      return [
        {
          kind: 'container',
          layout: keyframes[keyframes.length - 1].value,
          ...(keyframes.length > 1 ? { responsiveLayout: { keyframes } } : {}),
          // A row's cells carry their own cross-axis offsets, so they must keep
          // their own heights rather than being stretched to the tallest of them.
          align: 'start' as const,
          children: band.map(cellNode),
        },
      ]
    }

    const emitted: L1Node[] = []
    // The fills are re-attached AHEAD of the flow (see below), so every recovered
    // region's reported path counts from after them.
    const flowBase = absolute.length
    // BUG-9's reporting contract, kept: one region covering every child means the
    // NODE is the region, and its bare path is what the report names. A region
    // that shares the node with survivors or with a fill is named by its own
    // index among them, because there the node is not the thing that was flowed.
    const wholeNode = components.length === 1 && components[0].length === children.length
    for (const item of items) {
      const nodes = item.bands.flatMap(buildBand)
      const name = (): void => {
        if (item.region < 0) return
        promoted.push(wholeNode ? path : `${path}.${flowBase + emitted.length}`)
      }
      if (item.region < 0 || nodes.length === 1) {
        // A survivor band, or a region that turned out to be one band: no wrapper
        // is needed, and inventing one would be a node with no content of its own.
        name()
        emitted.push(...nodes)
        continue
      }
      name()
      emitted.push({ kind: 'container', layout: 'stack', children: nodes })
    }

    // The absolutely-kept children (the fills) are re-attached ahead of the flow,
    // exactly where they were: they are out of flow, so their position in the
    // child list decides only paint order, and painting them first is what makes
    // them backgrounds.
    const rebuiltChildren = [...absolute.map((i) => children[i]), ...emitted]
    return node.kind === 'container'
      ? { ...node, layout: 'stack' as const, responsiveLayout: undefined, gapPx: 0, children: rebuiltChildren }
      : { ...node, children: rebuiltChildren }
  }

  const zero = new Map<number, number>(widths.map((w) => [w, 0]))
  const root = rewrite(doc.root, '0', zero, zero)
  const next: L1Document = { ...doc, root }
  const result = validateL1(next)
  if (!result.ok) {
    const detail = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    throw new Error(`promoteToFlow: produced an invalid L1 document — ${detail}`)
  }
  return { doc: result.value, promoted }
}
