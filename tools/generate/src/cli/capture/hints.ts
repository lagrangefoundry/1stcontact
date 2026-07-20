/**
 * Structural-hint extraction (REQ-83 / REQ-79 B2) — the *advisory* half of the
 * capture-to-L1 pivot (extends DOC-13 rendered-only → rendered + hints).
 *
 * Capture reads painted geometry (the fold); it cannot read *relationships* —
 * containment, flow, fluid-vs-fixed, distribution. This pass annotates each
 * visible element with the CSS-mechanism facts the fold deliberately omits:
 * ancestry (`parentId`), sibling-repetition, the *parent's* computed layout
 * (`display`/`flex-direction`/`justify-content`/`gap`/`grid-template-columns`),
 * per-axis sizing unit (`%`/`fr`/`auto`/`clamp` vs `px`), position mode, and the
 * page's real `@media` breakpoints.
 *
 * **Advisory only, never executed.** These hints are read for DIRECTION (which
 * structure the AI should *recover* over the absolute-base fold), never for
 * EXECUTION — nothing in the render path consumes them. The script is authored as
 * a raw string (like {@link module:extract}) so the exact source is what the
 * browser evaluates.
 */

/** How an axis is sized in the authored CSS — the unit, not the resolved px. */
export type SizingUnit = 'px' | 'percent' | 'fr' | 'auto' | 'clamp' | 'viewport' | 'other'

/** The parent's computed layout — the container mode the AI recovers over the fold. */
export interface ParentLayout {
  display: string
  flexDirection: string | null
  justifyContent: string | null
  gap: string | null
  gridTemplateColumns: string | null
}

/** One element's advisory structural hints. `id`/`parentId` reconstruct ancestry. */
export interface HintNode {
  id: number
  parentId: number | null
  tag: string
  a11yRole: string
  /** Computed `position` (static/relative/absolute/fixed/sticky). */
  position: string
  /** The element's own computed `display`. */
  display: string
  /** The parent's computed layout, or null when the element has no element parent. */
  parentLayout: ParentLayout | null
  /** Authored width unit (from matched CSS / inline style), or null when undetermined. */
  widthUnit: SizingUnit | null
  /** Authored height unit, or null when undetermined. */
  heightUnit: SizingUnit | null
  /** Count of visible siblings sharing this element's tag+class signature (>=1). */
  repeatCount: number
  /** Painted box in full-page document coords — the tie back to the fold's geometry. */
  box: { x: number; y: number; width: number; height: number }
}

/** The advisory structural-hint sidecar for one captured page. */
export interface StructuralHints {
  viewport: { width: number; height: number }
  /** Real `@media (min-width|max-width: …px)` breakpoints on the page, ascending. */
  mediaBreakpoints: number[]
  nodes: HintNode[]
}

/** A driver that can evaluate a script in page scope (the capture `BrowserDriver` seam). */
export interface HintDriver {
  query<T = unknown>(script: string): Promise<T>
}

/** Run {@link HINTS_SCRIPT} in page scope and return the structural-hint sidecar. */
export async function extractHints(driver: HintDriver): Promise<StructuralHints> {
  return driver.query<StructuralHints>(HINTS_SCRIPT)
}

