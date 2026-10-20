---
uid: comment-2e572211
id: COMMENT-5528
type: comment
title: Comment on request REQ-416
created_by: xgd
created_at: '2026-10-20T13:42:11.153749+00:00'
updated_at: '2026-10-20T14:16:01.301432+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-be4190c8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "083d9930-05fa-47f3-a111-eeae5534e875",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f95a45f5-c7b0-4b4d-b1a7-8b0245f5f519-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T13:41:42.797473+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f95a45f5-c7b0-4b4d-b1a7-8b0245f5f519-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T14:15:59.160478+00:00" -->
#### Claude
I'm reading the framework's worker/talker API (LF REQ-210/209) before scoping changes to 1st Contact.

I'm mapping two sides in parallel: the framework's host contract for worker/talker and the status widget, and 1st Contact's current consultant role, message queue, working line and priming.

While those run, I'll move the ticket to free_coding and cut the branch.

Worktree ready. Waiting on the two survey agents before designing the changes.

Reading the framework's `startTurn` to see how a talker is opened, since our Worker rebuilds the AI manager on every request.

Both survey agents are still running: one on the framework's worker/talker and status-widget contract, one on 1st Contact's consultant role, message queue, working line and priming. I'll design the change once they report.

So far:
- **Ticket:** REQ-416 is at `free_coding`.
- **Branch:** `free-REQ-416` is cut, with the shared packages linked in and the generated files copied over.
- **Framework support:** the framework's AI library already has the talker, and the builder chat already uses the framework chat component, which has the talk composer and the status widget with Stop building.

There is one structural problem to solve. The framework only opens a talker inside the same running process as the build. Our Cloudflare Worker builds a fresh AI manager for every request, so a message the client sends mid-build arrives in a different process. My working plan:
- The request running the build picks the message up from the existing inbox and opens the talker itself.
- The talker's reply streams back to the client on the build's own stream, and the browser routes it into the talk bubble.

I'll confirm this against the agents' reports before writing code.

The framework report is in. It confirms the talker has to be opened inside the request that is running the build. It has no hook for adding our own text to the talker's reminder, so I'll add a role reminder that only speaks while our own build stream for that session is open. The status widget's wording is fixed, so "The consultant is …" will go into the progress text we send it. I'm waiting on the 1st Contact survey before changing anything.

Both surveys are back, so I have enough to design the change. I'm checking whether our backend wrappers pass the framework's fork options through.

Enumerating the consultant's actual tool grant so the withheld list can be checked against it.

Story-board themes are free-form, so I'm checking the consultant's priming for a fixed list of story areas to report coverage against.

I'll tag pinned notes with one of seven story areas from the plan seed, which lets the talker's reminder list exactly which areas are still empty. Now writing the server side.

Now story-core: the optional `area` on notes and the missing-areas function.

Now the talker setting. Listing every tool in the surfaces the consultant can be granted, so each one is classified as withheld or allowed.

Adding the talker's per-exchange discovery reminder as a priming template and a provider that only renders while a talker round is running.

Now the roles.ts edits.

Now the priming.json additions: the talker templates and the reminder entry.

Now the method text, in both priming variants (with and without a knowledge base).

The em dash is stored escaped in the file. Adjusting the match.

Now cadence-core: the talker round must not move the status line, and notes need a numeric estimate for the widget.

Now host-core. Reading the turn path in full before changing it.

Now the durable stop request, alongside the existing inbox on the chat ticket.

Now session-inbox.ts, reusing its compare-and-set write for a second field.

Now the host-core turn path: the talker desk, progress from working notes, and the fork capability.

Now the fork capability on the consultant's backend, and the reminder binding.

Now `tailSession`, so a reattached page routes talker records and doesn't end at a talker's `turn_end`.

Removing the old `working` event kind from host-core.

Server side is wired; now type-checking it.

Type-check passes. Now the browser side. Checking what the chat controller exposes.

The controller exposes `talk`, so messages waiting from before a reload can be adopted into talk bubbles. Now reading the transport functions in `api.js`.

I'm replacing the working line in `chat.js` with a small talker desk that routes talker frames off the build's stream into the talk bubbles.

Making the open-stream count synchronous, so a talk message adopted during a reload never falls back before the rejoin stream starts.

Attachments now go to the talker too. Updating the chat mount itself in `paint()`.

Deleting the old working-line CSS.

Now finding the tests this change supersedes.

Running the affected suites to see what actually breaks.

Now the wording tests (BUG-205, BUG-234), the REQ-390 wire test and REQ-386.

Removing the superseded BUG-224 interposition test; the talker UAT will replace it.

All six pass. Now the browser-side suites.

BUG-64 and REQ-127 may be pre-existing (a memory notes upstream BUG-64 drift). Checking them on a clean main checkout.

Both fail on the clean checkout too, so they're pre-existing. Adapting the REQ-390 tracker test to the status widget.

That passes. Now the new REQ-416 UATs, starting with the end-to-end talker test on the Worker. Checking how existing tests read the plan.

