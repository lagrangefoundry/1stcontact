---
uid: acceptance_criterion-84cb722b
id: AC-2173
type: acceptance_criterion
title: The invite writes no membership and no grant; an invited person holding no
  business is refused as no_membership at the door
created_by: xgd
created_at: '2026-11-01T18:27:45.291361+00:00'
updated_at: '2026-11-01T18:27:45.291361+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite makes no business-running relationship and grants nothing a business
provides: it writes no membership row and no entitlement row. A person invited
into the 1st Contact business and given no business therefore holds no live
membership and is refused admission, with the missing membership recorded as the
reason. Provisioning a business for them afterwards admits them, without a second
person being created.

## Verification

Count membership and entitlement rows, invite a new address into the 1st Contact
business, and assert both counts are unchanged. Attempt admission for that address
and assert it is refused with the membership as the recorded reason. Provision a
business for the person, attempt admission again and assert it succeeds listing
that business; assert exactly one person holds the address.
