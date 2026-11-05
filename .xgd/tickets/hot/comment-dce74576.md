---
uid: comment-dce74576
id: COMMENT-7759
type: comment
title: Comment on bug BUG-340
created_by: xgd
created_at: '2026-11-04T15:40:40.816726+00:00'
updated_at: '2026-11-04T16:19:33.718061+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-08433573
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "10a616a0-ca56-4c88-b8ee-9c6e2b0b63d3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b3500ba4-11fa-46d2-b5ee-7da19ed42f59-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T15:39:01.637495+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="b3500ba4-11fa-46d2-b5ee-7da19ed42f59-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T16:19:25.006578+00:00" -->
#### Claude
Reading the ticket and the dev-environment code (`1c dev`, the cron watchdog, the panel's turn polling) before scoping the fix.

Still investigating: the server-side watchdog path is clear; now tracing how the builder panel follows a live turn and why it never noticed the dead one.

Confirmed the gap: `followJob` waits forever for a `job_end` that a dead runner never writes. Now checking what Stop does on such a job.

Scoped enough to proceed. Checking how wrangler 4.111 exposes the scheduled handler locally, then I'll update the ticket and cut the branch.

Scope is clear. Recording the diagnosis and design on the ticket, then cutting the branch.

Now updating the ticket body (appending, preserving existing content) and marking it `free_coding`.

Known sandbox quirk (branch created, worktree not attached). Attaching it by hand as the memory note describes.

Worktree ready. Writing the dev cron ticker first.

Dev cron is wired into `1c dev serve`; fixing an import and typechecking.

Now the host side: making `followJob` notice a dead runner, and Stop close dead work. Checking how the routes treat a `lost` end first.

Writing the host-core changes now.

Stale stops are filtered by time, but I'll take the stop out of the inbox when Stop closes the work itself. Then typecheck.

Host typechecks. Now the router: Stop answers `stopped` and closes the ledger row; the live prompt route closes the row when its follower ends a job lost.

Router typechecks clean. Now writing the UATs, starting with the workers-pool suite (dead job seen by follower, Stop on dead job, scheduled sweep from the dev ticker's cron).

Two failures: `closeDeadJob` isn't seeing the cloned job as dead. Adding a temporary debug line to see what the host judges.

`from` is a byte offset into the junction, not a record count — my clone set it wrong. Fixing the test fixture.

All four workers UATs pass. Now the Node-side UAT for the dev ticker.

Both new suites pass (8 UATs). Running the regression scope: the job/lost-turn/stop suites and the dev-command suites.

7 failures across 4 files. Checking them against a baseline on clean `xgd-working` before assuming anything.

BUG-249 and REQ-416 fail identically on the baseline (pre-existing). BUG-150 and REQ-318 differ — checking whether that's my change or the worktree environment.

The REQ-318 failures come from the worktree environment (no staged font mirror, no local D1). They don't touch the cron, host or router code, and `1c` loads fine. Running lint on the changed files.

No eslint is installed in this repo; typecheck and the test runs are clean. Checking how earlier free-coded commits here handled the version before committing.

I'll commit without a version bump, since the gate does that itself here. Staging only my files.

Committed. Now locking and merging back into `xgd-working`.

Ticket is at `free_coded` (the gate added its own version-bump commit). Setting story points and cleaning up the branch.

Branch cleaned. One last ticket sync: two smaller changes made during the build aren't in the body yet.

The memory index is near its limit. Compacting it by moving a group of related entries into a hub file.

BUG-340 is fixed and merged into `xgd-working`, and the ticket is at `free_coded`. A panel showing a dead turn as running now switches to the stopped notice with Carry on by itself, Stop on a dead turn works, and dev runs the watchdog cron. I didn't need to ask you anything first.

**Why the panel never noticed.** A consultant message runs as a job, and the panel follows it until the job's runner writes "job ended". When the reload killed the runner, nothing ever wrote that, so the follower waited forever. The server already treats a job as dead after a minute with no records from it and nothing holding the conversation — that's why reopening the panel at 22:04 showed it lost. The live follower just never asked.

**What changed:**
- **The panel sees a dead turn as stopped without a reload.** About every 10 seconds the follower asks whether the job is still running, using that same one-minute rule. Once it isn't, the follower closes the job as lost and the turn-log row closes too. The panel then shows the stopped notice with Carry on, about a minute after the runner's last record. This is sooner than the 5-minute threshold in the ticket, but it now agrees with what a reload already showed, and it applies in production too.
- **Stop works on a dead turn.** Stop used to leave a note for the runner, which a dead runner never reads. Now, if nothing is running the work, Stop closes it straight away as aborted and the panel goes idle with no lost notice. If the runner is still alive, Stop behaves as before.
- **Dev runs production's cron.** `1c dev serve` now fires the worker's own crons, read from the snapshot's `wrangler.toml`, at each matching UTC minute. So the 10-minute watchdog now sweeps dead turns in dev as it does in production.
- **One related fix:** the server measured a job's silence using records from earlier jobs in the same conversation too. It now counts only the job's own records.

**One gap:** in the first minute after a runner dies, before the one-minute rule gives up on it, Stop is only recorded. The follower still closes the turn as lost once that minute is up.

**Tests:** 8 new UATs in two files, all passing (`test_UAT_FC_BUG-340_dead_job_is_seen_and_stopped.workers.test.ts` and `test_UAT_FC_BUG-340_dev_serve_fires_the_cron.test.ts`). I also re-ran 22 nearby suites. 18 pass; the other 7 failures are not from this change:
- The BUG-249 "stalls twice" UAT and three REQ-416 talker UATs fail the same way on clean `xgd-working`.
- Two REQ-318 dry-run deploy UATs fail only in the branch worktree, which has no staged font mirror and no local D1.
- The BUG-150 UAT failed on the first run and passed on a re-run in the same worktree.

**To get it in your dev environment:** run `bin/deploy --env dev` for the server changes, then `bin/dev restart` so `1c dev serve` starts the cron.

The commit is `fdbd47cd`, plus the version commit the ticket tool adds itself (0.2.754). I updated the ticket body with the diagnosis, the design decisions and the tests as built, and set story points to 5. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->