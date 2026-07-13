/**
 * REQ-39 — the fast-tier **safety** checks ([[DOC-20]] §"Dimensions → checks").
 *
 * Two halves:
 *   1. {@link SAFETY_PROBE} — a page-scope expression (run through the driver's
 *      `query`) that measures the geometric signals a screenshot can't judge:
 *      horizontal overflow, containers collapsed to zero height, and clipped
 *      text.
 *   2. {@link evaluateSafety} — folds that probe plus the driver's
 *      {@link PageDiagnostics} (console / page errors, failed requests) into a
 *      list of AC-tagged {@link ConformanceViolation}s.
 *
 * The AC ids below are the stable `except` match keys and the labels surfaced in
 * failure output — keep them stable across refactors (they are matrix-facing).
 */
import { computeDiff, cropRaster, decodeImageBytes, type Raster } from '../cli'
import type { PageDiagnostics } from '../cli'
import type { ConformanceEngine, ConformanceViolation } from './types'

/** Raw geometric signals returned by {@link SAFETY_PROBE} from page scope. */
export interface SafetyProbe {
  /** Document scroll width vs. the viewport inner width (horizontal overflow). */
  overflow: { scrollWidth: number; innerWidth: number }
  /** Descriptions of clipping containers whose content collapsed to 0 height. */
  collapsed: string[]
  /** Descriptions of clipping containers whose text is cut off (not collapsed). */
  clipped: string[]
}

/**
 * A page-scope IIFE (evaluated as an expression by the driver) that walks the
 * rendered body once and reports overflow / collapse / clip signals. It only
 * flags an element that *hides* content — an `overflow: hidden|clip` box — since
 * visible spill and reachable scroll are not safety failures.
 */
export const SAFETY_PROBE = `(() => {
  const root = document.documentElement;
  const overflow = { scrollWidth: root.scrollWidth, innerWidth: window.innerWidth };
  const collapsed = [];
  const clipped = [];
  const hides = (v) => v === 'hidden' || v === 'clip';
  const describe = (el) => {
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    return el.tagName.toLowerCase() + (text ? ': "' + text + '"' : '');
  };
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') continue;
    if ((el.textContent || '').trim().length === 0) continue;
    if (el.scrollHeight === 0) continue;
    if (!(hides(cs.overflowY) || hides(cs.overflowX))) continue;
    if (el.clientHeight === 0) {
      collapsed.push(describe(el));
    } else if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
      clipped.push(describe(el));
    }
  }
  return { overflow, collapsed, clipped };
})()`

/**
 * Fold the {@link SafetyProbe} geometry and the driver {@link PageDiagnostics}
 * into AC-tagged violations for one fixture at one viewport. A 1px tolerance on
 * overflow absorbs sub-pixel layout jitter without masking a real spill.
 */
export function evaluateSafety(
  fixture: string,
  viewport: string,
  probe: SafetyProbe,
  diag: PageDiagnostics,
): ConformanceViolation[] {
  const violations: ConformanceViolation[] = []
  const flag = (ac: string, message: string): void => {
    violations.push({ fixture, viewport, ac, message })
  }

  for (const err of diag.consoleErrors) flag('safety.console-error', `console error: ${err}`)
  for (const err of diag.pageErrors) flag('safety.page-error', `uncaught page error: ${err}`)
  for (const url of diag.failedRequests) flag('safety.failed-request', `request failed: ${url}`)

  if (probe.overflow.scrollWidth > probe.overflow.innerWidth + 1) {
    flag(
      'safety.overflow',
      `horizontal overflow: scrollWidth ${probe.overflow.scrollWidth}px > viewport ${probe.overflow.innerWidth}px`,
    )
  }
  for (const c of probe.collapsed) flag('safety.collapsed', `expected-content container collapsed to 0 height (${c})`)
  for (const c of probe.clipped) flag('safety.clipped', `text clipped by an overflow-hidden container (${c})`)

  return violations
}

// ── REQ-40 security dimension ([[DOC-20]] AC-M2; detector for [[REQ-46]]) ──────

/**
 * A page-scope sentinel a payload sets if it actually *executes* (a fired
 * `javascript:` navigation, an inline handler that ran). The probe reads it as a
 * belt-and-suspenders signal alongside the static DOM scan below.
 */
export const XSS_SENTINEL = '__fcXssExecuted'

