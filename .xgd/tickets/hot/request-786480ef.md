---
uid: request-786480ef
id: REQ-633
type: request
title: 'Catalog module: product grid and product pages from inventory'
created_by: EPIC-31
created_at: '2026-11-02T20:18:08.234634+00:00'
updated_at: '2026-11-02T22:29:56.705600+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e7b812c7
  commits:
  - working_sha: dce013745e2a5d8ba8c89dd43951775a1088d648
    reconcile_sha: null
    main_sha: null
  - working_sha: b95f77b03f0947a67ba00b93cac0559f0dcdf4c2
    reconcile_sha: null
    main_sha: null
  - working_sha: 870001a2a3da88d39f7420f6522e4467872e487f
    reconcile_sha: null
    main_sha: null
  version: 0.2.737
  story_points: 20
---

## Purpose

The second child of [[EPIC-31]]. It puts a business's inventory from [[REQ-631]] onto its public site, in two forms:
- a **product grid** the owner can place on any page
- a **product page for every live item**

Both are styled by the site's own design and laid out identically for every item.

**Timing:** [[GOAL-55]]'s first customer starts building their site from **Monday 2026-11-09**.

**This is a product, not one customer's shop** (operator, 2026-11-02). Nothing specific to a customer may appear in the code, tests, fixtures or this ticket: names, category names, counts. Fixtures are synthetic.

**There is no checkout here and no dependency on [[EPIC-9]]:** where Buy will be, the module shows an enquiry link.

It can start now, against the item model in REQ-631's body; it does not have to wait for REQ-631's code.

## Design (operator, 2026-11-02; see EPIC-31 "The public site", "The Shop tab" and "Prices")

**A new behaviour module, `catalog`**, in `packages/framework/src/modules/`, following the existing behaviour-module pattern (`carousel/meta.ts`, `behavior.ts`, `registry.ts`).

**The module owns:**
- **The data.** It reads inventory records at build time: live items only.
- **The contract.** Two slots:
  - **`card`**: one L1 subtree, used as the template for every item in a grid
  - **`product-page`**: one L1 subtree, used as the template for every item's page
- **The fields that can be bound into those templates:**
  - name, **summary** (plain text, possibly empty: a card binding it shows nothing when it is empty) and **description**
  - collection name, category names, and attributes (name/value pairs)
  - the photos (the first one, or all of them as a gallery)
  - the price, formatted
  - the Sold state
- **The controls it wires:**
  - **Buy**, rendered as the enquiry link in this ticket (see below)
  - **"Commission something like this"**
  - the card's link to the item's product page
- **Behaviour.** A sold piece shows Sold, hides its price by default, and swaps Buy for the commission link. A not-live item appears nowhere.

**L1 owns all styling.** The card and product-page templates are ordinary L1 in the site definition, using the site's design tokens like any other section. The module adds **no visual settings**: the framework's rule forbids visual dials on modules (see the REQ-96 note in `carousel/meta.ts`). There is one card template per grid and one product-page template per site, applied to every record, so every item looks the same.

**Binding fields is a new typed L1 primitive.** It is a text, image or price node that **names a field** of the current record instead of holding a value. Per the security policy:
- It is **never a raw template string**.
- Bound values reach the page through the same sinks as authored values: text escaped, image sources checked against the URL allowlist, and nothing becomes raw HTML or CSS.
- It is validated as structured L1, and an unknown field name is rejected.
- The `capture(render(L1)) ≈ L1` round-trip still holds.

**Each product page's SEO meta description** is the item's summary. When the summary is empty, it is the start of the description, cut at a sentence or word boundary.

**Prices are shown exactly** (EPIC-31 "Prices"). Formatting goes through the framework's existing `formatMoney` (`packages/framework/src/intl.ts`), which works from the integer and currency with exactly the currency's number of decimal places, and the site's locale for separators. For example, 1999 EUR in `en-IE` is shown as "€19.99". There is no floating point and no rounding.

