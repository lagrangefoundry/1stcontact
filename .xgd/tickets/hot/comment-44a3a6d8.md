---
uid: comment-44a3a6d8
id: COMMENT-6837
type: comment
title: Comment on request REQ-631
created_by: xgd
created_at: '2026-11-02T20:36:18.719960+00:00'
updated_at: '2026-11-02T21:39:46.054716+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-84307846
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f8798d9a-bf4d-49ca-bc85-45f5063bc9d4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5e43e083-8022-4306-8658-f8962d4cd0ca-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:34:58.707303+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="5e43e083-8022-4306-8658-f8962d4cd0ca-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:39:52.338209+00:00" -->
#### Claude
I'm reading the ticket and the code it touches (the tab config, site import, jobs, D1) so my questions are specific. Next I'll check her live Store API to see where collections are stored.

Before I build, I checked her live shop. Her Store API answers with no key and has 365 products, but the data doesn't match the ticket's assumptions in several places. These are the questions I need answered. Each has a recommendation, so "go with your defaults" is a fine answer.

**What her shop data actually looks like**
- **Images:** there are 1,936, about 5.3 per product, not ~2,900.
- **Collections are parent categories, not tags.** "Preloved" is the parent of Rings, Pendants, Earrings and so on (345 products). The others are "LO Originals" (16) and "Reworked" (4). A product only lists its own leaf categories, so its collection has to come from the parent category.
- **Every SKU is empty**, so the WooCommerce id is the only key for spotting duplicates.
- **Attributes** (Size, Carats, Care Guide, Material, Stone, Weight, Length) are on 307 products. The ticket's model has nowhere to keep them.

**Questions**

1. **Name mismatch.** Her shop says "LO Originals" but the ticket says "Originals". **Recommend:** the owner's collection list keeps her name for each collection plus the WooCommerce category it matches, so "LO Originals" becomes "Originals". Or should the collection simply be called "LO Originals"?
2. **Two collections on one product.** 3 products are in both "LO Originals" and "Reworked", but an item can have one collection. **Recommend:** use the order of her collection list (Originals, then Reworked, then Preloved), so these become Originals, and list them in the import report.
3. **Collection categories as categories.** Should "Preloved", "LO Originals" and "Reworked" also become categories? **Recommend:** no; a category that matches a collection only sets the collection. I'd also merge categories with the same name: there are two "Brooches", and "LO Rings" would stay separate from "Rings".
4. **Stock that isn't tracked.** 179 products report no stock limit (`maximum` 9999). 154 of them are out of stock and become 0, which is fine. 25 are in stock: mostly LO Originals at price 0, plus Deposit, Custom work and Ring Resize. **Recommend:** if a product is in stock but stock isn't tracked, set availability to 1 and turn on made to order, rather than storing 9999.
5. **Things that aren't products.** "Deposit" ×3, "Product deposit", "Us postage", "Ring Resize", "Custom 925", "Custom Work Stefano", "New Wedding Ring" and "New Chain Options" are WooCommerce workarounds. Imported items arrive live. **Recommend:** import them, but not live, and list them in the report. The alternative is to skip them.
6. **Price 0.** 16 products are priced at 0, mostly LO Originals that are really "price on request", which the goal defers. **Recommend:** import them with a price of 0 and not live, and flag them in the report.
7. **Attributes.** **Recommend:** add each as a "Name: value" line at the end of the description. The Care Guide is the same boilerplate on 295 products, so drop it. The alternative is a structured attributes field on the item, which means more model and UI work this week.
8. **Which description.** Each product has a long `description` and a `short_description`, and the short one has "Part of the LO Preloved collection / Only one available" lines in it. **Recommend:** use the long description only. Every description is reduced to paragraphs and line breaks, and links become plain text.
9. **AI picture descriptions.** **Recommend:** describe only the main photo of each product during the import (365 AI calls). The other ~1,570 photos go into the Library undescribed and are described lazily when first opened or by a background sweep. Describing everything is about 5× the calls and the time.
10. **Which business.** Is Lauren's business already set up on dev and prod? Which one should the first real import run against? Either way, I'll build and test against a local fixture.