/**
 * Raw security signals returned by {@link SECURITY_PROBE} from page scope. Every
 * signal is read from the **authored** DOM (`getAttribute`, not the resolved
 * property) so a scheme the browser would silently neutralize is still seen — the
 * detector must judge what the module *emitted*, not what Chromium tolerated.
 */
export interface SecurityProbe {
  /** `href`/`src`/`action`/`formaction` values whose URL scheme is unsafe. */
  unsafeUrls: string[]
  /** Descriptions of elements carrying an inline `on*` event-handler attribute. */
  eventHandlers: string[]
  /** Descriptions of elements whose inline `style=` shows CSS-context breakout. */
  styleBreakouts: string[]
  /** True if an injected payload actually executed (set the sentinel). */
  xssFired: boolean
}

/**
 * A page-scope IIFE (evaluated as an expression by the driver) that scans the
 * rendered DOM for content-injection artefacts a module acting as the
 * sanitization boundary must never emit: unsafe URL schemes on link/resource
 * attributes, inline event handlers, and inline styles that break out of their
 * declaration context. Schemes are read from the raw attribute so a neutralized-
 * but-still-emitted `javascript:` is caught.
 */
export const SECURITY_PROBE = `(() => {
  const SAFE = new Set(['http', 'https', 'mailto', 'tel']);
  const schemeOf = (u) => { const m = /^([a-z][a-z0-9+.-]*):/i.exec((u || '').trim()); return m ? m[1].toLowerCase() : ''; };
  const isUnsafeUrl = (u) => {
    const s = schemeOf(u);
    if (!s) return false;                       // relative / hash / no scheme
    if (SAFE.has(s)) return false;
    if (s === 'data') return !/^\\s*data:image\\//i.test(u);  // data:image/* on assets only
    return true;                                // javascript:, vbscript:, data:text/html, …
  };
  const describe = (el) => {
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
    return el.tagName.toLowerCase() + (text ? ': "' + text + '"' : '');
  };
  const unsafeUrls = [];
  const eventHandlers = [];
  const styleBreakouts = [];
  const URL_ATTRS = ['href', 'src', 'action', 'formaction', 'xlink:href'];
  for (const el of Array.from(document.querySelectorAll('*'))) {
    for (const attr of URL_ATTRS) {
      const v = el.getAttribute(attr);
      if (v && isUnsafeUrl(v)) unsafeUrls.push(attr + '=' + v.trim().slice(0, 60) + ' on ' + describe(el));
    }
    for (const a of Array.from(el.attributes)) {
      if (/^on/i.test(a.name)) eventHandlers.push(a.name + ' on ' + describe(el));
    }
    const st = el.getAttribute('style');
    if (st && (/[{}<]/.test(st) || /javascript:|expression\\s*\\(/i.test(st))) {
      styleBreakouts.push('style="' + st.slice(0, 60) + '" on ' + describe(el));
    }
  }
  return { unsafeUrls, eventHandlers, styleBreakouts, xssFired: window['${XSS_SENTINEL}'] === true };
})()`

/** Origin of a URL (`scheme://host:port`), or '' for non-network schemes. */
function originOf(url: string): string {
  try {
    const u = new URL(url)
    if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') return ''
    return u.origin
  } catch {
    return ''
  }
}

/**
 * Fold the {@link SecurityProbe} plus the driver's requested-URL list into
 * AC-tagged security violations for one fixture at one viewport. Egress is any
 * request whose origin is neither the served origin nor a declared asset-allowlist
 * origin (same-origin assets + declared fonts).
 */
export function evaluateSecurity(
  fixture: string,
  viewport: string,
  probe: SecurityProbe,
  requestedUrls: string[],
  servedOrigin: string,
  assetAllowlist: string[] = [],
): ConformanceViolation[] {
  const violations: ConformanceViolation[] = []
  const flag = (ac: string, message: string): void => {
    violations.push({ fixture, viewport, ac, message })
  }

  for (const u of probe.unsafeUrls) flag('security.url-scheme', `unsafe URL scheme: ${u}`)
  for (const h of probe.eventHandlers) flag('security.script', `inline event handler emitted: ${h}`)
  if (probe.xssFired) flag('security.script', 'an injected payload executed (sentinel fired)')
  for (const s of probe.styleBreakouts) flag('security.css-breakout', `content broke out of inline style context: ${s}`)

  const allowed = new Set([servedOrigin, ...assetAllowlist])
  for (const url of requestedUrls) {
    const origin = originOf(url)
    if (origin && !allowed.has(origin)) flag('security.egress', `request to off-allowlist origin: ${url}`)
  }

  return violations
}

