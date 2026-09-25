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
 *
 *      REQ-274 — neither of them reads either input any more. Every axis they
 *      carry is a row in `value-axes.ts`, declared once with BOTH sides stated,
 *      so an axis is projected on both sides or on neither and a side that
 *      cannot supply one says so where the axis is defined. The two independent
 *      ~90-line bodies these used to be were the mechanism by which an axis
 *      could be recorded on one side only with nothing able to notice.
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
  SurfaceShape,
  TextGradient,
  ThemeSubScale,
  ThemeSubScales,
  Viewport,
} from './types'
import type { RawRun, RawSignals } from './extract'
import { captureSchemaOf } from './schema'
import { colorDistance } from './color-values'
// REQ-274 — the single declaration site for every value axis, and the only thing
// that reads either side's input. See `value-axes.ts` for why this module no
// longer projects anything itself.
import {
  observedUnmeasuredAxes,
  projectCaptureManifestAxes,
  projectCaptureSection,
  projectContentRun,
  projectField,
  projectRawRun,
  projectSignalsBand,
  projectSignalsManifestAxes,
  type UnmeasuredAxis,
} from './value-axes'

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
  /**
   * REQ-88 — rect of the element that PAINTS {@link borderLeft}, when a different
   * element does. A border paints inside its own border box, so the bar's position
   * belongs to its bearer; a reproduction without this can only draw the accent on
   * the run, indented by the bearer's padding and overlapping the first glyph.
   */
  accentBox?: Box | null
  paddingLeftPx?: number
  /**
   * REQ-64 — the other three padding sides + normalized text-align. Type-A
   * (authored) axes that were invisible: a wrong card top/right/bottom pad or a
   * centred-vs-left run only showed up indirectly as `size`/`position` drift.
   *
   * REQ-274 — on a TEXT RUN these four are UNMEASURED, and the fact is now
   * reported rather than silent. REQ-64 added them to the live extraction and to
   * the comparator; `ContentRun` never grew them, so the reference side supplies
   * nothing, the comparator's both-sides guard skips every run, and four
   * compared axes have read clean by construction ever since. Declared as a
   * reference-side gap in `value-axes.ts`, which is what puts them on
   * {@link ValuesDiffReport.unmeasuredAxes} and on the gate's pass rung. A
   * text-FREE element records all four on both sides (REQ-269 #1).
   */
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
  // ── REQ-211 the inline flow this run belongs to ────────────────────────────
  //
  // A sentence with an emphasised word is several text nodes and has always been
  // captured as several runs. These say which runs are pieces of one flow, so
  // the fold can rejoin them into one node instead of pinning each fragment at
  // its own absolute box — which comes apart the moment the copy reflows.
  // Optional so pre-REQ-211 bundles still parse; a single-run flow carries none
  // of them, so nothing is recorded about the overwhelmingly common case.
  /** Identifies the inline flow: its root element, and which `<br>`-delimited line of it. */
  inlineGroup?: string
  /** This run's position in that flow, in document order. */
  inlineIndex?: number
  /** The flow root's own rect — the box the rejoined runs lay out inside. */
  inlineBox?: Box | null
  /** This run's text with its OWN separating spaces kept (`text` is trimmed). */
  textFlow?: string
  /** Computed `vertical-align` when the run is lifted off the baseline, else null. */
  verticalAlign?: string | null
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
  /**
   * BUG-22 — the box that actually PAINTS the surface behind this run, and its
   * shape. `self: true` on a conventional page (a `<button>` paints its own pill);
   * `self: false` in an L1 reproduction, whose flat tree paints a control's
   * surface on a sibling backing box while the label is its own text node. The
   * pairing joins on text and therefore lands on the label, whose own
   * `borderRadiusPx` reads 0 — so the diff resolves a split control's surface
   * axes (and the surface's geometry) against this bearing node instead.
   * Absent on pre-BUG-22 manifests, which keeps the resolution inert.
   */
  surface?: SurfaceShape | null
  /** ARIA role — the browser's framework-agnostic semantic label. */
  a11yRole?: string
  /**
   * REQ-269 — the navigation target of the nearest enclosing anchor, else absent.
   * Behavioural rather than painted — it moves no pixel — so it is carried for the
   * fold's `link` derivation (REQ-106) and, like `controlType`/`formAction`, is
   * deliberately not diffed as a value axis. Its CONSEQUENCE is compared: an `<a>`
   * the reproduction emits reads back as `a11yRole: link`.
   */
  href?: string | null
  /**
   * REQ-269 — the outline depth of the nearest enclosing heading, else absent.
   * Carried for the same reason and on the same terms as {@link href}: `a11yRole`
   * flattens all six heading tags to one word, so this is the half of the heading
   * role nothing else on this element holds, and the fold needs it to author L1's
   * `heading`. Its consequence is what the diff sees — a reproduction that emits
   * an `<h2>` reads back as `a11yRole: heading` where it used to read `generic`.
   */
  headingLevel?: number | null
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
  /** REQ-92 — a media element's resolved source URL, else null. The substance an L1
   *  `image` leaf carries (`RawSignals.images` never reaches the fold, so the src is
   *  captured onto the media field and flows through the manifest here). */
  src?: string | null
  /** REQ-92 — a media element's `alt` text, else null (the L1 `image` leaf's `alt`). */
  alt?: string | null
  /**
   * BUG-27 — the CSS `background-image` a text-free box paints (absolute URL on the
   * reference side, site-local `/assets/…` on ours), else null. A pixel-mover: on a
   * photography-led page it IS the page, so it is compared as a value axis (by
   * mirrored basename, since the two sides name the same bytes differently).
   */
  backgroundImageUrl?: string | null
  /** REQ-47 — a text-free control's accessible name (empty when unlabelled). */
  accessibleName?: string
  /**
   * REQ-47 — where the accessible name is rendered: `placeholder` = inside the
   * field box, `label`/`aria` = outside/above it. The fact that distinguishes
   * placeholder-inside from label-above — neither geometry nor text can see it.
   */
  nameSource?: NameSource | null
  /**
   * REQ-93 — a form control's authored input type and its enclosing form's
   * submission endpoint. Behavioural, not painted: they move no pixel, so they
   * are carried for the fold's behavior-module derivation and are deliberately
   * *not* diffed as value axes.
   */
  controlType?: string | null
  formAction?: string | null
  /**
   * REQ-265 — the RENDERED colour of a control's placeholder ink (`#rrggbb`),
   * composited over what the field sits on; null/absent when the control has
   * none. A placeholder is painted by a UA pseudo-element that inherits nothing,
   * so it is described by no other axis here — a reference that keeps the browser
   * default and a reproduction that re-points it at the field's own colour match
   * on every value the diff compared and differ by the whole of the ink.
   */
  placeholderColor?: string | null
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
  /**
   * REQ-271 — the band's own base fill (`#rrggbb`), or `null` when the band
   * paints none. The most visually dominant property of a page, and until this
   * axis existed it was compared by NOTHING: a reproduction could paint an
   * opaque navy plate under a hero the reference paints nothing on and the value
   * gate reported zero deltas for it.
   *
   * `undefined` means UNMEASURED, and is the honest answer for a capture bundle
   * taken before schema 3 (REQ-271), whose transparent bands were all recorded
   * as an opaque fabrication of the body's colour. Asserting that white would
   * fire a false delta for every transparent band on the axis's first run.
   */
  surfaceFill?: string | null
  /**
   * BUG-13 — the section band's CSS `background-image` as a foldable URL, absent
   * when the band paints no image. The page's hero + section imagery is painted
   * as `background-image` on the band, not as `<img>` elements, so it never
   * reaches the element manifest; carrying it here lets the fold emit a
   * section-background `box` (`backgroundImageUrl`) placed by the band geometry.
   * Only URLs that pass the L1 URL-scheme allowlist (http/https/relative) are
   * recorded — a `data:`/other-scheme background would fail the envelope, so it
   * is skipped at projection time rather than throwing in the fold.
   */
  backgroundImageUrl?: string
  /** BUG-13 — the section band's geometry (full-page document coords), so the
   *  fold can place the background box. REQ-88 carries it on EVERY section (both
   *  projection paths set it unconditionally) — it is section geometry, not image
   *  metadata — and BUG-102's geometry join reads it as the pairing key. Optional
   *  only so pre-REQ-88 manifests, which carried it for image bands alone, parse. */
  box?: Box
}

