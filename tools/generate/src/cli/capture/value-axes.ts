/**
 * REQ-274 — the value axes, declared ONCE for both sides of the fidelity diff.
 *
 * ## The defect this retires
 *
 * The reference side (a stored {@link Capture} bundle) and the reproduction side
 * (a live {@link RawSignals} extraction) used to be read by two independent
 * procedures — `flattenCapture` and `flattenSignals`, ~185 lines between them —
 * that happened to return the same `ValueManifest` type. Every axis the gate
 * compares was read twice, in two places, and `ValueManifest` was satisfied
 * either way, so an axis projected on one side and not the other produced no
 * type error, no delta and no diagnostic: the comparator's `!== undefined` guard
 * simply skipped it and the gate read CLEAN. Four of EPIC-19's twenty-two
 * defects were that one shape (REQ-269 #5, REQ-270 #2/#3/#4), fixed one axis at
 * a time, and none of those fixes stopped the fifth.
 *
 * There WAS a fifth, and it is in the table below: `paddingTopPx`,
 * `paddingRightPx`, `paddingBottomPx` and `textAlign` on a TEXT RUN. REQ-64
 * added all four to {@link RawRun} and to the comparator; nothing added them to
 * {@link ContentRun}, so the reference never supplied them, the comparator's
 * both-sides guard never fired, and four *compared* axes were silently
 * unevaluated on every text run of every reproduction. Declaring them here as
 * reference-side {@link unsupplied} is what made them show up in
 * {@link UNMEASURED_AXES} and reach the gate as UNMEASURED rather than clean —
 * and REQ-302 then closed the gap at its source, adding all four to
 * {@link ContentRun} and to `toContentRun`, so they read from both sides now.
 * That sequence is the point of this module: a declared gap is a gap someone can
 * close, where a silent one is a gap nobody can see.
 *
 * ## What a row is
 *
 * One row = one manifest field = one axis. It names the field, how the REFERENCE
 * reads it, how the REPRODUCTION reads it, whether the diff compares it or
 * merely carries it for the fold, and a note in the vocabulary of both sides.
 * Both sides are REQUIRED properties of the row type, so a half-declared axis is
 * a compile error; a side that genuinely cannot supply the axis is written
 * `unsupplied('<why>')`, which is a statement, not an omission.
 *
 * ## What this is NOT
 *
 * It is not one function over both inputs. The two inputs are genuinely
 * different — a stored bundle possibly written at an older `CAPTURE_SCHEMA`
 * versus a live extraction from this process — and several axes are read
 * differently on each side (a bundle stores a normalized {@link TextGradient};
 * the extractor hands over raw `background-image` CSS). What is unified is WHERE
 * each axis is read, not HOW.
 *
 * It also does not touch the section JOIN. The capture's sections are coalesced
 * by style signature and the reproduction's bands are raw, so their indices do
 * not correspond and BUG-102's geometry join stays exactly as it is. That
 * asymmetry is real, is named here, and is out of this module's scope: a row
 * says who reads an axis, never how two bands are paired.
 */
import type {
  Arrangement,
  BorderTreatment,
  Capture,
  ContentRun,
  ElementGeometry,
  Field,
  NameSource,
  Section,
  TextGradient,
  ThemeSubScales,
  Viewport,
} from './types'
import type { RawBand, RawField, RawGeometry, RawRun, RawSignals } from './extract'
import type { SectionValues, ValueElement, ValueManifest } from './values-diff'
import { normalizeGradient } from './color-values'
import { subScalesFromSignals } from './theme'
import { isSafeUrl } from '@1stcontact/site-schema'

// ── the declaration vocabulary ───────────────────────────────────────────────

/** A side that CAN supply an axis: how that side's input is read. `undefined` is
 *  "this particular input did not record it" — a RUNTIME unmeasured, distinct
 *  from {@link AxisUnsupplied}'s declaration-time one. */
export type AxisReader<Src, T> = (src: Src) => T | undefined

/**
 * A side that CANNOT supply an axis, with the reason stated at the declaration.
 *
 * This is the whole point of the table. An axis one side cannot read is not a
 * hole to be discovered by a reader of two 90-line functions — it is a value in
 * the row, it is enumerable ({@link UNMEASURED_AXES}), and when the axis is one
 * the diff COMPARES it reaches the gate as an unmeasured axis rather than as
 * silence.
 */
export interface AxisUnsupplied {
  readonly unsupplied: string
}

/** One side of an axis: a reader, or a stated inability to read it. */
export type AxisSide<Src, T> = AxisReader<Src, T> | AxisUnsupplied

/** Declare that this side cannot supply the axis, and why. */
export function unsupplied(reason: string): AxisUnsupplied {
  return { unsupplied: reason }
}

/** The reader for a side, or null when that side declared itself unable. */
export function readerOf<Src, T>(side: AxisSide<Src, T>): AxisReader<Src, T> | null {
  return typeof side === 'function' ? side : null
}

/**
 * Whether `diffManifests` COMPARES this axis or merely CARRIES it.
 *
 * The distinction is load-bearing, not documentation. A `carried` axis exists
 * for the L1 fold (a link target, an inline-flow id, a media `src`) and moves no
 * pixel, so a side that cannot supply it is a gap in the fold's input, not in
 * the gate's evidence. A `compared` axis that only one side can supply is the
 * defect this module exists to surface — only those reach {@link UNMEASURED_AXES}.
 */
export type AxisRole = 'compared' | 'carried'

/** Which manifest level the axis is a field of. */
export type AxisScope = 'manifest' | 'section' | 'element'

interface AxisRowBase {
  readonly role: AxisRole
  /** One sentence, in the vocabulary of both sides. */
  readonly note: string
}

