---
uid: request-2d24fa39
id: REQ-634
type: request
title: 'Shop tab: working inventory API in dev, a source-neutral Import, and a Default
  currency setting'
created_by: EPIC-31
created_at: '2026-11-02T23:45:19.979110+00:00'
updated_at: '2026-11-03T00:27:47.506012+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-eee0a784
  commits:
  - working_sha: a3d8e3459aae9e1ae63894e83f3ae9e5dfbb5455
    reconcile_sha: null
    main_sha: null
  version: 0.2.738
  story_points: 8
---

## Purpose

These are fixes and changes to the Shop tab built by [[REQ-631]] and [[REQ-633]], found by the operator using it in dev on 2026-11-02. **This ticket supersedes those two tickets where they conflict** (listed below). Both are at `ready_to_reconcile` and their bodies are frozen, so the changes live here. Part of [[EPIC-31]], needed for [[GOAL-55]]: the first customer starts building their site from 2026-11-09.

**The general-product rule applies** (EPIC-31): nothing specific to any customer or any single source platform is built into the Shop tab.

## 1. The Shop tab's API answers 404 in dev

- **Symptom.** In the Shop tab, "Scan the shop" fails with `POST /api/shop/import/scan → 404`, and "New item" fails with `POST /api/shop/items → 404`. The inventory list's `GET /api/shop/items` is answered 404 as well. Seen in the dev worker's log, for example `POST /b/<business>/api/shop/items 404`.
- **This is not stale code.** The dev snapshot (`apps/control-app/.dev-snapshot`, commit `b250d3820a`, deployed 2026-11-02T22:48Z) contains REQ-631's `shopRoute` and the router hook (`router.ts`, `if (p.startsWith('/api/shop/'))`), and every dev service started after that deploy.
- **The cause is unknown.** Find it. Candidates:
  - the request never reaching the hook: an earlier route, a prefix or a scope check returning 404 first
  - `shopRoute` answering its own 404 (`json(404, { error: 'Not found' })`) because the path or method doesn't match
  - migration `0040_inventory` not applied to the dev store
- **Fix.** Every Shop tab action works in dev against a real business: list, new item, open, save, delete, scan and import.
- **Guard.** Add a UAT that drives the Shop API **through the real router with a signed-in session on a business path** (`/b/<business>/api/shop/...`), not by calling `shopRoute` directly. A route that passes its own tests but is unreachable through the router must fail a test.

## 2. Import is source-neutral (supersedes REQ-631 "Import from WooCommerce")

- The Shop tab's action is **Import**. It opens a choice of **source**, and **WooCommerce is the only source today**. A platform name appears only as one option inside that choice, never in the tab's bar, its buttons or its headings.
- The source's own fields are asked for after it is chosen. For WooCommerce that is the shop address.
- **Every source feeds the same scan, mapping step, background import and report** (REQ-631). A new source is one new adapter behind that pipeline, with no new screens.
- **Other sources, such as CSV, are not in scope** (operator, 2026-11-02). They are an example of what the choice must leave room for, not a requirement.

## 3. Default currency is a business setting (supersedes REQ-631's currency field in the Shop tab's bar)

- **Settings gains "Default currency"**: a **dropdown** of ISO 4217 currencies, showing code and name (for example `EUR — Euro`), never a free-text field.
- **Item prices are in the default currency.** The item detail page shows the currency next to the price field but does not let it be edited per item. **The Shop tab's bar no longer has a currency field.**
- **There is exactly one stored default currency per business.**
  - Today there are two: the Shop's `shop_settings.currency` (REQ-631) and the site's `locale.currency` (REQ-151, which the money formatter reads).
  - Make Settings' Default currency the single source of truth. Either keep `locale.currency` as the stored value or migrate to one new field. Remove the other, **with no second field that can disagree.**
  - Record the choice here.
- **Changing the default** with priced items present asks for confirmation, and **never converts amounts**. The Prices rules (EPIC-31) forbid deriving a price from an exchange rate. Existing price rows keep their own currency and are listed for the owner to re-price.
- **Prices in more than one currency, by market, are not in scope.** The model already allows them (EPIC-31 "Prices").
- **REQ-633's catalog** formats each price from its own row's currency, with `formatMoney` and the site's locale. Check that it never assumes the default currency, and fix it if it does.

## Supersedes

| Ticket | Statement replaced |
|---|---|
| [[REQ-631]] | "Import from WooCommerce" as the action's name (now **Import**, with a source choice) |
| [[REQ-631]] | The currency input in the Shop tab's bar and `shop_settings.currency` as a separate store (now **Default currency** in Settings, stored once) |
| [[REQ-633]] | Nothing, unless the currency check in §3 finds an assumption to fix |

Everything else in REQ-631 and REQ-633 stands.

## Test plan

Name the UATs `test_UAT_FC_<this ticket>_*`.
- **Through the router.** With a signed-in session on `/b/<business>/api/shop/...`:
  - create an item, list it, open it, save it and delete it
  - run a scan and an import against a fixture WooCommerce shop

  Each step answers 2xx with the expected record.
- **Import choice.** The Shop tab offers **Import**, then a source choice listing WooCommerce. No platform name appears in the tab's bar or buttons. Choosing WooCommerce asks for the shop address and reaches the existing mapping step.
- **Default currency:**
  - Settings shows a Default currency dropdown of ISO codes, and saving it persists.
  - The Shop tab's bar has no currency field.
  - A new item's price is stored in the default currency and shown with it.
  - Only one stored value exists: reading the site's locale currency and the shop's currency gives the same answer, from one place.
- **Change with priced items.** Changing the default currency asks for confirmation, leaves existing amounts and their currencies untouched, and lists the items to re-price.
## Implementation (free-coded, 2026-11-02)

