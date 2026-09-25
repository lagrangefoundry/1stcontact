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
 * - **3** — REQ-271: a band that paints no fill of its own records
 *   `background.kind: 'none'` instead of an opaque fabrication of the body's
 *   colour. Every pre-3 bundle asserts a fill for bands that paint nothing, so
 *   its `background.color` cannot be read as a measurement — which is exactly
 *   what the section `surfaceFill` axis needs it to be.
 * - **4** — REQ-275: a link's `newTab`, and a form control's `controlName`,
 *   `formMethod` and `required`. ONE bump for four axes, and that is the point:
 *   every earlier number on this list was paid for by a reproduction round that
 *   discovered a single missing axis the expensive way. These four came out of
 *   one mechanical pass (`1c capture audit`) over the three stored references,
 *   which is what the probe exists to make possible.
 * - **5** — REQ-302: a run's `paddingTopPx`, `paddingRightPx`, `paddingBottomPx`
 *   and `textAlign` reach the bundle at all (the browser measured all four and
 *   the projection kept one), and `a11yRole` is read at the semantic ancestor
 *   rather than at the text node — so a heading or link wrapped in a
 *   presentational `<span>` stops recording `generic` beside its own `href`.
 *   It also adds `itemsAt`: the index each repeated-item row belongs at within
 *   its section's content, without which a section's runs are not in reading
 *   order and nothing downstream can put them back.
 * - **6** — REQ-308: a form control's own TYPE (`fontFamily`, `fontSizePx`,
 *   `fontWeight`, `lineHeightPx`) reaches the field record at all. A control
 *   whose only ink is its placeholder has no text run, so it went down the
 *   text-free path, which recorded a constant `0`/`''` for every type axis — on
 *   BOTH sides, so the diff agreed by construction while the reproduction
 *   painted its placeholder against the renderer's `font: inherit` reset. This
 *   is the bump the ticket's own note is about: landing the extractor change
 *   moves nothing on a stored bundle until the operator RE-CAPTURES it, and this
 *   is what says so out loud instead of leaving the round to re-measure a
 *   residual whose fix has already shipped.
 */
export const CAPTURE_SCHEMA = 6

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

/**
 * Every content run in a bundle, as an open bag.
 *
 * EXPORTED FOR REQ-275's coverage registry, which asks the same question this
 * file's axes ask — "does this bundle demonstrably carry X?" — over a much
 * longer list. A second traversal there would be a second definition of what a
 * run IS (section content, plus each repeated item's content), wrong the day a
 * run can live somewhere else.
 *
 * The bag type is deliberate: a predicate here is asking about a field that may
 * post-date the `ContentRun` the bundle on disk was written against, so it has
 * to be able to ask about a key the compiler does not know is there.
 */
export const captureRuns = (capture: Capture): readonly { [k: string]: unknown }[] =>
  capture.sections.flatMap((s) => [
    ...s.content,
    ...s.items.flatMap((i) => i.content),
  ]) as unknown as readonly { [k: string]: unknown }[]

/** Every text-free field in a bundle, as an open bag. See {@link captureRuns}. */
export const captureFields = (capture: Capture): readonly { [k: string]: unknown }[] =>
  capture.sections.flatMap((s) => s.fields ?? []) as unknown as readonly { [k: string]: unknown }[]

const runs = captureRuns
const fields = captureFields

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
    since: 3,
    axis: 'an unpainted band background (`background.kind: "none"`)',
    where: 'a section background (`sections[].background`)',
    // A page every one of whose bands paints a real fill records no `none`
    // however new its extractor is — the same asymmetry as `href` above, and the
    // reason the version gate comes first.
    present: (c) => c.sections.some((s) => s.background?.kind === 'none'),
  },
  {
    since: 4,
    axis: 'newTab',
    where: 'a linked run or field (`sections[].content[]`, `sections[].fields[]`)',
    // A page whose every link opens in place records `newTab: false` everywhere,
    // which IS the axis being carried — so presence is "the key exists", not "it
    // is true". A page with no links at all records nothing, and the version gate
    // is what covers that, exactly as it does for `href` above.
    present: (c) => [...runs(c), ...fields(c)].some((e) => typeof e.newTab === 'boolean'),
  },
  {
    since: 4,
    axis: 'controlName',
    where: 'a form control (`sections[].fields[]`)',
    present: (c) => fields(c).some((f) => typeof f.controlName === 'string'),
  },
  {
    since: 4,
    axis: 'formMethod',
    where: 'a form control (`sections[].fields[]`)',
    present: (c) => fields(c).some((f) => typeof f.formMethod === 'string'),
  },
  {
    since: 4,
    axis: 'required',
    where: 'a form control (`sections[].fields[]`)',
    present: (c) => fields(c).some((f) => typeof f.required === 'boolean'),
  },
  {
    since: 5,
    axis: 'paddingTopPx/paddingRightPx/paddingBottomPx',
    where: 'a content run (`sections[].content[]`)',
    // The three sides beside `paddingLeftPx`, which every schema has carried. A
    // page can legitimately pad nothing, so presence is "the key exists" — a
    // measured 0 is a measurement, an absent key is the projection dropping it.
    present: (c) => runs(c).some((r) => typeof r.paddingTopPx === 'number'),
  },
  {
    since: 5,
    axis: 'textAlign',
    where: 'a content run (`sections[].content[]`)',
    present: (c) => runs(c).some((r) => typeof r.textAlign === 'string'),
  },
  {
    since: 5,
    axis: 'a11yRole resolved at the semantic ancestor',
    where: 'a content run (`sections[].content[]`)',
    // Not a presence question — `a11yRole` has always been written. What a
    // pre-REQ-302 bundle carries is a CONTRADICTION: a run with an `href`, or a
    // `headingLevel`, and `generic` for its role, because the role was read off
    // the presentational <span> the treatment wrapped the words in while the two
    // neighbouring fields walked up to the <a>/<h1>. A record cannot have a
    // navigation target and not be in a link, so seeing that pair is proof the
    // bundle predates the fix. Not seeing it proves nothing (the page may simply
    // wrap nothing), which is exactly the asymmetry `present` is documented to
    // have: this probe only ever REMOVES the axis from a finding.
    present: (c) =>
      !runs(c).some(
        (r) =>
          (typeof r.href === 'string' || typeof r.headingLevel === 'number') &&
          r.a11yRole === 'generic',
      ),
  },
  {
    since: 5,
    axis: 'itemsAt',
    where: 'a section with repeated items (`sections[].itemsAt`)',
    // A section with no repeated rows records no anchor however new its
    // extractor is, so presence is asked the only way it can be: does any
    // section that HAS items lack the anchor. No items anywhere means nothing to
    // claim, and the axis drops off the finding — the same asymmetry every probe
    // here has, stated in the other direction.
    present: (c) =>
      !c.sections.some(
        (s) =>
          (s.items?.length ?? 0) > 0 &&
          !Array.isArray((s as unknown as { itemsAt?: unknown }).itemsAt),
      ),
  },
  {
    since: 6,
    axis: 'fontFamily/fontSizePx/fontWeight/lineHeightPx on a form control',
    where: 'a form control (`sections[].fields[]`)',
    // Presence is a NON-ZERO size, not the key: every earlier schema wrote
    // `fontSizePx: 0` onto every text-free element as a constant, so the key has
    // always existed and has never been a measurement. A page with no form
    // control at all records nothing however new its extractor is — the same
    // asymmetry `href` has, and the reason the version gate comes first.
    present: (c) => fields(c).some((f) => typeof f.fontSizePx === 'number' && f.fontSizePx > 0),
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
