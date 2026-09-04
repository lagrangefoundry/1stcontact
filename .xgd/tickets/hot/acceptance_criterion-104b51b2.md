---
uid: acceptance_criterion-104b51b2
id: AC-1536
type: acceptance_criterion
title: A file the client hands the platform is kept as a described record, and the
  same request says what was created
created_by: xgd
created_at: '2026-09-04T03:53:25.009460+00:00'
updated_at: '2026-09-04T04:08:23.771474+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

Handing the platform a file creates one piece of material for it: a record carrying a title, a body
that describes what the file contains, the name the file arrived under, what kind of thing it is,
its provenance and its rights — with the bytes themselves stored and readable back through that
record.

The same request is answered with an account of what was created, sufficient for the surface that
sent the file to show the result without asking a second question: the record's identifier and
title, its kind, its rights and the two permissions that follow from them, its provenance, the
state of its description, and the stored file's size and declared type.

Nothing about the file is required from the caller beyond the bytes, the name and what the bytes
are declared to be. A file with no declared type is still accepted.

## Verification

Send a small document through the upload entry point. Assert the answer names a created record and
carries the fields above. Then read the material back through the ordinary material-reading surface
and assert the record exists with the same title, filename, kind, provenance and rights, that its
body is non-empty prose about the file's contents rather than a copy of the filename, and that the
stored bytes fetched back through that record are byte-identical to what was sent. Repeat with the
declared type omitted and assert the file is still stored.