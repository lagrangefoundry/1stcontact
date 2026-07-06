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
import type { PageDiagnostics } from '../cli'
import type { ConformanceViolation } from './types'

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
