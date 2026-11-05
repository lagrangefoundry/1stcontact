---
uid: comment-11ab8a6d
id: COMMENT-6226
type: comment
title: Comment on request REQ-624
created_by: xgd
created_at: '2026-11-01T16:59:07.396562+00:00'
updated_at: '2026-11-01T19:36:01.546003+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f48d9e15
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1c4bb070-e356-4eed-a9c8-812d0968ad16",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="87096032-aecd-44fe-9a74-cfa7f53f1917-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T16:57:42.184550+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="87096032-aecd-44fe-9a74-cfa7f53f1917-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:07:28.574303+00:00" -->
#### Claude
Reading the ticket and mapping how a consultant turn runs today (prompt route → junction DO → framework), so I can settle the design questions the ticket asks for before any code.

Wrangler 4.111 / miniflare 4.2026-07 both run Workflows locally, and vitest-pool-workers 0.18 can introspect workflow instances, so the Workflows option is testable here. Waiting on the code map of today's turn path.

I haven't written any code yet. The ticket asks for the design to be settled before coding, and four decisions are yours to make. Here is what I found first.

## How a turn runs today
- **One request runs everything.** The consultant's turn, including every builder pass, runs inside one `POST /api/ai/prompt` request in one isolate.
  - The turn loop lives in `tools/generate/src/cli/ai/host-core.ts` (8.4k lines) plus the framework's `SessionManager.promptStream`.
  - A Delegate is a builder model session started inside the consultant's tool call (`delegation_toolbox.js` `_runWorker`). The consultant waits on that one tool call for the whole build, often several minutes.
- **No durable runner exists.** Nothing uses Workflows, Queues or Durable Object alarms. `ctx.waitUntil` only lets a turn outlive a closed tab, and only within the same request's limits.
- **Pause points don't survive the isolate.** The pause points between REQ-483 rounds are held as live generators in the isolate's memory, so a follow-up that lands in another isolate is refused (409). About 40 per-site Maps in `host-core.ts` are also isolate-only.
- **The framework can already resume a turn, but nothing here uses it.** REQ-175 added `SessionManager.resumeTurn` with the `resumeOpenTurns` option. It re-runs a turn that is still open on the session log ("junction"): finished tool results are kept, and each unanswered tool call is reissued or aborted. 1st Contact has never called it.

## My recommendation
1. **Use Cloudflare Workflows, one instance per consultant turn.** `POST /api/ai/prompt` would only start the instance and then stream it the way rejoin does today (`streamTail` reading the junction). That leaves one way to deliver a stream, and the browser tab no longer matters.
2. **Make the junction the checkpoint.** Each step drives one round. If a step dies, Workflows retries it and the retry calls `resumeTurn`, so finished tools, including finished builder passes, aren't redone. Only the call that was in flight gets reissued. A second failure of the same kind ends the turn with the BUG-294 notice and the Carry on button.
3. **Keep stopping and mid-turn messages as they are.** Both already go through the D1 inbox, which the running step checks every 2 s, so they work unchanged inside a step.
4. **Delete what the runner replaces:** the held-round hand-off (`heldRounds`, `ROUND_HANDOFF`, the continue cue), automatic carry-on for this work, and lost-turn burial for these turns.

A Durable Object alarm loop would also work. But Workflows gives retries, attempt counts and inspection for free, and the architecture policy (item 8) already names it.

## Questions before I start
1. **How fine should the checkpoints be?** The ticket says each builder pass is its own step. Taken literally, the framework's Delegate would have to stop blocking: the consultant's round ends at the Delegate call, the build runs as its own step, and its result feeds the next round. My option above gets the ticket's guarantee (nothing finished is redone or lost) one level coarser: the build that was running when a step died is reissued from the start. A rebuilt build could rejoin the builder's half-finished turn instead of restarting, but that needs a framework change. Either way, the framework part would be a framework ticket, not code from here. Which do you want?
2. **This is bigger than one free-coded ticket.** I estimate well over 20 points: the runner, retiring the in-memory state that has to survive between steps, deleting the REQ-483 and carry-on paths, and the tests. You usually prefer folding to splitting, so I'd keep one ticket and land it as several commits in phases. Or would you rather split it?
3. **Which sessions are in scope?** The site consultant and its builders certainly. Should the other assistants (Settings, DNS) and group-chat rooms move too, or stay as they are for now?
4. **What runs it where there's no Workflows binding?** The `1c` CLI and the Node test suites have no Workflows. I'd add a small in-process runner behind the same step interface: same step code and same resume logic, just a different driver. That leaves one code path, with only the scheduler swapped. OK?

