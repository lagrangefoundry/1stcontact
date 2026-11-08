---
uid: acceptance_criterion-9e2805c3
id: AC-2368
type: acceptance_criterion
title: A pane opened on a site whose conversation has earlier, closed turns shows
  an idle composer, and a message typed there is sent and answered rather than queued
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T03:04:06.266866+00:00'
updated_at: '2026-11-08T03:04:06.266866+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

A pane opened on a site whose conversation has earlier turns, all of them closed, shows
an idle composer, and a message typed there is sent and answered rather than queued.

- **Idle, not streaming.** The composer shows its Send control, not the Stop button or
  any other live-turn control, although no turn was started from the pane.
- **Sent, not queued.** A message typed and submitted there is sent to that conversation
  as a new turn and its reply arrives in the message list. It is not held as a pending
  message behind a turn that is not running.
- **The gate still holds for a real turn.** A pane handed a conversation with a turn
  genuinely in progress still shows the live-turn controls, and a message typed during
  it is queued rather than sent as a second concurrent turn.

## Verification

Mount the pane, with the real chat component, on a conversation reported not live whose
transcript holds at least one completed exchange. Confirm the composer is not in its
streaming state. Type a message and submit it; confirm the transport is asked to run a
turn with that text and that the reply is painted. Then mount it on a conversation
reported live with a rejoin in progress; confirm the composer is in its streaming state
and that a message typed there does not reach the transport.
