---
uid: acceptance_criterion-d1bda2c2
id: AC-1093
type: acceptance_criterion
title: The operator's click-to-edit form opens and saves on an element the assistant
  composed, leaving the assistant's styling intact
created_by: xgd
created_at: '2026-08-10T09:20:27.186022+00:00'
updated_at: '2026-08-10T09:20:27.186022+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

An element the assistant composed is an ordinary page element to the operator's own
editing gesture: clicking it opens the same small form, over the same derived fields, with
the element's current values; saving it writes the change through the same validated
write; and every typed appearance property the assistant set on that element survives the
operator's save untouched.

## Verification

Through the surface, author a text element carrying typed appearance properties. Then, over
the same transport the browser uses, ask the editing gesture for that element's fields —
assert they are the fields that element's kind exposes, carrying its current values — and
save a changed value. Assert the page now holds the new value and that every appearance
property the assistant set is byte-identical to before the save.
