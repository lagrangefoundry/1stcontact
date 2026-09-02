---
uid: acceptance_criterion-77604abe
id: AC-1498
type: acceptance_criterion
title: Material may name the site it was gathered for, or belong to the account at
  large
created_by: xgd
created_at: '2026-09-02T00:31:08.492703+00:00'
updated_at: '2026-09-02T00:42:25.240353+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

A material or a reference may name the site it belongs to, and may equally name none:

- Created with a site named, it is accepted and reads back naming that site.
- Created with no site named, it is accepted and reads back naming none — meaning it belongs to the
  account at large rather than to any one site.

An account may own several sites, so material gathered for one is not automatically material for
another; naming the site is what lets a reader tell the difference, and its absence is a positive
statement that the material is not tied to a particular site rather than a missing value.

## Verification

Through an account-scoped store, create a material naming a site and read it back, confirming the
site is returned as supplied. Create a second naming no site, read it back, and confirm it is
accepted and no site is present on the record. Confirm the same holds for a reference.