---
uid: bug-1535e1ef
id: BUG-357
type: bug
title: 'Builder chat: the upload outline sticks after a drag, and refused hand-offs
  show as stopped builds'
created_by: EPIC-19
created_at: '2026-11-05T19:31:52.567211+00:00'
updated_at: '2026-11-05T21:29:30.664258+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: medium
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-af9b2d35
  commits:
  - working_sha: 202d619cdaa1955f45cf4adf0a96ff043c7616f5
    reconcile_sha: null
    main_sha: null
  version: 0.2.787
---

## Symptom (operator, 2026-11-05, a live builder session)

1. **The upload outline gets stuck.** The blue dotted "drop files here" outline stayed on the conversation after a drag. The operator could only clear it by dropping a file and then removing the chip.
2. **"_Stopped before the build was finished (under a minute)._" appears after builds that didn't stop.** It showed up twice after nearly every build in the session, although every build finished and the site is fine.

## Cause

1. **`attachments.js` `watch()`** adds `is-dropping` on `dragover`, but only removes it on `dragleave` when `ev.target === target`, the conversation element itself. A drag that leaves through a child element (the message list, the composer), leaves the browser window, or is cancelled with Esc never fires a `dragleave` whose target is the conversation. Nothing else clears the class. Only `drop` clears it, which is why dropping a file was the only way out.
2. **`cadence-core.ts` `roundSummary()`** counts every Delegate call in a round as a hand-off. That includes calls the host refused before anything ran: `unsettled_check` ("nothing was delegated and nothing ran"), followed by the consultant rewording its checks and calling again. A round whose hand-offs are all refusals has nothing returned, so it ends with `STOPPED_ALL`. In the session, each real build was preceded by one or two refused calls, and each produced its own "Stopped before the build was finished" line.

## Fix

1. **The outline goes away whenever the drag is over:**
   - the pointer leaves the conversation, through any child or out of the window;
   - the drag is cancelled with Esc;
   - files are dropped anywhere, inside or outside the conversation.

   Track leaving by where the pointer went (`relatedTarget` outside the conversation, or null), not by which element fired the event. Also clear on the window's `drop` and `dragend`, so no path leaves it on.
2. **A Delegate call the host refused before anything ran is not a hand-off.** It adds nothing to the round's summary and produces no chat line. "Stopped before the build was finished" is said only when a hand-off actually started and didn't come back. The consultant still sees the refusal as now; only the client-facing line changes.

   - **Which calls count as refused before anything ran:** a Delegate output of `Error: Delegate failed (<code>).` with any code except `worker_failed`. Every coded refusal (the host's `unsettled_check`, `plan_first`, `brief_too_long`, `decision_first`, `logo_sized`, `spend_ceiling`, `turn_closing`, `idle_builds`, and the framework's `scope_held`, `unknown_role`, `no_nesting`, …) is raised before a builder is opened. `worker_failed`, an uncoded failure, a timeout or an interruption may come after a run, so they still count as a hand-off that didn't come back.
   - **A refusal's output can be content blocks, not a string.** The host appends a playbook section to some refusals, so the output is an array whose first text block holds the `Error:` line. Failure detection reads that first text block. Before this, such an output was not seen as a failure at all, and a refused call was summed up as a *finished* build ("Built your home page first draft").

## Not in scope

- The consultant's checks being refused as `unsettled_check` on its first try, several times in one session. That costs a round-trip each time, but the client doesn't see it once this fix lands.

## Test plan

- UAT (builder in a browser): drag files over the conversation, then out through the composer, and the outline goes. Drag over, then dispatch `dragend` or Esc, and it goes. Drop outside the conversation, and it goes. Drop on it, and the file is attached and the outline goes.
- UAT (scripted consultant): in a round where Delegate is refused with `unsettled_check` and then accepted and returns, the chat shows only the finished build's line, with no "Stopped before the build was finished". In a round where only refusals happen, no build line appears. A started hand-off that doesn't return still says "Stopped before the build was finished".

## Supersedes

- REQ-459's UAT `test_UAT_FC_REQ-459_a_hand_off_that_did_not_come_back_is_summed_up_as_stopped` (in `tests/test_UAT_FC_REQ-459_one_progress_story.workers.test.ts`) is removed. Its premise was a Delegate refused for its plan (`plan_first`) being summed up as "Stopped before the build was finished", which this ticket reverses. It was already red on xgd-working (the content-block refusal was read as a finished build). Its replacements are the BUG-357 UATs below.

## What landed

- `apps/control-app/src/builder/attachments.js` `watch()`: leave is judged by `relatedTarget` (outside the conversation, or null). Capture listeners on the window for `drop` and `dragend` clear the outline and are removed by the returned unwatch.
- `tools/generate/src/cli/ai/cadence-core.ts`: new exported `refusedBeforeRun(output)`. In `keepClientOriented`, a refused Delegate's activity removes its pending hand-off from the round (and doesn't mark another hand-off as returned or failed). `failed()` reads the first text block of a content-block output.

## UATs

- `tests/test_UAT_FC_BUG-357_upload_outline_goes_when_the_drag_ends.test.ts` (jsdom, real chat pane + tray): moving between children keeps the outline; leaving through the composer, leaving with no `relatedTarget` (out of the window / Esc), and the window's `dragend` clear it; a drop outside clears it and attaches nothing; a drop on it attaches the file and clears it.
- `tests/test_UAT_FC_BUG-357_refused_delegate_is_no_hand_off.workers.test.ts` (real routes, scripted consultant): refused `unsettled_check` then accepted shows only the finished build's line; a round of only `unsettled_check` refusals has no build line; a round refused for its plan (`plan_first`) has no build line. The consultant still receives the refusal.
- `tests/test_UAT_FC_BUG-357_started_hand_off_still_says_stopped.test.ts` (the host's `keepClientOriented` over a stub provider stream, because every `worker_failed` misconfiguration is refused at start-up): a hand-off that failed with `worker_failed` still says "Stopped before the build was finished" exactly once, even beside a refused call; refusals alone (as content blocks) say nothing of a build.