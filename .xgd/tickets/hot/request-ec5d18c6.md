---
uid: request-ec5d18c6
id: REQ-639
type: request
title: 'Shop tab: item detail and inventory filter layout tidy-up, Availability and
  no-collection filters'
created_by: EPIC-31
created_at: '2026-11-03T16:19:27.658613+00:00'
updated_at: '2026-11-03T19:44:24.293805+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b98c35fb
  commits:
  - working_sha: 954eac292ea2a8d0b05c0a4a98e855cfc9488bbf
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 97c2abec40af5f29a005fd8dacad644b30bb29b5
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.746
  story_points: 5
---

## What changes

Layout and control tidy-up of the Shop tab's inventory list and item detail (`apps/control-app/src/builder/shop.js`), plus a new Availability filter and a "None" collection filter. Operator feedback after the Shop tab started working end to end.

### Item detail: photo controls
- Each photo's text buttons become **icon buttons**. The old label stays as the hover text (`title`) and the accessible name (`aria-label`):
  - Earlier → `<`
  - Make main → star
  - Remove → trash can
  - Later → `>`
- **Order, left to right:** Earlier, Make main, Remove, Later. A control that doesn't apply (Earlier/Make main on the first photo, Later on the last) is hidden or disabled, and the row stays centred either way.
- The row fits **on one line under its photo, centred to the photo's width**, at the photo's displayed size.
- **"Add a photo from the Library"** becomes a `+` icon button **next to the "Photos" heading**, still with that label as hover text and accessible name. It opens the same Library choice as today.

### Item detail: fields
- **Price, Availability, Collection** are laid out as `Label: value` rows in **aligned columns**: the labels in one column, the values in another.
- **Attributes** use the same two-column alignment as Price/Availability/Collection, so all of them line up.
- **Categories** are shown in neat, aligned columns.
- **Add category** and **Add attribute** become `+` icon buttons **next to their section headings** ("Categories", "Attributes"), with the old label as hover text and accessible name. The "Add collection" control follows the same pattern for consistency.
- **Consistent type.** The item title and the section headings (e.g. Categories) are currently oversized. They use the builder's standard heading/label sizes, consistent with the rest of the Shop tab and the other builder tabs. No one-off font sizes.

### Inventory list: filter bar
- **Line 1:** the name search and the "50 of 364" count.
- **Line 2:** the Collection, Category, Live/Not live and **Availability** filters.
- **Collection filter gets a "None" option** (after "All collections"): items with no collection. It's applied server-side by the items list endpoint like the other filters, so the count and paging reflect it, and it combines with the other filters.
- **New Availability filter:** `Any availability | Available | Sold out`.
  - Available: availability > 0.
  - Sold out: availability = 0.
  - It's applied **server-side** by the items list endpoint like the other filters, so the count and paging reflect it. It's not a filter over the loaded page.
- **The latest filter wins.** If the owner changes a filter before the previous list request has answered, the earlier answer is dropped, so a slow result for the old filter never replaces the new one's list or count.
- **Everything fits in the list pane.** The Shop's list opens at 45% of the width (the default was 30%). The item editor beside it is capped at 72ch and doesn't need the space. At a 1280px window, the search and count share line 1 and all four filters fit whole on line 2. On a pane too narrow for all four, the filters wrap to another line rather than truncate their labels.

### Collection list: confirmed correct, no fix needed (2026-11-03)
Diagnosed against the dev store, and not a display bug:
- The store holds **1 collection** (Preloved, 330 items) and **12 categories**. The other **34 items have no collection**. That's why Preloved shows 330 of 364.
- **Where it came from:** the import mapping that was saved made only one source category a collection, and every other source category a category. That follows the scan's default rule: a top-level source category that has sub-categories becomes a collection, and everything else becomes a category.
- **To get more collections:** re-import with the mapping changed to collection for the source categories wanted as collections. Re-import reuses the saved mapping and doesn't duplicate items (BUG-333, J3).
- The filter and the detail dropdown already read every collection the business has, independent of item paging. This ticket changes nothing there.

## Why free-coded
Small, UI-only polish of landed code (plus two filter options), well bounded inside the Shop tab.