Writing the end-to-end talker UAT on the Worker. Checking how existing tests open the settings conversation.

All five pass. Now the browser-side UAT. Reusing the BUG-224 panel test's harness.

Writing the panel UAT on the same pattern.

Both new suites pass. Now the wider regression: tests touching priming, the plan surface, the story board, and host-core.

161 files are affected. Running them detached in batches of 20, so the run survives this turn.

While the sweep runs, I'm reading my notes on this project's `free_coded` gate.

Updating the ticket body with what was built, keeping the operator's text intact.

The temp directory doesn't exist in the worktree. Retrying via `$TMPDIR`.

Ticket body updated. Checking the sweep.

First batch is green. Reviewing my diff while the rest runs.

Tidying the comments that still describe the deleted working line.

Two batches green. Reviewing the `chat.js` diff meanwhile.

Waiting on the remaining sweep batches.

Waiting on the remaining regression batches before committing and merging.

A memory note says REQ-295 delegation suites fail on a clean tree. Checking REQ-208 and REQ-295 against the main checkout.

All three fail identically on the clean checkout, so they're pre-existing. Waiting for the remaining batches.

Still running the last batches; I'll pick up when they finish.

The node-project batches have many failures. I need to see whether my change caused them.

Only one failure is new: REQ-171 "nothing is stated in two places". Looking at it.

The reminder tail has a 600-character budget, and my longer "announce long work" line pushed it to 693. Shortening the addition.

Now REQ-342 from the workers batch: checking whether it fails on the clean checkout too.

Pre-existing as well. The only regression my change caused (REQ-171) is fixed. Committing on the branch.

Committed. Taking the merge lock and merging into xgd-working.

The merge conflicts in `roles.ts`; another session changed it on xgd-working meanwhile. Resolving by hand.

Conflict resolved: both sides' imports kept. Type-checking and running the REQ-416 suites on the merged tree before committing the merge.

Merged. Moving the ticket to free_coded, letting the gate bump the version itself.

The ticket is free_coded at 0.2.552 with both commits recorded. Cleaning up the branch.

REQ-416 is built and merged into xgd-working, and the ticket is at `free_coded` (version 0.2.552). While the consultant builds, the client's messages now get an answer straight away from a second round of the consultant (the "talker") instead of waiting for the build to finish.

The new tests pass: 5 end-to-end on the Worker, 3 in the browser panel. I ran the 161 test files that touch this area. Every failure except one also fails on a clean checkout, so they were already failing: REQ-208, REQ-295, REQ-342, BUG-64, REQ-127 and the Node-host suites. The one new failure was mine (a reminder went over its 600-character limit) and is fixed.

**The talker**
- `talker.json` lists what the talker may not do:
  - start a build;
  - move stages;
  - choose a look;
  - place, generate or edit images;
  - any site write or publish.

  It gets the refusal "That's part of the build that's running; I'll pick it up as soon as it's done." Everything else is allowed, including story-board notes and panel questions.
- A test fails if any tool the consultant has is in neither list. It checks both with the consultant's own site writes off (as shipped) and on.
- The settings assistant has no talker.

**Where it runs.** Our Worker starts a fresh AI manager for every request, but the framework can only open a talker inside the request that is running the build. So:
- The client's message still goes to the existing BUG-224 inbox.
- The build's own request checks the inbox every 2 seconds and opens a talker for each message.
- The talker's reply comes back on the build's own stream, and the browser draws it under the client's message.
- A message the build finishes before picking up runs as the next prompt, so nothing is lost.

**Status widget and Stop building.** Our working line is deleted and replaced by the framework's status widget, which shows "The consultant is …" with a clock and Stop building. Stop now actually ends the build: it's stored on the chat ticket for the build's request to act on. That needed the consultant's model connection to support interrupting a round, which it didn't before.

**Priming**
- Pinned notes can now name one of seven story areas (how it started, the craft, the people, and so on). The talker's reminder lists the areas with no note yet, open panel questions, the next-pass rule, and "answer how it's going from the build's status".
- New consultant sections: build sooner and leave story-heavy copy until later; end the build hand-over with a story question; say where things are and what can change now at every hand-over.
- The opening message now tells the client to keep talking while the consultant builds.

**Existing tests I changed**
- Superseded and removed: the BUG-215 working-line panel suite, and BUG-224's "message goes into the next model call" test (the talker replaces that).
- Updated: BUG-205, BUG-234, REQ-360, REQ-386 and REQ-390 now read the status from the new progress frames.
- Renamed: one REQ-357 test needed a transport key renamed.

**Limitations you might notice**
- A reply arrives only on the browser stream that is running the build. If the client reloads mid-build, the reply is saved but may not show until the build ends.
- Talker rounds aren't written to the per-turn spend rows.
- In group chats, mid-turn messages are still passed into the running turn as before.

The ticket body has an "Implementation (as built)" section covering all of this.

<!-- xgd-chat-end -->