One more thing: the memory fix (framework BUG-105) is `free_coded` in lagrange-framework, but the framework copy 1st Contact actually loads hasn't picked it up yet. Until it's re-vendored, each step still carries that memory growth.

Once you answer, I'll write the settled design into REQ-624, set it to `free_coding`, cut the branch and start.

<!-- xgd-turn id="6bbc84b4-9bd1-4908-9865-57c203909bdc-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:15:59.792882+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="6bbc84b4-9bd1-4908-9865-57c203909bdc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:17:04.598951+00:00" -->
#### Claude
Yes, I'm ready to code. Your answers settle the four questions, and I've added two sections to the end of REQ-624 without changing your text:

- **Settled design (part 1):**
  - One step is one consultant round. The follow-up rounds the host cues itself (layout, review and the rest) and any queued client messages each become further steps.
  - The round's work is kept in the session's log, so a step that dies picks up where it stopped via `resumeTurn`. A builder pass that was running when it died starts again.
  - The step keeps its own durable attempt count, so a second failure ends the job with the Carry on notice no matter how the platform counts a killed isolate.
  - Continuation state passes from step to step as the step's small JSON result.
  - `POST /api/ai/prompt` starts the job and streams it the same way rejoin does, which leaves one way to deliver a stream.
  - Stop: the step checks the D1 inbox during a round, and the runner checks for a pending stop between rounds.
  - Only one job runs per site, held by the existing lease. The job's last step works through queued messages.
  - Deleted: the REQ-483 held-round path, automatic carry-on, and lost-turn burial for these turns.
  - Only the Site consultant moves; the other assistants and group-chat rooms keep today's path.
- **Test plan, part 1:** your first test describes a job of three *builder* steps. That shape is part 2 (REQ-627), so for part 1 I've restated it as a job of three *rounds*. A tool result finished before the kill must not run again. I've also added two tests your decisions imply:
  - `runs_without_workflows_binding`: the in-process runner, for when there's no Workflows binding.
  - `held_round_path_removed`: the old continue and carry-on cues are refused, and the panel stops sending them.

Two things I'll check while building, because the design depends on them:
- **How Workflows treats a killed isolate.** Whether it counts against the step's retry budget, and whether a step can run in the same isolate as ordinary requests. Your item 5, bounded memory per step, depends on the second.
- **The REQ-483 and BUG-312 tests.** Their suites test the paths being deleted, so they'll be removed or rewritten as part of this ticket rather than left failing.

Reply "go" if that rewording of your first test is right, and I'll set REQ-624 to `free_coding`, cut `free-REQ-624` and start.

<!-- xgd-turn id="16e8b663-3f28-4caa-b191-6ac00f495282-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:25:58.562034+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="16e8b663-3f28-4caa-b191-6ac00f495282-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:26:58.671292+00:00" -->
#### Claude
The design section I said I'd added never landed: `--append-body` took the `-` literally and appended just that character. Fixing that now, and keeping the new title you set.

Yes, I'm ready to code. Your decisions settle all four questions, and the new "part 1" title matches the scope.

I also need to correct my last message. I said I'd added the design to the ticket, but that write failed: the update command treated `-` as the text to add instead of reading what followed, so the only thing appended was a lone `-`. I've removed it and written the two sections properly at the end of REQ-624, leaving your text untouched:

- **Settled design (part 1):**
  - **Step:** one step is one consultant round, using the Workflows runner, plus a small in-process runner where there is no Workflows binding.
  - **Checkpoint:** the session's log is the checkpoint, and a retried step picks up through `resumeTurn`. A builder pass that was running when its step died starts again.
  - **Repeat failure:** a durable attempt count ends the job with the Carry on notice on the second failure.
  - **State and streaming:** continuation state passes between steps as small JSON, and `POST /api/ai/prompt` starts the job, then streams it as rejoin does.
  - **Stop:** stop is checked inside a step and between steps.
  - **One job per site:** the existing lease keeps it to one job per site, and queued messages run as further rounds.
  - **Deleted:** the REQ-483 held-round path, automatic carry-on, and lost-turn burial for these turns. The Site consultant is the only assistant that moves.
