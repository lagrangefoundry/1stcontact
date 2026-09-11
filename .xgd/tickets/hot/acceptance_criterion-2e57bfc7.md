---
uid: acceptance_criterion-2e57bfc7
id: AC-1663
type: acceptance_criterion
title: An account with no index yet reads as having none rather than failing, so its
  first document indexes
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:45.111928+00:00'
updated_at: '2026-09-11T03:43:39.523250+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

An account whose index has never been written reads as having none rather than as
a failure: every part of the index reads back as absent, and writing then reading
the same part returns what was written, unchanged. The first document an account
ever records therefore indexes successfully with no prior state to start from.

"There is no index yet" is the state every account passes through exactly once,
at the moment the product can least afford an error, and it is a path that only
ever runs on a brand-new account.

## Verification

Against an account that has recorded nothing, read each part of its index and
assert each reads as absent rather than raising. Write a value to each and read
it back, asserting the round trip is exact. Then record that account's first
document, refresh, and assert it indexes and is retrievable.