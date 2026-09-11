---
uid: acceptance_criterion-405eea59
id: AC-1667
type: acceptance_criterion
title: Indexing a conversation leaves the client's map exactly as it was
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:36.366963+00:00'
updated_at: '2026-09-11T03:47:36.366963+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

Indexing a grown conversation leaves the client's awareness map exactly as it
was. Where no map has been published, none appears; where one has, its content is
the content it already had.

This holds however many times, and by however much, conversations grow: the
description of the territory "conversations with this client" is stable from the
first turn, so conversation growth never triggers a rebuild and never incurs a
model call.

## Verification

With a client account whose map has never been published, grow a conversation
past the batching threshold, confirm it was indexed, and assert that reading the
client's published map still yields nothing.

Then, with a map published (built from the client's material), record its
content, grow a conversation past the threshold again, and assert that the
published map's content is byte-identical to what was recorded — and that no
description step was reached, using a describer that counts its own invocations.
