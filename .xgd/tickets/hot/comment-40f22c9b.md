---
uid: comment-40f22c9b
id: COMMENT-4886
type: comment
title: Comment on request REQ-382
created_by: xgd
created_at: '2026-10-04T15:22:44.679160+00:00'
updated_at: '2026-10-04T15:36:22.752956+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-29eec3cc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "816e8d4d-a5f7-4f57-b1c6-8da318a7df61",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c64f46f1-d360-44ad-97c6-27ca73c55950-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T15:21:17.009757+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c64f46f1-d360-44ad-97c6-27ca73c55950-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T15:30:11.896584+00:00" -->
#### Claude
Reading the fold's band/card classification to place both fixes (gradient band surface, and the hero clip).

Scope is clear from the ticket. Marking it `free_coding` and cutting the branch.

Now issue 2: replace the resize with a clipping container.

Now the UATs: update REQ-370's ground test (explicitly superseded) and add REQ-382's.

Generated dir is gitignored; copying it from the main checkout so the suites can load.

All 22 pass. Confirming the new UATs fail without the fold change:

Fix proven. Now the wider regression scope: every suite that calls `foldToL1`, plus a typecheck.

All 83 fold suites pass. Typecheck:

Clean. Verifying on the real bundle — copying it to a temp dir and refolding there so the stored reference isn't touched.

Committing on the branch, then updating the ticket body with what landed.

Now lock, merge back into xgd-working, and promote.

Merged. Promoting with the auto-version path (no `--version`, which avoids the tip race):

I implemented both fixes on REQ-382, merged them into `xgd-working`, and the ticket is now at `free_coded` with 3 story points. Commits are `fafea067de` (the fix) and `e493348dfc` (the automatic version bump).

**Issue 1: the bar gradient.** The sticky bar's gradient was being painted on a card the size of its headline. When a row's colour is a gradient, and the text element itself has no accent rule, border, shadow or rounded corners, the fold now uses the captured full-width surface instead of the text's box. Rows that do have one of those keep the old rule, so an accent rule is never stretched across a whole band.

**Issue 2: the hero photo.** The fold used to crop the photo by shrinking its box, which under `object-fit: cover` repainted it at 0.990× scale. The photo now keeps its captured box and sits inside a clipping container sized to the backdrop. A photo that already fits inside its backdrop gets no container. This changes how REQ-370 crops the photo, though its intent (photo under the overlay, cut off at the backdrop's edge) stays the same. I updated REQ-370's existing test to expect the clipping container, and the ticket body records this as an explicit supersession.

**Results:**
- **Real bundle:** I refolded a temp copy of the stored hearingzone510.com reference, and both values match the ticket's "Right" figures. The gradient box is at x 0, full width, height 40 (41.59 at 320). The photo stays at 1168.56 inside a clip at the backdrop's 1157.
- **New tests:** I added four tests in `tests/test_UAT_FC_REQ-382_band_gradient_and_clipped_cover_ground.test.ts`. The two that check the fixes fail without the fold change; the two that check the cases left alone pass either way.
- **Regression:** all 83 test files that exercise the fold pass, and the `tools/generate` typecheck is clean.
- **Not run:** the pixel gate (`1c gate … --sandbox`), because it needs Chromium.

**Cleanup is unfinished:** `xgd branch clean REQ-382` failed because REQ-381 took the merge lock after my merge. The branch is fully merged, so nothing is at risk. Running `xgd branch clean --stale` later will remove the leftover worktree and branch.

I updated the ticket body with an "Implementation (what landed)" section and the test plan; the original content is unchanged.

<!-- xgd-turn id="9a8b2149-3ace-4ce3-9c95-2dc2c102443b-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T15:36:19.397657+00:00" -->
#### You
please complete the free-coding of this ticket

Blocking details:
- branch `free-REQ-382` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-382`
- branch HEAD: `fafea067de6700447df792c01efbd7dd428b8d5f`

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->