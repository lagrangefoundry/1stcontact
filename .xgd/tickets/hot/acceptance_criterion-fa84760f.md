---
uid: acceptance_criterion-fa84760f
id: AC-1232
type: acceptance_criterion
title: Removing an entry nothing references succeeds and leaves every other entry
  untouched
created_by: xgd
created_at: '2026-08-20T01:19:56.621891+00:00'
updated_at: '2026-08-20T01:50:36.634576+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

Removing an entry that nothing references succeeds: the entry is gone from the palette, the next
read no longer lists it, the site still validates and renders, and every other entry keeps its
colour and its count.

## Verification

Seed a site declaring an entry that no page references. Remove it and assert the operation
succeeds and reports the removal; read the palette and assert the entry is absent while the
remaining entries are unchanged in colour and count; render the site and assert it still
validates and produces output.