/**
 * REQ-270 — the capture schema stamp: which extractor took this bundle.
 *
 * A bundle is the oracle every gate on a reproduction is measured against, and
 * it was written with no record of the code that produced it. `capture.json`'s
 * top-level keys were `url host path title capturedAt viewport theme sections
 * assets` — nothing there can distinguish a bundle taken this minute from one
 * taken by an extractor that did not yet record half the axes the fold now
 * reads. So the two sides of a diff could be measured by different instruments
 * without a word of warning, and a landed capture fix was silently inert: the
 * fold re-ran against the stored bundle, produced the same impoverished L1
 * because its INPUT could not express the new axes, and the loop iterated
 * against a frozen residual whose fix had already shipped.
 *
 * That is the whole problem this file exists for. It is deliberately NOT an
 * automatic re-capture: reusing a stored capture is a requirement, not an
 * oversight — re-capturing re-rolls the acceptance oracle, so the reference
 * moves at the same instant the fold does and the two become inseparable. The
 * remedy is a FINDING that names what this bundle cannot express, so the
 * operator can decide to re-take it.
 */
import type { Capture } from './types'

/**
 * The schema version the current extractor writes into every bundle it takes.
 *
 * BUMP THIS whenever the extractor starts recording an axis it did not record
 * before, and add the axes to {@link CAPTURE_SCHEMA_AXES} under the new number.
 * The version is what makes "this bundle is behind" answerable at all; the axis
 * list is what makes the answer say something an operator can act on.
 *
 * - **1** — every bundle written before the stamp existed. Not a version anyone
 *   chose; it is what {@link captureSchemaOf} reports for an unstamped bundle,
 *   because "no stamp" and "the oldest schema we know about" are the same fact.
 * - **2** — REQ-269: a form field's per-side padding, a run's `href`, a run's
 *   `headingLevel`, and `lineHeightPx` kept to two decimals.
 */
export const CAPTURE_SCHEMA = 2

/** One axis the current extractor records, and when it started recording it. */
export interface CaptureAxis {
  /** The {@link CAPTURE_SCHEMA} version that introduced this axis. */
  since: number
  /** The axis, named as it appears in `capture.json`. */
  axis: string
  /** Where in the bundle it lives, for an operator reading the finding. */
  where: string
  /**
   * Whether this bundle demonstrably carries the axis.
   *
   * A version comparison alone is enough to know a bundle is behind, but it is
   * not enough to know which axes it is MISSING — a bundle may carry an axis
   * that the stamp says predates it (re-extracted, hand-repaired). So an axis
   * the bundle visibly has is never named in the finding, even when the stamp
   * says it should be absent: the finding claims absence, and it should only
   * claim what it can see.
   *
   * The converse is not symmetric and deliberately so. A page with no links
   * records no `href` however new its extractor is, so "not observed" cannot
   * prove "not recordable" — which is exactly why the version gate comes first
   * and this probe only ever REMOVES an axis from the list.
   */
  present: (capture: Capture) => boolean
}

const runs = (capture: Capture): readonly { [k: string]: unknown }[] =>
  capture.sections.flatMap((s) => [
    ...s.content,
    ...s.items.flatMap((i) => i.content),
  ]) as unknown as readonly { [k: string]: unknown }[]

const fields = (capture: Capture): readonly { [k: string]: unknown }[] =>
  capture.sections.flatMap((s) => s.fields ?? []) as unknown as readonly { [k: string]: unknown }[]

/**
 * Every axis the current extractor records, with the schema version that
 * introduced it. Only axes introduced AFTER a bundle's own stamp are reported
 * against it, so this list grows and nothing here has to be revised.
 */
export const CAPTURE_SCHEMA_AXES: readonly CaptureAxis[] = [
  {
    since: 2,
    axis: 'paddingTopPx/paddingRightPx/paddingBottomPx/paddingLeftPx',
    where: 'a form field (`sections[].fields[]`)',
    present: (c) => fields(c).some((f) => typeof f.paddingLeftPx === 'number'),
  },
  {
    since: 2,
    axis: 'href',
    where: 'a content run (`sections[].content[]`)',
    present: (c) => runs(c).some((r) => typeof r.href === 'string'),
  },
  {
    since: 2,
    axis: 'headingLevel',
    where: 'a content run (`sections[].content[]`)',
    present: (c) => runs(c).some((r) => typeof r.headingLevel === 'number'),
  },
  {
    since: 2,
    axis: 'lineHeightPx to two decimals',
    where: 'a content run (`sections[].content[]`)',
    // A whole-pixel line-height is legal at any schema, so a bundle only proves
    // it has the precision by carrying a fractional one.
    present: (c) => runs(c).some((r) => typeof r.lineHeightPx === 'number' && !Number.isInteger(r.lineHeightPx)),
  },
]

/**
 * The schema a bundle was taken at. An unstamped bundle is schema 1 — see
 * {@link CAPTURE_SCHEMA}.
 */
export function captureSchemaOf(capture: Pick<Capture, 'captureSchema'>): number {
  const stamp = capture.captureSchema
  return typeof stamp === 'number' && Number.isFinite(stamp) ? stamp : 1
}

/** The axes the current extractor records that this bundle does not carry. */
export function staleCaptureAxes(capture: Capture): readonly CaptureAxis[] {
  const at = captureSchemaOf(capture)
  if (at >= CAPTURE_SCHEMA) return []
  return CAPTURE_SCHEMA_AXES.filter((a) => a.since > at && !a.present(capture))
}

/**
 * The operator-facing sentence for a bundle that is behind the extractor, or
 * `null` when it is current.
 *
 * Names the two versions and the axes, and says what to do — which is a
 * decision, not an instruction: re-capturing moves the oracle, so a residual
 * measured before and after a re-capture is two different measurements.
 */
export function staleCaptureDetail(capture: Capture): string | null {
  const at = captureSchemaOf(capture)
  if (at >= CAPTURE_SCHEMA) return null
  const axes = staleCaptureAxes(capture)
  const named = axes.length
    ? `${axes.map((a) => `\`${a.axis}\` on ${a.where}`).join('; ')} ${axes.length === 1 ? 'is' : 'are'} recorded today and absent here`
    : 'no axis it is missing could be named, but its stamp is behind'
  return (
    `this bundle was taken by an older capture (schema ${at}${capture.captureSchema === undefined ? ', unstamped' : ''} ` +
    `vs ${CAPTURE_SCHEMA} today) — ${named}. A fold fix that reads one of them cannot take effect against this ` +
    `bundle however many times it re-runs, so a residual measured here may already be fixed. Re-capture with ` +
    `\`1c capture page ${capture.url}\` before trusting a residual — deliberately NOT automatic, because ` +
    `re-capturing moves the acceptance oracle at the same instant the fold moves.`
  )
}