// ── REQ-41 responsive dimension ([[DOC-20]] AC-M4) ────────────────────────────
//
// Responsive is the **viewport axis** over the fast safety checks (overflow /
// collapsed / clipped, run at every width by {@link evaluateSafety}) plus the two
// mobile-band checks below. The overflow check already enforces "images scale
// within the viewport" — an image wider than the viewport *is* horizontal
// overflow — so there is no separate image-scale check; that would be a redundant
// code path for a signal `safety.overflow` already catches.

/** Widths at/below which the mobile-specific checks apply (the "mobile band"). */
export const MOBILE_BAND_MAX_PX = 480
/** Minimum rendered size (px, both axes) for a mobile tap target (Apple HIG). */
export const MIN_TAP_TARGET_PX = 44
/** Legibility floor (px) for on-screen text in the mobile band. Matches the
 *  smallest design token (`--font-size-xs` = 0.75rem = 12px), so a well-formed
 *  module using the smallest token still passes. */
export const MOBILE_FONT_FLOOR_PX = 12

/** Raw mobile-band signals returned by {@link RESPONSIVE_PROBE} from page scope. */
export interface ResponsiveProbe {
  /** Interactive controls whose rendered box is under {@link MIN_TAP_TARGET_PX}. */
  smallTapTargets: string[]
  /** Visible text runs whose computed font-size is under {@link MOBILE_FONT_FLOOR_PX}. */
  smallFonts: string[]
}

/**
 * A page-scope IIFE (evaluated as an expression by the driver) that, at a mobile
 * viewport, reports interactive controls too small to tap and text below the
 * legibility floor. Inline anchors sitting in a text flow are exempt from the
 * tap-target rule (WCAG 2.5.5's inline exception) — otherwise every prose link
 * would false-positive. Only elements carrying their *own* direct text node are
 * measured for the font floor, so container elements are not judged by a child's
 * size.
 */
export const RESPONSIVE_PROBE = `(() => {
  const MIN_TAP = ${MIN_TAP_TARGET_PX};
  const FONT_FLOOR = ${MOBILE_FONT_FLOOR_PX};
  const smallTapTargets = [];
  const smallFonts = [];
  const describe = (el) => {
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
    const label = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('name') || el.getAttribute('type'));
    return el.tagName.toLowerCase() + (text ? ': "' + text + '"' : (label ? ' [' + label + ']' : ''));
  };
  const visible = (cs) => cs.display !== 'none' && cs.visibility !== 'hidden' && cs.visibility !== 'collapse';
  const INTERACTIVE = 'button, [role="button"], input, select, textarea, a[href]';
  for (const el of Array.from(document.querySelectorAll(INTERACTIVE))) {
    const cs = getComputedStyle(el);
    if (!visible(cs)) continue;
    if (el.tagName === 'INPUT' && el.getAttribute('type') === 'hidden') continue;
    if (el.tagName === 'A' && cs.display === 'inline') continue;   // inline-in-text link: exempt
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;                  // not laid out
    if (r.width + 0.5 < MIN_TAP || r.height + 0.5 < MIN_TAP) {
      smallTapTargets.push(describe(el) + ' (' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px)');
    }
  }
  const hasDirectText = (el) => {
    for (const n of Array.from(el.childNodes)) {
      if (n.nodeType === 3 && (n.textContent || '').trim().length > 0) return true;
    }
    return false;
  };
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    const cs = getComputedStyle(el);
    if (!visible(cs)) continue;
    if (!hasDirectText(el)) continue;
    const size = parseFloat(cs.fontSize);
    if (size && size + 0.5 < FONT_FLOOR) {
      smallFonts.push(describe(el) + ' (' + size.toFixed(1) + 'px)');
    }
  }
  return { smallTapTargets, smallFonts };
})()`

/**
 * Fold the {@link ResponsiveProbe} into AC-tagged mobile-band violations for one
 * fixture at one (mobile) viewport. Called only for widths ≤
 * {@link MOBILE_BAND_MAX_PX}; the overflow / collapse / clip signals are handled
 * by {@link evaluateSafety} at every width.
 */
