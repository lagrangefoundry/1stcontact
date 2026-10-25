---
uid: comment-62eb8842
id: COMMENT-5552
type: comment
title: Comment on request REQ-424
created_by: xgd
created_at: '2026-10-21T22:03:12.901386+00:00'
updated_at: '2026-10-21T22:37:24.979217+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4fe39719
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "cbdeb153-884f-4f2d-86ad-5f9023f6778e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="84b5759a-78dc-463e-a209-667e9b5f56bf-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T22:01:49.829515+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="84b5759a-78dc-463e-a209-667e9b5f56bf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T22:37:23.990627+00:00" -->
#### Claude
I'm reading the builder code BUG-245 and BUG-246 touched (comparison board, plan panel, story board, plan-core, priming) so I can design focus tasks on the same completion path.

Still mapping the code: tracing how BUG-245's "board finished" notice reaches the consultant, since focus-task completion should reuse it.

Reading the questions panel and app wiring next; then I'll design the focus-task model.

Now the app.js wiring: show handling, panes, cues, and the view report.

Reading the plan routes in the router (questions, comps, board) to add the focus task's Done route beside them.

Design is taking shape; checking how the talker's discovery prompt is built so it can stand down while a focus task is open.

I have the shape. I'm recording the design on REQ-424, setting it to `free_coding`, and cutting the branch.

Now writing the code. First the plan model (`plan-core.ts`) and seed config.

Plan model's focus section is in; now wiring it into the plan's writes, checks, panel view, reminder and operations.

Cleaning that up: extracting story-core's pin into a plain function rather than the indirect call.

Now simplifying the plan-core side to use it.

Surface declared. Now the host side: switch delivery for `start_focus`, the talker's withheld tools, and the cue.

Now the notice and the generalised `finished` cue (session-delta, router, roles, host-core, priming template).

Now the talker: stand down from discovery while a task is open.

Server side is in. Now the browser: API call, a shared focus banner, and the three surfaces.

Writing the shared focus banner and its styles (kept outside the story board's no-`var()` region).

Now the story board.

Now the comparison board.

Now the questions panel.

Now app.js: the cue on finishing, and no switch under unsent text.

Code paths are in. Now the priming: a "focus tasks" section describing the cycle, in both priming variants.

Updating BUG-245's tests for the renamed cue, then writing REQ-424's UATs.

Writing the host-side UATs now; first checking how BUG-245's browser test mounts the builder.

Adding the cue to the injectable chat transport, then writing the host-side UAT file.

Running the new host UATs.

Only assertion formatting (pretty-printed JSON). Fixing those.

Host UATs pass (6/6, talker included). Now the browser-side UATs for the surfaces and the builder.

Debugging why the builder didn't cue — checking the order of site selection vs. the first plan read.

Browser UATs pass. Checking the typing-guard test actually fails without the guard.

Mutation check confirms the test bites. Now the regression scope: suites around the plan, boards, panel, show, talker, cue and priming.

Both failures are pre-existing on the main checkout (unrelated to this change). Now the priming-related suites.

These look like the known `logDir`/`junctions` upstream drift. Collecting the failing files and baselining them on the main checkout.

All pre-existing except `BUG-129_priming_fits_the_deployment_grant`, which is mine. Looking at it.

Priming is 1,416 chars over its 200k budget — my priming section largely repeats the `start_focus` description. Tightening both.

BUG-129 passes. Updating my priming assertion to the new wording.

All batch-4 failures are pre-existing too. Rerunning batch 2 after the description trims.

Only the two pre-existing failures remain. Typechecking, then committing.

Typechecks clean. Committing on the branch.

Committed. Updating the ticket body with the final implementation and test plan before merging back.

Now merging back: lock, merge into xgd-working, rematerialize.

Nothing to rematerialize. Moving the ticket to `free_coded` (letting the gate do the version bump).

`free_coded` with both commits (the code and the gate's 0.2.578 bump) on xgd-working. Cleaning up the branch.

The memory index is near its read limit; compacting it by grouping related entries.

Finishing the memory compaction (rewriting the index), then I'll summarise.

REQ-424 is built and merged into xgd-working. The ticket is at `free_coded` with both commits recorded: the code (`9932993d36`) and the gate's version bump to 0.2.578. I didn't need to ask you anything. I haven't watched it with a real model or on dev: the evidence is the tests, run against a scripted model.

**How it works**
- **Starting a task.** The consultant calls a new tool, `start_focus`, for one of three kinds: questions, story board or comparison board. The talker can call it too, so a task can start while a build runs. The task's surface is brought in front of the client the same way `show_client` does it. If the client is busy, or has unsent text in the message box, they get a link instead.
- **Keeping it small.** A story task covers at most 8 new notes; the number is set in `plan-seed.json`. Later notes are tagged "New" and go into the next task, which covers only what's new.
- **While a task is open.** The host refuses a new question, a new note or a new comparison site on that surface, and refuses a second task. The talker's reminder switches from discovery to "leave them to it". The consultant's per-turn plan summary shows the task and its progress. An `end_focus` tool closes a task the client has walked away from.
- **On screen.** The surface gets a banner with the consultant's one line, the progress ("4 of 8 notes reacted to") and a Done button. Items still waiting are outlined in blue.
- **Finishing.** A task finishes when every item is answered, skipped or reacted to, or when the client presses Done. The next notice to the consultant names what the client did (the notes they hearted, or "pressed Done with 2 of 3 left"). The browser then starts the consultant's resuming turn.
- **Priming.** A short new section describes the cycle: gather, focus, resume.

**Decisions you might want to revisit**
- **One cue, renamed.** To make this "the same completion path as BUG-245", I replaced BUG-245's `comps_finished` cue with a single `finished` cue. It covers both a finished comparison board and a finished task, and BUG-245's test was updated to match.
- **Board tidiness is priming only.** The consultant is told to merge near-duplicates and keep each theme to its strongest notes; nothing merges them automatically.
- **Short priming.** My first draft pushed the consultant's priming over the 200k-character cap that BUG-129's test enforces. The detail now lives in the `start_focus` tool description, and the priming section is short.

**Tests**
- The 12 new REQ-424 tests pass, covering the routes, the talker during a build, the three surfaces, and the whole builder. I checked that the "client is typing, so don't switch" test fails when the guard is removed.
- In the regression run over about 125 related test files, every failure also fails on the main checkout without my change. The failing suites are `REQ-416_worker_and_talker` (one test), `REQ-398`, `REQ-285`, `REQ-342`, `REQ-295`, and the `logDir`/`junctions` group (`REQ-122`, `REQ-131`, `REQ-174`, and the assistant-conversation suites).

The ticket body now records what was built and the tests. Promoting it to `ready_to_reconcile` is your call.

I also saved two notes to my memory (the near-full priming budget and the 500ms wait before a cue is sent) and regrouped the memory index into five topic files to keep it under its size limit.

<!-- xgd-chat-end -->