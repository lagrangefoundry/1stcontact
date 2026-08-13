---
uid: acceptance_criterion-803d7ad9
id: AC-1139
type: acceptance_criterion
title: A changed size previews at the scale the dialog dressed the run at, so a run
  above the editing range still visibly responds
created_by: xgd
created_at: '2026-08-13T01:08:59.887914+00:00'
updated_at: '2026-08-13T01:08:59.887914+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A size the operator changes is previewed at **the scale the box was dressed at
when it opened** — what the box showed per unit of what the run is set to,
measured once, at open — rather than being put through the opening editing range
again.

The scale folds together two reductions that are separately uninteresting: the
range that keeps a display headline usable inside a dialog, and any difference
between the size a run is authored at and the size the page is actually
rendering it at the current window width. What the box needs is the single ratio
between the two, so copy set inside the range previews changes at their own size
while a run set above it previews proportionally reduced — and, crucially, still
**moves for every change**.

That last part is the whole point. A run above the range opens sitting on the
range's upper bound, so re-applying the range to each new size would answer every
increase with the same size and show the operator nothing at exactly the runs
where size is worth changing. Previewing by scale is what makes the control
honest there.

The legibility floor is kept: shrinking far below the run's own size saturates at
the range's lower bound rather than becoming text the operator cannot read while
typing into it. There is no upper bound, because the box scrolls.

Degrading is quiet rather than total: a run whose opening size cannot be read,
and a run that declares no size of its own, preview changes at the size asked for
rather than not at all; and a size that is not a readable positive number leaves
the box's previewed size as it was.

## Verification

Open the dialog over a run set far above the editing range and first assert the
precondition — that the box opened previewing it smaller than the run's own size,
so the case under test is genuinely the reduced one. Raise the size and assert
the previewed size grows; lower it and assert it shrinks. Compute the ratio the
box opened at and assert each subsequent previewed size is the changed size at
that ratio, not the range's bound. Repeat over a run set inside the range and
assert the same rule reproduces changed sizes at their own size. Shrink the size
far down and assert the previewed size saturates at the range's lower bound, and
raise it far up and assert it is not capped.
