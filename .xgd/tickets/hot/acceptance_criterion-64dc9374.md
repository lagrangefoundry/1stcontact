---
uid: acceptance_criterion-64dc9374
id: AC-1261
type: acceptance_criterion
title: The text a record carries is bounded and visibly cut when it exceeds the limit
created_by: xgd
created_at: '2026-08-20T02:27:21.484762+00:00'
updated_at: '2026-08-20T02:27:21.484762+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

The text a record carries is bounded. A change to a body of text longer than the record limit is stored and returned cut to that limit with a visible mark that it was cut, so one enormous paste cannot make the change log expensive to read.

Text at or under the limit is carried whole and unmarked.

## Verification

Edit a segment whose text is comfortably longer than the record limit. Read the record back and assert its before/after values are no longer than the limit and end with the cut marker, while still beginning with the real text.

Edit a short segment and assert its before/after values are byte-identical to the real text with no marker appended.
