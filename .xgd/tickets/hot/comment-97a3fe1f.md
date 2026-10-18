---
uid: comment-97a3fe1f
id: COMMENT-5480
type: comment
title: Comment on bug BUG-221
created_by: xgd
created_at: '2026-10-18T12:17:51.924343+00:00'
updated_at: '2026-10-18T14:40:14.702836+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2bbf9450
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b409b4ef-4beb-4e61-9703-5db9c6c75408",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="19aaabb6-c45d-451b-adc4-50fa5c9b3a63-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T12:17:29.670022+00:00" -->
#### You
Can you take a look at this? We designed it this way but in practice its a little odd. What are your suggestions on fixing it?

<!-- xgd-turn id="19aaabb6-c45d-451b-adc4-50fa5c9b3a63-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T12:20:03.408794+00:00" -->
#### Claude
Now the client panel side — where "skipped" comes from for stages.

The cause is two design choices from REQ-390 and REQ-398 that each make sense alone but go wrong together.

**Why stage 1 showed "skipped"**

1. **`set_stage` throws away the fact that a stage was started.** Starting a new stage moves the in-progress marker, and the old stage goes back to `not_started` unless it was ticked (`tools/generate/src/cli/ai/plan-core.ts:1867-1874`). After that, "started but never ticked" is stored the same way as "never touched".
2. **The panel guesses "skipped" from what is stored.** `shownStates` (`apps/control-app/src/builder/plan-panel.js:110`) labels any `not_started` stage that comes before the furthest started-or-done stage as `skipped`. It only sees `not_started`, so a stage that was started and left unticked comes out as "Skipped".

The panel isn't really the problem. It works from what `set_stage` left behind, and the label is right when a stage really was passed over (for example, the client declining to compare sites, REQ-401). The fault is in step 1, which loses information.

**What I suggest**

- **Main fix: moving forward ticks the earlier stage.** When `set_stage(B, in_progress)` moves the marker off a stage A that comes before B, mark A `done` instead of resetting it. As the ticket says, moving from intake to looking at other sites nearly always means intake is finished. The result would say so, e.g. `moved_from: "getting_to_know_you", marked: "done"`, so the consultant can see it and undo it if that was wrong. Moving backward, such as reopening "First draft" while "Refining" is in progress, keeps today's behaviour: the later stage goes back to `not_started`. That's harmless, because a stage after the furthest one is never shown as skipped. With this change, "skipped" only appears when a stage really was never started.
- **Backup: a nudge in the per-turn plan entry.** If a stage before the current one is still `not_started`, add a line next to the existing "stages are behind the build" check, for example: *"Getting to know you was passed over and shows to the client as skipped. Tick it done if it was covered."* This covers the cases auto-tick can't: jumping straight past a stage that was never started, or the consultant resetting one by hand. Today the consultant gets no warning at all.
- **Don't change the wording to "Not marked done" on its own.** It would hide the problem rather than fix it, and it would mislabel stages that really were skipped. With the first fix in place, "Skipped" is accurate again.
- **Text to update to match:** the `set_stage` description and overview in `plan-surface.json`, and the doc comment on the `set_stage` handler.

**Scope:** auto-tick plus the nudge is a small change in `plan-core.ts` and `plan-surface.json`. Tests would cover the original repro (stage 1 ends up `done`, so the panel no longer says skipped), moving backward still resetting, and the nudge appearing when a stage was passed over. Nothing is needed in the panel. Plans already stuck in this state can't be told apart from real skips. For this client, the consultant can just call `set_stage(getting_to_know_you, done)`.

If you agree, I'll write this into the BUG-221 body (keeping what's there) and start coding. Or tell me if you'd rather the forward move ask first instead of ticking automatically.

<!-- xgd-turn id="70917e82-2482-4e51-bf7e-459685c1a4bc-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T14:36:48.194211+00:00" -->
#### You
Agreed

<!-- xgd-turn id="70917e82-2482-4e51-bf7e-459685c1a4bc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T14:40:13.871168+00:00" -->
#### Claude
Updating the ticket body with the agreed design, then cutting the branch.

Now the code changes.

I'll import `shownStates` dynamically in the test so a failed import shows up as a test failure.

Passing. Next I'm widening the run to every suite that touches `set_stage`, `moved_from` or the plan entry, plus lint.

Those assertions use `toContain`, so the new line doesn't break them. The typecheck errors are in unrelated files I didn't change. Trying the workers suites:

Done. Starting a later stage now ticks the stage the consultant leaves as done, so the panel no longer shows it as "skipped". The fix is merged into `xgd-working` and BUG-221 is at `free_coded`.

**What changed**
- **Moving forward:** `set_stage(B, in_progress)` marks the stage being left `done` when it comes before B. The result says so, e.g. `moved_from: "getting_to_know_you", marked: "done"`, so the consultant can undo it if that was wrong.
- **Moving backward:** reopening an earlier stage puts the later one back to `not_started`, as before. The result shows `marked: "not_started"`.
- **The nudge:** if a stage before the furthest one is still `not_started`, the per-turn plan entry now says: *Passed over: "Looking at other sites" (other_sites) — the client sees it as skipped. If it was covered, tick it done with set_stage.* It uses the same rule as the panel, so the consultant is told exactly what the client sees.
- **Panel unchanged:** "Skipped" now only appears when a stage really was never started.
- The `set_stage` tool description and the plan overview in `plan-surface.json` now describe this behaviour.

**Tests**
- The three new tests in `tests/test_UAT_FC_BUG-221_stage_moved_off_is_ticked.test.ts` pass. They cover the original repro, the backward move, and the nudge appearing and then going away once the stage is ticked.
- Ten existing suites that use stages or the plan entry (68 tests, including REQ-390 and REQ-398) all pass.
- **Not run:** three workers-pool suites (REQ-379, REQ-390 wire, REQ-356). They can't load in a fresh worktree because generated control-app files are missing, so they never reached this code. I read their assertions and they use `toContain`, so the extra line shouldn't break them, but that's unconfirmed.

The ticket body now has the root cause, the agreed design and the test plan, and the original report is kept. It has two commits: the fix (`2b251d8c`) and the version bump to 0.2.529 that the free-coded step added.

For the client who already saw "skipped": plans in that state can't be told apart from real skips, so the consultant needs to call `set_stage(getting_to_know_you, done)` once.

Moving the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->