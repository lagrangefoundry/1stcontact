/**
 * Browser-side signal extraction (DOC-13 §3). {@link EXTRACT_SCRIPT} is a
 * self-contained JS expression evaluated in page scope via the driver's
 * `query()`. It runs against the *rendered* DOM, so every color/font is read
 * from computed styles (var() already resolved) and every hidden node is
 * filtered by real geometry — the things static HTML cannot see.
 *
 * The script is authored as a raw string, never a stringified TS function, so
 * the exact source below is what Chromium evaluates — no build step rewrites it.
 */
import type { BandPaint, Box, ClipAncestor, PaintLevel, StickyAncestor, SurfaceShape } from './types'

/**
 * REQ-47 — rendered element geometry, shape, structure and arrangement. Every
 * field is a *rendered* fact (a painted box, a computed radius, the browser's
 * own a11y role/name), never a CSS mechanism (no `flex-direction`, no tag) — so
 * two different DOMs that render identically project to the same values.
 */
export interface RawGeometry {
  /**
   * `getBoundingClientRect()` in full-page document coords.
   *
   * REQ-265 — for a TEXT RUN this is the **line box** the run occupies. That is
   * what a block element's rect already is; an inline element's rect is its
   * content area (font ascent+descent, not `line-height`), so it is converted at
   * capture time — see `lineBoxOf` in the page script. The content area is not
   * lost: it is {@link RawRun.renderedTextBox}.
   */
  box: { x: number; y: number; width: number; height: number }
  /**
   * BUG-22 — the box that PAINTS the surface behind this element, with that box's
   * shape (see {@link SurfaceShape}). `self: true` on a conventional page, where a
   * control paints its own fill + rounding; `self: false` in an L1 reproduction,
   * which paints a control's surface on a sibling backing box while the label is
   * its own text node. Null when nothing paints behind the element.
   */
  surface?: SurfaceShape | null
  /** Largest computed corner radius in px (0 when square). */
  borderRadiusPx: number
  /** Uniform box-border width in px (0 when none painted) — the thickest painted side. */
  borderWidthPx?: number
  /** Box-border colour `#rrggbb` when a border is painted, else null. */
  borderColor?: string | null
  /** REQ-63 — box-border line style (`solid`/`dashed`/`dotted`/…) of the painted side, else null. */
  borderStyle?: string | null
  /** Raw computed `box-shadow` when a shadow is painted, else null. */
  boxShadow: string | null
  /** REQ-63 — computed `backdrop-filter` when painted (frosted-glass blur behind the element), else null. */
  backdropFilter: string | null
  /**
   * REQ-332 — the nearest ancestor (or self) that CUTS THIS ELEMENT OFF, as its
   * document-coordinate box plus a document-wide id; `null`/absent when nothing
   * does.
   *
   * The id is what makes this more than a rectangle: two elements clipped by the
   * same ancestor carry the same id, which is how the fold knows they belong
   * inside ONE clipping container rather than two coincidentally-similar ones.
   *
   * Optional so pre-REQ-332 bundles still parse — and a bundle without it folds
   * exactly as it did, because a document that declares no clip is the
   * paint-in-full default L1 already had.
   */
  clip?: ClipAncestor | null
  /**
   * REQ-377 — the nearest ancestor (or self) the page pins to the viewport
   * (computed `position: sticky` / `fixed`), with the offset it holds at; null
   * when nothing pins the element. See {@link StickyAncestor}.
   */
  sticky?: StickyAncestor | null
  /** REQ-63 — computed `mix-blend-mode` when non-`normal` (multiply/screen/overlay), else null. */
  blendMode: string | null
  /** REQ-63 — computed element `opacity` in 0..1 (1 when fully opaque); a partial value ghosts the element. */
  opacity: number
  /** REQ-63 — painted `outline` (focus ring / offset outline) as a `w px style #color`
   *  string, distinct from the box border; null when none. Compared as presence. */
  outline: string | null
  /** REQ-63 — `::before`/`::after` injected content presence (`before`/`after`/`both`), else null. */
  pseudo: 'before' | 'after' | 'both' | null
  /** ARIA role — the browser's framework-agnostic semantic label for this element. */
  a11yRole: string
  /**
   * REQ-269 — the navigation target of the nearest enclosing anchor, else null.
   *
   * The extractor read `href` only to decide whether an `<a>` counted as a link
   * and then discarded it, so `href` occurred ZERO times in a capture bundle and
   * the fold had nothing to write onto L1's `link` axis (REQ-106) — no
   * reproduction of any site could carry a working link, and a reference's
   * navigation reproduced as dead text. Projected for a reproduction to consume:
   * site-internal when same-origin, absolute when cross-origin, null for any
   * scheme the L1 URL allowlist refuses.
   */
  href: string | null
  /**
   * REQ-275 — whether the nearest enclosing anchor opens a NEW BROWSING CONTEXT.
   *
   * The other half of {@link href}, and surfaced by `1c capture audit` rather
   * than by a reproduction round: `dom:target` was in use on two of the three
   * stored references and decided about by nothing. Recorded as the derived
   * boolean L1 actually carries (`link.newTab`), not as the raw `target`, since
   * `_self`/`_parent`/`_top`/a named frame all mean the same thing to a
   * reproduction that has no frames.
   */
  newTab: boolean | null
  /**
   * REQ-269 — the outline depth (1…6) of the nearest enclosing heading, else null.
   * `a11yRole` reports the single word `heading` for all six tags, and `aria-level`
   * occurred nowhere in a capture bundle, so the level had to be recorded beside
   * the role for L1's heading role to have anything to carry.
   */
  headingLevel: number | null
  /**
   * How this element sits relative to the *previous* rendered element in its
   * section, derived purely from geometry: `row` (beside / right-of), `stack`
   * (below), or null (first element / indeterminate). Captures "button is
   * right-of vs below the input" without ever reading `flex-direction`.
   */
  arrangement: 'row' | 'stack' | null
  /** REQ-48 (item 2) — effective computed `z-index` as an integer (`auto` → 0). */
  zIndex: number
  /** BUG-187 — the stacking chain `zIndex` is one link of (see {@link PaintLevel}). */
  paintStack?: PaintLevel[]
  /** REQ-48 (item 3) — computed `filter` when painted, else null. */
  filter: string | null
  /** REQ-48 (item 3) — computed `text-shadow` when painted, else null. */
  textShadow: string | null
  /** REQ-48 (item 3) — computed `mask-image` or `clip-path` when the element is masked/clipped, else null. */
  maskEdge: string | null
  /**
   * REQ-48 (item 1) — transform rotation in degrees, decomposed from the matrix
   * (0 when none). BUG-153 (item 1) — the EFFECTIVE rotation, composed with every
   * transform this element's ancestors paint, because `transform` is not an
   * inherited property and a collage rotates the wrapper, not the photograph.
   * Absent when {@link transformUnreadable}.
   */
  transformRotateDeg?: number
  /** REQ-48 (item 1) — effective transform uniform scale (1 when none). Absent when {@link transformUnreadable}. */
  transformScale?: number
  /**
   * BUG-153 (item 1) — set when the element's effective transform chain held a
   * value this projection could not decompose (a skew, or an unparseable
   * spelling), in which case {@link transformRotateDeg} and {@link transformScale}
   * are ABSENT rather than defaulted to the identity.
   *
   * A zero that means "we did not look" must not be comparable to a zero that
   * means "upright": the comparator's both-sides guard skips the pair, and the
   * diff reports the axis as unmeasured so the silence is stated instead of read
   * as agreement.
   */
  transformUnreadable?: true
  /** REQ-48 (item 1) — declared motion: animation / transition / both / null. */
  motion: 'animation' | 'transition' | 'both' | null
}

/** A single visible text run with its exact painted styling. */
export interface RawRun extends RawGeometry {
  role: 'heading' | 'subheading' | 'body' | 'link' | 'action' | 'listitem'
  text: string
  /**
   * REQ-366 — set when this run's text is the GENERATED CONTENT of an empty
   * element's `::before` / `::after` (an icon font's glyph) rather than a text
   * node. Its typography is the pseudo-element's and its box is the element's.
   * Absent on every ordinary run, and on a pre-13 bundle.
   */
  pseudoGlyph?: 'before' | 'after'
  color: string
  /** REQ-35 — true when `color` fell back to the `#000000` sentinel (unresolvable). */
  colorInferred?: boolean
  fontFamily: string
  /** REQ-48 (item 7) — false when the intended named face did not resolve (a fallback rendered). */
  fontLoaded?: boolean
  fontSizePx: number
  fontWeight: number
  // ── REQ-63 typography treatment axes (raw computed; `null` when the no-op default) ──
  /** `font-style` when italic/oblique, else null. */
  fontStyle: string | null
  /** `text-decoration-line` when underline/line-through/overline, else null. */
  textDecoration: string | null
  /** REQ-365 — computed `text-underline-offset` in px when an underline is painted and it is not `auto`, else null. */
  underlineOffsetPx: number | null
  /** `text-transform` when uppercase/lowercase/capitalize, else null. */
  textTransform: string | null
  /** `font-variant`/`font-variant-caps` when small-caps and kin, else null. */
  fontVariant: string | null
  /** `list-style-type` when a marker is painted (disc/decimal/…), else null. */
  listMarker: string | null
  // ── REQ-31 per-element value fields (raw; normalized in sections.ts) ───────
  lineHeightPx: number | null
  letterSpacingPx: number
  /** Raw computed `background-image` when the run paints a text-fill gradient. */
  gradientCss: string | null
  /** Left border width in px (0 when none painted). */
  borderLeftWidthPx: number
  /** Left border colour `#rrggbb` when a left border is painted, else null. */
  borderLeftColor: string | null
  /** REQ-88 — rect of the element painting the accent; null when the run paints its own. */
  accentBox: Box | null
  paddingLeftPx: number
  /** REQ-64 — the other three padding sides (Type-A, authored). Only `paddingLeft`
   *  was captured before, so a wrong card/section top/right/bottom pad was invisible. */
  paddingTopPx: number
  paddingRightPx: number
  paddingBottomPx: number
  /** REQ-64 — computed `text-align`, normalized start→left / end→right. Type-A: a
   *  centred vs left-aligned run was only visible indirectly as a `position` delta. */
  textAlign: 'left' | 'center' | 'right' | 'justify'
  // ── REQ-211 the inline flow this run belongs to ────────────────────────────
  //
  // A `<p>Hello <em>world</em></p>` is TWO text nodes and has always been
  // captured as two runs — so the fold saw two runs where the reference has one
  // sentence, and pinned each at its own absolute box. That is the DOC-52 §2
  // trap on a page rather than in a drawing, and it is worse there: a pair of
  // separately-positioned fragments comes apart at every width the copy reflows
  // at. These four fields are what let the fold put the sentence back together.
  //
  // Recorded whenever a flow holds more than one run, whether or not the fold
  // will act on it — the capture's job is to say what the page IS, and the
  // decision about which flows are worth rejoining belongs downstream, where the
  // fidelity oracle can be made to take the same view (`inline-runs.ts`).
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
  /**
   * REQ-370 — computed `white-space` when it PRESERVES spaces that wrap
   * (`break-spaces` / `pre-wrap`), else null. Under it `text` keeps its edge space.
   */
  whiteSpace?: string | null
  /** REQ-58 (item 3b) — card/panel fill `#rrggbb` behind the run (the nearest
   *  painted ancestor background), null when the run sits on the section band. */
  surfaceFill?: string | null
  /** REQ-62 — raw computed `background-image` of the nearest painting ancestor
   *  when that ancestor's panel/card fill is a gradient (not a text-fill), null
   *  otherwise. Distinct from `surfaceFill` (the composited *solid* the run sits
   *  on): a gradient panel is a `background-image` over a transparent
   *  background-color, so `surfaceFill` composites past it to the band — this
   *  field is the only capture of the gradient itself. Normalized TS-side. */
  surfaceGradientCss?: string | null
  /** REQ-58 (T1) — tight bounds around the rendered text (Range-measured glyph
   *  extent, padding-excluded); null when unmeasurable. */
  renderedTextBox?: { x: number; y: number; width: number; height: number } | null
}

/**
 * REQ-47 — a text-free rendered element (an input box, textarea, select,
 * divider). It carries no text join key, so the diff pairs it on `a11yRole +
 * document order` instead. `accessibleName`/`nameSource` are the a11y tree's
 * projection of *what* labels the control and *where* that label is rendered
 * (`placeholder` = inside the box, `label`/`aria` = outside) — the exact fact
 * that distinguishes placeholder-inside from label-above, which no geometry or
 * text-value field can see.
 */
export interface RawField extends RawGeometry {
  /** Resolved accessible name (may be empty when the control is unlabelled). */
  accessibleName: string
  /** Where the accessible name comes from, or null when unnamed. */
  nameSource: 'placeholder' | 'label' | 'aria' | 'text' | 'alt' | null
  /** REQ-48 (item 4) — computed `object-fit` for a media element (`img`), else null. */
  objectFit?: string | null
  /** REQ-63 — computed `object-position` for a media element (`img`) — how it crops within its box, else null. */
  objectPosition?: string | null
  /** REQ-48 (item 4) — intrinsic (natural) aspect ratio w/h for a media element, else null. */
  intrinsicAspect?: number | null
  /** REQ-92 — a media element's resolved source URL (`currentSrc || src`), else null.
   *  The substance an L1 `image` leaf needs; captured here so it flows through the
   *  manifest to the fold (the flat `RawSignals.images` list never reaches it). */
  src?: string | null
  /** REQ-92 — a media element's `alt` text, else null (the L1 `image` leaf's `alt`). */
  alt?: string | null
  /**
   * REQ-380 — for an inline-SVG icon that is a link's only ink, the SVG's
   * self-contained markup (computed paint written onto each node), which the
   * capture pipeline writes into the bundle as the asset {@link src} names
   * (`assets/inline-svg-<hash>.svg`). Null for every other element. Raw-only:
   * no manifest or `capture.json` field carries it.
   */
  svgMarkup?: string | null
  /** BUG-27 — the element's own painted `background-color` (`#rrggbb`), else null.
   *  A backdrop layers its image over this fill; without it the image reproduces
   *  unshaded. Named to match {@link RawRun.surfaceFill}, which the fold reads. */
  surfaceFill?: string | null
  /**
   * BUG-27 — the absolute URL of the CSS `background-image` this element paints,
   * else null. A background image was only ever read off a BAND root, so a hero
   * or section photograph painted on a nested element (the common shape on a
   * page-builder site) was invisible to the capture entirely. Distinct from
   * {@link src}: it folds to a `box` leaf carrying `axes.backgroundImageUrl`,
   * painted BEHIND content, not to an `image` leaf placed in flow.
   */
  backgroundImageUrl?: string | null
  /**
   * REQ-93 — a form control's authored input type (`email`, `tel`, `textarea`,
   * …), else null. The a11y role flattens every single-line control to `textbox`,
   * so this is the only signal that separates an email box from a phone box —
   * exactly what a mounted `contact-form` needs to reproduce the control.
   */
  controlType?: string | null
  /**
   * REQ-93 — the enclosing `<form>`'s resolved `action`, else null. The endpoint
   * is behavioural, not painted, so it is invisible to every geometry axis; with
   * it a reproduction submits where the reference does, and without it the
   * derivation records the gap rather than inventing one.
   */
  formAction?: string | null
  /**
   * REQ-275 — the control's SUBMISSION KEY (its `name` attribute), else null.
   *
   * `controlType` and `formAction` above were REQ-93's half of the submission
   * contract; `1c capture audit` found the rest of it unrecorded. Without this
   * the fold slugifies the visible label to invent a key, which reads perfectly
   * and posts `your-email` where the reference's handler expects `email`. No
   * pixel gate can see the difference.
   */
  controlName?: string | null
  /**
   * REQ-275 — the enclosing `<form>`'s verb (`GET`/`POST`), else null. A form
   * whose handler expects a POST and receives a GET puts every answer in the URL
   * and loses the submission.
   */
  formMethod?: string | null
  /**
   * REQ-275 — whether the browser itself refuses to submit without this field
   * (the `required` attribute or its `aria-required` mirror), else null. A
   * required field reproduced optional is a behavioural defect with no painted
   * trace at all.
   */
  required?: boolean | null
  /**
   * REQ-265 — the RENDERED colour of the control's placeholder ink (`#rrggbb`),
   * else null.
   *
   * A placeholder is painted by a UA pseudo-element that inherits nothing, so no
   * axis on the element itself describes it and no geometry field can see it: a
   * reference that leaves the browser default in place and a reproduction that
   * re-points it at the field's own colour agree on every captured value and
   * differ by the whole of the placeholder's ink. Measured on gigabytealchemy.ai
   * as `#746f69` against `#000000` — four controls, 17% of that reproduction's
   * ranked pixel residual, and invisible to `values-diff` entirely.
   *
   * Composited the way {@link RawRun.surfaceFill} is: the UA default is a
   * half-alpha ink, so the declared value alone is not what the eye sees. Null
   * for a control with no placeholder, and for every non-control element.
   */
  placeholderColor?: string | null
  /**
   * REQ-269 — the element's own per-side padding, exactly as {@link RawRun}
   * records it for a text run.
   *
   * A text-free element was captured with no padding at all, which for a form
   * control is the whole inset its content sits in: the renderer's UA reset
   * pushes `padding: 0` into every control's base rule (the zero-look baseline)
   * and there was no axis to win against it, so every reproduced placeholder
   * painted hard against its field's left edge. Measured on gigabytealchemy.ai
   * as 16px horizontal / 12px vertical lost on four controls — 75% of that
   * reproduction's ranked pixel residual, and invisible to `values-diff`, which
   * compares no padding on a control so the two sides agreed by construction.
   */
  paddingTopPx?: number
  paddingRightPx?: number
  paddingBottomPx?: number
  paddingLeftPx?: number
  /**
   * REQ-308 — the type a form control paints with: the `::placeholder`
   * pseudo-element's own computed `font-family` / `font-size` / `font-weight` /
   * `line-height` when the control has a placeholder, else the control's own
   * (which is what its typed text paints with). Absent for every text-free
   * element that is not a form control — an `<img>`, an `<hr>`, a painted
   * backdrop box — which have no type to describe.
   *
   * A placeholder-only control has no text run, so it went down the text-FREE
   * path, which recorded no typography at all: `fontSizePx: 0`, `fontFamily: ""`
   * and no `lineHeightPx` key, on BOTH sides of every diff. The fold therefore
   * had nothing to write onto the control's L1 axes, the renderer's `font:
   * inherit` reset governed, and a textarea whose reference line-height is 24px
   * painted its placeholder against a `normal` line box three pixels higher.
   * Measured on gigabytealchemy.ai as 159.48 of that round's 159.48 ranked
   * region score — 100% of it — beside ZERO value deltas, because the field pass
   * compared no typography either.
   *
   * `lineHeightPx` is `null` for `line-height: normal`, whose used value is a
   * font metric no computed style exposes — recorded exactly as a text run
   * records it, and read by the comparator as the measurement it is.
   */
  fontFamily?: string
  fontSizePx?: number
  fontWeight?: number
  lineHeightPx?: number | null
}

/** A top-level style-scope band candidate (DOC-13 §2.7). */
export interface RawBand {
  box: { x: number; y: number; width: number; height: number }
  /**
   * REQ-271 — the band's OWN painted background colour, or `null` when the band
   * paints no fill at all (a transparent `<header>` over a hero). Never the
   * body's colour standing in for a missing one: the fabricated value was
   * indistinguishable from a measured one all the way into the bundle.
   */
  backgroundColor: string | null
  backgroundImage: string
  colorScheme: 'light' | 'dark'
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  paddingTopPx: number
  paddingBottomPx: number
  // ── REQ-31 section-level value fields ─────────────────────────────────────
  /**
   * Full-bleed translucent overlay painted over the band (a hero scrim), else null.
   *
   * REQ-338 (issue 5) — `opacity` is the veil's EFFECTIVE alpha: the colour's own
   * alpha times the element's `opacity` property, because a page-builder overlay
   * child routinely splits the two (`#141E14BA` at `opacity: .92`) and either half
   * alone is not what paints. `blendMode` is its `mix-blend-mode`, absent when it
   * composites normally.
   */
  overlay: { color: string; opacity: number; blendMode?: string } | null
  /**
   * BUG-174 — the band's own paint, read off the element that paints its imagery
   * or its fill (see `bandPaintOf`). Optional only so a stored pre-BUG-174
   * extraction still parses; the extractor writes it on every band.
   */
  paint?: BandPaint
  /**
   * REQ-352 — a band records the runs it carries and its own box, and NOTHING
   * about where its content sits: the content anchor is derived from both in
   * `anchor.ts`, once, for both sides of the fidelity diff. It used to be
   * measured here, two different ways depending on which code path built the
   * band — see that module for what that cost.
   */
  content: RawRun[]
  items: RawRun[][]
  /**
   * REQ-302 — the index within {@link content} each {@link items} row belongs
   * at, so a projection can put the repeated rows back where the DOM had them.
   *
   * Parallel to `items`. Absent on the geometric-slice path, where the question
   * has no answer (see the comment at that call site) and on any bundle written
   * before REQ-302 — in both cases a reader appends, which is what every reader
   * did before the anchor existed.
   */
  itemsAt?: number[]
  /** REQ-47 — text-free rendered elements (form controls, dividers) in this band. */
  fields: RawField[]
}

export interface RawImage {
  src: string
  width: number
  height: number
  alt: string
  role: string
}

export interface RawFontFace {
  family: string
  srcUrls: string[]
  weight: number | null
  /**
   * REQ-332 — the upper bound of a VARIABLE face's `font-weight: 200 800`
   * descriptor; `null` for a single-weight face (and for a bundle captured before
   * this was read). The pair is one fact about one file, so it travels with the
   * face rather than being aggregated into the family's painted-weight set.
   */
  weightMax?: number | null
  /**
   * REQ-332 — the face's `font-style` descriptor, `oblique` normalised to
   * `italic`. `null` where the rule declares none (CSS defaults it to `normal`,
   * but "the rule said nothing" and "the rule said normal" are different facts
   * and the fold is entitled to tell them apart). Unread before this, so a
   * family's italic file was declared as a second normal face beside the real
   * one and only one of them could ever win.
   */
  style?: 'normal' | 'italic' | null
}

export interface RawSignals {
  viewport: { width: number; height: number }
  bands: RawBand[]
  colorUsage: { hex: string; usage: 'text' | 'background'; freq: number }[]
  fontFaces: RawFontFace[]
  typeScale: number[]
  spacingScalePx: number[]
  containerMaxWidthPx: number | null
  images: RawImage[]
  /** BUG-27 — the page's own base fill (`<body>`'s painted background colour). What
   *  shows through wherever no band paints; captured all along but never carried. */
  bodyBackground: string
  /**
   * REQ-166 — the page's own `<title>`, trimmed; `''` when it has none.
   *
   * WHAT THE VISITOR SAW IN THEIR TAB, and the one name for a captured site that
   * nobody had to invent. It is read here rather than parsed out of
   * `rendered.html` later because re-extraction reads `capture.json` FIRST and
   * would never see a title that lived only in the HTML — two paths that
   * disagreed about what a site is called is precisely the drift this avoids.
   */
  title: string
  /**
   * REQ-377 — `window.scrollY` at the moment of measurement. See
   * {@link Capture.scrollY}: anything but 0 means every sticky / fixed box in
   * this read is displaced by this much. Optional for a fake driver's signals.
   */
  scrollY?: number
}

