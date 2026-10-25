---
uid: comment-3d11db3c
id: COMMENT-5620
type: comment
title: Comment on bug BUG-274
created_by: xgd
created_at: '2026-10-25T01:09:24.220643+00:00'
updated_at: '2026-10-25T01:24:09.339589+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-6922674b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "889dcd5a-657b-4840-8963-df5cb7248cbb",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="babf3cbd-f899-498d-921c-c2399c0cc820-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T01:08:03.176236+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="babf3cbd-f899-498d-921c-c2399c0cc820-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T01:24:04.502815+00:00" -->
#### Claude
Reading the ticket and the witness code; now tracing how builder sessions get their junction.

Found the delegating workers UATs; reading the REQ-360 heartbeat one as a template for a reproduction.

Setting the ticket to free_coding and cutting the branch, then writing a reproduction UAT.

Writing a reproduction now; first checking how the router supplies `deps.junctions`.

The reproduction passes on current code — so the fault is not in this path as tested. Checking whether the deployed snapshot actually contained the witness.

Looking at the dev store's junction DOs for the incident session.

The incident junction shows the silence measured exactly from the `Delegate` tool_issue, and the dev store has no DO for any builder session. Reading the durable storage adapter.

Pulling the builder's request timeline and the operator log from the dev D1.

Builder was active right up to the stall, yet the witness never moved. Checking whether each request builds its own manager (store identity per request).

Wrappers here likely make a fresh store object per request. Checking what the AI routes pass as the host's store.

The ledger row says `aborted` with no detail, whereas the BUG-249 deadline path records `stalled` with a cause and runs a recovery round. Looking at the raw stop/turn_end records.

The `turn_end` shape (`abandoned: true`, `stall.silentMs` camelCase) isn't what host-core's `releaseStalledTurn` writes — it looks like a framework-side deadline. Checking the framework.

Now updating the UAT so the build outlasts the framework's window too, then proving it fails without the fix.

The UAT fails without the witness wiring (the framework cut the build off at request 9 of 13) and passes with it. Running the BUG-249 and adjacent delegation suites plus a typecheck.

Baselining that failure on the unchanged code before blaming the diff.

That BUG-249 "stalls twice" failure is pre-existing (identical on the unchanged code). Typecheck next.

No type errors in host-core. Checking this repo's version-bump convention before committing.

Clear recipe. First updating the ticket body with the confirmed root cause and fix, then committing.

Committed. Now the merge-back and version-gate sequence.

Saving one non-obvious lesson for future sessions.

I've fixed BUG-274 and merged it into `xgd-working`. The ticket is at `free_coded`, version 0.2.631. Dev won't change until you redeploy it: `bin/deploy --env dev`, then `bin/dev restart dev`.

**Root cause.** The ticket blamed the BUG-249 deadline, but a different one cut the turn off. The record on the incident junction is `turn_end {aborted, abandoned: true, stall: {silentMs: 304352}}`. That shape is written by the framework's own progress deadline (lagrange-framework BUG-92), not by our host. Our host's deadline writes `stalled` with a cause and runs a recovery round, and the incident's ledger row is just `aborted` with no detail.

The framework's deadline gives up on any turn that writes nothing to its own session for 300 seconds. The builder's work goes to the builder's own session, so the framework never saw it. The host never passed the framework the activity tracker BUG-249 built, which does count the builder's work. So the framework always fired at 300 s, before our host's deadline could. The dev store backs this up: the builder sent 19 requests, the last one starting 11 seconds before the cut.

**Fix (`host-core.ts`, new `watchedProgress()`):**
- Both the site and business managers now hand the framework the same activity tracker BUG-249 uses. Work by a delegated builder therefore counts as progress for both deadlines.
- The framework's limit is now twice the host's stall deadline. The host's deadline still decides for the consultant's turn and recovers it. The framework's becomes the backstop for a builder stuck in its own session.

**Tests:** `tests/test_UAT_FC_BUG-274_a_working_builder_keeps_the_turn_alive.workers.test.ts` runs on the same path as production (Worker route, durable session storage, real delegation and builder session).
- A builder working through both deadlines lets the consultant finish `complete`. Without the fix, the framework cut that build off at request 9 of 13.
- A builder that goes silent still ends the consultant's turn as stalled, naming `tool Delegate`.
- The BUG-249, REQ-306, REQ-360, REQ-436, BUG-256 and BUG-268 suites pass, except for one test. `test_UAT_FC_BUG-249_a_turn_that_stalls_twice_is_recorded_stalled_and_frees_the_session` fails the same way on the code before this change, so this change didn't cause it.

I updated the ticket body with the confirmed cause, the fix and the tests, set story points to 2, and saved a memory on telling the two deadlines apart by their records.

<!-- xgd-chat-end -->