---
uid: bug-2bbf9450
id: BUG-221
type: bug
title: 'Plan stages: starting a later stage resets an unticked earlier one, and the
  panel then shows it as "skipped"'
created_by: xgd
created_at: '2026-10-18T00:29:54.871057+00:00'
updated_at: '2026-10-18T14:39:54.745719+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-97a3fe1f
  commits:
  - working_sha: 2b251d8cbd18220222321d267305156986d32264
    reconcile_sha: null
    main_sha: null
  - working_sha: 7e0e4d8080c33cb47aa3c1e6c43f37c160fe66f6
    reconcile_sha: null
    main_sha: null
  version: 0.2.529
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

## Root cause
Two choices that are each reasonable on their own combine badly:
1. `set_stage(B, in_progress)` reset whichever stage was in progress to `not_started` unless it had been ticked (`tools/generate/src/cli/ai/plan-core.ts`, `set_stage`). That loses the fact that the stage was started: afterwards "started, never ticked" is stored the same way as "never touched".
2. The panel works out "skipped" for any `not_started` stage before the furthest started or done one (`shownStates` in `apps/control-app/src/builder/plan-panel.js`, REQ-398). That inference is right for a stage that really was passed over, but step 1 hands it stages that were not.

## Fix (agreed)
- **Moving forward ticks the stage moved off.** When `set_stage(B, in_progress)` moves the marker off a stage A that comes **before** B in the stage order, A becomes `done`, not `not_started`. The result says so: `moved_from: A` plus `marked: "done"`, so the consultant can see it and set A back if that was wrong.
- **Moving backward is unchanged.** When A comes **after** B (reopening an earlier stage), A goes back to `not_started`, as before. The result carries `moved_from: A` and `marked: "not_started"`. A stage after the furthest one is never shown as skipped, so this is harmless.
- **A nudge in the per-turn plan entry.** When any stage before the furthest started or done one is still `not_started`, the plan entry names it: it shows to the client as skipped, and the consultant should tick it done if it was covered. This covers the cases auto-ticking cannot reach (jumping straight past a stage that was never started, or a stage reset by hand). Today the consultant gets no warning.
- **The panel is unchanged.** With the fix, "Skipped" appears only for a stage that was never started, which makes the label accurate. Changing the wording alone was rejected because it would hide a real skip.
- The `set_stage` tool description and the plan-surface overview are updated to say this.
- Plans already in the bad state cannot be told apart from real skips. Fix them one at a time with `set_stage(<stage>, done)`.

## Test plan
UATs in `tests/test_UAT_FC_BUG-221_*`, driven through the plan's `set_stage` operation and the per-turn plan entry:
- Repro: start stage 1, then start stage 2. Stage 1 is `done`, the result carries `moved_from` and `marked: "done"`, and the panel's `shownStates` shows no stage as skipped.
- Backward move: with a later stage in progress, starting an earlier one puts the later stage back to `not_started` (`marked: "not_started"`).
- Nudge: a stage before the furthest started one is `not_started`, so the plan entry names it as showing skipped. When nothing is passed over, the line is absent.
- Regression scope: the existing REQ-390 and REQ-398 stage UATs.