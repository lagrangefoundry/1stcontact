/**
 * REQ-352 — the content anchor: ONE population, ONE derivation, both sides.
 *
 * ## The defect this retires
 *
 * A band's `contentAnchorRatio` — where the text it carries sits vertically,
 * as a fraction of its height — used to be measured **two different ways inside
 * the page script**, and which one a band got depended only on the code path it
 * took. A geometric slice measured every run whose centre fell in its box; a
 * single band walked its own DOM DESCENDANTS. Those agree on a conventionally
 * nested page and disagree exactly when one band OVERLAPS another: an
 * absolutely-positioned `<header>` over a hero is its own band, so its runs are
 * not descendants of the hero and the walk excluded them, while a geometric box
 * is a partition and cannot. On gigabytealchemy.ai that is 0.53 against 0.39 on
 * byte-identical geometry, and the fidelity diff was right to decline to compare
 * two numbers that are not the same measurement (REQ-270) — which left the axis
 * permanently UNMEASURED on the commonest layout on the web.
 *
 * A second, independent split sat beside it: a capture bundle's *section*
 * coalesces consecutive bands that share a style signature, publishing their
 * UNION box, and took its anchor from the FIRST band — a ratio against a box
 * that is not that band's the moment two bands coalesce. On
 * joyfulculinarycreations.com that was reported as a live `contentAnchor` delta
 * of `top (0.22)` against a reproduction's `center (0.55)`, on content the
 * reproduction had placed correctly.
 *
 * ## The population
 *
 * **Every run whose CENTRE falls inside the band's box, whichever band collected
 * it.** Geometry is not a preference here, it is the only population both sides
 * can compute: an L1 reproduction's bands are the painted slices of one page-wide
 * root and therefore a partition, so a header's runs sit inside the hero slice
 * with nothing marking them as another section's. "Exclude the nested section's
 * runs" is not a question that side can answer; "every run whose centre falls in
 * this box" is, on both sides, from the runs each side already collected.
 *
 * It is also nearly inert on the ordinary page, and the exceptions are the two
 * defects themselves. Recomputed across the three stored references — 21 sections
 * in all — it moves FOUR:
 *
 * | reference | § | stored | one population | which defect |
 * |---|---|---|---|---|
 * | gigabytealchemy.ai | 1 | 0.53 | 0.39 | header over hero (the DOM walk excluded the wordmark) |
 * | joyfulculinarycreations.com | 1 | 0.58 | 0.43 | header over hero |
 * | joyfulculinarycreations.com | 2 | 0.22 | 0.55 | coalesced section (the first band's ratio) |
 * | joyfulculinarycreations.com | 3 | 0.50 | 0.48 | coalesced section |
 *
 * The other seventeen keep the anchor their DOM walk already reported. Of the
 * four, three are the two defects at the magnitudes the fidelity diff actually
 * reported (0.53/0.39 declined as incomparable, 0.22/0.55 reported as a live
 * delta); the fourth moves 0.02, well inside the 0.15 tolerance, so it was never
 * a delta either way.
 *
 * The population is document-wide rather than per-root for the same reason: a
 * page-builder page's `<header>` is a SIBLING of the full-page wrapper whose
 * slices the hero is one of, so a per-root walk excludes it and reintroduces the
 * split this module exists to close.
 *
 * ## Why it lives here and not in the page script
 *
 * The extractor's job is to MEASURE — a run's line box, a band's box. Both are
 * already in {@link RawSignals}, so the anchor is arithmetic over what the page
 * handed back, not a second reading of the DOM. Deriving it here means there is
 * one implementation instead of two, it is exercised without launching a browser,
 * and the bundle's stored `layout.contentAnchorRatio` and the reproduction's
 * projected one cannot drift apart — which is the whole of the defect above.
 */
import type { Box } from './types'
import type { RawBand, RawRun, RawSignals } from './extract'

/**
 * The vertical extent of some text, in full-page document coordinates.
 *
 * The span, not the ratio. WHICH box the ratio is taken against depends on the
 * reader — a reproduction asks it of one raw band's box, a capture section of its
 * possibly-coalesced union box — so the span travels and the arithmetic is
 * applied where the box is known.
 */
export interface ContentSpan {
  top: number
  bottom: number
}

/** Does this box's centre fall inside that vertical band? */
function centreInside(box: Box | undefined, band: Box): boolean {
  if (!box) return false
  const centre = box.y + box.height / 2
  return centre >= band.y && centre < band.y + band.height
}

/** Every text run in a document, whichever band collected it (content + item rows). */
function documentRuns(bands: readonly RawBand[]): readonly RawRun[] {
  const out: RawRun[] = []
  for (const band of bands) {
    out.push(...band.content)
    for (const rows of band.items) out.push(...rows)
  }
  return out
}

/**
 * The span of the text each band carries, parallel to `signals.bands`.
 *
 * `null` for a band that carries none. Item rows count: a band's repeated rows
 * are text it paints, and whether a row was lifted into an item group is a
 * detection that differs between a reference page and an L1 render — so making
 * the population depend on it would make it side-dependent again.
 */
export function contentAnchorSpans(signals: RawSignals): readonly (ContentSpan | null)[] {
  const runs = documentRuns(signals.bands)
  return signals.bands.map((band) => spanOfRunsIn(band.box, runs))
}

/** The union of the line boxes of every run whose centre falls inside `box`. */
export function spanOfRunsIn(box: Box, runs: readonly RawRun[]): ContentSpan | null {
  let top = Infinity
  let bottom = -Infinity
  for (const run of runs) {
    if (!centreInside(run.box, box)) continue
    if (run.box.y < top) top = run.box.y
    if (run.box.y + run.box.height > bottom) bottom = run.box.y + run.box.height
  }
  return bottom > -Infinity ? { top, bottom } : null
}

/**
 * A content anchor: the centre of `span` as a fraction of `box`'s height
 * (0 = top … 1 = bottom), or `null` when there is no text to place or no height
 * to place it in.
 *
 * Clamped and rounded to two decimals, as the page-side measurement was: the
 * anchor is compared against a 0.15 tolerance, so more precision than that is
 * noise a reader has to ignore.
 */
export function anchorRatioOfSpan(
  box: { y: number; height: number },
  span: ContentSpan | null,
): number | null {
  if (!span || box.height <= 0) return null
  const ratio = ((span.top + span.bottom) / 2 - box.y) / box.height
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100) / 100
}

/**
 * The union of several spans, or `null` when none of them carries text.
 *
 * A capture section coalesces consecutive bands sharing a style signature, so its
 * anchor is measured over every coalesced band's text against the section's own
 * union box — not, as it once was, over the first band's text against a box that
 * is not that band's.
 */
export function mergeContentSpans(spans: readonly (ContentSpan | null)[]): ContentSpan | null {
  let top = Infinity
  let bottom = -Infinity
  for (const span of spans) {
    if (!span) continue
    if (span.top < top) top = span.top
    if (span.bottom > bottom) bottom = span.bottom
  }
  return bottom > -Infinity ? { top, bottom } : null
}
