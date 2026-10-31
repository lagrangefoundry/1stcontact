---
uid: comment-657d15f6
id: COMMENT-5754
type: comment
title: Comment on request REQ-468
created_by: xgd
created_at: '2026-10-26T03:06:27.964212+00:00'
updated_at: '2026-10-26T03:12:16.615544+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9b1dadb5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "59910ca4-7ab4-416f-bde9-d340774d9fb1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="85a784a7-4593-4f8d-90b9-e8aa63ebb40d-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T03:05:57.378847+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="85a784a7-4593-4f8d-90b9-e8aa63ebb40d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T03:12:15.775181+00:00" -->
#### Claude
The upstream clip text never mentions an outside service, so the only offending text is in our own `videogen.ts`. Now reading the REQ-461 test suite and any other references to the gate.

Plan is clear. Setting the ticket to `free_coding` and cutting the branch; also locating Policy 26's source text.

Branch is cut. Checking my notes on worktree setup before I edit and run tests there.

Generated artifacts copied. Now editing `videogen.ts` in the worktree: removing the gate and its text, and rewriting the guidance so the client agrees to the clip's design.

Code edited. Now updating the REQ-461 suite (dropping the disclosure test and the "first call refused" helper) and writing the REQ-468 UATs.

One fix to my own test before running: the guidance legitimately says "part of their service", so the regex should target "video/AI service", not the bare word.

The guidance now starts that sentence with a capital "Never", which breaks the REQ-461 assertion. I'll rephrase the guidance so the original wording stays, then look at the second failure.

`fal.submitted` records every request to the fake (several per clip), so asserting exactly 1 was wrong. Checking what it records.

All 11 tests pass. `npx eslint` hit an npm cache permission error, so I'll run lint and typecheck from the local binaries, and look for other suites that reference the clip code.

Typecheck is clean for the touched files and there's no lint script. Before committing, checking my notes on the version bump and the `free_coded` gate.

Order from my notes: commit the code, take the lock, merge xgd-working in, bump the version, merge back, then `move-to-free-coded`. Committing the code now.

Merged xgd-working in cleanly; version is 0.2.663. Bumping to 0.2.664 and merging back.

Merged into xgd-working. Now the ticket: updating the body with the implementation details (preserving what's there), then moving to `free_coded`.

The ticket is at `free_coded` with both commits, but the "What landed" section didn't make it into the body. Checking the right flag for appending to the body.

My command passed `--body-file` as the value of `--append-body`. Checking whether that damaged the body.

The body is intact; the command just failed. Retrying with `--append-body-file -`.

The ticket body is complete. Next is the Policy 26 wording that the ticket asks to land alongside the code. Reading the policy doc.

Policy 26 has already been reworded in DOC-1 (disclosure belongs in the terms, never per tool in the conversation), so no doc change is needed from me. Last step: tearing down the merged branch.

REQ-468 is done: it's merged into xgd-working and the ticket is at `free_coded`. The consultant's first clip request for a business now goes ahead like any other tool call.

**What changed** (`apps/control-app/src/videogen.ts`)
- **Gate removed:** the first-call refusal, the per-business "disclosed" counter and the disclosure sentence are all deleted.
- **Nothing names an outside service:** I checked the clip op text that comes from lagrange-framework and it never mentions one, so the only offending text was ours and it's gone.
- **The client agrees the design:** before making a clip, the guidance now tells the consultant to describe it and get a yes to:
  - what moves and what stays still
  - how long it runs and how it loops
  - where it sits on the page and what it replaces
  - that visitors see a still first
  - that it can be taken off again if it doesn't look right

  It also tells the consultant to say a clip takes a few minutes.
- **Unchanged:** the 10-per-session and 50-per-business limits, the "never mention a price" rule, and spend metering.

**Tests:** the clip tests (REQ-461's and the new REQ-468 ones) pass 11/11, and typecheck shows no errors in the changed files. There's no lint script in the repo, so lint wasn't run.
- The new `tests/test_UAT_FC_REQ-468_clips_without_a_disclosure_gate.workers.test.ts` checks three things: a new business's first request makes a clip; nothing the model sees (op text or tool result) mentions an outside service, a provider or permission; and the guidance covers each design point.
- In the REQ-461 suite I removed the "told before the first clip" test, the first-refusal step in the `animate()` helper, and the disclosure checks in the price test.

**Policy 26:** DOC-1 already says what the ticket asks for: providers are disclosed in the terms, never per tool in the conversation, and the client agrees to the design. I made no doc change.

**Ticket:** commits `4db5a130f2` (the change) and `796cbdf1ec` (version bump to 0.2.664), story points 2, and the body now has "What landed" and "Tests" sections below your original text. It's parked at `free_coded`; promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->