---
uid: acceptance_criterion-9d336072
id: AC-1690
type: acceptance_criterion
title: A document with nothing extractable — a scan, or an empty file — is stored
  and honestly described, never refused
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:22:48.775166+00:00'
updated_at: '2026-09-11T04:35:58.680255+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A document from which no text can be extracted — a scanned page image, or an empty file — is
**stored and honestly described, never refused.**

- The material is created; nothing about the outcome turns the client's upload into a failure.
- The body states in words that the document yielded no extractable text, and for a scanned
  document also says how many pages it has.
- The material remains identifiable: the filename appears in the title and in the body, so the
  entry is never an anonymous row.
- The recorded outcome is the nothing-extractable outcome, distinct from every other degraded
  outcome, so a later pass can select exactly this set.

## Verification

Hand the description step a portable document whose pages carry no text layer, and separately a
file of zero length: in each case assert a material is produced (no error, no refusal), the
outcome is the nothing-extractable one, the body says so in words, the page count is present for
the scanned case, and the filename appears in both title and body.