**Scope this week:** the ticket is large: a migration, the API, a resumable background import, the Shop tab list and detail, and the UATs. I plan to land it on a `free-REQ-631` branch in this order: model and API, then the import job, then the UI. If Friday gets tight, would you rather have the import working first or the UI?

<!-- xgd-turn id="ac19e119-550c-4a29-85fc-038548967982-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T21:08:11.458855+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="ac19e119-550c-4a29-85fc-038548967982-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T21:39:40.934725+00:00" -->
#### Claude
Setting up the worktree. `xgd branch cut` failed partway because the sandbox blocks writes to `.git/config`, so I created the worktree by hand and am now linking in its dependencies.

Reading the router's material-fetch path, which is closest to the photo import, so I can reuse its tenant scoping and ingest dependencies.

Planning is done and I'm writing code now, starting with the D1 migration, which the REQ-633 contract says must land as the first commit.

Migration written. Next I'm registering it with the test schema loader and the migration manifest.

The test suite runs here, and the schema applies cleanly. Committing the migration as the first commit.

Migration committed (`028aa218d6`). Now writing the backend: the inventory model and validation, then the import (scan, mapping, background job, report).

Now writing `shop.ts`: money handling, validation, item CRUD, list filtering, and `liveItems`.

Model written. Before I write the import, checking `site-import.ts` for a fetch-and-ingest helper I can reuse.

Writing `shop-import.ts`: the HTML-to-text reduction, the Store API scan, the default mapping, the resumable page steps, and the report.

Writing the lazy description: a photo stored undescribed gets described the first time its Library item is opened.

Now adding the deferred-description function to `material.ts`, next to `reviseDescription`.

Now the HTTP routes, in a separate `shop-routes.ts` that the router dispatches to.

Wiring the routes into `router.ts`, adding the `SHOP_IMPORT` binding type, and hooking the lazy description into the material item read.

Typecheck is clean. Adding the `ShopImport` Workflow class and its binding in every wrangler environment.

Backend is wired and typechecks. Now the synthetic Store API fixture for the UATs. Checking the existing image fixtures first.

Fixture written. Now the workers UAT file, which covers scan and mapping, import, live on arrival, re-run, prices, edit, safety, the report and the list.

UAT file written. Running it.

All 12 workers UATs pass on the first run. Committing the backend, then moving on to the Shop tab UI.

Backend committed (`84ad8677e0`). Now the UI: reading how the Library panel builds its list and detail view, and how the builder's API transport works.

I've learned the builder's API helpers. Next I'm checking how builder UI tests drive the real app, so the Shop tab browser UAT follows the house pattern.

Writing the Shop panel. First the API transport functions and the tab constant.

Writing the transport functions in `api.js`.

Now the panel itself, `shop.js`: list with filters and paging, item editor with Save, and the import view.

Panel written. Mounting it in `app.js` beside Contacts, and refreshing it on business switch.

Adding the Shop styles next to the Library's in `builder.css`.

Styles in. Now the jsdom browser UAT for the panel. Checking how the Library test opens a row first.

Writing the Shop tab browser UAT, which drives the panel in jsdom.

The jsdom UAT passes, 4 of 4. Now the regression scope: suites that pin the tab strip, label literals, wrangler bindings and the router.

REQ-259 fails on the clean baseline too, so it was already red before my change. Dropping my stash entry, then fixing the two tab-position pins.

Both tab pins pass after the update. Now the workers regression scope: the material routes I touched, the durable consultant job (it shares the Workflows wiring), and the wrangler.toml pins.

Only 5 of 11 files ran: in zsh the unquoted file list went through as a single argument. Re-running those files with `xargs`.

There's no lint step; TypeScript typechecks clean. Some suites scan every control-app source file for forbidden patterns, so I'm running those against the new files.

Fourteen failures. BUG-53, BUG-70 and REQ-146 are likely mine: CSS classes with no rule, unstyled controls, and error messages that skip the scrubber. Reading their details.

