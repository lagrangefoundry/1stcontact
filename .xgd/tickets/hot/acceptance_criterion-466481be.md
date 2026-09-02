---
uid: acceptance_criterion-466481be
id: AC-1493
type: acceptance_criterion
title: An ownership or file-sort value outside the permitted set is refused and no
  record is stored
created_by: xgd
created_at: '2026-09-02T00:30:26.828939+00:00'
updated_at: '2026-09-02T00:30:26.828939+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

The ownership answer and the file-sort answer are closed sets, not free text. An attempt to create a
material or a reference naming a value outside either set fails with a validation error identifying
the problem as one of validation, and no record comes into existence as a result.

This holds for:

- an ownership value that is not one of the three permitted ones (for example "borrowed")
- a file-sort value that is not one of the four permitted ones (for example "video")
- an empty value for either, which is not a permitted member and is refused like any other
  non-member rather than treated as unstated

The refusal applies equally to both kinds carrying the statement.

## Verification

Through an account-scoped store, attempt to create records supplying an out-of-set ownership value,
an out-of-set file-sort value, and an empty ownership value, on both kinds that carry the statement.
Confirm each attempt fails as a validation error, and that a subsequent listing of the account's
records does not contain any of them.
