---
uid: acceptance_criterion-f46b665b
id: AC-2111
type: acceptance_criterion
title: 'The ledger is maintained on a stated trigger: one entry per decision as it
  is settled, and the engagement renamed once the business is known'
created_by: xgd
created_at: '2026-11-01T09:27:33.793660+00:00'
updated_at: '2026-11-01T09:51:03.428838+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

What the consultant is told about the ledger, in the tool guide it is primed with and in the operations' own entries, states **when** it is written — at decision points, not on a clock or a size threshold:

- a decision is recorded when it is **settled** — when the client agrees to it, or when the consultant makes it and would defend it — not when it is raised;
- one call is one decision, written while it is fresh, never batched at the end of a session;
- the rejected alternatives are recorded beside the choice, so a later session does not re-propose what was ruled out;
- the engagement is renamed as soon as the business is known, leading with the business, its trade and its place.

The guidance also says what the ledger is for: it is how the next session about this site knows what was decided, and it is written for someone searching — naming the business, trade, town, audience and colours in the client's words.

## Verification

Read what a deployed-runtime consultant session is offered for the ledger surface (the summary guide and the full entries `DescribeTools` returns). The record-a-decision entry states that it is called when something is settled rather than raised, one decision per call, and that rejected alternatives are recorded; the name-the-engagement entry states that it is called once the business is known. Nothing in the ledger's guidance names a turn count, a time interval or a character threshold as the trigger.