BUG-70 now passes. Two more to check: AC977 lists 19 uncovered origin routes, and bug32 flags 9 restated scope names. Either could include mine.

AC977 now lists `/api/shop/` among routes with no probe. The other 18 entries were already there, but this one is new from my change, so I'm checking how probes are declared.

Adding a probe for the Shop routes beside the material ones.

The Shop probe clears AC977's list for `/api/shop/`. The two failures left in that file were already there. Re-running both of my suites, then committing the UI.

All three commits are on the branch. Rereading the ticket body before adding the implementation record, since the operator may have edited it meanwhile.

The body is unchanged since the operator's update. Appending an implementation record: the decisions taken in-session, and wording for the behaviours the UATs pin.

The ticket is updated. Merging back: taking the lock, merging into xgd-working, then promoting to `free_coded`.

xgd-working is fast-forwarded and the ticket overlay is clean. Promoting the ticket to `free_coded`.

REQ-631 is built, merged into xgd-working and parked at `free_coded`. Nothing has been deployed, and the import hasn't been run against a real shop yet. The 16 new UATs pass (12 against the real routes and D1, 4 for the Shop tab).

**What works now**
- **Inventory model:** migration `0040_inventory.sql`, landed as the first commit for REQ-633. Prices are stored as whole numbers of cents, with no floating point. There's no price column, so adding currencies later needs no migration. `liveItems()` and a no-op `catalogItemChanged()` are ready for REQ-633.
- **Shop tab:** sits just before Settings.
  - The list shows photo, name, price, availability, collection, categories and the Sold and Live/Not live badges. It filters by collection, category and live state, searches by name, and pages.
  - The item editor keeps changes private until Save, and refusals show the server's message.
  - You can create and delete items.
- **Import:**
  - Scan lists every source category with its parent and count, and every attribute; the owner maps each and the mapping is saved per business.
  - The import itself runs as a background job, one resumable step per page of products. Re-running it updates by source id and never duplicates items or re-fetches photos.
  - Live on arrival follows the ticket: a price of 0, untracked stock or no photo arrives not live.
  - The end report lists failures, not-live items and why, precedence cases, untracked stock and repeated summaries.
  - Only each product's main photo is described by AI during the import. The others are described the first time they're opened in the Library.

**Decisions I took** (all recorded in the ticket):
- The shop currency is a per-business setting; the first import fills it in if empty.
- A product in a child category also counts as being in its parent categories.
- A re-run refreshes the shop's own fields but leaves live, made to order and the slug as the owner set them.
- An import refuses to start until a mapping has been saved.

**Not built yet:**
- the background sweep that would describe photos without waiting for them to be opened
- a UI control for reordering collections (the API exists)
- drag-to-reorder for photos (they reorder with buttons)

**Tests I changed:**
- REQ-353 pinned exactly five tabs, and REQ-239 pinned Settings at a fixed position. Both now count the sixth tab; the ticket records that this supersedes them.
- I added a Shop route probe to the origin-routes test, which would otherwise have flagged `/api/shop/` as unprobed.

**Failing suites unrelated to this change:**
- REQ-259 fails on a clean baseline.
- REQ-185, REQ-190, REQ-194, REQ-162, REQ-180 and BUG-53 point at files this branch doesn't touch, for example `notifications.ts`, `tenant-cost.js` and the existing config.
- REQ-115, REQ-148, bug32 and some of the origin-route tests fail because a branch worktree lacks built assets.

**Process notes:**
- `xgd branch cut` failed partway because the sandbox blocks writes to `.git/config`, so I created the worktree by hand. Its git hooks were never installed. The merge was a fast-forward, so the recorded commits kept their original SHAs.
- I set story points to 13.

**Before anyone uses it:**
1. Apply migration 0040.
2. Deploy. The new `SHOP_IMPORT` Workflow is declared in every environment and only exists once deployed.
3. You run the first real import yourself; I can't reach a live shop from the sandbox.

When it runs, look at the scan's proposed mapping before importing: the collection names and which categories become collections are the owner's choice, not hardcoded.

<!-- xgd-chat-end -->