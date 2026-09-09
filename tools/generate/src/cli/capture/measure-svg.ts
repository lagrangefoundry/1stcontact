/**
 * Browser-side drawing measurement (REQ-209, DOC-52 §3.3 and §5.3).
 *
 * {@link measureScript} builds a self-contained JS expression evaluated in page
 * scope via the driver's `query()`, exactly as `EXTRACT_SCRIPT` is — a raw
 * string, never a stringified TS function, so what is written below is what
 * Chromium evaluates.
 *
 * WHY IT RUNS INSIDE THE SITE'S OWN PAGE, AND INSIDE A SHADOW ROOT. A drawing's
 * geometry depends on the font it actually gets, and the font it actually gets
 * depends on the `@font-face` rules the site declares — so measuring against a
 * blank document would measure a different drawing from the one the visitor
 * sees. Navigating to the draft page brings those rules. But the same page also
 * carries stylesheets that would happily restyle a bare `<svg>` dropped into its
 * body, and a measurement perturbed by the page it was measured in is worse than
 * none. A shadow root is the seam that gives both: `@font-face` is
 * document-scoped and reaches inside it, ordinary selectors do not, and
 * `all: initial` on the host stops inheritance crossing the boundary.
 *
 * WHY CANVAS AND NOT `getBBox()` FOR INK. Chromium's `getBBox()` on a `<text>`
 * returns a box built from the font's ascent and descent, not from the glyphs
 * that were actually painted — which is the box family, and is already reported.
 * `measureText().actualBoundingBox*` IS the painted extent, and the difference
 * between the two is the whole reason the ink family exists (DOC-52 §5.1).
 *
 * WHY THE FONT METRICS ARE MEASURED RATHER THAN PARSED. Cap-height, x-height,
 * ascender and descender could be read out of the font file with a parser; that
 * is a dependency bought for four numbers the browser will hand over for free.
 * `measureText('H').actualBoundingBoxAscent` at a known size IS the cap height,
 * and it is the cap height of the face that actually resolved rather than of the
 * one we hoped for.
 */

/** One font, measured once and referenced by every node that uses it. */
export interface RawFontMetrics {
  /** `f0`, `f1`, … — the key nodes name. */
  key: string
  /** The `font-family` value as authored. */
  requested: string
  /** The family the browser actually used, as far as it can be determined. */
  resolved: string
  /** True when `resolved` is a generic or platform keyword, not a named face. */
  generic: boolean
  capHeight: number
  xHeight: number
  ascender: number
  descender: number
}

/** One glyph's extent, in root user space. */
export interface RawGlyph {
  char: string
  box: [number, number, number, number]
  }

/** One measured node, in root user space with nested transforms resolved. */
export interface RawNodeMeasurement {
  /** `#id` when the node has one, else its path from the root (`0.3`). */
  ref: string
  id: string | null
  /** The element's tag name. */
  kind: string
  /** The text it holds, for a text node. */
  text?: string | null
  /** The {@link RawFontMetrics.key} its font anchors read. */
  font?: string | null
  fontSize?: number | null
  box: [number, number, number, number]
  ink?: [number, number, number, number] | null
  baseline?: number | null
  advanceStart?: number | null
  advanceWidth?: number | null
  glyphs?: RawGlyph[] | null
  /**
   * Reported rather than omitted, so "empty" is never ambiguous with "not
   * measured" — a node that paints nothing is a finding, not an absence.
   */
  degenerate?: boolean
  /**
   * The positioning attributes as authored, so `solve` can add its correction to
   * what is there rather than replace it. INTERNAL — stripped before the model
   * sees the measurement, because a field a model can see is a field it will try
   * to reason from, and these are how the arithmetic is done rather than
   * something to do arithmetic with.
   */
  attrs?: Record<string, string | null>
  /** Root-space units per local unit, `[x, y]`. Internal, as above. */
  scale?: [number, number]
  /**
   * The node's path from the root (`0.3`), carried whether or not the node has
   * an `id`. It is what the composed-run ink union walks the nesting by — a
   * node's descendants are exactly those whose path starts with its own — and
   * carrying it on the node rather than reading it back out of the walk is what
   * keeps the two in step when a node with no measurable box is passed over.
   * Internal, as above.
   */
  path?: string
  /**
   * True when a rotation or skew stands between this node and the root, so
   * moving it along one axis is not something one attribute can do. Internal.
   */
  skewed?: boolean
}

