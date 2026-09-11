---
uid: acceptance_criterion-85b5e592
id: AC-1739
type: acceptance_criterion
title: One attachment record owns exactly one stored object, so removing one record's
  bytes cannot break a sibling record holding the same content
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:04:25.035350+00:00'
updated_at: '2026-09-11T06:04:25.035350+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

Every attachment record owns exactly one stored object, whatever other records hold the same content,
so no record's bytes are a shared object another record's lifecycle can move out from under it.

- Attaching byte-for-byte identical content to two different tickets within one account produces two
  stored objects, each held at the location derived from its own record — not one object named twice.
- Removing the stored object one of those records names leaves the other record's object present and
  byte-for-byte unchanged, and still reachable at its own location. Removing a record's bytes is
  therefore a removal, not a removal for one holder and a break for the other.
- The two records carry the same integrity digest throughout, before and after the removal: the digest
  describes the content and says nothing about how many copies of it are stored or which survive.

## Verification

Inside the deployment's runtime against a real object store: under one account, attach the same byte
sequence to two separate tickets and assert two distinct absolute locations, each holding an object,
with one shared integrity digest across the two records. Remove the object one record names, then
confirm the other record's object is still present and returns exactly the bytes attached, and that
both records still carry the same digest.
