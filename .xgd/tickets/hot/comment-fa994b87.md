---
uid: comment-fa994b87
id: COMMENT-3304
type: comment
title: Comment on bug BUG-125
created_by: xgd
created_at: '2026-09-20T19:17:07.986383+00:00'
updated_at: '2026-09-20T19:25:55.789314+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a1cafa46
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "af13b993-7b41-48b1-bda1-7ff6aa3b6748",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2160dbe9-3e2f-40a2-8621-6bb736280e2a-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T19:16:11.487060+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2160dbe9-3e2f-40a2-8621-6bb736280e2a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T19:25:53.749877+00:00" -->
#### Claude
Now the restore-side normaliser, next to `parseOutcome`:

Now wire `readOutcome` and `readTicket` in console.ts:

Now append the implementation record to the ticket body (preserving what's there):

Done — BUG-125 is at `free_coded`, commit `897f0ea134` (+ auto-bump `da9eeb9ff3`, v0.2.290), merged into `xgd-working`, branch cleaned.

**The fix** (read side of the boundary only):

- `readOutcome` no longer spreads-and-asserts. It hands what `JSON.parse` returned to a new `normaliseOutcome` in `ai.ts`, which gives every field the code declares required a value whatever the file carries — the same rule `readIterations` already applies to the manifest and `readGateReport` to the verdict. `status` stays the one exception (no status = no round).
- Each `ticketsRead` entry goes through `normaliseReadTicket`: classes parsed by the same `parseDefectClasses` the live read-back uses, so a pre-REQ-276 entry reads as *classified nothing*, not as a crash. An entry that isn't an object, or whose `id`/`status` is the wrong type, becomes `unreadTicket(...)` — behaviour 3's "same unread shape `readTicket` already uses", now declared once beside `ReadTicket` and called from both places instead of spelled out twice.
- `violations` / `observations` / `bugTickets` are re-derived rather than `?? []`-defaulted (a non-list on disk used to sail through and throw downstream), but absence stays absence for `ticketsRead` and `bugTickets` — "named no secondary bug" and "read-back came out empty" are different facts.
- `parseOutcome`, `confirm` and `wrongDefectClass` are untouched: the unclassified-ticket violation is still raised by the live confirmation path and nowhere else.

**Evidence** — `tests/test_UAT_FC_BUG-125_stored_round_renders.test.ts`, five UATs against a real loopback console driven with real `fetch`. The old-artifact fixture is made by *running* a round and editing its `outcome.json` down to the four keys an earlier console wrote, not by hand-writing a file the suite invented. Before the fix three of them fail with `expected 500 to be 200` / `Cannot read properties of undefined (reading 'length')` — your error; after, all five pass. The acceptance-3 and behaviour-4 cases pass on both sides, which is what makes them guards.

Regression: the eleven repro-console suites (131 tests) plus this one, all green. Two `REQ-254` cases that spawn the real `1c` CLI failed in the worktree and pass in the main checkout — the known worktree artifact, unrelated.

The ticket body now carries a "What landed" / "Evidence" section under your original text; the original is untouched. Ready for `ready_to_reconcile` when you are.

<!-- xgd-chat-end -->