---
uid: comment-4a39d838
id: COMMENT-5800
type: comment
title: Comment on bug BUG-308
created_by: xgd
created_at: '2026-10-28T02:32:26.984653+00:00'
updated_at: '2026-10-28T02:52:57.939560+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-6fc72f53
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a91e76d8-8c8e-47e8-942c-d9c9adeb43ac",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T02:32:19Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T02:32:19Z" -->
#### You
We had the top area under the progress bar light up blue to tell the user it was active - this regressed, can you fix it please? Also the consultant offered steam rising / slow push in / nothing moving - I thought the intro plus loop was our agreed default?

<!-- xgd-chat role="assistant" ts="2026-10-28T02:32:19Z" -->
#### Claude
The BUG-245 rule is .plan-panel--working .plan-stages, but REQ-431 moved the tracker out of the panel, so it matches nothing; key it on the tracker data-busy. And yes: DOC-71 12.9 and DOC-74 5 agreed an eye-catcher ending on the original photo then a subtle loop, one enthusiastic proposal for cohort zero.

<!-- xgd-turn id="347d5217-c429-43a6-95dd-c87540a7f64f-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T02:35:26.490540+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="347d5217-c429-43a6-95dd-c87540a7f64f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T02:52:53.976272+00:00" -->
#### Claude
Working on BUG-308: branch cut, now fixing the dead blue-highlight selector, then the consultant's effect wording.

The highlight is now keyed on the banner's `data-busy`. Next I'm looking at the effect wording in DOC-75 and BUG-306's hold.

Found the menu wording in DOC-75 line 88 and in the hold's refusal text. Next I'm checking how DOC-75 names cohort zero, then I'll rewrite both.

Now editing the refusal text and DOC-75.

Now updating DOC-75's first-draft guide (a ticket update via the CLI).

Now retargeting the old tests. Reading the affected assertions:

Now the new FC tests. Checking how the BUG-306 node suite reaches the guide and refusal:

The code and doc edits are done. Now I'm writing the BUG-308 tests: a quick probe to see whether the refusal text can be read in node.

The declaration isn't easily readable in node, so I'll leave the refusal wording to the retargeted BUG-306 workers test, which goes through the real routes. Writing the two BUG-308 test files:

Passes. Checking that it fails on the old CSS, then running the workers suite:

Copying the generated build artifacts into the worktree so the workers suites can run.

Both workers suites pass. Running a wider batch of builder and guide suites:

Some failures. Baselining the same files on the clean main checkout:

Most failures are pre-existing. AC1038, the origin ACs and BUG-58 failed only in the worktree, so I'm rerunning them there against the old CSS to rule out my change:

They passed on the old CSS, so I'm rerunning them on the new CSS to see whether they're flaky:

Same as baseline, so the extra failures were load from running in parallel, not my change. Checking where the DOC-75 update was committed:

The DOC-75 update is on xgd-working. Checking the version-bump rules before committing:

Committing the code, then following the merge-back order in that memory:

Now updating the ticket body before merge-back, keeping the existing text and recording the decisions:

Now the merge-back: lock, bring xgd-working in, bump the version on the branch, then fast-forward.

Fast-forwarded. Moving the ticket to free_coded and cleaning up:

The gate printed a warning before it succeeded, so I'm checking what it said:

I've fixed both issues in BUG-308. The ticket is at `free_coded` with the code merged into xgd-working. I left it there, so promoting it to reconcile is your call.

**1. The blue working highlight.** The rule only matched the progress banner while it sat inside the plan panel. REQ-431 moved the banner into the chat column's progress area, so the rule stopped matching anything. It's now keyed on the banner's own busy flag, so it works wherever the banner is placed. It keeps the same blue, the same gentle animation, and stays still under reduced motion. The status line under the banner lights up too.

I also removed the plan panel's own blue edge. That panel sits in the Questions tab, not beside the progress area, so the progress area is now the only place that shows "working". The screen-reader line is still there.

**2. The hero effect.** You're right that intro plus loop was the agreed default (DOC-71 §12.9 and DOC-74 §5). The menu came from two places: the first-draft guide in DOC-75 and the message the consultant gets when it tries to build before the effect is decided. Both told it to "offer two or three options", and gave steam and a slow push-in as examples. Both now say:
- **The shape:** an eye-catcher that plays once and ends on the client's original photo, then a subtle loop, both named for that photo.
- **When the client prefers the consultant to lead:** one enthusiastic proposal, asking for the go-ahead.
- **When the client leads:** a recommendation, with alternatives only if they ask.
- **"Nothing moving":** it's the client's choice, never one of the options.

The build still waits for the client's answer, and a yes to the proposal counts as an answer.

**Tests:**
- Two new BUG-308 tests pass: one checks the highlight in the real builder, the other checks the guide's wording. The highlight test fails against the old stylesheet, so it catches this regression.
- The BUG-245, BUG-306 (including its end-to-end test) and REQ-477 tests are updated to the new selector and wording, and pass.
- In a wider batch of related tests, three files' worth of failures also fail on the clean checkout, so they were already failing. The origin test failed the same two cases with and without my change.

The DOC-75 wording change went in as a ticket update on xgd-working, separate from the code commits.

<!-- xgd-chat-end -->