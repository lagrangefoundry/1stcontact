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

// ── geometry & box helpers ────────────────────────────────────────────────────

/** A rendered box in document coordinates. */
export interface EvalBox {
  x: number
  y: number
  width: number
  height: number
}

/** One evaluated leaf (text / image / slot) at a given width. */
export interface EvalLeaf {
  /** Index path from the root (`0.2.1`), stable across a single evaluation. */
  path: string
  kind: L1Node['kind']
  text?: string
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
    if (width >= a.at && width <= b.at) {
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
      ctx.leaves.push({ path, kind: 'text', text: node.text, box, pinned })
      return box.height
    }
    case 'image': {
      if (pinned && node.geometry!.keyframes[0].height !== undefined) {
        box.height = evalGeometry(node.geometry!, width).height * opts.contentScale
      }
      ctx.leaves.push({ path, kind: 'image', box, pinned })
      return box.height
    }
    case 'slot': {
      ctx.leaves.push({ path, kind: 'slot', box, pinned })
      return box.height
    }
    case 'box':
    case 'container': {
      const children = node.kind === 'container' ? node.children : (node.children ?? [])
      const gap = node.kind === 'container' ? (node.gapPx ?? 0) : 0
      const row = node.kind === 'container' && node.layout === 'row'

      // Out-of-flow (pinned) children float independently; in-flow children stack.
      const flowChildren: L1Node[] = []
      children.forEach((child, i) => {
        if (isPinned(child)) layout(child, { ...box }, `${path}.${i}`, ctx)
        else flowChildren.push(child)
      })

      let cursorX = box.x
      let cursorY = box.y
      let maxChildBottom = box.y
      let maxChildRight = box.x
      flowChildren.forEach((child) => {
        const idx = children.indexOf(child)
        const childFrame: EvalBox = { x: cursorX, y: cursorY, width: box.width, height: 0 }
        const h = layout(child, childFrame, `${path}.${idx}`, ctx)
        if (row) {
          cursorX += box.width + gap
          maxChildBottom = Math.max(maxChildBottom, cursorY + h)
        } else {
          cursorY += h + gap
          maxChildBottom = Math.max(maxChildBottom, cursorY - gap)
        }
        maxChildRight = Math.max(maxChildRight, childFrame.x + box.width)
      })

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
  // placeholders (Phase-D seams) and are excluded from overlap.
  const solid = ctx.leaves.filter((l) => l.kind !== 'slot' && l.box.height > 0 && l.box.width > 0)
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

/** One oracle sample: a text run's captured box at a captured width. */
export interface OracleBox {
  text: string
  width: number
  box: EvalBox
}

/**
 * Project the retained multi-viewport oracle into a flat `(text, width) → box`
 * table. Accepts the `multistate.json` shape (`{ projections: [{ viewport,
 * manifest: { elements: [{ text, box }] } }] }`) structurally, so the probe does
 * not depend on the capture package's concrete types.
 */
export interface OracleSource {
  projections: Array<{
    viewport: { width: number }
    state?: string
    manifest: { elements: Array<{ text?: string; textless?: boolean; box?: EvalBox }> }
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
      if (el.textless || !el.text || !el.box || el.text.trim() === '') continue
      out.push({ text: el.text, width: p.viewport.width, box: el.box })
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
    const byText = new Map<string, EvalBox>()
    for (const l of leaves) if (l.kind === 'text' && l.text) byText.set(normText(l.text), l.box)
    for (const o of table.filter((t) => t.width === width)) {
      const got = byText.get(normText(o.text))
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

/** Collect index paths of a node's direct-child sibling groups that overlap under perturbation. */
function failingSiblingGroups(doc: L1Document, scale: number): Set<string> {
  // Evaluate perturbed at every captured width; collect the paths in every
  // overlap finding. A path like `0.3` means child 3 of the root.
  const failing = new Set<string>()
  for (const width of doc.widths) {
    const { findings } = evaluateLayout(doc, width, { contentScale: scale })
    for (const f of findings) {
      if (f.kind === 'overlap') for (const p of f.paths) failing.add(p)
    }
  }
  return failing
}

/** Bounding keyframes (per captured width) for a group of pinned children. */
function groupKeyframes(
  children: L1Node[],
  widths: number[],
): L1Geometry['keyframes'] {
  return widths.map((at) => {
    let minX = Infinity
    let minY = Infinity
    let maxRight = -Infinity
    for (const c of children) {
      if (!isPinned(c)) continue
      const b = evalGeometry(c.geometry!, at)
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxRight = Math.max(maxRight, b.x + b.width)
    }
    return { at, x: Math.round(minX), y: Math.round(minY), width: Math.round(maxRight - minX) }
  })
}

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

export interface PromoteResult {
  doc: L1Document
  /** Paths of the parent nodes whose pinned children were promoted to flow. */
  promoted: string[]
}

/**
 * Demand-driven structure recovery: wrap **only** the pinned sibling groups that
 * fail content-robustness into flow `stack` containers, pinning the region origin
 * (so the region stays where the capture put it) while flowing the interior (so
 * growing content reflows instead of overrunning). Regions that already survive
 * perturbation are left absolute — the recovery is applied where the probe
 * demands it, not everywhere.
 *
 * The container's per-width origin/width is the group's bounding envelope; its
 * children keep their axes but lose their geometry (they now flow, filling the
 * container width). Returns a validated document.
 */
export function promoteToFlow(doc: L1Document, options: { scale?: number } = {}): PromoteResult {
  const scale = options.scale ?? 2.5
  const failing = failingSiblingGroups(doc, scale)
  const promoted: string[] = []
  const widest = Math.max(...doc.widths)

  function rewrite(node: L1Node, path: string): L1Node {
    if (node.kind !== 'box' && node.kind !== 'container') return node
    const children: L1Node[] = (node.kind === 'container' ? node.children : node.children ?? []).map(
      (c, i) => rewrite(c, `${path}.${i}`),
    )

    // Which direct children of this node are flagged failing and pinned-text?
    const flaggedIdx = children
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => failing.has(`${path}.${i}`) && c.kind === 'text' && isPinned(c))
      .map(({ i }) => i)

    if (flaggedIdx.length >= 2) {
      const group = flaggedIdx
        .map((i) => children[i])
        .sort((a, b) => evalGeometry(a.geometry!, widest).y - evalGeometry(b.geometry!, widest).y)
      const container: L1Node = {
        kind: 'container',
        layout: 'stack',
        gapPx: medianGap(group, widest),
        geometry: { keyframes: groupKeyframes(group, doc.widths) },
        children: group.map((c) => {
          // Drop geometry (now in flow); keep axes/text. A `<p>` fills its
          // container's width naturally, so no `sizing` is needed (and `text`
          // carries none).
          const { geometry: _drop, ...rest } = c as Extract<L1Node, { kind: 'text' }>
          return rest
        }),
      }
      // Rebuild the child list: the container takes the first flagged slot; the
      // other flagged children are absorbed into it; non-flagged children keep
      // their positions.
      const firstSlot = Math.min(...flaggedIdx)
      const next: L1Node[] = []
      children.forEach((c, i) => {
        if (i === firstSlot) next.push(container)
        else if (!flaggedIdx.includes(i)) next.push(c)
      })
      promoted.push(path)
      return node.kind === 'container'
        ? { ...node, children: next }
        : { ...node, children: next }
    }

    return node.kind === 'container' ? { ...node, children } : { ...node, children }
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