- **Test plan, part 1:** your first test described three *builder* steps, which is part 2 (REQ-627), so I restated it as three *rounds*. I added two tests your decisions imply:
  - `runs_without_workflows_binding`
  - `held_round_path_removed`

The ticket is now `free_coding`, and the branch `free-REQ-624` is cut at `~/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-624`. If the rewording of your first test is wrong, say so and I'll change it before the tests are written.

I'll start with two things the design depends on:
- **How Workflows treats a killed isolate:** whether the kill counts against the step's retries, and whether a step shares its isolate with ordinary requests.
- **Moving the work behind the step:** taking the per-turn state `host-core.ts` keeps in the isolate's memory and moving it behind the step interface.

The existing REQ-483 and BUG-312 suites test the paths being deleted, so they'll be removed or rewritten as part of this ticket.

<!-- xgd-turn id="93dc906c-d3fd-4dd4-b2e0-9a4f85381487-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:35:03.511429+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-turn id="93dc906c-d3fd-4dd4-b2e0-9a4f85381487-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T19:36:00.556623+00:00" -->
#### Claude
Worktree is set up; now reading the turn path in `host-core.ts` (streamPrompt → answered → continuedTurn → siteTurn) to find where the per-round step boundary goes.

Reading how the route builds the host (`chatHost`, scope, deps) so a background step can rebuild it outside the request.

Next: listing which events the host makes up itself rather than reading from the junction, because a job that's followed through the junction has to carry those too.

Writing the probe: a throwaway workflow class and test, deleted once answered.

The probe answered both questions: a workflow step shares module state with the test, and a step that throws is retried. I'm removing the probe and checking what the host needs from `env` and scope.

Now reading `streamTurn` and the turn-log API, because the job takes over closing the ledger row.

Design is settled against the code. Now starting the `host-core.ts` refactor: the message loop becomes a resumable per-round step with serialisable state.

Now checking how a reader in one isolate sees junction writes made by another, because the browser's request follows a job that runs elsewhere.

Writing the job code: the new `answered`, plus the per-round `messageRound` that replaces `continuedTurn`'s loop.

Splicing the new code into `host-core.ts`, with a few corrections found on review: `job_start` records its own offset, a job carries its view, and errors are scrubbed by the route.

Now the smaller `host-core.ts` edits: remove the hand-off, let `siteTurn` resume a turn, make rejoin follow a running job, and stop burying turns a job will resume.

Removing the automatic carry-on cue and its template, then wiring rejoin and session open to follow a running job.

Running the type checker on the changed modules.

`tools/generate` type-checks; what's left are the control-app references to removed symbols. Next is the control-app side: the route, `streamTurn`, the Workflow class and its binding.

Rewriting the router: deleting the held-round machinery and the two cues, then adding the job runner choice and ledger hand-over.

Now `streamTurn`: hand the ledger to the job, stop following when the client leaves, and scrub a job's error text.

Adding the `CONSULTANT_TURN` binding to the env type and writing `turn-job.ts` (the Workflows runner and the workflow's run loop).

Control-app type-checks clean. Re-checking `tools/generate`, which also covers the router.

Server side compiles. Now the panel: removing the `continue` and automatic `lost` cues from `builder/chat.js`.

Panel updated. Running existing worker suites around turns and continuations to see where the job path differs from the old live stream.

The framework rejects unknown record kinds on the junction, so the job's records need to use a kind it accepts. Checking which kinds are allowed.

The framework file contains NUL bytes, so grep treats it as binary (a known quirk here). Re-searching with `grep -a`.

The junction only accepts the framework's own record kinds. Checking whether heartbeat records can carry the job's markers without affecting how claims are resolved.

Heartbeat records whose `turn_id` matches no claimed turn are ignored by every framework reader, so the job's markers can travel as heartbeats under a `job:<id>` turn id. Switching to that.

Big improvement: the BUG-256 and REQ-306 suites now pass. Three BUG-277 cases remain; reading what they expect.

BUG-277 passes. Next: removing the suites that test the deleted paths and updating `tests/support/whole-message.ts` and its users.

Deleting the suites for the removed paths, then looking at BUG-324 and the BUG-249 hand-off assertion.

Fixing the BUG-249 suite's hand-off assertion next, then running the wider worker set.

117 pass, 11 fail. Some of these failures are known on clean `xgd-working`, so I'm running the same five files in the main checkout as a baseline.

Five of the eleven fail on clean `xgd-working` too, so they're not mine. That leaves six caused by this change: BUG-229 (×2), REQ-146, REQ-307 (×2) and one REQ-416 case. Looking at REQ-146 first.

Liveness now counts the job's own records or a live claim, which a reader burying a dead turn can't fake. Type-checking and rerunning REQ-307 and REQ-146.

Both pass. Now BUG-229 (exact junction byte counts) and REQ-416's stop case.

BUG-229 passes. For REQ-416's stop case I need to see what the extra third model request actually is, so I'm making a throwaway copy of the test that prints it.

I'm adding the test seam (a step fault, raced against the step's work) to `runJobStep`, so both runners can be killed mid-step the same way.

