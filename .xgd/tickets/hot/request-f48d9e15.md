---
uid: request-f48d9e15
id: REQ-624
type: request
title: 'Long work runs to completion, part 1: each consultant turn runs on a durable
  runner, one step per round'
created_by: EPIC-19
created_at: '2026-11-01T00:38:26.097191+00:00'
updated_at: '2026-11-01T21:15:30.019141+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: critical
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-11ab8a6d
  commits:
  - working_sha: 63b6cbcb4a5a6e7038555f5062ffdc4c47401d07
    reconcile_sha: null
    main_sha: null
  - working_sha: dd612060758e023a958f8dffb8c9acbaaec93958
    reconcile_sha: null
    main_sha: null
  - working_sha: d3264c077f9a0b011552420e50a278fa92d1c7ff
    reconcile_sha: null
    main_sha: null
  version: 0.2.732
  story_points: 13
---

## Why

Operator, 2026-10-31: "We need the long running process to run to completion." After deploying BUG-320 and BUG-324 at 22:40Z, Ariel's Arc Welding still lost five turns in 70 minutes (22:42, 22:51, 23:03, 23:11, 23:48); Workers Logs show six `exceededMemory` kills of `POST /api/ai/prompt` between 22:41 and 23:52, each mid-Delegate. Today the consultant's whole turn, every builder pass included, runs inside the browser's `POST /api/ai/prompt` request (REQ-483 splits it into a request per round, but a Delegate is one round). When that request's isolate dies, the work dies with it; all we can do is detect the loss (BUG-294/312) and carry on, losing and redoing in-flight work (14 of 53 refinement Delegates on Ariel were repeats).

The memory cause itself is lagrange-framework BUG-105 (record cache never evicts; `context` records repeat the full priming every turn). That fix is necessary but not sufficient: any request-bound long job can still be killed by a deploy, an isolate eviction or a limit.

## What

1. **Long work runs as a durable background job, not in the request.** A consultant turn's work (model rounds and each builder pass) runs as a sequence of checkpointed steps on a durable runner — Cloudflare Workflows is the intended fit (architecture policy item 8 names Workflows for builds; nothing uses it yet). The browser request only starts the job and follows its stream (the junction, as today's rejoin does).
2. **A step that dies is retried from its checkpoint by the runner,** not by a host carry-on cue. Each model round and each builder pass is one step whose inputs and outputs are persisted, so a retry neither redoes a finished step nor loses one. A step that fails the same way twice ends the job with BUG-294's notice and the Carry on button (no loop, no runaway spend).
3. **The job doesn't depend on the client's tab.** Closing the builder or losing the connection doesn't stop the work; reopening shows where it got to.
4. **One job per site at a time,** serialised by the existing per-site coordination (Durable Object), so a new client message during a job is handled as today (talker reply, queued or folded into the next step).
5. **Memory per step is bounded:** a step loads only what it needs (cursor reads of the junction, no whole-log caches), so a long session can't push a step over the isolate limit. Record the measured peak per step kind.
6. **Supersedes the request-bound machinery it replaces** (lost-turn burial and automatic carry-on for job work, REQ-483 hand-off rounds) — delete what the runner makes redundant rather than keeping both paths.

Design to settle in the ticket before coding: Workflows vs a DO-alarm-driven step loop (Workflows step limits, wall time, payload sizes, how a model stream is delivered to the panel from a step); where step state lives (D1/R2/junction); how stop works mid-step.

## Test plan

- `test_UAT_FC_<id>_job_survives_step_kill`: a job of three builder steps where the second step's execution is killed once completes all three, runs step 1 once, and step 2 twice at most.
- `test_UAT_FC_<id>_job_independent_of_client`: the client's stream is closed after the job starts; the job still completes and its results are in the transcript and the site.
- `test_UAT_FC_<id>_repeat_failure_ends_with_notice`: a step that fails twice ends the job with the Carry on notice, and no further steps or spend.
- `test_UAT_FC_<id>_one_job_per_site`: a second job for the same site while one runs is queued, not run in parallel.

