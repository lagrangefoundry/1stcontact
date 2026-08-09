---
uid: story-d5de22a5
id: STORY-75
type: story
title: 'Values-diff closes capture blind spots: rendered-text extent, composited surface
  fill, box border, and duplicate-text pairing'
created_by: xgd
created_at: '2026-07-19T02:17:40.688184+00:00'
updated_at: '2026-08-09T02:55:53.763576+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-cceaba25
  - bundle-ee56a66e
  uat_coverage: fail
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** the capture to record what the page actually paints — every band's full painted extent, and the backdrop imagery and full-bleed fills wherever they sit in the document — and `values-diff` to compare each element's rendered text extent, its effective (alpha-composited) surface colour, its uniform box border (width, colour, and line style), its typography treatments (italic/oblique, underline/strike, upper/lower/capitalize, small-caps, and a list marker recorded only where a marker is actually painted), its element effects (backdrop-filter, blend mode, opacity, outline, injected pseudo-content), its image crop (object-position) and its painted background image, to pair repeated text by rendered position, to ignore the presentation a behavior module is obliged to fix, and to *not* flag my correct render as a defect when the reference merely showed a font-fallback (FOUT) artifact, **so that** a clean `values-diff` genuinely means the reproduction renders like the reference — I neither miss drift that computed values hide, nor miss substance the capture never looked at, nor chase false deltas that mispairing, a capture-side artifact, repro-only chrome or a phantom captured value invents.

## Description
Extends the `1c capture` + `values-diff` pipeline with fidelity closures, each targeting a case where the mechanical gate reported "0 value-diffs" while the render visibly differed, or reported a delta that was not real:

1. **Rendered-text extent** — captures the tight rendered box of a text run's glyphs (not the element/container box) for both reference and reproduction, and compares it as a *ratio* of the glyph extent (default tolerance 1.2%). This surfaces a real rendered size / tracking / weight-fallback difference even when the computed `fontSizePx`, `fontWeight`, `fontFamily`, and `letterSpacing` all match (e.g. a heading that renders 7% wider despite identical computed font size).

2. **Composited surface fill** — the captured surface colour of an element is the *effective rendered* colour, obtained by compositing each ancestor's fill (alpha-aware, painter's "over") until opaque. A translucent white card over a tinted band is therefore compared as the pale blended colour it actually shows, not as its declared `#ffffff`.

3. **Box-border axis** — captures an element's uniform box border (width + colour), distinct from an asymmetric accent bar, and compares it as a medium-severity delta. A dark input outline vs a pale token border — previously invisible because only corner radius/shape was captured — now surfaces. The border also carries its **line style** (dashed/dotted/solid), folded into the comparison only when both sides recorded one, and is now captured on **text runs** (previously fields-only) via the thickest painted side, so a bottom-only rule or single-side border becomes comparable.

4. **Duplicate-text pairing by position** — when the same normalised text string appears more than once, the two sides are paired by nearest rendered box centre rather than document-order FIFO. Repeated strings (checkmarks, repeated CTAs, duplicated nav labels, identical prices) no longer cross-pair across containers when the two sides' order diverges, so false swaps disappear while genuine per-instance differences still surface.

5. **Typography treatment axes (per text run)** — captures and value-compares `font-style` (italic/oblique), `text-decoration-line` (underline/line-through/overline), `text-transform` (uppercase/lowercase/capitalize), `font-variant` (small-caps) and the `list-style-type` marker. Each was a whole property the diff never saw — an italic vs roman, a dropped underline, a CSS `uppercase` vs a literal one, a small-caps wordmark, a bullet vs a numbered marker. Compared null-normalised and case-folded at medium severity (the list marker as a distinct `marker` kind), guarded so both sides must carry the field — a pre-existing bundle stays inert.

   The list-marker axis carries a **painted-marker precondition**: a marker is recorded only for a run whose element actually generates a marker box (an element laid out as a list item). `list-style-type` has a CSS *initial value* of `disc` on every element, so reading it unconditionally stamped a phantom marker on ordinary headings, wordmarks and body copy — which the fold carried and the renderer faithfully painted as a bullet on every line. With the precondition, a non-list run records no marker, a genuine list item keeps its own marker type, and `list-style-type: none` still suppresses a real list item's marker. The axis is comparable exactly where a marker is genuinely painted.

6. **Element effect axes (per element)** — captures and compares `backdrop-filter` (frosted-glass) and `outline` as presence treatments (their value strings drift across engines), `mix-blend-mode` and `::before`/`::after` pseudo-content as discrete values, and element `opacity` as an exact numeric axis (a ghosted partial-opacity element vs a solid one; tonal/low severity, exact by default with a small band under `--tolerant`). Image `object-position` (the crop within the box, distinct from `object-fit`) is captured on media fields and compared exactly.

7. **fontLoad false-positive correction** — the *reverse* fontLoad direction (the reference showed a font fallback but our render resolved the intended face) is no longer emitted as a delta. A reference `fontLoaded:false` is dominated by capture-side FOUT artifacts, not design intent, so a correct render — one matching the intended family / size / weight — is no longer flagged as a HIGH defect. Only the forward direction, where *our* render fell back, remains a defect.