/** A flat, structured value manifest — the single artifact the diff and a human both read. */
export interface ValueManifest {
  /** Where these values came from (a capture host/path, or `draft:<slug>`). */
  source: string
  elements: ValueElement[]
  /** Section-level treatments (scrim, vertical anchor), aligned by ordinal index. */
  sections: SectionValues[]
  /**
   * BUG-27 — the page's base fill: what shows through wherever no band paints.
   * The fold used to *infer* this from the fills its runs sit on, which reads the
   * page correctly only when the biggest band is the page. On a hero-led page the
   * biggest run surface is the hero's backdrop, so the whole page reproduced in
   * the hero's colour. The capture knew the answer all along and never carried it.
   * Optional so pre-BUG-27 manifests parse (the fold falls back to inference).
   */
  bodyBackground?: string
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
  // ── BUG-107 — the browser's own semantic role, and the outline depth it flattens ──
  | 'a11yRole'
  | 'headingLevel'
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
  // ── BUG-27 — the painted CSS background image (the hero / section imagery) ──
  | 'backgroundImage'
  // ── REQ-265 — a control's placeholder ink (a UA pseudo-element inherits nothing) ──
  | 'placeholderColor'
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
  // ── BUG-107 — the document outline: what the browser says each run IS ──────
  | 'semantics'
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
  /**
   * BUG-102 — how each *reference* section paired with a repro band, in document
   * order. The flat list reported `§0` as a delta while carrying nothing that said
   * what either side's section actually was, so a reader could not tell whether the
   * two `§0`s were even the same band. Empty when the sections could not be paired
   * at all ({@link sectionsNotComparable}).
   */
  sectionPairing: SectionPairing[]
  /**
   * BUG-111 — the reference sections {@link sectionPairing} left with no repro
   * band, lifted out of that array so a consumer that only ever COUNTS them does
   * not have to know its shape to find them. The fact existed only inside
   * `sectionPairing`, which the gate does not read, so a whole reference band —
   * with its own `contentAnchorRatio` and `textAlign` — went uncompared and was
   * reported by nothing the gate's own readers see.
   *
   * Still not a delta: BUG-102's classification stands, and a segmentation
   * mismatch is not a fidelity defect. What changes is that it is now COUNTED
   * rather than only described.
   *
   * Empty when the sections could not be paired at all ({@link
   * sectionsNotComparable}): that verdict stands in for the whole per-section
   * pass, and eight "unpaired" rows underneath it would be louder noise than the
   * single reason above them.
   */
  unpairedSections: UnpairedSection[]
  /**
   * REQ-308 — the reference bands lifted OUT of {@link unpairedSections} because
   * they are not surfaces at all, with the reason each was reclassified.
   *
   * A band with no fill, no background image and no overlay paints NOTHING. The
   * reproduction's bands are what the fold emits, and the fold emits a band node
   * only for a section carrying an image or an overlay (solid bands arrive as run
   * surfaces) — so there is no document any fold could produce that would have a
   * counterpart for it. Counting it as "a reference band with no reproduction
   * band to compare against" states a reproduction gap that does not exist and
   * cannot be closed: on gigabytealchemy it was the WHOLE of the round's
   * `unmeasured` number, and the band behind it is a `position: absolute`
   * transparent `<header>` lying over the hero — a content grouping, not a
   * surface.
   *
   * Reclassified rather than dropped. The band is still listed, still carries its
   * geometry, and now carries the reason it is not counted — so the fact remains
   * readable and only the CLAIM changes, which is the whole of BUG-111's
   * discipline applied to its own count.
   *
   * It does NOT rescue the anchor of the band this one lies over: REQ-270 still
   * declines that comparison, because the two sides measure it over different
   * populations of runs. Reclassifying a non-surface says nothing about that, and
   * is not allowed to pretend otherwise.
   *
   * Requires the fill to have been MEASURED as absent (`surfaceFill: null`). A
   * bundle taken before schema 3 records no fill measurement at all, so
   * "paints nothing" is unknowable there and the band stays unpaired.
   */
  nonSurfaceSections: NonSurfaceSection[]
  /**
   * BUG-111 — the repro-side mirror: bands no reference section paired to. The
   * reference-side count alone would read as "the reproduction has fewer bands",
   * which a page that segments DIFFERENTLY (rather than more coarsely) does not
   * do — gigabytealchemy's reproduction has seven bands to the reference's eight
   * and could equally have had nine.
   */
  unpairedActualSections: UnpairedSection[]
  /**
   * REQ-274 — the axes this diff COMPARES but only one side of the projection
   * can supply, so they were not evaluated on this run — or on any run.
   *
   * The comparator has always skipped an axis absent on one side; what it could
   * not do is say so, because nothing distinguished "both sides agree" from "one
   * side never had a value to disagree with". That silence is how REQ-64's four
   * Type-A text-run axes (`paddingTopPx`/`paddingRightPx`/`paddingBottomPx`/
   * `textAlign`) read clean on every reproduction of every site from the day
   * they were added to the comparator: they were added to the live extraction
   * and to the diff, never to `ContentRun`, so the reference had nothing to
   * compare and the both-sides guard skipped every run in silence.
   *
   * Never a delta — an axis nobody measured is not a defect found — but never
   * silence either: BUG-106 / BUG-111's discipline is that an unmeasured axis is
   * not a clean one, and the gate's pass rung enumerates these for exactly that
   * reason. Derived from the axis declaration, so a new half-projected axis
   * appears here the moment its row is written; narrowed to the axes this run
   * actually ran into, so a page that carries no value on the axis is not told
   * about a hole it never reached.
   */
  unmeasuredAxes: UnmeasuredAxis[]
  /**
   * BUG-139 — the per-scope measurements this run DECLINED, lifted out of
   * {@link sectionPairing} for the reason {@link unpairedSections} was: the fact
   * lived only in that array, and `gate.json` neither summarises it nor is read
   * by anything that would. So REQ-270's anchor refusal — the correct call, and
   * the one that hides the single section value on an overlapping-header page an
   * eye would actually check — cost nothing in the unmeasured count the round is
   * told to drive down, and a refusal that costs nothing is a refusal no round
   * is ever paid to fix.
   *
   * Distinct from {@link sectionsNotComparable}, which is the WHOLE per-section
   * pass declining at once (the flat-L1 degenerate case) and stands in for every
   * band; these are one axis on one band, on a pairing that otherwise compared
   * fine. Both are the same kind of fact and the console counts them together.
   *
   * Derived from the same pass that decides it, never recomputed, so the count
   * cannot disagree with the rows it summarises.
   */
  notComparableAxes: NotComparableAxis[]
  /**
   * BUG-102 — set when section-level values could not be compared AT ALL, with the
   * reason. A report fact, never a delta: a segmentation difference is not by itself
   * a fidelity defect, and a permanent diagnostic row would make `1c values-diff`
   * exit non-zero on a clean page forever.
   */
  sectionsNotComparable?: string
}

/**
 * BUG-102 — one reference section's pairing verdict. `actualLabel` is null when no
 * repro band overlapped it enough to be the same band; `overlap` is the vertical
 * IoU that decided it (0 when unpaired).
 */
export interface SectionPairing {
  /** `§n` on the reference side. */
  label: string
  /** The reference section's band geometry, when the manifest carries it. */
  box?: Box
  /** `§n` of the repro band it paired with, or null when unpaired. */
  actualLabel: string | null
  /** The paired repro band's geometry, when present. */
  actualBox?: Box
  /** Vertical intersection-over-union of the two bands; 0 when unpaired. */
  overlap: number
  /**
   * REQ-270 — whether `contentAnchor` was comparable on this pairing. `false`
   * when another, smaller reference section sits inside this one: the two sides
   * then measure the anchor over DIFFERENT POPULATIONS of runs and the numbers
   * are not the same measurement. Absent when it was comparable.
   */
  anchorComparable?: boolean
  /** Why the anchor was not comparable, when {@link anchorComparable} is false. */
  anchorReason?: string
  /**
   * REQ-308 — set when this unpaired reference band paints nothing and is
   * therefore not a surface (see {@link ValuesDiffReport.nonSurfaceSections}).
   * Absent on every paired band, and on an unpaired one that does paint.
   */
  nonSurfaceReason?: string
}

/**
 * BUG-111 — one band that had no counterpart on the other side. Carries the
 * geometry as well as the label, so a reader can locate the band on the page
 * without going back to `sectionPairing` to look it up — which is the trip this
 * ticket exists to remove.
 */
export interface UnpairedSection {
  /** `§n` on the side the band belongs to. */
  label: string
  /** The band's geometry, when that side's manifest carries it. */
  box?: Box
}

/**
 * BUG-139 — one measurement this run DECLINED to make, on one scope.
 *
 * REQ-270's anchor guard is the first of these: rather than compare two numbers
 * taken over different populations of runs it declines, and writes the refusal
 * onto the pairing row. That was the whole of the fact, and `sectionPairing` is
 * an array no consumer of `gate.json` opens — so a run that explicitly said it
 * could not measure something was counted, downstream, as having measured it and
 * found nothing wrong. The refusal now leaves the same array in a shape a
 * consumer that only COUNTS declinations can read, exactly as [[BUG-111]] lifted
 * the unpaired bands out of it.
 *
 * `{scope, axis}` deliberately mirrors {@link UnmeasuredAxis}: the two facts are
 * the same kind of fact one level apart — an axis nothing could read, and an
 * axis this scope could not be read ON — and a reader that can name one names
 * the other with no new format. `scope` is the `§n` band label rather than
 * {@link UnmeasuredAxis}'s manifest level, because a declination is per-band:
 * the page's OTHER bands compared that axis fine.
 */
export interface NotComparableAxis {
  /** `§n` of the band whose axis was not compared. */
  scope: string
  /** The axis that was declined on it. */
  axis: string
  /** Why, in the comparator's own words. */
  reason: string
}

/**
 * REQ-308 — a reference band that paints nothing, and is therefore not a surface
 * any reproduction could have a counterpart for. See
 * {@link ValuesDiffReport.nonSurfaceSections}.
 */
export interface NonSurfaceSection extends UnpairedSection {
  /** Why this band is not counted as unpaired, in the operator's terms. */
  reason: string
}

