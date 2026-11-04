---
uid: acceptance_criterion-7967e301
id: AC-2242
type: acceptance_criterion
title: Erasure reaches every site object by enumerating the business's site keys,
  and forgetting a site removes its rows and objects
created_by: xgd
created_at: '2026-11-04T16:01:05.824959+00:00'
updated_at: '2026-11-04T21:12:31.363098+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

A store handle answers **the list of every site key its business owns**. This is the enumeration a business erasure will use to reach objects that are no longer under a business prefix. Business erasure itself is not built; nothing in the product calls this enumeration for erasure today (see Reconciliation Decision on story-fde7370b). It lists only that business's sites, never another's.

**Forgetting a site** removes every row the site owns (its definition, pages, assets, journal and revisions) and every stored object under both its draft prefix and its published prefix. Afterwards the handle reports no draft and no key for that slug, its published address no longer answers, and no object under either of its prefixes remains.

## Verification

Create several sites across two businesses and assert each handle's enumeration is exactly its own site keys. Populate and publish a site, forget it, and assert zero rows reference its key, zero objects exist under `draft/<siteId>/` and `sites/<siteId>/`, the handle reports it absent, and the other sites are untouched.