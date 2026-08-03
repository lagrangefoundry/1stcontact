---
uid: story-d5de22a5
id: STORY-75
type: story
title: 'Values-diff closes capture blind spots: rendered-text extent, composited surface
  fill, box border, and duplicate-text pairing'
created_by: xgd
created_at: '2026-07-19T02:17:40.688184+00:00'
updated_at: '2026-08-03T02:44:33.036709+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-4ff83a8b
  uat_coverage: pass
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** `values-diff` to be a trustworthy scoreboard for *both* shapes a page can take — a conventionally-nested reference and a flat, absolutely-positioned L1 reproduction — capturing and comparing each element's rendered text extent, its effective (alpha-composited) surface colour resolved against the box that actually paints it, its uniform box border, its typography treatments, its element effects and image crop, pairing repeated text by rendered position, and refusing to report a delta where no pixel differs, **so that** a clean `values-diff` genuinely means the reproduction renders like the reference — I neither miss drift that computed values hide nor chase false deltas that mispairing, a capture-side artifact, a DOM-shape difference or a phantom captured value invents.

## Description
Extends the `1c capture` + `values-diff` pipeline with fidelity closures, each targeting a case where the mechanical gate reported "0 value-diffs" while the render visibly differed, reported a delta that was not real, or could not read one side of the comparison at all.

### A. Coverage closures (a matched axis is not proof)

1. **Rendered-text extent** — captures the tight rendered box of a text run's glyphs (not the element/container box) for both reference and reproduction, and compares it as a *ratio* of the glyph extent (default tolerance 1.2%). This surfaces a real rendered size / tracking / weight-fallback difference even when the computed `fontSizePx`, `fontWeight`, `fontFamily`, and `letterSpacing` all match (e.g. a heading that renders 7% wider despite identical computed font size).

2. **Composited surface fill** — the captured surface colour of an element is the *effective rendered* colour, obtained by compositing the fills painted behind it (alpha-aware, painter's "over") until opaque. A translucent white card over a tinted band is therefore compared as the pale blended colour it actually shows, not as its declared `#ffffff`. The surfaces composited are the ones that **geometrically contain** the run, tightest first (see B.2), and a colour carrying its own alpha is read losslessly from the browser's own serialization, so a `color-mix` / `oklab` / `oklch` veil composites at its true value rather than a pixel-probe approximation.

3. **Box-border axis** — captures an element's uniform box border (width + colour, distinct from an asymmetric accent bar) and compares it as a medium-severity delta, including its **line style** (folded in only when both sides recorded one) and captured on **text runs** via the thickest painted side.

4. **Duplicate-text pairing by position** — when the same normalised text string appears more than once, the two sides are paired by nearest rendered box centre rather than document-order FIFO. This holds across DOM shapes: the reference's nested containers and the reproduction's flat sibling tree list the same repeated strings in different orders, and positional pairing matches each instance to its counterpart in both.

5. **Typography treatment axes (per text run)** — `font-style`, `text-decoration-line`, `text-transform`, `font-variant` (small-caps) and the `list-style-type` marker, compared null-normalised and case-folded, each guarded so both sides must carry the field. The list marker carries a **painted-marker precondition**: it is recorded only for a run whose element actually generates a marker box, so the CSS initial value `disc` never stamps a phantom bullet on ordinary headings and body copy.

6. **Element effect axes (per element)** — `backdrop-filter` and `outline` as presence, `mix-blend-mode` and `::before`/`::after` pseudo-content as discrete values, element `opacity` as an exact numeric axis, and image `object-position` compared exactly.

### B. Noise closures (a mismatched axis can actively misdirect)

7. **Reading a flat, absolutely-positioned render at all.** The manifest is segmented into style-scope bands from the top-level `<body>` children that paint at least a minimal height. An L1 reproduction nests every leaf under one wrapper whose absolutely-positioned children leave no in-flow box, so the wrapper collapses to zero height, the scan found no bands, and the actual manifest came back **empty** — every reference element read `missing (present → absent)` and the report froze byte-identical across two completely different renders. When the top-level scan finds nothing yet the body still paints, the page is segmented as a single body-spanning band, so the flat tree's runs and fields are collected and the scoreboard *moves* when the render changes. The fallback is general (any absolutely-positioned layout) and dormant for semantic sites, which always have real top-level bands.

8. **Geometric surface attribution.** `surfaceFill` / `borderLeft` / `surfaceGradient` were resolved by walking DOM ancestors — a proxy that only holds when the painting box is an ancestor. An L1 reproduction paints its bands and cards as absolutely-positioned *siblings*, so the walk skipped every card, reported the body backstop, and produced ~60 phantom defects (one of them reported reversed) on pixels that were already correct, drowning the real ones. Attribution is now geometric: the painted boxes *containing* the run, tightest first (DOM ancestors unioned in, since containment is not guaranteed under negative margins/overflow). Identical on a conventionally-nested page, so the reference side is unchanged.

9. **Split-control node identity.** The reference represents a control as ONE node (a `<button>` carrying label, fill and rounding together); the fold represents it as a **text leaf plus a sibling backing box**. Pairing joins on text, lands on the label, reads a radius of 0, and reported a phantom `radius 8px → 0px` — classified Type-A flat, so it *led* the printed repair order with a no-op while the backing box's real 2×-height geometry defect went unreported. The capture now records **which box bears the surface** (its rect, radius, shadow and border, plus a flag saying whether it is the run's own element), and where the two sides genuinely disagree about node identity — reference self-painting, reproduction not — radius, shadow, border **and the surface's geometry** compare against the bearing box. Deliberately narrow: a self-painting chip is self on both sides (own-axis comparison untouched), an ordinary band run gains no surface-geometry rows, a reproduction that really lost its rounding still reports `shape`, and a bundle captured before the field existed is inert.