export const EXTRACT_SCRIPT = `(() => {
  var DOC = document.documentElement;
  var docW = DOC.scrollWidth, docH = DOC.scrollHeight;
  // BUG-151 -- the LAYOUT VIEWPORT width, which is what "full-bleed" means.
  //
  // docW is a SCROLL width, and the two answer different questions. Bounding the
  // visible region (onScreenBox) and clamping a painted extent want the scroll
  // box: content at x=1400 on a 1699px-wide document really is on the page.
  // Deciding "does this box span the page" does NOT -- a band is full-bleed when
  // it spans the viewport, not when it spans whatever the widest overflowing
  // descendant dragged the scroll box out to.
  //
  // Measured on a reproduction whose testimonial carousel lays two slides
  // off-stage: docW came back 1699.75 at a 1280px viewport, every 1280-wide band
  // failed the x + width >= docW - 1 test, and all eleven were dropped --
  // bandSlicesIn returned [] (so overlay / contentAnchor / textAlign read
  // UNMEASURED, the standing blind spot REQ-269 exists to remove, standing again
  // by another route) and fieldsUnder lost nine records the served CSS
  // demonstrably paints. The REFERENCE never tripped it, because its .swiper
  // CLIPS the same two slides, so the two sides were being segmented by
  // procedures that differed because of a property of OUR OWN RENDER -- an
  // asymmetric measurement dressed as a reproduction defect.
  //
  // clientWidth rather than innerWidth: innerWidth includes the scrollbar
  // gutter and a width:100% band does not, so an innerWidth rule would drop
  // every band on a platform with a classic scrollbar. The docW fallback keeps
  // the pre-fix answer wherever clientWidth is unavailable (jsdom reports 0),
  // and on a page that does not overflow sideways the two are equal anyway, so
  // no conventionally-laid-out document changes verdict.
  var layoutW = DOC.clientWidth || docW;

  // REQ-52: resolve ANY browser-understood CSS colour (rgb/rgba/hsl/named and
  // modern oklch/lab/lch/color()) to #rrggbb. getComputedStyle on a Tailwind v4
  // site returns oklch(...) for text/borders; the old rgb()-only regex could not
  // parse it, so every such run fell back to an inferred #000000. Painting the
  // colour onto a 1x1 canvas and reading the pixel converts whatever the browser
  // accepts into real sRGB bytes. A two-sentinel probe preserves the previous
  // "unparseable → null" contract, and a zero alpha still returns null (unpainted
  // / fully transparent, e.g. background-clip:text fills). Where no 2d canvas is
  // available (e.g. the jsdom-based unit tests), fall back to the legacy
  // rgb()/rgba() regex parse so those environments still resolve plain colours.
  function h2(n) { return ('0' + Math.round(n).toString(16)).slice(-2); }
  var __colorCtx, __colorCtxTried = false;
  function colorCtx() {
    if (!__colorCtxTried) {
      __colorCtxTried = true;
      try {
        var cv = document.createElement('canvas');
        cv.width = cv.height = 1;
        __colorCtx = cv.getContext('2d', { willReadFrequently: true }) || null;
      } catch (e) { __colorCtx = null; }
    }
    return __colorCtx;
  }
  // BUG-24 — exact-parse the canvas *serialization* of a colour, or null. The 2d
  // fillStyle getter round-trips losslessly ('#rrggbb' when opaque, 'rgba(r, g, b, a)'
  // otherwise). The pixel probe below cannot: painting a TRANSLUCENT fill stores
  // premultiplied bytes, and getImageData's unpremultiply loses up to a level per
  // channel (rgba(2,6,23,.45) reads back as #020716). Opaque colours are exact
  // either way. Serializations we cannot read (wide-gamut 'color(srgb …)',
  // 'oklch(…)') return null and fall through to the probe, so this only ever adds
  // precision — it never narrows what resolves.
  function parseSerializedColor(ser) {
    if (!ser || typeof ser !== 'string') return null;
    if (ser.charAt(0) === '#') {
      if (ser.length !== 7 && ser.length !== 9) return null;
      return [
        parseInt(ser.slice(1, 3), 16),
        parseInt(ser.slice(3, 5), 16),
        parseInt(ser.slice(5, 7), 16),
        ser.length === 9 ? parseInt(ser.slice(7, 9), 16) / 255 : 1,
      ];
    }
    var sm = ser.match(/^rgba?\\(([^)]+)\\)$/);
    if (!sm) return null;
    var sp = sm[1].split(/[,\\s\\/]+/).filter(function (s) { return s !== ''; }).map(parseFloat);
    if (sp.length < 3) return null;
    for (var si = 0; si < sp.length; si++) if (isNaN(sp[si])) return null;
    return [sp[0], sp[1], sp[2], sp.length >= 4 ? sp[3] : 1];
  }
  // Parse ANY browser-understood colour to [r,g,b,a] (a in 0..1), or null when
  // unparseable. Alpha is PRESERVED here (unlike rgbToHex) so a translucent fill
  // can be composited over what it sits on (REQ-58 capture accuracy).
  function rgbaOf(str) {
    if (!str) return null;
    var ctx = colorCtx();
    if (ctx) {
      try {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = str;
        var probe = ctx.fillStyle;
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = str;
        if (ctx.fillStyle !== probe) return null; // str is not a valid colour
        // Prefer the lossless serialization; the pixel probe is the fallback.
        var exact = parseSerializedColor(probe);
        if (exact) return exact;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = str;
        ctx.fillRect(0, 0, 1, 1);
        var d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
      } catch (e) { /* fall through to the regex path below */ }
    }
    var m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var p = m[1].split(',').map(function (s) { return parseFloat(s.trim()); });
    return [p[0] || 0, p[1] || 0, p[2] || 0, p.length >= 4 ? p[3] : 1];
  }
  // #rrggbb for a painted colour, or null when fully transparent (unpainted, e.g.
  // a background-clip:text fill). Alpha is intentionally dropped: callers that
  // care about translucency use rgbaOf + composite() instead.
  //
  // REQ-336 — that is the right contract for a colour the capture has already
  // resolved against what sits behind it (a band fill, a palette sample), and the
  // wrong one for a colour the browser composites at paint time. The border, the
  // outline and the run colour moved to rgbToHexA below for exactly that reason;
  // what is left here is the composited family.
  function rgbToHex(str) {
    var c = rgbaOf(str);
    if (!c || c[3] === 0) return null;
    return '#' + h2(c[0]) + h2(c[1]) + h2(c[2]);
  }
  // REQ-336 — the same read with its ALPHA KEPT: '#rrggbb' when the colour is
  // opaque, '#rrggbbaa' when it is not. rgbToHex's contract above is right for a
  // colour the capture has already composited against what is behind it (a band
  // fill, a palette sample) and wrong for one the BROWSER composites itself: a
  // ring authored rgba(255,255,255,.3) and a paragraph authored #ffffffe6 were
  // both recorded #ffffff, so a 30%-white 4px ring around a photograph reproduced
  // as solid white and the comparison could not disagree — both sides were
  // flattened by the same read, which is worth zero deltas and a visible
  // difference.
  //
  // An opaque colour is written in SIX digits, not eight, so every value this
  // already recorded stays byte-identical and no bundle needs re-capturing to
  // keep comparing clean: this only adds digits where there were digits to add.
  // (colorToHexAlpha on the TS side spells it the same way, for the same reason —
  // two spellings of one value is drift.)
  function rgbToHexA(str) {
    var c = rgbaOf(str);
    if (!c || c[3] === 0) return null;
    var hex = '#' + h2(c[0]) + h2(c[1]) + h2(c[2]);
    var a = Math.round(c[3] * 255);
    return a >= 255 ? hex : hex + h2(a);
  }
  // REQ-72 — resolve a gradient's colour tokens to #rrggbb so normalizeGradient can
  // parse the stops. A gradient authored with Tailwind classes computes to a modern
  // colour space (oklch/oklab/color()) the TS-side stop regex can't read; a probe
  // element + getComputedStyle resolves ANY format the browser understands to rgb,
  // which rgbToHex then hexes. Positions/keywords/direction are left untouched.
  function hexifyGradient(css) {
    if (!css || !/gradient\\(/.test(css)) return css;
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    var out = css.replace(/(oklab|oklch|lab|lch|hwb|color|rgba?|hsla?)\\([^()]*\\)|#[0-9a-fA-F]{3,8}/g, function (tok) {
      probe.style.color = 'rgba(0,0,0,0)';
      probe.style.color = tok;
      var hex = rgbToHex(getComputedStyle(probe).color);
      return hex || tok;
    });
    probe.remove();
    return out;
  }
  // Porter-Duff 'source over': src painted on top of dst, each [r,g,b,a].
  function composite(src, dst) {
    var sa = src[3], da = dst[3];
    var oa = sa + da * (1 - sa);
    if (oa <= 0) return [0, 0, 0, 0];
    return [
      (src[0] * sa + dst[0] * da * (1 - sa)) / oa,
      (src[1] * sa + dst[1] * da * (1 - sa)) / oa,
      (src[2] * sa + dst[2] * da * (1 - sa)) / oa,
      oa,
    ];
  }
  function luminance(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function primaryFamily(ff) {
    return (ff || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  }
  // BUG-16 -- the run's font-family must round-trip as the FULL stack, not just
  // its first token. Truncating to the primary family drops every fallback. An
  // unmatched family name is still VALID CSS -- it simply resolves to no font --
  // so a reproduction that emits the lone first token has nothing left to fall
  // back to and silently paints the document default (serif). Tailwind's
  // ui-sans-serif stack is the common case: the first token resolves only where
  // the engine implements that generic, and the rest of the stack is what makes
  // it robust. Keep the stack CSS-faithful (per L1, DOC-23) and derive the
  // primary only where a single NAME is required (face load-check, @font-face).
  function familyStack(ff) {
    return (ff || '')
      .split(',')
      .map(function (t) { return t.trim().replace(/^['"]|['"]$/g, ''); })
      .filter(Boolean)
      .join(', ');
  }
  // REQ-48 (item 7) -- did the intended named face actually resolve, or is the
  // browser painting a fallback with different metrics? Generic keywords need no
  // load (always true). A named face is checked against the loaded FontFaceSet;
  // when the API is missing we assume loaded rather than cry false-positive.
  function fontLoadedOf(s, family, text) {
    if (!family) return true;
    var generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-|inherit|initial|unset|-apple-system|blinkmacsystemfont)/i;
    if (generic.test(family)) return true;
    try {
      if (!(document.fonts && document.fonts.check)) return true;
      // BUG-16 — build the FULL font shorthand (style + real weight + size), not a
      // bare '<size> "family"' that implies weight 400/normal, so the check probes
      // the ACTUAL painted face. Pass the run's own text so a subsetted webfont
      // (Google Fonts unicode-range) is judged only on the glyphs it renders.
      var style = s.fontStyle && s.fontStyle !== 'normal' ? s.fontStyle + ' ' : '';
      var weight = parseInt(s.fontWeight, 10) || 400;
      var shorthand = style + weight + ' ' + s.fontSize + ' "' + family + '"';
      return text ? document.fonts.check(shorthand, text) : document.fonts.check(shorthand);
    } catch (e) {
      return true;
    }
  }
  // BUG-27 -- visibility is TWO independent facts, and a band needs them apart.
  // (a) the style chain paints at all (display/visibility/opacity), and (b) this
  // particular box lands on the page. A collapsed-but-painting header fails (b)
  // on its OWN box while its children pass both, so paintedExtent asks for (a) on
  // the root and (a)+(b) per descendant. visible() is unchanged: it is both.
  function styleVisible(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      var s = getComputedStyle(node);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
      node = node.parentElement;
    }
    return true;
  }
  function onScreenBox(b) {
    if (!b || b.width <= 0 || b.height <= 0) return false;
    if (b.x + b.width <= 0 || b.y + b.height <= 0) return false; // off-screen up/left
    if (b.x >= docW || b.y >= docH) return false;                // off-screen down/right
    return true;
  }
  function visible(el) {
    return styleVisible(el) && onScreenBox(absBox(el));
  }
  // REQ-96 -- a behavior module's INVARIANT elements: presentation fixed by an
  // obligation rather than by taste (a honeypot that must stay invisible, a
  // programmatic label that must stay out of flow, the Turnstile mount). They
  // exist only on OUR side of a reproduction, so pairing against them slides the
  // whole control queue and every field mispairs against its neighbour -- 15
  // repro-only objects turned all 26 reported deltas on gigabytealchemy
  // unreadable. The module marks them; the capture skips them and their subtrees.
  function moduleInvariant(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      if (node.hasAttribute && node.hasAttribute('data-fc-invariant')) return true;
      node = node.parentElement;
    }
    return false;
  }
  function absBox(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  }
  // REQ-332 -- the nearest ancestor that CUTS THIS ELEMENT OFF, and where its
  // edge is.
  //
  // A carousel lays its slides out either side of the visible one and relies on
  // \`overflow: hidden\` to cut them off, so the off-screen slides never reach the
  // document's scroll box. Nothing upstream recorded that: 'overflow' occurred
  // zero times in a 194KB capture.json, and neither RawRun nor RawField had a
  // property for it -- so a reproduction placed the slides at the same
  // coordinates (both sides agree exactly) and then grew 420px wider than the
  // reference, because nothing told it where the page stopped.
  //
  // SELF COUNTS. The clipper may be the element being recorded (a panel that
  // clips its own children), and the fold needs the box either way.
  //
  // THE ID IS THE ANCESTOR'S PLACE IN THE DOCUMENT, so two runs cut off by the
  // same ancestor say so -- which is how the fold knows they belong inside one
  // clipping container rather than two.
  //
  // REQ-338 (issue 8) -- IT WAS A SEQUENCE NUMBER, AND A SEQUENCE NUMBER IS NOT AN
  // IDENTITY ACROSS PROJECTIONS. The counter was assigned on first sight, per page
  // evaluation, so it numbered the clipping ancestors in the order this viewport
  // happened to reach them. A phone shows one testimonial slide where a desktop
  // shows three, so the numbering SHIFTED between widths of the same document:
  // \`id: 5\` was a photograph's own rounded crop at 320px and a slide 1400px away
  // at 1280px. The fold reads one width's id and another width's box, so the
  // photograph was grouped into the carousel and rebased to \`(-332, -1424)\`
  // inside a 713x332 clipping container -- erased completely, and reported present
  // by every coverage proxy, because the document still references its asset.
  //
  // A path is stable by construction: the DOM is the same tree at every viewport.
  function nodePathOf(el) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node.parentElement) {
      var i = 0;
      var k = node.parentElement.firstElementChild;
      while (k && k !== node) { i++; k = k.nextElementSibling; }
      parts.push(i);
      node = node.parentElement;
    }
    return parts.reverse().join('.');
  }
  // REQ-377 -- the nearest ancestor (or self) the page PINS TO THE VIEWPORT.
  //
  // A sticky header is in the same place at scroll 0 as one that scrolls away,
  // so no box and no screenshot tells them apart -- and on hearingzone510.com the
  // header that follows the reader down a 5650px page was reproduced as one that
  // leaves at the first scroll, at no cost in any measurement. The id is
  // nodePathOf's, for clipOf's reason: everything one ancestor pins belongs in
  // one pinned node, and only a path says which ancestor that is at every width.
  //
  // topPx is where it holds: the computed top for a sticky box (a sticky box with
  // top:auto holds nowhere, so it is not reported), the box's own viewport top
  // for a fixed one. Both read at scroll 0, which the settle now guarantees.
  function stickyOf(el) {
    var node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var cs = getComputedStyle(node);
      if (cs.position === 'sticky' || cs.position === 'fixed') {
        var r = node.getBoundingClientRect();
        var top = parseFloat(cs.top);
        if (cs.position === 'sticky' && isNaN(top)) return null;
        var b = absBox(node);
        return {
          id: nodePathOf(node),
          x: b.x, y: b.y, width: b.width, height: b.height,
          topPx: cs.position === 'fixed' ? r.top : top,
        };
      }
      node = node.parentElement;
    }
    return null;
  }
  //
  // REQ-381 -- THE ONE THAT CUTS, NOT MERELY THE NEAREST. Elementor/Swiper put
  // \`overflow: hidden\` on every slide AND on the \`.swiper\` around them, so the
  // nearest clipper of a slide's copy was always its own slide: one id per slide,
  // each box wholly containing its copy, and the fold rightly concluded nothing
  // escapes anything -- while the \`.swiper\` that does cut the off-screen slides
  // was never recorded on them (joyfulculinarycreations.com: 70 layout findings,
  // the whole structural-failure verdict with issue 2). So an overflow box that
  // wholly contains the element, on every axis it clips, is passed over; the
  // first one the element escapes is recorded. When none cuts, the nearest is
  // still the answer, so content that fits reads exactly as it did. An element
  // with no area is not tested -- a 0x0 box at the origin escapes everything.
  function clipOf(el) {
    var own = absBox(el);
    var sized = own.width > 0 && own.height > 0;
    var nearest = null;
    var node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var cs = getComputedStyle(node);
      var ox = cs.overflowX || 'visible';
      var oy = cs.overflowY || 'visible';
      if (ox !== 'visible' || oy !== 'visible') {
        var b = absBox(node);
        var rec = { id: nodePathOf(node), x: b.x, y: b.y, width: b.width, height: b.height };
        if (!sized) return rec;
        if (!nearest) nearest = rec;
        var cutsX = ox !== 'visible' && (own.x < b.x - 1 || own.x + own.width > b.x + b.width + 1);
        var cutsY = oy !== 'visible' && (own.y < b.y - 1 || own.y + own.height > b.y + b.height + 1);
        if (cutsX || cutsY) return rec;
      }
      node = node.parentElement;
    }
    return nearest;
  }
  // REQ-265 -- an inline element's rect is its CONTENT AREA, not its line box.
  //
  // \`getBoundingClientRect()\` on a non-replaced INLINE box returns the union of
  // its fragments' border boxes, and a fragment's height is the font's
  // ascent+descent at that size -- NOT \`line-height\`. On a block it returns the
  // border box, whose top IS the top of the first line box. So a run's \`box\`
  // meant two different things depending on a layout mode nothing downstream
  // could see, and the difference is exactly the half-leading CSS uses to centre
  // the content area inside the line box: \`(lineHeight - contentHeight) / 2\`.
  //
  // Measured on gigabytealchemy.ai: the wordmark \`<span>\` reported
  // \`y=79, height=97\` against \`line-height: 90\`, so a fold that transcribed 79 as
  // a line-box top placed the glyphs 3.5px HIGH -- 82% of that reproduction's
  // ranked pixel residual, plus its only HIGH \`gap\` delta (the 7px of 97 vs 90).
  //
  // The line box is what every downstream consumer means by "where this run
  // sits": the fold pins it as the L1 leaf's \`y\`, and the values-diff measures
  // \`position\` and the inter-row \`gap\` from it. So the conversion happens ONCE,
  // here, where the computed style that resolves it is already in hand -- rather
  // than being re-derived by each consumer from a rect whose meaning it would
  // first have to infer. The content area is not lost: it is \`renderedTextBox\`,
  // which for these runs is the rect this replaces.
  //
  // Returns null -- leaving today's rect untouched -- for anything that is not an
  // inline box, and for \`line-height: normal\`, whose used value is a font metric
  // no computed style exposes. Both sides of a diff read the same rule, so an
  // uncorrected run is uncorrected symmetrically.
  function lineBoxOf(el, s, pitch) {
    if (s.display !== 'inline') return null;
    // REQ-338 (issue 7) -- the MEASURED line-box pitch when the run has one,
    // because the half-leading this computes is half of the line box and a run's
    // own computed \`line-height\` is not always that box (see linePitchOf). The
    // two are the same quantity, so reading them from two different places would
    // put the glyphs and the pitch they are spaced by into disagreement.
    var lh = (pitch !== null && pitch !== undefined) ? pitch : parseFloat(s.lineHeight);
    if (isNaN(lh) || !(lh > 0)) return null;
    var rects = el.getClientRects();
    if (!rects.length) return null;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0) || !(r.height > 0)) return null;
    // A fragment's rect is its BORDER box, so the element's own vertical padding
    // and border come off before what is left can be called a content area.
    var inset = (parseFloat(s.paddingTop) || 0) + (parseFloat(s.borderTopWidth) || 0);
    var contentH = rects[0].height - inset - ((parseFloat(s.paddingBottom) || 0) + (parseFloat(s.borderBottomWidth) || 0));
    if (!(contentH > 0)) return null;
    var half = (lh - contentH) / 2;
    return {
      x: r.left + window.scrollX,
      y: r.top + window.scrollY + inset - half,
      width: r.width,
      // One line box per fragment. The rect spans first-fragment top to
      // last-fragment bottom, so a wrapped inline run's line boxes span n * lh.
      height: rects.length * lh
    };
  }
  function unionBoxes(a, b) {
    if (!a) return b;
    if (!b) return a;
    var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return {
      x: x, y: y,
      width: Math.max(a.x + a.width, b.x + b.width) - x,
      height: Math.max(a.y + a.height, b.y + b.height) - y
    };
  }
  // BUG-27 -- a band's box is the painted extent of its SUBTREE, not its own
  // in-flow border box.
  //
  // The top-level band scan qualified a candidate on its OWN rect being >=8px
  // tall. A header whose children are absolutely positioned (Elementor, and any
  // overlay/sticky nav) has an in-flow height of ZERO while painting a full nav
  // bar beneath it -- so the whole subtree, logo and links included, was dropped
  // before runsUnder / fieldsUnder ever saw it. Nothing downstream could recover
  // it: the content simply did not exist in the capture.
  //
  // BUG-15 patched the all-collapse case (an L1 flat DOM) with a body-spanning
  // fallback; this is the same failure when only SOME children collapse, where
  // that fallback never fires. Measuring the subtree's painted extent is the
  // general answer and leaves a conventionally-laid-out band unchanged (its
  // children are inside its own box, so the union IS its own box).
  function paintedExtent(el) {
    if (!styleVisible(el)) return null;
    var own = absBox(el);
    var acc = onScreenBox(own) ? own : null;
    var desc = el.getElementsByTagName('*');
    for (var i = 0; i < desc.length; i++) {
      var d = desc[i];
      var tag = d.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'META') continue;
      var b = absBox(d);
      if (!onScreenBox(b)) continue; // cheap reject before the ancestor style walk
      if (!styleVisible(d)) continue;
      acc = unionBoxes(acc, b);
    }
    // A subtree that paints nothing ON the page contributes no band. This is what
    // drops a hidden off-screen block (the left:-33554430px SEO-spam trick) whose
    // own box the pre-BUG-27 scan never looked past.
    if (!onScreenBox(acc)) return null;
    // Clamp to the document's painted canvas. A descendant's border box can extend
    // past what it actually paints when an ancestor clips it (a carousel's
    // off-stage slides under overflow:hidden), and an unclamped union would hand
    // the band a box hundreds of px wider than the page. scrollWidth/scrollHeight
    // are exactly the right bound: overflow that really extends the page grows
    // them, overflow that is clipped does not.
    var x0 = Math.max(0, acc.x), y0 = Math.max(0, acc.y);
    var x1 = Math.min(docW, acc.x + acc.width), y1 = Math.min(docH, acc.y + acc.height);
    return { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
  }
  // BUG-27 -- the page's painted BACKDROPS, in document order.
  //
  // A backdrop is what a band paints behind its content: a background image, or a
  // full-bleed background colour. Both were only ever read off a TOP-LEVEL band
  // root, so on a page-builder site -- where the whole page is one wrapper and the
  // visually distinct panels are nested <section>s -- neither was captured at all.
  // The hero photograph simply did not exist in the manifest, and each panel's
  // fill had to be INFERRED downstream from the surfaces its runs sit on: a guess
  // that reads the page correctly only when the largest painted surface is the
  // page itself. This index is that missing fact, measured rather than inferred.
  //
  // Full-bleed is the band test, and full-bleed means TOUCHING BOTH DOCUMENT EDGES
  // -- not merely being wide. A fraction-of-width test is unstable across the
  // viewport ladder: a 720px content card is 50% of a 1440px document and 94% of a
  // 768px one, so it would be captured as a band at the narrow rungs only, and the
  // fold would then materialise it at its widest geometry. Edge-touching is the
  // property a band actually has, and it holds at every width.
  // An image needs no width test -- a painted photograph is a backdrop at any size.
  //
  // Indexed once for the whole document (the per-element getComputedStyle sweep is
  // the same cost paintedSurfaces already pays) and filtered per band by
  // containment. data: payloads are skipped: they are widget chrome (select arrows,
  // Elementor's inline SVG icons), never a mirrored asset, and folding them would
  // bury the page's real imagery in sprite noise.
  var BACKDROP_MIN_HEIGHT = 8;
  var BACKDROP_EDGE_TOL = 1;
  var BG_IMAGE_INDEX = null;
  function firstPaintedUrl(css) {
    if (!css || css === 'none') return null;
    var re = /url\\((['"]?)([^'")]+)\\1\\)/g, m;
    while ((m = re.exec(css))) {
      var raw = m[2].trim();
      if (/^(data|about|blob):/i.test(raw)) continue;
      try { return new URL(raw, location.href).href; } catch (e) { continue; }
    }
    return null;
  }
  function backdropBoxes() {
    if (BG_IMAGE_INDEX) return BG_IMAGE_INDEX;
    BG_IMAGE_INDEX = [];
    var all = document.body ? document.body.querySelectorAll('*') : [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var cs = getComputedStyle(el);
      var url = firstPaintedUrl(cs.backgroundImage);
      var rgba = rgbaOf(cs.backgroundColor);
      var fill = (rgba && rgba[3] > 0) ? rgba : null;
      if (!url && !fill) continue;
      var b = absBox(el);
      if (b.height < BACKDROP_MIN_HEIGHT) continue;
      if (!url) {
        // A colour-only box qualifies as a backdrop only when it is full-bleed.
        if (!(b.x <= BACKDROP_EDGE_TOL && b.x + b.width >= layoutW - BACKDROP_EDGE_TOL)) continue;
        // ...and only when it is OPAQUE. A translucent full-bleed fill is a scrim
        // (the veil darkening a hero so text reads over it), and the capture already
        // has a truer representation of one: overlayOf finds it at any depth and
        // records it as the band's overlay, which the fold layers ABOVE the image
        // it veils. Indexing it here as well would paint it twice -- and, since a
        // fill's alpha lives in the colour rather than in the opacity property, the copy
        // would land opaque and black out the photograph underneath.
        if (fill[3] < 0.999) continue;
      }
      if (!visible(el)) continue;
      BG_IMAGE_INDEX.push({ el: el, url: url });
    }
    return BG_IMAGE_INDEX;
  }
  // REQ-88 / BUG-19 / BUG-20 -- the SURFACE CHAIN behind a run.
  //
  // "What is painted behind this text?" was answered by walking parentElement.
  // That is a proxy that only holds when the painting box is a DOM *ancestor*.
  // An L1 reproduction paints its bands and cards as absolutely-positioned
  // SIBLINGS of the text, so the ancestor walk skips every card and lands on the
  // body backstop -- reporting the page fill for all 37 runs and no accent bar at
  // all, while the pixels were in fact correct. The diff then scored ~60 phantom
  // defects and hid the real ones.
  //
  // The truthful definition is geometric: the painted boxes that CONTAIN the run,
  // tightest first. That answer is identical on a conventionally-nested page (an
  // ancestor contains its descendant), so the reference side is unchanged, while a
  // sibling-painted reproduction now measures what it actually renders. DOM
  // ancestors are unioned in because containment is not guaranteed (negative
  // margins, overflow) and an ancestor paints behind its child regardless.
  var SURFACE_INDEX = null;
  // REQ-377 (issue 4) -- an indexed inline-SVG panel -> its opaque #rrggbb fill.
  var PANEL_FILLS = new Map();
  /** The fill an inline-SVG panel paints, or null for any other surface. */
  function panelFillOfSurface(node) {
    return PANEL_FILLS.get(node) || null;
  }
  function paintedSurfaces() {
    if (SURFACE_INDEX) return SURFACE_INDEX;
    SURFACE_INDEX = [];
    var all = document.body ? document.body.querySelectorAll('*') : [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var cs = getComputedStyle(el);
      var fill = rgbaOf(cs.backgroundColor);
      var blw = Math.round(parseFloat(cs.borderLeftWidth)) || 0;
      var hasBar = blw > 0 && cs.borderLeftStyle && cs.borderLeftStyle !== 'none';
      // A gradient panel paints a background-IMAGE over a transparent
      // background-color. It must be indexed too, or the tightest-first order is
      // wrong: the opaque band BEHIND the panel would be reached first and
      // surfaceGradientOf would stop there, losing the panel's gradient (REQ-62).
      var img = cs.backgroundImage || 'none';
      var hasImage = img !== 'none' && img !== '';
      // REQ-377 (issue 4) -- an inline-SVG PANEL paints a surface too. REQ-370
      // records one as a field (svgPanelFillOf), and the run surface walk went on
      // walking past it to the band behind: six testimonial runs on
      // hearingzone510.com recorded the band's #d6d6d6 as the surface they sit on,
      // while the page paints them on the panel's #224e7a. Indexed with its fill,
      // so surfaceFillOf / surfaceOf can stop at it (see panelFillOfSurface).
      var panel = el.localName === 'svg' ? svgPanelFillOf(el) : null;
      if ((!fill || fill[3] <= 0) && !hasBar && !hasImage && !panel) continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var b = absBox(el);
      if (b.width <= 0 || b.height <= 0) continue;
      if (panel) PANEL_FILLS.set(el, panel);
      SURFACE_INDEX.push({ el: el, box: b, area: b.width * b.height, order: i });
    }
    // BUG-179 (item 3) -- an area TIE is broken by PAINT ORDER, topmost first.
    // querySelectorAll is document order, so a higher index is a descendant or a
    // later sibling: the box painted ON TOP. A stable area-only sort kept DOM
    // order instead, so a parent band that exactly coincides with the veiled
    // backdrop painted over it came first, and surfaceFillOf stopped at the
    // parent's opaque white without ever reaching the veil the eye sees.
    SURFACE_INDEX.sort(function (a, b) {
      var d = a.area - b.area;
      return Math.abs(d) < 1 ? b.order - a.order : d;
    });
    return SURFACE_INDEX;
  }
  /** Does the outer box contain the inner box (1px sub-pixel layout tolerance)? */
  function boxContains(outer, inner) {
    return outer.x - 1 <= inner.x &&
      outer.y - 1 <= inner.y &&
      outer.x + outer.width + 1 >= inner.x + inner.width &&
      outer.y + outer.height + 1 >= inner.y + inner.height;
  }
  /**
   * The elements painting behind a run, tightest first: geometric containers
   * unioned with DOM ancestors, both excluding the run itself. Bounded so a
   * pathological DOM cannot stall extraction.
   */
  function surfaceChain(el) {
    var box = absBox(el);
    var chain = [];
    var seen = [];
    function add(node) {
      if (!node || node === el || node.nodeType !== 1) return;
      if (seen.indexOf(node) !== -1) return;
      seen.push(node);
      chain.push(node);
    }
    var idx = paintedSurfaces();
    for (var i = 0; i < idx.length && chain.length < 24; i++) {
      if (idx[i].el !== el && boxContains(idx[i].box, box)) add(idx[i].el);
    }
    // Ancestors last: any that also contains the run is already placed tighter-first
    // above; this only appends ones geometric containment missed.
    var node = el.parentElement;
    for (var j = 0; j < 12 && node && node.nodeType === 1; j++) {
      add(node);
      node = node.parentElement;
    }
    return chain;
  }
  /** The surface chain INCLUDING the run's own element, which may paint its own
   *  fill, gradient or accent bar (a callout paragraph carrying its own border-left). */
  function surfaceChainWithSelf(el) {
    return [el].concat(surfaceChain(el));
  }
  // REQ-58 (T1) — tight bounds around the element's *rendered text*, via a Range
  // over its contents. Unlike the element box (which includes padding and, for a
  // block, the full container width), this is the actual painted glyph extent, so
  // a rendered size / tracking / weight-fallback difference is measurable even when
  // computed fontSizePx matches. DOM-measured — robust where pixel-thresholding a
  // glyph over a photographic background is not (DOC-19).
  function renderedTextBox(el) {
    try {
      var range = el.ownerDocument.createRange();
      range.selectNodeContents(el);
      var r = range.getBoundingClientRect();
      if (!r || r.width <= 0 || r.height <= 0) return null;
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
    } catch (e) { return null; }
  }
  // BUG-25 — the painted extent of ONE text node, via a Range over that node
  // rather than over its element's contents.
  //
  // renderedTextBox(el) is the element's whole glyph extent, which is the run's
  // extent only while the element holds a single run. An h1 whose text is split by
  // a br becomes two runs, and reading geometry off the shared h1 gave both the
  // SAME box and the SAME glyph box — so a fold positioning them absolutely printed
  // one on top of the other, and nowrapFromPx measured the PAIR's height and read
  // both one-line runs as two-line. The browser already knows where each node
  // paints; this asks it.
  function textNodeBox(node) {
    try {
      var range = node.ownerDocument.createRange();
      range.selectNodeContents(node);
      var r = range.getBoundingClientRect();
      if (!r || r.width <= 0 || r.height <= 0) return null;
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
    } catch (e) { return null; }
  }
  // REQ-338 (issue 7) -- THE PITCH OF THE LINE BOXES THE GLYPHS ACTUALLY SIT ON.
  //
  // \`lineHeightPx\` was the run's OWN computed \`line-height\`, and a line box is the
  // maximum of that and the strut of the block that holds it. An inline
  // \`<span>\` styled \`font-size: 18px\` with no \`line-height\` of its own resolves
  // to 18 and sits on a 24px line box -- so the capture recorded 18, the fold
  // pinned 18, and a four-line paragraph rendered 18px short per gap. Measured on
  // joyfulculinarycreations.com as three HIGH \`renderedTextBox\` deltas (94 vs 76,
  // 70 vs 58, 46 vs 40) with identical font, identical width and identical wrap
  // points: only the vertical pitch differed, and the reference's ink rows are 24px
  // apart in its own screenshot.
  //
  // The browser already knows the answer. A Range over the run yields ONE RECT PER
  // LINE FRAGMENT, so the pitch is the difference between successive fragment tops
  // -- the modal difference, so one stray fragment (an inline image on its own
  // line) cannot set it. Null for a single-line run, where there is no pitch to
  // measure and the computed \`line-height\` is indistinguishable from it anyway.
  function linePitchOf(rects) {
    var tops = [];
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (!(r.width > 0) || !(r.height > 0)) continue;
      var t = Math.round(r.top * 100) / 100;
      if (tops.indexOf(t) === -1) tops.push(t);
    }
    if (tops.length < 2) return null;
    tops.sort(function (a, b) { return a - b; });
    var counts = {}, best = null, bestN = 0;
    for (var j = 1; j < tops.length; j++) {
      var d = Math.round((tops[j] - tops[j - 1]) * 100) / 100;
      if (!(d > 0)) continue;
      counts[d] = (counts[d] || 0) + 1;
      if (counts[d] > bestN) { bestN = counts[d]; best = d; }
    }
    return best;
  }
  /** The measured pitch of one run -- an element's whole contents, or one text node. */
  function runLinePitch(node) {
    try {
      var range = node.ownerDocument.createRange();
      range.selectNodeContents(node);
      return linePitchOf(range.getClientRects());
    } catch (e) { return null; }
  }
  function roleOf(el) {
    var t = el.tagName.toLowerCase();
    if (t === 'h1' || t === 'h2') return 'heading';
    if (t === 'h3' || t === 'h4' || t === 'h5' || t === 'h6') return 'subheading';
    if (t === 'a') return 'link';
    if (t === 'button') return 'action';
    if (t === 'li') return 'listitem';
    return 'body';
  }

  // ── REQ-47 rendered shape / structure helpers ───────────────────────────────
  // REQ-338 (issue 6) -- HTML COLLAPSES FIVE CHARACTERS, and \`\\s\` is not the set.
  //
  // A run's text was normalised with \`/\\s+/g\`, which in JavaScript includes
  // U+00A0 and every other Unicode space -- so a NON-BREAKING space arrived as an
  // ordinary one and the reproduction was allowed to break a line where the
  // reference cannot break at all. Measured on joyfulculinarycreations.com:
  // \`raw.html\` carries 15 U+00A0 and the bundle carried ZERO; one checklist item
  // then set 460.38px of first-line text against the reference's 373.08px -- a HIGH
  // \`renderedTextBox\` delta with both sides reporting the same box, the same font
  // and the same two-line height. Non-breaking whitespace is LAYOUT, not
  // formatting: it survives, along with the zero-width joiners and the
  // non-breaking hyphen, all of which make wrap decisions the same way.
  var HTML_WS = /[ \\t\\n\\r\\f]+/g;
  var HTML_WS_EDGE = /^[ \\t\\n\\r\\f]+|[ \\t\\n\\r\\f]+$/g;
  function collapseWs(t) { return (t || '').replace(HTML_WS, ' '); }
  function trimWs(t) { return (t || '').replace(HTML_WS_EDGE, ''); }
  function collapseText(t) { return trimWs(collapseWs(t)); }
  // REQ-370 -- a run whose computed white-space PRESERVES its spaces lets them take
  // width: under \`break-spaces\` a trailing space, and the space at a soft wrap,
  // widen the line, and a centred line moves by half a space. Trimming that space
  // made a faithful reproduction unreachable (25 of hearingzone510.com's 26
  // renderedTextBox deltas). Only the two values that wrap AND keep spaces count;
  // \`pre\` and \`nowrap\` are measured as line count, as before (REQ-88).
  function preservedWhiteSpaceOf(s) {
    var v = s && s.whiteSpace;
    return (v === 'break-spaces' || v === 'pre-wrap') ? v : null;
  }
  // REQ-380 -- a preserved run's text as the browser lays it out: verbatim.
  function keptWs(t) { return (t || '').replace(/\\r\\n?/g, '\\n'); }
  // Largest painted corner radius (px). Rounded-vs-square is visually obvious but
  // tiny in pixels, so it is captured as an explicit rendered value, not left to
  // an image diff to (barely) see.
  // REQ-333 -- a PERCENTAGE radius resolves against the box, not against the number.
  // \`border-radius: 50%\` -- the idiomatic circular crop -- computes to the string
  // '50%', and parseFloat read it as 50px: a 216px photograph came back with a 50px
  // corner rounding where the page paints a disc. The box is passed in because the
  // radius is only meaningful against one, and a caller with no box keeps the old
  // reading (a bare number is already px).
  function borderRadiusOf(s, box) {
    var vals = [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius];
    var max = 0;
    for (var i = 0; i < vals.length; i++) {
      var raw = ('' + (vals[i] || '')).trim().split(/\\s+/)[0];
      var v = parseFloat(raw);
      if (isNaN(v)) continue;
      if (/%$/.test(raw)) {
        if (!box || !(box.width > 0) || !(box.height > 0)) continue;
        v = (v / 100) * Math.min(box.width, box.height);
      }
      if (v > max) max = v;
    }
    return Math.round(max);
  }
  function boxShadowOf(s) {
    var bs = s.boxShadow;
    return (bs && bs !== 'none') ? bs : null;
  }
  // REQ-58 (item 4) — a left-edge accent bar (a border-l-4 border-emerald-400
  // callout) is usually painted on a WRAPPER of the text, not the text run's own
  // element. Reading border-left off the run alone captured none, and the missing
  // bar was invisible to the diff. Walk a few ancestors so the treatment is found
  // where the reference actually paints it.
  // REQ-88: resolved over the geometric surfaceChain, not a parentElement walk, so
  // a bar painted on a sibling backing box (an L1 reproduction) is found where the
  // reference paints it on a wrapper. Bounded to the 4 tightest surfaces, matching
  // the original walk depth: an accent belongs to the run's own card, not the page.
  // REQ-88 (round 6): also returns the BEARING ELEMENT'S RECT. A border paints
  // inside its own border box, so the bar's position is a property of the element
  // that carries it, not of the run that sits inside it. Reporting only
  // width+colour forced the fold to draw the accent on the run's box — indented by
  // the wrapper's padding and overlapping the first glyph. See accentBox.
  function accentBarOf(el) {
    var chain = surfaceChainWithSelf(el);
    for (var i = 0; i < chain.length && i < 4; i++) {
      if (chain[i] === document.body) break;
      var cs = getComputedStyle(chain[i]);
      var w = Math.round(parseFloat(cs.borderLeftWidth)) || 0;
      var st = cs.borderLeftStyle;
      if (w > 0 && st && st !== 'none') {
        var c = rgbToHexA(cs.borderLeftColor);
        if (c) return { width: w, color: c, box: absBox(chain[i]), self: chain[i] === el };
      }
    }
    return { width: 0, color: null, box: null, self: false };
  }
  // REQ-58 / REQ-63 — the element's own painted BOX border. Distinct from
  // accentBarOf (an asymmetric left-only accent bar): a form field's outline / a
  // card's hairline are box borders whose colour + width + style were never fully
  // captured. REQ-63 walks all four sides and reports the THICKEST painted one
  // (with its line style), so a bottom-only rule or a single-side border — not
  // just the top edge — becomes a comparable value.
  function boxBorderOf(s) {
    var sides = ['Top', 'Right', 'Bottom', 'Left'];
    var best = null;
    for (var i = 0; i < sides.length; i++) {
      var w = Math.round(parseFloat(s['border' + sides[i] + 'Width'])) || 0;
      var st = s['border' + sides[i] + 'Style'];
      if (w > 0 && st && st !== 'none' && (!best || w > best.width)) {
        var c = rgbToHexA(s['border' + sides[i] + 'Color']);
        if (c) best = { width: w, color: c, style: st };
      }
    }
    return best || { width: 0, color: null, style: null };
  }
  // REQ-63 — a painted outline (focus ring / offset outline), read like the box
  // border but from the outline-* longhands. Distinct from the box border: an
  // outline sits outside the box and is a common focus/hairline treatment whose
  // presence + colour + style were never captured.
  function outlineOf(s) {
    var w = Math.round(parseFloat(s.outlineWidth)) || 0;
    var st = s.outlineStyle;
    if (w > 0 && st && st !== 'none') {
      return w + 'px ' + st + ' ' + (rgbToHexA(s.outlineColor) || '');
    }
    return null;
  }
  // REQ-63 — element opacity in 0..1 (1 = fully opaque). A partial value ghosts
  // the element (faded text / dimmed panel) — a rendered fact no colour or box
  // field holds. NaN (never expected) folds to opaque.
  function opacityOf(s) {
    var o = parseFloat(s.opacity);
    return isNaN(o) ? 1 : Math.round(o * 100) / 100;
  }
  // REQ-63 — is a CSS-generated ::before / ::after actually painting content? A
  // reset's empty content and the none/normal defaults are not painted; any
  // other value (an icon glyph, a "→", an image) is. Presence is what the eye
  // reads — the injected mark exists or it doesn't.
  function pseudoContentPainted(el, sel) {
    try {
      var c = getComputedStyle(el, sel).content;
      if (!c || c === 'none' || c === 'normal') return false;
      var unq = c.replace(/^['"]|['"]$/g, '');
      return unq.trim() !== '';
    } catch (e) { return false; }
  }
  function pseudoOf(el) {
    var b = pseudoContentPainted(el, '::before');
    var a = pseudoContentPainted(el, '::after');
    return b && a ? 'both' : b ? 'before' : a ? 'after' : null;
  }
  // REQ-366 -- the glyph an EMPTY element paints through ::before / ::after.
  //
  // An icon font's mark (Font Awesome's <i class="fas fa-laptop"></i>) is
  // generated content on an element with no text of its own, so the text walk
  // never reached it, and pseudoOf above only ever described elements that were
  // already records for another reason. On joyfulculinarycreations.com six
  // icon-box icons and three social icons were recorded nowhere, and the
  // reproduction drew none of them -- 0 deltas, because nothing was compared.
  //
  // Only a QUOTED STRING counts: url(), counter() and attr() are not a glyph this
  // record can carry. And only on an element at least 4x4px, so a zero-size
  // clearfix with content: "." is not an icon. Returns { sel, text } or null.
  function pseudoGlyphOf(el) {
    if (el.firstElementChild || collapseText(el.textContent) !== '') return null;
    var sels = ['::before', '::after'];
    for (var i = 0; i < sels.length; i++) {
      var c;
      try { c = getComputedStyle(el, sels[i]).content; } catch (e) { continue; }
      var m = /^(["'])([\\s\\S]*)\\1$/.exec(c || '');
      if (!m) continue;
      var text = cssUnescape(m[2]);
      if (trimWs(text) === '') continue;
      var b = absBox(el);
      if (!(b.width >= 4 && b.height >= 4)) return null;
      return { sel: sels[i], text: text };
    }
    return null;
  }
  // A CSS string's escapes (\\f109, \\"), resolved to the characters they name.
  function cssUnescape(str) {
    return str.replace(/\\\\([0-9a-fA-F]{1,6})[ \\t\\n\\r\\f]?|\\\\([\\s\\S])/g, function (_, hex, ch) {
      return hex ? String.fromCodePoint(parseInt(hex, 16)) : ch;
    });
  }
  // REQ-366 -- an EMPTY element whose only ink is a BORDER RULE.
  //
  // A page-builder divider is <span class="elementor-divider-separator"></span>
  // styled border-top: 2.5px solid: no text, no fill, no image, so neither the
  // text walk nor the media/backdrop candidates ever reached it. It is the same
  // thing an <hr> is, so it becomes a field exactly as an <hr> does.
  //
  // A RULE, not any bordered box: the element must be no thicker than twice its
  // border (+1px) on its thin axis, so the border IS the element. An outlined
  // button or card paints a border around content that lives elsewhere, and
  // recording those would put a field on one side of a diff and not the other.
  function borderRuleOf(el) {
    if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return false;
    if (/^(input|textarea|select|hr|img|br|wbr|script|style|link|meta|template|iframe|video|canvas|object|embed)$/.test(el.tagName.toLowerCase())) return false;
    var s = getComputedStyle(el);
    var bd = boxBorderOf(s);
    if (!(bd.width > 0)) return false;
    if (rgbToHex(s.backgroundColor)) return false;
    if (s.backgroundImage && s.backgroundImage !== 'none') return false;
    var b = absBox(el);
    var thin = Math.min(b.width, b.height);
    return thin > 0 && thin <= 2 * bd.width + 1;
  }
  // REQ-63 / BUG-10 — a painted list marker (disc / decimal / …), else null. The
  // CSS *initial* value of list-style-type is 'disc' on EVERY element, so reading
  // it unconditionally stamped a phantom bullet on every non-list run (the
  // wordmark, headings, body). A ::marker box is generated ONLY for a
  // 'display: list-item' element, so gate on that: a genuine <li> (or any
  // list-item) keeps its marker; every other element reports null. 'none' still
  // suppresses a marker on a real list item.
  function listMarkerOf(s) {
    if (s.display !== 'list-item') return null;
    var t = s.listStyleType;
    return t && t !== 'none' ? t : null;
  }
  // REQ-58 (item 3b) — the card / panel fill behind a text run: the nearest
  // ancestor painting a non-transparent background (the card surface), distinct
  // from the section band the diff already records separately. A per-run value so
  // a slightly-off panel colour (Presence/Positivity/Connection) becomes a
  // comparable, visible delta instead of only the text colour being checked.
  function surfaceFillOf(el) {
    // REQ-58 capture accuracy: report the *rendered* fill a run sits on, not the
    // raw declared channel. A translucent card (rgba white over a tinted band)
    // renders as a pale tint, yet its backgroundColor reads #ffffff — so
    // composite each ancestor's fill under the accumulated colour until it turns
    // opaque (or the html/body backstop is reached).
    // REQ-88: composite over the geometric surfaceChain (tightest first) rather
    // than parentElement, so a card painted as a sibling backing box is the
    // surface, not the page backstop behind it.
    // REQ-302: a flat gradient LAYER is a fill and composites here, above the
    // same element's background-color (a background-image paints on top of it).
    // See flatGradientRgba for the asymmetry that closes.
    var acc = null; // [r,g,b,a], top layer first
    var chain = surfaceChainWithSelf(el);
    for (var i = 0; i < chain.length; i++) {
      // REQ-377 (issue 4) -- an inline-SVG panel is an opaque solid: nothing
      // behind it shows through, whatever its own background reads.
      var panelHex = panelFillOfSurface(chain[i]);
      if (panelHex) {
        var pr = [parseInt(panelHex.slice(1, 3), 16), parseInt(panelHex.slice(3, 5), 16), parseInt(panelHex.slice(5, 7), 16), 1];
        acc = acc ? composite(acc, pr) : pr;
        break;
      }
      var cs = getComputedStyle(chain[i]);
      var flat = flatGradientRgba(cs.backgroundImage);
      if (flat && flat[3] > 0) {
        acc = acc ? composite(acc, flat) : flat;
        if (acc[3] >= 0.999) break;
      }
      var c = rgbaOf(cs.backgroundColor);
      if (c && c[3] > 0) {
        acc = acc ? composite(acc, c) : c;
        if (acc[3] >= 0.999) break; // opaque — nothing behind shows through
      }
    }
    if (!acc || acc[3] <= 0) return null;
    return '#' + h2(acc[0]) + h2(acc[1]) + h2(acc[2]);
  }
  // REQ-265 -- the RENDERED colour of a control's placeholder ink.
  //
  // \`::placeholder\` is a UA pseudo-element and inherits NOTHING, so a
  // placeholder's colour is not on any axis of the element that owns it. That
  // made it the one painted value the capture could not see at all: on
  // gigabytealchemy.ai four fields whose placeholders paint \`#746f69\` were
  // reproduced painting \`#000000\`, with every captured value on both sides in
  // agreement and \`deltaCount: 0\` on all four.
  //
  // Composited when it is translucent, for the reason surfaceFillOf composites: a
  // half-alpha ink over the field's own backdrop is not the colour the eye reads.
  // Both shapes are real and measured -- Chromium's own default computes OPAQUE
  // (rgb(117, 117, 117)), while Tailwind v4's preflight computes a 50%-alpha ink
  // -- so neither compositing unconditionally nor taking the declared value
  // unconditionally is right. Null when the control has no placeholder to paint.
  // REQ-265 -- resolve ANY computed colour string to [r, g, b, a] in sRGB.
  //
  // rgbaOf reads the rgb()/rgba() serialisation, which is what the engine returns
  // for a colour authored in a legacy space -- and is NOT what it returns for a
  // modern one. Measured: Tailwind v4's preflight paints a placeholder with
  // color-mix(in oklab, currentColor 50%, transparent), whose computed value
  // serialises as oklab(0.173 ... / 0.5). The regex reads nothing there and the
  // value is dropped silently, which is REQ-52's lesson arriving in a second place.
  //
  // A 1x1 canvas is the resolver, because serialisation tricks are not: Chromium
  // hands the oklab string straight back from both getComputedStyle and
  // ctx.fillStyle (measured), while PAINTING the token and reading the pixel back
  // gives exact sRGB bytes for every space the engine understands. Reached only
  // when the cheap regex fails, so the common case pays nothing.
  var COLOR_CANVAS = null;
  function resolvedRgba(str) {
    var c = rgbaOf(str);
    if (c) return c;
    if (!str) return null;
    try {
      if (!COLOR_CANVAS) COLOR_CANVAS = document.createElement('canvas');
      var ctx = COLOR_CANVAS.getContext('2d');
      ctx.clearRect(0, 0, 1, 1);
      // A token the engine cannot parse leaves fillStyle untouched, so seed it
      // with a value we can recognise rather than trusting the assignment.
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillStyle = str;
      if (ctx.fillStyle === 'rgba(0, 0, 0, 0)') return null;
      ctx.fillRect(0, 0, 1, 1);
      var px = ctx.getImageData(0, 0, 1, 1).data;
      var a = px[3] / 255;
      return a > 0 ? [px[0], px[1], px[2], a] : null;
    } catch (e) { return null; }
  }
  function placeholderColorOf(el) {
    var tag = (el.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return null;
    if (!el.placeholder) return null;
    var c = null;
    try { c = resolvedRgba(getComputedStyle(el, '::placeholder').color); } catch (e) { return null; }
    if (!c || c[3] === 0) return null;
    if (c[3] < 0.999) {
      var under = surfaceFillOf(el);
      if (under) {
        c = composite(c, [
          parseInt(under.slice(1, 3), 16),
          parseInt(under.slice(3, 5), 16),
          parseInt(under.slice(5, 7), 16),
          1
        ]);
      }
    }
    return '#' + h2(c[0]) + h2(c[1]) + h2(c[2]);
  }
  // REQ-308 -- the type a form control paints with.
  //
  // A control whose only ink is its placeholder went down the TEXT-FREE path,
  // which recorded no typography at all: \`fontSizePx: 0\`, \`fontFamily: ""\`,
  // \`fontWeight: 0\` and no \`lineHeightPx\` key, on both sides of every diff. So
  // the fold had nothing to write onto the control's axes, the renderer's
  // \`font: inherit\` reset governed, and a textarea whose reference line-height
  // is 24px painted its placeholder against a \`normal\` line box -- measured on
  // gigabytealchemy.ai as the whole of one round's ranked pixel residual (159.48
  // of 159.48) with ZERO value deltas, because nothing compared it either.
  //
  // Read off the \`::placeholder\` pseudo-element when the control has one --
  // that is the ink that actually paints, and the pseudo is already queried for
  // its colour (see placeholderColorOf) -- falling back to the control's own
  // computed style, which is also what a control with no placeholder (a select,
  // a filled field) paints its typed text with. Null for anything that is not a
  // form control: an \`<img>\`, an \`<hr>\` and a painted backdrop box have no type
  // to describe, and their axes stay the constants they have always been.
  function controlTypographyOf(el, s) {
    var tag = (el.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return null;
    var ps = null;
    if (el.placeholder) {
      try { ps = getComputedStyle(el, '::placeholder'); } catch (e) { ps = null; }
    }
    // An engine that does not expose the pseudo returns an empty string; the
    // control's own computed style is the right answer in that case, and is the
    // value the pseudo inherits when it IS exposed.
    var pick = function (name) {
      var v = ps ? ps[name] : '';
      return (v === '' || v === undefined || v === null) ? s[name] : v;
    };
    var size = parseFloat(pick('fontSize'));
    var weight = parseInt(pick('fontWeight'), 10);
    // NaN for 'normal', whose used value is a font metric no computed style
    // exposes -- recorded as null exactly as a text run records it, and read by
    // the diff as \`normal\` rather than as an unmeasured axis (both sides of a
    // control comparison run a typography-recording extractor or neither does).
    var lh = parseFloat(pick('lineHeight'));
    return {
      fontFamily: familyStack(pick('fontFamily')),
      fontSizePx: isNaN(size) ? 0 : Math.round(size),
      fontWeight: isNaN(weight) ? 400 : weight,
      lineHeightPx: isNaN(lh) ? null : Math.round(lh * 100) / 100,
    };
  }
  // REQ-62 -- the panel/card GRADIENT fill behind a run, the sibling to the
  // composited solid surfaceFillOf. A gradient panel (bg-gradient-to-br from-…)
  // is a background-IMAGE over a transparent background-color, so surfaceFillOf
  // composites straight past it and records the band. Walk the same surface chain
  // (REQ-88: geometric, tightest-first — not parentElement) and return the first
  // painting surface's raw gradient CSS (normalized TS-side), skipping a text-fill
  // gradient (background-clip:text -- that is the run's own text paint, captured by
  // gradientCss, not a surface). Stop at the first OPAQUE solid fill: a gradient
  // hidden behind it never shows through, so it is not the rendered surface.
  function surfaceGradientOf(el) {
    var chain = surfaceChainWithSelf(el);
    for (var i = 0; i < chain.length; i++) {
      // REQ-377 (issue 4) -- an opaque panel hides any gradient behind it.
      if (panelFillOfSurface(chain[i])) return null;
      var gs = getComputedStyle(chain[i]);
      var img = gs.backgroundImage || 'none';
      var clip = gs.webkitBackgroundClip || gs.backgroundClip || '';
      // REQ-302 -- a single-colour "gradient" is a flat fill and belongs to
      // surfaceFillOf, which now composites it. Reporting it here as well is
      // what made one veil two values on two axes. An OPAQUE one still hides
      // everything behind it, so it ends the walk the way a solid fill does.
      var flat = flatGradientRgba(img);
      if (flat) {
        if (flat[3] >= 0.999) return null;
      } else if (/gradient\\(/.test(img) && clip !== 'text') {
        return hexifyGradient(img);
      }
      var c = rgbaOf(gs.backgroundColor);
      if (c && c[3] >= 0.999) return null; // opaque solid — nothing behind shows
    }
    return null;
  }
  // BUG-22 -- WHICH box paints the surface behind this run, and what shape is it.
  //
  // surfaceFillOf / surfaceGradientOf answer "what colour is behind the run" by
  // compositing the chain. The surface's SHAPE (its rounding, shadow, border and
  // box) lives on the single element that paints it, and which element that is
  // differs between the two sides of a reproduction diff. A conventional page
  // paints a control's fill + rounding on the run's OWN element (a <button>), so
  // the run's own borderRadiusPx is the control's. An L1 reproduction is a flat
  // tree: the label is its own text node and the fill is a sibling backing box, so
  // the run's own radius reads 0 while the pixels are correct. Recording the
  // painting element (tightest-first, as everywhere else) lets the diff resolve a
  // control's surface axes against the box that bears them.
  function surfaceOf(el) {
    var chain = surfaceChainWithSelf(el);
    for (var i = 0; i < chain.length; i++) {
      var node = chain[i];
      if (node === document.body || node === document.documentElement) break;
      // REQ-377 (issue 4) -- an inline-SVG panel bears the surface. Flagged
      // \`panel\`, because the panel is ALREADY in the bundle as a field of its
      // own (REQ-370): a fold that also rebuilt a card from this run's fill would
      // paint the one panel twice.
      if (panelFillOfSurface(node)) {
        return { self: false, box: absBox(node), borderRadiusPx: 0, boxShadow: null, border: null, panel: true };
      }
      var cs = getComputedStyle(node);
      var fill = rgbaOf(cs.backgroundColor);
      var img = cs.backgroundImage || 'none';
      if ((!fill || fill[3] <= 0) && (img === 'none' || img === '')) continue;
      var b = boxBorderOf(cs);
      var border = null;
      if (b.width > 0 && b.color) {
        border = { widthPx: b.width, color: b.color };
        if (b.style) border.style = b.style;
      }
      return {
        self: node === el,
        box: absBox(node),
        borderRadiusPx: borderRadiusOf(cs),
        boxShadow: boxShadowOf(cs),
        border: border
      };
    }
    return null;
  }
  // REQ-48 (item 2) -- effective paint order. z-index:auto (the default, and the
  // common case) resolves to 0; an explicit integer is the rendered stacking
  // value. This is the only field that separates a correctly-placed-but-wrongly-
  // stacked layer from its reference.
  //
  // REQ-347 -- READ OFF THE ANCESTOR CHAIN, the way {@link accTransformOf} already
  // reads the transform. \`z-index\` does not inherit and is almost never declared
  // on the leaf: a page positions a WRAPPER and stacks that, so
  // \`getComputedStyle(h1).zIndex\` is \`auto\` on a headline whose \`.header-text\`
  // parent says \`z-index: 20\`. Read at the leaf alone, faelan.com's four declared
  // stacking values (20/15/10/5, verbatim in its stylesheet) produced ELEVEN
  // records all equal to 0 -- and with nothing to order by, every collage
  // photograph painted over the hero headline. 64.1% of that round's ranked pixel
  // residual, with ZERO value deltas, because both sides agreed on the same wrong
  // zero.
  //
  // THE FIRST BOX THE PROPERTY APPLIES TO OWNS THE ANSWER, and the walk stops
  // there. \`z-index\` applies only to a positioned box (and to a flex/grid item),
  // so a static ancestor's declared value is inert and must not be read; the
  // nearest box it does apply to IS the one that carries this leaf through the
  // paint order of the layer above, which is what a flat reproduction needs.
  //
  // AND IT STOPS AT AN ANCESTOR THAT IS A STACKING CONTEXT WITHOUT ASKING FOR A
  // LEVEL. \`.photo-soft-1\` is \`position:absolute; transform:rotate(-8deg)\` with no
  // z-index: the transform makes it a stacking context, so it and everything
  // inside it paint as ONE unit at level 0 of the layer above -- below
  // \`.photo-torn\`'s declared 5, not above it. Walking past it to \`.photo-layer\`'s
  // 10 would say the opposite and re-order the collage.
  //
  // ONE INTEGER CANNOT BE EXACT, and the bound is deliberate rather than an
  // oversight: paint order is really the lexicographic order of the whole chain of
  // levels, and two leaves in different stacking contexts are not comparable on a
  // single scale at all. The number is right for the shape this measures -- a set
  // of positioned siblings stacked inside one container, which is what every
  // montage, hero overlay and badge actually is -- and is strictly better than the
  // constant 0 it replaces everywhere else.
  function zIndexOf(el) {
    var node = el;
    var guard = 0;
    while (node && node.nodeType === 1 && guard++ < 64) {
      var cs = getComputedStyle(node);
      if (zIndexApplies(node, cs)) {
        var z = parseInt(cs.zIndex, 10);
        if (!isNaN(z)) return z;
        // A box with \`z-index: auto\` that is a stacking context anyway carries its
        // whole subtree at level 0 of the layer above; one that is not is
        // transparent to paint order, so the walk continues through it.
        if (establishesStackingContext(node, cs)) return 0;
      }
      node = node.parentElement;
    }
    return 0;
  }
  // REQ-347 -- does \`z-index\` APPLY to this box? Positioned boxes, plus flex and
  // grid items, for which the property applies even at \`position: static\`.
  function zIndexApplies(el, cs) {
    if ((cs.position || 'static') !== 'static') return true;
    var p = el.parentElement;
    if (!p || p.nodeType !== 1) return false;
    var pd = getComputedStyle(p).display || '';
    return pd === 'flex' || pd === 'inline-flex' || pd === 'grid' || pd === 'inline-grid';
  }
  // REQ-347 -- does this box establish a STACKING CONTEXT of its own, by something
  // other than a declared z-index? The painted subset of the CSS rule: every
  // property here also costs a compositing layer, which is what makes the subtree
  // travel as one. \`will-change\` and \`contain\` are in it because a page that
  // writes either is asking for exactly this.
  function establishesStackingContext(el, cs) {
    if (cs.position === 'fixed' || cs.position === 'sticky') return true;
    var op = parseFloat(cs.opacity);
    if (!isNaN(op) && op < 1) return true;
    if (paintedOrNull(cs.transform)) return true;
    if (paintedOrNull(cs.filter)) return true;
    if (paintedOrNull(cs.backdropFilter || cs.webkitBackdropFilter)) return true;
    if (paintedOrNull(cs.perspective)) return true;
    if (paintedOrNull(cs.mixBlendMode)) return true;
    if (cs.isolation === 'isolate') return true;
    if (maskEdgeOf(cs)) return true;
    var wc = '' + (cs.willChange || '');
    if (wc.indexOf('transform') >= 0 || wc.indexOf('opacity') >= 0 || wc.indexOf('filter') >= 0) return true;
    var ct = '' + (cs.contain || '');
    return ct.indexOf('paint') >= 0 || ct.indexOf('layout') >= 0 || ct.indexOf('strict') >= 0 || ct.indexOf('content') >= 0;
  }
  // BUG-187 -- THE WHOLE CHAIN zIndexOf IS ONE LINK OF, so two elements can be
  // ordered where their chains first name different boxes.
  //
  // zIndexOf answers with the first level it meets, which is right among
  // positioned siblings in one container and meaningless across two: on
  // hearingzone510.com (Zyro) every section's ground is .block-background at
  // z-index 13 and its copy sits in .block-layout at 14, inside a .layout-element
  // at 1. Read one integer each, the ground (13) paints over the copy (1), the
  // opposite of the page. Read as chains, [13] against [14, 1] diverge at the
  // first link and the copy is on top, which is what the screenshot shows.
  //
  // A LINK is every box that travels through paint order as one unit: a box
  // z-index applies to and that declares a level, or any box that establishes a
  // stacking context (level 0 when it declares none). Each is recorded as its
  // document path and its level, outermost first. The element itself closes the
  // chain at level 0 when it is not a link of its own, so two leaves in one
  // context still have an id to be put in document order by.
  var PAINT_PATHS = new Map();
  function paintPathOf(node) {
    var p = PAINT_PATHS.get(node);
    if (p === undefined) { p = nodePathOf(node); PAINT_PATHS.set(node, p); }
    return p;
  }
  function paintStackOf(el) {
    var chain = [];
    var node = el;
    var guard = 0;
    while (node && node.nodeType === 1 && node !== document.documentElement && guard++ < 64) {
      var cs = getComputedStyle(node);
      var level = null;
      if (zIndexApplies(node, cs)) {
        var z = parseInt(cs.zIndex, 10);
        if (!isNaN(z)) level = z;
      }
      if (level === null && establishesStackingContext(node, cs)) level = 0;
      if (level !== null || node === el) chain.push({ id: paintPathOf(node), z: level === null ? 0 : level });
      node = node.parentElement;
    }
    return chain.reverse();
  }
  // REQ-48 (item 3) -- a computed value that is painted, or null when it is the
  // no-op default. Normalises the several spellings of "nothing" to one null.
  function paintedOrNull(v) {
    return (v && v !== 'none' && v !== 'normal') ? v : null;
  }
  // REQ-63 — the painted text-decoration LINE (underline / line-through /
  // overline), stripped of the shorthand's style/colour, or null when none. The
  // computed longhand is preferred; the shorthand's first token is the fallback
  // (jsdom populates only the shorthand).
  function textDecorationOf(s) {
    var line = ('' + (s.textDecorationLine || s.textDecoration || '')).split(' ')[0];
    return (line && line !== 'none') ? line : null;
  }
  // REQ-365 -- where that underline sits: the computed text-underline-offset in
  // px, or null for 'auto' (the engine's own placement) and for a run that paints
  // no underline, where the inherited value places nothing. A percentage computes
  // to itself, not to a length, and reads null rather than as a guess.
  function underlineOffsetOf(s) {
    if (textDecorationOf(s) !== 'underline') return null;
    var v = '' + (s.textUnderlineOffset || '');
    if (!/^-?[\\d.]+px$/.test(v)) return null;
    var n = Math.round(parseFloat(v) * 100) / 100;
    return isNaN(n) ? null : n;
  }
  // REQ-48 (item 3) -- the element's masked/clipped edge (feather halo or shaped
  // clip). Either mechanism collapses to one field; presence is what the eye reads.
  function maskEdgeOf(s) {
    return paintedOrNull(s.maskImage || s.webkitMaskImage) || paintedOrNull(s.clipPath);
  }
  // REQ-48 (item 1) -- decompose the 2D transform matrix into rotation (deg) and
  // uniform scale. matrix(a,b,c,d,e,f): rotation = atan2(b,a), scale = hypot(a,b).
  // Translation (e,f) is already folded into the getBoundingClientRect box, so it
  // needs no field. matrix3d and an unparseable value fall back to identity.
  function transformOf(s) {
    var t = s.transform;
    if (!t || t === 'none') return { rotate: 0, scale: 1 };
    var m = t.match(/matrix\\(([^)]+)\\)/);
    if (!m) return { rotate: 0, scale: 1 };
    var p = m[1].split(',');
    var a = parseFloat(p[0]), b = parseFloat(p[1]);
    if (isNaN(a) || isNaN(b)) return { rotate: 0, scale: 1, readable: false };
    return {
      rotate: Math.atan2(b, a) * 180 / Math.PI,
      scale: Math.sqrt(a * a + b * b),
      readable: true,
    };
  }
  // BUG-153 (item 1) -- the sentinel \`linearPartOf\` returns for a transform it
  // saw and could not decompose. Identity-compared, never composed.
  var TF_UNREADABLE = { unreadable: true };
  // REQ-333 -- the linear part of one element's own transform, as a 2x2 matrix,
  // \`null\` when it has none, or \`TF_UNREADABLE\` when it has one this cannot
  // read. \`matrix()\` and \`matrix3d()\` are what a laying-out
  // engine reports; the declared function list is what an engine that does no layout
  // reports, and reading both means the accumulation below is measurable without a
  // browser as well as inside one. Translation is deliberately dropped: it is
  // already folded into every rect this file records.
  //
  // BUG-153 (item 1) -- \`TF_UNREADABLE\` is the THIRD outcome, and the one this
  // function could not express while \`null\` carried both of its meanings. A value
  // we SAW and could not decompose came back indistinguishable from 'none', which
  // put a zero meaning "we did not look" into the same field as a zero meaning
  // "upright" -- and the comparator, handed two of them, reported the pair clean.
  function linearPartOf(t) {
    if (!t || t === 'none') return null;
    var m = /matrix\\(([^)]+)\\)/.exec(t);
    if (m) {
      var p = m[1].split(',');
      var r = { a: parseFloat(p[0]), b: parseFloat(p[1]), c: parseFloat(p[2]), d: parseFloat(p[3]) };
      return (isNaN(r.a) || isNaN(r.b) || isNaN(r.c) || isNaN(r.d)) ? TF_UNREADABLE : r;
    }
    var m3 = /matrix3d\\(([^)]+)\\)/.exec(t);
    if (m3) {
      var q = m3[1].split(',');
      var r3 = { a: parseFloat(q[0]), b: parseFloat(q[1]), c: parseFloat(q[4]), d: parseFloat(q[5]) };
      return (isNaN(r3.a) || isNaN(r3.b) || isNaN(r3.c) || isNaN(r3.d)) ? TF_UNREADABLE : r3;
    }
    var acc = null;
    var re = /(rotatez|rotate|scalex|scaley|scale)\\(([^)]*)\\)/gi;
    var f;
    while ((f = re.exec(t))) {
      var fn = f[1].toLowerCase();
      var args = f[2].split(',');
      var step = null;
      if (fn === 'rotate' || fn === 'rotatez') {
        var deg = parseFloat(args[0]);
        if (isNaN(deg)) continue;
        if (/rad\\s*$/i.test(args[0])) deg = deg * 180 / Math.PI;
        else if (/turn\\s*$/i.test(args[0])) deg = deg * 360;
        var rad = deg * Math.PI / 180;
        step = { a: Math.cos(rad), b: Math.sin(rad), c: -Math.sin(rad), d: Math.cos(rad) };
      } else {
        var s1 = parseFloat(args[0]);
        if (isNaN(s1)) continue;
        var s2 = args.length > 1 ? parseFloat(args[1]) : s1;
        if (isNaN(s2)) s2 = s1;
        if (fn === 'scalex') step = { a: s1, b: 0, c: 0, d: 1 };
        else if (fn === 'scaley') step = { a: 1, b: 0, c: 0, d: s1 };
        else step = { a: s1, b: 0, c: 0, d: s2 };
      }
      acc = acc === null ? step : mul2(acc, step);
    }
    // BUG-153 (item 1) -- nothing accumulated, and that has two causes. A value
    // spelled only out of the translate family genuinely HAS no linear part and
    // is fully read (translation is already folded into every rect this file
    // records). Anything else -- a skew, a spelling this list does not carry --
    // is a transform that paints and was not decomposed, and saying so is the
    // whole point of the distinction.
    if (acc === null) {
      var names = ('' + t).match(/([a-zA-Z0-9]+)\\s*\\(/g) || [];
      for (var i = 0; i < names.length; i++) {
        if (!/^(translate3d|translatex|translatey|translatez|translate|perspective)\\s*\\($/i.test(names[i])) return TF_UNREADABLE;
      }
      return null;
    }
    return acc;
  }
  // The 2x2 product \`x . y\`, outer transform on the left (CSS composition order).
  function mul2(x, y) {
    return {
      a: x.a * y.a + x.c * y.b,
      b: x.b * y.a + x.d * y.b,
      c: x.a * y.c + x.c * y.d,
      d: x.b * y.c + x.d * y.d,
    };
  }
  // REQ-333 -- the transform that actually PAINTS this element: its own composed
  // with every ancestor's.
  //
  // \`transform\` does not inherit, so \`getComputedStyle(img).transform\` on
  // \`<div style="transform:rotate(3deg)"><img></div>\` is 'none' -- correct for the
  // \`<img>\`, and wrong for the painted result. A wrapper carrying the rotation is
  // the ordinary way a page tilts a photograph (four of them on faelan.com), and
  // reading the leaf alone recorded \`transformRotateDeg: 0\` for all four: 91.76% of
  // one round's ranked pixel residual with ZERO value deltas to name it, because
  // both sides agreed on the same wrong zero.
  //
  // BUG-153 (item 1) -- \`readable\` rides out with the numbers. One undecomposable
  // link anywhere in the chain makes the WHOLE effective transform unknown, not
  // partially known: the links below it still paint, so what is left is not the
  // element's transform and must not be projected as one.
  function accTransformOf(el) {
    var acc = null;
    var readable = true;
    var node = el;
    var guard = 0;
    while (node && node.nodeType === 1 && guard++ < 64) {
      var part = linearPartOf(getComputedStyle(node).transform);
      if (part === TF_UNREADABLE) readable = false;
      else if (part) acc = acc === null ? part : mul2(part, acc);
      node = node.parentElement;
    }
    if (!acc) return { rotate: 0, scale: 1, radians: 0, scaleExact: 1, readable: readable };
    var radians = Math.atan2(acc.b, acc.a);
    var scaleExact = Math.sqrt(acc.a * acc.a + acc.b * acc.b);
    return {
      rotate: Math.round(radians * 180 / Math.PI),
      scale: Math.round(scaleExact * 100) / 100,
      radians: radians,
      scaleExact: scaleExact,
      readable: readable,
    };
  }
  // BUG-153 (item 1) -- the transform fields an element projects, out of the chain
  // {@link accTransformOf} has already walked.
  //
  // Where that chain could not be read, the two value fields are omitted ENTIRELY
  // and \`transformUnreadable\` is set instead. An axis nobody could read must not
  // arrive as a NUMBER, because the comparator will compare it against the other
  // side's number and call the pair clean -- which is how a page whose transform
  // went unmeasured reported as upright and agreed. The diff reports the flag as
  // an unmeasured axis (see values-diff.ts), which is the honest reading: the
  // silence is stated rather than scored as agreement.
  function transformFields(tf) {
    if (tf && tf.readable === false) return { transformUnreadable: true };
    return { transformRotateDeg: tf.rotate, transformScale: tf.scale };
  }
  // REQ-333 -- the element's LAYOUT box, recovered from the rect a rotation
  // inflated.
  //
  // \`getBoundingClientRect()\` on a transformed element is the axis-aligned bounding
  // box of the ROTATED element, and everything downstream (the fold, the probes,
  // values-diff) reads \`box\` as the layout box. Recorded raw, a 450x599.7
  // photograph rotated 4deg came back as 490.7x629.6 and reproduced unrotated and
  // stretched into the inflated rectangle.
  //
  // An affine transform maps the box's centre to the parallelogram's centre, and an
  // AABB's centre IS its content's centre, so the centre survives untouched and only
  // the extent has to be undone: W = s(w|cos| + h|sin|), H = s(w|sin| + h|cos|) is
  // two equations in w and h. Near 45deg the pair stops distinguishing them (the
  // determinant cos2t goes to zero) and the transform-independent layout metrics
  // answer instead.
  function layoutBoxOf(el, tf, rect) {
    var b = rect || absBox(el);
    if (!tf || (Math.abs(tf.radians) < 1e-6 && Math.abs(tf.scaleExact - 1) < 1e-6)) return b;
    var co = Math.abs(Math.cos(tf.radians));
    var si = Math.abs(Math.sin(tf.radians));
    var det = co * co - si * si;
    var s = tf.scaleExact > 1e-6 ? tf.scaleExact : 1;
    var w = 0, h = 0;
    if (Math.abs(det) > 0.2) {
      w = (b.width * co - b.height * si) / det / s;
      h = (b.height * co - b.width * si) / det / s;
    }
    if (!(w > 0) || !(h > 0)) {
      w = (el && el.offsetWidth) || b.width;
      h = (el && el.offsetHeight) || b.height;
    }
    return { x: b.x + b.width / 2 - w / 2, y: b.y + b.height / 2 - h / 2, width: w, height: h };
  }
  // REQ-333 -- the wrapper an image is FRAMED by, or null.
  //
  // \`overflow: hidden\` plus \`border-radius\` on a single-purpose wrapper div is the
  // idiomatic way to crop a photograph on the web, and the ring and the drop shadow
  // go on the same element. Read off the \`<img>\`, all of it comes back blank: one
  // circular photograph with a white ring and two shadows reproduced as a bare
  // hard-edged square, with 0 value deltas because both sides reported the same
  // absent framing. The proof that this is attribution and not a missing axis is in
  // the same page -- the three photographs that put their radius, shadow and mask on
  // the \`<img>\` itself were all recorded correctly.
  //
  // A frame is a wrapper with exactly ONE element child (this image) and no text of
  // its own -- it exists to frame, so its paint is the image's paint. A wrapper that
  // paints nothing is not a frame and is not reported as one.
  //
  // REQ-347 -- AND THE FRAME'S OWN BORDER BOX TRAVELS WITH ITS PAINT. REQ-333 fixed
  // WHICH properties are attributed and not WHICH BOX they are attributed to: the
  // wrapper's ring, radius and shadows were written onto the \`<img>\`'s content box,
  // which is the wrapper's box MINUS its own border. faelan.com's ringed photograph
  // declares \`width:224px;height:224px;border:4px\` under a global
  // \`box-sizing:border-box\`, so its border box is 224 and its content box 216 --
  // and the number 224 occurred ZERO times in the whole capture, while the radius
  // came back 108 (50% of 216) instead of 112. Reproduced, a 216px border box with
  // a 4px ring leaves 208px of picture at a 4px offset: the ring painted 4px inward
  // and everything inside it was shifted and 3.8% differently scaled. 35.9% of that
  // round's ranked pixel residual -- and, uniquely, a residual the comparator could
  // never report, because \`box\` on the reference side was the rect of an element
  // with no border and on ours the rect of an element with one, so the same two
  // numbers described two different rectangles and read as a perfect match.
  //
  // THE BORDER BOX IS THE RIGHT BOX BECAUSE IT IS WHERE THE PAINT IS. The frame is
  // the composite the reader sees -- ring, crop, shadow and picture as one object --
  // and its extent is the wrapper's border box. An L1 leaf renders under the same
  // \`box-sizing: border-box\` reset, so a 224px box with a 4px border reconstructs
  // the 216px of picture exactly, without the box ever having to carry two numbers.
  function frameOf(el) {
    var p = el.parentElement;
    if (!p || p.nodeType !== 1) return null;
    if (!p.children || p.children.length !== 1 || p.children[0] !== el) return null;
    if (('' + (p.textContent || '')).trim() !== '') return null;
    var ps = getComputedStyle(p);
    var border = boxBorderOf(ps);
    // The frame's OWN layout box, un-inflated through the frame's OWN accumulated
    // transform -- which is the image's only while the image adds no rotation of
    // its own, and is the wrapper's either way.
    var box = layoutBoxOf(p, accTransformOf(p));
    var frame = {
      el: p,
      style: ps,
      box: box,
      // The percentage radius resolves against the box it is attributed to, which
      // is now the frame's: 50% of 224 is the 112 that draws the disc.
      borderRadiusPx: borderRadiusOf(ps, box),
      borderWidthPx: border.width,
      borderColor: border.color,
      borderStyle: border.style,
      boxShadow: boxShadowOf(ps),
      maskEdge: maskEdgeOf(ps),
    };
    var paints = frame.borderRadiusPx > 0 || frame.borderWidthPx > 0 || frame.boxShadow || frame.maskEdge;
    return paints ? frame : null;
  }
  // REQ-48 (item 1) -- declared motion. Keyframe animation (entrance / scroll-
  // reveal) and a non-zero transition (hover) leave no signal in a resting frame,
  // but their declaration is a rendered fact the projection can hold.
  function motionOf(s) {
    var anim = s.animationName && s.animationName !== 'none';
    var trans = s.transitionDuration && s.transitionDuration !== '0s' && s.transitionProperty !== 'none';
    if (anim && trans) return 'both';
    if (anim) return 'animation';
    if (trans) return 'transition';
    return null;
  }
  // REQ-269 -- the navigation TARGET of the nearest enclosing anchor. a11yRoleOf
  // below reads the same attribute to decide whether an <a> is a link and then
  // throws the value away, which is why no reproduction of any site could carry a
  // working link: the L1 link axis has existed since REQ-106 and the fold has
  // never had an href to write onto it.
  //
  // Projected the way a reproduction has to consume it, not verbatim:
  //   - same-origin -> a SITE-INTERNAL reference (path+query+hash, or the bare
  //     fragment when it points within this same page). A reproduction that
  //     emitted the absolute URL would send its own visitors back to the site it
  //     was captured from, which is the opposite of reproducing the link.
  //   - cross-origin -> the absolute URL, which is what the reference means.
  //   - tel:/mailto: -> the attribute as written (REQ-370). REQ-359 widened the
  //     L1 link allowlist (isSafeHref) to exactly these two schemes; the body rule
  //     here is the same one, so a recorded value always folds.
  //   - anything else (javascript:, data:, ...) -> null, still refused by L1.
  function hrefOf(el) {
    var a = el.closest ? el.closest('a[href]') : null;
    if (!a) return null;
    var raw = a.getAttribute('href');
    if (raw == null || raw.trim() === '') return null;
    raw = raw.trim();
    if (/^(tel|mailto):./i.test(raw)) return /[\\u0000-\\u0020\\u007f-\\u009f"'\\\\<>]/.test(raw) ? null : raw;
    var u;
    try { u = new URL(raw, location.href); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.origin !== location.origin) return u.href;
    // A fragment on THIS page stays a bare fragment -- '#' included, which means
    // the top of the document and would become a navigation if expanded.
    if (u.pathname === location.pathname && u.search === location.search && raw.charAt(0) === '#') return raw;
    return u.pathname + u.search + u.hash;
  }
  // REQ-269 -- the OUTLINE DEPTH of the nearest enclosing heading, else null.
  //
  // a11yRoleOf flattens h1..h6 to the single word 'heading' (the browser's own
  // role vocabulary does), and aria-level appears nowhere in a capture bundle --
  // so even once L1 grew a heading role there was no level to write onto it.
  // Read from aria-level where the author states one (which is how a role=
  // "heading" div declares its depth) and from the tag otherwise; ARIA's own
  // default for an undeclared role="heading" is 2.
  function headingLevelOf(el) {
    var h = el.closest ? el.closest('h1,h2,h3,h4,h5,h6,[role="heading"]') : null;
    if (!h) return null;
    var declared = parseInt(h.getAttribute('aria-level'), 10);
    if (declared >= 1 && declared <= 6) return declared;
    var m = /^h([1-6])$/.exec(h.tagName.toLowerCase());
    return m ? parseInt(m[1], 10) : 2;
  }
  // REQ-275 -- does the nearest enclosing anchor open a NEW BROWSING CONTEXT?
  //
  // Found by the completeness probe, not by a round: '1c capture audit' reported
  // 'dom:target' in use on two of the three stored references and decided about
  // by nothing. hrefOf has recorded where a link goes since REQ-269 and this is
  // the other half of the same fact -- a reproduction of a footer whose social
  // links all open in place is wrong in a way no pixel gate can see.
  //
  // Recorded as the DERIVED fact, not the attribute, because that is what L1
  // says: l1LinkSchema.newTab is a boolean the renderer always pairs with
  // rel="noopener noreferrer", and _self/_parent/_top/a named frame all
  // mean "not a new tab" to a reproduction that has no frames. Transcribing
  // 'target' verbatim would put four values in the bundle that fold to two.
  function newTabOf(el) {
    var a = el.closest ? el.closest('a[href]') : null;
    if (!a) return null;
    var t = (a.getAttribute('target') || '').trim().toLowerCase();
    return t === '_blank' ? true : false;
  }
  // The a11y role: an explicit role attr wins, else the implicit role for the tag
  // (the browser's own framework-agnostic semantic label — a <button>, an <a
  // href>, and a role="button" div all project to the same fact).
  //
  // REQ-302 -- resolved from the nearest SEMANTIC ANCESTOR, exactly as hrefOf and
  // headingLevelOf above already are. A gradient-text or colour-accent treatment
  // wraps the words in a presentational span inside the semantic element --
  // <a href="/"><span style="background-clip:text">Gigabyte Alchemy</span></a> --
  // and the run's owning element is then the span. Reading the role off the span
  // alone recorded 'generic' on a record that carried an href beside it, which is
  // not a state a document can be in. It also made the measurement asymmetric: an
  // L1 render emits the <a>/<h1> DIRECTLY around its text (there is no
  // presentational span in L1), so the same function returned 'link' on the
  // reproduction and 'generic' on the reference, and the two highest-severity
  // deltas in a run pointed at the side that was right.
  //
  // BUG-151 -- the walk is BOUNDED, because [role] was not. closest runs to the
  // document root, so ANY ancestor carrying ANY role attribute was returned as
  // the run's own semantic element. The reference's testimonial markup nests the
  // text three levels inside div.swiper-slide[role="group"], itself inside
  // div.swiper[role="region"], so five runs recorded 'group' -- the SLIDE's role,
  // not theirs. An L1 render has no slide wrapper (there is nothing in L1 that
  // would produce one) and recorded 'generic', which is correct, so the two sides
  // could not agree however good the reproduction was, and five HIGH deltas
  // pointed at the side that was right.
  //
  // The bound is the role's own KIND rather than a depth count. The case the walk
  // exists for is always an INTERACTIVE or HEADING ancestor standing in for its
  // presentational wrapper; a landmark, a region or a grouping never owns a text
  // run's semantics. So an ancestor qualifies by role only when the role is one a
  // run could legitimately BE, and region / group / list / presentation / none
  // and the landmarks are invisible here. A depth bound would be a number nobody
  // can defend; this is a statement about what the axis means.
  //
  // The tag-name branch is unchanged, and an element matching both still resolves
  // by tag: an anchor carrying role="presentation" is still an anchor.
  var SEMANTIC_ANCESTOR_SEL =
    'a[href],button,h1,h2,h3,h4,h5,h6,input,textarea,select,img,hr' +
    // The roles a text run could legitimately BE: the interactive ones, the
    // heading, and the form controls -- the vocabulary a11yRoleOf itself emits.
    ',[role="link" i],[role="button" i],[role="heading" i],[role="textbox" i]' +
    ',[role="searchbox" i],[role="combobox" i],[role="listbox" i],[role="option" i]' +
    ',[role="checkbox" i],[role="radio" i],[role="switch" i],[role="slider" i]' +
    ',[role="spinbutton" i],[role="menuitem" i],[role="menuitemcheckbox" i]' +
    ',[role="menuitemradio" i],[role="tab" i],[role="img" i],[role="separator" i]';
  function semanticOf(el) {
    if (!el.closest) return el;
    // An element's OWN role is its own semantics whatever that role is, so a
    // role="group" div that directly holds text still reports 'group' for
    // itself. Only reaching THROUGH one to an ancestor is the defect.
    if (el.getAttribute && el.getAttribute('role')) return el;
    var anc = el.closest(SEMANTIC_ANCESTOR_SEL);
    return anc || el;
  }
  function a11yRoleOf(rawEl) {
    var el = semanticOf(rawEl);
    var explicit = el.getAttribute && el.getAttribute('role');
    if (explicit) return explicit.trim().toLowerCase();
    var t = el.tagName.toLowerCase();
    if (t === 'a') return el.getAttribute('href') != null ? 'link' : 'generic';
    if (t === 'button') return 'button';
    if (t === 'textarea') return 'textbox';
    if (t === 'select') return 'combobox';
    if (t === 'img') return 'img';
    if (t === 'hr') return 'separator';
    if (t === 'h1' || t === 'h2' || t === 'h3' || t === 'h4' || t === 'h5' || t === 'h6') return 'heading';
    if (t === 'input') {
      var ty = (el.getAttribute('type') || 'text').toLowerCase();
      if (ty === 'submit' || ty === 'button' || ty === 'reset' || ty === 'image') return 'button';
      if (ty === 'checkbox') return 'checkbox';
      if (ty === 'radio') return 'radio';
      return 'textbox';
    }
    return 'generic';
  }
  // Accessible name + its source, following the a11y precedence the browser uses:
  // aria-label / aria-labelledby (explicit) → an associated <label> (rendered
  // OUTSIDE the control) → placeholder (rendered INSIDE the control) → value/text.
  // The *source* is the fact that separates placeholder-inside from label-above.
  function accessibleNameOf(el) {
    var aria = el.getAttribute && el.getAttribute('aria-label');
    if (aria && aria.trim()) return { name: collapseText(aria), source: 'aria' };
    var lb = el.getAttribute && el.getAttribute('aria-labelledby');
    if (lb) {
      var nm = collapseText(lb.split(/\\s+/).map(function (id) {
        var e = document.getElementById(id); return e ? e.textContent : '';
      }).join(' '));
      if (nm) return { name: nm, source: 'aria' };
    }
    var tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      var lbl = null;
      if (el.id) {
        var idSel = (window.CSS && CSS.escape) ? CSS.escape(el.id) : el.id;
        try { lbl = document.querySelector('label[for="' + idSel + '"]'); } catch (e) { lbl = null; }
      }
      if (!lbl && el.closest) lbl = el.closest('label');
      // REQ-96 -- a module-INVARIANT label is the a11y association a behavior
      // module is obliged to keep, not the labelling the page RENDERS. Reading
      // the name off it would report 'label' (outside/above) for a control the
      // reference labels with a placeholder INSIDE the box -- a permanent,
      // unfixable delta manufactured by the module honouring an obligation.
      // Invariant elements are excluded from the value gate; that has to include
      // the name they would otherwise source.
      if (lbl && moduleInvariant(lbl)) lbl = null;
      var lblText = lbl ? collapseText(lbl.textContent) : '';
      if (lblText) return { name: lblText, source: 'label' };
      var ph = el.getAttribute('placeholder');
      if (ph && ph.trim()) return { name: collapseText(ph), source: 'placeholder' };
      var val = el.value;
      if (val && ('' + val).trim()) return { name: collapseText('' + val), source: 'text' };
      return { name: '', source: null };
    }
    if (tag === 'img') {
      var alt = el.getAttribute('alt');
      return (alt && alt.trim()) ? { name: collapseText(alt), source: 'alt' } : { name: '', source: null };
    }
    var txt = collapseText(el.textContent);
    return txt ? { name: txt, source: 'text' } : { name: '', source: null };
  }
  // Relate two boxes geometrically: substantial vertical overlap → same row
  // (beside / right-of); the later element sitting clearly below → stacked. This
  // is the rendered arrangement, whatever CSS (flex row, float, grid) produced it.
  function relate(prev, curr) {
    var top = Math.max(prev.y, curr.y);
    var bot = Math.min(prev.y + prev.height, curr.y + curr.height);
    var overlap = bot - top;
    var minH = Math.min(prev.height, curr.height) || 1;
    if (overlap > 0.5 * minH) return 'row';
    if (curr.y >= prev.y + prev.height * 0.5) return 'stack';
    return null;
  }
  // Assign each element's arrangement relative to the previous element in
  // document (top-to-bottom, then left-to-right) order within its section.
  function assignArrangement(elements) {
    var sorted = elements.slice().sort(function (a, b) {
      if (Math.abs(a.box.y - b.box.y) > 4) return a.box.y - b.box.y;
      return a.box.x - b.box.x;
    });
    for (var i = 0; i < sorted.length; i++) {
      sorted[i].arrangement = i === 0 ? null : relate(sorted[i - 1].box, sorted[i].box);
    }
  }

  function insideAny(el, roots) {
    for (var k = 0; k < roots.length; k++) if (roots[k].contains(el)) return true;
    return false;
  }

  function hx(n) { return ('0' + Math.round(n).toString(16)).slice(-2); }

  // REQ-270 -- A SCRIM'S COLOUR, WHEREVER IT IS PAINTED. The single definition
  // both overlay readers below share, so a scrim syntax can never be legible on
  // one side of a diff and invisible on the other.
  //
  // It was backgroundColor-ONLY, which made the reproduction side blind to the
  // one syntax our own renderer emits: render.ts writes an L1 overlay axis as a
  // flat gradient LAYER inside background-image (linear-gradient(#0307174d,
  // #0307174d) over the hero photograph), never as a background-color. So the
  // reference -- whose scrim IS a coloured box, or is read by sections.ts's
  // route A out of the band's own gradient -- reported #030717 @ 0.3 and the
  // reproduction reported none, and the diff blamed the reproduction for a veil
  // it was painting correctly to within 1/255 across an 800px band.
  //
  // The gradient rule is sections.ts's firstOverlay rule with one widening: the
  // FIRST TRANSLUCENT stop rather than the first stop. A fade-to-black scrim
  // opens at alpha 0, and "the first stop" would read that as no scrim at all.
  function gradientColors(css) {
    if (!css || css === 'none' || css.indexOf('gradient(') === -1) return [];
    // url(...) is stripped first: a background-image is a LAYER LIST, and a
    // photograph's own URL can carry a #fragment that reads as a hex colour.
    var src = css.replace(/url\\([^)]*\\)/g, '');
    var re = /(rgba?\\([^)]*\\)|hsla?\\([^)]*\\)|oklab\\([^)]*\\)|oklch\\([^)]*\\)|lab\\([^)]*\\)|lch\\([^)]*\\)|#[0-9a-fA-F]{3,8})/g;
    var out = [], m;
    while ((m = re.exec(src))) {
      var c = rgbaOf(m[1]);
      if (c) out.push(c);
    }
    return out;
  }
  function gradientScrim(css) {
    var cols = gradientColors(css);
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      if (c[3] > 0 && c[3] < 1) return { color: '#' + hx(c[0]) + hx(c[1]) + hx(c[2]), opacity: Math.round(c[3] * 100) / 100 };
    }
    return null;
  }
  // REQ-302 -- the flat fill a "gradient" is actually painting, or null.
  //
  // A gradient whose every colour stop resolves to the SAME colour is not a
  // gradient at all: it is a flat fill painted as a background LAYER rather than
  // as a background-color. The two are indistinguishable on the page and were
  // not indistinguishable to this extractor, which is how one veil came to be
  // reported on two different axes depending only on how the page authored it. A
  // full-bleed 30% navy scrim written as a sibling div with
  // 'background: rgba(2,6,23,.3)' composited into surfaceFillOf; the SAME veil
  // written as 'linear-gradient(#0307174d, #0307174d)' on the box itself landed
  // on surfaceGradientOf instead, and left surfaceFillOf reporting the page
  // backstop underneath. Eight false deltas across four runs, measured, with
  // both sides painting the same pixels.
  //
  // Returns the rgba so a caller can composite it exactly as it composites a
  // background-color -- alpha included, which is the whole point.
  function flatGradientRgba(css) {
    var cols = gradientColors(css);
    if (cols.length < 2) return null;
    for (var i = 1; i < cols.length; i++) {
      if (cols[i][0] !== cols[0][0] || cols[i][1] !== cols[0][1] ||
          cols[i][2] !== cols[0][2] || cols[i][3] !== cols[0][3]) return null;
    }
    return cols[0];
  }
  // The scrim this element paints, or null. A translucent background-COLOUR
  // first (the conventional veil), then a translucent gradient LAYER.
  //
  // REQ-338 (issue 5) -- THE ELEMENT'S OWN \`opacity\` IS PART OF THE VEIL, and its
  // \`mix-blend-mode\` is how the veil composites. A page-builder overlay child
  // splits the two routinely: joyfulculinarycreations.com's vegetable band paints
  // \`background-color: #141E14BA\` (alpha 0.729) at \`opacity: 0.92\` with
  // \`mix-blend-mode: darken\`, an effective 0.67 dark-green \`darken\` veil. Reading
  // the colour's alpha alone reported 0.73 and no blend, and the band reproduced
  // as the raw photograph under a flat tint -- 13.96% of that page's diff mass at
  // mean 66.89/255.
  function scrimOf(el) {
    var cs = getComputedStyle(el);
    var own = parseFloat(cs.opacity);
    var k = isNaN(own) ? 1 : Math.min(1, Math.max(0, own));
    var mix = (cs.mixBlendMode && cs.mixBlendMode !== 'normal') ? cs.mixBlendMode : null;
    // REQ-338 -- BOTH SPELLINGS OF THE SAME FACT, because the two sides of a
    // reproduction author it differently and a veil compared on one spelling only
    // would report a delta on every page we render correctly. A reference veils
    // with a blended overlay ELEMENT (\`mix-blend-mode\` on the child); our renderer
    // has no such element -- an L1 \`overlay\` is a gradient LAYER on the box it
    // veils -- so it blends with \`background-blend-mode\` on that layer, which is
    // the first in the stack.
    var layerBlend = function () {
      var list = (cs.backgroundBlendMode || '').split(',');
      var first = (list[0] || '').trim();
      return first && first !== 'normal' ? first : null;
    };
    var veil = function (color, alpha, blend) {
      var eff = Math.round(alpha * k * 100) / 100;
      if (!(eff > 0)) return null; // a veil at zero alpha paints nothing
      var out = { color: color, opacity: eff };
      if (blend) out.blendMode = blend;
      return out;
    };
    var c = rgbaOf(cs.backgroundColor);
    if (c && c[3] > 0 && c[3] < 1) {
      return veil('#' + hx(c[0]) + hx(c[1]) + hx(c[2]), c[3], mix);
    }
    var g = gradientScrim(cs.backgroundImage);
    return g ? veil(g.color, g.opacity, mix || layerBlend()) : null;
  }

  // A scrim: a visible descendant that blankets most of the band and paints a
  // semi-transparent (0<alpha<1) background — the translucent layer that darkens
  // a hero image so text reads over it. The most-covering such layer wins. This
  // is a separate overlay element (bg-slate-950/30 over an image), which a band's
  // own backgroundColor/backgroundImage can never reveal.
  function overlayOf(band, bbox) {
    var area = bbox.width * bbox.height;
    if (area <= 0) return null;
    var desc = band.getElementsByTagName('*');
    var best = null;
    for (var i = 0; i < desc.length; i++) {
      var el = desc[i];
      if (!visible(el)) continue;
      // BUG-24 — resolve the scrim through rgbaOf (the REQ-52 canvas probe), not a
      // raw rgba() regex. A Tailwind v4 veil (\bg-slate-950/30\) computes to
      // \color-mix(in oklab, …)\ / \oklab(… / .3)\, which the regex could not read,
      // so EVERY modern-syntax scrim was silently dropped and the hero rendered
      // unveiled. rgbaOf resolves any browser-understood colour and preserves alpha.
      // REQ-270 — and through scrimOf, so a gradient-layer veil counts too.
      var sc = scrimOf(el);
      if (!sc) continue;
      var r = absBox(el);
      var cover = (r.width * r.height) / area;
      if (cover < 0.6) continue; // must substantially blanket the band
      // REQ-338 (issue 5) -- ON EQUAL COVER THE LATER LAYER WINS, because document
      // order is paint order for these and the veil the eye reads is the one
      // painted last. A band that declares its own translucent fill AND a
      // dedicated overlay child (the page-builder idiom) has two blanketing
      // candidates at cover 1.0; strict > kept the FIRST, which is the parent's,
      // so the band's own \`#FFFFFF17\` was reported as the veil and the
      // \`#141E14BA\` \`darken\` child that actually paints it was never recorded
      // anywhere in the bundle.
      if (!best || cover >= best.cover) {
        best = { color: sc.color, opacity: sc.opacity, blendMode: sc.blendMode, cover: cover };
      }
    }
    return best ? veilRecord(best) : null;
  }

  // The scrim record a caller gets, blend mode included only when there is one.
  function veilRecord(best) {
    var out = { color: best.color, opacity: best.opacity };
    if (best.blendMode) out.blendMode = best.blendMode;
    return out;
  }

  // REQ-269 -- the geometric twin of overlayOf, and the slice
  // derivation they serve.
  //
  // overlayOf above answers its question by walking DOM DESCENDANTS of a band
  // root. That proxy only holds when the band really is an ancestor of what it
  // paints behind, which is true of a conventional page and false of an L1
  // reproduction: render.ts emits ONE element into <body>, and every band, scrim
  // and run inside it is an absolutely-positioned SIBLING. So the extractor's
  // <body>-children scan found a single body-spanning band covering the whole
  // page, and values-diff reported -- in its own words -- that the reference's
  // sections had no bands to compare against and that overlay, contentAnchor and
  // textAlign were UNMEASURED. Not on this reproduction: on EVERY reproduction of
  // every site, which is a standing blind spot rather than one site's residual.
  //
  // The truthful definition is geometric, which is the same move BUG-22 made for
  // surfaces: a band is a full-bleed painted slice of the page, and what belongs
  // to it is what sits inside it. That answer is identical on a conventionally
  // nested page (an ancestor contains its descendants). REQ-334 -- it is asked of
  // any band root that is really the whole page, not only of a document whose
  // top-level scan degenerated to one band; see the gate at the band assembly.

  // The full-bleed painted slices of ONE band root, in document order, with the
  // vertical gaps between them filled so no painted content falls outside every
  // slice. Returns [] when fewer than two slices can be found, which is the
  // honest answer for a root that really is one band.
  //
  // REQ-334 -- per root rather than per document, and bounded by that root in both
  // senses: only backdrops in its own SUBTREE are candidates, and the slices it
  // returns tile its own BOX rather than the page. A page-builder page's <header>
  // is a sibling of the full-page wrapper and absolutely positioned over the
  // wrapper's first slice; without the subtree test it would be admitted as a band
  // of the wrapper as well as remaining a band in its own right, and the two copies
  // would overlap.
  function bandSlicesIn(rootEl, rootBox) {
    var bgs = backdropBoxes();
    var cand = [];
    var top = rootBox.y, bottom = rootBox.y + rootBox.height;
    for (var i = 0; i < bgs.length; i++) {
      // The root's own paint is the page the slices sit ON, not a slice: admitting
      // it would make one candidate that contains every other, and the
      // outermost-wins rule below would then swallow the lot into a single band.
      if (bgs[i].el === rootEl || !rootEl.contains(bgs[i].el)) continue;
      var b = absBox(bgs[i].el);
      if (b.height < BACKDROP_MIN_HEIGHT) continue;
      if (!(b.x <= BACKDROP_EDGE_TOL && b.x + b.width >= layoutW - BACKDROP_EDGE_TOL)) continue;
      if (b.y + b.height <= top || b.y >= bottom) continue;
      cand.push({ el: bgs[i].el, box: b });
    }
    // Outermost wins: a backdrop whose vertical range sits inside one already kept
    // is a layer OF that band (a hero photograph over its fill), not a band of its
    // own -- emitting both would report the same slice twice.
    //
    // REQ-270 -- but it is KEPT as a layer of the slice that swallowed it, not
    // discarded. The band record used to read all its paint from the outermost
    // element alone, and the outermost element is the one that qualifies by being
    // an opaque FILL: on our own render the hero is .l1-1 (a full-bleed #030717
    // fill) with .l1-7 (the photograph, plus its scrim) sitting exactly inside
    // it, so the band recorded backgroundImage: none and the
    // reproduction's own hero photograph never reached its own manifest. A
    // reproduction that dropped the hero entirely would have diffed clean.
    cand.sort(function (a, b) {
      if (a.box.y !== b.box.y) return a.box.y - b.box.y;
      return b.box.height - a.box.height;
    });
    var kept = [];
    for (var j = 0; j < cand.length; j++) {
      var host = null;
      for (var k = 0; k < kept.length; k++) {
        var pbox = kept[k].box;
        if (cand[j].box.y >= pbox.y - 1 && cand[j].box.y + cand[j].box.height <= pbox.y + pbox.height + 1) {
          host = kept[k];
          break;
        }
      }
      if (host) host.layers.push(cand[j]);
      else kept.push({ el: cand[j].el, box: cand[j].box, layers: [] });
    }
    if (kept.length < 2) return [];
    var out = [];
    var cursor = top;
    for (var m = 0; m < kept.length; m++) {
      var bx = kept[m].box;
      var start = Math.max(bx.y, cursor);
      var end = Math.min(bx.y + bx.height, bottom);
      if (end - start < BACKDROP_MIN_HEIGHT) continue;
      // A stretch of page that paints no backdrop of its own is still a section --
      // it is the root's own background showing through. Without it the content
      // standing on that stretch would have to be assigned to a band it is not inside.
      if (start - cursor >= BACKDROP_MIN_HEIGHT) {
        out.push({ el: rootEl, box: { x: 0, y: cursor, width: layoutW, height: start - cursor }, layers: [] });
      }
      // BUG-151 -- layoutW, so a slice that QUALIFIED by spanning the viewport is
      // recorded as spanning it. Boxing these docW-wide on a sideways-scrolling
      // page would have traded nine false 'missing' deltas for eleven false
      // 'size' ones, and left the band records disagreeing with the very rule
      // that admitted them.
      out.push({ el: kept[m].el, box: { x: 0, y: start, width: layoutW, height: end - start }, layers: kept[m].layers });
      cursor = end;
    }
    if (bottom - cursor >= BACKDROP_MIN_HEIGHT) {
      out.push({ el: rootEl, box: { x: 0, y: cursor, width: layoutW, height: bottom - cursor }, layers: [] });
    }
    return out;
  }

  /** Does this box's centre fall inside that vertical slice? */
  function centreInSlice(box, slice) {
    if (!box) return false;
    var cy = box.y + box.height / 2;
    return cy >= slice.y && cy < slice.y + slice.height;
  }

  // overlayOf's geometric twin: the scrim is the translucent fill that blankets
  // this slice, wherever it sits in the tree. Same 60% coverage rule, measured on
  // the INTERSECTION with the slice rather than on the veil's whole area, because
  // a sibling scrim is not bounded by the band the way a descendant is.
  function overlayInBox(box, band) {
    var area = box.width * box.height;
    if (area <= 0) return null;
    var surf = paintedSurfaces();
    var best = null;
    for (var i = 0; i < surf.length; i++) {
      // REQ-338 (issue 5) -- A BOX THAT CONTAINS THE BAND PAINTS BEHIND IT, so it
      // can never be the band's overlay: CSS puts a box's own background-color
      // UNDER its background-image, and an ancestor's fill under both. The
      // vegetable band on joyfulculinarycreations.com declares
      // \`background-color: #FFFFFF17\` on the section itself -- alpha 0.0902 -- and
      // that is exactly the \`{#ffffff, 0.09}\` the bundle recorded as its veil,
      // while the \`#141E14BA\` \`darken\` overlay child that really paints it was
      // recorded nowhere at all.
      if (band && surf[i].el.contains(band)) continue;
      // REQ-270 — scrimOf, not backgroundColor alone: our own renderer emits every
      // L1 overlay axis as a gradient layer, so this read saw none on exactly
      // the veil it was measuring.
      var sc = scrimOf(surf[i].el);
      if (!sc) continue;
      var r = surf[i].box;
      var ix0 = Math.max(r.x, box.x), ix1 = Math.min(r.x + r.width, box.x + box.width);
      var iy0 = Math.max(r.y, box.y), iy1 = Math.min(r.y + r.height, box.y + box.height);
      if (ix1 <= ix0 || iy1 <= iy0) continue;
      var cover = ((ix1 - ix0) * (iy1 - iy0)) / area;
      if (cover < 0.6) continue;
      // REQ-338 -- the later layer wins a tie; see overlayOf.
      if (!best || cover >= best.cover) {
        best = { color: sc.color, opacity: sc.opacity, blendMode: sc.blendMode, cover: cover };
      }
    }
    return best ? veilRecord(best) : null;
  }

  // BUG-174 -- a band's OWN paint: the opacity, filter, blend mode, corner radius
  // and shadow of the element that paints it. A reproduction paints every band on
  // a full-bleed box and the diff reads those five axes off that box; a band
  // record carried its fill and imagery and nothing else, so the five went
  // uncompared on BOTH sides -- on gigabytealchemy the hero photograph paints at
  // opacity .49 and no check read it. Read with the same helpers a field's paint
  // is read with, so the two records cannot disagree about what a value means.
  function bandPaintOf(el, box) {
    var cs = getComputedStyle(el);
    return {
      opacity: opacityOf(cs),
      filter: paintedOrNull(cs.filter),
      blendMode: paintedOrNull(cs.mixBlendMode),
      borderRadiusPx: borderRadiusOf(cs, box),
      boxShadow: boxShadowOf(cs),
    };
  }

  // BUG-174 -- WHICH element paints a geometric slice: the one its recorded paint
  // was read off. The topmost layer painting an image (sliceBackgroundImage's
  // pick), else the topmost coincident opaque layer (sliceBackgroundColor's),
  // else the slice element itself -- so the five axes describe the same box the
  // band's imagery and fill already describe, never the box the page covered.
  function slicePaintLayer(slice) {
    var layers = slice.layers || [];
    var i;
    for (i = layers.length - 1; i >= 0; i--) {
      var img = getComputedStyle(layers[i].el).backgroundImage;
      if (img && img !== 'none') return layers[i];
    }
    for (i = layers.length - 1; i >= 0; i--) {
      var lb = layers[i].box;
      if (!lb || !slice.box) continue;
      if (Math.abs(lb.y - slice.box.y) > 2 || Math.abs(lb.height - slice.box.height) > 2) continue;
      var rgba = rgbaOf(getComputedStyle(layers[i].el).backgroundColor);
      if (rgba && rgba[3] >= 0.999) return layers[i];
    }
    return { el: slice.el, box: slice.box };
  }

  // REQ-270 -- the paint of a geometric slice, which is not the paint of the box
  // that FILLS it. bandSlicesIn keeps every backdrop it swallowed (see there); the
  // image a band shows is the one on its TOPMOST painted layer, and the slice
  // element itself is only the fallback. Document-ordered smallest-last by
  // bandSlicesIn's own sort, so the last layer that paints an image is the top one.
  //
  // backgroundColor is NOT taken from a layer that merely sits inside the slice --
  // see sliceBackgroundColor below for the one layer whose fill IS the band's.
  function sliceBackgroundImage(slice) {
    var layers = slice.layers || [];
    for (var i = layers.length - 1; i >= 0; i--) {
      var img = getComputedStyle(layers[i].el).backgroundImage;
      if (img && img !== 'none') return img;
    }
    var own = getComputedStyle(slice.el).backgroundImage;
    return own || 'none';
  }

  // BUG-161 (issue 1) -- A BAND'S FILL IS THE TOPMOST OPAQUE PAINT OVER ITS BOX,
  // not the fill of the outermost box the slicer happened to keep.
  //
  // bandSlicesIn picks its slice element outermost-first, which is right for
  // deciding WHERE the bands are and wrong for deciding what one PAINTS when two
  // band-sized boxes coincide. An L1 reproduction produces exactly that shape: the
  // fold emits a full-bleed backdrop-N box AND a full-bleed section-band-N box
  // over it at the same rectangle, so the slicer kept the backdrop (earlier
  // sibling, equal height) and read the band's fill off the box the page has
  // covered. On joyfulculinarycreations.com that reported the testimonials band as
  // '#ffffff' while it painted '#28542d' over its full 525px height -- 52.57% of
  // the round's ranked region score, and zero value deltas, because both sides
  // agreed on a colour neither page shows.
  //
  // COINCIDENT AND OPAQUE, both load-bearing:
  //   - coincident, because a layer with its own geometry (a photograph inside a
  //     taller fill -- REQ-270's hero) paints PART of the band and is not its fill;
  //   - opaque, because a translucent full-bleed fill is a SCRIM, which
  //     overlayInBox already records as the band's overlay and which the fold
  //     layers above the fill it veils. Taking it as the fill would paint it twice
  //     and paint it solid.
  // BUG-179 (item 6) -- the fill a band paints THROUGH A DESCENDANT.
  //
  // A band element that paints nothing itself may still be painted edge to edge
  // by a child (a page builder's inner container carrying the colour). The band
  // read only its own element and its coincident layers, so it recorded
  // {kind: none} over a footer whose every pixel is that child's colour. A
  // descendant that paints an OPAQUE fill over at least 99% of the band is the
  // band's fill; the topmost one in paint order when several qualify.
  var COVERING_FILL_MIN = 0.99;
  function coveringDescendantFill(el, box) {
    if (!el || !box || !(box.width > 0) || !(box.height > 0)) return null;
    var idx = paintedSurfaces();
    var best = null;
    for (var i = 0; i < idx.length; i++) {
      var cand = idx[i];
      if (cand.el === el || !el.contains(cand.el)) continue;
      var rgba = rgbaOf(getComputedStyle(cand.el).backgroundColor);
      if (!rgba || rgba[3] < 0.999) continue;
      var b = cand.box;
      var iw = Math.min(b.x + b.width, box.x + box.width) - Math.max(b.x, box.x);
      var ih = Math.min(b.y + b.height, box.y + box.height) - Math.max(b.y, box.y);
      if (iw <= 0 || ih <= 0 || (iw * ih) / (box.width * box.height) < COVERING_FILL_MIN) continue;
      if (!best || cand.order > best.order) best = cand;
    }
    return best ? rgbToHex(getComputedStyle(best.el).backgroundColor) : null;
  }
  function sliceBackgroundColor(slice) {
    var layers = slice.layers || [];
    var box = slice.box;
    var TOL = 2;
    for (var i = layers.length - 1; i >= 0; i--) {
      var lb = layers[i].box;
      if (!lb || !box) continue;
      if (Math.abs(lb.y - box.y) > TOL || Math.abs(lb.height - box.height) > TOL) continue;
      var lcs = getComputedStyle(layers[i].el);
      var rgba = rgbaOf(lcs.backgroundColor);
      if (!rgba || rgba[3] < 0.999) continue;
      return rgbToHex(lcs.backgroundColor);
    }
    return rgbToHex(getComputedStyle(slice.el).backgroundColor) || coveringDescendantFill(slice.el, box);
  }

  // Which slice owns this box. Containment first; failing that the nearest slice
  // by centre distance, so a run can never be dropped for sitting in no slice at
  // all -- losing content would be a far worse failure than filing it one band off.
  function sliceIndexFor(box, slices) {
    for (var i = 0; i < slices.length; i++) if (centreInSlice(box, slices[i].box)) return i;
    if (!box) return 0;
    var cy = box.y + box.height / 2, bestI = 0, bestD = Infinity;
    for (var j = 0; j < slices.length; j++) {
      var sb = slices[j].box;
      var d = Math.abs(cy - (sb.y + sb.height / 2));
      if (d < bestD) { bestD = d; bestI = j; }
    }
    return bestI;
  }

  // REQ-211 -- a document-wide sequence for inline-flow ids. See flowIds.
  var FLOW_SEQ = 0;
  // Collect visible text runs under a root, in document order, skipping any node
  // within an excluded subtree (so band content never duplicates item content).
  function runsUnder(root, excludes, meta) {
    var out = [];
    // REQ-302 -- where, in this walk, the excluded subtree sat.
    //
    // itemGroup pulls a band's repeated rows out of the content walk and the
    // projection used to re-append them after ALL of the band's content, so a
    // card whose bullet list happened to be the band's one detected item group
    // had its bullets emitted after a LATER card's copy. Document order is then
    // not the page's reading order, and every downstream consumer that treats it
    // as such -- the responsive table, the fold's child order, the flow
    // recovery's leading offsets -- inherits the inversion. Measured on one
    // reference: three bullet rows emitted ~460px below where they paint, which
    // the flow recovery then repaired with margin-top: -946px and friends, a
    // document that holds only at the six sampled widths.
    //
    // Recording the position lets the projection put them back where they were,
    // which costs nothing and removes the inversion at its source rather than
    // asking the fold to sort its way out of it.
    var excludedAtNode = -1;
    // REQ-366 -- elements too, for the glyph an empty element paints (pseudoGlyphOf).
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n;
    // BUG-25 — two passes, because a run's geometry depends on whether its element
    // holds more than one run. Pass 1 selects the qualifying text nodes and counts
    // them per element; pass 2 emits, reading geometry off the element when it owns
    // exactly one run (unchanged) and off the text node itself when it does not.
    var nodes = [];
    var runCounts = new Map();
    // REQ-211 -- a whitespace-only node between two inline runs carries the space
    // that separates them. It is skipped as a run (it has no glyphs and no box),
    // so the space it stands for is handed to the next run that IS emitted;
    // without this, <span>A</span> <span>B</span> rejoins as "AB".
    var pendingSpace = false;
    for (; (n = walker.nextNode()); ) {
      if (n.nodeType === 1) {
        // Cheapest test first: almost every element has children or text.
        if (n.firstElementChild) continue;
        var g = pseudoGlyphOf(n);
        if (!g || !visible(n) || moduleInvariant(n)) continue;
        if (excludes && insideAny(n, excludes)) {
          if (excludedAtNode === -1) excludedAtNode = nodes.length;
          continue;
        }
        nodes.push({ node: n, el: n, text: trimWs(collapseWs(g.text)), flow: g.text, glyph: g.sel });
        runCounts.set(n, (runCounts.get(n) || 0) + 1);
        continue;
      }
      var flow = collapseWs(n.nodeValue);
      var t = trimWs(flow);
      var owner = n.parentElement;
      if (!owner || !visible(owner)) { if (!t) pendingSpace = true; continue; }
      if (moduleInvariant(owner)) { if (!t) pendingSpace = true; continue; }
      if (excludes && insideAny(owner, excludes)) {
        if (excludedAtNode === -1) excludedAtNode = nodes.length;
        if (!t) pendingSpace = true;
        continue;
      }
      if (!t) { pendingSpace = true; continue; }
      // REQ-370 -- the edge spaces stay where they take width.
      // REQ-380 (issue 2) -- and so does EVERY space: under break-spaces/pre-wrap
      // the browser keeps a run of spaces whole and gives each its advance, so
      // collapsing "together.  Through" to one space set the rest of that line one
      // space-width left of the reference (3.09px on a centred run, half of it the
      // round's only CRITICAL delta). Both values keep segment breaks too, so a
      // newline stays a newline; only CRLF is normalised, as the parser does.
      var preserved = preservedWhiteSpaceOf(getComputedStyle(owner));
      if (preserved) flow = keptWs(n.nodeValue);
      if (pendingSpace && flow.charAt(0) !== ' ') flow = ' ' + flow;
      pendingSpace = false;
      var kept = preserved ? keptWs(n.nodeValue) : t;
      nodes.push({ node: n, el: owner, text: kept, flow: flow });
      runCounts.set(owner, (runCounts.get(owner) || 0) + 1);
    }
    // REQ-211 -- assign each run to the inline flow it sits in. The flow root is
    // the nearest ancestor that is NOT display: inline, so <em>/<span>/<sup>
    // climb to the block that holds them while an inline-BLOCK, a flex item or a
    // grid item does not -- each of those establishes its own formatting context
    // and its text is a separate flow, however the markup happens to nest.
    // Blockification is what makes a row of flex links stay N runs rather than
    // silently becoming one sentence.
    //
    // A <br> ENDS a flow. Two lines of one element are two flows: rejoining them
    // would put the break back on the browser's own wrapping, which is exactly
    // the decision the reference had already made.
    function flowRootOf(el) {
      var node = el;
      for (var i = 0; i < 24 && node.parentElement; i++) {
        if (getComputedStyle(node).display !== 'inline') break;
        node = node.parentElement;
      }
      return node;
    }
    // The root id comes from a script-level sequence, not from this call's own
    // list: runsUnder runs once per band and once per repeated item, and a
    // per-call index would give the first flow of every band the same id -- so
    // two unrelated sentences in two sections would rejoin as one.
    var flowRoots = [];
    var flowIds = [];
    var flowInfo = [];
    for (var gi = 0; gi < nodes.length; gi++) {
      // REQ-366 -- a glyph is never part of a sentence: its face is not its
      // neighbours', so rejoining it would set the icon in the copy's font.
      if (nodes[gi].glyph) { flowInfo.push({ key: 'g' + (FLOW_SEQ++), root: nodes[gi].el }); continue; }
      var groot = flowRootOf(nodes[gi].el);
      var ri = flowRoots.indexOf(groot);
      if (ri === -1) { ri = flowRoots.length; flowRoots.push(groot); flowIds.push('f' + (FLOW_SEQ++)); }
      var brs = groot.getElementsByTagName('br');
      var seg = 0;
      for (var bi2 = 0; bi2 < brs.length; bi2++) {
        if (brs[bi2].compareDocumentPosition(nodes[gi].node) & Node.DOCUMENT_POSITION_FOLLOWING) seg++;
      }
      flowInfo.push({ key: flowIds[ri] + ':' + seg, root: groot });
    }
    var flowMembers = new Map();
    for (var gj = 0; gj < flowInfo.length; gj++) {
      var mk = flowInfo[gj].key;
      var list = flowMembers.get(mk);
      if (list) list.push(gj); else flowMembers.set(mk, [gj]);
    }
    // A flow's own leading and trailing whitespace never paints -- the browser
    // strips it -- so it is stripped here rather than travelling into the run
    // text and reappearing as an invented indent when the runs are rejoined.
    flowMembers.forEach(function (members) {
      if (members.length < 2) return;
      var first = nodes[members[0]];
      first.flow = first.flow.replace(/^ +/, '');
      var last = nodes[members[members.length - 1]];
      last.flow = last.flow.replace(/ +$/, '');
    });
    // BUG-187 -- every element some OTHER run is nested inside. An element that
    // holds one text node of its own and a styled child with its own run --
    // <p>F<span>or over 20 years</span></p> -- is not that one run's box: its
    // contents are the whole paragraph, so "F" was recorded at 667x157 against a
    // reproduction that paints the glyph in a span of its own at 11x22. Walking
    // up from each run's element stops at the first ancestor already marked,
    // because everything above it was marked by the same walk.
    var nestsRun = new Set();
    for (var ni = 0; ni < nodes.length; ni++) {
      var up = nodes[ni].el.parentElement;
      while (up && !nestsRun.has(up)) { nestsRun.add(up); up = up.parentElement; }
    }
    for (var ri2 = 0; ri2 < nodes.length; ri2++) {
      // REQ-302 -- the emitted index the excluded subtree belongs at. Taken here
      // rather than in pass 1 because pass 1 counts CANDIDATE nodes and pass 2
      // decides which of them become runs; the projection needs an index into
      // what was emitted.
      if (meta && ri2 === excludedAtNode && meta.anchor === undefined) meta.anchor = out.length;
      n = nodes[ri2].node;
      var text = nodes[ri2].text;
      var el = nodes[ri2].el;
      // The element's box IS the run's box only while it holds a single run; when
      // it holds several, that shared box says nothing about where this one paints.
      // BUG-187 -- and the same holds when the other run is a descendant's.
      var ownRun = runCounts.get(el) === 1 && !nestsRun.has(el);
      // REQ-366 -- a glyph run reads its type off the pseudo-element that paints
      // it, and its box off the element (the glyph has no text node to measure).
      var glyphSel = nodes[ri2].glyph;
      var s = glyphSel ? getComputedStyle(el, glyphSel) : getComputedStyle(el);
      var glyphs = glyphSel ? absBox(el) : ownRun ? renderedTextBox(el) : textNodeBox(n);
      // REQ-338 (issue 7) -- measured before the box, because the box's
      // half-leading is half of this same line box (see lineBoxOf).
      var pitch = glyphSel ? null : runLinePitch(ownRun ? el : n);
      // REQ-265 -- a run's box is the LINE BOX it occupies. For a block element
      // the border box already is that; for an inline one the rect is the content
      // area, so \lineBoxOf\ converts it (and returns null for every other case,
      // leaving the rect exactly as it was).
      // REQ-333 -- the run's box is the LAYOUT box: a rotated rect is recorded
      // un-inflated, because every consumer reads \`box\` as the space the content
      // occupies and \`transformRotateDeg\` as how that space is then turned.
      var runTf = accTransformOf(el);
      var runBox = layoutBoxOf(el, runTf, glyphSel ? absBox(el) : ownRun ? (lineBoxOf(el, s, pitch) || absBox(el)) : (glyphs || absBox(el)));
      // A text-fill gradient is a background-image gradient clipped to the text
      // (background-clip: text). Capture the raw gradient CSS for TS-side
      // normalization; ignore non-clipped backgrounds (those are band fills).
      var clip = s.webkitBackgroundClip || s.backgroundClip || '';
      var bgImg = s.backgroundImage || 'none';
      var gradientCss = (clip === 'text' && /gradient\\(/.test(bgImg)) ? hexifyGradient(bgImg) : null;
      // A painted left-edge accent bar (border-l-4 border-emerald-400 and kin) —
      // read off the run OR a wrapping ancestor (REQ-58 item 4).
      var accent = accentBarOf(el);
      var blW = accent.width;
      var blColor = accent.color;
      // REQ-338 (issue 7) -- the measured line-box pitch, falling back to the run's
      // own computed line-height where there is only one line to measure (and NaN
      // from there for 'normal', whose used value is a font metric no computed
      // style exposes).
      var lh = pitch !== null ? pitch : parseFloat(s.lineHeight);
      // REQ-35: when the painted colour is unresolvable (transparent / not
      // painted), rgbToHex returns null and we fall back to a sentinel — flag it
      // low-confidence so the values-diff won't hold a re-render to a guess.
      var resolvedColor = rgbToHexA(s.color);
      // REQ-63 — the run's own painted box border (was fields-only). A card /
      // heading hairline or bottom rule is now a comparable value on text runs.
      var runBorder = boxBorderOf(s);
      // REQ-211 -- the flow, recorded only where there IS one (a single-run flow
      // is the ordinary case and gains nothing from being told it is a flow of
      // one). inlineBox is the ROOT's rect, not the run's: rejoined runs lay
      // out inside the block that holds them, and each run's own tight box says
      // where a glyph landed rather than where the sentence may go.
      var flowKey = flowInfo[ri2].key;
      var flowGroup = flowMembers.get(flowKey);
      var inFlow = flowGroup && flowGroup.length > 1;
      out.push({
        role: roleOf(el),
        text: text,
        pseudoGlyph: glyphSel ? glyphSel.slice(2) : undefined,
        inlineGroup: inFlow ? flowKey : undefined,
        inlineIndex: inFlow ? flowGroup.indexOf(ri2) : undefined,
        inlineBox: inFlow ? absBox(flowInfo[ri2].root) : undefined,
        textFlow: inFlow ? nodes[ri2].flow : undefined,
        verticalAlign: (inFlow && s.verticalAlign && s.verticalAlign !== 'baseline') ? s.verticalAlign : undefined,
        whiteSpace: preservedWhiteSpaceOf(s),
        color: resolvedColor || '#000000',
        colorInferred: !resolvedColor,
        fontFamily: familyStack(s.fontFamily),
        fontLoaded: fontLoadedOf(s, primaryFamily(s.fontFamily), text),
        fontSizePx: Math.round(parseFloat(s.fontSize)),
        fontWeight: parseInt(s.fontWeight, 10) || 400,
        // REQ-63 typography treatment axes (null when the no-op default).
        fontStyle: paintedOrNull(s.fontStyle),
        textDecoration: textDecorationOf(s),
        underlineOffsetPx: underlineOffsetOf(s),
        textTransform: paintedOrNull(s.textTransform),
        fontVariant: paintedOrNull(s.fontVariantCaps || s.fontVariant),
        listMarker: listMarkerOf(s),
        // REQ-269 -- two decimals, exactly as letterSpacingPx on the next line.
        // A whole-pixel line-height is a per-line error: leading-relaxed at 18px
        // is 29.25px, and rounding it to 29 walks every wrapped paragraph 0.25px
        // per line off the reference. No gate can see it -- both sides of a diff
        // run this same script, so the error is symmetric and reads as agreement.
        lineHeightPx: isNaN(lh) ? null : Math.round(lh * 100) / 100,
        letterSpacingPx: (s.letterSpacing === 'normal') ? 0 : (Math.round(parseFloat(s.letterSpacing) * 100) / 100 || 0),
        gradientCss: gradientCss,
        borderLeftWidthPx: blW,
        borderLeftColor: blColor,
        // REQ-88 (round 6) — the rect of the element that paints the accent, so a
        // reproduction can place the bar where the reference draws it rather than
        // on the run it happens to sit beside. Null when the run paints its own.
        accentBox: accent.self ? null : accent.box,
        // REQ-58 (item 3b) — card/panel fill behind the run (null when on the band).
        surfaceFill: surfaceFillOf(el),
        // REQ-62 — panel/card GRADIENT fill behind the run (null when the surface
        // is a solid or the run sits on the band). Distinct from surfaceFill.
        surfaceGradientCss: surfaceGradientOf(el),
        // BUG-22 — WHICH box paints that surface, and its shape. The self flag
        // separates a control that paints its own pill from one whose pill is a
        // sibling backing box (an L1 reproduction), so the diff never reads a
        // control's rounding off its label.
        surface: surfaceOf(el),
        paddingLeftPx: Math.round(parseFloat(s.paddingLeft)) || 0,
        // REQ-64 — the other three padding sides + normalized text-align (Type-A).
        paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
        paddingRightPx: Math.round(parseFloat(s.paddingRight)) || 0,
        paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
        textAlign: s.textAlign === 'center' ? 'center'
          : (s.textAlign === 'right' || s.textAlign === 'end') ? 'right'
          : s.textAlign === 'justify' ? 'justify'
          : 'left',
        // REQ-47 per-element geometry / shape / structure (arrangement filled later).
        box: runBox,
        // REQ-58 (T1) — tight rendered-text bounds (glyph extent, padding-excluded).
        renderedTextBox: glyphs,
        borderRadiusPx: borderRadiusOf(s, runBox),
        // REQ-63 — box border on text runs (thickest painted side + style).
        borderWidthPx: runBorder.width,
        borderColor: runBorder.color,
        borderStyle: runBorder.style,
        boxShadow: boxShadowOf(s),
        a11yRole: a11yRoleOf(el),
        // REQ-269 -- the navigation target (see hrefOf), next to the role the same
        // attribute decides. Null when nothing encloses this element in a link.
        href: hrefOf(el),
        // REQ-275 -- and whether that link opens in a new browsing context.
        newTab: newTabOf(el),
        // REQ-269 -- the outline depth a11yRole's single word 'heading' flattens away.
        headingLevel: headingLevelOf(el),
        arrangement: null,
        zIndex: zIndexOf(el),
        paintStack: paintStackOf(el),
        filter: paintedOrNull(s.filter),
        textShadow: paintedOrNull(s.textShadow),
        maskEdge: maskEdgeOf(s),
        // REQ-63 — effects: frosted-glass, blend, opacity, outline, pseudo-content.
        backdropFilter: paintedOrNull(s.backdropFilter || s.webkitBackdropFilter),
        blendMode: paintedOrNull(s.mixBlendMode),
        opacity: opacityOf(s),
        outline: outlineOf(s),
        pseudo: pseudoOf(el),
        // REQ-333 -- the transform that PAINTS this run, ancestors included (see
        // accTransformOf). A run inside a tilted card is tilted. BUG-153 (item 1)
        // -- absent, and flagged, when that chain could not be decomposed.
        ...transformFields(runTf),
        motion: motionOf(s),
        // REQ-332 -- where this element is cut off, if anything cuts it off.
        clip: clipOf(el),
        // REQ-377 -- what pins this run to the viewport, if anything does.
        sticky: stickyOf(el),
      });
    }
    // REQ-302 -- an exclusion after the last emitted run anchors at the end,
    // which is where it already was. Set unconditionally when nothing set it in
    // the loop, so 'anchor' is present whenever an exclusion was seen at all.
    if (meta && excludedAtNode !== -1 && meta.anchor === undefined) meta.anchor = out.length;
    return out;
  }

  // REQ-47 — text-free rendered elements (form controls, dividers) under a root,
  // in document order, skipping excluded subtrees. These have no text join key,
  // so they carry their a11y role + accessible-name source for role+order pairing.
  // REQ-48 (item 4) -- capture descends into media children too. Montage/collage
  // photos are text-free and are not form controls, so pre-REQ-48 capture dropped
  // them entirely (items:[]), leaving nothing for the diff to compare while it
  // reported "matched". img is text-free like a field, so it pairs on a11yRole +
  // document order; its object-fit + intrinsic aspect catch circle-as-ellipse.
  // BUG-27 -- and painted CSS background-image boxes at ANY depth. A background
  // image is text-free and is not a control, so it pairs the same way a media
  // element does (a11yRole + document order); it carries the image handle as
  // backgroundImageUrl rather than src, because it paints a SURFACE behind
  // content, not replaced content in flow.
  // REQ-370 -- an inline <svg> that is only a solid RECTANGLE covering itself.
  //
  // The capture models no vector leaf (coverage.ts: fill/stroke not-expressible),
  // which is right for an icon and wrong for this: Zyro paints a testimonial
  // card's panel as \`<svg preserveAspectRatio="none" viewBox="0 0 80 80"><path
  // d="M0 0H80V80H0V0Z"/></svg>\` filled from a CSS variable, over a div with no
  // background. Nothing read a background colour, so the capture recorded nothing
  // 606px wide, and white review copy reproduced on the band's grey (hearingzone510
  // .com: 44.90% of the ranked score at zero deltas). A rectangle that covers its
  // own box IS a box, which L1 already expresses.
  //
  // Returns the shape's opaque fill as #rrggbb, or null for anything else: more
  // than one shape, a shape that does not cover the viewBox, an aspect ratio the
  // viewBox would letterbox, a gradient/pattern fill, a translucent fill.
  var SVG_RECT_PATH = /^M\\s*0[\\s,]+0\\s*H\\s*([\\d.]+)\\s*V\\s*([\\d.]+)\\s*H\\s*0\\s*(?:V\\s*0\\s*)?Z$/i;
  function svgPanelFillOf(svg) {
    var shapes = [];
    var kids = svg.children;
    for (var i = 0; i < kids.length; i++) {
      var t = kids[i].tagName.toLowerCase();
      if (t === 'title' || t === 'desc' || t === 'defs') continue;
      shapes.push(kids[i]);
    }
    if (shapes.length !== 1) return null;
    var shape = shapes[0];
    var vb = (svg.getAttribute('viewBox') || '').trim().split(/[\\s,]+/).map(parseFloat);
    if (vb.length !== 4 || vb[0] !== 0 || vb[1] !== 0 || !(vb[2] > 0) || !(vb[3] > 0)) return null;
    var tag = shape.tagName.toLowerCase();
    var w = null, h = null;
    if (tag === 'rect') {
      if ((parseFloat(shape.getAttribute('x')) || 0) !== 0 || (parseFloat(shape.getAttribute('y')) || 0) !== 0) return null;
      var rw = shape.getAttribute('width') || '', rh = shape.getAttribute('height') || '';
      w = rw === '100%' ? vb[2] : parseFloat(rw);
      h = rh === '100%' ? vb[3] : parseFloat(rh);
    } else if (tag === 'path') {
      var m = SVG_RECT_PATH.exec((shape.getAttribute('d') || '').trim());
      if (m) { w = parseFloat(m[1]); h = parseFloat(m[2]); }
    }
    if (w === null || h === null || Math.abs(w - vb[2]) > 0.01 || Math.abs(h - vb[3]) > 0.01) return null;
    var box = svg.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return null;
    if ((svg.getAttribute('preserveAspectRatio') || '').trim() !== 'none' &&
        Math.abs(box.width / box.height - vb[2] / vb[3]) > 0.01 * (vb[2] / vb[3])) return null;
    var ss = getComputedStyle(shape);
    var fill = rgbaOf(ss.fill);
    if (!fill || fill[3] < 0.999) return null;
    var fo = parseFloat(ss.fillOpacity);
    if (!isNaN(fo) && fo < 0.999) return null;
    return rgbToHex(ss.fill);
  }
  // REQ-380 (issue 3) -- an inline <svg> that is the ONLY ink of a link or button.
  //
  // REQ-370 left every SVG but a rectangle panel unrecorded, which is right for a
  // decorative glyph beside its own label and wrong for this: a footer's social
  // links are each an <a href> holding a 24x24 <svg> and nothing else, so the
  // capture held no element, no href and no name for any of them, and the
  // reproduction painted the bare band where the reference has four white icons
  // (bluelotusintegralhealing.com: 14.2% of the ranked score at zero deltas).
  //
  // The icon is recorded as a MEDIA field -- the record an <img> gets -- whose
  // src names a bundle asset the pipeline writes from \`svgMarkup\`, so the fold
  // emits the linked image leaf it already knows how to make. Returns the host,
  // or null when the host has copy or other media of its own (then the SVG is a
  // decoration beside it, and stays unrecorded as before).
  var ICON_HOST_SEL = 'a[href], button, [role="button"], [role="link"]';
  function svgIconHostOf(svg) {
    var host = svg.parentElement && svg.parentElement.closest ? svg.parentElement.closest(ICON_HOST_SEL) : null;
    if (!host || host.querySelectorAll('svg').length !== 1 || host.querySelector('img')) return null;
    var walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    for (var tn = walker.nextNode(); tn; tn = walker.nextNode()) {
      if (!svg.contains(tn) && trimWs(collapseWs(tn.nodeValue))) return null;
    }
    return host;
  }
  // The paint an icon takes from the page's CSS, written onto each node as a
  // presentation attribute so the markup paints the same with no stylesheet
  // around it -- above all \`fill: currentColor\`, which resolves against the
  // link's colour and would otherwise turn black.
  var SVG_PAINT_PROPS = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width',
    'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'opacity'];
  function svgIconMarkupOf(svg) {
    var clone = svg.cloneNode(true);
    var from = [svg].concat(Array.prototype.slice.call(svg.querySelectorAll('*')));
    var to = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
    for (var i = 0; i < from.length; i++) {
      var cs = getComputedStyle(from[i]);
      var read = false;
      for (var p = 0; p < SVG_PAINT_PROPS.length; p++) {
        var v = cs.getPropertyValue(SVG_PAINT_PROPS[p]);
        if (v) { to[i].setAttribute(SVG_PAINT_PROPS[p], v); read = true; }
      }
      to[i].removeAttribute('class');
      if (read) to[i].removeAttribute('style');
    }
    // XMLSerializer writes the SVG namespace onto the root itself.
    var color = getComputedStyle(svg).color;
    if (color) clone.setAttribute('color', color);
    return new XMLSerializer().serializeToString(clone);
  }
  // FNV-1a: the asset name is the markup's own hash, so every width of the ladder
  // that sees the same icon names the same file.
  function hash32(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function svgIconOf(svg) {
    var host = svgIconHostOf(svg);
    if (!host) return null;
    var markup = svgIconMarkupOf(svg);
    var title = svg.querySelector('title');
    var name = (host.getAttribute('aria-label') || host.getAttribute('title') ||
      (title ? title.textContent : '') || '');
    return { src: 'assets/inline-svg-' + hash32(markup) + '.svg', markup: markup, alt: collapseText(name) };
  }
  function fieldsUnder(root, excludes) {
    var out = [];
    var cands = [];
    var els = root.querySelectorAll('input, textarea, select, hr, img');
    for (var ci = 0; ci < els.length; ci++) cands.push({ el: els[ci], bgUrl: null });
    var bgs = backdropBoxes();
    var added = 0;
    // REQ-370 -- an inline SVG that is only a filled rectangle (svgPanelFillOf).
    var svgs = root.querySelectorAll('svg');
    for (var si = 0; si < svgs.length; si++) {
      var panelFill = svgPanelFillOf(svgs[si]);
      // REQ-380 -- or the only ink of a link (svgIconOf).
      var icon = panelFill ? null : svgIconOf(svgs[si]);
      if (!panelFill && !icon) continue;
      cands.push({ el: svgs[si], bgUrl: null, fill: panelFill, icon: icon });
      added++;
    }
    // REQ-366 -- an empty element whose only ink is a border rule (borderRuleOf).
    var empties = root.querySelectorAll(':empty');
    for (var ei = 0; ei < empties.length; ei++) {
      if (!borderRuleOf(empties[ei])) continue;
      cands.push({ el: empties[ei], bgUrl: null });
      added++;
    }
    for (var bi = 0; bi < bgs.length; bi++) {
      var bel = bgs[bi].el;
      // The band's OWN background is already the section's background (a band root
      // is excluded from querySelectorAll too) -- emitting it again would fold a
      // duplicate box over the section backdrop.
      if (bel === root || !root.contains(bel)) continue;
      if (/^(input|textarea|select|hr|img)$/.test(bel.tagName.toLowerCase())) continue;
      cands.push({ el: bel, bgUrl: bgs[bi].url });
      added++;
    }
    // Each source is document-ordered; their concatenation is not.
    if (added > 0) {
      cands.sort(function (a, b) {
        if (a.el === b.el) return 0;
        return (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
      });
    }
    for (var i = 0; i < cands.length; i++) {
      var el = cands[i].el;
      var bgUrl = cands[i].bgUrl;
      if (el.type === 'hidden') continue;
      if (!visible(el)) continue;
      if (moduleInvariant(el)) continue;
      // REQ-380 -- except an icon link: a row of identical icon links is very
      // often the band's repeated-item group itself, and an item records only its
      // text runs, so excluding the icon there would lose it by construction.
      if (excludes && !cands[i].icon && insideAny(el, excludes)) continue;
      var s = getComputedStyle(el);
      var an = accessibleNameOf(el);
      var isImg = el.tagName.toLowerCase() === 'img';
      var intrinsicAspect = (isImg && el.naturalHeight > 0)
        ? Math.round((el.naturalWidth / el.naturalHeight) * 100) / 100
        : null;
      // REQ-333 -- the painted transform (ancestors included) and the layout box it
      // inflated, then the FRAME this image is cropped and ringed by.
      // REQ-347 -- and a framed image's box is the FRAME's border box, not the
      // \`<img>\`'s content box inside it: the ring, the radius and the crop are all
      // measured on the wrapper, so the rect they are written onto has to be the
      // wrapper's too or the ring paints a border-width inside where it belongs.
      var fieldTf = accTransformOf(el);
      var frame = isImg ? frameOf(el) : null;
      var fieldBox = frame ? frame.box : layoutBoxOf(el, fieldTf);
      var fieldBorder = frame ? { width: frame.borderWidthPx, color: frame.borderColor, style: frame.borderStyle } : boxBorderOf(s);
      // REQ-308 -- the control's own type (see controlTypographyOf). Null for
      // every text-free element that is not a form control.
      var fieldType = controlTypographyOf(el, s);
      // REQ-380 -- an icon link's SVG (svgIconOf) is recorded as media: its box
      // gives the aspect an <img> would report from its natural size.
      var iconRec = cands[i].icon || null;
      if (iconRec && fieldBox && fieldBox.height > 0) intrinsicAspect = Math.round((fieldBox.width / fieldBox.height) * 100) / 100;
      var fieldRecord = {
        box: fieldBox,
        borderRadiusPx: frame ? frame.borderRadiusPx : borderRadiusOf(s, fieldBox),
        borderWidthPx: fieldBorder.width,
        borderColor: fieldBorder.color,
        borderStyle: fieldBorder.style,
        boxShadow: frame && frame.boxShadow ? frame.boxShadow : boxShadowOf(s),
        a11yRole: a11yRoleOf(el),
        // REQ-269 -- the navigation target (see hrefOf), next to the role the same
        // attribute decides. Null when nothing encloses this element in a link.
        href: hrefOf(el),
        // REQ-275 -- and whether that link opens in a new browsing context.
        newTab: newTabOf(el),
        // REQ-269 -- the outline depth a11yRole's single word 'heading' flattens away.
        headingLevel: headingLevelOf(el),
        arrangement: null,
        zIndex: zIndexOf(el),
        paintStack: paintStackOf(el),
        filter: paintedOrNull(s.filter),
        textShadow: paintedOrNull(s.textShadow),
        maskEdge: maskEdgeOf(s) || (frame ? frame.maskEdge : null),
        // REQ-63 — effects: frosted-glass, blend, opacity, outline, pseudo-content.
        backdropFilter: paintedOrNull(s.backdropFilter || s.webkitBackdropFilter),
        blendMode: paintedOrNull(s.mixBlendMode),
        opacity: opacityOf(s),
        outline: outlineOf(s),
        pseudo: pseudoOf(el),
        // BUG-153 (item 1) -- absent, and flagged, when the chain could not be read.
        ...transformFields(fieldTf),
        motion: motionOf(s),
        // REQ-332 -- where this element is cut off, if anything cuts it off.
        // REQ-347 -- read at the FRAME when there is one, for the same reason its
        // box is: the wrapper is the element that crops, and a clip box measured on
        // the picture inside it is smaller than the box now recorded, which would
        // read as a leaf escaping a region that in fact contains it.
        clip: clipOf(frame ? frame.el : el),
        // REQ-377 -- what pins this element to the viewport, if anything does.
        sticky: stickyOf(frame ? frame.el : el),
        objectFit: isImg ? (s.objectFit || 'fill') : iconRec ? 'contain' : null,
        // REQ-63 — how the image crops within its box (default '50% 50%').
        objectPosition: isImg ? (s.objectPosition || '50% 50%') : null,
        intrinsicAspect: intrinsicAspect,
        // REQ-92 — the media substance an L1 image leaf needs (resolved src + alt).
        src: isImg ? (el.currentSrc || el.src || null) : iconRec ? iconRec.src : null,
        alt: isImg ? (el.alt || '') : iconRec ? iconRec.alt : null,
        // REQ-380 -- the icon's self-contained markup, which the pipeline writes to
        // the bundle as the asset \`src\` names. Never projected into a manifest.
        svgMarkup: iconRec ? iconRec.markup : null,
        // BUG-27 — the painted CSS background image this box carries (absolute URL),
        // null for every other text-free element. Distinct from src: it folds to a
        // box leaf painted BEHIND content, not an image leaf placed in flow.
        backgroundImageUrl: bgUrl,
        // BUG-27 — the element's OWN painted background-color. A backdrop routinely
        // layers an image over a solid (the hero here is a photo over #000000 at
        // opacity .49 -- that black is what darkens it), and capturing the image
        // without the fill under it reproduces the photograph at full brightness.
        // Null when the element paints no fill of its own.
        // REQ-370 -- or, for an SVG rectangle panel, the fill of its one shape.
        surfaceFill: cands[i].fill || rgbToHex(s.backgroundColor),
        accessibleName: an.name,
        nameSource: an.source,
        // REQ-93 — the behavioural facts a mounted behavior module needs and no
        // painted axis can hold: the control's authored input type (the a11y role
        // flattens email/tel/text alike to 'textbox'), and the enclosing form's
        // resolved action (its submission endpoint).
        controlType: controlTypeOf(el),
        formAction: formActionOf(el),
        // REQ-275 -- the rest of the submission contract (see controlNameOf).
        controlName: controlNameOf(el),
        formMethod: formMethodOf(el),
        required: requiredOf(el),
        // REQ-265 -- the one painted value a control carries that no other axis
        // can hold (see placeholderColorOf). Null for anything without one.
        placeholderColor: placeholderColorOf(el),
        // REQ-269 -- the per-side padding, read exactly as the text-run path 90
        // lines above reads it. A control's padding IS its content inset; without
        // it the renderer's zero-look reset governs and the placeholder paints
        // against the field's edge.
        paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
        paddingRightPx: Math.round(parseFloat(s.paddingRight)) || 0,
        paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
        paddingLeftPx: Math.round(parseFloat(s.paddingLeft)) || 0,
      };
      // REQ-308 -- written onto the control's EXISTING text axes rather than
      // under a parallel \`placeholder*\` name, because that is where L1 already
      // keeps them: \`l1ControlAxesSchema\` is the text axes plus
      // \`placeholderColor\`, so the fold writes them and the renderer emits them
      // with no new axis anywhere. Set only for a form control, so a media or
      // backdrop record keeps the empty/zero constants it has always carried.
      if (fieldType) {
        fieldRecord.fontFamily = fieldType.fontFamily;
        fieldRecord.fontSizePx = fieldType.fontSizePx;
        fieldRecord.fontWeight = fieldType.fontWeight;
        fieldRecord.lineHeightPx = fieldType.lineHeightPx;
      }
      out.push(fieldRecord);
    }
    return out;
  }

  // A control's authored input type: 'textarea'/'select' name themselves; an
  // <input> reports its type attribute (defaulting to 'text'). null otherwise.
  function controlTypeOf(el) {
    var t = el.tagName.toLowerCase();
    if (t === 'textarea' || t === 'select') return t;
    if (t === 'input') return (el.getAttribute('type') || 'text').toLowerCase();
    return null;
  }
  // The enclosing <form>'s submission endpoint, resolved against the document
  // (el.form.action is already absolute). Empty/absent -> null.
  function formActionOf(el) {
    var form = el.form || (el.closest ? el.closest('form') : null);
    if (!form) return null;
    var raw = form.getAttribute('action');
    if (raw == null || raw.trim() === '') return null;
    return form.action || raw;
  }
  // REQ-275 -- the three submission facts beside the two REQ-93 already records.
  // All three came out of '1c capture audit' as used-and-undecided on the one
  // stored reference that has a form, and each is invisible to every pixel gate
  // there is: a reproduction can match the reference to the last pixel while
  // posting the wrong keys, to the wrong verb, with no field the browser insists
  // on. formActionOf alone was never the whole endpoint.

  // The control's SUBMISSION KEY. The fold slugifies the visible label to invent
  // one, which is a guess that reads well and submits 'your-email' where the
  // reference's handler expects 'email'.
  function controlNameOf(el) {
    var raw = el.getAttribute ? el.getAttribute('name') : null;
    return raw == null || raw.trim() === '' ? null : raw.trim();
  }
  // The enclosing form's VERB, upper-cased. A form whose handler expects a POST
  // and receives a GET puts every answer in the URL and loses the submission.
  function formMethodOf(el) {
    var form = el.form || (el.closest ? el.closest('form') : null);
    if (!form) return null;
    var raw = (form.getAttribute('method') || '').trim().toUpperCase();
    return raw === 'POST' ? 'POST' : 'GET';
  }
  // Whether the browser itself refuses to submit without this field. Both the
  // attribute and the ARIA mirror count: a custom control states it with
  // aria-required, and both carry the same invisible obligation.
  function requiredOf(el) {
    if (!el.getAttribute) return null;
    if (el.hasAttribute('required')) return true;
    var aria = (el.getAttribute('aria-required') || '').trim().toLowerCase();
    return aria === 'true' ? true : false;
  }

  // Repeated sub-units within a band (cards): the first sibling group of >=2
  // visible elements sharing tag+class (DOC-13 §4). Returns the group's root
  // elements (to exclude from band content) and each item's flattened runs.
  function itemGroup(root) {
    var containers = root.querySelectorAll('*');
    for (var i = 0; i < containers.length; i++) {
      var kids = Array.prototype.filter.call(containers[i].children, visible);
      if (kids.length < 2) continue;
      var sig = kids[0].tagName + '.' + kids[0].className;
      var uniform = kids.every(function (k) { return k.tagName + '.' + k.className === sig; });
      if (uniform) return { roots: kids, items: kids.map(function (k) { return runsUnder(k, null); }) };
    }
    return { roots: [], items: [] };
  }
  // REQ-302 -- the band's content runs, plus the index within them where the
  // repeated-item rows belong. One call, so the walk that produces the runs is
  // the same walk that locates the hole they were lifted out of.
  function contentWithItemAnchor(band, itemRoots) {
    var meta = {};
    var content = runsUnder(band, itemRoots, meta);
    return { content: content, itemsAt: meta.anchor };
  }

  // ── colors ────────────────────────────────────────────────────────────────
  var colorMap = {};
  function bump(hex, usage) {
    if (!hex) return;
    var key = hex + '|' + usage;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }
  var all = document.body.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (!visible(el)) continue;
    var cs = getComputedStyle(el);
    if ((el.textContent || '').trim()) bump(rgbToHex(cs.color), 'text');
    bump(rgbToHex(cs.backgroundColor), 'background');
  }
  var colorUsage = Object.keys(colorMap)
    .map(function (k) { var parts = k.split('|'); return { hex: parts[0], usage: parts[1], freq: colorMap[k] }; })
    .sort(function (a, b) { return b.freq - a.freq; });

  // ── bands ─────────────────────────────────────────────────────────────────
  var bodyBg = rgbToHex(getComputedStyle(document.body).backgroundColor) || '#ffffff';
  // REQ-271 -- the tone a band is READ AGAINST, which is a different question
  // from what the band PAINTS and must not be answered with the same value.
  //
  // A band that paints no fill of its own used to be recorded as an opaque
  // bodyBg fill, and colorScheme was then decided on that fabricated colour:
  // gigabytealchemy's <header> -- whose only runs sit over a dark photograph
  // under a 30% navy scrim -- came out 'light' on the strength of a white
  // nobody painted. surfaceFillOf already answers the real question: it
  // composites down the GEOMETRIC surface chain, so a sibling that merely sits
  // behind the band counts (exactly the header-over-hero shape), and it starts
  // with the band's own fill when the band has one. bodyBg stays as the last
  // resort -- a page that paints nothing anywhere is read against the UA canvas.
  function bandTone(el) {
    return surfaceFillOf(el) || bodyBg;
  }
  var bands = [];
  // BUG-27 — qualify and box each candidate on the PAINTED EXTENT of its subtree.
  // A collapsed-but-painting band (an absolutely-positioned header) reads 0px tall
  // on its own box and was dropped whole; its extent is the nav bar it actually
  // paints. A conventional band is unaffected — its children sit inside its box,
  // so the extent IS its own box.
  var children = [];
  var childExtents = [];
  Array.prototype.forEach.call(document.body.children, function (c) {
    if (c.tagName === 'SCRIPT' || c.tagName === 'STYLE') return;
    var ext = paintedExtent(c);
    if (!ext || ext.height < 8) return;
    children.push(c);
    childExtents.push(ext);
  });
  // BUG-15 — a flat, absolutely-positioned layout (the L1 substrate) nests all
  // content beneath a wrapper that collapses to ZERO height (its abs-positioned
  // children leave no in-flow box), so the top-level >=8px scan finds NO bands and
  // the actual manifest comes back empty. Every reference element then reads
  // "missing (present -> absent)" and the diff freezes — byte-identical no matter
  // what we rendered. When the top-level scan is empty yet the body still paints
  // content, fall back to one body-spanning band so runsUnder / fieldsUnder /
  // itemGroup still collect the flat tree (paired downstream by text). Semantic
  // sites always have real >=8px top-level bands, so this never fires for them.
  var bandRoots = children.map(function (el, ci) { return { el: el, box: childExtents[ci] }; });
  if (bandRoots.length === 0) {
    bandRoots = [{ el: document.body, box: { x: 0, y: 0, width: docW, height: docH } }];
  }
  // REQ-269 / REQ-334 -- a band root that is really the whole PAGE is segmented
  // geometrically (see bandSlicesIn) rather than emitted as one band.
  //
  // REQ-269 asked this of the DOCUMENT: it fired only where the top-level scan had
  // degenerated to a single body-spanning child, which is the shape every L1
  // reproduction has and almost no authored page does. That is the wrong question
  // for the commonest page on the web. An Elementor / Divi / Gutenberg <body> has
  // THREE children -- <header>, one full-page wrapper <div>, <footer> -- so the
  // count test failed and joyfulculinarycreations.com's 4440px wrapper was emitted
  // whole, carrying its own (transparent) background as the band's fill: two
  // sections, both background 'none', for a page painting a photographic hero,
  // three grey bands, a white band and a yellow footer. Nothing downstream can
  // compare a band that is not in the list, and all twelve of that round's
  // unmeasured axes traced to this one cause.
  //
  // Asked per ROOT the answer is unchanged wherever REQ-269 already answered -- a
  // lone body-spanning root still qualifies -- and right on the page-builder shape:
  // the wrapper is sliced, while the header and footer stay exactly as the
  // top-level scan found them. A root that genuinely is one band is unaffected,
  // because bandSlicesIn returns [] rather than inventing a second slice.
  //
  // 'Really the whole page' is full layout width and most of the document height.
  // A hero, a footer or a testimonial band is full-bleed too, and slicing one of
  // those would report its inner cards as sections; only a root tall enough to BE
  // the page is a wrapper standing in for the body.
  var PAGE_ROOT_HEIGHT_RATIO = 0.6;
  function slicesForRoot(br) {
    if (br.box.width < layoutW - 2) return [];
    if (br.box.height < docH * PAGE_ROOT_HEIGHT_RATIO) return [];
    var sl = bandSlicesIn(br.el, br.box);
    return sl.length > 1 ? sl : [];
  }

  // The geometric path for one page-wide root: its content is collected ONCE from
  // the root and partitioned by geometry, rather than per slice. A slice is not a
  // DOM subtree -- on the flat-tree (L1 reproduction) shape every run is a sibling
  // of every other, so a per-slice DOM walk would collect the whole root into each.
  function pushGeometricBands(rootEl, slices) {
    var flatGrp = itemGroup(rootEl);
    var flatContent = runsUnder(rootEl, flatGrp.roots);
    var flatFields = fieldsUnder(rootEl, flatGrp.roots);
    assignArrangement(flatContent.concat(flatFields));
    var perSlice = slices.map(function () { return { content: [], fields: [], items: [] }; });
    flatContent.forEach(function (r) { perSlice[sliceIndexFor(r.box, slices)].content.push(r); });
    flatFields.forEach(function (f) { perSlice[sliceIndexFor(f.box, slices)].fields.push(f); });
    // REQ-302 -- no itemsAt on this path, deliberately. A geometric slice is not
    // a DOM subtree: its runs were collected once from the root and then
    // PARTITIONED by box, so "the index this row sits at within this slice's
    // content" is not a question the walk answered. The projection appends,
    // which is what it did before and is the only truthful answer here.
    flatGrp.roots.forEach(function (itemRoot, ri) {
      perSlice[sliceIndexFor(absBox(itemRoot), slices)].items.push(flatGrp.items[ri]);
    });
    slices.forEach(function (br, bi) {
      var s = getComputedStyle(br.el);
      // REQ-271 -- the band's OWN painted fill, null when it paints none. Not
      // laundered into bodyBg: a band that paints nothing and a band that paints
      // white are different facts and the bundle has to be able to say which.
      // BUG-161 -- and read off the topmost opaque paint over the slice, not off
      // whichever coincident box the slicer kept. See sliceBackgroundColor.
      var bg = sliceBackgroundColor(br);
      var paintLayer = slicePaintLayer(br);
      bands.push({
        box: br.box,
        backgroundColor: bg,
        backgroundImage: sliceBackgroundImage(br),
        // BUG-161 -- the tone is read against the paint that is actually on top.
        // REQ-271's distinction survives intact: a slice that paints NOTHING still
        // falls through to bandTone, which is what keeps a transparent band from
        // being laundered into an opaque bodyBg. All this changes is the case the
        // fill above changed -- a coincident opaque box over the kept one -- where
        // bandTone would otherwise report the covered box's colour and call a
        // dark-green band 'light'.
        colorScheme: luminance(bg || bandTone(br.el)) < 0.5 ? 'dark' : 'light',
        fontFamily: familyStack(s.fontFamily),
        textAlign: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'right' : 'left',
        paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
        paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
        overlay: overlayInBox(br.box, br.el),
        paint: bandPaintOf(paintLayer.el, paintLayer.box),
        content: perSlice[bi].content,
        items: perSlice[bi].items,
        fields: perSlice[bi].fields,
      });
    });
  }

  bandRoots.forEach(function (br) {
    var slices = slicesForRoot(br);
    if (slices.length > 1) { pushGeometricBands(br.el, slices); return; }
    var band = br.el;
    var s = getComputedStyle(band);
    // REQ-271 -- see the geometric path above: the band's own fill, or null.
    // BUG-179 (item 6) -- or the fill a descendant paints over the whole band.
    var bg = rgbToHex(s.backgroundColor) || coveringDescendantFill(band, br.box);
    var grp = itemGroup(band);
    var bbox = br.box;
    // REQ-302 -- one walk, producing both the content runs and the index each
    // lifted-out item row belongs at. See contentWithItemAnchor / runsUnder.
    var walked = contentWithItemAnchor(band, grp.roots);
    var content = walked.content;
    var itemsAt = grp.items.map(function () {
      return walked.itemsAt === undefined ? content.length : walked.itemsAt;
    });
    var fields = fieldsUnder(band, grp.roots);
    // Arrangement is relative to the previous element in reading order, so text
    // runs and text-free fields must be ordered together (a Subscribe button's
    // predecessor is the email input, not the last paragraph).
    assignArrangement(content.concat(fields));
    bands.push({
      box: bbox,
      backgroundColor: bg,
      backgroundImage: s.backgroundImage || 'none',
      colorScheme: luminance(bandTone(band)) < 0.5 ? 'dark' : 'light',
      fontFamily: familyStack(s.fontFamily),
      textAlign: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'right' : 'left',
      paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
      paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
      overlay: overlayOf(band, bbox),
      paint: bandPaintOf(band, bbox),
      content: content,
      items: grp.items,
      itemsAt: itemsAt,
      fields: fields,
    });
  });

  // ── type scale & spacing ───────────────────────────────────────────────────
  var sizes = {};
  bands.forEach(function (b) { b.content.forEach(function (r) { sizes[r.fontSizePx] = 1; }); });
  var typeScale = Object.keys(sizes).map(Number).sort(function (a, b) { return a - b; });

  var spacing = {};
  bands.forEach(function (b) { spacing[b.paddingTopPx] = 1; spacing[b.paddingBottomPx] = 1; });
  var spacingScalePx = Object.keys(spacing).map(Number).filter(function (n) { return n > 0; })
    .sort(function (a, b) { return a - b; });

  // ── container width ─────────────────────────────────────────────────────────
  var containerMaxWidthPx = null;
  for (var j = 0; j < all.length; j++) {
    if (!visible(all[j])) continue;
    var mw = getComputedStyle(all[j]).maxWidth;
    if (mw && mw.endsWith('px')) {
      var v = parseFloat(mw);
      if (v > 0 && (containerMaxWidthPx === null || v < containerMaxWidthPx)) containerMaxWidthPx = v;
    }
  }

  // ── images ──────────────────────────────────────────────────────────────────
  var images = [];
  Array.prototype.forEach.call(document.images, function (img) {
    if (!visible(img)) return;
    images.push({
      src: img.currentSrc || img.src,
      width: img.naturalWidth,
      height: img.naturalHeight,
      alt: img.alt || '',
      role: /logo/i.test(img.className + ' ' + img.alt) ? 'logo' : 'image',
    });
  });

  // ── @font-face rules ──────────────────────────────────────────────────────
  var fontFaces = [];
  for (var s2 = 0; s2 < document.styleSheets.length; s2++) {
    var rules;
    try { rules = document.styleSheets[s2].cssRules; } catch (e) { continue; }
    if (!rules) continue;
    for (var r2 = 0; r2 < rules.length; r2++) {
      var rule = rules[r2];
      if (!(rule instanceof CSSFontFaceRule)) continue;
      var fam = primaryFamily(rule.style.getPropertyValue('font-family'));
      var src = rule.style.getPropertyValue('src') || '';
      var urls = [];
      var re = /url\\((['"]?)([^'")]+)\\1\\)/g, mm;
      while ((mm = re.exec(src))) urls.push(new URL(mm[2], location.href).href);
      // REQ-332 — the DESCRIPTORS, not just the family. A face's weight and style
      // are what bind a file to the glyphs it actually holds; read only the family
      // and every face of a family claims (normal, 400), so the italic file is
      // declared as the normal one and every weight but the first is unreachable.
      // A "font-weight: 200 800" descriptor is a variable face's range, so both
      // numbers are kept; "oblique" is a slanted face by another name.
      var fwNums = (rule.style.getPropertyValue('font-weight') || '').match(/\\d+/g) || [];
      var w = fwNums.length ? parseInt(fwNums[0], 10) : NaN;
      var wMax = fwNums.length > 1 ? parseInt(fwNums[1], 10) : NaN;
      var fs = (rule.style.getPropertyValue('font-style') || '').trim().toLowerCase();
      fontFaces.push({
        family: fam,
        srcUrls: urls,
        weight: isNaN(w) ? null : w,
        weightMax: isNaN(wMax) ? null : wMax,
        style: fs.indexOf('italic') === 0 || fs.indexOf('oblique') === 0 ? 'italic' : fs ? 'normal' : null,
      });
    }
  }

  return {
    viewport: { width: window.innerWidth, height: docH },
    bands: bands,
    colorUsage: colorUsage,
    fontFaces: fontFaces,
    typeScale: typeScale,
    spacingScalePx: spacingScalePx,
    containerMaxWidthPx: containerMaxWidthPx,
    images: images,
    bodyBackground: bodyBg,
    // REQ-166 - the document title is what the browser tab showed. Trimmed
    // because a padded title is still a title, and the empty string is the
    // honest answer for a page that declares none (callers fall back to host).
    // NO BACKTICKS ANYWHERE IN HERE: this whole script is a template literal,
    // so one in a comment ends the string and the rest becomes TypeScript.
    title: (document.title || '').trim(),
    // REQ-377 - the scroll this read was taken at. Every box above is
    // r.top + window.scrollY, which is wrong for a stuck box unless this is 0.
    scrollY: window.scrollY || window.pageYOffset || 0,
  };
})()`
