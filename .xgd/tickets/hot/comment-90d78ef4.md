---
uid: comment-90d78ef4
id: COMMENT-7785
type: comment
title: Comment on request REQ-647
created_by: xgd
created_at: '2026-11-04T20:10:13.397166+00:00'
updated_at: '2026-11-04T20:52:58.202420+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-52538890
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c069762d-2996-4f2b-9ffa-d72c9e79503d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9aa15cb8-6cd7-4058-b7c5-2cfa6843f523-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T20:09:17.282673+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="9aa15cb8-6cd7-4058-b7c5-2cfa6843f523-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T20:45:37.663267+00:00" -->
#### Claude
Reading the ticket and code now: REQ-647 has three parts, and REQ-646 (container runtime) is still draft, so I'm mapping how site images get their renditions at publish today before I pick the scope.

Branch cut cleanly. Making the worktree runnable (node_modules links, generated artifacts).

Mapping how the renderer's delivery manifest turns `/assets/<name>` into `srcset`, so shop photos can join that same path instead of the gate.

Three stores to extend (fs, memory, d1r2). Before writing, checking item 3: does Buy already re-check the item on the server?

There is no Buy on the public site yet: the catalog shows enquiry where Buy would go, and nothing creates a checkout for a catalog item. Checking whether another ticket owns the Buy endpoint.

Writing the code now, starting with the framework's delivery-name rule and the R2 key layout.

Now the framework edit: one named directory, `assets/s/`, gets admitted, and every other nested path stays refused.

Now the R2 keys in revision-model.ts, under the site's own root so erasure still reaches them.

Next, the module that prepares shop photos. Checking the `AssetRef` shape the ladder takes.

Writing `apps/control-app/src/catalog-photos.ts`: it prepares only the materials missing from the site's index, one photo at a time, with each photo's ladder written straight to R2.

Dropping a stray import I don't use.

Now the render side: `SiteCatalog` carries its photos' delivery entries, and publish and rebuild merge them into the manifest the render uses (not the one stored).

Now catalog.ts: the inventory carries each photo's material, and publish and rebuild draw a published catalog through `prepareCatalogPhotos`.

The import landed inside a doc comment. Fixing that.

Now catalog.ts itself.

A rebuild would prepare photos even for a site that has never been published. Checking the other `rebuildLiveRevision` callers before I make its catalog lazy.

One caller, so the catalog option becomes a function the rebuild calls only once it has found a live revision.

Now the router wiring: publish and every rebuild get the business's Library reader, its R2 bucket and the deployment's ladder.

Now public-site: the gate route goes, and `assets/s/<file>` resolves straight to the site's R2 key with the immutable cache.

