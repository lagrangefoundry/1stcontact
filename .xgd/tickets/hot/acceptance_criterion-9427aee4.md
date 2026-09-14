---
uid: acceptance_criterion-9427aee4
id: AC-1799
type: acceptance_criterion
title: A turn on which nothing arrived carries no arrival notice at all, not even
  an empty one
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:24.771708+00:00'
updated_at: '2026-09-14T06:28:24.771708+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A turn on which nothing entered the client's knowledge since the previous turn
carries **no arrival notice at all** — not a heading, not "nothing new", not an
empty line a caller could join into the turn's context by accident.

The rule is not economy for its own sake: a line that appears every turn and is
almost always empty teaches the model to skim exactly the region the non-empty
case has to be noticed in.

## Verification

Open a conversation and take a turn. Without uploading anything, take a second
turn. Inspect the context given for the second turn and confirm it contains no
arrival wording of any kind. Confirm the same at the level of the notice itself:
asked for a notice covering an empty set of arrivals, the answer is the absence
of a notice rather than an empty or placeholder string.
