---
uid: comment-551e0503
id: COMMENT-5565
type: comment
title: Comment on request REQ-432
created_by: xgd
created_at: '2026-10-23T01:07:19.737721+00:00'
updated_at: '2026-10-23T01:53:53.444127+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-63c7d191
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b9aa6a13-425c-4fb9-8743-5354a8c251e1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-23T01:07:15Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-23T01:07:15Z" -->
#### You
We looked at the comp sites, I answered all of them but they are still showing as in progress.

<!-- xgd-chat role="assistant" ts="2026-10-23T01:07:15Z" -->
#### Claude
The sites are all sent; the stage 'Looking at other sites' is what reads In progress. Stages are ticked by hand: the rule is reacted + direction named + client agreed. The consultant proposed the direction (visual_concept proposed) but never asked for agreement; 'Getting to know you' is stale too. Proposed: How you can help shows decisions awaiting you, and the consultant asks for agreement after the last site.

<!-- xgd-chat role="user" ts="2026-10-23T01:07:15Z" -->
#### You
Right, it should be automatic — getting to know you has to have a reaction on everything, a hearted position and a chosen headline, then it goes to done. Agreeing the direction: like the position statement, you heart the direction and we are done. If new work is added, those sections can reopen.

<!-- xgd-chat role="assistant" ts="2026-10-23T01:07:15Z" -->
#### Claude
Filed REQ-432: stage done-when rules as plan-seed data checked by the host on every write; Getting to know you and Looking at other sites as stated; the direction shown as a heartable card like Your position, also a How you can help line; new notes/headline/card/sites reopen a done stage; the consultant is told when a stage settles or reopens.

<!-- xgd-turn id="a58ebe95-efb7-4101-95a9-ec43f4dca39a-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T01:11:16.412624+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a58ebe95-efb7-4101-95a9-ec43f4dca39a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T01:53:52.099532+00:00" -->
#### Claude
Branch `free-REQ-432` cut; now reading the plan code (plan-core, plan-seed, stage UATs) to map the stage machinery.

REQ-431 ("How you can help") is still being coded in another session, so I'm checking what of it exists before deciding how to hook the direction line in.

Still mapping the plan code: found the comp-board state (`comps_finished_at`, `settleComps`) and the decisions list; next the write path (`change`/`checkPlan`) where the host can settle stages.

Reading the decision ops (`set_decision`, `record_client_answer`) — the direction card will build on the `visual_concept` decision they write.

Now the comparison board UI, where the direction card will sit.

