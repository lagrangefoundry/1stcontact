---
uid: comment-e9ed2513
id: COMMENT-5596
type: comment
title: Comment on bug BUG-269
created_by: xgd
created_at: '2026-10-24T16:04:31.373965+00:00'
updated_at: '2026-10-24T16:36:14.742817+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a11a5d92
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d518b2b2-ee4d-48e8-a089-78cfdabd7f1e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3ca55d39-c7c1-48d8-873c-619af1939c71-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T16:02:52.899445+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3ca55d39-c7c1-48d8-873c-619af1939c71-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T16:36:13.432649+00:00" -->
#### Claude
Set status and cut the branch first.

Reading the stage/plan code in `plan-core.ts` to map the fix onto existing mechanisms (REQ-432 stage facts, REQ-415 refusals, REQ-428 agenda).

Tracing how the client's open pane reaches the host — that's how the host can tell the client actually looked at the draft.

Now the agenda (REQ-428) — where the Due lines are built.

Building now. I'll update the REQ-379 UAT that pinned "every later builder session is a round" since this ticket deliberately changes that. First, the plan-core changes.

Writing the plan-core changes now.

Now the declaration, the storage port and the route.

Server side wired. Now the client: the direction line in How you can help, and the Input board headers reading the server's `sections_done`.

Target `comps` exists already. Editing help.js, config.js and input-board.js.

Typecheck clean. Now the UATs — looking at the REQ-432 test harness to reuse it.

Expected fallout from the rule changes. Checking each failure.

Updating the existing UATs whose examples used First draft as a hand-ticked stage, or pinned the old agenda/round behaviour.

Node suites green. Now the REQ-379 workers UAT, which pinned "any later build is a round".

REQ-379 passes with the client's feedback sent over the wire. Now the BUG-269 UATs — reading the workers harness to reuse it.

Writing the workers UAT (over the wire) for BUG-269.

Known workerd quirk (bare `return` of a rejecting promise). One-word production fix: `return await`.

I'll leave the refusal to the node suite, which drives it through the consultant's toolbox. Removing it from the workers test and reverting the `await` tweak since it didn't change anything.

Now the node UAT (real Toolbox and declaration, REQ-432's harness) and a jsdom one for the board.

New UATs pass. Running the full node project for regressions (baselining any failures against xgd-working).

91 failures — most look environmental. Taking a baseline on clean xgd-working in the main checkout to diff.

Only BUG-221 and BUG-235 look related (the rest are worktree-location suites). Checking those two.

Same pattern — First draft used as a hand-ticked example. Updating both to have the client review the draft instead.

Remaining differences are worktree-location suites (webui/KB/env), unrelated to plan code. Now the workers suites around stages, agenda, critic and focus.

The targeted suites pass. A few others failed in the full workers run — BUG-129 (priming budget) and REQ-342 (turn tail) could be mine. Checking.

BUG-129 is mine: priming is 68 chars over the 200k ceiling. Reading the memory on that budget and baselining the others.

Baseline passes BUG-129 (the other five fail on clean xgd-working too). Measuring which of my edits counts toward the priming figure.

The priming's stage paragraph (both variants) still says First draft is the consultant's judgement. Rewording at equal or shorter length, since the budget is full.

Code done and tested. Updating the ticket body (keeping what's there; adding an as-landed section with the supersessions), then committing.

Now the lock → merge xgd-working into the branch → bump → merge back sequence.

Merged cleanly, but REQ-444 ("first draft is seen") just landed alongside. Re-running my suites plus REQ-444's and BUG-129 on the merged tree.

All green after merge, including BUG-129's budget. Bumping the version on the branch and merging back.

Ticket is `free_coded`. Cleaning up the branch.

BUG-269 is implemented, merged into xgd-working, and the ticket is at `free_coded` (commits `b4ef9f72` and `e43bf960`, version 0.2.616). The new and updated tests pass, both on my branch and after merging in the latest xgd-working.

**What changed**

- **Revision rounds start with the client.** Every client message already reports which pane the client has open. The prompt route now saves that on the plan, but only for the client's own words, not automatic cues. Once the draft exists, the first message sent while it's on screen (View or Edit) counts as "seen and answered". A later build counts as a revision round only if the client has said something since the last round. Fix builds for the critic's findings no longer count, so Refining stops being expected too early.
- **First draft ticks itself** once the client has seen the draft and answered, using the same mechanism as the two earlier stages. Until then:
  - `set_stage refining` is refused with a new declared code, `DRAFT_NOT_SEEN`, and the reason.
  - The top line of the agenda that the consultant, worker and talker all read is: "Due first: the client has not seen the first draft yet — show it to them (show_client, target draft) and ask what they think. Other questions wait until they have."
- **"Complete" now uses the same facts as the stage ticks.** The plan view carries `sections_done`, worked out from the stage rules, and the Stories and Comparison sites headers read from it. With every site done but the look only proposed, the header reads "Comparison sites (Agree the look)" and How you can help shows "Agree the look we're going for". Hearting it makes the header Complete at the same moment the stage ticks. The consultant is also told to ask for the card in a short message of its own, with a link to the board.
- The priming's stage descriptions say the same, in no more space, because the priming size limit is nearly full.

**Changes to existing tests that you should know about**

- **REQ-379** used to say every later build is a revision round. Its test now has the client send the second message from View.
- **REQ-428** used to put open decisions at the top of the agenda. While the draft is unseen, the "show the draft" line now comes first.
- **REQ-390, REQ-432, BUG-221 and BUG-235** used First draft as their example of a stage the consultant ticks by hand. They now have the client review the draft, or use a different stage.
- **REQ-433**'s stand-in plan view now includes `sections_done`.
- The ticket body has an "As landed" section that names these overrides.

**Tests:** three new files, `tests/test_UAT_FC_BUG-269_*` (a node suite, a jsdom suite for the Input board, and a workers suite going through the real routes). Compared with clean xgd-working, nothing else broke. The other failures in the full runs also fail on clean xgd-working, or come from running in a branch worktree (missing builder assets, knowledge base, environment). The priming size test (BUG-129) passes after the merge.

**Not handled**

- Dina's plan already has Refining marked in progress, and nothing moves it back; the host only refuses starting it from now on. First draft there will tick itself the next time the client writes with the draft on screen.
- A Refining refusal can't be checked cleanly in the workers test environment: it reports an unhandled rejection even when caught. So that check lives in the node suite, and the workers test covers the normal path.

<!-- xgd-chat-end -->