### §1 cause and fix
- **Cause.** The router handed `shopRoute` the request's own `url`. `shopRoute` matches on `url.pathname`, which in a browser is `/b/<business>/api/shop/…`. It never matched, returned `null`, and the router fell through to its final 404. The router strips the business prefix into `p` for every other route, but this hook passed `url` instead of `p`. REQ-631's suites called `route()` without the prefix, so they stayed green. Migration 0040 was applied in dev, and the dev bundle contained the hook.
- **Fix.** The router hands `shopRoute` a URL built from the stripped path (`router.ts`).
- **Guard.** `test_UAT_FC_REQ-634_shop_api.workers.test.ts` drives every Shop action through `worker.fetch` with a real app session on `/b/<business>/api/…`. With the old line restored, all five of its cases fail.

### §2 source-neutral Import
- The Shop tab's bar has two buttons, **New item** and **Import**. Import opens a view headed "Import" with an **Import from** choice of source. It lists one option per source, and **WooCommerce is the only one today**. The chosen source's own fields then appear (WooCommerce: **Shop address**), followed by **Scan**, and then the existing mapping step, run and report. A platform name appears only as an option in the choice, never in the bar, a button or a heading.
- Server: `shop-import.ts` defines an `ImportSource` adapter (`id`, `name`, `fields`, `address(fields)`, `categories()`, `products()`), and `IMPORT_SOURCES` lists every source. The scan, the mapping (saved per business and source), the background run (`shop_imports.source` names the adapter) and the report are shared by all sources. **A new source is one entry in `IMPORT_SOURCES`, with no new screens.**
- API: `GET /api/shop/import/sources` lists the sources with their fields. Scan, mapping and import take `{ source, fields }` (mapping: `{ source, mapping }`). An unknown source is refused with a 400 that names the sources on offer.

### §3 Default currency: decision recorded
- **The stored value is the site's `locale.currency`, i.e. the business site's `site.json` `config.currency`.** `shop_settings.currency` is removed: migration `0041_default_currency.sql` copies an existing shop currency onto the business's draft site, where that site declares none, then drops `shop_settings`. Why the site's field was kept:
  - It already exists, and both renderers' `resolveSiteLocale` read it.
  - Removing it would have broken the validation of site definitions that already declare it, and changed REQ-151's behaviour.
  - Every business is provisioned with one site.
- **Reading.** The default currency is `resolveSiteLocale(config).currency` of the business's one site. Where the site declares no currency it is derived from its country, exactly as the renderers derive it. `declared` reports whether a currency was explicitly chosen. A business with no site has no default currency, and Settings says so.
- **Settings.** A new **Default currency** section sits under the business name. It is a dropdown of every ISO 4217 code the platform knows (`Intl.supportedValuesOf('currency')`), shown as `CODE — Name` (`EUR — Euro`), never free text. Saving writes `config.currency` through the router's leased, compare-and-set site store.
- API: `GET/POST /api/settings/currency`. The server accepts only codes in `Intl`'s currency list.
- **Prices.** Prices are entered in the default currency. The item editor labels the price `Price (EUR)`, or `Price (choose the Default currency in Settings)` when there is none, and offers no per-item currency. The Shop tab's bar has no currency field. `POST /api/shop/settings` is removed.
- **Changing it with priced items present.** The first POST answers `409 CONFIRM` with the items to re-price, and nothing is written. A POST with `confirm: true` writes. **Nothing is converted:** price rows keep their own amount and currency. "Items to re-price" are items with an all-markets price but none in the new currency. Settings shows the confirmation inline, with **Change to X** and **Keep Y**, and lists the items to re-price after the change.
- **Import.** If the business never chose a currency (`config.currency` absent) and no item has a price yet, the import adopts the source's currency, writing it onto the site. Otherwise a product priced in another currency fails, and the report names the Settings currency.
- **REQ-633 check: no change needed.** The catalog formats each price from its own row's currency (`shownPrice` → `formatMoney(price.amount, price.currency, ctx.locale)`) and never reads the default currency.

### Consequences for REQ-631's UATs (superseded statements only)
- `test_UAT_FC_REQ-631_inventory.workers.test.ts`:
  - Each business is given its site.
  - Import calls name `source: 'woocommerce'`.
  - The currency is set through `/api/settings/currency`.
  - `liveItems` is handed `SITES`.
- `test_UAT_FC_REQ-631_shop_tab.test.ts`: the import case now goes Import → source → Shop address → Scan.
- `tests/support/d1-site-factory.ts` applies 0041, and its head marker moved.

### Test plan (as built)
- `tests/test_UAT_FC_REQ-634_shop_api.workers.test.ts` (through `worker.fetch`, signed-in session, `/b/<business>/…`):
  - item lifecycle: create, list, open, save, delete
  - scan and import against the fixture WooCommerce shop
  - an unknown source is refused
  - the default currency is stored once on the site: the locale and the Shop agree, `shop_settings` is gone, a new item is priced in it, and non-ISO codes are refused
  - a change with priced items confirms first and converts nothing
- `tests/test_UAT_FC_REQ-634_shop_import_and_currency.test.ts` (jsdom):
  - the bar shows only New item and Import, with no platform name and no currency field
  - the source choice lists WooCommerce and asks for the shop address, reaching the mapping step
  - the item price shows the default currency, read-only
  - Settings' ISO dropdown saves and the value persists
  - a change with priced items asks first, lists items to re-price, and can be kept or confirmed

### Not done here
- The Settings assistant has no tool for the default currency. The pane is the only way to change it today.
- Dev needs migration 0041 applied on its next `bin/deploy --env dev`, along with this code.