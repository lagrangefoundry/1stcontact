---
uid: bug-a7fbf1eb
id: BUG-333
type: bug
title: 'Shop tab: import reports success but writes nothing; no end-to-end acceptance
  suite for the Shop'
created_by: EPIC-31
created_at: '2026-11-03T00:48:45.135781+00:00'
updated_at: '2026-11-03T18:11:56.560472+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-fc04a32e
  commits:
  - working_sha: 850dbbe791e80a6d1040b8e137eb9b26a69bb4ed
    reconcile_sha: null
    main_sha: null
  - working_sha: 0257aceac9ecd2a62caa76eae8ce65cfc9e168f5
    reconcile_sha: null
    main_sha: null
  - working_sha: a84a8be2402cbcd75c477f71643520aa02a87f39
    reconcile_sha: null
    main_sha: null
  - working_sha: 19bb4d46d32a6b106be0c3724655511d0e088bbc
    reconcile_sha: null
    main_sha: null
  - working_sha: 6067e2f218261c0c576cea86c688fef280853263
    reconcile_sha: null
    main_sha: null
  - working_sha: e1e562d1bd9d1df85fa5618b474d13f33a6e8ce1
    reconcile_sha: null
    main_sha: null
  - working_sha: 0a49caaf4ae8b5d82452f06240049cfc83588a29
    reconcile_sha: null
    main_sha: null
  - working_sha: f3f5367c025faf3901a740479753976ebaf4243f
    reconcile_sha: null
    main_sha: null
  version: 0.2.745
  story_points: 20
---

## Symptom (operator, 2026-11-02, dev)

The import scanned the source shop, the Shop tab reported **365 products** and showed example content, and the operator returned to the Inventory. **The Inventory is empty.**

Evidence:
- **The dev worker's log** shows `GET /api/shop/import/sources` 200, then `POST /api/shop/import/scan` 200 (7.4 s), then the inventory reads (`GET /api/shop/items`, `/taxonomy`). **No `POST /api/shop/import/mapping` and no `POST /api/shop/import` was ever sent.**
- **The dev store** (local D1, `apps/control-app/.wrangler/state`) has **0 rows** in `inventory_items`, `inventory_prices`, `inventory_item_categories`, `shop_collections`, `shop_categories`, `shop_import_mappings` and `shop_imports`. No import job was ever created.

So the scan's result read as a finished import. Either the "Import N products" button (`builder/shop.js`, `run()`, below the mapping table) was never reached, or it failed in the browser before sending anything. **Reproduce in dev and find which.** Both are bugs.

## Fix

1. **The Shop tab never reports an import that did not happen.**
   - Counts of **imported** items come only from the server's import job record (`shop_imports`), never from the scan.
   - The scan screen says what it is: **"Step 2 of 2: check the mapping, then import"**. It shows "found N products", never wording that implies the products were imported.
2. **The Import action is impossible to miss.** It is visible without scrolling: sticky, or repeated at the top of the mapping.
3. **A failure is shown.**
   - Any failed request in the flow (saving the mapping, starting the job, polling it) shows its error in the tab.
   - A browser exception in the flow is also surfaced, never swallowed.
4. **Progress, then the result.**
   - After starting, the tab shows the job's progress from the server.
   - On completion it shows the report (REQ-631 "The report") and returns to the Inventory with the items in it.
   - Leaving the tab mid-import and coming back shows the running job, not a fresh scan.

## The acceptance suite: the Shop as the owner uses it (operator, 2026-11-02)

**Why.** The operator has found the Shop's failures one feature at a time:
- every route answered 404 in dev, while REQ-631's tests passed
- the import wrote nothing

The unit-level and direct-call UATs proved the parts, not the product. This ticket adds **one acceptance suite that drives every built Shop behaviour the way an owner does**, so a broken journey fails a test before the operator finds it.

