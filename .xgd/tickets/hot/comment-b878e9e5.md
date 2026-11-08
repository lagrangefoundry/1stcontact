---
uid: comment-b878e9e5
id: COMMENT-7907
type: comment
title: Comment on request REQ-658
created_by: xgd
created_at: '2026-11-06T20:06:57.115447+00:00'
updated_at: '2026-11-06T20:17:03.370676+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d8444219
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f8caed2e-9f53-49db-80c0-d5ab63706629",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="63a2351f-daa0-4c82-9607-aa6707eab75f-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T20:06:22.958854+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="63a2351f-daa0-4c82-9607-aa6707eab75f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T20:17:01.621029+00:00" -->
#### Claude
Not a duplicate (no other ticket covers a default home link on the logo). Now reading how image links work in L1 before cutting the branch.

Still investigating: finding how page-relative hrefs (e.g. the home link) are computed for nav, so the logo can use the same.

Plan is clear. Checking how the renderer wraps a linked image so I can confirm "no visual change".

The linked-image wrapper is `<a style="display:contents">`, so no box or layout change, and the cursor inherits pointer. Now looking at the BUG-276 tests to model the UATs on.

Not a duplicate. Starting work: marking the ticket `free_coding` and cutting the branch.

Branch cut. Setting up the worktree's `node_modules` links (per the known worktree recipe) so tests run against the branch's own packages.

Worktree is ready. Now finding the consultant/builder design guidance that talks about the header logo, so it can mention the default link.

Guidance spot found: `GOAL_LOGO_NOTE`, which rides every builder brief. Now writing the implementation in `design.ts`.

Implementation in place. Writing the UATs now (site build through the builder's own ops, plus a real-Chromium check that the link doesn't move the logo).

Fixed the async PNG helper. Running the new UATs and the BUG-276/REQ-462 neighbours.

The header also carries menu links, so counting `<a` was wrong. Fixing that assertion to check that no second anchor wraps the picture.

Four of five pass. The Chromium case skipped because the sandbox blocks a normal launch, so I'm re-running it in single-process mode.

Everything passes except one BUG-276 workers case. Checking whether that one is pre-existing by running it in the main checkout.

That failure is pre-existing on clean `xgd-working` (the design-completeness gate now fires first) and unrelated to this change. Next: typecheck and lint the touched packages.

Type errors are only in two untouched control-app files (pre-existing). Now a wider regression sweep over suites that render header/footer parts.

REQ-447 green. Quick check for other pins of the old wrapper string anywhere else in the repo (apps, browser tests).

No other pins. Now updating the ticket body to match what was built, then committing.

Ticket updated. Committing the work, then the lock → merge → bump → promote sequence.

Promoted to `free_coded` on the first attempt. Recording story points and cleaning up the branch.

REQ-658 is finished and parked at `free_coded`. It wasn't a duplicate: no other ticket covers a default home link on the logo.

**What visitors get:** on every site, the logo in the header and footer now links to the home page. It does this whether or not the site has a design, and it takes effect at the next build. The link is relative, the same as the menu's own home link. A screen reader announces it as "<business name> home page", falling back to the logo's alt text and then to "Home page". It only applies to the site's shared header and footer. A link the consultant gave on purpose is kept, and so is one on a group holding the logo. A logo that already acts or zooms is also left alone. The builder's brief now says the logo links home by itself, so it shouldn't add a second link.

**Things that differ from the ticket as written:**
- **No Python peer.** The ticket asked for one, but these packages in 1st Contact don't have a Python counterpart. That rule applies to lagrange-framework, so this change is JavaScript only.
- **Colour fix for all linked pictures.** The real-browser test found that the link made the logo inherit the browser's link blue. A normal image looks the same, but an inlined SVG logo drawn in the text colour would have turned blue. Every linked picture now keeps its surrounding text colour. Because the link's markup changed, three existing tests that checked the exact old string now check only its start. One recorded layout for an old site (REQ-447) also had four linked icons' colour updated from the link blue to the text colour; their position and size are unchanged.
- **Business name before alt text** for the link's name. Alt text is often "X logo", which would read "X logo home page".

**Testing:**
- The 5 new tests in `tests/test_UAT_FC_REQ-658_the_logo_links_home.test.ts` pass. The real-browser one confirms that at 375px and 1280px the logo's position, size and colour, and the header's size, are the same as without the link, and that only the cursor changes to a pointer.
- About 25 neighbouring header/footer/link test files pass, and typecheck is clean for the files I changed.
- One BUG-276 test (`…a_design_without_a_brand_is_refused…`) still fails. It fails the same way on a clean `xgd-working`, so it wasn't caused by this change.
- Typecheck reports two errors in `material-import.ts` and `zip-reader.ts`, which this change doesn't touch.

**Known limit:** in Chromium the logo link can't be reached with the Tab key, because linked pictures are wrapped in a box-less element (the same problem REQ-650 fixed for the image viewer). This change doesn't fix it; it works with a mouse and in a screen reader's list of links.

Commits are `253c5745` (the work) and `650a61fe` (version 0.2.804). The branch is merged into `xgd-working` and cleaned up, and the ticket body describes the final design.

<!-- xgd-chat-end -->