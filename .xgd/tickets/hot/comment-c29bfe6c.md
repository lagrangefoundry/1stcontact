---
uid: comment-c29bfe6c
id: COMMENT-5566
type: comment
title: Comment on bug BUG-256
created_by: xgd
created_at: '2026-10-23T01:13:28.665565+00:00'
updated_at: '2026-10-23T01:45:51.107310+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d1d76a26
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "16158836-d9eb-46bc-8ff9-66b6cc730287",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="57da369f-d465-46d3-a445-7c96dc57a7b4-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T01:11:14.060870+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="57da369f-d465-46d3-a445-7c96dc57a7b4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T01:45:49.321069+00:00" -->
#### Claude
Reading the ticket and mapping the code paths it names: the hold chain in `host-core.ts` and the framework's queue drain. No code changes yet.

Mapped all five items. Item 5 extends `runTool`'s existing BUG-253 repeat-refusal count, which covers only `ReportResult` today, to every tool. Checking how the toolbox renders a refusal.

I have the design for all five items. Recording it on the ticket, then cutting the branch.

Branch cut. Setting the worktree up so tests can run, then reading the REQ-415 hold UAT to use as the harness model.

The worktree runs the workers UATs. Starting the host changes: drain, hold pre-emption, and following the lost race. Reading `siteTurn` first.

Writing the host changes now: a shared tail projection, the drain, and following a lost race.

Items 1 and 2 typecheck clean. Moving to item 3, the stuck-finding detection and fix-round cap in `hostLook`. Checking the `LayoutFinding` shape first.

Item 3 typechecks. Now item 5: extending the repeat-refusal count in `runTool` to every tool.

Item 5 typechecks. Now item 4, the heading check. Reading how the existing layout-check UATs drive a real page.

Item 4 is written. Next, a Chromium layout UAT for it.

The Chromium layout suites skip in the worktree. Checking whether they run from the main checkout.

Existing layout suites pass with my heading-check change. One of my new fixtures isn't being reported; debugging that.

Both pass. Checking the first test isn't vacuous: what it finds now, and that the old check reported "Marine".

The old check reproduces the incident on this fixture ("Marine" to…, "make the space below it at most 15px"), and the new test fails against it. Confirming the new output:

Item 4 verified. Now the workers UATs for items 1, 2, 3 and 5. Reading the scripted-model harness.

Writing the workers UAT file for the host behaviours. It uses a structurally clean site fixture so REQ-422's structure faults don't mask the layout hold.

The second builder wrote identical content, so nothing changed and the host didn't look. Making each builder write something different.

All four pass. Checking they fail against the code as it was before my changes.

They fail on the old code. Now the regression scope: the hold, talker, queue and refusal suites that exercise `host-core`.

Both failures exist without my changes, so they're pre-existing. Running the second half.

All six are pre-existing too. Now the 29 node-side host suites.

Most of these look environmental (sockets, webui resolution in a worktree). REQ-182 ("no priming prose is a TypeScript constant") and REQ-146 could be mine. Checking those two directly.

REQ-182 passes now. Baselining the remaining node failures against the unchanged sources.

All 27 fail without my changes as well, so my diff adds no regressions. Committing on the branch, then updating the ticket.

Now the ticket: adding what landed, the test map and the known gaps to the body, keeping the existing content.

Merging the branch back into xgd-working under the merge lock.

Ticket is `free_coded` at version 0.2.588. Setting story points and cleaning up the branch.

Done. Recording two non-obvious findings in memory.

BUG-256 is fixed, merged into xgd-working and parked at `free_coded` (version 0.2.588, 8 story points). I haven't promoted it to reconcile. All six new UATs pass and fail against the old code.

**Why the client's messages went unanswered.** At 00:35 the client reloaded the page. The reloaded panel's view of the running turn stopped when the first-draft round ended at 00:41:39. It didn't follow the hold round the host started straight after, so the panel thought the consultant was idle. The three messages therefore went as new prompts to `/api/ai/prompt` instead of to the talker. Each one found the session busy and was queued on the junction. Nothing ever ran that queue: the framework only drains it on its `startTurn` path, and this host runs its turns through `promptStream` directly. That was a fault in our host code, not in lagrange-framework, so I fixed it here and filed no framework ticket.

**What changed:**
1. **Queued messages are answered.** When the request holding the session finishes its rounds, it runs every queued message in order, each as a turn of its own with its content intact. A message that arrives while the session is busy waits and streams its own reply back to the client. If nobody holds the session, it takes the session and answers itself.
2. **A waiting message ends the hold.** At the end of each round, a queued message stops any further host continuation (layout, review, promise or budget), and the message runs next.
3. **A hold gives up on a finding that doesn't move.** If a fix round leaves a finding in place with its measurements within 2px, the host stops holding for it. The consultant is told it can't be fixed this way and not to start another builder for it. A client message now gets at most 3 fix rounds before the host stops holding.
4. **The heading check is fixable.** When the text below a heading sits inside a drawn box such as a card, the check measures to the box's edge. It no longer compares against the text inside the card. A reported finding says what the space is made of (the heading's own space, the layout's gap, the space at the top of what follows). It names the part to change, and says when that isn't the heading.
5. **Repeated refusals stop.** On the third identical refusal of the same tool call in a row, the refusal tells a builder to report what it couldn't do. Anyone else is told to stop and take another way.

**Tests.** The two new UAT files are `tests/test_UAT_FC_BUG-256_a_hold_does_not_keep_the_client_waiting.workers.test.ts` and `tests/test_UAT_FC_BUG-256_the_heading_check_names_what_it_can_fix.test.ts`. On the card-grid fixture, the old check reproduces the incident's "make the space below it at most 15px". The hold, layout-check and heading regression suites pass. Fifteen other suites fail, and fail the same way without my changes. Examples are BUG-129, REQ-295, REQ-342 and the reconciliation suites. The Chromium layout tests only run in this sandbox with `CHROMIUM_LAUNCH_ARGS=--single-process`; without it they skip.

Two sentences the host now says to the consultant are kept in `priming.json`, because REQ-182 rejects long prose literals in `host-core.ts`.

**Known gaps, recorded on the ticket:**
- The settings conversation also runs turns through `promptStream` and still doesn't drain its queue.
- A reloaded panel still thinks the consultant is idle during a host hold. Messages sent then are now answered and streamed back, but the panel's busy indicator is wrong.
- If the talker fails, a message delivered after the round's last tool call can be answered twice: once by the new drain, once by the panel's fallback prompt.

<!-- xgd-chat-end -->