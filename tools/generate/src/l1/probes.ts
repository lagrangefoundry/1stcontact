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
 * The three probes (from the ticket):
 *   (a) sample-fidelity     — reproduced geometry matches the oracle at the 6
 *                             captured widths within tolerance.
 *   (b) off-sample          — renders sane (no overlap / clip) at intermediate
 *                             widths (500 / 900px) the fold never sampled.
 *   (c) content-robustness  — perturbed content (longer text / taller image)
 *                             keeps the envelope: no overlap / clip.
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
  validateL1,
  type L1Document,
  type L1Geometry,
  type L1Node,
} from '@1stcontact/site-schema'
import { classifyElement, type FoldableElement } from './fold'

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
 * Estimate a text run's natural (flow) height. Coarse but monotonic — longer
 * text or a narrower column yields more lines and a taller box. The probe only
 * needs the *behaviour* (does growing content break the envelope?), so absolute
 * fidelity to a browser's shaper is not required.
 */
function estimateTextHeight(
  text: string,
  fontSizePx: number,
  lineHeightPx: number | undefined,
  availWidth: number,
  scale: number,
): number {
  const fs = fontSizePx > 0 ? fontSizePx : 16
  const lh = lineHeightPx && lineHeightPx > 0 ? lineHeightPx : Math.round(fs * 1.4)
  const avgChar = fs * 0.5
  const perLine = Math.max(1, Math.floor(Math.max(1, availWidth) / avgChar))
  const chars = Math.max(1, Math.ceil(text.length * scale))
  const lines = Math.max(1, Math.ceil(chars / perLine))
  return lines * lh
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

// ── analytic layout ───────────────────────────────────────────────────────────

interface Ctx {
  width: number
  opts: Required<EvaluateOptions>
  leaves: EvalLeaf[]
  /** Clip findings accumulated during the walk (pinned-box content overflow). */
  clips: LayoutFinding[]
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
      box.height = pinnedH !== undefined ? pinnedH * opts.contentScale : natural
      ctx.leaves.push({ path, kind: 'text', text: node.text, id: node.id, box, pinned })
      return box.height
    }
    case 'image': {
      if (pinned && node.geometry!.keyframes[0].height !== undefined) {
        box.height = evalGeometry(node.geometry!, width).height * opts.contentScale
      }
      ctx.leaves.push({ path, kind: 'image', id: node.id, box, pinned })
      return box.height
    }
    case 'slot': {
      ctx.leaves.push({ path, kind: 'slot', id: node.id, box, pinned })
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
        ctx.leaves.push({ path, kind: 'box', id: node.id, box, pinned })
        return box.height
      }
      const gap = node.kind === 'container' ? (node.gapPx ?? 0) : 0
      // A `row` container flows horizontally along the main axis; a `box` and a
      // `stack`/`grid` container flow vertically (full-width, stacked). Grid is
      // modelled as a stack here — envelope-conservative, and the folder does not
      // emit grid yet.
      const row = node.kind === 'container' && node.layout === 'row'

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
        const widths = rowChildWidths(flowChildren, box.width, gap)
        let cursorX = box.x
        flowChildren.forEach((child, k) => {
          const idx = children.indexOf(child)
          const childFrame: EvalBox = { x: cursorX, y: box.y, width: widths[k], height: 0 }
          const h = layout(child, childFrame, `${path}.${idx}`, ctx)
          maxChildBottom = Math.max(maxChildBottom, box.y + h)
          cursorX += widths[k] + gap
        })
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
  const opts: Required<EvaluateOptions> = {
    contentScale: options.contentScale ?? 1,
    epsilonPx: options.epsilonPx ?? 2,
  }
  const ctx: Ctx = { width, opts, leaves: [], clips: [] }
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
  // placeholders (Phase-D seams), and `box` leaves are painted *surfaces* that sit
  // behind content (a card/section/panel fill, BUG-11) — a background overlapping
  // the content it backs is by design, not a collision — so both are excluded. A
  // box that overflows the viewport is still caught by the horizontal-clip check.
  const solid = ctx.leaves.filter(
    (l) => l.kind !== 'slot' && l.kind !== 'box' && l.box.height > 0 && l.box.width > 0,
  )
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
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
  for (const p of oracle.projections) {
    if (p.state && p.state !== 'rest') continue
    for (const el of p.manifest.elements) {
      if (!el.box) continue
      const kind = classifyElement(el)
      if (kind === 'text') {
        if (!el.text || el.text.trim() === '') continue
        out.push({ text: el.text, kind, width: p.viewport.width, box: el.box })
      } else if (kind === 'image' || kind === 'box') {
        out.push({ text: el.text ?? '', kind, width: p.viewport.width, box: el.box })
      }
      // 'control' / 'empty' are never leaves — excluded from the fidelity measure.
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
}

export interface SampleFidelityOptions {
  /** Captured widths to check (default the document's ladder). */
  widths?: number[]
  /** Per-axis tolerance in px (default 2). */
  tolerancePx?: number
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
  let maxDelta = 0

  for (const width of widths) {
    const { leaves } = evaluateLayout(doc, width)
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
        unmatched.push({ text: o.text, width })
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
    const nonTextQueues = new Map<string, EvalBox[]>()
    for (const l of leaves) {
      if (l.kind !== 'image' && l.kind !== 'box') continue
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
  }
}

// ── probe (b): off-sample fidelity ────────────────────────────────────────────

export interface EnvelopeReport {
  pass: boolean
  byWidth: Array<{ width: number; findings: LayoutFinding[] }>
}

/**
 * Probe (b) — evaluate the document at intermediate widths the fold never
 * sampled (default 500 / 900px) and assert the envelope holds: no sibling
 * overlap, no horizontal clip. Catches interpolation / snap brackets that
 * degrade between captured widths.
 */
export function offSampleProbe(
  doc: L1Document,
  options: { widths?: number[] } = {},
): EnvelopeReport {
  const widths = options.widths ?? [500, 900]
  const byWidth = widths.map((width) => ({ width, findings: evaluateLayout(doc, width).findings }))
  return { pass: byWidth.every((w) => w.findings.length === 0), byWidth }
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
  options: { scale?: number; widths?: number[] } = {},
): EnvelopeReport {
  const scale = options.scale ?? 2.5
  const widths = options.widths ?? doc.widths
  const byWidth = widths.map((width) => ({
    width,
    findings: evaluateLayout(doc, width, { contentScale: scale }).findings,
  }))
  return { pass: byWidth.every((w) => w.findings.length === 0), byWidth }
}

// ── the 3-probe gate ──────────────────────────────────────────────────────────

export interface ThreeProbeReport {
  pass: boolean
  sampleFidelity: SampleFidelityReport
  offSample: EnvelopeReport
  contentRobustness: EnvelopeReport
}

export interface ThreeProbeOptions {
  fidelity?: SampleFidelityOptions
  offSampleWidths?: number[]
  contentScale?: number
  /**
   * The structure-recovered document for the envelope probes (off-sample +
   * content-robustness). Defaults to `doc`. This is the **absolute-base /
   * structure-overlay** split: fidelity is a property of the absolute base (it
   * reproduces the oracle), while the envelope probes measure the recovered
   * overlay — pass `promoteToFlow(base).doc` here when the base needed recovery.
   */
  recovered?: L1Document
}

/**
 * Run all three acceptance probes against a reproduced document + its oracle.
 * Fidelity is measured on the absolute base `doc`; the envelope probes are
 * measured on `options.recovered ?? doc`. The gate passes only when every probe
 * passes; each residual a sub-report carries names a framework gap to feed back.
 */
export function threeProbeGate(
  doc: L1Document,
  oracle: OracleSource,
  options: ThreeProbeOptions = {},
): ThreeProbeReport {
  const recovered = options.recovered ?? doc
  const sampleFidelity = sampleFidelityProbe(doc, oracle, options.fidelity)
  const offSample = offSampleProbe(recovered, { widths: options.offSampleWidths })
  const contentRobustness = contentRobustnessProbe(recovered, { scale: options.contentScale })
  return {
    pass: sampleFidelity.pass && offSample.pass && contentRobustness.pass,
    sampleFidelity,
    offSample,
    contentRobustness,
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
export function promoteToFlow(doc: L1Document, options: { scale?: number } = {}): PromoteResult {
  const scale = options.scale ?? 2.5
  const promoted: string[] = []
  const widest = Math.max(...doc.widths)

  // Perturbed overlap pairs across every captured width, computed once. Each pair
  // is a (leafPathA, leafPathB) that collide when content grows by `scale`.
  const overlapPairs: Array<[string, string]> = []
  for (const width of doc.widths) {
    for (const f of evaluateLayout(doc, width, { contentScale: scale }).findings) {
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

    const rebuilt = (kids: L1Node[]): L1Node =>
      node.kind === 'container' ? { ...node, layout: 'stack', children: kids } : { ...node, children: kids }

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
