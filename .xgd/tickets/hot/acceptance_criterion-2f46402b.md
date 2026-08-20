---
uid: acceptance_criterion-2f46402b
id: AC-1346
type: acceptance_criterion
title: Per-side padding folds as an axis, with a per-width track for any side that
  varies across the ladder
created_by: xgd
created_at: '2026-08-20T12:47:47.578171+00:00'
updated_at: '2026-08-20T12:49:15.342791+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
A text, image or box leaf carries the **per-side padding the reference painted** as a
folded axis of its own. The capture reads a border box that already includes the padding,
so the pinned geometry carries the pad and the folded axis insets the content inside that
box — giving badges, buttons and panels their real shape and click target — instead of
reproducing with content flush to the leaf's own edges.

- Each of the four sides folds independently from its captured value; a side that is
  zero, absent or out of the envelope's range is dropped.
- An element whose padding is all-zero emits **no** padding axis at all, so a page that
  pads nothing gains no bloat.

**A side that varies across the ladder earns its own per-width track**, layered over the
base scalar, exactly as a numeric type axis does — the two families are mirrors of one
another, so the rule reads the same in both places: any scalar axis whose measured value
differs across the sampled widths folds to a per-width keyframe track, while an axis
holding one value at every sampled width stays a plain scalar. A track earns its place
only by varying and only where at least two sampled widths carry the axis.

## Verification
Fold a fixture capture in which a run, an image and a painted box each carry distinct
per-side padding, and assert each folded leaf carries a padding axis whose four sides
equal the captured values; assert an element captured with all-zero padding emits no
padding axis. Render and assert the padded leaf's content is inset within its pinned box
rather than flush to its edges.

Responsive track: for a leaf whose horizontal padding differs between the narrow and wide
samples, assert the folded node carries a per-width padding track for that side whose
keyframes match the captured values while the unvarying sides stay plain scalars; for a
leaf whose padding is identical at every sampled width, assert no track is emitted.