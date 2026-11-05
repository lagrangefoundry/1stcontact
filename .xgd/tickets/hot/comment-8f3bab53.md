---
uid: comment-8f3bab53
id: COMMENT-5570
type: comment
title: Comment on request REQ-436
created_by: xgd
created_at: '2026-10-23T16:18:11.911531+00:00'
updated_at: '2026-10-23T17:09:51.515303+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-37e96d99
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7d6bf31a-5667-4225-965b-53d791bc2c91",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-23T16:18:08Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-23T16:18:08Z" -->
#### You
Let's talk about the turn length. With talker vs worker I think we can be fairly generous with worker run length if talker is responsive.

<!-- xgd-chat role="assistant" ts="2026-10-23T16:18:08Z" -->
#### Claude
Agreed — length did no harm while the talker answered. What hurt: a host hold with no talker (the 02:09 'ok' queued), loops, results only at the end. Proposed: a talker beside every long turn, stop after builds that change nothing, announce finished pieces, plus a generous backstop ceiling by time or spend.

<!-- xgd-chat role="user" ts="2026-10-23T16:18:08Z" -->
#### You
Time is easiest to understand, but spend is what we actually care about — I don't think it really matters, let's put a 1 hour limit on it. If we cut the worker off I want to give it warning so it can end gracefully and not leave the user hanging. Please create a ticket.

