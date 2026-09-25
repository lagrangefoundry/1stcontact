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
import type { Box, SurfaceShape } from './types'

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
  /** REQ-48 (item 3) — computed `filter` when painted, else null. */
  filter: string | null
  /** REQ-48 (item 3) — computed `text-shadow` when painted, else null. */
  textShadow: string | null
  /** REQ-48 (item 3) — computed `mask-image` or `clip-path` when the element is masked/clipped, else null. */
  maskEdge: string | null
  /** REQ-48 (item 1) — transform rotation in degrees, decomposed from the matrix (0 when none). */
  transformRotateDeg: number
  /** REQ-48 (item 1) — transform uniform scale, decomposed from the matrix (1 when none). */
  transformScale: number
  /** REQ-48 (item 1) — declared motion: animation / transition / both / null. */
  motion: 'animation' | 'transition' | 'both' | null
}

/** A single visible text run with its exact painted styling. */
export interface RawRun extends RawGeometry {
  role: 'heading' | 'subheading' | 'body' | 'link' | 'action' | 'listitem'
  text: string
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
  /** Full-bleed translucent overlay painted over the band (a hero scrim), else null. */
  overlay: { color: string; opacity: number } | null
  /** Content block's vertical centre as a fraction of band height (0=top…1=bottom), or null if textless. */
  contentAnchorRatio: number | null
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
}

