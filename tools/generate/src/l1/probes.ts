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

/** Whether a node is out of flow (positioned by its own absolute geometry). */
function isPinned(node: L1Node): boolean {
  return 'geometry' in node && node.geometry !== undefined
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
function rowChildWidths(children: L1Node[], avail: number, gap: number): number[] {
  const n = children.length
  if (n === 0) return []
  const fixed = children.map(fixedWidth)
  const fixedSum = fixed.reduce((s: number, w) => s + (w ?? 0), 0)
  const flexCount = fixed.filter((w) => w === undefined).length
  const remaining = Math.max(0, avail - gap * (n - 1) - fixedSum)
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
}

/**
 * Lay `node` out inside `frame` (the box the parent assigned it) and return its
 * resolved height. Pinned children float by their own geometry (out of flow);
 * in-flow children stack. Leaf boxes (text / image / slot) are pushed to
 * `ctx.leaves`; boxes / containers are structural.
 */
function layout(node: L1Node, frame: EvalBox, path: string, ctx: Ctx): number {
  const { width, opts } = ctx
  if (hidden(node, width)) return 0

  // A pinned node resolves its own box from geometry, ignoring the parent frame.
  const pinned = isPinned(node)
  const box: EvalBox = pinned ? evalGeometry(node.geometry!, width) : { ...frame }
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
      const pinnedH = pinned ? node.geometry!.keyframes[0].height : undefined
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
      ctx.leaves.push({ path, kind: 'text', text: l1PlainText(node.text), id: node.id, box, pinned, ...stackedOf(node) })
      return box.height
    }
    case 'image': {
      if (pinned && node.geometry!.keyframes[0].height !== undefined) {
        box.height = evalGeometry(node.geometry!, width).height * opts.contentScale
      }
      ctx.leaves.push({ path, kind: 'image', id: node.id, box, pinned, ...stackedOf(node) })
      return box.height
    }
    case 'slot': {
      ctx.leaves.push({ path, kind: 'slot', id: node.id, box, pinned, ...stackedOf(node) })
      return box.height
    }
    case 'control': {
      // REQ-96 — a control is a leaf like any other: the module contributes its
      // element, L1 contributes the box, so the geometry model is unchanged. A
      // pinned keyframe height wins; otherwise the parent's frame stands.
      if (pinned && node.geometry!.keyframes[0].height !== undefined) {
        box.height = evalGeometry(node.geometry!, width).height * opts.contentScale
      }
      ctx.leaves.push({ path, kind: 'control', id: node.id, box, pinned, ...stackedOf(node) })
      return box.height
    }
    case 'box':
    case 'container': {
      const children = node.kind === 'container' ? node.children : (node.children ?? [])
      // A childless `box` is a leaf surface (a divider / painted panel) — REQ-92:
      // it has its own geometry box, so push it as a leaf the fidelity probe pairs.
      if (node.kind === 'box' && children.length === 0) {
        if (pinned && node.geometry!.keyframes[0].height !== undefined) {
          box.height = evalGeometry(node.geometry!, width).height * opts.contentScale
        }
        ctx.leaves.push({ path, kind: 'box', id: node.id, box, pinned, ...stackedOf(node) })
        return box.height
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
      const flowChildren: L1Node[] = []
      children.forEach((child, i) => {
        if (isPinned(child)) layout(child, { ...box }, `${path}.${i}`, ctx)
        else flowChildren.push(child)
      })

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
        const widths = rowChildWidths(flowChildren, box.width, gap)
        const lines = wrapping
          ? packRowLines(widths, box.width, gap, opts.epsilonPx)
          : [flowChildren.map((_, k) => k)]
        let cursorY = box.y
        for (const line of lines) {
          let cursorX = box.x
          let lineHeight = 0
          for (const k of line) {
            const child = flowChildren[k]
            const idx = children.indexOf(child)
            const childFrame: EvalBox = { x: cursorX, y: cursorY, width: widths[k], height: 0 }
            const h = layout(child, childFrame, `${path}.${idx}`, ctx)
            lineHeight = Math.max(lineHeight, h)
            cursorX += widths[k] + gap
          }
          cursorY += lineHeight + gap
          maxChildBottom = Math.max(maxChildBottom, cursorY - gap)
        }
      } else {
        // Stack: each child fills the width and stacks vertically.
        let cursorY = box.y
        flowChildren.forEach((child) => {
          const idx = children.indexOf(child)
          const childFrame: EvalBox = { x: box.x, y: cursorY, width: box.width, height: 0 }
          const h = layout(child, childFrame, `${path}.${idx}`, ctx)
          cursorY += h + gap
          maxChildBottom = Math.max(maxChildBottom, cursorY - gap)
        })
      }

      // Natural content height of the flow interior.
      const contentHeight = flowChildren.length ? maxChildBottom - box.y : 0
      // A pinned box/container with a fixed keyframe height that the content
      // overflows is a clip.
      const pinnedH = pinned ? node.geometry!.keyframes[0].height : undefined
      if (pinnedH !== undefined && contentHeight > pinnedH + opts.epsilonPx) {
        ctx.clips.push({
          kind: 'clip',
          detail: `content height ${Math.round(contentHeight)}px exceeds pinned box height ${pinnedH}px`,
          paths: [path],
        })
      }
      return pinnedH !== undefined ? pinnedH : contentHeight
    }
  }
}