Writing the UATs. First checking the iteration budget per round and how a resumed turn's first request looks, since the scripted model has to recognise rounds.

The consultant's budget is 200 model calls a round, so building a three-round job by exhausting calls is slow. Looking for a test seam that shortens a round.

Writing the REQ-624 worker UATs.

Three of the six pass. Dumping the ledger detail and the job's records for the failing cases to see why.

The failure is a `DataCloneError`: the round's terminal event is a framework `StreamEvent` class instance, and a Workflows step can only return plain data. Converting it to plain JSON.

The kill case now times out after the kill, so I'm adding temporary trace lines in `runJobStep` to see how far the retry gets.

The client-independence failure is just the page's file name (`services.json`). The other two now time out, so I'm adding the trace lines back temporarily.

Loading the session didn't help: `openTurn` still returns null while the junction has the turn open. Reading the framework's `openTurn`.

The resume now works: the round continued after the kill and all three rounds ran. Checking which assertion still fails.

The snapshot of finished tool runs was read from the Durable Object before the write-behind had landed the latest one. The test will wait for it before killing.

All six REQ-624 UATs pass. The test plan also says the panel no longer sends the old cues, so I'm adding a panel-level UAT based on the BUG-294 panel suite's harness.

Writing the panel UAT, run in jsdom with the real `webui-chat`.

Panel UATs pass. Now the wider regression run: the full node project in three batches, as the memory notes recommend, then the full workers project.

macOS `split` lacks `-n`, so that call ran the whole node project at once, and it finished inside the time limit. The script's count lumps skips in with failures, so I'm extracting the real failures.

