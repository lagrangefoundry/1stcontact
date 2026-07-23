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
  isSafeUrl,
  validateL1,
  type L1BlendMode,
  type L1Border,
  type L1Box,
  type L1BoxAxes,
  type L1Document,
  type L1FontFace,
  type L1Geometry,
  type L1Gradient,
  type L1GradientStop,
  type L1Image,
  type L1ImageAxes,
  type L1Keyframe,
  type L1Node,
  type L1Segment,
  type L1Shadow,
  type L1TextAxes,
} from '@1stcontact/site-schema'
import { buildResponsiveTable, type LabelledProjection } from '../cli/responsive-diff'
import {
  colorToHex,
  type MultiStateCapture,
  type SectionValues,
  type StateProjection,
  type ValueElement,
} from '../cli/capture'

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
 * A captured computed shadow string → the L1 structured shadow (REQ-92). Chrome
 * emits `[inset] <color> <offX>px <offY>px [<blur>px] [<spread>px]` (colour first);
 * we tolerate either colour position by pulling the colour token out and reading
 * the remaining px lengths positionally. Only the first shadow layer of a comma
 * list is folded; `none`/unparseable → undefined. `spread`/`inset` apply to a box
 * shadow; a text shadow passes neither.
 */
function foldShadow(
  css: string | null | undefined,
  opts: { spread: boolean; inset: boolean },
): L1Shadow | undefined {
  if (!css || /^none$/i.test(css.trim())) return undefined
  const first = css.split(/,(?![^(]*\))/)[0].trim() // first layer, not splitting inside rgb(...)
  const inset = opts.inset && /\binset\b/i.test(first)
  const colorTok = first.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/)
  const hex = colorTok ? colorToHex(colorTok[0]) : null
  if (!hex) return undefined
  let rest = colorTok ? first.replace(colorTok[0], ' ') : first
  rest = rest.replace(/\binset\b/i, ' ')
  const nums = (rest.match(/-?\d*\.?\d+px/g) ?? []).map((n) => parseFloat(n))
  if (nums.length < 2 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1])) return undefined
  const shadow: L1Shadow = { offsetXPx: nums[0], offsetYPx: nums[1], color: hex }
  if (nums.length >= 3 && Number.isFinite(nums[2]) && nums[2] >= 0) shadow.blurPx = nums[2]
  if (opts.spread && nums.length >= 4 && Number.isFinite(nums[3])) shadow.spreadPx = nums[3]
  if (inset) shadow.inset = true
  return shadow
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
/** A captured box-border treatment → the L1 structured border, else undefined. */
function foldBorder(b: ValueElement['border']): L1Border | undefined {
  if (!b || !(b.widthPx > 0)) return undefined
  const color = colorToHex(b.color)
  if (!color) return undefined
  const border: L1Border = { widthPx: b.widthPx, color }
  if (b.style && BORDER_STYLES.has(b.style)) border.style = b.style as L1Border['style']
  return border
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
 * Id prefix of a **synthesized backing surface** (BUG-11): the `box` leaf the
 * fold reconstructs *behind* a text run whose composited panel/card fill would
 * otherwise vanish. It is not a captured element — its source element classifies
 * as `text` and is measured through the run's own text leaf — so it has **no
 * oracle counterpart** and must never enter the gate's non-text pairing queue
 * (doing so mispairs every real `box-*` leaf and reports phantom fidelity
 * deltas). {@link isSynthesizedSurfaceId} is the single place that knows this.
 */
export const SYNTHESIZED_SURFACE_ID_PREFIX = 'surface-'

/** True for a fold-synthesized backing surface — see {@link SYNTHESIZED_SURFACE_ID_PREFIX}. */
export function isSynthesizedSurfaceId(id: string | undefined): boolean {
  return id !== undefined && id.startsWith(SYNTHESIZED_SURFACE_ID_PREFIX)
}

/** A text-free element that carries media substance (an `<img>`): it becomes an `image` leaf. */
function isMediaElement(el: FoldableElement): boolean {
  return el.objectFit != null || el.intrinsicAspect != null || el.a11yRole === 'img'
}

/** A text-free element that paints a surface (a divider / decorative panel): a `box` leaf. */
function paintsSurface(el: FoldableElement): boolean {
  return Boolean(
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
 * Decide the L1 leaf kind an element folds to. `text` (styled run), `image`
 * (media), `box` (standalone painted surface), `control` (a form control — a
 * behavior-module seam, never a raw leaf), `unknown` (a text-free element with
 * no recognised substance), or `empty` (an empty-string run). Ignores
 * geometry/src availability, which the fold gates separately.
 */
export function classifyElement(el: FoldableElement): FoldLeafKind {
  if (!el.textless) return (el.text ?? '').trim() !== '' ? 'text' : 'empty'
  if (isMediaElement(el)) return 'image'
  if (el.a11yRole && FORM_CONTROL_ROLES.has(el.a11yRole)) return 'control'
  if (paintsSurface(el)) return 'box'
  return 'unknown' // not measured — a residual, not a leaf
}

/** Map a captured textless surface element's axes onto the typed L1 box-axis subset. */
function boxAxes(el: ValueElement): L1BoxAxes {
  const axes: L1BoxAxes = {}
  const fill = el.surfaceFill ? colorToHex(el.surfaceFill) : null
  if (fill) axes.surfaceFill = fill
  const grad = foldGradient(el.surfaceGradient)
  if (grad) axes.surfaceGradient = grad
  if (el.borderRadiusPx !== undefined && el.borderRadiusPx > 0) axes.borderRadiusPx = Math.round(el.borderRadiusPx)
  if (el.opacity !== undefined && el.opacity < 1) axes.opacity = el.opacity
  const border = foldBorder(el.border)
  if (border) axes.border = border
  const shadow = foldShadow(el.boxShadow, { spread: true, inset: true })
  if (shadow) axes.boxShadow = shadow
  const blur = foldBackdropBlur(el.backdropFilter)
  if (blur !== undefined) axes.backdropBlurPx = blur
  const blend = foldBlendMode(el.blendMode)
  if (blend) axes.blendMode = blend
  return axes
}

/** Map a captured media element's axes onto the typed L1 image-axis subset. */
function imageAxes(el: ValueElement): L1ImageAxes {
  const axes: L1ImageAxes = {}
  const fit = foldObjectFit(el.objectFit)
  if (fit) axes.objectFit = fit
  if (el.borderRadiusPx !== undefined && el.borderRadiusPx > 0) axes.borderRadiusPx = Math.round(el.borderRadiusPx)
  if (el.opacity !== undefined && el.opacity < 1) axes.opacity = el.opacity
  const blend = foldBlendMode(el.blendMode)
  if (blend) axes.blendMode = blend
  const border = foldBorder(el.border)
  if (border) axes.border = border
  const shadow = foldShadow(el.boxShadow, { spread: true, inset: true })
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
 */
function foldSectionBackgrounds(projections: StateProjection[], widths: number[]): L1Box[] {
  // section ordinal → its (width, values) samples across the ladder
  const byIndex = new Map<number, Array<{ width: number; sv: SectionValues }>>()
  for (const p of projections) {
    for (const sv of p.manifest.sections ?? []) {
      if (!sv.backgroundImageUrl || !sv.box) continue
      const arr = byIndex.get(sv.index) ?? []
      arr.push({ width: p.viewport.width, sv })
      byIndex.set(sv.index, arr)
    }
  }
  const nodes: L1Box[] = []
  let idx = 0
  for (const [, entriesRaw] of [...byIndex.entries()].sort((a, b) => a[0] - b[0])) {
    const entries = entriesRaw.sort((a, b) => a.width - b.width)
    const keyframes: L1Keyframe[] = entries.map((e) => ({
      at: e.width,
      x: Math.round(e.sv.box!.x),
      y: Math.round(e.sv.box!.y),
      width: Math.round(e.sv.box!.width),
      height: Math.round(e.sv.box!.height),
    }))
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    // The URL is the band's; the widest present width is authoritative (they agree).
    const url = entries[entries.length - 1].sv.backgroundImageUrl!
    const node: L1Box = { kind: 'box', id: `section-bg-${idx++}`, geometry, axes: { backgroundImageUrl: url } }
    const vis = visibilityFor(entries.map((e) => e.width), widths)
    if (vis) node.visibility = vis
    nodes.push(node)
  }
  return nodes
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
  let imageIdx = 0
  let boxIdx = 0
  // BUG-11 — the surface a text run sits on. The capture attributes the composited
  // card/panel/section fill onto each *run* (`surfaceFill`/`surfaceGradient`), never
  // as a standalone box, so a bare text leaf drops every background. For each run
  // carrying a surface we build a backing `box` (the run's geometry + the fill), and
  // tally solid fills so the dominant one becomes the page band (`doc.background`).
  // The band is painted by the body, so a backing box is emitted only for surfaces
  // that *differ* from it — the genuine panels/cards — keeping node count down.
  const pendingSurfaces: Array<{ fill?: string; node: L1Box }> = []
  const fillCounts = new Map<string, number>()
  for (const row of table.rows) {
    const present = row.cells.filter((c) => c.element)
    const sample = present[0]?.element
    if (!sample) continue // a truly empty row — nothing was captured, nothing to signal
    const presentWidths = present.map((c) => c.width)

    // Keyframes: one per present cell that carries a box, ascending by width. A
    // box/image leaf pins all four sides (height too); a text leaf's height is
    // natural (from flow), so its keyframes omit height (the text path below).
    const framed = row.cells.filter((c) => c.element?.box)
    const buildGeometry = (withHeight: boolean): L1Geometry => {
      const keyframes = framed.map((c) => {
        const box = c.element!.box!
        const kf: L1Keyframe = { at: c.width, x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width) }
        if (withHeight && Number.isFinite(box.height)) kf.height = Math.round(box.height)
        return kf
      })
      const geometry: L1Geometry = { keyframes }
      if (keyframes.length > 1) {
        geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
      }
      return geometry
    }
    const widest = (framed[framed.length - 1] ?? present[present.length - 1]).element!
    const vis = framed.length ? visibilityFor(framed.map((c) => c.width), widths) : undefined

    // ── Text leaf (the round-trip oracle compares text axes) ───────────────────
    if (!sample.textless && sample.text.trim() !== '') {
      if (framed.length === 0) {
        signal(sample, 'text run has no geometry (no box at any sampled width)', presentWidths)
        continue
      }
      const node: Extract<L1Node, { kind: 'text' }> = {
        kind: 'text',
        text: widest.text,
        axes: textAxes(widest),
        geometry: buildGeometry(false),
      }
      if (vis) node.visibility = vis
      children.push(node)

      // BUG-11 — reconstruct the surface this run sits on (behind the run) so
      // panel/card and section fills render. A box leaf carries its own geometry
      // (the run's box, with height) and the composited fill/gradient.
      const surfFill = (widest.surfaceFill ? colorToHex(widest.surfaceFill) : null) ?? undefined
      const surfGrad = foldGradient(widest.surfaceGradient)
      if (surfFill) fillCounts.set(surfFill, (fillCounts.get(surfFill) ?? 0) + 1)
      if (surfFill || surfGrad) {
        const axes: L1BoxAxes = {}
        if (surfFill) axes.surfaceFill = surfFill
        if (surfGrad) axes.surfaceGradient = surfGrad
        // Id is assigned after the band filter below, so surviving surfaces are
        // numbered contiguously (the id is the pairing/debug handle).
        const boxNode: L1Box = { kind: 'box', geometry: buildGeometry(true), axes }
        if (vis) boxNode.visibility = vis
        pendingSurfaces.push({ fill: surfFill, node: boxNode })
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
      children.push(node)
      continue
    }

    // Form controls (inputs, buttons, Turnstile) belong to a behavior module
    // (contact-form), not a raw L1 leaf (DOC-25/26) — signal, do not synthesize.
    if (sample.a11yRole && FORM_CONTROL_ROLES.has(sample.a11yRole)) {
      signal(sample, 'form control belongs to a behavior module (contact-form), not a raw L1 leaf', presentWidths)
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
      const node: L1Box = { kind: 'box', id: `box-${boxIdx++}`, geometry: buildGeometry(true) }
      if (Object.keys(axes).length) node.axes = axes
      if (vis) node.visibility = vis
      children.push(node)
      continue
    }

    signal(sample, 'text-free element is neither media, a painted surface, nor a known control — no L1 leaf yet', presentWidths)
  }

  // BUG-11 — the page band is the solid fill the most runs sit on; it paints via
  // the document body (`doc.background`). Backing boxes are then emitted only for
  // surfaces that differ from the band (or carry a gradient the body can't paint),
  // and are placed *first* so every content leaf paints over its surface.
  let band: string | undefined
  let bandCount = 0
  for (const [hex, n] of fillCounts) {
    if (n > bandCount) {
      bandCount = n
      band = hex
    }
  }
  const surfaceNodes = pendingSurfaces
    .filter((s) => s.node.axes?.surfaceGradient !== undefined || s.fill !== band)
    .map((s, i) => {
      s.node.id = `${SYNTHESIZED_SURFACE_ID_PREFIX}${i}`
      return s.node
    })

  // BUG-13 — section/band background images paint beneath everything: the page
  // band (`doc.background`), then section-background boxes, then panel/card
  // surfaces, then the content leaves.
  const sectionBgNodes = foldSectionBackgrounds(projections, widths)

  const root: L1Box = { kind: 'box', children: [...sectionBgNodes, ...surfaceNodes, ...children] }
  const doc: L1Document = { widths, root }
  if (band) doc.background = band

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
