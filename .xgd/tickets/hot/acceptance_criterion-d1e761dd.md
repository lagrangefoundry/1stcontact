---
uid: acceptance_criterion-d1e761dd
id: AC-577
type: acceptance_criterion
title: Unpaired objects are reported loudly in both directions with counts
created_by: xgd
created_at: '2026-07-13T19:51:24.072705+00:00'
updated_at: '2026-07-13T19:57:11.611879+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-74050e88
  kind: behavior
  regression_only: false
---

## Criterion
Objects that fail to pair are surfaced explicitly rather than folded into a
single unmatched count, in both directions: reference objects with no
reproduction match, and reproduction objects that matched no reference object.
The output states both counts (how many reference objects had no repro match,
and how many repro objects matched nothing) and lists the affected objects by
their identity (kind and label/role), positioned prominently ahead of the
per-object cards.

## Verification
Compare a pair in which one reference object is missing from the reproduction
and one extra object exists only in the reproduction. Assert the output names
both counts (1 reference object with no repro match; 1 repro object matching
nothing) and lists each unpaired object's label, and that the extra
reproduction-only object appears in the loud unpaired reporting rather than only
as an incremented count.