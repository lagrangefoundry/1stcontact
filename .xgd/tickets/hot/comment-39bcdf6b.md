---
uid: comment-39bcdf6b
id: COMMENT-5862
type: comment
title: Comment on request REQ-619
created_by: xgd
created_at: '2026-10-31T19:08:59.997664+00:00'
updated_at: '2026-10-31T23:31:54.392478+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d13cd7a8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "49914690-3232-46f3-9a04-ee25de6e5c9a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-31T19:08:54Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-31T19:08:54Z" -->
#### You
Going through a full site build on production. 1) Upload links in questions - can we have them upload multiple documents? 2) I am finding Open Questions and "What you have told us" confusing. When I answer a question it seems to disappear (it's going to the What you have told us section, but that's further down the page). I think we should have one list; when a question is answered automatically collapse it and check the box.

<!-- xgd-chat role="assistant" ts="2026-10-31T19:08:54Z" -->
#### Claude
1) Several files per upload already exists but is only on by default for upload_role: site asks; background documents (business card, price list) take one file unless the consultant sets `multiple`. Proposal: every upload ask takes several files and the `multiple` setting is removed; decided at draw time so existing asks change too. 2) Merge into one list headed Questions, in posting order; an answered ask stays in place, ticked and folded; skipped likewise; an 'N of M answered' count by the heading; the N-new badge and reopen-to-change stay. Fold and tick machinery already exists (REQ-401), so this is mostly removing the second section. One ticket under EPIC-19 for both.

<!-- xgd-chat role="user" ts="2026-10-31T19:08:54Z" -->
#### You
The text box on the last question is not being rendered at a proper size, it is about 1/3 of a character high. Yes and fold this in too please.

<!-- xgd-chat role="assistant" ts="2026-10-31T19:08:54Z" -->
#### Claude
Likely cause: the long-answer box's grow() sets an inline height from scrollHeight in a microtask after the block is built; if the block isn't laid out then (Input view hidden, item folded, not yet attached) scrollHeight is 0 and the box is pinned at 0px plus padding with overflow hidden. Fix: three-row minimum in the stylesheet, grow() never sets a height below it, and re-grow when shown. Folded into the same ticket as item 3.

<!-- xgd-chat role="user" ts="2026-10-31T19:43:47Z" -->
#### You
Counting skipped as dealt with is right; I do not want to be directed to revisit something I explicitly skipped.

<!-- xgd-chat role="assistant" ts="2026-10-31T19:43:47Z" -->
#### Claude
Recorded in the ticket body: skipped counts toward N of M answered, is never highlighted or badged as outstanding, folds like an answered ask, and can still be reopened by the client.

<!-- xgd-turn id="f376db4d-45c1-460f-8bb4-ae23ff129b55-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T23:15:52.765439+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="f376db4d-45c1-460f-8bb4-ae23ff129b55-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T23:31:52.146751+00:00" -->
#### Claude
Ticket is at `free_coding`, branch `free-REQ-619` cut; now reading the plan panel and plan-core code.

Mapped the panel code; now finding every reference to the two section names and the existing tests that assert them.

Same collapse pattern exists in the comparison-comment box; I'll share one grow helper for both. Checking the story-board box and its CSS.

Now editing: the plan panel first (one list, count, grow helper), then plan-core/schema for `multiple`, then tests.

Config strings first.

Not enumerated; good. Now the plan panel edits.

Panel/CSS/comparisons done. Now plan-core and the ask schema (`multiple` removed).

Now update the existing tests that assert the two sections or `multiple`. Let me look at each spot.

Updated existing tests; REQ-403/417 helpers check the heading's own `hidden`, so they need to look at the hidden head row instead.

Now writing the REQ-619 UAT file. Checking BUG-196's file-pick helper to reuse its approach.

Now the UAT file.

Running the new UAT file and the touched jsdom suites.

All 14 pass. Now the existing suites I touched plus nearby plan-panel suites.

The new helper also caught a hidden ancestor outside the panel in that harness; scoping it to the panel's own head row.

Now the workers-pool BUG-196 suite and a typecheck.

Checking suites that read `plan-surface.json` or scan `builder.css`, since both changed.

Several failures look unrelated (users tab, origin, invite modal). Baselining those 7 files on the clean main checkout.

Clean checkout fails the same 6 (pre-existing); AC1038 and BUG-58 pass there but failed in the worktree. Checking whether those two are worktree-location artifacts.

Both are serving failures (font 503, page never loads) from the worktree's location, not this change. Reading my notes on the free_coded gate before committing.

Updating the ticket body with what landed before committing, so every UAT is backed by its text.

Now commit the work on the branch.

Committed (`8ce8a5b2`). Now the merge-back sequence: lock, merge working in, bump, merge back, promote.

Merge was clean. Re-running the REQ-619 and touched suites on the merged tree, then bumping.

Fast-forwarded onto xgd-working. Promoting to `free_coded`.

All three fixes are on xgd-working and REQ-619 is at `free_coded`. I didn't need to ask you anything first. I haven't deployed, so production still shows the old panel until you deploy.

**1. Several files on every upload question.** Every upload question now lets the client pick several files, whatever they are for, and the button reads "Upload files". The files still go in as one answer. The consultant's per-question one-or-several setting (`multiple`) is gone. A question saved with it still loads without error, the setting is ignored, and it offers several files like the rest.

**2. One list.** The panel has one section, headed **Questions**, with "N of M answered" beside the heading. Answering or skipping a question ticks it and folds it where it is; clicking its line opens it again to change the answer. Skipped questions count as answered and are never marked as new or outstanding. Questions keep the order they already had (when they're needed, then blocking, then when they were posted), and their status never moves them. If the consultant fills in one question while the client is typing in another, the client keeps the box, the cursor and their text.

**3. Collapsed text box.** The long-answer box is always at least three rows high. The cause was what we suspected: the box was sized while it wasn't on screen, which pinned it at 0px. It now ignores that zero reading and resizes once it is shown. That also fixes the cursor not appearing until you typed. The comparison-comment box used the same sizing code, so it now uses the same fix. No other text box on the Input tab hides its cursor.

**Tests:**
- 14 new tests, all passing.
- I updated the existing tests that checked for two sections or one-file uploads, and removed REQ-401's two-sections tests, which this replaces. The ticket body says this change supersedes them.
- After merging the latest xgd-working: 146 tests across 25 related files pass, and the BUG-196 upload tests pass (6).
- A wider run of tests that read the stylesheet or the consultant's question definitions failed 13. Six of those (REQ-189, BUG-52, two BUG-53, REQ-398, AC977) fail the same way on the clean checkout. The other seven only fail in my branch's checkout, because it couldn't serve files: a font returned 503, a page never loaded, and the builder-origin tests failed with it. None of those touch the plan panel.

The ticket body records what landed and which tests cover it. Commits are `8ce8a5b2` (the work) and `cc528204` (version 0.2.719).

<!-- xgd-chat-end -->