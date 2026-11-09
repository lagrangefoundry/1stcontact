---
uid: comment-a8450cc7
id: COMMENT-8139
type: comment
title: Comment on bug BUG-407
created_by: xgd
created_at: '2026-11-09T18:30:34.933703+00:00'
updated_at: '2026-11-09T18:47:07.558635+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d0684527
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "31871875-3692-4762-bd21-d83fe9c58b86",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4a7a655d-d7c0-4242-a84b-0adaf44eedc9-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T18:29:42.748457+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="4a7a655d-d7c0-4242-a84b-0adaf44eedc9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T18:42:24.692719+00:00" -->
#### Claude
Checking for duplicates, then locating the plan-tool code.

Reading `set_decision` in plan-core.ts to see how `chosen` is gated and how the headline decision ties to the board.

Still reading the plan surface (where `set_decision` is declared) before deciding how to record a headline the client stated.

The session lock is held by another ticket (BUG-405), so I'm cutting a branch.

Worktree created. Now I'll look at an existing positioning/board UAT to use as a model.

Now the implementation. First, checking whether any UATs pin the `set_decision` description wording I'd touch.

Now the story-core changes: a function that records the client's headline, and a refusal that names the field.

Now `set_decision` in plan-core.

Now the UAT file, modelled on REQ-425's harness.

The positioning UAT passes. The headline fixture needs `sources` on its offer:

`panelView` doesn't expose `passed`, so I'll read it from the stored board instead:

All three pass. Next: the adjacent suites (board, positioning, plan surface/priming, signature effect), plus a typecheck.

Those three fail to load only because the worktree lacks `apps/control-app/src/generated`. Copying it in from the main checkout:

Now every node suite that reads `plan-surface.json` or `story-core`, plus a typecheck:

Two failures took ~61s each, which matches the known readDocTickets slowdown under load. I'll check all three failures:

REQ-389 and REQ-408 pass when run alone, so those were load timeouts. Checking whether REQ-361 also fails on clean xgd-working:

REQ-361 fails the same way without my changes, so it's an existing failure. Now the typecheck:

Type errors remain only in unrelated control-app files (existing); none are in the files I touched. Committing the work:

Updating the ticket body before landing. I'm keeping the existing content and correcting the misdiagnosis in problem 2.

Now landing it: lock, merge xgd-working into the branch, bump, merge back, then promote.

plan-core.ts auto-merged with newer xgd-working changes, so I'm re-running the UATs on the merged result before landing:

BUG-407 is fixed and merged into xgd-working, and the ticket is at `free_coded` (commits `f8106cb4`, `d264173d`, version 0.2.851). It isn't a duplicate. BUG-331 (parked) overlaps the headline half, but its fix was a new operation plus a new host refusal, and BUG-407 needs neither. I've noted the overlap in the ticket. BUG-331 itself is unchanged; whether to close it is your call.

**1. A headline the client writes in chat can now be recorded as their choice.** The consultant calls `set_decision` on `headline` with `state: chosen`, the headline in `value`, and the client's message in `client_said`. If the message contains the headline word for word (case, punctuation and spacing don't matter), the call is accepted:
- the story board shows the headline as the client's, and the earlier offers are set aside;
- the decision is recorded as chosen, with the client's quote in the decision log;
- the next turn's plan says "headline chosen (their words)" and stops treating it as open.

Without a `client_said` that contains the headline, the call is refused and points to `offer_headlines`, so the consultant still can't choose for the client.

**2. The `write_positioning` refusal says what to fix — but the ticket had the cause wrong.** That message is only produced when a pick's `customer` is over 60 characters. The `why` text never played a part, so in production the customer descriptions were too long and the retries happened to shorten them. The refusal now looks like: `picks[1].customer is 72 characters ("…"); the most is 60. Name just the kind of customer … and put the rest in picks[1].why`. The 60-character rule itself is unchanged, and I corrected the diagnosis and test plan in the ticket.

**Tests:** three new tests in `tests/test_UAT_FC_BUG-407_headline_in_chat_and_actionable_refusals.test.ts` pass, including after merging the latest xgd-working (plan-core.ts merged automatically). The other 24 test files that use these modules pass, with three exceptions:
- `REQ-389` and `REQ-408` hit 60-second timeouts in the big batch but pass when run alone.
- `REQ-361`'s "restructured box" test fails the same way without my changes.

The typecheck shows no errors in the files I touched; the only errors are in two control-app files I didn't change (`material-import.ts`, `zip-reader.ts`).

<!-- xgd-turn id="578abd0c-f4de-440a-8f76-b52069ec3e30-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T18:46:41.020330+00:00" -->
#### You
Is this ticket complete?

<!-- xgd-turn id="578abd0c-f4de-440a-8f76-b52069ec3e30-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T18:47:04.204915+00:00" -->
#### Claude
Yes, BUG-407 is done as far as the free-coding process goes. I checked just now:

- **Status:** `free_coded`, version 0.2.851, 2 story points.
- **Commits:** both are recorded on the ticket and both are on xgd-working (`f8106cb4`, `d264173d`).
- **Branch:** the `free-BUG-407` branch and its worktree have been removed.
- **Ticket body:** it describes what was actually built, including the corrected diagnosis for the `write_positioning` refusal.

Three things are still open, and none of them block this ticket:
- **Reconcile:** moving it to `ready_to_reconcile` is your call.
- **BUG-331:** it's parked and overlaps the headline half of this fix. Closing it or narrowing it is also your call.
- **Existing test failures:** REQ-361 fails the same way without my changes. REQ-389 and REQ-408 time out in the full batch but pass when run alone.

<!-- xgd-chat-end -->