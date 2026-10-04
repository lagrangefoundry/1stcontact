---
uid: comment-faaa37b1
id: COMMENT-4876
type: comment
title: Comment on request REQ-377
created_by: xgd
created_at: '2026-10-04T00:16:44.444704+00:00'
updated_at: '2026-10-04T00:40:43.833855+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-02731eb0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4fa2711b-760e-4c37-a9aa-795c0d50f77e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="365a762e-72a4-42c6-8793-549dfcedbbe1-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T00:15:41.054291+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="365a762e-72a4-42c6-8793-549dfcedbbe1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T00:40:43.250728+00:00" -->
#### Claude
I'm reading REQ-377's capture code. Next I'll mark the ticket `free_coding` and cut its branch.

I'm working through `extract.ts` to see where to record `scrollY` and `sticky`.

I've mapped the capture side. Now I'm looking at how the fold builds nodes, to see where a `sticky` hint could land for issue 2.

I'm checking how the renderer sizes the root. A pin only holds while its parent is taller than it.

I'm tracing how the `clip` axis travels capture → sections → value-axes → fold, so that `sticky` can follow the same route.

I've got the full path. Writing issue 1 first: the settle scripts.

Now the drivers: both must end the settle with `SCROLL_TO_TOP`.

Now the extractor records its own `scrollY`, and the pipeline keeps it.

Issue 1's capture side is done. Moving to issue 2: recording the sticky ancestor in the extractor.

Adding the `StickyAncestor` type and carrying it through types, extract, sections and value-axes.

Next I'm checking the SVG-panel path, which issue 4 also touches.

Issue 2's capture side is plumbed. Now issue 4: the run's surface walk. Reading `surfaceFillOf` and `surfaceOf`.

Issue 4's capture side is written. Now checking that `surface.panel` survives into the bundle and doesn't become a spurious diff axis.

Issue 4 is wired through to the fold. Now the sticky fold for issue 2. First, every place leaves record their clip frames.

Writing `pinStickyGroups` in the fold, next to `nestClipRegions`.

The typecheck pulls in control-app errors that pre-date this change. Filtering to the files I touched:

Clean. Now the schema bump to 17, with its axes.

The schema is at 17 and the code typechecks. Next I'm writing the UATs, reusing REQ-370's jsdom harness for running the real page scripts.

I'm writing the test file. It drives the real settle and extract scripts under jsdom with an emulated smooth scroll, and the real fold on fixtures.

The `paintStack` test is clumsy as written. Simplifying it before running:

The fresh worktree lacks control-app's generated files, a known artifact (it's in my notes). Checking my note on how to regenerate them.

The generated directory is a gitignored build artifact. Copying it in from the main checkout is harmless and lets the suites run here, so I'll do that.

All 18 REQ-377 UATs pass. I'm launching the full test suite in the background (it's long) and will compare its failures against a clean baseline.

While it runs, I'm reviewing the full diff.

The diff is clean. Checking on the full run:

30 files fail. Most are workers/auth/filing suites this change doesn't touch. To be sure, I'm running the failing files in the main checkout (the clean base) for comparison.

Four files fail only on my branch. Three are copy-edit/webui suites, which my notes say break by location in a worktree. BUG-179 (values-diff) is capture-related, so I'm reading its failures first.

Switching to `el.localName === 'svg'`. It's correct for both HTML and SVG namespaces, and it doesn't throw on a stub.

BUG-179 passes now. Next, the three copy-edit failures:

Ticket updated. Now committing on the branch.

Something else changed: `packages/framework/src/modules/module-assets.ts`, which I didn't touch. I left it out of the commit. Checking what it is:

It's a generated bundle that the test run rewrote. Restoring it, since it isn't part of this work:

Taking the merge lock and merging into `xgd-working`:

Clean merge. Re-running the touched suites on the merged `xgd-working`, since other sessions may have landed capture code meanwhile:

All pass. (The modified `request-2dabea8f.md` was already dirty before I started; it isn't mine.) Moving the ticket to `free_coded` and letting the gate bump the version:

REQ-377 is at `free_coded`, merged into `xgd-working` (commits `384ab3dea` and the version bump `93d4a1db`, 0.2.473). The branch is cleaned up. Issues 1, 2 and 4 are coded; issue 3 has no code, as the ticket says. None of it is verified against the real page yet: Chromium can't launch in this sandbox and I couldn't re-capture the bundle.

**Issue 1 — the page is measured at rest.**
- The settle now forces instant scrolling (`html,body{scroll-behavior:auto!important}`).
- A new shared `SCROLL_TO_TOP` script scrolls to the top instantly, then waits (up to about 2 seconds) until `scrollY` is 0. The settle scroll ends with it, and both drivers run it again as the last step of their settle, because a page script can scroll after the network goes quiet.
- Every read now records the `scrollY` it was taken at, in `capture.json` and in the matrix notes for any projection read away from the top. I chose to note those reads rather than refuse them.
- The capture schema goes 16 → 17, so the hearingzone bundle now reports itself as needing a re-capture.

**Issue 2 — sticky headers.**
- Every run and field records the ancestor the page pins to the viewport (`position: sticky` or `fixed`), with its box and offset. `position` is now a recorded coverage property.
- The fold groups everything inside that pinned box (runs, plus the fills behind them) into one L1 `sticky` node. That node has to sit inside a page-tall "rail": the fold's root is about 0px tall, and a sticky box only holds while its parent is on screen.
- The pin holds at the page's own stacking level (`z-index: 18` on hearingzone) when the capture records it.
- Only boxes that hold from the very first scroll are pinned (headers, nav bars, fixed banners). A sticky sidebar holds only through its own section, which the capture doesn't record, so it is left scrolling.

**Issue 4 — runs over an SVG panel.** Those runs now record the panel's fill and mark their surface as a panel, and the fold doesn't build a second surface from that fill. Without the mark, the same input folds to an extra full-width `#224e7a` band, which is the double paint REQ-370 was avoiding.

**Tests:** 18 UATs in `tests/test_UAT_FC_REQ-377_sticky_header_at_rest.test.ts`. The capture cases run the real page scripts in jsdom on an emulated smooth-scrolling page that reproduces the race. On the full suite, 30 files fail. Rerun in the main checkout, 26 of those fail there too. Of the four that failed only in my worktree:
- BUG-179 broke on my change. Fixed, and it passes.
- The other three fail on the worktree's location (webui fonts returning 503, and a `bin/` script run from the worktree path), not on this change.

The ticket body has a new "What landed" section and test plan, with the original text kept.

**What you need to do next:**
1. Re-capture `www.hearingzone510.com/index`.
2. Re-run the ticket's own checks: the header `y` probe should read about 7.6 everywhere, and `grep -c '"sticky"'` should be at least 1.
3. Re-measure issue 3, which the ticket deferred until this re-capture.

Promoting the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->