// ── row shapes, one per manifest level ───────────────────────────────────────

/**
 * The reference side's section input. A capture band is not just its
 * {@link Section}: the bundle's `captureSchema` decides whether an axis added at
 * a later schema was measured at all (REQ-271's `surfaceFill` reads white on a
 * pre-schema-3 bundle whether or not the band painted anything), so the schema
 * travels with the band rather than being consulted somewhere else.
 */
export interface CaptureBand {
  readonly section: Section
  readonly schema: number
}

/** `index` is positional — assigned by the projection from document order, read
 *  from neither side — so it is not an axis and has no row. */
export type SectionAxisName = Exclude<keyof SectionValues, 'index'>

export interface SectionAxisRow<K extends SectionAxisName> extends AxisRowBase {
  readonly axis: K
  readonly reference: AxisSide<CaptureBand, SectionValues[K]>
  readonly reproduction: AxisSide<RawBand, SectionValues[K]>
}

export type AnySectionAxis = { [K in SectionAxisName]-?: SectionAxisRow<K> }[SectionAxisName]

/**
 * An element axis, over whichever pair of inputs the element came from. Three
 * tables share this shape because an element reaches the manifest by three
 * routes — the geometry every element has, the fields only a text run has, and
 * the fields only a text-free element has — and an axis belongs to exactly one.
 */
export interface ElementAxisRow<Ref, Rep, K extends keyof ValueElement> extends AxisRowBase {
  readonly axis: K
  readonly reference: AxisSide<Ref, ValueElement[K]>
  readonly reproduction: AxisSide<Rep, ValueElement[K]>
}

export type AnyElementAxis<Ref, Rep> = {
  [K in keyof ValueElement]-?: ElementAxisRow<Ref, Rep, K>
}[keyof ValueElement]

/** `source`, `elements` and `sections` are the manifest's containers, and
 *  `engine`/`state` are stamped by the multi-state loop rather than read off
 *  either input — none of them is an axis, so none of them has a row. */
export type ManifestAxisName = Exclude<keyof ValueManifest, 'source' | 'elements' | 'sections' | 'engine' | 'state'>

export interface ManifestAxisRow<K extends ManifestAxisName> extends AxisRowBase {
  readonly axis: K
  readonly reference: AxisSide<Capture, ValueManifest[K]>
  readonly reproduction: AxisSide<RawSignals, ValueManifest[K]>
}

export type AnyManifestAxis = { [K in ManifestAxisName]-?: ManifestAxisRow<K> }[ManifestAxisName]

// ── shared-reader helpers ────────────────────────────────────────────────────
//
// Where the two sides read an axis IDENTICALLY, say so once. This is the best
// case, not the general one, and writing it as a helper keeps it visibly
// different from a row whose two readers merely happen to look alike.

/** Both sides read an element's geometry the same way (`RawGeometry` is
 *  structurally an {@link ElementGeometry} with the optionals filled in). */
function sharedGeometry<T>(read: (g: ElementGeometry) => T | undefined): {
  reference: AxisReader<ElementGeometry, T>
  reproduction: AxisReader<RawGeometry, T>
} {
  return { reference: read, reproduction: read }
}

/** Both sides read a text run's field the same way (identical property names). */
function sharedRun<T>(read: (r: ContentRun & RawRun) => T | undefined): {
  reference: AxisReader<ContentRun, T>
  reproduction: AxisReader<RawRun, T>
} {
  return { reference: read as AxisReader<ContentRun, T>, reproduction: read as AxisReader<RawRun, T> }
}

/** Both sides read a text-free element the same way. `Field` and `RawField` are
 *  the one place where the two inputs really are structurally identical, so the
 *  ideal the rest of this module approximates — one reader — is literally
 *  available here, and is stated rather than left implicit. */
function sharedField<T>(read: (f: Field) => T | undefined): {
  reference: AxisReader<Field, T>
  reproduction: AxisReader<RawField, T>
} {
  return { reference: read, reproduction: read }
}

// ── the geometry axes (every element, text or text-free) ─────────────────────

/** A uniform box border → {@link BorderTreatment}, or null when none is painted.
 *  `undefined` when the side never recorded a width at all (a pre-blind-spot
 *  bundle), which keeps the axis unmeasured rather than asserting "no border". */
function borderOf(g: ElementGeometry): BorderTreatment | null | undefined {
  if (g.borderWidthPx === undefined) return undefined
  if (!(g.borderWidthPx > 0) || !g.borderColor) return null
  return { widthPx: g.borderWidthPx, color: g.borderColor, ...(g.borderStyle ? { style: g.borderStyle } : {}) }
}

