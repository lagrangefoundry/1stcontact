---
uid: comment-21a7c1b3
id: COMMENT-5744
type: comment
title: Comment on bug BUG-290
created_by: xgd
created_at: '2026-10-26T00:50:59.082388+00:00'
updated_at: '2026-10-26T01:02:30.934155+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a6fc1ddc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fd95c3f1-97a8-496f-a250-f88cbc7ef965",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cff02ddc-feb4-49ba-a3b4-a6cb3961f43b-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T00:49:21.132491+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="cff02ddc-feb4-49ba-a3b4-a6cb3961f43b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T01:02:28.073495+00:00" -->
#### Claude
I'm reading the gate code in `cadence-core.ts` and how the host wires it, to confirm the root cause before I scope the fix.

Branch is set up. Now editing the gate in `cadence-core.ts`.

Code change done. Writing the UATs now.

Two of the three new UATs pass. The hold-scenario test wasn't reaching the review hold, so I'm aligning its host setup with the REQ-427 test it's based on and re-running.

All three pass. Checking that the hold UAT actually fails without the host-side fix:

Confirmed: it fails without the fix. Running the wider regression scope (critic, executive-function and cadence tests) plus a typecheck.

Regression scope green (55 tests), no type errors. Now the version bump and commit, following the promotion notes.

Committing, then merging back.

Merged cleanly. Re-running my UATs plus the speak-first neighbours on the merged tree, since working had moved on:

Now updating the ticket body (keeping the existing content) and moving it to free_coded.

BUG-290 is fixed and merged into `xgd-working`. The ticket is at `free_coded` with 2 story points; I haven't promoted it to reconcile.

**Root cause (confirmed):** the host can run several rounds for one client message. Every round started by a host prompt re-armed the speak-first gate, even right after the consultant had just spoken. The 00:36:33 round was a review hold starting after the first-draft summary. Once armed, the gate refused every call until that round produced text, with no limit, so the model's retries ran until the spend ceiling.

**What changed:**
- **"Spoken" now means this message.** The host notes when a message has put the consultant's words in front of the client. After that, no later round in the same message is gated: review holds, carry-ons and stall or error recovery all run their calls. A host-prompted turn that hasn't said anything yet is still gated first, as BUG-278 intended. Code: `host-core.ts`.
- **Refused once per round.** After a refused call's result comes back, the gate lets go for the rest of the round. A call re-issued without speaking then runs, and the Worker logs one `[BUG-290] speak-first gate overridden: <tool> …` line per round. So the gate costs at most one wasted request. Code: `keepClientOriented` in `cadence-core.ts`.

**One quirk:** if a single model response holds several ordinary calls in a row, only the first is refused and the rest already run. Concurrent calls like `Delegate` are refused together. Either way the one-request limit holds; I've recorded this in the ticket.

**Tests:** three new UATs in `tests/test_UAT_FC_BUG-290_speak_first_refuses_once.workers.test.ts`, one per item in the ticket's test plan.
- The review-hold test fails with the host-side change taken out, so it reproduces the 00:36 scenario.
- All 55 tests in the surrounding scope pass (speak-first, critic, executive-function and cadence UATs). After merging the latest `xgd-working` into the branch I re-ran the most relevant 18, and they still pass.

The ticket's last evidence item is still open: no first-draft run with this fix has been done. Since dev serves a frozen snapshot, the next first-draft test will only show this fix after a `bin/deploy --env dev`.

<!-- xgd-chat-end -->