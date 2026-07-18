/**
 * REQ-31 — the fidelity verification loop's mechanical half.
 *
 * Reproduction (REQ-20) drifts at the *value* level — exact colours, font
 * sizes, gradient direction, left-bar treatments — and screenshots hide exactly
 * that class of delta (near-neighbour golds, 72px vs 48px, horizontal vs
 * vertical sweep). This module turns "a value you could just read off the DOM"
 * from missed-by-eye into mechanically-flagged.
 *
 * Two pure pieces, both browser-free and therefore deterministically testable:
 *
 *   1. {@link flattenCapture} / {@link flattenSignals} — project a capture
 *      bundle (the reference) or a live extraction (our reproduction) into a
 *      flat {@link ValueManifest}: one {@link ValueElement} per verbatim text
 *      run, carrying its resolved styling, plus a {@link SectionValues} per
 *      section for treatments a text run can't hold (a hero scrim, where the
 *      content sits vertically). Text is captured verbatim (DOC-13 §5), so the
 *      run text is the natural join key; sections join by ordinal index.
 *   2. {@link diffManifests} — align expected↔actual by case-folded text and
 *      diff each field, including the *verbatim* text (casing is normalized away
 *      in the join key but is itself a captured value, so "Gigabyte Alchemy" vs
 *      "GIGABYTE ALCHEMY" is flagged), emitting a severity-ranked
 *      {@link ValueDelta} list. Vision is then reserved for what a manifest
 *      can't encode ("does the gradient read intentional"), not for reading a
 *      hex or spotting a casing slip.
 */
import type {
  Arrangement,
  BorderTreatment,
  Box,
  Capture,
  ContentRun,
  Field,
  GradientStop,
  InteractionState,
  NameSource,
  RenderEngine,
  TextGradient,
  ThemeSubScale,
  ThemeSubScales,
  Viewport,
} from './types'
import type { RawRun, RawSignals } from './extract'
import { subScalesFromSignals } from './theme'

// ── manifest model ───────────────────────────────────────────────────────────

/** One text run projected to its comparable value fields (REQ-31). */
export interface ValueElement {
  /** Verbatim text (display form; the join key is its normalized version). */
  text: string
  role: string
  color: string
  fontFamily: string
  fontSizePx: number
  fontWeight: number
  lineHeightPx?: number
  letterSpacingPx?: number
  gradient?: TextGradient | null
  borderLeft?: BorderTreatment | null
  paddingLeftPx?: number
  /** REQ-64 — the other three padding sides + normalized text-align. Type-A
   *  (authored) axes that were invisible: a wrong card top/right/bottom pad or a
   *  centred-vs-left run only showed up indirectly as `size`/`position` drift. */
  paddingTopPx?: number
  paddingRightPx?: number
  paddingBottomPx?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  /** REQ-58 (item 3b) — card/panel fill `#rrggbb` behind the run (null on the
   *  band). Compared like `color` (ΔE) so a slightly-off panel colour surfaces. */
  surfaceFill?: string | null
  /** REQ-62 — card/panel GRADIENT fill behind the run (null when the surface is a
   *  solid or the run is on the band). Distinct from `surfaceFill` (the composited
   *  solid): a gradient panel is a `background-image` the solid composite skips
   *  past. Compared like the text-fill `gradient` axis (stops + direction). */
  surfaceGradient?: TextGradient | null
  /**
   * REQ-35 — true when this run's colour could not be resolved from computed
   * styles and fell back to the `#000000`/`#ffffff` sentinel. The capture was
   * *guessing*, so the diff treats the colour as low-confidence and does not
   * emit a hard colour delta against it (a dark footer / over-image header the
   * fallback mislabels as black-on-white would otherwise diff forever).
   */
  colorInferred?: boolean
  /** REQ-48 (item 7) — false when the intended named face did not resolve (a fallback rendered). */
  fontLoaded?: boolean
  // ── REQ-63 typography treatment axes (null / absent when the no-op default) ──
  /** `font-style` when italic/oblique, else null. Compared exactly (presence + value). */
  fontStyle?: string | null
  /** `text-decoration-line` when underline/line-through/overline, else null. */
  textDecoration?: string | null
  /** `text-transform` when uppercase/lowercase/capitalize, else null. */
  textTransform?: string | null
  /** `font-variant`/`font-variant-caps` when small-caps and kin, else null. */
  fontVariant?: string | null
  /** `list-style-type` when a marker is painted (disc/decimal/…), else null. */
  listMarker?: string | null
  // ── REQ-63 effects (per element; compared as presence, like filter) ──────
  /** REQ-63 — computed `backdrop-filter` (frosted-glass blur) when painted, else null. */
  backdropFilter?: string | null
  /** REQ-63 — computed `mix-blend-mode` when non-`normal`, else null. */
  blendMode?: string | null
  /** REQ-63 — element `opacity` in 0..1 (1 opaque); a partial value ghosts the element. */
  opacity?: number
  /** REQ-63 — painted `outline` (focus ring / offset outline) as a presence string,
   *  distinct from `border`; null when none. Compared as presence, like `filter`. */
  outline?: string | null
  /** REQ-63 — `::before`/`::after` injected content presence, else null. */
  pseudo?: 'before' | 'after' | 'both' | null
  /** REQ-63 — computed `object-position` (image crop within its box), else null. */
  objectPosition?: string | null
  // ── REQ-47 rendered geometry / shape / structure ─────────────────────────
  /** `getBoundingClientRect()` box in full-page document coords. */
  box?: Box
  /** REQ-58 (T1) — tight rendered-text bounds (Range-measured glyph extent,
   *  padding-excluded). Catches a rendered size / tracking / weight-fallback
   *  difference the computed `fontSizePx` misses. Optional for pre-T1 manifests. */
  renderedTextBox?: Box | null
  /** Largest computed corner radius in px (0 when square). */
  borderRadiusPx?: number
  /** Uniform box border (all-sides) — width + colour, or null when none painted.
   *  Distinct from `borderLeft` (an asymmetric accent bar): a form field's outline
   *  or a card hairline. Optional for pre-blind-spot manifests. */
  border?: BorderTreatment | null
  /** Computed `box-shadow` when a shadow is painted, else null. */
  boxShadow?: string | null
  /** ARIA role — the browser's framework-agnostic semantic label. */
  a11yRole?: string
  /** Rendered arrangement relative to the previous element in the section. */
  arrangement?: Arrangement | null
  /** REQ-48 (item 2) — effective paint order (computed `z-index`, `auto` → 0). */
  zIndex?: number
  /** REQ-48 (item 3) — computed `filter` when painted (blur/drop-shadow halo), else null. */
  filter?: string | null
  /** REQ-48 (item 3) — computed `text-shadow` when painted (glow), else null. */
  textShadow?: string | null
  /** REQ-48 (item 3) — computed `mask-image`/`clip-path` when masked/clipped, else null. */
  maskEdge?: string | null
  /** REQ-48 (item 1) — transform rotation in degrees (0 when none). */
  transformRotateDeg?: number
  /** REQ-48 (item 1) — transform uniform scale (1 when none). */
  transformScale?: number
  /** REQ-48 (item 1) — declared motion: animation / transition / both / null. */
  motion?: 'animation' | 'transition' | 'both' | null
  /**
   * REQ-47 — true for a text-free element (input, divider). It has no text join
   * key, so the diff pairs it on `a11yRole + document order` and never routes it
   * through the text queue (where an empty string would collide with every other
   * textless element).
   */
  textless?: boolean
  /** REQ-48 (item 4) — computed `object-fit` for a media element (`img`), else null. */
  objectFit?: string | null
  /** REQ-48 (item 4) — intrinsic (natural) aspect ratio w/h for a media element, else null. */
  intrinsicAspect?: number | null
  /** REQ-47 — a text-free control's accessible name (empty when unlabelled). */
  accessibleName?: string
  /**
   * REQ-47 — where the accessible name is rendered: `placeholder` = inside the
   * field box, `label`/`aria` = outside/above it. The fact that distinguishes
   * placeholder-inside from label-above — neither geometry nor text can see it.
   */
  nameSource?: NameSource | null
}

/**
 * Section-level values — treatments that belong to a whole section, not a text
 * run, so they have no text to join on and are aligned by ordinal index instead
 * (REQ-31). These are exactly the composition-level deltas a text-run manifest
 * couldn't encode: a hero scrim and where the content sits vertically.
 */
export interface SectionValues {
  /** Section ordinal in document order — the join key between the two sides. */
  index: number
  /** Full-bleed translucent overlay (a hero scrim) painted over the section, or null. */
  overlay: { color: string; opacity: number } | null
  /** Vertical content anchor (0 = top … 1 = bottom), or null when the section is textless. */
  contentAnchorRatio: number | null
  /** REQ-64 — section band vertical padding (Type-A). Captured on the band all
   *  along but never compared; a taller section (a bigger top/bottom pad) only
   *  showed up as downstream `position` drift. Optional so pre-REQ-64 manifests parse. */
  paddingTopPx?: number
  paddingBottomPx?: number
  /** REQ-64 — section band text-align (Type-A). */
  textAlign?: 'left' | 'center' | 'right'
}

/** A flat, structured value manifest — the single artifact the diff and a human both read. */
export interface ValueManifest {
  /** Where these values came from (a capture host/path, or `draft:<slug>`). */
  source: string
  elements: ValueElement[]
  /** Section-level treatments (scrim, vertical anchor), aligned by ordinal index. */
  sections: SectionValues[]
  /**
   * REQ-48 (item 5) — the viewport this manifest was projected at. Layout
   * recomposes per width, so a diff is only meaningful between two sides shot at
   * the *same* viewport; the diff treats a width mismatch as a precondition
   * failure (see {@link diffManifests}). Optional so pre-REQ-48 manifests parse.
   */
  viewport?: Viewport
  /**
   * REQ-48 (item 6) — the rendering engine this manifest was projected on.
   * Multi-state diffs pair reference↔repro on `{engine, viewport.width, state}`,
   * so a WebKit-only shift is diffed against WebKit, never against Blink. Optional
   * so single-engine (pre-multi-state) manifests parse.
   */
  engine?: RenderEngine
  /**
   * REQ-48 (item 1) — the interaction state this manifest was projected in
   * (`rest` / `hover` / `focus` / `active`). The pairing key's third axis, so a
   * hover-scale is diffed hover↔hover and cannot be masked by the resting frame.
   */
  state?: InteractionState
  /**
   * REQ-56 — component-owned sub-element type ramps (badge / checklist), read as
   * one theme-level ramp per cohort. The diff compares these ramp-to-ramp and
   * attributes a systemic gap to the ramp (one finding), rolling up the
   * per-element rows it explains. Optional so pre-REQ-56 manifests parse.
   */
  subScales?: ThemeSubScales
}

/**
 * REQ-48 (items 1, 5, 6) — one projected manifest tagged with the full state it
 * was shot in: engine × viewport × interaction-state. The unit the multi-state
 * capture loop emits and {@link diffMultiState} pairs on.
 */
export interface StateProjection {
  engine: RenderEngine
  viewport: Viewport
  state: InteractionState
  manifest: ValueManifest
}

/** REQ-48 — a whole capture across every {engine × viewport × state} combination. */
export interface MultiStateCapture {
  url: string
  projections: StateProjection[]
  /**
   * REQ-48 — what the loop dropped and why (an unavailable engine, a driver that
   * couldn't actuate so was held to `rest`). Never a silent cap: a gap in the
   * matrix is surfaced here so a partial run cannot read as full coverage.
   */
  notes: string[]
}

/** REQ-48 — one paired-and-diffed cell of the multi-state matrix. */
export interface StateDiff {
  engine: RenderEngine
  /** The viewport *width* is the layout key (height doesn't recompose layout). */
  viewportWidth: number
  state: InteractionState
  /** The diff for this cell, or null when the repro never projected this cell. */
  report: ValuesDiffReport | null
  /** True when the reference has this cell but the repro is missing it (a coverage gap). */
  missing: boolean
}

export type DeltaProperty =
  | 'missing'
  | 'text'
  | 'color'
  // ── REQ-58 (item 3b) card / panel fill behind the run ────────────────────
  | 'surfaceFill'
  | 'gradient'
  // ── REQ-62 card / panel gradient fill behind the run ─────────────────────
  | 'surfaceGradient'
  | 'overlay'
  | 'borderLeft'
  | 'border'
  | 'fontSizePx'
  | 'contentAnchor'
  | 'fontWeight'
  | 'fontFamily'
  // ── REQ-63 typography treatment axes ──────────────────────────────────────
  | 'fontStyle'
  | 'textDecoration'
  | 'textTransform'
  | 'fontVariant'
  | 'listMarker'
  // ── REQ-63 effects ────────────────────────────────────────────────────────
  | 'backdropFilter'
  | 'blendMode'
  | 'opacity'
  | 'outline'
  | 'pseudo'
  | 'objectPosition'
  | 'lineHeightPx'
  | 'letterSpacingPx'
  | 'paddingLeftPx'
  // ── REQ-64 — the other three padding sides + text-align (Type-A visibility) ──
  | 'paddingTopPx'
  | 'paddingRightPx'
  | 'paddingBottomPx'
  | 'textAlign'
  // ── REQ-47 structural properties ─────────────────────────────────────────
  | 'position'
  // ── REQ-73 — relative vertical spacing (the gap between adjacent rows) ────
  | 'gap'
  | 'size'
  // ── REQ-58 (T1) tight rendered-text extent ───────────────────────────────
  | 'renderedTextBox'
  | 'shape'
  | 'arrangement'
  | 'containment'
  // ── REQ-48 (item 2) layering ─────────────────────────────────────────────
  | 'zIndex'
  // ── REQ-48 (item 3) treatments beyond box-shadow ─────────────────────────
  | 'filter'
  | 'textShadow'
  | 'mask'
  // ── REQ-48 (item 4) media fidelity ───────────────────────────────────────
  | 'objectFit'
  | 'aspect'
  // ── REQ-48 (item 5) multi-viewport / responsive reflow ───────────────────
  | 'viewport'
  | 'overflow'
  // ── REQ-48 (item 7) web-font load ────────────────────────────────────────
  | 'fontLoad'
  // ── REQ-48 (item 1) motion & interaction ─────────────────────────────────
  | 'transform'
  | 'motion'