export const GEOMETRY_AXES: readonly AnyElementAxis<ElementGeometry, RawGeometry>[] = [
  {
    axis: 'box',
    role: 'compared',
    note: 'The element rect in full-page document coords — the `position`, `size`, `gap` and `containment` axes are all read off it.',
    ...sharedGeometry((g) => g.box),
  },
  {
    axis: 'borderRadiusPx',
    role: 'compared',
    note: 'Largest computed corner radius (0 when square); half of the `shape` axis.',
    ...sharedGeometry((g) => g.borderRadiusPx),
  },
  {
    axis: 'border',
    role: 'compared',
    note: 'Uniform all-sides box border, folded from width + colour + line style. Distinct from `borderLeft`, which is an asymmetric accent bar.',
    ...sharedGeometry(borderOf),
  },
  {
    axis: 'boxShadow',
    role: 'compared',
    note: 'Computed `box-shadow` when painted; the other half of the `shape` axis.',
    ...sharedGeometry((g) => g.boxShadow),
  },
  {
    axis: 'surface',
    role: 'carried',
    note: 'BUG-22 — the box that PAINTS the surface behind this element. Not itself diffed: it is what the diff resolves a split control\'s surface axes AGAINST.',
    ...sharedGeometry((g) => g.surface),
  },
  {
    axis: 'a11yRole',
    role: 'compared',
    note: 'BUG-107 — the browser\'s own framework-agnostic semantic label.',
    ...sharedGeometry((g) => g.a11yRole),
  },
  {
    axis: 'href',
    role: 'carried',
    note: 'REQ-269 — the nearest enclosing anchor\'s target, for the fold\'s `link` derivation. Behavioural, moves no pixel; its CONSEQUENCE is compared as `a11yRole: link`.',
    ...sharedGeometry((g) => g.href ?? undefined),
  },
  {
    axis: 'headingLevel',
    role: 'compared',
    note: 'REQ-269 / BUG-107 — outline depth of the nearest enclosing heading; the half of the heading role `a11yRole` flattens away.',
    ...sharedGeometry((g) => g.headingLevel ?? undefined),
  },
  {
    axis: 'arrangement',
    role: 'compared',
    note: 'Rendered position relative to the previous element in the section (`row` / `stack`), derived from geometry alone.',
    ...sharedGeometry((g) => g.arrangement as Arrangement | null | undefined),
  },
  {
    axis: 'zIndex',
    role: 'compared',
    note: 'REQ-48 (item 2) — effective paint order; the only axis that separates two correctly-positioned but wrongly-stacked elements.',
    ...sharedGeometry((g) => g.zIndex),
  },
  {
    axis: 'filter',
    role: 'compared',
    note: 'REQ-48 (item 3) — computed `filter` (blur / drop-shadow halo) when painted. Compared as presence.',
    ...sharedGeometry((g) => g.filter),
  },
  {
    axis: 'textShadow',
    role: 'compared',
    note: 'REQ-48 (item 3) — computed `text-shadow` (glow / legibility shadow) when painted. Compared as presence.',
    ...sharedGeometry((g) => g.textShadow),
  },
  {
    axis: 'maskEdge',
    role: 'compared',
    note: 'REQ-48 (item 3) — computed `mask-image` / `clip-path` (feathered or shaped edge). Compared as presence, as the `mask` property.',
    ...sharedGeometry((g) => g.maskEdge),
  },
  {
    axis: 'backdropFilter',
    role: 'compared',
    note: 'REQ-63 — frosted-glass blur behind the element. Compared as presence.',
    ...sharedGeometry((g) => g.backdropFilter),
  },
  {
    axis: 'blendMode',
    role: 'compared',
    note: 'REQ-63 — computed `mix-blend-mode` when non-`normal`. Compared by value.',
    ...sharedGeometry((g) => g.blendMode),
  },
  {
    axis: 'opacity',
    role: 'compared',
    note: 'REQ-63 — element opacity in 0..1; a partial value ghosts the element.',
    ...sharedGeometry((g) => g.opacity),
  },
  {
    axis: 'outline',
    role: 'compared',
    note: 'REQ-63 — painted outline (focus ring / offset outline), distinct from `border`. Compared as presence.',
    ...sharedGeometry((g) => g.outline),
  },
  {
    axis: 'pseudo',
    role: 'compared',
    note: 'REQ-63 — `::before` / `::after` injected content presence.',
    ...sharedGeometry((g) => g.pseudo),
  },
  {
    axis: 'transformRotateDeg',
    role: 'compared',
    note: 'REQ-48 (item 1) — rotation in degrees decomposed from the transform matrix; half the `transform` axis.',
    ...sharedGeometry((g) => g.transformRotateDeg),
  },
  {
    axis: 'transformScale',
    role: 'compared',
    note: 'REQ-48 (item 1) — uniform scale decomposed from the transform matrix; the other half of `transform`.',
    ...sharedGeometry((g) => g.transformScale),
  },
  {
    axis: 'motion',
    role: 'compared',
    note: 'REQ-48 (item 1) — declared animation / transition. The one thing a resting frame cannot hold is that it was going to move.',
    ...sharedGeometry((g) => g.motion),
  },
]

// ── the text-run axes ────────────────────────────────────────────────────────

/** A run's left accent bar → {@link BorderTreatment}, or null when unpainted. The
 *  bundle stores the treatment; the extractor hands over width + colour. */
function rawAccent(r: RawRun): BorderTreatment | null {
  return r.borderLeftWidthPx > 0 && r.borderLeftColor
    ? { widthPx: r.borderLeftWidthPx, color: r.borderLeftColor }
    : null
}

