---
uid: request-77b12a80
id: REQ-379
type: request
title: 'Plan panel and consultant cadence: progress counter, announce before going
  quiet, milestones that fall due'
created_by: EPIC-19
created_at: '2026-10-04T01:19:03.873246+00:00'
updated_at: '2026-10-04T01:19:03.873246+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-eb212a9a
---

## What changes

The consultant **keeps the client oriented**: before going quiet, while quiet, and at the milestones of a build. The panel shows at a glance how much is left for the client to fill in. These are made reliable by the host acting on the plan and on what the consultant is doing, not by priming alone.

## Why

Charlie's Plumbing 2 (EPIC-19 Finding 18) had consultant turns of 17, 28 and 10 minutes, and **none** said beforehand that the consultant was going away, for how long, or that the panel needed the client in the meantime. The client was pointed at the panel once, at the start. The plan's process layer never moved: `phase` stayed at `intake`, `functionality` stayed empty, and none of the 8 milestone questions (`checks`) was ever asked. A priming rule for the announcement (`plan-panel` entry, "Before you go away to work, say in one line…") was added after that run, at 61fcee5863. This ticket makes the behaviour hold even when the model forgets, which Finding 13 and Finding 18 both show it does.

## Requirements

1. **A progress line at the top of the plan panel** (operator request), directly under its "Getting to know your business" heading. It counts the open asks: **"3 questions still to answer"**, and when none are open, **"All done — thanks, that's everything I need for now."** Withdrawn and skipped asks don't count. It updates as soon as an ask is answered, and when the consultant adds a new one.
2. **Announce before going quiet.** When the consultant starts a builder session (`Delegate`) in a turn that hasn't yet told the client it's going away, the client sees a status line in the chat straight away, before the work runs, not when the turn ends. It says what's being built and roughly how long it takes. The `Delegate` call carries a required short note for the client, so the consultant supplies the words and the host guarantees they're shown.
3. **Point to the panel while quiet.** If asks are open when that status line is shown, it adds **"Meanwhile, N questions above need you"**, using the same count as requirement 1.
4. **Milestones fall due as facts.** The host marks a milestone question as due when its trigger can be detected mechanically: the first builder session that completes a page (`first_pass_complete`), a revision round counted since then (`revision_round_finished`), and Publish being opened (`before_publish`). The due milestone appears in the consultant's per-turn digest as a fact ("Due: ask whether the layout is right"), and an asked or answered milestone records its answer in the plan's `checks`.
5. **A stale phase is flagged.** The panel shows the plan's `phase`. When the build has visibly moved past it (pages built while `phase` is still `intake`), the consultant's digest says so, so the consultant moves the phase on.
6. **Features are captured first.** A new plan starts with one multi-select ask, "Which of these does your site need?", drawn from the feature catalogue. That gives the plan's `functionality` list content, so "are we done?" has something to be measured against.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- The panel shows "N questions still to answer" with N = open asks, and the all-done message at zero; answering an ask updates it.
- A `Delegate` call in a turn shows the client its status line before the session completes, and includes the panel count when asks are open.
- A completed first-page builder session makes `layout_happy` due in the next turn's digest.
- A plan at `intake` with built pages yields a stale-phase line in the digest.
- A new plan carries the features ask.