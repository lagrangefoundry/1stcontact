---
uid: acceptance_criterion-96e171f3
id: AC-956
type: acceptance_criterion
title: The published and preview renders are byte-identical to what they were before
  the edit channel existed, and still work
created_by: xgd
created_at: '2026-08-06T21:27:03.522157+00:00'
updated_at: '2026-08-07T02:42:27.086155+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
---

## Criterion

Nothing belonging to the edit channel appears in the two shipped channels. The
published and preview renders of a page carry no region stamp, no address, no
page stamp, no document-level edit marker and no outline treatment — neither the
resting outline nor the hot one — and remain fully functional: their links carry
their destinations and their forms their destination and submit verb.

The bytes those two channels produce for a given definition are unchanged by the
existence of the edit channel.

## Verification

Render a seeded site's preview and published channels and assert their output
contains no address, no region stamp, no page stamp, no edit marker and no
outline treatment, and that link destinations and form destination/verb are
present. Compare the bytes of both channels' output against the bytes produced
for the same definition without the edit channel and assert they are identical.
