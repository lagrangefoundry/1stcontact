---
uid: acceptance_criterion-ce71a033
id: AC-994
type: acceptance_criterion
title: Clicking a copy region opens a form over that region's fields, carrying the
  words currently on the page
created_by: xgd
created_at: '2026-08-07T02:16:19.710210+00:00'
updated_at: '2026-08-07T02:16:19.710210+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

Clicking an editable copy region on the page opens a single form dialog whose
fields are exactly the fields that region exposes, pre-filled with the words
currently in the draft for that region. The click performs no other action —
whatever the element would ordinarily do when clicked does not happen.

The form is built from typed controls supplied by the shared component set and
is confirmed as a whole (buffered), not field by field. There is no editing on
the page itself, no rich-text surface, and no control through which markup or
styling could be entered.

## Verification

In a real browser, click a copy region on the displayed editable page. Assert a
single dialog appears, that its form is the shared component's form (not a
hand-built one) in whole-form confirm mode, and that the field it shows contains
the text that region displays on the page. Assert no navigation or other default
action occurred.
