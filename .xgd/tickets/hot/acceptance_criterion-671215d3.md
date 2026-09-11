---
uid: acceptance_criterion-671215d3
id: AC-1731
type: acceptance_criterion
title: A conversational handover appears as the client's own turn; a Library one adds
  no turn
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:39.314516+00:00'
updated_at: '2026-09-11T05:42:21.722183+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

Where the client handed the file over decides what the conversation says.

- A handover begun in the conversation appears in that conversation as the **client's own turn**,
  naming the file that was handed over and reporting what became of it — including, when the file
  was put on the site, the name it is on the site under.
- A handover begun in the Library adds no turn to the conversation. It reaches the assistant by
  the same path as a conversational one; what it does not do is put a line into a conversation it
  was not part of.

## Verification

In the builder workspace, raise the overlay from the conversation and drop a file into the *put it
on the site* area; assert the conversation gains exactly one turn, attributed to the client,
naming the file and stating that it is on the site. Then raise the overlay from the Library and
drop a file into the *just for you to read* area; assert the handover reached the platform and the
conversation still holds exactly the one turn from before.