**How the suite runs:**
- **A real browser** (Chromium) on the **real builder**, against the **real control-app Worker** (workerd or miniflare) with a **migrated D1**, through the **real router**, with a **signed-in session on a business path** (`/b/<business>/...`).
- **No calls to internal functions** in place of the UI or the routes.
- The source shop is a **synthetic WooCommerce fixture served over real HTTP** (REQ-631's fixture: made-up names, every edge case). It is never a copy of a customer's data.
- **Every step asserts on persisted state, not only on what the screen shows right after the action**, by doing one of these:
  - reloading the page and checking again
  - reading the store
  
  This is the assertion that would have caught this bug.
- The suite lives in one place and runs with **one command: `pnpm test:browser`** (a new `package.json` script running the browser suites under `vitest run`). **It runs real multi-process Chromium, not `--single-process`.**
  - **Why one command.** Inside the agent sandbox, Chromium dies at launch: `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)`, a macOS Seatbelt *mach-register* denial. The roles' `mach_lookup: 'on'` does not cover it (re-probed 2026-11-02).
  - **The operator's fix.** The operator adds `pnpm test:browser *` to `sandbox.excluded_commands` in main's `.xgd/permissions.yaml`, so this one command runs outside the sandbox for every role, headless sessions included.
  - **Run it on its own.** Because `excludedCommands` matches the whole Bash call, run it with no `cd …&&` prefix, pipe or redirect.
  - **Don't paper over a missing exclusion.** Until the exclusion exists, the suite must fail with that diagnosis, never skip silently and never fall back to `--single-process`.

**Name the UATs `test_UAT_FC_<this ticket>_*`.** Each journey below is one or more UATs.

### J1. Settings: default currency (REQ-634)
- Settings shows **Default currency** as a dropdown of ISO currencies. Choosing one and saving persists it **after a reload**.
- The Shop tab's bar has no currency field.
- With priced items present, changing the default asks for confirmation. Existing amounts and currencies are unchanged after a reload, and the items to re-price are listed.

### J2. Import, end to end (REQ-631, REQ-634, this bug)
- **Choose the source:** Import → the source choice lists WooCommerce → enter the fixture shop's address → Scan.
- **Map:**
  - The screen says it is the mapping step and that nothing has been imported yet.
  - It lists the source categories (with parent and count) and the attributes.
  - Change the mapping: rename a proposed collection, merge two source categories into one category, drop an attribute.
- **Import and wait:** press Import, which is visible without scrolling. Progress is shown, then the report.
- **The report matches the fixture:** created count, the items imported not live with their reasons (price 0, stock not tracked, no photo), the precedence case, the stock-not-tracked item, and the repeated summaries.
- **The Inventory:**
  - **after a reload**, it holds exactly the fixture's product count
  - each item has the right collection, categories, price, availability, Live or Not live, summary, description, attributes and photos
  - **the store holds the same rows**
- **Leave mid-import:** navigate away during an import and back. The running job is shown, and it completes.
- **Failure:** with the fixture shop made unreachable, the scan's error is shown. With the job forced to fail, its failure is shown and no "imported" count appears.

### J3. Re-import (REQ-631)
- Running the import again reuses the saved mapping (shown pre-filled), updates items in place, and **creates no duplicates** (the count after a reload is unchanged).
- A change to a product in the fixture shows on the item.

### J4. Inventory list (REQ-631)
- Filter by collection, by category and by live state.
- Search by name.
- With more items than a page holds, paging or scrolling reaches the last item.
- Sold and Live badges are correct.

### J5. Item editing (REQ-631)
- **Each field round-trips** after Save and a reload: name, summary, description, price, availability, collection, categories, attributes, live, made to order.
  - Adding a new collection or category from the item also round-trips.
  - Photos: add (from the Library or an upload), remove and reorder, with the first photo shown as the main one.
- **Edits are private until Save:** an unsaved edit followed by navigating away leaves the stored item unchanged.
- **Invalid input is refused with a visible message, and nothing is stored:**
  - negative availability
  - a price of `19.999` or `abc`
  - an empty name
- **Price exactness:** `19.99` is stored as 1999 and displayed as the default currency's formatting of 1999.

### J6. New and delete (REQ-631)
- **New item:** it starts **not live**, and after Save and a reload it is in the list.
- **Delete:** it asks for confirmation, then the item is gone after a reload.

### J7. The site follows the item's Save (REQ-633)
- **Setup.** A site with:
  - a product-page template page
  - a grid whose rule selects one category, in stock, newest first, with a limit
  - a second grid with a small page size, over enough items to page
- **Before the owner's Save:** each live item has `/shop/<slug>` on the published site, built from the one template. Not-live items have no page and are in no grid. The grid shows exactly the items its rule selects, in order. The paged grid has working next and previous pages.
- **Saving a live item's new price in the Shop tab, without a site Publish,** changes its card and its page on the published site. **The builder preview shows the change too.**
- **Switching an item to not live** removes its page and its cards. Switching it back restores them **at the same slug**.
- **A sold item** shows Sold, no price, and the commission link. An available item shows the enquiry link while the business cannot take payments.
- **An unpublished change to a grid's rule** does not reach the published site until Publish.

### J8. Enquiry and commission links (REQ-633)
- Following an item's enquiry link opens the contact form with the opening line prefilled as plain text.
- Submitting it creates a lead that records the item's slug.
- An unknown slug prefills nothing.

### J9. Safety (REQ-631, REQ-633)
- A fixture description with a `<script>` and a link is inert text in the Shop tab, on the product page and in the card.
- An off-allowlist image source is dropped.

## Definition of done

1. **The bug's fix**, with J2 passing.
2. **The whole suite (J1–J9) passing.** A journey that fails because built code is broken is fixed in this ticket. It is not marked skipped and not deferred.
3. **A manual run on dev before handing back.** After `bin/deploy --env dev`, the session runs J2 in the real dev builder against a real shop address the operator provides, and **records in this ticket**:
   - the item count shown in the Inventory after a reload
   - the matching `inventory_items` row count in the dev store

   **A ticket that has not been seen working in dev is not done.**


## Diagnosis (confirmed 2026-11-02)

**The button was never reached.** The operator confirmed it: the mapping screen's "Import N products" button sits below the whole category table and attribute list, and the only text above the table ("365 products, N categories.") reads like a finished result. When the operator scrolled down and pressed it, `POST /api/shop/import/mapping` and `POST /api/shop/import` went out and a `shop_imports` job started (`running`, against the real shop). **The send path works; the bug is the UX.** Fix items 1 and 2 are the core fix; 3 and 4 stay as specified.


## Observed on dev during the operator's import (2026-11-03 04:12–04:15 UTC)

- The job (`imp_0559e34f…`, workflow `ShopImport`) is running and writing items: **10 items in about 130 s, roughly 13 s per product**, mostly photo ingest and description. At that pace, 365 products take **about 75–80 minutes**.
- **Progress is coarse.** `shop_imports.processed` and `updated_at` only move when a whole page of `IMPORT_PAGE_SIZE` (10) products finishes. The tab polls `GET /api/shop/import` every second and sees "0 processed" for the first ~2 minutes, even though items are already in the store. `total` holds the source's **page** count, not its product count. Fix item 4 ("shows the job's progress") must show progress the owner can read: products done out of products found, updated as each product lands rather than only once its page is finished.


## Fix 5: model descriptions never gate the download (operator, 2026-11-03)

The first dev import ran at about 13 s per product: each product's photos were copied one at a time, and the main photo's Claude description sat in the path. **The import runs in three phases instead:**

1. **Item data.** Every product becomes an item from the source's product data alone (name, price, availability, collection, categories, attributes, summary, description, live). No photos, no model call. A re-import keeps an item's existing photos. A 365-product shop is in the Inventory within a minute or two.
2. **Photos.** Each item's photos are downloaded into the Library and attached to the item in the source's order, **several at a time** (a bounded concurrency, not one by one). Photos are stored undescribed.
3. **Descriptions, in parallel with 2.** A photo is queued for description once it is stored. Describing never holds up phase 2 or the item.
   - The job's progress and its "done" do **not** wait on descriptions. Descriptions still pending when the import finishes carry on afterwards, and their count is shown separately.
   - A description that fails leaves the photo stored and undescribed (described on first open, as today). It is never an import failure.

**Progress the owner can read** (refines Fix 4): items done out of products found, then photos done out of photos found, then descriptions pending. Each count moves as each item or photo lands, not once per page.

**Which photos are described in phase 3:** the main (first) photo of each item, as the import does today. The other photos keep "describe when first opened". *(Interpretation; the operator may widen it to every photo.)*


## Fix 6: the Shop reaches the published site (found by J7, 2026-11-03)

Writing J7 showed that **no Shop change ever reached the published site**:
- [[REQ-633]]'s catalog read an in-memory stand-in for the inventory.
- `shop.ts`'s `catalogItemChanged`, which every Save and delete called, was an empty stub.
- Item photos had no public address.

Built code was broken, so it is fixed here:
- **The site draws the Shop's live items.** The published render, the builder preview and a Save's rebuild all read the live items from D1. Item ids become names, the default currency's price comes first, and each photo gets its served path. An item with no slug yet (never live) has no page.
- **A change rebuilds the site without a site Publish.** After an item is created, saved or deleted, the business's published sites are re-rendered from their live revision, so unpublished draft edits never leak. The Save's answer waits for the rebuild. An import rebuilds once, when it finishes. A failed rebuild is logged and never fails the Save.
- **Item photos are served** at `shop-photos/<slug>/<n>` under the site root:
  - by the published site, which asks the control app over its `AssetGate` binding (new `shopPhoto` method)
  - by the builder preview

  Only a **live** item's photos are served; anything else is the ordinary 404.
- **The local `1c builder`, which has no D1, renders a catalog with no items.** The router reads the live items through an injectable `RouterDeps.inventory`.
- **Published pages are edge-cached for up to 60 s,** as before. A visitor may see the old price for up to a minute after a Save. The store and the uncached page change at once.

## What changed (implementation, branch `free-BUG-333`)

- **The import job** (`shop-import.ts`, migration `0044_shop_import_phases.sql`):
  - `importItemsPage` handles 10 products per step, moves `processed` per item, and reads `items_found` from the source's `X-WP-Total`.
  - `importPhotoBatch` takes 24 photos per step, 6 at a time, with one row per photo in `shop_import_photos`.
  - `finish`, then `site`, which rebuilds the published sites.
  - `describeBatch` runs as its own parallel chain of steps (6 per step, 3 at a time) through the Library's `describeDeferred`. A failed description leaves the photo marked to be described on first open.
- **The Shop tab** (`builder/shop.js`):
  - "Step 1 of 2: choose where to import from", then "Step 2 of 2: check the mapping, then import".
  - The scan says "Found N products in M categories. Nothing has been imported yet."
  - Import sits in a sticky bar above the mapping and again below it.
  - Every failed request or exception in the flow shows its error.
  - Progress reads "Creating items: X of N done", then "All N items are in your inventory. Bringing in photos: X of Y", plus "Describing photos: N still to describe…".
  - The report follows, with the list refreshed behind it.
  - Opening Import, or reloading the tab, while a run is going shows that run.
- **The site wiring** (`catalog.ts`, `shop.ts`, `shop-routes.ts`, `router.ts`, `worker.ts`, `gate.ts`, `public-site/src/index.ts`, `product-catalog/items.ts`): Fix 6.
- **The acceptance suite:**
  - `pnpm test:browser` runs `tests/browser/**` (`vitest.browser.config.mts`).
  - Its globalSetup probes Chromium first. Without the sandbox exclusion it fails with the mach-register diagnosis, never skipping and never falling back to `--single-process`.
  - It then builds `1c assets` and the two dev Worker bundles (`wrangler deploy --dry-run --outdir`).
  - Each suite runs both Workers under Miniflare from wrangler's own worker options, with a store migrated by `wrangler d1 migrations apply`, the public site's service bindings to the control app's entrypoints, and a session the app's own sign-in code mints.
  - The fixture shop is served over real HTTP at `https://shop.example.test` through Miniflare's outbound router; all other control-app egress is refused.
  - External stand-ins:
    - Turnstile's widget script and siteverify
    - the model key, which reaches nothing
- **Suites adapted:**
  - REQ-633's catalog suite stocks real Shop rows in place of the deleted stand-in.
  - The node project excludes `tests/browser/**`; REQ-141's and AC1329's routing pins name that exclusion.
  - The workers schema list adds `0044`.

## Test plan (UATs, all `test_UAT_FC_BUG-333_*`, in `tests/browser/`)

| Journey | File | Ticket text |
|---|---|---|
| J1 | `…_j1_currency` | J1 |
| J2 | `…_j2_import` (4 UATs: scan→map→import→report→inventory after reload and in the store; leaving mid-import; unreachable shop; failed job) | Fix 1–4, J2 |
| J3 | `…_j3_reimport` | J3 |
| J4 | `…_j4_inventory_list` | J4 |
| J5 | `…_j5_item_editing` (5 UATs) | J5 |
| J6 | `…_j6_new_and_delete` | J6 |
| J7 | `…_j7_site_follows_the_save` (5 UATs, including the served main photo) | J7, Fix 6 |
| J8 | `…_j8_enquiry_links` (enquiry, commission, unknown slug) | J8 |
| J9 | `…_j9_safety` | J9 |

The import's three phases (Fix 5) are covered by J2's progress and persisted-state checks and by REQ-631's workers suite. That suite also shows the main photo is described and the rest are described on first open. All 25 browser UATs pass with the bare `pnpm test:browser`.

## Observations for the operator (not changed here)

- **After the default currency changes,** the Shop lists an item priced in the old currency as "No price". Its stored amount and currency are unchanged; J1 pins this.
- **Pre-existing failures,** identical on clean `xgd-working`:
  - consultant priming and talker suites: REQ-295, 342, 386, 416, 424, 426, 428, 431, 436, 458, 466, 473 and BUG-249, 278, 284
  - REQ-143, 148, 162, 180, 198, 204, 208, 219
  - the `tools/generate` typecheck errors in `material-import.ts` and `zip-reader.ts`


## Definition of done: status (2026-11-03)

1. **The fix, with J2 passing:** done.
2. **J1–J9 passing:** done. 25 UATs, bare `pnpm test:browser`.
3. **The dev run:** NOT YET DONE.
   - `bin/deploy --env dev` built the new snapshot (deployedAt 2026-11-03T18:07:48Z) and applied migration `0044` to the dev store.
   - The agent sandbox could not restart the running dev services, so dev still serves the previous code until the operator restarts them (`bin/dev down && bin/dev up`, or `bin/dev reap` then `bin/dev up`).
   - J2 against https://laurenowensjewellery.ie on the new code, with the Inventory count after a reload and the matching `inventory_items` count, is still to be recorded here.
   - **The earlier import on the old code** (2026-11-03 04:12–05:12 UTC) read 365 products and created 364 items. One failed: source product 1942 has no name. 336 are live and 28 not live. The dev store holds 364 `inventory_items` rows for that business.