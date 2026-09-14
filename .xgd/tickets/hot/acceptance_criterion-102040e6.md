---
uid: acceptance_criterion-102040e6
id: AC-1773
type: acceptance_criterion
title: One tenant's captured material is unaddressable from another tenant's store,
  and lives under that tenant's key prefix
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:49:49.238935+00:00'
updated_at: '2026-09-14T04:49:49.238935+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
A capture taken on one account's behalf is that account's private material — their
old site, and competitors' sites they will never hold the right to republish — and
a store bound to a different account cannot reach it:

- the capturing account's store lists the bundle; the other account's store does not
- asking the other account's store for that bundle by name yields a handle whose
  members read as absent and whose enumeration is empty — the read is not refused,
  it is unaddressable, because the handle composes every key from its own account's
  prefix
- the capturing account still reads its own bundle, so the isolation assertion is
  about separation rather than about nothing having been written
- the bytes are addressed under that account's prefix in the client-private store,
  not in the store a public site is served from by path

## Verification
Register two tenants. Capture a page through the first. Assert the first lists and
reads the bundle; assert the second neither lists it nor reads any member of it
and enumerates it as empty. Separately enumerate the underlying object keys and
assert the capture record's key sits under the capturing tenant's reference prefix.
