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
  validateL1,
  type L1Box,
  type L1Document,
  type L1FontFace,
  type L1Gradient,
  type L1GradientStop,
  type L1Node,
  type L1Segment,
  type L1Shadow,
  type L1TextAxes,
} from '@1stcontact/site-schema'
import { buildResponsiveTable, type LabelledProjection } from '../cli/responsive-diff'
import { colorToHex, type MultiStateCapture, type StateProjection, type ValueElement } from '../cli/capture'

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
 */
function usedFontFaces(fonts: L1FontFace[], nodes: L1Node[]): L1FontFace[] {
  const painted = new Set<string>()
  for (const n of nodes) {
    if (n.kind === 'text') painted.add(primaryFamily(n.axes?.fontFamily))
  }
  return fonts.filter((f) => painted.has(primaryFamily(f.family)))
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
 * A captured computed `text-shadow` string → the L1 structured shadow (REQ-92).
 * Chrome emits `<color> <offX>px <offY>px [<blur>px]` (colour first); we tolerate
 * either order by pulling the colour token out and reading the remaining px
 * lengths positionally. Only the first shadow layer of a comma list is folded;
 * `none`/unparseable → undefined. Text-shadow has no spread or inset.
 */
function foldTextShadow(css: string | null | undefined): L1Shadow | undefined {
  if (!css || /^none$/i.test(css.trim())) return undefined
  const first = css.split(/,(?![^(]*\))/)[0].trim() // first layer, not splitting inside rgb(...)
  const colorTok = first.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/)
  const hex = colorTok ? colorToHex(colorTok[0]) : null
  if (!hex) return undefined
  const rest = colorTok ? first.replace(colorTok[0], ' ') : first
  const nums = (rest.match(/-?\d*\.?\d+px/g) ?? []).map((n) => parseFloat(n))
  if (nums.length < 2 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1])) return undefined
  const shadow: L1Shadow = { offsetXPx: nums[0], offsetYPx: nums[1], color: hex }
  if (nums.length >= 3 && Number.isFinite(nums[2]) && nums[2] >= 0) shadow.blurPx = nums[2]
  return shadow
}

/** Best-effort object kind for a residual an element that has no L1 leaf yet (B2). */
function residualKindOf(el: ValueElement): FoldResidual['kind'] {
  if (!el.textless) return 'text'
  if (el.objectFit != null || el.intrinsicAspect != null) return 'image'
  if (el.a11yRole) return 'field'
  return 'box'
}

/** The painted pixel-mover axes present on an element — the residual's substance (B2). */
function capturedAxesOf(el: ValueElement): string[] {
  const axes: string[] = []
  const has = (name: string, v: unknown): void => {
    if (v !== null && v !== undefined && v !== '' && v !== 0) axes.push(name)
  }
  has('objectFit', el.objectFit)
  has('intrinsicAspect', el.intrinsicAspect)
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
function foldGradient(g: ValueElement['gradient']): L1Gradient | undefined {
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
  const out: L1Gradient = { stops }
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

  const residuals = opts.residuals
  const signal = (el: ValueElement, reason: string, presentWidths: number[]): void => {
    residuals?.push({ kind: residualKindOf(el), reason, capturedAxes: capturedAxesOf(el), widths: presentWidths })
  }

  const children: L1Node[] = []
  for (const row of table.rows) {
    const present = row.cells.filter((c) => c.element)
    const sample = present[0]?.element
    if (!sample) continue // a truly empty row — nothing was captured, nothing to signal
    const presentWidths = present.map((c) => c.width)

    // Text-free / empty-text elements (images, form fields, pure-surface panels)
    // have no faithful L1 leaf yet — signal the capability gap, don't drop it (B2).
    if (sample.textless || sample.text.trim() === '') {
      signal(
        sample,
        sample.textless
          ? 'text-free element has no L1 leaf kind yet (image/box/field folding pending)'
          : 'empty text run — no leaf emitted',
        presentWidths,
      )
      continue
    }

    // Keyframes: one per present cell that carries a box, ascending by width.
    const framed = row.cells.filter((c) => c.element?.box)
    if (framed.length === 0) {
      signal(sample, 'text run has no geometry (no box at any sampled width)', presentWidths)
      continue
    }
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
