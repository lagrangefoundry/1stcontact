---
uid: comment-ccd1ee37
id: COMMENT-3046
type: comment
title: Comment on bug BUG-108
created_by: xgd
created_at: '2026-09-18T00:43:16.868324+00:00'
updated_at: '2026-09-18T00:52:00.521462+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fa7f98ce
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2f115c31-f4f0-4127-8559-ceb4a1fd3b93",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="926032ea-bfe3-4023-b0a8-2babb80cacbd-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T00:42:25.735941+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="926032ea-bfe3-4023-b0a8-2babb80cacbd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T00:52:00.230415+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Full picture confirmed. The implemented design is unambiguous — `console.ts`'s `confirm` reads tickets back, and `ticket.ts`'s header records that `fileTicket`/`appendGapEvidence` were **deleted** in REQ-262 D10. Only the prompt text and DOC-53 are stale. Let me record the decision on the ticket.

Ticket scoped and at `free_coding`. Cutting the branch.

Now the edits. Module header first:

Now the round context — the two contradictory passages:

Now the stale assertion in the REQ-262 suite:

Now the new UAT file:

The REQ-261 assertion pinned `` `bugs` `` — the non-existent field name from the same stale sentence. The real field is `bugTickets`. Correcting it:

All 11 repro-console suites pass; the two earlier failures were a missing `src/generated/` in the fresh worktree, not my change. Now DOC-53 — the KB copy of the same stale instruction:

Now version bump and commit on the branch:

Now lock, merge back, and claim `free_coded`:

Done. All 11 repro-console suites pass on the merged `xgd-working`.

## What was wrong

Only one of the two halves was implementable. REQ-262 D10 deleted the console's filing relay — `ticket.ts`'s own header says so ("`fileTicket`, `appendGapEvidence` and `parseTicketRef` went with that change") — and §7's closing block carries `ticketId`/`bugTickets`, which are **ids**, with no field for a ticket body. A round obeying the hand-back half had nowhere to put its diagnosis, and a `"filed"` block without a `ticketId` is read by `confirm` as a failed round. So the direction was forced, not a matter of preference.

## What changed

**`tools/repro-console/src/ai.ts`** — "You still do not file" → the round files at `status: draft`, never at `ready_*` (that warning was the load-bearing half of the same paragraph and is kept). "What you hand back" → "What you produce", with bugs as tickets the round files and **names** in `bugTickets`. Two stale module-header claims corrected against `ticket.ts`/`console.ts`.

The prompt now also writes out **this round's literal `--created-by` value** rather than leaving the round to assemble it from a slug and an iteration stated elsewhere. `wrongProvenance` checks a string the round types by hand; a value handed over whole cannot be mis-assembled. Brief §6 points at it.

**Two stale test assertions**, found by implementing — and both had been actively holding the bug in place:

- REQ-262's suite asserted `/You still do not file/i`, pinning the wrong half.
- REQ-261's asserted the prompt contains `` `bugs` ``. That string existed in exactly one place — the hand-back sentence — and named a field the closing block has never had. Corrected to `bugTickets`.

**DOC-53 §2 and §3.3** updated, since the KB is handed to every round and would have re-introduced the contradiction from the other side.

**New UAT** asserts against the *joined* prompt (`buildPrompt(brief, context)`), which is where the contradiction actually lived — each half was internally consistent on its own, which is how they drifted apart.

## Ticket state

BUG-108 is at `free_coded`, `fields.commits = [5662ab68dd3ebfccbc050f8680328728c39f7abf]`, version `0.2.248`, story points 2. Branch merged and cleaned. Promotion to `ready_to_reconcile` is yours.

One note: the fresh worktree initially failed `BUG-103` and `REQ-254` at import (`./generated/ticketing` missing). That is a worktree provisioning artifact, not the change — copying `apps/control-app/src/generated/` in made both pass, and they pass on `xgd-working` now.

<!-- xgd-chat-end -->