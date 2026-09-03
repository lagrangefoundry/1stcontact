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
  /** `getBoundingClientRect()` in full-page document coords. */
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
}

/** A top-level style-scope band candidate (DOC-13 §2.7). */
export interface RawBand {
  box: { x: number; y: number; width: number; height: number }
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
    var acc = null; // [r,g,b,a], top layer first
    var chain = surfaceChainWithSelf(el);
    for (var i = 0; i < chain.length; i++) {
      var c = rgbaOf(getComputedStyle(chain[i]).backgroundColor);
      if (c && c[3] > 0) {
        acc = acc ? composite(acc, c) : c;
        if (acc[3] >= 0.999) break; // opaque — nothing behind shows through
      }
    }
    if (!acc || acc[3] <= 0) return null;
    return '#' + h2(acc[0]) + h2(acc[1]) + h2(acc[2]);
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
      if (/gradient\\(/.test(img) && clip !== 'text') return hexifyGradient(img);
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
  // The a11y role: an explicit role attr wins, else the implicit role for the tag
  // (the browser's own framework-agnostic semantic label — a <button>, an <a
  // href>, and a role="button" div all project to the same fact).
  function a11yRoleOf(el) {
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
      // raw rgba() regex. A Tailwind v4 veil (\`bg-slate-950/30\`) computes to
      // \`color-mix(in oklab, …)\` / \`oklab(… / .3)\`, which the regex could not read,
      // so EVERY modern-syntax scrim was silently dropped and the hero rendered
      // unveiled. rgbaOf resolves any browser-understood colour and preserves alpha.
      var c = rgbaOf(getComputedStyle(el).backgroundColor);
      if (!c) continue;
      var a = c[3];
      if (!(a > 0 && a < 1)) continue; // opaque or fully transparent → not a scrim
      var r = absBox(el);
      var cover = (r.width * r.height) / area;
      if (cover < 0.6) continue; // must substantially blanket the band
      if (!best || cover > best.cover) {
        best = { color: '#' + hx(c[0]) + hx(c[1]) + hx(c[2]), opacity: Math.round(a * 100) / 100, cover: cover };
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

  // Collect visible text runs under a root, in document order, skipping any node
  // within an excluded subtree (so band content never duplicates item content).
  function runsUnder(root, excludes) {
    var out = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    // BUG-25 — two passes, because a run's geometry depends on whether its element
    // holds more than one run. Pass 1 selects the qualifying text nodes and counts
    // them per element; pass 2 emits, reading geometry off the element when it owns
    // exactly one run (unchanged) and off the text node itself when it does not.
    var nodes = [];
    var runCounts = new Map();
    for (; (n = walker.nextNode()); ) {
      var t = n.nodeValue.replace(/\\s+/g, ' ').trim();
      if (!t) continue;
      var owner = n.parentElement;
      if (!owner || !visible(owner)) continue;
      if (moduleInvariant(owner)) continue;
      if (excludes && insideAny(owner, excludes)) continue;
      nodes.push({ node: n, el: owner, text: t });
      runCounts.set(owner, (runCounts.get(owner) || 0) + 1);
    }
    for (var ri = 0; ri < nodes.length; ri++) {
      n = nodes[ri].node;
      var text = nodes[ri].text;
      var el = nodes[ri].el;
      // The element's box IS the run's box only while it holds a single run; when
      // it holds several, that shared box says nothing about where this one paints.
      var ownRun = runCounts.get(el) === 1;
      var glyphs = ownRun ? renderedTextBox(el) : textNodeBox(n);
      var runBox = ownRun ? absBox(el) : (glyphs || absBox(el));
      var s = getComputedStyle(el);
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
      out.push({
        role: roleOf(el),
        text: text,
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
        lineHeightPx: isNaN(lh) ? null : Math.round(lh),
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
      out.push({
        box: absBox(el),
        borderRadiusPx: borderRadiusOf(s),
        borderWidthPx: fieldBorder.width,
        borderColor: fieldBorder.color,
        borderStyle: fieldBorder.style,
        boxShadow: boxShadowOf(s),
        a11yRole: a11yRoleOf(el),
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
      });
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
  bandRoots.forEach(function (br) {
    var band = br.el;
    var s = getComputedStyle(band);
    var bg = rgbToHex(s.backgroundColor) || bodyBg;
    var grp = itemGroup(band);
    var bbox = br.box;
    var content = runsUnder(band, grp.roots);
    var fields = fieldsUnder(band, grp.roots);
    // Arrangement is relative to the previous element in reading order, so text
    // runs and text-free fields must be ordered together (a Subscribe button's
    // predecessor is the email input, not the last paragraph).
    assignArrangement(content.concat(fields));
    bands.push({
      box: bbox,
      backgroundColor: bg,
      backgroundImage: s.backgroundImage || 'none',
      colorScheme: luminance(bg) < 0.5 ? 'dark' : 'light',
      fontFamily: familyStack(s.fontFamily),
      textAlign: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'right' : 'left',
      paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
      paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
      overlay: overlayOf(band, bbox),
      contentAnchorRatio: anchorRatioOf(band, bbox),
      content: content,
      items: grp.items,
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
