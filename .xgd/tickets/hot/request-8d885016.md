---
uid: request-8d885016
id: REQ-63
type: request
title: 'Coverage audit: capture + diff every render-affecting CSS axis (close all
  blind spots)'
created_by: xgd
created_at: '2026-07-17T01:33:33.615654+00:00'
updated_at: '2026-07-22T18:51:58.931080+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 8c0c6363e4da654ab348e6e6446f53bcde584a97
    reconcile_sha: null
    main_sha: null
  version: 0.0.136
  bundled_in: bundle-31e474b9
---

## Goal

**Coverage audit of the capture/diff: enumerate every render-affecting CSS
property and confirm each is captured + compared — close every blind spot** so a
visible difference cannot exist without a delta.

## Why

The values-diff has systematic BLIND SPOTS (false negatives) found only reactively,
by the operator's eye: font-style (italic), checkmark/glyph shape, the full 4-side
border, bar geometry — and historically alpha compositing, gradient panels, input
borders, duplicate-text pairing. Each was a real gap. Until coverage is complete,
"0 value-diffs" is never a trustworthy verdict. This is the DUAL of the REQ-58
expression audit: that made every value *authorable*; this makes every value
*measurable*.

## Scope

1. **Enumerate** the complete set of render-affecting CSS axes (typography, box,
   border, background, layout, effects, content/glyph), as a checklist.
2. **Mark** each captured / partially-captured / blind against the current
   extractor (`extract.ts`) + diff (`values-diff.ts`).
3. **Close the blind ones** with new axes, e.g. (known today):
   - `font-style` (italic/oblique) — NOT captured at all (a whole property).
   - `text-decoration` (underline/strike), `font-variant`, `text-transform`.
   - Full 4-side `border` beyond the left accent bar (colour/width/style/radius
     per side) — box-border colour landed (T7) but not per-side.
   - Border/rule GEOMETRY (a bar's height + offset, not just width+colour).
   - Glyph / icon SHAPE (a different checkmark glyph with the same extent).
4. Add a UAT per new axis; each closure should only reduce false negatives.

## Notes

- Sibling to the noise audit (false positives). Coverage kills false negatives;
  noise kills false positives. Only with BOTH does "0 value-diffs ⟺ pixel-faithful"
  hold, and the operator's eye stops being the QA layer.
- `font-style` is the quick poster child (~20 min): capture computed `font-style`,
  compare as a treatment axis.
- Some axes need capture accuracy too (cf. REQ-58 T5 alpha compositing): measure
  the RENDERED fact, not the declared one.


## Implementation (free-code, REQ-63)

Closing the enumerated blind spots as new capture+diff axes. Each is additive
(new optional field) so it can only *reduce* false negatives (scope item 4);
existing REQ-58 border/effects UATs stay green.

**Typography (per text run):**
- `fontStyle` (italic/oblique) — kind `textTreatment`, MEDIUM.
- `textDecoration` (underline/line-through/overline) — `textTreatment`.
- `textTransform` (uppercase/capitalize/lowercase) — `textTreatment`.
- `fontVariant` (small-caps) — `textTreatment`.
- `listMarker` (list-style-type bullet/decimal/none) — kind `marker`, MEDIUM.

**Effects (per element — runs + fields via ElementGeometry):**
- `backdropFilter` (frosted-glass, presence) — reuse `treatment`.
- `blendMode` (mix-blend-mode, presence) — reuse `treatment`.
- `opacity` (partial element opacity value) — new kind `opacity`, LOW.
- `outline` (width+colour+style, distinct from border) — reuse `border` kind.
- `pseudo` (::before/::after injected content presence) — reuse `treatment`.

**Border cluster:**
- Extend the box-border treatment with `style` (dashed/dotted/solid) and pick
  the thickest painted side (catches a bottom-only rule, not just the top edge).
- Capture the box border on TEXT RUNS too (was fields-only).

**Media:**
- `objectPosition` (image crop within its box) — reuse `media` kind.

**Deferred residuals (documented, not false-negative-free-cheap):**
- Glyph/icon SHAPE hashing — needs pixel rasterisation; `renderedTextBox` remains
  the extent proxy. The single hardest axis in scope.
- Independent 4-way per-side border *colours* and inline-SVG `fill`/`stroke` —
  both need a new captured object kind / 4-way type that would ripple through the
  whole projection; captured presence + dominant-edge + style covers the observed
  cases. Flagged for a follow-up.