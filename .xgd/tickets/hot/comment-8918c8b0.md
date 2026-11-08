---
uid: comment-8918c8b0
id: COMMENT-7876
type: comment
title: Comment on bug BUG-362
created_by: xgd
created_at: '2026-11-05T22:54:38.713694+00:00'
updated_at: '2026-11-05T22:56:58.558281+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-0e45a0ed
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "de6c3464-24a1-4979-a7f0-fa6bc8eea6ad",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ee67a9a8-bd9a-4f01-b753-8e28c5aff185-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T22:54:03.194119+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="ee67a9a8-bd9a-4f01-b753-8e28c5aff185-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T22:56:56.773851+00:00" -->
#### Claude
Investigating how the preview learns about draft changes; next I'll trace the client-side refresh trigger.

Tracing where the draft feed's "which pages changed" scope comes from.

Checking how product pages are generated from the template, to confirm my hypothesis: the preview's "does this change touch the shown page" check misses generated product pages.

Root cause found. Updating the ticket, then cutting a branch.

This is a one-line client fix plus a test, done in this turn, so I'll take the session lock rather than set up a worktree.

Now the test, modelled on the BUG-248 suite.

Passing. Checking the new test fails without the fix (and isn't skipped):

The test fails without the fix and passes with it. Now the version bump and commit.

I fixed BUG-362, and the ticket is now at `free_coded` with commit `2e81f4e02bf59ac572ac77c48d76ec5dbf7d9325` (version 0.2.790).

**Cause:** the edit being inside a component slot had nothing to do with it. The builder's write was recorded correctly under the product template page's id. But the page the client was looking at is a generated product page at `shop/<item>`, made from that template. Generated pages don't appear in the site's page list. Before refreshing, the preview checks whether a change touches the page on screen, and that check compared the changed page id against `shop/<item>`. It could never match, so the preview never refreshed. That check's own comment says a page missing from the list should count as touched; the code just didn't do it.

**Fix:** one line in `touchesShown` (`apps/control-app/src/builder/app.js`). If the page on screen isn't in the list, the preview refreshes. That covers generated product pages, and also pages renamed or deleted since the list was loaded. A listed page still ignores changes to other pages. The trade-off is that a product page now refreshes on any page change, not only template changes, but the existing limit of one refresh per interval keeps that cheap.

**Tests:** `tests/test_UAT_FC_BUG-362_generated_page_refreshes.test.ts` has two:
- A product page on screen refreshes when the template changes. This test fails without the fix.
- A listed page still ignores a change to another page.

These and the existing BUG-248 and BUG-192 preview suites all pass (14 tests).

I took the session lock instead of a separate branch, since it was a one-turn fix, and released it afterwards. I've rewritten the ticket body with the cause, fix and test plan (your repro text is kept as it was) and set story points to 1. The three `.xgd/` files still showing as modified were already modified before I started, and I left them alone. Moving it on to `ready_to_reconcile` is up to you.

<!-- xgd-chat-end -->