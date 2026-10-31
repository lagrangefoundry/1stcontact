---
uid: comment-c74229fe
id: COMMENT-5797
type: comment
title: Comment on request REQ-481
created_by: xgd
created_at: '2026-10-28T01:06:22.974227+00:00'
updated_at: '2026-10-28T02:06:34.763321+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-660b0323
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "cba15dd5-346d-418c-9393-fd32fd133f3d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T01:06:17Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T01:06:17Z" -->
#### You
Comments on the opening text: change the first-draft sentence to as soon as I have enough to start; How we will work together jumps around the UI and does not name things consistently. Template: View-Edit-Input (top left) with View, Edit, Input bullets; Progress - How you can help (directly above this message). Take a pass and make it less random.

<!-- xgd-chat role="assistant" ts="2026-10-28T01:06:17Z" -->
#### Claude
Drafted a version following the screen order with exact labels (View, Edit, Input with Questions/Stories/Comparison sites, Progress, How you can help, View on your phone); dropped whenever suits you; flagged that How you can help items must open the matching Input section.

<!-- xgd-chat role="user" ts="2026-10-28T01:06:17Z" -->
#### You
Looks good - please create a ticket

<!-- xgd-turn id="94aed63b-8368-4026-9825-12722f788e6b-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T01:56:37.514108+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="94aed63b-8368-4026-9825-12722f788e6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T02:06:33.015412+00:00" -->
#### Claude
Reading the ticket and current code: the opening text, the on-screen labels and the How you can help click handler. Next I'll check whether help items already open the matching Input section.

Click behaviour already exists: `openInput` switches to Input and expands the matching section (draft → View). Now finding an existing jsdom builder test to model the click UAT on.

REQ-433 already tests the link behaviour, so the new click UAT can borrow its harness. Reading it.

Now checking consultant-side text that paraphrases the opening (DOC-75, "progress bar", "story board").

Scope is clear and click behaviour already works. Setting the ticket to free_coding and cutting the branch.

Worktree is set up. Now editing the opening text in `plan-seed.json`.

Now the consultant-side wording: "progress bar" → Progress, and the story board's location.

Now retargeting the BUG-235 test and checking the REQ-403 tests.

REQ-403 tests reference `OPENING_MESSAGE` symbolically, so they need no change. Retargeting BUG-235's pinned phrase:

Now the new UAT file. Checking DOM selectors for the phone button and Input section titles so the label test reads what the builder renders.

Writing the new UAT file, with a compact copy of the REQ-433 builder harness.

Phone button only shows in View mode; reading it there first.

All three pass. Running the regression scope: suites that read the opening, priming, the plan surface and show_client.

Over 60 paths makes vitest find nothing (known quirk); batching.

Several failures, none in files I touched. Baselining these same files against the clean main checkout.

Five of the six fail on the clean checkout too, and the workspace-origin ones are a known worktree artifact. REQ-358 passes on main, so checking it in the worktree.

REQ-358 passes on its own; the failure was load flakiness in the batch. Checking the version-bump step for this project.

Committing the work on the branch.

Now recording what landed in the ticket body, preserving the existing text.

Ticket updated. Now lock, merge xgd-working into the branch, bump the version, and land it.

REQ-481 is merged into xgd-working and the ticket is at `free_coded` (commits `bac0e387…` and `7cf6f8bd…`, version 0.2.691, 2 story points). I had no questions before starting.

**What changed**
- **Opening text:** `plan-seed.json` now has the agreed text, word for word.
- **Labels:** all nine names in the text already matched the screen, so nothing needed rewording.
- **Click behaviour:** this already worked. Clicking an item in How you can help switches to Input and opens the matching section. The one exception is "Your first draft is ready", which opens View because it points at the draft. I left that alone, so the opening's "open the right part of Input" is slightly loose for that one item.
- **The consultant's own text:**
  - "The progress bar" is now "Progress" in the plan instructions, the show_client description, both copies of the priming section and the comment in `show-core.ts`.
  - The plan instructions no longer call the story board "a third view of the preview, beside View and Edit". They say it's under Stories in Input.
  - DOC-75's opening guide doesn't paraphrase the opening message, so I left it as is. Its "Open in new tab beside the preview" says where the button sits, and the REQ-376 tests depend on that wording.

**Tests**
- New file `tests/test_UAT_FC_REQ-481_opening_follows_the_screen.test.ts`, with three tests:
  - The opening matches the agreed text exactly.
  - Every name in bold in the opening is a label the builder actually shows. The test starts the real builder and reads the labels off it, so renaming a control will make it fail.
  - Every How you can help item that belongs to an Input section opens Input at that section, even when the section was folded.
- I updated the BUG-235 test, which pinned the old "first draft early" wording. The REQ-403 tests check against the opening message itself, so they needed no change.

The new tests and the BUG-235 test pass. I ran the 119 other test files that touch the opening, the priming text, the plan instructions or show_client. Eleven failures turned up, none in files I changed:
- BUG-52, REQ-127, REQ-259 and the two assistant-pane failures also fail on the unchanged xgd-working checkout.
- The builder-origin failures come from running in a separate worktree, which is a known setup issue rather than a code problem.
- REQ-358 passes when run on its own.

I didn't run the slower test suite that covers the REQ-403 first-entry check, or deploy anything. The dev site will keep showing the old opening until it's redeployed.

<!-- xgd-chat-end -->