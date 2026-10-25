---
uid: comment-c5d7d7df
id: COMMENT-5585
type: comment
title: Comment on bug BUG-260
created_by: xgd
created_at: '2026-10-24T00:20:15.129891+00:00'
updated_at: '2026-10-24T00:37:44.552793+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-258f3ced
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2e5db502-8f14-433d-8a04-636d955e7587",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="136e437d-5eeb-413c-8c94-18688f86b436-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T00:19:24.282328+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="136e437d-5eeb-413c-8c94-18688f86b436-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T00:37:42.095508+00:00" -->
#### Claude
Branch cut, now reading the render code to design the font fix.

Still mapping the font plumbing (use_font, font-doc, layout check) before deciding the design.

Tracing which write path created Ariel's font-less header.

Single render path confirmed; now reading the layout-check site and standalone part render.

Design is settling: one site-wide font set every document draws from, plus a check in the existing site-structure report. Checking the platform font index API.

Writing the code now: a shared `siteFontFaces` helper, the render change, the check, and the write-time rule.

Now the generator's `renderPage`/`renderPart`.

Typechecks clean. Now looking at existing REQ-422 and font UATs to build the Chromium test on their fixtures.

Writing the Chromium UAT now (checking the library holds Bebas Neue and Barlow first).

All 4 pass in real Chromium. Confirming they fail without the fix.

Pre-fix: 3 of 4 fail as expected (the first is a regression guard for the new binding). Now the regression scope.

Regression batches done; baselining the unfamiliar failures in the main checkout (which lacks this change).

All pre-existing except AC1038, which passes on main. Checking it in the worktree.

AC1038 passes on its own (flaked under batch load). Updating the ticket body with what landed, then committing.

Committed; the ticket append failed on a flag. Checking the CLI quirks note.

Ticket updated. Now the merge-back: lock, merge working into the branch, bump, fast-forward, promote.

BUG-260 is fixed and merged into xgd-working, and the ticket is at `free_coded` (commits `8d21a99b…` and `151ad912…`, version 0.2.605). A shared header or footer now loads every font it names, both on every page and when opened on its own. Ariel's site needed no edits. Their header and footer now get Bebas Neue and Barlow from what the home page already serves.

**How it works.** I took the "one font set for the whole site" option rather than copying fonts into each part. A new helper, `siteFontFaces`, collects every font that any page or part of the site loads, with each font listed once. The renderer adds that whole set to every page it draws. A browser only downloads a font when some text actually uses it, so fonts a page doesn't use cost nothing. If a page loads its own copy of a font under the same name, its copy wins.

**The check.** There's a new `unserved_font` finding in the site-structure check. It shows up in the builder's post-build report next to the layout faults. It flags any page, or now also a header or footer, whose text starts with a font nothing on the site loads, even when a fallback like `sans-serif` keeps it valid. It only flags fonts in the platform's font library. System fonts like `Georgia, serif` are never reported.

**Two related changes to keep things consistent:**
- **Saving an edit:** the existing check that refuses unloaded fonts now counts any font the site loads. A header can use a font that only the home page loads, even with no fallback. A font nothing loads is still refused.
- **Editor font control:** for text on any page or part, it now lists the site's fonts. Before, it listed only that page's own, so text in the header showed none.

**Creating a header or footer** (`add_page`, `share_section`, `use_font`) is unchanged. Ariel's header was made by `add_page` and then given its fonts by `set_l1`, which is fine now that fonts belong to the site.

**Tests.** `tests/test_UAT_FC_BUG-260_shared_parts_load_their_fonts.test.ts` has 4 tests, run in real Chromium. Here Chromium only starts with `CHROMIUM_LAUNCH_ARGS=--single-process`; without it the two browser tests skip. Without the fix, 3 of the 4 fail. The fourth already passed before the fix; it guards against the new way of loading fonts going wrong. I re-ran the 216 suites that touch fonts, rendering and shared headers and footers. Every failure that showed up (BUG-48, REQ-101, AC867, AC1333, REQ-51, REQ-349, REQ-350, REQ-371, the REQ-148 workers test and the known capture tests) also fails on a clean xgd-working. AC1038 failed once in a batch run, but it passes on its own and passes on main.

The dev environment serves a frozen copy of the build, so you'll only see the change on Ariel's dev site after you run `bin/deploy --env dev`.

<!-- xgd-chat-end -->