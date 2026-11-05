---
uid: comment-aa3ac8d1
id: COMMENT-5619
type: comment
title: Comment on bug BUG-275
created_by: xgd
created_at: '2026-10-25T01:05:55.799299+00:00'
updated_at: '2026-10-25T01:22:50.975880+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1a5a9d0b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "095e53ec-0694-4732-971a-778618647ce6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a2d41570-082f-4e35-b14d-6662e26e7e09-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T01:04:26.398332+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="50dd25c9-d44f-4b2d-a132-c82d4d9f48fe-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T01:08:56.050534+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="50dd25c9-d44f-4b2d-a132-c82d4d9f48fe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T01:22:47.567884+00:00" -->
#### Claude
Reading the ticket and tracing where the first-pass milestone is set in `host-core.ts`, and where a stalled turn gets continued.

Still tracing: the first-pass milestone is set only when `Delegate` returns with a report. A stalled turn never gets there. Next I'm reading the round loop that continues a stalled turn.

Still mapping the code. I'm looking at how the host tracks which pages a builder wrote in the current message (the layout look), so an abandoned build can be detected from that.

Checking how site changes record who made them. I want "a builder wrote the site" to count only the AI's writes, not the client's own edits.

Checking which outcomes a `Delegate` call can return besides "reported". A builder that wrote and then failed may also be dropped today.

Ticket's in good shape and the code path is clear. Now reading the REQ-379 workers test setup to reuse its builder harness for the new UAT.

Now I'll write the design into the ticket, set `free_coding`, and cut the branch.

Worktree is ready. Now the code. First the cadence change: any `Delegate` that wrote counts as a builder session ending.

Now the host side: one shared recording function, and the follow-up after an abnormal round.

Typecheck is clean. Now the UAT. Checking how workers tests are run.

Three of three pass. Next I'll check they fail against the old code.

Clean. Now the regression scope: my UAT plus the BUG-249, REQ-379, REQ-436, REQ-427/BUG-269, REQ-444/445 suites.

Two failures. Checking whether they're mine or already red on clean code.

Both failures are already red on clean code, so they predate this change. Now the version bump and commit. Checking the gate rules from memory first.

Commit the work first.

Now the merge-back loop: lock, merge `xgd-working` in, bump, fast-forward, then the gate.

Last step: update the ticket body to match what was built (the error-round continuation was dropped).

BUG-275 is fixed, merged into `xgd-working` and at `free_coded` (commits `ce3b149` and `d74fcff`, version 0.2.630). A build that writes the site and then ends abnormally now sets `first_pass_at`, which makes the first-draft review due.

**What changed**
- **`Delegate` comes back but not "reported":** before, the first-pass milestone was recorded only when the builder finished and reported. A builder that wrote pages and then failed, ran out of turns or was stopped left nothing on the plan. Now any delegation that wrote counts as a finished builder session (`cadence-core.ts`).
- **`Delegate` never comes back** (the Dina's Diner case): after any consultant round that stalled, errored or was aborted, the host checks the site's change journal from the start of that round. If the assistant wrote and no recorded builder session covers it, the session is recorded then, the same way a finished one is (`host-core.ts`, `followUpBuild`).
- **After a stall:** the existing one-off continuation from BUG-249 still runs. It now sees the first draft as built, so the existing follow-ups apply in order: layout findings, then the review, then the hand-over.
- **After a Stop, the ceiling or an error:** the milestone is recorded, but nothing is continued. The review is due on the client's next message.

**Decisions you may want to revisit**
- I built a continuation for errored rounds too, then took it out. A consultant round can rarely fail while the builder is still running, so no test could reach that code. An error keeps today's gentle failure notice.
- Restarts aren't covered. If the server process restarts mid-build, no host code is left to run the follow-up. Catching up on the next message would need the build's state saved somewhere, which fits better with BUG-274. The ticket says so.

**Tests**
- `tests/test_UAT_FC_BUG-275_an_interrupted_build_is_followed_up.workers.test.ts` has three cases:
  - stalled after writing: first-pass set, review due, the continuation runs and the client gets a reply;
  - stalled before writing: no milestone, and the continuation runs as before;
  - builder failed after writing: first-pass set.
- All three pass. Against the old code, the two "after writing" cases fail as they should.
- Across the related suites (BUG-249, BUG-256, BUG-269, REQ-379, REQ-409, REQ-415, REQ-427, REQ-428, REQ-436, REQ-444/445, BUG-235), 70 tests pass. Two fail, and they fail the same way on clean `xgd-working`, so this change didn't cause them:
  - `BUG-249 … a_turn_that_stalls_twice…` records `complete` where `stalled` is expected;
  - one REQ-428 plan-entry test.

The ticket body is updated to match what was built. I've left the promotion to `ready_to_reconcile` to you.

<!-- xgd-chat-end -->