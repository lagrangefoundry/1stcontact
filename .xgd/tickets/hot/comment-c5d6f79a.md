---
uid: comment-c5d6f79a
id: COMMENT-5529
type: comment
title: Comment on request REQ-417
created_by: xgd
created_at: '2026-10-20T14:50:03.142594+00:00'
updated_at: '2026-10-20T15:27:30.196374+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ca08adb5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d24b842b-f48b-4945-bccb-b4819f3f4d1d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="29a99dbc-a694-497e-9f25-8d7fae2063cf-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T14:49:24.208075+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="29a99dbc-a694-497e-9f25-8d7fae2063cf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T14:56:24.156584+00:00" -->
#### Claude
I've moved the ticket to free_coding and cut branch free-REQ-417. Next I'm reading the story board and plan panel code.

Next I'm checking how the story board's container is sized, so the empty message can be centred vertically.

Container has a definite height, so a flex column with `margin: auto` on the empty message will centre it. Now reading the existing UATs.

Writing the code now. I'll put the centring check in a real browser (jsdom can't lay anything out), following the BUG-58 suite's pattern. Checking how that suite launches Chromium:

Now the tests. Checking how BUG-58 gets the real builder into Chromium, so I can reuse the same path:

I'll move BUG-58's Chromium-launch helpers into `tests/support/chromium.ts` so both suites share them instead of keeping a second copy.

Now the REQ-417 suite. I'll drive the real `createStoryBoard`/`createPlanPanel` components with stub transports. Checking the plan panel's constructor:

Writing the suite:

The test measured rather than skipping. To make sure it can actually fail, I'll briefly put back the old `margin: 24px auto` and re-run:

The test catches the old layout, and the CSS is restored. Running lint and typecheck:

Ready to commit. First I'm adding a section to the ticket body describing what landed, including the technical consequences the UAT pins, such as the headline keeping its full width:

Committed (`72349a9`). Now taking the merge lock and merging back into xgd-working:

Merged. Moving the ticket to free_coded, letting the gate do the version bump itself:

REQ-417 is done: the change is merged into xgd-working and the ticket is at `free_coded`. It records two commits (my change plus the gate's version bump to 0.2.554), and the branch has been cleaned up. All three changes are in place:

1. **Story board empty message:** while the board has no notes, the message sits in the middle of the space below the headline slot, both horizontally and vertically. It goes as soon as the first note is pinned.
2. **Headline slot:** the label now reads "Your headline statement:" and the empty slot's shadow text reads "Why choose your business?", centred. Centring applies only while the slot is empty, so offered, chosen and client-written headlines keep their existing left alignment. To centre the message I made the board a vertical stack, which would have shrunk the headline slot to its text width, so I gave it full width (still capped at 46em).
3. **Question panel:** until the first question arrives it shows grey "We'll put questions here for you to answer" in the panel's normal text style, and neither section heading. The text lives in `config.js` as `PLAN_NO_QUESTIONS_YET`. Once a question exists it doesn't come back, even after every question is answered.

**Tests:**
- The new suite `tests/test_UAT_FC_REQ-417_opening_experience.test.ts` passes (4 tests).
- The centring is measured in a real Chromium, because the in-process test DOM can't lay anything out. That test did measure rather than skip, and it fails if the old layout is put back.
- I updated the REQ-408 story pane test to the new placeholder wording. REQ-408, REQ-401, REQ-403 and REQ-260 pass.
- The BUG-58 browser test fails in the branch worktree: a generated `ticketing` module is missing from a fresh worktree. That happens regardless of this change.
- Lint didn't run: the repo has no lint script, and `npx` is blocked here because the npm cache can't be written.

**Shared test helper:** to avoid a second copy of the Chromium-launch code, I moved it out of the BUG-58 test into `tests/support/chromium.ts`, and both suites now use it.

The deployed dev environment still shows the old wording until you run `bin/deploy --env dev`.

<!-- xgd-turn id="dbe08be4-98f2-4fed-acfd-de33c05ec315-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T15:22:38.569948+00:00" -->
#### You
Please put the "We'll put questions here for you to answer" in the center of the panel - vertically and horizontally centered

<!-- xgd-turn id="dbe08be4-98f2-4fed-acfd-de33c05ec315-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T15:24:42.609844+00:00" -->
#### Claude
I'll make the panel a vertical flex column only while the ghost text is showing, so the populated panel's layout is unaffected:

Adding a browser measurement for the panel. I'll factor the existing Chromium block into a helper both tests share:

The 6px is the margin under the stage tracker: the browser centres the ghost below that margin, but my measurement left it out. Including it in the measurement:

Passing. A quick check that the new test fails without the centring rule:

The test catches the missing rule. Now updating the ticket body (item 3 and the "What landed" note), keeping everything else as it is:

The ticket body is frozen, so the operator must have promoted it. Checking its status:

The ghost text is now centred both ways in the question panel, but it isn't on xgd-working yet: I've stopped before merging because REQ-417 has moved on to reconciliation.

**The change:** while the panel has no questions, it becomes a vertical stack and the ghost text sits in the middle of the space below the progress tracker, centred both ways. The rule only applies while the ghost text is showing, so a panel with questions lays out exactly as before.

**Tests:** I added a real-Chromium measurement to the REQ-417 suite. It checks the text is centred both ways, and that the panel goes back to its normal layout once a question exists. All 5 tests in the suite pass, and the new one fails if the centring rule is removed. The REQ-401 and REQ-403 panel suites also pass.

**Where it is:** it's committed only on branch `free-REQ-417` (`6f631d6`). Someone has moved REQ-417 to `ready_to_reconcile`, and a reconcile (BUNDLE-31) is running. Because of that, the ticket body is now locked and I couldn't update it, so this follow-up isn't recorded on the ticket. The protocol says to check with you before adding work to a ticket in that state.

Decision for you: which way should this go?
1. **Fold it into REQ-417:** you move the ticket back to `free_coded` (or wait until BUNDLE-31 finishes and say how you'd like it handled). I then merge, record the commit, and update the ticket wording, which I've already drafted.
2. **Separate follow-up ticket:** you say "create a new ticket" and I put this commit on it, leaving REQ-417's reconcile untouched.

Until you decide, the branch and its worktree stay where they are.

<!-- xgd-turn id="b14404c0-d11c-4eaa-b24d-290a0af6dc37-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T15:27:29.277330+00:00" -->
#### You
I have reopened it please complete the process in this ticket

<!-- xgd-chat-end -->