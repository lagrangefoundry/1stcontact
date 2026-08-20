---
uid: acceptance_criterion-164fa361
id: AC-1260
type: acceptance_criterion
title: A record stays readable after a structural change invalidates the address it
  was recorded against
created_by: xgd
created_at: '2026-08-20T02:27:16.967612+00:00'
updated_at: '2026-08-20T02:27:16.967612+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

A record remains readable and meaningful after a structural change has invalidated the address it was recorded against: the human-readable label and the before/after text are still returned and still describe what happened, even though the address no longer points at that element.

## Verification

Make a copy edit and note the record. Then make a structural change to the same page that shifts positions — inserting or removing an element earlier in the tree — so the recorded address now resolves elsewhere or not at all.

Ask for changes since before the copy edit and assert the original record still carries its label and its before/after text unchanged, and is still attributable to the right page.