export const RUN_AXES: readonly AnyElementAxis<ContentRun, RawRun>[] = [
  {
    axis: 'text',
    role: 'compared',
    note: 'Verbatim text (DOC-13 §5). Also the join key, case-folded — so casing itself is a compared value.',
    ...sharedRun((r) => r.text),
  },
  {
    axis: 'role',
    role: 'carried',
    note: 'The capture\'s own coarse role (`heading` / `body` / `action` / …) — the delta rows\' label and the object card\'s heading, not a diffed axis. `a11yRole` is the compared semantic.',
    ...sharedRun((r) => r.role),
  },
  {
    axis: 'color',
    role: 'compared',
    note: 'Resolved text ink `#rrggbb`, compared by perceptual distance (ΔE in OKLab), not by string equality.',
    ...sharedRun((r) => r.color),
  },
  {
    axis: 'fontFamily',
    role: 'compared',
    note: 'Computed font-family stack.',
    ...sharedRun((r) => r.fontFamily),
  },
  {
    axis: 'fontSizePx',
    role: 'compared',
    note: 'Computed font size in px.',
    ...sharedRun((r) => r.fontSizePx),
  },
  {
    axis: 'fontWeight',
    role: 'compared',
    note: 'Computed numeric font weight.',
    ...sharedRun((r) => r.fontWeight),
  },
  {
    axis: 'lineHeightPx',
    role: 'compared',
    note: 'Computed line-height in px. The extractor writes `null` for a non-length (`normal`); the bundle simply omits it. Both mean UNMEASURED, so both read as absent.',
    reference: (r) => r.lineHeightPx,
    reproduction: (r) => r.lineHeightPx ?? undefined,
  },
  {
    axis: 'letterSpacingPx',
    role: 'compared',
    note: 'Computed letter-spacing in px (0 for `normal`).',
    ...sharedRun((r) => r.letterSpacingPx),
  },
  {
    axis: 'gradient',
    role: 'compared',
    note: 'Text-fill gradient (`background-clip: text`). The bundle stores it already normalized; the extractor hands over raw `background-image` CSS, normalized here — the same normalization, reached from one row.',
    reference: (r) => r.gradient,
    reproduction: (r) => normalizeGradient(r.gradientCss),
  },
  {
    axis: 'borderLeft',
    role: 'compared',
    note: 'Left-edge accent bar. The bundle stores the treatment; the extractor hands over width + colour.',
    reference: (r) => r.borderLeft,
    reproduction: rawAccent,
  },
  {
    axis: 'accentBox',
    role: 'carried',
    note: 'REQ-88 — the rect of the element that PAINTS the accent when a wrapper does, so a reproduction can put the bar where the reference paints it instead of over the first glyph. Carried for the fold; the bar itself is compared as `borderLeft`.',
    reference: (r) => r.accentBox,
    reproduction: (r) => (rawAccent(r) && r.accentBox ? r.accentBox : undefined),
  },
  {
    axis: 'paddingLeftPx',
    role: 'compared',
    note: 'Computed left padding / indent in px — the one padding side a captured text run has always carried.',
    ...sharedRun((r) => r.paddingLeftPx),
  },
  {
    axis: 'paddingTopPx',
    role: 'compared',
    note: 'REQ-64 — Type-A top padding, recorded on both sides since REQ-302.',
    ...sharedRun((r) => r.paddingTopPx),
  },
  {
    axis: 'paddingRightPx',
    role: 'compared',
    note: 'REQ-64 — Type-A right padding, recorded on both sides since REQ-302.',
    ...sharedRun((r) => r.paddingRightPx),
  },
  {
    axis: 'paddingBottomPx',
    role: 'compared',
    note: 'REQ-64 — Type-A bottom padding, recorded on both sides since REQ-302.',
    ...sharedRun((r) => r.paddingBottomPx),
  },
  {
    axis: 'textAlign',
    role: 'compared',
    note: 'REQ-64 — normalized computed `text-align` (start→left, end→right), recorded on both sides since REQ-302.',
    ...sharedRun((r) => r.textAlign),
  },
  {
    axis: 'surfaceFill',
    role: 'compared',
    note: 'REQ-58 (item 3b) — the card/panel fill composited behind the run, null on the band. Compared by ΔE like `color`.',
    ...sharedRun((r) => r.surfaceFill ?? undefined),
  },
  {
    axis: 'surfaceGradient',
    role: 'compared',
    note: 'REQ-62 — the card/panel GRADIENT behind the run, which `surfaceFill` composites straight past. Bundle-side already normalized; extractor-side raw CSS.',
    reference: (r) => r.surfaceGradient,
    reproduction: (r) => normalizeGradient(r.surfaceGradientCss),
  },
  {
    axis: 'renderedTextBox',
    role: 'compared',
    note: 'REQ-58 (T1) — Range-measured glyph extent, padding-excluded. Catches a rendered size / tracking / weight-fallback difference the computed `fontSizePx` agrees on.',
    ...sharedRun((r) => r.renderedTextBox ?? undefined),
  },
  {
    axis: 'colorInferred',
    role: 'carried',
    note: 'REQ-35 — the colour was a `#000000`/`#ffffff` fallback, not a measurement. Not an axis the diff compares: it is what STOPS the diff holding a reproduction to a colour the capture only guessed.',
    ...sharedRun((r) => (r.colorInferred ? true : undefined)),
  },
  {
    axis: 'fontLoaded',
    role: 'compared',
    note: 'REQ-48 (item 7) — false when the intended named face did not resolve. Compared as the `fontLoad` axis; absent means "loaded", which is the overwhelmingly common case and is not worth a key.',
    ...sharedRun((r) => (r.fontLoaded === false ? false : undefined)),
  },
  {
    axis: 'inlineGroup',
    role: 'carried',
    note: 'REQ-211 — which inline flow this run is a fragment of, so the fold can rejoin a sentence instead of pinning each fragment at its own absolute box.',
    ...sharedRun((r) => r.inlineGroup),
  },
  {
    axis: 'inlineIndex',
    role: 'carried',
    note: 'REQ-211 — this run\'s position in that flow, in document order.',
    ...sharedRun((r) => r.inlineIndex),
  },
  {
    axis: 'inlineBox',
    role: 'carried',
    note: 'REQ-211 — the flow root\'s own rect: the box the rejoined runs lay out inside.',
    ...sharedRun((r) => r.inlineBox || undefined),
  },
  {
    axis: 'textFlow',
    role: 'carried',
    note: 'REQ-211 — this run\'s text with its OWN separating spaces kept (`text` is trimmed), so the rejoin does not lose the word gap.',
    ...sharedRun((r) => r.textFlow),
  },
  {
    axis: 'verticalAlign',
    role: 'carried',
    note: 'Computed `vertical-align` when the run is lifted off the baseline (a superscript); carried for the fold.',
    ...sharedRun((r) => r.verticalAlign),
  },
  {
    axis: 'fontStyle',
    role: 'compared',
    note: 'REQ-63 — `font-style` when italic/oblique. Compared by value, so italic-vs-oblique is a delta.',
    ...sharedRun((r) => r.fontStyle),
  },
  {
    axis: 'textDecoration',
    role: 'compared',
    note: 'REQ-63 — `text-decoration-line` when underline / line-through / overline.',
    ...sharedRun((r) => r.textDecoration),
  },
  {
    axis: 'textTransform',
    role: 'compared',
    note: 'REQ-63 — `text-transform` when uppercase / lowercase / capitalize.',
    ...sharedRun((r) => r.textTransform),
  },
  {
    axis: 'fontVariant',
    role: 'compared',
    note: 'REQ-63 — `font-variant` / `font-variant-caps` when small-caps and kin.',
    ...sharedRun((r) => r.fontVariant),
  },
  {
    axis: 'listMarker',
    role: 'compared',
    note: 'REQ-63 — `list-style-type` when a marker is painted.',
    ...sharedRun((r) => r.listMarker),
  },
]

