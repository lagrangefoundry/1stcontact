---
uid: acceptance_criterion-f119999e
id: AC-1489
type: acceptance_criterion
title: The store attachment bytes go to is never the store the public site is served
  from, in the deployed configuration as well as the local one
created_by: xgd
created_at: '2026-09-02T00:17:24.513518+00:00'
updated_at: '2026-09-02T00:17:24.513518+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

The deployment configuration for the control application never names the public site's store as the
destination for attachment bytes, in either of its halves:

- In the configuration the local development runtime reads, the material destination names a target
  that is not the public site's target and is not the public site's store by name.
- In the configuration the deployed environment reads, the same holds independently — the deployed
  half is the one that matters and the one nothing else would catch.
- The public site's own store is still declared in both halves. A separation claim passes trivially if
  the public site's store has simply been dropped, which would break publishing instead of protecting
  material; the criterion is that two distinct stores are declared, not that one is missing.

## Verification

Read the control application's deployment configuration, split into its default half and its named
deployed half, and for each half compare the target named for attachment bytes against the target
named for the public site's assets: the two must differ, and the attachment target must not be the
published-site store under any name. Confirm both halves still declare the published-site store.
