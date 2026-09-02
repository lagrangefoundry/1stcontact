---
uid: acceptance_criterion-6e6e1be0
id: AC-1495
type: acceptance_criterion
title: Captured and fetched material must name the address it came from; uploaded
  material is not asked for one
created_by: xgd
created_at: '2026-09-02T00:30:44.955085+00:00'
updated_at: '2026-09-02T00:42:25.675524+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

The address a piece of material was taken from is required exactly where such an address exists:

- Material whose origin is **captured** or **fetched** came from somewhere. Creating one without
  naming the address fails with a validation error and no record is stored.
- Material whose origin is an **upload** has no such address. Creating one without naming an address
  is accepted, and the stored record carries no address rather than an empty or placeholder one.
- Material naming both a captured or fetched origin and an address is accepted and returns the
  address unchanged.

## Verification

Through an account-scoped store, attempt to create a material for each of the two origins that came
from somewhere, omitting the address, and confirm each fails as a validation error. Then create one
whose origin is an upload with no address supplied, read it back, and confirm it is accepted and that
no address is present on the record.