/**
 * One line per declination, for a report a human reads — the sibling of
 * `unmeasuredAxisLabel`, deliberately the same shape of line.
 */
export function notComparableAxisLabel(a: NotComparableAxis): string {
  return `${a.scope}.${a.axis} (not compared: ${a.reason})`
}

/**
 * REQ-51 — the object kinds the grouped view buckets by, for the card heading.
 * BUG-107 — `box` is the painted textless rectangle (a section band, a hero
 * backdrop, a card surface). It used to fall through to `control`, so a reader
 * of the gigabytealchemy round was told the reproduction had seven unpaired
 * *form controls* — every one of them a flat coloured band.
 */
export type ObjectKind = 'text' | 'image' | 'control' | 'divider' | 'box'

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
  /**
   * REQ-271 — where it is, and which manifest element it is. A `{label, role,
   * kind}` triple for an untexted box reads `{"label":"(generic)","role":
   * "generic","kind":"box"}` — seven of those told a reader the count and
   * nothing else: they could not be located on the page, so the values they
   * carried could not be checked against anything. Optional so pre-REQ-271
   * reports parse.
   */
  box?: Box
  /** REQ-271 — the object's index in the actual manifest's `elements`. */
  index?: number
}

// ── gradient normalization ───────────────────────────────────────────────────
//
// REQ-274 — the normalization itself now lives in `color-values.ts`, so the axis
// declaration can read a raw `background-image` into the same `TextGradient` the
// bundle stores without importing this module back. Re-exported here because
// this is where every caller has always found it.
export { colorToHex, colorDistance, normalizeGradient } from './color-values'

// ── projection: runs → elements ──────────────────────────────────────────────

/** Collapse internal whitespace runs and trim — the case-preserving normal form. */
const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim()
/** Case-insensitive join key: the collapsed text lowercased. */
const norm = (text: string): string => collapse(text).toLowerCase()

/**
 * REQ-274 — the projections below read NOTHING directly off either input. Every
 * axis they carry is a row in `value-axes.ts`, and each row names both sides, so
 * an axis is present on both projections or on neither. The two ~90-line
 * hand-written bodies that used to live here (`flattenCapture` / `flattenSignals`,
 * plus `copyGeometry` / `copyTypography` beside them) are gone: they were the
 * mechanism by which an axis could be recorded on one side and not the other with
 * nothing in the type system able to notice.
 *
 * What is left here is the SHAPE of a manifest — which elements it holds, in what
 * order, under what source — which is genuinely per-side and is not an axis.
 */

/** Project a {@link ContentRun} (from a capture bundle) to a {@link ValueElement}. */
export function contentRunToElement(run: ContentRun): ValueElement {
  return projectContentRun(run)
}

/**
 * Project a text-free {@link Field} to a {@link ValueElement} (REQ-47). Its
 * accessible name doubles as the display text; `textless` routes it to the
 * role+order pairing path. Accepts the raw extracted field too (structurally
 * identical), so both sides of the diff project through one function — the one
 * place in the table where that is literally true.
 */
export function fieldToElement(field: Field): ValueElement {
  return projectField(field)
}

/** Project a raw extracted run (our live reproduction) to a {@link ValueElement}. */
export function rawRunToElement(run: RawRun): ValueElement {
  return projectRawRun(run)
}

/**
 * Flatten a capture bundle's sections (+ repeated items, + text-free fields) into
 * a value manifest — the REFERENCE side.
 *
 * Its `sections` are the bundle's own, coalesced by style signature at capture
 * time. The band's `captureSchema` travels with it because an axis added at a
 * later schema (REQ-271's `surfaceFill`) is UNMEASURED on an older bundle rather
 * than defaulted, and that decision belongs at the axis, not here.
 */
/**
 * REQ-302 — a band's runs in DOCUMENT order: content, with each repeated-item
 * row spliced back in at the index it was lifted from.
 *
 * `itemGroup` pulls a band's repeated rows out of the content walk, and both
 * projections used to re-append them after ALL of the band's content. A card
 * whose bullet list happened to be the band's one detected item group therefore
 * had its bullets emitted after a LATER card's copy, and everything downstream
 * that reads this array as reading order — the responsive table's occurrence
 * pairing, the fold's child order, the flow recovery's leading offsets —
 * inherited the inversion. One reference paid for it with three bullet rows
 * emitted ~460px below where they paint and a flow recovery that repaired the
 * gap with `margin-top: -946px`, giving a document correct at exactly the six
 * sampled widths and wrong between them.
 *
 * An absent anchor for a row (a pre-REQ-302 bundle, or the geometric-slice path
 * where a slice is a box rather than a subtree and the question has no answer)
 * appends it, which is what every reader did before the anchor existed.
 */
export function runsInDocumentOrder<T>(content: T[], items: T[][], itemsAt?: number[]): T[] {
  const out: T[] = []
  for (let i = 0; i <= content.length; i++) {
    for (let k = 0; k < items.length; k++) {
      const at = itemsAt?.[k] ?? content.length
      if (at === i) out.push(...items[k])
    }
    if (i < content.length) out.push(content[i])
  }
  return out
}

export function flattenCapture(capture: Capture): ValueManifest {
  const schema = captureSchemaOf(capture)
  const sections: SectionValues[] = capture.sections.map((section, index) =>
    projectCaptureSection({ section, schema }, index),
  )
  const elements: ValueElement[] = []
  for (const section of capture.sections) {
    // REQ-302 — content and repeated-item rows in document order, not content
    // first and every item row after. See runsInDocumentOrder.
    const runs = runsInDocumentOrder(
      section.content,
      section.items.map((i) => i.content),
      section.itemsAt,
    )
    for (const run of runs) elements.push(contentRunToElement(run))
    // REQ-47 — text-free elements (guarded: pre-REQ-47 bundles carry no `fields`).
    for (const field of section.fields ?? []) elements.push(fieldToElement(field))
  }
  return {
    source: `${capture.host}${capture.path}`,
    elements,
    sections,
    ...projectCaptureManifestAxes(capture),
  }
}

/**
 * Flatten a live extraction (our reproduction) into a value manifest.
 *
 * Section values are read from the *raw* bands (uncoalesced), so the two sides'
 * section indices do NOT correspond — the capture's are coalesced by style
 * signature, and an L1 reproduction has a single body-spanning band whatever the
 * reference did. BUG-102: the diff therefore joins sections by band geometry, not
 * by the index this assigns, which is a position in document order and nothing
 * more. REQ-274 changes who reads an axis, never how two bands are paired: that
 * asymmetry is real and stays.
 */
