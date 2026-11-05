---
uid: comment-bb28ed42
id: COMMENT-7757
type: comment
title: Comment on bug BUG-338
created_by: xgd
created_at: '2026-11-04T15:38:36.719344+00:00'
updated_at: '2026-11-04T15:53:27.649880+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e333966a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "da88302d-f288-4d7b-8ef5-75da2b9dac39",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="68cd77ed-de5a-4313-9a0c-407c12457725-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T15:37:22.479770+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="68cd77ed-de5a-4313-9a0c-407c12457725-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T15:53:15.207667+00:00" -->
#### Claude
Investigating: catalog photos resolve to `shopPhotoPath(slug, n)`; now tracing where that path is served and why it 404s.

The screenshot path goes through `cf-driver.ts`'s origin resolver, not the router preview route — reading it.

Now finding who supplies `origin.file()` for the builder's draft screenshots.

Updating the ticket with the diagnosis and fix, then cutting the branch.

As the memory predicted. Attaching the worktree by hand and linking dependencies.

Now looking at BUG-333's existing tests for the preview photo route, to model the UAT on them.

Wiring done. Typechecking control-app and tools/generate.

control-app typechecks clean. Now the UAT. Looking for how existing workers tests create a Library material with bytes, and for the catalog site fixture.

Writing the UAT. It drives the production assembly (`sessionFidelity` over the router's own store opener), so I'm exporting `openSiteStore` for the test the same way `sessionFidelity` is exported.

Tightening two cases: cross-business should ask the owner's site for a slug only the other business has, and "not live" should go through `saveItem` rather than raw SQL.

All 3 pass. Checking that the screenshot UAT actually fails without the fix (reverting just the renderer change):

RED confirmed: without the fix the screenshot gets a 404 for the card photo, which is the reported symptom. Running the regression scope: the catalog, screenshot and preview suites.

The earlier empty runs were zsh not splitting `$W` (a known gotcha from memory). Rerunning the full scope with explicit splitting:

Workers suites: 53/53 pass. Node suites: 42 pass, 1 skipped. Committing on the branch.

Committed. Now the merge-back and version-gate loop, following the recipe that works in this repo.

Moved to `free_coded` at version 0.2.753. Now the overlay check the merge recipe requires, then cleanup.

Overlay is clean (0 candidates). Setting story points, then tearing down the branch.

BUG-338 is fixed and merged into `xgd-working`. The ticket is at `free_coded` (version 0.2.753, 2 story points). It's not deployed yet: dev and the builder keep showing broken photos until `bin/deploy` runs.

**Cause:** this wasn't the BUG-337 change. BUG-333 moved catalog photos to `shop-photos/<slug>/<n>`, but only the router's `/preview` route knew that path. The browser the builder uses for screenshots never reaches the router; its requests are answered in-process by `previewOriginResolver`, which returned 404 for that path. So every card painted its alt text, while images under `assets/` still loaded. Until BUG-335 was fixed, the page failed to render at all, which hid this.

**Fix:** `PreviewRenderer` now serves `shop-photos/…` itself. Both the `/preview` route and the screenshot browser read previews through it, so builder screenshots, comparison captures and tester-feedback shots all get the photos. The router's separate handler for this path is deleted, so there's one implementation.

- It only serves a live item of the current business. Anything else is a 404.
- I exported `openSiteStore` so the test can use the same store the consultant host opens.
- The old route sent `cache-control: no-store` on photos. Now they're served like any other preview file, with no cache header.

**Evidence:** the new tests are in `tests/test_UAT_FC_BUG-338_screenshot_serves_catalog_photos.workers.test.ts`:
- A builder screenshot of a catalog draft gets each card's photo bytes. An out-of-range index and an unknown slug get 404s.
- `/preview` serves the photo, and refuses another business's item through this business's site.
- A not-live item's photo is not served.

With the fix removed, the screenshot test fails on exactly the reported symptom (404 where the photo should be). Related suites pass: 53/53 workers tests (catalog, Shop, screenshots, preview) and 42 node tests, with 1 skipped. The `tools/generate` typecheck reports two errors in `apps/control-app/src/material-import.ts` and `zip-reader.ts`. I didn't touch those files and didn't confirm whether they also fail on a clean checkout.

I didn't run the BUG-333 J7 test, which checks shop photos in a real browser. It needs `pnpm test:browser`, which is fiddly from a temporary worktree.

The ticket body's Fix section now describes the code as it landed. It's ready for you to move to `ready_to_reconcile` when you choose.

<!-- xgd-chat-end -->