10. **Saturated pill radius is not a magnitude.** A fully-rounded pill's radius saturates at half the painted height: `rounded-full` computes to 33554400px while the envelope-clamped reproduction emits 100000px, and both paint the identical shape. When both sides are pills the shape agrees by construction and only the shadow can still differ. A pill flattened to a square, a shadow delta and non-pill radius drift all still flag.

11. **Probe projections are evidence, not ladder cells.** A capture may re-shoot a ladder width at a second viewport height to make a viewport-relative extent identifiable. That projection shares the `(engine, width, state)` key of the cell it re-shoots — height is deliberately not in the key, because that is not what a *responsive* comparison is about — so it was read as a duplicate ladder cell: the diff both overwrote 1280's reproduction with the probe's taller render and emitted a second 1280 cell, 59 phantom deltas on a reproduction that had not changed. The rule is now explicit and shared with every ladder consumer: the **first** projection at a key defines the ladder, later ones are evidence.

12. **Behavioural facts are not painted facts.** A captured control carries its control type and its enclosing form's action. These are what a behavior module needs, not what the page paints, so the painted comparison ignores them entirely.

13. **fontLoad false-positive correction** — the *reverse* fontLoad direction (the reference showed a font fallback but our render resolved the intended face) is no longer emitted as a delta; only the forward direction, where *our* render fell back, remains a defect.

**In scope:** the capture axes (including the conditions under which an axis records a value at all, and which element an axis is attributed to), page segmentation for comparison, node identity across split controls, ladder/evidence partitioning of repeated projections, comparison tolerances/severities, the duplicate-text pairing rule, and the fontLoad diff direction of the intrinsic `values-diff` path.

**Out of scope:** gradient axes (separate story), the perceptual pixel diff, the analytic `l1-gate` (geometry + envelope only, a separate concern), the fold's own reconstruction of surfaces, and any framework authoring dials.

## Technical Context
- Belongs to capability **1c Values-Diff Fidelity** (`capability-aa030c83`); the unifying mandate is the invariant "0 value-diffs ⟺ pixel-faithful". Coverage closes false negatives; noise closes false positives — only with both does the invariant hold and the operator's eye stop being the QA layer.
- **Both sides of the diff may have different DOM shapes for the same pixels.** This story's noise closures are all instances of one fact: a diagnostic that keys on DOM structure (ancestor walk, one-node-per-text assumption, top-level-child segmentation) reports a difference where none is painted. Every such diagnostic is restated geometrically — what contains this run, what box bears this surface, what shape does this radius actually paint — so the answer is the same on a nested reference and a flat reproduction.
- The rendered-text-extent comparison is a *ratio* rather than an absolute band because the extent scales with text length. A global `--tolerant` flag widens the ratio band as an accepted-gap escape hatch.
- Every axis is **additive and backward-tolerant**: a value absent on either side (a bundle captured before the axis existed) is skipped rather than reported, so each closure can only *reduce* false negatives. This holds for the surface-bearing box too — a retained bundle stays inert until re-captured.
- **A captured axis must record only what is painted.** An axis whose CSS property has a non-neutral *initial value* (`list-style-type`'s `disc`) is meaningless unless gated on the condition that makes it render.
- DOM-measured by construction, so these axes remain reliable where pixel-thresholding a glyph over a photographic background is not (per DOC-19).
- **Known bounded residual (recorded as intent, not a gap):** Chromium serializes `color-mix(in oklab, …)` in a wide-gamut form the exact parser does not read, so that one path still falls back to the pixel probe (≤1 level per channel, ~0.3/255 composited at 30% alpha). It is self-cancelling — both sides of a diff go through the same capture path.
- **Known bounded residual:** a small `borderLeft` / `surfaceGradient` count survives geometric attribution on a flat reproduction as an attribution artifact between two visually equivalent DOM shapes (no pixel differs), rather than a paint gap.

## Dependencies
Depends on the capture recording contract (which box paints what, the surface-bearing shape, colour alpha, behavioural control facts, the height-probe projection) — this story consumes those recordings.

## Story Points
3