/**
 * REQ-47 — the severity taxonomy. Every delta is tagged with a {@link DeltaKind}
 * (derivable purely from *which projected field* differs), which maps through a
 * fixed table to a {@link SeverityTier}. Ranking is by tier first, so a
 * small-but-structural defect (a 100%-wrong form) can never sort below a
 * large-but-tonal one (a mildly off colour) — pixel area is never an input.
 */
export type SeverityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type DeltaKind =
  | 'presence'
  | 'viewport'
  | 'containment'
  | 'arrangement'
  | 'position'
  | 'gap'
  | 'text'
  | 'overflow'
  | 'fontLoad'
  | 'transform'
  | 'zOrder'
  | 'media'
  | 'size'
  | 'fontSize'
  | 'fontFamily'
  | 'shape'
  | 'motion'
  | 'treatment'
  | 'borderLeft'
  | 'border'
  | 'gradient'
  // ── REQ-63 — typography treatment (italic/underline/uppercase/small-caps) & list marker ──
  | 'textTreatment'
  | 'marker'
  | 'fontWeight'
  | 'color'
  | 'overlay'
  | 'contentAnchor'
  | 'lineHeight'
  | 'padding'
  | 'letterSpacing'
  // ── REQ-63 — partial element opacity (tonal) ──────────────────────────────
  | 'opacity'

/** A single field-level disagreement between expected and actual. */
export interface ValueDelta {
  /** Expected element text, or `§<n>` for a section-level delta (truncated for display). */
  text: string
  role: string
  property: DeltaProperty
  expected: string
  actual: string
  /** REQ-47 — the severity kind this delta is tagged with. */
  kind: DeltaKind
  /** REQ-47 — the severity tier the kind maps to (the primary sort key). */
  tier: SeverityTier
  /**
   * REQ-47 — within-tier tiebreak magnitude (Δpx, ΔE, …). A tiebreak *within a
   * kind* only; it can never lift a delta across tiers. `0` when a kind has no
   * meaningful scalar magnitude.
   */
  magnitude: number
  /**
   * Composite rank weight; higher sorts first. Encodes `(tier, kind-within-tier,
   * magnitude)` so a single descending sort reproduces the severity ordering.
   */
  severity: number
  /**
   * REQ-48 (item 8a) — set on the synthetic *aggregate* row that stands in for a
   * sub-threshold delta repeated across many elements. Its {@link tier} is
   * escalated above the per-element kind so a pervasive-but-individually-quiet
   * drift (e.g. near-black-vs-slate body tone on 30 runs) is not buried under
   * per-element ranking. The individual rows are still emitted alongside it.
   */
  systemic?: boolean
  /** REQ-48 (item 8a) — on a {@link systemic} row, how many elements share the drift. */
  count?: number
  /**
   * REQ-64 — which repair class this delta belongs to, so the fix order is
   * unambiguous: **A** = an author-set value (colour, font, border, padding,
   * text-align…) — a difference to COPY into place; **B** = emergent from layout
   * / rendering (position, box size, wrapping, arrangement) — not directly
   * settable, so it is a *measure* of how far off we are, fixed only by getting
   * its Type-A inputs + structure right. Repair order: Type-A flat → Type-A
   * structural (responsive ladders, padding-vs-margin) → then read Type-B.
   */
  valueType: 'A' | 'B'
}

export interface ValuesDiffReport {
  expectedSource: string
  actualSource: string
  /** Expected elements paired with an actual element. */
  matched: number
  /** Expected elements with no actual match. */
  unmatched: number
  /** Field-level deltas, most-severe first. */
  deltas: ValueDelta[]
  /** REQ-48 (item 9) — count of deltas suppressed by an ignore-mask this run. */
  suppressed: number
  /**
   * REQ-51 — the object-grouped projection over the same pairing. One card per
   * *reference* object (text run, image, control, divider), in document order,
   * carrying its full parameter table (reference vs repro, incl. `box` position)
   * with each param flagged matched/mismatched. This is the primary human read:
   * an operator thinks in objects ("the hero heading is wrong on 4 axes"), so the
   * flat severity-sorted {@link deltas} list — which scatters one object's deltas
   * across the whole stream — is the machine index, not the read.
   */
  objects: ObjectCard[]
  /**
   * REQ-51 — repro objects that paired with *no* reference object ("M repro
   * objects matched nothing"). Surfaced loudly rather than folded into a count:
   * an extra object in the reproduction is a defect the flat list never named.
   */
  unpairedActual: UnpairedObject[]
}

/** REQ-51 — the object kinds the grouped view buckets by, for the card heading. */
export type ObjectKind = 'text' | 'image' | 'control' | 'divider'

/** REQ-51 — one row of an {@link ObjectCard}: a parameter, both sides, its verdict. */
export interface ObjectParam {
  /**
   * Parameter name in the spec's *own* vocabulary/units — `fontSizePx`, `color`,
   * `box`, … — so a mismatched row's {@link expected} value is a paste-able edit
   * (REQ-51 item 4; unified fully by the sibling spec-vocabulary ticket).
   */
  name: string
  /** Reference (expected) value, formatted — the value to transcribe. */
  expected: string
  /** Reproduction (actual) value, formatted; `—` when the object is unpaired. */
  actual: string
  /** True when this param differs beyond tolerance (drives the inline flag). */
  mismatch: boolean
}

/**
 * REQ-51 — one reference object's full parameter table, reference vs repro. The
 * fixed table is kind-specific (a text run's typography+box; an image's fit/
 * aspect/box; a control's name/name-source/box; a divider's box); any *other*
 * flagged delta for the object (a dropped gradient, a squared corner, a
 * beside-vs-below arrangement) is appended so no delta vanishes from the object
 * view. `box` is always present — position is the residual iteration converges,
 * so it is a first-class column, not a buried delta (REQ-51 item 2).
 */
export interface ObjectCard {
  /** The object's display identity — its text, or `(role)` for a textless object. */
  label: string
  role: string
  kind: ObjectKind
  /** False when this reference object had no repro match (loud-unpaired). */
  paired: boolean
  /** Fixed param table (kind-specific) plus any non-fixed deltas for this object. */
  params: ObjectParam[]
  /** Number of mismatched params (0 → the object reproduced clean). */
  deltaCount: number
  /** Max delta severity on this object; orders the cards worst-first. 0 when clean. */
  worstSeverity: number
  /** Tier of the highest-severity delta (the card badge), or null when clean. */
  worstTier: SeverityTier | null
}

/** REQ-51 — a repro object with no reference counterpart (matched nothing). */
export interface UnpairedObject {
  label: string
  role: string
  kind: ObjectKind
}

// ── gradient normalization ───────────────────────────────────────────────────

/** `to <side[ side]>` → CSS angle in degrees (direction the gradient points). */
const SIDE_ANGLES: Record<string, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
  'top right': 45,
  'right top': 45,
  'bottom right': 135,
  'right bottom': 135,
  'bottom left': 225,
  'left bottom': 225,
  'top left': 315,
  'left top': 315,
}

/** Any `rgb()/rgba()/#hex` colour token → `#rrggbb` (drops alpha). */
export function colorToHex(token: string): string | null {
  const t = token.trim()
  const hex = t.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (hex) {
    const h = hex[1]
    return (h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h}`).toLowerCase()
  }
  const rgb = t.match(/rgba?\(([^)]+)\)/)
  if (rgb) {
    const p = rgb[1].split(',').map((s) => parseFloat(s.trim()))
    if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null
    const h = (n: number) => ('0' + Math.round(n).toString(16)).slice(-2)
    return `#${h(p[0])}${h(p[1])}${h(p[2])}`
  }
  return null
}

