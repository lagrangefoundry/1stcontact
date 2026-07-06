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
