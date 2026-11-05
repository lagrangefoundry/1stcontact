---
uid: comment-1d3da8c9
id: COMMENT-5593
type: comment
title: Comment on request REQ-444
created_by: xgd
created_at: '2026-10-24T16:01:48.485155+00:00'
updated_at: '2026-10-24T16:12:33.841052+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4525405d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "27fbae29-fa82-41f9-8d45-4cc8c4636e68",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="36e08233-a5d9-4b17-83c9-f9024ec6e399-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T16:00:20.163632+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="36e08233-a5d9-4b17-83c9-f9024ec6e399-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T16:12:29.436500+00:00" -->
#### Claude
Ticket is well-specified; I've cut the branch and am reading the builder's `storyFirst`, help and focus code before changing it.

Still tracing where the consultant is told the first draft exists, so the "lead with the link" steering goes in the right place.

Writing the code now: builder first (app.js, help.js, opened-views.js, config), then the consultant steering line and priming sentence.

Builder side done. Now the consultant steering line and priming sentence.

Now the UATs. Let me run the existing REQ-408 pane suite first to see the jsdom harness works in this worktree.

New UATs pass (5/5). Running the adjacent regression scope: REQ-408/431/433/442, BUG-246, REQ-428 agenda, and the priming suites.

The BUG-63 failure is the worktree missing `apps/control-app/src/generated/` (known setup artifact; passes on the main checkout). Checking the priming budget suite too.

My priming sentence adds ~125 chars against a budget that runs close to its cap, so I need the BUG-129 suite. Copying the generated artifacts into the worktree first.

All green, including BUG-129 (it now passes, where clean code was 34 chars over). Running lint and typecheck on the changed files.

Code and tests done. Updating the ticket body (keeping existing content, recording what landed and the test-plan change), then committing and merging back.

Committed. Now lock, merge xgd-working into the branch, bump the version at the tip, and fast-forward back.

Merged into xgd-working (fast-forward; the ticket overlay check found nothing to change). Moving the ticket to free_coded.

REQ-444 is done and merged into xgd-working. The ticket is at `free_coded` with commits `7eb0cba5…` (the change) and `834f8a39…` (version 0.2.614) and 3 story points. I didn't need to ask you anything first, because the ticket already settled the questions that mattered.

**What the client now sees**
- **The preview switches to View when the first draft lands**, whether the client got to Input by the host or by following one of the consultant's links. That second route is the Dina's Diner case. If they're typing in a text box in Input, the switch waits until they leave it. Moving between text boxes inside Input keeps it waiting, and if the client changes the view themselves first, the switch is dropped. It happens once per site, when `drafted` goes from false to true. If they go back to Input afterwards, a later plan refresh doesn't pull them away again.
- **"Your first draft is ready: have a look"** is now the first line of How you can help, and of Input's "Your input" summary, since they share one list. It opens View. It disappears as soon as View is open with the draft in it, and stays gone after a reload. This uses the stored record of which views the client has opened per business, which now also notes whether they've seen the draft.
- **The consultant is told to lead with it.** On the turn after the first pass is built, its agenda says the reply opens with "Your first draft is ready: [have a look](#show=draft)" before anything else. The priming says the same: never bury the first draft.

**Two things you should know**
- **Priming budget:** the priming-size test was already 34 characters over its limit on clean xgd-working, before my change. Instead of adding a sentence, I put the new rule into a shorter rewrite of the paragraph next to it in the "showing" section. The section is now shorter overall and the test passes. Two phrasings changed in that rewrite: the "when you have a minute" example, and "paste it and carry on", which is now "or if they are busy, paste the line show_client answers".
- **One planned test was replaced.** The ticket asked for a scripted-host check of the announcement's first line. That would only have tested the script's own text. Instead I test that the agenda line appears after the first pass and not before, and that both versions of the priming carry the rule. The ticket's test plan now says so.

**Tests:** the 5 new UATs in `tests/test_UAT_FC_REQ-444_first_draft_is_seen.test.ts` pass. The existing suites for the first-draft switch, the Input view, How you can help, the opened-views record, the consultant's agenda, priming and the priming budget all pass too, including after merging in the latest xgd-working.

The ticket body records what was built and why. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->