---
uid: acceptance_criterion-5909b740
id: AC-2092
type: acceptance_criterion
title: A pane loaded during a live turn shows what has been said so far as one assistant
  message that continues to grow until the turn ends, with no user message added
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T03:06:11.773272+00:00'
updated_at: '2026-11-01T03:06:11.773272+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

When the pane is opened, or the workspace reloaded, while the conversation reports a
turn still in progress, the reply being written is shown as ONE assistant message that
keeps growing until the turn ends. It is never shown as a finished message that stopped
mid-sentence with the rest arriving in a second message.

- What the assistant had already said when the page loaded is the start of that
  message, and the rest of the reply is added to the same message as it arrives, with
  each piece of text appearing exactly once.
- A turn in progress with nothing said yet still rejoins: the message starts empty and
  the whole reply arrives in it.
- Rejoining adds no user message. The operator's message for that turn appears once,
  from the transcript, and the earlier turns are shown as finished messages as usual.
- What the assistant does during the rest of the turn is shown in the pane just as it is
  for a turn sent from the pane, and the composer behaves as it does during any turn
  until the rejoined turn ends.
- Rejoining never holds the pane. While a rejoined turn is still running the operator can
  switch to another site and the pane changes to that site's conversation at once, without
  waiting for the turn to finish.

## Verification

Open the pane on a conversation reported as live whose transcript ends with a user
message and a partial assistant reply, with a rejoin stream that delivers the remaining
text and then ends. Confirm the pane holds exactly one user message for that turn and
exactly one assistant message for the reply, and that the assistant message's text is
the partial reply followed by the streamed remainder, with no repetition. Repeat with a
live conversation whose transcript ends at the user message and confirm the single
assistant message contains only the streamed text. With a rejoin stream that never ends,
hand the pane a different conversation and confirm it switches immediately.
