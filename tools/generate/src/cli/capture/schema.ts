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
 * - **7** — REQ-332: two independent axes the extractor had never read at all.
 *   (a) `clip` on every run and field — the box the nearest clipping ancestor
 *   cuts the element off at, plus a document-wide id for that ancestor. The word
 *   `overflow` occurred ZERO times in a 194KB `capture.json`, so a carousel's
 *   off-screen slides were recorded at their laid-out coordinates with nothing
 *   saying they are never shown, and the reproduction came out 420px wider than
 *   the reference. (b) `theme.fonts[].faces` — one record per captured
 *   `@font-face`, each carrying its OWN `weight` (a number, or a variable face's
 *   `[min, max]`) and `style`. The bundle used to flatten a family's faces to a
 *   bare list of file paths and take its weights from the RUNS the page painted,
 *   which destroyed the `(file → weight, style)` pairing before the fold ever saw
 *   it: an italic file was indistinguishable from its normal sibling, and three
 *   Lato weights collapsed into three identical `(normal, 400)` declarations.
 * - **8** — REQ-338: four things the extractor read wrongly rather than not at
 *   all, which is why this bump matters as much as any that added an axis — a
 *   pre-8 bundle carries a plausible WRONG value where it now carries the right
 *   one, and no reader can tell the difference without the stamp.
 *   (a) A band's `overlay` is the veil that paints OVER it: a box containing the
 *   band paints behind it and can never be its overlay, the element's own
 *   `opacity` is part of the veil's effective alpha, and `mix-blend-mode` travels
 *   with it. A pre-8 bundle recorded joyfulculinarycreations.com's vegetable band
 *   as a 9% white veil (which is the section's own `background-color`) where the
 *   page paints `#141e14` at an effective 0.67 with `darken`.
 *   (b) Non-breaking whitespace SURVIVES run-text normalisation. JavaScript's
 *   `\s` includes U+00A0, so 15 non-breaking spaces became ordinary ones and the
 *   reproduction broke lines the reference cannot break.
 *   (c) `lineHeightPx` is the measured pitch of the line boxes the glyphs sit on,
 *   not the run's own computed `line-height` — which is only the same number when
 *   the run's own style, rather than its containing block's strut, sets the line
 *   box.
 *   (d) A `clip` ancestor's `id` is its place in the document, not a
 *   per-projection sequence number. The old numbering shifted between widths of
 *   the same page, so the fold grouped a photograph into a carousel 1400px away
 *   and clipped it out of existence.
 * - **9** — REQ-347: two more things the extractor read wrongly rather than not
 *   at all, both of them an ATTRIBUTION — the axis was already in the bundle,
 *   carrying a plausible value measured on the wrong element.
 *   (a) An element's `zIndex` is read off the ancestor chain rather than off the
 *   leaf. `z-index` does not inherit and is almost never declared on the leaf: a
 *   page positions a wrapper and stacks that. faelan.com declares `20/15/10/5` in
 *   its own stylesheet and a pre-9 bundle records eleven `zIndex` records all
 *   equal to `0`, so the fold had nothing to order a montage by and every collage
 *   photograph painted over the hero headline.
 *   (b) A FRAMED image's `box` is the frame's border box, not the `<img>`'s
 *   content box inside it. REQ-333 (schema unchanged) started attributing a
 *   single-purpose wrapper's ring, radius, shadow and mask to the image it frames
 *   and kept writing them onto the image's own rect — which under
 *   `box-sizing: border-box` is the wrapper's box minus its border. A pre-9 bundle
 *   records faelan.com's 224px ringed photograph as 216px with a radius of 108
 *   instead of 112; the `clip` beside it is measured on the same wrong element.
 * - **10** — REQ-352: a band's `layout.contentAnchorRatio` is measured over ONE
 *   population, whichever code path built the band, and against the box the
 *   section actually publishes. A pre-10 bundle measured a single band by walking
 *   its DOM DESCENDANTS and a geometric slice by what sat inside it, which agree
 *   on a conventionally nested page and disagree exactly where one band OVERLAPS
 *   another — an absolutely-positioned `<header>` over a hero is its own band, so
 *   its runs are not descendants of the hero and the walk excluded them while a
 *   geometric partition could not. It also took a coalesced section's anchor from
 *   its FIRST band, whose box is not the section's union box. So a pre-10 bundle
 *   carries a plausible wrong anchor — 0.53 where the page reads 0.39 on
 *   gigabytealchemy.ai, `top (0.22)` where it reads `center (0.55)` on
 *   joyfulculinarycreations.com — and the comparator declines to compare it
 *   rather than reporting a phantom content shift.
 * - **11** — REQ-351: one axis the bundle's primary record dropped, and one it
 *   under-sampled.
 *   (a) `bodyBackground` — `<body>`'s own painted background, which is what shows
 *   through wherever no band paints. The extractor has computed it since BUG-27
 *   and wrote it into `multistate.json` alone; `capture.json` carried no such key
 *   at all, so every reader holding the primary record had to INFER the canvas —
 *   the fold from the tallest band, the comparator from the largest-area section.
 *   On joyfulculinarycreations.com both inferences returned `#7a7a7a` where all
 *   seven projections measured `#ffffff`, and an inference both sides make the
 *   same wrong way agrees with itself: 22.34% of that page's pixel disagreement at
 *   zero value deltas.
 *   (b) A height probe at EVERY ladder width, not only at 1280. One probe made the
 *   viewport-height response a single-point measurement asserted across the whole
 *   ladder; a page whose height rule sits inside a media query (the common case)
 *   was reproduced with that one width's rule everywhere. A pre-11 bundle can only
 *   ever identify the height axis at 1280.
 * - **12** — BUG-174: a band's OWN paint (`sections[].paint`) — the opacity,
 *   filter, blend mode, corner radius and shadow of the element that paints the
 *   band. A reproduction paints each band on a full-bleed box whose five axes the
 *   diff reads; a pre-12 bundle has nothing to compare them against, so they stay
 *   unmeasured on it until the reference is re-captured.
 * - **13** — REQ-365: where a run's underline sits (`underlineOffsetPx`, the
 *   computed `text-underline-offset`). A pre-13 bundle records that a link is
 *   underlined and not where, so a reproduction paints the line at the engine's
 *   `auto` offset — 2px high on faelan.com's 24px link — and nothing compares it.
 * - **14** — REQ-366: an EMPTY element's ink. An icon font's glyph painted by an
 *   empty element's `::before`/`::after` is recorded as a run (`pseudoGlyph`),
 *   and an empty element whose only ink is a border rule (a page-builder divider)
 *   as a field, as an `<hr>` is. A pre-14 bundle recorded neither, so those
 *   elements were drawn nowhere and compared against nothing.
 * - **15** — REQ-370: four things hearingzone510.com (a Zyro page) showed the
 *   extractor dropping. (a) A run whose computed `white-space` preserves spaces
 *   that wrap (`break-spaces` / `pre-wrap`) records it as `whiteSpace` and keeps
 *   the edge space in its `text`: under `break-spaces` that space takes width,
 *   and a pre-15 bundle is one space narrower than the page on every such run.
 *   (b) A link's `tel:` / `mailto:` target is recorded (REQ-359 taught L1 to
 *   accept them; the extractor still threw them away). (c) An inline `<svg>` whose
 *   only shape is a solid rectangle covering it is recorded as a painted field.
 *   (d) A decoded image parked in a scroll-reveal pre-state (transparent AND
 *   displaced) is landed before measuring, so it is in the oracle at all.
 * - **16** — BUG-187: two things the values-diff could not compare because the
 *   two sides did not hold them in common. (a) Every run and field records its
 *   `paintStack` — the chain of stacking boxes its `zIndex` is one link of — so
 *   paint order between two elements in sibling stacking contexts is decidable
 *   (hearingzone510.com's section grounds at 13 under copy at 14 → 1). (b) A text
 *   node whose element also holds a nested run (`<p>F<span>…</span></p>`) is
 *   measured over its own range; a pre-16 bundle records it with the whole
 *   paragraph's box and glyph extent.
 */
export const CAPTURE_SCHEMA = 16

/**
 * REQ-352 — the schema from which a bundle's content anchor is measured over the
 * same population as a live extraction's, and is therefore comparable against it.
 *
 * Named rather than written as a bare `10` at the two places that consult it (the
 * `anchorPopulation` axis and the comparator's declination), because those two
 * have to agree and a literal in each is how they stop agreeing.
 */
export const ANCHOR_POPULATION_SCHEMA = 10

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
    since: 7,
    axis: 'clip',
    where: 'a content run or field (`sections[].content[]`, `sections[].fields[]`)',
    // A page that clips nothing records no clip however new its extractor is —
    // the same asymmetry `href` has, and the reason the version gate comes first.
    present: (c) => [...runs(c), ...fields(c)].some((e) => e.clip !== null && typeof e.clip === 'object'),
  },
  {
    since: 7,
    axis: 'faces (each mirrored font file with its own weight + style)',
    where: 'the theme font table (`theme.fonts[]`)',
    // Presence is "the key exists": a page whose every face 404'd honestly
    // records `faces: []`, which is the axis being carried and saying nothing
    // mirrored. A pre-7 bundle has `files` instead and no `faces` at all.
    present: (c) =>
      (c.theme?.fonts ?? []).some((f) => Array.isArray((f as unknown as { faces?: unknown }).faces)),
  },
  {
    since: 8,
    axis: 'a band overlay that is the veil painted OVER the band (effective alpha, `blendMode`)',
    where: 'a section background (`sections[].background.overlay`)',
    // A page whose veils all composite normally records no `blendMode` however new
    // its extractor is, and a page with no veil at all records no overlay — the
    // same asymmetry `href` has, and the reason the version gate comes first. What
    // a pre-8 bundle can be caught red-handed at is the defect itself: an overlay
    // whose colour IS the band's own fill is the section's `background-color`
    // misread as the veil over it, which is a contradiction no current extractor
    // can produce (a box containing the band is skipped).
    present: (c) =>
      !c.sections.some(
        (s) =>
          !!s.background?.overlay &&
          typeof s.background.color === 'string' &&
          s.background.overlay.color.toLowerCase() === s.background.color.toLowerCase(),
      ),
  },
  {
    since: 8,
    axis: 'non-breaking whitespace preserved in run text',
    where: 'a content run (`sections[].content[]`)',
    // A page that uses no non-breaking space records none however new its
    // extractor is, so this can only ever confirm the axis, never deny it.
    present: (c) => runs(c).some((r) => typeof r.text === 'string' && /[\u00a0\u202f\u2007\u2011\u200b\u2060]/.test(r.text)),
  },
  {
    since: 8,
    axis: 'lineHeightPx measured as the line-box pitch',
    where: 'a content run (`sections[].content[]`)',
    // Caught by the contradiction, for the reason `a11yRole` is: a MULTI-LINE run
    // whose glyph union is taller than its own line count allows was measured
    // against the run's computed `line-height` instead of the line box. A page
    // whose every run sets its own line-height shows no such run, which proves
    // nothing — so this probe only ever REMOVES the axis from a finding.
    present: (c) =>
      !runs(c).some((r) => {
        const lh = r.lineHeightPx
        const box = r.renderedTextBox as { height?: number } | undefined
        if (typeof lh !== 'number' || !(lh > 0) || typeof box?.height !== 'number') return false
        const lines = Math.round(box.height / lh)
        return lines >= 2 && box.height - lines * lh > 1
      }),
  },
  {
    since: 8,
    axis: 'a clip ancestor identified by its place in the document',
    where: 'a content run or field (`sections[].content[]`, `sections[].fields[]`)',
    // A pre-8 bundle's ids are numbers; a current one's are `.`-joined paths. A
    // page that clips nothing carries neither, and the version gate covers that.
    present: (c) =>
      [...runs(c), ...fields(c)].some(
        (e) => typeof (e.clip as { id?: unknown } | null)?.id === 'string',
      ),
  },
  {
    since: 9,
    axis: 'zIndex read off the ancestor chain',
    where: 'a content run or field (`sections[].content[]`, `sections[].fields[]`)',
    // NOTHING IN A BUNDLE CAN PROVE THIS ONE PRESENT, and saying so is more
    // useful than a probe that guesses. A pre-9 extractor records a non-zero
    // `zIndex` perfectly well for the rare page that declares one on the leaf
    // itself, so "a non-zero value exists" would REMOVE the axis from the finding
    // on exactly the bundles that still need re-capturing. The version gate
    // decides alone here.
    present: () => false,
  },
  {
    since: 9,
    axis: "a framed image's box (the frame's border box, not the `<img>`'s content box)",
    where: 'an image field (`sections[].fields[]`)',
    // Unprovable for `zIndex`'s reason and then some: both schemas record a
    // rectangle and a ring, and only the page's own stylesheet says which element
    // they were measured on.
    present: () => false,
  },
  {
    since: 10,
    axis: 'contentAnchorRatio measured over one population, against the section\'s own box',
    where: 'a section (`sections[].layout.contentAnchorRatio`)',
    // Caught by the contradiction, for the reason `a11yRole` and `lineHeightPx`
    // are. The population is GEOMETRIC — every run whose centre falls inside the
    // section's box — and every run and every box a section needs for that is in
    // the bundle, so the value a current extractor would have written is
    // recomputable here. A bundle whose stored anchor disagrees with it was
    // measured by an older instrument; a page whose two populations coincide (no
    // overlapping band, no coalesced section) shows no disagreement, which proves
    // nothing — so this probe only ever REMOVES the axis from a finding.
    present: (c) => !c.sections.some((s) => anchorDisagrees(c, s)),
  },
  {
    since: 11,
    axis: 'bodyBackground',
    where: "the bundle's primary record (`capture.json` top level)",
    // Presence is "the key exists". A page that paints nothing on <body> records
    // no canvas however new its extractor is — the same asymmetry `href` has, and
    // the reason the version gate comes first.
    present: (c) => typeof (c as unknown as { bodyBackground?: unknown }).bodyBackground === 'string',
  },
  {
    since: 11,
    axis: 'a viewport-height probe at every ladder width',
    where: 'the projection set (`multistate.json`)',
    // Constant `false`, and deliberately: the probes live in `multistate.json` and
    // nothing in `capture.json` can see them, so this axis has no evidence here to
    // refute the stamp with. That is within the contract stated above — a probe
    // may only ever REMOVE an axis from the finding, and one that can never remove
    // simply always names itself on a bundle the version gate has already found
    // behind. A pre-11 bundle definitionally carries one probe, at 1280.
    present: () => false,
  },
  {
    since: 2,
    axis: 'lineHeightPx to two decimals',
    where: 'a content run (`sections[].content[]`)',
    // A whole-pixel line-height is legal at any schema, so a bundle only proves
    // it has the precision by carrying a fractional one.
    present: (c) => runs(c).some((r) => typeof r.lineHeightPx === 'number' && !Number.isInteger(r.lineHeightPx)),
  },
  {
    since: 12,
    axis: "a band's own paint (opacity, filter, blendMode, borderRadiusPx, boxShadow)",
    where: 'a section (`sections[].paint`)',
    // Every band carries it from schema 12, so the key's presence on any section
    // is the axis — there is no page shape on which a current extractor omits it.
    present: (c) => c.sections.some((s) => typeof s.paint === 'object' && s.paint !== null),
  },
  {
    since: 13,
    axis: "a run's underline placement (underlineOffsetPx)",
    where: 'a content run (`sections[].content[]`)',
    // The key is written on every run from schema 13 (null for `auto`), so its
    // presence on any run is the axis, whatever the page underlines.
    present: (c) => runs(c).some((r) => 'underlineOffsetPx' in r),
  },
  {
    since: 14,
    axis: "an empty element's ink (a ::before/::after glyph run, a border-rule field)",
    where: 'a content run (`sections[].content[]`, `pseudoGlyph`) and a field (`sections[].fields[]`)',
    // A glyph run proves the extractor looked. A page with no icon fonts records
    // none however new its extractor is — the `href` asymmetry again — so this only
    // ever removes the axis from a finding.
    present: (c) => runs(c).some((r) => typeof r.pseudoGlyph === 'string'),
  },
  {
    since: 15,
    axis: "a run's preserved white space (whiteSpace, with the edge space kept in its text)",
    where: 'a content run (`sections[].content[]`)',
    // Written on every run from schema 15 (null when spaces collapse), so the
    // key's presence on any run is the axis, whatever the page declares.
    present: (c) => runs(c).some((r) => 'whiteSpace' in r),
  },
  {
    since: 15,
    axis: 'a tel: / mailto: link target (href)',
    where: 'a content run or field (`href`)',
    // A page with no phone or mail link records none however new its extractor
    // is — the `href` asymmetry — so this only ever removes the axis.
    present: (c) =>
      [...runs(c), ...fields(c)].some((r) => typeof r.href === 'string' && /^(tel|mailto):/i.test(r.href)),
  },
  {
    since: 16,
    axis: "an element's stacking chain (paintStack)",
    where: 'a content run or field (`sections[].content[]`, `sections[].fields[]`)',
    // Written on every run and field from schema 16, so its presence anywhere is
    // the axis, whatever the page stacks.
    present: (c) => [...runs(c), ...fields(c)].some((r) => Array.isArray(r.paintStack)),
  },
  {
    since: 16,
    axis: "a text node's own box beside a nested run (not its element's)",
    where: 'a content run (`sections[].content[]`)',
    // Unprovable for `zIndex`'s reason: a pre-16 bundle records a box on every
    // run, and only the page's markup says whose box it was.
    present: () => false,
  },
]

