---
uid: acceptance_criterion-1668eba8
id: AC-1496
type: acceptance_criterion
title: A brief names the site it belongs to and carries a document; one that names
  no site or says nothing is refused
created_by: xgd
created_at: '2026-09-02T00:30:53.220046+00:00'
updated_at: '2026-09-02T00:30:53.220046+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

A **brief** is the record of what was decided for one site, and both halves of that are required:

- It names the site it belongs to. An account may own several sites, so "one per site" is not "one
  per account" and the site cannot be inferred from the account. A brief created without naming a
  site fails with a validation error and no record is stored.
- It carries the decisions themselves as its document body, which must be present and must not be
  blank. A body consisting only of whitespace is refused as a validation error — an empty brief is
  indistinguishable from an absent one to everything that reads it, and unlike a material there is no
  later extraction that fills it in.

A brief naming a site and carrying a non-empty document is accepted, and reads back with the site it
named and the document it carried.

## Verification

Through an account-scoped store, attempt to create a brief with a document but no site named, and
confirm it fails as a validation error. Attempt one naming a site with a whitespace-only document and
confirm it too fails as a validation error. Then create one naming a site and carrying real text, read
it back, and confirm both the site name and the document are returned as supplied.