<!-- xgd-chat role="assistant" ts="2026-10-23T16:18:08Z" -->
#### Claude
Filed REQ-436: 60-minute configurable ceiling; warning at 50 minutes (finish, no new builds, report); graceful host end at 60 with the client told what is done and left (worker's report, else the talker), unfinished work kept as plan tasks; talker beside every turn including holds; stop after two no-change builds; finished builds announced with a link.

<!-- xgd-turn id="f8fd7d1f-7274-4f8c-b142-c6c6b527402c-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T16:28:21.402075+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f8fd7d1f-7274-4f8c-b142-c6c6b527402c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T17:09:47.928598+00:00" -->
#### Claude
I'm reading the ticket and mapping the host/talker code (host-core.ts, router.ts, session-inbox.ts) before cutting the branch. Next I'll find where turns, holds, the talker and builds are driven.

Still mapping the design: I've read the turn loop (`continuedTurn`/`siteTurn`/talker desk) and BUG-256's fix; now checking how the 02:08 hold lost its talker so part 2 fixes the real gap.

Checking how the browser panel decides a turn is still running (that's where the 02:09 "ok" went astray), then I'll settle the design.

Found the existing spend-ceiling machinery (it already refuses new builders when over budget) — I'll reuse it for the time warning. Reading it now.

Confirmed a Stop on the consultant's round also stops its running builder, so the ceiling can reuse Stop. Checking what tools the talker may use (for the close-out reply).

Checking which record kinds the session junction accepts, so the warning and the ceiling can be recorded there.

Found the page-link helper (`showHref` in show-core.ts) to reuse. A few more reads (the progress poll and the existing UAT harness), then I'll cut the branch and start coding.

Branch `free-REQ-436` is cut and its build artifacts copied in. Linking the shared framework packages, then running a baseline of the talker and hold UATs before I change anything.

Baseline: 13 pass, 1 fail. The failure is the known pre-existing REQ-416 hand-over-line assertion, red on clean working too. Now writing the code, starting with config and templates.

Templates added. Now the clock config and its accessor.

Delegate refusals are in place. Now the host side in `host-core.ts`: the per-message clock, the build tally and announcement, the ceiling in the talker desk, and the prompt-to-talker route.

Now pointing `hostLook` at the shared helpers and having it flag a look that moved no finding.

Tally, refusal and build announcement are wired. Now the ceiling itself in the talker desk's poll: the warning record at 50 minutes, and at 60 the talker close-out followed by Stop.

Now `continuedTurn`: start the clock per message, note a report after the warning, end holds once closing, and end at the ceiling as a completed reply.

Now part 2: a prompt that arrives while the session is held goes to the running round's talker, and the request follows that reply.

Now a typecheck.

Typecheck is clean. Re-running the talker and hold suites against the change.

Writing the REQ-436 UAT suite: warning and refusal, ceiling with talker close-out, ceiling with the worker's own report, talker during a hold, idle builds, and the build announcement.

Three of six pass (idle builds, announcement, ceiling with the worker's report). Looking into the stop not reaching the running builder.

The delegation runtime already tracks running builders (`runtime.pending`). I'll register that per site so the ceiling can stop them by session.

Passes. Tidying two awkward lines in that rewrite.

Now a wider regression run: the whole workers project.

12 failures across 8 files. Baselining those same files on the clean main checkout to separate pre-existing ones from mine.

Unchanged at 200262 on both, so this branch adds nothing to priming. Now the node-project suites that touch the modules I changed.

The workspace-origin ones are the known worktree location artifact (webui resolution). BUG-168's turn-clock test is new, so I'm looking at it.

Passes. Re-running the full workers project after that change.

Same 12 as clean working; nothing new. Re-checking the related node suites.

Environmental: the control-app's built assets aren't present in a fresh worktree. Now the control-app typecheck, since it compiles host-core too.

Clean. Running the REQ-436 suite twice more to check it isn't timing-flaky.

Stable across runs. Committing, then updating the ticket body.

Committed. Updating the ticket body. I'll re-read it first in case it changed, and keep its content.

Ticket body updated. Merging back, following the recorded recipe: lock, merge `xgd-working` into the branch, bump, sparse-safe merge, then the `free_coded` gate.

Merged cleanly; other sessions had changed `progress-core.ts` meanwhile. Checking what came in and re-running my suites on the merged tree before landing.

Typecheck clean and 19/19 pass on the merged tree. Committing the bump and landing it.

Ticket is at `free_coded` with both commits and version 0.2.598. Cleaning up the branch.

Saving one non-obvious finding for future sessions: the upstream Stop defect.

I've implemented REQ-436. It's merged into `xgd-working` and the ticket is at `free_coded`, with commits `1b1b347` and `c668987` and version 0.2.598. I haven't promoted it to `ready_to_reconcile`; that's your call.

**What it does now**
- **One-hour ceiling with a warning.** The clock covers one client message and every host hold that continues it. It's set in `turn-clock.json`: 60 minutes, warning 10 minutes before the end.
  - **At 50 minutes** the consultant is told before each model call to finish, start no new build, put unfinished work on the plan with `set_task`, and report. From then on a new build (`Delegate`) is refused and no hold starts. A "Finishing this part up." status is recorded on the junction.
  - **At 60 minutes**, if the consultant hasn't reported since the warning, the talker is prompted to put what's unfinished on the plan and tell the client what's done and what's left. Then the round and any running builder are stopped. The client gets an ordinary finished reply, not a "stopped" one.
- **A talker beside every turn, holds included.** Every round already had a talker; the gap was elsewhere. After a reload, the panel only follows one round, so when the 02:08 hold continued the work it thought the consultant was idle and sent the "ok" as a new prompt. That prompt was queued behind the hold. Now a prompt that finds the session busy goes to the talker, its reply streams back to the client, and the hold carries on.
- **Builds that change nothing stop.** After two builds in a row that change nothing (no page written, or the same findings at the same measurements), the consultant is told to stop and report, and any further build in that message is refused. A new client message resets the count.
- **Finished pieces are announced.** A build that changes a page prompts the talker to tell the client in one line, with a link to the page.

**Decisions you may want to revisit**
- **This replaces part of BUG-256.** BUG-256 made a message end the hold; now the hold continues and the talker answers. I renamed and rewrote BUG-256's first test to match: it still checks the message is answered with its photo and the reply reaches the sender, but no longer checks that the hold ended. Sessions without a talker keep BUG-256's behaviour. This is recorded in the REQ-436 body.
- **Every page-changing build is announced,** with no "long turn" threshold. The talker can stay silent if it has already said so.

**A framework bug to file.** In lagrange-framework, a Stop on the consultant stops reaching its running builder once a talker reply has opened and closed beside it. This affects the client's own Stop button too. For the ceiling I worked around it by stopping the builder sessions directly. The fix belongs in a lagrange-framework ticket, which I haven't filed; say if you want me to.

**Tests**
- The 6 new tests in `tests/test_UAT_FC_REQ-436_long_worker_turns.workers.test.ts` pass, and passed on three runs. They run the real route with a scripted model and the ceiling set to seconds.
- The full workers suite: 1704 pass. The 12 that fail also fail on a clean `xgd-working` checkout; one is the known REQ-416 priming test.
- In the related node suites, the only new failures are the builder workspace-origin tests, which fail in a fresh worktree because the control-app's built assets aren't there.
- My suites still passed after merging in other sessions' newer changes.

<!-- xgd-chat-end -->