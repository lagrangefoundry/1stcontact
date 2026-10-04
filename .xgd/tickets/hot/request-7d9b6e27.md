---
uid: request-7d9b6e27
id: REQ-386
type: request
title: Tell the user before any long-running operation, with a rough duration (1 min
  / 5 min / 30 min)
created_by: xgd
created_at: '2026-10-04T18:30:59.347301+00:00'
updated_at: '2026-10-04T18:30:59.347301+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What we were trying to do
During a consultation, the consultant agent made several `capture_site` calls back to back in one turn. Two of them timed out and were retried. The turn lasted about 20 minutes, and the user saw nothing: no message saying work had started, nothing about what was happening, and no idea how long it would take.

## What stopped us
- As far as the agent can tell, the user only sees the agent's final reply. Text written before or between tool calls in the same turn does not seem to reach them, so the agent cannot say "starting now, about 5 minutes" partway through a turn.
- `Delegate` has a `note` parameter that is shown to the user straight away. `capture_site` and other slow operations (`screenshot`, `compare`, `check_fidelity`, `CreateImage`, `EditImage`) have nothing like it.
- The agent's guidance says to announce work before going away, but only for delegation and before a turn ends. It does not set a threshold or ask for a duration estimate.

## What would close the gap
The product owner's requirement: **if the agent will be busy for more than about 20 seconds, the user must be told first, with an order-of-magnitude estimate: about 1 minute, about 5 minutes, or about 30 minutes.**

Suggestions, not requirements:
1. A user-visible `note` (as on `Delegate`) on every operation that can take more than a few seconds, shown the moment the call starts.
2. Or a general "status line" tool the agent can call mid-turn, shown to the user straight away.
3. Progress for retries: "site X timed out, retrying (2 of 3)".
4. Add the 20-second rule and the 1/5/30-minute estimate to the per-turn guidance, so the agent applies it consistently.