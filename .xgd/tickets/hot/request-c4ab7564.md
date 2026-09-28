---
uid: request-c4ab7564
id: REQ-346
type: request
title: Both workers are visible while they work, and only one is worth interrupting
created_by: EPIC-19
created_at: '2026-09-28T19:44:33.285161+00:00'
updated_at: '2026-09-28T20:36:54.212156+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Parent: [[EPIC-19]] (Finding 14.10). Design: [[DOC-61]] §F4, item 6.
**Blocked on** LF REQ-181 for its denominator — the progress figure is meaningless without
a published budget.

## What changes

While a turn is running, the client can see that something is happening, roughly how far
through it is, and **what** it is doing — and there is one obvious way to stop it.

## Why this is mostly a consumer

The events already flow. `toolIssueEvent` (LF REQ-175) is emitted **before** a call runs —
that was its point, so that a turn interrupted during a call is distinguishable from one
interrupted just before it — and `toolEvent` closes it, both as control-class events on the
API path. Nothing in this repository consumes either.

So this ticket is a surface, not a mechanism: the **denominator** comes from LF REQ-181's
meter, the **label** from the session's own milestone posts rather than a spinner, and the
**tick** from events that are already on the junction.

## Scope

- A progress surface driven by `toolIssueEvent` / `toolEvent`, with LF REQ-181's budget as
  the denominator. No new events.
- **An activity indicator for each worker**, so the client can see there are two — the
  expensive one that thinks and the cheap one that answers.
- **Interrupt meaningful only for the expensive one.** A one-second turn's indicator
  flickers and interrupting it saves nothing; offering the control there teaches the client
  that the control does nothing.
- The expensive worker's indicator carries **what** she is doing, sourced from her own
  milestone posts. A milestone is a write to task state, so the label and the plan agree
  without a second surface.

**Out of scope:** the cheap model's ability to stop the expensive one on request (fires on
an imperative, offers a card otherwise) — that belongs with the room work, not with the
chrome. And no change to what is recorded: these are control-class events and stay so.

## Test plan

- A turn running tool calls moves the indicator, and the figure it shows is the same budget
  LF REQ-181 published — not a locally invented count.
- The label names the current activity when a milestone has been posted, and degrades to a
  neutral state rather than a stale one when none has.
- Both workers are visible when both are working.
- The interrupt control is present for the expensive worker and absent for the cheap one.
- A turn that ends at its cap leaves the indicator in a terminal state that reads as
  *stopped*, not as *still working* — the silent-truncation symptom must not survive as a
  stuck progress bar.


## Experience design

This delivers **§5 — *what the client sees*: activity for both workers, and the one control that means something** of [[DOC-62]] — *Building a site with two AIs: the client, the
consultant and the interrogator*. [[DOC-61]] is the mechanism half and scopes this
ticket; DOC-62 is why it matters and what the session is supposed to feel like on both
sides. A UAT here should be readable as a claim about that experience.
