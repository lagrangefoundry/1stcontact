---
uid: acceptance_criterion-50dc01f8
id: AC-1807
type: acceptance_criterion
title: The arrival notice is last in a turn's context, after the maps, the purpose,
  the manual and the site-change reminder
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:56.192878+00:00'
updated_at: '2026-09-14T06:52:06.616259+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

The arrival notice is the **last** thing in a turn's context, after everything
that is stable across turns — the landscape, the purpose, the manual — and after
the reminder of what the client changed on the site since the previous turn.

Ordering here is a cost decision rather than a presentation one: the maps and the
manual are identical from turn to turn and the notice is not, so the volatile
material sits last and the stable prefix in front of it can be reused across the
whole conversation instead of being invalidated every turn.

## Verification

Take a turn on a conversation where both a site change and a knowledge arrival
have occurred since the previous turn, and inspect the assembled context: the
arrival notice appears after the landscape, purpose and mechanism sections and
after the site-change reminder, with nothing following it. Take a further turn
with only an arrival and confirm it is still last.