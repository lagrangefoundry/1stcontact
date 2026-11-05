---
uid: comment-e87cfec3
id: COMMENT-5785
type: comment
title: Comment on request REQ-477
created_by: xgd
created_at: '2026-10-27T20:48:26.232192+00:00'
updated_at: '2026-10-27T21:32:01.368162+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-52d5c6aa
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "492c64fa-b303-4eb0-8a6d-cc108f29a080",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-27T20:48:20Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-27T20:48:20Z" -->
#### You
The consultant launched into the first draft without asking me about the hero image motion - that seems wrong?

<!-- xgd-chat role="assistant" ts="2026-10-27T20:48:20Z" -->
#### Claude
It never searched for the first-draft guide (DOC-75); the only prompt is a per-turn reminder line. Proposed: (1) the host delivers each stage guide once when its step starts; (2) a host check refusing the first build until the signature effect is discussed or declined.

<!-- xgd-chat role="user" ts="2026-10-27T20:48:20Z" -->
#### You
I think 2 is going too far - 1 is fine if you are confident we are only giving the consultant context characters it needs.

<!-- xgd-chat role="assistant" ts="2026-10-27T20:48:20Z" -->
#### Claude
Guides are 0.8-1.9K chars (first draft 1.4K). One guide per step, once per site, resent only on reopen; the per-turn reminder line is removed so the always-on tail shrinks. The first-draft guide is made self-contained on the signature effect. No host check.

<!-- xgd-turn id="1a98a4f0-08b9-4173-9c6b-fc379d3840d7-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T20:55:49.762757+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1a98a4f0-08b9-4173-9c6b-fc379d3840d7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T21:31:58.184343+00:00" -->
#### Claude
Reading the ticket and the reminder/priming wiring; next I'll map the stage triggers that already exist before cutting the branch.

Still mapping: the plan already has stages with states (in_progress/done, reopen), so stage-start detection exists. Checking the stage list and how host text can ride into a turn's history.

Checking the framework's `promptStream` options to see whether a turn can carry host-only content alongside the client's words.

I have enough of the shape; now checking how stages get started and reopened (host tick vs. consultant mark), since the triggers and "resend on reopen" hang on that.

Settled design. Now confirming a few field names (story board notes, stage-state constants, template helper) before writing the core module.

Design is settled. Recording it on the ticket and starting the free-coding flow: status → `free_coding`, then cut the branch.

Now the core module. First, a quick look at the DOC-75 ticket (the source of the guide text, for the §3 edit).

Writing the pure core module (guide parsing + due rules + sent record) in the branch worktree.

Moving `GuideSent` into plan-core (avoids a type cycle) and adding the field to `PlanFields` and `PLAN_KEYS`.

Now the note template and the strip helper in roles.ts, and removing the `method` reminder line from priming.json (spliced textually per the priming.json memory).

Now the roles.ts helpers, placed beside `openingCue`.

Now wiring host-core. Checking the remaining call sites that read the prompt before editing.

Adding the guide state, the hand-over function, and the HostDeps seam.

Now the Worker wiring: the system KB bundle's DOC-75 text.

Typechecking.

Code typechecks clean. Now the DOC-75 edit (ticket §3): making the first-draft guide self-contained on the signature effect.

DOC-75 updated in the ticket store. Now the UATs; checking how REQ-473's test reads the real corpus so mine reads what ships.

The cached priming's route paragraph still says to search for a stage's guide on reaching it; updating it to say the host hands it over and search is for reconsidering (both priming shapes).

Now the UATs. Looking for an existing UAT harness that drives consultant turns with a plan and captures the model requests.

The BUG-285 harness (real host, real manager, scripted model) fits. Checking for an in-memory plan helper for tests.

Harness is clear. Checking the plan surface's decision op so the mid-turn test uses the real tool.

Writing the UAT file.

Simplifying the tool-result extraction in the mid-turn assertion.

The reopen fixture is unrealistic: the real port's `settleStages` reopens self-ticking stages whose facts aren't met. Checking the facts to build realistic fixtures, and the first failures.

Fixtures need to satisfy the stage facts (the real port re-settles stages). Checking `draftReviewed`.

Now nothing is delivered — likely `checkPlan` rejects the fixture on write and `guidesDue` swallows it. Checking.

All 5 REQ-477 UATs pass. Now updating the four existing tests that pinned the removed reminder line (superseded by this ticket).

Keeping the REQ-473 regex phrase on one line by rewrapping the route sentence.

REQ-473 green again. Now a wider regression sweep over suites touching priming, reminders, host turns, transcripts and plans.

Node sweep: 838 passed, 8 failed — mostly UI/pane suites that look unrelated. Baselining those 8 in the main checkout (clean xgd-working) to confirm they're pre-existing.

