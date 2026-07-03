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

/** A single visible text run with its exact painted styling. */
export interface RawRun {
  role: 'heading' | 'subheading' | 'body' | 'link' | 'action' | 'listitem'
  text: string
  color: string
  fontFamily: string
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
  content: RawRun[]
  items: RawRun[][]
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

  function insideAny(el, roots) {
    for (var k = 0; k < roots.length; k++) if (roots[k].contains(el)) return true;
    return false;
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
      out.push({
        role: roleOf(el),
        text: text,
        color: rgbToHex(s.color) || '#000000',
        fontFamily: primaryFamily(s.fontFamily),
        fontSizePx: Math.round(parseFloat(s.fontSize)),
        fontWeight: parseInt(s.fontWeight, 10) || 400,
        lineHeightPx: isNaN(lh) ? null : Math.round(lh),
        letterSpacingPx: (s.letterSpacing === 'normal') ? 0 : (Math.round(parseFloat(s.letterSpacing) * 100) / 100 || 0),
        gradientCss: gradientCss,
        borderLeftWidthPx: blW,
        borderLeftColor: blColor,
        paddingLeftPx: Math.round(parseFloat(s.paddingLeft)) || 0,
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
    bands.push({
      box: absBox(band),
      backgroundColor: bg,
      backgroundImage: s.backgroundImage || 'none',
      colorScheme: luminance(bg) < 0.5 ? 'dark' : 'light',
      fontFamily: primaryFamily(s.fontFamily),
      textAlign: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'right' : 'left',
      paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
      paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
      content: runsUnder(band, grp.roots),
      items: grp.items,
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
