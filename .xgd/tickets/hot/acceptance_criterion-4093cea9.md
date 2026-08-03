---
uid: acceptance_criterion-4093cea9
id: AC-786
type: acceptance_criterion
title: A captured button next to a form's fields becomes that form's submit control
  and leaves the page body
created_by: xgd
created_at: '2026-08-03T03:20:53.439745+00:00'
updated_at: '2026-08-03T03:20:53.439745+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

When a captured button sits within the same proximity scale that groups a form's
own fields, and is nearer to that form than to any other, it becomes that form's
submit control:

- the form's seam expands so its rect contains the button at every sampled width
  the button was captured at, so the mounted control renders inside its own seam;
- the button no longer appears as a standalone element of the page body, so the
  reference's single button is painted once rather than duplicated by an inert
  second one;
- the binding for that form carries the button's appearance (its type axes, fill,
  rounding, padding and line treatment) and not its page-absolute placement,
  which the hosting behaviour owns;
- a button claimed by one form is never also claimed by another.

A captured button that sits outside that proximity scale from every form remains
an ordinary element of the page body and is claimed by no form.

## Verification

Fold a capture in which each form has an adjacent button and assert: each form's
binding carries a submit appearance; each seam's rect contains its button's rect
at each width; neither button remains among the page body's elements; and the two
buttons are matched to different forms. Fold a capture with a page-level button
far from any form and assert it survives in the page body and no form claims it.
