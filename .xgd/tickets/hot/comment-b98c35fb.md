---
uid: comment-b98c35fb
id: COMMENT-7193
type: comment
title: Comment on request REQ-639
created_by: xgd
created_at: '2026-11-03T16:28:49.509147+00:00'
updated_at: '2026-11-03T18:39:05.586638+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ec5d18c6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8f3d625e-deaa-435b-b572-4805d9c9a4c9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5923cd1a-1f8d-4f15-bb5b-1e49ae2961f5-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:27:39.787453+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="5923cd1a-1f8d-4f15-bb5b-1e49ae2961f5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:32:48.419817+00:00" -->
#### Claude
Reading the ticket and the existing Shop tab code and tests before I set the ticket to free_coding and cut the branch.

I haven't started coding. REQ-639 depends on BUG-333, which another session is still building, so I need one decision from you first.

**The dependency.** REQ-639's test plan asks for UATs "in the BUG-333 acceptance-suite style: real browser via `pnpm test:browser`, real router, signed-in session, migrated store." That suite doesn't exist on `xgd-working` yet:
- `free-BUG-333` has one commit, and that commit rewrites `apps/control-app/src/builder/shop.js` (about 130 lines) and `builder.css`. Those are the same files this ticket changes.
- The harness itself (`pnpm test:browser`, `vitest.browser.config.mts`, `tests/browser/`) exists only as uncommitted work in BUG-333's worktree.
- Per BUG-333, `pnpm test:browser` can't run inside the sandbox until you add it to `sandbox.excluded_commands` in main's `.xgd/permissions.yaml`, and it must not fall back to `--single-process`.

**Option A (my recommendation): wait for BUG-333 to merge, then build REQ-639 on top of it.**
- The UATs go into the real acceptance suite, as the ticket says.
- I rebuild the item detail and filter bar on BUG-333's version of `shop.js`, so there's no merge fight over the same lines.

**Option B: build now with interim evidence, and move it into the acceptance suite later.**
- The server-side Availability filter (Any / Available / Sold out, with total and paging) gets tested against real D1, like `test_UAT_FC_REQ-634_shop_api.workers.test.ts`.
- The icon buttons, their labels and order, the `+` add buttons, and reorder/remove get tested in a DOM over the transport double, like REQ-631's suite.
- The geometry checks (row on one line, centred under the photo, aligned columns, font sizes, filter bar on two lines) run in the degraded `--single-process` Chromium, with the panel rendered over the double, not the real router or session.
- I'd change the ticket's test plan to say so. Whoever merges second, BUG-333 or me, resolves the conflicts in `shop.js`.

The Collection-list section needs nothing either way. You confirmed it in the ticket.

Which do you want? If B, I'll set REQ-639 to `free_coding` and cut `free-REQ-639` straight away.

<!-- xgd-turn id="282b0845-c97d-4614-9953-5c29fafc9cb6-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T18:12:38.510532+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="282b0845-c97d-4614-9953-5c29fafc9cb6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T18:39:01.901071+00:00" -->
#### Claude
BUG-333 has merged since I asked: `pnpm test:browser` is now on `xgd-working`. That settles it as option A, so I'm starting. First I'll check whether the ticket changed.

The scope has grown since I last read it: the Collection filter now gets a "None" option. Setting the ticket to `free_coding` and cutting the branch.

Now reading the code: shop.js on the branch, the items endpoint, and the BUG-333 suite.

Server side first: `collection=none` and `availability=available|sold_out` on the items list.

Now the panel. Reading shop.js.

Server filters are in. Now reading the BUG-333 browser harness before I rework the panel layout.

Generic — good. Now rewriting the panel's list controls and item detail.

Now the item editor's form section.

Editing the Shop CSS in place.

Now updating J5's photo-add step for the `+` button, then writing the REQ-639 browser suite.

Tests written. Running the jsdom shop suite and a type check first, then the browser suite.

REQ-634's UAT finds the price label as the input's wrapping `<label>`. The label is now a `for`-linked grid cell, so I'm switching that assertion to `input.labels`. It checks the same thing.