## Decisions (operator, via EPIC-19, 2026-11-01)

Answers to the four questions this ticket's session raised (its design recommendation is accepted: Cloudflare Workflows, one instance per consultant turn; `POST /api/ai/prompt` only starts the instance and streams it as rejoin does; the junction is the checkpoint, and a retried step calls the framework's `SessionManager.resumeTurn` (REQ-175); stop and mid-turn messages keep going through the D1 inbox; the held-round hand-off, automatic carry-on and lost-turn burial for this work are deleted).

1. **Checkpoint granularity: finer, but not in this ticket.** Each builder pass becomes its own step, so a kill mid-build doesn't throw the pass away and the consultant and builder are never resident together. That needs a non-blocking Delegate in the framework, **lagrange-framework REQ-232** (`request-1c773208`), and the 1st Contact side is **REQ-627** ("Long work, part 2: each builder pass is its own durable step"). This ticket is part 1: one step per consultant round, as recommended, built so that part 2 slots in (the round ends at the Delegate once REQ-232 lands).
2. **Size: split.** This ticket is part 1 only: the runner, the per-round steps with `resumeTurn`, the in-memory state that must survive between steps, deleting the REQ-483 held-round and carry-on paths it replaces, and the tests. Part 2 is REQ-627.
3. **Scope: the Site consultant and its builders only.** The Settings and DNS assistants and group-chat rooms stay as they are for now.
4. **No Workflows binding (the `1c` CLI, Node suites): agreed.** A small in-process runner behind the same step interface, so the step code and resume logic are one path and only the driver differs.

Also: lagrange-framework BUG-105 (the record cache that never evicts) is `free_coded` there but not yet in the framework copy 1st Contact loads. Picking it up and deploying is the quickest relief and is worth doing ahead of this ticket.


## Settled design (part 1, this session, 2026-11-01)

**Step = one consultant round.** A round is one framework turn on the site session: one `promptStream` model-and-tool loop until the model ends it. The REQ-409 continuations (layout, review, promise cues and the rest) and queued client messages drained after the work are each a further round, so each is a further step. A Delegate runs inside its round's step, as today, until REQ-627 makes it its own step.

**Runner.**
- A `ConsultantTurn` Workflow (`[[workflows]]` binding) runs one instance per consultant turn, and the instance id is the turn's id.
- The step body is one function behind a small `TurnRunner` interface. Without a Workflows binding (the `1c` CLI, Node suites), an in-process runner drives the same function: same step code and same resume logic, a different driver.

**Checkpoint and retry.**
- The junction is the checkpoint, so the host is built with `resumeOpenTurns`. A step that finds its round's turn still open calls `SessionManager.resumeTurn`. Finished tool results, including finished builder passes, are kept. The call that was in flight is reissued: for a Delegate, the pass starts again.
- The step counts its own attempts in a durable record written before each attempt, so the count holds whether or not the platform charges an isolate kill against the step's retry budget. A step's second failed attempt ends the job: the turn closes `lost`, the panel shows BUG-294's notice and the Carry on button, and no further steps run (so no further spend).

