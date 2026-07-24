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
  L1_ENVELOPE,
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
  type L1Padding,
  type L1ScalarKeyframe,
  type L1Segment,
  type L1Shadow,
  type L1TextAxes,
  type L1TextResponsive,
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

const PADDING_MAX = 10_000
/**
 * BUG-17 — a captured element's per-side padding → the L1 `padding` axis. The
 * capture reads `getBoundingClientRect` (a border-box that already *includes*
 * padding), so the leaf's geometry width/height carry the pad; folding it here
 * (with the renderer's `box-sizing: border-box`) insets the content inside that
 * pinned box — giving badges/buttons their pill shape and click target — instead
 * of inflating geometry. Zero / absent / out-of-range sides are dropped; an
 * all-zero padding yields `undefined` (no axis emitted).
 */
function foldPadding(el: ValueElement): L1Padding | undefined {
  const side = (v: number | undefined): number | undefined =>
    v !== undefined && Number.isFinite(v) && v > 0 ? clamp(Math.round(v), 0, PADDING_MAX) : undefined
  const pad: L1Padding = {}
  const top = side(el.paddingTopPx)
  const right = side(el.paddingRightPx)
  const bottom = side(el.paddingBottomPx)
  const left = side(el.paddingLeftPx)
  if (top !== undefined) pad.topPx = top
  if (right !== undefined) pad.rightPx = right
  if (bottom !== undefined) pad.bottomPx = bottom
  if (left !== undefined) pad.leftPx = left
  return Object.keys(pad).length ? pad : undefined
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
 * BUG-18 — the numeric type axes keyframed per captured width. Each reads its
 * value the SAME way {@link textAxes} rounds its scalar (so the widest keyframe
 * equals `axes.<name>`), and interpolates fluidly between captured widths.
 */
const RESPONSIVE_TEXT_AXES = {
  fontSizePx: (v: number) => clamp(Math.round(v), FONT_SIZE.min, FONT_SIZE.max),
  lineHeightPx: (v: number) => Math.round(v),
  letterSpacingPx: (v: number) => Math.round(v * 100) / 100,
} as const

/**
 * BUG-18 — per-width responsive tracks for the numeric type axes that actually
 * vary across the sampled ladder. The fold previously took a text run's axes from
 * the widest cell only, so `fontSizePx` (etc.) was one desktop value applied at
 * every width — text rendered oversized at mobile. Here each framed cell
 * contributes a keyframe; an axis whose value is identical across the ladder stays
 * single-valued (no track — static axes are not bloated into tracks), while one
 * that varies becomes a keyframe track the renderer emits per width. Segments are
 * omitted (default `interpolate`), mirroring geometry's fluid default.
 */
function responsiveTextTracks(
  framed: Array<{ width: number; element: ValueElement }>,
): L1TextResponsive | undefined {
  const out: L1TextResponsive = {}
  for (const [axis, round] of Object.entries(RESPONSIVE_TEXT_AXES) as Array<
    [keyof typeof RESPONSIVE_TEXT_AXES, (v: number) => number]
  >) {
    const keyframes: L1ScalarKeyframe[] = []
    for (const c of framed) {
      const raw = c.element[axis]
      if (raw === undefined || raw === null || !Number.isFinite(raw)) continue
      keyframes.push({ at: c.width, value: round(raw as number) })
    }
    // A track earns its place only when ≥2 widths carry the axis AND it varies —
    // a single value across the ladder stays a scalar in `axes`.
    if (keyframes.length < 2 || keyframes.every((k) => k.value === keyframes[0].value)) continue
    out[axis] = { keyframes }
  }
  return Object.keys(out).length ? out : undefined
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
 * Id prefixes of a **synthesized backing surface** (BUG-14): the `box` leaves the
 * fold reconstructs *behind* the text runs whose composited section/card fill
 * would otherwise vanish — the full-bleed section bands, the section background
 * images, and the cards. None is a captured element: each one's source elements
 * classify as `text` and are measured through their own text leaves, so they have
 * **no oracle counterpart** and must never enter the gate's non-text pairing queue
 * (doing so mispairs every real `box-*` leaf and reports phantom fidelity
 * deltas). {@link isSynthesizedSurfaceId} is the single place that knows this.
 */
export const SYNTHESIZED_SURFACE_ID_PREFIXES = ['section-band-', 'section-bg-', 'card-'] as const

/** True for a fold-synthesized backing surface — see {@link SYNTHESIZED_SURFACE_ID_PREFIXES}. */
export function isSynthesizedSurfaceId(id: string | undefined): boolean {
  return id !== undefined && SYNTHESIZED_SURFACE_ID_PREFIXES.some((p) => id.startsWith(p))
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

/**
 * BUG-20 — is this run a **self-painting chip** (a pill badge)? The capture reads
 * `borderRadiusPx` / `boxShadow` / `border` from the element's OWN computed style,
 * unlike `surfaceFill` / `surfaceGradient` / `borderLeft`, which walk ancestors to
 * find the enclosing card. So an own radius belongs to the run's own element —
 * but that alone does not make it a chip: a single-run *card* also paints a modest
 * rounding on itself (BUG-14).
 *
 * The discriminator is **pill saturation**: a radius that reaches half the run's
 * painted height is fully-rounded, which is what a badge is and what a card never
 * is. Such a run's element *is* the surface (a `rounded-full` "Coming soon"
 * badge, a tag pill), so it folds to a text leaf carrying its own surface and
 * contributes no card row — it paints itself. Everything else stays a card row and
 * keeps BUG-14's section-band → card → text reconstruction untouched.
 */
function isChipRun(el: ValueElement): boolean {
  const h = el.box?.height ?? 0
  return h > 0 && (el.borderRadiusPx ?? 0) * 2 >= h - 1
}

/**
 * BUG-20 — the chip surface a self-painting run carries on its own text leaf.
 * A pill's authored radius is often a saturating sentinel (`rounded-full` computes
 * to 33554400px); it is clamped into the L1 envelope's length range, which renders
 * identically (any radius ≥ half the height paints the same pill).
 */
function chipAxes(el: ValueElement): Pick<L1TextAxes, 'surfaceFill' | 'borderRadiusPx' | 'boxShadow' | 'border'> {
  const axes: Pick<L1TextAxes, 'surfaceFill' | 'borderRadiusPx' | 'boxShadow' | 'border'> = {}
  const fill = el.surfaceFill ? colorToHex(el.surfaceFill) : null
  if (fill) axes.surfaceFill = fill
  if (el.borderRadiusPx !== undefined && el.borderRadiusPx > 0) {
    axes.borderRadiusPx = Math.min(Math.round(el.borderRadiusPx), L1_ENVELOPE.lengthPx.max)
  }
  const shadow = foldShadow(el.boxShadow, { spread: true, inset: true })
  if (shadow) axes.boxShadow = shadow
  const border = foldBorder(el.border)
  if (border) axes.border = border
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
 * BUG-14 — the surface a captured text run sits on, plus its per-width geometry.
 * The capture attributes the composited card/panel/section fill and the card
 * treatments (`borderLeft` accent, uniform `border`, `boxShadow`, radius) onto
 * each *run* (never as a standalone box). We collect one of these per surface-
 * bearing run, then rebuild the **section-band → card → text** hierarchy from them
 * (`buildSolidBands` + `buildCards`) instead of emitting a rectangle per run.
 */
interface SurfaceRow {
  fill?: string
  gradient?: L1Gradient
  borderLeft?: L1Border
  border?: L1Border
  boxShadow?: L1Shadow
  borderRadiusPx?: number
  /** Per-width run box (has height), ascending by width. */
  frames: Array<{ at: number; box: NonNullable<ValueElement['box']> }>
  /** The run's box at the widest present width — the grouping/classification frame. */
  widest: NonNullable<ValueElement['box']>
}

/** A captured asymmetric left-accent border (a card rule) → the L1 `borderLeft` axis. */
function foldBorderLeftAxis(bl: ValueElement['borderLeft']): L1Border | undefined {
  if (!bl || !(bl.widthPx > 0)) return undefined
  const color = colorToHex(bl.color)
  if (!color) return undefined
  return { widthPx: bl.widthPx, color }
}

/** Whether a surface row carries any card treatment (so it is a card, never a plain band). */
function hasCardTreatment(r: SurfaceRow): boolean {
  return Boolean(
    r.borderLeft || r.border || r.boxShadow || (r.borderRadiusPx && r.borderRadiusPx > 0) || r.gradient,
  )
}

/** Count of distinct treatments present — the representative-row tiebreak for a card. */
function treatmentScore(r: SurfaceRow): number {
  let n = 0
  if (r.fill) n++
  if (r.gradient) n++
  if (r.borderLeft) n++
  if (r.border) n++
  if (r.boxShadow) n++
  if (r.borderRadiusPx && r.borderRadiusPx > 0) n++
  return n
}

/** A stable identity for a card surface — two rows with the same signature can be one card. */
function surfaceSignature(r: SurfaceRow): string {
  const g = r.gradient ? `${r.gradient.angleDeg ?? ''}:${r.gradient.stops.map((s) => `${s.color}@${s.position ?? ''}`).join(',')}` : ''
  const bl = r.borderLeft ? `${r.borderLeft.widthPx}/${r.borderLeft.color}` : ''
  const bd = r.border ? `${r.border.widthPx}/${r.border.color}` : ''
  const sh = r.boxShadow ? `${r.boxShadow.offsetXPx},${r.boxShadow.offsetYPx},${r.boxShadow.blurPx ?? 0},${r.boxShadow.color}` : ''
  const rad = r.borderRadiusPx && r.borderRadiusPx > 0 ? Math.round(r.borderRadiusPx) : ''
  return `${r.fill ?? ''}|${g}|${bl}|${bd}|${sh}|${rad}`
}

type Rect = NonNullable<ValueElement['box']>
const xOverlap = (a: Rect, b: Rect): boolean =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0
const vGap = (a: Rect, b: Rect): number => {
  const iy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return iy >= 0 ? 0 : -iy
}

/** A card's internal padding, inferred from the vertical rhythm of its runs (data-driven, clamped). */
function cardPadding(rows: SurfaceRow[]): number {
  if (rows.length < 2) return clamp(Math.round(0.5 * rows[0].widest.height), 8, 28)
  const tops = rows.map((r) => r.widest.y).sort((a, b) => a - b)
  const gaps: number[] = []
  for (let i = 1; i < tops.length; i++) gaps.push(tops[i] - tops[i - 1])
  gaps.sort((a, b) => a - b)
  const med = gaps[Math.floor(gaps.length / 2)] || 16
  return clamp(Math.round(0.4 * med), 8, 28)
}

/** Extra height added below the last band so a trailing band has a visible tail. */
const BAND_TAIL_PAD = 48

/**
 * BUG-19 — detect full-bleed **bar** fills (a footer / nav strip). A bar paints
 * its solid fill edge-to-edge, but its text runs are individually narrow and
 * horizontally *distributed* (space-between: items hug the left and right edges
 * with a large empty gap between), so no single run is full-width and the
 * single-run band rule misses it — each run wrongly becomes a tiny card, exposing
 * the page background across the bar.
 *
 * A fill is a bar when its same-fill, no-treatment runs share a horizontal row
 * whose union spans full content width AND whose largest internal horizontal gap
 * is dominant (the empty bar showing between the edge-hugging items). This
 * distinguishes a distributed bar from an evenly-tiled card grid (small, even
 * gaps — e.g. a Presence/Positivity/Connection tile row), which stays cards.
 */
function barBandFills(rows: SurfaceRow[], pageContentWidth: number, fullWidthFrac: number): Set<string> {
  const FULL = fullWidthFrac * pageContentWidth
  const GAP = 0.2 * pageContentWidth // a bar's central empty stretch dwarfs a grid's inter-tile gap
  const out = new Set<string>()
  const byFill = new Map<string, SurfaceRow[]>()
  for (const r of rows) {
    if (!r.fill || hasCardTreatment(r)) continue
    const g = byFill.get(r.fill)
    if (g) g.push(r)
    else byFill.set(r.fill, [r])
  }
  for (const [fill, group] of byFill) {
    // Cluster same-fill runs into horizontal rows (vertically-overlapping boxes).
    const remaining = group.slice().sort((a, b) => a.widest.y - b.widest.y)
    while (remaining.length) {
      const seed = remaining.shift()!
      const row = [seed]
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (vGap(seed.widest, remaining[i].widest) === 0) {
          row.push(remaining[i])
          remaining.splice(i, 1)
        }
      }
      if (row.length < 2) continue // a lone run is handled by the single-run rule
      const sorted = row.slice().sort((a, b) => a.widest.x - b.widest.x)
      const minX = Math.min(...sorted.map((r) => r.widest.x))
      const maxX = Math.max(...sorted.map((r) => r.widest.x + r.widest.width))
      if (maxX - minX < FULL) continue // not a full-width span → not a bar
      let maxGap = 0
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].widest.x - (sorted[i - 1].widest.x + sorted[i - 1].widest.width)
        if (gap > maxGap) maxGap = gap
      }
      if (maxGap >= GAP) out.add(fill)
    }
  }
  return out
}

/**
 * BUG-14 — full-bleed **section-band** boxes. Band rows (full-width content runs
 * with no card treatment) are grouped into maximal consecutive-same-fill runs in
 * document order; the groups are ordered top-to-bottom and each band **tiles**
 * from its own top to the next band's top, so a band covers its whole section —
 * including any cards that sit on it — rather than hugging just its heading. Each
 * band paints its solid fill full-bleed (`x:0`, `width:viewport`) at every width.
 *
 * REQ-88 — tiling to the next band's first RUN overshoots whenever the next
 * section opens with padding: the hero band swallowed the 96px of cream above
 * "A Different Approach" and painted it near-black. The runs only bound the
 * band's CONTENT; the captured `sections[].box` edges are where the sections
 * actually change. So the bottom is clamped to the first real section edge at or
 * after this band's own content — the boundary is read from the capture instead
 * of guessed from where the next paragraph happens to start.
 */
function buildSolidBands(bandRows: SurfaceRow[], widths: number[], sectionEdges: Map<number, number[]>): L1Box[] {
  const groups: Array<{ fill: string; rows: SurfaceRow[] }> = []
  for (const r of bandRows) {
    if (!r.fill) continue
    const last = groups[groups.length - 1]
    if (last && last.fill === r.fill) last.rows.push(r)
    else groups.push({ fill: r.fill, rows: [r] })
  }
  if (groups.length === 0) return []
  const widestW = Math.max(...widths)
  const topAt = (g: { rows: SurfaceRow[] }, w: number): number | undefined => {
    let t = Infinity
    for (const r of g.rows) {
      const f = r.frames.find((f) => f.at === w)
      if (f) t = Math.min(t, f.box.y)
    }
    return t === Infinity ? undefined : t
  }
  const botAt = (g: { rows: SurfaceRow[] }, w: number): number | undefined => {
    let b = -Infinity
    for (const r of g.rows) {
      const f = r.frames.find((f) => f.at === w)
      if (f) b = Math.max(b, f.box.y + f.box.height)
    }
    return b === -Infinity ? undefined : b
  }
  // Slab order top-to-bottom (fixed across widths by the widest-width top).
  const order = groups
    .map((g, i) => ({ g, i, top: topAt(g, widestW) ?? Infinity }))
    .sort((a, b) => a.top - b.top)
  const boxes: L1Box[] = []
  order.forEach((entry, oi) => {
    const keyframes: L1Keyframe[] = []
    const present: number[] = []
    for (const w of widths) {
      const top = topAt(entry.g, w)
      if (top === undefined) continue
      let bottom: number | undefined
      for (let k = oi + 1; k < order.length; k++) {
        const nt = topAt(order[k].g, w)
        if (nt !== undefined && nt > top) {
          bottom = nt
          break
        }
      }
      if (bottom === undefined) {
        const ob = botAt(entry.g, w)
        bottom = ob !== undefined ? ob + BAND_TAIL_PAD : top
      }
      // Clamp to the first captured section edge at/after this band's own content:
      // the runs bound the content, the section box bounds the SURFACE.
      const contentBottom = botAt(entry.g, w)
      if (contentBottom !== undefined) {
        for (const edge of sectionEdges.get(w) ?? []) {
          if (edge >= contentBottom && edge < bottom) {
            bottom = edge
            break
          }
        }
      }
      keyframes.push({ at: w, x: 0, y: Math.round(top), width: w, height: Math.round(Math.max(0, bottom - top)) })
      present.push(w)
    }
    if (keyframes.length === 0) return
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    const node: L1Box = { kind: 'box', id: `section-band-${oi}`, geometry, axes: { surfaceFill: entry.g.fill } }
    const vis = visibilityFor(present, widths)
    if (vis) node.visibility = vis
    boxes.push(node)
  })
  return boxes
}

/**
 * BUG-14 — **card** boxes. Card rows (a surface distinct from their band, or any
 * card treatment) are grouped by connected component under "same surface signature
 * AND horizontally-overlapping AND vertically-adjacent" — so a card's stacked runs
 * (title / body / checklist), bridged by its full-width body run, coalesce into
 * ONE box, while side-by-side grid columns (disjoint x) stay separate cards and a
 * distinct badge (different fill) becomes its own small box. Each card box is the
 * union of its runs plus inferred padding, carrying the card treatments
 * (`borderLeft` accent, border, shadow, radius). Larger cards paint first so a
 * contained badge lands on top.
 */
function buildCards(cardRows: SurfaceRow[], widths: number[]): L1Box[] {
  const n = cardRows.length
  if (n === 0) return []
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  const sig = cardRows.map(surfaceSignature)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (sig[i] !== sig[j]) continue
      const a = cardRows[i].widest
      const b = cardRows[j].widest
      if (!xOverlap(a, b)) continue
      if (vGap(a, b) <= 2.5 * Math.max(a.height, b.height, 40)) parent[find(i)] = find(j)
    }
  }
  const groups = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    const g = groups.get(r)
    if (g) g.push(i)
    else groups.set(r, [i])
  }
  const boxes: Array<{ node: L1Box; area: number }> = []
  let idx = 0
  for (const members of groups.values()) {
    const rows = members.map((m) => cardRows[m])
    const rep = rows.slice().sort((a, b) => treatmentScore(b) - treatmentScore(a))[0]
    const pad = cardPadding(rows)
    const keyframes: L1Keyframe[] = []
    const present: number[] = []
    for (const w of widths) {
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity,
        any = false
      for (const r of rows) {
        const f = r.frames.find((f) => f.at === w)
        if (!f) continue
        any = true
        x0 = Math.min(x0, f.box.x)
        y0 = Math.min(y0, f.box.y)
        x1 = Math.max(x1, f.box.x + f.box.width)
        y1 = Math.max(y1, f.box.y + f.box.height)
      }
      if (!any) continue
      keyframes.push({
        at: w,
        x: Math.round(x0 - pad),
        y: Math.round(y0 - pad),
        width: Math.round(x1 - x0 + 2 * pad),
        height: Math.round(y1 - y0 + 2 * pad),
      })
      present.push(w)
    }
    if (keyframes.length === 0) continue
    const geometry: L1Geometry = { keyframes }
    if (keyframes.length > 1) {
      geometry.segments = keyframes.slice(1).map((kf, i) => segmentKind(keyframes[i], kf))
    }
    const axes: L1BoxAxes = {}
    if (rep.fill) axes.surfaceFill = rep.fill
    if (rep.gradient) axes.surfaceGradient = rep.gradient
    if (rep.borderLeft) axes.borderLeft = rep.borderLeft
    if (rep.border) axes.border = rep.border
    if (rep.boxShadow) axes.boxShadow = rep.boxShadow
    if (rep.borderRadiusPx && rep.borderRadiusPx > 0) axes.borderRadiusPx = Math.round(rep.borderRadiusPx)
    const node: L1Box = { kind: 'box', id: `card-${idx++}`, geometry, axes }
    const vis = visibilityFor(present, widths)
    if (vis) node.visibility = vis
    const wk = keyframes[keyframes.length - 1]
    boxes.push({ node, area: wk.width * (wk.height ?? 0) })
  }
  // Larger cards first (bottom); a small contained badge paints last (on top).
  return boxes.sort((a, b) => b.area - a.area).map((b) => b.node)
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
  // BUG-14 — the surface each text run sits on, collected per run for the post-loop
  // section-band → card → text reconstruction (replaces BUG-11's per-run backing
  // box, which produced a rectangle behind every paragraph).
  const surfaceRows: SurfaceRow[] = []
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
      // BUG-20 — a self-painting chip (a `rounded-full` badge) carries its own
      // surface on the text leaf; a bare run carries only type axes.
      const chip = isChipRun(widest)
      const node: Extract<L1Node, { kind: 'text' }> = {
        kind: 'text',
        text: widest.text,
        axes: chip ? { ...textAxes(widest), ...chipAxes(widest) } : textAxes(widest),
        geometry: buildGeometry(false),
      }
      // BUG-18 — keyframe the numeric type axes that vary across the ladder, so
      // font-size (etc.) scales per width instead of pinning the desktop value.
      const responsive = responsiveTextTracks(framed.map((c) => ({ width: c.width, element: c.element! })))
      if (responsive) node.responsive = responsive
      if (vis) node.visibility = vis
      const pad = foldPadding(widest)
      if (pad) node.padding = pad
      children.push(node)

      // BUG-20 — a chip paints its own surface on the text leaf above, so it
      // contributes no surface row: emitting one would duplicate the pill as a
      // card box behind the run (and pollute band/card signature detection with
      // the chip's own fill). The enclosing card is defined by its other runs.
      if (chip) continue

      // BUG-14 — record this run's immediate surface (composited fill / gradient +
      // card treatments) with its per-width geometry. No backing box is emitted
      // here; the band/card hierarchy is rebuilt from these rows after the loop.
      const surfFill = (widest.surfaceFill ? colorToHex(widest.surfaceFill) : null) ?? undefined
      const surfGrad = foldGradient(widest.surfaceGradient)
      const surfBorderLeft = foldBorderLeftAxis(widest.borderLeft)
      const surfBorder = foldBorder(widest.border)
      const surfShadow = foldShadow(widest.boxShadow, { spread: true, inset: true })
      const surfRadius = widest.borderRadiusPx
      if (
        widest.box &&
        (surfFill || surfGrad || surfBorderLeft || surfBorder || surfShadow || (surfRadius && surfRadius > 0))
      ) {
        surfaceRows.push({
          fill: surfFill,
          gradient: surfGrad,
          borderLeft: surfBorderLeft,
          border: surfBorder,
          boxShadow: surfShadow,
          borderRadiusPx: surfRadius,
          frames: framed.map((c) => ({ at: c.width, box: c.element!.box! })),
          widest: widest.box,
        })
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
      const pad = foldPadding(widest)
      if (pad) node.padding = pad
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
      const pad = foldPadding(widest)
      if (pad) node.padding = pad
      children.push(node)
      continue
    }

    signal(sample, 'text-free element is neither media, a painted surface, nor a known control — no L1 leaf yet', presentWidths)
  }

  // BUG-14 — rebuild the section-band → card → text hierarchy from the collected
  // surface rows. A row is a *band* row when it is a full-width content run with no
  // card treatment; its fill is a band fill. A row *sits on* its band (emits no
  // box) when it carries a band fill and no treatment. Everything else with a
  // surface is a *card* — grouped into card boxes carrying their treatments.
  const pageContentWidth = Math.max(1, ...surfaceRows.map((r) => r.widest.width))
  const FULL_WIDTH_FRAC = 0.7
  const isFullWidth = (r: SurfaceRow): boolean => r.widest.width >= FULL_WIDTH_FRAC * pageContentWidth
  const bandFills = new Set<string>()
  for (const r of surfaceRows) {
    if (r.fill && isFullWidth(r) && !hasCardTreatment(r)) bandFills.add(r.fill)
  }
  // BUG-19 — full-bleed **bar** fills (footer / nav strip). A bar paints its fill
  // edge-to-edge, but its runs are individually narrow and horizontally
  // *distributed* (space-between), so no single run is full-width and the
  // single-run rule above misses it — each run would wrongly become a tiny card,
  // exposing the page background across the bar. Its members become band rows.
  const barFills = barBandFills(surfaceRows, pageContentWidth, FULL_WIDTH_FRAC)
  const bandRows: SurfaceRow[] = []
  const cardRows: SurfaceRow[] = []
  for (const r of surfaceRows) {
    const isBar = Boolean(r.fill) && !hasCardTreatment(r) && barFills.has(r.fill!)
    const onBand = !hasCardTreatment(r) && Boolean(r.fill) && bandFills.has(r.fill!)
    if (isBar) bandRows.push(r) // BUG-19 — a bar member defines the full-bleed bar band
    else if (onBand && isFullWidth(r)) bandRows.push(r)
    else if (onBand) continue // a narrow run on the band paints nothing of its own
    else if (r.fill || r.gradient || hasCardTreatment(r)) cardRows.push(r)
  }
  // REQ-88 — the captured section boundaries per width: every section box's top
  // and bottom edge, ascending. These are where the page's surfaces actually
  // change, and they bound how far a band may tile past its own content.
  const sectionEdges = new Map<number, number[]>()
  for (const p of projections) {
    const edges = new Set<number>()
    for (const sv of p.manifest.sections ?? []) {
      if (!sv.box) continue
      edges.add(Math.round(sv.box.y))
      edges.add(Math.round(sv.box.y + sv.box.height))
    }
    sectionEdges.set(p.viewport.width, [...edges].sort((a, b) => a - b))
  }
  const bandNodes = buildSolidBands(bandRows, widths, sectionEdges)
  const cardNodes = buildCards(cardRows, widths)

  // The page base is the band fill covering the greatest total height (shows only
  // through gaps between the full-bleed bands).
  const bandHeightByFill = new Map<string, number>()
  for (const b of bandNodes) {
    const fill = b.axes?.surfaceFill
    if (!fill || !b.geometry) continue
    const kf = b.geometry.keyframes[b.geometry.keyframes.length - 1]
    bandHeightByFill.set(fill, (bandHeightByFill.get(fill) ?? 0) + (kf.height ?? 0))
  }
  let band: string | undefined
  let bandExtent = 0
  for (const [fill, h] of bandHeightByFill) {
    if (h > bandExtent) {
      bandExtent = h
      band = fill
    }
  }
  // Fallback when no full-bleed bands were found: the most common run fill.
  if (!band) {
    const counts = new Map<string, number>()
    for (const r of surfaceRows) if (r.fill) counts.set(r.fill, (counts.get(r.fill) ?? 0) + 1)
    let best = 0
    for (const [fill, n] of counts) if (n > best) ((best = n), (band = fill))
  }

  // BUG-13 — section/band background images (the hero). Paint order beneath
  // everything: solid bands, then section-image bands, then cards, then content.
  const sectionBgNodes = foldSectionBackgrounds(projections, widths)

  const root: L1Box = { kind: 'box', children: [...bandNodes, ...sectionBgNodes, ...cardNodes, ...children] }
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
