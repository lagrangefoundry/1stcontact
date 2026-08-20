---
uid: acceptance_criterion-66f840fe
id: AC-1238
type: acceptance_criterion
title: 'A palette write needs no rebuild: the next request for either draft-side channel
  serves the new colour'
created_by: xgd
created_at: '2026-08-20T01:20:45.329070+00:00'
updated_at: '2026-08-20T01:50:34.657931+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

A palette write requires no separate rebuild or refresh step: the very next request for either
of the site's draft-side render channels serves the new colour, because both channels render the
site's definition at request time.

## Verification

Change an entry's colour, then — with no other command run in between — request each draft-side
channel and assert the returned page contains the colours derived from the new value and none
derived from the old.