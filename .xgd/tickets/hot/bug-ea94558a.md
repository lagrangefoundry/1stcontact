---
uid: bug-ea94558a
id: BUG-332
type: bug
title: 'Durable turn: a retried step can''t hand off because the killed builder still
  holds its claim, and the job ends with nothing running'
created_by: EPIC-19
created_at: '2026-11-03T00:02:58.986905+00:00'
updated_at: '2026-11-03T00:32:45.352706+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: critical
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ebb61808
  commits:
  - working_sha: 023ef9d67bbaeab9d8c89189fdc1b0883f6a38ff
    reconcile_sha: null
    main_sha: null
  - working_sha: 3a42bf9462dd62aadacbfb8fce42b5bd69187a5f
    reconcile_sha: null
    main_sha: null
  version: 0.2.740
  story_points: 3
---

## Symptom

Production, 2026-11-02, a test site build (REQ-624's durable runner deployed 21:09Z). The client saw "_Stopped before the build was finished (under a minute)._" after the consultant's message "The earlier home-page build hasn't finished closing out yet, and I can't start these until it does." Nothing ran afterwards and nothing was asked of the client.

Timeline (`turn_log`, `request_spend`, Workers Logs, tool transcript):
- 22:30:20 the turn starts as a `ConsultantTurn` workflow.
- 22:39:14–22:44:37 builder `worker-builder-1-ww5mxo` builds the home page (21 requests).
- **22:45:03 Workers Logs: `ConsultantTurn` workflow step `exceededMemory`, wall 878,058 ms.** The consultant and its builder were in one step (REQ-627, builder passes as their own steps, isn't built yet).
- ~22:47 the runner retries the step (REQ-624 working as designed); the consultant writes its status and calls Delegate for the five remaining pages at 22:47:44.
- That Delegate never returns a result: the killed builder's claim on the site's pages is still held, so the new pass can't start ("hasn't finished closing out yet").
- 22:48:06 the turn ends `complete` with no hand-off returned → `roundSummary` writes `STOPPED_ALL`.
- Nothing is in flight and no question is open: client and consultant both wait.

## Root cause

1. **Memory is still exceeded in a single step** holding consultant and builder together for ~15 minutes (whether the framework's record-cache fix, lagrange-framework BUG-105, is in the deployed framework copy needs confirming).
2. **A claim held by a pass that died with its isolate isn't released on retry.** The retried step can't re-claim, and the hand-off quietly does nothing.
3. **The job ended with nothing running.** A refused or blocked hand-off ended the turn as `complete` instead of waiting for the claim, retrying, or telling the client.

## Fix

1. **Release a dead pass's claim on retry.** When a step is retried after its isolate died, claims held by builder passes from that step (whose heartbeats have stopped) are released before the step resumes, so the retried round can hand off again. A live pass's claim is never taken. (lagrange-framework REQ-232's re-claim-on-resume decision covers the resumed pass itself; this is the host side.)
2. **A blocked hand-off is never a silent end.** If a Delegate can't start because a claim is held, the job waits for it (bounded, with the "still building" line) and then hands off; if it still can't, the consultant tells the client plainly and what happens next. The turn doesn't end `complete` with nothing running (DOC-82 §6: the consultant always holds a next move).
3. **Confirm the memory fix is deployed** (framework BUG-105 in the loaded copy) and record peak memory per step; REQ-627 (each builder pass its own step) remains the structural fix.

## What changed

1. **A retried step releases its dead builders' holds** (`releaseDeadBuilders` in `tools/generate/src/cli/ai/host-core.ts`, called from `roundOfJob` whenever `attempts > 0`). Every builder hold on the site whose holder is not running in this process is released before the retried round runs, so its `Delegate` for the same pages starts. A builder still running in this process (an attempt that threw while its builder kept going) is live, and its hold is never taken. `builderTurns` now records every builder running in the process, whether or not its consultant turn is known, so it doubles as the liveness record. The release is logged as `job_dead_builders_released` (job, step, holders).
2. **A blocked hand-off waits instead of failing** (`draftClaims(..., wait)` in `tools/generate/src/cli/ai/lease-core.ts`). If a `Delegate`'s claim hits a file held by a builder that is not running here, and that hold lapses within `HELD_WAIT_MS` (3 minutes), the claim polls (every 2 s) until the file is free, then claims it. Meanwhile the `Delegate` stays in flight with its progress note showing. A hold by a builder running here (a concurrent pass in the same turn, REQ-410), or one that lapses later than the bound because it is being renewed, is still refused straight away as `scope_held`.
3. **The `scope_held` refusal no longer says "Wait for that".** The consultant can't wait. It now says: "Give this builder files nobody holds, or tell the client plainly that this part has not started yet, why, and what happens next. Do not end your turn as though it were under way."
4. **Memory (fix 3), checked but not changed in code.** The framework copy installed in the shared `node_modules` (installed 2026-11-02 21:24Z) and the locally built `dist/worker.js` (22:35Z) both carry lagrange-framework BUG-105 (`log.releaseCache()` at turn end; the priming is written only when it differs). The production deploy at 21:09Z predates that install, so the incident most likely ran without BUG-105. The next deploy carries it. **Peak memory per step is not recorded**: workerd gives an isolate no way to read its own memory use, and Workers Logs' `exceededMemory` outcome is the only signal. REQ-627 (each builder pass its own step) is still the structural fix.

## Design decisions

- **Why a dead hold can be identified without a heartbeat window.** A site's builders only run inside its consultant job's step, one job at a time, and the runner retries a step only after its previous attempt has ended. `releaseClaims` already relies on the same fact to retract the dead attempt's turn claim. So on a retry, "not running in this process" means the pass is dead. A timestamp-based "heartbeat stopped" test was considered and rejected: builders renew their lease only on tool calls, so a live builder in a long model request looks the same as a dead one.
- **Why the wait is bounded by when the hold lapses.** Holds are renewed each time the builder acts and lapse one idle period (5 min) after its last act. A hold that lapses within 3 minutes has been quiet for most of that period, which is how a dead pass looks. One that lapses later is being renewed. This also keeps REQ-397, BUG-296 and REQ-458's immediate-refusal evidence intact: their seeded or concurrent holds are either fresh 5-minute holds or held by builders running in the process.
- **Rejected: a host gate that forces the turn not to end `complete` after a refusal** (DOC-82: goal plus toolkit, no new gates). The refusal's wording tells the consultant what it must do instead.

## Test plan

`tests/test_UAT_FC_BUG-332_retried_step_hands_off_again.workers.test.ts` (real Worker, D1 `draft_leases`, junction DO, Workflows. The model client is the only double.):
- `test_UAT_FC_BUG-332_retry_releases_dead_claim`: a durable step is killed (host memory reset) while its builder holds `home.json`. The retry runs (attempts `[2]`), a second builder request is answered, the consultant sees no `scope_held`, the job ends `complete` without `STOPPED_ALL`, and no lease is left. Fails without the fix.
- `test_UAT_FC_BUG-332_live_claim_not_taken`: an in-process step fails while its builder keeps running. The retried hand-off is refused naming that live builder, and no second builder is opened. Fails if the release ignores liveness (mutation-checked).
- `test_UAT_FC_BUG-332_blocked_handoff_not_silent`: a hold left by a builder that is not running, lapsing in 3 s, makes the `Delegate` wait. The builder starts only after the lapse, no `scope_held`, the job ends `complete` without `STOPPED_ALL`. A fresh 5-minute hold is refused at once with the "tell the client plainly … Do not end your turn as though it were under way" instruction. Fails without the fix.

Regression scope run: BUG-296, REQ-624, REQ-397 (both suites), REQ-406, REQ-410, REQ-411, REQ-458. All pass except `test_UAT_FC_REQ-458_with_a_builder_holding_the_pages_the_draft_is_not_announced_and_the_running_build_is_named`, which fails identically without this change (pre-existing). `tsc -p tools/generate` is clean.