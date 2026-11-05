---
uid: comment-d3176938
id: COMMENT-7782
type: comment
title: Comment on bug BUG-343
created_by: xgd
created_at: '2026-11-04T20:04:34.133319+00:00'
updated_at: '2026-11-04T20:30:17.019371+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d381393d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d31ee754-3d98-41e0-91e9-7a5fd46aec8f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a7c57b1e-0a9b-4000-a89c-2eeda4b7fdc4-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T20:03:36.550515+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="a7c57b1e-0a9b-4000-a89c-2eeda4b7fdc4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T20:30:07.155907+00:00" -->
#### Claude
Reading the job-follow code in `host-core.ts` before I scope the fix.

Still mapping the code: found the runner (`turn-job.ts`); now looking for where REQ-627's builder pass runs as its own step.

Design settled; now wiring. Looking at where the router builds the host deps so the Workflows binding can answer "is this job still running?".

Scoping done. Setting the ticket to `free_coding` and cutting the branch before I edit any code.

Baseline green (4/4). Now reading the prompt-start path, since a job that's open but dead must not hold the session forever once silence no longer frees it.

Now editing `host-core.ts`: first the liveness constants and the in-process runner's registry.

Now `runningJob`, `jobState`, and the dead-job close: an open job counts as running, and only the runner's report closes it.

Now the follower itself: it stops writing endings from silence and tells the client "no news" instead.

Next, the runner's own sign of life: every step, round or builder pass, writes a `job_alive` beat.

Now the Worker side: the Workflows binding answers the liveness question.

Typecheck is clean apart from two existing errors in unrelated files. Next, the UATs. Reading the rest of REQ-627's first test to reuse its builder-pass script.

Now the new BUG-343 UAT file: a silent builder pass, a reload re-attach, and a runner that really died.

Both new BUG-343 UATs pass, including the 75-second silent pass. The one failure is in my BUG-340 edit: I left a dangling reference. Fixing it.

BUG-340 is green again (4/4), with the follower path still covered. Now the wider regression scope: every suite that touches jobs, reattach, or lost turns.

10 failures across 3 suites. Checking them against the main checkout (no changes of mine) before diagnosing.

8 of the 10 fail identically on the main checkout, so they're pre-existing. That leaves BUG-229's two, which pass on main. Re-running that suite alone in the worktree.

BUG-229 passes 6/6 when run alone, so that was a load flake. Now the node-project suites in scope.

All green. Checking how this project bumps its version before committing.

Updating the ticket body first, keeping the existing text and adding the design as built.

Committed. Now the merge-back sequence: lock, merge xgd-working into the branch, bump the version there, then fast-forward.

Fast-forwarded onto xgd-working. Moving the ticket to `free_coded`.

Ticket is `free_coded` with both commits and version 0.2.761. Cleaning up the branch.

I've fixed BUG-343. A follower can no longer declare a working consultant job lost: only the job's runner can end it. When a job goes quiet, the client is now told so and the stream stays open. The ticket is at `free_coded` (commits `f4036a19` and `8d67f903`, version 0.2.761) and the branch is merged into xgd-working and cleaned up.

**How it failed in prod:** the follower wrote the lost ending after a minute with no job record and no claim. A builder pass holds no consultant claim, so a long tool call inside one looked like death. The prompt route then closed the turn_log row because the ending said lost, which is why `alive_at` stopped at 18:24:24.

**What changed:**
- **An open job counts as running.** A job with no ending is running until its runner says otherwise. Session open, a new prompt, reattach and the turn clean-up all now read it that way, so reloading the builder during a quiet pass re-attaches and streams on.
- **Only the runner reports a death.** A lost (or, after Stop, aborted) ending is written only when the runner reports the job gone:
  - On the Worker, the Workflows binding is asked for the instance's status. Errored, terminated, or complete with no ending means gone. If the binding can't be asked or can't find the instance, nothing is ended.
  - Without the binding (dev, CLI, test suites), the in-process runner keeps a list of the jobs it is running. A dev reload empties that list, so the BUG-340 dead-job case still ends lost.
- **Every step writes a sign of life.** Each step, round or builder pass, writes and flushes a `job_alive` record every 20 s. Nothing treats it as a verdict.
- **Silence is shown.** After 60 s with nothing new, the stream shows "No news from the job for N min — it is still running.", updated each minute. When records resume, the job's own last status line comes back.

**UATs** (in-process runner, builder model call held for 75 s):
- `test_UAT_FC_BUG-343_silent_builder_pass_streams_on_to_the_final_reply` passes. The live stream and a reattach made during the silence both end complete with the final reply, and both showed "no news" and then went back to normal. It also confirms exactly one ending (complete), the builder step's beats, and a ledger row that isn't lost.
- `test_UAT_FC_BUG-343_a_runner_that_really_died_ends_the_job_lost_itself` passes. The build step is killed on every attempt, and the job ends lost with the runner's own account (`step 1 failed 2 times`).

**Decision for you:** BUG-340's UATs assumed silence means lost, so I changed two of them.
- `stop_leaves_a_running_job_to_its_runner` now uses a job that is really running (its model call held open), not a made-up one with recent records.
- `a_followed_job_whose_runner_falls_silent_ends_lost` now ends on the runner's report. It keeps its old name, which no longer describes it; tell me if you'd like it renamed.

All four BUG-340 tests pass, and the ticket body records the change.

**Tests run:** Typecheck has no errors in the changed files; there are two existing errors in `material-import.ts` and `zip-reader.ts`. 58 of the 68 workers tests that cover jobs, reattach and lost turns passed. Of the 10 failures:
- 8 are in `reconciliation-conversations-live-turn` (4) and REQ-416 talker (4). They fail the same way on xgd-working without my changes.
- 2 are in BUG-229. That suite passes 6/6 when run alone.

In the node suites, BUG-46 and REQ-624's panel tests pass. `pane-rejoin` fails the same way on xgd-working. `workspace-origin` fails 6 tests in the worktree against 2 on xgd-working; the extra failures are in serving webui from outside the repo, which this change doesn't touch.

I haven't deployed it, so the Workflows-binding status check is only covered by the code path, not observed on a live instance.

<!-- xgd-chat-end -->