J4, J5, the filter-bar UAT and the filter UAT all pass. The other three fail on setup: with 57 items the target item isn't in the first page of 50. I'll search for it by name first.

All five pass. Before committing I want to see the item detail and filter bar myself, so I'll take a throwaway screenshot.

The list header is a flex row, and the filter block has no `min-width: 0`, so it grows past the pane. Fixing that, and making the filter-bar UAT require every control to sit inside the list pane.

With the wider split, the search and count fit on line 1 and all four filters fit whole on line 2. Restoring the test without the screenshot lines and running the final browser pass.

J4 passed earlier with the same filter code. Since then only the split width and the wrapping CSS have changed, which shouldn't affect filtering. Re-running J4 alone to see whether it's flaky.

All 13 pass. Cleaning up the temporary pnpm setting and any files the suite's `1c assets` build rewrote, then the dev store check.

Dev store counts recorded. Now the commit. Checking my notes on this repo's version-bump and promotion steps first.

Committing the work on the branch.

Updating the ticket body to match what was built, keeping the operator's existing sections.

Ticket updated. Now merging back: take the lock, merge `xgd-working` into the branch, bump the version, fast-forward, then move the ticket to `free_coded`.

Nothing on `xgd-working` touched code while I worked, so the test results still stand. Moving the ticket to `free_coded`.

Version check passes. Tearing down the branch and worktree.

REQ-639 is built and merged into `xgd-working`, and the ticket is at `free_coded`. BUG-333 had already merged, so I built on top of it and the UATs are in its browser acceptance suite as the ticket asks. The ticket's scope had also grown a "None" collection filter, which is included.

**What changed**
- **Photo controls** are icon buttons: `<`, star, trash can, `>`, in the order Earlier, Make main, Remove, Later. Each keeps its old words as hover text and accessible name. They sit on one line, centred under the photo. A control that doesn't apply is greyed out (disabled) rather than hidden, so every row has the same shape.
- **`+` buttons** sit beside the Photos, Categories and Attributes headings, and beside Collection. The Photos `+` opens the Library choice under the heading.
- **Item fields**: Price, Availability and Collection are `Label:` rows in one grid, and the attributes use the same two columns. Categories are in equal-width columns. The item title is 16px (a new `--builder-heading-font-size` token) and section headings are 13px.
- **Filter bar**: the search and count are on line 1, and Collection, Category, Live and Availability on line 2.
- **Filters**: Availability (Any / Available / Sold out) and Collection "None" are applied by the items endpoint, so the count and paging follow them, and they combine with the other filters.

**Changes you didn't ask for**
- **Wider list pane.** At 1280px the default 30% list pane only fitted the four filters by cutting their text to "All colle…". The Shop's list now opens at 45%; the item editor is capped at 72ch, so it loses nothing. On a pane too narrow for all four, the filters wrap to another line instead of truncating. Anyone with a saved split position keeps it.
- **Fixed a race in the list.** A slow answer for an old filter could replace the newer filter's list; it's now dropped. This showed up once as a BUG-333 J4 failure. There's no dedicated UAT for it, but J4 and my filter UAT both pass with it.
- **Two existing tests adjusted.** BUG-333 J5 now adds a photo through the `+`. One REQ-634 UAT finds the price label a different way, because of the new grid layout.

**Tests**
- Five `test_UAT_FC_REQ-639_*` browser UATs pass, covering icons, order, centring, the reorder/remove round trip after a reload, the add buttons, column alignment, font sizes, the filter bar, and the filter totals checked against the store.
- BUG-333 J4, J5 and J6, the REQ-631 and REQ-634 jsdom suites, and the shop D1 suites also pass. I didn't run the rest of the browser suite (J1–J3, J7–J9).
- I looked at screenshots of the item editor and filter bar myself.

**Dev check.** I ran the endpoint's filter conditions against the dev store: 364 items in total, 37 Available and 327 Sold out, 34 in no collection (24 of them available, 10 sold out). The dev Worker won't show the new filters until the next `bin/deploy --env dev`, so these totals come from the store, not from the dev UI. They're recorded in the ticket.

The commits are `954eac292e` and `97c2abec40` (version 0.2.746), and the branch is cleaned up. Promoting the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->