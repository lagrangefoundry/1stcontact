---
uid: acceptance_criterion-320d89a2
id: AC-784
type: acceptance_criterion
title: Captured form controls fold to one behaviour seam per form, pinned at the form's
  own union rect at every sampled width
created_by: xgd
created_at: '2026-08-03T03:20:26.332927+00:00'
updated_at: '2026-08-03T03:33:08.106478+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

Folding a capture that contains form controls produces one behaviour seam per
form, each naming the behaviour it hosts, and reports no unfoldable-control gap
for any control that was captured with geometry. Each seam's geometry carries a
keyframe at every sampled width of the ladder, and at each width the seam's rect
is the union of its own controls' captured rects at that width. Each seam is
accompanied by exactly one binding naming that seam, in document order.

A captured control that has no geometry at any sampled width has nothing to mount
at and is still reported as a named gap, identifying the control and the reason.

## Verification

Fold a multi-form capture and assert: no control-kind gaps are reported; the
seams emitted match the number of forms and each carries the expected name and
behaviour; each seam's keyframes cover the full ladder and its rect at the widest
width equals the union of that form's captured control rects. Fold a capture
whose control carries no geometry at any width and assert a gap is reported for
it naming the missing geometry.