---
uid: acceptance_criterion-4646a3bd
id: AC-2240
type: acceptance_criterion
title: No child row or stored object records the business; renaming a business, changing
  a slug, or moving a site rewrites one column and copies no object
created_by: xgd
created_at: '2026-11-04T16:01:04.208656+00:00'
updated_at: '2026-11-04T16:01:04.208656+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

A site's pages, assets, change journal and revision log are keyed by **the site's key** and carry no business. Its draft objects live under `draft/<siteId>/` and its published output under `sites/<siteId>/rev/`, with no business or slug in either prefix. **Only the site's own row names its business.**

Consequently each of these is a single-column update on a single row, with no other row rewritten and no stored object copied or moved:

- renaming a business;
- changing a site's slug: the site is then read, edited and published under the new slug, with its pages, assets, journal and revisions intact;
- moving a site to another business: the destination business's handle then sees the site with all its content, and the origin's handle no longer does.

## Verification

Populate a site with pages, an asset, journal entries and a published revision. Snapshot every child row and every stored object key. Perform each change as one update to one row, then assert the child rows and object keys are identical to the snapshot and the site is fully readable through the appropriate handle under its new slug or owner.