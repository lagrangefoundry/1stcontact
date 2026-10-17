---
uid: bug-7ec95fe4
id: BUG-208
type: bug
title: 'Builder workers: briefed items skipped, steps run out before the self-check,
  and some end without reporting'
created_by: EPIC-19
created_at: '2026-10-17T13:58:30.805527+00:00'
updated_at: '2026-10-17T13:58:30.805527+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-afac729f
---

## Symptom

Charlie's plumbing - 3 (`biz_d3c65efa8c51891c3ae734a7cedbcba2`, 2026-10-04) ran 17 builder worker sessions (CHAT-3 to CHAT-19, sessions `worker-builder-1` to `worker-builder-17`). The consultant reported three distinct ways a builder failed to deliver what it was briefed. Each forced an extra builder run and an extra wait for the client:

1. **It ran out of steps before checking its own work** (first rough cut, CHAT-3, 19:33). The consultant: *"The builder ran out of steps before it could check its own work, so I looked at the page myself."*
2. **It ignored part of its brief** (home page fixes, CHAT-4 to CHAT-6, 20:38). The second run did the layout work but skipped the reviews, the contact form and the page title, saying *"the brief did not request"* them. They were items 6–8 of the brief. The consultant guessed that a long brief gets cut short before the builder reads it, and switched to shorter briefs.
3. **It ended without reporting** (applying the Workwear look, CHAT-15 to CHAT-17, 22:05). *"The builder that applied the look went quiet at the end without reporting."* Its last step had also left the contact form half-styled, which nobody was told about.

Charlie 2 saw the third failure four times (EPIC-24 notes).

## What to find out

Find the cause of each failure from the worker transcripts and tool records on those chat tickets, before fixing anything:

- **(2): is the brief delivered whole?** Compare the `Delegate` call's goal text, as the consultant wrote it, with the worker's first user turn. If they differ, find where it was cut. If they match, the worker dropped items it was given, and the fix is in how it works through a brief.
- **(1) and (3): which limit ended the worker,** whether the iteration cap, the wall-clock timeout or something else? Does it now get LF REQ-181's warnings and its "the budget is spent, report now" instruction? REQ-181 has landed upstream; check that this repo's installed framework and the builder role actually receive it.
- **(3): what does the consultant receive** when a worker ends without calling its report? It should be a distinct, stated outcome ("ended without reporting: <which limit>"), never silence, and never something that reads like success.

## Fix (to be confirmed by the findings)

- **A brief arrives whole**, or delegation refuses it with a clear error. It's never silently shortened.
- **A builder always gets to report.** When a budget runs out, the worker is told to stop and report what it did, what it didn't do and what it left half-done, before it's cut off.
- **A worker that still ends without a report** is reported to the consultant as exactly that, naming the limit that ended it.
- **The builder's step budget fits a self-check.** If a normal first page can't be built and checked within the budget, either raise the budget or change the builder's priming so it checks as it goes, not only at the end. The choice is recorded with the measurement behind it.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`, driving delegation with a scripted worker:

- A brief with many numbered items reaches the worker's first turn unchanged.
- A worker that hits its step budget receives the report instruction, and its report reaches the consultant.
- A worker that ends with no report produces a "no report" outcome naming the limit, not an empty success.