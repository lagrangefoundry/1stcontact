---
uid: comment-0abb5014
id: COMMENT-5588
type: comment
title: Comment on bug BUG-263
created_by: xgd
created_at: '2026-10-24T03:08:47.069616+00:00'
updated_at: '2026-10-24T03:17:56.598520+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-82e093d9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4e68ac3d-d753-4a2a-8de0-26f2a82a6a5f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f1c5a547-7f96-4c6f-9798-e426ffe15bb1-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T03:07:16.986800+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f1c5a547-7f96-4c6f-9798-e426ffe15bb1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T03:17:53.231609+00:00" -->
#### Claude
Rewriting the comp announcement steering now; locating the priming example and the BUG-245 assertion.

Now the edits.

Update the two BUG-245 assertions to the new contract (the recorded supersession).

Known worktree setup step: copy `generated/` from the main checkout.

The priming budget UAT (BUG-129) was already red before my change (200262 vs 200000), and my wording added ~300 chars. I'll tighten the example so the comps section is no longer than before.

Trimming the comps priming so my change is net-negative against the (already-over) priming budget.

BUG-129 is now 200202 (was 200262 before my change) — net-negative; the remaining overage is pre-existing. Now the node-side suites.

That's the known pre-existing REQ-416 failure (unrelated). Checking the version-bump convention for this repo.

Committing: lock, bring xgd-working in, bump, single commit, merge back.

Fast-forwarded. Now the ticket: free_coded gate, story points, and a "what landed" note.

BUG-263 is done: it's merged into xgd-working and parked at `free_coded` (commit `2468a8ad30`, v0.2.606, 2 story points). Nothing was promoted further.

**What changed**
- **What the consultant is told to say.** After `add_comp`, the consultant now gets an instruction for one short message of at most three sentences. The message says what the board is, why the client is being asked, and what to do on each card, then ends with `[Open the board to see](#show=comps)`. It must not give directions to where the board sits in Input, so no more "after the summary card".
- **BUG-245 kept, apart from one rule.** BUG-245's "ONE line" rule is explicitly superseded, and its two "ONE line" assertions are updated to the new wording. Everything else from BUG-245 stays and still passes: one announcement for the whole board, no pictures, links or descriptions of individual sites, the exact link, and no questions about the sites until the client has looked.
- **`add_comp`'s tool description** now says "one short message for the whole board".
- **Priming example.** The comps example in `priming.json` (both copies) now gives the reason and the task. To keep it short I left the "no directions" rule only in the tool instruction and tightened the nearby lines, so the section ends up 30 characters shorter per copy.

**Tests**
- New tests in `tests/test_UAT_FC_BUG-263_comp_board_says_why.workers.test.ts` check the real `add_comp` result through the Worker routes, plus the priming example with and without the corpus. They pass.
- 13 related suites pass, including both BUG-245 suites and the other priming tests.

**Still failing, and not from this change** (both were already red on clean xgd-working):
- **BUG-129 priming budget:** it was 200262 against a 200000 cap before my change and is 200202 now. This change made it smaller, but it's still over. Fixing that overage was outside this ticket.
- **REQ-416 priming test:** this is the known failure where the hand-over line is wrapped.

The ticket body now records what landed, the supersession and the test results.

<!-- xgd-chat-end -->