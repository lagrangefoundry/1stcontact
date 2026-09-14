---
uid: acceptance_criterion-e44d6bbb
id: AC-1792
type: acceptance_criterion
title: A turn on the deployed host leaves the conversation as one chat ticket carrying
  its session id, with the session file in a transcript comment and the body untouched
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:52:51.563953+00:00'
updated_at: '2026-09-14T05:52:51.563953+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

A turn taken on the deployed runtime leaves the conversation as a `chat` ticket in
the account's own ticket store:

- the ticket carries the conversation's identifier in its `session_id` field, which
  is how it is found again — a conversation is looked up by what it is *of*, not by
  a handle some process happened to keep;
- the whole session file is the body of one `chat_transcript` comment on that
  ticket;
- the ticket **body is untouched** — it is left empty by this path, because it is
  reserved for a summary something else writes, and a transcript written into it
  would be clobbered by that writer or would clobber it;
- a second turn in the same conversation folds onto that same ticket and that same
  comment. One ticket per conversation, never one per turn.

So a conversation is an ordinary ticket in the same store as everything else the
account owns, discoverable by the same query.

## Verification

Take a turn on the deployed runtime, then query the account's ticket store for
`chat` tickets: exactly one names this conversation in its `session_id`, its body
is empty, and it carries a `chat_transcript` comment whose body contains what was
said. Take a second turn in the same conversation and query again: still exactly
one such ticket, and the transcript comment now contains both exchanges.
