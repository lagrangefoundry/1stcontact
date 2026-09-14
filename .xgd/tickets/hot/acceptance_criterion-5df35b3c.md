---
uid: acceptance_criterion-5df35b3c
id: AC-1054
type: acceptance_criterion
title: A turn that changes the site streams what the assistant did and said, ends
  in exactly one completion, and the change is in the draft
created_by: xgd
created_at: '2026-08-10T08:35:43.022538+00:00'
updated_at: '2026-09-14T07:52:16.139972+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A turn in an open conversation streams events as they occur: the activity of each
operation the assistant runs (naming the operation), the assistant's own words, a
change signal each time that activity moved the site, and exactly one terminal
completion that releases the caller.

A turn that changes the site leaves that change in the site's draft — the draft,
not the stream, is what the change is. The signal says only that the draft moved,
and it says so where the move happened rather than in a summary once the
assistant has stopped talking.

## Verification

Drive a turn in which the assistant runs one site-changing operation and then
speaks. Observe, in order: an activity event naming that operation, a change
signal, the assistant's text, and exactly one completion event — and the site's
draft holding the requested change.
