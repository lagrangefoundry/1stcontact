---
uid: comment-5ad35721
id: COMMENT-5652
type: comment
title: Comment on bug BUG-287
created_by: xgd
created_at: '2026-10-25T22:27:14.608964+00:00'
updated_at: '2026-10-25T22:45:29.285901+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-857353a1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0a2ac030-4f51-4249-b36c-35853e945888",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2f530813-a6a0-4aef-99db-e6a6cf2a429c-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T22:24:55.460487+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2f530813-a6a0-4aef-99db-e6a6cf2a429c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T22:45:27.314750+00:00" -->
#### Claude
I'm reading the layout check and the REQ-460 tests to see how `long_home` currently flows to builders and through the BUG-256 stuck counter.

I'm looking at how the direction summary (REQ-432) is recorded, to see where a "look, not an order" rule can be enforced.

Now setting up the branch. First a quick look at my worktree-setup notes.

Worktree runs. Implementing now, starting with the layout-check classification.

Now the cue texts in `priming.json`, spliced in textually next to the layout cues.

Now the role functions for those cues.

Now host-core: imports, the owed-structure split, and the look.

Tightening the "home is short" detector so it needs a claim about the home page, not just an adjective nearby.

Now the host's look: structure faults owed under their own key, outside the fix rounds and the stuck rule.

Now the hand-back hold in `continuedTurn`. Checking how cue turns are kept off the client's transcript first.

I'll register the new cues as host cues (hidden from the client's transcript, speak-first on the round), then wire the hold.

Now `plan-core`: a direction that orders home sections is refused, and the structure line states the visitor-first rule.

Checking whether any priming tells the consultant to put a section order into the direction, which would now conflict with the refusal.

Typechecking the touched package.

Typecheck is clean. Now the UATs; looking at the REQ-460 node test's harness and the continuation limit.

Writing the BUG-287 UAT file now (four scenarios from the ticket's test plan), reusing the REQ-460 harness shape.

All four fail in ~20ms, so the requests aren't reaching the model at all. Debugging the route responses.

The plan surface needs the new error code declared at surface level too.

The fake browser's home detection is off; since every build in these tests writes only home, I'll drop that gate.

Two harness issues: the repeated builds wrote identical text (so no look ran), and my "last user message" helper also matched tool results. Fixing both in the test.

All four pass. Checking they actually fail against the old code (reverting just the source changes temporarily).

RED confirmed. Now the regression scope the ticket names, starting with REQ-460 (its third UAT pins the old behaviour).

Only the expected REQ-460 UAT fails (it pins the old builder-routed hold). Updating it to the superseding behaviour.

Now the node-side regression tests (REQ-460, REQ-415 layout, REQ-428, REQ-432, REQ-409, BUG-256, BUG-265) plus typecheck.

This looks unrelated (plan-reminder length). Baselining it on the clean xgd-working checkout.

Pre-existing failure on clean xgd-working, not from this change. Checking for a lint step before committing.

No lint step. A final read of the host-core diff before committing.

Diff reads right. Committing on the branch.

Now updating the ticket body, keeping the existing text and adding what landed.

Now the merge-back. Checking the version-bump script for this repo first.

A concurrent change (BUG-285, host cues in reloaded chats) conflicts in host-core. Looking at it.

Per my notes, merge commits should hold only the resolution, so I'll commit the speak-first addition separately.

Re-running my UATs plus BUG-285, BUG-278 and BUG-284 against the merged code.

Green. Running the bump / merge-back / gate loop.

I'm adding the post-merge note to the ticket. Then I'll clean up the branch.

BUG-287 is done and on `xgd-working`. The ticket is at `free_coded`, version 0.2.649, with 3 story points. The new UATs pass, all four fail against the old code, and the ticket's regression suites pass apart from one REQ-428 test that already fails on clean `xgd-working`.

**What changed**
1. **A long home page goes to the principal, not to a builder.** After a build, the host's look now reports `long_home` in its own "THE SITE'S STRUCTURE, for you and not a builder" block, outside the lines a builder is asked to fix. It doesn't count as a BUG-256 fix round, is never marked "UNCHANGED … cannot be fixed this way", and isn't dropped when the three fix rounds run out. The hand-back is held with a separate cue: change `pages_navigation`, move what serves the curious (the story, the full menu, a business within the business) to its own page with a teaser on home, then build that. The hold clears only when home measures within its budget.
2. **The direction is a look, not an order.** `set_decision` now refuses a `visual_concept` that lists the home sections in order with `DIRECTION_ORDERED`. Examples: "opens on the steak and eggs hero, then Hal's counter, then …", or one that says "home order". The refusal says what to write instead. Setting `pages_navigation` now hands the consultant the visitor-first rule along with the one-line "tell your client" instruction. The client's own edits on the direction card are not checked.
3. **The hand-back can't contradict the check.** If the reply calls the home page short or quick (the incident's wording, "the home page stays quick to get through", is caught) while `long_home` stands, the consultant is told to correct it to the client in one line. This happens once per message and still runs after the time warning.

**Tests**
- New: `tests/test_UAT_FC_BUG-287_a_long_home_is_restructured_by_the_principal.workers.test.ts`, with the four scenarios from the ticket's test plan.
- I updated the REQ-460 UAT that expected a long home to be held as an ordinary layout fault ("THIS BUILD IS NOT DONE"). It now expects the structure block and cue.
- Passing: REQ-460, BUG-256, REQ-436, REQ-432, REQ-415, REQ-427, REQ-428 (workers), BUG-129, BUG-265, BUG-278, BUG-284, BUG-285 and REQ-409.
- Still failing: `test_UAT_FC_REQ-428_the_plan_entry_carries_the_open_decisions…`, the same way on clean `xgd-working`.
- The two Chromium tests in the REQ-460 node file were skipped because the browser can't launch in this sandbox.

**Things to know**
- **Detection is by wording.** Both the "orders the sections" check and the "home is quick" check match phrasing. An unusual wording could get past them, and the occasional false hit costs one extra round. Whatever slips through, the length hold still enforces the budget.
- **Model behaviour isn't tested.** Nothing proves the model will actually put hours and directions before the story teaser for the diner. The tests prove the rule it's given, the refusal, and the hold.
- **BUG-285 overlapped.** It landed while I was working and changed how host cues are recognised, which caused a merge conflict in `host-core.ts`. My two new cues are covered by its rule, and I added them to its separate "speak first" list in a separate commit.
- **Not addressed:** the critic not running because the layout hold was still open when the restart aborted the turn. The ticket notes this but its Fix section doesn't cover it.

<!-- xgd-chat-end -->