---
uid: acceptance_criterion-127f0d74
id: AC-1823
type: acceptance_criterion
title: A store lists only the bundles that hold something, sorted, and a mere handle
  creates nothing
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:05.470113+00:00'
updated_at: '2026-09-19T13:37:05.470113+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

A store reports the bundles it actually holds, on every backing:

- asking for a handle on a bundle does **not** bring that bundle into existence —
  a store asked only for handles still lists nothing, because a capture's first
  act is to write into a bundle that does not yet exist;
- once members have been written into two differently named bundles, the store
  lists exactly those two names, **sorted**;
- each bundle's members are its own: the same member key written into two
  bundles yields each bundle's own content, and one bundle's key listing never
  names another's members.

## Verification

On each backing: take a handle on a bundle without writing, assert the store's
listing is empty; write into two named bundles, assert the listing is exactly
those two names in sorted order; write the same member key into two bundles with
different content, and assert each reads back its own and that the first
bundle's key listing names only its own member.