20 workers failures; baselining them on clean xgd-working to separate mine from pre-existing.

18 of the 20 are pre-existing. Two only on my branch: BUG-289 and BUG-294. Rerunning them alone to check for flake vs. real.

BUG-294 passes alone (flake). BUG-289 is real — reading it.

The `set_design` result now carries the site-plan guide (design written → that step starts), as designed; the test's helper parses the whole result as JSON. Checking its helpers.

Workers regressions resolved. Measuring the numbers the ticket asks to record (guide sizes, reminder-tail change).

Quick review of the host-core diff before committing.

Diff is as intended. Committing on the branch.

Now updating the ticket body (preserving the existing text, adding what landed and the settled triggers/measurements) before the merge-back.

Ticket body updated. Now the merge-back: lock, bring xgd-working into the branch, bump the version at the branch tip, fast-forward.

The merge hit a conflict (and the bump ran mid-merge; I'll redo it after). Inspecting the conflicts.

Both sides are independent additions (REQ-476 landed next to mine); keeping both.

Typecheck clean. Committing the merge with only the resolution, then the version bump as its own commit at the tip.

Also running the incoming REQ-476 suite on the merged tree, since its code sits next to mine.

Green. Bump at the branch tip, then fast-forward xgd-working and record the ticket.

A ticket commit landed on xgd-working in between (the race the memory warns about). Re-merging xgd-working into the branch and fast-forwarding in one step.

Another ticket (REQ-475) already claimed 0.2.683, so bumping again to 0.2.684 at the tip and fast-forwarding.

Fast-forwarded with the bump at the tip. Running the overlay rematerialize, then the free_coded gate immediately.

zsh didn't split the SHA list; retrying with explicit args, and using `xgd ticket-store rematerialize` for the overlay check.

Moved to `free_coded`. Checking the warning the gate printed, then setting story points and cleaning the branch.

REQ-477 is in: the host now gives the consultant each stage guide when that step starts, and the "At a stage, read its guide" reminder line is gone. The ticket is at `free_coded` (version 0.2.684), with the code merged into xgd-working and the branch cleaned up.

**How it works**
- **Triggers** come from the site's plan. For example, the first-draft guide arrives once the page plan (`pages_navigation`) is recorded and before any build, and the design guide arrives once there's a direction but no design yet. The full list is in the ticket.
- **At the start of a turn**, the guide is added after the client's own words under a host line. It stays in the conversation history, but a reloaded chat strips it, so the client never sees it.
- **During a turn**, if a tool call starts a step, the guide is added to that tool's result. This handles the Dina case: recording the page plan brings the first-draft guide before the build is started. A tool result doesn't survive into the saved history, so the next turn sends that guide once more.
- **Once per site:** each guide is recorded on the plan when it's sent. When its stage is finished the record is cleared, so reopening the stage sends it again.
- The guide text comes from the knowledge-base bundle the Worker ships with, so there's no second copy. If the knowledge base hasn't been built, no guides are sent.

**Measured** (also on the ticket)
- A turn that gets a guide grows by 0.8–2.1K characters plus about 115 for the host line. The first-draft guide is now 2,067 after the edit below.
- Every turn's reminder tail is 64 characters shorter.

**DOC-75 edit:** the first-draft guide now covers the signature effect on its own: what it's for, options matched to the client's photo, not settling for "keep motion minimal" without asking, and how to view motion ("Open in new tab", "View on your phone"). It no longer says "see finishing touches".

**Two things I changed beyond the ticket's wording**
- The cached instructions told the consultant to search for a guide when it reached a stage. That now reads "When a stage starts, the host hands you its guide. To reconsider one, search your knowledge base for its guide".
- Tool results that start a step now carry an extra text block after the tool's own answer. This broke one test helper (BUG-289) that read the whole result as JSON; I fixed the helper.

**Tests**
- All five REQ-477 tests pass. They run through the real host with the shipped DOC-75 and a scripted model.
- I updated four older tests that required the removed reminder line (BUG-65, REQ-171, REQ-182, REQ-473).
- Wider sweep: 26 failures across about 140 Node and 140 Worker test files. 26 of those fail the same way on clean xgd-working. BUG-294 failed in the batch but passed when run alone. BUG-289 was the helper above.

**Before it reaches dev:** the guides come from the built knowledge base, so the DOC-75 edit only ships after the knowledge base is rebuilt and dev is redeployed (`bin/deploy --env dev`).

Duplicate guides are possible but rare. If the plan save fails because the plan changed underneath it, nothing is sent that time, and the guide can go out later. On the Node CLI, where the conversation stays in memory, a guide sent during a turn can appear twice. That doesn't happen on the Worker, which rebuilds the conversation on every request.

<!-- xgd-chat-end -->