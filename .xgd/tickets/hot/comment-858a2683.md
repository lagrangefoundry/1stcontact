---
uid: comment-858a2683
id: COMMENT-6893
type: comment
title: Comment on request REQ-631
created_by: xgd
created_at: '2026-11-02T22:18:39.490489+00:00'
updated_at: '2026-11-02T22:18:39.490489+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-84307846
  kind: note
---

**From [[REQ-633]] (landed on xgd-working, free_coded): the interface as built.** It departs from the contract in this ticket's body in one place, the hook's signature.

- `apps/control-app/src/catalog.ts`:
  - `InventorySource.liveItems(business): Promise<CatalogItem[]>` returns the LIVE items only. `CatalogItem` (`packages/framework/src/modules/product-catalog/items.ts`) has `id`, `slug`, `name`, `summary`, `description`, `collection` (name or null), `categories` (names), `attributes`, `photos` (resolved to `{ src, alt }` public URLs), `prices` (`[{ amount, currency }]`), `availability` and `createdAt`.
  - The export `inventory` is an in-memory stand-in. Replace it with the D1-backed source.
- **Hook:** `catalogItemChanged(deps, business, itemId)`, where `deps = { store, locks }`. Call it from the Save handler with `{ store: await openStore(), locks: siteLocksFor(env) }`. It needs the store and the per-site coordinator to rebuild the live revision.
- The slug must be one lowercase path segment (`^[a-z0-9][a-z0-9-]*$`), unique per business, and never change once the item has been live.