/** `#rrggbb`/`rgb()` → `[r, g, b]` (0–255), or null if unparseable. */
function toRgb(token: string): [number, number, number] | null {
  const hex = colorToHex(token)
  if (!hex) return null
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/** sRGB channel (0–255) → linear-light [0,1] (inverse companding). */
function srgbToLinear(c: number): number {
  const n = c / 255
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
}

/**
 * sRGB `[r,g,b]` (0–255) → OKLab `[L, a, b]` (Björn Ottosson's OKLab, the
 * perceptually-uniform space CSS `oklch()` is built on). Euclidean distance in
 * this space is ΔEOK — see {@link colorDistance}.
 */
function toOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/**
 * Perceptual distance between two colours (REQ-48 item 8b), as ΔEOK — Euclidean
 * distance in **OKLab** (the space `oklch()` builds on), replacing the earlier
 * redmean RGB approximation. OKLab is perceptually uniform, so one threshold
 * holds across the gamut: raw RGB over/under-weights greens and darks, so a
 * single RGB tolerance is simultaneously too loose in one region and too tight
 * in another. Two identical colours score 0; `#000` vs `#fff` is ≈1.0. A tiny
 * threshold (~0.02, the ΔEOK just-noticeable band) suppresses the imperceptible
 * per-channel rounding between a re-render and its capture (`#808080` vs
 * `#818080` ≈ 0.0015) while leaving real near-neighbour deltas — the flagship
 * gold-vs-gold (`#f5e6a3` vs `#fbba72` ≈ 0.105), and the near-black-vs-slate body
 * tone (`#111` vs `#334155` ≈ 0.198) — well above the line. Unparseable input
 * scores `Infinity` so an unknown colour is never silently treated as a match.
 */
export function colorDistance(a: string, b: string): number {
  const ca = toRgb(a)
  const cb = toRgb(b)
  if (!ca || !cb) return Infinity
  const [la, aa, ba] = toOklab(ca)
  const [lb, ab, bb] = toOklab(cb)
  return Math.hypot(la - lb, aa - ab, ba - bb)
}

/**
 * Normalize a computed `linear-gradient(...)` string to {@link TextGradient}.
 * Non-linear (radial/conic) or unparseable input yields `{ angleDeg: null }` so
 * a gradient's *presence* is still comparable even when its direction is not.
 */
export function normalizeGradient(css: string | null | undefined): TextGradient | null {
  if (!css || !/gradient\(/.test(css)) return null

  const stops: GradientStop[] = []
  // Each stop is a colour optionally followed by its offset (`… 60%`). The
  // offset is captured (REQ-59) so position drift is a comparable delta; a stop
  // with no explicit offset records `position: null`.
  const stopRe = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))(?:\s+(-?\d+(?:\.\d+)?)%)?/g
  let m: RegExpExecArray | null
  while ((m = stopRe.exec(css))) {
    const hex = colorToHex(m[1])
    if (hex) stops.push({ color: hex, position: m[2] !== undefined ? parseFloat(m[2]) : null })
  }

  if (!/linear-gradient\(/.test(css)) return { angleDeg: null, stops }

  const inner = css.slice(css.indexOf('linear-gradient(') + 'linear-gradient('.length)
  const firstArg = inner.split(',')[0].trim()
  let angleDeg: number | null = 180 // CSS default direction is `to bottom`
  const deg = firstArg.match(/^(-?\d+(?:\.\d+)?)deg$/)
  const isColorFirst = /^(#|rgb)/.test(firstArg)
  if (deg) {
    angleDeg = ((parseFloat(deg[1]) % 360) + 360) % 360
  } else if (/^to\s+/.test(firstArg)) {
    const side = firstArg.replace(/^to\s+/, '').replace(/\s+/g, ' ').trim().toLowerCase()
    angleDeg = side in SIDE_ANGLES ? SIDE_ANGLES[side] : null
  } else if (!isColorFirst) {
    // First arg is neither an angle, a side, nor a colour — unknown direction.
    angleDeg = null
  }
  return { angleDeg, stops }
}

// ── projection: runs → elements ──────────────────────────────────────────────

/** Collapse internal whitespace runs and trim — the case-preserving normal form. */
const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim()
/** Case-insensitive join key: the collapsed text lowercased. */
const norm = (text: string): string => collapse(text).toLowerCase()

/** Copy the REQ-47 geometry / shape / structure fields present on `src` onto `el`. */
function copyGeometry(
  el: ValueElement,
  src: {
    box?: Box
    renderedTextBox?: Box | null
    borderRadiusPx?: number
    borderWidthPx?: number
    borderColor?: string | null
    borderStyle?: string | null
    boxShadow?: string | null
    a11yRole?: string
    arrangement?: Arrangement | null
    zIndex?: number
    filter?: string | null
    textShadow?: string | null
    maskEdge?: string | null
    backdropFilter?: string | null
    blendMode?: string | null
    opacity?: number
    outline?: string | null
    pseudo?: 'before' | 'after' | 'both' | null
    transformRotateDeg?: number
    transformScale?: number
    motion?: 'animation' | 'transition' | 'both' | null
    // REQ-64 — Type-A padding sides + text-align (present on runs; absent on
    // text-free fields and pre-REQ-64 bundles, so each is guarded below).
    paddingTopPx?: number
    paddingRightPx?: number
    paddingBottomPx?: number
    textAlign?: 'left' | 'center' | 'right' | 'justify'
  },
): void {
  if (src.paddingTopPx !== undefined) el.paddingTopPx = src.paddingTopPx
  if (src.paddingRightPx !== undefined) el.paddingRightPx = src.paddingRightPx
  if (src.paddingBottomPx !== undefined) el.paddingBottomPx = src.paddingBottomPx
  if (src.textAlign !== undefined) el.textAlign = src.textAlign
  if (src.box !== undefined) el.box = src.box
  if (src.renderedTextBox != null) el.renderedTextBox = src.renderedTextBox
  if (src.borderRadiusPx !== undefined) el.borderRadiusPx = src.borderRadiusPx
  // Uniform box border → BorderTreatment (or null when unpainted). Present only
  // once the capture records it; pre-blind-spot manifests omit it. REQ-63 folds
  // the captured line style (dashed/solid) into the treatment so it is comparable.
  if (src.borderWidthPx !== undefined) {
    el.border =
      src.borderWidthPx > 0 && src.borderColor
        ? { widthPx: src.borderWidthPx, color: src.borderColor, ...(src.borderStyle ? { style: src.borderStyle } : {}) }
        : null
  }
  if (src.boxShadow !== undefined) el.boxShadow = src.boxShadow
  if (src.a11yRole !== undefined) el.a11yRole = src.a11yRole
  if (src.arrangement !== undefined) el.arrangement = src.arrangement
  if (src.zIndex !== undefined) el.zIndex = src.zIndex
  if (src.filter !== undefined) el.filter = src.filter
  if (src.textShadow !== undefined) el.textShadow = src.textShadow
  if (src.maskEdge !== undefined) el.maskEdge = src.maskEdge
  // REQ-63 — effects (frosted-glass, blend, opacity, outline, pseudo-content).
  if (src.backdropFilter !== undefined) el.backdropFilter = src.backdropFilter
  if (src.blendMode !== undefined) el.blendMode = src.blendMode
  if (src.opacity !== undefined) el.opacity = src.opacity
  if (src.outline !== undefined) el.outline = src.outline
  if (src.pseudo !== undefined) el.pseudo = src.pseudo
  if (src.transformRotateDeg !== undefined) el.transformRotateDeg = src.transformRotateDeg
  if (src.transformScale !== undefined) el.transformScale = src.transformScale
  if (src.motion !== undefined) el.motion = src.motion
}

/**
 * REQ-63 — copy the typography treatment axes + list marker present on a run
 * (shared by the bundle and raw projections; both carry identical field names).
 * Each is set only when the capture recorded a painted value, so a pre-REQ-63
 * bundle (fields absent) stays inert and never fabricates a delta.
 */
function copyTypography(
  el: ValueElement,
  run: {
    fontStyle?: string | null
    textDecoration?: string | null
    textTransform?: string | null
    fontVariant?: string | null
    listMarker?: string | null
  },
): void {
  if (run.fontStyle !== undefined) el.fontStyle = run.fontStyle
  if (run.textDecoration !== undefined) el.textDecoration = run.textDecoration
  if (run.textTransform !== undefined) el.textTransform = run.textTransform
  if (run.fontVariant !== undefined) el.fontVariant = run.fontVariant
  if (run.listMarker !== undefined) el.listMarker = run.listMarker
}

/** Project a {@link ContentRun} (from a capture bundle) to a {@link ValueElement}. */
export function contentRunToElement(run: ContentRun): ValueElement {
  const el: ValueElement = {
    text: run.text,
    role: run.role,
    color: run.color,
    fontFamily: run.fontFamily,
    fontSizePx: run.fontSizePx,
    fontWeight: run.fontWeight,
  }
  if (run.lineHeightPx !== undefined) el.lineHeightPx = run.lineHeightPx
  if (run.letterSpacingPx !== undefined) el.letterSpacingPx = run.letterSpacingPx
  if (run.gradient !== undefined) el.gradient = run.gradient
  if (run.borderLeft !== undefined) el.borderLeft = run.borderLeft
  if (run.paddingLeftPx !== undefined) el.paddingLeftPx = run.paddingLeftPx
  if (run.surfaceFill != null) el.surfaceFill = run.surfaceFill
  if (run.surfaceGradient !== undefined) el.surfaceGradient = run.surfaceGradient
  if (run.colorInferred) el.colorInferred = true
  if (run.fontLoaded === false) el.fontLoaded = false
  copyTypography(el, run)
  copyGeometry(el, run)
  return el
}

/**
 * Project a text-free {@link Field} to a {@link ValueElement} (REQ-47). Its
 * accessible name doubles as the display text; `textless` routes it to the
 * role+order pairing path. Accepts the raw extracted field too (structurally
 * identical), so both sides of the diff project through one function.
 */
export function fieldToElement(field: Field): ValueElement {
  const el: ValueElement = {
    text: field.accessibleName || `(${field.a11yRole})`,
    role: field.a11yRole,
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: field.a11yRole,
    accessibleName: field.accessibleName,
    nameSource: field.nameSource,
  }
  copyGeometry(el, field)
  el.a11yRole = field.a11yRole
  if (field.objectFit !== undefined) el.objectFit = field.objectFit
  if (field.objectPosition !== undefined) el.objectPosition = field.objectPosition
  if (field.intrinsicAspect !== undefined) el.intrinsicAspect = field.intrinsicAspect
  return el
}

/** Project a raw extracted run (our live reproduction) to a {@link ValueElement}. */
export function rawRunToElement(run: RawRun): ValueElement {
  const border: BorderTreatment | null =
    run.borderLeftWidthPx > 0 && run.borderLeftColor
      ? { widthPx: run.borderLeftWidthPx, color: run.borderLeftColor }
      : null
  const el: ValueElement = {
    text: run.text,
    role: run.role,
    color: run.color,
    fontFamily: run.fontFamily,
    fontSizePx: run.fontSizePx,
    fontWeight: run.fontWeight,
    letterSpacingPx: run.letterSpacingPx,
    gradient: normalizeGradient(run.gradientCss),
    surfaceGradient: normalizeGradient(run.surfaceGradientCss),
    borderLeft: border,
    paddingLeftPx: run.paddingLeftPx,
  }
  if (run.lineHeightPx !== null) el.lineHeightPx = run.lineHeightPx
  if (run.surfaceFill != null) el.surfaceFill = run.surfaceFill
  if (run.colorInferred) el.colorInferred = true
  if (run.fontLoaded === false) el.fontLoaded = false
  copyTypography(el, run)
  copyGeometry(el, run)
  return el
}

/** Flatten a capture bundle's sections (+ repeated items, + text-free fields) into a value manifest. */
export function flattenCapture(capture: Capture): ValueManifest {
  const elements: ValueElement[] = []
  const sections: SectionValues[] = capture.sections.map((section, index) => ({
    index,
    overlay: section.background.overlay ?? null,
    contentAnchorRatio: section.layout.contentAnchorRatio ?? null,
    // REQ-64 — the single-width bundle records `contentAlign` (not per-side padding),
    // so text-align is comparable here; section padding stays undefined (ladder only).
    textAlign: section.layout.contentAlign,
  }))
  for (const section of capture.sections) {
    for (const run of section.content) elements.push(contentRunToElement(run))
    for (const item of section.items) {
      for (const run of item.content) elements.push(contentRunToElement(run))
    }
    // REQ-47 — text-free elements (guarded: pre-REQ-47 bundles carry no `fields`).
    for (const field of section.fields ?? []) elements.push(fieldToElement(field))
  }
  return {
    source: `${capture.host}${capture.path}`,
    elements,
    sections,
    viewport: capture.viewport,
    subScales: capture.theme.subScales,
  }
}

/**
 * Flatten a live extraction (our reproduction) into a value manifest. Section
 * values are read from the *raw* bands (uncoalesced), so section indices align
 * with the capture's coalesced sections at the top of the document — where the
 * hero (the scrim/anchor target) always sits at index 0.
 */
export function flattenSignals(signals: RawSignals, source: string): ValueManifest {
  const elements: ValueElement[] = []
  const sections: SectionValues[] = signals.bands.map((band, index) => ({
    index,
    overlay: band.overlay ?? null,
    contentAnchorRatio: band.contentAnchorRatio ?? null,
    // REQ-64 — band vertical padding + text-align were captured all along (RawBand)
    // but never projected/compared; a taller or re-aligned section is now direct.
    paddingTopPx: band.paddingTopPx,
    paddingBottomPx: band.paddingBottomPx,
    textAlign: band.textAlign,
  }))
  for (const band of signals.bands) {
    for (const run of band.content) elements.push(rawRunToElement(run))
    for (const item of band.items) {
      for (const run of item) elements.push(rawRunToElement(run))
    }
    // REQ-47 — text-free elements (form controls, dividers).
    for (const field of band.fields ?? []) elements.push(fieldToElement(field))
  }
  return {
    source,
    elements,
    sections,
    viewport: signals.viewport,
    subScales: subScalesFromSignals(signals),
  }
}

/**
 * REQ-48 (item 5) — the responsive viewport ladder the fidelity gate shoots at.
 * Layout recomposes across these widths, so a diff at only the desktop width
 * misses a mobile reflow break (the faelan wordmark overflow needed a full mobile
 * redo). Two phone widths, one tablet, three desktop — the breakpoints real CSS
 * targets. The harness projects + diffs at each; a delta at ≥1 non-desktop width
 * is a responsive failure.
 */
export const RESPONSIVE_VIEWPORTS: readonly Viewport[] = [
  { width: 320, height: 800 },
  { width: 375, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]

/**
 * REQ-48 (item 5) — the cheap, deterministic no-horizontal-overflow check: every
 * visible element must fit within the viewport width (`scrollWidth <= width`). An
 * element whose right edge exceeds the viewport (a wordmark that won't wrap at
 * 320px, a fixed-width table) forces a horizontal scrollbar — the classic mobile
 * reflow break. Needs only our own render at a width; no reference side. Returns
 * the overflowing elements, empty when the layout fits.
 */
export function horizontalOverflows(manifest: ValueManifest, tolerancePx = 1): ValueElement[] {
  const vw = manifest.viewport?.width
  if (vw === undefined) return []
  return manifest.elements.filter(
    (e) => e.box !== undefined && e.box.x + e.box.width > vw + tolerancePx,
  )
}

/**
 * REQ-48 (item 7) — the web-font resolution check: elements whose intended named
 * face did not resolve, so the browser painted a fallback with different metrics
 * (a FOUT/fallback that silently shifts every size, line-height and wrap below
 * it). Only elements the capture positively marked `fontLoaded: false` count —
 * an undefined field (a generic keyword, or a pre-REQ-48 bundle) is never a
 * false positive. Needs only the render itself; no reference side.
 */
export function unresolvedFonts(manifest: ValueManifest): ValueElement[] {
  return manifest.elements.filter((e) => e.fontLoaded === false)
}

// ── diff ─────────────────────────────────────────────────────────────────────

/**
 * REQ-47 — the fixed kind → tier table. Structural facts the eye reads first
 * (is it there, is the name inside the box, is the button beside or below,
 * where does it sit) are CRITICAL; a size is HIGH; a shape/treatment is MEDIUM;
 * tone (colour, scrim, spacing) is LOW. Pixel area is never consulted.
 */
const KIND_TIER: Record<DeltaKind, SeverityTier> = {
  presence: 'CRITICAL',
  viewport: 'CRITICAL',
  containment: 'CRITICAL',
  arrangement: 'CRITICAL',
  position: 'CRITICAL',
  // REQ-73 — a wrong inter-row gap is visible spacing but not structure-breaking, and
  // it is directly fixable via one spacing knob; HIGH so it ranks above tonal drift.
  gap: 'HIGH',
  text: 'CRITICAL',
  overflow: 'HIGH',
  fontLoad: 'HIGH',
  transform: 'HIGH',
  zOrder: 'HIGH',
  media: 'HIGH',
  size: 'HIGH',
  fontSize: 'HIGH',
  fontFamily: 'HIGH',
  shape: 'MEDIUM',
  motion: 'MEDIUM',
  treatment: 'MEDIUM',
  borderLeft: 'MEDIUM',
  border: 'MEDIUM',
  gradient: 'MEDIUM',
  // REQ-63 — a wrong italic/underline/uppercase/small-caps or list marker is a
  // treatment defect, same tier as the other treatment axes.
  textTreatment: 'MEDIUM',
  marker: 'MEDIUM',
  fontWeight: 'MEDIUM',
  color: 'LOW',
  overlay: 'LOW',
  contentAnchor: 'LOW',
  lineHeight: 'LOW',
  padding: 'LOW',
  letterSpacing: 'LOW',
  // REQ-63 — a partial-opacity (ghosted) element is tonal, like colour.
  opacity: 'LOW',
}

const TIER_RANK: Record<SeverityTier, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

/**
 * Within-tier ordering (higher sorts first) — the coarse tiebreak *before*
 * magnitude, so kinds sort deterministically even when their magnitudes aren't
 * commensurable (a ΔE and a Δpx can't be compared numerically). Chosen to
 * preserve the orderings the REQ-31/REQ-35 UATs pin: `overlay > contentAnchor`,
 * `color > letterSpacing`. `contentAnchor` stays LOW (below `overlay`): the
 * coarse section-anchor proxy is superseded by the per-element CRITICAL
 * `position` kind, so demoting it costs nothing and keeps the pinned order.
 */
const KIND_RANK: Record<DeltaKind, number> = {
  // CRITICAL band — viewport is a precondition failure (the diff can't be
  // trusted at all), so it leads the band.
  viewport: 7,
  presence: 6,
  containment: 5,
  arrangement: 4,
  position: 3,
  text: 2,
  // HIGH band
  gap: 9,
  overflow: 8,
  fontLoad: 7,
  transform: 6,
  zOrder: 5,
  media: 4,
  size: 3,
  fontSize: 2,
  fontFamily: 1,
  // MEDIUM band
  shape: 6,
  motion: 5,
  treatment: 4,
  borderLeft: 3,
  border: 3,
  gradient: 2,
  // REQ-63 — treatment-tier typography / marker axes (coarse tiebreak only).
  textTreatment: 4,
  marker: 3,
  fontWeight: 1,
  // LOW band
  color: 6,
  overlay: 5,
  contentAnchor: 4,
  lineHeight: 3,
  padding: 2,
  letterSpacing: 1,
  // REQ-63 — tonal opacity ranks alongside colour within LOW.
  opacity: 4,
}

/**
 * Composite rank: `(tier, kind-within-tier, magnitude)` folded into one
 * descending-sortable number. Tier dominates (×1000); kind orders within a tier
 * (×10); magnitude is a within-kind tiebreak folded to `[0,1)` so it can never
 * lift a delta past its kind, let alone its tier.
 */
function severityOf(kind: DeltaKind, magnitude: number): number {
  const magFrac = 1 - 1 / (1 + Math.max(0, magnitude))
  return TIER_RANK[KIND_TIER[kind]] * 1000 + KIND_RANK[kind] * 10 + magFrac
}

/**
 * REQ-48 (item 8a) — composite rank for a synthetic aggregate row, whose tier is
 * *escalated* above the per-element kind's natural tier (so it cannot be computed
 * by {@link severityOf}, which reads the kind's fixed tier). Same shape otherwise.
 */
function severityForTier(tier: SeverityTier, kind: DeltaKind, magnitude: number): number {
  const magFrac = 1 - 1 / (1 + Math.max(0, magnitude))
  return TIER_RANK[tier] * 1000 + KIND_RANK[kind] * 10 + magFrac
}

const TIER_ORDER: SeverityTier[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

/**
 * REQ-48 (item 8a) — escalate a base tier by how pervasively its delta repeats.
 * One tier at the threshold, another tier per further 3× the threshold, so a
 * body-tone drift on 30 elements lands well above an isolated one — but a tonal
 * drift, however pervasive, is capped at HIGH: it must never masquerade as a
 * CRITICAL structural break (a wrong z-order, a 200px-displaced hero).
 */
function escalateTier(base: SeverityTier, count: number, threshold: number): SeverityTier {
  const steps = 1 + Math.floor(count / (threshold * 3))
  const capped = Math.min(TIER_ORDER.indexOf(base) + steps, TIER_ORDER.indexOf('HIGH'))
  return TIER_ORDER[capped]
}

/**
 * REQ-56 — the subscale axes, each mapped to its delta {@link DeltaProperty} and
 * a short human label. A subscale carries these four px-vocabulary axes; the diff
 * compares them ramp-to-ramp and rolls up the matching per-element properties.
 */
const SUBSCALE_AXES: ReadonlyArray<{
  prop: DeltaProperty & keyof ThemeSubScale
  label: string
}> = [
  { prop: 'fontSizePx', label: 'size' },
  { prop: 'fontWeight', label: 'weight' },
  { prop: 'lineHeightPx', label: 'leading' },
  { prop: 'letterSpacingPx', label: 'tracking' },
]

/**
 * A rounded-pill element (badge shape): the corner radius reaches (near) half the
 * painted height. Mirrors the capture-side `isPill` (REQ-56) at the diff's
 * {@link ValueElement} granularity, used to scope badge-subscale rollup to actual
 * badges rather than all body runs.
 */
function isPillElement(el: ValueElement): boolean {
  const h = el.box?.height ?? 0
  return h > 0 && (el.borderRadiusPx ?? 0) * 2 >= h - 1
}

/** A badge-cohort element: a small, short-text, strongly-rounded body run. */
function isBadgeElement(el: ValueElement): boolean {
  const words = el.text.trim() === '' ? 0 : el.text.trim().split(/\s+/).length
  return el.role === 'body' && words <= 3 && isPillElement(el)
}

/**
 * REQ-64 — the repair class of each axis. **A** = an author-set value we can copy
 * (colour, font metrics, border, padding, text-align, effects); **B** = emergent
 * geometry/structure (position, box size, wrapping, arrangement, containment) that
 * is not directly settable — it is the *residual* that shrinks once the Type-A
 * inputs match. `listMarker`/`contentAnchor` sit in B: their deltas are computed
 * artefacts / emergent anchors, not values one edits. The fix order the report
 * prints is A-flat → A-structural → B.
 */
const VALUE_TYPE: Record<DeltaProperty, 'A' | 'B'> = {
  // ── Type A — authored values (copy the reference value into place) ──
  text: 'A',
  color: 'A',
  surfaceFill: 'A',
  gradient: 'A',
  surfaceGradient: 'A',
  overlay: 'A',
  borderLeft: 'A',
  border: 'A',
  fontSizePx: 'A',
  fontWeight: 'A',
  fontFamily: 'A',
  fontStyle: 'A',
  textDecoration: 'A',
  textTransform: 'A',
  fontVariant: 'A',
  backdropFilter: 'A',
  blendMode: 'A',
  opacity: 'A',
  outline: 'A',
  pseudo: 'A',
  objectPosition: 'A',
  objectFit: 'A',
  lineHeightPx: 'A',
  letterSpacingPx: 'A',
  paddingLeftPx: 'A',
  paddingTopPx: 'A',
  paddingRightPx: 'A',
  paddingBottomPx: 'A',
  textAlign: 'A',
  shape: 'A',
  zIndex: 'A',
  filter: 'A',
  textShadow: 'A',
  mask: 'A',
  fontLoad: 'A',
  transform: 'A',
  motion: 'A',
  // ── Type B — emergent geometry / structure (measure, don't copy) ──
  missing: 'B',
  position: 'B',
  // REQ-73 — a gap is emergent (a sum), but LINEAR in one spacing knob: its
  // expected→actual is the exact correction. Emergent, so Type B, but actionable.
  gap: 'B',
  size: 'B',
  renderedTextBox: 'B',
  arrangement: 'B',
  containment: 'B',
  contentAnchor: 'B',
  listMarker: 'B',
  aspect: 'B',
  overflow: 'B',
  viewport: 'B',
}

/**
 * REQ-64 — *derived* axes: computed and reported, but NOT counted as headline
 * defects. `position` (an element's absolute x,y) is the cumulative integral of
 * the `gap`/`size` deltas above it — it carries no information those don't. One
 * upstream spacing cause drifts every element below it, so counting `position`
 * double-counts the cause as dozens of downstream shadows and buries the real
 * list. REQ-73 already replaced it as the vertical-spacing signal (the `gap`
 * axis); this finishes that decision by demoting it from a counted defect to a
 * drill-down diagnostic. `size`/`renderedTextBox` are NOT derived — they measure
 * *dimensions* (container width, glyph extent), which are independent signal.
 */
export const DERIVED_PROPERTIES: ReadonlySet<DeltaProperty> = new Set<DeltaProperty>(['position'])

/** The kind a fine-grained {@link DeltaProperty} belongs to (for the tier table). */
const PROPERTY_KIND: Record<DeltaProperty, DeltaKind> = {
  missing: 'presence',
  viewport: 'viewport',
  overflow: 'overflow',
  fontLoad: 'fontLoad',
  text: 'text',
  color: 'color',
  // REQ-58 (item 3b) — a panel fill difference is a colour defect; reuse `color`.
  surfaceFill: 'color',
  gradient: 'gradient',
  // REQ-62 — a panel gradient is a gradient defect; reuse the `gradient` kind.
  surfaceGradient: 'gradient',
  overlay: 'overlay',
  borderLeft: 'borderLeft',
  border: 'border',
  fontSizePx: 'fontSize',
  contentAnchor: 'contentAnchor',
  fontWeight: 'fontWeight',
  fontFamily: 'fontFamily',
  // REQ-63 — the four typography treatment axes share one treatment kind; the
  // `property` still distinguishes them in the delta row.
  fontStyle: 'textTreatment',
  textDecoration: 'textTreatment',
  textTransform: 'textTreatment',
  fontVariant: 'textTreatment',
  listMarker: 'marker',
  // REQ-63 — effects. Frosted-glass / blend / pseudo are presence treatments;
  // an outline is border-like; opacity is tonal; object-position is media.
  backdropFilter: 'treatment',
  blendMode: 'treatment',
  pseudo: 'treatment',
  outline: 'treatment',
  opacity: 'opacity',
  objectPosition: 'media',
  lineHeightPx: 'lineHeight',
  letterSpacingPx: 'letterSpacing',
  paddingLeftPx: 'padding',
  gap: 'gap',
  // REQ-64 — the three other padding sides share the `padding` kind (LOW, like
  // paddingLeft); text-align is a text-treatment defect (MEDIUM) — a centred vs
  // left-aligned run reads like the other treatment axes.
  paddingTopPx: 'padding',
  paddingRightPx: 'padding',
  paddingBottomPx: 'padding',
  textAlign: 'textTreatment',
  position: 'position',
  size: 'size',
  // REQ-58 (T1) — rendered-text extent is a size fact; reuses the `size` kind's
  // HIGH tier / ranking (a rendered size difference is a genuine visual defect).
  renderedTextBox: 'size',
  shape: 'shape',
  arrangement: 'arrangement',
  containment: 'containment',
  zIndex: 'zOrder',
  filter: 'treatment',
  textShadow: 'treatment',
  mask: 'treatment',
  objectFit: 'media',
  aspect: 'media',
  transform: 'transform',
  motion: 'motion',
}

/**
 * Diff tolerances (REQ-53, superseding REQ-35). Exact match is the DEFAULT for
 * every axis we author directly and the browser renders verbatim — a value we
 * set is a value the diff must see reproduced. Tolerance is retained only where
 * the rendered value is genuinely *not* authored:
 *
 *   • Group A — directly-authored scalars (colour, font-size/weight, line-height,
 *     letter-spacing, padding, border-width, corner-radius): default 0 (exact).
 *   • Group B — deterministic layout (element position, box width): default 0
 *     with a ±1px allowance for integer rounding of the captured box.
 *   • Group C — genuinely emergent, tolerance kept: box *height* (text wrapping ×
 *     font metrics), gradient angle, overlay opacity, content anchor.
 *
 * REQ-35 made these axes jitter-tolerant by default; but tolerance and a
 * real-gap-we-ignore are indistinguishable from the outside (a 24px position
 * tolerance silently hid an 8px hero-margin error — REQ-52). So the default is
 * inverted: fuzzy only where we cannot reproduce what we see. `tolerant` restores
 * the old loose REQ-35 defaults wholesale — the single opt-out for the rare
 * unavoidable font-substitution case. Per-metric overrides below win over both
 * the exact default and `tolerant`, so one axis can be loosened without
 * abandoning exactness everywhere else.
 */
export interface DiffOptions {
  /**
   * Restore loose matching: every measurement axis falls back to its pre-REQ-53
   * jitter-tolerant default instead of exact. The escape hatch for a genuine
   * font-substitution gap; per-metric overrides still win over it.
   */
  tolerant?: boolean
  /**
   * REQ-48 (item 9) — ignore-masks for legitimately-dynamic content. Each entry
   * is a regular-expression *source* string; a delta is suppressed when the
   * pattern matches the element text OR either the expected/actual value.
   * Purpose: a hardcoded `© 2025` in a captured reference vs our dynamic current
   * year is a permanent correct-by-design false positive (also live counters,
   * "N days ago", A/B slots). An un-compilable pattern is skipped, never fatal.
   */
  ignore?: string[]
  /**
   * REQ-48 (item 9) — built-in mask for the calendar-year case (default on).
   * Suppresses a `text` delta whose expected and actual are identical once every
   * 4-digit year (19xx/20xx) is normalized away, so `© 2025` vs `© 2026` is inert
   * without per-site config while any *other* text change on the same run still
   * fires. Set false to compare years verbatim.
   */
  ignoreDynamicYear?: boolean
  /**
   * REQ-48 (item 8a) — the minimum number of elements sharing one LOW/MEDIUM-tier
   * delta kind before a synthetic escalated "systemic" row is emitted (default 5).
   * A small per-element delta repeated across ~30 elements is individually below
   * notice but collectively obvious; per-element ranking buries it. Set to 0 to
   * disable aggregation.
   */
  systemicThreshold?: number
  /**
   * REQ-56 — when a component subscale (badge / checklist) differs systemically,
   * the diff emits one theme-level finding and **rolls up** (suppresses) the
   * per-element badge/checklist rows that finding explains. Set true to keep
   * those per-element rows alongside the theme finding (the debugging opt-out).
   * Default false (rollup on).
   */
  keepSubscaleDeltas?: boolean
  /** Perceptual colour distance (OKLab ΔEOK) under which a colour pair matches (default 0 exact; `tolerant` 0.02, the JND band). */
  colorTolerance?: number
  /** Font-size px tolerance (default 0 exact; `tolerant` 1). */
  fontSizeTolerancePx?: number
  /**
   * Line-height px floor tolerance (default 0 exact; `tolerant` 2). Under
   * `tolerant`, line-height is proportional to font size, so the effective
   * tolerance is `max(floor, ratio × expected)` — the floor only dominates on
   * small text. See {@link lineHeightToleranceRatio}.
   */
  lineHeightTolerancePx?: number
  /**
   * Line-height relative tolerance as a fraction of the expected line-height
   * (default 0 exact; `tolerant` 0.12). The dominant jitter bucket is font-metric
   * line-height drift, which scales with the value; under `tolerant` a relative
   * band tracks it where an absolute px floor cannot.
   */
  lineHeightToleranceRatio?: number
  /** Letter-spacing px tolerance (default 0 exact; `tolerant` 0.5). */
  letterSpacingTolerancePx?: number
  /** Left-padding px tolerance (default 0 exact; `tolerant` 1). */
  paddingTolerancePx?: number
  /** Left-bar width px tolerance (default 0 exact; `tolerant` 1). */
  borderWidthTolerancePx?: number
  /** Font-weight tolerance (default 0 exact; `tolerant` 100 suppresses nearest-loaded-weight snap). */
  fontWeightTolerance?: number
  /** Gradient direction tolerance in degrees (default 20 — art-directed, Group C, always kept). */
  gradientAngleToleranceDeg?: number
  /** Gradient stop-position tolerance as a 0..100 percentage (default 2, REQ-59). */
  gradientPositionTolerancePct?: number
  /** Overlay (scrim) opacity tolerance, 0–1 (default 0.1 — art-directed, Group C, always kept). */
  overlayOpacityTolerance?: number
  /** Vertical-anchor tolerance as a fraction of box height (default 0.15 — art-directed, Group C, always kept). */
  anchorTolerance?: number
  /** REQ-73 — inter-row vertical gap tolerance in px (default 6; `tolerant` → 16). */
  gapTolerancePx?: number
  /**
   * REQ-47/REQ-53 — element position tolerance in px (default 1, an integer-
   * rounding allowance for the captured box; `tolerant` 24). Position is
   * deterministic layout (Group B): a rendered box whose x or y differs by more
   * than the allowance emits a `position` delta. REQ-52 showed the old loose 24px
   * default silently hid an 8px hero-margin error, so exact-with-rounding is the
   * default and the loose smoke-detector band is behind `tolerant`.
   */
  positionTolerancePx?: number
  /**
   * REQ-53 — box width tolerance in px (default 1, an integer-rounding allowance;
   * `tolerant` 16). Width is container-determined deterministic layout (Group B),
   * so it is exact by default — split off from the combined `size` axis so a real
   * width gap can't hide behind the wrapping allowance height legitimately needs.
   */
  widthTolerancePx?: number
  /**
   * REQ-53 — box height tolerance in px (default 8; `tolerant` 16). Height emerges
   * from text wrapping × font metrics (Group C) — only exact when the font itself
   * is reproduced — so a small tolerance is retained. The 8px band absorbs
   * per-line metric rounding while still catching a whole extra wrapped line
   * (≥ one line-height, typically ≥16px).
   */
  heightTolerancePx?: number
  /**
   * REQ-58 (T1) — tight rendered-text-box tolerance as a RATIO of the glyph extent
   * (default 0.012 = 1.2%; `tolerant` 0.03). The tight extent (Range-measured) is
   * font-metric-determined: identical font + engine → identical glyphs, so the
   * default is near-exact and a real rendered size / tracking / weight-fallback
   * difference (invisible to computed `fontSizePx`) surfaces as a `renderedTextBox`
   * delta. Relative because the extent scales with text length.
   */
  renderedTextBoxToleranceRatio?: number
  /** REQ-47/REQ-53 — corner-radius tolerance in px (default 0 exact; `tolerant` 4). */
  borderRadiusTolerancePx?: number
  /** REQ-63 — element opacity tolerance, 0–1 (default 0 exact; `tolerant` 0.02). */
  opacityValueTolerance?: number
}

function gradientLabel(g: TextGradient | null | undefined): string {
  if (!g) return 'none'
  const dir = g.angleDeg === null ? '?°' : `${g.angleDeg}°`
  const stops = g.stops.map((s) => (s.position === null ? s.color : `${s.color} ${s.position}%`)).join(', ')
  return `${dir} [${stops}]`
}

function borderLabel(b: BorderTreatment | null | undefined): string {
  return b ? `${b.widthPx}px ${b.style ? `${b.style} ` : ''}${b.color}` : 'none'
}

function overlayLabel(o: { color: string; opacity: number } | null): string {
  return o ? `${o.color} @ ${o.opacity}` : 'none'
}

/** Ratio → legible anchor label, e.g. `bottom (0.82)`. */
function anchorLabel(ratio: number): string {
  const band = ratio < 0.38 ? 'top' : ratio > 0.62 ? 'bottom' : 'center'
  return `${band} (${ratio.toFixed(2)})`
}

/** `{x,y}` origin label, e.g. `@ (120, 195)`. */
function posLabel(box: Box): string {
  return `@ (${Math.round(box.x)}, ${Math.round(box.y)})`
}

/** `w×h` size label. */
function sizeLabel(box: Box): string {
  return `${Math.round(box.width)}×${Math.round(box.height)}`
}

/** REQ-58 (T1) — tight rendered-text `w×h` label (glyph extent). */
function textBoxLabel(box: Box): string {
  return `text ${Math.round(box.width)}×${Math.round(box.height)}`
}

/** Rendered-shape label — radius + shadow presence. */
function shapeLabel(radiusPx: number | undefined, shadow: string | null | undefined): string {
  const r = radiusPx === undefined ? '?' : `${radiusPx}px`
  return `radius ${r}, shadow ${shadow ? 'yes' : 'no'}`
}

/** Arrangement → prose, e.g. `beside (right-of)` / `below`. */
function arrangementLabel(a: Arrangement | null | undefined): string {
  if (a === 'row') return 'beside (right-of prev)'
  if (a === 'stack') return 'below prev'
  return 'unknown'
}

/** Name-source → prose that names *where* the label renders. */
function nameSourceLabel(src: NameSource | null | undefined): string {
  if (src === 'placeholder') return 'placeholder (inside field)'
  if (src === 'label') return 'label (outside/above)'
  if (src === 'aria') return 'aria (outside)'
  if (src === 'text') return 'text'
  if (src === 'alt') return 'alt'
  return 'none'
}

/** True when the accessible name is rendered *inside* the field box (placeholder). */
function nameContained(src: NameSource | null | undefined): boolean {
  return src === 'placeholder'
}

/**
 * True when both gradients agree on direction (within `tolDeg`), stop colours,
 * and stop *positions* (within `posTolPct`, REQ-59). A position is compared only
 * when both stops captured one; a positionless stop (no explicit offset) falls
 * back to colour-only so it never fabricates a delta.
 */
function gradientsMatch(a: TextGradient, b: TextGradient, tolDeg: number, posTolPct: number): boolean {
  if (a.stops.length !== b.stops.length) return false
  for (let i = 0; i < a.stops.length; i++) {
    if (!stopsMatch(a.stops[i], b.stops[i], posTolPct)) return false
  }
  if (a.angleDeg === null || b.angleDeg === null) return a.angleDeg === b.angleDeg
  let d = Math.abs(a.angleDeg - b.angleDeg) % 360
  if (d > 180) d = 360 - d
  return d <= tolDeg
}

/** True when two stops share a colour and (when both captured one) an offset within tolerance. */
function stopsMatch(a: GradientStop, b: GradientStop, posTolPct: number): boolean {
  if (a.color !== b.color) return false
  if (a.position !== null && b.position !== null && Math.abs(a.position - b.position) > posTolPct) return false
  return true
}

/**
 * REQ-48 (item 9) — collapse every 4-digit calendar year (19xx/20xx) to a fixed
 * placeholder so a year-only text difference (`© 2025` vs `© 2026`) folds to
 * equality while any other change on the run survives.
 */
function normalizeYears(s: string): string {
  return s.replace(/\b(?:19|20)\d{2}\b/g, 'YYYY')
}

/**
 * REQ-48 (item 9) — compile ignore-mask sources once. An un-compilable pattern
 * is dropped rather than thrown: a malformed mask must never crash the gate (a
 * bad allowlist entry should degrade to "not ignored", the safe direction).
 */
function compileIgnore(sources: string[] | undefined): RegExp[] {
  const out: RegExp[] = []
  for (const src of sources ?? []) {
    try {
      out.push(new RegExp(src))
    } catch {
      // skip a malformed mask; over-reporting is safer than a crash
    }
  }
  return out
}

// ── REQ-51 object-grouped projection ─────────────────────────────────────────

/** `{x, y w×h}` box label — the per-object position+size column. */
function boxLabel(box: Box | undefined): string {
  if (!box) return '—'
  return `(${Math.round(box.x)}, ${Math.round(box.y)}) ${Math.round(box.width)}×${Math.round(box.height)}`
}

/** Bucket a projected element into its object kind (for the card heading). */
function objectKindOf(el: ValueElement): ObjectKind {
  if (!el.textless) return 'text'
  if (el.a11yRole === 'img') return 'image'
  if (el.a11yRole === 'separator') return 'divider'
  return 'control'
}

/**
 * REQ-51 — the fixed parameter table per object kind. A text run shows its
 * typography + box; an image its fit/aspect/box; a control its name + where the
 * name renders + box; a divider just its box. `box` closes every table so
 * position is always visible (item 2).
 */
const KIND_PARAMS: Record<ObjectKind, string[]> = {
  text: ['fontFamily', 'fontSizePx', 'fontWeight', 'color', 'letterSpacingPx', 'lineHeightPx', 'renderedTextBox', 'box'],
  image: ['name', 'objectFit', 'aspect', 'box'],
  control: ['name', 'nameSource', 'box'],
  divider: ['box'],
}

/**
 * Which {@link DeltaProperty}(ies) a fixed param's verdict reads. A param with a
 * mapped property is flagged iff that property fired a delta (so the diff's
 * tolerances stay authoritative — `72` vs `72.4` within tolerance is not a
 * mismatch). A param with no mapped property (`name`) falls back to a direct
 * string compare, so accessible-name drift the diff doesn't model still shows.
 */
const PARAM_PROPS: Record<string, DeltaProperty[]> = {
  fontFamily: ['fontFamily'],
  fontSizePx: ['fontSizePx'],
  fontWeight: ['fontWeight'],
  color: ['color'],
  letterSpacingPx: ['letterSpacingPx'],
  lineHeightPx: ['lineHeightPx'],
  renderedTextBox: ['renderedTextBox'],
  box: ['position', 'size'],
  nameSource: ['containment'],
  objectFit: ['objectFit'],
  aspect: ['aspect'],
  name: [],
}

/** Format a fixed param's value off an element (`—` when absent/unpaired). */
function paramValue(name: string, el: ValueElement | undefined): string {
  if (!el) return '—'
  switch (name) {
    case 'fontFamily':
      return el.fontFamily || '—'
    case 'fontSizePx':
      return `${el.fontSizePx}`
    case 'fontWeight':
      return `${el.fontWeight}`
    case 'color':
      return el.color || '—'
    case 'letterSpacingPx':
      return el.letterSpacingPx !== undefined ? `${el.letterSpacingPx}` : '—'
    case 'lineHeightPx':
      return el.lineHeightPx !== undefined ? `${el.lineHeightPx}` : '—'
    case 'renderedTextBox':
      return el.renderedTextBox ? textBoxLabel(el.renderedTextBox) : '—'
    case 'box':
      return boxLabel(el.box)
    case 'name':
      return el.accessibleName || '—'
    case 'nameSource':
      return nameSourceLabel(el.nameSource)
    case 'objectFit':
      return el.objectFit ?? '—'
    case 'aspect':
      return el.intrinsicAspect != null ? `${el.intrinsicAspect.toFixed(2)}:1` : '—'
    default:
      return '—'
  }
}

/**
 * Build one reference object's card from its paired repro element (or undefined
 * when unpaired) and the deltas the diff already flagged for it. The fixed
 * kind-table comes first; any *other* flagged delta (gradient, borderLeft, shape,
 * arrangement, casing, …) is appended so the object view loses nothing the flat
 * list holds.
 */
function buildObjectCard(
  exp: ValueElement,
  act: ValueElement | undefined,
  elementDeltas: ValueDelta[],
): ObjectCard {
  const kind = objectKindOf(exp)
  const props = new Set<DeltaProperty>(elementDeltas.map((d) => d.property))
  const fixedNames = KIND_PARAMS[kind]
  const params: ObjectParam[] = fixedNames.map((name) => {
    const expected = paramValue(name, exp)
    const actual = paramValue(name, act)
    const mapped = PARAM_PROPS[name] ?? []
    // Geometry present on exactly one side is NOT a match — it means the two
    // sides can't be compared, most often a stale reference captured before
    // per-element geometry existed (REQ-47). The delta engine emits no
    // position/size delta in that case, so without this the box row would render
    // `— → (x,y…) ✓` and silently pass geometry it never actually checked.
    const geometrySkew =
      name === 'box' && !!act && (expected === '—') !== (actual === '—')
    const mismatch = !act
      ? true
      : geometrySkew
        ? true
        : mapped.length > 0
          ? mapped.some((p) => props.has(p))
          : expected !== actual
    return { name, expected, actual, mismatch }
  })
  // Append deltas not represented by a fixed param, so nothing the flat list
  // flagged disappears from the object view.
  const covered = new Set<DeltaProperty>()
  for (const n of fixedNames) for (const p of PARAM_PROPS[n] ?? []) covered.add(p)
  for (const d of elementDeltas) {
    if (covered.has(d.property)) continue
    params.push({ name: d.property, expected: d.expected, actual: d.actual, mismatch: true })
  }
  let worst: ValueDelta | undefined
  for (const d of elementDeltas) if (!worst || d.severity > worst.severity) worst = d
  return {
    label: exp.text,
    role: exp.role,
    kind,
    paired: !!act,
    params,
    deltaCount: params.filter((p) => p.mismatch).length,
    worstSeverity: worst?.severity ?? 0,
    worstTier: worst?.tier ?? null,
  }
}

/** Project a leftover (unpaired) repro element to its {@link UnpairedObject} note. */
function toUnpaired(el: ValueElement): UnpairedObject {
  return { label: el.text, role: el.role, kind: objectKindOf(el) }
}

/**
 * Diff an actual manifest against an expected one, field by field, aligning
 * text elements by case-folded text and section-level values (scrim, vertical
 * anchor) by ordinal index. The verbatim text is itself compared once paired
 * (casing/whitespace the join key folds away is still a captured value). Only
 * fields present on the *expected* side are compared — the expected manifest
 * (the captured reference) is authoritative about what must be reproduced.
 * Returns deltas ranked most-severe first.
 */
/**
 * REQ-56 — attribute a systemic component-subscale gap to the theme. For each
 * named subscale present on both sides, emit ONE synthetic theme-level delta
 * naming the differing axes, and (unless `keep`) roll up the per-element
 * badge/checklist rows those axes explain — the wall of identical per-element
 * failures exact-match (REQ-53) would otherwise produce. Returns the synthetic
 * rows, the deltas surviving the rollup, and how many were rolled up.
 */
function attributeSubScales(
  expected: ValueManifest,
  actual: ValueManifest,
  deltas: ValueDelta[],
  joinKey: (t: string) => string,
  escThreshold: number,
  keep: boolean,
): { rows: ValueDelta[]; kept: ValueDelta[]; rolledUp: number } {
  const rows: ValueDelta[] = []
  const exp = expected.subScales
  const act = actual.subScales
  if (!exp || !act) return { rows, kept: deltas, rolledUp: 0 }

  // Badge deltas carry no geometry, so recognise them by pairing delta text
  // against the reference's badge (pill) elements; checklist rows self-identify
  // by the a11y `listitem` role.
  const badgeTexts = new Set(expected.elements.filter(isBadgeElement).map((e) => joinKey(e.text)))
  const rollup: Array<(d: ValueDelta) => boolean> = []

  const names: Array<keyof ThemeSubScales> = ['badge', 'checklist']
  for (const name of names) {
    const e = exp[name]
    const a = act[name]
    if (!e || !a) continue
    const diffAxes = SUBSCALE_AXES.filter((ax) => {
      const ev = e[ax.prop]
      const av = a[ax.prop]
      return ev != null && av != null && ev !== av
    })
    if (diffAxes.length === 0) continue

    const props = new Set<DeltaProperty>(diffAxes.map((ax) => ax.prop))
    const count = e.count
    const kind = PROPERTY_KIND[diffAxes[0].prop]
    const tier = escalateTier(KIND_TIER[kind], count, escThreshold)
    rows.push({
      text: `⟨${name} subscale ×${count}⟩`,
      role: 'subscale',
      property: diffAxes[0].prop,
      expected: diffAxes.map((ax) => `${ax.label} ${e[ax.prop]}`).join(', '),
      actual: diffAxes.map((ax) => `${ax.label} ${a[ax.prop]}`).join(', '),
      kind,
      tier,
      magnitude: count,
      severity: severityForTier(tier, kind, count),
      systemic: true,
      count,
      valueType: VALUE_TYPE[diffAxes[0].prop],
    })

    if (name === 'checklist') {
      rollup.push((d) => d.role === 'listitem' && props.has(d.property))
    } else {
      rollup.push((d) => badgeTexts.has(joinKey(d.text)) && props.has(d.property))
    }
  }

  if (keep || rollup.length === 0) return { rows, kept: deltas, rolledUp: 0 }
  const kept = deltas.filter((d) => !rollup.some((r) => r(d)))
  return { rows, kept, rolledUp: deltas.length - kept.length }
}

export function diffManifests(
  expected: ValueManifest,
  actual: ValueManifest,
  opts: DiffOptions = {},
): ValuesDiffReport {
  const tolerant = opts.tolerant ?? false
  // REQ-53 — exact match is the default. A per-metric override wins over both the
  // exact default and `tolerant`; absent an override, `tolerant` restores the
  // pre-REQ-53 jitter-tolerant default (the escape hatch for a genuine
  // font-substitution gap we cannot author away).
  const tol = (v: number | undefined, exact: number, loose: number): number =>
    v ?? (tolerant ? loose : exact)
  const colorTol = tol(opts.colorTolerance, 0, 0.02)
  const fontSizeTol = tol(opts.fontSizeTolerancePx, 0, 1)
  const lineHeightFloor = tol(opts.lineHeightTolerancePx, 0, 2)
  const lineHeightRatio = tol(opts.lineHeightToleranceRatio, 0, 0.12)
  const letterSpacingTol = tol(opts.letterSpacingTolerancePx, 0, 0.5)
  const paddingTol = tol(opts.paddingTolerancePx, 0, 1)
  const borderWidthTol = tol(opts.borderWidthTolerancePx, 0, 1)
  const weightTol = tol(opts.fontWeightTolerance, 0, 100)
  // Art-directed tolerances (direction bucket, scrim opacity, vertical anchor)
  // are measured perceptually, never authored precisely — REQ-53 Group C, kept
  // tolerant always, independent of `tolerant`.
  const angleTol = opts.gradientAngleToleranceDeg ?? 20
  const gradientPosTol = opts.gradientPositionTolerancePct ?? 2
  const opacityTol = opts.overlayOpacityTolerance ?? 0.1
  const anchorTol = opts.anchorTolerance ?? 0.15
  // REQ-73 — a vertical inter-row gap this many px off is a real spacing difference.
  // Looser than position (a few px of line-box rounding accumulate across a row).
  const gapTol = tol(opts.gapTolerancePx, 6, 16)
  // REQ-53 geometry: position + width are deterministic layout (Group B) → exact
  // with a ±1px integer-rounding allowance. Height emerges from text wrapping ×
  // font metrics (Group C) → a small documented tolerance. `tolerant` restores
  // the old loose smoke-detector bands.
  const positionTol = tol(opts.positionTolerancePx, 1, 24)
  const widthTol = tol(opts.widthTolerancePx, 1, 16)
  const heightTol = tol(opts.heightTolerancePx, 8, 16)
  // REQ-58 (T1) — tight rendered-text bounds, as a RATIO of the glyph extent. Same
  // font+engine renders identical glyphs, so this is ~0 when the values match; the
  // small ratio band absorbs sub-pixel Range rounding while still catching a real
  // rendered size / tracking / weight-fallback gap (7% on a heading, 2% on a label).
  const renderedTextBoxTol = tol(opts.renderedTextBoxToleranceRatio, 0.012, 0.03)
  const radiusTol = tol(opts.borderRadiusTolerancePx, 0, 4)
  // REQ-63 — element opacity is authored (Group A), so exact by default; a small
  // rounding band under `tolerant`. A ghosted (partial-opacity) element vs a solid
  // one exceeds it, while `0.5`↔`0.5` re-render rounding does not.
  const opacityValueTol = tol(opts.opacityValueTolerance, 0, 0.02)

  // REQ-48 (item 9) — the calendar-year mask folds every 4-digit year in the
  // *join key* and the verbatim-text comparison, so a footer that differs only by
  // `© 2025` vs our dynamic `© 2026` still pairs and then reads as unchanged text.
  // Without folding the key, a year-only change breaks the pairing and surfaces as
  // a spurious CRITICAL `missing` delta — the exact permanent false positive this
  // mask exists to kill. `--compare-years` sets it false to compare years verbatim.
  const maskYears = opts.ignoreDynamicYear ?? true
  const joinKey = (t: string): string => norm(maskYears ? normalizeYears(t) : t)

  // Group actual elements into FIFO queues so repeated keys pair with expected
  // occurrences in document order. Text runs join on normalized text; text-free
  // fields have no text key, so they join on `a11yRole` (REQ-47) instead — kept
  // in a separate map so an empty-text field never collides with a text run.
  const queues = new Map<string, ValueElement[]>()
  const fieldQueues = new Map<string, ValueElement[]>()
  for (const el of actual.elements) {
    const [map, key] = el.textless
      ? [fieldQueues, el.a11yRole ?? el.role]
      : [queues, joinKey(el.text)]
    const q = map.get(key)
    if (q) q.push(el)
    else map.set(key, [el])
  }

  const deltas: ValueDelta[] = []
  let matched = 0
  let unmatched = 0

  // REQ-51 — object cards accumulate as we pair; `ignore` is hoisted above the
  // loops (from its original post-loop position) so a card's per-object delta
  // slice can be filtered through the same suppression mask, keeping the card's
  // verdicts consistent with the flat list.
  const cards: ObjectCard[] = []
  const ignore = compileIgnore(opts.ignore)
  const isIgnored = (d: ValueDelta): boolean =>
    ignore.some((re) => re.test(d.text) || re.test(d.expected) || re.test(d.actual))
  /** This object's deltas, minus any the ignore-mask suppresses (REQ-51 + REQ-48 item 9). */
  const objectDeltas = (start: number): ValueDelta[] => {
    const slice = deltas.slice(start)
    return ignore.length > 0 ? slice.filter((d) => !isIgnored(d)) : slice
  }

  const record = (
    text: string,
    role: string,
    property: DeltaProperty,
    expectedVal: string,
    actualVal: string,
    magnitude = 0,
  ): void => {
    const kind = PROPERTY_KIND[property]
    deltas.push({
      text: text.length > 60 ? `${text.slice(0, 57)}…` : text,
      role,
      property,
      expected: expectedVal,
      actual: actualVal,
      kind,
      tier: KIND_TIER[kind],
      magnitude,
      severity: severityOf(kind, magnitude),
      valueType: VALUE_TYPE[property],
    })
  }
  const push = (
    e: ValueElement,
    property: DeltaProperty,
    expectedVal: string,
    actualVal: string,
    magnitude = 0,
  ): void => record(e.text, e.role, property, expectedVal, actualVal, magnitude)

  // REQ-47 — geometry / shape / arrangement, shared by text runs and fields.
  // Every comparison is guarded on the field being present on *both* sides, so
  // a synthetic manifest (or a pre-REQ-47 bundle) that carries none is inert.
  const compareGeometry = (exp: ValueElement, act: ValueElement): void => {
    if (exp.box && act.box) {
      const dpos = Math.max(Math.abs(exp.box.x - act.box.x), Math.abs(exp.box.y - act.box.y))
      if (dpos > positionTol) push(exp, 'position', posLabel(exp.box), posLabel(act.box), dpos)
      // REQ-53 — width is container-determined (exact, Group B); height emerges
      // from text wrapping × font metrics (tolerant, Group C). Split the axis so
      // a real width gap can't hide behind the wrapping allowance height needs.
      const dw = Math.abs(exp.box.width - act.box.width)
      const dh = Math.abs(exp.box.height - act.box.height)
      if (dw > widthTol || dh > heightTol) {
        push(exp, 'size', sizeLabel(exp.box), sizeLabel(act.box), Math.max(dw, dh))
      }
    }
    // REQ-58 (T1) — tight rendered-text bounds. Distinct from box: box.width is the
    // container (Group B) and box.height the wrapped block (Group C); this is the
    // actual painted glyph extent, so a rendered size / tracking / weight-fallback
    // difference surfaces even when fontSizePx / fontWeight / letterSpacing all
    // match. DOM-measured — robust where pixel-thresholding a glyph over a
    // photographic background is not (DOC-19). A single-line run gives a pure size
    // signal; a multi-line run's width is its widest line and height its wrapped
    // block (wrapping-confounded, like box), so the same integer-rounding tolerance
    // applies.
    if (exp.renderedTextBox && act.renderedTextBox) {
      const dtw = Math.abs(exp.renderedTextBox.width - act.renderedTextBox.width)
      const dth = Math.abs(exp.renderedTextBox.height - act.renderedTextBox.height)
      // Relative, not absolute: the glyph extent scales with text length, so a
      // fixed-px band would flag a 0.4% sub-pixel difference on a long line while
      // missing a 2% one on a short label. Ratio-of-extent separates them cleanly.
      // Width is the glyph-advance signal (tracking / size / weight-fallback);
      // height is cap-to-descender, noisy at ±1px line-box rounding, so it also
      // needs an absolute floor before a ratio can fire.
      const relW = dtw / Math.max(1, exp.renderedTextBox.width)
      const relH = dth / Math.max(1, exp.renderedTextBox.height)
      if (relW > renderedTextBoxTol || (dth >= 3 && relH > renderedTextBoxTol)) {
        push(
          exp,
          'renderedTextBox',
          textBoxLabel(exp.renderedTextBox),
          textBoxLabel(act.renderedTextBox),
          Math.max(dtw, dth),
        )
      }
    }
    if (exp.borderRadiusPx !== undefined && act.borderRadiusPx !== undefined) {
      const dr = Math.abs(exp.borderRadiusPx - act.borderRadiusPx)
      const shadowDiffers = !!exp.boxShadow !== !!act.boxShadow
      if (dr > radiusTol || shadowDiffers) {
        push(
          exp,
          'shape',
          shapeLabel(exp.borderRadiusPx, exp.boxShadow),
          shapeLabel(act.borderRadiusPx, act.boxShadow),
          dr,
        )
      }
    }
    // Uniform box border (blind spot) — a form field's outline / a card hairline.
    // Compare presence + width + colour, like borderLeft. Only when both sides
    // record the field (pre-blind-spot manifests omit `border`, so skip then).
    if (exp.border !== undefined && act.border !== undefined) {
      const e = exp.border
      const a = act.border ?? null
      // REQ-63 — line style (dashed/dotted/solid) joins width + colour, but only
      // when BOTH sides captured one (a pre-REQ-63 side omits it) so it never
      // fabricates a delta against a bundle that never recorded the style.
      const styleOk = !e || !a || !e.style || !a.style || e.style === a.style
      const ok =
        (!e && !a) ||
        (!!e &&
          !!a &&
          Math.abs(e.widthPx - a.widthPx) <= borderWidthTol &&
          colorDistance(e.color, a.color) <= colorTol &&
          styleOk)
      if (!ok) push(exp, 'border', borderLabel(e), borderLabel(a))
    }
    if (exp.arrangement && act.arrangement && exp.arrangement !== act.arrangement) {
      push(exp, 'arrangement', arrangementLabel(exp.arrangement), arrangementLabel(act.arrangement))
    }
    // REQ-48 (item 2) — paint order. A wrong z-index means a correctly-placed
    // element stacks on the wrong side of its neighbours (portrait over caption,
    // scrim behind instead of in front) — invisible to every 2D field above.
    if (exp.zIndex !== undefined && act.zIndex !== undefined && exp.zIndex !== act.zIndex) {
      push(exp, 'zIndex', `z:${exp.zIndex}`, `z:${act.zIndex}`, Math.abs(exp.zIndex - act.zIndex))
    }
    // REQ-48 (item 3) — treatments beyond box-shadow (filter halo, text glow,
    // mask-feather / clip edge). Like box-shadow, compare *presence*: a missing
    // glow or a rounded-vs-masked edge is pixel-obvious, while exact value strings
    // (blur radii, mask gradients) drift across engines and would be noise.
    compareTreatment(exp, act, 'filter', exp.filter, act.filter)
    compareTreatment(exp, act, 'textShadow', exp.textShadow, act.textShadow)
    compareTreatment(exp, act, 'mask', exp.maskEdge, act.maskEdge)
    // REQ-63 — effects beyond REQ-48's set. Frosted-glass (backdrop-filter) and an
    // outline are presence signals (value strings drift across engines); blend mode
    // and injected pseudo-content carry a meaningful discrete value, so compare it.
    compareTreatment(exp, act, 'backdropFilter', exp.backdropFilter, act.backdropFilter)
    compareTreatment(exp, act, 'outline', exp.outline, act.outline)
    compareValueField(exp, act, 'blendMode', exp.blendMode, act.blendMode)
    compareValueField(exp, act, 'pseudo', exp.pseudo, act.pseudo)
    // REQ-63 — element opacity. A ghosted (partial-opacity) element vs a solid one
    // is a tonal defect no colour field holds; a small tolerance absorbs rounding.
    if (exp.opacity !== undefined && act.opacity !== undefined) {
      const dOp = Math.abs(exp.opacity - act.opacity)
      if (dOp > opacityValueTol) push(exp, 'opacity', `${exp.opacity}`, `${act.opacity}`, dOp)
    }
    compareMedia(exp, act)
    // REQ-48 (item 1) — transform: a mis-rotated collage layer or a wrong scale.
    // Rotation ±2° / scale ±0.05 tolerances absorb sub-degree matrix rounding.
    // (transform-origin displacement needs no field — box is the effective
    // post-transform rect and already surfaces as a position delta.)
    if (exp.transformRotateDeg !== undefined && act.transformRotateDeg !== undefined) {
      const dr = Math.abs(exp.transformRotateDeg - act.transformRotateDeg)
      if (dr > 2) push(exp, 'transform', `rot ${exp.transformRotateDeg}°`, `rot ${act.transformRotateDeg}°`, dr)
    }
    if (exp.transformScale !== undefined && act.transformScale !== undefined) {
      const ds = Math.abs(exp.transformScale - act.transformScale)
      if (ds > 0.05) push(exp, 'transform', `×${exp.transformScale}`, `×${act.transformScale}`, ds)
    }
    // REQ-48 (item 1) — declared motion presence. A hover-scale / entrance /
    // scroll-reveal present in the reference but absent in the repro (or vice
    // versa) leaves no resting-frame signal; its declaration does.
    if (exp.motion !== undefined && act.motion !== undefined && (exp.motion ?? null) !== (act.motion ?? null)) {
      push(exp, 'motion', exp.motion ?? 'none', act.motion ?? 'none')
    }
  }

  // REQ-48 (item 4) — media fidelity for captured photo children (a11yRole
  // `img`). Two rendered facts a text-run manifest can't hold: `object-fit`
  // (a `fill` where the reference `cover`s stretches the photo) and the rendered
  // box aspect ratio — a portrait meant to be a circle (1:1) rendered as an
  // ellipse (≠1) is the same box size within px tolerance yet visibly wrong.
  const compareMedia = (exp: ValueElement, act: ValueElement): void => {
    const media = exp.a11yRole === 'img' && act.a11yRole === 'img'
    if (!media) return
    if (exp.objectFit != null && act.objectFit != null && exp.objectFit !== act.objectFit) {
      push(exp, 'objectFit', exp.objectFit, act.objectFit)
    }
    // REQ-63 — how the image crops within its box. A `top`/`bottom` shift vs a
    // centred crop reframes the photo at the same box + fit; compared exactly.
    compareValueField(exp, act, 'objectPosition', exp.objectPosition, act.objectPosition)
    if (exp.box && act.box && exp.box.height > 0 && act.box.height > 0) {
      const ea = exp.box.width / exp.box.height
      const aa = act.box.width / act.box.height
      const rel = Math.abs(ea - aa) / Math.max(ea, aa)
      // 10% aspect drift is a shape change the eye reads (circle → ellipse),
      // well past the sub-px jitter a px size tolerance would swallow.
      if (rel > 0.1) push(exp, 'aspect', `${ea.toFixed(2)}:1`, `${aa.toFixed(2)}:1`, rel)
    }
  }

  // REQ-48 (item 3) — emit a treatment delta when a treatment's *presence*
  // differs between the paired elements (guarded on the field existing on both,
  // so pre-REQ-48 bundles that carry neither stay inert).
  const compareTreatment = (
    exp: ValueElement,
    act: ValueElement,
    property: DeltaProperty,
    e: string | null | undefined,
    a: string | null | undefined,
  ): void => {
    if (e === undefined || a === undefined) return
    if (!!e !== !!a) push(exp, property, e ? 'present' : 'none', a ? 'present' : 'none')
  }

  // REQ-63 — emit a delta when a treatment's discrete VALUE differs (not just its
  // presence): italic vs oblique, underline vs line-through, uppercase vs
  // capitalize, `top` vs `center` crop. Null-normalised and case-folded, so a
  // painted value vs its absence is a delta while `normal`↔absent is not. Guarded
  // on both sides carrying the field, so a pre-REQ-63 reference stays inert.
  const compareValueField = (
    exp: ValueElement,
    act: ValueElement,
    property: DeltaProperty,
    e: string | null | undefined,
    a: string | null | undefined,
  ): void => {
    if (e === undefined || a === undefined) return
    const eStr = (e ?? '').toLowerCase()
    const aStr = (a ?? '').toLowerCase()
    if (eStr !== aStr) push(exp, property, e ?? 'none', a ?? 'none')
  }

  // REQ-73 — every paired element with a box, for the adjacent-gap axis below.
  const gapPairs: Array<{ exp: ValueElement; act: ValueElement }> = []

  // ── text-free fields (REQ-47): pair by a11yRole + document order ─────────────
  for (const exp of expected.elements) {
    if (!exp.textless) continue
    const start = deltas.length
    const q = fieldQueues.get(exp.a11yRole ?? exp.role)
    const act = q && q.length > 0 ? q.shift() : undefined
    if (!act) {
      unmatched++
      push(exp, 'missing', 'present', 'absent')
      cards.push(buildObjectCard(exp, undefined, objectDeltas(start)))
      continue
    }
    matched++
    // Containment: is the accessible name rendered *inside* the field box
    // (placeholder) or *outside* it (label/aria)? The placeholder-inside vs
    // label-above defect the perceptual + value diffs both miss.
    if (nameContained(exp.nameSource) !== nameContained(act.nameSource)) {
      push(exp, 'containment', nameSourceLabel(exp.nameSource), nameSourceLabel(act.nameSource))
    }
    compareGeometry(exp, act)
    if (exp.box && act.box) gapPairs.push({ exp, act })
    cards.push(buildObjectCard(exp, act, objectDeltas(start)))
  }

  // When a text bucket holds several candidates — repeated text like "✓", "Read
  // more", "→", a duplicated nav label — pair by NEAREST rendered position rather
  // than document-order FIFO, so an occurrence in one card can't cross-pair with
  // an identical one in another (the checkmark swap was one instance of this;
  // the fix is general to all duplicate text). A single candidate (unique text)
  // is taken as-is — order is irrelevant then, and boxes may legitimately differ.
  const takeMatch = (q: ValueElement[] | undefined, exp: ValueElement): ValueElement | undefined => {
    if (!q || q.length === 0) return undefined
    if (q.length === 1 || !exp.box) return q.shift()
    const ex = exp.box.x + exp.box.width / 2
    const ey = exp.box.y + exp.box.height / 2
    let bestI = 0
    let bestD = Infinity
    for (let i = 0; i < q.length; i++) {
      const b = q[i].box
      if (!b) continue
      const dx = b.x + b.width / 2 - ex
      const dy = b.y + b.height / 2 - ey
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        bestI = i
      }
    }
    return q.splice(bestI, 1)[0]
  }

  for (const exp of expected.elements) {
    if (exp.textless) continue
    const start = deltas.length
    const q = queues.get(joinKey(exp.text))
    const act = takeMatch(q, exp)
    if (!act) {
      unmatched++
      push(exp, 'missing', 'present', 'absent')
      cards.push(buildObjectCard(exp, undefined, objectDeltas(start)))
      continue
    }
    matched++

    // Verbatim content. Elements pair on the case-folded, whitespace-collapsed
    // key, so a pairing that survives can still differ in casing — small-caps
    // "Gigabyte Alchemy" rendered as literal "GIGABYTE ALCHEMY" is a content
    // delta both screenshots and computed styles miss (the join hid it, not a
    // font). Compare the collapsed forms case-sensitively; whitespace-only
    // formatting noise stays ignored because both sides are collapsed first.
    // REQ-48 (item 9) — when the year mask is on, compare year-normalized forms
    // so a paired run differing *only* by a calendar year reads as unchanged,
    // while any other casing/word change on the same run still surfaces.
    const expText = maskYears ? normalizeYears(exp.text) : exp.text
    const actText = maskYears ? normalizeYears(act.text) : act.text
    if (collapse(expText) !== collapse(actText)) {
      push(exp, 'text', exp.text, act.text)
    }

    // A colour the capture had to infer (fallback #000/#fff) is low-confidence
    // reference data, not a real target — never a hard delta (REQ-35).
    if (!exp.colorInferred) {
      const dE = colorDistance(exp.color, act.color)
      if (dE > colorTol) push(exp, 'color', exp.color, act.color, dE)
    }
    // REQ-58 (item 3b) — card/panel fill behind the run, compared like `color`
    // (ΔE). The card background is not its own object, so without this a
    // slightly-off panel colour (Presence/Positivity/Connection) is invisible —
    // only the text colour is checked. Compared only when both sides carry it.
    if (exp.surfaceFill && act.surfaceFill) {
      const dEfill = colorDistance(exp.surfaceFill, act.surfaceFill)
      if (dEfill > colorTol) push(exp, 'surfaceFill', exp.surfaceFill, act.surfaceFill, dEfill)
    }
    if (Math.abs(exp.fontSizePx - act.fontSizePx) > fontSizeTol) {
      push(exp, 'fontSizePx', `${exp.fontSizePx}`, `${act.fontSizePx}`, Math.abs(exp.fontSizePx - act.fontSizePx))
    }
    if (Math.abs(exp.fontWeight - act.fontWeight) > weightTol) {
      push(exp, 'fontWeight', `${exp.fontWeight}`, `${act.fontWeight}`)
    }
    if (exp.fontFamily.toLowerCase() !== act.fontFamily.toLowerCase()) {
      push(exp, 'fontFamily', exp.fontFamily, act.fontFamily)
    }
    // REQ-63 — typography treatment axes. Each was a whole property the diff never
    // saw: an italic vs roman, a dropped underline, a CSS `uppercase` vs a literal
    // one, a small-caps wordmark, a bullet vs a numbered marker. Value-compared
    // (null-normalised), guarded on both sides carrying the field.
    compareValueField(exp, act, 'fontStyle', exp.fontStyle, act.fontStyle)
    compareValueField(exp, act, 'textDecoration', exp.textDecoration, act.textDecoration)
    compareValueField(exp, act, 'textTransform', exp.textTransform, act.textTransform)
    compareValueField(exp, act, 'fontVariant', exp.fontVariant, act.fontVariant)
    compareValueField(exp, act, 'listMarker', exp.listMarker, act.listMarker)
    if (exp.gradient !== undefined) {
      const e = exp.gradient
      const a = act.gradient ?? null
      const ok = (!e && !a) || (!!e && !!a && gradientsMatch(e, a, angleTol, gradientPosTol))
      if (!ok) push(exp, 'gradient', gradientLabel(e), gradientLabel(a))
    }
    // REQ-62 — panel/card gradient fill behind the run, compared like the text-fill
    // `gradient` axis (stops + direction). Catches the false match a render-only fix
    // would produce: without a captured surface gradient, a missing panel gradient
    // reads identically to a present one (both composite through to the band).
    if (exp.surfaceGradient !== undefined) {
      const e = exp.surfaceGradient
      const a = act.surfaceGradient ?? null
      const ok = (!e && !a) || (!!e && !!a && gradientsMatch(e, a, angleTol, gradientPosTol))
      if (!ok) push(exp, 'surfaceGradient', gradientLabel(e), gradientLabel(a))
    }
    if (exp.borderLeft !== undefined) {
      const e = exp.borderLeft
      const a = act.borderLeft ?? null
      const ok =
        (!e && !a) ||
        (!!e && !!a && Math.abs(e.widthPx - a.widthPx) <= borderWidthTol && e.color.toLowerCase() === a.color.toLowerCase())
      if (!ok) push(exp, 'borderLeft', borderLabel(e), borderLabel(a))
    }
    if (exp.lineHeightPx !== undefined && act.lineHeightPx !== undefined) {
      const lineHeightTol = Math.max(lineHeightFloor, lineHeightRatio * exp.lineHeightPx)
      if (Math.abs(exp.lineHeightPx - act.lineHeightPx) > lineHeightTol) {
        push(exp, 'lineHeightPx', `${exp.lineHeightPx}`, `${act.lineHeightPx}`)
      }
    }
    if (exp.letterSpacingPx !== undefined && act.letterSpacingPx !== undefined) {
      if (Math.abs(exp.letterSpacingPx - act.letterSpacingPx) > letterSpacingTol) {
        push(exp, 'letterSpacingPx', `${exp.letterSpacingPx}`, `${act.letterSpacingPx}`)
      }
    }
    if (exp.paddingLeftPx !== undefined && act.paddingLeftPx !== undefined) {
      if (Math.abs(exp.paddingLeftPx - act.paddingLeftPx) > paddingTol) {
        push(exp, 'paddingLeftPx', `${exp.paddingLeftPx}`, `${act.paddingLeftPx}`)
      }
    }
    // REQ-64 — the other three padding sides (Type-A). Only paddingLeft was
    // compared, so a card's internal top/right/bottom pad (a box that reads
    // narrower/taller) was invisible. Same integer-px tolerance as paddingLeft.
    const comparePadSide = (
      prop: 'paddingTopPx' | 'paddingRightPx' | 'paddingBottomPx',
      e?: number,
      a?: number,
    ): void => {
      if (e !== undefined && a !== undefined && Math.abs(e - a) > paddingTol) {
        push(exp, prop, `${e}`, `${a}`, Math.abs(e - a))
      }
    }
    comparePadSide('paddingTopPx', exp.paddingTopPx, act.paddingTopPx)
    comparePadSide('paddingRightPx', exp.paddingRightPx, act.paddingRightPx)
    comparePadSide('paddingBottomPx', exp.paddingBottomPx, act.paddingBottomPx)
    // REQ-64 — text-align (Type-A). A centred-vs-left run was only visible
    // indirectly as a position/box shift; compare the authored value directly.
    if (exp.textAlign !== undefined && act.textAlign !== undefined && exp.textAlign !== act.textAlign) {
      push(exp, 'textAlign', exp.textAlign, act.textAlign)
    }
    // REQ-64 — font fallback, reverse direction. The unilateral `fontLoad` pass
    // (below, on the whole manifest) fires when OUR render falls back; this catches
    // the mirror — the REFERENCE shows a fallback but ours resolved the intended
    // face, still a difference from the target. `fontLoaded` is false only when a
    // fallback rendered; absent ⇒ loaded.
    if (exp.fontLoaded === false && act.fontLoaded !== false) {
      push(exp, 'fontLoad', 'fallback', 'intended face')
    }

    // REQ-47 — a text run also carries geometry: the hero heading 195px out of
    // position, a mis-sized box, a squared-off corner, a stacked-vs-inline button.
    compareGeometry(exp, act)
    if (exp.box && act.box) gapPairs.push({ exp, act })
    cards.push(buildObjectCard(exp, act, objectDeltas(start)))
  }

  // REQ-73 — the adjacent-GAP axis: vertical spacing in the coordinate that matters
  // (the relative gap between stacked rows), not the band-padding component or the
  // absolute position that accumulates drift. Group paired elements into visual ROWS
  // by reference y-overlap (so a row of cards is one row, measured at its max bottom),
  // then compare the gap between consecutive rows. `expected - actual` IS the linear
  // correction: how many px to add/remove from the one spacing knob (`gap = base + pad`).
  {
    interface Row { refTop: number; refBot: number; ourTop: number; ourBot: number; label: string }
    const items = gapPairs
      .map((p) => ({
        rt: p.exp.box!.y,
        rb: p.exp.box!.y + p.exp.box!.height,
        at: p.act.box!.y,
        ab: p.act.box!.y + p.act.box!.height,
        text: p.exp.text,
      }))
      .sort((a, b) => a.rt - b.rt)
    const rows: Row[] = []
    for (const it of items) {
      const last = rows[rows.length - 1]
      // Same visual row when it starts before the current row's reference bottom.
      if (last && it.rt < last.refBot - 2) {
        last.refBot = Math.max(last.refBot, it.rb)
        last.ourBot = Math.max(last.ourBot, it.ab)
        if (it.rt < last.refTop) last.refTop = it.rt
        if (it.at < last.ourTop) last.ourTop = it.at
      } else {
        rows.push({ refTop: it.rt, refBot: it.rb, ourTop: it.at, ourBot: it.ab, label: it.text })
      }
    }
    for (let i = 0; i + 1 < rows.length; i++) {
      const refGap = rows[i + 1].refTop - rows[i].refBot
      const ourGap = rows[i + 1].ourTop - rows[i].ourBot
      // Only real vertical separations (both rows genuinely stacked, not overlapping).
      if (refGap < -2 || ourGap < -2) continue
      const d = Math.abs(refGap - ourGap)
      if (d > gapTol) {
        const short = (s: string): string => (s.length > 22 ? `${s.slice(0, 21)}…` : s)
        record(
          `${short(rows[i].label)} → ${short(rows[i + 1].label)}`,
          'gap',
          'gap',
          `${Math.round(refGap)}px`,
          `${Math.round(ourGap)}px`,
          d,
        )
      }
    }
  }

  // REQ-51 — repro objects left in the pairing queues matched no reference
  // object ("M repro objects matched nothing"). Collected before the year mask /
  // systemic passes below add non-object deltas, so this stays object-only.
  const unpairedActual: UnpairedObject[] = []
  for (const q of queues.values()) for (const el of q) unpairedActual.push(toUnpaired(el))
  for (const q of fieldQueues.values()) for (const el of q) unpairedActual.push(toUnpaired(el))

  // Section-level values (scrim, vertical anchor) — no text to join on, so
  // aligned by ordinal index. Extra sections on either side (a segmentation
  // mismatch, not a value delta) have no counterpart and are skipped.
  const actBySection = new Map<number, SectionValues>()
  for (const s of actual.sections ?? []) actBySection.set(s.index, s)
  for (const es of expected.sections ?? []) {
    const as = actBySection.get(es.index)
    if (!as) continue
    const label = `§${es.index}`

    const eo = es.overlay
    const ao = as.overlay
    const overlayOk =
      (!eo && !ao) ||
      (!!eo &&
        !!ao &&
        eo.color.toLowerCase() === ao.color.toLowerCase() &&
        Math.abs(eo.opacity - ao.opacity) <= opacityTol)
    if (!overlayOk) record(label, 'section', 'overlay', overlayLabel(eo), overlayLabel(ao))

    if (es.contentAnchorRatio !== null && as.contentAnchorRatio !== null) {
      if (Math.abs(es.contentAnchorRatio - as.contentAnchorRatio) > anchorTol) {
        record(label, 'section', 'contentAnchor', anchorLabel(es.contentAnchorRatio), anchorLabel(as.contentAnchorRatio))
      }
    }
    // REQ-73 — section band vertical padding is NOT compared: it is one COMPONENT of
    // the emergent gap (`gap = base + padding`), and the reference distributes the same
    // visual gap differently (margins vs our padding), so matching the band-padding
    // number is padding-vs-margin noise that fights the visual. The `gap` axis (below)
    // measures the sum that actually matters.
    // REQ-64 — section band text-align (Type-A).
    if (es.textAlign !== undefined && as.textAlign !== undefined && es.textAlign !== as.textAlign) {
      record(label, 'section', 'textAlign', es.textAlign, as.textAlign)
    }
  }

  // REQ-48 (item 5) — viewport-match precondition. Layout recomposes per width,
  // so two sides shot at different viewports produce deltas that are artefacts of
  // the width mismatch, not real fidelity gaps — a false-positive trap. When both
  // carry a viewport and the widths differ, lead with a CRITICAL `viewport` delta
  // so the operator fixes the shot before trusting anything below it.
  if (expected.viewport && actual.viewport && expected.viewport.width !== actual.viewport.width) {
    record(
      '§viewport',
      'document',
      'viewport',
      `${expected.viewport.width}w`,
      `${actual.viewport.width}w`,
      Math.abs(expected.viewport.width - actual.viewport.width),
    )
  }

  // REQ-48 (item 5) — no-horizontal-overflow check on our own render. Any element
  // whose right edge exceeds the viewport forces a horizontal scrollbar — the
  // mobile reflow break (a wordmark that won't wrap at 320px). Unilateral: it
  // needs no reference, so it fires even when the reference side is absent.
  for (const e of horizontalOverflows(actual)) {
    const right = Math.round(e.box!.x + e.box!.width)
    record(e.text, e.role, 'overflow', `≤${actual.viewport!.width}w`, `${right}w`, right - actual.viewport!.width)
  }

  // REQ-48 (item 7) — web-font load. An element that fell back to a different
  // face renders with different metrics; skip the wait and the whole suite is
  // flaky, so a positively-detected fallback is a HIGH delta on our own render.
  for (const e of unresolvedFonts(actual)) {
    record(e.text, e.role, 'fontLoad', 'intended face', `fallback (${e.fontFamily})`)
  }

  // REQ-48 (item 9) — drop deltas an explicit ignore-mask claims are correct-by-
  // design dynamic content (live counters, "N days ago", A/B slots). A mask hits
  // when its pattern matches the element text or either side's value. (The
  // calendar-year case is handled structurally above, at the join key + text
  // compare, so it never reaches here.) Filtering happens *after* recording — so
  // `suppressed` is an honest count — and *before* the sort, so a masked row can
  // never rank. `ignore`/`isIgnored` are compiled once at the top of the function
  // (the object cards filter through the same mask); reused here for the flat list.
  let kept = ignore.length > 0 ? deltas.filter((d) => !isIgnored(d)) : deltas
  let suppressed = deltas.length - kept.length

  // REQ-56 — component-subscale attribution. When a badge / checklist subscale
  // differs systemically, emit one theme-level finding and (option C default)
  // roll up the per-element rows it explains, so exact-match (REQ-53) doesn't
  // present a systemic theme gap as a wall of identical per-element failures.
  // `keepSubscaleDeltas` is the debugging opt-out that keeps those rows. This
  // runs before the generic aggregation below, which skips these `systemic` rows.
  const escThreshold = Math.max(1, opts.systemicThreshold ?? 5)
  const sub = attributeSubScales(
    expected,
    actual,
    kept,
    joinKey,
    escThreshold,
    opts.keepSubscaleDeltas ?? false,
  )
  kept = sub.kept
  suppressed += sub.rolledUp
  kept.push(...sub.rows)

  // REQ-48 (item 8a) — systemic sub-threshold aggregation. A LOW/MEDIUM delta
  // that repeats across many elements is individually quiet but collectively
  // obvious (the near-black-vs-slate body tone that slipped past on ~30 runs).
  // Per-element ranking buries it, so for each such kind seen on ≥N elements we
  // emit one synthetic row whose tier is escalated by pervasiveness. The
  // per-element rows stay — the aggregate is an *added* headline, not a rollup.
  const systemicThreshold = opts.systemicThreshold ?? 5
  if (systemicThreshold > 0) {
    const byKind = new Map<DeltaKind, ValueDelta[]>()
    for (const d of kept) {
      if (d.systemic) continue
      if (KIND_TIER[d.kind] !== 'LOW' && KIND_TIER[d.kind] !== 'MEDIUM') continue
      const g = byKind.get(d.kind)
      if (g) g.push(d)
      else byKind.set(d.kind, [d])
    }
    for (const [kind, group] of byKind) {
      if (group.length < systemicThreshold) continue
      const count = group.length
      const tier = escalateTier(KIND_TIER[kind], count, systemicThreshold)
      const sample = group[0]
      kept.push({
        text: `⟨${count} elements⟩`,
        role: 'aggregate',
        property: sample.property,
        expected: `systemic ${kind} drift ×${count}`,
        actual: `e.g. ${sample.expected} → ${sample.actual}`,
        kind,
        tier,
        magnitude: count,
        severity: severityForTier(tier, kind, count),
        systemic: true,
        count,
        valueType: sample.valueType,
      })
    }
  }

  // Stable sort by composite severity = (tier, kind-within-tier, magnitude), so a
  // small structural defect always outranks a large tonal one and, within a kind,
  // the larger magnitude leads. Equal keys keep document order (V8 sort is stable).
  kept.sort((a, b) => b.severity - a.severity)
  return {
    expectedSource: expected.source,
    actualSource: actual.source,
    matched,
    unmatched,
    deltas: kept,
    suppressed,
    objects: cards,
    unpairedActual,
  }
}

/** The `{engine}:{width}:{state}` pairing key for one projection (REQ-48). */
function projectionKey(engine: RenderEngine, viewportWidth: number, state: InteractionState): string {
  return `${engine}:${viewportWidth}:${state}`
}

/**
 * Pick the single projection to represent a viewport width. The diff and the
 * responsive table both need one deterministic cell per width, so prefer Chromium
 * at rest (the capture's primary cell), then any engine at rest, then whatever
 * exists at that width. Returns undefined when the ladder never reached it.
 */
export function selectProjectionAtWidth(
  reference: MultiStateCapture,
  width: number,
): StateProjection | undefined {
  const atWidth = reference.projections.filter((p) => p.viewport.width === width)
  if (atWidth.length === 0) return undefined
  return (
    atWidth.find((p) => p.engine === 'chromium' && p.state === 'rest') ??
    atWidth.find((p) => p.state === 'rest') ??
    atWidth[0]
  )
}

/**
 * REQ-48 (items 1, 5, 6) — diff a reproduction against a reference across the
 * whole multi-state matrix. Each reference projection is paired with the repro
 * projection shot in the *same* `{engine, viewport-width, state}` cell and diffed
 * there; a hover-scale is compared hover↔hover, a mobile reflow at 375↔375, a
 * WebKit shift on WebKit — never bled across cells where the resting / desktop /
 * Blink frame would mask it. A reference cell the repro never projected is a
 * coverage gap (`missing: true`, `report: null`), surfaced rather than silently
 * counted clean. Results are ordered by descending max severity so the worst cell
 * leads.
 */
export function diffMultiState(
  reference: MultiStateCapture,
  repro: MultiStateCapture,
  opts: DiffOptions = {},
): StateDiff[] {
  const reproByKey = new Map<string, StateProjection>()
  for (const p of repro.projections) {
    reproByKey.set(projectionKey(p.engine, p.viewport.width, p.state), p)
  }

  const out: StateDiff[] = reference.projections.map((ref) => {
    const key = projectionKey(ref.engine, ref.viewport.width, ref.state)
    const match = reproByKey.get(key)
    if (!match) {
      return { engine: ref.engine, viewportWidth: ref.viewport.width, state: ref.state, report: null, missing: true }
    }
    return {
      engine: ref.engine,
      viewportWidth: ref.viewport.width,
      state: ref.state,
      report: diffManifests(ref.manifest, match.manifest, opts),
      missing: false,
    }
  })

  // Worst cell first: a missing cell is maximally severe (nothing to compare), then
  // by the top delta's severity within each cell.
  const worst = (d: StateDiff): number =>
    d.missing ? Number.POSITIVE_INFINITY : (d.report?.deltas[0]?.severity ?? 0)
  out.sort((a, b) => worst(b) - worst(a))
  return out
}