8. **Painted band extent** — a band's captured box is the **painted extent of its subtree**, clamped to the document's painted canvas, rather than its own in-flow border box. A band qualified on its own height dropped its entire subtree whenever it collapsed while still painting (a header whose children are absolutely positioned reads 0px tall while painting a full nav bar), so its logo and links never reached the manifest and nothing downstream could recover them. Visibility is therefore evaluated as two independent facts — does the style chain paint, and does *this* box land on the page — so a collapsed band fails the second on its own box while its children pass both. The clamp is what stops an overflow-clipped child (a carousel's off-stage slides) from inflating the band far past the page; a conventionally laid out band is unchanged, its children already inside its own box.

9. **Document-wide backdrops** — the imagery and full-bleed fills a page paints *behind* its content are indexed anywhere in the document, not only off a top-level band root. On a page-builder site the whole page is one wrapper and the visually distinct panels are nested, so the hero photograph was absent from the manifest entirely and each panel's fill had to be inferred from the surfaces its runs sit on — an inference that reads the page correctly only when the largest painted surface is the page itself. A backdrop is projected onto the existing text-free element shape, carrying its painted image handle and the fill beneath it (a photograph layered over a solid is darkened by that solid; capturing the image without it reproduces the photograph at full brightness).

   Three exclusions are deliberate, each a way the capture could otherwise start reporting something that is not there: `data:` payloads (widget chrome, never a mirrored asset); non-full-bleed coloured boxes (cards, already reconstructed from run surfaces); and full-bleed **translucent** fills, which are scrims already recorded as the band's overlay and layered above the image they veil — indexing one again paints it twice, and since a fill's alpha lives in the colour rather than in `opacity`, the second copy lands opaque and blacks out the photograph beneath. **Full-bleed means touching both document edges**, never a fraction of width: a fraction is unstable across the viewport ladder (a 720px card is 94% of a 768px rung), so a content card would be captured as a band at the narrow rungs only.

10. **Painted background-image axis** — the background image an element paints is compared as a value axis, by **mirrored basename**: the reference carries the captured origin URL and our render the site-local mirror, so a verbatim comparison would flag every correctly reproduced image while a missing one — the case where the page reproduces as flat colour — raised nothing at all.

11. **Module-invariant exclusion** — a behavior module keeps a small declared set of elements whose presentation is fixed by an obligation rather than by taste (a honeypot that must stay invisible, a programmatic label that must stay out of flow, a widget mount that must sit where the widget expects it). They exist only on the reproduction side, so pairing against them slides the whole control queue and every field mispairs against its neighbour. The capture skips those subtrees **and the accessible names they would source** — a hidden label would otherwise re-describe a placeholder-labelled field as label-labelled, manufacturing a permanent containment delta out of the module honouring its obligation.

**In scope:** the capture axes (including the conditions under which an axis records a value at all), the band-extent and backdrop-indexing rules that decide what reaches the manifest, comparison tolerances/severities, the duplicate-text pairing rule, the exclusion of module-invariant elements from capture and pairing, and the fontLoad diff direction of the intrinsic `values-diff` path.

**Out of scope:** gradient axes (separate story), size-aware / viewport-ladder diffing, the perceptual pixel diff, any framework authoring dials, and what the fold *does* with a captured backdrop or control (owned by the fold story). Glyph/icon *shape* hashing and independent per-side border *colours* / inline-SVG fill are documented as deferred residuals (presence + dominant-edge + style covers the observed cases).

## Technical Context
- Belongs to capability **1c Values-Diff Fidelity** (`capability-aa030c83`); the unifying mandate is the invariant "0 value-diffs ⟺ pixel-faithful". Coverage closes false negatives; noise closes false positives — only with both does the invariant hold and the operator's eye stop being the QA layer.
- The rendered-text-extent comparison is a *ratio* rather than an absolute band because the extent scales with text length; a fixed-px band could not separate a meaningful short-label difference from sub-pixel rounding on a long line. A global `--tolerant` flag widens the ratio band as an accepted-gap escape hatch.
- Every axis is **additive and backward-tolerant**: a value absent on either side (a bundle captured before the axis existed) is skipped rather than reported, so each closure can only *reduce* false negatives.
- Treatment presence-vs-value split is deliberate: engine-variant strings (backdrop-filter, outline) are compared as presence; carriers of a meaningful discrete value (blend mode, pseudo-content, the typography treatments, object-position) are value-compared.
- **A captured axis must record only what is painted.** An axis whose CSS property has a non-neutral *initial value* (`list-style-type`'s `disc`) is meaningless unless gated on the condition that makes it render — otherwise the capture is precisely wrong on the majority of elements while still satisfying "the axis is captured and compared". The list marker is gated on the element generating a marker box; the fold and renderer are unchanged, being correct once the input is clean.
- The band-extent and backdrop closures are the same failure in two forms: the capture was *not looking* rather than mis-measuring. Both were found on a photography-led page that reproduced as flat colour while every value gate stayed green — the value gates had nothing to compare against, because the substance was never in the manifest.
- Comparing an image handle by mirrored basename is the identity question that matters — is the same asset painted here — and matches how asset mirroring names the bytes; comparing the URL verbatim would be a delta on every correctly reproduced image.
- Module-invariant elements are marked by the module itself, so the capture recognises them by that marker rather than by a heuristic; a text-led page with no behaviour seam is unaffected.
- DOM-measured by construction, so these axes remain reliable where pixel-thresholding a glyph over a photographic background is not (per DOC-19).

## Dependencies
None.

## Story Points
3