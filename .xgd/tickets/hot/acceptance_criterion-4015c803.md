---
uid: acceptance_criterion-4015c803
id: AC-1282
type: acceptance_criterion
title: A locked control is drawn unavailable rather than faded — it cannot be operated
  by any route — and its reason is rendered under the row, for both control families
created_by: xgd
created_at: '2026-08-20T03:38:59.624312+00:00'
updated_at: '2026-08-20T03:38:59.624312+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

Where the surface declares a control unavailable, the dialog draws it
**unavailable rather than merely faded**, and says why.

The row stays where it is and keeps its label, and a colour row keeps reporting
the colour the element actually paints — a missing row would read as "this build
has no such control" rather than "not on this element", and those have very
different fixes. What goes is the affordance: the control cannot be operated by
pointer or by keyboard and is not offered as operable to a screen reader, so
activating it reaches no picker and nothing can be staged through it. Being
visibly faded is not sufficient on its own, because appearance closes none of
those three routes.

**The reason is rendered as text under the row it explains**, once, in the words
the surface supplied — not as a tooltip, which would hide the explanation from
exactly the reader who needs it and would not exist at all on a touch device. It
reads identically whichever control drew the row: the rows the shared form
component renders and the rows this dialog draws itself are marked the same way
and carry the same field identity, so one pass over the sheet explains both and
the operator is never shown which control happened to draw what.

A locked row whose reason has nowhere to hang — no row rendered for it — simply
shows none. It does not prevent the dialog from opening.

## Verification

Open the dialog over a region carrying at least two locked controls, one drawn by
the shared form component and one drawn by the dialog itself. Assert both rows
are present, both are marked unavailable, and each has its reason rendered
directly beneath it in the surface's own words. Assert the locked colour control
cannot be operated — activate it and assert no picker is reached and nothing is
staged — and that it still reports the colour the element paints. Assert the
reason is body text under the row rather than only a hover affordance.