export function flattenSignals(signals: RawSignals, source: string): ValueManifest {
  const sections: SectionValues[] = signals.bands.map((band, index) => projectSignalsBand(band, index))
  const elements: ValueElement[] = []
  for (const band of signals.bands) {
    // REQ-302 — see flattenCapture above: the same ordering, read from the raw
    // band's own anchor, so the two sides of a diff are ordered by one rule.
    const runs = runsInDocumentOrder(band.content, band.items, band.itemsAt)
    for (const run of runs) elements.push(rawRunToElement(run))
    // REQ-47 — text-free elements (form controls, dividers).
    for (const field of band.fields ?? []) elements.push(projectField(field, 'reproduction'))
  }
  return {
    source,
    elements,
    sections,
    ...projectSignalsManifestAxes(signals),
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
 * REQ-88 — extra projections that re-shoot a width **already on the ladder** at a
 * different viewport HEIGHT.
 *
 * The ladder above varies width and height together, which makes the height axis
 * unidentifiable: a `min-h-screen` hero measuring 1024 at 768x1024 and 768 at
 * 1024x768 is indistinguishable, from those samples alone, from an element whose
 * height happens to be a decreasing function of *width*. Only a pair that holds
 * width fixed and moves height separates the two — and until it does, the fold
 * has no evidence on which to emit `100vh` and must pin whatever pixel height the
 * capture happened to use.
 *
 * Deliberately NOT part of {@link RESPONSIVE_VIEWPORTS}: the width ladder defines
 * the keyframes, the screenshots and the diff cells, and a duplicate width would
 * perturb all three. A probe adds one projection and nothing else — the fold
 * reads it as evidence, {@link restingByWidth} skips it as a keyframe.
 */
export const HEIGHT_PROBE_VIEWPORTS: readonly Viewport[] = [{ width: 1280, height: 1000 }]

/**
 * REQ-88 — split a capture's projections into the **width ladder** and the
 * **height probes** that re-shoot a ladder width at a second viewport height.
 *
 * Every ladder consumer keys on `(engine, width, state)` — that is what a
 * *responsive* comparison is about, and adding height to the key would make every
 * consumer carry an axis only the fold cares about. So a probe is exactly a
 * projection whose key is already claimed: the first projection at a key defines
 * the ladder, later ones are evidence.
 *
 * Without this split a probe is silently read as a duplicate ladder cell, which is
 * not a small error: `diffMultiState` diffed the 1280 reference against the
 * *probe's* reproduction and reported 59 phantom deltas, and `oracleBoxes` handed
 * the fidelity probe a second full set of 1280 oracle rows whose leaf queues were
 * already drained — 55 phantom `unmatched`, i.e. every text run on the page.
 */
export function partitionProbes(projections: readonly StateProjection[]): {
  ladder: StateProjection[]
  probes: StateProjection[]
} {
  const seen = new Set<string>()
  const ladder: StateProjection[] = []
  const probes: StateProjection[] = []
  for (const p of projections) {
    const key = projectionKey(p.engine, p.viewport.width, p.state)
    if (seen.has(key)) probes.push(p)
    else {
      seen.add(key)
      ladder.push(p)
    }
  }
  return { ladder, probes }
}

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
  // BUG-107 — a lost heading / link is a SEMANTIC break: the document outline is
  // gone and no pixel moved to say so. HIGH, not CRITICAL: CRITICAL is reserved
  // for a diff that cannot be trusted (viewport), content that is absent
  // (presence, text) or structure that visibly re-composed (arrangement,
  // containment). A role regression is none of those — it ranks above every
  // tonal and treatment axis because it is structural, and below the breaks that
  // change what the page shows.
  semantics: 'HIGH',
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

/**
 * The tier ordering, and the ONE definition of it. Exported for BUG-110: the
 * gate's value floor is a tier bound, so `reconcileGates` has to ask "is this
 * delta worse than the floor?" — and a second copy of this table over there
 * would be a severity taxonomy that could silently disagree with the one the
 * deltas were ranked by.
 */
export const TIER_RANK: Record<SeverityTier, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

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
  // BUG-107 — leads the HIGH band: the semantic identity of a run is the first
  // thing to fix, because every other axis on that run describes how a thing that
  // is the WRONG THING has been dressed.
  semantics: 10,
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
  return isPillShape(el.box, el.borderRadiusPx)
}

/**
 * The pill test at box + radius granularity, so it can be applied to a surface-
 * bearing box that is not the element's own (BUG-22) as well as to the element.
 */
function isPillShape(box: Box | undefined, radiusPx: number | undefined): boolean {
  const h = box?.height ?? 0
  return h > 0 && (radiusPx ?? 0) * 2 >= h - 1
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
  // BUG-107 — a role is authored (emit a heading element), so it is a value to
  // copy into place, not an emergent residual to measure.
  a11yRole: 'A',
  headingLevel: 'A',
  color: 'A',
  // REQ-265 — the placeholder's ink is an authored value like any other colour:
  // once L1 can carry it, the repair is to copy the reference's value into place.
  placeholderColor: 'A',
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
  // BUG-27 — an image handle is an authored value: copy the reference's asset.
  backgroundImage: 'A',
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
  // BUG-107 — both role axes share the one semantics kind; the `property` still
  // distinguishes "wrong role" from "right role, wrong outline depth".
  a11yRole: 'semantics',
  headingLevel: 'semantics',
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
  // BUG-27 — a wrong/absent background photograph is a media defect.
  backgroundImage: 'media',
  // REQ-265 — placeholder ink is ink: a colour defect, ranked like every other.
  placeholderColor: 'color',
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
   * REQ-302 — the declared one-sided axes to evaluate this comparison against,
   * defaulting to the live {@link UNMEASURED_AXES}.
   *
   * WHY THIS SEAM EXISTS. REQ-274's capability is "a compared axis the table can
   * only read on ONE side is REPORTED as unmeasured rather than passing as
   * clean", and its evidence was necessarily written against whatever live gap
   * happened to exist — REQ-64's four Type-A run axes. REQ-302 closes that gap,
   * and it was the last one, so `UNMEASURED_AXES` is now empty and there is no
   * live example left to drive the reporting path with. Without a seam the only
   * way to keep REQ-274 proven would be to leave a gap open on purpose, and the
   * only alternative is to delete its evidence every time a gap is closed —
   * which is exactly backwards, since closing gaps is the point.
   *
   * The axis TABLE already takes its declared list as a parameter
   * (`observedUnmeasuredAxes(expected, actual, declared)`); this forwards that
   * parameter the one step it was missing. Production callers pass nothing and
   * get the live table, unchanged.
   */
  declaredUnmeasured?: readonly UnmeasuredAxis[]
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
 * BUG-27 — the mirrored-asset identity of a media handle: its path tail, minus
 * query and fragment. The two sides of a reproduction name the same bytes
 * differently — the reference carries the captured origin URL
 * (`https://site/wp-content/uploads/2021/12/HERO.jpeg`), our render the site-local
 * mirror (`/assets/HERO.jpeg`) — and `localizeAssets` mirrors by exactly this
 * basename, so comparing on it asks the only question that matters: is the same
 * asset painted here?
 */
export function assetBasename(url: string | null | undefined): string | null {
  if (!url) return null
  const clean = url.split('#')[0].split('?')[0]
  const tail = clean.split('/').filter(Boolean).pop()
  return tail ? tail : null
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

/**
 * BUG-107 — the a11y roles that make a textless element an actual CONTROL: a
 * thing a visitor operates. Stated positively, and the unknown case falls to
 * `box` rather than to `control`, because the failure this replaces was the
 * inverse default — *everything* textless that was not an image or a separator
 * was called a control, so seven painted section bands were reported as seven
 * unpaired form controls. An unrecognised explicit `role=` on a painted div is
 * still a painted div; calling it a box is the safe direction.
 */
const CONTROL_ROLES: ReadonlySet<string> = new Set([
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'option',
  'button',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'spinbutton',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'link',
])

/** Bucket a projected element into its object kind (for the card heading). */
function objectKindOf(el: ValueElement): ObjectKind {
  if (!el.textless) return 'text'
  if (el.a11yRole === 'img') return 'image'
  if (el.a11yRole === 'separator') return 'divider'
  if (el.a11yRole && CONTROL_ROLES.has(el.a11yRole)) return 'control'
  return 'box'
}

/**
 * REQ-51 — the fixed parameter table per object kind. A text run shows its
 * typography + box; an image its fit/aspect/box; a control its name + where the
 * name renders + box; a divider just its box. `box` closes every table so
 * position is always visible (item 2).
 */
const KIND_PARAMS: Record<ObjectKind, string[]> = {
  // BUG-107 — `a11yRole` LEADS the text table: it is the run's semantic identity
  // (what the browser says the thing IS), so it belongs above the typography that
  // merely dresses it. A heading reproduced as a paragraph moves no pixel and was
  // therefore invisible to every other row here.
  text: [
    'a11yRole',
    'fontFamily',
    'fontSizePx',
    'fontWeight',
    'color',
    'letterSpacingPx',
    'lineHeightPx',
    'renderedTextBox',
    'box',
  ],
  image: ['name', 'objectFit', 'aspect', 'box'],
  // REQ-308 — a control's card carries its TYPE too. It is the substance of the
  // only ink a placeholder-only control has, and its absence here is how a row
  // reading `placeholderColor #746f69` on both sides looked complete beside a
  // textarea painting its placeholder three pixels off.
  control: ['name', 'nameSource', 'fontFamily', 'fontSizePx', 'fontWeight', 'lineHeightPx', 'placeholderColor', 'box'],
  divider: ['box'],
  // BUG-107 — a painted box carries no name and no typography; what it HAS is the
  // surface it paints (fill, background photograph) and the rect it paints it in.
  box: ['surfaceFill', 'backgroundImage', 'box'],
}

/**
 * Which {@link DeltaProperty}(ies) a fixed param's verdict reads. A param with a
 * mapped property is flagged iff that property fired a delta (so the diff's
 * tolerances stay authoritative — `72` vs `72.4` within tolerance is not a
 * mismatch). A param with no mapped property (`name`) falls back to a direct
 * string compare, so accessible-name drift the diff doesn't model still shows.
 */
const PARAM_PROPS: Record<string, DeltaProperty[]> = {
  // BUG-107 — one row for the semantic identity, reading BOTH axes: the role word
  // and the outline depth it flattens (`heading` says nothing about h2-vs-h4).
  a11yRole: ['a11yRole', 'headingLevel'],
  surfaceFill: ['surfaceFill'],
  backgroundImage: ['backgroundImage'],
  fontFamily: ['fontFamily'],
  fontSizePx: ['fontSizePx'],
  fontWeight: ['fontWeight'],
  color: ['color'],
  letterSpacingPx: ['letterSpacingPx'],
  lineHeightPx: ['lineHeightPx'],
  renderedTextBox: ['renderedTextBox'],
  box: ['position', 'size'],
  nameSource: ['containment'],
  placeholderColor: ['placeholderColor'],
  objectFit: ['objectFit'],
  aspect: ['aspect'],
  name: [],
}

/** Format a fixed param's value off an element (`—` when absent/unpaired). */
function paramValue(name: string, el: ValueElement | undefined): string {
  if (!el) return '—'
  switch (name) {
    // BUG-107 — the role word, plus the heading depth when the capture recorded
    // one (`heading h2`), so the row says which heading it was meant to be.
    case 'a11yRole': {
      if (!el.a11yRole) return '—'
      return el.headingLevel != null ? `${el.a11yRole} h${el.headingLevel}` : el.a11yRole
    }
    case 'surfaceFill':
      return el.surfaceFill || '—'
    case 'backgroundImage':
      return assetBasename(el.backgroundImageUrl) ?? '—'
    case 'fontFamily':
      return el.fontFamily || '—'
    // REQ-308 — `0` is the text-free constant, not a measurement: a control on a
    // bundle taken before the extractor read its type, or an image/divider/box
    // that has no type at all. Printing it as `0` would read as a size.
    case 'fontSizePx':
      return el.fontSizePx > 0 ? `${el.fontSizePx}` : '—'
    case 'fontWeight':
      return el.fontWeight > 0 ? `${el.fontWeight}` : '—'
    case 'color':
      return el.color || '—'
    case 'letterSpacingPx':
      return el.letterSpacingPx !== undefined ? `${el.letterSpacingPx}` : '—'
    // REQ-308 — on a control whose type WAS read, an absent leading is
    // `line-height: normal` measured, not an axis nobody recorded, and the row
    // has to say which: `—` beside a reference's `24` reads as a gap in the
    // report rather than as the defect it is.
    case 'lineHeightPx':
      if (el.lineHeightPx !== undefined) return `${el.lineHeightPx}`
      return el.textless && el.fontSizePx > 0 ? 'normal' : '—'
    case 'renderedTextBox':
      return el.renderedTextBox ? textBoxLabel(el.renderedTextBox) : '—'
    case 'box':
      return boxLabel(el.box)
    case 'name':
      return el.accessibleName || '—'
    case 'nameSource':
      return nameSourceLabel(el.nameSource)
    case 'placeholderColor':
      return el.placeholderColor ?? '—'
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

/**
 * Project a leftover (unpaired) repro element to its {@link UnpairedObject} note.
 *
 * REQ-271 — with its geometry. `{label, role, kind}` alone reduces an untexted
 * box to `(generic)/generic/box`, which is a count and not a finding: the reader
 * is told seven objects exist and given nothing to find them with.
 */
function toUnpaired(el: ValueElement, index?: number): UnpairedObject {
  const u: UnpairedObject = { label: el.text, role: el.role, kind: objectKindOf(el) }
  if (el.box) u.box = el.box
  if (index !== undefined && index >= 0) u.index = index
  return u
}

/**
 * REQ-271 — is this leftover repro object the band's own PAINT rather than an
 * object standing on the band?
 *
 * The two sides represent band paint in structurally different places. A
 * conventional page nests its content inside the band element, so the fill lives
 * on the band record and the reference manifest holds no textless element for it
 * at all. An L1 render paints each band as a real full-bleed box — so the same
 * fact reaches the reproduction manifest twice, and the box copy can never pair,
 * because there is nothing on the reference side to pair it with. Seven such
 * objects sat in `unpairedActual` on every gigabytealchemy run, reported as
 * "repro objects that matched nothing" when they are the band fills the section
 * pass compares directly.
 *
 * Recognised HERE, in the diff's own reporting, and deliberately not by dropping
 * the element from the manifest: a full-bleed textless box is exactly what the
 * fold reads to rebuild a backdrop (BUG-27), so removing it upstream would take
 * a hero photograph out of the fold's input on a page-builder site. The manifest
 * stays faithful to what was painted; only the "paired with nothing" tally stops
 * double-counting a fact it already has a counterpart for.
 *
 * Tight by construction — the box must be full-bleed and coincide with a band's
 * own box to within a pixel of layout noise. A box that merely sits ON a band,
 * or a layer with its own geometry (a photograph inside a taller fill), is an
 * object in its own right and is still reported.
 */
function isBandPaint(el: ValueElement, sections: readonly SectionValues[], pageWidth: number): boolean {
  const b = el.box
  // `textless` is the projection's own flag for "this element carries no text"
  // (`fieldToElement`); an empty `text` is NOT the same test — a field's text is
  // its accessible name, falling back to `(<role>)`, and is never the empty string.
  if (!b || !el.textless) return false
  const TOL = 2
  if (b.x > TOL || b.x + b.width < pageWidth - TOL) return false
  return sections.some(
    (s) => s.box && Math.abs(s.box.y - b.y) <= TOL && Math.abs(s.box.height - b.height) <= TOL,
  )
}

// ── BUG-102 — section pairing ────────────────────────────────────────────────

/**
 * Two bands are the same band when their vertical intervals overlap by at least
 * half their union. Sections are full-bleed, so the vertical interval is what
 * distinguishes them; half-of-union is the floor that separates "the same hero,
 * a little taller" from "a 192px header strip sitting inside an 800px hero"
 * (IoU 0.24 — the pair the ordinal join silently made).
 */
const SECTION_OVERLAP_MIN = 0.5

/** Vertical intersection-over-union of two bands — the section pairing score. */
function verticalIoU(a: Box, b: Box): number {
  const inter = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  if (inter <= 0) return 0
  const union = Math.max(a.y + a.height, b.y + b.height) - Math.min(a.y, b.y)
  return union > 0 ? inter / union : 0
}

/** True when every section carries the geometry the join reads (REQ-88 onward). */
function hasSectionGeometry(sections: readonly SectionValues[]): boolean {
  return sections.length > 0 && sections.every((s) => !!s.box)
}

/**
 * True when this band vertically covers the full extent of its own manifest's
 * elements — the signature of a flat L1 render, whose single `<body>` child is one
 * body-spanning wrapper rather than a style-scope band (BUG-15's flat-DOM problem
 * at the section layer). Measured against the elements rather than a page height
 * because the manifest carries no document box.
 */
function spansWholePage(section: SectionValues, manifest: ValueManifest): boolean {
  const band = section.box
  if (!band) return false
  const boxes = manifest.elements.map((e) => e.box).filter((b): b is Box => !!b)
  if (boxes.length === 0) return false
  let top = Infinity
  let bottom = -Infinity
  for (const b of boxes) {
    if (b.y < top) top = b.y
    if (b.y + b.height > bottom) bottom = b.y + b.height
  }
  return band.y <= top + 1 && band.y + band.height >= bottom - 1
}

/** One reference section's join result: the repro band it took, and the score. */
interface SectionMatch {
  section: SectionValues
  overlap: number
}

/**
 * BUG-102 — pair reference sections to repro bands by vertical overlap, one-to-one.
 * Candidates above {@link SECTION_OVERLAP_MIN} are taken best-overlap-first, and a
 * band already claimed is not re-used — so the reference's absolutely-positioned
 * header loses its hero to the reference's own hero (IoU 1.0 beats 0.24) and is
 * reported unpaired instead of compared against it.
 *
 * Crossed pairs (an earlier reference section taking a later band while a later one
 * takes an earlier band) are not forbidden explicitly: at a half-of-union floor in a
 * shared coordinate space, a crossing needs both sides to overlap each other more
 * than they overlap their own partners, which the floor already rules out for every
 * shape we have seen. Keyed by position in `expected`, not by `index`, so a manifest
 * with non-contiguous section indices still pairs.
 */
function pairSectionsByGeometry(
  expected: readonly SectionValues[],
  actual: readonly SectionValues[],
): Map<number, SectionMatch> {
  const candidates: { ei: number; ai: number; overlap: number }[] = []
  expected.forEach((es, ei) => {
    actual.forEach((as, ai) => {
      const overlap = verticalIoU(es.box!, as.box!)
      if (overlap >= SECTION_OVERLAP_MIN) candidates.push({ ei, ai, overlap })
    })
  })
  candidates.sort((a, b) => b.overlap - a.overlap)
  const out = new Map<number, SectionMatch>()
  const takenActual = new Set<number>()
  for (const c of candidates) {
    if (out.has(c.ei) || takenActual.has(c.ai)) continue
    out.set(c.ei, { section: actual[c.ai], overlap: c.overlap })
    takenActual.add(c.ai)
  }
  return out
}

/**
 * The pre-REQ-88 fallback: join by ordinal `index`. Kept for manifests that carry no
 * section geometry at all — silently comparing nothing would be worse than the
 * ordinal join's known weakness, which only bites when the two sides segment
 * differently.
 */
function pairSectionsByOrdinal(
  expected: readonly SectionValues[],
  actual: readonly SectionValues[],
): Map<number, SectionMatch> {
  const byIndex = new Map<number, SectionValues>()
  for (const s of actual) byIndex.set(s.index, s)
  const out = new Map<number, SectionMatch>()
  expected.forEach((es, ei) => {
    const as = byIndex.get(es.index)
    if (!as) return
    // Score it anyway when both sides happen to carry a box, so the pairing rows
    // still say how well the ordinal pair actually overlapped.
    out.set(ei, { section: as, overlap: es.box && as.box ? verticalIoU(es.box, as.box) : 0 })
  })
  return out
}

/**
 * Diff an actual manifest against an expected one, field by field, aligning
 * text elements by case-folded text and section-level values (scrim, vertical
 * anchor) by band GEOMETRY — vertical overlap, since a section has no text to
 * join on (BUG-102; ordinal index before it, still the fallback for a manifest
 * carrying no section boxes). The verbatim text is itself compared once paired
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
  // REQ-64 — the four padding sides on the same integer-px tolerance. Only
  // paddingLeft was compared at first, so a card's internal top/right/bottom pad
  // (a box that reads narrower/taller) was invisible.
  //
  // REQ-269 — and it is shared with the TEXT-FREE pass rather than living inside
  // the text one, because a form control's padding is the inset its placeholder
  // and typed text sit in. Until the capture recorded it neither side carried it,
  // so the two agreed by construction and `deltas: 0` was reported over four
  // controls holding 75% of the reproduction's ranked pixel residual. Each side is
  // compared only when BOTH sides recorded one, so a pre-REQ-269 reference stays
  // inert rather than reporting every reproduction's control padding as wrong.
  const comparePadding = (exp: ValueElement, act: ValueElement): void => {
    const side = (
      prop: 'paddingTopPx' | 'paddingRightPx' | 'paddingBottomPx' | 'paddingLeftPx',
      e?: number,
      a?: number,
    ): void => {
      if (e !== undefined && a !== undefined && Math.abs(e - a) > paddingTol) {
        push(exp, prop, `${e}`, `${a}`, Math.abs(e - a))
      }
    }
    side('paddingTopPx', exp.paddingTopPx, act.paddingTopPx)
    side('paddingRightPx', exp.paddingRightPx, act.paddingRightPx)
    side('paddingBottomPx', exp.paddingBottomPx, act.paddingBottomPx)
    side('paddingLeftPx', exp.paddingLeftPx, act.paddingLeftPx)
  }

  const compareGeometry = (exp: ValueElement, act: ValueElement): void => {
    if (exp.box && act.box) {
      const dpos = Math.max(Math.abs(exp.box.x - act.box.x), Math.abs(exp.box.y - act.box.y))
      if (dpos > positionTol) push(exp, 'position', posLabel(exp.box), posLabel(act.box), dpos)
      // REQ-64 — for a TEXT RUN the layout box is NOT the visible geometry: a
      // left-aligned heading looks identical whether its (transparent) box is
      // block-full-width or shrink-to-fit, so a `size` delta there is a false
      // positive (measured on gigabyte: ref fit-content 320px vs our block 1104px,
      // same glyphs, same position). The faithful text signals are `renderedTextBox`
      // (glyph extent — carries the real wrapping/line-count difference via height)
      // and `position`, both compared below/above. So box-`size` is compared only
      // for NON-text elements (fields, images, surface panels) whose box IS painted.
      const isTextRun = exp.renderedTextBox != null && act.renderedTextBox != null
      if (!isTextRun) {
        // REQ-53 — width is container-determined (exact, Group B); height emerges
        // from text wrapping × font metrics (tolerant, Group C). Split the axis so
        // a real width gap can't hide behind the wrapping allowance height needs.
        const dw = Math.abs(exp.box.width - act.box.width)
        const dh = Math.abs(exp.box.height - act.box.height)
        if (dw > widthTol || dh > heightTol) {
          push(exp, 'size', sizeLabel(exp.box), sizeLabel(act.box), Math.max(dw, dh))
        }
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
    // BUG-22 — SPLIT CONTROL. The reference represents a control as ONE node: the
    // `<button>` carries the label, the fill, the rounding and the box together.
    // An L1 reproduction is a flat tree, so the same control is TWO nodes — a
    // `text` node for the label plus a sibling backing box that paints the
    // surface. Pairing joins on text and therefore lands on the label, whose own
    // shape axes read 0: a phantom `radius 8px -> 0px` classified Type-A flat,
    // which led the printed repair order with a no-op while the backing box's real
    // geometry defect (2× the reference height) went unreported entirely.
    //
    // Resolve the surface axes against the node that BEARS the surface. `self`
    // distinguishes the two representations, so this fires only where the sides
    // genuinely disagree about node identity — a self-painting chip (BUG-20) is
    // self on both sides and keeps the own-axis comparison untouched.
    const surface = exp.surface?.self === true && act.surface && !act.surface.self ? act.surface : null
    const actRadiusPx = surface ? surface.borderRadiusPx : act.borderRadiusPx
    const actShadow = surface ? surface.boxShadow : act.boxShadow
    // The backing box IS the control's painted rect, so its geometry is what the
    // reference's control box must be compared against — the label's box carries
    // only the glyphs. This is the axis the phantom was standing in front of.
    if (surface && exp.box) {
      const dpos = Math.max(Math.abs(exp.box.x - surface.box.x), Math.abs(exp.box.y - surface.box.y))
      if (dpos > positionTol) {
        push(exp, 'position', `surface ${posLabel(exp.box)}`, `surface ${posLabel(surface.box)}`, dpos)
      }
      const dw = Math.abs(exp.box.width - surface.box.width)
      const dh = Math.abs(exp.box.height - surface.box.height)
      if (dw > widthTol || dh > heightTol) {
        push(exp, 'size', `surface ${sizeLabel(exp.box)}`, `surface ${sizeLabel(surface.box)}`, Math.max(dw, dh))
      }
    }
    if (exp.borderRadiusPx !== undefined && actRadiusPx !== undefined) {
      const dr = Math.abs(exp.borderRadiusPx - actRadiusPx)
      const shadowDiffers = !!exp.boxShadow !== !!actShadow
      // BUG-20 — a fully-rounded pill's radius SATURATES: once it reaches half the
      // painted height every larger value paints the identical shape, so the raw
      // number is meaningless above that point (`rounded-full` computes to
      // 33554400px; any sane large value renders the same pill). Comparing the
      // sentinel as a magnitude reported a defect where no pixel differs. When
      // BOTH sides are pills the shape agrees by construction — only the shadow
      // can still differ.
      const bothPills = isPillShape(exp.box, exp.borderRadiusPx) && isPillShape(surface?.box ?? act.box, actRadiusPx)
      if (bothPills ? shadowDiffers : dr > radiusTol || shadowDiffers) {
        push(exp, 'shape', shapeLabel(exp.borderRadiusPx, exp.boxShadow), shapeLabel(actRadiusPx, actShadow), dr)
      }
    }
    // Uniform box border (blind spot) — a form field's outline / a card hairline.
    // Compare presence + width + colour, like borderLeft. Only when both sides
    // record the field (pre-blind-spot manifests omit `border`, so skip then).
    // BUG-22 — on a split control the hairline is painted by the backing box, so
    // resolve it there rather than off the label (which paints none).
    const actBorder = surface ? surface.border : act.border
    if (exp.border !== undefined && actBorder !== undefined) {
      const e = exp.border
      const a = actBorder ?? null
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
    // REQ-96 — a named control joins on its ACCESSIBLE NAME, falling back to
    // document order for an unnamed one (a divider, an image, an unlabelled box).
    //
    // Document-order FIFO alone assumes the two sides enumerate their controls in
    // the same order, and a reproduction has no way to guarantee that: the fold
    // emits one seam per *geometric* cluster, top-to-bottom, while the reference's
    // DOM order is whatever its author wrote. On gigabytealchemy the two disagree
    // by exactly one position, which mispaired every field against its neighbour
    // and turned four correct boxes into sixteen CRITICAL deltas. A control's
    // accessible name is a real join key — the same role text plays for a run — so
    // using it makes the pairing say what it means. A genuine name difference is
    // still reported: an exp whose name matches nothing falls back to the queue
    // head and the `name` axis flags it there.
    const q = fieldQueues.get(exp.a11yRole ?? exp.role)
    const expName = norm(exp.accessibleName ?? '')
    let act: ValueElement | undefined
    if (q && q.length > 0) {
      const byName = expName ? q.findIndex((el) => norm(el.accessibleName ?? '') === expName) : -1
      act = q.splice(byName >= 0 ? byName : 0, 1)[0]
    }
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
    // REQ-265 — the placeholder's ink, compared like `color` (ΔE). This is the
    // one painted value a control carries that no geometry or name axis can see,
    // so without it a field whose placeholder paints the wrong colour reports
    // `deltaCount: 0` and only the perceptual eye disagrees. Compared only when
    // both sides recorded one, so a pre-REQ-265 reference stays inert.
    if (exp.placeholderColor && act.placeholderColor) {
      const dEph = colorDistance(exp.placeholderColor, act.placeholderColor)
      if (dEph > colorTol) {
        push(exp, 'placeholderColor', exp.placeholderColor, act.placeholderColor, dEph)
      }
    }
    // BUG-27 — the painted media handle. Compared by mirrored basename because the
    // two sides legitimately name the same bytes differently: the reference carries
    // the captured origin URL, our render the site-local `/assets/…` mirror. Without
    // this the value gate stayed green on a page reproduced as flat colour.
    const expBg = assetBasename(exp.backgroundImageUrl)
    const actBg = assetBasename(act.backgroundImageUrl)
    if (expBg !== actBg) {
      push(exp, 'backgroundImage', expBg ?? '(none)', actBg ?? '(none)')
    }
    // BUG-107 — the painted FILL of a textless box, compared like `color` (ΔE).
    // A section band or a card surface is the one object here whose whole visible
    // substance is its fill, and it was only ever compared where a text run sat on
    // top of it (`surfaceFill` on the text pass). A band with no text in it — the
    // hero backdrop, a colour divider strip — reported its geometry and nothing
    // else, so the `surfaceFill` row on its card would have rendered a value it
    // never checked. Compared only when both sides recorded one.
    if (exp.surfaceFill && act.surfaceFill) {
      const dEfill = colorDistance(exp.surfaceFill, act.surfaceFill)
      if (dEfill > colorTol) push(exp, 'surfaceFill', exp.surfaceFill, act.surfaceFill, dEfill)
    }
    // REQ-308 — the control's OWN type, which this pass compared with nothing.
    //
    // A control whose only ink is its placeholder has no text run, so it never
    // reached the text pass (`if (exp.textless) continue`, below) and this pass
    // compared containment, placeholder ink, imagery, fill, padding and geometry
    // — every axis but the one the glyphs are made of. On gigabytealchemy the
    // textarea that owned 100% of the round's ranked pixel residual produced
    // ZERO deltas: both sides agreed by construction, because both sides
    // recorded `fontSizePx: 0` and `fontFamily: ''`.
    //
    // Guarded on both sides carrying a real size, which is exactly the
    // pre-REQ-308 test: the axes were CONSTANTS (`0`/`''`) before the extractor
    // read them, so a stored bundle taken by an older extractor stays inert
    // rather than firing a delta against its own placeholder on every control.
    // A non-control text-free element (an image, a divider, a painted backdrop)
    // reads `0` on both sides for ever, and is skipped by the same guard.
    if (exp.fontSizePx > 0 && act.fontSizePx > 0) {
      if (Math.abs(exp.fontSizePx - act.fontSizePx) > fontSizeTol) {
        push(exp, 'fontSizePx', `${exp.fontSizePx}`, `${act.fontSizePx}`, Math.abs(exp.fontSizePx - act.fontSizePx))
      }
      if (Math.abs(exp.fontWeight - act.fontWeight) > weightTol) {
        push(exp, 'fontWeight', `${exp.fontWeight}`, `${act.fontWeight}`)
      }
      if (exp.fontFamily.toLowerCase() !== act.fontFamily.toLowerCase()) {
        push(exp, 'fontFamily', exp.fontFamily, act.fontFamily)
      }
      // THE AXIS THE DEFECT WAS MADE OF, and the one place this pass does NOT
      // skip an absent value. On a text run, an absent `lineHeightPx` means the
      // reference bundle predates the axis and there is nothing to compare; on a
      // control it cannot mean that, because the guard above has already
      // established that both sides ran a typography-recording extractor. What
      // it means here is `line-height: normal` — a measurement, whose used value
      // is a font metric no computed style exposes — and `normal` against a
      // reference's 24px is precisely the three-pixel placeholder shift this
      // ticket came from. Skipping it would leave the instrument blind to its
      // own defect the moment the fold stopped emitting the axis.
      const expLh = exp.lineHeightPx
      const actLh = act.lineHeightPx
      if (expLh !== undefined && actLh !== undefined) {
        const lineHeightTol = Math.max(lineHeightFloor, lineHeightRatio * expLh)
        if (Math.abs(expLh - actLh) > lineHeightTol) {
          push(exp, 'lineHeightPx', `${expLh}`, `${actLh}`)
        }
      } else if (expLh !== actLh) {
        push(exp, 'lineHeightPx', expLh !== undefined ? `${expLh}` : 'normal', actLh !== undefined ? `${actLh}` : 'normal')
      }
    }
    comparePadding(exp, act)
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

    // BUG-107 — the SEMANTIC identity of the run: what the browser says it is.
    // Compared only on the text pass, because a text-free field JOINS on
    // `a11yRole` (the queue key above) and therefore agrees by construction —
    // comparing it there could only ever report equality.
    //
    // This is the axis that carries the document outline, and nothing else does:
    // a reproduction that emits every heading as a styled paragraph paints the
    // same pixels at the same size in the same place, so every other axis here
    // agrees and the report read `deltas: []` over eleven lost headings and two
    // lost links. Guarded on both sides carrying the field, so a manifest that
    // predates the capture stays inert.
    compareValueField(exp, act, 'a11yRole', exp.a11yRole, act.a11yRole)
    // …and the half `a11yRole` flattens: it reports the single word `heading` for
    // all six tags, so an h2 reproduced as an h4 agrees on the role word while the
    // outline it builds is wrong. Compared only when BOTH sides recorded a level
    // (it is absent on every non-heading, and on pre-REQ-269 bundles).
    if (exp.headingLevel != null && act.headingLevel != null && exp.headingLevel !== act.headingLevel) {
      push(exp, 'headingLevel', `h${exp.headingLevel}`, `h${act.headingLevel}`, Math.abs(exp.headingLevel - act.headingLevel))
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
    comparePadding(exp, act)
    // REQ-64 — text-align (Type-A). A centred-vs-left run was only visible
    // indirectly as a position/box shift; compare the authored value directly.
    if (exp.textAlign !== undefined && act.textAlign !== undefined && exp.textAlign !== act.textAlign) {
      push(exp, 'textAlign', exp.textAlign, act.textAlign)
    }
    // REQ-79 — the reverse fontLoad direction (reference showed a FOUT fallback but
    // OUR render resolved the intended face) is intentionally NOT a delta. A reference
    // `fontLoaded:false` is dominated by capture-side FOUT artifacts, not design intent
    // (the live site renders the real face — the screenshot and the matching
    // family/size/weight prove it). Flagging our CORRECT render as a HIGH defect
    // inverts the reproduction goal and drowns real deltas (30 phantom CRITICALs on the
    // joyful import). Only the forward direction — OUR render fell back — is a defect,
    // caught by the unilateral `unresolvedFonts(actual)` pass below.

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
  // REQ-271 — the manifest position of each leftover, so a reader can go straight
  // to `actual-manifest.json` element `[n]` instead of guessing which box it was;
  // and band paint (see {@link isBandPaint}) left out of the tally entirely,
  // because the section pass compares it against a real counterpart.
  const actualAt = new Map<ValueElement, number>(actual.elements.map((el, i) => [el, i]))
  const reproWidth = actual.viewport?.width ?? 0
  const reproSections = actual.sections ?? []
  const leftover = (el: ValueElement): void => {
    if (isBandPaint(el, reproSections, reproWidth)) return
    unpairedActual.push(toUnpaired(el, actualAt.get(el)))
  }
  for (const q of queues.values()) for (const el of q) leftover(el)
  for (const q of fieldQueues.values()) for (const el of q) leftover(el)

  /**
   * REQ-270 — the reference sections that sit INSIDE `sections[i]`.
   *
   * A reference capture's sections are style-scope bands and nothing makes them
   * a partition: a header painted over the hero is its own section at its own,
   * smaller box. A reproduction's geometric bands ARE a partition, so every run
   * of an overlapped reference section is counted once on their side and twice
   * on ours. Any axis derived from "the runs in this band" is therefore measured
   * over two different populations, and `contentAnchor` is one.
   *
   * Smaller and substantially contained — half of the inner section's own height
   * inside the outer one. A pair of adjacent bands that merely touch at an edge
   * is not an overlap and must not disable a comparison.
   */
  function overlappingSmallerSections(
    sections: readonly SectionValues[],
    i: number,
  ): readonly SectionValues[] {
    const box = sections[i]?.box
    if (!box) return []
    return sections.filter((other, j) => {
      if (j === i || !other.box) return false
      if (other.box.height >= box.height) return false
      const top = Math.max(box.y, other.box.y)
      const bot = Math.min(box.y + box.height, other.box.y + other.box.height)
      return bot - top > 0 && (bot - top) / other.box.height >= 0.5
    })
  }

  // Section-level values (scrim, vertical anchor) — no text to join on, so joined
  // by GEOMETRY (BUG-102). Both sides carry the band box in the same full-page
  // document coordinate space, so the natural key is vertical overlap; the ordinal
  // join this replaced compared `§n` against whatever shared its index, which on a
  // page whose header is `position: absolute` over the hero meant a 192px header
  // strip against an 800px hero band. A reference section with no overlapping
  // counterpart is a segmentation mismatch, not a value delta: it is recorded in
  // `sectionPairing` as unpaired rather than compared against a stand-in.
  const expSections = expected.sections ?? []
  const actSections = actual.sections ?? []
  const geometryJoin = hasSectionGeometry(expSections) && hasSectionGeometry(actSections)
  const sectionPairing: SectionPairing[] = []
  let sectionsNotComparable: string | undefined

  // The flat-L1 degenerate case. An L1 render emits ONE element into `<body>`, and
  // the extractor's bands are the `<body>` children, so the whole reproduction is a
  // single body-spanning band: `§0` was being compared against the entire page and
  // every other reference section was skipped in silence. Say that once, plainly —
  // eight "unpaired" rows would be louder noise than the false delta they replace,
  // and none of them would be about the reproduction.
  const flatRepro =
    geometryJoin &&
    actSections.length === 1 &&
    expSections.length > 1 &&
    spansWholePage(actSections[0], actual)

  if (flatRepro) {
    const band = actSections[0].box!
    sectionsNotComparable =
      `the reproduction segments into ONE body-spanning band (${Math.round(band.height)}px, covering its whole page), ` +
      `so the reference's ${expSections.length} sections have no bands to compare against — ` +
      `section-level values (overlay, contentAnchor, textAlign) are UNMEASURED here, not clean`
  }

  const sectionMatches = flatRepro
    ? new Map<number, SectionMatch>()
    : geometryJoin
      ? pairSectionsByGeometry(expSections, actSections)
      : pairSectionsByOrdinal(expSections, actSections)

  // Nothing is compared and nothing is listed under the flat-L1 verdict: the reason
  // above stands in for the whole per-section pass.
  const joinable: readonly SectionValues[] = flatRepro ? [] : expSections
  joinable.forEach((es, ei) => {
    const match = sectionMatches.get(ei)
    const as = match?.section
    const label = `§${es.index}`
    const pairing: SectionPairing = {
      label,
      box: es.box,
      actualLabel: as ? `§${as.index}` : null,
      actualBox: as?.box,
      overlap: match?.overlap ?? 0,
    }
    sectionPairing.push(pairing)
    if (!as) {
      // REQ-308 — an unpaired band that PAINTS NOTHING is not a reproduction gap.
      //
      // The two section lists are built by different procedures: the reference's
      // bands are `<body>`'s children qualified on their subtree's painted extent
      // (BUG-27), and the reproduction's are the band nodes the fold emits — and
      // `foldSectionBackgrounds` emits one only for a section carrying an image or
      // an overlay, with solid bands arriving as run surfaces. A reference band
      // with no fill, no image and no overlay has nothing for ANY fold to emit, so
      // the missing counterpart is the comparison's, not the reproduction's, and
      // no amount of folding could ever drive the count down.
      //
      // Measured on gigabytealchemy as the entire `unmeasured` number: `§0` is a
      // `position: absolute` transparent `<header>` lying over the hero, a band
      // only because BUG-27 qualifies a collapsed-but-painting child on its
      // subtree's extent. It is a content grouping; calling it an uncompared
      // SURFACE is a category error.
      //
      // `surfaceFill === null` is "measured, and it paints none" — a pre-schema-3
      // bundle records `undefined` there and cannot distinguish that from "paints
      // white", so its bands stay unpaired rather than being reclassified on an
      // absence the instrument never read.
      if (es.surfaceFill === null && !es.backgroundImageUrl && !es.overlay) {
        pairing.nonSurfaceReason =
          'this reference band paints NOTHING — no fill, no background image, no overlay — so it is a content ' +
          'grouping rather than a surface, and no reproduction band could ever be its counterpart (the fold ' +
          'emits a band node only for a section carrying an image or an overlay). Not counted as unpaired: ' +
          'the missing partner is this comparison\'s, not the reproduction\'s'
      }
      return
    }

    const eo = es.overlay
    const ao = as.overlay
    const overlayOk =
      (!eo && !ao) ||
      (!!eo &&
        !!ao &&
        eo.color.toLowerCase() === ao.color.toLowerCase() &&
        Math.abs(eo.opacity - ao.opacity) <= opacityTol)
    if (!overlayOk) record(label, 'section', 'overlay', overlayLabel(eo), overlayLabel(ao))

    // REQ-271 — the band's own base fill: the single most visually dominant
    // property of a page, and until now compared by nothing at all. An L1 render
    // could paint an opaque navy plate under a hero the reference paints nothing
    // on — it did, on gigabytealchemy — and the value gate reported zero deltas.
    //
    // `undefined` on either side means the axis was not measured there (a capture
    // bundle older than schema 3 cannot distinguish "paints white" from "paints
    // nothing"), and an unmeasured axis is not a clean one: it is skipped rather
    // than compared against a stand-in. Reuses the element-level `surfaceFill`
    // property, so a wrong band fill reads as the colour defect it is.
    if (es.surfaceFill !== undefined && as.surfaceFill !== undefined) {
      const ef = es.surfaceFill
      const af = as.surfaceFill
      if (ef && af) {
        const dE = colorDistance(ef, af)
        if (dE > colorTol) record(label, 'section', 'surfaceFill', ef, af, dE)
      } else if (ef !== af) {
        // One side paints a fill and the other paints none — not a colour
        // distance at all, and never within tolerance.
        record(label, 'section', 'surfaceFill', ef ?? '(none)', af ?? '(none)')
      }
    }

    // REQ-270 — the section band's own imagery, compared by mirrored basename for
    // the same reason the element-level handle is (the two sides legitimately
    // spell the same bytes differently). It was the one section axis NOT
    // compared, so a reproduction that lost the hero photograph entirely
    // produced zero deltas and a clean gate — the axis the whole band exists to
    // carry was the axis nothing checked.
    const expBandBg = assetBasename(es.backgroundImageUrl)
    const actBandBg = assetBasename(as.backgroundImageUrl)
    if (expBandBg !== actBandBg) {
      record(label, 'section', 'backgroundImage', expBandBg ?? '(none)', actBandBg ?? '(none)')
    }

    // REQ-270 — THE ANCHOR IS ONLY COMPARABLE OVER THE SAME POPULATION OF RUNS.
    //
    // The reference's anchor is a DOM-descendant walk of the band element; ours
    // is every run whose centre falls in the geometric slice. Those agree on a
    // conventionally nested page and disagree exactly when the reference's own
    // sections OVERLAP — a `position: absolute` header sitting over the hero is
    // its own reference section, so its runs are not descendants of the hero and
    // the reference excludes them, while a geometric slice is a partition and
    // ours cannot. On gigabytealchemy that is 0.53 vs 0.39 on byte-identical
    // geometry: a phantom 112px content shift, silent only because 0.14 happened
    // to fall 0.01 under the tolerance.
    //
    // The fix is to say so rather than to compare two numbers that do not mean
    // the same thing, and rather than to widen the tolerance — a tolerance that
    // absorbs this would also absorb a real 100px shift.
    const overlapping = overlappingSmallerSections(expSections, ei)
    if (overlapping.length) {
      pairing.anchorComparable = false
      pairing.anchorReason =
        `${overlapping.map((o) => `§${o.index}`).join(', ')} sits inside this band, so the reference measured its ` +
        `anchor over a DOM-descendant population that EXCLUDES those runs while the reproduction's geometric band ` +
        `includes them — the two anchors are not the same measurement and are not compared`
    } else if (es.contentAnchorRatio !== null && as.contentAnchorRatio !== null) {
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
  })

  // BUG-111 — lift the unpaired bands out of `sectionPairing` and count them on
  // both sides. The pairing rows already said this, in the only place that said
  // it: `values-diff.json`'s `sectionPairing` array, which `gate.json` does not
  // summarise and no consumer of the gate reads. So a reference band that went
  // entirely uncompared produced no count, no coverage finding and no rung on
  // the pass report's `outstanding` list — the gate read `unmatched: 0` next to
  // `coverage.sections: 8` and said all eight were accounted for when one was not.
  //
  // Derived from the SAME pass rather than recomputed: one pairing decision, one
  // place it is made, and the counts cannot disagree with the rows they summarise.
  const unpairedSections: UnpairedSection[] = sectionPairing
    .filter((p) => p.actualLabel === null && !p.nonSurfaceReason)
    .map((p) => ({ label: p.label, ...(p.box ? { box: p.box } : {}) }))
  // REQ-308 — derived from the SAME pass, for the same reason the counts above
  // are: one classification decision, one place it is made, and the two lists
  // cannot disagree with the rows they summarise.
  const nonSurfaceSections: NonSurfaceSection[] = sectionPairing
    .filter((p) => p.actualLabel === null && !!p.nonSurfaceReason)
    .map((p) => ({ label: p.label, ...(p.box ? { box: p.box } : {}), reason: p.nonSurfaceReason! }))
  // The repro side has no row of its own to filter, so it is the complement of the
  // bands the join claimed. Identity, not index: `pairSectionsByGeometry` keys by
  // POSITION in its input while `§n` is the manifest's own `index`, and a manifest
  // with non-contiguous section indices would mismatch the two.
  // BUG-139 — and the same lift for the declinations, one row over. An unpaired
  // band and a declined axis on a band that DID pair are the same silence: the
  // pairing row says it, nothing the gate writes carries it, and the round reads
  // the gate. `contentAnchor` is named rather than inferred from the flag, because
  // the axis is what an operator acts on — a second declined axis would push its
  // own name here rather than widening the meaning of this one.
  const notComparableAxes: NotComparableAxis[] = sectionPairing
    .filter((p) => p.anchorComparable === false)
    .map((p) => ({ scope: p.label, axis: 'contentAnchor', reason: p.anchorReason ?? '' }))
  const claimedActual = new Set<SectionValues>()
  for (const m of sectionMatches.values()) claimedActual.add(m.section)
  const unpairedActualSections: UnpairedSection[] = flatRepro
    ? []
    : actSections
        .filter((as) => !claimedActual.has(as))
        .map((as) => ({ label: `§${as.index}`, ...(as.box ? { box: as.box } : {}) }))

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
    sectionPairing,
    unpairedSections,
    nonSurfaceSections,
    unpairedActualSections,
    // REQ-274 — the declared one-sided axes this pair of manifests actually ran
    // into: the side that CAN read the axis carried a value and the other side
    // had nothing to compare it with. Not the whole declaration, which is true
    // of every comparison and would put a permanent row on every report.
    unmeasuredAxes: observedUnmeasuredAxes(expected, actual, opts.declaredUnmeasured),
    // BUG-139 — the declinations, ALWAYS carried, empty when this run declined
    // nothing. Unconditional where `sectionsNotComparable` below is conditional,
    // because an empty array is the measurement "asked, and nothing was declined"
    // and its absence is then unambiguously a report written before this existed —
    // which the console reads as cannot-say rather than as none.
    notComparableAxes,
    ...(sectionsNotComparable ? { sectionsNotComparable } : {}),
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
  // REQ-88 — the ladder only. A height probe shares its key with the ladder cell
  // it re-shoots, so including it both overwrites that cell's reproduction and
  // emits a second cell for the same width.
  const reproByKey = new Map<string, StateProjection>()
  for (const p of partitionProbes(repro.projections).ladder) {
    reproByKey.set(projectionKey(p.engine, p.viewport.width, p.state), p)
  }

  const out: StateDiff[] = partitionProbes(reference.projections).ladder.map((ref) => {
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
