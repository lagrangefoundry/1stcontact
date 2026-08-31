---
uid: acceptance_criterion-29569117
id: AC-1456
type: acceptance_criterion
title: A turn runs on a host process that never opened the session, and turns across
  processes stay one conversation
created_by: xgd
created_at: '2026-08-31T17:33:27.229285+00:00'
updated_at: '2026-08-31T17:33:27.229285+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

A conversation is not a property of the host process that opened it.

A client holding only the identifier it was given can speak the next turn
**without re-opening the conversation**, and that turn runs even when it is
served by a host process that has never seen that identifier and holds nothing
in memory about the conversation — the state a newly started or replaced process
is in.

Turns answered by different processes accumulate into **one** conversation for
that site rather than starting a fresh one each time: re-opening afterwards, on
a process that served none of them, answers with the same identifier and replays
every turn in the order they were spoken.

## Verification

Open a conversation for a site and keep only the identifier it answers with.
Discard everything a host process holds in memory, as a replaced or newly
started one would, then submit a turn carrying that identifier alone: it is
answered by the assistant, and not with a report that the conversation is no
longer open. Speak a second turn after discarding again. Discard once more and
re-open the site's conversation: it answers with the same identifier and replays
both turns, with their original text and attribution, in the order they were
spoken.
