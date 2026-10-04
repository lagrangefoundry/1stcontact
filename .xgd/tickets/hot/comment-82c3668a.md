---
uid: comment-82c3668a
id: COMMENT-4891
type: comment
title: Comment on bug BUG-200
created_by: xgd
created_at: '2026-10-04T16:18:11.387442+00:00'
updated_at: '2026-10-04T16:26:35.220325+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-150e776e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a55a50fa-c911-48df-b961-c336a3058138",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="35b9bd99-c10c-4614-b7c8-3fe140e792ec-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T16:17:10.679160+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="35b9bd99-c10c-4614-b7c8-3fe140e792ec-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T16:26:34.595902+00:00" -->
#### Claude
I've read the ticket and the panel code; now tracing the server side of the ask route before cutting the branch.

Now writing the change: server side first (`plan-core.ts`), then the panel.

Now the edits, in the branch worktree.

Server done. Now the panel: multi-select ticks save a draft, and a Done / "None of these" button answers.

Now the UATs. Let me see how the existing workers suite observes the turn's notice so I can reuse that.

Writing the two UAT files: a workers suite for the route/notice, and a jsdom suite for the panel.

Now the jsdom panel suite.

Running both suites plus the REQ-364/REQ-379 neighbours.

Two fixes: a duplicated helper in my jsdom file, and the fresh worktree lacks the control-app generated artifacts (a known worktree gap). Checking how they're built.

All 7 files pass. Confirming the BUG-200 jsdom cases actually ran rather than being skipped by the webui gate, and running typecheck/lint.

All 10 BUG-200 cases ran and pass. Checking the project's typecheck/lint scripts.

Typecheck clean. Before committing, checking my notes on how this repo's version bump and `free_coded` gate interact.

Now lock and merge back into xgd-working.

Merged cleanly. Quick re-run of the plan suites on the merged xgd-working before promoting.

BUG-200 is fixed and merged into xgd-working, and the ticket is at `free_coded`. Ticking boxes on a multi-select no longer answers the question. It stays open until the client presses Done.

**How it behaves now**
- **Ticking and unticking** keeps the question in "Needs your answer" with every box shown as ticked. The ticks are saved as a draft, which isn't an answer: the question is still counted as open and the consultant isn't told about it.
- **One button finishes the question.** It reads **Done** when something is ticked and **None of these** when nothing is. Pressing it saves the whole selection at once, moves the question to the answered list, and the consultant hears about it once on their next turn. "None of these" reaches them as `answered features: "none of these"`.
- **Ticks survive** a panel refresh and a page reload, because the draft is saved.
- **"Change"** on an answered multi-select reopens the same boxes, ticked as saved. The old answer stands until Done is pressed again.
- **Single-choice and typed questions** still save the moment they're picked or left, as before.

**Under the hood**
- `/api/plan/ask` takes a new `draft` action. A draft only works on a multi-select and only with that question's own options; anything else is refused and nothing is saved. Answering or skipping, by the client or by the consultant filling it in, clears the draft.
- A multi-select can now be answered with an empty list, which is what "None of these" sends. On the features question, that marks any features previously chosen as no longer wanted.
- The changes are in `plan-core.ts`, `plan-panel.js`, `config.js` and `builder.css`.

**Tests:** I added 10 tests in two files, `test_UAT_FC_BUG-200_plan_panel_multi_select.test.ts` and `test_UAT_FC_BUG-200_multi_select_waits_for_done.workers.test.ts`. Together with the existing plan-panel tests (REQ-364 and REQ-379) that's 35 passing, both on the branch and after the merge, and the TypeScript type check is clean.

**Ticket:** I added a "What landed" section to the ticket body and kept the original text. The fix is commit `58fd117e`, and the version bump to 0.2.484 was made automatically when the ticket moved to `free_coded`. The branch has been deleted. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->