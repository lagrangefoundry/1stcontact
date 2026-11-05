---
uid: comment-af731b97
id: COMMENT-5742
type: comment
title: Comment on bug BUG-288
created_by: xgd
created_at: '2026-10-26T00:50:16.833771+00:00'
updated_at: '2026-10-26T01:06:40.408822+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-643c1f18
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "02168516-c217-472c-a640-f554ed132fd6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1bbdb2da-5b48-4093-b06a-40ed32f4244f-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T00:48:54.082625+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1bbdb2da-5b48-4093-b06a-40ed32f4244f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T01:06:39.160205+00:00" -->
#### Claude
I'm reading the turn-ledger code to see where a turn's heartbeats can be written so the sweep can judge silence instead of age. Next I'll look at `streamTurn`.

Still mapping the code: tracing how heartbeat/progress events reach the turn's stream (`progress-core.ts`), so the ledger can record each turn's last sign of life.

I've mapped the design (silence-based judgement via a heartbeat column, plus deploy-time recording for restarts). Now setting the ticket to `free_coding` and cutting the branch before writing code.

Now the test factory: register the migration and move the `atHead` marker.

Now the ledger module itself.

Now the router: stamp deploy time at open, beat while the turn runs, and pass deploys to the health route.

Simplify: the timer is the only caller, so drop the throttle.

Now the console label and the wrangler binding.

Code changes are in and typecheck clean; now writing the `test_UAT_FC_BUG-288_*` workers suite (live 40‑min turn, silent turn, turn killed at a deploy, and the route stamping the row).

All 4 pass. Now the adjacent regression scope.

Those three are unrelated to this diff (PLATFORM_ADMINS value, `tenant-cost.js`, `hostname.ts`). Baseline the rest on the main checkout:

Main checkout shows the same failures except a few that fail only in the worktree. Checking whether REQ-393's extra failures are from my wrangler change:

`--append-body` took `-` literally. Rewriting the body with the original content preserved plus the new sections:

Ticket body is good. Now the merge-back sequence (lock → merge working into branch → bump → xgd-merge → move-to-free-coded).

The merge brought in other sessions' changes; re-running my suite on the merged tree before landing:

BUG-288 is fixed and merged into `xgd-working`. A turn is now judged dead by how long it has been silent, not by how long it has run. The ticket is at `free_coded` (commits `5e75b087`, `7e978c49`, version 0.2.656, 3 points). I have not promoted it to `ready_to_reconcile`; that's your call.

**What changed**
- **Each turn records its last sign of life.** The ledger table `turn_log` gets two new columns (migration `0033`): `alive_at` and `deployed_at`. While a turn runs, a timer in the process running it updates `alive_at` every 60 s. I used a timer rather than the turn's stream events because a consultant waiting on a long builder round can send nothing for minutes. A turn that is stuck but still running is still ended by BUG-249's progress deadline, as before.
- **One rule for every reader.** A turn is lost only after 5 minutes with no sign of life. The Debug tab, the `consecutiveLost` count and the 10-minute cron sweep all use this rule. The sweep re-checks each row before closing it, so a turn that is still updating its row is never closed, however long it has run. The old 15-minute limit is gone. Rows written before the migration are measured from their start time.
- **A death at a redeploy now says so.** Each row records when the Worker version that started it was deployed. That needs a new `version_metadata` binding in `wrangler.toml`, added at the top level and for production and dev. A silent turn whose last sign of life falls within 2 minutes of a newer deploy reads as "Ended by a restart". It doesn't count toward the alarm, so "Something is killing them" now only appears for deaths nothing explains. A turn started by the new version is never blamed on that deploy.

**Tests**
- The four new tests in `tests/test_UAT_FC_BUG-288_a_live_turn_is_not_dead.workers.test.ts` pass:
  - a 40-minute turn heard from seconds ago reads as in flight and the sweep leaves it alone;
  - a silent turn reads as lost and the sweep closes it;
  - a turn that died at a deploy reads as restarted, not as the alarm;
  - the prompt route writes both new columns.
- The neighbouring ledger suites pass: 7 files, 26 tests (REQ-306, BUG-249, BUG-166, BUG-274, BUG-277, REQ-320). I re-ran the key ones after merging in `xgd-working`.
- In the wider run of 48 node suites, 16 tests in 6 files failed. None of them is caused by this change:
  - **REQ-185, REQ-180, the deploy-hooks smoke test, and one builder-origin test** fail the same way in the main checkout. They are about the `PLATFORM_ADMINS` value, `tenant-cost.js` and `hostname.ts`.
  - **The rest of the builder-origin and REQ-115 failures** happen only in the branch worktree, because of where it sits on disk.
  - **REQ-393** failed 3 tests in the big run; run on its own it fails 1, the same as without my `wrangler.toml` change.

**Before it helps in the field**
- It needs a deploy: migration `0033` has to be applied and the new binding has to be live.
- Turns already open when it ships are judged from their start time until they end.

<!-- xgd-chat-end -->