export const HINTS_SCRIPT = `(() => {
  var DOC = document.documentElement;
  var docW = DOC.scrollWidth, docH = DOC.scrollHeight;
  var MAX_NODES = 2000;

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
    if (left + r.width <= 0 || top + r.height <= 0) return false;
    if (left >= docW || top >= docH) return false;
    return true;
  }
  function absBox(el) {
    var r = el.getBoundingClientRect();
    return { x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY), width: Math.round(r.width), height: Math.round(r.height) };
  }
  function a11yRoleOf(el) {
    var explicit = el.getAttribute && el.getAttribute('role');
    if (explicit) return explicit.trim().toLowerCase();
    var t = el.tagName.toLowerCase();
    if (t === 'a') return el.getAttribute('href') != null ? 'link' : 'generic';
    if (t === 'button') return 'button';
    if (t === 'img') return 'img';
    if (t === 'hr') return 'separator';
    if (t === 'nav') return 'navigation';
    if (t === 'header') return 'banner';
    if (t === 'footer') return 'contentinfo';
    if (t === 'main') return 'main';
    if (t === 'ul' || t === 'ol') return 'list';
    if (t === 'li') return 'listitem';
    if (/^h[1-6]$/.test(t)) return 'heading';
    if (t === 'input') {
      var ty = (el.getAttribute('type') || 'text').toLowerCase();
      if (ty === 'submit' || ty === 'button' || ty === 'reset') return 'button';
      return 'textbox';
    }
    return 'generic';
  }
  // The authored sizing unit for one axis. Reading getComputedStyle resolves % to
  // px, so the AUTHORED unit is recovered from the matched CSS rules (last wins)
  // and the inline style — the source that still carries the token.
  function unitOf(raw) {
    if (!raw) return null;
    var v = ('' + raw).trim().toLowerCase();
    if (v === '' || v === 'inherit' || v === 'initial' || v === 'unset') return null;
    if (v === 'auto') return 'auto';
    if (v.indexOf('clamp(') === 0 || v.indexOf('min(') === 0 || v.indexOf('max(') === 0) return 'clamp';
    if (/%/.test(v)) return 'percent';
    if (/\\bfr\\b|[0-9.]fr$/.test(v)) return 'fr';
    if (/vw|vh|vmin|vmax/.test(v)) return 'viewport';
    if (/px$/.test(v)) return 'px';
    return 'other';
  }
  // Scan matched style rules + inline style for the last-declared width/height
  // token. Cross-origin stylesheets throw on cssRules — skipped (same discipline
  // as the @font-face walk in extract.ts).
  function authoredSize(el) {
    var w = el.style && el.style.width ? el.style.width : null;
    var h = el.style && el.style.height ? el.style.height : null;
    for (var s = 0; s < document.styleSheets.length; s++) {
      var rules;
      try { rules = document.styleSheets[s].cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (var r = 0; r < rules.length; r++) {
        var rule = rules[r];
        if (!rule.selectorText || !rule.style) continue;
        var matches = false;
        try { matches = el.matches(rule.selectorText); } catch (e) { matches = false; }
        if (!matches) continue;
        var rw = rule.style.getPropertyValue('width');
        var rh = rule.style.getPropertyValue('height');
        if (rw) w = rw;
        if (rh) h = rh;
      }
    }
    return { widthUnit: unitOf(w), heightUnit: unitOf(h) };
  }
  function parentLayoutOf(parent) {
    if (!parent || parent.nodeType !== 1) return null;
    var s = getComputedStyle(parent);
    var isFlex = s.display.indexOf('flex') >= 0;
    var isGrid = s.display.indexOf('grid') >= 0;
    return {
      display: s.display,
      flexDirection: isFlex ? s.flexDirection : null,
      justifyContent: (isFlex || isGrid) ? s.justifyContent : null,
      gap: (isFlex || isGrid) && s.gap && s.gap !== 'normal' ? s.gap : null,
      gridTemplateColumns: isGrid && s.gridTemplateColumns !== 'none' ? s.gridTemplateColumns : null,
    };
  }
  function sigOf(el) { return el.tagName + '.' + el.className; }
  function repeatCountOf(el) {
    var parent = el.parentElement;
    if (!parent) return 1;
    var sig = sigOf(el);
    var n = 0;
    for (var i = 0; i < parent.children.length; i++) {
      var k = parent.children[i];
      if (visible(k) && sigOf(k) === sig) n++;
    }
    return n || 1;
  }

  // Pre-order walk over visible elements; assign ids and the nearest CAPTURED
  // ancestor as parentId (so ancestry reconstructs even though hidden/blank nodes
  // are skipped). Capped at MAX_NODES to bound the advisory sidecar's size.
  var nodes = [];
  function walk(el, parentId) {
    var myId = parentId;
    if (visible(el) && nodes.length < MAX_NODES) {
      var s = getComputedStyle(el);
      var sz = authoredSize(el);
      var id = nodes.length;
      nodes.push({
        id: id,
        parentId: parentId,
        tag: el.tagName.toLowerCase(),
        a11yRole: a11yRoleOf(el),
        position: s.position,
        display: s.display,
        parentLayout: parentLayoutOf(el.parentElement),
        widthUnit: sz.widthUnit,
        heightUnit: sz.heightUnit,
        repeatCount: repeatCountOf(el),
        box: absBox(el),
      });
      myId = id;
    }
    for (var i = 0; i < el.children.length; i++) walk(el.children[i], myId);
  }
  walk(document.body, null);

  // Real @media breakpoints declared on the page (min-width/max-width px), sorted.
  var bp = {};
  for (var s2 = 0; s2 < document.styleSheets.length; s2++) {
    var rules2;
    try { rules2 = document.styleSheets[s2].cssRules; } catch (e) { continue; }
    if (!rules2) continue;
    for (var r2 = 0; r2 < rules2.length; r2++) {
      var rule2 = rules2[r2];
      if (!rule2.media || !rule2.media.mediaText) continue;
      var re = /(?:min|max)-width\\s*:\\s*([0-9.]+)px/g, m;
      while ((m = re.exec(rule2.media.mediaText))) bp[Math.round(parseFloat(m[1]))] = 1;
    }
  }
  var mediaBreakpoints = Object.keys(bp).map(Number).sort(function (a, b) { return a - b; });

  return {
    viewport: { width: window.innerWidth, height: docH },
    mediaBreakpoints: mediaBreakpoints,
    nodes: nodes,
  };
})()`
