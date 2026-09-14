---
uid: acceptance_criterion-30d16cc3
id: AC-1810
type: acceptance_criterion
title: A stated content type is never second-guessed, and an extension the platform
  has no reader for still degrades honestly
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:57:25.680693+00:00'
updated_at: '2026-09-14T06:57:25.680693+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

The repair applies to silence only, and it widens what can be read without changing what
happens to what cannot.

- **A stated type is never second-guessed.** A content type the sender actually declared is
  carried through untouched and is what the material and the record of its bytes hold — even
  where the filename's extension would have mapped to a different one. The sender observed the
  bytes and the platform did not, so overriding a stated type would make a mislabelled file
  unreadable in a new way in order to fix an old one.
- **An extension the platform has no reader for still degrades honestly.** A file whose type
  says nothing and whose extension names nothing the platform can act on keeps the generic
  binary type: it is still stored, still listed, still filed as a document, and still described
  with the honest account naming the type that could not be read. The existing trade — keep the
  client's file, be honest about what is known of it — is preserved, not widened.

## Verification

Ingest bytes carrying a stated content type that contradicts the filename's extension, and
assert the stated type is what both the material and the record of its stored bytes hold.
Ingest bytes with an absent type and an extension the platform has no reader for, and assert a
material is created, is filed as a document, records the generic binary type, and carries the
unreadable-content description rather than a refusal or a failure.