## As built (2026-11-03)
- **API.** `GET /api/shop/items` takes `availability=available|sold_out` (`availability > 0` / `= 0`) and `collection=none` (`collection_id IS NULL`). Both combine with every other filter, and both feed the total as well as the page (`shop.ts` `listItems`, `NO_COLLECTION`; `shop-routes.ts`).
- **Icon controls.** Each control is a 24px button whose old words are both its `title` and its `aria-label`. `<` and `>` are text, the star and the trash can are inline SVG built as nodes. A photo control that doesn't apply is **disabled** (not hidden), so each row keeps four buttons, centred under its 120px photo.
- **Photos `+`.** It loads the Library photos the item doesn't already have into a choice (`select`, accessible name "Photo from the Library") that appears under the heading. Choosing a photo adds it, as before.
- **Facts grid.** A single 3-column grid (`.builder-shop__facts`): label column (`Price (EUR):`, `Availability:`, `Collection:`, then each attribute's name input), value column, and a narrow column for Collection's `+` and each attribute's trash-can remove. The Categories and Attributes headings, and the categories, span the grid. Categories sit in an auto-fill grid of equal-width columns.
- **Type.** New token `--builder-heading-font-size: 16px` (the step `.builder-console__heading` already uses). The item title uses it. Section headings and field labels use `--builder-control-font-size` (13px), headings at weight 600.
- **Knock-on test edits.** BUG-333 J5 now adds a photo through the Photos `+`. REQ-634's currency UAT finds the price label through `input.labels`, because the label is now a grid cell linked by `for` rather than a wrapping `<label>`.

## Test plan
UATs `test_UAT_FC_REQ-639_*` in `tests/browser/test_UAT_FC_REQ-639_shop_layout_and_filters.test.ts`, in the BUG-333 acceptance-suite style: real multi-process Chromium via `pnpm test:browser`, the real control-app Worker and router, a signed-in session, and a migrated store with the fixture shop imported. That's 57 products: the fixture's own plus 45 in-stock extras, so filtered results run past one page.
- `photo_controls_are_icons_in_order_centred_and_work`: on each photo, the `aria-label` and `title` read Earlier/Make main/Remove/Later in that order, the glyphs are `<`, star, trash, `>`, and inapplicable controls are disabled. The row is one line, under the photo, inside its width and centred on it (bounding boxes). Later, Earlier, Make main and Remove are each pressed, then Save. After a reload, the store and the screen hold the expected order.
- `plus_buttons_beside_their_headings_perform_the_add`: the `+` buttons beside Photos, Categories and Attributes, plus the `+` for Collection, carry their labels and sit on their heading's line just after it. Each one performs its add, and after Save the store holds the new photo, category, collection and attribute.
- `facts_align_in_two_columns_and_type_is_the_builders`: the Price/Availability/Collection labels and the attribute name inputs share one left x, and their values share another. Each label is on its value's row. Categories have equal widths, and every left edge is one of the first row's. The title's computed size equals `--builder-heading-font-size` (16px), and the headings and labels equal `--builder-control-font-size` (13px).
- `filter_bar_search_and_count_then_four_filters`: the search and the count share line 1. Collection, Category, Live and Availability, in that order, share line 2 below it. All of it stays inside the list pane. The options read Any availability/Available/Sold out, and the Collection options start All collections/None.
- `availability_and_no_collection_filters_are_the_stores`: for Available (which runs past 50, so paging is exercised), Sold out, None, and None with Available, the total and every listed name (paged to the end) equal the store's `availability > 0`, `= 0` and `collection IS NULL` sets.
- Regression scope run green: BUG-333 J4, J5 and J6 (browser), the REQ-631 and REQ-634 jsdom suites, and the REQ-631 inventory and REQ-634 shop API workers suites (D1).

**Dev check (2026-11-03).** This was run against the dev store, the local miniflare D1 behind `bin/deploy --env dev`, for the one business holding the imported shop. It used the endpoint's own `WHERE` clauses:
- any availability: **364**
- Available: **37**, Sold out: **327** (37 + 327 = 364)
- collection None: **34**, which matches the earlier diagnosis (330 Preloved + 34 = 364)
- None + Available: **24**, None + Sold out: **10**

The dev Worker serves a frozen build until the next `bin/deploy --env dev`, so these totals are checked against the store, not yet through the dev UI.