export const EXTRACT_SCRIPT = `(() => {
  var DOC = document.documentElement;
  var docW = DOC.scrollWidth, docH = DOC.scrollHeight;

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
  // care about translucency use rgbaOf + composite() instead. Contract preserved
  // for every existing caller (text/border colour resolution).
  function rgbToHex(str) {
    var c = rgbaOf(str);
    if (!c || c[3] === 0) return null;
    return '#' + h2(c[0]) + h2(c[1]) + h2(c[2]);
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
  function lineBoxOf(el, s) {
    if (s.display !== 'inline') return null;
    var lh = parseFloat(s.lineHeight);
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
        if (!(b.x <= BACKDROP_EDGE_TOL && b.x + b.width >= docW - BACKDROP_EDGE_TOL)) continue;
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
      if ((!fill || fill[3] <= 0) && !hasBar && !hasImage) continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var b = absBox(el);
      if (b.width <= 0 || b.height <= 0) continue;
      SURFACE_INDEX.push({ el: el, box: b, area: b.width * b.height });
    }
    SURFACE_INDEX.sort(function (a, b) { return a.area - b.area; });
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
  function collapseText(t) { return (t || '').replace(/\\s+/g, ' ').trim(); }
  // Largest painted corner radius (px). Rounded-vs-square is visually obvious but
  // tiny in pixels, so it is captured as an explicit rendered value, not left to
  // an image diff to (barely) see.
  function borderRadiusOf(s) {
    var vals = [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius];
    var max = 0;
    for (var i = 0; i < vals.length; i++) { var v = parseFloat(vals[i]); if (!isNaN(v) && v > max) max = v; }
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
        var c = rgbToHex(cs.borderLeftColor);
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
        var c = rgbToHex(s['border' + sides[i] + 'Color']);
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
      return w + 'px ' + st + ' ' + (rgbToHex(s.outlineColor) || '');
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
  function zIndexOf(s) {
    var z = parseInt(s.zIndex, 10);
    return isNaN(z) ? 0 : z;
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
    var m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return { rotate: 0, scale: 1 };
    var p = m[1].split(',');
    var a = parseFloat(p[0]), b = parseFloat(p[1]);
    if (isNaN(a) || isNaN(b)) return { rotate: 0, scale: 1 };
    return {
      rotate: Math.round(Math.atan2(b, a) * 180 / Math.PI),
      scale: Math.round(Math.sqrt(a * a + b * b) * 100) / 100,
    };
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
  //   - anything but http/https -> null. mailto:/tel:/javascript: are all
  //     refused by the L1 URL allowlist (isSafeUrl), so recording one would fold a
  //     document the validator then rejects.
  function hrefOf(el) {
    var a = el.closest ? el.closest('a[href]') : null;
    if (!a) return null;
    var raw = a.getAttribute('href');
    if (raw == null || raw.trim() === '') return null;
    raw = raw.trim();
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
  function semanticOf(el) {
    if (!el.closest) return el;
    var anc = el.closest('[role],a[href],button,h1,h2,h3,h4,h5,h6,input,textarea,select,img,hr');
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
    var src = css.replace(/url\([^)]*\)/g, '');
    var re = /(rgba?\([^)]*\)|hsla?\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|#[0-9a-fA-F]{3,8})/g;
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
  function scrimOf(el) {
    var cs = getComputedStyle(el);
    var c = rgbaOf(cs.backgroundColor);
    if (c && c[3] > 0 && c[3] < 1) {
      return { color: '#' + hx(c[0]) + hx(c[1]) + hx(c[2]), opacity: Math.round(c[3] * 100) / 100 };
    }
    return gradientScrim(cs.backgroundImage);
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
      if (!best || cover > best.cover) {
        best = { color: sc.color, opacity: sc.opacity, cover: cover };
      }
    }
    return best ? { color: best.color, opacity: best.opacity } : null;
  }

  // Vertical content anchor: the centre of the band's text content as a fraction
  // of band height. Measured from where the text landed, not from padding or
  // flex classes, so a low-anchored hero (pt-80 or justify-end) reads the same.
  function anchorRatioOf(band, bbox) {
    if (bbox.height <= 0) return null;
    var walker = document.createTreeWalker(band, NodeFilter.SHOW_TEXT, null);
    var n, top = Infinity, bot = -Infinity, any = false;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue.replace(/\\s+/g, ' ').trim()) continue;
      var el = n.parentElement;
      if (!el || !visible(el)) continue;
      var r = absBox(el);
      if (r.y < top) top = r.y;
      if (r.y + r.height > bot) bot = r.y + r.height;
      any = true;
    }
    if (!any) return null;
    var ratio = ((top + bot) / 2 - bbox.y) / bbox.height;
    return Math.round(Math.max(0, Math.min(1, ratio)) * 100) / 100;
  }

  // REQ-269 -- the geometric twins of overlayOf / anchorRatioOf, and the slice
  // derivation they serve.
  //
  // Both functions above answer their question by walking DOM DESCENDANTS of a
  // band root. That proxy only holds when the band really is an ancestor of what
  // it paints behind, which is true of a conventional page and false of an L1
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
  // nested page (an ancestor contains its descendants), so nothing here changes
  // what a reference capture reports -- the whole path is reached only when the
  // top-level scan has already degenerated to one body-spanning band.

  // The full-bleed painted slices of the document, in document order, with the
  // vertical gaps between them filled so no painted content falls outside every
  // slice. Returns [] when fewer than two slices can be found, which is the
  // honest answer for a page that really is one band.
  function bandSlices() {
    var bgs = backdropBoxes();
    var cand = [];
    for (var i = 0; i < bgs.length; i++) {
      var b = absBox(bgs[i].el);
      if (b.height < BACKDROP_MIN_HEIGHT) continue;
      if (!(b.x <= BACKDROP_EDGE_TOL && b.x + b.width >= docW - BACKDROP_EDGE_TOL)) continue;
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
    var cursor = 0;
    for (var m = 0; m < kept.length; m++) {
      var bx = kept[m].box;
      var start = Math.max(bx.y, cursor);
      var end = bx.y + bx.height;
      if (end - start < BACKDROP_MIN_HEIGHT) continue;
      // A stretch of page that paints no backdrop of its own is still a section --
      // it is the body background showing through. Without it the content standing
      // on that stretch would have to be assigned to a band it is not inside.
      if (start - cursor >= BACKDROP_MIN_HEIGHT) {
        out.push({ el: document.body, box: { x: 0, y: cursor, width: docW, height: start - cursor }, layers: [] });
      }
      out.push({ el: kept[m].el, box: { x: 0, y: start, width: docW, height: end - start }, layers: kept[m].layers });
      cursor = end;
    }
    if (docH - cursor >= BACKDROP_MIN_HEIGHT) {
      out.push({ el: document.body, box: { x: 0, y: cursor, width: docW, height: docH - cursor }, layers: [] });
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
  function overlayInBox(box) {
    var area = box.width * box.height;
    if (area <= 0) return null;
    var surf = paintedSurfaces();
    var best = null;
    for (var i = 0; i < surf.length; i++) {
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
      if (!best || cover > best.cover) {
        best = { color: sc.color, opacity: sc.opacity, cover: cover };
      }
    }
    return best ? { color: best.color, opacity: best.opacity } : null;
  }

  // REQ-270 -- the paint of a geometric slice, which is not the paint of the box
  // that FILLS it. bandSlices keeps every backdrop it swallowed (see there); the
  // image a band shows is the one on its TOPMOST painted layer, and the slice
  // element itself is only the fallback. Document-ordered smallest-last by
  // bandSlices' own sort, so the last layer that paints an image is the top one.
  //
  // backgroundColor is deliberately NOT taken from the layer: the fill is what
  // the outermost box paints, and an image layer's own colour is usually
  // transparent. This is symmetric with the reference path, where the band
  // element is the thing that paints because a conventional page nests.
  function sliceBackgroundImage(slice) {
    var layers = slice.layers || [];
    for (var i = layers.length - 1; i >= 0; i--) {
      var img = getComputedStyle(layers[i].el).backgroundImage;
      if (img && img !== 'none') return img;
    }
    var own = getComputedStyle(slice.el).backgroundImage;
    return own || 'none';
  }

  // anchorRatioOf's geometric twin: where the slice's own content sits inside it,
  // measured from the runs already collected rather than from a descendant walk.
  function anchorRatioInBox(box, runs) {
    if (box.height <= 0) return null;
    var top = Infinity, bot = -Infinity, any = false;
    for (var i = 0; i < runs.length; i++) {
      var r = runs[i].box;
      if (!centreInSlice(r, box)) continue;
      if (r.y < top) top = r.y;
      if (r.y + r.height > bot) bot = r.y + r.height;
      any = true;
    }
    if (!any) return null;
    var ratio = ((top + bot) / 2 - box.y) / box.height;
    return Math.round(Math.max(0, Math.min(1, ratio)) * 100) / 100;
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
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
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
      var flow = n.nodeValue.replace(/\\s+/g, ' ');
      var t = flow.trim();
      var owner = n.parentElement;
      if (!owner || !visible(owner)) { if (!t) pendingSpace = true; continue; }
      if (moduleInvariant(owner)) { if (!t) pendingSpace = true; continue; }
      if (excludes && insideAny(owner, excludes)) {
        if (excludedAtNode === -1) excludedAtNode = nodes.length;
        if (!t) pendingSpace = true;
        continue;
      }
      if (!t) { pendingSpace = true; continue; }
      if (pendingSpace && flow.charAt(0) !== ' ') flow = ' ' + flow;
      pendingSpace = false;
      nodes.push({ node: n, el: owner, text: t, flow: flow });
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
      var ownRun = runCounts.get(el) === 1;
      var s = getComputedStyle(el);
      var glyphs = ownRun ? renderedTextBox(el) : textNodeBox(n);
      // REQ-265 -- a run's box is the LINE BOX it occupies. For a block element
      // the border box already is that; for an inline one the rect is the content
      // area, so \lineBoxOf\ converts it (and returns null for every other case,
      // leaving the rect exactly as it was).
      var runBox = ownRun ? (lineBoxOf(el, s) || absBox(el)) : (glyphs || absBox(el));
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
      var lh = parseFloat(s.lineHeight); // NaN for 'normal'
      // REQ-35: when the painted colour is unresolvable (transparent / not
      // painted), rgbToHex returns null and we fall back to a sentinel — flag it
      // low-confidence so the values-diff won't hold a re-render to a guess.
      var resolvedColor = rgbToHex(s.color);
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
        inlineGroup: inFlow ? flowKey : undefined,
        inlineIndex: inFlow ? flowGroup.indexOf(ri2) : undefined,
        inlineBox: inFlow ? absBox(flowInfo[ri2].root) : undefined,
        textFlow: inFlow ? nodes[ri2].flow : undefined,
        verticalAlign: (inFlow && s.verticalAlign && s.verticalAlign !== 'baseline') ? s.verticalAlign : undefined,
        color: resolvedColor || '#000000',
        colorInferred: !resolvedColor,
        fontFamily: familyStack(s.fontFamily),
        fontLoaded: fontLoadedOf(s, primaryFamily(s.fontFamily), text),
        fontSizePx: Math.round(parseFloat(s.fontSize)),
        fontWeight: parseInt(s.fontWeight, 10) || 400,
        // REQ-63 typography treatment axes (null when the no-op default).
        fontStyle: paintedOrNull(s.fontStyle),
        textDecoration: textDecorationOf(s),
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
        borderRadiusPx: borderRadiusOf(s),
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
        zIndex: zIndexOf(s),
        filter: paintedOrNull(s.filter),
        textShadow: paintedOrNull(s.textShadow),
        maskEdge: maskEdgeOf(s),
        // REQ-63 — effects: frosted-glass, blend, opacity, outline, pseudo-content.
        backdropFilter: paintedOrNull(s.backdropFilter || s.webkitBackdropFilter),
        blendMode: paintedOrNull(s.mixBlendMode),
        opacity: opacityOf(s),
        outline: outlineOf(s),
        pseudo: pseudoOf(el),
        transformRotateDeg: transformOf(s).rotate,
        transformScale: transformOf(s).scale,
        motion: motionOf(s),
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
  function fieldsUnder(root, excludes) {
    var out = [];
    var cands = [];
    var els = root.querySelectorAll('input, textarea, select, hr, img');
    for (var ci = 0; ci < els.length; ci++) cands.push({ el: els[ci], bgUrl: null });
    var bgs = backdropBoxes();
    var added = 0;
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
      if (excludes && insideAny(el, excludes)) continue;
      var s = getComputedStyle(el);
      var an = accessibleNameOf(el);
      var isImg = el.tagName.toLowerCase() === 'img';
      var intrinsicAspect = (isImg && el.naturalHeight > 0)
        ? Math.round((el.naturalWidth / el.naturalHeight) * 100) / 100
        : null;
      var fieldBorder = boxBorderOf(s);
      // REQ-308 -- the control's own type (see controlTypographyOf). Null for
      // every text-free element that is not a form control.
      var fieldType = controlTypographyOf(el, s);
      var fieldRecord = {
        box: absBox(el),
        borderRadiusPx: borderRadiusOf(s),
        borderWidthPx: fieldBorder.width,
        borderColor: fieldBorder.color,
        borderStyle: fieldBorder.style,
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
        zIndex: zIndexOf(s),
        filter: paintedOrNull(s.filter),
        textShadow: paintedOrNull(s.textShadow),
        maskEdge: maskEdgeOf(s),
        // REQ-63 — effects: frosted-glass, blend, opacity, outline, pseudo-content.
        backdropFilter: paintedOrNull(s.backdropFilter || s.webkitBackdropFilter),
        blendMode: paintedOrNull(s.mixBlendMode),
        opacity: opacityOf(s),
        outline: outlineOf(s),
        pseudo: pseudoOf(el),
        transformRotateDeg: transformOf(s).rotate,
        transformScale: transformOf(s).scale,
        motion: motionOf(s),
        objectFit: isImg ? (s.objectFit || 'fill') : null,
        // REQ-63 — how the image crops within its box (default '50% 50%').
        objectPosition: isImg ? (s.objectPosition || '50% 50%') : null,
        intrinsicAspect: intrinsicAspect,
        // REQ-92 — the media substance an L1 image leaf needs (resolved src + alt).
        src: isImg ? (el.currentSrc || el.src || null) : null,
        alt: isImg ? (el.alt || '') : null,
        // BUG-27 — the painted CSS background image this box carries (absolute URL),
        // null for every other text-free element. Distinct from src: it folds to a
        // box leaf painted BEHIND content, not an image leaf placed in flow.
        backgroundImageUrl: bgUrl,
        // BUG-27 — the element's OWN painted background-color. A backdrop routinely
        // layers an image over a solid (the hero here is a photo over #000000 at
        // opacity .49 -- that black is what darkens it), and capturing the image
        // without the fill under it reproduces the photograph at full brightness.
        // Null when the element paints no fill of its own.
        surfaceFill: rgbToHex(s.backgroundColor),
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
  // REQ-269 -- when the top-level scan degenerates to ONE band covering the whole
  // page, segment geometrically instead (see bandSlices). This is the shape every
  // L1 reproduction has, so until it landed no section-level value could be
  // compared on any reproduction at all. A page whose top-level scan already found
  // real bands never reaches this, and neither does one that genuinely is a single
  // band -- bandSlices returns [] rather than inventing a second one.
  var geometricBands =
    bandRoots.length === 1 &&
    bandRoots[0].box.height >= docH - 2 &&
    bandRoots[0].box.width >= docW - 2
      ? bandSlices()
      : [];

  if (geometricBands.length > 1) {
    // Collected ONCE from the flat root and partitioned by geometry, rather than
    // per band: every run is a sibling of every other, so a per-band DOM walk
    // would collect the whole page into each slice.
    var flatRoot = bandRoots[0].el;
    var flatGrp = itemGroup(flatRoot);
    var flatContent = runsUnder(flatRoot, flatGrp.roots);
    var flatFields = fieldsUnder(flatRoot, flatGrp.roots);
    assignArrangement(flatContent.concat(flatFields));
    var perSlice = geometricBands.map(function () { return { content: [], fields: [], items: [] }; });
    flatContent.forEach(function (r) { perSlice[sliceIndexFor(r.box, geometricBands)].content.push(r); });
    flatFields.forEach(function (f) { perSlice[sliceIndexFor(f.box, geometricBands)].fields.push(f); });
    // REQ-302 -- no itemsAt on this path, deliberately. A geometric slice is not
    // a DOM subtree: its runs were collected once from the flat root and then
    // PARTITIONED by box, so "the index this row sits at within this slice's
    // content" is not a question the walk answered. The projection appends,
    // which is what it did before and is the only truthful answer here. This is
    // the flat-tree (L1 reproduction) path, where the tree's own order already
    // came from the reference bundle the fold was built from.
    flatGrp.roots.forEach(function (rootEl, ri) {
      perSlice[sliceIndexFor(absBox(rootEl), geometricBands)].items.push(flatGrp.items[ri]);
    });
    geometricBands.forEach(function (br, bi) {
      var s = getComputedStyle(br.el);
      // REQ-271 -- the band's OWN painted fill, null when it paints none. Not
      // laundered into bodyBg: a band that paints nothing and a band that paints
      // white are different facts and the bundle has to be able to say which.
      var bg = rgbToHex(s.backgroundColor);
      bands.push({
        box: br.box,
        backgroundColor: bg,
        backgroundImage: sliceBackgroundImage(br),
        colorScheme: luminance(bandTone(br.el)) < 0.5 ? 'dark' : 'light',
        fontFamily: familyStack(s.fontFamily),
        textAlign: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'right' : 'left',
        paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
        paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
        overlay: overlayInBox(br.box),
        contentAnchorRatio: anchorRatioInBox(br.box, perSlice[bi].content),
        content: perSlice[bi].content,
        items: perSlice[bi].items,
        fields: perSlice[bi].fields,
      });
    });
  } else {
  bandRoots.forEach(function (br) {
    var band = br.el;
    var s = getComputedStyle(band);
    // REQ-271 -- see the geometric path above: the band's own fill, or null.
    var bg = rgbToHex(s.backgroundColor);
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
      contentAnchorRatio: anchorRatioOf(band, bbox),
      content: content,
      items: grp.items,
      itemsAt: itemsAt,
      fields: fields,
    });
  });
  }

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
      var w = parseInt(rule.style.getPropertyValue('font-weight'), 10);
      fontFaces.push({ family: fam, srcUrls: urls, weight: isNaN(w) ? null : w });
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
  };
})()`