// ── the text-free (field) axes ───────────────────────────────────────────────

/**
 * A text-free element has no text, no ink and no type. The manifest's six
 * required element fields still have to hold something, so they hold the
 * accessible name as the display text and zeroes for the type axes — which is
 * what makes a textless pair agree on them by construction rather than by
 * measurement. Declared as rows so the required fields are covered by the table
 * on this route too, not filled in beside it.
 */
export const FIELD_AXES: readonly AnyElementAxis<Field, RawField>[] = [
  {
    axis: 'text',
    role: 'compared',
    note: 'The accessible name doubles as the display text; `(role)` when the control is unlabelled. Pairing for a textless element is by `a11yRole` + accessible name, never by this.',
    ...sharedField((f) => f.accessibleName || `(${f.a11yRole})`),
  },
  {
    axis: 'role',
    role: 'carried',
    note: 'A text-free element has no capture role, so the a11y role stands in as the delta rows\' label.',
    ...sharedField((f) => f.a11yRole),
  },
  {
    axis: 'color',
    role: 'compared',
    note: 'Constant `\'\'` — a text-free element paints no ink. Both sides agree by construction; `placeholderColor` is the ink a control actually has.',
    ...sharedField(() => ''),
  },
  {
    axis: 'fontFamily',
    role: 'compared',
    note: 'Constant `\'\'` — no type to describe.',
    ...sharedField(() => ''),
  },
  {
    axis: 'fontSizePx',
    role: 'compared',
    note: 'Constant `0` — no type to describe.',
    ...sharedField(() => 0),
  },
  {
    axis: 'fontWeight',
    role: 'compared',
    note: 'Constant `0` — no type to describe.',
    ...sharedField(() => 0),
  },
  {
    axis: 'textless',
    role: 'carried',
    note: 'REQ-47 — routes the element to the `a11yRole` + document-order pairing instead of the text queue, where an empty string would collide with every other textless element.',
    ...sharedField(() => true),
  },
  {
    axis: 'accessibleName',
    role: 'compared',
    note: 'REQ-47 — the a11y tree\'s resolved name; also REQ-96\'s join key for a named control.',
    ...sharedField((f) => f.accessibleName),
  },
  {
    axis: 'nameSource',
    role: 'compared',
    note: 'REQ-47 — WHERE the name is rendered: `placeholder` (inside the box) vs `label`/`aria` (outside). Compared as the `containment` axis; neither geometry nor text can see it.',
    ...sharedField((f) => f.nameSource as NameSource | null | undefined),
  },
  {
    axis: 'paddingTopPx',
    role: 'compared',
    note: 'REQ-269 #1 — the content inset a control\'s placeholder and typed text sit in. Recorded on BOTH sides (the text-run row of the same name is the one that is not).',
    ...sharedField((f) => f.paddingTopPx),
  },
  {
    axis: 'paddingRightPx',
    role: 'compared',
    note: 'REQ-269 #1 — as `paddingTopPx`.',
    ...sharedField((f) => f.paddingRightPx),
  },
  {
    axis: 'paddingBottomPx',
    role: 'compared',
    note: 'REQ-269 #1 — as `paddingTopPx`.',
    ...sharedField((f) => f.paddingBottomPx),
  },
  {
    axis: 'paddingLeftPx',
    role: 'compared',
    note: 'REQ-269 #1 — as `paddingTopPx`. The UA reset zeroes a control\'s padding, so only an axis wins against it.',
    ...sharedField((f) => f.paddingLeftPx),
  },
  {
    axis: 'objectFit',
    role: 'compared',
    note: 'REQ-48 (item 4) — how a media element fills its box.',
    ...sharedField((f) => f.objectFit),
  },
  {
    axis: 'objectPosition',
    role: 'compared',
    note: 'REQ-63 — where the image crops within its box.',
    ...sharedField((f) => f.objectPosition),
  },
  {
    axis: 'intrinsicAspect',
    role: 'compared',
    note: 'REQ-48 (item 4) — natural w/h of a media element; compared as the `aspect` axis.',
    ...sharedField((f) => f.intrinsicAspect),
  },
  {
    axis: 'src',
    role: 'carried',
    note: 'REQ-92 — a media element\'s resolved source, the substance an L1 `image` leaf carries. Carried for the fold; the painted handle is compared as `backgroundImage`.',
    ...sharedField((f) => f.src ?? undefined),
  },
  {
    axis: 'alt',
    role: 'carried',
    note: 'REQ-92 — a media element\'s alt text, for the L1 `image` leaf.',
    ...sharedField((f) => f.alt ?? undefined),
  },
  {
    axis: 'backgroundImageUrl',
    role: 'compared',
    note: 'BUG-27 — the CSS background image a text-free box paints. Compared by mirrored basename, because the reference spells it `assets/…` and the reproduction spells the same bytes as an absolute origin URL.',
    ...sharedField((f) => f.backgroundImageUrl ?? undefined),
  },
  {
    axis: 'surfaceFill',
    role: 'compared',
    note: 'BUG-27 — the box\'s own painted fill, which a background image layers over.',
    ...sharedField((f) => f.surfaceFill ?? undefined),
  },
  {
    axis: 'controlType',
    role: 'carried',
    note: 'REQ-93 — the authored input type the a11y role flattens away (`email` vs `tel` are both `textbox`). Behavioural; carried so the fold can bind a real behavior module.',
    ...sharedField((f) => f.controlType ?? undefined),
  },
  {
    axis: 'formAction',
    role: 'carried',
    note: 'REQ-93 — the enclosing form\'s submission endpoint. Behavioural; moves no pixel.',
    ...sharedField((f) => f.formAction ?? undefined),
  },
  {
    axis: 'placeholderColor',
    role: 'compared',
    note: 'REQ-265 — the RENDERED ink of a control\'s placeholder, composited. A UA pseudo-element inherits nothing, so no other axis on the control describes it.',
    ...sharedField((f) => f.placeholderColor ?? undefined),
  },
]

