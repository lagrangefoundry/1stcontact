---
uid: bug-2bbf9450
id: BUG-221
type: bug
title: 'Plan stages: starting a later stage resets an unticked earlier one, and the
  panel then shows it as "skipped"'
created_by: xgd
created_at: '2026-10-18T00:29:54.871057+00:00'
updated_at: '2026-10-18T00:29:54.871057+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-97a3fe1f
---

## What happened
The consultant called `set_stage(getting_to_know_you, in_progress)` at the start of intake. Later it called `set_stage(other_sites, in_progress)` without first ticking `getting_to_know_you` as `done`. As documented, `set_stage` put the earlier stage back to `not_started` (the result said `"moved_from": "getting_to_know_you"`). The following stages were then ticked `done` in order.

On the client's plan panel, stage 1 then showed as **"skipped"**. The client, who had answered every intake question, asked: "Why does step 1 say skipped? I answered all your questions?"

## Expected
One of:
- **Auto-complete:** when a later stage starts and the stage being moved off was `in_progress`, mark it `done` (or ask), rather than resetting it to `not_started`. Moving from intake to comps nearly always means intake is finished.
- **Neutral wording:** the panel shouldn't call a stage "skipped" when it was started and simply never ticked. "Not marked done" is accurate, whereas "skipped" sounds like the work was missed.
- **A nudge in the per-turn plan entry:** when a stage before the current one is `not_started`, tell the consultant (as it does for "stages are behind the build").

## Impact
It's a trust problem with the client: the progress bar contradicts what actually happened and suggests the consultant cut corners. The consultant has no warning that this happened until the client spots it.

## Repro
1. `set_stage(getting_to_know_you, in_progress)`
2. `set_stage(other_sites, in_progress)`, without ticking step 1
3. `set_stage(other_sites, done)`, then start and finish later stages
4. Look at the client's panel: stage 1 shows "skipped".