---
uid: acceptance_criterion-40708b96
id: AC-2587
type: acceptance_criterion
title: Where there is no ticket store (the 1c command line) no ticket surface is offered
  and the session works normally
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:31:44.653250+00:00'
updated_at: '2026-11-09T23:39:41.128207+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
Where the host has no ticket store — the operator's command line (`1c`) — the
consultant is offered **no** ticket surface: no ticket-read or ticket-write
operation appears among its tools or in its tool guide. This is an ordinary
state, not a failure: the session opens, replays its transcript and takes turns
that edit the site exactly as it would otherwise. On the deployed host, which
always has a ticket store (it is where the transcript lives), the surface is
always composed, independent of whether a knowledge base, an image credential, a
renderer or a catalogue is present.

## Verification
Build the command-line host's session and list the tools it offers: none is a
ticket-surface tool, and opening the conversation and taking a turn succeed.
Build the Worker host with no knowledge base, no image surface, no renderer and
no catalogue: the ticket read tools are still offered.