/**
 * REQ-352 — whether this section's stored anchor disagrees with the one a current
 * extractor would measure for it.
 *
 * The population is every run in the bundle whose CENTRE falls inside the
 * section's box, whichever section collected it — the same rule the extractor
 * applies, computed here from the runs and boxes the bundle already carries. Only
 * used to date a bundle; the diff reads the STORED value, because a bundle is the
 * oracle the instrument that took it wrote and re-deriving it at read time would
 * move the oracle silently.
 */
function anchorDisagrees(capture: Capture, section: Capture['sections'][number]): boolean {
  const box = section.box
  if (!box || !(box.height > 0)) return false
  const stored = section.layout?.contentAnchorRatio
  let top = Infinity
  let bottom = -Infinity
  for (const other of capture.sections) {
    const runs = [...(other.content ?? []), ...(other.items ?? []).flatMap((i) => i.content ?? [])]
    for (const run of runs) {
      const r = run.box
      if (!r) continue
      const centre = r.y + r.height / 2
      if (centre < box.y || centre >= box.y + box.height) continue
      if (r.y < top) top = r.y
      if (r.y + r.height > bottom) bottom = r.y + r.height
    }
  }
  if (bottom === -Infinity) return stored !== null && stored !== undefined
  if (typeof stored !== 'number') return true
  const ratio = ((top + bottom) / 2 - box.y) / box.height
  const measured = Math.round(Math.max(0, Math.min(1, ratio)) * 100) / 100
  return Math.abs(measured - stored) > 0.01
}

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