/** What the script hands back. */
export interface RawMeasurement {
  viewBox: [number, number, number, number] | null
  /** What the numbers are in, said once rather than assumed. */
  space: string
  fonts: RawFontMetrics[]
  nodes: RawNodeMeasurement[]
  /** Anything the measurement could not do, said rather than swallowed. */
  warnings: string[]
}

/** How many nodes one measurement will report before it says it stopped. */
export const MEASURE_NODE_LIMIT = 200

/** How many glyph extents one text node will report before it says it stopped. */
export const MEASURE_GLYPH_LIMIT = 120

/**
 * The script, built around one drawing.
 *
 * The source is embedded with `JSON.stringify` rather than concatenated, so a
 * drawing containing a quote, a backslash or a line break cannot break out of
 * the string and become script — the same reason `EXTRACT_SCRIPT` takes no
 * parameters at all.
 */
export function measureScript(svg: string): string {
  return `(async () => {
  var SVG = ${JSON.stringify(svg)};
  var NODE_LIMIT = ${MEASURE_NODE_LIMIT};
  var GLYPH_LIMIT = ${MEASURE_GLYPH_LIMIT};
  var warnings = [];

  // Elements with no geometry worth reporting. Their subtrees go with them:
  // a <stop> inside a gradient is not a thing anyone positions.
  var SKIP = { defs: 1, lineargradient: 1, radialgradient: 1, stop: 1, clippath: 1, mask: 1, title: 1, desc: 1 };

  // Families the CSS spec resolves per platform rather than to a named face.
  // A drawing that names only these is tuned on one machine and wrong on most
  // others — which is what reporting 'generic' is for.
  var GENERIC = {
    'serif': 1, 'sans-serif': 1, 'monospace': 1, 'cursive': 1, 'fantasy': 1,
    'system-ui': 1, 'ui-serif': 1, 'ui-sans-serif': 1, 'ui-monospace': 1,
    'ui-rounded': 1, 'math': 1, 'emoji': 1, 'fangsong': 1,
    '-apple-system': 1, 'blinkmacsystemfont': 1, 'inherit': 1, 'initial': 1
  };

  // ── the host: fonts in, page styles out ────────────────────────────────────
  var host = document.createElement('div');
  host.setAttribute('style', 'all:initial;position:absolute;left:-99999px;top:0;width:0;height:0');
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = SVG;
  var root = shadow.querySelector('svg');
  if (!root) {
    host.remove();
    return { viewBox: null, space: 'root user units, y-down', fonts: [], nodes: [], warnings: ['the drawing has no <svg> element, so there was nothing to measure.'] };
  }

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  function quoted(name) {
    var t = name.trim().replace(/^['"]|['"]$/g, '');
    return /^[-a-zA-Z0-9_ ]+$/.test(t) ? t : JSON.stringify(t);
  }
  function stackOf(family) {
    return String(family || '').split(',').map(function (f) { return f.trim().replace(/^['"]|['"]$/g, ''); }).filter(Boolean);
  }
  function shorthand(style, weight, size, family) {
    return (style && style !== 'normal' ? style + ' ' : '') + (weight || 400) + ' ' + size + 'px ' + family;
  }

  // The classic availability probe: a family that is present shifts the width
  // away from EVERY generic fallback it is stacked in front of. One that is not
  // present leaves each one exactly where it was.
  var SAMPLE = 'mmmwwwiii0123AVWfl';
  function widthOf(stack) { ctx.font = '100px ' + stack; return ctx.measureText(SAMPLE).width; }
  function available(family) {
    if (GENERIC[family.toLowerCase()]) return true;
    var bases = ['monospace', 'serif', 'sans-serif'];
    for (var i = 0; i < bases.length; i++) {
      if (widthOf(quoted(family) + ',' + bases[i]) !== widthOf(bases[i])) return true;
    }
    return false;
  }

  var fonts = [];
  var fontIndex = {};
  function fontKeyFor(requested, weight, style) {
    var id = requested + '|' + weight + '|' + style;
    if (fontIndex[id]) return fontIndex[id];
    var key = 'f' + fonts.length;
    fontIndex[id] = key;
    var stack = stackOf(requested);
    var resolved = '';
    for (var i = 0; i < stack.length; i++) { if (available(stack[i])) { resolved = stack[i]; break; } }
    if (!resolved) resolved = stack.length ? stack[stack.length - 1] : 'sans-serif';
    var probe = 100;
    ctx.font = shorthand(style, weight, probe, requested);
    var capM = ctx.measureText('H');
    var xM = ctx.measureText('x');
    fonts.push({
      key: key,
      requested: requested,
      resolved: resolved,
      generic: !!GENERIC[resolved.toLowerCase()],
      capHeight: capM.actualBoundingBoxAscent / probe,
      xHeight: xM.actualBoundingBoxAscent / probe,
      ascender: capM.fontBoundingBoxAscent / probe,
      descender: -capM.fontBoundingBoxDescent / probe
    });
    return key;
  }

  // ── the walk ───────────────────────────────────────────────────────────────
  var visited = [];
  function walk(el, path) {
    if (SKIP[el.tagName.toLowerCase()]) return;
    visited.push({ el: el, path: path });
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) walk(kids[i], path + '.' + i);
  }
  walk(root, '0');

  // ── fonts first, geometry after ────────────────────────────────────────────
  // Loading a face reflows the text, so every measurement taken before the load
  // settles is of a fallback. Ask for each one by name, then wait for the set.
  var wanted = {};
  for (var v = 0; v < visited.length; v++) {
    var e = visited[v].el;
    var tag = e.tagName.toLowerCase();
    if (tag !== 'text' && tag !== 'tspan') continue;
    var cs = getComputedStyle(e);
    wanted[shorthand(cs.fontStyle, cs.fontWeight, parseFloat(cs.fontSize) || 16, cs.fontFamily)] = (e.textContent || 'Hx');
  }
  var asks = [];
  for (var spec in wanted) {
    try { asks.push(document.fonts.load(spec, wanted[spec])); } catch (err) { warnings.push('could not ask for ' + spec + ': ' + err); }
  }
  try { await Promise.all(asks); } catch (err) { warnings.push('a font did not load: ' + err); }
  try { await document.fonts.ready; } catch (err) { /* a document with no font set is not an error */ }

  // ── local → root user space ────────────────────────────────────────────────
  // Through the screen and back, because that is the only pair of matrices every
  // element exposes: the element's own CTM is relative to the nearest viewport,
  // which is not necessarily the root once a nested <svg> or a <g> transform is
  // in the way. Composing with the root's inverse resolves them all at once.
  var rootCTM = root.getScreenCTM();
  function toRoot(el) {
    var m = el.getScreenCTM ? el.getScreenCTM() : null;
    if (!m || !rootCTM) return null;
    return rootCTM.inverse().multiply(m);
  }
  function point(m, x, y) {
    if (!m) return { x: x, y: y };
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  }
  function rect(m, r) {
    var pts = [point(m, r.x, r.y), point(m, r.x + r.width, r.y), point(m, r.x, r.y + r.height), point(m, r.x + r.width, r.y + r.height)];
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return [round(x0), round(y0), round(x1 - x0), round(y1 - y0)];
  }
  function round(n) { return Math.round(n * 1000) / 1000; }

  var nodes = [];
  var stopped = false;
  for (var n = 0; n < visited.length; n++) {
    if (nodes.length >= NODE_LIMIT) { stopped = true; break; }
    var el = visited[n].el;
    var path = visited[n].path;
    var tag = el.tagName.toLowerCase();
    var id = el.getAttribute('id');
    var m = toRoot(el);
    var bbox = null;
    try { bbox = el.getBBox(); } catch (err) { bbox = null; }
    if (!bbox) { warnings.push((id ? '#' + id : path) + ' has no measurable box.'); continue; }
    var out = {
      ref: id ? '#' + id : path,
      id: id,
      kind: tag,
      path: path,
      box: rect(m, bbox),
      attrs: {
        x: el.getAttribute('x'), y: el.getAttribute('y'),
        cx: el.getAttribute('cx'), cy: el.getAttribute('cy')
      },
      scale: m ? [round(Math.hypot(m.a, m.b)), round(Math.hypot(m.c, m.d))] : [1, 1],
      skewed: m ? (Math.abs(m.b) > 1e-9 || Math.abs(m.c) > 1e-9) : false
    };
    if (bbox.width === 0 && bbox.height === 0) out.degenerate = true;

    if (tag === 'text' || tag === 'tspan') {
      var cs2 = getComputedStyle(el);
      var size = parseFloat(cs2.fontSize) || 16;
      out.text = el.textContent;
      out.fontSize = round(size);
      out.font = fontKeyFor(cs2.fontFamily, cs2.fontWeight, cs2.fontStyle);
      var chars = 0;
      try { chars = el.getNumberOfChars(); } catch (err) { chars = 0; }
      if (chars > 0) {
        var start = el.getStartPositionOfChar(0);
        var anchor = point(m, start.x, start.y);
        out.advanceStart = round(anchor.x);
        out.baseline = round(anchor.y);
        var advance = 0;
        try { advance = el.getComputedTextLength(); } catch (err) { advance = 0; }
        // Scaled through the same matrix as everything else: an advance measured
        // inside a scaled <g> is not the advance the root sees.
        var advanceEnd = point(m, start.x + advance, start.y);
        out.advanceWidth = round(advanceEnd.x - anchor.x);

        // INK IS MEASURED ON LEAF RUNS ONLY. A <text> with <tspan> children holds
        // runs at different sizes, and one canvas measurement of the whole string
        // at the parent's size would be a confident, wrong number. The parent's
        // ink is the union of its children's, taken below once they are all in.
        if (el.children.length === 0) {
          ctx.font = shorthand(cs2.fontStyle, cs2.fontWeight, size, cs2.fontFamily);
          try { if ('letterSpacing' in ctx) ctx.letterSpacing = cs2.letterSpacing === 'normal' ? '0px' : cs2.letterSpacing; } catch (err) { /* older engines */ }
          var tm = ctx.measureText(el.textContent || '');
          var inkLocal = {
            x: start.x - tm.actualBoundingBoxLeft,
            y: start.y - tm.actualBoundingBoxAscent,
            width: tm.actualBoundingBoxLeft + tm.actualBoundingBoxRight,
            height: tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent
          };
          out.ink = rect(m, inkLocal);
          if (inkLocal.width === 0 && inkLocal.height === 0) out.degenerate = true;
        }

        var glyphs = [];
        var limit = Math.min(chars, GLYPH_LIMIT);
        for (var c = 0; c < limit; c++) {
          try { glyphs.push({ char: (el.textContent || '').charAt(c), box: rect(m, el.getExtentOfChar(c)) }); } catch (err) { /* a char with no extent */ }
        }
        if (chars > limit) warnings.push(out.ref + ' has ' + chars + ' characters; the first ' + limit + ' are reported.');
        out.glyphs = glyphs;
      } else {
        out.degenerate = true;
      }
    }
    nodes.push(out);
  }
  if (stopped) warnings.push('the drawing has more than ' + NODE_LIMIT + ' nodes; the first ' + NODE_LIMIT + ' are reported.');

  // A composed run's ink is the union of the runs inside it. Paths carry the
  // nesting, so a node's descendants are exactly the ones whose path starts with
  // its own — no second walk and no parent pointers to keep in step.
  for (var u = 0; u < nodes.length; u++) {
    var parent = nodes[u];
    if ((parent.kind !== 'text' && parent.kind !== 'tspan') || parent.ink) continue;
    var prefix = parent.path + '.';
    var union = null;
    for (var w = 0; w < nodes.length; w++) {
      var child = nodes[w];
      if (!child.ink || child.path.indexOf(prefix) !== 0) continue;
      union = union === null ? child.ink.slice() : [
        Math.min(union[0], child.ink[0]),
        Math.min(union[1], child.ink[1]),
        Math.max(union[0] + union[2], child.ink[0] + child.ink[2]) - Math.min(union[0], child.ink[0]),
        Math.max(union[1] + union[3], child.ink[1] + child.ink[3]) - Math.min(union[1], child.ink[1])
      ];
    }
    if (union) parent.ink = [round(union[0]), round(union[1]), round(union[2]), round(union[3])];
  }

  var vb = root.getAttribute('viewBox');
  var viewBox = null;
  if (vb) {
    var parts = vb.trim().split(/[\\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(function (p) { return isFinite(p); })) viewBox = parts;
  }

  host.remove();
  return { viewBox: viewBox, space: 'root user units, y-down; nested transforms resolved', fonts: fonts, nodes: nodes, warnings: warnings };
})()`
}
