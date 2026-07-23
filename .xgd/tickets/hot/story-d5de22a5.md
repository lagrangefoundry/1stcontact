---
uid: story-d5de22a5
id: STORY-75
type: story
title: 'Values-diff closes capture blind spots: rendered-text extent, composited surface
  fill, box border, and duplicate-text pairing'
created_by: xgd
created_at: '2026-07-19T02:17:40.688184+00:00'
updated_at: '2026-07-23T11:45:21.855265+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-31e474b9
  uat_coverage: pass
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** `values-diff` to capture and compare each element's rendered text extent, its effective (alpha-composited) surface colour, its uniform box border (width, colour, and line style), its typography treatments (italic/oblique, underline/strike, upper/lower/capitalize, small-caps, list marker), its element effects (backdrop-filter, blend mode, opacity, outline, injected pseudo-content) and image crop (object-position), to pair repeated text by rendered position, and to *not* flag my correct render as a defect when the reference merely showed a font-fallback (FOUT) artifact, **so that** a clean `values-diff` genuinely means the reproduction renders like the reference — I neither miss drift that computed values hide nor chase false deltas that mispairing or a capture-side artifact invents.

## Description
Extends the `1c capture` + `values-diff` pipeline with fidelity closures, each targeting a case where the mechanical gate reported "0 value-diffs" while the render visibly differed, or reported a delta that was not real:

1. **Rendered-text extent** — captures the tight rendered box of a text run's glyphs (not the element/container box) for both reference and reproduction, and compares it as a *ratio* of the glyph extent (default tolerance 1.2%). This surfaces a real rendered size / tracking / weight-fallback difference even when the computed `fontSizePx`, `fontWeight`, `fontFamily`, and `letterSpacing` all match (e.g. a heading that renders 7% wider despite identical computed font size).

2. **Composited surface fill** — the captured surface colour of an element is the *effective rendered* colour, obtained by compositing each ancestor's fill (alpha-aware, painter's "over") until opaque. A translucent white card over a tinted band is therefore compared as the pale blended colour it actually shows, not as its declared `#ffffff`.

3. **Box-border axis** — captures an element's uniform box border (width + colour), distinct from an asymmetric accent bar, and compares it as a medium-severity delta. A dark input outline vs a pale token border — previously invisible because only corner radius/shape was captured — now surfaces. The border also carries its **line style** (dashed/dotted/solid), folded into the comparison only when both sides recorded one, and is now captured on **text runs** (previously fields-only) via the thickest painted side, so a bottom-only rule or single-side border becomes comparable.

4. **Duplicate-text pairing by position** — when the same normalised text string appears more than once, the two sides are paired by nearest rendered box centre rather than document-order FIFO. Repeated strings (checkmarks, repeated CTAs, duplicated nav labels, identical prices) no longer cross-pair across containers when the two sides' order diverges, so false swaps disappear while genuine per-instance differences still surface.

5. **Typography treatment axes (per text run)** — captures and value-compares `font-style` (italic/oblique), `text-decoration-line` (underline/line-through/overline), `text-transform` (uppercase/lowercase/capitalize), `font-variant` (small-caps) and `list-style-type` marker. Each was a whole property the diff never saw — an italic vs roman, a dropped underline, a CSS `uppercase` vs a literal one, a small-caps wordmark, a bullet vs a numbered marker. Compared null-normalised and case-folded at medium severity (the list marker as a distinct `marker` kind), guarded so both sides must carry the field — a pre-existing bundle stays inert.

6. **Element effect axes (per element)** — captures and compares `backdrop-filter` (frosted-glass) and `outline` as presence treatments (their value strings drift across engines), `mix-blend-mode` and `::before`/`::after` pseudo-content as discrete values, and element `opacity` as an exact numeric axis (a ghosted partial-opacity element vs a solid one; tonal/low severity, exact by default with a small band under `--tolerant`). Image `object-position` (the crop within the box, distinct from `object-fit`) is captured on media fields and compared exactly.

7. **fontLoad false-positive correction** — the *reverse* fontLoad direction (the reference showed a font fallback but our render resolved the intended face) is no longer emitted as a delta. A reference `fontLoaded:false` is dominated by capture-side FOUT artifacts, not design intent, so a correct render — one matching the intended family / size / weight — is no longer flagged as a HIGH defect. Only the forward direction, where *our* render fell back, remains a defect.

**In scope:** the capture axes, comparison tolerances/severities, the duplicate-text pairing rule, and the fontLoad diff direction of the intrinsic `values-diff` path.

**Out of scope:** gradient axes (separate story), size-aware / viewport-ladder diffing, the perceptual pixel diff, and any framework authoring dials. Glyph/icon *shape* hashing and independent per-side border *colours* / inline-SVG fill are documented as deferred residuals (presence + dominant-edge + style covers the observed cases).

## Technical Context
- Belongs to capability **1c Values-Diff Fidelity** (`capability-aa030c83`); the unifying mandate is the invariant "0 value-diffs ⟺ pixel-faithful". Coverage closes false negatives; noise closes false positives — only with both does the invariant hold and the operator's eye stop being the QA layer.
- The rendered-text-extent comparison is a *ratio* rather than an absolute band because the extent scales with text length; a fixed-px band could not separate a meaningful short-label difference from sub-pixel rounding on a long line. A global `--tolerant` flag widens the ratio band as an accepted-gap escape hatch.
- Every axis is **additive and backward-tolerant**: a value absent on either side (a bundle captured before the axis existed) is skipped rather than reported, so each closure can only *reduce* false negatives.
- Treatment presence-vs-value split is deliberate: engine-variant strings (backdrop-filter, outline) are compared as presence; carriers of a meaningful discrete value (blend mode, pseudo-content, the typography treatments, object-position) are value-compared.
- DOM-measured by construction, so these axes remain reliable where pixel-thresholding a glyph over a photographic background is not (per DOC-19).

## Dependencies
None.

## Story Points
3