// ── the section axes ─────────────────────────────────────────────────────────

/**
 * BUG-13 — the first `url(...)` in a computed `background-image`, or undefined
 * when the band paints no image. Unsafe schemes (`data:`, `javascript:`, …) are
 * dropped at projection time so a section-background box the fold emits from
 * this always passes the L1 URL-scheme allowlist.
 */
function bandBackgroundImageUrl(css: string | null | undefined): string | undefined {
  if (!css) return undefined
  const m = css.match(/url\((['"]?)([^'")]+)\1\)/)
  if (!m) return undefined
  const url = m[2]
  return isSafeUrl(url) ? url : undefined
}

export const SECTION_AXES: readonly AnySectionAxis[] = [
  {
    axis: 'overlay',
    role: 'compared',
    note: 'REQ-31 / REQ-270 #3 — the full-bleed translucent scrim over the band. A scrim is a scrim however it is painted: `scrimOf` reads a translucent background-colour first, then a translucent colour STOP of the background-image, on both sides.',
    reference: ({ section }) => section.background.overlay ?? null,
    reproduction: (band) => band.overlay ?? null,
  },
  {
    axis: 'contentAnchorRatio',
    role: 'compared',
    note: 'REQ-31 — the content block\'s vertical centre as a fraction of band height. REQ-270 #4: comparable only over the SAME population of runs, which is a pairing question the comparator settles per band, not a projection one.',
    reference: ({ section }) => section.layout.contentAnchorRatio ?? null,
    reproduction: (band) => band.contentAnchorRatio ?? null,
  },
  {
    axis: 'textAlign',
    role: 'compared',
    note: 'REQ-64 — the band\'s own text alignment. The bundle records it as `layout.contentAlign`; the extractor as `textAlign`. Same axis, two spellings, one row.',
    reference: ({ section }) => section.layout.contentAlign,
    reproduction: (band) => band.textAlign,
  },
  {
    axis: 'surfaceFill',
    role: 'compared',
    note: 'REQ-271 — the band\'s own base fill, the most visually dominant property of a page. Below capture schema 3 a transparent band was recorded as an opaque fabrication of the body\'s colour, so an older bundle reads UNMEASURED rather than asserting a white it never took.',
    reference: ({ section, schema }) => (schema >= 3 ? (section.background.color ?? null) : undefined),
    reproduction: (band) => band.backgroundColor ?? null,
  },
  {
    axis: 'backgroundImageUrl',
    role: 'compared',
    note: 'REQ-270 #2 / BUG-13 — the band\'s own imagery, which on a photography-led page IS the page. The bundle stores a mirrored `assets/…` path; the extractor a raw computed `background-image`, whose first safe `url(...)` is taken. Compared by mirrored basename.',
    reference: ({ section }) =>
      section.background.kind === 'image' && section.background.image && isSafeUrl(section.background.image)
        ? section.background.image
        : undefined,
    reproduction: (band) => bandBackgroundImageUrl(band.backgroundImage),
  },
  {
    axis: 'box',
    role: 'compared',
    note: 'REQ-88 — the band\'s geometry, on EVERY band (not only an image one). It is also BUG-102\'s pairing key: the two sides\' section INDICES do not correspond, because the capture coalesces bands by style signature and the reproduction\'s are raw, so the join is by vertical overlap of these boxes.',
    reference: ({ section }) => section.box,
    reproduction: (band) => band.box,
  },
  {
    axis: 'paddingTopPx',
    role: 'carried',
    note: 'REQ-64 — the band\'s top padding. REQ-73: deliberately NOT compared — band padding is one component of the emergent `gap` (`gap = base + padding`) and the reference distributes the same visual gap differently (margins vs our padding), so `gap` measures the sum that matters.',
    reference: unsupplied(
      'a capture bundle records the band\'s `layout.contentAlign` but no per-side band padding — Section.layout has no padding field',
    ),
    reproduction: (band) => band.paddingTopPx,
  },
  {
    axis: 'paddingBottomPx',
    role: 'carried',
    note: 'REQ-64 — the band\'s bottom padding, on the same terms as `paddingTopPx`.',
    reference: unsupplied(
      'a capture bundle records the band\'s `layout.contentAlign` but no per-side band padding — Section.layout has no padding field',
    ),
    reproduction: (band) => band.paddingBottomPx,
  },
]

// ── the manifest-level axes ──────────────────────────────────────────────────

/**
 * BUG-27 — a bundle's page base fill: the background colour of the section that
 * covers the most of the document. A bundle's sections are style-scope bands, so
 * the one spanning the page carries the fill everything else is painted onto.
 */
function pageBaseOf(sections: readonly Section[]): string | undefined {
  let best: string | undefined
  let bestArea = 0
  for (const s of sections) {
    const area = (s.box?.width ?? 0) * (s.box?.height ?? 0)
    if (area > bestArea && s.background.color) {
      bestArea = area
      best = s.background.color
    }
  }
  return best
}

export const MANIFEST_AXES: readonly AnyManifestAxis[] = [
  {
    axis: 'viewport',
    role: 'compared',
    note: 'REQ-48 (item 5) — the width this manifest was projected at. Layout recomposes per width, so a width mismatch is a precondition failure, not a delta.',
    reference: (capture) => capture.viewport as Viewport,
    reproduction: (signals) => signals.viewport as Viewport,
  },
  {
    axis: 'subScales',
    role: 'compared',
    note: 'REQ-56 — component-owned sub-element type ramps (badge / checklist). The bundle stores them under `theme`; the reproduction derives them from its runs. Compared ramp-to-ramp so a systemic gap is one finding rather than thirty rows.',
    reference: (capture) => capture.theme.subScales as ThemeSubScales | undefined,
    reproduction: (signals) => subScalesFromSignals(signals),
  },
  {
    axis: 'bodyBackground',
    role: 'carried',
    note: 'BUG-27 — the page\'s base fill: what shows through wherever no band paints. Read off `<body>` on the reproduction side; inferred from the widest band on the bundle side, because that is the only place a bundle records it. Carried for the fold, which used to infer it from run surfaces and so reproduced a hero-led page entirely in the hero\'s colour.',
    reference: (capture) => pageBaseOf(capture.sections),
    reproduction: (signals) => signals.bodyBackground,
  },
]

// ── projection ───────────────────────────────────────────────────────────────

/** Which side of the table a projection reads. */
export type AxisSideName = 'reference' | 'reproduction'

interface ProjectableRow {
  readonly axis: string
  readonly reference: AxisSide<never, unknown>
  readonly reproduction: AxisSide<never, unknown>
}

/**
 * Run one side of a table over one input and write what it yields onto `target`.
 *
 * The three rules that make the table sufficient, all of them here:
 *   - a side that declared itself {@link unsupplied} contributes nothing;
 *   - a reader that returns `undefined` contributes nothing, so "this particular
 *     input did not record it" leaves the key ABSENT rather than asserting a
 *     default — which is exactly what the comparator's both-sides guard reads as
 *     unmeasured;
 *   - everything else is written under the axis's own name, so the manifest's
 *     field names and the table's axis names cannot drift apart.
 */
function applyAxes(target: Record<string, unknown>, rows: readonly ProjectableRow[], side: AxisSideName, src: unknown): void {
  for (const row of rows) {
    const read = readerOf(row[side])
    if (!read) continue
    // The row's own type pins `src` to this side's input; the engine is generic
    // over every table, so it reads it back as `unknown` and hands it straight on.
    const value = (read as (s: unknown) => unknown)(src)
    if (value !== undefined) target[row.axis] = value
  }
}

/** Project a capture bundle's text run (the reference) to a {@link ValueElement}. */
export function projectContentRun(run: ContentRun): ValueElement {
  const el: Record<string, unknown> = {}
  applyAxes(el, RUN_AXES as readonly ProjectableRow[], 'reference', run)
  applyAxes(el, GEOMETRY_AXES as readonly ProjectableRow[], 'reference', run)
  return el as unknown as ValueElement
}

/** Project a live extracted text run (our reproduction) to a {@link ValueElement}. */
export function projectRawRun(run: RawRun): ValueElement {
  const el: Record<string, unknown> = {}
  applyAxes(el, RUN_AXES as readonly ProjectableRow[], 'reproduction', run)
  applyAxes(el, GEOMETRY_AXES as readonly ProjectableRow[], 'reproduction', run)
  return el as unknown as ValueElement
}

/**
 * Project a text-free element to a {@link ValueElement}.
 *
 * One function for both sides, because {@link Field} and {@link RawField} really
 * are structurally identical — the ideal the rest of the table approximates. The
 * side is still named rather than assumed, so a future row that reads the two
 * differently has somewhere to say so.
 */
export function projectField(field: Field | RawField, side: AxisSideName = 'reference'): ValueElement {
  const el: Record<string, unknown> = {}
  applyAxes(el, FIELD_AXES as readonly ProjectableRow[], side, field)
  applyAxes(el, GEOMETRY_AXES as readonly ProjectableRow[], side, field)
  return el as unknown as ValueElement
}

/** Project a capture bundle's section (the reference) to its {@link SectionValues}. */
export function projectCaptureSection(band: CaptureBand, index: number): SectionValues {
  const sv: Record<string, unknown> = { index }
  applyAxes(sv, SECTION_AXES as readonly ProjectableRow[], 'reference', band)
  return sv as unknown as SectionValues
}

/**
 * Project a live extracted band (our reproduction) to its {@link SectionValues}.
 *
 * `index` is a position in document order and NOTHING MORE. The capture's
 * sections are coalesced by style signature and these are raw, so the two sides'
 * indices do not correspond — BUG-102's geometry join is what pairs them, and
 * this ticket does not touch it.
 */
export function projectSignalsBand(band: RawBand, index: number): SectionValues {
  const sv: Record<string, unknown> = { index }
  applyAxes(sv, SECTION_AXES as readonly ProjectableRow[], 'reproduction', band)
  return sv as unknown as SectionValues
}

/** Project the manifest-level axes of a capture bundle (the reference). */
export function projectCaptureManifestAxes(capture: Capture): Partial<ValueManifest> {
  const m: Record<string, unknown> = {}
  applyAxes(m, MANIFEST_AXES as readonly ProjectableRow[], 'reference', capture)
  return m as Partial<ValueManifest>
}

/** Project the manifest-level axes of a live extraction (our reproduction). */
export function projectSignalsManifestAxes(signals: RawSignals): Partial<ValueManifest> {
  const m: Record<string, unknown> = {}
  applyAxes(m, MANIFEST_AXES as readonly ProjectableRow[], 'reproduction', signals)
  return m as Partial<ValueManifest>
}

// ── the unmeasured axes ──────────────────────────────────────────────────────

/**
 * REQ-274 — a COMPARED axis that only one side of the table can supply.
 *
 * The comparator already skips an axis absent on either side; what it could not
 * do is SAY SO, because nothing distinguished "both sides agree" from "one side
 * never had a value". That silence is what let four Type-A run axes read clean
 * for the whole life of REQ-64. This is the fact the gate needs, carried in the
 * discipline BUG-106 / BUG-111 established: an unmeasured axis is not a clean
 * one, and a run carrying one is not silent even when it passes.
 */
export interface UnmeasuredAxis {
  /** The manifest field neither the diff nor the gate can speak for. */
  axis: string
  /** Which manifest level the field belongs to. */
  scope: AxisScope
  /** The side that declared itself unable to supply it. */
  side: AxisSideName
  /** Why, taken verbatim from the declaration. */
  reason: string
}

/**
 * Derive the unmeasured axes from a set of tables.
 *
 * Exported as a function over its tables rather than only as the constant below,
 * so the mechanism can be exercised against a table that is not the live one —
 * "add a row with a reference-side reader and no reproduction-side reader and
 * the axis reports unmeasured" is then a property of the code, provable without
 * first breaking the real projection to prove it.
 */
export function unmeasuredAxesOf(
  tables: ReadonlyArray<{ scope: AxisScope; rows: ReadonlyArray<{ axis: string; role: AxisRole; reference: unknown; reproduction: unknown }> }>,
): UnmeasuredAxis[] {
  const out: UnmeasuredAxis[] = []
  for (const { scope, rows } of tables) {
    for (const row of rows) {
      // A carried axis is the fold's input, not the gate's evidence: a side that
      // cannot supply one is a gap in what a reproduction can be BUILT from, not
      // in what it is graded against, and reporting it here would bury the
      // axes that are.
      if (row.role !== 'compared') continue
      for (const side of ['reference', 'reproduction'] as const) {
        const declared = row[side]
        if (typeof declared === 'function') continue
        const reason = (declared as AxisUnsupplied | undefined)?.unsupplied
        if (reason) out.push({ axis: row.axis, scope, side, reason })
      }
    }
  }
  return out
}

/** Every table, tagged with the manifest level it projects. The one list a
 *  caller enumerates when it wants to ask something OF the declaration. */
export const AXIS_TABLES = [
  { scope: 'manifest' as const, rows: MANIFEST_AXES },
  { scope: 'section' as const, rows: SECTION_AXES },
  { scope: 'element' as const, rows: GEOMETRY_AXES },
  { scope: 'element' as const, rows: RUN_AXES },
  { scope: 'element' as const, rows: FIELD_AXES },
]

/**
 * The compared axes the live table can only read on one side — today, REQ-64's
 * four Type-A text-run axes. Carried onto every {@link ValuesDiffReport} and
 * summarised by the gate, because it is a property of the instrument rather than
 * of any one page: the same axes are unmeasured on every run until the extractor
 * records them.
 */
export const UNMEASURED_AXES: readonly UnmeasuredAxis[] = unmeasuredAxesOf(AXIS_TABLES)

/**
 * The declared one-sided axes this PAIR OF MANIFESTS actually ran into.
 *
 * {@link UNMEASURED_AXES} is a property of the instrument and is true of every
 * comparison; that is not yet a fact worth putting in front of an operator. An
 * axis is only unmeasured *here* when the side that CAN read it actually carried
 * a value — there was something to compare, and nothing to compare it with. A
 * page whose runs have no padding at all loses nothing by REQ-64's four Type-A
 * axes being half-projected, and saying otherwise would put a permanent row on
 * every report, which is how a row stops being read by the time it matters
 * (BUG-112's lesson about printing "0 collisions" for ever).
 *
 * Presence, not truthiness: `paddingTopPx: 0` is a measurement and `undefined`
 * is not, which is the same rule the comparator's both-sides guard applies.
 */
export function observedUnmeasuredAxes(
  expected: ValueManifest,
  actual: ValueManifest,
  declared: readonly UnmeasuredAxis[] = UNMEASURED_AXES,
): UnmeasuredAxis[] {
  const carries = (m: ValueManifest, u: UnmeasuredAxis): boolean => {
    const has = (o: object | undefined): boolean => !!o && (o as Record<string, unknown>)[u.axis] !== undefined
    if (u.scope === 'manifest') return has(m)
    if (u.scope === 'section') return (m.sections ?? []).some(has)
    return (m.elements ?? []).some(has)
  }
  // The side that DID NOT declare itself unable is the one holding the value.
  return declared.filter((u) => carries(u.side === 'reference' ? actual : expected, u))
}

/** One line per unmeasured axis, for a report a human reads. */
export function unmeasuredAxisLabel(u: UnmeasuredAxis): string {
  return `${u.scope}.${u.axis} (no ${u.side} reader: ${u.reason})`
}
