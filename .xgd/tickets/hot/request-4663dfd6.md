---
uid: request-4663dfd6
id: REQ-627
type: request
title: 'Long work, part 2: each builder pass is its own durable step, and its result
  starts the consultant''s next round'
created_by: EPIC-19
created_at: '2026-11-01T17:15:03.273685+00:00'
updated_at: '2026-11-04T15:30:29.736274+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d3a06227
  commits:
  - working_sha: 19f93003b0cf7985b670ad7629033c0ef1051721
    reconcile_sha: null
    main_sha: null
  - working_sha: e255f4cdc523e0fdcedba7a0703c28a281bddf49
    reconcile_sha: null
    main_sha: null
  - working_sha: fb4ba9d5fdc8937d50ae783835fe835a98d96539
    reconcile_sha: null
    main_sha: null
  - working_sha: b3f2759c8d4cd24dfac5e6624f4024a0ed62e6b5
    reconcile_sha: null
    main_sha: null
  - working_sha: db221b373eeadc551b9630ddaa48aa810adeff74
    reconcile_sha: null
    main_sha: null
  - working_sha: 2414499d554d414af7b5f609a2609b9f9a74972c
    reconcile_sha: null
    main_sha: null
  - working_sha: b8e979b91d8b8348aa2be7331e5fc2fb7d8d70ae
    reconcile_sha: null
    main_sha: null
  - working_sha: 1cb7bb41c9c69cad56eca0ae473f06555e0f3bc9
    reconcile_sha: null
    main_sha: null
  - working_sha: c2c07957a1aa7d9bb777cfea0f004adb456be3b8
    reconcile_sha: null
    main_sha: null
  - working_sha: c49b5e45d462e229a3d74f13fadb908ef0c09e0e
    reconcile_sha: null
    main_sha: null
  - working_sha: 0a8e9feb95d3d02f92f24040272e5c54b02c1cac
    reconcile_sha: null
    main_sha: null
  - working_sha: c7706edaf2dde308bd26d9c75cc6b5a60cccd92f
    reconcile_sha: null
    main_sha: null
  - working_sha: 3b67d593ded2f093677ad1646e62b65b2e8a46f7
    reconcile_sha: null
    main_sha: null
  - working_sha: 0172575594f70f1ee628c282abe243c745ada9ca
    reconcile_sha: null
    main_sha: null
  - working_sha: 4612b2aee42fc28fcb59da61840723441a895dde
    reconcile_sha: null
    main_sha: null
  - working_sha: 54022eba3e02df2c724ae94aa93141750be9646a
    reconcile_sha: null
    main_sha: null
  version: 0.2.751
  story_points: 20
---

## Why

Split from REQ-624 (operator decision, 2026-11-01). REQ-624 puts each consultant turn on a durable runner (Cloudflare Workflows), one step per consultant round, resumed with the framework's `resumeTurn` on retry. That alone still throws a builder pass away when a step dies mid-build, because today a Delegate runs inside the consultant's round. Every `exceededMemory` kill on Ariel's Arc Welding (2026-10-31) happened mid-Delegate, and a pass takes 5–10 minutes, so a repeating kill could end the job before the build ever finishes.