84 failures across about 60 files; many look environmental (ports, the worktree's location, and so on). Running exactly those files in the main checkout as a baseline.

Both remaining failures also fail on clean `xgd-working`. For the other new node failures, checking whether those suites even import the changed modules.

Rerun on their own, they pass, so those were load flakes in the full run. Checking the workspace-origin suite on its own.

42 failures across the three worker batches. Baselining exactly those files in the main checkout.

11 failures are new with this change. Reading their messages.

A cluster of these (#show events) comes from host-made events the job doesn't record yet. Checking which event kinds `host-core` emits itself.

The `show_client` fix is in. Now BUG-38: a round errors when the session is served by an isolate that never opened it. Capturing the error.

Those two REQ-431 cases also fail on clean `xgd-working`. Next, BUG-322 and REQ-438.

The stage tick happens in the route, before the turn, so the refinement guide should be due when the round starts. Tracing `guidesDue` to see why nothing was sent.

`deps.stageGuides` is missing on every call. Checking where it's set.

REQ-438 shows the consultant making five extra requests, which suggests extra continuation rounds. Printing what each consultant request was for.

After the hand-back the host keeps continuing because it thinks a review is still owed, five times. Reading `critiqueOwedFor` to see which state differs from the old path.

REQ-438 passes. Before rerunning the full suites, sweeping the source for leftover references to the deleted hand-off and carry-on paths.

Those remaining hits are BUG-284's speak-first hold, which is unrelated. Rerunning the full workers project to confirm the fixes made since the first pass.

Workers project: no failures beyond those on clean `xgd-working`. Rerunning the whole node project.

Both type checks are clean. Reading my notes on this repo's version bump and the `free_coded` gate before committing.

Committing the work on the branch. Checking recent commit messages for this repo's convention first.

Committed. Now bringing the ticket body up to date with what was built, without touching the existing sections.

Ticket updated. Now the merge back: lock, merge `xgd-working` into the branch, bump the version, then fast-forward back.

Merged cleanly, but other tickets landed changes, including in shared files. Re-running the type checks and this ticket's suites on the merged tree.

REQ-628's new suite uses the removed `wholeMessage` helper. Adapting it in its own commit rather than in the merge (reconcile only carries ordinary commits).

The key suites pass on the merged tree. Since host-core and the router changed under me, rerunning the full workers and node projects once more before handing back.

Five failures aren't in my earlier baseline, which was taken before the merge. Re-baselining those files against the current `xgd-working` tip in the main checkout.

Some of these new node failures are static scans of the source (REQ-190, REQ-194), so the new code could plausibly trip them. Running them alone to read the messages.

Following the recipe that has worked here: merge back with `xgd-merge`, then call `move-to-free-coded` without `--version` so the gate does the bump itself.

Merged into `xgd-working`. Now moving the ticket to `free_coded` with both commits.

Now cleaning up the branch and worktree, as its own call.

Done. Saving two non-obvious findings to memory: the junction's record-kind rule with the Workflows test facts, and the worktree's knowledge-base bundle getting overwritten.

The "Worker message spans requests" memory is now wrong, since this ticket removed the hand-off. Updating it along with the others.

The memory index needs trimming below 17 KB. Shortening the longest index lines.

The automatic cut left broken fragments, so I'm writing the index by hand with short, complete hooks.

I've finished the free-coding of REQ-624, part 1, and it's on `xgd-working`. The ticket is at `free_coded` with three commits (63b6cbcb4a, dd61206075, plus the 0.2.732 version bump) and 13 points. One item in the ticket is still open: I haven't measured peak memory per step kind (item 5), because that needs a dev run with the Workflows binding, which I couldn't do from here.

**What it does now**
- **The request only starts the work.** `POST /api/ai/prompt` for the Site consultant starts a job and streams it from the session log; the request no longer runs the turn. The job runs each round of the message as one step: on Cloudflare Workflows where the `CONSULTANT_TURN` binding exists (added to every environment in `wrangler.toml`), otherwise the same step code in-process (the `1c` CLI and the test suites).
- **A step that dies is resumed, not redone.** The retry picks the round's open turn back up through `resumeTurn`: finished tool results are kept and only the call in flight is reissued. A step's second failed attempt ends the job with BUG-294's notice and the Carry on button, and nothing runs after it.
- **The job doesn't need the tab.** If the client goes away, the follower stops and the job carries on; reopening the session or rejoining follows the job to its end. The job, not the request, closes the turn-log row.
- **One job per site.** A message sent while a job runs goes to the talker or the queue, and the job answers queued messages as further rounds.
- **Removed:** REQ-483's held rounds and `continue` cue, BUG-312's automatic carry-on and `lost` cue (both cues now get a 400), the panel's sending of both, and lost-turn burial for a turn a running job owns.

**Changes from the settled design, found while building it**
- **Job records ride heartbeats.** The session log refuses record kinds it doesn't know, so the job's own records are stored as `heartbeat` records. Every framework reader ignores them.
- **A retry first releases the dead attempt's claim.** Without that, the turn would look owned for the 30 s lease and the resume would be refused, so a 1 s retry would have queued instead.
- **A job counts as running only while it's alive.** That means a round holds the session's claim, or the job has written within the last 60 s. A Worker without the binding whose isolate dies therefore frees the session within a minute rather than an hour.
- **Two failed attempts end the job.** The ticket said "fails the same way twice"; I count any two failures of the same step, without comparing the errors.

**Tests**
- **New:** six worker UATs on the real Workflows engine (the four from the ticket's test plan, plus running without the binding and the old cues refused) and two panel UATs. All pass.
- **Rewritten or deleted:** suites that tested the removed hand-off and carry-on paths were rewritten or deleted. In REQ-438, the host's review follow-up rounds now actually run (before, the test's request ended at the hand-off), so its assertion now covers only the first round.
- **Full runs:** the full workers and node projects show no failures beyond those on clean `xgd-working`.
- **Already failing on `xgd-working`** after REQ-626/628 landed: BUG-278, BUG-284, REQ-198, REQ-190 and REQ-194 (the last two are tripped by `notifications.ts`). These aren't from this ticket.

Deploying will create the `1stcontact-consultant-turn-production` Workflow. Framework BUG-105 still isn't in the framework copy 1st Contact loads, so each step still carries that memory growth until it's re-vendored.

<!-- xgd-chat-end -->