export function evaluateResponsive(
  fixture: string,
  viewport: string,
  probe: ResponsiveProbe,
): ConformanceViolation[] {
  const violations: ConformanceViolation[] = []
  const flag = (ac: string, message: string): void => {
    violations.push({ fixture, viewport, ac, message })
  }

  for (const t of probe.smallTapTargets)
    flag('responsive.tap-target', `mobile tap target below ${MIN_TAP_TARGET_PX}px: ${t}`)
  for (const f of probe.smallFonts)
    flag('responsive.font-floor', `text below the ${MOBILE_FONT_FLOOR_PX}px mobile legibility floor: ${f}`)

  return violations
}

// ── REQ-42 cross-browser dimension ([[DOC-20]] AC-M3) ─────────────────────────
//
// Cross-browser is the **engine axis**: render the same one-module page in Blink
// (Chromium), WebKit and Gecko (Firefox) and assert the layout is *equivalent*
// within tolerance — NOT pixel-equal (engines antialias and hint fonts
// differently, so pixel equality would be permanently red). The primary signal
// is a **layout-box** comparison; a perceptual block-diff is the backstop for
// movement no box in the list covers. Full tier only — regression-scoped.

/** One element's geometry, measured **relative to its `offsetParent`**. */
export interface XBrowserBox {
  /** Document-order index — the cross-engine join key (same DOM in every engine). */
  i: number
  /** Lowercased tag name, checked for structural parity before boxes are compared. */
  tag: string
  /** Short human label surfaced in a shift violation. */
  label: string
  /** Left offset from the element's `offsetParent` (px). */
  dx: number
  /** Top offset from the element's `offsetParent` (px). */
  dy: number
  /** Border-box width (px). */
  w: number
  /** Border-box height (px). */
  h: number
}

/** Raw layout-box list returned by {@link X_BROWSER_BOX_PROBE} from page scope. */
export interface XBrowserProbe {
  boxes: XBrowserBox[]
}

/** Per-axis tolerances (px) for the {@link evaluateXBrowser} box comparison. */
export interface XBrowserTolerance {
  /** Max cross-engine drift of an element's parent-relative position (default 6). */
  posPx: number
  /** Max cross-engine drift of an element's border-box size (default 12). */
  sizePx: number
}

/**
 * Default box tolerances, calibrated against the live faelan `%`-`top` bug: a
 * layer child mispositioned by ~1 line (~20px) relative to its containing block.
 * `posPx: 6` sits well above cross-engine sub-pixel/AA jitter (≲2px on a *local*
 * parent-relative offset) yet well below that 20px shift, so it just-catches the
 * bug without flaking. `sizePx: 12` absorbs the line-height rounding a text
 * element's own height can accrue between engines.
 */
export const X_BROWSER_TOLERANCE: XBrowserTolerance = { posPx: 6, sizePx: 12 }

/**
 * A page-scope IIFE (evaluated as an expression by the driver) that walks the
 * rendered body in document order and records each visible element's box
 * **relative to its `offsetParent`**. Parent-relative geometry is deliberate:
 * whole-page text reflow (cross-engine line-height rounding) accumulates down the
 * page and would swamp an absolute-coordinate comparison, whereas a *local* shift
 * — the faelan layer-child `%`-`top` bug — moves the child relative to its
 * positioned containing block and stands out. The document-order index is the
 * cross-engine join key: the served HTML is byte-identical in every engine, so
 * the i-th element is the same element everywhere; only its layout differs.
 */
export const X_BROWSER_BOX_PROBE = `(() => {
  const boxes = [];
  const visible = (cs) => cs.display !== 'none' && cs.visibility !== 'hidden' && cs.visibility !== 'collapse';
  const describe = (el) => {
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
    return el.tagName.toLowerCase() + (text ? ': "' + text + '"' : '');
  };
  const all = Array.from(document.body.querySelectorAll('*'));
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const cs = getComputedStyle(el);
    if (!visible(cs)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) continue;             // not laid out
    const pe = el.offsetParent || el.parentElement || document.body;
    const pr = pe.getBoundingClientRect();
    boxes.push({
      i,
      tag: el.tagName.toLowerCase(),
      label: describe(el),
      dx: r.left - pr.left,
      dy: r.top - pr.top,
      w: r.width,
      h: r.height,
    });
  }
  return { boxes };
})()`

/**
 * Compare the reference engine's layout boxes (Chromium == Blink) against another
 * engine's, folding drifts beyond tolerance into AC-tagged violations for one
 * fixture at one viewport. Structural parity is asserted first — a missing index
 * or a tag mismatch means the engines produced *different DOM*, a stronger fault
 * than a shift (`x-browser.structure`). Position and size are then compared per
 * element against {@link XBrowserTolerance} (`x-browser.layout-shift`).
 */
