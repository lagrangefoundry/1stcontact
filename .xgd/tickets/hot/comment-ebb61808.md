---
uid: comment-ebb61808
id: COMMENT-6942
type: comment
title: Comment on bug BUG-332
created_by: xgd
created_at: '2026-11-03T00:07:36.691630+00:00'
updated_at: '2026-11-03T00:29:09.692468+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ea94558a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "86348372-c8dd-4a15-85b3-1f3026864b34",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1dce5da4-21e5-45cb-9ff7-f5ff0323d939-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:05:58.240393+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="1dce5da4-21e5-45cb-9ff7-f5ff0323d939-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:29:05.721820+00:00" -->
#### Claude
Reading the ticket and finding where builder claims and the durable turn runner live.

Reading the job-step code in `host-core.ts` to find where a retried step resumes.

Checking how the framework calls the `claim` hook (any timeout on it) before writing the wait.

BUG-105 is in the installed framework copy. Checking whether the built worker bundle has it too, then I'll write the code.

Production deploy (21:09Z) predates the framework install that carries BUG-105 (21:24Z); today's built bundle has it. Now starting the free-coding flow: status, branch.

REQ-634's session holds the xgd-working lock and is editing there right now (router.ts and others), so I can't work on xgd-working. Trying a plain git worktree as the fallback.

The failed `branch cut` left the `free-BUG-332` branch behind (an ancestor of xgd-working) but no worktree. Attaching a worktree to it.

Setting up the worktree so the suites can run (dependencies linked from the main checkout, generated artifacts copied).

Writing the code in the worktree. First the host side: track every running builder (not only ones with a known turn), and release dead builders' holds when a step is retried.

`roundOfJob` doesn't receive the step number; adding it.

Now the claim side in `lease-core.ts`: a hold by a builder not running here, lapsing within a bound, is waited for instead of refused.

Now the UATs. Checking test helpers' signatures first.

Writing the UAT file (three tests from the ticket's test plan).

Running the new UATs.

All three pass. A logged "uncaught exception" for the step kill needs a look before I trust it.

The live-claim UAT catches it. Now the regression scope: the lease, delegation and durable-job suites, plus a typecheck.

Checking whether that REQ-458 failure was already there before my change (by running it with my patch removed).

That REQ-458 failure is pre-existing: it fails the same way without my patch. Running the typecheck and lint.

Typecheck clean. Committing on the branch.

Updating the ticket body. I'm keeping the existing sections and adding what changed, what was decided, and where fix 3 stands.

The first `sed` errored, so the original sections may have been dropped. Checking the ticket body.

Ticket body restored: original Symptom/Root cause/Fix sections, plus What changed, Design decisions and Test plan. Now trying to merge back.

REQ-634 still holds the lock and is still working. I'll wait a bounded time for it to release.

Lock released. Taking it, then merging xgd-working into the branch first so the version bump lands at the tip.

BUG-329's session took the lock first. Merging xgd-working into my own branch doesn't need the lock, and that's done. Waiting again, and this time taking the lock the moment it frees.

Lock held. Bumping the version on the branch after merging the latest xgd-working into it again.

Version 0.2.740 is unclaimed. Fast-forwarding xgd-working using the sparse-safe merge script.

xgd-working moved on again, and the script isn't at that path. Re-merging into the branch, then fast-forwarding by hand with sparse checkout off for that one command.

Landed on xgd-working. Running the overlay check, then the `free_coded` gate.

Clean up: release the lock and remove the branch/worktree (bare command, per the protocol).

Saving the `$TMPDIR` collision lesson so it isn't repeated.

BUG-332 is fixed and merged into xgd-working, and the ticket is at `free_coded` (commits `023ef9d6` and `3a42bf94`, version 0.2.740, 3 story points). I didn't have any questions that needed answering first.

**What changed**
1. **A retried step releases dead builders' holds** (`releaseDeadBuilders` in `host-core.ts`). When a step is retried, any builder hold on the site whose builder isn't running in this process is released before the round runs, so its `Delegate` for the same pages can start. A builder still running here is left alone. This needs no timing heuristic: the runner only retries a step after the previous attempt has ended, which is the same fact the existing turn-claim release already relies on.
2. **A blocked hand-off waits instead of failing** (`lease-core.ts`). If a file is held by a builder that isn't running here and the hold lapses within 3 minutes, the `Delegate` waits for it with its progress note still showing, then starts. A hold by a builder running in the same turn, or one that is still being renewed, is still refused straight away, so the immediate-refusal behaviour the REQ-397, REQ-410, BUG-296 and REQ-458 tests check is unchanged.
3. **The refusal no longer says "Wait for that"**, since the consultant can't wait. It now tells the consultant to give the builder files nobody holds, or to tell the client plainly what hasn't started, why, and what happens next, and not to end its turn as though the work were under way. I didn't add a host check that stops the turn ending `complete`, because that would be a new gate (DOC-82).

**Fix 3 (memory) is only partly done**
- The framework copy installed locally (21:24Z) and today's built bundle both include framework BUG-105. The production deploy at 21:09Z came before that install, so the incident most likely ran without it; the next deploy will include it.
- I couldn't record peak memory per step. Workers don't let code read its own memory use, so Workers Logs' `exceededMemory` is the only signal. REQ-627 (each builder pass as its own step) is still the structural fix.

**Tests**
- The three UATs from the ticket's test plan pass, in `tests/test_UAT_FC_BUG-332_retried_step_hands_off_again.workers.test.ts`.
- Without the fix, the retry and blocked-hand-off tests fail. The live-claim test passes either way, as it should, since the old code never took any hold; it does fail if the release ignores whether the builder is still running.
- The related suites (BUG-296, REQ-624, REQ-397, REQ-406, REQ-410, REQ-411, REQ-458) pass except one REQ-458 test, which fails the same way without my change. The typecheck is clean.

**Things you should know**
- `xgd branch cut` can't run in the sandbox because it has to write `.git/config`. Running `xgd doctor --fix` outside the sandbox should fix that. I attached a plain git worktree to the branch it had left behind instead. REQ-634's and then BUG-329's sessions held the merge lock, so I waited for it, then merged and cleaned up normally.
- I briefly overwrote BUG-332's body by mistake: a failed command left another session's leftover temp file (BUG-1210's ticket) to be written in. I restored the original sections from git and added "What changed", "Design decisions" and an updated "Test plan". No other ticket was touched, and I saved a memory so it doesn't happen again.

<!-- xgd-chat-end -->