Making each builder pass its own step also:
- **Separates memory:** the consultant's context and a builder's are never resident in one isolate at once (BUG-320's isolation point).
- **Gives real progress:** "Building pages: 2 of 6 done" (REQ-625) counts real steps.
- **Lets completion notify:** the "your draft is ready" email (REQ-626) is sent when the last build step ends, without a consultant waiting.

## What

1. **The consultant's round ends at the hand-off.** Using lagrange-framework REQ-232's non-blocking Delegate, a consultant round that delegates records the hand-off and ends. No waiting inside the round.
2. **Each builder pass runs as its own step** on REQ-624's runner, in its own invocation, with the builder session's own junction as its checkpoint.
3. **The pass's result starts the consultant's next round.** When the pass ends (report, refusal, error), its result is recorded as that Delegate's tool result and the runner runs the consultant's next round, which sees exactly what a blocking Delegate returned.
4. **A build step that dies is retried.** It resumes the pass if REQ-232 supports it, otherwise restarts that one pass; work the pass already wrote to the site stays and the retry builds on it. A pass that fails the same way twice ends the job with BUG-294's notice and Carry on.
5. **One builder at a time per site** (BUG-320's `max_concurrent: 1`) holds; several Delegates in one round run as consecutive steps.
6. **Stop** stops the running build step and the job.
7. **Scope:** the Site consultant and its builders.

Depends on: REQ-624 (runner), lagrange-framework REQ-232 (non-blocking Delegate).

## Test plan

- `test_UAT_FC_<id>_build_step_separate_from_round`: a consultant round that delegates ends before the builder runs; the build runs as its own step; the next consultant round receives the builder's report as the Delegate's result.
- `test_UAT_FC_<id>_build_step_retried_not_whole_turn`: a build step killed once is retried and completes; the consultant's earlier rounds aren't re-run and no other pass is repeated.
- `test_UAT_FC_<id>_repeat_build_failure_ends_with_notice`: a build step that fails twice ends the job with the Carry on notice and no further spend.
- `test_UAT_FC_<id>_progress_counts_build_steps`: a round that delegates three passes reports progress "k of 3" as each build step ends.


## Questions before coding (REQ-627 session, 2026-11-01)

Both dependencies are landed: REQ-624 (`ready_to_reconcile`) and lagrange-framework REQ-232 (`edb5953c01`, on its xgd-working and in the shared `@lagrangefoundry/ai` store this repo loads). Reading 1st Contact's Delegate wiring against REQ-232's detached API turned up five things that a straight switch to `detached: true` would silently break. Two need a framework change or a product decision.

1. **The host's additions to a Delegate result are lost.** `reportingDelegationToolbox` (account-core.ts) decorates every result after `super.delegate()`: `wrote`, `activity`, `ended`, the host summary for a silent builder ([[BUG-212]]), the presented account ([[BUG-252]]). In detached mode `super.delegate()` returns `started`. `runWorkerPass` then records the base framework result on the caller's junction, and `deliverResults` renders that recorded result. The framework has no hook to change a result before it is recorded. Options:
   - (a) **Recommended:** a framework follow-up (a ticket in lagrange-framework, no code from here). A runtime hook, e.g. `passResult(result, ctx)`, async, applied in `runWorkerPass` before the result is recorded. The host decorates there.
   - (b) 1st Contact overrides the framework's private `_result` in its subclass. Works today, but it is fragile.
   - (c) Detached results go without the host's fields.
2. **Replacing a builder that ran out ([[REQ-409]], `MAX_BUILDER_REPLACEMENTS`) doesn't fit one handle = one worker session.** Today a builder that runs out of calls, time or context is replaced inside the same Delegate call, and the consultant hears once. Options:
   - (a) **Recommended, and simpler:** drop in-call replacement for detached passes. The consultant's next round receives `ended` and the merged changes, and re-delegates the rest itself, as a further build step.
   - (b) Keep replacement. That needs a framework API for a follow-on pass under the same handle.
3. **The account bracket can't be read back in another isolate.** `draftAccount.mark` returns `capture.at`, a number, so it passes REQ-232's JSON check. But it keeps the full opening capture (site JSON, pages, asset manifest) in a `WeakMap` keyed by the framework's `ctx` object. At pass end that `ctx` is a different object, possibly in a different isolate, so `changes` and `settle` find no pair. The result is: no `account.changed`, no `wrote`, and every host-settled containment check comes back `unreported`. The same applies to the case recorder's `opened(ctx, …)` ([[REQ-452]]). Proposed fix, all in 1st Contact: at hand-off, persist the opening capture under the worker session id, in R2 where the host has it and in memory in the CLI and Node suites. The mark becomes `{at, worker}`, and the pass-end side loads the capture by that key. **Confirm this is acceptable, or name the store to use.**
4. **[[BUG-296]] would stop every detached builder at once.** `endTurnBuilders` stops, by name, every builder the consultant turn started when that turn ends. A detached hand-off ends the turn straight away. Proposed fix: detached hand-offs are exempt from it. Stop then reaches them only through REQ-232's own caller and worker stops, and the job's stop (item 6 of What). **Confirm.**
5. **No "still building" lines from a detached pass.** REQ-232 says a detached pass "has no caller round to say it on, so it … says nothing". The [[REQ-360]] interval lines ("still building…") would disappear while a build step runs. Options:
   - (a) **Recommended:** the build step writes its own interval progress as a REQ-624 host event, so the follower shows it as today.
   - (b) Accept the silence until REQ-625's "k of n" lands.

Also noted, no decision needed: this is larger than the ticket reads. The host's per-builder state (spend meter charge, `builderTurns`, `runningBuilders`, the first-pass and follow-up-build bookkeeping, layout owed) has to be carried across the build step the way REQ-624 carries `MessageState`. Estimate: 13–20 points.

## Decisions (operator, via EPIC-19, 2026-11-01)

Answers to the five design gaps this ticket's session raised:

1. **1st Contact's extra result fields (`wrote`, `activity`, `ended`, the no-report summary, the trimmed change account): a hook in the framework.** File a lagrange-framework ticket for a host hook that shapes a detached pass's result before it's recorded (in both the JS and Python peers, which are kept in sync); write no framework code from here. Don't override framework internals, and don't drop the fields.
2. **Replacing a builder that ran out: drop it for detached passes.** The consultant's next round sees `ended` and what was changed, and delegates what's left as a further build step. The result must say plainly what remains, and the planned-steps list (REQ-625) gains that step so progress stays honest.
3. **The opening snapshot: persist it under the builder's session id,** in R2 where the host has it and in memory for the CLI and test suites, behind one interface. Delete it when the pass ends.
4. **BUG-296's end-of-turn stop: exempt detached passes owned by a live job,** and only those. Stop still reaches them through the framework's stop and the job's Stop; add a test that a client Stop during a detached pass stops it.
5. **"Still building…" lines: the build step writes them itself,** so the panel shows them as today. REQ-625's "k of n" counter is in addition, not instead.

Size: 13–20 points is within one free-coded ticket; keep it as one.


## Readiness (REQ-627 session, 2026-11-01)

- Decision 1's framework ticket is filed: **lagrange-framework REQ-235** (`request-260dcca8`), a `passResult` hook that shapes a detached pass's result before it is recorded. No framework code from here.
- REQ-627 now depends on lagrange-framework REQ-235 too: until the hook is in the framework copy this repo loads, a detached result can't carry 1st Contact's fields. The hook is the only route allowed (not overriding internals, not dropping the fields).
- Everything else is settled: decisions 2–5, REQ-625's step queue (landed), REQ-624's runner and REQ-232. Coding starts once lagrange-framework REQ-235 lands.

Note (2026-11-01): the framework hook ticket from decision 1 was first created in 1st Contact's store by mistake (as REQ-630, now archived). It lives in lagrange-framework as **REQ-235** (`request-260dcca8`). When filing framework tickets from this repo, set `XGD_PROJECT_ROOT=/Users/martin/lagrangefoundry/lagrange-framework`.


## Progress (REQ-627 session, 2026-11-01): built on branch `free-REQ-627`, not merged

The framework hook decision 1 asked for landed as lagrange-framework commit `1027408ced` (`passResult`, its message says REQ-235). It is on framework xgd-working but **not yet in the shared `@lagrangefoundry/ai` copy**. This session tested against a staged copy (gitignored redirect in the worktree only). **Deploying needs `bin/install` in lagrange-framework first.**

**Built (three WIP commits on `free-REQ-627`):**
- **Detached Delegate for the Site consultant.** A group-chat room's rounds stay blocking: a room is not a job, so nothing would run its passes. The round ends at the hand-off. Each pass is a job step of its own (`buildStep`), one at a time, oldest first, retried and resumed like any REQ-624 step.
- **Delivery once all of a round's passes have ended.** The next round opens with each result under the framework's header. Each result goes through the consultant's own tool-result chain: the host's look (its pictures in the user turn; the site backend now registers `vision`), the stage guides, the REQ-436 tally and announcement. The round's cadence sums up the delivered hand-offs (REQ-459), and the switches, new inputs and emails a result carries are said as before. The `delivered` record is written after the round has run, so a delivery round that died before it opened is delivered again by its retry.
- **Decision 1.** `passResult` applies the host's fields (`hostPassResult`: `wrote`, `activity`, `ended`, the host summary, the presented account). One function serves both the blocking path and the detached path.
- **Decision 2.** No replacement builders for a detached pass. A pass that ran out carries `remaining`, a new declared result field that says plainly the rest is not done. The REQ-625 queue gains a pending step for it (`StepQueue.addLeft`).
- **Decision 3.** `draftAccount` keeps the opening capture by builder session id in a `CaptureStore`: R2 (`SITES`, `delegation-captures/<tenant>/<site>/<worker>.json`) on the Worker, memory elsewhere. `forget` deletes it when the pass ends.
- **Decision 4.** Passes are claimed in the build step, not in a consultant turn, so BUG-296's end-of-turn stop never sees them. The build step polls the inbox for Stop and stops the pass and the job; passes still waiting end `stopped`, and none is delivered.
- **Decision 5.** The build step writes the still-building heartbeat every `progressSeconds`. After each pass it writes the "k of n" working line, as job host events.
- **Spend cap.** The `admit` hook refuses a pass past the message's spend ceiling or time warning. A pass's spend is attributed on the spend row of the round its result is delivered in.
- **Empty scope.** A brief naming no files is refused at the hand-off, `scope_held` with REQ-410's sentence as before, rather than spending a step to find out. A file someone else holds is refused when the pass claims it (REQ-232 decision 3), so it comes back as a `refused` result.

**Suites.** `tests/support/delivered-results.ts` `asBlocking(req)` moves each delivered result back into the `started` tool result it answers. The suites that read Delegate's tool result keep their assertions unchanged. Of 96 delegation workers suites, about 76 tests went red. About 60 are fixed by this or by small truthful updates. **About 20 are still to do.** Most are mechanical: one row per round in spend tests, progress-frame tests, REQ-411's concurrency (superseded by item 5). The 14 tests that are red without this change too are not counted. The new `test_UAT_FC_REQ-627_*` UATs are not written yet.

## Decided: who answers a message sent during a build (REQ-627 session, 2026-11-03)

The operator asked for the ticket to be completed without choosing, so the session took **(b)**. **A client message sent while a build step runs is not answered mid-build.** It waits in the inbox for the consultant's next round, the delivery round, where the round's talker desk or the round itself takes it. This keeps the ticket's own memory point: the consultant's context is never loaded into a build step's isolate, and (a) would have needed exactly that, a consultant turn opened beside the build. Stop still reaches a stuck builder. The build step lets its files go 5 s after a Stop that can't end it, and ends the job. A talker reply during builds can be added later as a separate intent if wanted.

Evidence: [[BUG-296]]'s `a_stopped_turn_releases_its_stuck_builders_files_for_the_next_delegation` now asserts that no talker opens during the build, that the Stop still frees the builder's files, and that the next delegation on the same files is started.

## Progress, second pass (REQ-627 session, 2026-11-01): ready except the open question

Built against the installed framework (`passResult` present). The branch `free-REQ-627` is merged up to date with xgd-working and not yet merged back.

**Added since the first progress note:**
- **The build step watches its pass.**
  - A builder that writes nothing for the host's stall deadline ([[BUG-274]]) is stopped. Its result, `stopped`, with what it wrote, is delivered to the consultant like any other.
  - A pass a Stop can't end (stuck in a request) has its files let go after 5 s. A client Stop then ends the job; a silent builder that won't stop fails the step, which the runner retries once.
  - After REQ-627, BUG-249's stall continuation no longer covers builds.
- **The builder's own junction is the pass's checkpoint.** The build step prepares (adopts) it so it is written to its Durable Object as it grows. On a retry, the dead attempt's claim on it is retracted. A step killed mid-build is resumed in a fresh isolate with its finished calls kept.
- **A job that ends lost lets go of the files** of every pass it never finished.
- **Every Delegate of one reply is handed off together.** The tool cap is lifted for a detached runtime: a hand-off builds nothing in the round. With `max_concurrent: 1` the first hand-off used to end the round before its siblings ran. Builders still run one at a time, as consecutive steps ([[BUG-320]]).
- **The builder's brief comes from the hand-off** ([[BUG-323]]'s menu-button check), in whichever isolate the pass runs. `briefed` no longer needs the claim first.
- **Delivery.**
  - A delivery round's message is sent as blocks (the results, the pictures, then the host's guides), so the turn's reminder never fuses onto the last result.
  - A round that opens with delivered builds and hands off again sums up what came back before the new hand-off (REQ-459). Each delivery round has its own past-tense line.
  - The "Meanwhile, n questions need you" line is said once per chain of rounds.
  - A delivery round that runs out of budget lists its delivered builds ([[BUG-208]]).
