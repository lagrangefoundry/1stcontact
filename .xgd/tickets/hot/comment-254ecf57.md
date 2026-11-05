---
uid: comment-254ecf57
id: COMMENT-7758
type: comment
title: Comment on bug BUG-339
created_by: xgd
created_at: '2026-11-04T15:39:40.948311+00:00'
updated_at: '2026-11-04T16:23:25.705581+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2b363d43
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ead823d8-4a55-41a4-9a2f-7192b4b00400",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4980a772-f107-4692-8d61-2115464974d8-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T15:38:20.165686+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="4980a772-f107-4692-8d61-2115464974d8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T16:23:15.649021+00:00" -->
#### Claude
Reading the Shop code and the existing BUG-333 browser suite before scoping.

Checking which existing browser tests touch the Name field, Show more, and the chevron, since this change moves them.

Scope is clear from the ticket; starting work. Setting status and cutting the branch.

As the memory predicts. Attaching the worktree by hand and linking dependencies.

Implementing in the worktree now: shop.js first.

Now the chevron move, then the CSS.

Adding a rename helper to the test support and updating the existing suites that used the removed Name field and `input` attribute values.

Writing the new BUG-339 UAT file. Checking first how the split collapses so I can assert the moved chevron still works.

Two fixes to my test before running: name widths are flex-filled (measure `scrollWidth` instead), and the resize bounds should be the Shop panel, not the scrolling detail.

Running the new BUG-339 suite in real Chromium.

The sandbox exclusion only applies when `pnpm test:browser` is the whole command, so I'm re-running it bare.

All 6 new UATs pass. Now the rest of the Shop browser suite in batches, plus the jsdom Shop tests.

Whole browser suite covered except any files I haven't listed — checking, and running the jsdom Shop tests.

Updating the jsdom REQ-631 test to rename through the title, the same way.

Running the jsdom suites that scan `builder.css` (style rules, story board, etc.) and lint.

That glob failed under zsh and launched the entire suite instead; stopping it and running the intended file list.

Baselining these five failing files on the clean xgd-working checkout to see which are mine.

The same 7 fail on clean xgd-working, so they were already failing before this change. Now lint and formatting on the changed files.

No linter is configured in this repo; the tests are the gate. Committing the work on the branch.

Now updating the ticket body with what landed, keeping the existing body intact.

The body update is on xgd-working (the `get` output was just truncated). Now the merge-back: lock, merge xgd-working into the branch, bump, fast-forward, gate.

All six parts of BUG-339 are fixed and merged into xgd-working. The ticket is at `free_coded` (version 0.2.755, 5 story points). It has not been checked on dev yet; that needs you.

**What changed in the Shop tab**
1. **Type sizes:** the Shop panel now sets the builder's control size (13px) at its root. Anything without its own size, including item names, prices and category names, comes out at 13px instead of the page default. View titles are 16px. A new test checks every visible piece of text in the list, the item detail and the import screens, and fails on any other size.
2. **Filter bar:** the `«` that closes the list is now the last control on the search line, appearing once. It is the list's own button moved there, so it still closes the list. **Show more** is now a `More…` link straight after the count. It loads the next page, works with the filters, and disappears once everything is loaded.
3. **Rows:** the Live and Sold pills end at the row's right edge, so they line up down the list whatever the name length.
4. **Name:** the Name field is gone. Double-click the title, or press Enter on it, to rename. Enter or clicking away keeps the new name as an unsaved edit; Escape puts the old name back. Save and Discard changes treat it like any other field. An empty name is refused at Save with "An item needs a name.", the same message the Name field got. While the name is empty the edit box stays open, because there is no title to double-click.
5. **Text boxes:** the cause was horizontal resizing past the column, where the panel clipped the box. Text boxes now resize vertically only, never wider than their column and no taller than half the window.
6. **Attributes:** values now start at one line and grow as you type, up to 5 lines, then scroll. Line breaks survive Save and reload, and the two-column layout is kept.

**Tests**
- I added 6 browser tests, one per part, in `tests/browser/test_UAT_FC_BUG-339_shop_type_and_layout.test.ts`.
- I updated the existing tests that used the Name field: the j1, j2, j5 and j6 browser journeys and the jsdom REQ-631 test now rename through the title. j5 and REQ-639 now find attribute values as multi-line boxes.
- The whole Shop browser suite passes: 11 files, 41 tests, in real Chromium.
- The other jsdom suites that touch the Shop or `builder.css` pass, except 7 tests in 5 files (BUG-52, BUG-53, REQ-189, REQ-398, workspace-origin). Those fail the same way on clean xgd-working, so the failures were already there before this change.

**Still to do:** the ticket's definition of done includes checking it on dev after `bin/deploy --env dev`, with screenshots of the list and detail recorded on the ticket. That needs you to deploy and take them.

<!-- xgd-chat-end -->