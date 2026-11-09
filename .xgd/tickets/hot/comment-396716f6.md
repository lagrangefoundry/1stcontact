---
uid: comment-396716f6
id: COMMENT-8070
type: comment
title: Comment on bug BUG-396
created_by: xgd
created_at: '2026-11-09T06:00:59.801011+00:00'
updated_at: '2026-11-09T06:27:38.876531+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b2aecde6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "603853bf-991a-42c7-a837-15810cb2d4fe",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6665bb3e-136f-41d7-87fb-a9d5e76ecec6-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T05:58:32.804976+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="6665bb3e-136f-41d7-87fb-a9d5e76ecec6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T06:27:34.086102+00:00" -->
#### Claude
Not a dupe. Now the code.

Not a duplicate. I've set the ticket to free_coding and cut the branch; now I'm making the worktree runnable, then I'll do the rewrite.

Baseline is green with single-process Chromium. Now reading how the L1 renderer draws controls.

Design settled. Checking the consultant guidance doc (DOC-47) for what it says about checkout.

Writing the L2 layout change now (strip Continue, top back link, payment place after the total).

Rewriting the layout section of `l2/checkout.ts` now.

Script rewritten. Typechecking the framework.

Types pass (the two control-app errors are in files I didn't touch). Now regenerating the shipped client bundle in `module-assets.ts`.

Bundle regenerated. Running the existing checkout suites to see what this supersedes.

Most failures are tests that pin the superseded actions row. Looking at the ones that may be real breakage.

Debugging why the new back link renders 0px wide in Chromium.

The new nodes are created after the design's type roles are resolved, so they miss the site's font. Resolving them against the design in the layout step.

BUG-373 green. Now removing the tests that only pinned the superseded actions row (BUG-367 buttons, BUG-368 actions, BUG-370's checkout cases).

Now checking what else (priming, builder, KB code) still mentions the checkout's Continue.

Existing suites updated. Now writing the BUG-396 UATs in real Chromium.

All 8 pass. Checking the empty-box check isn't vacuous by temporarily leaving Continue's box in.

The check catches the snub. Running the wider regression set now.

That BUG-377 failure is a `bin/deploy` dry-run that passes in the main checkout. It fails only in the worktree and has nothing to do with checkout. Running the workers suites next.

A few reconciliation suites fail in the worktree. Checking whether they also fail on a clean checkout.

Those five fail the same way on a clean checkout, so they were failing before this change. Now checking the version-bump and promotion conventions before committing.

Committing the code on the branch.

Now the merge-back sequence: lock, bring xgd-working into the branch, bump the version.

Landed on xgd-working and set to free_coded. Now updating DOC-47's checkout paragraph, then the ticket body.

Now the ticket body: keeping the operator's spec and appending what landed.

BUG-396 is fixed and merged into xgd-working, and the ticket is at `free_coded` (commits `c9401a78…` and the version bump `5331c611…` to 0.2.840, 5 story points). It isn't a duplicate. It hasn't been deployed yet.

**Root cause:** not confirmed against the affected business's real template, because that needs production admin access I didn't have. The fix covers the likely cause anyway: a site template without the standard Continue/Cancel row got no payment form place, and the page hid Continue regardless, leaving the empty box.

**What changed:**
- **Every checkout page fills in as one page.** There is no Continue button. Any Continue or Cancel in a site's own template is removed, along with any box that held only that button, so no empty styled box is left.
- **Cancel** is a plain text link at the top of the page, above the item: "← Back to <item name>", or "← Back to the shop" if the item has no product page. A page's own `cancelLabel` still sets the wording. With a payment session open, it still goes through the order-cancelled page, which releases the hold.
- **The payment form always has a place:** after the total, or at the end of the page if the template has no total.
- **If the form can't start,** the page shows "Payment could not be started. Nothing was charged; please try again." with a **Try again** button where the form would be, and cancels any session it opened. If the item has just sold, only the message shows, with no Try again.
- **Stored pages still validate.** A saved `continue` button or `continueLabel` is accepted but draws nothing.
- **Consultant guidance (DOC-47)** now describes this layout. That change is in the knowledge base on xgd-working, so the next production deploy ships it.

**Tests:**
- There are 8 new tests in `tests/test_UAT_FC_BUG-396_checkout_fills_in.test.ts`, run in real Chromium with a stand-in for Stripe's script. One rebuilds the shape that broke in production: Continue inside the site's own button box, a filled Cancel, and no total. I confirmed the "nothing empty left" check fails if Continue's box is left in.
- Older checkout tests that checked the Continue/Cancel row were updated. Two whole files and four individual tests that only checked that row were deleted.
- All the checkout suites pass (BUG-363/367/368/370/373/374/375, REQ-643/644/666, BUG-396), in both the browser and Worker test setups.
- Two suites fail, but not because of this change. `reconciliation-publish-revision` and `-beyond-l1-authoring` (5 cases) fail the same way on a clean checkout. The BUG-377 deploy dry-run fails only inside a branch worktree and passes in the main checkout.

**One limit:** the builder's editing view doesn't apply this layout, because moving nodes would shift the addresses the editor uses. A saved template's own Continue box can therefore still show there, empty, until the owner or consultant removes it.

To close the ticket's "Done" line, deploy and check that business's preview checkout: choosing a region should show Stripe's form, with the back link at the top.

<!-- xgd-chat-end -->