- **Spend.** A pass's request rows are linked (`delegated_by`) to the turn its result opens, the turn whose row carries its `attributed` entry ([[BUG-254]]). There is one consultant row per round.

**Superseded by this ticket** (suites updated to the new truth):
- **[[REQ-411]]:** builders of one reply now run one after another; the same-file refusal can't arise.
- **[[BUG-257]]:** the second Delegate is its own round, so it has its own `started_at`.
- **[[REQ-459]]:** one past-tense line per delivery round.
- **[[REQ-296]] / [[REQ-409]] replacement:** one builder per pass.
- **[[BUG-275]]:** a stalled build is delivered, not stall-continued.

**Test evidence.** `tests/test_UAT_FC_REQ-627_builder_pass_is_its_own_step.workers.test.ts`, six UATs on the real Workflows engine, junction DO, D1 and R2:
- `build_step_separate_from_round`: the round ends at the hand-off; the build is its own step with still-building heartbeats; the next round receives the report with `wrote`; the capture is deleted.
- `build_step_retried_not_whole_turn`: the build step is killed mid-pass. Attempts are `[1,2,1]`, the finished write is not re-run, and `account.changed` survives the fresh isolate.
- `repeat_build_failure_ends_with_notice`: lost, Carry on, attempts `[1,2]`, no further model calls; the files are let go.
- `progress_counts_build_steps`: three Delegates in one reply become three consecutive build steps; "1 of 3 done", then "2 of 3 done"; one round receives all three results.
- `a_pass_that_ran_out_says_what_remains`: `remaining` in the result, and "1 of 2 done".
- `a_stop_during_a_build_stops_it_and_the_job`: `stopped`, the job `aborted`, no delivery round, the files free.

