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

/**
 * REQ-47 — rendered element geometry, shape, structure and arrangement. Every
 * field is a *rendered* fact (a painted box, a computed radius, the browser's
 * own a11y role/name), never a CSS mechanism (no `flex-direction`, no tag) — so
 * two different DOMs that render identically project to the same values.
 */
export interface RawGeometry {
  /** `getBoundingClientRect()` in full-page document coords. */
  box: { x: number; y: number; width: number; height: number }
  /** Largest computed corner radius in px (0 when square). */
  borderRadiusPx: number
  /** Raw computed `box-shadow` when a shadow is painted, else null. */
  boxShadow: string | null
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
  // ── REQ-31 per-element value fields (raw; normalized in sections.ts) ───────
  lineHeightPx: number | null
  letterSpacingPx: number
  /** Raw computed `background-image` when the run paints a text-fill gradient. */
  gradientCss: string | null
  /** Left border width in px (0 when none painted). */
  borderLeftWidthPx: number
  /** Left border colour `#rrggbb` when a left border is painted, else null. */
  borderLeftColor: string | null
  paddingLeftPx: number
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
  /** REQ-48 (item 4) — intrinsic (natural) aspect ratio w/h for a media element, else null. */
  intrinsicAspect?: number | null
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
}

export const EXTRACT_SCRIPT = `(() => {
  var DOC = document.documentElement;
  var docW = DOC.scrollWidth, docH = DOC.scrollHeight;

  function rgbToHex(str) {
    if (!str) return null;
    var m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var p = m[1].split(',').map(function (s) { return parseFloat(s.trim()); });
    if (p.length >= 4 && p[3] === 0) return null; // fully transparent
    function h(n) { return ('0' + Math.round(n).toString(16)).slice(-2); }
    return '#' + h(p[0]) + h(p[1]) + h(p[2]);
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
  // REQ-48 (item 7) -- did the intended named face actually resolve, or is the
  // browser painting a fallback with different metrics? Generic keywords need no
  // load (always true). A named face is checked against the loaded FontFaceSet;
  // when the API is missing we assume loaded rather than cry false-positive.
  function fontLoadedOf(s, family) {
    if (!family) return true;
    var generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-|inherit|initial|unset|-apple-system|blinkmacsystemfont)/i;
    if (generic.test(family)) return true;
    try {
      return document.fonts && document.fonts.check ? document.fonts.check(s.fontSize + ' "' + family + '"') : true;
    } catch (e) {
      return true;
    }
  }
  function visible(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      var s = getComputedStyle(node);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
      node = node.parentElement;
    }
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    var left = r.left + window.scrollX, top = r.top + window.scrollY;
    if (left + r.width <= 0 || top + r.height <= 0) return false; // off-screen up/left
    if (left >= docW || top >= docH) return false;                 // off-screen down/right
    return true;
  }
  function absBox(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
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
  // REQ-48 (item 3) -- the element's masked/clipped edge (feather halo or shaped
  // clip). Either mechanism collapses to one field; presence is what the eye reads.
  function maskEdgeOf(s) {
    return paintedOrNull(s.maskImage || s.webkitMaskImage) || paintedOrNull(s.clipPath);
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
      var m = getComputedStyle(el).backgroundColor.match(/rgba\\(([^)]+)\\)/);
      if (!m) continue;
      var p = m[1].split(',').map(function (x) { return parseFloat(x.trim()); });
      if (p.length < 4) continue;
      var a = p[3];
      if (!(a > 0 && a < 1)) continue; // opaque or fully transparent → not a scrim
      var r = absBox(el);
      var cover = (r.width * r.height) / area;
      if (cover < 0.6) continue; // must substantially blanket the band
      if (!best || cover > best.cover) {
        best = { color: '#' + hx(p[0]) + hx(p[1]) + hx(p[2]), opacity: Math.round(a * 100) / 100, cover: cover };
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
    while ((n = walker.nextNode())) {
      var text = n.nodeValue.replace(/\\s+/g, ' ').trim();
      if (!text) continue;
      var el = n.parentElement;
      if (!el || !visible(el)) continue;
      if (excludes && insideAny(el, excludes)) continue;
      var s = getComputedStyle(el);
      // A text-fill gradient is a background-image gradient clipped to the text
      // (background-clip: text). Capture the raw gradient CSS for TS-side
      // normalization; ignore non-clipped backgrounds (those are band fills).
      var clip = s.webkitBackgroundClip || s.backgroundClip || '';
      var bgImg = s.backgroundImage || 'none';
      var gradientCss = (clip === 'text' && /gradient\\(/.test(bgImg)) ? bgImg : null;
      // A painted left-edge accent bar (border-l-4 border-emerald-400 and kin).
      var blW = Math.round(parseFloat(s.borderLeftWidth)) || 0;
      var blStyle = s.borderLeftStyle;
      var blColor = (blW > 0 && blStyle && blStyle !== 'none') ? rgbToHex(s.borderLeftColor) : null;
      var lh = parseFloat(s.lineHeight); // NaN for 'normal'
      // REQ-35: when the painted colour is unresolvable (transparent / not
      // painted), rgbToHex returns null and we fall back to a sentinel — flag it
      // low-confidence so the values-diff won't hold a re-render to a guess.
      var resolvedColor = rgbToHex(s.color);
      out.push({
        role: roleOf(el),
        text: text,
        color: resolvedColor || '#000000',
        colorInferred: !resolvedColor,
        fontFamily: primaryFamily(s.fontFamily),
        fontLoaded: fontLoadedOf(s, primaryFamily(s.fontFamily)),
        fontSizePx: Math.round(parseFloat(s.fontSize)),
        fontWeight: parseInt(s.fontWeight, 10) || 400,
        lineHeightPx: isNaN(lh) ? null : Math.round(lh),
        letterSpacingPx: (s.letterSpacing === 'normal') ? 0 : (Math.round(parseFloat(s.letterSpacing) * 100) / 100 || 0),
        gradientCss: gradientCss,
        borderLeftWidthPx: blW,
        borderLeftColor: blColor,
        paddingLeftPx: Math.round(parseFloat(s.paddingLeft)) || 0,
        // REQ-47 per-element geometry / shape / structure (arrangement filled later).
        box: absBox(el),
        borderRadiusPx: borderRadiusOf(s),
        boxShadow: boxShadowOf(s),
        a11yRole: a11yRoleOf(el),
        arrangement: null,
        zIndex: zIndexOf(s),
        filter: paintedOrNull(s.filter),
        textShadow: paintedOrNull(s.textShadow),
        maskEdge: maskEdgeOf(s),
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
  function fieldsUnder(root, excludes) {
    var out = [];
    var els = root.querySelectorAll('input, textarea, select, hr, img');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.type === 'hidden') continue;
      if (!visible(el)) continue;
      if (excludes && insideAny(el, excludes)) continue;
      var s = getComputedStyle(el);
      var an = accessibleNameOf(el);
      var isImg = el.tagName.toLowerCase() === 'img';
      var intrinsicAspect = (isImg && el.naturalHeight > 0)
        ? Math.round((el.naturalWidth / el.naturalHeight) * 100) / 100
        : null;
      out.push({
        box: absBox(el),
        borderRadiusPx: borderRadiusOf(s),
        boxShadow: boxShadowOf(s),
        a11yRole: a11yRoleOf(el),
        arrangement: null,
        zIndex: zIndexOf(s),
        filter: paintedOrNull(s.filter),
        textShadow: paintedOrNull(s.textShadow),
        maskEdge: maskEdgeOf(s),
        objectFit: isImg ? (s.objectFit || 'fill') : null,
        intrinsicAspect: intrinsicAspect,
        accessibleName: an.name,
        nameSource: an.source,
      });
    }
    return out;
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
  var children = Array.prototype.filter.call(document.body.children, function (c) {
    return c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE' && visible(c) && c.getBoundingClientRect().height >= 8;
  });
  children.forEach(function (band) {
    var s = getComputedStyle(band);
    var bg = rgbToHex(s.backgroundColor) || bodyBg;
    var grp = itemGroup(band);
    var bbox = absBox(band);
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
      fontFamily: primaryFamily(s.fontFamily),
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
  };
})()`