## Which items a site shows

- **Every live item has a product page** at `/shop/<slug>`.
  - The slug comes from the name, unique within the business, and stays stable across renames once published.
  - The pages are **generated from the records** by the site generator (`tools/generate`), never authored one by one.
  - Not-live items have no page.
- **Each product grid holds a selection rule, not a list of items.** The rule is module configuration in the site definition (data, not styling):
  - **collections**: any of, or all
  - **categories**: any of, or all
  - **availability**: in stock, sold, or both
  - **an order**: newest first, price up or down, or name
  - **an optional limit**

  A live item appears in every grid whose rule matches it, with no page edits.
- **Grids page or cap their output.** With hundreds of items, a grid with no limit must still render a usable page.

## Inventory is separate from site publication

These are the operator's rules, from EPIC-31.
- **Site design waits for the site's Publish:** the grid's position on the page, its rule, and the card and product-page templates.
- **An item's content follows the item's Save**, never the site's Publish. Saving a live item, a change of availability, or switching an item between live and not live **rebuilds that item's product page and every published grid whose rule selects it**, on its own and without a site Publish.
- **The builder's preview reads the records live**, so a Save in the Shop tab shows in the preview while the owner builds.

## Buy, for now

Until the business can take payments ([[EPIC-9]]'s `canTakePayments(business, mode)`, listed in GOAL-55 as due by the end of week 2), **an available item shows an enquiry link where Buy will be**. The link opens the business's existing enquiry or commission form, prefilled with the item. Read this through one function that returns false until EPIC-9 provides it. The later Shop child that adds checkout swaps the control and nothing else.

## The consultant

The site consultant must be able to:
- place a product grid on a page and set its rule
- design the card and product-page templates

It does this the way it places and designs other modules today. Without this, an owner cannot build their shop pages. Cover this in the consultant's module knowledge, in the same place the existing modules are described.

## Decisions (answers to the session's questions, 2026-11-02)

**One ticket, several commits** (operator). This ticket is not split. Land it as a sequence of commits on `free-REQ-633`, for example:
1. the L1 field binding and the price display
2. the module, grid and product mode, generated pages and paging
3. the Save-driven rebuild and the live preview
4. form prefill
5. the consultant's module knowledge

All the commits go in this ticket's `fields.commits`.

**1. The inventory table belongs to [[REQ-631]].** This ticket does not create it.
- **The contract** (recorded in both tickets):
  - REQ-631 lands the migration first, as its first commit, and provides `liveItems(business)`, which returns the live items with their fields.
  - REQ-631 keeps a **`slug`** on each item. It is unique per business, set from the name the first time the item is saved live, and never changed afterwards, so published URLs stay stable.
  - After every Save, and every live, availability or deletion change, REQ-631 calls **`catalogItemChanged(business, itemId)`**, which this ticket provides. Until this ticket lands, it is a no-op.
- **Until REQ-631's migration lands**, this ticket builds against an in-memory record source with the same shape. It never creates a second migration, so migration numbers cannot collide.

**2. A Save re-renders against current inventory, without a new site revision.** Agreed: inventory is not site design, so a Save never adds to the site's revision history.
- **A render is a function of two inputs:** the site definition revision and the inventory as it stands. A Save changes the second input, and the affected output (the item's page, and the pages holding grids whose rule selects it) is re-rendered from the **same live revision** and replaced in place. A full re-render of the live revision is acceptable if scoping proves costly; correctness comes first.
- **Rolling the site back re-renders the older revision against current inventory: yes, that is right.** Rollback restores the site's design, never old prices or availability.
- **A Save rebuild and a site Publish never interleave.** Both go through the per-site coordinator ([[DOC-5]] rule 7).
- This is not a clock-dependent render. `intl.ts`'s rule that output stays deterministic still holds, because the same definition plus the same inventory always gives the same bytes.

**3. The product-page template is an ordinary page.** Agreed: it keeps the site's own header and footer.
- It holds a `catalog` instance in **product mode** with the `product-page` slot. The generator produces one copy per live item at `/shop/<slug>`, and the template page itself is never served.
- A grid is a `catalog` instance in **grid mode**, with the `card` slot and the selection rule.
- **The REQ-109 rule against `/` in page slugs stays as it is for authored pages.** Only generated item pages live one level down, with relative asset URLs fixed for them.
- **With no product-page template on the site**, no `/shop/` pages are generated and cards render without a link. The consultant adds the template with the site's first grid.

**4. Static paging, not a cap.** A grid with no limit, or with more items than its page size, generates static pages (`/<page>`, `/<page>/2`, …) with next and previous links. The page size is grid configuration, default 24. A limit, when set, still caps the total.

**5. One form, with a link that names the item.**
- The grid and product-page instances name a form page in config. There are two fields, an **enquiry form** and a **commission form**, both defaulting to the business's existing contact form page, so a business with a separate commission form can point at it.
- The link carries `?item=<slug>&intent=enquiry|commission`.
- The contact form gains a **generic prefill-from-URL capability**:
  - The opening line goes into the message field as plain text (a textarea value, never HTML), with a length cap.
  - The item is recorded on the lead as a structured field (its slug), not only in the text.
  - An unknown slug or intent prefills nothing.
- The visible wording ("Ask about this piece", "Commission something like this") is copy in the site definition, not code.

**6. Size:** one ticket, per the operator.

**Decided in-session, recorded here, with one correction:**
- **A field binding is a typed property on text and image nodes**, drawn from a closed list of field names. Unknown names are rejected, and bound values go through the existing escaping and URL allowlist.
- **Prices use the framework's existing `formatMoney(amountMinor, currency, locale)`** in `packages/framework/src/intl.ts` (REQ-152). It already formats exactly, through decimal-string arithmetic and ICU's ISO 4217 minor units, with the site's locale deciding the separators. **Do not add a second money formatter or a currency table.** One place turns money into text.
- **Sold, price, Buy and Commission are module controls** whose visibility follows the item's state.
- **The consultant picks the module up from the generated module list**, plus a short hint where the carousel's hint already lives.

## As built (session, 2026-11-02)

This records the design as implemented, including what the decisions above needed in order to work. Where it departs from the text above, it says so.

**The binding (L1).**
- `bind: { field, link? }` on `text` and `image` nodes. Text fields: `name`, `summary`, `description`, `collection`, `categories`, `attributes`, `price`, `sold`, `enquiry`, `commission`. Image fields: `photo` and `photos`. Any other field name is rejected by the schema.
- **A binding outside a catalog slot is refused** by site validation, on BUG-220's terms for a stray `control`: in a page's own tree it has no record, so it would show its placeholder copy as if it were real.
- `bindL1(template, record)` turns a template into plain L1 for one record before render: a bound node takes the record's value, or disappears when the record has nothing to show (an empty summary, no price, not sold). `photos` becomes one picture per photo.
- Because the result is ordinary L1, every sink applies to it: copy is escaped, and a `src` or `href` must clear the URL allowlist. **An off-allowlist photo is dropped**, not drawn with an empty `src`.
- The renderer marks a bound element `data-l1-bind`, plus `data-l1-bind-link` when it links. Capture records the marker as a carried axis, with no capture-schema bump, because only this renderer writes it. The fold writes it back as `bind`, and drops the `link` a linking binding implies. So `capture(render(L1)) ≈ L1` holds; the fold may reorder leaves (pictures after text), so the round-trip UAT compares the bindings as a set.
- **The template's own wording is the copy.** `sold`, `enquiry` and `commission` show the node's own text, and only when they apply. `enquiry` and `commission` link to their form.
- **Departure from "Sold, price, Buy and Commission are module controls":** they are bound text fields instead. That keeps their wording in the site definition, which decision 5 asks for, and keeps every state the module draws in one mechanism. The later checkout child changes what `enquiry` (Buy) draws, and nothing else.

**The module** (`packages/framework/src/modules/product-catalog/`, id `catalog`, v1).
- **Config:**
  - `mode` (`grid` or `product`)
  - the rule: `collections` and `categories` (any of those named; empty means all), `availability`, `order`, `limit`
  - `pageSize` (default 24)
  - `previousLabel` and `nextLabel`
  - `showSoldPrice`
  - `enquiryForm` and `commissionForm`
- **Slots:** `card`, `list` and `pager` (grid mode), and `product-page` (product mode).
- **Controls:** `previous` and `next`.
- `list` and `pager` are additions the design needed. L1 owns the grid's arrangement, so `list` is a container whose layout, columns and gap arrange the cards; its own children are ignored. A long grid needs paging links, so `pager` holds the two controls; without a pager, plain links keep every page reachable.
- **Each card renders as its own fragment** and mounts into the list through `slot` nodes. That keeps the builder's edit addresses rooted at the card template.
- In the builder's edit channel, **a grid with nothing to show draws its card once as authored**, so it can be designed before there is inventory.
- **The product-page template draws the first live item** when shown on its own in the builder, or its placeholder copy when there is no inventory.
- Ordering is deterministic: ties fall back to the name, then the id.
- Prices go through `formatMoney` with the site's locale. A sold item hides its price unless `showSoldPrice` is set.
- The module ships no CSS.

**The generator** (`tools/generate/src/render/render.ts`). A render is a function of the definition AND `opts.catalog` (`{ items, canTakePayments }`).
- **The product-page template** is the page holding a `catalog` in product mode. `isServedPage` excludes it, so the nav, the sitemap and publish all agree that it is never served. The builder's preview still renders it.
- **One page per live item** at `shop/<slug>.html`. Its title is "<item name> — <business name>", and its meta description is the summary or the cut description. An item whose slug isn't a single lowercase segment is skipped.
- **Paged grids** are written to `<page>/<n>.html`. A page with several grids pages to the longest; a shorter grid shows its last page.
- Nested pages carry `<base href="../">`, so REQ-109's relative URLs resolve at the site root. Authored slugs keep REQ-109's flatness rule.
- The contact form is handed the live items (slug → name) for its prefill.

**A Save follows the item, not Publish** (`tools/generate/src/publish/publish.ts`: `rebuildLiveRevision`).
- **The live revision is re-rendered whole, against current inventory, and replaced in place.** That covers the item's page, every grid page that selects it, and removal of the pages it no longer has. Decision 2 allowed a full re-render; no new revision is added.
- The rebuild renders the revision's own frozen definition, never the draft, so unpublished design changes don't leak out.
- **Each publish now stores its image delivery manifest** (`source/delivery.json`) beside the definition. A rebuild then keeps every `srcset` without rebuilding the image ladder, which would mean reading every picture the site holds.
- **New store verbs** (D1/R2, filesystem and memory adapters): `readRevisionDelivery` and `replaceRevisionPages`. The filesystem adapter keeps only the live output, so it can replace only the live revision.
- **Published pages keep the edge cache's 60 s freshness**, exactly as after a Publish. The Cache API has no global purge, so a Save can take up to a minute to show to a visitor who loaded the page just before it.

**The per-site coordinator** (`apps/control-app/src/site-coordinator.ts`). There was none, so this ticket adds the `SiteCoordinator` Durable Object: one per site, holding a 15-minute lease.
- `/api/publish` and every Save rebuild run inside `siteLocksFor(env).exclusive(site, …)`.
- Without the binding (the suites, the CLI), they take turns within the isolate.
- `wrangler.toml` binds `SITE_COORDINATOR` with a `v2` `new_sqlite_classes` migration, in all three environments.

**The contract with [[REQ-631]]** (`apps/control-app/src/catalog.ts`).
- **The source:** `InventorySource.liveItems(business)` returns the live items as `CatalogItem`, with photos already resolved to `{ src, alt }`. REQ-631 replaces the in-memory stand-in `inventory` with its D1 source.
- **The hook's signature is `catalogItemChanged(deps, business, itemId)`, departing from the contract above.** `deps` is `{ store, locks }`, because a Worker function needs the store and the coordinator to rebuild; REQ-631's Save handler has both (`openStore()`, `siteLocksFor(env)`).
- `canTakePayments(business, mode)` returns false until [[EPIC-9]] provides it.
- **Publish and the preview read the inventory live.** The preview includes it in its cache key, so a Save re-renders and an unchanged inventory is still a cache hit.

**The contact form's prefill** (generic, `contact-form` v7; no version bump, since the fields are optional).
- **Config:** `prefillField`, `enquiryLine` and `commissionLine`, all copy.
- **The client** reads `?item=&intent=` against the embedded live-item names. It writes "<line> <item name>" into the field's value, never as markup, only into an empty field, and capped at 300 characters.
- An unknown item or intent prefills nothing.
- **The item reaches the lead's provenance** through the reserved hidden field `fc_item`, as `detail.item` (the slug). A malformed slug is not recorded. It is never one of the visitor's answers.

**The consultant.**
- The generated module reference picks up `catalog` from `CATALOG`.
- The usage guidance is DOC-47 §3 "The shop catalogue", in the same place the other components are described. DOC-47 no longer lists a product catalogue as unavailable.
- DOC-25 §8a holds the contract's worked example.

**UATs.**
- `tests/test_UAT_FC_REQ-633_catalog_render.test.ts` (generator): grid, product pages, sold, price, an available item's enquiry link, security, unknown field and stray-binding rejection, paging, no template, and prefill in both directions.
- `tests/test_UAT_FC_REQ-633_bind_roundtrip.test.ts` (Chromium): the capture round-trip.
- `tests/test_UAT_FC_REQ-633_catalog_follows_the_item.workers.test.ts` (`/api/publish`, `catalogItemChanged`, `/preview`, the public-site Worker, and the real `SiteCoordinator`):
  - publish renders inventory, and a not-live item appears nowhere
  - a price Save without a Publish
  - not live removes the item's page and cards
  - an unpublished rule change doesn't leak
  - the preview reflects a Save
  - publish and rebuild take turns
- `tests/test_UAT_FC_REQ-633_enquiry_lead.workers.test.ts` (the public-site `/api/lead`): the item's slug recorded on the lead, and a malformed slug not recorded.

## Out of scope

- checkout, the cart, and the Buy button taking money
- orders
- prices in more than one currency or market (the module shows the item's single price row)
- discounts and sale prices

## Test plan

Name the UATs `test_UAT_FC_<this ticket>_*`. Each should use real entry points: the generator, the preview and the published-site Worker.
- **Grid:** a site with a grid whose rule selects one category, in stock, newest first, limit 2. It renders exactly the matching live items, in order, each through the one card template, each linking to its product page.
- **Product pages:** each live item gets a page at its slug, and a not-live item gets none and appears in no grid.
- **Sold:** a live sold item shows Sold, no price and the commission link, with no enquiry or Buy control.
- **Price:** an item at 1999 EUR is shown as "€19.99", identically on its card and its page.
- **Security:** an item whose name or description contains markup or a `<script>` renders it as inert text. A bound image whose source is off the allowlist is dropped. A binding to an unknown field is rejected by validation.
- **Save follows the item, not Publish:**
  - Saving a live item's new price changes its card and page on the published site without a site Publish.
  - Switching an item to not live removes its page and its cards.
  - An unpublished change to a grid's rule does not reach the published site.
- **Preview:** a Save in the Shop tab is reflected in the builder preview.
- **Enquiry stand-in:** with `canTakePayments` false, an available item shows the enquiry link, prefilled with the item.