---
uid: acceptance_criterion-350a43ed
id: AC-1738
type: acceptance_criterion
title: The name a file arrived under is carried on the material's own record, so listing
  a client's material costs no lookup per row
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:50:18.131750+00:00'
updated_at: '2026-09-11T06:00:05.604321+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

The name a file arrived under is carried on the material's own record, not only on the record of its
bytes.

- The vocabulary a material and a reference are validated against names the filename, and it is
  optional on both — a record created without one is accepted, the same rule as the other later
  fields.
- Material created from a file carries the name that file arrived under, and reads it back unchanged.
- Asking the account for its material returns the filename on every row, in the one answer that
  lists them: no second request per row is needed to learn what a file was called. Where a record
  carries no filename of its own, the listing still shows a name for it rather than a blank.

## Verification

Enumerate the fields the store validates material and reference against and confirm the filename is
present on both and required on neither; create one without it and confirm acceptance. Ingest a file
under a known name, read the material back, and confirm the name is returned as supplied. Ingest
several files and confirm that a single listing of the account's material carries every one of their
names, with no further request made per row, and that a record carrying no filename of its own still
lists under a name rather than a blank.