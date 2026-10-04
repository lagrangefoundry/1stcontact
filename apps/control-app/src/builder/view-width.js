/**
 * Which widths the preview offers, defined once ([[REQ-388]]).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, for `email-shape.js`'s reason: the rule
 * is needed on both sides of the seam. The builder's width control renders the
 * draft at these widths, and the consultant's digest names the client's width by
 * the same names — so "tablet" in the chrome and "tablet" in what the assistant
 * is told are the same width by construction rather than by two tables agreeing.
 *
 * THE WIDTHS ARE THE SITE'S, NOT THE CHROME'S. Each fixed choice aims at a
 * nominal width — `screenshot`'s `mobile` / `tablet` / `desktop` presets — and
 * renders at the site's own ladder width nearest it. A page laid out at
 * `[320, 375, 768, 1024, 1280, 1440]` is shown at 375, 768 and 1280: widths it
 * was actually designed at, never a width between two of its layouts. A page
 * with no ladder yet falls back to the nominal itself.
 */

/** The control's settings, in the order it offers them. `fit` is the pane's own width. */
export const VIEW_MODES = ['desktop', 'tablet', 'phone', 'fit']

/** What the control calls each setting — and what the digest calls it too. */
export const VIEW_LABELS = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  phone: 'Phone',
  fit: 'Fit pane',
}

/** The width each fixed setting aims at, before the site's ladder is consulted. */
export const NOMINAL_WIDTHS = {
  phone: 375,
  tablet: 768,
  desktop: 1280,
}

/** The ladder width nearest `target` (the earlier on a tie), or `target` with no ladder. */
function nearest(target, ladder) {
  let best = null
  for (const w of ladder) {
    if (typeof w !== 'number' || !Number.isFinite(w)) continue
    if (best === null || Math.abs(w - target) < Math.abs(best - target)) best = w
  }
  return best ?? target
}

/**
 * The layout width a setting renders at, or `null` for `fit` — which has none of
 * its own and follows the pane.
 *
 * @param {string} mode one of {@link VIEW_MODES}
 * @param {readonly number[]} ladder the page's L1 `widths`, any order
 */
export function presetWidth(mode, ladder) {
  const target = NOMINAL_WIDTHS[mode]
  return target === undefined ? null : nearest(target, ladder ?? [])
}

/**
 * The control's name for a ladder width, or `null` when no setting renders at it
 * — `768` is "tablet" on a ladder whose nearest-to-768 is 768, and nothing on a
 * ladder where some other width is nearer.
 */
export function layoutLabel(width, ladder) {
  for (const mode of ['phone', 'tablet', 'desktop']) {
    if (presetWidth(mode, ladder) === width) return mode
  }
  return null
}
