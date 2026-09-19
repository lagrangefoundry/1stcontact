---
uid: acceptance_criterion-89e85c9a
id: AC-1830
type: acceptance_criterion
title: One account's captured bundles are unaddressable from another account's handle
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:35.857565+00:00'
updated_at: '2026-09-19T13:37:35.857565+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

A bundle captured by one account is unaddressable from another account's handle.
Given two active accounts and a capture taken by the first:

- the first account's store lists that bundle;
- the second account's store does **not** list it;
- asking the second account's store for a bundle of that exact name yields a
  handle that reads every member as absent and whose member listing is empty —
  the second account is not *refused* a read, it simply cannot name the first
  account's bytes;
- the first account's bundle still reads its members, so the isolation above is
  about separation rather than about nothing having been written.

This is the barrier that makes captured competitor material client-private.

## Verification

Inside the deployed runtime, register two accounts, capture a page through the
first account's store, then assert: the first store's bundle listing contains the
captured name and the second's does not; the second store's handle on that name
reads the capture record as absent and lists no members; and the first store's
handle on that name still reads its capture record.