Design settled; checking which existing UATs tick the two ruled stages by hand (they'd be superseded by the new rule).

Now writing code. First the seed data: each ruled stage names its done-when facts.

Now the board's facts in `story-core.ts`, so `boardFinishGaps` and the stage rule share one definition.

Board facts done. Now the core of the change in `plan-core.ts`: the facts registry, `settleStages`, the direction card and the notices. Checking a few helpers first.

Inserted. Now wiring it in: types, `stagesFor` keeping the stamp, the `set_stage` refusal, re-proposal of a changed direction, and settling on every core write path.

Fresh worktree lacks the control-app `generated/` artifacts (known setup step); copying them from the main checkout, then re-typechecking.

Core typechecks. Now the control-app side: host write settles stages, the comp route takes the direction actions, and the per-turn notice carries the stage and direction lines.

Now the client's direction card on the comparison board. Looking at config strings and the story-card CSS to reuse.

Now the declaration (`TICKS_ITSELF` refusal, `set_stage` wording) and the consultant's priming.

Doesn't round-trip, so I'll splice textually.

Now the priming paragraphs (two variants). Locating the exact raw lines.

All edits in. Typechecking, then running the affected existing suites to see what the rule change breaks.

Eight failures. Four are the expected supersessions (hand-ticking the ruled stages); REQ-398 and REQ-401 need a look, so baselining those two on clean `xgd-working` first.

REQ-398 is red on clean working too (pre-existing). REQ-401 is mine — checking it.

`boardFinishGaps` is now unused — removing it. Then updating the superseded UATs. Reading the REQ-408 assertions first.

Updating the six superseded assertions to the new rule (recorded in the ticket as REQ-432 superseding the hand-ticked finish lines).

Also adjusting the "Passed over" line so it doesn't tell the consultant to tick a stage that ticks itself.

Production code is in. Now the UATs — reusing the REQ-425 harness (real toolbox + plan ops; in-memory storage port).

Writing the node UAT first.

Two test-side issues: the agenda line legitimately carries the REQ-424 "new notes" item, and the in-memory clock ran earlier than the client stamps. Fixing the test.

All 7 pass. Removing a dangling comment in the first test (the delete case is asserted in the reopen test).

Now the workers UAT: the stored half, through the Worker's real routes and the per-turn notice.

Workers UAT passes. Adding a jsdom UAT for the card itself on the comparison board; checking the REQ-419 harness.

The test dispatched a synthetic blur while focus stayed in the box (the card rightly won't redraw under a focused textarea). Using a real `blur()`.

All three pass. Now the regression scope: the node suites named in the ticket plus neighbours.

While that runs, updating the ticket body — keeping the operator's text and adding what landed.

The file-list expansion went wrong (an empty match became `tests/`), so that ran the whole node suite. Pulling the summary and the failures in my area only.

My own `head -30` truncated that output. Re-running just the related node files, properly listed, detached so it survives the shell timeout.

REQ-408 is my expectation being too strict (the REQ-424 new-notes item follows); REQ-398 is the pre-existing red. Fixing the assert and checking which file skipped.

Node scope is green apart from the pre-existing REQ-398. Now the workers suites that touch the plan, priming and the notice (including BUG-129's priming budget).

BUG-129 (priming budget) is over by 654 chars — my priming additions. REQ-416 is the known pre-existing red. Measuring my priming growth to trim it back under.

My growth is only +194 chars per variant, so the budget may already have been over. Baselining BUG-129 on clean `xgd-working`.

Baseline is already over by 460 (pre-existing, not mine), but I shouldn't add to it. Tightening my priming wording to net zero or less.

Now −118 chars per variant (net reduction). Confirming BUG-129 moved down and REQ-408/REQ-416 are as expected.

Both remaining reds are pre-existing on clean `xgd-working`. Preparing to commit; checking my notes on this project's free_coded gate first.

Committing the work on the branch first.

Committed. Now the merge-back sequence: lock, bring `xgd-working` into the branch, bump the version at the branch tip, fast-forward.

Clean merge, but `router.ts` and `priming.json` changed upstream meanwhile. Checking what came in before bumping.

Sizeable upstream changes (host-core, spend). Re-running typecheck and my UATs plus the edited suites on the merged tree.

Green after the merge. Bumping the version on the branch tip, then fast-forwarding `xgd-working`.

`xgd-working` moved again (a ticket auto-commit landed). Merging it in once more and bumping at the new tip so the fast-forward is possible.

Fast-forward landed. Running the ticket-overlay rematerialize step via the `xgd` CLI (the printed script path doesn't exist).

Nothing to rematerialize. Now moving the ticket to `free_coded` with the three non-merge commits.

Branch merged and cleaned. Adding a short verification note to the ticket.

Updating my note on the priming budget, since it's now over on clean working.

REQ-432 is implemented and merged into `xgd-working`, and the ticket is at `free_coded`. It's not promoted to reconcile; that's your call.

**What changed**
- **Two stages now tick themselves.** Each stage's "done when" rule is a list of facts in `plan-seed.json`, and the host checks them on every plan write.
  - **Getting to know you** is done when every note has a reaction, the position card is confirmed and a headline is chosen.
  - **Looking at other sites** is done when every site is sent or skipped and the direction is hearted.
  - A done stage goes back to in progress when new work arrives, such as a new note, a new site or a rewritten direction.
- **The consultant is told.** Its next turn gets one line, e.g. *"Getting to know you" is done: every note reacted to, position confirmed, headline chosen.* A reopened stage gets a matching line saying why. Between turns, the plan entry lists what each stage still needs.
- **The direction is a heartable card** at the top of the comparison board, titled "The look we're going for". Hearting it agrees to the direction; clicking the text lets the client reword it, and that also counts as agreeing. Neither starts a turn. If the consultant then rewrites the direction, the card waits for the client again.
- **Instructions:** the consultant's priming and its comparison-board-finished notice now say these stages tick themselves, and that it should name the direction after the last site, before anything else.

**Decisions I made, worth checking**
- **The consultant can no longer tick these two stages by hand.** Ticking one done before its rule is met is refused, with what's missing. The other five stages are still ticked by hand: their finish lines are the client's judgement ("they have looked at it", "nothing feels off"), not facts in the plan.
- **Existing plans will settle on their next write.** A hand-ticked stage whose rule isn't met will reopen, with what's missing; a stage whose rule is met will tick itself. On Ariel's plan, Looking at other sites stays in progress until Ariel hearts the direction card, which will now appear because the direction is already proposed.
- **Two cases count as met:** the "nothing distinctive yet" fallback position card counts as confirmed (that's how REQ-425 defined it), and a client who skips comparing sites altogether counts as having settled the sites.
- **The "How you can help" line isn't drawn yet.** REQ-431 is still being built and has no list to add it to. The plan view carries the line ("Agree the look we're going for") while the card waits, ready for REQ-431 to read.
- **Four older tests ticked these stages by hand** (REQ-390, BUG-221, BUG-235, REQ-379). I changed them to use other stages, and updated the REQ-408 and REQ-425 finish-line checks to the new wording. This is noted in the ticket.

**Tests**
- Three new test files: the core rules, the full flow through the real routes and the next turn, and the card on the board. All pass.
- The stage, card, comparison-board and story-board tests you listed also pass, re-run after merging the latest `xgd-working`.
- Three tests fail, and all three also fail on a clean `xgd-working` checkout without my change:
  - **REQ-398:** the hover/tap test on the progress banner.
  - **REQ-416:** the consultant-instructions test.
  - **BUG-129:** the length cap on the consultant's instructions was already about 460 characters over. My wording edits make the text 118 characters shorter per variant, so it's slightly less over.

Dev serves a frozen snapshot, so you'll need `bin/deploy --env dev` to see the card there.

A background wait from earlier was stopped at its time limit. It was waiting on the botched first test run, the one where the file list went wrong and the whole suite ran. That run was redone properly, and its results are the ones I reported. Nothing needs restarting, and REQ-432 is still at `free_coded`.

<!-- xgd-chat-end -->