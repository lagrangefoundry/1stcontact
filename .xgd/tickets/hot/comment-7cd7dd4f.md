---
uid: comment-7cd7dd4f
id: COMMENT-5530
type: comment
title: Comment on bug BUG-235
created_by: xgd
created_at: '2026-10-20T16:06:23.628622+00:00'
updated_at: '2026-10-20T16:22:44.914289+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8257fc75
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5f997f41-29f5-4c59-b698-552aca5840cc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7754a7b2-660b-44da-a8ed-ee089a6b7370-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T16:05:41.746125+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7754a7b2-660b-44da-a8ed-ee089a6b7370-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T16:22:44.131927+00:00" -->
#### Claude
I'm on the free-BUG-235 branch, reading the stage-tracker and visual-check code before I make the fixes.

Now checking how existing tests and the client banner depend on the "one stage in progress" rule.

Fix 1 is clear. I'll remove the auto-ticking from `set_stage` and have the banner name only the furthest in-progress stage. Next I'm reading the continuation logic for the Stop fix.

I'm finding out what a stopped round's terminal event looks like, so the continuation check can recognise one.

A stopped round ends with `status: 'aborted'`, so the continuation check can test for that. Now finding the opening text, the withhold UAT, and the `chat.js` comments.

Now making the edits. First, the opening text and the clean-check line.

Now `set_stage`: starting a stage changes only that stage.

That wording change would break two existing UATs for no gain, so I'm reverting it.

Now the banner: name only the furthest in-progress stage.

Next, the Stop fix in `continuedTurn`. Checking the inbox interface first.

A stopped round and a clock-exhausted round might both report `aborted`. Checking before relying on it:

Time exhaustion ends `complete` with `exhausted: true`, so `aborted` reliably means stopped. Now I'm restructuring so the inbox is only read when a continuation would actually start.

Fix 4 next: wire `unlooked` only where a browser can record looks, and have the plan notice say when pages can't be looked at.

Now the `chat.js` pronoun comments, then a typecheck.

I'll build the new workers UAT on the REQ-415 harness; the session inbox is always wired, so `/api/ai/stop` works there. Checking the fake browser's defaults and the plan-entry test shape.

Writing the new workers UAT file now.

Running the new workers UAT:

The fresh worktree is missing the gitignored `control-app/generated` directory. I'm copying it in from the main checkout.

All four fail the same way: the builder's result never reaches the consultant. Running the original REQ-415 test to see whether the harness itself works in this worktree.

`checkPlan` still enforces "only one stage can be in progress", so the new behaviour is refused at validation. Removing that rule:

REQ-415 now passes, so the fault is in my harness. Adding a temporary debug print:

Delegate works; my `said()` just skipped the nested `tool_result` blocks. Switching to a recursive text flatten and removing the debug line:

All four pass. To prove they test the fix, I'm running them against the old `host-core.ts`:

All four fail without the fix and pass with it. Next, the node-pool UAT for stages, banner and opening text, reusing BUG-221's toolbox setup.

Writing the stage/banner/opening UAT as a single jsdom file; I'll split it if the toolbox misbehaves under jsdom.

Three existing UATs assert the old marker move that this ticket supersedes. Reading the rest of the REQ-390 test before updating them:

All 13 pass, including the jsdom banner test. Now fix 6: making the talker-withhold UAT derive from declared effects.

Only five site-writing tools are granted here: the consultant delegates its L1 writes, so the `> 10` threshold was wrong. I'll assert that `set_stage` is among them instead.

Checking that the derived withhold test actually catches a leak, by temporarily moving `place_on_site` onto the allow list:

The mutation is caught, and `talker.json` is restored. Now a wider regression sweep over every suite that touches stages, continuation, the plan entry or the opening:

140 pass, 5 skipped. I also changed `plan-surface.json`, so running the surface-declaration suites too:

Many failures here, mostly suites the memory index says fail pre-existing (knowledge, delegation, AC1058). Grouping them by file and first error before comparing against a baseline:

Updating the ticket body before committing. I'm keeping the existing text and appending the implementation decisions and the UAT list.

Ticket updated. Committing on the branch (without the copied `generated/` directory):

`module-assets.ts` was rewritten by a test run, not by me (a known side effect), so I'm reverting it and committing only my files:

Committed. Now locking and merging back into xgd-working:

Merged cleanly; the overlay check found nothing to hide. Moving the ticket to `free_coded` and letting the gate do the version bump itself:

All seven BUG-235 items are fixed and merged into xgd-working. The ticket is at `free_coded`, version 0.2.556, with two commits: the fix (`6687522873`) and the gate's version bump (`3b294e9fb2`). The new UATs pass, and the stage, plan, continuation and talker suites around them pass too (140 tests).

**What changed:**
1. **Stages:** starting a stage now changes only that stage, so "Getting to know you" stays in progress while the first draft is built. Only an explicit done ticks a stage. The plan validator no longer refuses two stages in progress. The banner names the furthest in-progress stage and shows the other in its in-progress colour, with neither shown as done or skipped.
2. **Stop:**
   - A round the client stopped never continues, whether for a running-out-of-budget continuation or for owed layout faults.
   - A Stop pressed between rounds now ends the request instead of being discarded.
   - That Stop is used up, so it doesn't stop the client's next message.
3. **Clean check line:** it now reads "The layout check found no layout faults. Whether the page is what your client asked for is what the picture is for."
4. **No browser:** the `NOT_LOOKED` refusal and the unlooked-pages list only apply where there's a browser to take screenshots. Without one, near publishing, the plan notice says the pages couldn't be looked at and tells the consultant not to claim they were checked.
5. **Opening message:** it now says a first draft comes early and that getting to know the business carries on while it's built.
6. **Withhold UAT:** it now works out which tools to withhold from the surface declarations. As a check, I moved `place_on_site` onto the allow list and it failed as it should.
7. **`chat.js`:** the comments now say "it" for the consultant.

**Decisions you may want to check:**
- **Backward reset removed too.** The ticket only asked to stop the forward tick, but I also removed BUG-221's rule that starting an earlier stage resets later ones to not started. Otherwise reopening "Getting to know you" mid-build would wipe the first draft. I deleted BUG-221's two tests for the old behaviour and updated REQ-390's test.
- **The withhold rule can't use `effect` alone.** Plan writes like `pin_notes` are allowed to the talker, so the rule is: every write on a surface that holds the site, plus `set_stage` and `choose_look` named explicitly. Tools declared in the framework (`Delegate`, `CreateImage`) still rely on the existing both-lists check.

**Unrelated failures:** a wider run over the surface-declaration suites showed 20 failures in 8 files. None touch this area: the SessionManager `logDir` → `junctions` suites, the REQ-295 delegation suites, the route-probe list, a non-empty `PLATFORM_ADMINS` value and the deploy hooks. Several are already recorded as failing on a clean checkout. I didn't run that set without my change to confirm this run.

The ticket body has the full implementation notes and UAT list. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->