---
uid: acceptance_criterion-a20088ef
id: AC-1817
type: acceptance_criterion
title: A turn's stream announces each write where it happened, and a turn that writes
  nothing announces nothing
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:52:37.950089+00:00'
updated_at: '2026-09-14T07:52:37.950089+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Each time an operation the assistant ran during a turn moves the site's draft, the
turn's stream carries a change signal at that point in it — immediately after the
activity that caused the move, before whatever the assistant does next — reporting the
draft's change count as it stands at that moment and how many changes have landed since
the previous signal in the same turn.

A request answered by several edits therefore produces several signals, spaced through
the turn where the edits happened, rather than one collected at the end. A turn whose
operations move nothing carries no signal at all, and neither does a turn in which the
assistant only speaks.

What a signal announces is real at the moment it is announced: the write it reports has
already landed, so anything re-fetched on the strength of it is the site the operator
was told about.

## Verification

Drive a turn in which the assistant runs two site-changing operations and then speaks.
Observe the stream's events in order — activity, signal, activity, signal, text,
completion — with the first signal reporting a change count of one and the second a
count of two, each reporting a single change since the last. Fetch the pages those two
operations added and confirm both render.

Drive a turn whose only operation is a read, and confirm the stream carries activity and
no signal. Drive a turn in which the assistant runs no operation at all, and confirm the
stream carries only its text and the completion.
