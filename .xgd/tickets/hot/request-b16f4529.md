---
uid: request-b16f4529
id: REQ-651
type: request
title: 'Shop: an item can belong to several collections'
created_by: EPIC-31
created_at: '2026-11-05T00:13:56.053010+00:00'
updated_at: '2026-11-05T00:40:41.138289+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b336770a
  commits:
  - working_sha: 3879bf227b8305dc52453aae56d9fe97d19eed79
    reconcile_sha: null
    main_sha: null
  - working_sha: c643a0f778584508103fc4153fab42f5903c6a3b
    reconcile_sha: null
    main_sha: null
  - working_sha: c82004d6b89686f72d4809a4d372dfb7cad02452
    reconcile_sha: null
    main_sha: null
  version: 0.2.772
  story_points: 5
---

## What changes

**An inventory item can belong to any number of collections**, just as it can belong to any number of categories. Operator, 2026-11-04 (EPIC-31): collections and categories are both ways for the owner to organise products on their site, and how to organise them is the owner's decision, not a rule we impose. This supersedes the "an item belongs to at most one collection" rule in [[EPIC-31]], [[REQ-631]], [[REQ-633]] and [[REQ-639]].

**Why now:** a source shop can put one product in two of its own top-level groups. The importer had to pick one of them (the "collection chosen" precedence), so the item silently disappeared from the other group's page on the new site. The single-collection rule was losing the owner's own organisation on the way in.

After this change collections and categories follow the same rules. They remain **two separate lists the owner names and uses as they choose** (for example, the line a piece comes from and the kind of thing it is). They differ only in name and in where the owner chooses to use them.

## Behaviour

**Store**
- An item's single collection reference is replaced by a **list of collections**, held the same way as its categories (a join table like `inventory_item_categories`).
- **Migration:** every existing item keeps the collection it has; an item with none has an empty list. Nothing else changes.
- Deleting a collection removes it from every item's list.

**Import** (REQ-631 / BUG-333)
- Every source category mapped to a collection is applied to the item. Nothing is chosen between them.
- The import report's "collection chosen" (precedence) section is removed.
- Re-import stays idempotent: items are matched by source product, and the collection list is replaced from the source like categories are. Re-running after this change gives an item every mapped collection it belongs to at the source.

**Shop tab** (REQ-639 / BUG-339 layout)
- The item detail's **Collection** dropdown becomes a **Collections** set of checkboxes, laid out exactly like Categories (same aligned columns, same `+` next to the heading to add one).
- The inventory list row shows all of an item's collections (as it shows categories).
- The list's collection filter is unchanged: "All collections", "None" (items in no collection), or one collection (items that are in it, among others). The count and paging follow it.

**Site** (REQ-633 `product-catalog`)
- A grid's selection rule matches an item if it is in **any** of the grid's collections (as today); an item in two collections appears in both grids.
- The catalogue gives cards and product pages the item's list of collections instead of one name; where a card or product page shows collections, it shows all of them.
- The Shop assistant's and any API's item shape carry a list of collections.

**Unchanged:** categories; live/not live; Save publishes; the item-detail layout otherwise.

## Test plan

UATs named `test_UAT_FC_<REQ-ID>_*`; browser journeys in the BUG-333 real-Chromium Shop suite (`pnpm test:browser`), which is updated wherever it assumed one collection.
- Migration: an item with one collection has a list of that one; an item with none has an empty list.
- Import: a source product in two categories both mapped to collections arrives in **both**; no precedence entry in the report; re-import leaves it in both with no duplicate items.
- Item detail: tick two collections, Save, reload → both kept; untick one → removed; add a collection with `+`.
- Filter: an item in collections A and B appears under A and under B; "None" shows only items with no collection.
- Site: an item in A and B appears in a grid selecting A and in a grid selecting B; its product page lists both collections.
- Deleting a collection removes it from items without deleting them.

**Definition of done:** the suite passes; after `bin/deploy --env dev`, re-run the import on a business whose source shop has a product in two collection-mapped groups and record that the item shows in both collections in the Shop tab and in both grids on the site.


## As implemented (2026-11-04)

**Store** — `db/migrations/0049_item_collections.sql` (0049 because REQ-646 landed `0048_turn_log_compute` first) adds `inventory_item_collections (item_id, collection_id, position)`, cascading from both the item and the collection, copies each item's `collection_id` into it as a list of one, and drops `inventory_items.collection_id`. The item's API shape (`InventoryItem`, every `/api/shop/item(s)` response) carries `collections: [{id, name}]` in the item's own order; a Save sends `collectionIds: [...]` (replacing `collectionId`), each checked to be one of the business's own collections — a foreign one is refused with 400 and nothing stored. Collections and categories are read for a page of items in one batched query beside the prices, so REQ-645's concurrency bound is unchanged. Deleting a collection row (there is still no delete route in the Shop tab; the cascade is the rule) removes it from every item and leaves the items.

**Import** — every source category (or ancestor) mapped to a collection is applied; the report's `precedence` field and its "Collection decided by your collection order" section are gone. Re-import matches by source product and replaces the list from the source, so the fixture's two-group product stays in both with no duplicate. The business's collection order (`orderCollections`) remains as the Shop tab's list order only; it no longer decides anything on import.

**Shop tab** — the Collection dropdown is replaced by a **Collections** heading with `+` (Add collection, which ticks the new one) over the same aligned checkbox columns as Categories (`data-field="collections"` / `"categories"`). Price and Availability stay the `Label: value` facts rows. The list row names every collection then every category. The list filter is unchanged ("All collections" / "None" / one collection = items in it among others), with the count and paging following it.

**Site** — the catalog's `CatalogItem.collections` is a list of names; a grid rule matches an item in ANY of its collections, so an item in A and B appears in a grid selecting A and in one selecting B. The L1 text bind field keeps its name `collection` (so stored site definitions stay valid) and now shows every collection joined with ", ".

**Tests** — new: `tests/test_UAT_FC_REQ-651_item_collections.workers.test.ts` (migration keeps a list of one / empty list and drops the column; Save keeps two, untick removes one, foreign id refused; filter A/B/None with totals; deleting a collection keeps the item; import puts the two-group product in both with no precedence and re-import keeps both with no duplicate; published site: item in two grids and its product page lists "Line A, Line B") and `tests/browser/test_UAT_FC_REQ-651_item_collections.test.ts` (real Chromium: tick two, Save, reload, untick, `+` add; filter under each collection and None). Updated wherever a suite assumed one collection: BUG-333 j2/j4/j5, REQ-639 layout (also now expects REQ-643's Orders heading, which had made that assertion red on working), REQ-631 inventory/shop tab, and the item-input fixtures of BUG-335/338/341, REQ-633/634/642/643/645/647/648. `tests/support/d1-site-factory.ts` applies 0049 and its `atHead` asks about 0049's result.

**Not yet done:** the Definition-of-done dev check (`bin/deploy --env dev`, re-import on a business with a product in two collection-mapped groups) — left for the operator.