**State between steps.** Per-turn continuation state (continuations left, owed cues, the round's cue) is the step's returned value, which Workflows persists. Steps return small JSON and never records. Per-site state that today sits in isolate Maps and must outlive a step is re-derived from the junction or the D1 chat ticket at the start of each step, or else stored there.

**Streaming to the panel.** Steps write to the junction DO. `POST /api/ai/prompt` starts the instance, opens the D1 turn row, and returns `streamTail` from the turn's cursor, the same path rejoin (`/api/ai/reattach`) uses. That makes it one way to deliver a stream.

**Stop.**
- Mid-step: the D1 inbox, polled by the step every 2 s, as today.
- Between steps: the runner checks for a pending stop before starting the next round, and a pending stop ends the job.

**One job per site.**
- The junction lease serialises as today. A prompt that arrives while a job runs takes the existing `answered()` path (talker reply, or queued on the junction).
- The job's last step drains queued messages as further rounds. Nothing else starts a second job for the site while an instance for it is running.

**Deleted.**
- The REQ-483 held-round hand-off (`heldRounds`, `ROUND_HANDOFF`, `cue:'continue'`, the panel's `continueWork`).
- Automatic carry-on (BUG-312 `cue:'lost'` / `carryOnOwed`) and lost-turn burial for consultant job turns.
- BUG-294's notice and the manual Carry on button stay, as the job's terminal failure.

**Scope:** the Site consultant and its builders only. Settings and DNS assistants and group-chat rooms keep today's request-bound path.

## Test plan, part 1 (supersedes the first bullet above, whose builder-step form is REQ-627's)

- `test_UAT_FC_REQ-624_job_survives_step_kill`: a job of three rounds where the second round's step is killed once completes all three. Round 1 runs once, round 2 at most twice, and a tool result finished before the kill is not run again.
- `test_UAT_FC_REQ-624_job_independent_of_client`: as above.
- `test_UAT_FC_REQ-624_repeat_failure_ends_with_notice`: as above.
- `test_UAT_FC_REQ-624_one_job_per_site`: as above.
- `test_UAT_FC_REQ-624_runs_without_workflows_binding`: with no Workflows binding, the in-process runner completes the same multi-round job through the same step code.
- `test_UAT_FC_REQ-624_held_round_path_removed`: `cue:'continue'` and `cue:'lost'` are no longer accepted for the site consultant, and the panel no longer sends them.
- Item 5: the measured peak memory per step kind (consultant round with and without a Delegate) is recorded on this ticket from a dev run.

## What landed (part 1, 2026-11-01)

The settled design above, built, with these refinements found while building it.

**Where the job's records live.**
- The junction refuses record kinds it does not know.
- So `job_start`, `job_step`, `job_end` and `host_event` travel as `heartbeat` records with `turn_id: job:<id>`. A heartbeat only counts for a claim of that id, so the framework's readers (claims, activity, the archive fold) step over them.
- `job_start` records the junction offset the job starts at. Every read a step makes of its own records starts there, never at 0.

**What the follower streams.**
- Any event kind the junction has no record of is written as a host event when it happens, so the follower can show it. That covers `site_changed`, `plan_changed`, `show_client`, and the host's own lines and progress (the recovery lines, "stuck again", the budget notice).
- Every round's first words, and every host line, open a paragraph of their own in the live stream ([[BUG-241]]).
- A round that threw a second time ends the job with that error. The follower rethrows it, so the route shows it scrubbed of secrets and the `1c` CLI prints it, as before.

**Retry and resume.**
- A retried step retracts the claim of the attempt before it, without ending its turn: the runner only retries once that attempt is gone. Otherwise the turn would read as still driven for the 30 s lease, and resuming would be refused.
- The step loads the session before it asks for the open turn: a fresh isolate's manager has not loaded it yet.
- The Workflows step retries `MAX_STEP_ATTEMPTS` (2) times. The job's own attempt count decides, so a third try finds the attempts spent and ends the job lost without running anything.
- A failed attempt is logged as `job_step_failed`, with the job, the step and the error, in Workers Logs.
- A step returns plain JSON. The framework's event objects cannot cross a Workflows step boundary.

**When a job counts as running.** A job with no `job_end` runs while a round holds the session's claim, or while its runner has written one of its own records within the last 60 s. That way a Worker without the binding whose isolate died frees the session within a minute, instead of holding it until the message ceiling.
- While a job runs:
  - a new prompt is queued or goes to the talker;
  - a rejoin follows the job to its end;
  - `openSession` reports the session live;
  - the job's open turn is never buried as lost by a reader.
- A turn left open outside any job (an older build, a process killed before its job started) is still closed lost by the next reader or prompt.

**The ledger and the panel.**
- The job closes the turn's ledger row: the Workflow's last step does it, or the in-process runner's end hook does. The route's follower closes it only when it followed no job of its own (it queued, or the talker answered).
- A follower whose client left stops following. In-process work keeps the request open until it ends.
- The prompt's own stream can now end `lost`. The panel paints BUG-294's notice and Carry on for it, as it does for a rejoined stream.
- The panel sends no `continue` or `lost` cue: not on an older origin's `continues`, and not on a reopen whose failure says `carry`.
- The last job ending lost is reported as `stopped` on the next `openSession`, until the client writes again.

**Removed.**
- `heldRounds`, `ROUND_HANDOFF`, `handOffRounds` and `HANDED_OFF_DETAIL`.
- The `continue` and `lost` cues on `/api/ai/prompt`, which now return 400 "unknown cue".
- `carryOnOwed`, `isLostCarryOn`, `lostContinuationCue` and `LOST_RECOVERING_LINE`. The `lost-continuation-cue` template stays in priming, so turns already on old sites stay hidden.
- The panel's `continueWork`, `LOST_CUE` and `CONTINUE_CUE`.
- `tests/support/whole-message.ts`.
- The REQ-483, BUG-312 and BUG-320 (lost cue) suites, and the BUG-324 panel suite. The BUG-324 workers suite now stages its dead turn on a REQ-409 continuation cue.

**Still open.** Item 5's measured peak memory per step kind, from a dev run, is not recorded yet. It needs a deployed dev run with the Workflows binding, and this session could not run one.

## Test evidence (part 1)

`tests/test_UAT_FC_REQ-624_durable_consultant_job.workers.test.ts` runs on the real Workflows engine, junction Durable Object and D1. Only the model is a double; a step's death is the host's `setStepFault` seam, which abandons the step mid-flight and clears the isolate's memory.

**`job_survives_step_kill`**
- Three rounds, round 2 killed after its first tool finished.
- The rounds complete with attempts `[1, 2, 1]`.
- No tool run is repeated, the ones finished before the kill included.
- One ledger row, `complete`.

**`job_independent_of_client`**
- The client's stream is cancelled before the job does anything.
- The job still runs to its end: the page is added, the reply is in the transcript, the session is not live, and the row is `complete`.

**`repeat_failure_ends_with_notice`**
- Both attempts at round 1 are killed.
- The stream ends `lost` with `carry: false` and no operator detail; the row reads `lost`, "failed 2 times".
- Exactly two model calls are made, the open turn is closed lost, and no further step runs.

**`one_job_per_site`**
- A second message sent during a job starts no job of its own.
- It is answered, and no two turns are ever open at once.

**`runs_without_workflows_binding`**
- The same three-round job runs on the in-process runner, with attempts `[1, 1, 1]`.

**`held_round_path_removed`**
- `continue` and `lost` cues get a 400, and no ledger row is opened.

`tests/test_UAT_FC_REQ-624_panel_follows_the_job.test.ts` (jsdom, real `webui-chat`):
- **`held_round_path_removed_from_the_panel`:** no cue is sent on `continues`, nor on a reopen that says `carry`, and the notice and Carry on are painted.
- **`a_job_that_ends_lost_ends_the_prompt_with_carry_on`:** the prompt's own stream ending `lost` paints the notice. Carry on sends the client's ordinary message.

Suites updated because they asserted the removed hand-off:
- BUG-249 and BUG-277: one ledger row per message.
- BUG-229: nothing but the job's own records lies past the archive watermark.
- REQ-438: the hold tagging covers the message's first round; the review continuation rounds it used to cut off now run.

Every other workers and node suite matches clean `xgd-working`, failure for failure.