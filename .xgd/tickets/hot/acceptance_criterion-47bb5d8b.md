---
uid: acceptance_criterion-47bb5d8b
id: AC-1254
type: acceptance_criterion
title: A write that changes nothing returns the current change count and records nothing
created_by: xgd
created_at: '2026-08-20T02:26:47.194583+00:00'
updated_at: '2026-08-20T02:46:18.803036+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

A write that succeeds but changes nothing — a copy save posting values identical to the ones already stored, or a fix run in dry-run mode — answers with the site's **current** change count, unchanged, and adds no record to the change log.

Only a write that actually alters the draft advances the count.

## Verification

Save a segment with exactly the values it already holds. Assert the answer reports "no change", carries the same count that stood before the save, and that asking for changes since that count still returns an empty list.

Repeat for a fix command invoked without applying its fixes: assert the count is returned unchanged and no record appears.