export function evaluateXBrowser(
  fixture: string,
  viewport: string,
  engine: ConformanceEngine,
  reference: XBrowserBox[],
  other: XBrowserBox[],
  tol: XBrowserTolerance = X_BROWSER_TOLERANCE,
): ConformanceViolation[] {
  const violations: ConformanceViolation[] = []
  const flag = (ac: string, message: string): void => {
    violations.push({ fixture, viewport, ac, message })
  }

  const otherByIndex = new Map(other.map((b) => [b.i, b]))
  for (const ref of reference) {
    const cmp = otherByIndex.get(ref.i)
    if (!cmp) {
      flag(
        'x-browser.structure',
        `${engine} is missing element #${ref.i} (${ref.label}) that Chromium rendered`,
      )
      continue
    }
    if (cmp.tag !== ref.tag) {
      flag(
        'x-browser.structure',
        `element #${ref.i} is <${ref.tag}> in Chromium but <${cmp.tag}> in ${engine}`,
      )
      continue
    }
    const dPos = Math.max(Math.abs(cmp.dx - ref.dx), Math.abs(cmp.dy - ref.dy))
    const dSize = Math.max(Math.abs(cmp.w - ref.w), Math.abs(cmp.h - ref.h))
    if (dPos > tol.posPx) {
      flag(
        'x-browser.layout-shift',
        `${ref.label} shifts ${dPos.toFixed(1)}px in ${engine} (tol ${tol.posPx}px): ` +
          `Δpos (${(cmp.dx - ref.dx).toFixed(1)}, ${(cmp.dy - ref.dy).toFixed(1)})`,
      )
    } else if (dSize > tol.sizePx) {
      flag(
        'x-browser.layout-shift',
        `${ref.label} resizes ${dSize.toFixed(1)}px in ${engine} (tol ${tol.sizePx}px): ` +
          `Δsize (${(cmp.w - ref.w).toFixed(1)}, ${(cmp.h - ref.h).toFixed(1)})`,
      )
    }
  }
  return violations
}

/**
 * Backstop region-intensity threshold (0..255): a cross-engine block-diff region
 * whose mean intensity meets this is a *localized* difference (a moved band, a
 * mispainted layer), not the low, spatially-diffuse noise of differing font
 * antialiasing. Looser than any same-engine fidelity gate on purpose — this only
 * needs to catch gross movement the box list missed, not judge visual polish.
 */
export const X_BROWSER_BACKSTOP_THRESHOLD = 60

/**
 * Perceptual backstop: block-average diff (REQ-38 {@link computeDiff}) of the
 * Chromium screenshot against another engine's, flagging `x-browser.perceptual`
 * when a region's mean intensity crosses {@link X_BROWSER_BACKSTOP_THRESHOLD}.
 * Screenshots are cropped to their common dimensions first (engines can differ in
 * full-page height). Catches movement not covered by any element in the box list.
 */
export async function evaluateXBrowserBackstop(
  fixture: string,
  viewport: string,
  engine: ConformanceEngine,
  referenceShot: Uint8Array,
  otherShot: Uint8Array,
  threshold: number = X_BROWSER_BACKSTOP_THRESHOLD,
): Promise<ConformanceViolation[]> {
  const refRaster = await decodeImageBytes(referenceShot)
  const otherRaster = await decodeImageBytes(otherShot)
  const w = Math.min(refRaster.width, otherRaster.width)
  const h = Math.min(refRaster.height, otherRaster.height)
  const ref: Raster = cropRaster(refRaster, w, h)
  const other: Raster = cropRaster(otherRaster, w, h)
  // Higher blockThreshold than the default fidelity diff: only strongly-differing
  // cells seed a region, so uniform AA noise never clusters into a false region.
  const diff = computeDiff(ref, other, { blockThreshold: 48 })
  const worst = diff.regions.reduce((m, r) => Math.max(m, r.meanDiff), 0)
  if (worst >= threshold) {
    const region = diff.regions.find((r) => r.meanDiff === worst)
    return [
      {
        fixture,
        viewport,
        ac: 'x-browser.perceptual',
        message:
          `${engine} render diverges from Chromium in a region the box list did not ` +
          `cover (mean intensity ${worst.toFixed(0)}/255 ≥ ${threshold}` +
          (region ? `, at ${region.bbox.w}×${region.bbox.h}px near (${region.bbox.x},${region.bbox.y})` : '') +
          ')',
      },
    ]
  }
  return []
}
