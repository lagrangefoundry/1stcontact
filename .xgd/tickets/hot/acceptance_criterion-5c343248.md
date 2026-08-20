---
uid: acceptance_criterion-5c343248
id: AC-1258
type: acceptance_criterion
title: A caller advancing its baseline from its own writes never sees its own edits
  reported back
created_by: xgd
created_at: '2026-08-20T02:27:06.438199+00:00'
updated_at: '2026-08-20T02:27:06.438199+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

A caller that advances its baseline from the count each of its own writes returns never sees its own edits reported back to it as changes.

## Verification

From a single caller, perform several writes in sequence, each time replacing the held baseline with the count that write answered with. After the last one, ask for changes since the held baseline and assert the list is empty.

Then have a *different* caller make one write, and assert that asking again since the same held baseline returns exactly that one record and no others.
