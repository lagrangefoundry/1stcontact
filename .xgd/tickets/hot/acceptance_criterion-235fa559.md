---
uid: acceptance_criterion-235fa559
id: AC-1256
type: acceptance_criterion
title: Asking since the current change count is the cheap nothing-happened answer,
  not an error
created_by: xgd
created_at: '2026-08-20T02:26:57.029573+00:00'
updated_at: '2026-08-20T02:26:57.029573+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

Asking for changes since the site's current change count returns an empty list of changes, the current count, and no truncation — an answer, not an error. This is the cheap "nothing happened" reply.

Asking with no baseline at all returns everything the window still retains.

## Verification

On a site with some history, read the current count, then ask for changes since exactly that count. Assert the answer reports the same count as current, an empty change list, and truncation false.

Ask again with no baseline supplied and assert every retained record is returned, oldest first.