Code paths are in place. Typechecking with `tsc` directly, not through `pnpm` (it rewrites the main checkout's links from a worktree).

The intersection type doesn't widen the photo elements, so I'm switching it to `Omit`.

Typecheck is clean. Now updating the existing tests that call `catalogItemChanged` or expect `/shop-photos/` on the published site.

Writing the new UAT. Checking for an existing fake image sizer and the catalog fixture's page paths.

Running the new UAT plus the REQ-633 and BUG-338 suites.

The index is right and the ladder landed. The catalog module renders its card subtree without being handed the delivery manifest. Checking how the module renders its slots.

Fix: `CatalogProps` carries the photos' delivery and the catalog component passes it to its card and product fragments. Three small framework edits.

Now fixing the test: drop the debug lines and resolve URLs against the page's `<base>`.

`srcset` is emitted now and every candidate resolves. `sizes` is missing, so the browser would assume full viewport width. Looking at the tag.

All 79 pass. Now typechecking the framework and generator packages, and running the wider set of suites that touch the catalog, publishing, public-site and the gate.

The `tools/generate` errors are in files I didn't touch (`material-import.ts`, `zip-reader.ts`). Confirming they fail the same way on the main checkout.

Same two errors on main: pre-existing. Now the wider regression run.

That run printed nothing, probably a timeout before the summary. Rerunning into a log file so the output survives.

zsh doesn't word-split an unquoted variable, so the whole list went in as one filter. Using `${=F}`.

Those two `reconciliation-*` suites get a 400 from `/api/publish` in 0 ms, which looks like request validation, not my code. Baselining them on the main checkout.

Same 5 failures on clean xgd-working, so they're pre-existing. Now the node-side suites.

Same `reconciliation-*` family on the node side. Baselining those too.

Also pre-existing (6 fail on clean main). Updating the now-stale comment on `SHOP_PHOTO_SEGMENT`, which still says the published site serves that path.

Good, no stray files (the copied `generated/` is gitignored). Quick re-typecheck of both apps and a lint check, then I update the ticket and commit.

Everything typechecks and there's no linter in this repo. Now updating the ticket body: I keep the existing text and append what landed, what is deferred, and the language each UAT traces to.

Ticket updated. Committing the work on the branch.

Committed. Now the merge-back sequence: lock, merge xgd-working into the branch, bump the version, then fast-forward back.

The merge hit a conflict in `shop.ts`: another change landed there while I worked. Looking at it.

Both sides only added an import. Keeping both.

Resolved. Checking what else landed on xgd-working in the files I touched, in case it interacts with this change.

Finishing the merge commit (merged state plus the version bump), then running REQ-645's guard and my UATs on the merged tree.

All pass on the merged tree, including REQ-645's guard. Re-typechecking control-app after the merge, then committing the version bump.

Now merging back into xgd-working with `xgd-merge` (sparse-safe) and promoting to `free_coded`. This runs as a retry loop, because other sessions' ticket commits can land on the tip between steps.

Promoted to `free_coded` on the first attempt. Setting story points, then cleaning the branch as its own call.

REQ-647 is only partly done. Item 1 (static photo renditions) is built, merged into xgd-working and parked at `free_coded`. Item 3 had nothing to attach to, and item 2 hasn't started.

**Item 1 – done (commits `ca7d0635`, version `65d331c7` = 0.2.763)**
- Published shop pages no longer call control-app for photos. At publish or rebuild time, each live item's photo is written to R2 under the site's own folder (`sites/<site>/catalog-photos/`). Its file name is taken from its content, and its resized copies sit beside it.
- The page names each photo `assets/s/<sha16><ext>` with a `srcset` and a WebP `<source>`. public-site serves these straight from R2 with a cache lifetime of one year (`immutable`).
- **Old path deleted:** the published site's `/shop-photos/<slug>/<n>` path and `ASSET_GATE.shopPhoto` are gone, and that path now returns 404. The builder's preview keeps its own Library-backed path, because it shows unpublished inventory.
- **Cost stays flat:** each site keeps an index of which Library photos it has already prepared. A rebuild reads only photos not yet in it, so a rebuild with no new photos reads nothing. I did this because looking up a photo in the Library scans all of the business's attachment records (BUG-341), so looking every photo up on each rebuild would make every Save grow with the Library.
- **Until item 2 lands, this work runs inside the Save or Publish request.** Normally that is one new photo. But the first rebuild of an existing catalog prepares every photo it has.
- **`sizes` is sometimes missing.** It appears only where the card's image has a set width, the same rule as every other site image. The test fixture's card has none, so its photos get `srcset` without `sizes`.

**Item 3 – no code: Buy doesn't exist yet.** The catalog shows an enquiry link where Buy will go, and the only checkout code works on invoices. The Buy endpoint belongs to `request-d78b1f29` ("Shop: orders, shipping zones, checkout page and endpoint, Buy…"), which is still draft. The ticket body now says that endpoint must re-check the item on the server at the moment of Buy, and that this UAT belongs there.

**Item 2 – not started.** It waits for REQ-646's container runtime, as the ordering note says, so no interim in-Worker job was added. Saves still rebuild inside the request.

**Tests**
- New file `test_UAT_FC_REQ-647_catalog_photos_are_static.workers.test.ts`, with public-site given no `ASSET_GATE` at all:
  - Grid photos come from R2 with the Library's exact bytes, the one-year cache, and every `srcset` and `<source>` candidate working.
  - The old path returns 404.
  - A rebuild reads only the newly added photo, and a second rebuild reads nothing.
- Updated REQ-633's rebuild test and BUG-333's browser J7 expectation. The browser J7 suite wasn't run: it needs Chromium, which the sandbox won't launch.
- The catalog, publish, public-site, gate, ladder, shop, payments and REQ-645 suites pass.
- The `reconciliation-publish-revision*` and `reconciliation-published-site-serving*` suites fail (11 tests), but they fail the same way on a clean xgd-working, so the failures were already there.
- Merging xgd-working into the branch gave one import conflict in `shop.ts`, against REQ-645. I kept both imports and reran everything on the merged code.

**Decision for you:** item 3's requirement is written only in this ticket's body. Do you want me to add it as a comment on `request-d78b1f29` too, so it isn't missed there?

The ticket body records the design and what's deferred; promoting it to `ready_to_reconcile` is your call.

<!-- xgd-turn id="93c90217-fd14-44bd-88ee-b0dd8f3abaef-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T20:48:52.123225+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

<!-- xgd-turn id="93c90217-fd14-44bd-88ee-b0dd8f3abaef-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T20:52:57.500511+00:00" -->
#### Claude
Now noting the hand-over in REQ-647's body, keeping the existing text.

REQ-647 is as complete as it can be today. Item 1 is finished, item 3 is now handed to REQ-643, and item 2 is still blocked until REQ-646 lands.

- **Item 1 (shop photos as static files) is done.** Both commits (`ca7d0635`, `65d331c7`) are on xgd-working. The ticket is at `free_coded` with version 0.2.763 and 5 story points, and the branch and worktree are cleaned up.
- **Item 3 (Buy re-checks the item) now lives on REQ-643** (`request-d78b1f29`) as comment COMMENT-7790, since that ticket owns the Buy endpoint and no Buy exists yet. The comment says Buy must check on the server that the item is live, available and at its current price, and must send a stale page's visitor to the enquiry path. It also sets out the UAT, plus a second case for a price changed after publish.
- **Item 2 (rebuild as a background job) is still not started.** REQ-646 is still a draft, and the ticket's ordering note says the rebuild must run in REQ-646's container, with no temporary job inside the Worker meanwhile. Building only the debounce and the "Updating your site…" state now would mean Saves never reach the published site. So it waits.

I added a "Remaining work" section to the ticket body saying all this, and kept the existing text. No code changed this session. Promoting it to `ready_to_reconcile` is up to you. That would reconcile item 1 and leave item 2 open. If you'd rather close REQ-647 and move item 2 to its own ticket, tell me and I'll file it.

<!-- xgd-chat-end -->