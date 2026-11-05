---
uid: comment-6f41554b
id: COMMENT-5757
type: comment
title: Comment on bug BUG-296
created_by: xgd
created_at: '2026-10-26T15:41:42.073570+00:00'
updated_at: '2026-10-26T16:00:06.236711+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4e460631
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "30a204ee-1f36-4c0f-88df-81389d9b5dd2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2626e91a-2e31-413c-b3f4-908bc9fdcd59-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T15:40:18.065489+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2626e91a-2e31-413c-b3f4-908bc9fdcd59-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T16:00:04.965393+00:00" -->
#### Claude
Now let me find the scope-hold code.

Reading how an interrupted turn stops its builders, to see why the lease outlives it.

Doing forensics on the dev junction log for the real incident.

The client pressed Stop at 03:22:43; the consultant round ended `aborted` straight away while its `Delegate` call never returned. Checking what the stop did to the builder.

Updating the ticket with diagnosis and fix, then cutting the branch.

Reading the existing REQ-397 workers UAT to reuse its harness.

Writing the UAT first, aiming to see it fail against the current code.

Switching the stop case to the REQ-416 setup: the router with a talker recognised by its reminder. The Stop waits until a talker round has run beside the builder.

No talker round was cued. Checking what triggers the BUG-240 talker cue.

Using `/api/ai/interpose` mid-build to open the talker round, as REQ-416 does.

Still no talker. REQ-416 goes through `route(...)` with an execution context rather than `worker.fetch`; switching to that.

Debugging which requests reach the double.

The `Delegate` returned while the builder was still hung. Checking what outcome it reported.

The step can't be async (`ModelStep` returns events synchronously). Moving the hang into a wrapper around `create`, the way BUG-235 does it.

RED reproduces the field bug: the turn has ended and the stuck builder still holds `site.json`, `work.json` and the rest. Implementing the fix in `host-core.ts`.

GREEN. Now the refusal wording. Checking what existing tests pin in that sentence before changing it.

The `scope_held` sentence would now read awkwardly ("…released at 03:26 UTC, started by consultant turn …"). Checking what REQ-458 pins before rewording it.

Keeping the pinned `held` phrase as it is. The release time becomes its own field on the refusal, and each sentence places it where it reads naturally.

Now the `scope_held` sentence in `lease-core.ts`.

Both pass. Running typecheck, lint, and the lease and delegation regression suites.

Typecheck is clean; the repo has no lint script. Running the regression scope.

Wrong directory; rerunning from the worktree root.

Five failures. Taking a baseline of these three files on the unchanged code before blaming the diff.

The same five fail on the unchanged code, so they were red before this change. Checking that REQ-458 fails for the same reason both times, so my change isn't hiding a new failure inside it.

Identical failures. Now the node-side lease suites.

All green. Checking the version-bump convention for this repo before committing.

Committing the work, then following the merge-back recipe.

Syncing the ticket body to the final wording and tests, then cleaning up the branch.

BUG-296 is fixed and merged into `xgd-working`. The ticket is at `free_coded` with commits `dbdb431a` (fix + UAT) and `3b1fe887` (version 0.2.669).

**What went wrong.** I traced it in the dev D1 database and the session's event log:
- At 03:21:51 a consultant turn sent the page split to a builder, and the builder took its files (`site.json`, `work.json`, `shop.json` and the rest).
- A talker round then opened and closed beside the build. After that, a Stop on the consultant no longer reaches the builder. That's a known gap in lagrange-framework, which treats the talker round as the open turn.
- At 03:22:43 the client pressed Stop. The consultant turn ended `aborted` straight away, with its `Delegate` call still waiting on the builder, which was mid-request.
- The only thing that released the builder's files was the framework's cleanup at the end of the delegation, and that never ran. The files stayed held until the 5-minute idle timeout ran out at 03:27:37. That is why the two `Delegate` calls and the `set_design` were refused.
- The refusal said "since 03:21 (N min)", which is when the hold was taken. A stale hold and a live one read the same.

**The fix:**
1. **A consultant turn's builders now end with it.** When a turn finishes, however it finishes, the host stops each builder that turn started and releases its files. If the delegation already finished normally, this does nothing. The change is in `host-core.ts`.
2. **Refusals now say when an idle hold lapses.** A refused write reads "…; nothing was written. It is free again when that work finishes, or at 03:26 UTC if it does nothing more." `scope_held` carries the same time. That time stays fixed for a stale hold and keeps moving for a working build. The start of the sentence ("is held by … since … (N min), started by consultant turn …") is unchanged because existing UATs check it.

**Tests:** `tests/test_UAT_FC_BUG-296_interrupted_delegation_releases_scope.workers.test.ts`
- The first test re-creates the field case: a stuck builder, a talker round opened by a message mid-build, then Stop. It checks that no file is still held and that the next `Delegate` on the same files starts. It failed before the fix, with all the builder's files still held.
- The second test checks the exact new refusal wording, both directly and through a real `scope_held`.

**Regression runs:**
- REQ-397, REQ-406, REQ-410, REQ-411, BUG-254 and BUG-235 pass.
- Five tests in REQ-458 (1), REQ-416 (3) and REQ-436 (1) fail. They fail the same way on the code before my change, so they were already broken.
- Typecheck is clean. The repo has no lint script, so lint wasn't run.

**Still open:** the framework gap itself (a Stop not reaching a builder after a talker round) is lagrange-framework code, so it needs a ticket in that repo. I haven't filed one; say if you want it. The half-built `work` and `shop` pages from the incident are still on the Ariel site. Now that the hold has lapsed, the consultant can delegate their removal.

<!-- xgd-chat-end -->