/**
 * BUG-112 — the node's declared stacking intent, as a spreadable fragment so an
 * unmarked node carries no key at all (rather than an explicit `undefined`,
 * which would survive `JSON.stringify` into every serialized leaf).
 */
function stackedOf(node: L1Node): { stacked?: true } {
  return node.stacked ? { stacked: true } : {}
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

/** Median vertical gap between consecutive pinned children at the widest sample. */
function medianGap(children: L1Node[], width: number): number {
  const boxes = children
    .filter(isPinned)
    .map((c) => evalGeometry(c.geometry!, width))
    .sort((a, b) => a.y - b.y)
  const gaps: number[] = []
  for (let i = 1; i < boxes.length; i++) {
    gaps.push(boxes[i].y - (boxes[i - 1].y + boxes[i - 1].height))
  }
  if (gaps.length === 0) return 0
  gaps.sort((a, b) => a - b)
  return Math.max(0, Math.round(gaps[Math.floor(gaps.length / 2)]))
}

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

/** Drop a node's absolute geometry so it flows (fills its flow container's width). */
function dropGeometry(node: L1Node): L1Node {
  if (!('geometry' in node) || node.geometry === undefined) return node
  const { geometry: _drop, ...rest } = node as L1Node & { geometry?: L1Geometry }
  return rest as L1Node
}

export interface PromoteResult {
  doc: L1Document
  /** Paths of the flow regions recovered — a whole-node region reports the node's
   * path; sub-band regions report their path in the rewritten tree. */
  promoted: string[]
}

/**
 * Demand-driven, **region-aware** structure recovery. The single-flat-pile
 * predecessor promoted the whole failing node into one flow stack — too coarse:
 * it kept one median gap for the entire page and, promoting only some siblings,
 * left the rest pinned for the grown pile to overrun (BUG-9). This walks the tree
 * and, at each node, promotes the **smallest** pinned sibling groups that actually
 * collide under perturbation:
 *
 *   - Direct children that overlap under content growth are grouped by connected
 *     component (`overlapComponents`) — the distinct nested regions (hero / grid /
 *     footer), each its own flow `stack` with its own interior gap.
 *   - A node that needs recovery flows **all** its children (regions as sub-stacks,
 *     survivors as flowed items), so no pinned sibling is left behind to be
 *     overrun. Under CSS flow, stacked items never overlap and never clip — the
 *     envelope holds under both off-sample and content-robustness probes.
 *   - A node with no colliding group is left **absolute** — recovery is applied
 *     where the probe demands it, per DOC-27's absolute-base / flow-overlay split.
 *
 * Fidelity is measured on the absolute base, never on this overlay, so recovery
 * never regrades `sampleFidelity`. Returns a validated document.
 */
export function promoteToFlow(
  doc: L1Document,
  options: { scale?: number; measured?: MeasuredTextHeights } = {},
): PromoteResult {
  const scale = options.scale ?? 2.5
  const promoted: string[] = []
  const widest = Math.max(...doc.widths)

  // Perturbed overlap pairs across every captured width, computed once. Each pair
  // is a (leafPathA, leafPathB) that collide when content grows by `scale`.
  const overlapPairs: Array<[string, string]> = []
  for (const width of doc.widths) {
    for (const f of evaluateLayout(doc, width, { contentScale: scale, measured: options.measured })
      .findings) {
      if (f.kind === 'overlap' && f.paths.length >= 2) {
        overlapPairs.push([f.paths[0], f.paths[1]])
      }
    }
  }

  function rewrite(node: L1Node, path: string): L1Node {
    if (node.kind !== 'box' && node.kind !== 'container') return node
    const children: L1Node[] = (node.kind === 'container' ? node.children : node.children ?? []).map(
      (c, i) => rewrite(c, `${path}.${i}`),
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

    // A recovered node is forced to `stack`, *including* a container the fold
    // authored as `row` or `grid`. This is deliberate, not an oversight: the
    // recovery overlay's whole guarantee is that promoted children survive
    // perturbation, and only vertical stacking is unconditionally overlap-free
    // and clip-free under growth — a row re-flows sideways and overflows its
    // parent exactly where the pinned version overlapped. The absolute base
    // (which keeps the authored layout) is what fidelity is measured on; this
    // rewrite only ever applies to a node whose children *already* collide.
    //
    // REQ-104 — that forcing has to take any per-width layout track with it: the
    // track OWNS the mode at render time, and a leftover one would quietly
    // re-row the region the probe just flowed.
    const rebuilt = (kids: L1Node[]): L1Node =>
      node.kind === 'container'
        ? { ...node, layout: 'stack', responsiveLayout: undefined, children: kids }
        : { ...node, children: kids }

    // One region covering every child → flow the node's children directly (the
    // node *is* the region). Keeps the historical single-region path reporting.
    if (components.length === 1 && components[0].length === children.length) {
      promoted.push(path)
      return rebuilt(children.map(dropGeometry))
    }

    // Multiple regions (or a region plus survivors): wrap each colliding group in
    // its own flow sub-stack; flow the survivors alongside so nothing stays pinned.
    const memberComponent = new Map<number, number>()
    components.forEach((cl, ci) => cl.forEach((i) => memberComponent.set(i, ci)))
    const items: L1Node[] = []
    children.forEach((c, i) => {
      const ci = memberComponent.get(i)
      if (ci === undefined) {
        items.push(dropGeometry(c))
        return
      }
      if (components[ci][0] !== i) return // absorbed into its region's sub-stack
      const members = components[ci]
        .map((k) => children[k])
        .sort((a, b) => evalGeometry(a.geometry!, widest).y - evalGeometry(b.geometry!, widest).y)
      const region: L1Node = {
        kind: 'container',
        layout: 'stack',
        gapPx: medianGap(members, widest),
        children: members.map(dropGeometry),
      }
      promoted.push(`${path}.${items.length}`)
      items.push(region)
    })
    return rebuilt(items)
  }

  const root = rewrite(doc.root, '0')
  const next: L1Document = { ...doc, root }
  const result = validateL1(next)
  if (!result.ok) {
    const detail = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    throw new Error(`promoteToFlow: produced an invalid L1 document — ${detail}`)
  }
  return { doc: result.value, promoted }
}
