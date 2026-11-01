---
uid: acceptance_criterion-2cc17228
id: AC-2088
type: acceptance_criterion
title: Opening a conversation while a turn is in progress returns that turn's records
  so far, and reports the cursor consumed and that a turn is live
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T02:37:50.029724+00:00'
updated_at: '2026-11-01T09:51:07.151268+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
Opening a conversation while one of its turns is still being produced answers with
that turn as far as it has got: the operator's message and whatever the assistant
has said so far, in the order produced, as one assistant turn rather than split at
the point it was read. The same answer reports the cursor the read consumed and
that a turn is live. The stored durable copy, which deliberately holds only
completed turns, is not what the answer is read from; a conversation with no live
record yet on the serving host is seeded from that durable copy, so a conversation
the host has never seen still opens with every completed turn. Once the turn ends,
opening again reports live false and the completed turn.

## Verification
Drive a turn against a paced model so the assistant has streamed a known prefix
of its reply and the turn is held open. Open the conversation: the turns end with
the operator's message and an assistant turn whose text is exactly the streamed
prefix; live is true; the cursor is greater than the cursor reported before the
turn began. Release the turn and open again: live is false and the assistant turn
is the whole reply, once. Separately, open a stored conversation on a host process
that has never served it: every completed turn is present and live is false.