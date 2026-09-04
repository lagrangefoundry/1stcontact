---
uid: acceptance_criterion-19b5c145
id: AC-1549
type: acceptance_criterion
title: A document with no extractable text is kept and honestly described rather than
  refused
created_by: xgd
created_at: '2026-09-04T04:12:30.058878+00:00'
updated_at: '2026-09-04T04:12:30.058878+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

A document that is read successfully but yields no text — a scanned book, an empty file — is kept
whole and described honestly rather than refused.

The resulting record states:

- an outcome distinguishing "there was nothing to extract" from every other degraded outcome,
- a description saying in words that no text could be extracted, and naming the document's own
  extent where the document reports one (its page count),
- a title and a description that both still carry the file's own name, so the entry is identifiable
  in a list rather than anonymous,
- no producer, because nothing wrote a real description.

The bytes remain fully retrievable; nothing about the file is discarded because it could not be
read.

## Verification

Ingest a document containing pages but no extractable text, and separately an empty text file.
Assert in each case that the request succeeds, a material record exists, its outcome is the
no-extractable-text value, its description says so in ordinary words (and names the page count for
the paged case), its title is the filename, and the stored bytes read back byte-for-byte.
