---
uid: story-d5de22a5
id: STORY-75
type: story
title: 'Values-diff closes capture blind spots: rendered-text extent, composited surface
  fill, box border, and duplicate-text pairing'
created_by: xgd
created_at: '2026-07-19T02:17:40.688184+00:00'
updated_at: '2026-07-19T02:17:40.688184+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 3
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** `values-diff` to capture and compare each element's rendered text extent, its effective (alpha-composited) surface colour, and its uniform box border, and to pair repeated text by rendered position, **so that** a clean `values-diff` genuinely means the reproduction renders like the reference — I neither miss drift that computed values hide nor chase false deltas that mispairing invents.

## Description
Extends the `1c capture` + `values-diff` pipeline with four fidelity closures, each targeting a case where the mechanical gate reported "0 value-diffs" while the render visibly differed, or reported a delta that was not real:

1. **Rendered-text extent** — captures the tight rendered box of a text run's glyphs (not the element/container box) for both reference and reproduction, and compares it as a *ratio* of the glyph extent (default tolerance 1.2%). This surfaces a real rendered size / tracking / weight-fallback difference even when the computed `fontSizePx`, `fontWeight`, `fontFamily`, and `letterSpacing` all match (e.g. a heading that renders 7% wider despite identical computed font size).

2. **Composited surface fill** — the captured surface colour of an element is the *effective rendered* colour, obtained by compositing each ancestor's fill (alpha-aware, painter's "over") until opaque. A translucent white card over a tinted band is therefore compared as the pale blended colour it actually shows, not as its declared `#ffffff`.

3. **Box-border axis** — captures an element's uniform box border (width + colour), distinct from an asymmetric accent bar, and compares it as a medium-severity delta. A dark input outline vs a pale token border — previously invisible because only corner radius/shape was captured — now surfaces.

4. **Duplicate-text pairing by position** — when the same normalised text string appears more than once, the two sides are paired by nearest rendered box centre rather than document-order FIFO. Repeated strings (checkmarks, repeated CTAs, duplicated nav labels, identical prices) no longer cross-pair across containers when the two sides' order diverges, so false swaps disappear while genuine per-instance differences still surface.

**In scope:** the capture axes, comparison tolerances/severities, and the duplicate-text pairing rule of the intrinsic `values-diff` path.

**Out of scope:** gradient axes (separate story), size-aware / viewport-ladder diffing, the perceptual pixel diff, and any framework authoring dials.

## Technical Context
- Belongs to capability **1c Values-Diff Fidelity** (`capability-aa030c83`); the unifying mandate is the invariant "0 value-diffs ⟺ pixel-faithful".
- The rendered-text-extent comparison is a *ratio* rather than an absolute band because the extent scales with text length; a fixed-px band could not separate a meaningful short-label difference from sub-pixel rounding on a long line. A global `--tolerant` flag widens the ratio band as an accepted-gap escape hatch.
- All four axes are backward-tolerant: a value absent on either side (e.g. a pre-existing bundle captured before an axis existed) is skipped rather than reported as a delta — no false positives from missing measurements.
- DOM-measured by construction, so these axes remain reliable where pixel-thresholding a glyph over a photographic background is not (per DOC-19).

## Dependencies
None.

## Story Points
3
