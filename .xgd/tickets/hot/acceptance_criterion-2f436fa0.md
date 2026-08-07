---
uid: acceptance_criterion-2f436fa0
id: AC-1001
type: acceptance_criterion
title: A region with nothing editable says so plainly instead of opening an empty
  form
created_by: xgd
created_at: '2026-08-07T02:16:51.413505+00:00'
updated_at: '2026-08-07T02:16:51.413505+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

Clicking an editable region that exposes no editable fields — a container, a
module instance — opens a plain message stating there is nothing to edit on that
kind of region yet, rather than an empty form and rather than nothing at all.
The message names the kind of region clicked, so the operator understands the
answer is "not this one" rather than "this is broken".

## Verification

Click a region known to expose no fields and assert a message dialog appears
carrying that statement and naming the region's kind, and that it contains no
form controls.
