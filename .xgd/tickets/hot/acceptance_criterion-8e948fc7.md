---
uid: acceptance_criterion-8e948fc7
id: AC-2090
type: acceptance_criterion
title: Reattaching from a cursor streams the rest of a live turn in the same frame
  format, with nothing before the cursor repeated; a reattach with no cursor is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T02:37:53.106044+00:00'
updated_at: '2026-11-01T02:37:53.106044+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
A caller that holds a conversation identifier and the cursor an open answered with
can rejoin that conversation's live turn. The rejoin streams, from exactly that
cursor, the rest of the turn in the same event-stream frames and the same event
vocabulary a turn is delivered in — assistant text, tool activity (with image
bytes removed exactly as in a live turn) and cards — ending in exactly one
completion that carries how the turn ended (complete, aborted or error). Nothing
before the cursor is streamed again and nothing after it is skipped, so the text
the open returned followed by the text the rejoin streamed is the assistant's
reply exactly once. A rejoin is a reader: it does not start a turn, does not
disturb the turn being produced, needs no model key and writes nothing durable.

A rejoin request without a cursor, or with a cursor that is not a finite,
non-negative number, is refused with a client error and streams nothing; a missing
cursor is never treated as zero. A rejoin without a conversation identifier is
refused the same way. An identifier that names no conversation this account holds
is answered inside the stream with a readable refusal followed by the completion.

## Verification
Hold a turn open after a known prefix; open the conversation and record the
partial reply and cursor. Rejoin with that cursor, release the turn, and read the
stream to its end: the frames parse with the same reader the prompt route uses,
the concatenation of the opened partial reply and the rejoined text equals the
whole reply with no repeated or missing characters, and the stream ends in one
completion with status complete. Send a rejoin with the cursor omitted, and with
a negative cursor: each answers 400 with no stream.
