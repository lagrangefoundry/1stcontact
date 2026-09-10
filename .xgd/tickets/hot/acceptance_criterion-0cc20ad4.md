---
uid: acceptance_criterion-0cc20ad4
id: AC-1616
type: acceptance_criterion
title: Cause roll-up never counts a derived axis and never drops an untaxonomised
  property
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:53:55.832044+00:00'
updated_at: '2026-09-10T00:40:22.984162+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Two rules keep the `--clusters` roll-up honest, and they pull in opposite directions —
one refuses to count something, the other refuses to drop something:

- **A derived axis is never counted as a defect of its own.** An absolute `position`
  delta is the cumulative shadow of some other cause (a gap or a size defect
  upstream), not an independent defect, so counting it double-counts that cause and
  buries a handful of real causes under their downstream echoes. Derived rows are
  excluded from the headline count and from the cause roll-up, while remaining
  available for drill-down and acknowledged in the report rather than silently
  dropped.
- **A property with no taxonomy entry falls back to its own name at `review`.** It is
  *not* dropped from the count. This is the rule that keeps the view honest as the
  captured axis set grows: a newly added value axis appears in the ranking the day it
  lands — under its own property name, awaiting a per-case judgement — instead of
  silently vanishing from the count because nobody remembered to extend the cause map.

## Verification
Run `--clusters` over a diff carrying a `gap` defect and an absolute `position` delta
downstream of it. Assert the position row does not appear as a cause and is not in the
counted total, while the gap cause is counted once; assert the derived row is still
reachable for drill-down and its exclusion is stated in the report rather than left
implicit. Then run `--clusters` over a diff carrying a delta on a property absent from
the cause taxonomy: assert it appears in the ranking under its own property name with
disposition `review`, and that the counted total includes it.