Support: `tests/support/delivered-results.ts` (`asBlocking`, `deliveredResults`, `delegateResultsIn`).

**Regression.** All 96 delegation workers suites pass except:
- the tests already red at baseline (REQ-295 checks shape, REQ-342, REQ-416 ×3, REQ-436 ceiling, REQ-458);
- **[[BUG-296]] `a_stopped_turn_releases_its_stuck_builders_files_for_the_next_delegation`**, which waits for a talker reply during the build (the open question below).

The node account suites (BUG-225, BUG-252) pass; BUG-252's budget case is red at baseline too.

(Superseded: BUG-296's case was the open question, now decided above.)


## Final state (REQ-627 session, 2026-11-03): merged

**Added in the last pass:**
- **A retried build step joins a pass still running in its isolate** ([[BUG-332]], which landed on xgd-working mid-session). If a build step's attempt fails but the isolate didn't die, the retry doesn't retract the live pass's claim or open a second builder over its files: it watches the same pass to its end. Only the newest attempt finishes a pass, so the superseded attempt neither counts the step nor writes its progress line again. A pass that is gone (the isolate died) is resumed from its junction, as before.
- **BUG-332 restated on the build step.** The build is step 1, after the hand-off round (step 0):
  - `retry_releases_dead_claim`: build-step attempts `[1,2,1]`, nothing held at the end, no refusal.
  - `live_claim_not_taken`: the live pass keeps its hold through the retry, and there is exactly one builder.
  - `blocked_handoff_not_silent`: a lapsing hold is waited for. A renewed hold is refused when the pass claims its files, as a `refused` result naming the holder, with BUG-332's "tell the client plainly" sentence.
- **[[BUG-296]] restated** for the decision above.

**Regression (2026-11-03, after merging xgd-working):** 118 delegation workers suites, 513 tests pass. 14 fail, and the same 14 fail on clean xgd-working:
- REQ-295 ×2, REQ-342 ×3, REQ-416 ×3, REQ-426, REQ-428, REQ-436 ceiling, REQ-458, REQ-466, REQ-473.

The talker-mid-build cases among them (REQ-416, REQ-426, REQ-428, REQ-436) are also superseded by the decision above, whenever they are next repaired. Node account suites: BUG-225 and REQ-354 pass; BUG-252's budget case fails on xgd-working too.

**Story points:** 20.