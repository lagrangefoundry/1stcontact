---
uid: acceptance_criterion-5266b0d9
id: AC-1694
type: acceptance_criterion
title: Content nothing here can read is stored and marked unreadable, with the offending
  type named in the description
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:13.975492+00:00'
updated_at: '2026-09-11T04:35:58.133744+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

Content the platform has no way of reading is **stored and marked unreadable**, never rejected
and never silently blank.

This covers a document type nothing here can parse (a spreadsheet, an archive), an image in a
format that cannot be looked at, and any other material kind for which no describer exists.

- The material is created and remains visible and listable.
- The body names the content type that could not be read and says the material can be found by
  name but not by its contents.
- The recorded outcome is the unreadable-type outcome, distinct from the nothing-extractable
  outcome (which means reading succeeded and produced nothing) and from a describer failure.
- The recorded describer is empty.

## Verification

Hand the step a spreadsheet-typed file and, separately, an image in a format the configured
describer does not accept. In each case assert a material is produced, the outcome is the
unreadable-type one, the body contains the offending content type, and the describer is empty.
Assert the outcome differs from that of a scanned document.