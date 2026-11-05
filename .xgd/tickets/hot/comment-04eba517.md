---
uid: comment-04eba517
id: COMMENT-4889
type: comment
title: Comment on bug BUG-199
created_by: xgd
created_at: '2026-10-04T16:08:15.413321+00:00'
updated_at: '2026-10-04T16:16:28.914282+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-cb156476
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "85e37301-efd9-40bd-9f1a-4fc0d4729bed",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="12c2c337-0488-4267-bbdf-87bcd447ce9b-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T16:06:59.169479+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="12c2c337-0488-4267-bbdf-87bcd447ce9b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T16:16:28.702329+00:00" -->
#### Claude
Scope is well-defined. Let me look at the extractor.

Reading the existing icon-link detection (`svgIconHostOf`) so the fix reuses its "link whose only ink is this media" test instead of inventing a new one.

Checking whether downstream (fold, values-diff families) dispatch on `a11yRole === 'img'`, since a logo `<a><img>` would now report `link`.

Plan is settled. Now finding the existing test pattern for extractor role logic (BUG-151 / REQ-380).

Real EXTRACT_SCRIPT runs under jsdom here — good, no Chromium needed. Reading the rest of the harness.

Design settled. Setting status and cutting the branch.

Bumping the capture schema (reference side changes). Looking at the axis-entry shape.

Now the extractor edits.

Now types, values-diff media gating, and schema bump.

Now the UAT. Checking how values-diff is invoked from tests and how fields become manifest elements.

Core cases pass. Fixing the href expectation (the extractor keeps relative hrefs), then confirming the tests fail without the fix.

Without the fix 4 fail, the scope guard passes — as intended. Now the regression scope: every test that runs the extractor, values-diff, or schema staleness, plus typecheck.

Suite-level failures across the board — checking the cause on one file.

Known fresh-worktree artifact (control-app `generated/` missing). Copying it from the main checkout and re-running.

That failure is pre-existing — REQ-336 added `border` to the image card table and this assertion was never updated; my diff doesn't touch it. Now typecheck and the extractor parse check.

Typecheck clean. Reading my notes on this project's version-bump/promotion mechanics before committing.

Committing on the branch. First, appending the implementation record to the ticket body (existing content preserved) so each UAT is motivated by its text.

Body updated with both original and new sections. Committing on the branch.

Now locking and merging back into xgd-working.

Merged. Moving to `free_coded`, letting the gate do the version bump itself (avoids the tip race).

Now tearing down the branch (bare command, so the sandbox exclusion matches).

BUG-199 is fixed in the capture code and parked at `free_coded`. I haven't confirmed it on the real bluelotus page, because Chromium can't start in this sandbox, so the ticket's `1c gate` check hasn't been run.

**Cause:** a social icon on the reference page is a link wrapping an inline SVG, while our reproduction draws it as a link wrapping an `<img>`. The extractor called the first a `link` and the second an `img`. Elements with no text are matched by role, so none of the four icons found a partner.

**What changed:**
- **Role:** an `<img>` or `<svg>` that is the only thing inside a link now counts as the link itself, on both sides. A picture that sits next to the link's own text is unaffected and stays `img`.
- **Name:** these icons now take the link's name: the link's `aria-label`, then the image's own `alt` or SVG `<title>`, then the link's `title` attribute. The reference icons now read "Go to Facebook page", the same as the reproduction's `alt`.
- **Reuse:** the "only thing inside the link" check is now one function, shared with the existing SVG icon-link detection.
- **values-diff:** since linked images now report `link`, "is this an image?" now also counts anything with an `objectFit` value as an image. Without that, matched icons would have stopped getting image comparisons such as `objectFit`.
- **Capture schema 19 → 20:** older bundles are now flagged as behind when they hold a titled icon with an empty name.

**Tests:** I added `tests/test_UAT_FC_BUG-199_a_linked_icon_reads_one_role_on_both_sides.test.ts`. It runs the real extractor (under jsdom) on both page shapes and the real values-diff:
- Before the fix, 4 of its 5 cases fail; afterwards all pass. The fifth case checks that a picture next to link text keeps role `img`.
- I ran all 73 other test files that use the extractor, values-diff or capture schema: one failure, in `req51-object-grouped-report`. That test still expects four rows on an image card, but REQ-336 added a fifth (`border`) earlier, and this change doesn't touch that list.
- Typecheck is clean.

**Before the gate numbers can move:** the bluelotus reference bundle has to be re-captured, because half of this fix is on the reference side. After that, the ticket's `jq` check should show both lists empty and unmeasured dropping from 8 to 0.

**Ticket:** the original body is kept, with an implementation and test-plan section added. Commit `38b857b364` is merged into xgd-working, story points are set to 3, and the branch and worktree are removed. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->