---
uid: acceptance_criterion-00b36ce5
id: AC-746
type: acceptance_criterion
title: When a wrapper paints a left accent rule, the bearing element's rect is recorded
  and survives into the multi-viewport value set
created_by: xgd
created_at: '2026-08-03T00:24:58.509435+00:00'
updated_at: '2026-08-03T00:53:40.451508+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
Where a left accent rule is painted by an element that WRAPS the run (the common
authored pattern: a bordered wrapper whose padding insets the text), the capture
records the rect of that bearing element together with the rule's width and
colour — so a reproduction can draw the rule where the reference draws it rather
than on the inset run.

The bearing rect is present in the multi-viewport value set the ladder produces,
not only in a single-page extraction. Where the run's own box paints the accent,
no separate bearing rect is recorded.

## Verification
Capture a page whose quote block is a bordered wrapper containing an inset
paragraph, across the viewport ladder: at every sampled width the run records the
accent's width and colour plus the wrapper's rect, and the rect is readable from
the persisted multi-viewport value set. Control: a run whose own box carries the
border records the rule with no separate bearing rect.