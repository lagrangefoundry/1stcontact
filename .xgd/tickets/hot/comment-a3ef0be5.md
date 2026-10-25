---
uid: comment-a3ef0be5
id: COMMENT-5367
type: comment
title: Comment on bug BUG-209
created_by: xgd
created_at: '2026-10-17T14:12:52.830573+00:00'
updated_at: '2026-10-17T14:17:09.318032+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b85e6c92
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "10ad0002-d946-460b-a7d4-a9c91582990b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="95397cd5-83b2-45b3-97f9-babb53a04e38-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T14:12:29.645879+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="95397cd5-83b2-45b3-97f9-babb53a04e38-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T14:17:09.202842+00:00" -->
#### Claude
The scope is clear from the ticket. I'm reading the existing REQ-398 banner tests to see how they render the panel, then I'll cut the branch.

I'll cut a branch and set the ticket to `free_coding`.

Now the CSS rewrite in the branch worktree.

Now the UATs, plus updating REQ-398's title assertion (superseded by this ticket's "no colon").

jsdom can't expand the `border` shorthand when it contains `color-mix`, so I'll write it as longhands and loosen the `min-width` check.

That failure is the known missing-generated-artifact issue in fresh worktrees, not related to this change. Checking for other references to the old title, then commit.

Now the commit, lock, and merge back.

BUG-209 is fixed and parked at `free_coded`. The progress banner is now a segmented bar of boxes, and the code is merged into `xgd-working`. The branch is cleaned up, with two commits recorded on the ticket: the fix and the gate's automatic version bump.

**What changed**
- **Title:** it now reads "Progress", with no colon, as a label at the left of the bar.
- **Boxes:** each stage is a bordered, rounded box with its content centred, and the boxes have a small gap between them. They share the width, so the bar always reaches the right-hand edge. The box for the stage in progress takes about three times the share so its name fits, and the name still ends in an ellipsis on a narrow panel.
- **No "|":** the rule that drew the "|" separators is deleted, not hidden.
- **Colour stays inside each box:**
  - not started: grey outline, no fill;
  - done: light green fill with ✓;
  - skipped: light yellow with a dash;
  - in progress: light blue fill with a solid blue border.
- **Full width:** the banner already ran edge to edge across the panel; the stages just didn't stretch to fill it. Letting the boxes grow fixes that.
- Everything else from REQ-398 is unchanged: the markup and text, the ✓ and – marks, the spinner, the explanation on hover/focus/tap, and accessibility.

**Tests**
- New: `tests/test_UAT_FC_BUG-209_progress_bar_boxes.test.ts`, with four UATs covering the title, no "|" anywhere, one box per stage with its colour kept inside, and full width on one line with the current stage wider.
- These pass together with the REQ-398, REQ-390, REQ-379 and REQ-364 suites (27 tests).
- One REQ-364 test file couldn't run on the branch because the generated ticketing code isn't built there. It doesn't cover the banner.

**Things you should know**
- **One REQ-398 test changed.** It checked for the exact title `'Progress:'`, which this ticket replaces, so it now expects `'Progress'`. The ticket body records this as an explicit supersession of that assertion.
- **Full width isn't measured directly.** The tests run in jsdom, which doesn't lay pages out, so they check the CSS rules that make the bar fill the panel rather than measuring pixel widths. I haven't looked at it in a real browser; a quick look on dev would confirm the proportions.

The ticket body now includes "What changed" and "Design decisions" sections. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->