---
uid: comment-add45430
id: COMMENT-5598
type: comment
title: Comment on request REQ-445
created_by: xgd
created_at: '2026-10-24T19:48:15.929603+00:00'
updated_at: '2026-10-24T20:07:39.793734+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3df26bff
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1a789909-e37c-48ed-a2a2-682a64c5fd38",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1aa68e4f-687b-48ae-8e14-0e0ad04a6031-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T19:46:00.203492+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1aa68e4f-687b-48ae-8e14-0e0ad04a6031-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:07:37.054246+00:00" -->
#### Claude
Reading the plan/stage code (plan-core.ts) to see how stages, `done_when`, and BUG-269's guard work before I touch anything.

Still surveying: found the hand-over agenda line (`FIRST_DRAFT_LEAD`) and the stage guard; now reading them and the priming before writing anything.

Found the plan load path in `apps/control-app/src/plan.ts`; checking how stored plans are normalised on read.

Now editing the seed in the worktree.

Now the core. Checking the stage types and validation first.

Now the code in `plan-core.ts`: prerequisites, the hold pass, the generic `set_stage` guard, and load repair.

Stage-order guard is in. Now the comment over `set_stage` ("ANY ORDER") and the first-draft hand-over line.

Updating the stale "any order" doc comments, then typecheck and write the UAT.

Typecheck clean. Running the existing stage suites (BUG-269, REQ-432, REQ-390, REQ-434, REQ-444) against the change.

Three failures, all tests that pinned "any order". Looking at what they set up.

Two tests pin the superseded "any order" behaviour (colours before any draft). I'll fix the refusal wording first, then update those two tests minimally as explicit supersession.

Now the two superseded test lines.

Existing suites green. Now writing the REQ-445 UAT; checking how the node host supplies `show_client` its page list so the hand-over links resolve against real pages.

Writing the REQ-445 UAT file now (hand-over steering, stage-order refusals, hold-on-reopen, load repair, publish gating).

New UAT passes (6/6). Now the wider regression: workers stage suites, the BUG-129 priming budget, REQ-171, and every suite that drives `set_stage`.

Eight failures. Baselining the same suites on clean xgd-working (the main checkout) before blaming the diff — memory says BUG-129 and REQ-416 are often red there already.

At exactly 200000 (cap is `<`). My overview sentence added 6 chars; trimming it to net-negative.

Adding a small shared test helper that puts a stored plan at a given stage the legitimate way (draft reviewed, earlier stages done), then using it in the four suites' setups.

No formatter in the repo. Tidying the nested ternary indentation by hand, then typecheck and the full related set again.

Only the two baseline failures remain. Quick sweep for any other suite with stored stage fixtures I didn't run.

Those three are red on clean xgd-working too, so not mine. Updating the ticket body (appending, existing text kept) before committing.

`--append-body -` appended a literal "-". Checking the flag's form.

Ticket updated. Committing on the branch, then the lock → merge → bump → land sequence.

Clean merge, but others changed `priming.json` and REQ-427 meanwhile — rerunning the budget test and my key suites on the merged tree before landing.

All green on the merged tree (the REQ-427 first-draft baseline failure has since been fixed by someone else). Landing it.

REQ-445 is merged into xgd-working and parked at `free_coded` (commits `d37a2ca9…`, `af1e5920…`, version 0.2.618). The new UAT file passes 6/6, and the other stage suites pass on the merged tree. The ticket body now has an "As built" section that keeps the original text.

**Stage order**
- Each stage in `plan-seed.json` now lists what it `requires`:
  - Refining and Colours & fonts need First draft done.
  - Finishing touches needs Refining and Colours & fonts.
  - Ready to publish needs Finishing touches, and no earlier stage left in progress. A stage that was never started counts as skipped and doesn't block it.
  - Getting to know you, Looking at other sites and First draft need nothing, so they can still run at the same time.
- `set_stage` refuses a stage marked too early and names what it's waiting for. It uses BUG-269's `DRAFT_NOT_SEEN` when the draft is built but the client hasn't reviewed it, and a new `STAGE_ORDER` otherwise. This one general check replaces BUG-269's Refining-only check.
- If First draft reopens, Refining goes back to not started on the next plan write, and the consultant's next turn is told why.
- Stored plans are fixed when they're read, so Dina's Refining will show as not started while First draft is open. This fix-up doesn't tell the consultant. Dina's dev site will only show it after you run `bin/deploy --env dev`.
- "Any order is fine" is gone from the priming and the plan tool's descriptions.

**First-draft hand-over**
- The wording is in the host's first-draft agenda line (`FIRST_DRAFT_LEAD`), not in `priming.json`. The priming is at its BUG-129 size limit (my edits there are net shorter), and that line already appears once per site, when the draft lands.
- In order: the draft link first, then what a first draft is, then three to five specific things to look at with copy first, each linked to its page. Then what isn't finished yet, how to give feedback, and what happens next.
- The ticket asked for links to sections; the builder can only open pages, so the links go to pages.

**Tests I changed**
- Six suites from other tickets relied on stages going in any order, so their tests now set up the earlier stages first.
- REQ-390 and REQ-432 each had one line changed.
- BUG-230, BUG-235, REQ-415 and REQ-427 now use a new test helper (`tests/support/plan-stages.ts`) that brings the plan up to the stage being tested.

REQ-416, REQ-398 and BUG-245 still fail, but they fail the same way on clean xgd-working.

The required stages are my choice, made because the ticket left the full list open. The one most likely to need changing is Finishing touches requiring Colours & fonts to be marked done. When you're happy with it, moving the ticket to `ready_to_reconcile` is up to you.

<!-- xgd-chat-end -->