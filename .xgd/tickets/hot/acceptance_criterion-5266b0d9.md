---
uid: acceptance_criterion-5266b0d9
id: AC-1694
type: acceptance_criterion
title: Content nothing here can read is stored and marked unreadable, with the offending
  type named in the description
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:13.975492+00:00'
updated_at: '2026-09-14T06:56:59.770401+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

Content the platform has no way of reading is **stored and marked unreadable**, never rejected
and never silently blank.

This branch is reached only **after the content type has been settled**, so what lands here is
content that is genuinely unreadable once the type is known — not content whose sender merely
failed to name it. A textual file for which the sender declared no type at all, which a
browser does for Markdown, is read as text and never reaches this branch.

What does reach it: a document type nothing here can parse (a spreadsheet, an archive), an
image in a format that cannot be looked at, a file whose extension names nothing the platform
has a reader for, and any other material kind for which no describer exists.

- The material is created and remains visible and listable.
- The body names the content type that could not be read — the settled one, which is the type
  the client is shown against the file — and says the material can be found by name but not by
  its contents.
- The recorded outcome is the unreadable-type outcome, distinct from the nothing-extractable
  outcome (which means reading succeeded and produced nothing) and from a describer failure.
- The recorded describer is empty.

## Verification

Hand the step a spreadsheet-typed file and, separately, an image in a format the configured
describer does not accept. In each case assert a material is produced, the outcome is the
unreadable-type one, the body contains the offending content type, and the describer is empty.
Assert the outcome differs from that of a scanned document. Then ingest a Markdown file with no
declared type at all and assert it does *not* reach this branch: the outcome is the described
one and the body carries the file's own words.
